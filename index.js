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

let inRound = false;

const port = process.env.PORT || 80

players = {'1':{'ready':false}, '2':{'ready':false}, '3':{'ready':false}, '4':{'ready':false}, '5':{'ready':false}};

let peopleIn = 0;
let toStart = 0;

const prompts = ["Oranges", "Money", "Twitch Streaming", "Parents", "School", "Pooping Your Pants"];
let prompt = choice(prompts);

const MAX_TIME = 10;
timeLeft = MAX_TIME;

setInterval(function(){ 
    if(timeLeft > 0){
        timeLeft--;
        if(timeLeft == 0){
            io.emit('stop round');
            inRound = false;
        }
    }else{
        if(inRound){
            newRound();
        }
    }
}, 1000);

io.on('connection', (socket) => {
    if (peopleIn + 1 > 5){
        socket.emit('cannot join');
        console.log('too many people')
        socket.disconnect();
        return;
    }

    peopleIn++;
    io.emit('players changed', peopleIn);
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
        io.emit('players changed', peopleIn);
    });

    socket.on('chat message', (msgArr) => {
        console.log('message: ' + msgArr[0]);
        io.emit('chat message', msgArr);
    });

    socket.on('player ready', (playerNumber) => {
        console.log(players)
        players[playerNumber]['ready'] = true;
        if(allPlayersReady() && !inRound)
        {
            inRound=true;
            io.emit('start round');
        }
    });
});

server.listen(port, () => {
    console.log('listening on ' + port)
});

function newRound(){
    inRound=false;
    timeLeft = MAX_TIME;
    prompt = choice(prompts);
    io.emit('new prompt', {'prompt':prompt, 'maxTime':MAX_TIME});
}

function choice(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function allPlayersReady(){
    for (i = 1; i < peopleIn; i++) 
    {
        if(players[String(i)]['ready'] == false)
        {
            return false
        }
    }

    return true
}