//Using Express to extract files
let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', function(req,res){//when filename not specified, extract index.html
  res.sendFile(__dirname+'/client/index.html');
});
app.use('/client', express.static(__dirname+'/client'));//else extract file

serv.listen(3000);//using port 3000
console.log('server started');
//************************************************************//
//whenever a new player is created, put em here
let initPack = {player:[]/*,star:[]*/};

//whenever a player is to be removed, put em here
let removePack = {player:[]};

////////////ENTITY CLASS////////////
let Entity = function(){
    let self = {
        x:0,
        y:0,
        z:0,
        id:"",
    }

    return self;
}

////////PLAYER CLASS////////
let Player = function(id,object){
  let self = Entity();
  self.id = id;
  self.object = object;


  //spawn Star
  // self.spawnStar = function(){
  //   let b = Star(self.id);
  //   b.x = self.x;
  //   b.y = self.y;
  //   b.z = self.z;
  // }



  //create package to be sent for player init
  self.getInitPack = function(){
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      z: self.z,
      object: self.object
    }
  }
  //create package to be sent for player update
  self.getUpdatePack = function(){
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      z: self.z,
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
Player.onConnect = function(socket, object){
    let player = Player(socket.id, object);

    //sets event listener into object
    socket.on('newPosition',function(data){
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
    });

    ///send to player the state of the game///

    //get init pack of every player (contains position/id/number)
    let playersState = [];
    for(let i in Player.list){
      playersState.push(Player.list[i].getInitPack());
    }
    //and of every star
    let starState = [];
    // for(let i in Star.list){
    //   starState.push(Star.list[i].getInitPack());
    // }

    socket.emit('init',{
      player:playersState,
      star:starState
    });
}

//remove player from list and add to removepack
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    //send to remove pack
    removePack.player.push(socket.id);
}

Player.sendPack = function(){
    let pack = [];
    for(let i in Player.list){
        let player = Player.list[i];
        pack.push(player.getUpdatePack());
    }
    return pack;
}

//////END OF PLAYER CLASS////////

/////BULLET CLASS////////////
// let Bullet = function(parent, angle){
//     let self = Entity();
//     self.id = Math.random();
//     self.spdX = Math.cos(angle/180*Math.PI) * 10;
//     self.spdY = Math.sin(angle/180*Math.PI) * 10;
//     self.parent = parent;
//     self.timer = 0;
//     self.toRemove = false;
//
//     //rewrite update
//     let super_update = self.update;
//     self.update = function(){
//         if(self.timer++ > 100)
//             self.toRemove = true;
//         super_update();
//
//         //mark as to remove when touches another player
//         for(let i in Player.list){
//           let p = Player.list[i];
//           if(self.getDistance(p) < 32 && self.parent !== p.id){
//             self.toRemove = true;
//           }
//         }
//     }
//
//     //create package to be sent for player init
//     self.getInitPack = function(){
//       return {
//         id: self.id,
//         x: self.x,
//         y: self.y
//       }
//     }
//     //create package to be sent for player update
//     self.getUpdatePack = function(){
//       return {
//         id: self.id,
//         x: self.x,
//         y: self.y
//       }
//     }
//
//     //add to list of bullets
//     Bullet.list[self.id] = self;
//     //add to list of NEW bullets
//     initPack.bullet.push(self.getInitPack());
//     return self;
// }
//
// Bullet.list = {};
//
// //cleates a pack to emit to client
// //handles bullet removal too
// Bullet.sendPack = function(){
//     //make bullets appear randomly
//     // if(Math.random() < 0.1){
//     //     Bullet(Math.random()*360);
//     // }
//
//     let pack = [];
//     for(let i in Bullet.list){
//         let bullet = Bullet.list[i];
//         bullet.update();// update position
//         if(bullet.toRemove){ //if marked to remove
//           delete Bullet.list[i]; //delete from list
//           //send to remove pack
//           removePack.bullet.push(bullet.id);
//         } else {
//           pack.push(bullet.getUpdatePack());
//         }
//     }
//     return pack;
// }
///////END OF BULLET CLASS//////


//for eval() debugging
let DEBUG = true;
//create an array of sockets (clients) & players
let SOCKET_LIST = {};

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
       Player.onConnect(socket, data);
       socket.emit('signInResponse',{success:true});
   });

  //listen when socket disconnects
  socket.on('disconnect', function(){
      //delete the client from socket array
    delete SOCKET_LIST[socket.id];
    //delete player from player.list
    Player.onDisconnect(socket);
  });



});

//update and send parameters of all connected sockets to client (loop)
setInterval(function(){
  //package with positions/ids of players/bullets
  let pack = {
    player:Player.sendPack()
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
  //initPack.bullet = [];
  removePack.player = [];
  //removePack.bullet = [];

}, 1000/25);//25fps
