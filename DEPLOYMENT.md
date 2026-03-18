# GitHub Pages Deployment Guide

## Setup Instructions

### 1. Enable GitHub Pages on Your Repository

1. Go to your GitHub repository: https://github.com/Chargou/HexTacToe
2. Click on **Settings** (gear icon)
3. Scroll down to **Pages** section
4. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**

Your site will be published at: **https://chargou.github.io/HexTacToe/**

### 2. What's Included

The website includes:

- **Homepage** (`index.html`) - Game creation and joining interface
- **Game Page** (`game.html`) - In-game hexagonal grid interface
- **Stylesheets** (`assets/`) - Modern CSS styling
- **JavaScript Logic** (`assets/`) - Game mechanics and interactions
- **Configuration** (`_config.yml`) - Jekyll configuration for GitHub Pages

### 3. Local Development

To test locally before deploying:

```bash
# Option 1: Using Python (Python 3)
python -m http.server 8000

# Option 2: Using Node.js
npx http-server

# Option 3: Using Ruby
ruby -run -ehttpd . -p8000
```

Then open: http://localhost:8000

### 4. File Structure

```
HexTacToe/
├── index.html              # Homepage (entry point)
├── game.html               # Game page
├── _config.yml             # Jekyll configuration
├── .gitignore
├── README.md
├── TODO
└── assets/
    ├── styles.css          # Global styles
    ├── home.css            # Homepage styles
    ├── game.css            # Game page styles
    ├── home.js             # Homepage logic
    ├── game.js             # Game logic
    └── hex-utils.js        # Hexagon utilities
```

### 5. Current Implementation Status

✅ **Completed:**
- Homepage with game creation/joining interface
- Hexagonal grid utilities
- Game board rendering
- Player turn management
- Local game storage (localStorage)

🔄 **Next Steps:**
- Backend API integration for persistent storage
- Real-time multiplayer synchronization
- User authentication system
- Game history and statistics
- Public game listings

## Troubleshooting

### Site not showing up?
- Wait 1-2 minutes for GitHub Pages to build
- Check that index.html is in the root directory
- Verify branch is set to `main` in Settings

### CSS/JS not loading?
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for 404 errors
- Ensure all file paths are relative and correct

### Form not working?
- Games are stored in browser localStorage
- Clear localStorage if you want fresh games: Open DevTools → Console → `localStorage.clear()`

## Deployment Checklist

- [x] Create homepage with username and game code input
- [ ] Create backend API for game management
- [ ] Set up database for persistent storage
- [ ] Implement real-time synchronization (WebSockets)
- [ ] Add user authentication
- [ ] Deploy to production

## Custom Domain (Optional)

To use a custom domain:

1. Add `CNAME` file to repo root with your domain
2. Update DNS records with GitHub's servers
3. Enable HTTPS in repository settings

See [GitHub documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.
