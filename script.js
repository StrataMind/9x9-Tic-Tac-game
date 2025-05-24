const miniBoards = [
  ["t1", "t2", "t3"],
  ["m1", "m2", "m3"],
  ["b1", "b2", "b3"]
];

// Game State Variables
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' for Player vs Player, 'pvc' for Player vs Computer
const AI_PLAYER = 'O'; // Define AI's symbol
const HUMAN_PLAYER = 'X'; // Define Human's symbol

let miniBoardStates = {}; // Stores { cells: [...], winner: null, isFull: false }
let mainBoardWinners = {}; // Stores { t1: null, t2: 'X', ... }
let lastPlayedOuterBoardId = null; // ID of the mini-board where the last move was made
let activeMiniBoardIds = []; // IDs of mini-boards where the current player can play

// DOM Element References
const modeSelectionScreenElement = document.getElementById('mode-selection-screen');
const gameScreenElement = document.getElementById('game-screen');
const startGameButtonElement = document.getElementById('start-game-button');
const gameStatusElement = document.getElementById('game-status');
const mainBoardElement = document.getElementById('board');
const restartButton = document.getElementById('restart-button');
// Game Over Overlay Elements
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageElement = document.getElementById('game-over-message');
const playAgainButton = document.getElementById('play-again-button');
// Rule Book Overlay Elements
const rulebookButton = document.getElementById('rulebook-button');
const rulebookOverlay = document.getElementById('rulebook-overlay');
const closeRulebookButton = document.getElementById('close-rulebook-button');


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

function showModeSelectionScreen() {
  modeSelectionScreenElement.classList.remove('hidden');
  gameScreenElement.classList.add('hidden');
  gameOverOverlay.classList.add('overlay-hidden'); // Ensure game over is hidden
  gameOverOverlay.classList.remove('visible');

  // Reset game state variables for a truly new game session
  currentPlayer = HUMAN_PLAYER;
  gameActive = false; // Game is not active until mode is selected and game starts
  lastPlayedOuterBoardId = null;
  miniBoardStates = {};
  mainBoardWinners = {};
  activeMiniBoardIds = [];
  mainBoardElement.innerHTML = ''; // Clear the board
  gameStatusElement.innerHTML = 'Select a game mode to start!'; // Initial message

  // Clear highlights from any previous game
  document.querySelectorAll('.mini-board.highlight').forEach(el => el.classList.remove('highlight'));
  document.querySelectorAll('.mini-board.won-x, .mini-board.won-o').forEach(el => {
    el.classList.remove('won-x', 'won-o');
    el.querySelectorAll('svg.winning-line-svg').forEach(svg => svg.remove());
  });
}

function startGame() {
  // Read selected game mode
  const selectedMode = document.querySelector('input[name="gameMode"]:checked');
  gameMode = selectedMode ? selectedMode.value : 'pvp';

  // Initialize game state for the actual game start
  currentPlayer = HUMAN_PLAYER;
  gameActive = true; // Now the game is active
  lastPlayedOuterBoardId = null;
  miniBoardStates = {}; // Ensure these are fresh if not fully reset in showModeSelection
  mainBoardWinners = {};
  mainBoardElement.innerHTML = ''; // Clear board before rebuilding

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

  // Hide mode selection and show game screen
  modeSelectionScreenElement.classList.add('hidden');
  gameScreenElement.classList.remove('hidden');
}


// Centralized function to process a move, update state, and check for wins/draws
function processMove(miniBoardId, cellIndex, player) {
  miniBoardStates[miniBoardId].cells[cellIndex] = player;
  const clickedCellElement = mainBoardElement.querySelector(`.cell[data-mini-board-id="${miniBoardId}"][data-cell-index="${cellIndex}"]`);
  if (clickedCellElement) {
    clickedCellElement.textContent = player;
    clickedCellElement.classList.add(player.toLowerCase());
  }

  const winningPattern = checkWinner(miniBoardStates[miniBoardId].cells, player);
  if (winningPattern && miniBoardStates[miniBoardId].winner === null) {
    miniBoardStates[miniBoardId].winner = player;
    mainBoardWinners[miniBoardId] = player;
    drawWinningLine(miniBoardId, winningPattern, player);

    if (checkMainBoardWinner(player)) {
      gameActive = false;
      showGameOver(`${player} wins the game!`);
      return true; // Game ended
    }
  }

  if (miniBoardStates[miniBoardId].cells.every(cell => cell !== null)) {
    miniBoardStates[miniBoardId].isFull = true;
  }

  if (Object.values(miniBoardStates).every(mb => mb.winner !== null || mb.isFull)) {
    if (!checkMainBoardWinner(HUMAN_PLAYER) && !checkMainBoardWinner(AI_PLAYER)) {
      gameActive = false;
      showGameOver("It's a draw!");
      return true; // Game ended
    }
  }
  return false; // Game continues
}


