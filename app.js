// переключалка
(() => {
  const clickerBtn = document.getElementById('clickerBtn');
  const pacmanBtn = document.getElementById('pacmanBtn');
  const toMenu1 = document.getElementById('toMenu1');
  const toMenu2 = document.getElementById('toMenu2');
  const clickerGame = document.getElementById('clickerGame');
  const pacmanGame = document.getElementById('pacmanGame');

  function show(game) {
    clickerGame.classList.add('hidden');
    pacmanGame.classList.add('hidden');
    if (game) game.classList.remove('hidden');
  }

  clickerBtn.addEventListener('click', () => show(clickerGame));
  pacmanBtn.addEventListener('click', () => show(pacmanGame));
  if (toMenu1) toMenu1.addEventListener('click', () => show(null));
  if (toMenu2) toMenu2.addEventListener('click', () => show(null));

  show(null); // старт — меню
})();

// ----- CLICKER -----
/* скопирована логика из cliker-app.js с исправленными id overlay */
(() => {
  const tokensEl=document.getElementById('tokensValue');
  if(!tokensEl) return; // значит игра не показана
  const popEl=document.getElementById('popValue');
  const vramBar=document.getElementById('vramBar');
  const ctxBar=document.getElementById('ctxBar');
  const vramPct=document.getElementById('vramPct');
  const ctxPct=document.getElementById('ctxPct');
  const feedBtn=document.getElementById('feedBtn');
  const swarm=document.getElementById('swarm');
  const shareBtn=document.getElementById('shareBtn');
  const shareBtn2=document.getElementById('shareBtn2');
  const resetBtn=document.getElementById('resetBtn');
  const overlay=document.getElementById('overlay');
  const closeOv=document.getElementById('closeOv');
  const state={tokens:0,pop:3,vram:100,ctx:100,ended:false};
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function fmt(n){return new Intl.NumberFormat('ru-RU').format(n);}
  function updateBars(){
    vramBar.style.width=`${state.vram}%`;ctxBar.style.width=`${state.ctx}%`;
    vramPct.textContent=`${Math.round(state.vram)}%`;ctxPct.textContent=`${Math.round(state.ctx)}%`;
  }
  function render(){tokensEl.textContent=fmt(state.tokens);popEl.textContent=fmt(state.pop);updateBars();}
  function rand(min,max){return Math.random()*(max-min)+min;}
  function randColor(){const pal=['#6b5cff','#8a6bff','#ff6bd6','#59c4ff','#7af0d8','#ffa86b'];return pal[Math.floor(Math.random()*pal.length)];}
  function svgIsherg(c){return `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${c}"/></svg>`;}
  function addBurst(){const el=document.createElement('div');el.className='ish';el.style.left=rand(20,200)+'px';el.style.top=rand(20,200)+'px';el.innerHTML=svgIsherg(randColor());swarm.appendChild(el);}
  function feed(){if(state.ended)return;state.tokens++;state.pop+=1;state.vram=clamp(state.vram-0.6,0,100);state.ctx=clamp(state.ctx-1.2,0,100);render();addBurst(); if(state.vram<=0||state.ctx<=0) end();}
  function end(){state.ended=true;overlay.classList.remove('hidden');document.getElementById('ovText').textContent=`Ищерги съели ${fmt(state.tokens)} токенов. Популяция ${fmt(state.pop)}.`;}
  function reset(){state.tokens=0;state.pop=3;state.vram=100;state.ctx=100;state.ended=false;overlay.classList.add('hidden');swarm.innerHTML='';render();}
  feedBtn.addEventListener('click',feed);
  resetBtn.addEventListener('click',reset);
  closeOv.addEventListener('click',reset);
  function share(){navigator.clipboard.writeText(`Мой результат: ${state.tokens} токенов, популяция ${state.pop}`);}
  shareBtn.addEventListener('click',share); if(shareBtn2)shareBtn2.addEventListener('click',share);
  render();
})();

