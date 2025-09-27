import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import demonEnemy from "@/assets/demon-enemy.png";
import spikyEnemy from "@/assets/spiky-enemy.png";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
}

interface Player extends GameObject {
  speed: number;
  energy: number;
  maxEnergy: number;
  facing: "left" | "right";
  isMoving: boolean;
  invulnerable: number;
}

interface Enemy extends GameObject {
  type: "demon" | "spiky";
  speed: number;
  attackDamage: number;
  lastAttack: number;
  floatOffset: number;
}

interface Projectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  size: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "game_over"
} as const;

export const BattlingMadness = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<keyof typeof GAME_STATES>("MENU");
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: 40,
    height: 60,
    health: 100,
    maxHealth: 100,
    speed: 200,
    energy: 100,
    maxEnergy: 100,
    facing: "right",
    isMoving: false,
    invulnerable: 0
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [enemyImages, setEnemyImages] = useState<{ demon: HTMLImageElement; spiky: HTMLImageElement } | null>(null);

  // Load enemy images
  useEffect(() => {
    const demon = new Image();
    const spiky = new Image();
    
    demon.onload = () => {
      spiky.onload = () => {
        setEnemyImages({ demon, spiky });
      };
      spiky.src = spikyEnemy;
    };
    demon.src = demonEnemy;
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Collision detection
  const checkCollision = (a: GameObject, b: GameObject): boolean => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  // Draw stickman character
  const drawStickman = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: string, isMoving: boolean) => {
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const centerX = x + 20;
    const centerY = y + 15;

    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 8);
    ctx.lineTo(centerX, centerY + 35);
    ctx.stroke();

    // Arms
    const armOffset = isMoving ? Math.sin(Date.now() * 0.01) * 5 : 0;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 18);
    ctx.lineTo(centerX - 12 + armOffset, centerY + 25);
    ctx.moveTo(centerX, centerY + 18);
    ctx.lineTo(centerX + 12 - armOffset, centerY + 25);
    ctx.stroke();

    // Legs
    const legOffset = isMoving ? Math.sin(Date.now() * 0.015) * 8 : 0;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 35);
    ctx.lineTo(centerX - 8 + legOffset, centerY + 55);
    ctx.moveTo(centerX, centerY + 35);
    ctx.lineTo(centerX + 8 - legOffset, centerY + 55);
    ctx.stroke();

    // Eyes (red glow for battle mode)
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + 3, centerY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Spawn enemies
  const spawnEnemy = useCallback(() => {
    const side = Math.random() < 0.5 ? "left" : "right";
    const type = Math.random() < 0.6 ? "demon" : "spiky";
    
    const enemy: Enemy = {
      x: side === "left" ? -50 : CANVAS_WIDTH + 50,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      width: type === "demon" ? 60 : 40,
      height: type === "demon" ? 60 : 40,
      health: type === "demon" ? 50 : 30,
      maxHealth: type === "demon" ? 50 : 30,
      type,
      speed: type === "demon" ? 80 : 120,
      attackDamage: type === "demon" ? 20 : 15,
      lastAttack: 0,
      floatOffset: Math.random() * Math.PI * 2
    };

    setEnemies(prev => [...prev, enemy]);
  }, []);

  // Sacrifice ability - trade health for energy and power
  const performSacrifice = useCallback(() => {
    if (player.health > 20) {
      setPlayer(prev => ({
        ...prev,
        health: prev.health - 15,
        energy: Math.min(prev.maxEnergy, prev.energy + 50)
      }));
      
      // Create powerful projectiles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const projectile: Projectile = {
          x: player.x + player.width / 2,
          y: player.y + player.height / 2,
          dx: Math.cos(angle) * 300,
          dy: Math.sin(angle) * 300,
          damage: 40,
          size: 8
        };
        setProjectiles(prev => [...prev, projectile]);
      }
      
      setScreenShake(10);
      toast("Blood sacrifice unleashed!");
    }
  }, [player.health, player.x, player.y, player.width, player.height]);

  // Shoot projectile
  const shoot = useCallback((targetX: number, targetY: number) => {
    if (player.energy >= 10) {
      const dx = targetX - (player.x + player.width / 2);
      const dy = targetY - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const projectile: Projectile = {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        dx: (dx / distance) * 400,
        dy: (dy / distance) * 400,
        damage: 25,
        size: 4
      };
      
      setProjectiles(prev => [...prev, projectile]);
      setPlayer(prev => ({ ...prev, energy: prev.energy - 10 }));
    }
  }, [player.energy, player.x, player.y, player.width, player.height]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    if (gameState !== "PLAYING") {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Screen shake effect
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
      shakeX = (Math.random() - 0.5) * screenShake;
      shakeY = (Math.random() - 0.5) * screenShake;
      setScreenShake(prev => Math.max(0, prev - 1));
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear canvas with dark background
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH/2);
    gradient.addColorStop(0, "hsl(220 27% 12%)");
    gradient.addColorStop(1, "hsl(220 27% 8%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update player
    setPlayer(prev => {
      const newPlayer = { ...prev };
      let moved = false;

      // Movement
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
        newPlayer.x = Math.max(0, newPlayer.x - newPlayer.speed * deltaTime);
        newPlayer.facing = "left";
        moved = true;
      }
      if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
        newPlayer.x = Math.min(CANVAS_WIDTH - newPlayer.width, newPlayer.x + newPlayer.speed * deltaTime);
        newPlayer.facing = "right";
        moved = true;
      }
      if (keysRef.current.has("w") || keysRef.current.has("arrowup")) {
        newPlayer.y = Math.max(0, newPlayer.y - newPlayer.speed * deltaTime);
        moved = true;
      }
      if (keysRef.current.has("s") || keysRef.current.has("arrowdown")) {
        newPlayer.y = Math.min(CANVAS_HEIGHT - newPlayer.height, newPlayer.y + newPlayer.speed * deltaTime);
        moved = true;
      }

      newPlayer.isMoving = moved;
      
      // Regenerate energy
      newPlayer.energy = Math.min(newPlayer.maxEnergy, newPlayer.energy + 20 * deltaTime);
      
      // Reduce invulnerability
      newPlayer.invulnerable = Math.max(0, newPlayer.invulnerable - deltaTime);

      return newPlayer;
    });

    // Handle actions
    if (keysRef.current.has(" ")) {
      // Auto-aim at nearest enemy
      const nearestEnemy = enemies.reduce((nearest, enemy) => {
        const distToEnemy = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
        const distToNearest = nearest ? Math.sqrt((nearest.x - player.x) ** 2 + (nearest.y - player.y) ** 2) : Infinity;
        return distToEnemy < distToNearest ? enemy : nearest;
      }, null as Enemy | null);

      if (nearestEnemy) {
        shoot(nearestEnemy.x + nearestEnemy.width / 2, nearestEnemy.y + nearestEnemy.height / 2);
      }
    }

    if (keysRef.current.has("q")) {
      performSacrifice();
      keysRef.current.delete("q"); // Prevent rapid firing
    }

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
      const dy = (player.y + player.height / 2) - (enemy.y + enemy.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed * deltaTime;
        enemy.y += (dy / distance) * enemy.speed * deltaTime;
      }
      
      enemy.floatOffset += deltaTime * 2;
      
      // Attack player
      if (distance < 60 && timestamp - enemy.lastAttack > 1000 && player.invulnerable <= 0) {
        setPlayer(prev => ({ ...prev, health: prev.health - enemy.attackDamage, invulnerable: 1 }));
        enemy.lastAttack = timestamp;
        setScreenShake(5);
      }
      
      return enemy;
    }));

    // Update projectiles
    setProjectiles(prev => prev.filter(projectile => {
      projectile.x += projectile.dx * deltaTime;
      projectile.y += projectile.dy * deltaTime;
      
      // Remove if off-screen
      if (projectile.x < -50 || projectile.x > CANVAS_WIDTH + 50 || projectile.y < -50 || projectile.y > CANVAS_HEIGHT + 50) {
        return false;
      }
      
      // Check collision with enemies
      const hitEnemy = enemies.find(enemy => {
        const dist = Math.sqrt((projectile.x - (enemy.x + enemy.width/2))**2 + (projectile.y - (enemy.y + enemy.height/2))**2);
        return dist < enemy.width/2 + projectile.size;
      });
      
      if (hitEnemy) {
        hitEnemy.health -= projectile.damage;
        if (hitEnemy.health <= 0) {
          setScore(prev => prev + (hitEnemy.type === "demon" ? 100 : 50));
          setEnemies(prev => prev.filter(e => e !== hitEnemy));
        }
        return false;
      }
      
      return true;
    }));

    // Draw game objects
    drawStickman(ctx, player.x, player.y, player.facing, player.isMoving);

    // Draw enemies
    enemies.forEach(enemy => {
      const floatY = enemy.y + Math.sin(enemy.floatOffset) * 5;
      
      if (enemyImages) {
        const img = enemyImages[enemy.type];
        ctx.save();
        
        // Flash red when damaged
        if (enemy.health < enemy.maxHealth) {
          ctx.globalAlpha = 0.8;
          ctx.filter = "hue-rotate(20deg) brightness(1.2)";
        }
        
        ctx.drawImage(img, enemy.x, floatY, enemy.width, enemy.height);
        
        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = "hsl(0 72% 51%)";
        ctx.fillRect(enemy.x, floatY - 10, enemy.width, 4);
        ctx.fillStyle = "hsl(120 60% 50%)";
        ctx.fillRect(enemy.x, floatY - 10, enemy.width * healthPercent, 4);
        
        ctx.restore();
      }
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
      ctx.save();
      ctx.fillStyle = "hsl(280 100% 70%)";
      ctx.shadowColor = "hsl(280 100% 70%)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();

    // Spawn enemies
    if (Math.random() < 0.02 + wave * 0.005) {
      spawnEnemy();
    }

    // Check game over
    if (player.health <= 0) {
      setGameState("GAME_OVER");
      toast.error("You have fallen in battle!");
    }

    // Next wave
    if (enemies.length === 0 && Math.random() < 0.1) {
      setWave(prev => prev + 1);
      toast.success(`Wave ${wave + 1} approaches!`);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, enemies, projectiles, enemyImages, wave, screenShake, spawnEnemy, shoot, performSacrifice]);

  // Start game loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const startGame = () => {
    setGameState("PLAYING");
    setPlayer({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      width: 40,
      height: 60,
      health: 100,
      maxHealth: 100,
      speed: 200,
      energy: 100,
      maxEnergy: 100,
      facing: "right",
      isMoving: false,
      invulnerable: 0
    });
    setEnemies([]);
    setProjectiles([]);
    setScore(0);
    setWave(1);
    toast.success("The battle begins!");
  };

  const restartGame = () => {
    startGame();
  };

  if (gameState === "MENU") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-primary">Battling Madness</h1>
          <p className="text-muted-foreground mb-6">
            Survive waves of enemies in this intense battle arena!
          </p>
          <div className="space-y-2 text-sm mb-6">
            <p><strong>WASD/Arrows:</strong> Move</p>
            <p><strong>SPACE:</strong> Auto-aim shoot</p>
            <p><strong>Q:</strong> Blood Sacrifice (health for power)</p>
          </div>
          <Button onClick={startGame} className="w-full">
            Enter the Arena
          </Button>
        </Card>
      </div>
    );
  }

  if (gameState === "GAME_OVER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-destructive">Game Over</h1>
          <p className="text-xl mb-2">Score: {score}</p>
          <p className="text-lg mb-6">Wave: {wave}</p>
          <Button onClick={restartGame} className="w-full">
            Fight Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative">
        {/* Game UI */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="space-y-2">
            <div className="bg-card/90 p-2 rounded">
              <div className="text-sm text-foreground">Health</div>
              <div className="w-32 h-3 bg-muted rounded overflow-hidden">
                <div 
                  className="h-full bg-health transition-all duration-300"
                  style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-card/90 p-2 rounded">
              <div className="text-sm text-foreground">Energy</div>
              <div className="w-32 h-3 bg-muted rounded overflow-hidden">
                <div 
                  className="h-full bg-energy transition-all duration-300"
                  style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className="bg-card/90 p-2 rounded text-sm">
              <div>Score: {score}</div>
              <div>Wave: {wave}</div>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-border rounded-lg shadow-2xl"
        />
        
        {/* Controls hint */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-card/90 p-2 rounded text-xs text-muted-foreground">
            WASD: Move | SPACE: Shoot | Q: Blood Sacrifice
          </div>
        </div>
      </div>
    </div>
  );
};