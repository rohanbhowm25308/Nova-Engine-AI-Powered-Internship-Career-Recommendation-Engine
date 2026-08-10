/* ============================================================
   tsParticles background — blue / cyan / purple, mouse interaction
   ============================================================ */
if (window.tsParticles) {
  tsParticles.load("tsparticles", {
    fullScreen: { enable: false },
    background: { color: "transparent" },
    particles: {
      number: { value: 70, density: { enable: true, area: 900 } },
      color: { value: ["#5eead4", "#2dd4bf", "#60a5fa", "#a855f7"] },
      opacity: { value: 0.55 },
      size: { value: { min: 1, max: 2.6 } },
      links: { enable: true, distance: 130, color: "#5eead4", opacity: 0.18, width: 1 },
      move: { enable: true, speed: 0.5, outModes: { default: "bounce" } },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" },
        onClick: { enable: true, mode: "push" },
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.4 } },
        push: { quantity: 2 },
      },
    },
    detectRetina: true,
  }).catch(()=>{});
}

/* ============================================================
   Theme switch
   ============================================================ */
document.getElementById('themeSwitch').addEventListener('click', (e)=>{
  const dot = e.target.closest('.theme-dot');
  if(!dot) return;
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.remove('active'));
  dot.classList.add('active');
  document.body.setAttribute('data-theme', dot.dataset.theme);
});

/* ============================================================
   Toast helper
   ============================================================ */
function showToast(msg, ms=2600){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(()=> t.classList.remove('show'), ms);
}

/* ============================================================
   Skill chip input + smart autocomplete
   ============================================================ */
const chipBox = document.getElementById('chipBox');
const skillInput = document.getElementById('skillInput');
const skillSuggest = document.getElementById('skillSuggest');
let skills = [];

// A broad, categorized skill/keyword list so typing "ml", "py", "ai" etc.
// surfaces the right suggestions immediately.
const SKILL_LIBRARY = [
  ["Python","Language"], ["JavaScript","Language"], ["TypeScript","Language"], ["Java","Language"],
  ["C","Language"], ["C++","Language"], ["C#","Language"], ["Go","Language"], ["Rust","Language"],
  ["Ruby","Language"], ["PHP","Language"], ["Swift","Language"], ["Kotlin","Language"], ["Dart","Language"],
  ["R","Language"], ["SQL","Language"], ["Scala","Language"], ["MATLAB","Language"],
  ["HTML","Frontend"], ["CSS","Frontend"], ["React","Frontend"], ["Vue","Frontend"], ["Angular","Frontend"],
  ["Next.js","Frontend"], ["Tailwind CSS","Frontend"],
  ["Node.js","Backend"], ["Express","Backend"], ["Django","Backend"], ["Flask","Backend"], ["Spring Boot","Backend"],
  ["REST APIs","Backend"], ["GraphQL","Backend"],
  ["Machine Learning","AI/ML"], ["ML","AI/ML"], ["AI","AI/ML"], ["Deep Learning","AI/ML"], ["NLP","AI/ML"],
  ["Computer Vision","AI/ML"], ["TensorFlow","AI/ML"], ["PyTorch","AI/ML"], ["Scikit-learn","AI/ML"],
  ["LLMs","AI/ML"], ["Prompt Engineering","AI/ML"],
  ["Pandas","Data"], ["NumPy","Data"], ["Data Analysis","Data"], ["Statistics","Data"], ["Power BI","Data"],
  ["Tableau","Data"], ["Excel","Data"], ["Spark","Data"], ["Airflow","Data"], ["ETL","Data"],
  ["AWS","Cloud/DevOps"], ["Azure","Cloud/DevOps"], ["GCP","Cloud/DevOps"], ["Docker","Cloud/DevOps"],
  ["Kubernetes","Cloud/DevOps"], ["Terraform","Cloud/DevOps"], ["CI/CD","Cloud/DevOps"], ["Linux","Cloud/DevOps"],
  ["Git","Cloud/DevOps"], ["Jenkins","Cloud/DevOps"],
  ["DSA","CS Fundamentals"], ["Data Structures","CS Fundamentals"], ["Algorithms","CS Fundamentals"],
  ["Competitive Programming","CS Fundamentals"], ["OOP","CS Fundamentals"],
  ["Cybersecurity","Security"], ["Networking","Security"], ["OWASP","Security"], ["Penetration Testing","Security"],
  ["Kotlin","Mobile"], ["Swift","Mobile"], ["Flutter","Mobile"], ["Android SDK","Mobile"], ["SwiftUI","Mobile"],
  ["Figma","Design"], ["UI Design","Design"], ["UX Research","Design"], ["Prototyping","Design"],
  ["Solidity","Blockchain"], ["Ethereum","Blockchain"], ["Web3.js","Blockchain"], ["Smart Contracts","Blockchain"],
  ["Unity","Game Dev"], ["Unreal Engine","Game Dev"], ["Game Design","Game Dev"],
  ["Embedded C","Embedded/IoT"], ["IoT","Embedded/IoT"], ["Microcontrollers","Embedded/IoT"],
  ["SEO","Marketing"], ["Content Strategy","Marketing"], ["Digital Marketing","Marketing"], ["Analytics","Marketing"],
  ["Agile","Product"], ["Scrum","Product"], ["Roadmapping","Product"],
];

