// Mock Data for Jobs
const DEFAULT_JOBS = [
  {
    id: 1,
    title: { hi: "खेत की कटाई", mr: "शेत कापणी" },
    desc: "कल 3 मज़दूर चाहिए गेहूं काटने के लिए।",
    wage: "₹400 / दिन",
    location: "2 किमी दूर - रामु का खेत",
    lat: 19.0760,
    lng: 72.8777,
    phone: "9876543210",
    category: "kheti"
  },
  {
    id: 2,
    title: { hi: "राजमिस्त्री का काम", mr: "गवंडी काम" },
    desc: "दीवार बनाने के लिए 1 मिस्त्री और 2 हेल्पर चाहिए।",
    wage: "₹600 / दिन",
    location: "4 किमी दूर - सरपंच घर",
    lat: 19.0800,
    lng: 72.8800,
    phone: "9876543211",
    category: "mistri"
  },
  {
    id: 3,
    title: { hi: "खेत की जुताई", mr: "नांगरणी" },
    desc: "ट्रैक्टर के साथ जुताई का काम है।",
    wage: "₹500 / दिन",
    location: "1 किमी दूर - शिवम् का खेत",
    lat: 19.0710,
    lng: 72.8850,
    phone: "9876543212",
    category: "kheti"
  },
  {
    id: 4,
    title: { hi: "सामान ढोना", mr: "सामान उचलणे" },
    desc: "दुकान से 50 बोरी सीमेंट उतारना है।",
    wage: "₹350 / दिन",
    location: "0.5 किमी दूर - रामजी सेठ",
    lat: 19.0750,
    lng: 72.8700,
    phone: "9876543213",
    category: "majdoori"
  }
];

const DEFAULT_LABOURERS = [
  { id: 101, name: "Suresh (Kheti)", lat: 19.0740, lng: 72.8790, category: "kheti" },
  { id: 102, name: "Ramesh (Mistri)", lat: 19.0810, lng: 72.8750, category: "mistri" },
  { id: 103, name: "Dinesh (Majdoor)", lat: 19.0720, lng: 72.8720, category: "majdoori" },
  { id: 104, name: "Ganesh (Kheti)", lat: 19.0780, lng: 72.8880, category: "kheti" }
];

function loadJobs() {
  const stored = localStorage.getItem('gaon_jobs');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('gaon_jobs', JSON.stringify(DEFAULT_JOBS));
  return DEFAULT_JOBS;
}

function saveJobs() {
  localStorage.setItem('gaon_jobs', JSON.stringify(JOB_DATA));
}

let JOB_DATA = loadJobs();

// Admin Contact configuration
const ADMIN_PHONE = "0000000000"; // All calls will be routed through this number

// App State
const state = {
  lang: 'hi', // 'hi' = Hindi, 'mr' = Marathi
  userPhone: localStorage.getItem('userPhone') || null,
  activeCategory: 'all',
  searchQuery: ''
};

function getBlockedJobs() {
  const stored = localStorage.getItem('blocked_jobs');
  return stored ? JSON.parse(stored) : [];
}

const i18n = {
  hi: {
    findWork: 'काम ढूंढें',
    mapVal: 'नक्शा',
    postJob: 'काम दें',
    profile: 'प्रोफाइल',
    greetTitle: 'काम खोजें',
    greetSub: 'Voice-search कीजिये या नीचे scroll कीजिये।',
    voiceSearchText: 'बोलकर खोजें',
    postTitle: 'काम पोस्ट करें',
    postSub: 'अपनी ज़रुरत बोलकर बताएं (जैसे: "मुझे कल खेती के लिए 2 लोग चाहिए")',
    recordStatus: 'बोलने के लिए दबाएं',
    mapTitle: 'लाइव काम और मज़दूर (Live Map)',
  },
  en: {
    findWork: 'Find Work',
    mapVal: 'Map',
    postJob: 'Hire',
    profile: 'Profile',
    greetTitle: 'Find Jobs',
    greetSub: 'Use voice search or filter below.',
    voiceSearchText: 'Voice Search',
    postTitle: 'Post a Job',
    postSub: 'Speak your required job details clearly',
    recordStatus: 'Tap to speak',
    mapTitle: 'Live Map',
  }
};

let activeLocationFilter = 'all';

// DOM Elements
const sections = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');
const langToggle = document.getElementById('lang-toggle');
const jobListContainer = document.getElementById('job-list-container');
const toastEl = document.getElementById('toast');

// Speech Recognition Init
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

