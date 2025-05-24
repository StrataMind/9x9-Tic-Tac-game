# 9x9 Tic-Tac Game (Ultimate Tic-Tac-Toe)

A web-based implementation of the 9x9 Tic-Tac game, also known as Ultimate Tic-Tac-Toe, featuring a dynamic UI and engaging gameplay.

## 🎮 Play Online

You can play the game live here: [9x9 Tic-Tac Game](https://surajsk2003.github.io/9x9-Tic-Tac-game/)

## 🎯 Objective

To win the main 3x3 board by winning any three mini-games in a row, column, or diagonal—similar to traditional Tic-Tac-Toe, but at a macro level.

## 🧩 Board Structure

- The game consists of a main 3x3 grid (the **main board**).
- Each cell in the main board contains its own inner 3x3 Tic-Tac-Toe grid (a **mini-board**).
- There are 9 mini-boards in total.

## 🧑‍🤝‍🧑 Players

- 2 players: Player X and Player O.
- Players take turns alternately. Player X starts.

## 🕹️ How to Play

1.  **Initial Move:**
    *   The first player (Player X) can choose to play in any cell of any mini-board.

2.  **Move Restriction Rule:**
    *   From the second move onward, the allowed mini-board(s) for the next player are determined by the position of the **mini-board** just played in.
    *   **Rule Logic:** If the last move was made in mini-board at `(row=r, col=c)`, then the valid next mini-boards are all mini-boards in row `r` AND all mini-boards in column `c`.
        *   *Example:* If Player X plays in the top-center mini-board (t2), Player O must play in any of the mini-boards in the top row (t1, t2, t3) OR the center column (t2, m2, b2). Allowed: t1, t2, t3, m2, b2.
        *   *Center Exception:* If a player plays in the center mini-board (m2), the next player can play in *any* available mini-board.

3.  **Mini-Board Win:**
    *   A mini-board is won if a player places three of their symbols (X or O) in a row, column, or diagonal within that mini-board.
    *   A line is drawn over the winning combination.
    *   Once a mini-board is won, its win status is fixed. No further lines are drawn even if other winning combinations are formed later.

4.  **Playable Cells in a Won Mini-Board:**
    *   If a player wins a mini-board but there are still empty cells remaining in it, the opponent (and the winner) can still play in those empty cells if directed there by the move restriction rule. The mini-board just doesn't get "locked" but its "won" status remains.

5.  **Fallback Rule for Full/Won Zones (Row-Priority Fallback):**
    *   If all valid mini-boards (based on the standard move restriction) are completely filled (regardless of win status), the next move follows this priority for choosing an available (not full) mini-board:
        1.  Top Row (t1–t3)
        2.  Middle Row (m1–m3)
        3.  Bottom Row (b1–b3)

6.  **Game Victory:**
    *   A player wins the full game if they win 3 mini-boards in a line (horizontal, vertical, or diagonal) on the main board.

7.  **Draw Condition:**
    *   If all mini-boards are filled and no player has won the main board, the game results in a draw.

## ✨ Features

- **Interactive Gameplay:** Click to place your X or O.
- **Dynamic Move Highlighting:** Valid mini-boards for the next move are clearly highlighted.
- **Visual Winning Lines:** Lines are drawn on mini-boards to indicate a win.
- **Animated Winning Lines:** Smooth animation for drawing the winning lines.
- **Live Background:** A subtle, animated dark gradient background with floating orbs for a modern feel.
- **Clear Game Status:** Displays whose turn it is.
- **Game Over Overlay:** A clear message indicates the game winner or a draw, with a "Play Again" option.
- **Responsive Design (Basic):** The game board scales reasonably well.

## 🚀 How to Run

1.  Clone this repository or download the files (`index.html`, `styles.css`, `script.js`).
2.  Ensure all three files are in the same directory.
3.  Open `index.html` in any modern web browser (e.g., Chrome, Firefox, Edge, Safari).

No special setup or servers are required.

## 🛠️ Technologies Used

- **HTML5:** For the basic structure of the game.
- **CSS3:** For styling, layout, animations (including the live background and winning line animations).
- **JavaScript (ES6+):** For all game logic, DOM manipulation, and interactivity.

## ✍️ Optional Extensions (Future Enhancements from Spec)

*(These are from the original game specification and not yet implemented)*

- Timer per move.
- Undo/Redo functionality.
- AI bot opponent.
- Leaderboard.
- Dynamic grid themes.

---

Enjoy the game!