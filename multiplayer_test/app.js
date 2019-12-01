//Using Express to extract files
let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', function(req,res){//when filename not specified, extract index.html
  res.sendFile(__dirname+'/client/index.html');
});
app.use('/client', express.static(__dirname+'/client'));//else extract file

serv.listen(2000);//using port 2000
console.log('server started');
//************************************************************//
//whenever a new player is created, put em here
let initPack = {player:[],bullet:[]};

//whenever a player is to be removed, put em here
let removePack = {player:[],bullet:[]};

////////////ENTITY CLASS////////////
let Entity = function(){
    let self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }

    self.update = function(){
        self.updatePosition();
    }

    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    //distance between self and another object (pythagor)
    self.getDistance = function(pt){
      return Math.sqrt(Math.pow(self.x-pt.x,2)+Math.pow(self.y-pt.y,2));
    }
    return self;
}

////////PLAYER CLASS////////
let Player = function(id){
  let self = Entity();
  self.id = id;
  self.number = "" + Math.floor(10 * Math.random());
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 10;

  //rewrite update of player to include updateSpd an shooting
  let super_update = self.update;
  self.update = function(){
      self.updateSpd();
      super_update();

      //shooting
      if(self.pressingAttack){
        self.shootBullet(self.mouseAngle);
      }
  }

  //spawn bullet
  self.shootBullet = function(angle){
    let b = Bullet(self.id, angle);
    b.x = self.x;
    b.y = self.y;
  }

  //update speed, uses entity parameters
  self.updateSpd = function(){
      if(self.pressingRight)
          self.spdX = self.maxSpd;
      else if(self.pressingLeft)
          self.spdX = -self.maxSpd;
      else
          self.spdX = 0;

      if(self.pressingUp)
          self.spdY = -self.maxSpd;
      else if(self.pressingDown)
          self.spdY = self.maxSpd;
      else
          self.spdY = 0;
  }

  //create package to be sent for player init
  self.getInitPack = function(){
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      number: self.number
    }
  }
  //create package to be sent for player update
  self.getUpdatePack = function(){
    return {
      id: self.id,
      x: self.x,
      y: self.y
    }
  }
  //add the player to a list of players
  Player.list[id] = self;
  //add it to the list of NEW players
  initPack.player.push(self.getInitPack());
  return self;
}

///list of players///
Player.list = {};

////player functions////
Player.onConnect = function(socket){
    let player = Player(socket.id);

    //sets event listener into object
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down'){
            player.pressingDown = data.state;
        } else if(data.inputId === 'attack'){
          player.pressingAttack = data.state;
        }  else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    ///send to player the state of the game///

    //get init pack of every player (contains position/id/number)
    let playersState = [];
    for(let i in Player.list){
      playersState.push(Player.list[i].getInitPack());
    }
    //and of every bullet
    let bulletsState = [];
    for(let i in Bullet.list){
      bulletsState.push(Bullet.list[i].getInitPack());
    }

    socket.emit('init',{
      player:playersState,
      bullet:bulletsState
    });
}

//remove player from list and add to removepack
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    //send to remove pack
    removePack.player.push(socket.id);
}

Player.sendPack = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}

//////END OF PLAYER CLASS////////

/////BULLET CLASS////////////
var Bullet = function(parent, angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;

    //rewrite update
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        //mark as to remove when touches another player
        for(var i in Player.list){
          var p = Player.list[i];
          if(self.getDistance(p) < 32 && self.parent !== p.id){
            self.toRemove = true;
          }
        }
    }

    //create package to be sent for player init
    self.getInitPack = function(){
      return {
        id: self.id,
        x: self.x,
        y: self.y
      }
    }
    //create package to be sent for player update
    self.getUpdatePack = function(){
      return {
        id: self.id,
        x: self.x,
        y: self.y
      }
    }

    //add to list of bullets
    Bullet.list[self.id] = self;
    //add to list of NEW bullets
    initPack.bullet.push(self.getInitPack());
    return self;
}

Bullet.list = {};

//cleates a pack to emit to client
//handles bullet removal too
Bullet.sendPack = function(){
    //make bullets appear randomly
    // if(Math.random() < 0.1){
    //     Bullet(Math.random()*360);
    // }

    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();// update position
        if(bullet.toRemove){ //if marked to remove
          delete Bullet.list[i]; //delete from list
          //send to remove pack
          removePack.bullet.push(bullet.id);
        } else {
          pack.push(bullet.getUpdatePack());
        }
    }
    return pack;
}
///////END OF BULLET CLASS//////


//for eval() debugging
var DEBUG = true;
//create an array of sockets (clients) & players
let SOCKET_LIST = {};

//array of users (example)
var USERS = {
    //username:password
    "bob":"asd",
    "bob2":"bob",
    "bob3":"ttt",
}

//functions for login/signup
//uses a callback function that takes in a T/F result
//timeout simulates database delay
var isValidPassword = function(data,cb){
    setTimeout(function(){
        cb(USERS[data.username] === data.password);
    },10);
}
var isUsernameTaken = function(data,cb){
    setTimeout(function(){
        cb(USERS[data.username]);//returns true if exists
    },10);
}
var addUser = function(data,cb){
    setTimeout(function(){
        USERS[data.username] = data.password;
        cb();//callback is empty if nothing to compare
    },10);
}

//////SOCKET MANIPULATION///////
//load socket.io into the server
let io = require('socket.io')(serv,{});

//if a client connects
io.sockets.on('connection', function(socket){
  console.log('socket connection');

  //give a random id to client
  socket.id = Math.random();
  //put socket into socket array
  SOCKET_LIST[socket.id]=socket;

  //sign in listener
  socket.on('signIn',function(data){
      //if password is valid, create player and notify client
       isValidPassword(data,function(res){
           if(res){
               Player.onConnect(socket);
               socket.emit('signInResponse',{success:true});
           } else {
               socket.emit('signInResponse',{success:false});
           }
       });
   });

   //sign up listener
   socket.on('signUp',function(data){
     //if username is taken, notify client
       isUsernameTaken(data,function(res){
           if(res){
               socket.emit('signUpResponse',{success:false});
           } else {
             //if not, add user to array and notify client
               addUser(data,function(){
                   socket.emit('signUpResponse',{success:true});
               });
           }
       });
   });


  //listen when socket disconnects
  socket.on('disconnect', function(){
      //delete the client from socket array
    delete SOCKET_LIST[socket.id];
    //delete player from player.list
    Player.onDisconnect(socket);
  });

  //when eval message received from chatbox, send answer
  socket.on('evalServer',function(data){
    if(!DEBUG) //if debugging is not allowed
        return;
    var res = eval(data);
    socket.emit('evalAnswer',res);
  });

});

//update and send parameters of all connected sockets to client (loop)
setInterval(function(){
  //package with positions/ids of players/bullets
  let pack = {
    player:Player.sendPack(),
    bullet:Bullet.sendPack()
  }

  //send the pack to client THROUGH THE SOCKET
  for(let i in SOCKET_LIST){
    let socket = SOCKET_LIST[i];
    socket.emit('init',initPack);
    socket.emit('update',pack);
    socket.emit('remove',removePack);
  }

  //reset the packages to empty
  initPack.player = [];
  initPack.bullet = [];
  removePack.player = [];
  removePack.bullet = [];

}, 1000/25);//25fps
