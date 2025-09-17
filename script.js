const miniBoards = [
  ["t1", "t2", "t3"],
  ["m1", "m2", "m3"],
  ["b1", "b2", "b3"],
];

// Game State Variables
let currentPlayer = "X";
let gameActive = true;
let gameMode = "pvp"; // 'pvp' for Player vs Player, 'pvc' for Player vs Computer
let aiDifficulty = "easy"; // 'easy', 'medium', 'hard'
const AI_PLAYER = "O"; // Define AI's symbol
const HUMAN_PLAYER = "X"; // Define Human's symbol

let miniBoardStates = {}; // Stores { cells: [...], winner: null, isFull: false }
let mainBoardWinners = {}; // Stores { t1: null, t2: 'X', ... }
let lastPlayedOuterBoardId = null; // ID of the mini-board where the last move was made
let activeMiniBoardIds = []; // IDs of mini-boards where the current player can play

// Undo/Redo System
let gameHistory = [];
let historyIndex = -1;

// Timer System
let timerEnabled = true;
let timerDuration = 30; // seconds
let currentTimer = null;
let timerInterval = null;

// Statistics
let gameStats = {
  gamesPlayed: 0,
  xWins: 0,
  oWins: 0,
  draws: 0,
  totalGameTime: 0
};

// Game timing
let gameStartTime = null;

// Audio
let soundEnabled = true;

// DOM Element References
const modeSelectionScreenElement = document.getElementById(
  "mode-selection-screen"
);
const gameScreenElement = document.getElementById("game-screen");
const startGameButtonElement = document.getElementById("start-game-button");
const gameStatusElement = document.getElementById("game-status");
const mainBoardElement = document.getElementById("board");
const restartButton = document.getElementById("restart-button");
// Game Over Overlay Elements
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameOverMessageElement = document.getElementById("game-over-message");
const playAgainButton = document.getElementById("play-again-button");
// Rule Book Overlay Elements
const rulebookButton = document.getElementById("rulebook-button");
const rulebookOverlay = document.getElementById("rulebook-overlay");
const closeRulebookButton = document.getElementById("close-rulebook-button");
// New UI Elements
const undoButton = document.getElementById("undo-button");
const redoButton = document.getElementById("redo-button");
const statsButton = document.getElementById("stats-button");
const statsOverlay = document.getElementById("stats-overlay");
const closeStatsButton = document.getElementById("close-stats-button");
const resetStatsButton = document.getElementById("reset-stats-button");
const timerContainer = document.getElementById("timer-container");
const timerValue = document.getElementById("timer-value");
const timerProgress = document.getElementById("timer-progress");
const aiDifficultyFieldset = document.getElementById("ai-difficulty-fieldset");
const enableTimerCheckbox = document.getElementById("enable-timer");
const timerDurationSlider = document.getElementById("timer-duration");
const timerDisplay = document.getElementById("timer-display");
const timerDurationContainer = document.getElementById("timer-duration-container");
// Audio elements
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");

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
  modeSelectionScreenElement.classList.remove("hidden");
  gameScreenElement.classList.add("hidden");
  gameOverOverlay.classList.add("overlay-hidden");
  gameOverOverlay.classList.remove("visible");
  if (statsOverlay) {
    statsOverlay.classList.add("overlay-hidden");
    statsOverlay.classList.remove("visible");
  }
  if (timerContainer) {
    timerContainer.classList.add("hidden");
  }

  // Clear any running timer
  clearTimer();

  // Reset game state variables for a truly new game session
  currentPlayer = HUMAN_PLAYER;
  gameActive = false;
  lastPlayedOuterBoardId = null;
  miniBoardStates = {};
  mainBoardWinners = {};
  activeMiniBoardIds = [];
  gameHistory = [];
  historyIndex = -1;
  mainBoardElement.innerHTML = "";
  gameStatusElement.innerHTML = "Select a game mode to start!";

  // Update UI button states
  updateUndoRedoButtons();

  // Clear highlights from any previous game
  document
    .querySelectorAll(".mini-board.highlight")
    .forEach((el) => el.classList.remove("highlight"));
  document
    .querySelectorAll(".mini-board.won-x, .mini-board.won-o")
    .forEach((el) => {
      el.classList.remove("won-x", "won-o");
      el.querySelectorAll("svg.winning-line-svg").forEach((svg) =>
        svg.remove()
      );
    });

  // Load statistics
  loadStats();
  updateStatsDisplay();
}

