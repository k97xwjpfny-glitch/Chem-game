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
let score = 0, currentPiece = null, nextPiece = spawnPiece();
let gameState = 'STOPPED'; // STOPPED, RUNNING, PAUSED
let gameInterval;

function spawnPiece() {
  return { ...IONS[Math.floor(Math.random() * IONS.length)], x: 4, y: 0 };
}

function toggleGame() {
  if (gameState === 'STOPPED') {
    gameState = 'RUNNING';
    document.getElementById('overlay').style.display = 'none';
    currentPiece = nextPiece;
    nextPiece = spawnPiece();
    gameInterval = setInterval(gameLoop, 500);
  }
}

function togglePause() {
  if (gameState === 'RUNNING') {
    gameState = 'PAUSED';
    document.getElementById('overlay').innerText = '實驗暫停中';
    document.getElementById('overlay').style.display = 'flex';
  } else if (gameState === 'PAUSED') {
    gameState = 'RUNNING';
    document.getElementById('overlay').style.display = 'none';
  }
}
function handleChemistry(r, c) {
    const item = board[r][c];
    if (!item) return;

    // 尋找鄰近反應 (檢查上下左右，以向下為主)
    if (r < rows - 1 && board[r+1][c]) {
        const other = board[r+1][c];
        
        // 判定誰是陽離子，誰是陰離子
        let cation = item.type === 'cation' ? item : (other.type === 'cation' ? other : null);
        let anion = item.type === 'anion' ? item : (other.type === 'anion' ? other : null);

        if (cation && anion) {
            const isPrecipitate = checkSolubility(cation, anion);
            if (isPrecipitate) {
                updateStatus(`形成 ${cation.name}${anion.name} 沉澱堆積！`, 0);
            } else {
                updateStatus(`${cation.name} 與 ${anion.name} 溶解！`, 20);
                board[r][c] = null;
                board[r+1][c] = null;
            }
        }
    }
}

function checkSolubility(cation, anion) {
    const c = cation.name;
    const a = anion.name;

    // 規則 1: 硝酸根(NO3-)、醋酸根(CH3COO-)、高氯酸根(ClO4-)、氯酸根(ClO3-) -> 全溶
    if (['NO3-', 'CH3COO-',  '(ClO4)-', '(ClO3)-'].includes(a)) return false;

    // 規則 2: 1A族 (Li+, K+, Rb+, Cs+, Fr+) 與 NH4+ -> 全溶 (H+ 視情況)
    if (['Li+', 'K+', 'Rb+','Na+', 'Cs+', 'Fr+', 'NH4+', 'H+'].includes(c)) return false;

    // 規則 3: 氯、溴、碘離子 (Cl-, Br-, I-) -> 遇 Ag+, Cu+, (Hg2)2+, Pb2+, Ti+ 沉澱
    if (['Cl-', 'Br-', 'I-'].includes(a)) {
        return ['Ag+', 'Cu+', '(Hg2)2+', 'Pb2+', 'Ti+'].includes(c);
    }

    // 規則 4: 硫酸根 (SO4 2-) -> 遇 Pb2+, Ba2+, Sr2+, Ca2+ 沉澱
    if (a === 'SO4 2-') {
        return ['Pb2+', 'Ba2+', 'Sr2+', 'Ca2+'].includes(c);
    }

    // 規則 5: 氟離子 (F-) -> 遇 2A族 (Mg2+, Ca2+, Sr2+, Ba2+...) 與 Pb2+ 沉澱
    if (a === 'F-') {
        return ['Mg2+', 'Ca2+', 'Sr2+', 'Ba2+', 'Ra2+', 'Pb2+'].includes(c);
    }

    // 規則 6: 氫氧根 (OH-) -> 1A, NH4+, Ba2+, Sr2+, Ca2+ 以外皆沉澱
    if (a === 'OH-') {
        return !['Li+', 'K+', 'Rb+', 'Cs+', 'Fr+', 'NH4+', 'Ba2+', 'Sr2+', 'Ca2+'].includes(c);
    }

    // 規則 7: 碳酸根、磷酸根、草酸根、亞硫酸根、鉻酸根、硫離子 -> 1A, NH4+ 以外皆沉澱
    if (['(CO3)2-', '(PO4)3-', '(C2O4)2-', '(SO3)2-', '(CrO4)2-', 'S2-'].includes(a)) {
        return !['Li+', 'K+', 'Rb+', 'Cs+', 'Fr+', 'NH4+'].includes(c);
    }

    return false; // 預設溶解
}

function updateStatus(msg, points) {
  document.getElementById('status').innerText = msg;
  score += points;
  document.getElementById('score').innerText = score;
}

function gameLoop() {
  if (gameState !== 'RUNNING') return;
  
  if (canMove(currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
  } else {
    board[currentPiece.y][currentPiece.x] = currentPiece;
    handleChemistry(currentPiece.y, currentPiece.x);
    currentPiece = nextPiece;
    nextPiece = spawnPiece();
    document.getElementById('next-preview').innerText = nextPiece.name;
    
    // 檢查死亡
    if (!canMove(currentPiece.x, currentPiece.y)) {
      alert("燒杯爆了！最終分數: " + score);
      location.reload();
    }
  }
  draw();
}

function canMove(nx, ny) {
  return nx >= 0 && nx < cols && ny < rows && !board[ny][nx];
}

function canMove(nx, ny) {
  return nx >= 0 && nx < cols && ny < rows && !board[ny][nx];
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space') toggleGame();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') togglePause();
  if (gameState !== 'RUNNING') return;
  
  if (e.key === 'ArrowLeft' && canMove(currentPiece.x - 1, currentPiece.y)) currentPiece.x--;
  if (e.key === 'ArrowRight' && canMove(currentPiece.x + 1, currentPiece.y)) currentPiece.x++;
  if (e.key === 'ArrowDown') gameLoop();
  draw();
});


function draw() {
  // 1. 清除畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. 水
  ctx.fillStyle = "rgba(0, 200, 255, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. 堆積在底部的離子 (board)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = board[r][c];
      if (cell) {
        drawBlock(c, r, cell.color, cell.name);
      }
    }
  }

  // 4. 正在掉落的離子 (currentPiece)
  if (currentPiece) {
    drawBlock(currentPiece.x, currentPiece.y, currentPiece.color, currentPiece.name);
  }
}

// 方塊與文字
function drawBlock(x, y, color, text) {
  // 離子方塊
  ctx.fillStyle = color;
  ctx.fillRect(x * grid, y * grid, grid - 2, grid - 2);
  
  // 白框
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x * grid, y * grid, grid - 2, grid - 2);

  // 離子名稱 
  ctx.fillStyle = "#000"; 
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, x * grid + grid / 2, y * grid + grid / 1.5);
}

// 監聽鍵盤按下事件
window.addEventListener('keydown', function(e) {
    // 檢查目前遊戲狀態
    if (gameState === 'STOPPED' || gameState === 'GAMEOVER') {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault(); // 阻止頁面滾動
            startGame(); // 呼叫開始遊戲的函式
        }
        return;
    }

    if (gameState === 'RUNNING') {
        switch (e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                moveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveRight();
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveDown();
                break;
            case 'Space':
                // 遊戲中按空白鍵可以設定為「瞬間下落」或「暫停」
                e.preventDefault();
                // dropPiece(); // 如果你有寫瞬間下落功能
                break;
        }
    }
});
