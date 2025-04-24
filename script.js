const board = document.getElementById("board");
const startBtn = document.getElementById("startBtn");
const helpBtn = document.getElementById("helpBtn");
const timerLabel = document.getElementById("timer");
const clearMessage = document.getElementById("clearMessage");

let tiles = [];
let emptyIndex = 8;
let tileElements = {};
let startTime = null;
let timerInterval = null;
let playing = false;
let isAiSolving = false;

function createTiles() {
  tiles = [...Array(8).keys()].map(n => n + 1);
  tiles.push(null);
  emptyIndex = 8;
  initRender();
}

function initRender() {
  board.innerHTML = "";
  tileElements = {};

  tiles.forEach((num, i) => {
    if (num !== null) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = num;
      tile.dataset.value = num;
      tile.style.transform = getTransform(i);
      tile.addEventListener("click", () => {
        if (!isAiSolving) moveTile(num);
      });
      board.appendChild(tile);
      tileElements[num] = tile;
    }
  });
}

function updateTilePositions() {
  for (let i = 0; i < tiles.length; i++) {
    const num = tiles[i];
    if (num !== null && tileElements[num]) {
      tileElements[num].style.transform = getTransform(i);
    }
  }
}

function getTransform(i) {
  return `translate(${(i % 3) * 85}px, ${Math.floor(i / 3) * 85}px)`;
}

function moveTile(num) {
  if (!playing) return;
  const index = tiles.indexOf(num);
  const diff = Math.abs(index - emptyIndex);
  const valid =
    (diff === 1 && Math.floor(index / 3) === Math.floor(emptyIndex / 3)) ||
    diff === 3;

  if (valid) {
    console.log(`[Move] ${num} (${index}) → empty (${emptyIndex})`);
    [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
    emptyIndex = index;
    updateTilePositions();
    if (checkClear()) showResult();
  }
}

function checkClear() {
  for (let i = 0; i < 8; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  console.log(`[Game] CLEAR`);
  return true;
}

function showResult() {
  clearInterval(timerInterval);
  playing = false;
  clearMessage.classList.remove("hidden");
  startBtn.textContent = "Try again?";
  helpBtn.textContent = "HELP AI !!";
  startBtn.disabled = false;
  helpBtn.disabled = true;
}

function shuffle(times = 20, onComplete = () => {}) {
  console.log(`[Shuffle] START (${times} times)`);
  let count = 0;
  let previousEmptyIndex = -1;

  const interval = setInterval(() => {
    const moves = [1, -1, 3, -3];
    const possible = moves
      .map(d => emptyIndex + d)
      .filter(i =>
        i >= 0 &&
        i < 9 &&
        i !== previousEmptyIndex &&
        moveAllowed(emptyIndex, i)
      );

    const rand = possible[Math.floor(Math.random() * possible.length)];
    const movedTile = tiles[rand];
    console.log(`[Shuffle ${count + 1}] move ${movedTile} (${rand}) → empty (${emptyIndex})`);

    [tiles[emptyIndex], tiles[rand]] = [tiles[rand], tiles[emptyIndex]];
    previousEmptyIndex = emptyIndex;
    emptyIndex = rand;
    updateTilePositions();

    count++;
    if (count >= times) {
      clearInterval(interval);
      console.log(`[Shuffle] DONE`);
      startTime = Date.now();
      playing = true;
      timerInterval = setInterval(() => {
        const now = ((Date.now() - startTime) / 1000).toFixed(1);
        timerLabel.textContent = now;
      }, 100);
      onComplete(); // シャッフル終了時にコールバック実行
    }
  }, 300);
}


function moveAllowed(from, to) {
  const diff = Math.abs(from - to);
  return (diff === 1 && Math.floor(from / 3) === Math.floor(to / 3)) || diff === 3;
}

startBtn.addEventListener("click", () => {
  console.log(`[Game] START`);
  clearMessage.classList.add("hidden");
  startBtn.textContent = "Wait...";
  startBtn.disabled = true;
  helpBtn.disabled = true;

  createTiles();

  setTimeout(() => {
    shuffle(20, () => {
      startBtn.textContent = "Trying...";
      helpBtn.disabled = false;
    });
  }, 300);
});

function solvePuzzle(initialTiles) {
  const goal = [...Array(8).keys()].map(n => n + 1).concat(null);
  const directions = [1, -1, 3, -3];

  function getNeighbors(state) {
    const neighbors = [];
    const empty = state.indexOf(null);
    for (const d of directions) {
      const target = empty + d;
      if (
        target < 0 || target >= 9 ||
        (d === 1 && Math.floor(empty / 3) !== Math.floor(target / 3)) ||
        (d === -1 && Math.floor(empty / 3) !== Math.floor(target / 3))
      ) continue;
      const newState = state.slice();
      [newState[empty], newState[target]] = [newState[target], newState[empty]];
      neighbors.push({ state: newState, move: state[target] });
    }
    return neighbors;
  }

  function manhattan(state) {
    let dist = 0;
    for (let i = 0; i < 9; i++) {
      const val = state[i];
      if (val === null) continue;
      const goalIndex = val - 1;
      dist += Math.abs(i % 3 - goalIndex % 3) + Math.abs(Math.floor(i / 3) - Math.floor(goalIndex / 3));
    }
    return dist;
  }

  const open = [{ state: initialTiles, path: [], cost: 0 }];
  const visited = new Set();

  while (open.length > 0) {
    open.sort((a, b) => (a.cost + manhattan(a.state)) - (b.cost + manhattan(b.state)));
    const current = open.shift();
    const key = current.state.join(',');
    if (visited.has(key)) continue;
    visited.add(key);

    if (key === goal.join(',')) return current.path;

    for (const neighbor of getNeighbors(current.state)) {
      open.push({
        state: neighbor.state,
        path: [...current.path, neighbor.move],
        cost: current.cost + 1
      });
    }
  }
  return [];
}

function autoSolve() {
  const solution = solvePuzzle(tiles);
  console.log('[AI] solution:', solution);

  let index = 0;
  const interval = setInterval(() => {
    if (index >= solution.length) {
      clearInterval(interval);
      isAiSolving = false;
      showResult();
      return;
    }
    moveTile(solution[index]);
    index++;
  }, 300);
}

helpBtn.addEventListener("click", () => {
  console.log("[HELP AI] START");
  if (!playing) return;
  startBtn.textContent = "give up...";
  helpBtn.textContent = "solving ...";
  helpBtn.disabled = true;
  isAiSolving = true;
  autoSolve();
});
