var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');

var socketIo = require('socket.io');


var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

// http server
var http_server = http.createServer(app);
http_server.listen(8087, '0.0.0.0');


// https server
var options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};
var https_server = https.createServer(options, app);

var io = socketIo.listen(https_server);
io.sockets.on('connection', (socket) => {
  socket.on('message', (room, data) => {
    io.in(room).emit('message', room, data);  // socket.to(room).emit('message', room, data);

    console.log('[message] room:', room, 'data:', data);
  });

  socket.on('join', (room) => {
    socket.join(room);
    var myRoom = io.sockets.adapter.rooms[room];
    var users = Object.keys(myRoom.sockets).length;

    if (users <= 2) {
      socket.emit('joined', room, socket.id);  // 发消息给房间里除自己之外的所有人

      console.log('[joined] room:', room, 'user_id:', socket.id);

      if (users > 1) {
        socket.to(room).emit('otherjoin', room, socket.id);

        console.log('[otherjoin] room:', room, 'user_id:', socket.id);
      }
    } else {
      socket.leave(room);
      socket.emit('full', room, socket.id);
      console.log('[otherjoin] room:', room, 'user_id:', socket.id);
    }
  });

  socket.on('leave', (room) => {

    console.log(room);
    var myRoom = io.sockets.adapter.rooms[room];
    socket.to(room).emit('bye', room, socket.id);
    socket.emit('leaved', room, socket.id);

    console.log('[otherjoin] room:', room, 'user_id:', socket.id);
  });
});
https_server.listen(443, '0.0.0.0');