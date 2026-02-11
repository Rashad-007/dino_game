const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Constants & Config ---
const GAME_SPEED_START = 3.0;
const GAME_SPEED_MAX = 20;
const GRAVITY = 0.5; // Adjusted slightly for the lower jump
const JUMP_FORCE = -10; // Reduced from -10 for a shorter hop
const ACCELERATION = 0.0002;

const LOGICAL_HEIGHT = 300;
let scaleRatio = 1;

const WOLF_WIDTH = 55; // Slightly longer for a wolf
const WOLF_HEIGHT = 45;
const WOLF_SLIDE_HEIGHT = 25; // Lower for sliding
const WOLF_X = 50;

// Obstacle Config
const CACTUS_SMALL_WIDTH = 17;
const CACTUS_SMALL_HEIGHT = 35;
const CACTUS_LARGE_WIDTH = 25;
const CACTUS_LARGE_HEIGHT = 50;
const BIRD_WIDTH = 46;
const BIRD_HEIGHT = 40;

// --- Game State ---
let score = 0;
let highScore = 0;
let gameSpeed = GAME_SPEED_START;
let isGameOver = false;
let isPlaying = false;
let frame = 0;

// --- Entity Classes ---

class Wolf {
    constructor() {
        this.reset();
    }

    reset(groundY) {
        this.width = WOLF_WIDTH;
        this.height = WOLF_HEIGHT;
        this.originalHeight = WOLF_HEIGHT;

        // Position
        this.x = WOLF_X;
        this.groundY = groundY || (LOGICAL_HEIGHT - 20);
        this.y = this.groundY - this.height;

        this.vy = 0;
        this.isSliding = false;
    }

    jump() {
        if (this.y >= this.groundY - this.height - 1) {
            this.vy = JUMP_FORCE;
            this.isSliding = false; // Cancel slide on jump
        }
    }

    slide(enable) {
        if (this.isSliding === enable) return;
        this.isSliding = enable;

        if (this.isSliding) {
            this.height = WOLF_SLIDE_HEIGHT;
            this.width = WOLF_WIDTH + 15; // Elongate when sliding
            this.y = this.groundY - this.height;
        } else {
            this.height = this.originalHeight;
            this.width = WOLF_WIDTH;
            this.y = this.groundY - this.height;
        }
    }

    update() {
        // Apply Gravity
        this.y += this.vy;
        this.vy += GRAVITY;

        // Ground Collision
        if (this.y + this.height > this.groundY) {
            this.y = this.groundY - this.height;
            this.vy = 0;
        }

        this.draw();
    }

    draw() {
        ctx.fillStyle = '#4a4a4a'; // Darker grey for wolf

        if (this.isSliding) {
            // SLIDING WOLF
            // Body (long and low)
            ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);

            // Head (low)
            ctx.fillRect(this.x + this.width - 15, this.y + 10, 20, 15);
            // Snout
            ctx.fillRect(this.x + this.width + 5, this.y + 15, 8, 8);
            // Ears (folded back for aerodynamic slide)
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 5, this.y + 10);
            ctx.lineTo(this.x + this.width - 15, this.y + 10);
            ctx.lineTo(this.x + this.width - 10, this.y + 2);
            ctx.fill();