function renderChips(){
  chipBox.querySelectorAll('.chip').forEach(c=>c.remove());
  skills.forEach((s,idx)=>{
    const chip = document.createElement('span');
    chip.className='chip';
    chip.innerHTML = `${s} <button type="button" data-idx="${idx}">&times;</button>`;
    chipBox.insertBefore(chip, skillInput);
  });
}
function addSkill(val){
  val = val.trim();
  if(val && !skills.some(s=>s.toLowerCase()===val.toLowerCase())) skills.push(val);
  skillInput.value='';
  renderChips();
  hideSuggestions();
}
chipBox.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-idx]');
  if(btn){ skills.splice(+btn.dataset.idx,1); renderChips(); }
  else skillInput.focus();
});

let suggestHighlight = -1;
function hideSuggestions(){ skillSuggest.classList.remove('show'); skillSuggest.innerHTML=''; suggestHighlight=-1; }
function showSuggestions(query){
  const q = query.trim().toLowerCase();
  if(!q){ hideSuggestions(); return; }
  const already = new Set(skills.map(s=>s.toLowerCase()));
  const matches = SKILL_LIBRARY
    .filter(([name]) => name.toLowerCase().includes(q) && !already.has(name.toLowerCase()))
    .sort((a,b) => {
      const aStarts = a[0].toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b[0].toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, 7);
  if(!matches.length){ hideSuggestions(); return; }
  skillSuggest.innerHTML = matches.map(([name,cat],i)=>
    `<div class="skill-suggest-item" data-name="${name}" data-i="${i}"><span>${name}</span><span class="cat">${cat}</span></div>`
  ).join('');
  skillSuggest.classList.add('show');
  suggestHighlight = -1;
}
skillSuggest.addEventListener('mousedown', e=>{
  const item = e.target.closest('.skill-suggest-item');
  if(item) addSkill(item.dataset.name);
});
skillInput.addEventListener('input', ()=> showSuggestions(skillInput.value));
skillInput.addEventListener('focus', ()=> { if(skillInput.value.trim()) showSuggestions(skillInput.value); });
skillInput.addEventListener('blur', ()=> setTimeout(hideSuggestions, 120));

skillInput.addEventListener('keydown', e=>{
  const items = skillSuggest.querySelectorAll('.skill-suggest-item');
  if(e.key==='ArrowDown' && items.length){
    e.preventDefault();
    suggestHighlight = Math.min(suggestHighlight+1, items.length-1);
    items.forEach((it,i)=>it.classList.toggle('highlighted', i===suggestHighlight));
    return;
  }
  if(e.key==='ArrowUp' && items.length){
    e.preventDefault();
    suggestHighlight = Math.max(suggestHighlight-1, 0);
    items.forEach((it,i)=>it.classList.toggle('highlighted', i===suggestHighlight));
    return;
  }
  if((e.key==='Enter' || e.key===',')){
    e.preventDefault();
    if(suggestHighlight>=0 && items[suggestHighlight]){
      addSkill(items[suggestHighlight].dataset.name);
    } else if(skillInput.value.trim()){
      addSkill(skillInput.value);
    }
  } else if(e.key==='Backspace' && !skillInput.value && skills.length){
    skills.pop(); renderChips();
  } else if(e.key==='Escape'){
    hideSuggestions();
  }
});

/* ============================================================
   API connectivity check
   ============================================================ */
const apiStatusEl = document.getElementById('apiStatus');
(async function checkApi(){
  try{
    const res = await fetch(`${API_BASE_URL}/api/domains`);
    if(!res.ok) throw new Error();
    apiStatusEl.textContent = 'API connected';
    apiStatusEl.style.color = 'var(--accent-cyan)';
  }catch(e){
    apiStatusEl.textContent = 'API unreachable — start backend';
    apiStatusEl.style.color = 'var(--danger)';
  }
})();

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
  return data;
}