function startGame() {
  // Read selected game mode
  const selectedMode = document.querySelector('input[name="gameMode"]:checked');
  gameMode = selectedMode ? selectedMode.value : "pvp";

  // Read AI difficulty
  const selectedDifficulty = document.querySelector('input[name="aiDifficulty"]:checked');
  aiDifficulty = selectedDifficulty ? selectedDifficulty.value : "easy";

  // Read timer settings
  timerEnabled = enableTimerCheckbox ? enableTimerCheckbox.checked : true;
  timerDuration = timerDurationSlider ? parseInt(timerDurationSlider.value) : 30;

  // Initialize game state for the actual game start
  currentPlayer = HUMAN_PLAYER;
  gameActive = true;
  lastPlayedOuterBoardId = null;
  miniBoardStates = {};
  mainBoardWinners = {};
  gameHistory = [];
  historyIndex = -1;
  gameStartTime = Date.now();
  mainBoardElement.innerHTML = "";

  miniBoards.flat().forEach((boardId) => {
    // Clear any existing SVG lines from previous games if any
    const oldMiniBoard = document.getElementById(boardId);
    if (oldMiniBoard)
      oldMiniBoard
        .querySelectorAll("svg.winning-line-svg")
        .forEach((svg) => svg.remove());
    miniBoardStates[boardId] = {
      cells: Array(9).fill(null),
      winner: null,
      isFull: false,
    };
    mainBoardWinners[boardId] = null;

    const miniBoardDiv = document.createElement("div");
    miniBoardDiv.classList.add("mini-board");
    miniBoardDiv.id = boardId;

    for (let i = 0; i < 9; i++) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.dataset.miniBoardId = boardId;
      cellDiv.dataset.cellIndex = i;
      cellDiv.addEventListener("click", handleCellClick);
      miniBoardDiv.appendChild(cellDiv);
    }
    mainBoardElement.appendChild(miniBoardDiv);
  });

  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();
  updateUndoRedoButtons();

  // Show timer if enabled
  if (timerEnabled && timerContainer) {
    timerContainer.classList.remove("hidden");
    startTimer();
  } else if (timerContainer) {
    timerContainer.classList.add("hidden");
  }

  // Save initial state
  saveGameState();

  // Hide mode selection and show game screen
  modeSelectionScreenElement.classList.add("hidden");
  gameScreenElement.classList.remove("hidden");
}

// Centralized function to process a move, update state, and check for wins/draws
function processMove(miniBoardId, cellIndex, player, skipSaveState = false) {
  miniBoardStates[miniBoardId].cells[cellIndex] = player;
  const clickedCellElement = mainBoardElement.querySelector(
    `.cell[data-mini-board-id="${miniBoardId}"][data-cell-index="${cellIndex}"]`
  );
  if (clickedCellElement) {
    clickedCellElement.textContent = player;
    clickedCellElement.classList.add(player.toLowerCase());

    // Add move animation
    clickedCellElement.style.transform = 'scale(0)';
    clickedCellElement.style.opacity = '0';
    setTimeout(() => {
      clickedCellElement.style.transform = 'scale(1)';
      clickedCellElement.style.opacity = '1';
    }, 50);
  }

  // Play move sound
  if (soundEnabled && moveSound) {
    playSound(moveSound);
  }

  const winningPattern = checkWinner(
    miniBoardStates[miniBoardId].cells,
    player
  );
  if (winningPattern && miniBoardStates[miniBoardId].winner === null) {
    miniBoardStates[miniBoardId].winner = player;
    mainBoardWinners[miniBoardId] = player;
    drawWinningLine(miniBoardId, winningPattern, player);

    if (checkMainBoardWinner(player)) {
      gameActive = false;
      clearTimer();
      recordGameResult(player);
      if (soundEnabled && winSound) {
        playSound(winSound);
      }
      showGameOver(`${player} wins the game!`);
      return true;
    }
  }

  if (miniBoardStates[miniBoardId].cells.every((cell) => cell !== null)) {
    miniBoardStates[miniBoardId].isFull = true;
  }

  if (
    Object.values(miniBoardStates).every(
      (mb) => mb.winner !== null || mb.isFull
    )
  ) {
    if (
      !checkMainBoardWinner(HUMAN_PLAYER) &&
      !checkMainBoardWinner(AI_PLAYER)
    ) {
      gameActive = false;
      clearTimer();
      recordGameResult('draw');
      showGameOver("It's a draw!");
      return true;
    }
  }

  // Save game state for undo/redo (unless we're restoring from history)
  if (!skipSaveState) {
    saveGameState();
  }

  return false;
}

function handleCellClick(event) {
  if (!gameActive || (gameMode === "pvc" && currentPlayer === AI_PLAYER)) {
    return;
  }

  const clickedCell = event.target;
  const miniBoardId = clickedCell.dataset.miniBoardId;
  const cellIndex = parseInt(clickedCell.dataset.cellIndex);

  if (
    !activeMiniBoardIds.includes(miniBoardId) ||
    miniBoardStates[miniBoardId].cells[cellIndex] !== null
  ) {
    console.log(
      "Invalid move attempt by human:",
      miniBoardId,
      cellIndex,
      "Active boards:",
      activeMiniBoardIds
    );
    return;
  }

  // Clear timer for current move
  clearTimer();

  const gameEnded = processMove(miniBoardId, cellIndex, currentPlayer);
  if (gameEnded) return;

  lastPlayedOuterBoardId = miniBoardId;
  currentPlayer = currentPlayer === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;

  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();
  updateUndoRedoButtons();

  // Start timer for next player
  if (timerEnabled && gameActive) {
    startTimer();
  }

  if (gameMode === "pvc" && currentPlayer === AI_PLAYER && gameActive) {
    mainBoardElement.style.pointerEvents = "none";
    setTimeout(() => {
      makeComputerMove();
      mainBoardElement.style.pointerEvents = "auto";
    }, 750);
  }
}

