/* ---------- Starfield / particle network background ---------- */
(function(){
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let w,h,particles=[];
  const COUNT = 90, LINK_DIST = 130;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight * 1.0;
    canvas.style.height = window.innerHeight + 'px';
  }
  function init(){
    particles = [];
    for(let i=0;i<COUNT;i++){
      particles.push({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-0.5)*0.28, vy:(Math.random()-0.5)*0.28,
        r: Math.random()*1.4+0.5
      });
    }
  }
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
    }
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const dx=a.x-b.x, dy=a.y-b.y, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<LINK_DIST){
          ctx.strokeStyle = `rgba(120,150,255,${0.16*(1-dist/LINK_DIST)})`;
          ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    for(const p of particles){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(200,215,255,0.85)';
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('resize', ()=>{resize(); init();});
  resize(); init(); step();
})();

/* ---------- Skill chip input ---------- */
const chipBox = document.getElementById('chipBox');
const skillInput = document.getElementById('skillInput');
let skills = [];

function renderChips(){
  chipBox.querySelectorAll('.chip').forEach(c=>c.remove());
  skills.forEach((s,idx)=>{
    const chip = document.createElement('span');
    chip.className='chip';
    chip.innerHTML = `${s} <button type="button" data-idx="${idx}">&times;</button>`;
    chipBox.insertBefore(chip, skillInput);
  });
}
chipBox.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-idx]');
  if(btn){ skills.splice(+btn.dataset.idx,1); renderChips(); }
  else skillInput.focus();
});
skillInput.addEventListener('keydown', e=>{
  if((e.key==='Enter' || e.key===',') && skillInput.value.trim()){
    e.preventDefault();
    const val = skillInput.value.replace(',','').trim();
    if(val && !skills.includes(val)) skills.push(val);
    skillInput.value='';
    renderChips();
  } else if(e.key==='Backspace' && !skillInput.value && skills.length){
    skills.pop(); renderChips();
  }
});

/* ---------- Form handling ---------- */
const form = document.getElementById('recoForm');
const heroSection = document.getElementById('hero-section');
const loadingScreen = document.getElementById('loadingScreen');
const resultsEl = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');
const apiError = document.getElementById('apiError');

const loadingLines = [
  "calling the recommendation API",
  "matching domain signals",
  "ranking by experience level",
  "cross-referencing skill set",
  "finalizing recommendations"
];

function clearErrors(){
  ['fullName','currentYear','domain','experience','language'].forEach(id=>{
    document.getElementById(id).classList.remove('err');
    document.getElementById('err-'+id).style.display='none';
  });
  apiError.classList.remove('show');
  apiError.textContent = '';
}
function showError(id){
  document.getElementById(id).classList.add('err');
  document.getElementById('err-'+id).style.display='block';
}

let lastProfile = null;
let lastResults = null;

async function callRecommendAPI(profile){
  const res = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(profile)
  });
  const data = await res.json();
  if(!res.ok || !data.ok){
    const msg = data.errors ? Object.values(data.errors).join(' ') : 'Something went wrong.';
    throw new Error(msg);
  }
  return data.results;
}

/* ---------- Backend connectivity check ---------- */
const apiStatusEl = document.getElementById('apiStatus');
(async function checkApi(){
  try{
    const res = await fetch(`${API_BASE_URL}/api/domains`);
    if(!res.ok) throw new Error();
    apiStatusEl.textContent = 'API connected · ' + API_BASE_URL;
    apiStatusEl.style.color = 'var(--accent-cyan)';
  }catch(e){
    apiStatusEl.textContent = 'API unreachable — start the backend (see README)';
    apiStatusEl.style.color = 'var(--danger)';
  }
})();

