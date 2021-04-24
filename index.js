const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

let peopleIn = 0;

const prompts = ["Oranges", "Money", "Twitch Streaming", "Parents", "School", "Pooping Your Pants"];
let prompt = choice(prompts);

const MAX_TIME = 120;
timeLeft = MAX_TIME;

setInterval(function(){ 
    if(timeLeft > 0){
        timeLeft--;
    }else{
        timeLeft = MAX_TIME;
        prompt = choice(prompts);
        io.emit('new prompt', {'prompt':prompt, 'maxTime':MAX_TIME});
    }
}, 1000);

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
    socket.emit('assign player', {'playerNumber':playerNumber, 'time':timeLeft, 'prompt':prompt});

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

server.listen(80, () => {
    console.log('listening on 80')
});

function choice(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}