var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var uuidv4 = require('uuid/v4');

var servers = [];
const UserCount = 2;

io.on('connection', function(socket) {
    console.log('서버접속');

    // 방만들기
    var createServer = function() {
        var serverId = uuidv4();
        socket.join(serverId, function() {
            var server = { serverId: serverId, clients: [{ clientId: socket.id, ready: false }]};
            servers.push(server);
            socket.emit('join', { serverId: serverId, clientId: socket.id });
        });
    }

    // 유효한 방 찾기
    var getOkServerId = function() {
        if (servers.length > 0) {
            for (var i = 0; i < servers.length; i++) {
                if (servers[i].clients.length < UserCount) {
                    return i;
                } 
            }
        }
        return -1;
    }

    var serverIndex = getOkServerId();
    if (serverIndex > -1) {

        socket.join(servers[serverIndex].serverId, function() {
            var client = { clientId: socket. id, ready: false }
            servers[serverIndex].clients.push(client);

            socket.emit('join', { serverId: servers[serverIndex].serverId, clientId: socket.id });
        });
    } else {
        createServer();
    }

    socket.on('ready', function(data)
    {
        if (!data) return;
        var server = servers.find(server => server.serverId === data.serverId);
        if (server)
        {
            var clients = server.clients;
            var client = clients.find(client => client.clientId === data.clientId);

            if (client) client.ready = true;

            if (clients.length == 2)
            {
                if (clients[0].ready == true && clients[1].ready == true)
                {
                    io.to(clients[0].clientId).emit('play', { first: false });
                    io.to(clients[1].clientId).emit('play', { first: true });

                }
            }
        }
    });

    socket.on('select', function(data) {
        if (!data) return;
        var index = data.index;
        var serverId = data.serverId;
        if(index > -1 && serverId)
        {
            socket.to(serverId).emit('selected', { index: index });
        }
    });

    socket.on('win', function(data) {
        if(!data) return;
        var serverId = data.serverId;
        var index = data.index;
        if (index > -1 && serverId)
        {
            socket.to(serverId).emit('lose', { index: index });
        }
    });

    socket.on('tie', function(data) {
        if (!data) return;
        var serverId = data.serverId;
        var index = data.index;
        if (index > - 1 && serverId)
        {
            socket.to(serverId).emit('tie', { index: index });
        }
    });

    socket.on('disconnect', function(reason) {
        console.log("서버에서 나감");

        if (clients.length == 1)
        {
            io.to(clients.length.clientId).emit('win');
        }

        for (var i = 0; i < servers.length; i++)
        {
            var client = servers[i].clients.find(client => client.clientId === socket.id);
            if (client)
            {
                var clientIndex = servers[i].clients.indexOf(client);
                servers[i].clients.splice(clientIndex, 1);

                if (servers[i].clients.length == 0)
                {
                    var serverIndex = server.indexOf(servers[i]);
                    servers.splice(serverIndex, 1);
                }
            }
        }
    });
});
    

http.listen(3000, function() {
    console.log('3000번 포트 서버 오픈');
});