form.addEventListener('submit', async function(e){
  e.preventDefault();
  clearErrors();
  const name = document.getElementById('fullName').value.trim();
  const year = document.getElementById('currentYear').value;
  const domain = document.getElementById('domain').value;
  const experience = document.getElementById('experience').value;
  const language = document.getElementById('language').value;

  let valid = true;
  if(!name){ showError('fullName'); valid=false; }
  if(!year){ showError('currentYear'); valid=false; }
  if(!domain){ showError('domain'); valid=false; }
  if(!experience){ showError('experience'); valid=false; }
  if(!language){ showError('language'); valid=false; }
  if(!valid) return;

  lastProfile = {name, year, domain, experience, language, skills: skills.slice()};

  form.style.display='none';
  loadingScreen.classList.add('show');
  let step=0;
  document.getElementById('loadingLine').textContent = loadingLines[0];
  const iv = setInterval(()=>{
    step++;
    if(step < loadingLines.length){
      document.getElementById('loadingLine').textContent = loadingLines[step];
    }
  }, 380);

  const minWait = new Promise(r => setTimeout(r, 380*loadingLines.length));

  try{
    const [results] = await Promise.all([callRecommendAPI(lastProfile), minWait]);
    lastResults = results;
    clearInterval(iv);
    loadingScreen.classList.remove('show');
    form.style.display='flex';
    renderResults(lastProfile, lastResults);
  }catch(err){
    clearInterval(iv);
    loadingScreen.classList.remove('show');
    form.style.display='flex';
    apiError.textContent = 'API error: ' + err.message;
    apiError.classList.add('show');
  }
});

function pillsFor(item, type){
  if(type==='internships') return `<span class="pill">${item.org}</span>`;
  if(type==='projects'){
    const label = item.diff===1?'Beginner-friendly':item.diff===2?'Intermediate':'Advanced';
    return `<span class="pill">${label}</span>`;
  }
  return `<span class="pill">${item.type}</span><span class="pill">${item.provider}</span>`;
}
function titleFor(item, type){
  if(type==='internships') return item.role;
  return item.title;
}
function descFor(item, type){
  if(type==='internships' || type==='projects') return item.detail;
  return `${item.type} by ${item.provider}.`;
}
function tagFor(type){
  return {internships:'Internship', projects:'Project Idea', resources:'Learning Resource'}[type];
}

let currentSets = null;

function renderCards(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  const grid = document.getElementById('cardGrid');
  grid.innerHTML='';
  const items = currentSets[tab];
  items.forEach((item, idx)=>{
    const card = document.createElement('div');
    card.className='rec-card';
    card.style.animationDelay = (idx*0.08)+'s';
    card.innerHTML = `
      <span class="match">${item.match}% match</span>
      <span class="tag">${tagFor(tab)}</span>
      <h4>${titleFor(item,tab)}</h4>
      <p>${descFor(item,tab)}</p>
      <div class="meta">${pillsFor(item,tab)}</div>
    `;
    grid.appendChild(card);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> renderCards(btn.dataset.tab));
});

function renderResults(profile, results){
  currentSets = results;
  document.getElementById('cnt-internships').textContent = results.internships.length;
  document.getElementById('cnt-projects').textContent = results.projects.length;
  document.getElementById('cnt-resources').textContent = results.resources.length;

  document.getElementById('resName').textContent = profile.name.split(' ')[0] || 'you';
  document.getElementById('resDomain').textContent = profile.domain;
  document.getElementById('resExp').textContent = profile.experience;
  document.getElementById('resSkills').textContent = profile.skills.length ? profile.skills.join(', ') : profile.language;

  renderCards('internships');
  resultsEl.classList.add('show');
  heroSection.style.display='none';
  resultsEl.scrollIntoView({behavior:'smooth', block:'start'});
}

document.getElementById('regenBtn').addEventListener('click', async ()=>{
  if(!lastProfile) return;
  try{
    const results = await callRecommendAPI({...lastProfile, name: lastProfile.name + ' '});
    lastResults = results;
    renderResults(lastProfile, results);
  }catch(err){ /* ignore regen failure silently */ }
});
document.getElementById('editBtn').addEventListener('click', ()=>{
  resultsEl.classList.remove('show');
  heroSection.style.display='grid';
  window.scrollTo({top:0, behavior:'smooth'});
});
