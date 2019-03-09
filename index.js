const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = (Math.floor(window.innerWidth * 0.5)) - (window.innerWidth % 10) ;
const HEIGHT = WIDTH * 0.75;

canvas.height = HEIGHT;
canvas.width = WIDTH;

const MODES = {
  EASY: 0,
  MEDIUM: 1, 
  HARD: 2
}

const TYPES = {
  EMPTY: 0,
  NUMBER: 1,
  BOMB: 2
}

const COLORS = {
    1: "#d6edff",
    2: "#56ffad",
    3: "#ff793f",
    4: "#dbc6ff",
    5: "#ff7fc3",
    6: "#ff6759",
    7: "#f5ffb5",
    8: "#7f66ff"
}

const BOMBAMT = {
  EASY: 15,
  MEDIUM: 65,
  HARD: 130
}

const margin = 2;

let running = false;
let bombSet = false;

let totalBombs;
let flagsLeft;

let correctFlags;

let won = false;
let lost = false;

let mode;
let grid = [];
let rows, columns;
let segmentSize;

let hold;
let timer = 0;

function revealBombs(){
  for(let i = 0;i<grid.length;i++){
    for(let j = 0;j<grid[i].length;j++){
      if(grid[i][j].type === TYPES.BOMB){
        grid[i][j].revealed = true;
      }
    }
  }
}

function reveal(row, col){
  const type = grid[row][col].type;
  if(grid[row][col].flagged || grid[row][col].revealed) return;
  if(type === TYPES.BOMB){
    revealBombs();
    lost = true;
    document.getElementById("face-img").src = "images/skull.png";
    return;
  }else if(type === TYPES.NUMBER){
    grid[row][col].revealed = true;
    return;
  }else{
    grid[row][col].revealed = true;
    const rowStart = row == 0 ? 0 : row - 1;
    const rowEnd = row == rows - 1 ? row : row + 1;
    const colStart = col == 0 ? 0 : col - 1;
    const colEnd = col == columns - 1 ? col : col + 1;
    for(let i = rowStart;i<=rowEnd;i++){
      for(let j = colStart;j<=colEnd;j++){
        if(i == row && j == col) continue;
        reveal(i, j);
      }
    }
  }
}

function emptyGrid(){
    grid = [];
    for(let i = 0;i < rows;i++){
      const row = [];
      for(let j = 0;j < columns;j++){
        let square = {
          "type":TYPES.EMPTY,
          "revealed":false,
          "flagged":false,
          "adjacent":0
        }
        row.push(square);
      }
      grid.push(row);
    }
}

function renderRemaining(){
  const textUnlit = "0".repeat(4 - flagsLeft.toString().length);
  const dis = document.getElementById("bombs-remaining").childNodes;
  dis[0].innerHTML = textUnlit;
  dis[1].innerHTML = flagsLeft;
}

function renderSeconds(){
  if(timer > 9999) return;
  const timerUnlit = "0".repeat(4 - timer.toString().length);
  const dis = document.getElementById("timer").childNodes;
  dis[0].innerHTML = timerUnlit;
  dis[1].innerHTML = timer;
}

function start(m) {
  switch(m){
    case MODES.EASY:
      rows = 9;
      columns = 12;
      totalBombs = BOMBAMT.EASY;
      flagsLeft = BOMBAMT.EASY;
      mode = MODES.EASY;
      break;
    case MODES.MEDIUM:
      rows = 18;
      columns = 24;
      totalBombs = BOMBAMT.MEDIUM;
      flagsLeft = BOMBAMT.MEDIUM;
      mode = MODES.MEDIUM;
      break;
    case MODES.HARD:
      rows = 30;
      columns = 40; 
      totalBombs = BOMBAMT.HARD;
      flagsLeft = BOMBAMT.HARD;
      mode = MODES.HARD;
      break; 
  }
  renderRemaining();
  emptyGrid();
  segmentSize = ( WIDTH / columns ) - margin;
  if(running) {
    bombSet = false;
  } else {
    running = true;
    document.getElementById("placeholder").style.transform = "translate(-100vw, -100vh)";
    animate();
  }
  document.getElementById("face-img").src = "images/happy.png";
  won = false;
  lost = false;
  correctFlags = 0;
  hold = new Date().getTime();
  timer = 0;
}

