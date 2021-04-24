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

players = {'1':{'ready':false,'o':1}, '2':{'ready':false,'o':2}, '3':{'ready':false,'o':3}, '4':{'ready':false,'o':4}, '5':{'ready':false,'o':5}};

let peopleIn = 0;
let toStart = 0;

const prompts = ["Oranges", "Money", "Twitch Streaming", "Parents", "School", "Pooping Your Pants"];
let prompt = choice(prompts);

const MAX_TIME = 120;
timeLeft = MAX_TIME;

setInterval(function(){ 
    if(timeLeft > 0){
        timeLeft--;
        if(timeLeft <= 0){
            console.log("emitting stop round")
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
    io.emit('players changed', {'peopleIn':peopleIn, 'playerNumber':false});
    const names = ['jim', 'jorts','jetty','Cato'];
    let playerNumber = peopleIn;
    let name = names[Math.floor(Math.random() * names.length)]
    socket.emit('assign player', {'playerNumber':playerNumber, 'time':timeLeft, 'prompt':prompt, 'roundOver':!inRound});

    console.log('user connected');
    console.log(peopleIn);

    socket.on('disconnect', () => {
        peopleIn--;
        console.log('user disconnected');
        console.log(peopleIn);
        io.emit('players changed', {'peopleIn':peopleIn, 'playerNumber':playerNumber});
        
    });

    socket.on('chat message', (msgArr) => {
        console.log('message: ' + msgArr[0]);
        io.emit('chat message', msgArr);
    });

    socket.on('player ready', (playerNumber) => {        
        players[playerNumber]['ready'] = true;
        console.log(players)
        io.emit('player ready', getPlayersReady());
        if(allPlayersReady() && !inRound)
        {
            inRound=true;
            console.log("emiting start round")
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

function getPlayersReady(){
    let amount = 0;
    for (i = 1; i < peopleIn; i++) 
    {
        if(players[String(i)]['ready'])
        {
            amount++
        }
    }

    return amount;
}