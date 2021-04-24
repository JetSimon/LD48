const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const room = urlParams.get('room')
console.log("room: ", room)

var socket = io();

socket.on('connect', function() {
    socket.emit('room', room);
})

let players = []
for (i = 0; i < 5; i++) 
{
    let pNum = String(i+1)
    players.push(document.getElementById(pNum))
    document.getElementById(pNum).querySelector("#voteButton").addEventListener("click", function(){
        socket.emit('vote', pNum);
        document.getElementById(pNum).querySelector("#voteButton").style.visibility = "hidden";
    })
}

var form = document.getElementById('form');
var input = document.getElementById('input');
var playerUI = document.getElementById('playerInput');
var timer = document.getElementById('timer');
var readyText = document.getElementById('readyText');
var prompt = document.getElementById('prompt');
var tip = document.getElementById('tip');
var nextRoundButton = document.getElementById('nextRoundButton');
var time
var playerNumber;
var playersInGame;

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
    socket.emit('chat message', [input.value, playerNumber]);
    playerUI.style.visibility = "hidden";
    input.value = '';
    form.style.visibility = "hidden";
    }
});

nextRoundButton.addEventListener("click", function() {
    console.log('readying up', playerNumber)
    socket.emit('player ready', playerNumber);
    nextRoundButton.style.visibility = "hidden";
});

socket.on('chat message', function(msg) {
    document.getElementById(msg[1]).querySelector("#poem").innerHTML = msg[0];
});

socket.on('cannot join', function(){
    document.body.innerHTML = '<h1> ROOM FULL </h1>';
})

socket.on('assign player', function(playerData) {
    
    prompt.innerHTML = playerData['prompt'];
    time = playerData['time'];
    playerNumber = String(playerData['playerNumber']);
    document.getElementById('youAreMessage').innerHTML = `You Are Player ${playerNumber}`;
    updateVotes(playerData['players'])
    if(playerData['roundOver'])
    {
        stopRound();
    }else{
        startRound();
    }


})
socket.on('time', function(timeSent) {
    time = timeSent
    if(time > 0){
        time--;
        timer.innerHTML = time; 
    }

    if(time <= 0)
    {
        timer.innerHTML = "ROUND OVER";
    }
})

socket.on('new prompt', function(data) {
    prompt.innerHTML = data['prompt'];
    time = data['maxTime'];
})

socket.on('players changed', function(data) {
    playerAmount = data['peopleIn']
    playersInGame = playerAmount;
    updateReadyText();

    for (i = 0; i < players.length; i++) 
    {
        players[i].style.display = "none";
    }
    console.log("in game")
    console.log(data['inGame'])
    for (i = 0; i < data['inGame'].length; i++) 
    {
        let toChange = data['inGame'][i]
        players[toChange-1].style.display = "initial"
    }
})

socket.on('stop round', function() {
    stopRound();
})

socket.on('start round', function() {
    startRound();
})

socket.on('player ready', function(playersReady) {
    readyText.innerHTML = playersReady + "/" + playersInGame;
})

socket.on('update votes', function(pl) {
    updateVotes(pl);
})

function startRound()
{
    players.forEach(player => {
        player.querySelector("#poem").style.visibility = "hidden";
        player.querySelector("#poem").innerHTML = "";
        player.querySelector("#voteButton").style.visibility = "hidden";
    });

    
    document.getElementById(playerNumber).querySelector("#poem").style.visibility = "visible";
    
    form.style.visibility = "visible";
    playerUI.style.visibility = "visible";
    nextRoundButton.style.visibility = "hidden";
    readyText.style.visibility = "hidden";
    tip.style.visibility = "visible";
}

function stopRound()
{
    timer.innerHTML = "ROUND OVER";
    form.style.visibility = "hidden";
    playerUI.style.visibility = "hidden";
    
    players.forEach(player => {
        player.querySelector("#poem").style.visibility = "visible";
        player.querySelector("#voteButton").style.visibility = "visible";
    });

    document.getElementById(playerNumber).querySelector("#voteButton").style.visibility = "hidden";
    document.getElementById(playerNumber).querySelector("#poem").style.visibility = "visible";

    console.log('got stop round')
    readyText.style.visibility = "visible";
    updateReadyText();
    nextRoundButton.style.visibility = "visible";
    prompt.innerHTML = "ALL PLAYERS MUST BE READY"
    tip.style.visibility = "hidden";
}

function updateReadyText()
{
    readyText.innerHTML = "0/" + playersInGame;
}

function updateVotes(pl)
{
    console.log("player data", pl)
    for (i = 1; i <= 5; i++) 
    {
        document.getElementById(String(i)).querySelector("#score").innerHTML = pl[String(i)]['score']
    }
}