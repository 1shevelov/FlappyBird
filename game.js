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
    this.load.image('image_pipe_bottom', 'assets/pipe_bottom.png');

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
const GRAVITY = 400;
const GRAVITY_ZERO = 0;
const FLAP_VELOCITY = 250;

// TODO: can I get sizes from image itself?
const PIPE_WIDTH = 60;
const PIPE_HEIGHT = 530;

const PIPE_NUM = 3.2
const PIPE_GAP_STEP = GAME_WIDTH / PIPE_NUM;
const HOLE_GAP_STEP = GAME_HEIGHT / PIPE_NUM;

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

let pipesTop, pipesBottom,
    bird,
    spacebarKey, escapeKey,
    pauseMessage, finishMessage, scoreMessage,
    counter = 0,
    counterSpeedUp = 1;


function create() {

    this.add.image(0, 0, 'image_back').setOrigin(0, 0);

    pipesTop = this.physics.add.staticGroup();
    pipesBottom = this.physics.add.staticGroup();

    makeBird(this.physics, this.anims);

    //this.physics.add.collider(bird, pipes, birdCollide, null, this);
    this.physics.add.overlap(bird, pipesTop, birdOverlap, null, this);
    this.physics.add.overlap(bird, pipesBottom, birdOverlap, null, this);

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

}


// function birdCollide() {

//     //console.log("Collide!");
// }


function gameRestart() {

    finishMessage.setVisible(false);
    
    clearPipes();
    
    counter = 0;
    scoreMessage.setText(SCORE_MESSAGE_TEXT + counter);
    scoreMessage.setVisible(true);

    counterSpeedUp = 1;

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

    if(gameState === GAME_STATE_PLAY) {

        let allPipesTop = pipesTop.getChildren();
        let allPipesBottom = pipesBottom.getChildren();

        for(let i = 0; i < allPipesTop.length; i++) {

            // moving pipes RTL
            allPipesTop[i].x -= gameSpeed;
            allPipesBottom[i].x -= gameSpeed;

            allPipesTop[i].refreshBody();
            allPipesBottom[i].refreshBody();

            // count the pipes pair that the bird has passed through
            if(allPipesTop[i].x <= BIRD_POS_X && allPipesTop[i].x >= BIRD_POS_X - gameSpeed - 1) {

                counter++;
                scoreMessage.setText(SCORE_MESSAGE_TEXT + counter);
            }

            // sppeding up every 10 gates
            if(counter > counterSpeedUp && counter % 10 === 0) {
                
                gameSpeed += gameSpeed * ACCELERATION * 50;

                //console.log(gameSpeed);
                counterSpeedUp = counter;
            }
            
            // create new pair of pipes,
            // if the last (newest) pair has moved more than PIPE_GAP_STEP
            if(i === allPipesTop.length - 1 && allPipesTop[i].x < GAME_WIDTH - PIPE_GAP_STEP)
                addPipes();
        }

        //console.log(allPipesTop.length);
        
        // destroys first pair of pipes if it moved out of screen
        if(allPipesTop.length !== 0 && allPipesTop[0].x < -PIPE_WIDTH / 2) {
            
            pipesTop.remove(allPipesTop[0], true, true);
            pipesBottom.remove(allPipesBottom[0], true, true);
        }
    }
}


// on game finish
function clearPipes() {

    let allPipesTop = pipesTop.getChildren();
    let allPipesBottom = pipesBottom.getChildren();

    while(allPipesTop.length > 0) {

        pipesTop.remove(allPipesTop[0], true, true);
        pipesBottom.remove(allPipesBottom[0], true, true);

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


// vertical hole size
const HOLE_SIZE = [
    HOLE_GAP_STEP * PIPE_NUM,
    HOLE_GAP_STEP * PIPE_NUM / 1.5,
    HOLE_GAP_STEP * PIPE_NUM / 2,
    HOLE_GAP_STEP * PIPE_NUM / 3,
    HOLE_GAP_STEP * PIPE_NUM / 4
];

// probability of diff hole sizes
const HOLE_DIFFICULTY = [
    0,
    1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3,
    4, 4, 4
];


let prevHoleCenter = GAME_HEIGHT / 2;

function addPipes() {

    // clamps center of the hole to fit it whole on the screen
    // while making it's not to different in position from previous hole
    const findCenter = function(holeWidth) {

        const RAND_Y = Math.random() * GAME_HEIGHT;

        let center = Math.min(RAND_Y, GAME_HEIGHT - holeWidth / 2, prevHoleCenter + HOLE_GAP_STEP);
        center = Math.max(center, holeWidth / 2, prevHoleCenter - HOLE_GAP_STEP);

        return center;
    }

    // HOLE_SIZE.forEach(size => console.log(size));
    
    // let a = 20;
    
    // while(a > 0) {

    //     let randWidth = HOLE_SIZE[HOLE_DIFFICULTY[Math.floor(Math.random() * HOLE_DIFFICULTY.length)]];
    
    //     //console.log(randWidth);

    //     let holeWidth = HOLE_SIZE[HOLE_DIFFICULTY[Math.floor(Math.random() * HOLE_DIFFICULTY.length)]];

    //     console.log(holeWidth, findCenter(Math.random() * GAME_HEIGHT, holeWidth));

    //     a--;
    // }

    let holeWidth = HOLE_SIZE[HOLE_DIFFICULTY[Math.floor(Math.random() * HOLE_DIFFICULTY.length)]];

    let holeCenter = findCenter(holeWidth);

    //console.log(holeCenter, " / ", holeWidth);
    prevHoleCenter = holeCenter;
    
    pipesTop.create(GAME_WIDTH + PIPE_WIDTH / 2, holeCenter - (holeWidth + PIPE_HEIGHT) / 2, 'image_pipe');
    
    pipesBottom.create(GAME_WIDTH + PIPE_WIDTH / 2, holeCenter + (holeWidth + PIPE_HEIGHT) / 2, 'image_pipe_bottom');
}