function surroundingBombs(row, col){
  let amt = 0;
  const rowStart = row == 0 ? 0 : row - 1;
  const rowEnd = row == rows - 1 ? row : row + 1;
  const colStart = col == 0 ? 0 : col - 1;
  const colEnd = col == columns - 1 ? col : col + 1;
  for(let k = rowStart;k<=rowEnd;k++){
    for(let l = colStart;l<=colEnd;l++){
      if(k == row && l == col) continue;
      if(grid[k][l].type === TYPES.BOMB){
        amt++;
      }
    }
  }
  return amt;
}

function setBombs(rowInit, colInit) {
  let set = 0;
  while(set < totalBombs){
    const bombRow = Math.floor(Math.random() * rows);
    const bombCol = Math.floor(Math.random() * columns);
    if(bombRow == rowInit && bombCol == colInit) continue;
    if(grid[bombRow][bombCol].type == TYPES.BOMB){
      continue;
    } else {
      if(surroundingBombs(bombRow, bombCol) > 4) continue;
      grid[bombRow][bombCol].type = TYPES.BOMB;
      set++;
    }
  }
  for(let i = 0;i<rows;i++){
    for(let j = 0;j<columns;j++){
      if(grid[i][j].type == TYPES.BOMB) continue;
      const amt = surroundingBombs(i, j);
      if(amt > 0){
        grid[i][j].type = TYPES.NUMBER;
        grid[i][j].adjacent = amt;
      }
    }
  }
  correctFlags = 0;
  bombSet = true;
  return;
}

/*
function setBombsTest(rowInit, colInit) {
  let set = 0;
  while(set < totalBombs){
    let seed;
    if(!set){
      while(true){
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * columns);
        if(r === rowInit && c === colInit){
          continue;
        } else {
          grid[r][c].type = TYPES.BOMB;
          break;
        }
      }
      continue;
    }else {
      seed = Math.floor(Math.random() * set);
    }
    let x = 0;
    for(let i = 0;i<grid.length;i++){
      for(let j = 0;j<grid[i].length;j++){
        if(grid[i][j].type === TYPES.BOMB){
          if(x === seed){
            let rowStart = i < 3 ? 0 : i - 3;
            let rowEnd = i > (grid.length - 4) ? grid.length : i + 3;
            let colStart = j < 3 ? 0 : j - 3;
            let colEnd = j > (grid[i].length - 4) ? grid[i].length : j + 3;

            let bombRow = Math.floor(Math.random() * (rowEnd - rowStart)) + rowStart;
            let bombCol = Math.floor(Math.random() * (colEnd - colStart)) + colStart;
            if(bombRow === rowInit && bombCol === colInit) continue;
            if(grid[bombRow][bombCol].type === TYPES.BOMB){
              continue;
            } else {
              if(surroundingBombs(bombRow, bombCol) > 4) continue;
              grid[bombRow][bombCol].type = TYPES.BOMB;
              set++;
              break;
            }

          }
          x += 1;
        }
      }
    }
  }
  for(let i = 0;i<rows;i++){
    for(let j = 0;j<columns;j++){
      if(grid[i][j].type == TYPES.BOMB) continue;
      let amt = surroundingBombs(i, j);
      if(amt > 0){
        grid[i][j].type = TYPES.NUMBER;
        grid[i][j].adjacent = amt;
      }
    }
  }
  bombSet = true;
  return;
}
*/

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(87, 95, 214, 0.4)";
  ctx.fillRect(0,0, WIDTH, HEIGHT);
  for(let row = 0;row < grid.length;row++){
    for(let col = 0;col < grid[row].length;col++){
      if(grid[row][col].revealed){
        if(grid[row][col].type === TYPES.BOMB){
            if((won || lost) && grid[row][col].flagged){
              ctx.fillStyle = "rgb(51, 255, 153)";
            } else {
              ctx.fillStyle = "rgb(255, 80, 80)";
            }
        } else {
            ctx.fillStyle = "rgba(200,200,200,0.2)";
        }
      } else {
        if(row % 2){
          if(col % 2){
            ctx.fillStyle = "#eee";
          } else {
            ctx.fillStyle = "#ddd";
          }
        } else {
          if(col % 2){
            ctx.fillStyle = "#ddd";
          } else {
            ctx.fillStyle = "#eee";
          }
        }
      }
      ctx.fillRect(
        ((col * segmentSize) + (col * margin) + 1), 
        ((row * segmentSize) + (row * margin) + 1), 
        segmentSize, 
        segmentSize);
      if(grid[row][col].type == TYPES.NUMBER && grid[row][col].revealed){
        ctx.fillStyle = COLORS[grid[row][col].adjacent];
        ctx.font = segmentSize * 0.6 + 'px ZCOOLQingKeHuangYou-Regular';
        ctx.fillText(
          grid[row][col].adjacent, 
          ((col * segmentSize) + (col * margin) + 1) + (segmentSize / 3), 
          ((row * segmentSize) + (row * margin) + 1) + (segmentSize / 1.4));
      } else if (grid[row][col].flagged) {
          const flag = document.createElement("img");
          if((won || lost) && grid[row][col].type != TYPES.BOMB){
            flag.setAttribute('src', './images/mine-wrong.png');
          } else {
            flag.setAttribute('src', './images/flag.png');
          }
          ctx.drawImage(
            flag, 
            ((col * segmentSize) + (col * margin) + 1) + (segmentSize / 3.9), 
            ((row * segmentSize) + (row * margin) + 1) + (segmentSize / 3.25), 
            segmentSize * 0.5, 
            segmentSize * 0.5);
      } else if (grid[row][col].revealed && grid[row][col].type === TYPES.BOMB){
          const bomb = document.createElement("img");
          bomb.setAttribute('src', './images/mine.png');
          ctx.drawImage(
            bomb, 
            ((col * segmentSize) + (col * margin) + 1) + (segmentSize / 3.9), 
            ((row * segmentSize) + (row * margin) + 1) + (segmentSize / 3.25), 
            segmentSize * 0.5, 
            segmentSize * 0.5)
      }
    }
  }
  renderSeconds();
}

