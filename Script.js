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
