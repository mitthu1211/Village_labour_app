// Elements
const loginOverlay = document.getElementById('admin-login-overlay');
const dashboard = document.getElementById('admin-dashboard');
const pwdInput = document.getElementById('admin-pwd');
const loginBtn = document.getElementById('admin-login-btn');
const errorMsg = document.getElementById('admin-error');
const logoutBtn = document.getElementById('admin-logout-btn');

const jobTableBody = document.getElementById('job-table-body');
const totalJobsCount = document.getElementById('total-jobs-count');

// Basic Authentication
loginBtn.addEventListener('click', () => {
  if (pwdInput.value === 'admin123') {
    loginOverlay.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadAndRenderJobs();
  } else {
    errorMsg.style.display = 'block';
  }
});

pwdInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', () => {
  dashboard.classList.add('hidden');
  loginOverlay.classList.remove('hidden');
  pwdInput.value = '';
});

// Load Jobs from LocalStorage
function getJobs() {
  const stored = localStorage.getItem('gaon_jobs');
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveJobs(jobs) {
  localStorage.setItem('gaon_jobs', JSON.stringify(jobs));
  loadAndRenderJobs(); // Refresh table view
}

// Render Table
function loadAndRenderJobs() {
  const jobs = getJobs();
  jobTableBody.innerHTML = '';
  totalJobsCount.textContent = jobs.length;

  if (jobs.length === 0) {
    jobTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">No Active Jobs found</td></tr>`;
    return;
  }

  jobs.forEach(job => {
    const title = job.title.hi || job.title; // Fallback in case of structure drift
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="color:#64748b; font-size:13px;">#${job.id}</td>
      <td>
        <strong>${title}</strong><br>
        <span style="color:#64748b; font-size:14px;">${job.desc}</span>
      </td>
      <td style="font-weight:600; color:#0f172a;">+91 ${job.phone}</td>
      <td>${job.wage}</td>
      <td>${job.location}</td>
      <td>
        <button class="btn-delete" onclick="deleteJob(${job.id})">
          <i class="ri-delete-bin-fill"></i> Remove
        </button>
      </td>
    `;
    jobTableBody.appendChild(row);
  });
}

// Delete Job via Admin
window.deleteJob = function(jobId) {
  if (confirm('Are you sure you want to completely remove this job posting?')) {
    let jobs = getJobs();
    jobs = jobs.filter(j => j.id !== jobId);
    saveJobs(jobs);
  }
};
