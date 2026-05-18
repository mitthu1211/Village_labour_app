// Supabase Initialization
const SUPABASE_URL = 'https://uqqqktkvqqhplgaugezm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcXFrdGt2cXFocGxnYXVnZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDQ0ODAsImV4cCI6MjA5NDE4MDQ4MH0.ulYw-8Jiy-8hKz3U16sl_auDRURNNz-Pku2zEiKAEAE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mock Data for Jobs (Fallback)
const DEFAULT_JOBS = [
  {
    id: "1",
    title: { hi: "खेत की कटाई", mr: "शेत कापणी" },
    desc: "कल 3 मज़दूर चाहिए गेहूं काटने के लिए।",
    wage: "₹400 / दिन",
    location: "2 किमी दूर - रामु का खेत",
    lat: 19.0760,
    lng: 72.8777,
    phone: "9876543210",
    category: "kheti"
  }
];

const DEFAULT_LABOURERS = [
  { id: 101, name: "Suresh (Kheti)", lat: 19.0740, lng: 72.8790, category: "kheti" },
  { id: 102, name: "Ramesh (Mistri)", lat: 19.0810, lng: 72.8750, category: "mistri" }
];

let JOB_DATA = [];

async function loadJobs() {
  try {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      JOB_DATA = data;
    } else {
      JOB_DATA = DEFAULT_JOBS;
    }
  } catch (err) {
    console.error("Failed to load jobs from Supabase", err);
    JOB_DATA = DEFAULT_JOBS; // fallback
  }
  renderJobs();
}

async function saveJobToDB(job) {
  try {
    const { data, error } = await supabase.from('jobs').insert([job]).select();
    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Failed to save job to Supabase", err);
    return null;
  }
}

// Admin Contact configuration
const ADMIN_PHONE = "0000000000"; // All calls will be routed through this number

// Users Database & Auth Service (Supabase)
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AuthService = {
  getCurrentUser: function() {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },
  
  setCurrentUser: function(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    state.currentUser = user;
  },
  
  login: async function(mobile, password) {
    const hashed = await hashPassword(password);
    
    // Try hashed password first
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', String(mobile).trim())
      .eq('password', hashed)
      .single();
      
    // Fallback to plain text for backward compatibility
    if (error || !data) {
      const res = await supabase
        .from('users')
        .select('*')
        .eq('mobile', String(mobile).trim())
        .eq('password', String(password))
        .single();
      data = res.data;
      error = res.error;
    }
      
    if (error || !data) {
      return null;
    }
    return data;
  },

  loginWithOtp: async function(mobile) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', String(mobile).trim())
      .single();
    if (error || !data) {
      return null;
    }
    return data;
  },
  
  signup: async function(userData) {
    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('mobile')
      .eq('mobile', String(userData.mobile).trim())
      .single();
      
    if (existing) {
      throw new Error('Number already registered');
    }
    
    userData.password = await hashPassword(userData.password);
    
    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error('Failed to create account');
    }
    return data;
  },

  updatePassword: async function(mobile, newPassword) {
    const hashed = await hashPassword(newPassword);
    const { error } = await supabase
      .from('users')
      .update({ password: hashed })
      .eq('mobile', String(mobile).trim());
    if (error) throw error;
  },
  
  logout: function() {
    this.setCurrentUser(null);
  }
};

// App State
const state = {
  lang: 'hi', // 'hi' = Hindi, 'mr' = Marathi
  currentUser: AuthService.getCurrentUser(),
  activeCategory: 'all',
  searchQuery: ''
};