            // Tail (streaming behind)
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 15);
            ctx.lineTo(this.x - 15, this.y + 10);
            ctx.lineTo(this.x, this.y + 20);
            ctx.fill();

        } else {
            // RUNNING WOLF
            // Body
            ctx.fillRect(this.x, this.y + 15, this.width - 10, this.height - 15);

            // Head/Neck
            ctx.fillRect(this.x + this.width - 20, this.y, 20, 25);

            // Snout
            ctx.fillRect(this.x + this.width, this.y + 5, 10, 10);

            // Ears (Pointy)
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 15, this.y);
            ctx.lineTo(this.x + this.width - 5, this.y - 10); // Right ear tip
            ctx.lineTo(this.x + this.width, this.y);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 20, this.y);
            ctx.lineTo(this.x + this.width - 25, this.y - 8); // Left ear tip (slightly back)
            ctx.lineTo(this.x + this.width - 10, this.y);
            ctx.fill();

            // Tail (Bushy)
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 20);
            ctx.lineTo(this.x - 12, this.y + 15); // Tail tip up
            ctx.lineTo(this.x, this.y + 35); // Tail base
            ctx.fill();

            // Legs (Simple animation)
            ctx.fillStyle = '#4a4a4a';
            if (Math.floor(frame / 10) % 2 === 0) {
                // Legs generic 1
                ctx.fillRect(this.x + 5, this.y + this.height, 5, 5); // back
                ctx.fillRect(this.x + this.width - 15, this.y + this.height, 5, 5); // front
            } else {
                // Legs generic 2 (offset)
                ctx.fillRect(this.x + 10, this.y + this.height, 5, 5); // back
                ctx.fillRect(this.x + this.width - 20, this.y + this.height, 5, 5); // front
            }
        }

        // Eye (White)
        ctx.fillStyle = '#fff';
        if (this.isSliding) {
            ctx.fillRect(this.x + this.width - 5, this.y + 12, 3, 3);
        } else {
            ctx.fillRect(this.x + this.width - 8, this.y + 5, 3, 3);
        }
    }
}

class Cloud {
    constructor(startX) {
        this.x = startX;
        this.y = Math.random() * 100 + 20; // Random sky height
        this.width = 50;
        this.height = 20;
        this.speed = 1 + Math.random(); // Slower than game speed usually
        this.markedForDeletion = false;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -this.width) {
            this.markedForDeletion = true;
        }
        this.draw();
    }

    draw() {
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        // Simple 3-puff cloud
        ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y - 8, 18, 0, Math.PI * 2);
        ctx.arc(this.x + 30, this.y, 14, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Obstacle {
    constructor(type, x, groundY) {
        this.type = type;
        this.x = x;
        this.markedForDeletion = false;

        if (this.type === 'cactusSmall') {
            this.width = CACTUS_SMALL_WIDTH;
            this.height = CACTUS_SMALL_HEIGHT;
        } else if (this.type === 'cactusLarge') {
            this.width = CACTUS_LARGE_WIDTH;
            this.height = CACTUS_LARGE_HEIGHT;
        } else if (this.type === 'bird') {
            this.width = BIRD_WIDTH;
            this.height = BIRD_HEIGHT;
        }

        // Calculate y based on ground level
        this.y = groundY - this.height;

        // Bird flies partly in air
        if (this.type === 'bird') {
            // Randomize bird height slightly: high, mid, low
            const levels = [10, 30, 50];
            const offset = levels[Math.floor(Math.random() * levels.length)];
            this.y -= offset;
        }
    }

    update() {
        this.x -= gameSpeed;
        if (this.x < -this.width) {
            this.markedForDeletion = true;
        }
        this.draw();
    }

    draw() {
        ctx.fillStyle = '#535353';
        if (this.type === 'bird') {
            // High Detail Bird
            // Body
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 20);
            ctx.quadraticCurveTo(this.x + 10, this.y + 10, this.x + 30, this.y + 15); // Back
            ctx.lineTo(this.x + 45, this.y + 20); // Beak tip
            ctx.lineTo(this.x + 30, this.y + 25); // Neck
            ctx.lineTo(this.x + 10, this.y + 25); // Belly
            ctx.closePath();
            ctx.fill();

            // Eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 32, this.y + 16, 3, 3);
            ctx.fillStyle = '#535353';

            // Wings
            if (Math.floor(frame / 15) % 2 === 0) {
                // Wings UP
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 15);
                ctx.lineTo(this.x + 15, this.y); // Up
                ctx.lineTo(this.x + 25, this.y + 5);
                ctx.lineTo(this.x + 25, this.y + 15);
                ctx.fill();
            } else {
                // Wings DOWN
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 15);
                ctx.lineTo(this.x + 15, this.y + 35); // Down
                ctx.lineTo(this.x + 25, this.y + 30);
                ctx.lineTo(this.x + 25, this.y + 15);
                ctx.fill();
            }
        } else {
            // Textured Cacti - REFINED DESIGN
            ctx.fillStyle = '#535353';

            // Main Body
            const w = this.width;
            const h = this.height;
            const mainW = w * 0.5; // Thinner main stem for elegance
            const mainX = this.x + (w - mainW) / 2;

            // Rounded top stem
            ctx.fillRect(mainX, this.y + 3, mainW, h - 3);
            ctx.beginPath();
            ctx.arc(mainX + mainW / 2, this.y + 3, mainW / 2, Math.PI, 0);
            ctx.fill();

            // Texture (Spikes)
            ctx.fillStyle = '#fff';
            // Random-ish spike pattern
            ctx.fillRect(mainX + 1, this.y + 10, 2, 2);
            ctx.fillRect(mainX + mainW - 3, this.y + 20, 2, 2);
            ctx.fillRect(mainX + 2, this.y + 28, 2, 2);
            ctx.fillStyle = '#535353';

            if (this.type === 'cactusLarge') {
                // Arms with curved connectors
                // Left Arm
                ctx.fillRect(this.x, this.y + 20, 6, 4); // horizontal
                ctx.fillRect(this.x, this.y + 10, 6, 14); // vertical
                ctx.beginPath();
                ctx.arc(this.x + 3, this.y + 10, 3, Math.PI, 0); // round top
                ctx.fill();

                // Right Arm
                ctx.fillRect(this.x + w - 6, this.y + 25, 6, 4); // horizontal
                ctx.fillRect(this.x + w - 6, this.y + 15, 6, 14); // vertical
                ctx.beginPath();
                ctx.arc(this.x + w - 3, this.y + 15, 3, Math.PI, 0); // round top
                ctx.fill();
            } else {
                // Small cactus arms
                ctx.fillRect(this.x, this.y + 15, 4, 3);
                ctx.fillRect(this.x, this.y + 10, 4, 8);

                ctx.fillRect(this.x + w - 4, this.y + 18, 4, 3);
                ctx.fillRect(this.x + w - 4, this.y + 12, 4, 8);
            }
        }
    }
}

