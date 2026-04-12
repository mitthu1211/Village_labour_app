// Mock Data for Jobs
const DEFAULT_JOBS = [
  {
    id: 1,
    title: { hi: "खेत की कटाई", mr: "शेत कापणी" },
    desc: "कल 3 मज़दूर चाहिए गेहूं काटने के लिए।",
    wage: "₹400 / दिन",
    location: "2 किमी दूर - रामु का खेत",
    phone: "9876543210"
  },
  {
    id: 2,
    title: { hi: "राजमिस्त्री का काम", mr: "गवंडी काम" },
    desc: "दीवार बनाने के लिए 1 मिस्त्री और 2 हेल्पर चाहिए।",
    wage: "₹600 / दिन",
    location: "4 किमी दूर - सरपंच घर",
    phone: "9876543211"
  },
  {
    id: 3,
    title: { hi: "खेत की जुताई", mr: "नांगरणी" },
    desc: "ट्रैक्टर के साथ जुताई का काम है।",
    wage: "₹500 / दिन",
    location: "1 किमी दूर - शिवम् का खेत",
    phone: "9876543212"
  }
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

// App State
const state = {
  lang: 'hi', // 'hi' = Hindi, 'mr' = Marathi
  userPhone: localStorage.getItem('userPhone') || null
};

// UI Text Dictionary
const i18n = {
  hi: {
    findWork: 'काम ढूंढें',
    postJob: 'काम दें',
    profile: 'प्रोफाइल',
    greetTitle: 'आज का काम खोजें',
    greetSub: 'Voice-search कीजिये या नीचे scroll कीजिये।',
    voiceSearchText: 'बोलकर काम ढूंढें',
    postTitle: 'काम पोस्ट करें',
    postSub: 'अपनी ज़रुरत बोलकर बताएं (जैसे: "मुझे कल खेती के लिए 2 लोग चाहिए")',
    recordStatus: 'बोलने के लिए दबाएं',
  },
  mr: {
    findWork: 'काम शोधा',
    postJob: 'काम द्या',
    profile: 'प्रोफाइल',
    greetTitle: 'आजचे काम शोधा',
    greetSub: 'Voice-search करा किंवा खाली scroll करा.',
    voiceSearchText: 'बोलून काम शोधा',
    postTitle: 'काम पोस्ट करा',
    postSub: 'तुमची गरज बोलून सांगा (उदा: "मला उद्या शेतीसाठी 2 लोक पाहिजेत")',
    recordStatus: 'बोलण्यासाठी दाबा',
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
  document.getElementById('nav-post-job').textContent = dict.postJob;
  document.getElementById('nav-profile').textContent = dict.profile;
  
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
  JOB_DATA.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';
    const jobTitle = state.lang === 'hi' ? job.title.hi : job.title.mr;
    
    card.innerHTML = `
      <div class="job-header">
        <div>
          <div class="job-title">${jobTitle}</div>
          <div class="job-meta">
            <i class="ri-map-pin-2-fill"></i> ${job.location}
          </div>
          <div class="job-meta" style="color: var(--primary-dark); font-weight: 700; margin-top: 6px;">
            <i class="ri-phone-fill"></i> +91 ${job.phone}
          </div>
        </div>
        <div class="job-wage">${job.wage}</div>
      </div>
      
      <p style="font-size: 14px; color: var(--text-dark); margin-top: 8px;">${job.desc}</p>
      <button class="audio-btn-small" onclick="synthesizeSpeech('${job.desc}')">
        <i class="ri-volume-up-fill"></i>
      </button>

      <div class="job-actions">
        <a href="tel:${job.phone}" class="call-btn"><i class="ri-phone-fill"></i>  कॉल करें</a>
        <a href="https://wa.me/91${job.phone}?text=Mujhe aapka kaam karna hai" class="wa-btn" target="_blank">
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
      textOutputElement.textContent = `Poocha gaya: "${transcript}"`;
    }

    if (isPostJob) {
      document.getElementById('post-result-card').classList.remove('hidden');
      document.getElementById('recorded-job-text').textContent = transcript;
    } else {
      showToast("Searching for: " + transcript);
      // Here you would normally filter the JOB_DATA
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
    const text = document.getElementById('recorded-job-text').textContent;
    showToast("Job Posted Successfully!");
    
    // Add to dummy list
    JOB_DATA.unshift({
        id: Date.now(),
        title: { hi: "नया काम", mr: "नवीन काम" },
        desc: text,
        wage: "बातचीत करें (Discuss)",
        location: "Current Location",
        phone: state.userPhone || "Not Provided"
    });
    
    saveJobs();
    
    document.getElementById('post-result-card').classList.add('hidden');
    // switch to home tab to show the new post
    navItems[0].click();
    renderJobs();
});

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
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const mobileInput = document.getElementById('mobile-input');
const otpInput = document.getElementById('otp-input');
const step1Phone = document.getElementById('step-1-phone');
const step2Otp = document.getElementById('step-2-otp');
const loginTitle = document.getElementById('login-title');
const loginSub = document.getElementById('login-sub');

// Update Login UI based on Lang
function updateLoginStrings() {
  if (state.lang === 'hi') {
    loginTitle.textContent = "लाग इन (Login)";
    loginSub.textContent = "अपना मोबाइल नंबर दर्ज करें";
    sendOtpBtn.textContent = "OTP भेजें";
    verifyOtpBtn.textContent = "लॉगिन करें";
    mobileInput.placeholder = "मोबाइल नंबर";
    otpInput.placeholder = "OTP दर्ज करें";
  } else {
    loginTitle.textContent = "लॉग इन (Login)";
    loginSub.textContent = "तुमचा मोबाईल नंबर टाका";
    sendOtpBtn.textContent = "OTP पाठवा";
    verifyOtpBtn.textContent = "लॉगिन करा";
    mobileInput.placeholder = "मोबाईल नंबर";
    otpInput.placeholder = "OTP टाका";
  }
}

langToggle.addEventListener('click', updateLoginStrings);

sendOtpBtn.addEventListener('click', () => {
  if (mobileInput.value.length === 10) {
    step1Phone.classList.add('hidden');
    step2Otp.classList.remove('hidden');
    showToast('OTP भेजा गया: 1234');
    
    // Switch title
    loginTitle.textContent = state.lang === 'hi' ? 'OTP दर्ज करें' : 'OTP टाका';
    loginSub.textContent = '+91 ' + mobileInput.value + ' पर OTP भेजा गया';
  } else {
    showToast(state.lang === 'hi' ? 'कृपया सही मोबाइल नंबर डालें' : 'कृपया योग्य मोबाईल नंबर टाका');
  }
});

verifyOtpBtn.addEventListener('click', () => {
  if (otpInput.value === '1234') {
    state.userPhone = mobileInput.value;
    localStorage.setItem('userPhone', state.userPhone);
    loginContainer.classList.add('hidden');
    mainAppContainer.classList.remove('hidden');
    showToast('लॉगिन सफल (Login Success)');
    renderJobs();
  } else {
    showToast(state.lang === 'hi' ? 'गलत OTP (Incorrect OTP)' : 'चुकीचा OTP');
  }
});

// Init Login Strings
updateLoginStrings();

// Check session / focus on load
if (state.userPhone) {
  loginContainer.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');
} else {
  if(mobileInput) mobileInput.focus();
}

// Init Application
updateLanguageUI();
renderJobs();
