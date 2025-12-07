// --- Game Elements ---
const gameContainer = document.querySelector('.game-container');
const player = document.getElementById('player');
const girl = document.getElementById('girl');
const parachute = document.getElementById('parachute');
const scoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');
const coinCountDisplay = document.getElementById('coin-count');
const badgeArea = document.getElementById('badge-area');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreText = document.getElementById('final-score');
const girlReactionText = document.getElementById('girl-reaction');

// --- Game State ---
let score = 0;
let coinCount = 0;
let highScore = parseInt(localStorage.getItem('skyFlyerHighScore') || '0', 10);
highScoreDisplay.textContent = highScore;
coinCountDisplay.textContent = coinCount;

let gameRunning = true;

const gameWidth = gameContainer.clientWidth;
const gameHeight = gameContainer.clientHeight;

// Player size from DOM
const playerWidth = player.offsetWidth;
const playerHeight = player.offsetHeight;

// Player starting position
let playerX = (gameWidth - playerWidth) / 2;
let playerY = (gameHeight - playerHeight) / 2;
player.style.left = `${playerX}px`;
player.style.top = `${playerY}px`;

// Arrays to track objects
let obstacles = []; // { el, x, y }
let coins = [];     // { el, x, y }

// Spawn timing
let lastObstacleSpawn = 0;
let lastCoinSpawn = 0;
const obstacleSpawnInterval = 900; // ms
const coinSpawnInterval = 700;     // ms

// Speeds
const obstacleSpeed = 3;
const coinSpeed = 2.5;
const baseCoinScoreValue = 10;

// --- Badges ---
const badges = {
    50: '⭐ Star Flyer',
    100: '🏅 Cloud Skipper',
    250: '🏆 Sky Champion',
};

function updateBadges(currentScore) {
    let earnedBadges = '';
    for (const t in badges) {
        if (currentScore >= t) {
            earnedBadges += badges[t] + ' ';
        }
    }
    badgeArea.innerHTML = earnedBadges;
}

// --- Player Movement (Mouse) ---
gameContainer.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;

    const rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left - playerWidth / 2;
    let y = e.clientY - rect.top - playerHeight / 2;

    // Clamp inside container
    x = Math.max(0, Math.min(x, gameWidth - playerWidth));
    y = Math.max(0, Math.min(y, gameHeight - playerHeight));

    playerX = x;
    playerY = y;

    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
});

// --- Create Obstacle (cement block from top only) ---
function createObstacle() {
    if (!gameRunning) return;

    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');

    const width = 70;
    const height = 30;

    const x = Math.random() * (gameWidth - width);
    const y = -height; // just above view

    obstacle.style.left = `${x}px`;
    obstacle.style.top = `${y}px`;

    gameContainer.appendChild(obstacle);

    obstacles.push({ el: obstacle, x, y });
}

// --- Create Coin (normal + power coins from top only) ---
function createCoin() {
    if (!gameRunning) return;

    const coin = document.createElement('div');
    coin.classList.add('coin');

    const width = 40;
    const height = 40;

    const x = Math.random() * (gameWidth - width);
    const y = -height;

    // Decide coin type: normal, double, triple
    const r = Math.random();
    let multiplier = 1;

    if (r < 0.15) {
        // 15% chance – triple coin
        multiplier = 3;
        coin.classList.add('triple-coin');
        coin.textContent = '⭐';   // triple coin
    } else if (r < 0.40) {
        // next 25% – double coin
        multiplier = 2;
        coin.classList.add('double-coin');
        coin.textContent = '💎';   // double coin
    } else {
        // normal coin
        multiplier = 1;
        coin.classList.add('normal-coin');
        coin.textContent = '🪙';
    }

    coin.dataset.multiplier = multiplier.toString();

    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;

    gameContainer.appendChild(coin);

    coins.push({ el: coin, x, y });
}

// --- End Game ---
function endGame() {
    if (!gameRunning) return;
    gameRunning = false;

    const finalScore = Math.floor(score);

    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('skyFlyerHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    finalScoreText.textContent = `Your Score: ${finalScore} | Coins: ${coinCount}`;

    if (finalScore < 50) {
        girl.textContent = '😭';
        girlReactionText.textContent =
            "Oh no! We fell too soon. Let's try again for a higher score!";
    } else if (finalScore < 150) {
        girl.textContent = '😟';
        girlReactionText.textContent =
            "That was a good run, but we can fly higher than that! Keep going!";
    } else {
        girl.textContent = '😃';
        girlReactionText.textContent =
            "Wow! You're an amazing pilot, TISHA! That's a fantastic score!";
    }

    gameOverScreen.classList.remove('hidden');
}

// --- Rect overlap using DOM bounding boxes ---
function rectsOverlap(r1, r2) {
    return !(
        r1.right <= r2.left ||
        r1.left >= r2.right ||
        r1.bottom <= r2.top ||
        r1.top >= r2.bottom
    );
}

// --- Main Game Loop ---
function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Spawn obstacles from top
    if (timestamp - lastObstacleSpawn > obstacleSpawnInterval) {
        createObstacle();
        lastObstacleSpawn = timestamp;
    }

    // Spawn coins from top
    if (timestamp - lastCoinSpawn > coinSpawnInterval) {
        createCoin();
        lastCoinSpawn = timestamp;
    }

    // Move obstacles down
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += obstacleSpeed;
        o.el.style.top = `${o.y}px`;

        if (o.y > gameHeight) {
            o.el.remove();
            obstacles.splice(i, 1);
        }
    }

    // Move coins down
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.y += coinSpeed;
        c.el.style.top = `${c.y}px`;

        if (c.y > gameHeight) {
            c.el.remove();
            coins.splice(i, 1);
        }
    }

    // Update score over time
    score += 0.08;
    const intScore = Math.floor(score);
    scoreDisplay.textContent = intScore;
    updateBadges(intScore);

    // Use ONLY the parachute's bounding box for collisions
    const parachuteRect = parachute.getBoundingClientRect();

    // Collision with obstacles → Game Over ONLY if parachute touches
    for (let i = 0; i < obstacles.length; i++) {
        const oRect = obstacles[i].el.getBoundingClientRect();
        if (rectsOverlap(parachuteRect, oRect)) {
            endGame();
            break;
        }
    }

    // Collision with coins → collect if parachute touches
    for (let i = coins.length - 1; i >= 0; i--) {
        const cRect = coins[i].el.getBoundingClientRect();
        if (rectsOverlap(parachuteRect, cRect)) {
            const coinEl = coins[i].el;
            const multiplier = parseInt(coinEl.dataset.multiplier || '1', 10);

            // Score & coin count scale with multiplier
            score += baseCoinScoreValue * multiplier;
            coinCount += multiplier;

            scoreDisplay.textContent = Math.floor(score);
            coinCountDisplay.textContent = coinCount;

            coinEl.remove();
            coins.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// --- Start the Game ---
requestAnimationFrame(gameLoop);
