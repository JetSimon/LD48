const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let peopleIn = 0;
let prompt = "Oranges";

io.on('connection', (socket) => {
    if (peopleIn + 1 > 5){
        socket.emit('cannot join');
        console.log('too many people')
        socket.disconnect();
    }

    peopleIn++;
    const names = ['jim', 'jorts','jetty','Cato'];
    const playerNumber = peopleIn;
    let name = names[Math.floor(Math.random() * names.length)]
    socket.emit('assign player', playerNumber);

    console.log('user connected');
    console.log(peopleIn);

    socket.on('disconnect', () => {
        peopleIn--;
        console.log('user disconnected');
        console.log(peopleIn);
    });

    socket.on('chat message', (msgArr) => {
        console.log('message: ' + msgArr[0]);
        io.emit('chat message', msgArr);
    });
});

server.listen(3000, () => {
    console.log('listening on 3000')
});