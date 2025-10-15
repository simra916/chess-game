// Minimal chess logic (no check detection). Save as script.js

const pieceIcons = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

let board = [];
let turn = 'w';
let selected = null;
let legalMoves = [];
let history = [];

const boardEl = document.getElementById('board');
const turnDisplay = document.getElementById('turnDisplay');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');

function newBoard(){
  board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
  ].map(r => r.slice());
  turn = 'w';
  selected = null;
  legalMoves = [];
  history = [];
  render();
}

function render(){
  boardEl.innerHTML = '';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + (((r+c)%2===0) ? 'light' : 'dark');
      sq.dataset.r = r; sq.dataset.c = c;

      if(selected && selected.r==r && selected.c==c) sq.classList.add('selected');

      const content = document.createElement('div');
      content.className = 'piece';
      const p = board[r][c];
      if(p){
        content.textContent = pieceIcons[p] || p;
        content.title = p;
      } else {
        content.textContent = '';
      }
      sq.appendChild(content);

      // show moves
      const m = legalMoves.find(x => x.r==r && x.c==c);
      if(m){
        if(board[r][c]){
          const cap = document.createElement('div');
          cap.className = 'move-capture';
          sq.appendChild(cap);
        } else {
          const dot = document.createElement('div');
          dot.className = 'move-dot';
          sq.appendChild(dot);
        }
      }

      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  turnDisplay.textContent = turn === 'w' ? 'White' : 'Black';
  undoBtn.disabled = history.length === 0;
}

function onSquareClick(){
  const r = +this.dataset.r, c = +this.dataset.c;
  const piece = board[r][c];

  if(piece && piece[0] === turn){
    selected = {r,c};
    legalMoves = getLegalMoves(r,c);
    render();
    return;
  }

  const move = legalMoves.find(m => m.r==r && m.c==c);
  if(move && selected){
    history.push({ board: board.map(row => row.slice()), turn });
    board[r][c] = board[selected.r][selected.c];
    board[selected.r][selected.c] = null;

    // pawn promotion
    if(board[r][c] === 'wP' && r === 0) board[r][c] = 'wQ';
    if(board[r][c] === 'bP' && r === 7) board[r][c] = 'bQ';

    turn = (turn === 'w') ? 'b' : 'w';
    selected = null; legalMoves = [];
    render();
    return;
  }

  selected = null; legalMoves = [];
  render();
}

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

function getLegalMoves(r,c){
  const piece = board[r][c];
  if(!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const moves = [];

  function tryAdd(rr,cc){
    if(!inBounds(rr,cc)) return false;
    const occ = board[rr][cc];
    if(!occ){ moves.push({r:rr,c:cc}); return true; }
    if(occ[0] !== color){ moves.push({r:rr,c:cc}); }
    return false;
  }

  if(type === 'P'){
    const dir = color === 'w' ? -1 : 1;
    const start = color === 'w' ? 6 : 1;
    const fr = r + dir;
    if(inBounds(fr,c) && !board[fr][c]){ moves.push({r:fr,c}); const fr2 = r + dir*2; if(r===start && !board[fr2][c]) moves.push({r:fr2,c}); }
    for(const dc of [-1,1]){ const cr=r+dir, cc=c+dc; if(inBounds(cr,cc) && board[cr][cc] && board[cr][cc][0] !== color) moves.push({r:cr,c:cc}); }
  }

  if(type === 'N'){
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    deltas.forEach(([dr,dc])=>{ const rr=r+dr, cc=c+dc; if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc][0] !== color)) moves.push({r:rr,c:cc}); });
  }

  if(type === 'B' || type === 'R' || type === 'Q'){
    const dirs = [];
    if(type==='B' || type==='Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if(type==='R' || type==='Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for(const [dr,dc] of dirs){
      let rr=r+dr, cc=c+dc;
      while(inBounds(rr,cc)){
        if(!board[rr][cc]){ moves.push({r:rr,c:cc}); }
        else { if(board[rr][cc][0] !== color) moves.push({r:rr,c:cc}); break; }
        rr+=dr; cc+=dc;
      }
    }
  }

  if(type === 'K'){
    for(let dr=-1;dr<=1;dr++){
      for(let dc=-1;dc<=1;dc++){
        if(dr===0 && dc===0) continue;
        const rr=r+dr, cc=c+dc;
        if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc][0] !== color)) moves.push({r:rr,c:cc});
      }
    }
  }

  return moves;
}

// Controls
resetBtn.addEventListener('click', newBoard);
undoBtn.addEventListener('click', ()=>{
  if(history.length===0) return;
  const last = history.pop();
  board = last.board.map(row => row.slice());
  turn = last.turn;
  selected = null; legalMoves = [];
  render();
});

// init
newBoard();