function makeComputerMove() {
  if (!gameActive) return;

  console.log("AI's turn. Active boards:", activeMiniBoardIds);
  if (activeMiniBoardIds.length === 0) {
    console.error("AI has no valid boards to play on, but game is active.");
    return;
  }

  clearTimer();

  let chosenMiniBoardId, chosenCellIndex;

  // AI difficulty implementation
  switch (aiDifficulty) {
    case "easy":
      ({ chosenMiniBoardId, chosenCellIndex } = makeEasyMove());
      break;
    case "medium":
      ({ chosenMiniBoardId, chosenCellIndex } = makeMediumMove());
      break;
    case "hard":
      ({ chosenMiniBoardId, chosenCellIndex } = makeHardMove());
      break;
    default:
      ({ chosenMiniBoardId, chosenCellIndex } = makeEasyMove());
  }

  if (chosenMiniBoardId === null || chosenCellIndex === null) {
    console.error("AI could not find any move. This is a critical error.");
    return;
  }

  console.log(
    `AI (${aiDifficulty}) chose to play in ${chosenMiniBoardId} at cell ${chosenCellIndex}`
  );

  const gameEndedByAI = processMove(
    chosenMiniBoardId,
    chosenCellIndex,
    AI_PLAYER
  );
  if (gameEndedByAI) return;

  lastPlayedOuterBoardId = chosenMiniBoardId;
  currentPlayer = HUMAN_PLAYER;

  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();
  updateUndoRedoButtons();

  if (timerEnabled && gameActive) {
    startTimer();
  }
}

function showGameOver(message) {
  gameOverMessageElement.textContent = message;
  gameOverOverlay.classList.remove("overlay-hidden");
  gameOverOverlay.classList.add("visible");
  if (timerContainer) {
    timerContainer.classList.add("hidden");
  }
  clearTimer();
}

