import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8181 });
let clicks1 = 0
let clicks2 = 0
let id = 1
let players = [0,0]
let state = 'WAITING'

wss.on('connection', function connection(ws) {
    if(wss.clients.size > 2) {
        ws.send(JSON.stringify({message: 'SESSION IS FULL'}))
        ws.close()
        console.log('connection refused, session full')
    } else {
        wss.clients.forEach(client => client.send(JSON.stringify({message:'USER JOINED'})));
        wss.clients.forEach(client => client.send(JSON.stringify({clients: wss.clients.size})));
        if(ws.id === undefined){
            ws.id = id
            console.log(ws.id)
            id += 1
            if(players[0] === 0){
                players[0] = ws.id
                ws.send(JSON.stringify({player: 1}))
            } else if (players[1] === 0){
                players[1] = ws.id
                ws.send(JSON.stringify({player: 2}))
            }
            if(wss.clients.size === 2 && clicks1 < 20 && clicks2 < 20){
                state = 'GAME_READY'
                wss.clients.forEach(client => client.send(JSON.stringify({state})));
            }
        }

        console.log('connect')
        ws.on('close', function(){
            const index = players.findIndex(player => player === ws.id)
            players[index] = 0
            state = 'WAITING'
            clicks1 = 0
            clicks2 = 0
            console.log(players)
            console.log('disconnect')
            wss.clients.forEach(client => client.send(JSON.stringify({message:'USER LEFT', state, clicks1, clicks2})));
        })

        ws.on('error', console.error);

        ws.on('message', function message(data, isBinary) {
            const receivedData = isBinary ? data : data.toString()
            if(state === 'GAME_READY') state = 'GAME_RUNNING'
            if(receivedData === 'click1' && state === 'GAME_RUNNING'){
                clicks1 += 1
            }
            if(receivedData === 'click2' && state === 'GAME_RUNNING'){
                clicks2 += 1
            }

            if(clicks1 === 100){
                state = 'PLAYER1_WON'
            }
            if(clicks2 === 100){
                state = 'PLAYER2_WON'
            }
            if(receivedData === 'RETRY'){
                if(wss.clients.size === 2){
                    console.log("yes here")
                    clicks1 = 0
                    clicks2 = 0
                    state = 'GAME_READY'
                    wss.clients.forEach(client => client.send(JSON.stringify({clicks1, clicks2, state})));
                }
            }
            const gameData = {
                state, clicks1, clicks2, clients: wss.clients.size
            }
            wss.clients.forEach(client => client.send(JSON.stringify(gameData)));
            wss.clients.forEach(client => client.send(JSON.stringify({id: client.id})));
        });
    }

});

