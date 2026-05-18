// Supabase Initialization
const SUPABASE_URL = 'https://uqqqktkvqqhplgaugezm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcXFrdGt2cXFocGxnYXVnZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDQ0ODAsImV4cCI6MjA5NDE4MDQ4MH0.ulYw-8Jiy-8hKz3U16sl_auDRURNNz-Pku2zEiKAEAE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  if (e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', () => {
  dashboard.classList.add('hidden');
  loginOverlay.classList.remove('hidden');
  pwdInput.value = '';
});

// Load Jobs from Supabase
async function loadAndRenderJobs() {
  jobTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color:#64748b;">Loading jobs...</td></tr>`;

  try {
    const { data: jobs, error } = await supabase.from('jobs').select('*').order('id', { ascending: false });

    if (error) throw error;

    jobTableBody.innerHTML = '';
    totalJobsCount.textContent = jobs.length;

    if (jobs.length === 0) {
      jobTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">No Active Jobs found</td></tr>`;
      return;
    }

    jobs.forEach(job => {
      const titleObj = job.title;
      const title = typeof titleObj === 'object' ? (titleObj.hi || titleObj.mr || JSON.stringify(titleObj)) : (titleObj || 'Untitled');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="color:#64748b; font-size:13px;">#${job.id}</td>
        <td>
          <strong>${title}</strong><br>
          <span style="color:#64748b; font-size:14px;">${job.desc || ''}</span>
        </td>
        <td style="font-weight:600; color:#0f172a;">+91 ${job.phone || 'N/A'}</td>
        <td>${job.wage || 'N/A'}</td>
        <td>${job.location || 'N/A'}</td>
        <td>
          <button class="btn-delete" onclick="deleteJob('${job.id}')">
            <i class="ri-delete-bin-fill"></i> Remove
          </button>
        </td>
      `;
      jobTableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Failed to load jobs:', err);
    jobTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color:red;">Error loading jobs. Check Supabase connection.</td></tr>`;
  }
}

// Delete Job via Admin (Supabase)
window.deleteJob = async function(jobId) {
  if (confirm('Are you sure you want to completely remove this job posting?')) {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      loadAndRenderJobs(); // Refresh table
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Error deleting job. Please try again.');
    }
  }
};
