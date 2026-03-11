const canvas = document.getElementById('beakerCanvas');
const ctx = canvas.getContext('2d');
const grid = 30, rows = 20, cols = 10;

// 離子
const IONS = [
  { name: 'Na+', type: 'cation', color: '#FFD700', active: true },
  { name: 'Ag+', type: 'cation', color: '#C0C0C0', active: false },
  { name: 'Ba2+', type: 'cation', color: '#87CEEB', active: false },
  { name: 'Cl-', type: 'anion', color: '#7FFF00', active: false },
  { name: 'SO4 2-', type: 'anion', color: '#FF69B4', active: false },
  { name: 'OH-', type: 'anion', color: '#FF4500', active: false },
  { name: 'H+', type: 'cation', color: '#ffffff' },
    { name: 'Li+', type: 'cation', color: '#ff6666', active: true },
    { name: 'K+', type: 'cation', color: '#cc66ff', active: true },
    { name: 'Rb+', type: 'cation', color: '#ff33cc', active: true },
    { name: 'Cs+', type: 'cation', color: '#ff0066', active: true },
    { name: 'Fr+', type: 'cation', color: '#ff0000', active: true },
    { name: 'Be2+', type: 'cation', color: '#99ff33' },
    { name: 'Mg2+', type: 'cation', color: '#66ff66' },
    { name: 'Ca2+', type: 'cation', color: '#33ff33' },
    { name: 'Sr2+', type: 'cation', color: '#00ff66' },
    { name: 'Ba2+', type: 'cation', color: '#00ff99' },
    { name: '(Hg2)2+', type: 'cation', color: '#b3b3b3' },
    { name: 'Cu+', type: 'cation', color: '#ff9933' },
    { name: 'Pb2+', type: 'cation', color: '#666666' },

};

let board = Array.from({ length: rows }, () => Array(cols).fill(null));
let score = 0, currentPiece = null, nextPiece = null;
let gameState = 'STOPPED'; 
let gameInterval;

// 1. 初始化與生成
function spawnPiece() {
  const ion = IONS[Math.floor(Math.random() * IONS.length)];
  return { ...ion, x: 4, y: 0 };
}

// 2. 遊戲核心控制 (整合原本的 toggle 與 start)
function startGame() {
  if (gameState !== 'RUNNING') {
    gameState = 'RUNNING';
    score = 0;
    board = Array.from({ length: rows }, () => Array(cols).fill(null));
    nextPiece = spawnPiece();
    currentPiece = spawnPiece();
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('score').innerText = '0';
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 500);
    draw();
  }
}

function togglePause() {
  if (gameState === 'RUNNING') {
    gameState = 'PAUSED';
    document.getElementById('overlay').innerText = '實驗暫停中 (按 Shift 繼續)';
    document.getElementById('overlay').style.display = 'flex';
  } else if (gameState === 'PAUSED') {
    gameState = 'RUNNING';
    document.getElementById('overlay').style.display = 'none';
  }
}

// 3. 移動函式 (為了讓鍵盤監聽能呼叫)
function moveLeft() {
  if (canMove(currentPiece.x - 1, currentPiece.y)) currentPiece.x--;
}
function moveRight() {
  if (canMove(currentPiece.x + 1, currentPiece.y)) currentPiece.x++;
}
function moveDown() {
  if (canMove(currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
  } else {
    lockPiece();
  }
}

function canMove(nx, ny) {
  return nx >= 0 && nx < cols && ny < rows && !board[ny][nx];
}

function lockPiece() {
  board[currentPiece.y][currentPiece.x] = currentPiece;
  handleChemistry(currentPiece.y, currentPiece.x);
  currentPiece = nextPiece;
  nextPiece = spawnPiece();
  document.getElementById('next-preview').innerText = nextPiece.name;
  if (!canMove(currentPiece.x, currentPiece.y)) {
    alert("燒杯爆了！最終分數: " + score);
    location.reload();
  }
}

// 4. 化學反應邏輯
function handleChemistry(r, c) {
  const item = board[r][c];
  if (!item) return;


  if (r < rows - 1 && board[r+1][c]) {
    const other = board[r+1][c];
    let cation = item.type === 'cation' ? item : (other.type === 'cation' ? other : null);
    let anion = item.type === 'anion' ? item : (other.type === 'anion' ? other : null);

    if (cation && anion) {
      if (checkSolubility(cation, anion)) {
        updateStatus(`形成 ${cation.name}${anion.name} 沉澱！`, 0);
      } else {
        updateStatus(`溶解反應：${cation.name} + ${anion.name}`, 20);
        board[r][c] = null;
        board[r+1][c] = null;
      }
    }
  }
}

function checkSolubility(cation, anion) {
  const c = cation.name, a = anion.name;
  if (['Li+', 'Na+', 'K+', 'H+'].includes(c)) return false;
  if (a === 'Cl-' && ['Ag+', 'Pb2+'].includes(c)) return true;
  if (a === 'SO4 2-' && ['Ba2+', 'Pb2+', 'Ca2+'].includes(c)) return true;
  if (a === 'OH-' && !['Li+', 'Na+', 'K+', 'Ba2+', 'Ca2+'].includes(c)) return true;
  return false;
}

function updateStatus(msg, points) {
  document.getElementById('status').innerText = msg;
  score += points;
  document.getElementById('score').innerText = score;
}

// 5. 遊戲循環與繪圖
function gameLoop() {
  if (gameState !== 'RUNNING') return;
  moveDown();
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 200, 255, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) drawBlock(c, r, cell.color, cell.name);
    });
  });
  if (currentPiece) drawBlock(currentPiece.x, currentPiece.y, currentPiece.color, currentPiece.name);
}

function drawBlock(x, y, color, text) {
  ctx.fillStyle = color;
  ctx.fillRect(x * grid, y * grid, grid - 2, grid - 2);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x * grid, y * grid, grid - 2, grid - 2);
  ctx.fillStyle = "#000";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, x * grid + grid / 2, y * grid + grid / 1.5);
}

// 6. 整合後的鍵盤監聽
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === 'STOPPED') startGame();
  }
  if (e.code.includes('Shift')) {
    e.preventDefault();
    togglePause();
  }
  if (gameState === 'RUNNING') {
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
    if (e.key === 'ArrowDown') moveDown();
    draw();
  }
});

// 啟動初始化繪圖
draw();
