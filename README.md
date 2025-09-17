# 9x9 Tic-Tac Game (Ultimate Tic-Tac-Toe)

A comprehensive web-based implementation of the 9x9 Tic-Tac game (Ultimate Tic-Tac-Toe) featuring advanced AI, comprehensive game features, and a clean, modern design.

## 🎮 Play Online

You can play the game live here: [9x9 Tic-Tac Game](https://stratamind.github.io/9x9-Tic-Tac-game/)

## 🎯 Objective

Win the main 3x3 board by winning any three mini-games in a row, column, or diagonal—similar to traditional Tic-Tac-Toe, but at a macro level.

## 🧩 Board Structure

- The game consists of a main 3x3 grid (the **main board**).
- Each cell in the main board contains its own inner 3x3 Tic-Tac-Toe grid (a **mini-board**).
- There are 9 mini-boards in total.

## 🎮 Game Modes

### Player vs Player
- Classic two-player mode where players take turns
- Perfect for local multiplayer gaming

### Player vs Computer
Choose from three AI difficulty levels:
- **Easy:** Random moves for casual gameplay
- **Medium:** Tactical moves with 60% strategic decision making
- **Hard:** Advanced AI with lookahead algorithms and strategic planning

## 🕹️ How to Play

1. **Initial Move:**
   - The first player (Player X) can choose to play in any cell of any mini-board.

2. **Move Restriction Rule:**
   - From the second move onward, the allowed mini-board(s) for the next player are determined by the position of the **mini-board** just played in.
   - **Rule Logic:** If the last move was made in mini-board at `(row=r, col=c)`, then the valid next mini-boards are all mini-boards in row `r` AND all mini-boards in column `c`.
     - *Example:* If Player X plays in the top-center mini-board (t2), Player O must play in any of the mini-boards in the top row (t1, t2, t3) OR the center column (t2, m2, b2). Allowed: t1, t2, t3, m2, b2.
     - *Center Exception:* If a player plays in the center mini-board (m2), the next player can play in *any* available mini-board.

3. **Mini-Board Win:**
   - A mini-board is won if a player places three of their symbols (X or O) in a row, column, or diagonal within that mini-board.
   - A line is drawn over the winning combination.
   - Once a mini-board is won, its win status is fixed. No further lines are drawn even if other winning combinations are formed later.

4. **Playable Cells in a Won Mini-Board:**
   - If a player wins a mini-board but there are still empty cells remaining in it, the opponent (and the winner) can still play in those empty cells if directed there by the move restriction rule. The mini-board just doesn't get "locked" but its "won" status remains.

5. **Fallback Rule for Full/Won Zones (Row-Priority Fallback):**
   - If all valid mini-boards (based on the standard move restriction) are completely filled (regardless of win status), the next move follows this priority for choosing an available (not full) mini-board:
     1. Top Row (t1–t3)
     2. Middle Row (m1–m3)
     3. Bottom Row (b1–b3)

6. **Game Victory:**
   - A player wins the full game if they win 3 mini-boards in a line (horizontal, vertical, or diagonal) on the main board.

7. **Draw Condition:**
   - If all mini-boards are filled and no player has won the main board, the game results in a draw.

## ✨ Advanced Features

### 🧠 Enhanced AI System
- **Three Difficulty Levels:** Easy, Medium, and Hard
- **Strategic Gameplay:** AI uses advanced algorithms for challenging gameplay
- **Natural Progression:** From random moves to complex strategic planning

### ⏱️ Timer System
- **Configurable Timer:** Set move time from 10-60 seconds
- **Visual Progress Bar:** Real-time countdown with visual feedback
- **Optional Setting:** Enable/disable timer as needed

### 🔄 Undo/Redo Functionality
- **Complete Game State Management:** Undo any number of moves
- **Redo Support:** Redo undone moves
- **Smart History:** Maintains game state integrity

### 📊 Statistics Tracking
- **Persistent Statistics:** Games played, wins, losses, draws
- **Win Rate Calculation:** Track performance over time
- **Average Game Time:** Monitor game duration
- **Local Storage:** Statistics persist between sessions

### 🎵 Audio Experience
- **Sound Effects:** Move sounds and win celebrations
- **Audio Feedback:** Enhanced user experience
- **Browser Compatible:** Works across all modern browsers

### 🎨 Modern Design
- **Clean Geometric Background:** Beautiful radial gradient pattern
- **Simple Color Scheme:** Professional blue-grey and peach palette
- **Responsive Design:** Perfect on desktop and mobile
- **Accessibility:** High contrast and readable typography

### 📱 User Interface
- **Game Rules Overlay:** Complete rules documentation in-game
- **Statistics Dashboard:** Detailed performance metrics
- **Intuitive Controls:** Easy-to-use interface
- **Mobile Optimized:** Touch-friendly design

## 🚀 Setup Instructions

### Quick Start
1. Clone this repository:
   ```bash
   git clone https://github.com/StrataMind/9x9-Tic-Tac-game.git
   ```
2. Navigate to the project directory:
   ```bash
   cd 9x9-Tic-Tac-game
   ```
3. Open `index.html` in any modern web browser
4. Start playing immediately!

### Development Setup
No build process required! The game uses vanilla HTML, CSS, and JavaScript.

**Required Files:**
- `index.html` - Main game page
- `styles.css` - All styling and animations
- `script.js` - Game logic and AI system

## 🛠️ Technologies Used

- **HTML5:** Semantic structure and accessibility
- **CSS3:** Modern styling with CSS Grid, Flexbox, and animations
- **JavaScript (ES6+):** Game logic, AI algorithms, and DOM manipulation
- **Google Analytics:** User analytics and insights
- **Font Awesome:** Icons and visual elements

## 📈 Analytics

This game includes Google Analytics (gtag.js) to track:
- Game sessions and user engagement
- Feature usage statistics
- Performance metrics
- User experience insights

**Privacy:** All analytics comply with standard privacy practices. No personal information is collected.

## 🌐 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Performance Features

- **Lightweight:** Fast loading and smooth gameplay
- **Responsive:** Adapts to all screen sizes
- **Optimized:** Efficient algorithms and minimal resource usage
- **Accessible:** WCAG compliant design

## 🔧 Configuration Options

The game includes several customizable settings:

- **AI Difficulty:** Easy, Medium, Hard
- **Timer Settings:** 10-60 seconds per move
- **Sound Effects:** Enable/disable audio
- **Game Mode:** Player vs Player or Player vs Computer

## 📝 Version History

### Latest Updates
- **Enhanced AI System:** Three difficulty levels with strategic gameplay
- **Timer Functionality:** Configurable move timers with visual feedback
- **Undo/Redo System:** Complete game state management
- **Statistics Tracking:** Persistent game statistics and performance metrics
- **Modern UI Design:** Clean geometric background with simple color scheme
- **Mobile Optimization:** Improved responsive design
- **Audio Integration:** Sound effects and audio feedback

### Previous Versions
- Basic Ultimate Tic-Tac-Toe implementation
- Computer vs Human mode
- Mobile version improvements

## 🤝 Contributing

Feel free to contribute to this project! Areas for improvement:
- Additional AI difficulty levels
- Online multiplayer functionality
- Tournament mode
- Custom themes
- Enhanced animations

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the classic Ultimate Tic-Tac-Toe game
- Enhanced with AI and modern features

---

**Enjoy the game!** 🎮

*Challenge yourself against the AI or play with friends in this modern take on Ultimate Tic-Tac-Toe.*