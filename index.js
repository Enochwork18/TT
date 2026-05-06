let gameBoard, player, scoreElement, livesElement, restartBtn, nextLevelBtn, levelElement, progressElement, levelFill;
let boardWidth, boardHeight;
const playerWidth = 56;
const playerSpeed = 8;
const MAX_LEVEL = 100;
const INITIAL_LIVES = 9;
let playerX;
let score = 0;
let lives = INITIAL_LIVES;
let currentLevel = 1;
let levelScore = 0;
let stars = [];
let isGameOver = false;
let isLevelComplete = false;
let keys = {
	ArrowLeft: false,
	ArrowRight: false,
};

// Difficulty scaling based on level
function getDifficultySettings(level) {
	const progress = (level - 1) / (MAX_LEVEL - 1);
	return {
		spawnRate: Math.min(0.04 + progress * 0.08, 0.12),
		baseStarSpeed: 2 + progress * 3,
		speedVariation: 1 + progress * 2,
		badStarRatio: Math.min(0.2 + progress * 0.25, 0.45),
		scorePerStar: Math.floor(10 + progress * 40),
		starsToComplete: Math.floor(15 + progress * 20),
	};
}

function initGame() {
	gameBoard = document.getElementById('gameBoard');
	player = document.getElementById('player');
	scoreElement = document.getElementById('score');
	livesElement = document.getElementById('lives');
	restartBtn = document.getElementById('restartBtn');
	nextLevelBtn = document.getElementById('nextLevelBtn');
	levelElement = document.getElementById('level');
	progressElement = document.getElementById('progress');
	levelFill = document.getElementById('levelFill');
	
	boardWidth = gameBoard.clientWidth;
	boardHeight = gameBoard.clientHeight;
	playerX = (boardWidth - playerWidth) / 2;
	updateStats();
}

function updatePlayerPosition() {
	if (keys.ArrowLeft) playerX -= playerSpeed;
	if (keys.ArrowRight) playerX += playerSpeed;
	playerX = Math.max(8, Math.min(playerX, boardWidth - playerWidth - 8));
	player.style.left = `${playerX}px`;
}

function spawnStar() {
	const difficulty = getDifficultySettings(currentLevel);
	const star = document.createElement('div');
	star.classList.add('star');
	const isBad = Math.random() < difficulty.badStarRatio;
	if (isBad) star.classList.add('bad');
	const x = Math.random() * (boardWidth - 24);
	star.style.left = `${x}px`;
	star.style.top = `-32px`;
	star.dataset.speed = (difficulty.baseStarSpeed + Math.random() * difficulty.speedVariation).toString();
	star.dataset.bad = isBad ? 'true' : 'false';
	gameBoard.appendChild(star);
	stars.push(star);
}

function updateStars() {
	stars = stars.filter((star) => {
		const top = parseFloat(star.style.top);
		const newTop = top + parseFloat(star.dataset.speed);
		star.style.top = `${newTop}px`;
		const starRect = star.getBoundingClientRect();
		const boardRect = gameBoard.getBoundingClientRect();
		const playerRect = player.getBoundingClientRect();
		if (newTop > boardHeight) {
			gameBoard.removeChild(star);
			if (star.dataset.bad === 'false') {
				lives -= 1;
				updateStats();
			}
			return false;
		}
		if (
			starRect.left + starRect.width > playerRect.left &&
			starRect.left < playerRect.right &&
			starRect.top + starRect.height > playerRect.top &&
			starRect.top < playerRect.bottom
		) {
			if (star.dataset.bad === 'true') {
				lives -= 1;
			} else {
				const difficulty = getDifficultySettings(currentLevel);
				score += difficulty.scorePerStar;
				levelScore += difficulty.scorePerStar;
				checkLevelCompletion();
			}
			updateStats();
			gameBoard.removeChild(star);
			return false;
		}
		return true;
	});
}

function checkLevelCompletion() {
	const difficulty = getDifficultySettings(currentLevel);
	const starsCollected = Math.floor(levelScore / difficulty.scorePerStar);
	if (starsCollected >= difficulty.starsToComplete && currentLevel < MAX_LEVEL) {
		isLevelComplete = true;
		showLevelComplete();
	} else if (currentLevel === MAX_LEVEL && starsCollected >= difficulty.starsToComplete) {
		endGame(true);
	}
}

function updateStats() {
	scoreElement.textContent = score.toString();
	livesElement.textContent = lives.toString();
	levelElement.textContent = currentLevel.toString();
	
	const difficulty = getDifficultySettings(currentLevel);
	const starsCollected = Math.floor(levelScore / difficulty.scorePerStar);
	const progress = Math.min((starsCollected / difficulty.starsToComplete) * 100, 100);
	progressElement.textContent = Math.floor(progress).toString();
	levelFill.style.width = progress + '%';
	
	if (lives <= 0) endGame(false);
}

function endGame(won) {
	isGameOver = true;
	const overlay = document.createElement('div');
	overlay.className = 'game-over';
	if (won) {
		overlay.innerHTML = `<div><h2>🎉 You Won! 🎉</h2><p>You completed all 100 levels!</p><p>Final Score: ${score}</p><p>Press Restart to play again.</p></div>`;
	} else {
		overlay.innerHTML = `<div><h2>Game Over</h2><p>Level: ${currentLevel}/100</p><p>Your score: ${score}</p><p>Press Restart to play again.</p></div>`;
	}
	gameBoard.appendChild(overlay);
	nextLevelBtn.style.display = 'none';
}

function showLevelComplete() {
	const overlay = document.createElement('div');
	overlay.className = 'level-complete';
	overlay.innerHTML = `<div><h2>Level ${currentLevel} Complete!</h2><p>Score: ${score}</p><p>Click Next Level to continue.</p></div>`;
	gameBoard.appendChild(overlay);
	nextLevelBtn.style.display = 'inline-block';
}

function clearStars() {
	stars.forEach((star) => {
		if (gameBoard.contains(star)) gameBoard.removeChild(star);
	});
	stars = [];
}

function resetGame() {
	isGameOver = false;
	isLevelComplete = false;
	score = 0;
	lives = INITIAL_LIVES;
	currentLevel = 1;
	levelScore = 0;
	updateStats();
	clearStars();
	const overlay = gameBoard.querySelector('.game-over');
	if (overlay) gameBoard.removeChild(overlay);
	const levelOverlay = gameBoard.querySelector('.level-complete');
	if (levelOverlay) gameBoard.removeChild(levelOverlay);
	nextLevelBtn.style.display = 'none';
}

function nextLevel() {
	if (currentLevel < MAX_LEVEL) {
		currentLevel++;
		levelScore = 0;
		isLevelComplete = false;
		clearStars();
		const levelOverlay = gameBoard.querySelector('.level-complete');
		if (levelOverlay) gameBoard.removeChild(levelOverlay);
		updateStats();
		nextLevelBtn.style.display = 'none';
	}
}

function gameLoop() {
	if (!isGameOver && !isLevelComplete) {
		updatePlayerPosition();
		updateStars();
		const difficulty = getDifficultySettings(currentLevel);
		if (Math.random() < difficulty.spawnRate) spawnStar();
	}
	requestAnimationFrame(gameLoop);
}

function startGame() {
	initGame();
	window.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			keys[event.key] = true;
			event.preventDefault();
		}
	});

	window.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			keys[event.key] = false;
			event.preventDefault();
		}
	});

	restartBtn.addEventListener('click', () => {
		resetGame();
	});

	nextLevelBtn.addEventListener('click', () => {
		nextLevel();
	});

	resetGame();
	requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', startGame);
