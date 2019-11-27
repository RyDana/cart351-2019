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

//create an array of sockets (clients) & players
let SOCKET_LIST = {};
let PLAYER_LIST={};

//player object
let Player = function(id){
  let self={
    x:250,
    y:250,
    id:id,
    number:""+Math.floor(Math.random()*10),
    pressingRight: false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    maxSpeed:10
  }

  self.updatePosition = function(){
    if(self.pressingRight)
      self.x += self.maxSpeed;
    if(self.pressingLeft)
      self.x -= self.maxSpeed;
    if(self.pressingUp)
      self.y -= self.maxSpeed;
    if(self.pressingDown)
      self.y += self.maxSpeed;
  }
  return self;
}

//load socket.io into the server
let io = require('socket.io')(serv,{});

//if a client connects
io.sockets.on('connection', function(socket){
  console.log('socket connection');

  //give a random id to client
  socket.id = Math.random();
  //put socket into socket array
  SOCKET_LIST[socket.id]=socket;

  //create player
  let player = Player(socket.id);
  PLAYER_LIST[socket.id]=player;

  //listen when socket disconnects (doesn't need code in html)
  //delete the client from socket array
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  });

  socket.on('keyPress', function(data){
    if(data.inputId==='left'){
      player.pressingLeft = data.state;
    } else if(data.inputId==='right'){
      player.pressingRight = data.state;
    } else if(data.inputId==='up'){
      player.pressingUp = data.state;
    } else if(data.inputId==='down'){
      player.pressingDown = data.state;
    }
  });

});

//update and send parameters of all connected sockets to client (loop)
setInterval(function(){
  let pack = []; //array of parameters of each client

  //update parameters of each player and push to pack
  for(let i in PLAYER_LIST){
    let player = PLAYER_LIST[i];
    player.updatePosition();
    pack.push({
      x: player.x,
      y: player.y,
      number: player.number
    });
  }

  //send the pack to client THROUGH THE SOCKET
  for(let i in SOCKET_LIST){
    let socket = SOCKET_LIST[i];
    socket.emit('newPosition',pack);
  }
}, 1000/25);//25fps