function handleCellClick(event) {
  if (!gameActive || (gameMode === 'pvc' && currentPlayer === AI_PLAYER)) {
    // If game not active, or if it's PVC mode and AI's turn, human clicks are ignored
    return;
  }

  const clickedCell = event.target;
  const miniBoardId = clickedCell.dataset.miniBoardId;
  const cellIndex = parseInt(clickedCell.dataset.cellIndex);

  if (!activeMiniBoardIds.includes(miniBoardId) || miniBoardStates[miniBoardId].cells[cellIndex] !== null) {
    console.log("Invalid move attempt by human:", miniBoardId, cellIndex, "Active boards:", activeMiniBoardIds);
    return;
  }

  const gameEnded = processMove(miniBoardId, cellIndex, currentPlayer);
  if (gameEnded) return;

  lastPlayedOuterBoardId = miniBoardId;
  currentPlayer = (currentPlayer === HUMAN_PLAYER) ? AI_PLAYER : HUMAN_PLAYER; // Switch player

  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();

  if (gameMode === 'pvc' && currentPlayer === AI_PLAYER && gameActive) {
    // Disable board interaction for human while AI thinks
    mainBoardElement.style.pointerEvents = 'none';
    setTimeout(() => { // Add a small delay for AI's move to feel more natural
        makeComputerMove();
        // Re-enable board interaction after AI move
        mainBoardElement.style.pointerEvents = 'auto';
    }, 750); // 750ms delay
  }
}

function makeComputerMove() {
  if (!gameActive) return;

  console.log("AI's turn. Active boards:", activeMiniBoardIds);
  if (activeMiniBoardIds.length === 0) {
      console.error("AI has no valid boards to play on, but game is active.");
      // This case should ideally be prevented by draw/win conditions.
      // If it happens, it might indicate a logic flaw in determining active boards or game end.
      return;
  }

  // Simple AI: Pick a random active mini-board, then a random empty cell in it.
  const randomBoardIndex = Math.floor(Math.random() * activeMiniBoardIds.length);
  const chosenMiniBoardId = activeMiniBoardIds[randomBoardIndex];

  const emptyCellsInChosenBoard = [];
  miniBoardStates[chosenMiniBoardId].cells.forEach((cell, index) => {
    if (cell === null) {
      emptyCellsInChosenBoard.push(index);
    }
  });

  if (emptyCellsInChosenBoard.length === 0) {
      // This should not happen if activeMiniBoardIds are correctly filtered for non-full boards.
      // If it does, it means a full board was considered active.
      // As a fallback, try another active board or re-evaluate logic.
      console.error(`AI chose board ${chosenMiniBoardId} which is full or has no empty cells. Active:`, activeMiniBoardIds, "States:", miniBoardStates);
      // For now, let's try to find *any* playable move if this rare case occurs.
      // This part is a safety net and indicates a potential deeper issue if frequently hit.
      for (const boardId of activeMiniBoardIds) {
          const cells = miniBoardStates[boardId].cells;
          for (let i = 0; i < cells.length; i++) {
              if (cells[i] === null) {
                  console.warn("AI fallback: found move in", boardId, "at", i);
                  const gameEndedByAI = processMove(boardId, i, AI_PLAYER);
                  if (gameEndedByAI) return;
                  lastPlayedOuterBoardId = boardId;
                  currentPlayer = HUMAN_PLAYER;
                  updateActiveMiniBoardsAndHighlight();
                  updateGameStatusDisplay();
                  return;
              }
          }
      }
      console.error("AI could not find any move. This is a critical error.");
      // Potentially declare a draw or end game if AI truly has no moves.
      return;
  }

  const randomCellIndexInBoard = Math.floor(Math.random() * emptyCellsInChosenBoard.length);
  const chosenCellIndex = emptyCellsInChosenBoard[randomCellIndexInBoard];

  console.log(`AI chose to play in ${chosenMiniBoardId} at cell ${chosenCellIndex}`);

  const gameEndedByAI = processMove(chosenMiniBoardId, chosenCellIndex, AI_PLAYER);
  if (gameEndedByAI) return;

  lastPlayedOuterBoardId = chosenMiniBoardId;
  currentPlayer = HUMAN_PLAYER; // Switch back to human

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
      !miniBoardStates[boardId].isFull
    );
  } else {
    // Subsequent moves
    let potentialNextBoards = getNextPotentialMiniBoards(lastPlayedOuterBoardId);
    activeMiniBoardIds = potentialNextBoards.filter(boardId =>
      !miniBoardStates[boardId].isFull
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
    if (boardElement && !miniBoardStates[id].isFull) {
        boardElement.classList.add('highlight');
    }
  });
}