/* ============================================================
   Form submit + loading sequence
   ============================================================ */
const form = document.getElementById('recoForm');
const heroSection = document.getElementById('hero-section');
const loadingScreen = document.getElementById('loadingScreen');
const resultsEl = document.getElementById('results');
const apiError = document.getElementById('apiError');
const progressFill = document.getElementById('progressFill');

function clearErrors(){
  ['fullName','currentYear','domain','experience','language'].forEach(id=>{
    document.getElementById(id).classList.remove('err');
    document.getElementById('err-'+id).style.display='none';
  });
  apiError.classList.remove('show'); apiError.textContent='';
}
function showError(id){
  document.getElementById(id).classList.add('err');
  document.getElementById('err-'+id).style.display='block';
}

let lastProfile = null;
let lastData = null;
const favorites = new Map(); // key -> item

form.addEventListener('submit', async function(e){
  e.preventDefault();
  clearErrors();
  const name = document.getElementById('fullName').value.trim();
  const college = document.getElementById('college').value.trim();
  const year = document.getElementById('currentYear').value;
  const branch = document.getElementById('branch').value.trim();
  const domain = document.getElementById('domain').value;
  const experience = document.getElementById('experience').value;
  const language = document.getElementById('language').value;
  const internship_mode = document.getElementById('internshipMode').value;
  const learning_style = document.getElementById('learningStyle').value;

  let valid = true;
  if(!name){ showError('fullName'); valid=false; }
  if(!year){ showError('currentYear'); valid=false; }
  if(!domain){ showError('domain'); valid=false; }
  if(!experience){ showError('experience'); valid=false; }
  if(!language){ showError('language'); valid=false; }
  if(!valid) return;

  lastProfile = {name, college, year, branch, domain, experience, language, skills: skills.slice(), internship_mode, learning_style};

  form.style.display='none';
  loadingScreen.classList.add('show');
  const stepEls = document.querySelectorAll('.load-step');
  stepEls.forEach(s=>s.classList.remove('active','done'));
  let step=0;
  progressFill.style.width='0%';
  const totalSteps = stepEls.length;
  const iv = setInterval(()=>{
    if(step>0) stepEls[step-1].classList.add('done');
    if(step < totalSteps){ stepEls[step].classList.add('active'); }
    progressFill.style.width = Math.min(100, Math.round((step+1)/totalSteps*100)) + '%';
    step++;
  }, 480);

  const minWait = new Promise(r => setTimeout(r, 480*totalSteps + 200));

  try{
    const [data] = await Promise.all([callRecommendAPI(lastProfile), minWait]);
    lastData = data;
    clearInterval(iv);
    loadingScreen.classList.remove('show');
    form.style.display='flex';
    renderAll(lastProfile, data);
    if(window.confetti){
      confetti({particleCount:120, spread:80, origin:{y:0.3}, colors:['#5eead4','#2dd4bf','#0d9488','#eafffb']});
    }
    showToast('✦ Recommendations Ready!');
  }catch(err){
    clearInterval(iv);
    loadingScreen.classList.remove('show');
    form.style.display='flex';
    apiError.textContent = 'API error: ' + err.message;
    apiError.classList.add('show');
  }
});

/* ============================================================
   Render: dashboard gauges
   ============================================================ */