// ------------------------------
// Filter Chips Logic
const filterChips = document.querySelectorAll('.filter-chip');
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeCategory = chip.getAttribute('data-category');
    renderJobs();
  });
});

const locationSelect = document.getElementById('location-select');
if (locationSelect) {
  locationSelect.addEventListener('change', (e) => {
    activeLocationFilter = e.target.value;
    renderJobs();
  });
}

// ------------------------------
// Navigation Logic
// ------------------------------
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Remove active styles
    navItems.forEach(n => n.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active', 'hidden'));
    sections.forEach(s => s.classList.add('hidden'));

    // Apply active styles
    item.classList.add('active');
    const targetId = item.getAttribute('data-target');
    document.getElementById(targetId).classList.remove('hidden');
    document.getElementById(targetId).classList.add('active');
  });
});

// ------------------------------
// Multi-Language Logic
// ------------------------------
// Toggle Language
langToggle.addEventListener('click', () => {
  state.lang = state.lang === 'hi' ? 'en' : 'hi';
  langToggle.querySelector('span:nth-child(2)').textContent = state.lang === 'hi' ? 'हिन्दी' : 'English';
  updateLanguageUI();
  renderJobs();
});

function updateLanguageUI() {
  const dict = i18n[state.lang];
  
  // Header Button
  
  // Bottom Nav
  document.getElementById('nav-find-work').textContent = dict.findWork;
  if(document.getElementById('nav-map')) document.getElementById('nav-map').textContent = dict.mapVal;
  document.getElementById('nav-post-job').textContent = dict.postJob;
  document.getElementById('nav-profile').textContent = dict.profile;
  
  // Map Title
  if(document.getElementById('map-title-text')) document.getElementById('map-title-text').textContent = dict.mapTitle;
  
  // Home
  if(document.getElementById('greet-text')) document.getElementById('greet-text').textContent = dict.greetTitle;
  if(document.getElementById('voice-search-text')) document.getElementById('voice-search-text').textContent = dict.voiceSearchText;
  
  if(document.getElementById('home-find-work')) document.getElementById('home-find-work').textContent = dict.findWork;
  if(document.getElementById('home-hire-worker')) document.getElementById('home-hire-worker').textContent = state.lang === 'hi' ? 'मज़दूर बुलाएं (Hire)' : 'Hire Workers';
  
  // Post Job
  document.getElementById('post-title').textContent = dict.postTitle;
  document.getElementById('post-sub').textContent = dict.postSub;
  document.getElementById('recording-status').textContent = dict.recordStatus;

  // Re-render Jobs
  renderJobs();
}

// ------------------------------
// Render Jobs
// ------------------------------
async function renderJobs() {
  try {
    const res = await fetch(`/api/jobs?phone=${state.userPhone||''}`);
    if (res.ok) {
      JOB_DATA = await res.json();
    } else {
      JOB_DATA = loadJobs();
    }
  } catch(e) {
    console.error(e);
    JOB_DATA = loadJobs();
  }
  jobListContainer.innerHTML = '';
  
  // Populate Location Dropdown
  const locSelect = document.getElementById('location-select');
  if (locSelect && locSelect.options.length <= 1) {
    const locs = [...new Set(JOB_DATA.map(j => j.location))];
    locs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      locSelect.appendChild(opt);
    });
  }

  const filteredJobs = JOB_DATA.filter(job => {
    const matchCategory = state.activeCategory === 'all' || job.category === state.activeCategory;
    const locMatchDrop = activeLocationFilter === 'all' || job.location === activeLocationFilter;
    
    const searchString = state.searchQuery || '';
    if (!searchString) return matchCategory && locMatchDrop;
    
    // check text match
    const titleObj = job.title;
    const titleText = (titleObj.hi || '') + ' ' + (titleObj.en || '') + ' ' + (typeof titleObj === 'string' ? titleObj : '');
    const titleMatch = titleText.toLowerCase().includes(searchString);
    const descMatch = job.desc.toLowerCase().includes(searchString);
    const locMatch = job.location.toLowerCase().includes(searchString);
    
    return matchCategory && locMatchDrop && (titleMatch || descMatch || locMatch);
  });

  if (filteredJobs.length === 0) {
    const emptyMsg = state.lang === 'hi' ? 'इस श्रेणी में कोई काम नहीं मिला।' : 'या श्रेणीत कोणतेही काम आढळले नाही.';
    jobListContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-light);">${emptyMsg}</p>`;
    return;
  }

  filteredJobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';
    const jobTitle = state.lang === 'hi' ? job.title.hi : job.title.mr;
    const adminLabel = state.lang === 'hi' ? '(एडमिन)' : '(अॅडमिन)';
    
    card.innerHTML = `
      <div class="job-header">
        <div>
          <div class="job-title">${jobTitle}</div>
          <div class="job-meta">
            <i class="ri-map-pin-2-fill"></i> ${job.location}
          </div>
          <div class="job-meta" style="color: var(--primary-dark); font-weight: 700; margin-top: 6px;">
            <i class="ri-phone-fill"></i> +91 ${ADMIN_PHONE} ${adminLabel}
          </div>
        </div>
        <div class="job-wage">${job.wage}</div>
      </div>
      
      <p style="font-size: 14px; color: var(--text-dark); margin-top: 8px;">${job.desc}</p>
      <button class="audio-btn-small" onclick="synthesizeSpeech('${job.desc}')">
        <i class="ri-volume-up-fill"></i>
      </button>

      <div class="job-actions">
        <a href="tel:${ADMIN_PHONE}" class="call-btn"><i class="ri-phone-fill"></i>  कॉल करें</a>
        <a href="https://wa.me/91${ADMIN_PHONE}?text=Hi Admin, I am interested in Job #${job.id} - ${jobTitle}" class="wa-btn" target="_blank">
          <i class="ri-whatsapp-fill"></i> WhatsApp
        </a>
        <button class="btn-outline" style="color:var(--danger); border-color:var(--danger); padding:8px 12px; font-size:13px; margin-top:8px; width:100%; border-radius:8px;" onclick="reportAndBlockJob(${job.id})">
          <i class="ri-error-warning-fill"></i> ${state.lang === 'hi' ? 'रिपोर्ट और ब्लॉक करें' : 'रिपोर्ट आणि ब्लॉक करा'}
        </button>
      </div>
    `;
    jobListContainer.appendChild(card);
  });
}

