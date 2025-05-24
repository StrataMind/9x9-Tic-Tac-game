const miniBoards = [
  ["t1", "t2", "t3"],
  ["m1", "m2", "m3"],
  ["b1", "b2", "b3"]
];

// Game State Variables
let currentPlayer = 'X';
let gameActive = true;
let miniBoardStates = {}; // Stores { cells: [...], winner: null, isFull: false }
let mainBoardWinners = {}; // Stores { t1: null, t2: 'X', ... }
let lastPlayedOuterBoardId = null; // ID of the mini-board where the last move was made
let activeMiniBoardIds = []; // IDs of mini-boards where the current player can play

const gameStatusElement = document.getElementById('game-status');
const mainBoardElement = document.getElementById('board');
const restartButton = document.getElementById('restart-button');
// Game Over Overlay Elements
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageElement = document.getElementById('game-over-message');
const playAgainButton = document.getElementById('play-again-button');


function findPosition(boardId) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (miniBoards[r][c] === boardId) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// This function remains the same as it correctly implements the core rule
function getNextPotentialMiniBoards(playedBoardId) {
  // If it's the first move or a special case (e.g. sent to a full/won board, handled later)
  if (!playedBoardId) {
    return miniBoards.flat(); // All boards are potential targets
  }
  const pos = findPosition(playedBoardId);
  if (!pos) return [];

  const { row, col } = pos;
  const validBoards = new Set();
  for (let c = 0; c < 3; c++) validBoards.add(miniBoards[row][c]);
  for (let r = 0; r < 3; r++) validBoards.add(miniBoards[r][col]);

  return Array.from(validBoards);
}

function initializeGame() {
  currentPlayer = 'X';
  gameActive = true;
  lastPlayedOuterBoardId = null;
  miniBoardStates = {};
  mainBoardWinners = {};
  mainBoardElement.innerHTML = ''; // Clear previous board

  miniBoards.flat().forEach(boardId => {
    // Clear any existing SVG lines from previous games if any
    const oldMiniBoard = document.getElementById(boardId);
    if (oldMiniBoard) oldMiniBoard.querySelectorAll('svg.winning-line-svg').forEach(svg => svg.remove());
    miniBoardStates[boardId] = {
      cells: Array(9).fill(null),
      winner: null,
      isFull: false
    };
    mainBoardWinners[boardId] = null;

    const miniBoardDiv = document.createElement('div');
    miniBoardDiv.classList.add('mini-board');
    miniBoardDiv.id = boardId;

    for (let i = 0; i < 9; i++) {
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('cell');
      cellDiv.dataset.miniBoardId = boardId;
      cellDiv.dataset.cellIndex = i;
      cellDiv.addEventListener('click', handleCellClick);
      miniBoardDiv.appendChild(cellDiv);
    }
    mainBoardElement.appendChild(miniBoardDiv);
  });

  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();
  gameOverOverlay.classList.add('overlay-hidden');
  gameOverOverlay.classList.remove('visible');
}