function gaugeSVG(id, value, label){
  const r = 31, c = 2*Math.PI*r;
  const offset = c - (value/100)*c;
  return `
  <div class="gauge-card">
    <div class="g-label">${label}</div>
    <div class="gauge-ring">
      <svg width="78" height="78" viewBox="0 0 78 78">
        <circle class="g-track" cx="39" cy="39" r="${r}"/>
        <circle class="g-fill" id="gfill-${id}" cx="39" cy="39" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c}"/>
      </svg>
      <div class="g-value">${value}%</div>
    </div>
  </div>`;
}
function renderDashboard(dash){
  const grid = document.getElementById('dashboardGrid');
  const items = [
    ['skills', dash.skills_score, 'Skills Score'],
    ['match', dash.match_percent, 'Recommendation Match'],
    ['career', dash.career_readiness, 'Career Readiness'],
    ['intern', dash.internship_readiness, 'Internship Readiness'],
    ['learn', dash.learning_progress, 'Learning Progress'],
  ];
  grid.innerHTML = items.map(([id,val,label]) => gaugeSVG(id,val,label)).join('');
  requestAnimationFrame(()=>{
    items.forEach(([id,val])=>{
      const el = document.getElementById('gfill-'+id);
      const r=31, c=2*Math.PI*r;
      el.style.strokeDashoffset = c - (val/100)*c;
    });
  });
}

/* ============================================================
   Render: charts
   ============================================================ */
let chartInstances = {};
function killChart(key){ if(chartInstances[key]){ chartInstances[key].destroy(); delete chartInstances[key]; } }

function renderCharts(charts){
  if(!window.Chart) return;
  const tealPalette = ['#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#134e4a','#99f6e4','#2fe4d6'];
  const gridColor = 'rgba(255,255,255,0.06)';
  const textColor = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#7fa39c';
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "Inter, sans-serif";

  killChart('radar');
  chartInstances.radar = new Chart(document.getElementById('chartRadar'), {
    type: 'radar',
    data: { labels: charts.radar.map(r=>r.label), datasets:[{
      label:'Skill %', data: charts.radar.map(r=>r.value),
      backgroundColor:'rgba(94,234,212,0.18)', borderColor:'#5eead4', pointBackgroundColor:'#5eead4'
    }]},
    options:{ scales:{ r:{ suggestedMin:0, suggestedMax:100, grid:{color:gridColor}, angleLines:{color:gridColor}, pointLabels:{font:{size:9}} } }, plugins:{legend:{display:false}} }
  });

  killChart('pie');
  chartInstances.pie = new Chart(document.getElementById('chartPie'), {
    type: 'doughnut',
    data: { labels: charts.recommendation_pie.map(r=>r.label), datasets:[{ data: charts.recommendation_pie.map(r=>r.value), backgroundColor: tealPalette }] },
    options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10}}}} }
  });

  killChart('domain');
  chartInstances.domain = new Chart(document.getElementById('chartDomain'), {
    type: 'bar',
    data: { labels: charts.domain_popularity.map(r=>r.label.split(' ')[0]), datasets:[{ data: charts.domain_popularity.map(r=>r.value), backgroundColor:'#2dd4bf' }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}, ticks:{font:{size:8}}}, y:{grid:{color:gridColor}} } }
  });

  killChart('trend');
  chartInstances.trend = new Chart(document.getElementById('chartTrend'), {
    type: 'line',
    data: { labels: charts.learning_trend.map((_,i)=>'W'+(i+1)), datasets:[{ data: charts.learning_trend, borderColor:'#5eead4', backgroundColor:'rgba(94,234,212,0.15)', fill:true, tension:0.35 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor}} } }
  });

  killChart('dist');
  chartInstances.dist = new Chart(document.getElementById('chartDist'), {
    type: 'pie',
    data: { labels: charts.internship_distribution.map(r=>r.label), datasets:[{ data: charts.internship_distribution.map(r=>r.value), backgroundColor: tealPalette }] },
    options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10}}}} }
  });
}

/* ============================================================
   Render: skill bars + match meter
   ============================================================ */
function renderSkillBars(skillScores){
  const el = document.getElementById('skillBars');
  el.innerHTML = Object.entries(skillScores).map(([k,v])=>`
    <div class="skill-bar-row">
      <div class="sb-top"><span>${k}</span><span>${v}%</span></div>
      <div class="skill-bar-track"><div class="skill-bar-fill" data-w="${v}"></div></div>
    </div>`).join('');
  requestAnimationFrame(()=>{
    el.querySelectorAll('.skill-bar-fill').forEach(f=> f.style.width = f.dataset.w + '%');
  });
}
function renderMatchMeter(meter){
  document.getElementById('matchMeter').innerHTML = meter.map(m=>`
    <div class="meter-row">
      <span class="m-name">${m.label}</span>
      <span><span class="m-pct">${m.percent}%</span><span class="stars">${'★'.repeat(m.stars)}${'☆'.repeat(5-m.stars)}</span></span>
    </div>`).join('');
}