// UI Text Dictionary
const i18n = {
  hi: {
    findWork: 'काम ढूंढें',
    mapVal: 'नक्शा',
    postJob: 'काम दें',
    profile: 'प्रोफाइल',
    greetTitle: 'आज का काम खोजें',
    greetSub: 'Voice-search कीजिये या नीचे scroll कीजिये।',
    voiceSearchText: 'बोलकर काम ढूंढें',
    postTitle: 'काम पोस्ट करें',
    postSub: 'अपनी ज़रुरत बोलकर बताएं (जैसे: "मुझे कल खेती के लिए 2 लोग चाहिए")',
    recordStatus: 'बोलने के लिए दबाएं',
    mapTitle: 'लाइव काम और मज़दूर (Live Map)',
  },
  mr: {
    findWork: 'काम शोधा',
    mapVal: 'नकाशा',
    postJob: 'काम द्या',
    profile: 'प्रोफाइल',
    greetTitle: 'आजचे काम शोधा',
    greetSub: 'Voice-search करा किंवा खाली scroll करा.',
    voiceSearchText: 'बोलून काम शोधा',
    postTitle: 'काम पोस्ट करा',
    postSub: 'तुमची गरज बोलून सांगा (उदा: "मला उद्या शेतीसाठी 2 लोक पाहिजेत")',
    recordStatus: 'बोलण्यासाठी दाबा',
    mapTitle: 'थेट काम आणि कामगार (Live Map)',
  }
};

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
// ------------------------------
const filterChips = document.querySelectorAll('.filter-chip');
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeCategory = chip.getAttribute('data-category');
    renderJobs();
  });
});

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
langToggle.addEventListener('click', () => {
  state.lang = state.lang === 'hi' ? 'mr' : 'hi';
  updateLanguageUI();
});