// --- Game Logic ---
let wolf = new Wolf();
let obstacles = [];
let clouds = [];
let spawnTimer = 0;
let initialSpawnTimer = 200;

function setup() {
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', (e) => {
        if (!isPlaying && !isGameOver) {
            resetGame();
        } else if (isGameOver) {
            resetGame();
        } else {
            wolf.jump();
        }
    });

    document.getElementById('high-score').innerText = `HI ${Math.floor(highScore).toString().padStart(5, '0')}`;
}

function resize() {
    const container = document.querySelector('.game-container');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    scaleRatio = canvas.height / LOGICAL_HEIGHT;
    ctx.setTransform(scaleRatio, 0, 0, scaleRatio, 0, 0);
    let groundY = LOGICAL_HEIGHT - 20;
    wolf.reset(groundY);
}

function resetGame() {
    isGameOver = false;
    isPlaying = true;
    score = 0;
    gameSpeed = GAME_SPEED_START;
    obstacles = [];
    clouds = []; // Clear clouds
    spawnTimer = initialSpawnTimer;
    frame = 0;

    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.remove('active');

    wolf.reset(LOGICAL_HEIGHT - 20);
    animate();
}

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!isPlaying && !isGameOver) {
            resetGame();
        } else if (isGameOver) {
            resetGame();
        } else {
            wolf.jump();
        }
    }
    if (e.code === 'ArrowDown' || e.key === 's') {
        if (isPlaying) wolf.slide(true);
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.key === 's') {
        if (isPlaying) wolf.slide(false);
    }
}

