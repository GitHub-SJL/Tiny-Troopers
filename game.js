const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const laneCount = 3;
const laneWidth = canvas.width / laneCount;

// 이미지 파일 경로 설정
const playerImg = new Image();
const bulletImg = new Image();
const enemyImg = new Image();
const boxImg = new Image();

playerImg.src = "images/player.png";
bulletImg.src = "images/bullet.png";
enemyImg.src = "images/enemy.png";
boxImg.src = "images/box.png";

// canvas 크기 설정
const canvasHeight = window.innerHeight * 0.8;

canvas.width = 800; // 가로 크기는 고정값으로 유지
canvas.height = canvasHeight;

let player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  width: 50,
  height: 50,
  speed: 5,
  damage: 10,
  lives: 5,
};
let bullets = [];
let enemies = [];
let boxes = [];
let lastEnemySpawn = 0;
let enemySpawnInterval = 5000; // 적 생성 간격 조정
let lastBoxSpawn = 0;
let boxSpawnInterval = 10000; // 박스 생성 간격 조정
let keys = {};
let removedEnemiesCount = 0;
let bulletSpeed = 5;
let bulletSize = { width: 30, height: 30 };
let bulletCount = 1;

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  bullets.forEach((bullet) => {
    ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height); // 총알 크기 적용
    bullet.y -= bullet.speed;
  });
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = "red";
    ctx.fillText(enemy.hp, enemy.x + 10, enemy.y - 1);
    enemy.y += enemy.speed;
  });
}

function drawBoxes() {
  boxes.forEach((box) => {
    ctx.drawImage(boxImg, box.x, box.y, box.width, box.height);
    ctx.fillStyle = "white";
    ctx.fillText(box.hp, box.x + 10, box.y + 25);
    box.y += box.speed;
  });
}

function drawHUD() {
  ctx.fillStyle = "yellow";
  ctx.font = "20px Arial";
  ctx.fillText(`목숨: ${player.lives}`, canvas.width - 100, 30);
  ctx.fillText(`처치한 적: ${removedEnemiesCount}`, 20, 30);
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawBoxes();
  drawHUD();
  handleCollisions();
  spawnEnemies();
  spawnBoxes();
  movePlayer();
  checkGameOver();

  requestAnimationFrame(updateGame);
}

function handleCollisions() {
  bullets = bullets.filter(
    (bullet) =>
      bullet.y > 0 &&
      !(
        enemies.some((enemy) => {
          if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
          ) {
            enemy.hp -= bullet.damage;
            enemy.hitTime = Date.now();
            if (enemy.hp <= 0) removedEnemiesCount++; // 제거된 적 카운트 증가
            return true;
          }
          return false;
        }) ||
        boxes.some((box) => {
          if (
            bullet.x < box.x + box.width &&
            bullet.x + bullet.width > box.x &&
            bullet.y < box.y + box.height &&
            bullet.y + bullet.height > box.y
          ) {
            box.hp -= bullet.damage;
            if (box.hp <= 0) upgradeWeapon();
            return true;
          }
          return false;
        })
      )
  );

  enemies = enemies.filter((enemy) => {
    if (enemy.hp > 0 && enemy.y < canvas.height) {
      return true;
    }
    if (enemy.y >= canvas.height) {
      player.lives -= 1;
    }
    return false;
  });

  boxes = boxes.filter((box) => box.hp > 0 && box.y < canvas.height);
}

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function movePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  if (keys["ArrowUp"] && player.y > 0) {
    player.y -= player.speed;
  }
  if (keys["ArrowDown"] && player.y < canvas.height - player.height) {
    player.y += player.speed;
  }

  enemies.forEach((enemy) => {
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      player.lives -= 1;
      enemies = enemies.filter((e) => e !== enemy);
    }
  });
}
let speed = 2; // 적의 초기 속도 설정

function spawnEnemies() {
  if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
    const lane = Math.floor(Math.random() * laneCount);
    if (removedEnemiesCount % 10 === 0 && removedEnemiesCount > 0) {
      speed += 0.5; // 10마리 제거마다 적의 속도를 증가
    }
    const enemy = {
      x: lane * laneWidth + (laneWidth - 50) / 2,
      y: -50,
      width: 50,
      height: 50,
      speed: speed,
      hp: 30,
    };
    enemies.push(enemy);
    lastEnemySpawn = Date.now();
  }
}
function spawnBoxes() {
  if (Date.now() - lastBoxSpawn > boxSpawnInterval) {
    const lane = Math.floor(Math.random() * laneCount);
    const box = {
      x: lane * laneWidth + (laneWidth - 50) / 2,
      y: -50,
      width: 50,
      height: 50,
      speed: 2,
      hp: 30,
    };
    boxes.push(box);
    lastBoxSpawn = Date.now();
  }
}

function spawnBullets() {
  for (let i = 0; i < bulletCount; i++) {
    const offset = (i - (bulletCount - 1) / 2) * bulletSize.width * 1.5;
    const bullet = {
      x: player.x + player.width / 2 - bulletSize.width / 2 + offset,
      y: player.y,
      width: bulletSize.width,
      height: bulletSize.height,
      speed: bulletSpeed,
      damage: player.damage,
    };
    bullets.push(bullet);
  }
}

function upgradeWeapon() {
  const randomValue = Math.random();
  if (randomValue < 0.1 && bulletCount < 3) {
    bulletCount += 1; // randomValue가 0.1 미만이고 bulletCount가 3 미만일 때만 bulletCount를 증가
  } else if (randomValue > 0.2 && randomValue <= 0.4) {
    bulletSpeed += 1; // randomValue가 0.2 초과 0.4 이하이면 bulletSpeed를 증가
  } else {
    bulletSize.width += 2;
    bulletSize.height += 4;
  }
}

// 게임 오버 모달 창 표시
function displayGameOverModal() {
  const modal = document.getElementById("gameOverModal");
  const span = document.getElementsByClassName("close")[0];
  const defeatedCount = document.getElementById("defeatedCount");
  const restartButton = document.getElementById("restartButton");

  defeatedCount.textContent = removedEnemiesCount;

  modal.style.display = "block";

  // 모달 창 닫기
  span.onclick = function () {
    modal.style.display = "none";
  };

  // 다시하기 버튼 클릭 시
  restartButton.onclick = function () {
    modal.style.display = "none";
    document.location.reload();
  };

  // 창 외부 클릭 시 모달 창 닫기
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

// 게임 오버 체크 함수에서 호출
function checkGameOver() {
  if (player.lives <= 0) {
    displayGameOverModal(); // 게임 오버 모달 창 표시
    clearInterval(gameLoop); // 게임 루프 중지
  }
}

setInterval(spawnBullets, 500);
updateGame();