/* ============================================================
   Render: skill gap, badges, insights, roadmap
   ============================================================ */
function renderGap(gap){
  document.getElementById('gapHave').innerHTML = gap.have.length
    ? gap.have.map(s=>`<span class="tag-pill">${s}</span>`).join('')
    : `<span class="tag-pill">No skills entered yet</span>`;
  document.getElementById('gapMissing').innerHTML = gap.missing.length
    ? gap.missing.map(s=>`<span class="tag-pill">${s}</span>`).join('')
    : `<span class="tag-pill">You're covering the core stack!</span>`;
}
function renderBadges(badges){
  document.getElementById('badgeRow').innerHTML = badges.map(b=>`<span class="badge">🏅 ${b}</span>`).join('');
}
function renderInsights(insights){
  document.getElementById('insightList').innerHTML = insights.map(i=>`<li>${i}</li>`).join('');
}
function renderRoadmap(steps){
  document.getElementById('roadmap').innerHTML = steps.map((s,i)=>`
    <div class="roadmap-step">
      <div class="roadmap-dot">${i+1}</div>
      <div class="roadmap-label">${s}</div>
    </div>`).join('');
}

/* ============================================================
   Recommendation cards (internships / projects / resources / favorites)
   ============================================================ */
let normalizedItems = { internships:[], projects:[], resources:[] };
let activeTab = 'internships';
let activeModeFilter = 'All';
let activeSort = 'match';
let searchTerm = '';

function normalizeItems(results){
  normalizedItems.internships = results.internships.map((it,i)=>({
    key:`internship-${i}-${it.role}`, type:'internships', title: it.role, subtitle: it.company,
    mode: it.mode, difficulty: it.difficulty, duration: it.duration, rating: it.rating,
    skills: it.skills || [], match: it.match, cta:'Apply'
  }));
  normalizedItems.projects = results.projects.map((it,i)=>({
    key:`project-${i}-${it.title}`, type:'projects', title: it.title, subtitle: it.difficulty,
    mode:null, difficulty: it.difficulty, duration: it.time, rating: null,
    skills: it.skills || [], match: it.match, cta:'View on GitHub'
  }));
  normalizedItems.resources = results.resources.map((it,i)=>({
    key:`resource-${i}-${it.title}`, type:'resources', title: it.title, subtitle: it.platform,
    mode:null, difficulty: it.price, duration: it.duration, rating: null,
    skills: [], match: it.match, cta:'Start Learning'
  }));
}