function updateLanguageUI() {
  const dict = i18n[state.lang];
  
  // Header Button
  langToggle.querySelector('span:nth-child(2)').textContent = state.lang === 'hi' ? 'हिन्दी' : 'मराठी';
  
  // Bottom Nav
  document.getElementById('nav-find-work').textContent = dict.findWork;
  if(document.getElementById('nav-map')) document.getElementById('nav-map').textContent = dict.mapVal;
  document.getElementById('nav-post-job').textContent = dict.postJob;
  document.getElementById('nav-profile').textContent = dict.profile;
  
  // Map Title
  if(document.getElementById('map-title-text')) document.getElementById('map-title-text').textContent = dict.mapTitle;
  
  // Home
  document.getElementById('greet-text').textContent = dict.greetTitle;
  document.getElementById('greet-sub').textContent = dict.greetSub;
  document.getElementById('voice-search-text').textContent = dict.voiceSearchText;
  
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
function renderJobs() {
  JOB_DATA = loadJobs(); // Refresh latest if changed elsewhere
  jobListContainer.innerHTML = '';
  
  const filteredJobs = JOB_DATA.filter(job => {
    const matchCategory = state.activeCategory === 'all' || job.category === state.activeCategory;
    const searchString = state.searchQuery || '';
    if (!searchString) return matchCategory;
    
    // check text match
    const titleObj = job.title;
    const titleText = (titleObj.hi || '') + ' ' + (titleObj.mr || '') + ' ' + (typeof titleObj === 'string' ? titleObj : '');
    const titleMatch = titleText.toLowerCase().includes(searchString);
    const descMatch = job.desc.toLowerCase().includes(searchString);
    const locMatch = job.location.toLowerCase().includes(searchString);
    
    return matchCategory && (titleMatch || descMatch || locMatch);
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
      </div>
    `;
    jobListContainer.appendChild(card);
  });
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
const homeVoiceBtn = document.getElementById('voice-search-btn');
if (homeVoiceBtn) {
  homeVoiceBtn.addEventListener('click', function() {
    const fb = document.getElementById('voice-feedback');
    const langCode = state.lang === 'hi' ? 'hi-IN' : 'mr-IN';
    handleVoiceRecording(this, fb, langCode, false);
  });
}

// Attach bindings for FAB Voice
const fabVoiceBtn = document.getElementById('fab-voice-btn');
if (fabVoiceBtn) {
  fabVoiceBtn.addEventListener('click', function() {
    const fb = document.getElementById('voice-feedback');
    const langCode = state.lang === 'hi' ? 'hi-IN' : 'mr-IN';
    // Switch to home tab if not already there, since search is there
    navItems[0].click(); 
    handleVoiceRecording(this, fb, langCode, false);
  });
}

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
    document.getElementById('post-result-card').classList.add('hidden');
    // switch to home tab
    navItems[0].click();
    renderJobs();
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

// View Toggle
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
document.getElementById('show-signup-link').addEventListener('click', (e) => { e.preventDefault(); loginView.classList.add('hidden'); signupView.classList.remove('hidden'); });
document.getElementById('show-login-link').addEventListener('click', (e) => { e.preventDefault(); signupView.classList.add('hidden'); loginView.classList.remove('hidden'); });

// Login Elements
const loginMobile = document.getElementById('login-mobile');
const loginPassword = document.getElementById('login-password');
const forgotPwdLink = document.getElementById('forgot-password-link');
const passwordGroup = document.getElementById('password-group');
const togglePasswordLoginBtn = document.getElementById('toggle-password-login-btn');
const requestOtpBtn = document.getElementById('request-otp-btn');
const otpLoginView = document.getElementById('otp-login-view');
const otpDisplayMobile = document.getElementById('otp-display-mobile');
const verifyLoginOtpBtn = document.getElementById('verify-login-otp-btn');
const loginOtpInputs = document.querySelectorAll('.login-otp-input');
const backToLoginFromOtp = document.getElementById('back-to-login-from-otp');
const guestLoginLink = document.getElementById('guest-login-link');

// Signup Elements
const signupName = document.getElementById('signup-name');
const signupMobile = document.getElementById('signup-mobile');
const signupPassword = document.getElementById('signup-password');
const signupRole = document.getElementById('signup-role');
const signupVillage = document.getElementById('signup-village');
const signupDistrict = document.getElementById('signup-district');
const signupState = document.getElementById('signup-state');
const signupSkills = document.getElementById('signup-skills');
const signupBtn = document.getElementById('signup-btn');
const signupConfirmPassword = document.getElementById('signup-confirm-password');

// Forgot Password Elements
const forgotPwdView = document.getElementById('forgot-pwd-view');
const forgotMobile = document.getElementById('forgot-mobile');
const forgotSendOtpBtn = document.getElementById('forgot-send-otp-btn');
const forgotStep1 = document.getElementById('forgot-step-1');
const forgotStep2 = document.getElementById('forgot-step-2');
const forgotOtp = document.getElementById('forgot-otp');
const forgotVerifyOtpBtn = document.getElementById('forgot-verify-otp-btn');
const forgotStep3 = document.getElementById('forgot-step-3');
const forgotNewPassword = document.getElementById('forgot-new-password');
const forgotConfirmPassword = document.getElementById('forgot-confirm-password');
const forgotResetBtn = document.getElementById('forgot-reset-btn');
const backToLoginLink = document.getElementById('back-to-login-link');
const otpSentMsg = document.getElementById('otp-sent-msg');

let generatedOTP = null;
let forgotMobileNum = null;

forgotPwdLink.addEventListener('click', (e) => { 
  e.preventDefault(); 
  loginView.classList.add('hidden');
  forgotPwdView.classList.remove('hidden');
  forgotStep1.classList.remove('hidden');
  forgotStep2.classList.add('hidden');
  forgotStep3.classList.add('hidden');
  forgotMobile.value = '';
});

backToLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotPwdView.classList.add('hidden');
  loginView.classList.remove('hidden');
});

forgotSendOtpBtn.addEventListener('click', async () => {
  const mob = forgotMobile.value;
  if (mob.length !== 10) {
    showToast('कृपया सही 10-अंकों का नंबर दर्ज करें');
    return;
  }

  forgotSendOtpBtn.disabled = true;
  forgotSendOtpBtn.textContent = 'Checking...';
  const { data, error } = await supabase.from('users').select('id').eq('mobile', mob).single();
  forgotSendOtpBtn.disabled = false;
  forgotSendOtpBtn.textContent = 'OTP भेजें (Send OTP)';

  if (error || !data) {
    showToast('यह नंबर रजिस्टर नहीं है (Number not registered)');
    return;
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  forgotMobileNum = mob;
  
  console.log(`[DEMO MODE] Your OTP is: ${generatedOTP}`);
  
  forgotStep1.classList.add('hidden');
  forgotStep2.classList.remove('hidden');
  otpSentMsg.textContent = `OTP ${mob} पर भेजा गया है | (Demo: ${generatedOTP})`;
  showToast('OTP भेजा गया (OTP Sent)');
});

forgotVerifyOtpBtn.addEventListener('click', () => {
  const entered = forgotOtp.value;
  if (entered !== generatedOTP) {
    showToast('अमान्य OTP (Invalid OTP)');
    return;
  }
  
  forgotStep2.classList.add('hidden');
  forgotStep3.classList.remove('hidden');
  showToast('OTP सत्यापित (OTP Verified)');
});

forgotResetBtn.addEventListener('click', async () => {
  const npwd = forgotNewPassword.value;
  const cpwd = forgotConfirmPassword.value;
  
  if (npwd.length < 6) {
    showToast('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए');
    return;
  }
  if (npwd !== cpwd) {
    showToast('पासवर्ड मेल नहीं खाते (Passwords mismatch)');
    return;
  }

  forgotResetBtn.disabled = true;
  forgotResetBtn.textContent = 'Updating...';

  try {
    await AuthService.updatePassword(forgotMobileNum, npwd);
    showToast('पासवर्ड सफलतापूर्वक बदल दिया गया (Password Reset Successful)');
    forgotPwdView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginMobile.value = forgotMobileNum;
    loginPassword.value = '';
  } catch (e) {
    showToast('Error resetting password');
  } finally {
    forgotResetBtn.disabled = false;
    forgotResetBtn.textContent = 'पासवर्ड बदलें (Reset Password)';
  }
});

// Auth Functions
function updateProfileUI() {
  if (!state.currentUser) return;
  const u = state.currentUser;
  
  const nameEl = document.getElementById('profile-user-name');
  const roleEl = document.getElementById('profile-role');
  const locationEl = document.getElementById('profile-location');
  const ratingEl = document.getElementById('profile-rating');
  
  if (nameEl) nameEl.textContent = u.name;
  if (roleEl) roleEl.textContent = u.role === 'worker' ? 'मज़दूर (Worker)' : 'किसान/मालिक (Employer)';
  if (locationEl) locationEl.textContent = `${u.village || 'Unknown'}, ${u.district || 'Location'}`;
  if (ratingEl) ratingEl.innerHTML = '<i class="ri-star-fill"></i> New User (0 Kaam)';
}

function handleLoginSuccess(user) {
  AuthService.setCurrentUser(user);
  updateProfileUI();
  loginContainer.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');
  showToast('लॉगिन सफल (Login Success)');
  renderJobs();
}

let isPasswordLogin = false;
let loginGeneratedOTP = null;
let loginMobileNum = null;

if (togglePasswordLoginBtn) {
  togglePasswordLoginBtn.addEventListener('click', () => {
    isPasswordLogin = !isPasswordLogin;
    if (isPasswordLogin) {
      passwordGroup.style.display = 'flex';
      requestOtpBtn.textContent = 'Login';
      togglePasswordLoginBtn.innerHTML = '<i class="ri-message-3-line"></i> Login with OTP';
    } else {
      passwordGroup.style.display = 'none';
      requestOtpBtn.textContent = 'Send OTP';
      togglePasswordLoginBtn.innerHTML = '<i class="ri-lock-password-line"></i> Login with Password';
    }
  });
}

if (requestOtpBtn) {
  requestOtpBtn.addEventListener('click', async () => {
    const mob = loginMobile.value;
    if (mob.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    if (isPasswordLogin) {
      const pwd = loginPassword.value;
      if (!pwd) {
        showToast('Please enter your password');
        return;
      }
      const originalText = requestOtpBtn.textContent;
      requestOtpBtn.textContent = 'Logging in...';
      requestOtpBtn.disabled = true;
      
      try {
        const user = await AuthService.login(mob, pwd);
        if (user) {
          handleLoginSuccess(user);
        } else {
          showToast('Invalid mobile number or password');
        }
      } catch (err) {
        console.error("Login Error:", err);
        showToast('Login failed. Please try again.');
      } finally {
        requestOtpBtn.textContent = originalText;
        requestOtpBtn.disabled = false;
      }
      return;
    }

    // OTP Flow
    const originalText = requestOtpBtn.textContent;
    requestOtpBtn.textContent = 'Sending OTP...';
    requestOtpBtn.disabled = true;

    try {
      const user = await AuthService.loginWithOtp(mob);
      if (!user) {
        showToast('Account not found. Please register.');
        return;
      }
      loginGeneratedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      loginMobileNum = mob;
      
      console.log(`[DEMO MODE] Your Login OTP is: ${loginGeneratedOTP}`);
      
      loginView.classList.add('hidden');
      otpLoginView.classList.remove('hidden');
      otpDisplayMobile.textContent = '+91 ' + mob;
      
      if(loginOtpInputs.length > 0) loginOtpInputs[0].focus();
      
      showToast(`OTP Sent (Demo: ${loginGeneratedOTP})`);
    } catch (err) {
      showToast('Failed to send OTP');
    } finally {
      requestOtpBtn.textContent = originalText;
      requestOtpBtn.disabled = false;
    }
  });
}

// OTP Input Logic
loginOtpInputs.forEach((input, index) => {
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
      loginOtpInputs[index - 1].focus();
    } else if (input.value.length === 1 && index < loginOtpInputs.length - 1) {
      loginOtpInputs[index + 1].focus();
    }
  });
});

if (verifyLoginOtpBtn) {
  verifyLoginOtpBtn.addEventListener('click', async () => {
    const entered = Array.from(loginOtpInputs).map(i => i.value).join('');
    if (entered !== loginGeneratedOTP) {
      showToast('Invalid OTP');
      return;
    }
    
    verifyLoginOtpBtn.disabled = true;
    verifyLoginOtpBtn.textContent = 'Verifying...';
    
    try {
      const user = await AuthService.loginWithOtp(loginMobileNum);
      if (user) {
        handleLoginSuccess(user);
      }
    } catch (err) {
      showToast('Error during login');
    } finally {
      verifyLoginOtpBtn.disabled = false;
      verifyLoginOtpBtn.textContent = 'Verify OTP';
    }
  });
}

if (backToLoginFromOtp) {
  backToLoginFromOtp.addEventListener('click', (e) => {
    e.preventDefault();
    otpLoginView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginOtpInputs.forEach(i => i.value = '');
  });
}

if (guestLoginLink) {
  guestLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleLoginSuccess({ name: 'Guest User', mobile: '0000000000', role: 'worker', village: 'Demo Village', district: 'Demo District' });
  });
}

signupBtn.addEventListener('click', async () => {
  const name = signupName.value.trim();
  const mob = signupMobile.value;
  const pwd = signupPassword.value;
  const confirmPwd = signupConfirmPassword ? signupConfirmPassword.value : pwd;
  const role = signupRole.value;
  
  if (!name || !mob || !pwd || !confirmPwd || !role) {
    showToast('कृपया सभी ज़रूरी जानकारी भरें (Fill all required fields)');
    return;
  }

  if (mob.length !== 10) {
    showToast('अमान्य मोबाइल नंबर (Invalid mobile number)');
    return;
  }

  if (pwd.length < 6) {
    showToast('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password min 6 chars)');
    return;
  }

  if (pwd !== confirmPwd) {
    showToast('पासवर्ड मेल नहीं खाते (Passwords do not match)');
    return;
  }
  
  const newUser = {
    name, mobile: mob, password: pwd, role,
    village: signupVillage.value.trim(),
    district: signupDistrict.value.trim(),
    state: signupState.value.trim(),
    skills: signupSkills.value.trim()
  };

  const originalText = signupBtn.textContent;
  signupBtn.textContent = 'कृपया प्रतीक्षा करें... (Please wait...)';
  signupBtn.disabled = true;

  try {
    const createdUser = await AuthService.signup(newUser);
    showToast('पंजीकरण सफल! (Registration Successful)');
    
    // Redirect to login page per requirements
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginMobile.value = mob;
    loginPassword.value = '';
    
  } catch (err) {
    if (err.message === 'Number already registered') {
      showToast('यह नंबर पहले से रजिस्टर है (Mobile already registered)');
    } else {
      console.error("Signup error:", err);
      showToast('Registration failed. Please try again.');
    }
  } finally {
    signupBtn.textContent = originalText;
    signupBtn.disabled = false;
  }
});

// Logout Logic
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    AuthService.logout();
    mainAppContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    loginMobile.value = '';
    loginPassword.value = '';
    showToast('लॉगआउट सफल (Logged out)');
  });
}

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

// Check session on load
if (state.currentUser) {
  updateProfileUI();
  loginContainer.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');
} else {
  if(loginMobile) loginMobile.focus();
}

// Side Menu Logic
const menuBtn = document.getElementById('menu-btn');
const sideMenuOverlay = document.getElementById('side-menu-overlay');

if (menuBtn && sideMenuOverlay) {
  menuBtn.addEventListener('click', () => {
    sideMenuOverlay.classList.add('active');
  });
  
  sideMenuOverlay.addEventListener('click', (e) => {
    // Close if clicking outside the menu panel
    if (e.target === sideMenuOverlay) {
      sideMenuOverlay.classList.remove('active');
    }
  });

  // Link clicks should close menu and navigate
  const menuLinks = sideMenuOverlay.querySelectorAll('.side-menu-links a');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sideMenuOverlay.classList.remove('active');
      const id = link.id;
      if (id === 'menu-home') navItems[0].click();
      if (id === 'menu-jobs') navItems[1].click();
      if (id === 'menu-profile') navItems[3].click();
      if (id === 'menu-chat') navItems[4].click();
    });
  });
}

// Init Application
updateLanguageUI();
renderJobs();
