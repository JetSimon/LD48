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

players = {'1':{'ready':false,'inGame':false}, '2':{'ready':false,'inGame':false}, '3':{'ready':false,'inGame':false}, '4':{'ready':false,'inGame':false}, '5':{'ready':false,'inGame':false}};

let peopleIn = 0;
let toStart = 0;

const prompts = ["Oranges", "Money", "Twitch Streaming", "Parents", "School", "Pooping Your Pants"];
let prompt = choice(prompts);

const MAX_TIME = 120;
timeLeft = MAX_TIME;

setInterval(function(){ 
    if(timeLeft > 0){
        timeLeft--;
        io.emit('time', timeLeft);
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
    const names = ['jim', 'jorts','jetty','Cato'];
    let playerNumber = assignNumber();
    players[String(playerNumber)]['inGame'] = true;
    let name = names[Math.floor(Math.random() * names.length)]
    io.emit('players changed', {'peopleIn':peopleIn, 'playerNumber':false, 'inGame':getInGame()});
    socket.emit('assign player', {'playerNumber':playerNumber, 'time':timeLeft, 'prompt':prompt, 'roundOver':!inRound});


    console.log('user connected');
    console.log(peopleIn);

    socket.on('disconnect', () => {
        peopleIn--;
        players[String(playerNumber)]['ready'] = false; 
        players[String(playerNumber)]['inGame'] = false; 
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

    for (i = 1; i <=5; i++) 
    {
        players[String(i)]['ready'] = false
    }


    console.log("NEW ROUND")
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

    let ready = 0

    for (i = 1; i <=5; i++) 
    {
        if(players[String(i)]['ready'] != false)
        {
            ready++;
        }
    }

    return ready == peopleIn
}

function getPlayersReady(){
    let amount = 0;
    for (i = 1; i <= peopleIn; i++) 
    {
        if(players[String(i)]['ready'])
        {
            amount++
        }
    }

    return amount;
}

function assignNumber()
{
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'] == false)
        {
            return i;
        }
    }
}

function getInGame()
{
    out = []
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'])
        {
            out.push(String(i))
        }
    }
    return out;
}
