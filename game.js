const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

let config = {
    
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    
    scene: {
        preload: preload,
        create: create,
        update
    }
};

let game = new Phaser.Game(config);


function preload() {

    this.load.image('image_back', 'assets/back.png');
    this.load.image('image_pipe', 'assets/pipe.png');

    this.load.spritesheet('spritesheet_bird',
        'assets/bird.png',
        { frameWidth: 16, frameHeight: 16 });
}



const BIRD_POS_X = (GAME_WIDTH / 4);
const BIRD_POS_Y = (GAME_HEIGHT / 2) - 100;

// starting pipes horizontal shift speed per update call
const ACCELERATION = 0.003;
let gameSpeed = GAME_WIDTH * ACCELERATION;
const GRAVITY = 300;
const FLAP_VELOCITY = 350;

const PIPE_GAP_STEP = GAME_WIDTH / 5;
const PIPE_WIDTH = 60; // TODO change to Image.width

let pipes,
    bird,
    spacebarKey;


function create() {

    this.add.image(0, 0, 'image_back').setOrigin(0, 0);

    pipes = this.physics.add.staticGroup();
    //pipes.create(0, 0, 'image_pipe').setScale(1).refreshBody();
    addPipes();

    makeBird(this.physics, this.anims);

    this.physics.add.collider(bird, pipes, birdHit, null, game);

    spacebarKey =  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    //this.input.keyboard.on('keydown-SPACE', birdFlap);
    this.input.on('pointerdown', birdFlap);
}


function makeBird(physics, anims) {

    bird = physics.add.sprite(BIRD_POS_X, BIRD_POS_Y, 'spritesheet_bird').setScale(2);
    bird.setBounce(0.2);
    bird.setCollideWorldBounds(true);

    anims.create({
        
        key: 'flap',
        frames: anims.generateFrameNumbers('spritesheet_bird', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 1
    });

    bird.body.setGravityY(GRAVITY);
}


function birdHit() {

    console.log("HIT");
}


function update() {

    if (Phaser.Input.Keyboard.JustDown(spacebarKey)) {
        
        birdFlap();
        bird.anims.play('flap');
    }

    let allPipes = pipes.getChildren();

    for(let i = 0; i < allPipes.length; i++) {

        // moving pipes RTL
        allPipes[i].x -= gameSpeed;

        if(i === allPipes.length - 1 && allPipes[i].x < GAME_WIDTH - PIPE_GAP_STEP)
            addPipes();
    }

    //console.log(allPipes.length);
    
    // destroys first pipe if it moved out of screen
    if(allPipes.length !== 0 && allPipes[0].x < -PIPE_WIDTH / 2)
        pipes.remove(allPipes[0], true, true); 
}


function birdFlap() {

    //console.log("flap");
    bird.setVelocityY(-FLAP_VELOCITY);
}


// each member is a pair
const PIPE_CONFIG = [
    [0, PIPE_GAP_STEP]
];




function addPipes() {

    pipes.create(GAME_WIDTH + PIPE_WIDTH / 2, 0, 'image_pipe').refreshBody();
}