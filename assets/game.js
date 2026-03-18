/**
 * HexTacToe Game Logic
 * Main game controller for gameplay
 */

class HexTacToeGame {
    constructor() {
        this.gameCode = this.getQueryParam('code');
        this.username = decodeURIComponent(this.getQueryParam('username'));
        this.currentPlayer = null;
        this.gameData = null;
        this.board = [];
        this.moveCount = 0;
        this.maxMovesPerTurn = 2;
        this.gameActive = false;
        this.turnTimer = null;
        this.timeRemaining = 60;

        this.initializeElements();
        this.loadGameData();
        this.setupEventListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.gameCodeEl = document.getElementById('gameCode');
        this.blueNameEl = document.getElementById('blueName');
        this.redNameEl = document.getElementById('redName');
        this.currentPlayerEl = document.getElementById('currentPlayer');
        this.turnTimerEl = document.getElementById('turnTimer');
        this.moveCounterEl = document.getElementById('moveCounter');
        this.gameStatusEl = document.getElementById('gameStatus');
        this.statusBoxEl = document.getElementById('statusBox');
        this.gameOverModalEl = document.getElementById('gameOverModal');
        this.gameOverTitleEl = document.getElementById('gameOverTitle');
        this.gameOverMessageEl = document.getElementById('gameOverMessage');
        this.forfeitBtn = document.getElementById('forfeitBtn');

        this.canvas = document.getElementById('hexCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.forfeitBtn.addEventListener('click', () => this.forfeitGame());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Start button
        const startBtn = document.getElementById('startBtn');
        console.log('[DEBUG] Setting up event listeners, startBtn:', startBtn);
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('[DEBUG] Start button clicked!');
                this.startGame();
            });
            console.log('[DEBUG] Start button listener attached');
        } else {
            console.log('[DEBUG] WARNING: Start button not found');
        }
    }

    /**
     * Get query parameter from URL
     */
    getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param) || '';
    }

    /**
     * Load game data from localStorage
     */
    loadGameData() {
        if (!this.gameCode) {
            this.showStatus('Invalid game code', 'error');
            return;
        }

        const gameDataStr = localStorage.getItem(`game_${this.gameCode}`);
        if (!gameDataStr) {
            this.showStatus('Game not found', 'error');
            return;
        }

        this.gameData = JSON.parse(gameDataStr);
        this.displayGameInfo();
        this.initializeBoard();
        this.render();

        // Start game update loop
        this.startGameLoop();
    }

    /**
     * Display game information
     */
    displayGameInfo() {
        this.gameCodeEl.textContent = this.gameCode;
        
        if (this.gameData.players[0]) {
            this.blueNameEl.textContent = this.gameData.players[0].username;
        }
        
        if (this.gameData.players[1]) {
            this.redNameEl.textContent = this.gameData.players[1].username;
        }

        // Determine current player
        console.log('[DEBUG] displayGameInfo - status:', this.gameData.status);
        
        if (this.gameData.status === 'WAITING_FOR_PLAYER') {
            this.showStatus('Waiting for second player to join...', 'info');
            this.gameActive = false;
            this.hideStartButton();
        } else if (this.gameData.status === 'WAITING_FOR_START') {
            this.showStatus('Game ready! Both players are here. Click "Start Game" to begin!', 'success');
            this.gameActive = false;
            this.showStartButton();
        } else if (this.gameData.status === 'IN_PROGRESS') {
            this.gameActive = true;
            this.currentPlayer = this.gameData.players[this.gameData.currentTurnId];
            this.updateTurnDisplay();
            this.startTurnTimer();
            this.hideStartButton();
            console.log('[DEBUG] Game is IN_PROGRESS, gameActive set to true');
        } else if (this.gameData.status === 'FINISHED') {
            this.gameActive = false;
            this.hideStartButton();
            this.showGameOver();
        }
    }

    /**
     * Initialize the game board
     */
    initializeBoard() {
        this.board = this.gameData.board || [];
    }

    /**
     * Render the game board
     */
    render() {
        this.clearCanvas();
        this.drawHexGrid();
        this.drawPieces();
    }

    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = '#1a1f3a';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    /**
     * Draw the hexagonal grid
     */
    drawHexGrid() {
        // Draw centered hex grid
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Draw grid lines
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const hex = { q, r };
                const pixel = HexUtils.axialToPixel(hex, centerX, centerY);

                // Draw hex outline
                this.drawHexOutline(pixel.x, pixel.y);
            }
        }
    }

    /**
     * Draw a hex outline
     */
    drawHexOutline(x, y) {
        const size = HexUtils.HEX_SIZE;
        const angle = Math.PI / 3; // 60 degrees

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const rad = angle * i;
            const px = x + size * Math.cos(rad);
            const py = y + size * Math.sin(rad);
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    /**
     * Draw pieces on the board
     */
    drawPieces() {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        for (const hex of this.board) {
            const pixel = HexUtils.axialToPixel(hex, centerX, centerY);
            const color = hex.player === 'BLUE' ? '#3b82f6' : '#ef4444';
            
            this.drawHexFill(pixel.x, pixel.y, color);
        }
    }

    /**
     * Draw a filled hex
     */
    drawHexFill(x, y, color) {
        const size = HexUtils.HEX_SIZE * 0.8;
        const angle = Math.PI / 3; // 60 degrees

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const rad = angle * i;
            const px = x + size * Math.cos(rad);
            const py = y + size * Math.sin(rad);
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Add border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Handle canvas click
     */
    handleCanvasClick(event) {
        if (!this.gameActive) {
            this.showStatus('Game is not active', 'error');
            return;
        }

        // Check if it's the current player's turn
        if (this.currentPlayer.username !== this.username) {
            this.showStatus('It is not your turn', 'error');
            return;
        }

        // Get click position
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Convert to hex coordinates
        const hex = HexUtils.pixelToAxial(x, y, centerX, centerY);

        // Check if hex is already occupied
        if (HexUtils.getBoardHex(this.board, hex) !== null) {
            this.showStatus('Hex already occupied', 'error');
            return;
        }

        // Place piece
        this.placeHex(hex);
    }

    /**
     * Place a hex on the board
     */
    placeHex(hex) {
        // Add to board
        this.board.push({
            q: hex.q,
            r: hex.r,
            player: this.currentPlayer.symbol
        });

        this.moveCount++;
        this.updateMoveCounter();

        // Check if this is a winning move
        if (HexUtils.isWinningMove(this.board, hex, this.currentPlayer.symbol)) {
            this.endGame(this.currentPlayer);
            return;
        }

        // Check if turn is over
        if (this.moveCount >= this.maxMovesPerTurn) {
            this.endTurn();
        }

        // Update game data
        this.gameData.board = this.board;
        localStorage.setItem(`game_${this.gameCode}`, JSON.stringify(this.gameData));

        this.render();
    }

    /**
     * Update move counter display
     */
    updateMoveCounter() {
        this.moveCounterEl.textContent = `${this.moveCount}/${this.maxMovesPerTurn}`;
    }

    /**
     * Update turn display
     */
    updateTurnDisplay() {
        this.currentPlayerEl.textContent = this.currentPlayer.symbol;
        this.moveCount = 0;
        this.updateMoveCounter();
    }

    /**
     * Start turn timer
     */
    startTurnTimer() {
        this.timeRemaining = 60;
        this.updateTimerDisplay();

        if (this.turnTimer) {
            clearInterval(this.turnTimer);
        }

        this.turnTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.timeout();
            }
        }, 1000);
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        this.turnTimerEl.textContent = `${this.timeRemaining}s`;
        
        if (this.timeRemaining <= 10) {
            this.turnTimerEl.classList.add('critical');
        } else if (this.timeRemaining <= 30) {
            this.turnTimerEl.classList.add('warning');
        } else {
            this.turnTimerEl.classList.remove('warning', 'critical');
        }
    }

    /**
     * End current turn
     */
    endTurn() {
        // Switch to next player
        this.gameData.currentTurnId = 1 - this.gameData.currentTurnId;
        this.currentPlayer = this.gameData.players[this.gameData.currentTurnId];
        this.updateTurnDisplay();
        this.startTurnTimer();

        // Update game data
        localStorage.setItem(`game_${this.gameCode}`, JSON.stringify(this.gameData));
    }

    /**
     * Handle turn timeout
     */
    timeout() {
        clearInterval(this.turnTimer);
        this.showStatus('Time is up! Skipping turn...', 'warning');
        setTimeout(() => this.endTurn(), 2000);
    }

    /**
     * End game
     */
    endGame(winner) {
        this.gameActive = false;
        clearInterval(this.turnTimer);

        this.gameData.status = 'FINISHED';
        this.gameData.winner = winner.username;
        localStorage.setItem(`game_${this.gameCode}`, JSON.stringify(this.gameData));

        this.showGameOver(winner);
    }

    /**
     * Show game over modal
     */
    showGameOver(winner = null) {
        if (winner && winner.username === this.username) {
            this.gameOverTitleEl.textContent = '🎉 You Won!';
            this.gameOverMessageEl.textContent = `Congratulations, ${winner.username}! You successfully got 6 hexes in a row!`;
        } else if (winner) {
            this.gameOverTitleEl.textContent = 'Game Over';
            this.gameOverMessageEl.textContent = `${winner.username} won the game!`;
        } else {
            this.gameOverTitleEl.textContent = 'Game Forfeited';
            this.gameOverMessageEl.textContent = 'The other player has forfeited.';
        }

        this.gameOverModalEl.classList.remove('hidden');
    }

    /**
     * Forfeit the game
     */
    forfeitGame() {
        if (confirm('Are you sure you want to forfeit? This cannot be undone.')) {
            this.gameActive = false;
            clearInterval(this.turnTimer);

            this.gameData.status = 'FINISHED';
            this.gameData.winner = this.gameData.players.find(p => p.username !== this.username).username;
            localStorage.setItem(`game_${this.gameCode}`, JSON.stringify(this.gameData));

            this.showGameOver();
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.gameStatusEl.textContent = message;
        this.statusBoxEl.className = `status-box ${type}`;
    }

    /**
     * Show start button
     */
    showStartButton() {
        const container = document.getElementById('startButtonContainer');
        console.log('[DEBUG] showStartButton called, container:', container);
        if (container) {
            container.classList.remove('hidden');
            console.log('[DEBUG] Start button shown, hidden class removed');
        } else {
            console.log('[DEBUG] WARNING: startButtonContainer not found');
        }
    }

    /**
     * Hide start button
     */
    hideStartButton() {
        const container = document.getElementById('startButtonContainer');
        console.log('[DEBUG] hideStartButton called');
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Start the game
     */
    startGame() {
        console.log('[DEBUG] Start game clicked');
        this.gameData.status = 'IN_PROGRESS';
        this.gameData.currentTurnId = 0; // Blue player starts
        
        // Save to localStorage
        localStorage.setItem(`game_${this.gameCode}`, JSON.stringify(this.gameData));
        console.log('[DEBUG] Game started, status:', this.gameData.status);
        
        // Update UI immediately
        this.displayGameInfo();
        this.render();
        
        // Provide feedback to user
        this.showStatus('Game has started!', 'success');
    }

    /**
     * Start game update loop
     */
    startGameLoop() {
        setInterval(() => {
            if (!this.gameCode) return;

            // Check for updates to game data  
            const gameDataStr = localStorage.getItem(`game_${this.gameCode}`);
            if (gameDataStr) {
                const updatedData = JSON.parse(gameDataStr);
                
                // Always update the full game data to ensure sync
                const dataChanged = JSON.stringify(updatedData) !== JSON.stringify(this.gameData);
                
                if (dataChanged) {
                    console.log('[DEBUG] Game data updated, old status:', this.gameData.status, 'new status:', updatedData.status);
                    this.gameData = updatedData;
                    this.board = updatedData.board || [];
                    this.displayGameInfo();
                    this.render();
                }
            }
        }, 500);
    }
}

/**
 * Copy game code to clipboard
 */
function copyGameCode() {
    const gameCode = document.getElementById('gameCode').textContent;
    navigator.clipboard.writeText(gameCode).then(() => {
        alert('Game code copied to clipboard!');
    });
}

// Initialize game on page load
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new HexTacToeGame();
});