function updateActiveMiniBoardsAndHighlight() {
  // Clear previous highlights
  document
    .querySelectorAll(".mini-board")
    .forEach((el) => el.classList.remove("highlight"));

  if (!gameActive) {
    // If game is not active, no boards should be highlighted as active targets
    activeMiniBoardIds = [];
  } else if (lastPlayedOuterBoardId === null) {
    // First move: all non-full boards are active
    activeMiniBoardIds = miniBoards
      .flat()
      .filter((boardId) => !miniBoardStates[boardId].isFull);
  } else {
    // Subsequent moves
    let potentialNextBoards = getNextPotentialMiniBoards(
      lastPlayedOuterBoardId
    );
    activeMiniBoardIds = potentialNextBoards.filter(
      (boardId) => !miniBoardStates[boardId].isFull
    );

    // New Fallback Rule (Row-Priority):
    // If all normally targeted mini-boards are completely full.
    if (activeMiniBoardIds.length === 0) {
      const rowPriority = [miniBoards[0], miniBoards[1], miniBoards[2]]; // Top, Middle, Bottom
      for (const row of rowPriority) {
        const playableInRow = row.filter(
          (boardId) => !miniBoardStates[boardId].isFull
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

  activeMiniBoardIds.forEach((id) => {
    const boardElement = document.getElementById(id);
    // Ensure element exists and the board itself is not won (though activeMiniBoardIds should already filter this)
    if (boardElement && !miniBoardStates[id].isFull) {
      boardElement.classList.add("highlight");
    }
  });
}

function drawWinningLine(miniBoardId, pattern, player) {
  const miniBoardElement = document.getElementById(miniBoardId);
  if (!miniBoardElement) return;

  miniBoardElement.classList.add(`won-${player.toLowerCase()}`);

  const cellCenters = [
    // Relative coordinates (percentages) for cell centers
    { x: 16.67, y: 16.67 },
    { x: 50, y: 16.67 },
    { x: 83.33, y: 16.67 },
    { x: 16.67, y: 50 },
    { x: 50, y: 50 },
    { x: 83.33, y: 50 },
    { x: 16.67, y: 83.33 },
    { x: 50, y: 83.33 },
    { x: 83.33, y: 83.33 },
  ];

  const startCellIndex = pattern[0];
  const endCellIndex = pattern[2];

  const startPoint = cellCenters[startCellIndex];
  const endPoint = cellCenters[endCellIndex];

  let svg = miniBoardElement.querySelector("svg.winning-line-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "winning-line-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    miniBoardElement.appendChild(svg);
  }

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", startPoint.x + "%");
  line.setAttribute("y1", startPoint.y + "%");
  line.setAttribute("x2", endPoint.x + "%");
  line.setAttribute("y2", endPoint.y + "%");
  line.setAttribute("stroke", player === HUMAN_PLAYER ? "#7dc3ff" : "#ff7f7f"); // X is blue, O is red
  line.setAttribute("stroke-width", "5");
  line.classList.add("winning-stroke");
  line.setAttribute("stroke-linecap", "round");
  svg.appendChild(line);
}

function checkWinner(cells, player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];
  for (const pattern of winPatterns) {
    if (pattern.every((index) => cells[index] === player)) {
      return pattern; // Return the winning pattern
    }
  }
  return null; // No winner
}

function checkMainBoardWinner(player) {
  const winPatterns = [
    // Rows
    ["t1", "t2", "t3"],
    ["m1", "m2", "m3"],
    ["b1", "b2", "b3"],
    // Columns
    ["t1", "m1", "b1"],
    ["t2", "m2", "b2"],
    ["t3", "m3", "b3"],
    // Diagonals
    ["t1", "m2", "b3"],
    ["t3", "m2", "b1"],
  ];
  return winPatterns.some((pattern) =>
    pattern.every((boardId) => mainBoardWinners[boardId] === player)
  );
}

function updateGameStatusDisplay(message) {
  if (message) {
    // For direct messages like win/draw from showGameOver
    gameStatusElement.innerHTML = message; // Use innerHTML if message might contain HTML
  } else if (!gameActive) {
    // If game ended and no specific win/draw message was passed,
    // it implies the status was already set or needs no further update.
    return;
  } else {
    let playerDisplay;
    if (currentPlayer === HUMAN_PLAYER) {
      playerDisplay = `<span class="player-x-indicator">${HUMAN_PLAYER}</span> (You)`;
    } else if (gameMode === "pvc" && currentPlayer === AI_PLAYER) {
      playerDisplay = `<span class="player-o-indicator">${AI_PLAYER}</span> (Computer)`;
    } else {
      // PvP mode, O player
      playerDisplay = `<span class="player-o-indicator">${currentPlayer}</span>`;
    }

    let statusText = `Player ${playerDisplay}'s turn. `;

    const allCurrentlyPlayableBoards = miniBoards.flat().filter(
      (id) =>
        // For status display, consider a board "playable" if it's not full,
        // even if won, because moves are allowed in won-but-not-full boards.
        !miniBoardStates[id].isFull
    );
    const isPlayAnywhereAmongAvailable =
      activeMiniBoardIds.length === allCurrentlyPlayableBoards.length &&
      activeMiniBoardIds.every((id) => allCurrentlyPlayableBoards.includes(id));

    if (lastPlayedOuterBoardId === null) {
      // Specifically for the very first move
      statusText += "Play in any mini-board.";
    } else if (isPlayAnywhereAmongAvailable) {
      // Covers scenarios like: last move was center (m2) sending to all,
      // or the "Invalid Scenarios" fallback rule is active.
      statusText += "Play in any available mini-board.";
    } else if (activeMiniBoardIds.length > 0) {
      statusText += `Play in highlighted mini-board(s): ${activeMiniBoardIds.join(
        ", "
      )}.`;
    } else {
      statusText += "Determining next move...";
      console.warn(
        "updateGameStatusDisplay: No active mini-boards identified while game is active."
      );
    }
    gameStatusElement.innerHTML = statusText;
  }
}

// Ensure the DOM is fully loaded before attaching event listeners to elements
// that are part of the initial HTML (like the restart button).
// For dynamically created elements (like cells), event listeners are added during creation.
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, initializing game...");

  // Verify all elements exist
  console.log("Button elements check:", {
    startGameButton: !!startGameButtonElement,
    restartButton: !!restartButton,
    undoButton: !!undoButton,
    redoButton: !!redoButton,
    statsButton: !!statsButton
  });

  if (startGameButtonElement) {
    startGameButtonElement.addEventListener("click", startGame);
  } else {
    console.error("Start Game button not found!");
  }

  if (restartButton) {
    // Restart button now takes you back to mode selection
    restartButton.addEventListener("click", showModeSelectionScreen);
  } else {
    console.error("Restart button not found!");
  }
  if (playAgainButton) {
    playAgainButton.addEventListener("click", showModeSelectionScreen);
  } else {
    console.error("Play Again button not found on overlay!");
  }
  if (rulebookButton) {
    rulebookButton.addEventListener("click", () => {
      rulebookOverlay.classList.remove("overlay-hidden");
      rulebookOverlay.classList.add("visible");
    });
  }
  if (closeRulebookButton) {
    closeRulebookButton.addEventListener("click", () => {
      rulebookOverlay.classList.add("overlay-hidden");
      rulebookOverlay.classList.remove("visible");
    });
  }

  // New event listeners
  if (undoButton) {
    undoButton.addEventListener("click", undoMove);
  }

  if (redoButton) {
    redoButton.addEventListener("click", redoMove);
  }

  if (statsButton) {
    statsButton.addEventListener("click", () => {
      updateStatsDisplay();
      statsOverlay.classList.remove("overlay-hidden");
      statsOverlay.classList.add("visible");
    });
  }

  if (closeStatsButton) {
    closeStatsButton.addEventListener("click", () => {
      statsOverlay.classList.add("overlay-hidden");
      statsOverlay.classList.remove("visible");
    });
  }

  if (resetStatsButton) {
    resetStatsButton.addEventListener("click", resetStats);
  }

  // Game mode change handler
  document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'pvc') {
        if (aiDifficultyFieldset) aiDifficultyFieldset.classList.remove('hidden');
      } else {
        if (aiDifficultyFieldset) aiDifficultyFieldset.classList.add('hidden');
      }
    });
  });

  // Timer settings handlers
  if (enableTimerCheckbox) {
    enableTimerCheckbox.addEventListener('change', (e) => {
      if (timerDurationContainer) {
        if (e.target.checked) {
          timerDurationContainer.style.display = 'block';
        } else {
          timerDurationContainer.style.display = 'none';
        }
      }
    });
  }

  if (timerDurationSlider && timerDisplay) {
    timerDurationSlider.addEventListener('input', (e) => {
      timerDisplay.textContent = e.target.value + 's';
    });
  }

  // Initially, show the mode selection screen
  showModeSelectionScreen();
});

