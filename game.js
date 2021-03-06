import {
    Application,
    Graphics,
    Sprite,
    loader as PixiLoader
} from 'pixi.js';

const app = new Application(600, 600, {
    backgroundColor: 0x2a2a2a
});
document.body.appendChild(app.view);

const map = {
    platform: [
        // Left wall
        {
            x: -51,
            y: -1,
            h: 600,
            w: 50
        },
        // Right wall
        {
            x: 601,
            y: -1,
            h: 600,
            w: 50
        },
        {
            x: 0,
            y: 550,
            w: 600,
            h: 100
        }, {
            x: 250,
            y: 250,
            w: 100,
            h: 300
        }
    ],
    start: {
        x: 50,
        y: 24
    },
    end: {
        x: 575,
        y: 525
    }
};
let platform = new Graphics();

// Draw every platform
map.platform.forEach(el => {
    platform.beginFill(0x1c1c1c);
    platform.lineStyle(1, 0x1c1c1c, 1);
    platform.moveTo(el.x, el.y);
    platform.lineTo(el.x, el.y + el.h);
    platform.lineTo(el.x + el.w, el.y + el.h);
    platform.lineTo(el.x + el.w, el.y);
    platform.endFill();
});

app.stage.addChild(platform);

let end = new Graphics();

end.beginFill(0x7b7b7b);
end.lineStyle(1, 0x7b7b7b, 1);
end.moveTo(map.end.x - 10, map.end.y - 10);
end.lineTo(map.end.x + 10, map.end.y - 10);
end.lineTo(map.end.x + 10, map.end.y + 10);
end.lineTo(map.end.x - 10, map.end.y + 10);
end.endFill();

app.stage.addChild(end);

let square = new Graphics();

square.beginFill(0xbcbcbc);
square.lineStyle(1, 0xbcbcbc, 1);

square.moveTo(50, 50);
square.lineTo(100, 50);
square.lineTo(100, 100);
square.lineTo(50, 100);

let darkerSquare = new Graphics();

darkerSquare.beginFill(0x7b7b7b);
darkerSquare.lineStyle(1, 0x7b7b7b, 1);

darkerSquare.moveTo(50, 50);
darkerSquare.lineTo(100, 50);
darkerSquare.lineTo(100, 100);
darkerSquare.lineTo(50, 100);
darkerSquare.endFill();

let player = new Sprite(square.generateCanvasTexture());

player.anchor.set(0.5);
player.x = map.start.x;
player.y = map.start.y;

app.stage.addChild(player);

let moveRight = false;
let moveLeft = false;
let jump = false;
let falling = false;
let jumping = false;

document.addEventListener('keydown', event => {
    if (event.code === 'ArrowRight') {
        moveRight = true;
        // moveRight();
    }
    if (event.code === 'ArrowLeft') {
        moveLeft = true;
        // moveLeft();
    }
    if (event.code === 'ArrowUp') {
        jump = true;
        // jump();
    }
    if (event.code === 'Space') respawn();
});

document.addEventListener('keyup', event => {
    if (event.code === 'ArrowRight') {
        moveRight = false;
        // stopMoveRight();
    }
    if (event.code === 'ArrowLeft') {
        moveLeft = false;
        // stopMoveLeft();
    }
    if (event.code === 'ArrowUp') {
        jump = false;
        // stopJump();
    }
});

// Left = -1
// Right = 1
let lastMovement = 0;
let velocity_x = 0.5;
let velocity_y = 10;
let inertia = 0;

let currentPlayer = [];
let previousPlayers = [];
let previousPlayersSprites = [];
let frameCounter = 0;
let hasWon = false;
let winSprite = undefined;
let maxFrameCount = 0;