async function reportAndBlockJob(id) {
  const comment = prompt(state.lang === 'hi' ? "रिपोर्ट करने का कारण (कमेंट) दर्ज करें:" : "Report reason:");
  if (comment === null) return; // User canceled
  
  try {
     await fetch(`/api/jobs/${id}/report`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ comment: comment || "No comment provided" })
     });
     await fetch('/api/block', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ user_phone: state.userPhone, job_id: id })
     });
     showToast(state.lang === 'hi' ? 'काम को ब्लॉक और रिपोर्ट कर दिया गया है।' : 'Job reported & blocked.');
     renderJobs(); 
  } catch (e) {
     console.error(e);
     showToast('Network error.');
  }
}

// ------------------------------
// Voice Search & Job Posting Logic
// ------------------------------
function extractCategory(text) {
  const lower = text.toLowerCase();
  const khetiMatches = ["khet", "kheti", "fasal", "kisan", "gehun", "farm", "tractor", "खेत", "खेती", "फसल", "किसान", "गेहूं", "शेत", "ट्रैक्टर", "कापणी", "नांगरणी", "पेरणी"];
  const mistriMatches = ["mistri", "cement", "diwar", "makaan", "ghar", "construction", "gawandi", "paint", "मिस्त्री", "सीमेंट", "दीवार", "मकान", "घर", "गवंडी", "रंग", "बांधकाम"];
  
  if (khetiMatches.some(k => lower.includes(k))) return 'kheti';
  if (mistriMatches.some(m => lower.includes(m))) return 'mistri';
  return 'majdoori';
}

function handleVoiceRecording(btnElement, textOutputElement, langCode, isPostJob) {
  if (!recognition) {
    showToast("Voice feature not supported in this browser.");
    return;
  }

  recognition.lang = langCode;
  
  recognition.onstart = function() {
    btnElement.classList.add('listening');
    if (textOutputElement) textOutputElement.classList.remove('hidden');
    if (textOutputElement) textOutputElement.textContent = "Listening...";
  };

  recognition.onspeechend = function() {
    recognition.stop();
    btnElement.classList.remove('listening');
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    btnElement.classList.remove('listening');
    
    if (textOutputElement) {
      textOutputElement.textContent = `🎤 "${transcript}"`;
    }

    if (isPostJob) {
      // Feed it into the textarea instead of static text
      const textArea = document.getElementById('text-post-job');
      textArea.value = transcript;
      textArea.dispatchEvent(new Event('input')); // trigger auto category
    } else {
      showToast("Searching for: " + transcript);
      const searchBox = document.getElementById('text-search-work');
      searchBox.value = transcript;
      searchBox.dispatchEvent(new Event('input')); // trigger filter
    }
  };

  recognition.onerror = function(event) {
    btnElement.classList.remove('listening');
    showToast("Error occurred in recognition: " + event.error);
  };

  try {
    recognition.start();
  } catch (e) {
    console.warn("Recognition already started");
  }
}