// AI Move Functions
function makeEasyMove() {
  // Random move
  const randomBoardIndex = Math.floor(
    Math.random() * activeMiniBoardIds.length
  );
  const chosenMiniBoardId = activeMiniBoardIds[randomBoardIndex];

  const emptyCells = [];
  miniBoardStates[chosenMiniBoardId].cells.forEach((cell, index) => {
    if (cell === null) emptyCells.push(index);
  });

  if (emptyCells.length === 0)
    return { chosenMiniBoardId: null, chosenCellIndex: null };

  const randomCellIndex = Math.floor(Math.random() * emptyCells.length);
  return { chosenMiniBoardId, chosenCellIndex: emptyCells[randomCellIndex] };
}

function makeMediumMove() {
  // Try to win a mini-board, block opponent from winning, then use strategy

  // Priority 1: Win a mini-board immediately
  for (const boardId of activeMiniBoardIds) {
    const winMove = findWinningMove(boardId, AI_PLAYER);
    if (winMove !== null) {
      return { chosenMiniBoardId: boardId, chosenCellIndex: winMove };
    }
  }

  // Priority 2: Block opponent from winning a mini-board
  for (const boardId of activeMiniBoardIds) {
    const blockMove = findWinningMove(boardId, HUMAN_PLAYER);
    if (blockMove !== null) {
      return { chosenMiniBoardId: boardId, chosenCellIndex: blockMove };
    }
  }

  // Priority 3: Try to set up future wins (two in a row)
  for (const boardId of activeMiniBoardIds) {
    const setupMove = findSetupMove(boardId, AI_PLAYER);
    if (setupMove !== null) {
      return { chosenMiniBoardId: boardId, chosenCellIndex: setupMove };
    }
  }

  // Priority 4: Strategic positioning (center > corners > edges)
  const strategicMove = findStrategicMove();
  if (strategicMove) return strategicMove;

  // Fallback: random move
  return makeEasyMove();
}

function makeHardMove() {
  // Advanced strategy: comprehensive game analysis

  // Priority 1: Win the game immediately by completing main board
  const gameWinMove = findGameWinningMove();
  if (gameWinMove) return gameWinMove;

  // Priority 2: Block opponent from winning the game
  const gameBlockMove = findGameBlockingMove();
  if (gameBlockMove) return gameBlockMove;

  // Priority 3: Win a mini-board (but consider strategic value)
  const strategicWinMove = findStrategicWinMove();
  if (strategicWinMove) return strategicWinMove;

  // Priority 4: Block opponent from winning a mini-board
  for (const boardId of activeMiniBoardIds) {
    const blockMove = findWinningMove(boardId, HUMAN_PLAYER);
    if (blockMove !== null) {
      return { chosenMiniBoardId: boardId, chosenCellIndex: blockMove };
    }
  }

  // Priority 5: Try to create fork opportunities (multiple threats)
  const forkMove = findForkMove();
  if (forkMove) return forkMove;

  // Priority 6: Block opponent's fork attempts
  const blockForkMove = findBlockForkMove();
  if (blockForkMove) return blockForkMove;

  // Priority 7: Try to set up future wins
  for (const boardId of activeMiniBoardIds) {
    const setupMove = findSetupMove(boardId, AI_PLAYER);
    if (setupMove !== null) {
      return { chosenMiniBoardId: boardId, chosenCellIndex: setupMove };
    }
  }

  // Priority 8: Strategic positioning in key boards
  const keyBoardMove = findKeyBoardMove();
  if (keyBoardMove) return keyBoardMove;

  // Priority 9: General strategic positioning
  const strategicMove = findStrategicMove();
  if (strategicMove) return strategicMove;

  // Fallback: random move
  return makeEasyMove();
}