function handleCellClick(event) {
  if (!gameActive) return;

  const clickedCell = event.target;
  const miniBoardId = clickedCell.dataset.miniBoardId;
  const cellIndex = parseInt(clickedCell.dataset.cellIndex);

  // Validate move
  if (!activeMiniBoardIds.includes(miniBoardId) || // Must be in a currently active mini-board
      miniBoardStates[miniBoardId].cells[cellIndex] !== null) { // Cell must be empty
    // Optionally, provide feedback for invalid move
    console.log("Invalid move attempt:", miniBoardId, cellIndex, "Active boards:", activeMiniBoardIds);
    return;
  }

  // Make the move
  miniBoardStates[miniBoardId].cells[cellIndex] = currentPlayer;
  clickedCell.textContent = currentPlayer;
  clickedCell.classList.add(currentPlayer.toLowerCase());

  // Check for mini-board win (only if not already won) or full
  // A mini-board's win status is fixed once won.
  const winningPattern = checkWinner(miniBoardStates[miniBoardId].cells, currentPlayer);

  // Only process this as a new win if the board wasn't already won.
  // This ensures the line is drawn only for the first winning combination.
  if (winningPattern && miniBoardStates[miniBoardId].winner === null) {
    miniBoardStates[miniBoardId].winner = currentPlayer;
    mainBoardWinners[miniBoardId] = currentPlayer;
    drawWinningLine(miniBoardId, winningPattern, currentPlayer); // Draw the line

    // Check for main game win
    if (checkMainBoardWinner(currentPlayer)) {
      gameActive = false;
      // updateGameStatusDisplay(`${currentPlayer} wins the game!`); // Message handled by overlay
      showGameOver(`${currentPlayer} wins the game!`);
      return; // Game ends
    }
  }
  // Separately, check if the board is now full, regardless of win status.
  if (miniBoardStates[miniBoardId].cells.every(cell => cell !== null)) {
    miniBoardStates[miniBoardId].isFull = true;
  }

  // Check for game draw
  if (Object.values(miniBoardStates).every(mb => mb.winner !== null || mb.isFull)) {
      if (!checkMainBoardWinner('X') && !checkMainBoardWinner('O')) {
          gameActive = false;
          // updateGameStatusDisplay("It's a draw!"); // Message handled by overlay
          showGameOver("It's a draw!");
          return;
      }
  }

  // Determine next player and active boards
  lastPlayedOuterBoardId = miniBoardId; // The board just played in
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();
}

function showGameOver(message) {
    gameOverMessageElement.textContent = message;
    gameOverOverlay.classList.remove('overlay-hidden');
    gameOverOverlay.classList.add('visible');
}

function updateActiveMiniBoardsAndHighlight() {
  // Clear previous highlights
  document.querySelectorAll('.mini-board').forEach(el => el.classList.remove('highlight'));

  if (!gameActive) {
    // If game is not active, no boards should be highlighted as active targets
    activeMiniBoardIds = [];
  } else if (lastPlayedOuterBoardId === null) {
    // First move: all non-full boards are active
    activeMiniBoardIds = miniBoards.flat().filter(boardId =>
      !miniBoardStates[boardId].isFull // Playable if not full, regardless of won status
    );
  } else {
    // Subsequent moves
    let potentialNextBoards = getNextPotentialMiniBoards(lastPlayedOuterBoardId);
    activeMiniBoardIds = potentialNextBoards.filter(boardId =>
      !miniBoardStates[boardId].isFull // Playable if not full
    );

    // New Fallback Rule (Row-Priority):
    // If all normally targeted mini-boards are completely full.
    if (activeMiniBoardIds.length === 0) {
      const rowPriority = [miniBoards[0], miniBoards[1], miniBoards[2]]; // Top, Middle, Bottom
      for (const row of rowPriority) {
        const playableInRow = row.filter(boardId =>
          !miniBoardStates[boardId].isFull
        );
        if (playableInRow.length > 0) {
          activeMiniBoardIds = playableInRow;
          break; // Found playable boards in the current priority row
        }
      }
      // If activeMiniBoardIds is still empty here, it means the entire board is full.
      // The draw condition in handleCellClick will manage this.
    }
  }

  activeMiniBoardIds.forEach(id => {
    const boardElement = document.getElementById(id);
    // Ensure element exists and the board itself is not won (though activeMiniBoardIds should already filter this)
    if (boardElement && !miniBoardStates[id].isFull) { // Highlight if not full
        boardElement.classList.add('highlight');
    }
  });
}

