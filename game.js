class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        
        // 方块形状定义
        this.shapes = [
            [[1,1,1,1]], // I
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1],[1,1]], // O
            [[1,1,0],[0,1,1]], // Z
            [[0,1,1],[1,1,0]] // S
        ];
        
        this.colors = [
            '#00f0f0', '#a000f0', '#f0a000', '#0000f0',
            '#f0f000', '#f00000', '#00f000'
        ];
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        this.initControls();
    }

    initControls() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            switch(e.keyCode) {
                case 37: // 左
                    this.moveLeft();
                    break;
                case 39: // 右
                    this.moveRight();
                    break;
                case 40: // 下
                    this.moveDown();
                    break;
                case 38: // 上
                    this.rotate();
                    break;
                case 32: // 空格
                    this.hardDrop();
                    break;
            }
        });
    }

    start() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        document.getElementById('score').textContent = this.score;
        
        if (!this.currentPiece) {
            this.currentPiece = this.generatePiece();
            this.nextPiece = this.generatePiece();
        }
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
    }

    generatePiece() {
        const index = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[index],
            color: this.colors[index],
            x: Math.floor((this.cols - this.shapes[index][0].length) / 2),
            y: 0
        };
    }

    moveLeft() {
        this.currentPiece.x--;
        if (this.isCollision()) {
            this.currentPiece.x++;
        }
        this.draw();
    }

    moveRight() {
        this.currentPiece.x++;
        if (this.isCollision()) {
            this.currentPiece.x--;
        }
        this.draw();
    }

    moveDown() {
        this.currentPiece.y++;
        if (this.isCollision()) {
            this.currentPiece.y--;
            this.freezePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            
            if (this.isCollision()) {
                this.gameOver = true;
                alert('游戏结束！得分：' + this.score);
            }
        }
        this.draw();
    }

    hardDrop() {
        while (!this.isCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.moveDown();
    }

    rotate() {
        const oldShape = this.currentPiece.shape;
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        this.currentPiece.shape = rotated;
        
        if (this.isCollision()) {
            this.currentPiece.shape = oldShape;
        }
        this.draw();
    }

    isCollision() {
        return this.currentPiece.shape.some((row, dy) =>
            row.some((value, dx) => {
                if (!value) return false;
                const newX = this.currentPiece.x + dx;
                const newY = this.currentPiece.y + dy;
                return newX < 0 || newX >= this.cols ||
                       newY >= this.rows ||
                       (newY >= 0 && this.board[newY][newX]);
            })
        );
    }

    freezePiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const y = this.currentPiece.y + dy;
                    const x = this.currentPiece.x + dx;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            document.getElementById('score').textContent = this.score;
        }
    }

    draw() {
        // 清空主画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制已固定的方块
        this.board.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    this.drawBlock(this.ctx, x, y, color);
                }
            });
        });
        
        // 绘制当前方块
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.drawBlock(
                        this.ctx,
                        this.currentPiece.x + dx,
                        this.currentPiece.y + dy,
                        this.currentPiece.color
                    );
                }
            });
        });
        
        // 清空预览画布
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // 绘制下一个方块
        const blockSizeNext = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSizeNext) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSizeNext) / 2;
        
        this.nextPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + dx * blockSizeNext,
                        offsetY + dy * blockSizeNext,
                        blockSizeNext - 1,
                        blockSizeNext - 1
                    );
                }
            });
        });
    }

    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
    }

    gameLoop() {
        if (!this.gameOver && this.isRunning) {
            if (!this.isPaused) {
                this.moveDown();
            }
            setTimeout(() => this.gameLoop(), 1000);
        }
    }
}

// 游戏初始化
window.onload = () => {
    const game = new Tetris();
};