function findWinningMove(boardId, player) {
  const cells = miniBoardStates[boardId].cells;
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (cells[a] === player && cells[b] === player && cells[c] === null)
      return c;
    if (cells[a] === player && cells[c] === player && cells[b] === null)
      return b;
    if (cells[b] === player && cells[c] === player && cells[a] === null)
      return a;
  }

  return null;
}

function findGameWinningMove() {
  // Check if AI can win the main board by winning a specific mini-board
  const winPatterns = [
    ["t1", "t2", "t3"],
    ["m1", "m2", "m3"],
    ["b1", "b2", "b3"],
    ["t1", "m1", "b1"],
    ["t2", "m2", "b2"],
    ["t3", "m3", "b3"],
    ["t1", "m2", "b3"],
    ["t3", "m2", "b1"],
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (
      mainBoardWinners[a] === AI_PLAYER &&
      mainBoardWinners[b] === AI_PLAYER &&
      mainBoardWinners[c] === null &&
      activeMiniBoardIds.includes(c)
    ) {
      const winMove = findWinningMove(c, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: c, chosenCellIndex: winMove };
      }
    }
    if (
      mainBoardWinners[a] === AI_PLAYER &&
      mainBoardWinners[c] === AI_PLAYER &&
      mainBoardWinners[b] === null &&
      activeMiniBoardIds.includes(b)
    ) {
      const winMove = findWinningMove(b, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: b, chosenCellIndex: winMove };
      }
    }
    if (
      mainBoardWinners[b] === AI_PLAYER &&
      mainBoardWinners[c] === AI_PLAYER &&
      mainBoardWinners[a] === null &&
      activeMiniBoardIds.includes(a)
    ) {
      const winMove = findWinningMove(a, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: a, chosenCellIndex: winMove };
      }
    }
  }

  return null;
}

function findGameBlockingMove() {
  // Check if AI needs to block human from winning the main board
  const winPatterns = [
    ["t1", "t2", "t3"],
    ["m1", "m2", "m3"],
    ["b1", "b2", "b3"],
    ["t1", "m1", "b1"],
    ["t2", "m2", "b2"],
    ["t3", "m3", "b3"],
    ["t1", "m2", "b3"],
    ["t3", "m2", "b1"],
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (
      mainBoardWinners[a] === HUMAN_PLAYER &&
      mainBoardWinners[b] === HUMAN_PLAYER &&
      mainBoardWinners[c] === null &&
      activeMiniBoardIds.includes(c)
    ) {
      const winMove = findWinningMove(c, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: c, chosenCellIndex: winMove };
      }
    }
    if (
      mainBoardWinners[a] === HUMAN_PLAYER &&
      mainBoardWinners[c] === HUMAN_PLAYER &&
      mainBoardWinners[b] === null &&
      activeMiniBoardIds.includes(b)
    ) {
      const winMove = findWinningMove(b, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: b, chosenCellIndex: winMove };
      }
    }
    if (
      mainBoardWinners[b] === HUMAN_PLAYER &&
      mainBoardWinners[c] === HUMAN_PLAYER &&
      mainBoardWinners[a] === null &&
      activeMiniBoardIds.includes(a)
    ) {
      const winMove = findWinningMove(a, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: a, chosenCellIndex: winMove };
      }
    }
  }

  return null;
}

function findStrategicMove() {
  // Prefer center cells, then corners, then edges
  const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // center, corners, edges

  for (const boardId of activeMiniBoardIds) {
    const cells = miniBoardStates[boardId].cells;
    for (const cellIndex of priorities) {
      if (cells[cellIndex] === null) {
        return { chosenMiniBoardId: boardId, chosenCellIndex: cellIndex };
      }
    }
  }

  return null;
}

function findSetupMove(boardId, player) {
  // Find moves that create two-in-a-row opportunities
  const cells = miniBoardStates[boardId].cells;
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    // Check if we can create a two-in-a-row situation
    if (cells[a] === player && cells[b] === null && cells[c] === null) return b;
    if (cells[a] === null && cells[b] === player && cells[c] === null) return a;
    if (cells[a] === null && cells[b] === null && cells[c] === player) return b;
  }

  return null;
}

function findStrategicWinMove() {
  // Prioritize winning boards that are strategically important (center, corners)
  const boardPriority = ["m2", "t1", "t3", "b1", "b3", "t2", "m1", "m3", "b2"];

  for (const boardId of boardPriority) {
    if (activeMiniBoardIds.includes(boardId)) {
      const winMove = findWinningMove(boardId, AI_PLAYER);
      if (winMove !== null) {
        return { chosenMiniBoardId: boardId, chosenCellIndex: winMove };
      }
    }
  }

  return null;
}

