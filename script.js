const board = document.getElementById("board");
const startBtn = document.getElementById("startBtn");
const timerLabel = document.getElementById("timer");
const clearMessage = document.getElementById("clearMessage");

let tiles = [];
let emptyIndex = 8;
let tileElements = {};
let startTime = null;
let timerInterval = null;
let playing = false;

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
      tile.addEventListener("click", () => moveTile(num));
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
  startBtn.disabled = false;
}

function shuffle(times = 20) {
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
  startBtn.textContent = "Trying...";
  startBtn.disabled = true;
  createTiles();
  setTimeout(() => {
    shuffle(20);
  }, 300);
});
