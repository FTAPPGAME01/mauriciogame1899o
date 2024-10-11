const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
    currentPlayer: 'Ruperto',
    score: {'Ruperto': 100000, 'Juan': 100000, 'Mauricio': 100000},
    diamondStates: [
        {available: true, emoji: '💎'},
        {available: true, emoji: '💎'},
        {available: true, emoji: '☀️'},
        {available: true, emoji: '☀️'}
    ],
    goldBarStates: [
        {available: true, emoji: '💰'},
        {available: true, emoji: '💰'},
        {available: true, emoji: '🥇'},
        {available: true, emoji: '🥇'}
    ],
    rubyStates: [
        {available: true, emoji: '🔴'},
        {available: true, emoji: '🔴'},
        {available: true, emoji: '🍀'},
        {available: true, emoji: '🍀'}
    ],
    trophyStates: [
        {available: true, emoji: '💚'},
        {available: true, emoji: '💚'},
        {available: true, emoji: '🏆'},
        {available: true, emoji: '🏆'}
    ],
    takenRowsByPlayer: {Ruperto: [], Juan: [], Mauricio: []},
    takenCount: 0,
    timeLeft: 10,
};

app.use(express.static('public'));

function resetGameTable() {
    gameState.currentPlayer = 'Ruperto';
    gameState.takenCount = 0;
    gameState.timeLeft = 10;

    // Reset all states
    [gameState.diamondStates, gameState.goldBarStates, gameState.rubyStates, gameState.trophyStates].forEach(row => {
        row.forEach(item => {
            item.available = true;
        });
    });

    // Reset taken rows for all players
    Object.keys(gameState.takenRowsByPlayer).forEach(player => {
        gameState.takenRowsByPlayer[player] = [];
    });

    // Emit the reset game state to all clients
    io.emit('gameReset', gameState);
}

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('initialState', gameState);

    socket.on('updateState', (updatedState) => {
        gameState = updatedState;

        // Check if all 16 tokens have been taken
        if (gameState.takenCount >= 16) {
            resetGameTable();
        } else {
            io.emit('stateChanged', gameState);
        }
    });

    socket.on('registerPlayer', (username) => {
        if (!gameState.score.hasOwnProperty(username)) {
            gameState.score[username] = 100000; // Initialize new player's score
        }
        if (!gameState.takenRowsByPlayer.hasOwnProperty(username)) {
            gameState.takenRowsByPlayer[username] = []; // Initialize taken rows for new player
        }
        io.emit('updatePlayersList', Object.keys(gameState.score));
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});