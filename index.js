const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))

app.get('/play', (req, res) => {
    res.sendFile('game.html', { root: 'public' });
});

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

const port = process.env.PORT || 80

//Rooms need: time, players, prompt
rooms = {}

const prompts = ["Oranges", "Money", "Twitch Streaming", "Parents", "School", "Pooping Your Pants", "Zoom Meetings", "Pleasure", "Gamers", "Christmas at Your S/O's Parents", "Moving", "Binge Watching Television", "Drugs", "Yelling Indoors", "Prostate Examinations", "Airplane Food", "Season 33 of The Simpsons", "Cringe Compilations", "Creepy Uncles", "Ludum Dare", "Stoners", "Cheap Beer", "Younger Siblings", "Bad Dates", "Short Kings", "The Buddy System", "Seinfeld", "TikTok", "WWII", "Why Babies Cry", "Why the Earth is Flat", "What the Earth Really Revolves Around", "Why Bad Things Happen to Good People", "Nickleback", "Who's Dad would win in a Fight?", "How to be a great Discord Admin"];

const MAX_TIME = 120;
const MAX_ROUNDS = 5;

setInterval(function(){ 
    for (const id in rooms) {
        
        if(rooms[id]['time'] > 0 && rooms[id]['inRound']){
            rooms[id]['time']--;
            io.sockets.in(id).emit('time', rooms[id]['time']);
            if(rooms[id]['time'] <= 0 || rooms[id]['messagesSentIn'] >= getInGame(rooms[id]['players']).length ){
                console.log("emitting stop round")
                io.sockets.in(id).emit('stop round', rooms[id]['time']);
                rooms[id]['inRound'] = false;
            }
        
        }
    }

}, 1000);

io.on('connection', (socket) => {
    let room;
    let roomID;
    let playerNumber;
    let playerNames = {"1":"test"}
    socket.on('room', (id) => {
        //If room does not exist then create the room before adding player
        if(!(id in rooms))
        {
            addNewRoom(id);
        }

        roomID = id;
        room = rooms[id]

        peopleIn = room['peopleIn']

        if (peopleIn + 1 > 5 || roomID == null){
            socket.emit('cannot join');
            console.log('too many people')
            socket.disconnect();
            return;
        }

        socket.join(id);

        room['peopleIn']++;
        playerNumber = assignNumber(room['players']);
        room['players'][String(playerNumber)]['inGame'] = true;

        io.sockets.in(roomID).emit('players changed', {'peopleIn':room['peopleIn'], 'playerNumber':false, 'inGame':getInGame(room['players'])});

        socket.emit('assign player', {'playerNumber':playerNumber, 'time':rooms[id]['time'], 'prompt':rooms[id]['prompt'], 'roundOver':!rooms[id]['inRound'],'players':room['players'],'round':room['round']});

        
    })


    socket.on('disconnect', () => {
        if (roomID == null){return}
        players = room['players'];
        socket.leave(room);
        room['peopleIn']--;
        players[String(playerNumber)]['ready'] = false; 
        players[String(playerNumber)]['inGame'] = false; 
        console.log('user disconnected');

        io.sockets.in(roomID).emit('players changed', {'peopleIn':peopleIn, 'playerNumber':false, 'inGame':getInGame(players), 'players':room['players']});
        
        if(getInGame(room['players']) <= 0)
        {
            console.log('destroying room ', roomID);
            delete rooms[roomID];
        }
    });

    socket.on('chat message', (msgArr) => {
        rooms[roomID]['messagesSentIn']++;
        io.sockets.in(roomID).emit('chat message', msgArr);
    });

    socket.on('vote', (playerNum) => {
        rooms[roomID]['players'][playerNum]['score']++;
        io.sockets.in(roomID).emit('update votes', rooms[roomID]['players']);
    });

    socket.on('player ready', (playerNumber) => {     
        room['players'][playerNumber]['ready'] = true;
        io.sockets.in(roomID).emit("player ready", getPlayersReady(room['players']));
        console.log('player ' + playerNumber + ' is ready ', getPlayersReady(room['players']), ' are ready')
        if(allPlayersReady(room['players']) && !rooms[roomID]['inRound'])
        {
            newRound(roomID);
            if(!(roomID in rooms))
            {
                return
            }
            rooms[roomID]['inRound']=true;
            console.log("emiting start round")
            io.sockets.in(roomID).emit('start round');
        }
    });
});

server.listen(port, () => {
    console.log('listening on ' + port)
});

function newRound(id){
    rooms[id]['round']++;
    io.sockets.in(id).emit('round++');
    if(rooms[id]['round'] > MAX_ROUNDS)
    {
        io.sockets.in(id).emit('game over', findWinner(rooms[id]['players']));
        delete rooms[id];
        return;
    }

    rooms[id]['messagesSentIn']=0;
    players = rooms[id]['players']

    for (i = 1; i <=5; i++) 
    {
        players[String(i)]['ready'] = false
    }

    console.log("NEW ROUND")
    rooms[id]['inRound']=false;
    rooms[id]['time'] = MAX_TIME;
    rooms[id]['prompt'] = choice(prompts);
    io.sockets.in(id).emit('new prompt', {'prompt':rooms[id]['prompt'], 'maxTime':rooms[id]['time']});
}

function choice(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function allPlayersReady(players){

    let ready = 0
    let playersInGame = 0

    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'])
        {
            playersInGame++
        }
    }

    for (i = 1; i <=5; i++) 
    {
        if(players[String(i)]['ready'] != false)
        {
            ready++;
        }
    }

    return ready == playersInGame
}

function getPlayersReady(players){
    let amount = 0;
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'] && players[String(i)]['ready'])
        {
            amount++
        }
    }

    return amount;
}

function assignNumber(players)
{
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'] == false)
        {
            return i;
        }
    }
}

function getInGame(players)
{
    out = []
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'])
        {
            out.push(String(i))
        }
    }
    return (out);
}

function addNewRoom(id)
{
    rooms[id] = {
        'time':MAX_TIME, 
        'players':{'1':{'ready':false,'inGame':false, 'score':0}, '2':{'ready':false,'inGame':false, 'score':0}, '3':{'ready':false,'inGame':false, 'score':0}, '4':{'ready':false,'inGame':false, 'score':0}, '5':{'ready':false,'inGame':false, 'score':0}},
        'prompt':choice(prompts),
        'peopleIn':0,
        'inRound':false,
        'messagesSentIn':0,
        'round':0
    }
}

function findWinner(players)
{
    console.log("game over")
    let biggestScore = 0;
    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'])
        {
            biggestScore = players[String(i)]['score'] > biggestScore ? players[String(i)]['score'] : biggestScore;
        }
    }


    for (i = 1; i <= 5; i++) 
    {
        if(players[String(i)]['inGame'] && players[String(i)]['score'] == biggestScore)
        {
            return String(i);
        }
    }
}