// Attach bindings for Home Voice Search
document.getElementById('voice-search-btn').addEventListener('click', function() {
  const fb = document.getElementById('voice-feedback');
  const langCode = state.lang === 'hi' ? 'hi-IN' : 'mr-IN';
  handleVoiceRecording(this, fb, langCode, false);
});

// Attach bindings for Post Job
document.getElementById('record-job-btn').addEventListener('click', function() {
  const langCode = state.lang === 'hi' ? 'hi-IN' : 'mr-IN';
  handleVoiceRecording(this, null, langCode, true);
});

// Setup Confirm Post
document.getElementById('confirm-post-btn').addEventListener('click', () => {
    const text = document.getElementById('text-post-job').value.trim();
    if (!text) {
      showToast("Please provide job details first.");
      return;
    }

    const autoCatEl = document.getElementById('auto-category-text');
    const selectedCategory = autoCatEl && autoCatEl.dataset.detected ? autoCatEl.dataset.detected : 'majdoori';
    
    // Try to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finalizePostJob(text, selectedCategory, pos.coords.latitude, pos.coords.longitude),
        (err) => {
          showToast("Location access denied. Using default map center.");
          finalizePostJob(text, selectedCategory, 19.0760, 72.8777); // fallback
        }
      );
    } else {
      finalizePostJob(text, selectedCategory, 19.0760, 72.8777);
    }
});

async function finalizePostJob(text, selectedCategory, lat, lng) {
    const newJob = {
        id: Date.now(),
        title: { hi: "नया काम", en: "New Job" },
        desc: text,
        wage: "बातचीत करें (Discuss)",
        location: "Live Location",
        lat: lat,
        lng: lng,
        phone: state.userPhone || "Not Provided",
        category: selectedCategory
    };
    
    try {
        await fetch('/api/jobs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newJob)
        });
        showToast("Job Posted Successfully!");
        document.getElementById('text-post-job').value = '';
        document.getElementById('post-result-card').classList.add('hidden');
        navItems[0].click();
        renderJobs();
    } catch (e) {
        console.error(e);
        showToast("Server Error");
    }
}

// Map Logic
let appMap = null;
let mapMarkers = [];

