var eurecaClient;
var game;
var myId=0;
var eurecaServer;
var player_data = {};
var client_data = {
        tanks_list: {},
        messages: []
    };
var PhaserGame;
function startGame() {
    player_data.name = $.cookie('display_name') || "Unknown";
    var land;
    var shadow;
    var turret;
    var player;
    var explosions;
    var cursors;
    var bullets;
    var fireRate = 100;
    var nextFire = 0;
    var ready = false;
    //this function will handle client communication with the server
    var eurecaClientSetup = function() {
        //create an instance of eureca.io client
            eurecaClient = new Eureca.Client();
            eurecaClient.ready(function (proxy) {       
            eurecaServer = proxy;
        });
        //methods defined under "exports" namespace become available in the server side
        eurecaClient.exports.setId = function(id) {
            myId = id;
            client_data.socket_id = id;
            eurecaServer.set_player_data(id, player_data);
            eurecaServer.emit_message(player_data.name + " has connected.")
            game = new Phaser.Game(500, 500, Phaser.CANVAS, 'game_canvas');
            game.state.add('Game', PhaserGame, true);
            setTimeout(eurecaServer.handshake, 2000); 
            ready = true;
        }   
        eurecaClient.exports.kill = function(id) {   
            if (client_data.tanks_list[id]) {
                console.log("Signalled to kill ", id, client_data.tanks_list[id])
                var x = client_data.tanks_list[id].x;
                var y = client_data.tanks_list[id].y;

                client_data.tanks_list[id].kill();
                if (id == myId) {
                    client_data.messages.unshift("You were killed.")
                    PhaserGame.prototype.display_messages();
                }
            }
        }

        eurecaClient.exports.updateState = function(id, state) {
            console.log("Upadating State for ", id);
            if (client_data.tanks_list[id])  {
                client_data.tanks_list[id].cursor = state;
                client_data.tanks_list[id].tank.x = state.x;
                client_data.tanks_list[id].tank.y = state.y;
                client_data.tanks_list[id].tank.angle = state.angle;
                client_data.tanks_list[id].turret.rotation = state.rot;
                client_data.tanks_list[id].update();
            }
        }   
        eurecaClient.exports.handle_new_message = function(new_message) {
            console.log("New message recieved", new_message);
            if (client_data.messages.length < 4 ) {
                console.log("Adding message")
                client_data.messages.unshift(new_message);
            }
            else {
                console.log("Removing message")
                client_data.messages.pop();
                client_data.messages.unshift(new_message);
            }
            PhaserGame.prototype.display_messages();
        }
        
        eurecaClient.exports.spawnEnemy = function(id, x, y, new_player_data) {
            console.log("Spawning enemy tank named ", name);
            if (id == myId) {
                console.log("SAME ID");
            return;
            } //this is me
            else if (id == myId && new_player_data.name == player_data.name){
                console.log("Same ID and Name Wth?", id, name);
                return;
            }
            console.log('SPAWN');
            var tank = new Tank(id, game, tank, new_player_data);
            client_data.tanks_list[id] = tank;
        }
        
    }
    PhaserGame = function () {
        this.pad;
        this.stick;
        this.shoot;
    };
    PhaserGame.prototype = {

        init: function () {

            this.game.renderer.renderSession.roundPixels = true;
            this.physics.startSystem(Phaser.Physics.ARCADE);
        },
        preload: function() {

            game.load.atlas('tank', 'assets/tanks.png', 'assets/tanks.json');
            game.load.atlas('enemy', 'assets/enemy-tanks.png', 'assets/tanks.json');
            game.load.image('bullet', 'assets/bullet.png');
            game.load.image('earth', 'assets/scorched_earth.png');
            game.load.atlas('generic', 'assets/virtualjoystick/skins/generic-joystick.png', 'assets/virtualjoystick/skins/generic-joystick.json')
            game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
            
        },
        create: function() {
            //  Resize our game world to be a 2000 x 2000 square
            game.world.setBounds(-1000, -1000, 2000, 2000);
            game.stage.disableVisibilityChange  = true;
            
            //  Our tiled scrolling background
            land = game.add.tileSprite(0, 0, 800, 600, 'earth');
            land.fixedToCamera = true;
            
            var display_name = $.cookie('display_name');
            player = new Tank(myId, game, null, player_data);
            // console.log("Initiating hud");
            // this.hud = new Hud(game);
            // console.log(this.hud);
            client_data.tanks_list[myId] = player;
            tank = player.tank;
            turret = player.turret;
            tank.x=0;
            tank.y=0;
            bullets = player.bullets;
            shadow = player.shadow; 
            //  Explosion pool
            explosions = game.add.group();
            for (var i = 0; i < 10; i++)
            {
                var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
                explosionAnimation.anchor.setTo(0.5, 0.5);
                explosionAnimation.animations.add('kaboom');
            }
            tank.bringToTop();
            turret.bringToTop();
            game.camera.follow(tank);
            game.camera.deadzone = new Phaser.Rectangle(150, 150, 150, 150);
            game.camera.focusOnXY(0, 0);

            cursors = game.input.keyboard.createCursorKeys();
            
            this.pad = game.plugins.add(Phaser.VirtualJoystick);
            this.stick = this.pad.addStick(50, 50, 200, 'generic');  
            this.stick.alignBottomLeft();
        },
        update: function() {
            //do not update if client not ready
            if (!ready) return;
            
            player.input.left = cursors.left.isDown;
            player.input.right = cursors.right.isDown;
            player.input.up = cursors.up.isDown;
            player.input.down = cursors.down.isDown;
            player.input.fire = game.input.activePointer.isDown;
            player.input.tx = game.input.x+ game.camera.x;
            player.input.ty = game.input.y+ game.camera.y;
            turret.rotation = game.physics.arcade.angleToPointer(turret);   
            land.tilePosition.x = -game.camera.x;
            land.tilePosition.y = -game.camera.y;
            for (var i in client_data.tanks_list)
            {
                if (!client_data.tanks_list[i]) continue;
                var curBullets = client_data.tanks_list[i].bullets;
                var curTank = client_data.tanks_list[i].tank;
                for (var j in client_data.tanks_list)
                {
                    if (!client_data.tanks_list[j]) continue;
                    if (j!=i) 
                    {
                        var targetTank = client_data.tanks_list[j].tank;
                        game.physics.arcade.overlap(curBullets, targetTank, this.bulletHitPlayer, null, this);
                    
                    }
                    if (client_data.tanks_list[j].alive)
                    {
                        client_data.tanks_list[j].update();
                    }           
                }
            }
        },
        display_messages: function() {
            if (!this.displayed_messages) {
                this.displayed_messages = [];
                console.log(this.displayed_messages)

            }
            else {
                console.log(this.displayed_messages)
                this.displayed_messages.forEach(function(message) {
                    console.log("Deleting message ", message)
                    message.destroy();
                });
            }
            console.log("Updating Messages");
            if (client_data.messages.length > 0) {
                for (var x = 0; x <= client_data.messages.length - 1; x++) {
                    var camera_width = game.camera.width / 4;
                    var camera_height = ((game.camera.height / 4) - 100 );
                    var camera_height_multiplier = 20; // pixels
                    camera_height = camera_height + (camera_height_multiplier * x);
                    var new_message = game.add.text(camera_width, camera_height, client_data.messages[(x)], {font: "12px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 3});
                    new_message.anchor.setTo(0.5, 0.5);
                    new_message.fixedToCamera = true;
                    this.displayed_messages.push(new_message);
                }
            }
        },
        bulletHitPlayer: function(tank, bullet) {
            console.log("Bullet hit player");
            bullet.kill();
            console.log("health = ", tank)
            eurecaServer.handle_kill(tank.id);
            console.log(tank)
            eurecaServer.emit_message(player_data.name + " killed " + client_data.tanks_list[tank.id].player_data.name);
        },
        render: function() {}
    }
    //Start the client...
    eurecaClientSetup();
}