app.ticker.add(function(delta) {
    if(hasWon) {
        winSprite.scale.x = winSprite.scale.y = Math.min(Math.max(0.05, winSprite.scale.x * 1.10), 1);
        return;
    }
    let oldCoordinates = {
        x: player.x,
        y: player.y
    };
    if (moveRight) {
        player.x += 5 * velocity_x;
        velocity_x = Math.min(4, velocity_x + 0.1);
        inertia = velocity_x * 5;
        lastMovement = 1
    } else if (moveLeft) {
        player.x -= 5 * velocity_x;
        velocity_x = Math.min(4, velocity_x + 0.1);
        inertia = -velocity_x * 5;
        lastMovement = -1
    } else {
        velocity_x = 1;
        player.x += inertia;
        inertia = Math.sign(inertia) * Math.max(0, Math.abs(inertia) * 0.9);
    }

    if (jump && !jumping && !falling) {
        jumping = true;
    } else if (jumping) {
        player.y -= 3 * velocity_y;
        velocity_y *= 0.6;
        if (velocity_y < 0.2) {
            falling = true;
            jumping = false;
        }
    } else if (falling) {
        player.y += 3 * velocity_y;
        velocity_y = Math.min(10, velocity_y * 1.30);
    }
    let canFall = true;
    for (let i = 0, l = map.platform.length; i < l; i++) {
        let platform = map.platform[i];
        if (isInside(player.x + 26, player.y + 25, platform.x, platform.y, platform.w, platform.h) ||
            isInside(player.x + 26, player.y - 25, platform.x, platform.y, platform.w, platform.h) ||
            isInside(player.x - 26, player.y + 25, platform.x, platform.y, platform.w, platform.h) ||
            isInside(player.x - 26, player.y - 25, platform.x, platform.y, platform.w, platform.h)) {
            player.x = oldCoordinates.x;
            velocity_x = 1 / 5;
        }
        if (isInside(player.x + 25, player.y + 25, platform.x, platform.y, platform.w, platform.h) ||
            isInside(player.x - 25, player.y + 25, platform.x, platform.y, platform.w, platform.h)) {
            falling = false;
            canFall = false;
            velocity_y = 10;
            player.y -= player.y + 25 - platform.y + 1;
        }
        if (isInside(player.x + 25, player.y + 28, platform.x, platform.y, platform.w, platform.h) ||
            isInside(player.x - 25, player.y + 28, platform.x, platform.y, platform.w, platform.h)) {
            canFall = false;
        }
    }
    for (let i = 0, l = previousPlayersSprites.length; i < l; i++) {
        let previous = previousPlayers[i][frameCounter];
        if(previous === undefined) {
            previous = previousPlayers[i].slice(-1)[0];
        }
        if (isInside(player.x + 25, player.y + 25, previous.x - 25, previous.y - 25, 50, 50) ||
            isInside(player.x + 25, player.y - 25, previous.x - 25, previous.y - 25, 50, 50) ||
            isInside(player.x - 25, player.y + 25, previous.x - 25, previous.y - 25, 50, 50) ||
            isInside(player.x - 25, player.y - 25, previous.x - 25, previous.y - 25, 50, 50)) {
            player.x = oldCoordinates.x;
            velocity_x = 1 / 5;
        }
        if (isInside(player.x + 25, player.y + 25, previous.x - 25, previous.y - 25, 50, 50) ||
            isInside(player.x - 25, player.y + 25, previous.x - 25, previous.y - 25, 50, 50)) {
            falling = false;
            canFall = false;
            velocity_y = 10;
            player.y -= player.y + 50 - previous.y + 1;
        }
        if (isInside(player.x + 25, player.y + 28, previous.x, previous.y, previous.w, previous.h) ||
            isInside(player.x - 25, player.y + 28, previous.x, previous.y, previous.w, previous.h)) {
            canFall = false;
        }
    }
    if (canFall) falling = true;
    if(isInside(player.x, player.y, map.end.x - 10, map.end.y - 10, 20, 20)){
        console.log('YOU WON WOWOWOWOW')
        hasWon = true;
        addCircle();
    }
    currentPlayer.push({
        x: player.x,
        y: player.y
    });
    for (let i = 0, l = previousPlayersSprites.length; i < l; i++) {
        let sprite = previousPlayersSprites[i];
        if(frameCounter > previousPlayers[i].length - 1) continue;
        sprite.x = previousPlayers[i][frameCounter].x;
        sprite.y = previousPlayers[i][frameCounter].y;
    }
    frameCounter++;
});

const isInside = (x1, y1, x2, y2, w, h) => (x1 >= x2 && y1 >= y2 && x1 <= x2 + w && y1 <= y2 + h);

const respawn = _ => {
    maxFrameCount = Math.max(maxFrameCount, frameCounter);
    frameCounter = 0;
    previousPlayers.push(currentPlayer.slice());
    let newSprite =  new Sprite(darkerSquare.generateCanvasTexture())
    newSprite.anchor.set(0.5);
    newSprite.x = map.start.x;
    newSprite.y = map.start.y;
    previousPlayersSprites.push(newSprite);
    app.stage.addChild(newSprite);
    currentPlayer = [];
    velocity_x = 0.5;
    inertia = 0;
    player.x = map.start.x;
    player.y = map.start.y;
}

const addCircle = _ => {
    let winCircle = new Graphics();
    winCircle.lineStyle(1, 0xbcbcbc, 0.5);
    winCircle.beginFill(0xbcbcbc, 1);
    winCircle.drawCircle(map.end.x, map.end.y, 850);
    winCircle.endFill();
    winSprite = new Sprite(winCircle.generateCanvasTexture());
    winSprite.anchor.set(0.5);
    winSprite.x = map.end.x;
    winSprite.y = map.end.y;
    winSprite.scale.x = winSprite.scale.y = 0;
    app.stage.addChild(winSprite);
}