function initialsOf(str){
  return (str||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}

function cardHTML(item){
  const isFav = favorites.has(item.key);
  const meta = [];
  if(item.mode) meta.push(item.mode);
  if(item.difficulty) meta.push(item.difficulty);
  if(item.duration) meta.push(item.duration);
  return `
  <div class="rec-card" data-key="${item.key}">
    <span class="match">${item.match}% match</span>
    <div class="card-top">
      <div class="logo-badge">${initialsOf(item.subtitle || item.title)}</div>
      ${item.rating ? `<div class="card-rating">★ ${item.rating}</div>` : ''}
      <button class="card-fav ${isFav?'active':''}" data-key="${item.key}">${isFav ? '♥' : '♡'}</button>
    </div>
    <h4>${item.title}</h4>
    <p style="color:var(--text-faint); font-size:12px; margin-bottom:8px;">${item.subtitle || ''}</p>
    <div class="meta">${meta.map(m=>`<span class="pill">${m}</span>`).join('')}${item.skills.slice(0,3).map(s=>`<span class="pill">${s}</span>`).join('')}</div>
    <a href="#" class="card-cta" data-cta="${item.type}">${item.cta} →</a>
  </div>`;
}

function getFilteredSorted(list){
  let out = list.filter(it => {
    if(activeModeFilter!=='All' && it.mode && it.mode!==activeModeFilter) return false;
    if(searchTerm && !(it.title.toLowerCase().includes(searchTerm) || (it.subtitle||'').toLowerCase().includes(searchTerm))) return false;
    return true;
  });
  const diffRank = {Beginner:1, Free:1, Intermediate:2, Paid:2, Advanced:3};
  if(activeSort==='match') out.sort((a,b)=> b.match - a.match);
  else if(activeSort==='rating') out.sort((a,b)=> (b.rating||0) - (a.rating||0));
  else if(activeSort==='difficulty') out.sort((a,b)=> (diffRank[a.difficulty]||0) - (diffRank[b.difficulty]||0));
  return out;
}

function renderCards(){
  const grid = document.getElementById('cardGrid');
  let list;
  if(activeTab==='favorites'){ list = Array.from(favorites.values()); }
  else { list = normalizedItems[activeTab]; }
  list = getFilteredSorted(list);
  grid.innerHTML = list.length ? list.map((it,idx)=>{
    const html = cardHTML(it);
    return html.replace('class="rec-card"', `class="rec-card" style="animation-delay:${idx*0.06}s"`);
  }).join('') : `<p style="color:var(--text-faint); grid-column:1/-1;">No results match your filters.</p>`;

  document.getElementById('cnt-internships').textContent = normalizedItems.internships.length;
  document.getElementById('cnt-projects').textContent = normalizedItems.projects.length;
  document.getElementById('cnt-resources').textContent = normalizedItems.resources.length;
  document.getElementById('cnt-favorites').textContent = favorites.size;
  const favCountBadge = document.getElementById('favCount');
  favCountBadge.textContent = favorites.size;
  favCountBadge.style.display = favorites.size ? 'flex' : 'none';
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
    activeTab = btn.dataset.tab;
    renderCards();
  });
});
document.getElementById('filterModeGroup').addEventListener('click', e=>{
  const chip = e.target.closest('.filter-chip');
  if(!chip) return;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('active', c===chip));
  activeModeFilter = chip.dataset.mode;
  renderCards();
});
document.getElementById('sortSelect').addEventListener('change', e=>{
  activeSort = e.target.value; renderCards();
});
document.getElementById('searchInput').addEventListener('input', e=>{
  searchTerm = e.target.value.trim().toLowerCase(); renderCards();
});
function buildExternalLink(item){
  const titleQ = encodeURIComponent(item.title || '');
  if(item.type === 'internships'){
    const q = encodeURIComponent(`${item.title} ${item.subtitle || ''} apply internship`);
    return `https://www.google.com/search?q=${q}`;
  }
  if(item.type === 'projects'){
    return `https://github.com/search?q=${titleQ}&type=repositories`;
  }
  if(item.type === 'resources'){
    const platform = (item.subtitle || '').toLowerCase();
    if(platform.includes('youtube'))       return `https://www.youtube.com/results?search_query=${titleQ}`;
    if(platform.includes('coursera'))      return `https://www.coursera.org/search?query=${titleQ}`;
    if(platform.includes('udemy'))         return `https://www.udemy.com/courses/search/?q=${titleQ}`;
    if(platform.includes('kaggle'))        return `https://www.kaggle.com/search?q=${titleQ}`;
    if(platform.includes('freecodecamp'))  return `https://www.freecodecamp.org/news/search/?query=${titleQ}`;
    if(platform.includes('ibm'))           return `https://skillsbuild.org/`;
    return `https://www.google.com/search?q=${titleQ}`;
  }
  return `https://www.google.com/search?q=${titleQ}`;
}

document.getElementById('cardGrid').addEventListener('click', e=>{
  const favBtn = e.target.closest('.card-fav');
  const all = [...normalizedItems.internships, ...normalizedItems.projects, ...normalizedItems.resources];
  if(favBtn){
    const key = favBtn.dataset.key;
    const item = all.find(i=>i.key===key);
    if(favorites.has(key)) favorites.delete(key); else if(item) favorites.set(key, item);
    renderCards();
    return;
  }
  const cta = e.target.closest('[data-cta]');
  if(cta){
    e.preventDefault();
    const card = e.target.closest('.rec-card');
    const key = card ? card.dataset.key : null;
    const item = all.find(i=>i.key===key);
    if(item) window.open(buildExternalLink(item), '_blank', 'noopener');
  }
});
document.getElementById('favBtn').addEventListener('click', ()=>{
  if(!resultsEl.classList.contains('show')) return;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab==='favorites'));
  activeTab = 'favorites';
  renderCards();
  document.getElementById('cardGrid').scrollIntoView({behavior:'smooth', block:'center'});
});

/* ============================================================
   Master render
   ============================================================ */
