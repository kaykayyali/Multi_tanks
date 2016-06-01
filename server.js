var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

// serve static files from the current directory
app.use(express.static(__dirname));

//we'll keep clients data here
var clients = {};
  
//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState', 'handle_new_message']});

//attach eureca.io to our http server
eurecaServer.attach(server);
function display_server_data() {
	console.log("*********")
	console.log("Clients ", clients);
	console.log("*********")
	console.log(' ');
}
setInterval(display_server_data, 5000);


//eureca.io provides events to detect clients connect/disconnect

//detect client connection
eurecaServer.onConnect(function (conn) {    
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);
	
	//the getClient method provide a proxy allowing us to call remote client functions
    var remote = eurecaServer.getClient(conn.id);    
	
	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}
	
	//here we call setId (defined in the client side)
	remote.setId(conn.id);

});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {    
    console.log('Client disconnected ', conn.id);
	
	var removeId = clients[conn.id].id;
	var message = clients[conn.id].player_data.name + " has left the game.";
	delete clients[conn.id];
	
	for (var c in clients) {
		var remote = clients[c].remote;
		//here we call kill() method defined in the client side
		this.emit_message(message);
		remote.kill(conn.id);
	}	
});

eurecaServer.exports.handle_kill = function (tank_id) {
	for (var c in clients) {
		var remote = clients[c].remote;
		remote.kill(tank_id);
	}
}

eurecaServer.exports.handleKeys = function (keys) {
	var conn = this.connection;
	var updatedClient = clients[conn.id];
	
	for (var c in clients) {
		var remote = clients[c].remote;
		remote.updateState(updatedClient.id, keys);
		
		//keep last known state so we can send it to new connected clients
		clients[c].laststate = keys;
	}
}

eurecaServer.exports.handshake = function() {
	console.log("Hand Shaking")
	for (var c in clients) {
		var remote = clients[c].remote;
		for (var cc in clients) {		
			//send latest known position
			var x = clients[cc].laststate ? clients[cc].laststate.x:  0;
			var y = clients[cc].laststate ? clients[cc].laststate.y:  0;
 			console.log("Emitting spawn ", clients[cc])
 			console.log(clients[cc].player_data)
			remote.spawnEnemy(clients[cc].id, x, y, clients[cc].player_data);		
		}
	}
}


eurecaServer.exports.set_player_data = function(id, player_data) {
	console.log("Setting player data for ", id);
	if (clients[id]){
		clients[id].player_data = player_data;
	}
	else {
		console.log("Failed to find client with id ", id);
	}
	
}

eurecaServer.emit_message = function(message) {
	for (var c in clients) {
		var remote = clients[c].remote;
		remote.handle_new_message(message);
	}
}
eurecaServer.exports.emit_message = function(message) {
	for (var c in clients) {
		var remote = clients[c].remote;
		remote.handle_new_message(message);
	}
}

server.listen(process.env.PORT || 8000);