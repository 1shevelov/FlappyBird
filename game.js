const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const CONFIG = {
    
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

const GAME = new Phaser.Game(CONFIG);


function preload() {

    this.load.image('image_back', 'assets/back.png');
    this.load.image('image_pipe', 'assets/pipe.png');

    this.load.spritesheet('spritesheet_bird',
        'assets/bird.png',
        { frameWidth: 16, frameHeight: 16 });
}

const GAME_STATE_PLAY = 0;
const GAME_STATE_PAUSE = 1;
const GAME_STATE_FINISH = 2;
let gameState = GAME_STATE_FINISH;

const BIRD_POS_X = (GAME_WIDTH / 4);
const BIRD_POS_Y = (GAME_HEIGHT / 2) - 100;

// starting pipes horizontal shift speed per update call
const ACCELERATION = 0.003;
let gameSpeed = GAME_WIDTH * ACCELERATION;
const GRAVITY = 300;
const GRAVITY_ZERO = 0;
const FLAP_VELOCITY = 350;

const PIPE_GAP_STEP = GAME_WIDTH / 5;
const PIPE_WIDTH = 60; // TODO change to Image.width

const MESSAGE_STYLE = { 
    
    font: '32px Courier',
    fill: '#ff0000',
    align: 'center'
}
const PAUSE_MESSAGE_TEXT = "Press SPACE to play\n\nESCAPE to pause";
const FINISH_MESSAGE_TEXT = "Game Finished!\n\nPress SPACE to restart";

const SCORE_STYLE = { 
    
    font: '24px Courier',
    fontStyle: 'strong',
    fill: '#00ff00',
    align: 'right'
}
const SCORE_MESSAGE_TEXT = "Score: ";

let pipes,
    bird,
    spacebarKey, escapeKey,
    pauseMessage, finishMessage, scoreMessage,
    counter = 0;


function create() {

    this.add.image(0, 0, 'image_back').setOrigin(0, 0);

    pipes = this.physics.add.staticGroup();

    makeBird(this.physics, this.anims);

    this.physics.add.collider(bird, pipes, birdCollide, null, this);
    this.physics.add.overlap(bird, pipes, birdOverlap, null, this);

    spacebarKey =  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    escapeKey =  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    //this.input.keyboard.on('keydown-SPACE', birdFlap);
    //this.input.on('pointerdown', birdFlap);

    pauseMessage = this.add.text(
        GAME_WIDTH / 5, GAME_HEIGHT / 2 - 40, PAUSE_MESSAGE_TEXT, MESSAGE_STYLE);
    
    finishMessage = this.add.text(
        GAME_WIDTH / 5, GAME_HEIGHT / 2 - 40, FINISH_MESSAGE_TEXT, MESSAGE_STYLE);

    scoreMessage = this.add.text(
        GAME_WIDTH - GAME_WIDTH / 6, 30, SCORE_MESSAGE_TEXT + counter, SCORE_STYLE);
    
    gameRestart();
}


function makeBird(physics, anims) {

    bird = physics.add.sprite(BIRD_POS_X, BIRD_POS_Y, 'spritesheet_bird').setScale(2);
    bird.setBounce(0.2);
    //bird.setCollideWorldBounds(true);

    anims.create({
        
        key: 'flap',
        frames: anims.generateFrameNumbers('spritesheet_bird', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 1
    });

    //bird.body.setGravityY(GRAVITY);
}


function birdCollide() {

    //console.log("Collide!");
}


function gameRestart() {

    finishMessage.setVisible(false);
    
    clearPipes();
    
    counter = 0;
    scoreMessage.setText(SCORE_MESSAGE_TEXT + counter);
    scoreMessage.setVisible(true);

    bird.setCollideWorldBounds(true);
    bird.setPosition(BIRD_POS_X, BIRD_POS_Y);

    addPipes();
    setPause();
}


// game finished!
function birdOverlap() {

    //setPause();
    //console.log("Overlap");

    gameState = GAME_STATE_FINISH;

    // death 'animation'
    bird.setVelocityY(FLAP_VELOCITY);
    bird.setCollideWorldBounds(false);

    // TODO: show results
    scoreMessage.setVisible(false);

    finishMessage.setText("Your score: " + counter + "\n" + FINISH_MESSAGE_TEXT);
    finishMessage.setVisible(true);
}


function pollKeyboard() {

    if(Phaser.Input.Keyboard.JustDown(escapeKey) && gameState === GAME_STATE_PLAY) {
        
        setPause();
    }
    
    if(Phaser.Input.Keyboard.JustDown(spacebarKey)) {
        
        if(gameState !== GAME_STATE_FINISH) {
            
            birdFlap();
            bird.anims.play('flap');
        }
        else
            gameRestart();
    }
}


function update() {

    pollKeyboard();

    let allPipes = pipes.getChildren();

    if(gameState === GAME_STATE_PLAY) {

        for(let i = 0; i < allPipes.length; i++) {

            // moving pipes RTL
            allPipes[i].x -= gameSpeed;
            allPipes[i].refreshBody();

            if(allPipes[i].x <= BIRD_POS_X && allPipes[i].x >= BIRD_POS_X - gameSpeed - 1) {

                counter++;
                scoreMessage.setText(SCORE_MESSAGE_TEXT + counter);
            }
            
            if(i === allPipes.length - 1 && allPipes[i].x < GAME_WIDTH - PIPE_GAP_STEP)
                addPipes();
        }

        //console.log(allPipes.length);
        
        // destroys first pipe if it moved out of screen
        if(allPipes.length !== 0 && allPipes[0].x < -PIPE_WIDTH / 2)
            pipes.remove(allPipes[0], true, true);
    }
}


// on game finish
function clearPipes() {

    let allPipes = pipes.getChildren();

    while(allPipes.length > 0) {

        pipes.remove(allPipes[0], true, true);

        //allPipes = pipes.getChildren();
    }
}


function birdFlap() {

    //console.log("flap");
    if(gameState === GAME_STATE_PAUSE) {
        
        setPlay();
    }
    
    bird.setVelocityY(-FLAP_VELOCITY);
}


function setPause() {

    //console.log(" * Pause");

    // TODO: output message "Press SPACE to play"

    gameState = GAME_STATE_PAUSE;
    //GAME.scene.pause('default');

    bird.body.setGravityY(GRAVITY_ZERO);
    bird.setVelocityY(0);

    pauseMessage.setVisible(true);
}


function setPlay() {

    //console.log(" * Play");

    gameState = GAME_STATE_PLAY;

    pauseMessage.setVisible(false);
    
    bird.body.setGravityY(GRAVITY);
}


// each member is a pair
const PIPE_CONFIG = [
    [0, PIPE_GAP_STEP]
];


function addPipes() {

    pipes.create(GAME_WIDTH + PIPE_WIDTH / 2, 0, 'image_pipe');
}