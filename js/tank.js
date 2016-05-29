var Tank = function (index, game, player, display_name) {
    console.log("Created with:");
    console.log("Game: ", game);  
    console.log("Player: ", player);  
    console.log("Display Name: ", display_name);  
    var self = this;
    this.cursor = {
        left:false,
        right:false,
        up:false,
        down:false,
        fire:false      
    }
    this.input = {
        left:false,
        right:false,
        up:false,
        down:false,
        fire:false
    }
    var x = 0;
    var y = 0;
    this.game = game;
    this.health = 30;
    this.player = player;
    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);  
    this.currentSpeed = 0;
    this.fireRate = 1000;
    this.nextFire = 0;
    this.alive = true;
    this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
    this.tank = game.add.sprite(x, y, 'enemy', 'tank1');
    this.turret = game.add.sprite(x, y, 'enemy', 'turret');
    var style = { 
        font: "16px Arial", 
        fill: "#fff", 
        wordWrap: true, 
        wordWrapWidth: self.tank.width, 
        align: "center"
        // backgroundColor: "#ffff00" 
    };
    this.display_name = game.add.text(x, y, display_name, style);
    this.shadow.anchor.set(0.5);
    this.tank.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);
    this.tank.id = index;
    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;
    this.tank.body.collideWorldBounds = true;
    this.tank.body.bounce.setTo(0, 0);
    this.tank.angle = 0;
    game.physics.arcade.velocityFromRotation(this.tank.rotation, 0, this.tank.body.velocity);
};
Tank.prototype.update = function() {
    var inputChanged = (
        this.cursor.left != this.input.left ||
        this.cursor.right != this.input.right ||
        this.cursor.up != this.input.up ||
        this.cursor.down != this.input.down ||
        this.cursor.fire != this.input.fire
    );
    if (inputChanged)
    {
        //Handle input change here
        //send new values to the server     
        if (this.tank.id == myId)
        {
            // send latest valid state to the server
            this.input.x = this.tank.x;
            this.input.y = this.tank.y;
            this.input.angle = this.tank.angle;
            this.input.rot = this.turret.rotation;
            eurecaServer.handleKeys(this.input);
        }
    } 
    if (this.cursor.left)
    {
        this.tank.angle -= 1;
    }
    else if (this.cursor.right)
    {
        this.tank.angle += 1;
    }   
    if (this.cursor.up)
    {
        //  The speed we'll travel at
        this.currentSpeed = 300;
    }
    if (this.cursor.down)
    {
        //  The speed we'll travel at
        this.currentSpeed = -300;
    }
    else
    {
        if (this.currentSpeed > 0)
        {
            this.currentSpeed -= 4;
        }
    }
    if (this.cursor.fire)
    {   
        this.fire({x:this.cursor.tx, y:this.cursor.ty});
    }
    if (this.currentSpeed > 0)
    {
        game.physics.arcade.velocityFromRotation(this.tank.rotation, this.currentSpeed, this.tank.body.velocity);
    }   
    else
    {
        game.physics.arcade.velocityFromRotation(this.tank.rotation, 0, this.tank.body.velocity);
    }   
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.rotation = this.tank.rotation;
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.display_name.x = this.tank.x - 30;
    this.display_name.y = this.tank.y - 60;
};
Tank.prototype.fire = function(target) {
        if (!this.alive) return;
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
        {
            this.nextFire = this.game.time.now + this.fireRate;
            var bullet = this.bullets.getFirstDead();
            bullet.reset(this.turret.x, this.turret.y);
            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, target, 500);
        }
}
Tank.prototype.kill = function() {
    this.alive = false;
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.display_name.destroy();
}