// ----- PACMAN -----
/* скопирован из pacman-app.js с переименованным overlay */
(() => {
  const canvas=document.getElementById('game'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const scoreEl=document.getElementById('score');
  const leftEl=document.getElementById('left');
  const livesEl=document.getElementById('lives');
  const restartBtn=document.getElementById('restart');
  const shareBtn=document.getElementById('share');
  const overlay=document.getElementById('overlayPac');
  const ovTitle=document.getElementById('ovTitle');
  const ovText=document.getElementById('ovText');
  const ovRestart=document.getElementById('ovRestart');
  const ovShare=document.getElementById('ovShare');
  document.querySelectorAll('.dpad button').forEach(b=>b.addEventListener('click',()=>setDir(b.dataset.dir)));
  const MAP=["#################","#........#......#","#.###.##.#.##.#.#","#.#.......#.....#","#.#.#####.#.###.#","#...............#","###.#.#####.#.###","#...#...#...#...#","#.#####.#.#####.#","#.......P.......#","#.#####.#.#####.#","#...#...#...#...#","###.#.#####.#.###","#...............#","#.#.#####.#.###.#","#o..............#","#################"];
  const ROWS=MAP.length,COLS=MAP[0].length;
  let tile=24; function resize(){const s=Math.min(window.innerWidth*0.94,560);canvas.width=s*devicePixelRatio;canvas.height=s*devicePixelRatio;canvas.style.width=s+'px';canvas.style.height=s+'px';tile=Math.floor(canvas.width/COLS);} resize(); addEventListener('resize',resize);
  const dirs={left:{dx:-1,dy:0,ang:Math.PI},right:{dx:1,dy:0,ang:0},up:{dx:0,dy:-1,ang:-Math.PI/2},down:{dx:0,dy:1,ang:Math.PI/2}};
  const pass=(x,y)=>{if(x<0)x=COLS-1;if(x>=COLS)x=0;if(y<0||y>=ROWS) return false; return MAP[y][x]!=='#';};
  let state={score:0,left:0,lives:3,frightenedUntil:0,over:false,win:false};
  let player={x:8,y:9,dir:'left',next:'left'}; let enemies=[];
  const tokens=new Set(),powers=new Set(); const key=(x,y)=>`${x},${y}`;
  function parseMap(){tokens.clear();powers.clear();for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let c=MAP[y][x]; if(c=='.')tokens.add(key(x,y)); if(c=='o')powers.add(key(x,y));} state.left=tokens.size+powers.size;}
  function spawnPlayer(){for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++) if(MAP[y][x]=='P') return {x,y,dir:'left',next:'left'};return {x:1,y:1,dir:'right',next:'right'};}
  function spawnEnemies(){const c=Math.floor(COLS/2),r=Math.floor(ROWS/2);return[{x:c-2,y:r-2,dir:'right',deadUntil:0,color:'#ff6bd6'},{x:c+2,y:r-2,dir:'left',deadUntil:0,color:'#59c4ff'},{x:c,y:r+1,dir:'up',deadUntil:0,color:'#ffa86b'}];}
  function init(){state={score:0,left:0,lives:3,frightenedUntil:0,over:false,win:false};parseMap();player=spawnPlayer();enemies=spawnEnemies();overlay.classList.add('hidden');}
  function setDir(n){if(dirs[n])player.next=n;}
  document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')setDir('left');if(e.key==='ArrowRight'||e.key==='d')setDir('right');if(e.key==='ArrowUp'||e.key==='w')setDir('up');if(e.key==='ArrowDown'||e.key==='s')setDir('down');});
  restartBtn.addEventListener('click',init); ovRestart.addEventListener('click',init);
  shareBtn.addEventListener('click',()=>navigator.clipboard.writeText("Мой счёт "+state.score)); ovShare.addEventListener('click',()=>navigator.clipboard.writeText("Мой счёт "+state.score));
  function stepPlayer(){const nd=dirs[player.next]; if(nd&&pass(player.x+nd.dx,player.y+nd.dy))player.dir=player.next; const d=dirs[player.dir]; if(d&&pass(player.x+d.dx,player.y+d.dy)){let nx=player.x+d.dx,ny=player.y+d.dy; if(nx<0)nx=COLS-1;if(nx>=COLS)nx=0; player.x=nx;player.y=ny;const k=key(nx,ny); if(tokens.delete(k)){state.score+=10;state.left--;} if(powers.delete(k)){state.score+=50;state.left--;state.frightenedUntil=performance.now()+7000;} if(state.left<=0)win();}}
  function stepEnemies(ts){enemies.forEach(e=>{if(e.deadUntil>ts)return; const opts=[]; for(const n in dirs){const d=dirs[n];let nx=e.x+d.dx,ny=e.y+d.dy;if(!pass(nx,ny))continue;opts.push({nx,ny,name:n});} if(opts.length){const choice=opts[Math.floor(Math.random()*opts.length)];e.x=choice.nx;e.y=choice.ny;e.dir=choice.name;}});}
  function collisions(ts){enemies.forEach(e=>{if(e.deadUntil>ts)return; if(e.x===player.x&&e.y===player.y){lose();}});}
  function lose(){state.lives--; if(state.lives<=0) gameOver(); else {player=spawnPlayer(); enemies=spawnEnemies();}}
  function gameOver(){state.over=true;overlay.classList.remove('hidden');ovTitle.textContent='Игра окончена';ovText.textContent="Очки: "+state.score;}
  function win(){state.win=true;overlay.classList.remove('hidden');ovTitle.textContent='Победа!';ovText.textContent="Очки: "+state.score;}
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);const s=tile;for(let y=0;y<ROWS;y++){for(let x=0;x<COLS;x++){if(MAP[y][x]=='#'){ctx.fillStyle='#1e1b36';ctx.fillRect(x*s,y*s,s,s);} else {ctx.fillStyle='#0b0a16';ctx.fillRect(x*s,y*s,s,s); if(tokens.has(key(x,y))){ctx.fillStyle='yellow';ctx.fillRect(x*s+s/2-2,y*s+s/2-2,4,4);}}}} ctx.fillStyle='orange'; ctx.fillRect(player.x*s+4,player.y*s+4,s-8,s-8); ctx.fillStyle='red'; enemies.forEach(e=>{ctx.fillRect(e.x*s+6,e.y*s+6,s-12,s-12);}); scoreEl.textContent=state.score; leftEl.textContent=state.left; livesEl.textContent='❤️'.repeat(state.lives)||'💀';}
  let last=0,pAcc=0,eAcc=0; const pStep=120,eStep=200;
  function loop(ts){if(!last)last=ts; const dt=ts-last;last=ts;if(!state.over&&!state.win){pAcc+=dt;eAcc+=dt; while(pAcc>=pStep){stepPlayer();pAcc-=pStep;} while(eAcc>=eStep){stepEnemies(ts);collisions(ts);eAcc-=eStep;}} draw(); requestAnimationFrame(loop);}
  init(); requestAnimationFrame(loop);
})();