function findForkMove() {
  // Try to create multiple winning threats simultaneously
  for (const boardId of activeMiniBoardIds) {
    const cells = miniBoardStates[boardId].cells;
    for (let i = 0; i < 9; i++) {
      if (cells[i] === null) {
        // Temporarily place AI move
        cells[i] = AI_PLAYER;

        // Count how many ways AI can win after this move
        let winningOpportunities = 0;
        const winPatterns = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];

        for (const pattern of winPatterns) {
          const [a, b, c] = pattern;
          const line = [cells[a], cells[b], cells[c]];
          const aiCount = line.filter((cell) => cell === AI_PLAYER).length;
          const emptyCount = line.filter((cell) => cell === null).length;

          if (aiCount === 2 && emptyCount === 1) {
            winningOpportunities++;
          }
        }

        // Undo temporary move
        cells[i] = null;

        // If this creates multiple winning opportunities, it's a fork
        if (winningOpportunities >= 2) {
          return { chosenMiniBoardId: boardId, chosenCellIndex: i };
        }
      }
    }
  }

  return null;
}

function findBlockForkMove() {
  // Block opponent's fork attempts
  for (const boardId of activeMiniBoardIds) {
    const cells = miniBoardStates[boardId].cells;
    for (let i = 0; i < 9; i++) {
      if (cells[i] === null) {
        // Temporarily place human move
        cells[i] = HUMAN_PLAYER;

        // Count how many ways human can win after this move
        let winningOpportunities = 0;
        const winPatterns = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];

        for (const pattern of winPatterns) {
          const [a, b, c] = pattern;
          const line = [cells[a], cells[b], cells[c]];
          const humanCount = line.filter(
            (cell) => cell === HUMAN_PLAYER
          ).length;
          const emptyCount = line.filter((cell) => cell === null).length;

          if (humanCount === 2 && emptyCount === 1) {
            winningOpportunities++;
          }
        }

        // Undo temporary move
        cells[i] = null;

        // If this would create multiple winning opportunities for human, block it
        if (winningOpportunities >= 2) {
          return { chosenMiniBoardId: boardId, chosenCellIndex: i };
        }
      }
    }
  }

  return null;
}

function findKeyBoardMove() {
  // Focus on center and corner boards for strategic advantage
  const keyBoards = ["m2", "t1", "t3", "b1", "b3"];
  const priorities = [4, 0, 2, 6, 8]; // center, corners

  for (const boardId of keyBoards) {
    if (activeMiniBoardIds.includes(boardId)) {
      const cells = miniBoardStates[boardId].cells;
      for (const cellIndex of priorities) {
        if (cells[cellIndex] === null) {
          return { chosenMiniBoardId: boardId, chosenCellIndex: cellIndex };
        }
      }
    }
  }

  return null;
}

// Undo/Redo System
function saveGameState() {
  // Remove any future states if we're not at the end of history
  if (historyIndex < gameHistory.length - 1) {
    gameHistory = gameHistory.slice(0, historyIndex + 1);
  }

  const state = {
    miniBoardStates: JSON.parse(JSON.stringify(miniBoardStates)),
    mainBoardWinners: { ...mainBoardWinners },
    currentPlayer,
    lastPlayedOuterBoardId,
    activeMiniBoardIds: [...activeMiniBoardIds],
    gameActive,
  };

  gameHistory.push(state);
  historyIndex = gameHistory.length - 1;

  // Limit history size to prevent memory issues
  if (gameHistory.length > 50) {
    gameHistory.shift();
    historyIndex--;
  }
}

function undoMove() {
  if (historyIndex <= 0 || !gameActive) return;

  historyIndex--;
  restoreGameState(gameHistory[historyIndex]);
  updateUndoRedoButtons();
}

function redoMove() {
  if (historyIndex >= gameHistory.length - 1 || !gameActive) return;

  historyIndex++;
  restoreGameState(gameHistory[historyIndex]);
  updateUndoRedoButtons();
}

function restoreGameState(state) {
  miniBoardStates = JSON.parse(JSON.stringify(state.miniBoardStates));
  mainBoardWinners = { ...state.mainBoardWinners };
  currentPlayer = state.currentPlayer;
  lastPlayedOuterBoardId = state.lastPlayedOuterBoardId;
  activeMiniBoardIds = [...state.activeMiniBoardIds];
  gameActive = state.gameActive;

  // Update UI
  rebuildBoard();
  updateActiveMiniBoardsAndHighlight();
  updateGameStatusDisplay();

  // Restart timer if needed
  if (timerEnabled && gameActive) {
    clearTimer();
    startTimer();
  }
}

function rebuildBoard() {
  // Clear and rebuild the entire board from state
  mainBoardElement.innerHTML = "";

  miniBoards.flat().forEach((boardId) => {
    const miniBoardDiv = document.createElement("div");
    miniBoardDiv.classList.add("mini-board");
    miniBoardDiv.id = boardId;

    // Add won class if board is won
    if (miniBoardStates[boardId].winner) {
      miniBoardDiv.classList.add(
        `won-${miniBoardStates[boardId].winner.toLowerCase()}`
      );
    }

    for (let i = 0; i < 9; i++) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.dataset.miniBoardId = boardId;
      cellDiv.dataset.cellIndex = i;
      cellDiv.addEventListener("click", handleCellClick);

      const cellValue = miniBoardStates[boardId].cells[i];
      if (cellValue) {
        cellDiv.textContent = cellValue;
        cellDiv.classList.add(cellValue.toLowerCase());
      }

      miniBoardDiv.appendChild(cellDiv);
    }

    // Redraw winning lines
    if (miniBoardStates[boardId].winner) {
      const winningPattern = checkWinner(
        miniBoardStates[boardId].cells,
        miniBoardStates[boardId].winner
      );
      if (winningPattern) {
        drawWinningLine(
          boardId,
          winningPattern,
          miniBoardStates[boardId].winner
        );
      }
    }

    mainBoardElement.appendChild(miniBoardDiv);
  });
}

