(() => {
  const tokensEl = document.getElementById('tokensValue');
  const popEl = document.getElementById('popValue');
  const vramBar = document.getElementById('vramBar');
  const ctxBar = document.getElementById('ctxBar');
  const vramPct = document.getElementById('vramPct');
  const ctxPct = document.getElementById('ctxPct');
  const feedBtn = document.getElementById('feedBtn');
  const swarm = document.getElementById('swarm');
  const shareBtn = document.getElementById('shareBtn');
  const shareBtn2 = document.getElementById('shareBtn2');
  const resetBtn = document.getElementById('resetBtn');
  const overlay = document.getElementById('overlay');
  const closeOv = document.getElementById('closeOv');

  const state = {
    tokens: 0,
    pop: 3,
    vram: 100,
    ctx: 100,
    ended: false
  };

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function fmt(n){ return new Intl.NumberFormat('ru-RU').format(n); }

  function updateBars(){
    vramBar.style.width = `${state.vram}%`;
    ctxBar.style.width = `${state.ctx}%`;
    vramPct.textContent = `${Math.round(state.vram)}%`;
    ctxPct.textContent = `${Math.round(state.ctx)}%`;
  }

  function render(){
    tokensEl.textContent = fmt(state.tokens);
    popEl.textContent = fmt(state.pop);
    updateBars();
  }

  function addIshergBurst(cx, cy, count = 4){
    const rect = swarm.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const x = clamp((cx ?? (rect.width/2)) + rand(-60, 60), 10, rect.width-10);
      const y = clamp((cy ?? (rect.height/2)) + rand(-40, 40), 10, rect.height-10);
      const el = document.createElement('div');
      el.className = 'ish';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      swarm.appendChild(el);
    }
  }

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function feed(x, y){
    if (state.ended) return;
    state.tokens += 1;
    state.pop += 1 + Math.floor(state.pop * 0.01);
    state.vram = clamp(state.vram - 0.6, 0, 100);
    state.ctx  = clamp(state.ctx  - 1.2, 0, 100);
    render();
    addIshergBurst(x, y, 5);
    if (state.vram <= 0 || state.ctx <= 0){
      endGame();
    }
    save();
  }

  function endGame(){
    state.ended = true;
    overlay.classList.remove('hidden');
    document.getElementById('ovText').textContent =
      `Ищерги съели ${fmt(state.tokens)} токенов. Популяция выросла до ${fmt(state.pop)}.`;
    // Покажем переходное окошко
    setTimeout(()=>{
      document.getElementById('overlayLevel2').classList.remove('hidden');
    },1200);
  }

  function reset(){
    window.location.reload();
  }

  async function share(){
    const url = new URL(window.location.href);
    url.searchParams.set('tokens', String(state.tokens));
    url.searchParams.set('pop', String(state.pop));
    const shareText = `⚡️ Ищерги съели ${fmt(state.tokens)} токенов. Популяция: ${fmt(state.pop)}.`;
    const shareData = { title: 'Покорми ищергов', text: shareText, url: url.toString() };
    try{
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
    }catch(e){}
  }

  feedBtn.addEventListener('click', ()=>feed());
  document.addEventListener('keydown',(e)=>{
    if (e.code==='Space'){ e.preventDefault(); feed(); }
  });

  shareBtn.addEventListener('click', share);
  if (shareBtn2) shareBtn2.addEventListener('click', share);
  resetBtn.addEventListener('click', reset);
  closeOv.addEventListener('click', reset);

  function save(){
    try{ localStorage.setItem('ishergi_v1', JSON.stringify(state)); }catch{}
  }
  function load(){
    try{
      const raw = localStorage.getItem('ishergi_v1');
      if (raw) Object.assign(state, JSON.parse(raw));
    }catch{}
  }

  load(); render();

  // ==== LEVEL 2 PACMAN ====
  let pacmanGame=false;

  document.getElementById('startLevel2Btn').addEventListener('click', ()=>{
    document.getElementById('overlayLevel2').classList.add('hidden');
    startLevel2();
  });

  function startLevel2(){
    document.getElementById('level1wrap').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('level2').classList.remove('hidden');
    pacmanInit();
  }

  function pacmanInit(){
    const canvas=document.getElementById('pacmanCanvas');
    const ctx=canvas.getContext('2d');
    const mapSize=15;
    let map=Array.from({length:mapSize},()=> Array(mapSize).fill(0));
    for(let i=0;i<mapSize;i++){ map[0][i]=1; map[mapSize-1][i]=1; map[i][0]=1; map[i][mapSize-1]=1; }
    let pac={x:1,y:1,dx:0,dy:0};
    let ish={x:mapSize-2,y:mapSize-2};
    let tokensLeft=(mapSize-2)*(mapSize-2);

    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const cell=canvas.width/mapSize;
      for(let y=0;y<mapSize;y++){
        for(let x=0;x<mapSize;x++){
          if(map[y][x]===1){
            ctx.fillStyle='#241f44'; ctx.fillRect(x*cell,y*cell,cell,cell);
          }else if(map[y][x]===0){
            ctx.fillStyle='#6b5cff'; ctx.beginPath();
            ctx.arc(x*cell+cell/2,y*cell+cell/2,3,0,Math.PI*2); ctx.fill();
          }
        }
      }
      ctx.fillStyle='yellow'; ctx.beginPath();
      ctx.arc(pac.x*cell+cell/2,pac.y*cell+cell/2,cell/2-2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='red'; ctx.beginPath();
      ctx.arc(ish.x*cell+cell/2,ish.y*cell+cell/2,cell/2-2,0,Math.PI*2); ctx.fill();
    }

    function update(){
      const nx=pac.x+pac.dx, ny=pac.y+pac.dy;
      if(map[ny]?.[nx]!==1){ pac.x=nx; pac.y=ny; }
      if(map[pac.y][pac.x]===0){ map[pac.y][pac.x]=2; tokensLeft--; }
      if(Math.abs(ish.x-pac.x)>Math.abs(ish.y-pac.y)) ish.x+=Math.sign(pac.x-ish.x);
      else ish.y+=Math.sign(pac.y-ish.y);
      if(ish.x===pac.x && ish.y===pac.y) endLevel2(false);
      if(tokensLeft<=0) endLevel2(true);
    }

    function loop(){ update(); draw(); if(pacmanGame) requestAnimationFrame(loop); }
    pacmanGame=true; loop();
    document.addEventListener('keydown',(e)=>{
      if(e.key==='ArrowUp')   {pac.dx=0;pac.dy=-1;}
      if(e.key==='ArrowDown') {pac.dx=0;pac.dy=1;}
      if(e.key==='ArrowLeft') {pac.dx=-1;pac.dy=0;}
      if(e.key==='ArrowRight'){pac.dx=1;pac.dy=0;}
    });
  }

  function endLevel2(win){
    pacmanGame=false;
    const t=document.getElementById('end2Title');
    const p=document.getElementById('end2Text');
    if(win){ t.textContent="Поздравляем!"; p.textContent=`Ты собрал все токены на втором уровне! Итого ${fmt(state.tokens)} токенов.`;}
    else { t.textContent="Ищерги победили!"; p.textContent=`Тебя поймали. Счёт: ${fmt(state.tokens)} токенов.`;}
    document.getElementById('overlayEnd2').classList.remove('hidden');
    document.getElementById('shareBtnEnd2').onclick=share;
    document.getElementById('resetBtnEnd2').onclick=()=>window.location.reload();
  }

})();