function initOrUpdateMap() {
  if (typeof L === 'undefined') return; // Leaflet not loaded
  
  if (!appMap) {
    appMap = L.map('map-container').setView([19.0760, 72.8777], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(appMap);
  }

  // Clear existing markers
  mapMarkers.forEach(m => appMap.removeLayer(m));
  mapMarkers = [];

  // Custom Icons
  const jobIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#ef4444; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'><i class='ri-briefcase-4-fill'></i></div>", iconSize: [28, 28], iconAnchor: [14, 14] });
  const labourIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background-color:#22c55e; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'><i class='ri-user-smile-fill'></i></div>", iconSize: [28, 28], iconAnchor: [14, 14] });

  // Add Job Markers (Red)
  JOB_DATA.forEach(job => {
    if (job.lat && job.lng) {
      const marker = L.marker([job.lat, job.lng], { icon: jobIcon }).addTo(appMap);
      const title = state.lang === 'hi' ? (job.title.hi || job.title) : (job.title.mr || job.title);
      marker.bindPopup(`<b>💼 Job:</b> ${title}<br><b>Wage:</b> ${job.wage}<br><a href="tel:${ADMIN_PHONE}" style="color:var(--primary); font-weight:bold; margin-top:5px; display:block;">Call Admin</a>`);
      mapMarkers.push(marker);
    }
  });

  // Add Labour Markers (Green)
  DEFAULT_LABOURERS.forEach(labour => {
    const marker = L.marker([labour.lat, labour.lng], { icon: labourIcon }).addTo(appMap);
    marker.bindPopup(`<b>🧑‍🌾 Available:</b><br>${labour.name}`);
    mapMarkers.push(marker);
  });
  
  // Refresh size (Fixes gray unrendered tiles on dynamic tab switch)
  setTimeout(() => { appMap.invalidateSize(); }, 300);
}

// ------------------------------
// Text-to-Speech Helper
// ------------------------------
function synthesizeSpeech(text) {
  if (!('speechSynthesis' in window)) {
    showToast('Text-to-speech not supported.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.lang === 'hi' ? 'hi-IN' : 'mr-IN';
  window.speechSynthesis.speak(utterance);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

// ------------------------------
// Login & Auth Logic
// ------------------------------
const loginContainer = document.getElementById('login-container');
const mainAppContainer = document.getElementById('main-app-container');
const loginTitle = document.getElementById('login-title');
const loginSub = document.getElementById('login-sub');

// Update Login UI based on Lang
function updateLoginStrings() {
  if (state.lang === 'hi') {
    loginTitle.textContent = "लाग इन (Login)";
    loginSub.textContent = "अपना मोबाइल नंबर और नाम दर्ज करें";
    document.getElementById('simple-login-btn').textContent = "लॉगिन करें (Enter)";
  } else {
    loginTitle.textContent = "लॉग इन (Login)";
    loginSub.textContent = "तुमचा मोबाईल नंबर आणि नाव टाका";
    document.getElementById('simple-login-btn').textContent = "लॉगिन करा (Enter)";
  }
}

langToggle.addEventListener('click', updateLoginStrings);

document.getElementById('simple-login-btn').addEventListener('click', async () => {
    const phone = document.getElementById('mobile-input').value;
    const name = document.getElementById('name-input').value || 'User';
    const role = document.getElementById('role-input').value;
    
    if (phone.length !== 10) {
        showToast(state.lang === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter 10 digit number');
        return;
    }
    
    state.userPhone = phone;
    localStorage.setItem('userPhone', phone);
    
    // Save generic profile
    const profile = {
        role: role,
        name: name,
        skill: role === 'worker' ? 'मज़दूर' : 'None',
        business: role === 'employer' ? 'Company' : 'None',
        location: 'City/Village',
        exp: '0',
        phone: phone
    };
    
    try {
        await fetch('/api/profile', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(profile)
        });
    } catch(e) {
        console.error("Backend offline, utilizing local storage fallback.");
    }
    
    localStorage.setItem('user_profile', JSON.stringify(profile));
    
    loginContainer.classList.add('hidden');
    mainAppContainer.classList.remove('hidden');
    showToast('लॉगिन सफल (Login Success)');
    renderProfilePage();
    renderJobs();
});


// Init Login Strings
updateLoginStrings();

// Search Box Logic
document.getElementById('text-search-work').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.toLowerCase();
  renderJobs();
});

// Post Text Area Logic
document.getElementById('text-post-job').addEventListener('input', (e) => {
  const text = e.target.value.trim();
  const resultCard = document.getElementById('post-result-card');
  const autoCatEl = document.getElementById('auto-category-text');
  
  if (text.length > 0) {
    resultCard.classList.remove('hidden');
    const cat = extractCategory(text);
    const catNames = { kheti: "खेती (Farming)", mistri: "मिस्त्री (Construction)", majdoori: "मज़दूरी (Labour)" };
    autoCatEl.textContent = `✓ Auto-Detected: ${catNames[cat]}`;
    autoCatEl.dataset.detected = cat;
  } else {
    resultCard.classList.add('hidden');
  }
});

function renderProfilePage() {
  const profileStr = localStorage.getItem('user_profile');
  if (!profileStr) return;
  const p = JSON.parse(profileStr);
  
  if (document.getElementById('prof-name')) document.getElementById('prof-name').textContent = p.name;
  
  if (p.role === 'worker') {
    if (document.getElementById('prof-role')) document.getElementById('prof-role').textContent = 'Skill: ' + p.skill;
    if (document.getElementById('stat1-val')) {
      document.getElementById('stat1-val').textContent = p.exp;
      document.getElementById('stat1-label').textContent = 'Experience';
    }
  } else {
    if (document.getElementById('prof-role')) document.getElementById('prof-role').textContent = 'Business: ' + p.business;
    if (document.getElementById('stat1-val')) {
      document.getElementById('stat1-val').textContent = "Owner";
      document.getElementById('stat1-label').textContent = 'Business type';
    }
  }
  
  if (document.getElementById('prof-loc')) document.getElementById('prof-loc').innerHTML = `<i class="ri-map-pin-line"></i> ${p.location}`;
  if (document.getElementById('stat2-val')) document.getElementById('stat2-val').textContent = '+91 ' + p.phone;
}

// Check session / focus on load
if (state.userPhone && localStorage.getItem('user_profile')) {
  loginContainer.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');
  renderProfilePage();
} else {
  const mobileInput = document.getElementById('mobile-input');
  if(mobileInput) mobileInput.focus();
}

// Init Application
updateLanguageUI();
renderJobs();
