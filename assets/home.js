/**
 * HexTacToe Home Page Logic
 * Handles game creation and joining
 */

class GameManager {
    constructor() {
        this.form = document.getElementById('gameForm');
        this.usernameInput = document.getElementById('username');
        this.gameCodeInput = document.getElementById('gameCode');
        this.submitBtn = document.getElementById('submitBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.charCount = document.getElementById('charCount');
        this.btnText = document.getElementById('btnText');

        this.initializeEventListeners();
        this.loadLocalStorage();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.usernameInput.addEventListener('input', (e) => this.handleUsernameInput(e));
        this.gameCodeInput.addEventListener('input', (e) => this.handleGameCodeInput(e));
        this.gameCodeInput.addEventListener('change', (e) => this.handleGameCodeChange(e));
    }

    /**
     * Handle username input - update character counter
     */
    handleUsernameInput(event) {
        const username = event.target.value;
        this.charCount.textContent = username.length;
        this.clearStatus();
    }

    /**
     * Handle game code input - format to uppercase
     */
    handleGameCodeInput(event) {
        event.target.value = event.target.value.toUpperCase();
        this.clearStatus();
    }

    /**
     * Handle game code change - determine if creating or joining
     */
    handleGameCodeChange(event) {
        const gameCode = event.target.value.trim();
        if (gameCode.length > 0) {
            this.btnText.textContent = 'Join Game';
        } else {
            this.btnText.textContent = 'Start Playing';
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();

        const username = this.usernameInput.value.trim();
        const gameCode = this.gameCodeInput.value.trim();

        // Validation
        if (!username) {
            this.showStatus('Please enter a username', 'error');
            this.usernameInput.focus();
            return;
        }

        if (username.length < 2) {
            this.showStatus('Username must be at least 2 characters', 'error');
            return;
        }

        // Disable button and show loading state
        this.submitBtn.disabled = true;
        this.submitBtn.classList.add('loading');

        try {
            if (gameCode.length === 0) {
                // Create new game
                await this.createNewGame(username);
            } else {
                // Join existing game
                await this.joinExistingGame(username, gameCode);
            }
        } catch (error) {
            this.showStatus(error.message || 'An error occurred', 'error');
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('loading');
        }
    }

    /**
     * Create a new game
     */
    async createNewGame(username) {
        try {
            // Generate a game code (6 alphanumeric characters)
            const gameCode = this.generateGameCode();

            // Save to localStorage (for now - will be replaced with backend)
            const gameData = {
                gameCode: gameCode,
                players: [
                    {
                        username: username,
                        isHost: true,
                        symbol: 'BLUE', // First player is Blue
                        timestamp: Date.now()
                    }
                ],
                status: 'WAITING_FOR_PLAYER',
                createdAt: Date.now(),
                board: [], // Initialize empty board
                currentTurnId: null,
                winner: null
            };

            localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameData));
            localStorage.setItem('lastGameCode', gameCode);
            localStorage.setItem('currentUsername', username);

            this.showStatus(`Game created! Code: ${gameCode}`, 'success');
            
            // Redirect to game page after short delay
            setTimeout(() => {
                window.location.href = `game.html?code=${gameCode}&username=${encodeURIComponent(username)}`;
            }, 1000);

        } catch (error) {
            throw new Error('Failed to create game: ' + error.message);
        }
    }

    /**
     * Join an existing game
     */
    async joinExistingGame(username, gameCode) {
        try {
            // Check if game exists (from localStorage for now)
            const gameDataStr = localStorage.getItem(`game_${gameCode}`);
            
            if (!gameDataStr) {
                throw new Error(`Game code "${gameCode}" not found`);
            }

            const gameData = JSON.parse(gameDataStr);

            // Check if game is full
            if (gameData.players.length >= 2) {
                throw new Error('This game already has 2 players. You can spectate instead.');
            }

            // Check if username is already in game
            const userExists = gameData.players.some(p => p.username === username);
            if (userExists) {
                throw new Error('You are already in this game');
            }

            // Add player to game
            gameData.players.push({
                username: username,
                isHost: false,
                symbol: 'RED', // Second player is Red
                timestamp: Date.now()
            });

            gameData.status = 'WAITING_FOR_START';
            gameData.currentTurnId = 0; // Blue player starts

            localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameData));
            localStorage.setItem('lastGameCode', gameCode);
            localStorage.setItem('currentUsername', username);

            this.showStatus(`Joined game ${gameCode}!`, 'success');

            // Redirect to game page after short delay
            setTimeout(() => {
                window.location.href = `game.html?code=${gameCode}&username=${encodeURIComponent(username)}`;
            }, 1000);

        } catch (error) {
            throw new Error(error.message);
        }
    }

    /**
     * Generate a random game code
     */
    generateGameCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
    }

    /**
     * Clear status message
     */
    clearStatus() {
        this.statusMessage.textContent = '';
        this.statusMessage.className = 'status-message';
        this.statusMessage.style.display = 'none';
    }

    /**
     * Load last used username from localStorage
     */
    loadLocalStorage() {
        const lastUsername = localStorage.getItem('currentUsername');
        if (lastUsername) {
            this.usernameInput.value = lastUsername;
            this.charCount.textContent = lastUsername.length;
        }
    }

    /**
     * Populate public games list (for future implementation)
     */
    loadPublicGames() {
        // This will be implemented when backend is ready
        // For now, games are stored in localStorage
        const gamesList = document.getElementById('gamesList');
        const publicGamesSection = document.getElementById('publicGamesSection');

        // Get all games from localStorage
        const games = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('game_')) {
                const gameData = JSON.parse(localStorage.getItem(key));
                if (gameData.status === 'WAITING_FOR_PLAYER') {
                    games.push({
                        code: gameData.gameCode,
                        hostName: gameData.players[0].username,
                        playersCount: gameData.players.length,
                        createdAt: gameData.createdAt
                    });
                }
            }
        }

        if (games.length > 0) {
            publicGamesSection.classList.remove('hidden');
            gamesList.innerHTML = games.map(game => `
                <div class="game-card" onclick="gameManager.quickJoin('${game.code}')">
                    <div class="game-card-header">
                        <span class="game-card-code">#${game.code}</span>
                        <span class="game-card-status">WAITING</span>
                    </div>
                    <div class="game-card-players">
                        Host: <strong>${this.escapeHtml(game.hostName)}</strong> · Players: ${game.playersCount}/2
                    </div>
                </div>
            `).join('');
        } else {
            gamesList.innerHTML = '<p class="no-games">No public games available right now</p>';
        }
    }

    /**
     * Quick join a game from the public list
     */
    quickJoin(gameCode) {
        this.gameCodeInput.value = gameCode;
        this.btnText.textContent = 'Join Game';
        this.usernameInput.focus();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize on page load
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameManager();
    // Load and display public games
    gameManager.loadPublicGames();
});
