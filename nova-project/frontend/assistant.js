/* ============================================================
   Nova Assistant — real LLM chat (Groq, via the Flask backend) + voice
   (Web Speech API).

   How it works:
   - Every message is sent to POST {API_BASE_URL}/api/chat along with a
     condensed snapshot of the user's profile/recommendation results and
     recent conversation history, so the model can answer grounded,
     personalized questions ("which internship is best?") as well as
     open-ended ones ("is AI/ML a good career for me?").
   - The Groq API key lives only on the backend (see backend/app.py) —
     never in this file, never in the browser.
   - If GROQ_API_KEY isn't configured on the backend, or the request
     fails for any reason, this automatically falls back to a built-in
     rule-based responder so the widget never just breaks.
   ============================================================ */
const assistantFab = document.getElementById('assistantFab');
const assistantPanel = document.getElementById('assistantPanel');
const assistantBody = document.getElementById('assistantBody');
const assistantSuggest = document.getElementById('assistantSuggest');
const assistantInput = document.getElementById('assistantInput');
const assistantHead = document.querySelector('.assistant-head b');
const micBtn = document.getElementById('micBtn');

const SUGGESTIONS = [
  "Which internship is best?",
  "What should I learn next?",
  "Suggest AI projects",
  "Is AI/ML a good career for me?"
];

let chatHistory = [];          // [{role:'user'|'assistant', content:string}]
let backendChatReady = false;  // true once we've confirmed GROQ_API_KEY is configured
let fallbackNoticeShown = false;

function addChatMsg(text, who){
  const div = document.createElement('div');
  div.className = `chat-msg ${who}`;
  div.textContent = text;
  assistantBody.appendChild(div);
  assistantBody.scrollTop = assistantBody.scrollHeight;
  return div;
}

function addTypingIndicator(){
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  assistantBody.appendChild(div);
  assistantBody.scrollTop = assistantBody.scrollHeight;
  return div;
}

function renderSuggestions(){
  assistantSuggest.innerHTML = SUGGESTIONS.map(s=>`<button type="button">${s}</button>`).join('');
}

/* ============================================================
   Check backend chat status on load — lets us show whether this is
   running on real Groq or the offline fallback, without waiting for
   the user's first message to find out.
   ============================================================ */
(async function checkChatStatus(){
  try{
    const res = await fetch(`${API_BASE_URL}/api/chat-status`);
    const data = await res.json();
    backendChatReady = !!data.configured;
    if(assistantHead){
      assistantHead.textContent = backendChatReady ? `Nova Assistant · ${data.model || 'AI'}` : 'Nova Assistant · offline mode';
    }
  }catch(e){
    backendChatReady = false;
  }
})();

let assistantOpened = false;
assistantFab.addEventListener('click', ()=>{
  assistantPanel.classList.toggle('open');
  if(!assistantOpened && assistantPanel.classList.contains('open')){
    assistantOpened = true;
    addChatMsg("Hi! I'm Nova. Ask me about your internships, projects, what to learn next — or anything career-related, like whether AI/ML is a good fit for you.", 'bot');
    renderSuggestions();
  }
});
document.getElementById('assistantClose').addEventListener('click', ()=> assistantPanel.classList.remove('open'));

assistantSuggest.addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(btn) handleUserMessage(btn.textContent);
});

document.getElementById('assistantSend').addEventListener('click', ()=>{
  const val = assistantInput.value.trim();
  if(!val) return;
  handleUserMessage(val);
  assistantInput.value='';
});
assistantInput.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    const val = assistantInput.value.trim();
    if(!val) return;
    handleUserMessage(val);
    assistantInput.value='';
  }
});

function speak(text){
  if(!window.speechSynthesis) return;
  try{
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02; utter.pitch = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }catch(e){ /* ignore */ }
}

/* ============================================================
   Condense the user's profile + recommendation results into a small
   payload for the model — full raw data would waste tokens.
   ============================================================ */
function buildChatContext(){
  if(!lastData || !lastProfile) return {};
  const r = lastData.results;
  const top = (list, n=3) => [...list].sort((a,b)=>b.match-a.match).slice(0,n);
  return {
    profile: {
      name: lastProfile.name, domain: lastProfile.domain, experience: lastProfile.experience,
      language: lastProfile.language, skills: lastProfile.skills, year: lastProfile.year,
    },
    dashboard: r.dashboard,
    skill_gap: r.skill_gap,
    top_internships: top(r.internships).map(i => ({role:i.role, company:i.company, match:i.match, mode:i.mode})),
    top_projects: top(r.projects).map(p => ({title:p.title, match:p.match, difficulty:p.difficulty})),
    top_resources: top(r.resources).map(res => ({title:res.title, platform:res.platform, match:res.match})),
    insights: r.insights,
    badges: r.badges,
  };
}

/* ============================================================
   Rule-based fallback (used only if the backend/Groq call fails)
   ============================================================ */
