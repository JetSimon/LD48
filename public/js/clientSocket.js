
var socket = io();

let players = []
for (i = 0; i < 5; i++) 
{
    players.push(document.getElementById(String(i+1)))
}

var form = document.getElementById('form');
var input = document.getElementById('input');
var timer = document.getElementById('timer');
var readyText = document.getElementById('readyText');
var prompt = document.getElementById('prompt');
var nextRoundButton = document.getElementById('nextRoundButton');
var time
var playerNumber;
var playersInGame;

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
    socket.emit('chat message', [input.value, playerNumber]);
    input.value = '';
    }
});

nextRoundButton.addEventListener("click", function() {
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

function startRound()
{
    nextRoundButton.style.visibility = "hidden";
    readyText.style.visibility = "hidden";
}

function stopRound()
{
    readyText.style.visibility = "visible";
    updateReadyText();
    nextRoundButton.style.visibility = "visible";
    
}

function updateReadyText()
{
    readyText.innerHTML = "0/" + playersInGame;
}