function renderAll(profile, data){
  const r = data.results;
  document.getElementById('resName').textContent = profile.name.split(' ')[0] || 'you';
  document.getElementById('resDomain').textContent = profile.domain;
  document.getElementById('resExp').textContent = profile.experience;
  document.getElementById('resSkills').textContent = profile.skills.length ? profile.skills.join(', ') : profile.language;

  renderDashboard(r.dashboard);
  renderCharts(r.charts);
  renderSkillBars(r.skill_scores);
  renderMatchMeter(r.match_meter);
  renderGap(r.skill_gap);
  renderBadges(r.badges);
  renderInsights(r.insights);
  renderRoadmap(r.roadmap);
  normalizeItems(r);
  activeTab='internships'; activeModeFilter='All'; activeSort='match'; searchTerm='';
  document.getElementById('searchInput').value='';
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab==='internships'));
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('active', c.dataset.mode==='All'));

  // Show the results container BEFORE building the cards. Building cards
  // while the container is still display:none was the cause of the
  // "cards don't appear until I touch the sort dropdown" bug — building
  // them after the container is already visible fixes it for good.
  resultsEl.classList.add('show');
  heroSection.style.display='none';
  renderCards();
  resultsEl.scrollIntoView({behavior:'smooth', block:'start'});
}

document.getElementById('regenBtn').addEventListener('click', async ()=>{
  if(!lastProfile) return;
  try{
    const data = await callRecommendAPI({...lastProfile, name: lastProfile.name + ' '});
    lastData = data;
    renderAll(lastProfile, data);
  }catch(err){ showToast('Could not regenerate — API error.'); }
});
document.getElementById('editBtn').addEventListener('click', ()=>{
  resultsEl.classList.remove('show');
  heroSection.style.display='grid';
  window.scrollTo({top:0, behavior:'smooth'});
});

/* ============================================================
   Export: CSV + PDF
   ============================================================ */
function buildReportRows(){
  const all = [...normalizedItems.internships, ...normalizedItems.projects, ...normalizedItems.resources];
  return all.map(it => ({
    Type: it.type, Title: it.title, Subtitle: it.subtitle || '', Match: it.match + '%',
    Difficulty: it.difficulty || '', Duration: it.duration || '', Skills: (it.skills||[]).join('; ')
  }));
}
document.getElementById('csvBtn').addEventListener('click', ()=>{
  if(!lastData) return;
  const rows = buildReportRows();
  const headers = Object.keys(rows[0] || {Type:'',Title:''});
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g,'""')}"`).join(','))
  ).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nova-recommendations.csv'; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('pdfBtn').addEventListener('click', ()=>{
  if(!lastData || !window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const r = lastData.results;
  let y = 18;
  doc.setFontSize(18); doc.text('Nova Engine — Recommendation Report', 14, y); y+=10;
  doc.setFontSize(11);
  doc.text(`Name: ${lastProfile.name}   Domain: ${lastProfile.domain}   Experience: ${lastProfile.experience}`, 14, y); y+=8;
  doc.text(`Career Readiness: ${r.dashboard.career_readiness}%   Match: ${r.dashboard.match_percent}%`, 14, y); y+=10;

  doc.setFontSize(13); doc.text('Internships', 14, y); y+=7; doc.setFontSize(10);
  r.internships.forEach(it=>{ doc.text(`• ${it.role} — ${it.company} (${it.match}% match)`, 16, y); y+=6; });
  y+=4;
  doc.setFontSize(13); doc.text('Projects', 14, y); y+=7; doc.setFontSize(10);
  r.projects.forEach(it=>{ doc.text(`• ${it.title} — ${it.difficulty} (${it.match}% match)`, 16, y); y+=6; });
  y+=4;
  doc.setFontSize(13); doc.text('Learning Resources', 14, y); y+=7; doc.setFontSize(10);
  r.resources.forEach(it=>{ doc.text(`• ${it.title} — ${it.platform} (${it.match}% match)`, 16, y); y+=6; });
  y+=6;
  doc.setFontSize(13); doc.text('AI Insights', 14, y); y+=7; doc.setFontSize(10);
  r.insights.forEach(ins=>{ const lines = doc.splitTextToSize('• '+ins, 180); doc.text(lines, 16, y); y+=6*lines.length; });

  doc.save('nova-recommendation-report.pdf');
});