function drawWinningLine(miniBoardId, pattern, player) {
  const miniBoardElement = document.getElementById(miniBoardId);
  if (!miniBoardElement) return;

  miniBoardElement.classList.add(`won-${player.toLowerCase()}`);

  const cellCenters = [ // Relative coordinates (percentages) for cell centers
    { x: 16.67, y: 16.67 }, { x: 50, y: 16.67 }, { x: 83.33, y: 16.67 },
    { x: 16.67, y: 50 },    { x: 50, y: 50 },    { x: 83.33, y: 50 },
    { x: 16.67, y: 83.33 }, { x: 50, y: 83.33 }, { x: 83.33, y: 83.33 }
  ];

  const startCellIndex = pattern[0];
  const endCellIndex = pattern[2];

  const startPoint = cellCenters[startCellIndex];
  const endPoint = cellCenters[endCellIndex];

  let svg = miniBoardElement.querySelector('svg.winning-line-svg');
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'winning-line-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    miniBoardElement.appendChild(svg);
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute('x1', startPoint.x + '%');
  line.setAttribute('y1', startPoint.y + '%');
  line.setAttribute('x2', endPoint.x + '%');
  line.setAttribute('y2', endPoint.y + '%');
  line.setAttribute('stroke', player === HUMAN_PLAYER ? '#7dc3ff' : '#ff7f7f'); // X is blue, O is red
  line.setAttribute('stroke-width', '5');
  line.classList.add('winning-stroke');
  line.setAttribute('stroke-linecap', 'round');
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
  if (message) { // For direct messages like win/draw from showGameOver
    gameStatusElement.innerHTML = message; // Use innerHTML if message might contain HTML
  } else if (!gameActive) {
    // If game ended and no specific win/draw message was passed,
    // it implies the status was already set or needs no further update.
    return;
  } else {
    let playerDisplay;
    if (currentPlayer === HUMAN_PLAYER) {
        playerDisplay = `<span class="player-x-indicator">${HUMAN_PLAYER}</span> (You)`;
    } else if (gameMode === 'pvc' && currentPlayer === AI_PLAYER) {
        playerDisplay = `<span class="player-o-indicator">${AI_PLAYER}</span> (Computer)`;
    } else { // PvP mode, O player
        playerDisplay = `<span class="player-o-indicator">${currentPlayer}</span>`;
    }

    let statusText = `Player ${playerDisplay}'s turn. `;

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
         statusText += "Determining next move...";
         console.warn("updateGameStatusDisplay: No active mini-boards identified while game is active.");
    }
    gameStatusElement.innerHTML = statusText;
  }
}

// Ensure the DOM is fully loaded before attaching event listeners to elements
// that are part of the initial HTML (like the restart button).
// For dynamically created elements (like cells), event listeners are added during creation.
document.addEventListener('DOMContentLoaded', () => {
    // The restartButton constant is already defined globally,

    if (startGameButtonElement) {
        startGameButtonElement.addEventListener('click', startGame);
    } else {
        console.error("Start Game button not found!");
    }

    if (restartButton) {
        // Restart button now takes you back to mode selection
        restartButton.addEventListener('click', showModeSelectionScreen);
    } else {
        console.error("Restart button not found!");
    }
    if (playAgainButton) {
        playAgainButton.addEventListener('click', showModeSelectionScreen);
    } else {
        console.error("Play Again button not found on overlay!");
    }
    if (rulebookButton) {
        rulebookButton.addEventListener('click', () => {
            rulebookOverlay.classList.remove('overlay-hidden');
            rulebookOverlay.classList.add('visible');
        });
    }
    if (closeRulebookButton) {
        closeRulebookButton.addEventListener('click', () => {
            rulebookOverlay.classList.add('overlay-hidden');
            rulebookOverlay.classList.remove('visible');
        });
    }

    // Initially, show the mode selection screen
    showModeSelectionScreen();
});