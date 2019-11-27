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

//load socket.io into the server
let io = require('socket.io')(serv,{});

//create an array of sockets (clients)
let SOCKET_LIST = {};

//if a client connects
io.sockets.on('connection', function(socket){
  console.log('socket connection');

  //give a random id to client
  socket.id = Math.random();
  //give a position in space (creates object propreties)
  socket.x = 0;
  socket.y = 0;
  //give a random integer (canvas needs string form)
  socket.number = ""+Math.floor(Math.random()*10);
  //put socket into socket array
  SOCKET_LIST[socket.id]=socket;


  //listen to client message
  socket.on('clientMsg', function(data){
    console.log(data.reason);
  });

  //send server message to client
  socket.emit('serverMsg',{
    msg:'hi i am a server'
  });

  //listen when socket disconnects (doesn't need code in html)
  //delete the client from socket array
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
  })

});

//update and send parameters of all connected sockets to client (loop)
setInterval(function(){
  let pack = []; //array of parameters of each client

  //update parameters of each client and push to pack
  for(let i in SOCKET_LIST){
    let socket = SOCKET_LIST[i];
    socket.x++;
    socket.y++;
    pack.push({
      x: socket.x,
      y: socket.y,
      number: socket.number
    });
  }

  //send the pack to client
  for(let i in SOCKET_LIST){
    let socket = SOCKET_LIST[i];
    socket.emit('newPosition',pack);
  }
}, 1000/25);//25fps
