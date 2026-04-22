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
    
    // Check if reported
    let reportedBadge = '';
    let reportedComments = '';
    if (job.reports && job.reports.length > 0) {
      reportedBadge = `<span style="background:var(--danger); color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-left:6px;">Reported (${job.reports.length})</span>`;
      const commentsHtml = job.reports.map(r => `• ${r.comment}`).join('<br>');
      reportedComments = `<div style="margin-top:8px; padding:8px; background:#fef2f2; border-left:3px solid var(--danger); font-size:12px; color:#991b1b;"><strong>User Mentions:</strong><br>${commentsHtml}</div>`;
    }

    const row = document.createElement('tr');
    if (job.reports && job.reports.length > 0) {
      row.style.backgroundColor = '#fff5f5'; // Light red background for easy spotting
    }
    
    row.innerHTML = `
      <td style="color:#64748b; font-size:13px;">#${job.id}</td>
      <td>
        <strong>${title}</strong> ${reportedBadge}<br>
        <span style="color:#64748b; font-size:14px;">${job.desc}</span>
        ${reportedComments}
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
