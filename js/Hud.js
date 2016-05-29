var Hud = function (index, game, player) {
    this.cursor = {
        left:false,
        right:false,
        up:false,
        down:false,
        fire:false      
    }
    this.game = game;
    this.player = player;
    this.tank.id = index;
};