function spawnObstacle() {
    spawnTimer--;
    if (spawnTimer <= 0) {
        const typeRoll = Math.random();
        let type = 'cactusSmall';
        if (score > 100 && typeRoll > 0.6) type = 'cactusLarge';
        if (score > 300 && typeRoll > 0.8) type = 'bird';

        let groundY = LOGICAL_HEIGHT - 20;
        let spawnX = canvas.width / scaleRatio;
        if (spawnX < 800) spawnX = 800;

        let obstacle = new Obstacle(type, spawnX, groundY);
        obstacles.push(obstacle);

        const minGap = 400;
        const maxGap = 900;
        const nextGap = minGap + Math.random() * (maxGap - minGap);
        spawnTimer = nextGap / gameSpeed;
    }
}

function spawnCloud() {
    if (Math.random() < 0.005) { // Rare spawn
        let spawnX = canvas.width / scaleRatio;
        clouds.push(new Cloud(spawnX));
    }
}

function checkCollisions() {
    const padding = 10; // Extra forgiving for high detail
    const wolfHitbox = {
        x: wolf.x + padding,
        y: wolf.y + padding,
        width: wolf.width - padding * 2,
        height: wolf.height - padding * 2
    };

    for (let obs of obstacles) {
        const obsHitbox = {
            x: obs.x + padding,
            y: obs.y + padding,
            width: obs.width - padding * 2,
            height: obs.height - padding * 2
        };

        if (
            wolfHitbox.x < obsHitbox.x + obsHitbox.width &&
            wolfHitbox.x + wolfHitbox.width > obsHitbox.x &&
            wolfHitbox.y < obsHitbox.y + obsHitbox.height &&
            wolfHitbox.y + wolfHitbox.height > obsHitbox.y
        ) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    isGameOver = true;
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
    }
    document.getElementById('final-score').innerText = Math.floor(score);
    document.getElementById('high-score').innerText = `HI ${Math.floor(highScore).toString().padStart(5, '0')}`;
    document.getElementById('game-over-screen').classList.add('active');
}

function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, LOGICAL_HEIGHT - 20);
    ctx.lineTo(canvas.width / scaleRatio, LOGICAL_HEIGHT - 20);
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ground dots/texture
    ctx.fillStyle = '#535353';
    let speedOffset = (frame * gameSpeed) % (canvas.width / scaleRatio);
    for (let i = 0; i < 30; i++) {
        // Pseudo random ground texture logic
        let dotX = (i * 100) - speedOffset;
        if (dotX < 0) dotX += canvas.width / scaleRatio + 100;

        if (i % 3 === 0) ctx.fillRect(dotX, LOGICAL_HEIGHT - 15, 2, 2);
        if (i % 5 === 0) ctx.fillRect(dotX + 20, LOGICAL_HEIGHT - 10, 4, 1);
    }
}

function animate() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width / scaleRatio, canvas.height / scaleRatio);

    // Update & Draw Clouds (Back layer)
    spawnCloud();
    clouds.forEach((cloud, index) => {
        cloud.update();
        if (cloud.markedForDeletion) clouds.splice(index, 1);
    });

    drawGround();

    // Update Entities
    wolf.update();

    spawnObstacle();

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        if (obstacles[i].markedForDeletion) {
            obstacles.splice(i, 1);
        }
    }

    if (checkCollisions()) {
        gameOver();
        return;
    }

    // Score & Speed
    score += 0.1;
    gameSpeed += ACCELERATION;
    if (gameSpeed > GAME_SPEED_MAX) gameSpeed = GAME_SPEED_MAX;

    document.getElementById('current-score').innerText = Math.floor(score).toString().padStart(5, '0');
    frame++;

    if (!isGameOver) requestAnimationFrame(animate);
}

// Init
setup();
const storedHigh = localStorage.getItem('dinoHighScore');
if (storedHigh) highScore = parseFloat(storedHigh);
document.getElementById('high-score').innerText = `HI ${Math.floor(highScore).toString().padStart(5, '0')}`;