function generateFallbackReply(rawText){
  const text = rawText.toLowerCase();
  const knownSkillWords = ["python","java","javascript","html","css","react","node","sql","ml","machine learning",
    "django","flask","c++","typescript","kotlin","swift","docker","aws","figma","solidity"];
  const mentioned = knownSkillWords.filter(k => text.includes(k));

  if(!lastData){
    if(mentioned.length){
      return `Got it — noted ${mentioned.join(', ')}. Fill in the form above and hit "Get Recommendations" so I can generate your personalized matches.`;
    }
    return "I don't have your recommendations yet — fill out the form above and click \"Get Recommendations\", then ask me anything about the results!";
  }
  const r = lastData.results;
  if(text.includes('best') && text.includes('internship')){
    const top = [...r.internships].sort((a,b)=>b.match-a.match)[0];
    return top ? `Your best-matched internship is "${top.role}" at ${top.company} — ${top.match}% match, ${top.mode}, ${top.duration}.` : "I don't have internship data yet.";
  }
  if(text.includes('learn') && (text.includes('next') || text.includes('what'))){
    const gap = r.skill_gap.missing;
    return gap.length ? `Based on your skill gap, I'd focus on: ${gap.join(', ')}.` : "You're covering the core stack well — focus on building more advanced projects next.";
  }
  if(text.includes('project')){
    const top = [...r.projects].sort((a,b)=>b.match-a.match).slice(0,3).map(p=>p.title);
    return `Here are AI-matched projects for you: ${top.join(', ')}.`;
  }
  if(text.includes('good') && (text.includes('career') || text.includes('ai') || text.includes('ml'))){
    return `${lastProfile.domain} has real momentum right now, and your career readiness is ${r.dashboard.career_readiness}% — but I'm running in offline mode so I can't give you a fully reasoned opinion. Set GROQ_API_KEY on the backend for real open-ended career advice.`;
  }
  if(text.includes('explain') || text.includes('recommendation')){
    return r.insights.join(' ');
  }
  if(text.includes('resource') || text.includes('course')){
    const top = [...r.resources].sort((a,b)=>b.match-a.match)[0];
    return top ? `I'd start with "${top.title}" on ${top.platform} (${top.duration}).` : "No resources found yet.";
  }
  if(mentioned.length){
    return `Noted — you know ${mentioned.join(', ')}. Want me to suggest projects, or tell you what to learn next?`;
  }
  return "I can help with: which internship is best, what to learn next, project suggestions, or explaining your recommendation. (I'm in offline mode right now — set GROQ_API_KEY on the backend for full open-ended answers.)";
}

/* ============================================================
   Main send flow: real backend call, typing indicator, fallback
   ============================================================ */
async function handleUserMessage(text){
  addChatMsg(text, 'user');
  chatHistory.push({role:'user', content:text});
  const typingEl = addTypingIndicator();

  let reply;
  let usedFallback = false;
  let apiErrorDetail = '';

  try{
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: text,
        context: buildChatContext(),
        history: chatHistory.slice(0, -1).slice(-8),
      })
    });
    const data = await res.json();
    if(res.ok && data.ok){
      reply = data.reply;
    } else {
      usedFallback = true;
      // Capture the REAL reason from the backend instead of discarding it —
      // this is what actually tells you why Groq isn't answering.
      apiErrorDetail = `HTTP ${res.status}: ${data.error || 'unknown error'}${data.detail ? ' — ' + data.detail : ''}`;
      reply = generateFallbackReply(text);
    }
  }catch(e){
    usedFallback = true;
    apiErrorDetail = `Network error reaching backend: ${e.message}`;
    reply = generateFallbackReply(text);
  }

  typingEl.remove();
  addChatMsg(reply, 'bot');
  chatHistory.push({role:'assistant', content:reply});

  if(usedFallback && !fallbackNoticeShown){
    fallbackNoticeShown = true;
    addChatMsg(`(Offline mode. Real reason from backend: ${apiErrorDetail})`, 'bot');
    console.warn('[Nova Assistant] /api/chat failed:', apiErrorDetail);
  }

  if(voiceReplyEnabled) speak(reply);
}

/* ============================================================
   Voice input (Web Speech API) — click mic, speak, get a reply
   ============================================================ */
let voiceReplyEnabled = false;
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
if(SpeechRecognitionImpl){
  recognizer = new SpeechRecognitionImpl();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = 'en-US';

  recognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    voiceReplyEnabled = true;
    handleUserMessage(transcript);
  };
  recognizer.onend = () => micBtn.classList.remove('listening');
  recognizer.onerror = () => { micBtn.classList.remove('listening'); showToast('Voice input error — try again.'); };
} else {
  micBtn.title = 'Voice input not supported in this browser';
}

micBtn.addEventListener('click', ()=>{
  if(!recognizer){ showToast('Your browser does not support voice input (try Chrome).'); return; }
  if(!assistantPanel.classList.contains('open')){ assistantPanel.classList.add('open'); }
  micBtn.classList.add('listening');
  try{ recognizer.start(); }catch(e){ /* already listening */ }
});