function updateUndoRedoButtons() {
  if (undoButton) {
    undoButton.disabled = historyIndex <= 0 || !gameActive;
  }
  if (redoButton) {
    redoButton.disabled = historyIndex >= gameHistory.length - 1 || !gameActive;
  }
}

// Timer System
function startTimer() {
  if (!timerEnabled || !gameActive) return;

  currentTimer = timerDuration;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    currentTimer--;
    updateTimerDisplay();

    if (currentTimer <= 0) {
      handleTimerExpiry();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  currentTimer = null;
}

function updateTimerDisplay() {
  if (timerValue) {
    timerValue.textContent = currentTimer;
  }

  if (timerProgress) {
    const percentage = (currentTimer / timerDuration) * 100;
    timerProgress.style.width = percentage + "%";

    // Change color based on time remaining
    if (percentage <= 20) {
      timerProgress.style.backgroundColor = "#e74c3c";
    } else if (percentage <= 50) {
      timerProgress.style.backgroundColor = "#f39c12";
    } else {
      timerProgress.style.backgroundColor = "#2ecc71";
    }
  }
}

function handleTimerExpiry() {
  clearTimer();

  if (!gameActive) return;

  // Auto-play for current player
  if (gameMode === "pvc" && currentPlayer === AI_PLAYER) {
    makeComputerMove();
  } else {
    // For human players, make a random valid move
    const randomMove = makeEasyMove();
    if (randomMove.chosenMiniBoardId && randomMove.chosenCellIndex !== null) {
      const gameEnded = processMove(
        randomMove.chosenMiniBoardId,
        randomMove.chosenCellIndex,
        currentPlayer
      );
      if (!gameEnded) {
        lastPlayedOuterBoardId = randomMove.chosenMiniBoardId;
        currentPlayer =
          currentPlayer === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
        updateActiveMiniBoardsAndHighlight();
        updateGameStatusDisplay();
        updateUndoRedoButtons();

        if (timerEnabled && gameActive) {
          startTimer();
        }

        if (gameMode === "pvc" && currentPlayer === AI_PLAYER && gameActive) {
          mainBoardElement.style.pointerEvents = "none";
          setTimeout(() => {
            makeComputerMove();
            mainBoardElement.style.pointerEvents = "auto";
          }, 750);
        }
      }
    }
  }
}

// Statistics System
function loadStats() {
  const saved = localStorage.getItem("ultimateTicTacToeStats");
  if (saved) {
    gameStats = { ...gameStats, ...JSON.parse(saved) };
  }
}

function saveStats() {
  localStorage.setItem("ultimateTicTacToeStats", JSON.stringify(gameStats));
}

function recordGameResult(winner) {
  gameStats.gamesPlayed++;

  if (winner === "X") {
    gameStats.xWins++;
  } else if (winner === "O") {
    gameStats.oWins++;
  } else {
    gameStats.draws++;
  }

  if (gameStartTime) {
    const gameTime = (Date.now() - gameStartTime) / 1000;
    gameStats.totalGameTime += gameTime;
  }

  saveStats();
}

function updateStatsDisplay() {
  if (document.getElementById("games-played")) {
    document.getElementById("games-played").textContent = gameStats.gamesPlayed;
    document.getElementById("x-wins").textContent = gameStats.xWins;
    document.getElementById("o-wins").textContent = gameStats.oWins;
    document.getElementById("draws").textContent = gameStats.draws;

    const xWinRate =
      gameStats.gamesPlayed > 0
        ? ((gameStats.xWins / gameStats.gamesPlayed) * 100).toFixed(1) + "%"
        : "0%";
    document.getElementById("x-win-rate").textContent = xWinRate;

    const avgTime =
      gameStats.gamesPlayed > 0
        ? Math.round(gameStats.totalGameTime / gameStats.gamesPlayed) + "s"
        : "0s";
    document.getElementById("avg-time").textContent = avgTime;
  }
}

function resetStats() {
  if (confirm("Are you sure you want to reset all statistics?")) {
    gameStats = {
      gamesPlayed: 0,
      xWins: 0,
      oWins: 0,
      draws: 0,
      totalGameTime: 0,
    };
    saveStats();
    updateStatsDisplay();
  }
}

// Audio System
function playSound(audioElement) {
  if (audioElement && soundEnabled) {
    audioElement.currentTime = 0;
    audioElement.play().catch((e) => {
      // Ignore audio play errors (common on some browsers)
      console.log("Audio play failed:", e);
    });
  }
}
