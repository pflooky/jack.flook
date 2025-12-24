// FPS Game for Mobile
class FPSGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused
        this.score = 0;
        this.health = 100;
        this.wave = 1;
        this.lastTime = 0;
        
        // Player
        this.player = {
            x: 0,
            y: 0,
            size: 20,
            speed: 3,
            angle: 0
        };
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 8;
        
        // Enemies
        this.enemies = [];
        this.enemySpeed = 1.5;
        this.enemySpawnRate = 0.02;
        this.enemiesKilled = 0;
        
        // Particles
        this.particles = [];
        
        // Input handling
        this.keys = {};
        this.touches = {};
        
        this.setupCanvas();
        this.setupControls();
        
        // Game loop
        this.animationId = null;
    }
    
    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            if (this.player) {
                this.player.x = this.canvas.width / 2;
                this.player.y = this.canvas.height / 2;
            }
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Touch controls
        const moveButtons = {
            moveUp: { x: 0, y: -1 },
            moveDown: { x: 0, y: 1 },
            moveLeft: { x: -1, y: 0 },
            moveRight: { x: 1, y: 0 }
        };
        
        Object.keys(moveButtons).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const dir = moveButtons[id];
                    this.keys[`move${id.replace('move', '')}`] = true;
                });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    const dir = moveButtons[id];
                    this.keys[`move${id.replace('move', '')}`] = false;
                });
                
                btn.addEventListener('mousedown', () => {
                    this.keys[`move${id.replace('move', '')}`] = true;
                });
                
                btn.addEventListener('mouseup', () => {
                    this.keys[`move${id.replace('move', '')}`] = false;
                });
            }
        });
        
        // Shoot button
        const shootBtn = document.getElementById('shootBtn');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[' '] = true;
            });
            
            shootBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[' '] = false;
            });
            
            shootBtn.addEventListener('mousedown', () => {
                this.keys[' '] = true;
            });
            
            shootBtn.addEventListener('mouseup', () => {
                this.keys[' '] = false;
            });
        }
        
        // Canvas touch for aiming
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.updatePlayerAngle(x, y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.updatePlayerAngle(x, y);
        });
    }
    
    updatePlayerAngle(mouseX, mouseY) {
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = 100;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.updateUI();
        this.gameLoop();
    }
    
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update player movement
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys['w'] || this.keys['moveup']) moveY -= 1;
        if (this.keys['s'] || this.keys['movedown']) moveY += 1;
        if (this.keys['a'] || this.keys['moveleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['moveright']) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        this.player.x += moveX * this.player.speed;
        this.player.y += moveY * this.player.speed;
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));
        
        // Shooting
        if (this.keys[' ']) {
            this.shoot();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += Math.cos(bullet.angle) * this.bulletSpeed;
            bullet.y += Math.sin(bullet.angle) * this.bulletSpeed;
            
            // Remove if out of bounds
            if (bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                return false;
            }
            
            return true;
        });
        
        // Spawn enemies
        if (Math.random() < this.enemySpawnRate) {
            this.spawnEnemy();
        }
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            enemy.x += (dx / dist) * this.enemySpeed;
            enemy.y += (dy / dist) * this.enemySpeed;
            
            // Check collision with player
            if (dist < this.player.size + enemy.size) {
                this.health -= 2;
                this.createParticles(enemy.x, enemy.y, '#ff006e');
                return false;
            }
            
            // Check collision with bullets
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                const bulletDist = Math.sqrt(
                    Math.pow(bullet.x - enemy.x, 2) + 
                    Math.pow(bullet.y - enemy.y, 2)
                );
                
                if (bulletDist < enemy.size) {
                    this.score += 10;
                    this.enemiesKilled++;
                    this.createParticles(enemy.x, enemy.y, '#00d4ff');
                    this.bullets.splice(i, 1);
                    return false;
                }
            }
            
            return true;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
        
        // Check wave progression
        if (this.enemiesKilled >= this.wave * 10) {
            this.wave++;
            this.enemySpeed += 0.2;
            this.enemySpawnRate += 0.005;
            this.enemiesKilled = 0;
        }
        
        // Check game over
        if (this.health <= 0) {
            this.gameState = 'menu';
            this.updateUI();
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
        
        this.updateUI();
    }
    
    shoot() {
        // Limit shooting rate
        const now = Date.now();
        if (!this.lastShot || now - this.lastShot > 150) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                angle: this.player.angle,
                size: 4
            });
            this.lastShot = now;
        }
    }
    
    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -20;
                break;
            case 1: // Right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        this.enemies.push({
            x: x,
            y: y,
            size: 15 + Math.random() * 10,
            color: `hsl(${Math.random() * 60 + 300}, 70%, 50%)`
        });
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'menu') {
            this.renderMenu();
            return;
        }
        
        if (this.gameState === 'paused') {
            this.renderPaused();
        }
        
        // Draw grid background
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw bullets
        this.ctx.fillStyle = '#00d4ff';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enemy glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw player
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player direction indicator
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(
            this.player.x + Math.cos(this.player.angle) * (this.player.size + 10),
            this.player.y + Math.sin(this.player.angle) * (this.player.size + 10)
        );
        this.ctx.stroke();
        
        // Player glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00d4ff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    renderMenu() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FPS Arena', this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px sans-serif';
        this.ctx.fillText('Click Start to begin!', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    renderPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = Math.max(0, Math.floor(this.health));
        document.getElementById('wave').textContent = this.wave;
    }
    
    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        if (this.gameState === 'playing') {
            this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
        }
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new FPSGame('gameCanvas');
    
    document.getElementById('startBtn').addEventListener('click', () => {
        game.start();
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
    });
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
        game.pause();
    });
});