const easy_button = document.getElementById("start-easy");
const medium_button = document.getElementById("start-medium");
const hard_button = document.getElementById("start-hard");

easy_button.addEventListener("click", () => start(MODES.EASY))
medium_button.addEventListener("click", () => start(MODES.MEDIUM));
hard_button.addEventListener("click", () => start(MODES.HARD));

function clickCoordinate(e){
  const rect = canvas.getBoundingClientRect();
  const x = e.pageX - rect.left;
  const y = e.pageY - rect.top;
  const squareCol = Math.floor((x - (x % (segmentSize + margin))) / (segmentSize + margin));
  const squareRow = Math.floor((y - (y % (segmentSize + margin))) / (segmentSize + margin));
  return {row: squareRow, col: squareCol};
}

function click(e){
  if(won || lost) return;
  const coord = clickCoordinate(e);
  const row = coord.row;
  const col = coord.col;
  if(running && !bombSet) {
    setBombs(row, col);
    while(grid[row][col].type !== TYPES.EMPTY){
        emptyGrid();
        setBombs(row, col);
    }
  }
  reveal(row, col);
}

function rightclick(e){
  e.preventDefault();
  if(won || lost) return;
  const coord = clickCoordinate(e);
  const row = coord.row;
  const col = coord.col;
  if(grid[row][col].revealed) return;
  if(grid[row][col].flagged){
    grid[row][col].flagged = false;
    flagsLeft += 1;
    if(grid[row][col].type === TYPES.BOMB){
      correctFlags -= 1;
    }
  }else{
    if(flagsLeft === 0) return;
    grid[row][col].flagged = true;
    flagsLeft -= 1;
    if(grid[row][col].type === TYPES.BOMB){
        correctFlags += 1;
    }
  }
  if(correctFlags === totalBombs){
    revealBombs();
    won = true;
    document.getElementById("face-img").src = "images/wai.png";
  }
  renderRemaining();
  return;
}

function animate(){
  if(!(won || lost)){
    const n = new Date().getTime();
    if((n - hold) > 1000){
      hold = n;
      timer++;
    }
  }
  render();
  requestAnimationFrame(animate);
}

canvas.addEventListener("click", (e) => click(e));
canvas.addEventListener("contextmenu", (e) => rightclick(e), false);
canvas.addEventListener("mousedown", () => {
    if(won || lost) return;
    document.getElementById("face-img").src = "images/surprised.png";
});
canvas.addEventListener("mouseup", () => {
    if(won || lost) return;
    document.getElementById("face-img").src = "images/happy.png";
});