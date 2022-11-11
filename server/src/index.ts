import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import allCountries from './allCountries';
import { Difficulty, Game, RoomInfo } from './types';

const allGames: Game[] = [];

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: '*',
    }
});

// setInterval(() => {
//     allGames.forEach(game => {

//     });
// }, 10000);

app.get('/', (req, res) => {
    res.json(allGames);
});

io.on('connection', (socket) => {
    let currentRoom: string;
    let name: string;
    let currentFlag: string;
    let inGame: boolean = false;
    console.log('a user connected.');

    socket.on('disconnect', () => {
        if(name) {
            const foundGame = allGames.find(e => e.id === currentRoom);
            const foundUser = foundGame.players.find(e => e.name === name);
            const index = foundGame.players.indexOf(foundUser);
            if (index > -1) { // only splice array when item is found
                foundGame.players.splice(index, 1); // 2nd parameter means remove one item only
            }
        }
        console.log("Disconnected");
    });

    socket.on('createRoom', (info: RoomInfo) => {
        const foundGame = allGames.find(e => e.id === info.roomId);
        if(foundGame != null) {
            allGames[allGames.indexOf(foundGame)].players.push({ name: info.name, points: 0 });
        } else {
            allGames.push({ id: info.roomId, players: [{ name: info.name, points: 0 }], inGame: false })
        }
        const clients = io.sockets.adapter.rooms.get(info.roomId);
        console.log(clients, 'there');
        console.log("NEW ROOM:", info);
        socket.join(info.roomId);
        currentRoom = info.roomId;
        name = info.name;
        io.sockets.to(info.roomId).emit("msgToClient", { name: 'Bot', message: `${info.name} just entered the game!` });
        console.log(allGames);
    });

    socket.on("startGame", (difficulty: string) => {
        console.log('difficulty', difficulty);
        const foundGame = allGames.find(e => e.id === currentRoom);
        const availableCountries = allCountries.filter(country => country.difficulty === difficulty);
        const chosenPlayer = foundGame.players[Math.floor(Math.random()*foundGame.players.length)];
        const chosenCountry = availableCountries[Math.floor(Math.random()*availableCountries.length)];
        console.log('CHOSEN PLAYER', chosenPlayer);
        console.log('CHOSEN COUNTRY', chosenCountry);
        allGames[allGames.indexOf(foundGame)].inGame = true;
        io.sockets.to(currentRoom).emit('cleanBoard');
        io.sockets.to(currentRoom).emit("gameStarted", { chosenPlayer: chosenPlayer.name, flag: chosenCountry });
        io.sockets.to(currentRoom).emit("msgToClient", { name: 'Bot', message: `Game just started! ${chosenPlayer.name} is chosen.` });
        currentFlag = chosenCountry.name;
        allGames[allGames.indexOf(foundGame)].currentGameFlag = chosenCountry.name;
        inGame = true;
    });

    socket.on('msg', (msg) => {
        const foundGame = allGames.find(e => e.id === currentRoom);
        const room = allGames[allGames.indexOf(foundGame)];
        const currentPlayer = room.players.find(user => user.name === name);
        console.log("NEW MSG:", msg, currentRoom);
        if(room.inGame) {
            console.log('In game.');
            if(String((msg.message).toLowerCase()).includes(room.currentGameFlag.toLowerCase())) {
                io.sockets.to(currentRoom).emit("msgToClient", { name: 'Bot', message: `${name} got it right!`, points: 500, recieve: true });
                room.players[room.players.indexOf(currentPlayer)].points += 500;
            } else {
                io.sockets.to(currentRoom).emit("msgToClient", { ...msg, recieve: false });
            }
        } else {
            io.sockets.to(currentRoom).emit("msgToClient", { ...msg, recieve: false });
        }
    });

    socket.on('drawing', (data) => {
        socket.to(currentRoom).emit('drawing', data);
    });
});

server.listen(2000, () => {
    console.log('listening on *:2000');
});