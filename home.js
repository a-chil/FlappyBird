//Canvas creation
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let frames = 0;

//Image sourcing
const sprite = new Image();
sprite.src = "sprite.png";

//Radian to degree conversion
const degree = Math.PI / 180;

//Audio sourcing
const die_sound = new Audio();
die_sound.src = "audio/sfx_die.wav";

const flap_sound = new Audio();
flap_sound.src = "audio/sfx_flap.wav";

const hit_sound = new Audio();
hit_sound.src = "audio/sfx_hit.wav";

const point_sound = new Audio();
point_sound.src = "audio/sfx_point.wav";

const swoosh_sound = new Audio();
swoosh_sound.src = "audio/sfx_swooshing.wav";

//On click even for three game states
canvas.addEventListener("click", function(evt) {
    switch (state.current) {
        case state.ready:
            state.current = state.game;
            swoosh_sound.play();
            break;
        case state.game:
            bird.flap(); //Allows the bird to jump up after click is executed
            flap_sound.play();
            break;
        case state.over:
            let canvasPos = canvas.getBoundingClientRect();

            let Xclick = evt.clientX - canvasPos.left;
            let Yclick = evt.clientY - canvasPos.top;

            if(Xclick >= start.x && Xclick <= start.x + start.w && Yclick >= start.y && Yclick <= start.y + start.h) {
                bird.reset();
                pipes.reset();
                score.reset();
                state.current = state.ready
            }
            break;
    }
});

//Starting screen properties
const start = {
    x: 120,
    y : 263,
    w : 83,
    h : 29
}

//Background properties and draw method
const bg = {
    sX: 0,
    sY: 0,
    w: 275,
    h: 226,
    x: 0,
    y: canvas.height - 226,

    draw : function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        //Covering the canvas horizontally
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
}

//Foreground properties 
const fg = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: canvas.height - 112,
    dx: 2,

    draw : function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        //Covering the canvas horizontally
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },

    //Shifting foreground by 2 pixels to create illusion of moving bird
    update : function() {
        if (state.current == state.game) {
            this.x = (this.x - this.dx) % (this.w/2);
        }
    }

}

//Pipes properties
const pipes = {
    top : {
        sX : 553,
        sY : 0
    },
    bottom : {
        sX : 502,
        sY : 0
    },

    w : 53,
    h : 400,

    //Gap between the top and bottom pipes
    gap : 105,

    //Highest Y position
    yPos : -150,
    
    dx : 2,

    position : [],

    draw : function() {
        for (let z = 0; z < this.position.length; z++) {
            let p = this.position[z];
            let TY = p.y; //Top Y position
            let BY = p.y + this.gap + this.h; //Bottom Y position

            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, BY, this.w, this.h);
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, TY, this.w, this.h);
        }
    },
    update : function() {
        if (state.current !== state.game) return; //Checking the state of the game before drawing and updating pipesm
            
        //Setting the X and Y positions of the pipes that are to be drawn ever 100 frames
        if (frames % 100 == 0) {
            this.position.push({
                x : canvas.width,
                y : this.yPos * (Math.random() + 1)
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let BY = this.h + p.y + this.gap;

            //BOTTOM PIPE bird collision detection
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < this.w + p.x && bird.y + bird.radius > BY && bird.y - bird.radius < BY + this.h) {
                state.current = state.over;
                hit_sound.play();
            }

            //TOP PIPE bird collision detection
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < this.w + p.x && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                state.current = state.over;
                hit_sound.play();            
            }

            //Updating position of pipes
            p.x -= this.dx;

            //When the position of pipes are beyond that of the canvas
            if (p.x + this.w <= 0) {
                this.position.shift(); //Removing a passed pipe from the position array
                point_sound.play();

                //Score tracking and storage
                score.now += 1;
                score.best = Math.max(score.now, score.best); //Updating best score
                localStorage.setItem("best_score", score.best);
            }
        }
    },
    //Restarting the game
    reset : function() {
        this.position = [];
    }
}

//Bird properties
const bird = {
    //The 3 states of the bird flapping. Fourth state created to make the transition between each state easier
    animation : [
        {sX: 276, sY: 112},
        {sX: 276, sY: 139},
        {sX: 276, sY: 164},
        {sX: 276, sY: 139}
    ],
    x: 50,
    y: 150,
    w: 34,
    h: 26,

    frame : 0,

    radius : 12, //Radius of the bird image

    draw : function() {
        let bird = this.animation[this.frame];

        ctx.save(); //Saving current state of canvas
        //Translating and rotating canvas to give bird angle when flapping
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h,  - this.w/2,  - this.h/2, this.w, this.h);

        ctx.restore(); //Restoring canvas
    },

    //Flap method
    flap : function() {
        this.speed = - this.jump;
    },

    speed: 0,
    gravity : 0.25,
    jump : 4.6,

    rotation : 0,

    update : function() {
        //Changing period of flapping as per game state
        this.period = state.current == state.ready ? 10 : 5;

        this.frame += frames % this.period == 0 ? 1 : 0;

        this.frame = this.frame % 4;

        if (state.current == state.ready) {
            this.y = 150;
            this.rotation = 0 * degree;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            if (this.y + this.h/2 >= (canvas.height - fg.h)) {
                this.y = canvas.height - (this.h/2) - fg.h;
                if (state.current == state.game) {
                    state.current = state.over;
                    die_sound.play();
                }
            }
            if (this.speed >= this.jump) {
                this.rotation = 90 * degree;
                this.frame = 1;
            } else {
                this.rotation = -25 * degree;
            }
        }

    },
    //Resetting the speed of bird method
    reset : function() {
        this.speed = 0;
    }

}

//Ready state
const ready = {
    sX: 0,
    sY: 228,
    w: 173,
    h: 152,
    x: canvas.width/2 - 173/2,
    y: 80,

    draw : function() {
        if (state.current == state.ready) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

//Game over state
const over = {
    sX: 175,
    sY: 228,
    w: 225,
    h: 202,
    x: canvas.width/2 - 225/2,
    y: 90,

    draw : function() {
        if (state.current == state.over) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

//Game States
const state = {
    current : 0,
    ready : 0,
    game : 1,
    over : 2
}

//Score tracking and drawing
const score = {
    now : 0,
    best : parseInt(localStorage.getItem("best_score")) || 0, //Retrieving best score from local storage

    draw : function() {
        ctx.strokStyle = "black";
        ctx.fillStyle = "white";

        if(state.current == state.game) {
            ctx.font = "35px Teko";
            ctx.lineWidth = 2;

            ctx.fillText(this.now, canvas.width/2, 50);
            ctx.strokeText(this.now, canvas.width/2, 50);
        }
        else if(state.current == state.over) {
            ctx.font = "25px Teko";

            ctx.fillText(this.now, 225, 186);
            ctx.strokeText(this.now, 225, 186);
            
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },
    //Resetting current score
    reset : function() {
        this.now = 0;
    }
}

//Collective Draw function
function draw() {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bg.draw();
    fg.draw();
    bird.draw();

    pipes.draw();
    ready.draw();
    over.draw();
    score.draw();
}

//Collective Update function
function update() {
    fg.update();
    bird.update();
    pipes.update();
}

//Loop function for animation
function loop() {
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
}

loop();

