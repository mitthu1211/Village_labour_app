const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize DB
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite DB.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        role TEXT,
        name TEXT,
        skill_or_business TEXT,
        exp TEXT,
        location TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY,
        title_hi TEXT,
        title_en TEXT,
        desc TEXT,
        wage TEXT,
        location TEXT,
        lat REAL,
        lng REAL,
        phone TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        comment TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS blocks (
        user_phone TEXT,
        job_id INTEGER,
        PRIMARY KEY (user_phone, job_id)
    )`);

    // Basic Seeding to prevent empty states
    db.get("SELECT COUNT(*) as count FROM jobs", (err, row) => {
        if(row && row.count === 0) {
            db.run(`INSERT INTO jobs (id, title_hi, title_en, desc, wage, location, phone, category) 
                    VALUES (1, 'खेत की जुताई', 'Field Ploughing', 'कल सुबह 2 लोग चाहिए। Start early.', '₹400 / दिन', 'Village', '9818208463', 'kheti')`);
        }
    });
});

// --- API ENDPOINTS ---

// 1. Auth / Get Profile
app.post('/api/auth', (req, res) => {
    const { phone } = req.body;
    db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ existingProfile: row || null });
    });
});

// 2. Save Profile
app.post('/api/profile', (req, res) => {
    const { phone, role, name, skill, location, exp, business } = req.body;
    const skillOrBusiness = role === 'worker' ? skill : business;
    const experience = exp || '0';

    db.run(`INSERT OR REPLACE INTO users (phone, role, name, skill_or_business, exp, location) VALUES (?, ?, ?, ?, ?, ?)`,
        [phone, role, name, skillOrBusiness, experience, location],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, phone });
        }
    );
});

// 3. Get Jobs (Filters out blocked jobs for a specific user)
app.get('/api/jobs', (req, res) => {
    const userPhone = req.query.phone || '';
    
    // Grab all jobs
    db.all(`SELECT * FROM jobs ORDER BY created_at DESC`, [], (err, jobs) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Grab reports for these jobs
        db.all(`SELECT * FROM reports`, [], (err, reports) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Grab blocked jobs for this specific user
            db.all(`SELECT job_id FROM blocks WHERE user_phone = ?`, [userPhone], (err, blocks) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const blockedIds = blocks.map(b => b.job_id);

                // Format structure to match old frontend style
                let formattedJobs = jobs.filter(j => !blockedIds.includes(j.id)).map(j => {
                    const jobReports = reports.filter(r => r.job_id === j.id);
                    return {
                        id: j.id,
                        title: { hi: j.title_hi, en: j.title_en },
                        desc: j.desc,
                        wage: j.wage,
                        location: j.location,
                        lat: j.lat,
                        lng: j.lng,
                        phone: j.phone,
                        category: j.category,
                        reports: jobReports
                    };
                });
                
                res.json(formattedJobs);
            });
        });
    });
});

// 4. Create Job
app.post('/api/jobs', (req, res) => {
    const { id, title, desc, wage, location, lat, lng, phone, category } = req.body;
    db.run(`INSERT INTO jobs (id, title_hi, title_en, desc, wage, location, lat, lng, phone, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title.hi, title.en, desc, wage, location, lat, lng, phone, category],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        }
    );
});

// 5. Delete Job (Admin)
app.delete('/api/jobs/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM jobs WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Also wipe reports and blocks related to the job
        db.run(`DELETE FROM reports WHERE job_id = ?`, [id]);
        db.run(`DELETE FROM blocks WHERE job_id = ?`, [id]);
        
        res.json({ success: true, changes: this.changes });
    });
});

// 6. Report Job
app.post('/api/jobs/:id/report', (req, res) => {
    const id = req.params.id;
    const { comment } = req.body;
    db.run(`INSERT INTO reports (job_id, comment) VALUES (?, ?)`, [id, comment], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 7. Block Job
app.post('/api/block', (req, res) => {
    const { user_phone, job_id } = req.body;
    db.run(`INSERT OR IGNORE INTO blocks (user_phone, job_id) VALUES (?, ?)`, [user_phone, job_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