function drawWinningLine(miniBoardId, pattern, player) {
  const miniBoardElement = document.getElementById(miniBoardId);
  if (!miniBoardElement) return;

  miniBoardElement.classList.add(`won-${player.toLowerCase()}`); // Add class for general won styling

  const cellCenters = [ // Relative coordinates (percentages) for cell centers
    { x: 16.67, y: 16.67 }, { x: 50, y: 16.67 }, { x: 83.33, y: 16.67 },
    { x: 16.67, y: 50 },    { x: 50, y: 50 },    { x: 83.33, y: 50 },
    { x: 16.67, y: 83.33 }, { x: 50, y: 83.33 }, { x: 83.33, y: 83.33 }
  ];

  const startCellIndex = pattern[0];
  const endCellIndex = pattern[2]; // For a 3-in-a-row, the line goes from first to third

  const startPoint = cellCenters[startCellIndex];
  const endPoint = cellCenters[endCellIndex];

  let svg = miniBoardElement.querySelector('svg.winning-line-svg');
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'winning-line-svg');
    svg.setAttribute('viewBox', '0 0 100 100'); // Use a 100x100 coordinate system
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none'; // So it doesn't block clicks on cells underneath
    miniBoardElement.appendChild(svg);
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute('x1', startPoint.x + '%');
  line.setAttribute('y1', startPoint.y + '%');
  line.setAttribute('x2', endPoint.x + '%');
  line.setAttribute('y2', endPoint.y + '%');
  line.setAttribute('stroke', player === 'X' ? '#7dc3ff' : '#ff7f7f'); // Updated to dark theme player colors
  line.setAttribute('stroke-width', '5'); // Adjust thickness as needed
  line.classList.add('winning-stroke'); // Add class for animation
  line.setAttribute('stroke-linecap', 'round'); // Makes line ends rounded
  svg.appendChild(line);
}

function checkWinner(cells, player) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];
  for (const pattern of winPatterns) {
    if (pattern.every(index => cells[index] === player)) {
      return pattern; // Return the winning pattern
    }
  }
  return null; // No winner
}

function checkMainBoardWinner(player) {
  const winPatterns = [
    // Rows
    ["t1", "t2", "t3"], ["m1", "m2", "m3"], ["b1", "b2", "b3"],
    // Columns
    ["t1", "m1", "b1"], ["t2", "m2", "b2"], ["t3", "m3", "b3"],
    // Diagonals
    ["t1", "m2", "b3"], ["t3", "m2", "b1"]
  ];
  return winPatterns.some(pattern =>
    pattern.every(boardId => mainBoardWinners[boardId] === player)
  );
}

function updateGameStatusDisplay(message) {
  if (message) {
    gameStatusElement.textContent = message;
  } else if (!gameActive) {
    // If game ended and no specific win/draw message was passed,
    // it implies the status was already set or needs no further update.
    return;
  } else {
    const playerIndicator = currentPlayer === 'X' ? `<span class="player-x-indicator">X</span>` : `<span class="player-o-indicator">O</span>`;
    let statusText = `Player ${playerIndicator}'s turn. `;

    const allCurrentlyPlayableBoards = miniBoards.flat().filter(id =>
        // For status display, consider a board "playable" if it's not full,
        // even if won, because moves are allowed in won-but-not-full boards.
        !miniBoardStates[id].isFull
    );

    const isPlayAnywhereAmongAvailable = activeMiniBoardIds.length === allCurrentlyPlayableBoards.length &&
                                 activeMiniBoardIds.every(id => allCurrentlyPlayableBoards.includes(id));
    
    if (lastPlayedOuterBoardId === null) {
        // Specifically for the very first move
        statusText += "Play in any mini-board.";
    } else if (isPlayAnywhereAmongAvailable) {
        // Covers scenarios like: last move was center (m2) sending to all,
        // or the "Invalid Scenarios" fallback rule is active.
        statusText += "Play in any available mini-board.";
    } else if (activeMiniBoardIds.length > 0) {
        statusText += `Play in highlighted mini-board(s): ${activeMiniBoardIds.join(', ')}.`;
    } else {
         statusText += "Determining next move..."; // Should ideally not be hit if game is active and playable
         console.warn("updateGameStatusDisplay: No active mini-boards identified while game is active.");
    }
    gameStatusElement.textContent = statusText;
    gameStatusElement.innerHTML = statusText; // Use innerHTML to render the span
  }
}

// Ensure the DOM is fully loaded before attaching event listeners to elements
// that are part of the initial HTML (like the restart button).
// For dynamically created elements (like cells), event listeners are added during creation.
document.addEventListener('DOMContentLoaded', () => {
    // The restartButton constant is already defined globally,
    // but it's good practice to ensure it's not null if accessed here.
    if (restartButton) {
        restartButton.addEventListener('click', initializeGame);
    } else {
        console.error("Restart button not found!");
    }
    if (playAgainButton) {
        playAgainButton.addEventListener('click', initializeGame);
    } else {
        console.error("Play Again button not found on overlay!");
    }

    // Start the game
    initializeGame();
});