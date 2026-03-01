// ============================
// HEALTHTWIN AI - FRONTEND LOGIC
// ============================

const healthForm = document.getElementById('healthForm');
const recordsTable = document.querySelector('#recordsTable tbody');
const healthSummary = document.getElementById('healthSummary');

// Chart instances
let heartChartInstance, oxygenChartInstance, stepsChartInstance, bpChartInstance;

// Session
let userId = localStorage.getItem("userId");

// Backend
const API_BASE = 'https://healthtwinai-v2-2.onrender.com';

// ============================
// UI CONTROL
// ============================
function showDashboard() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";
}

function hideDashboard() {
  document.getElementById("dashboard").style.display = "none";
}

// ============================
// SHOW / HIDE PASSWORD
// ============================
function togglePassword(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggleText = document.getElementById(toggleId);
  if (input.type === "password") {
    input.type = "text"; toggleText.innerText = "🙈 Hide";
  } else {
    input.type = "password"; toggleText.innerText = "👁 Show";
  }
}

// ============================
// LOGIN
// ============================
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginMsg = document.getElementById("loginMsg") || createLoginMsg();

  if (!username || !password) {
    loginMsg.innerText = "⚠️ Enter username & password";
    loginMsg.style.color = "orange";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      loginMsg.innerText = "✅ Login Successful";
      loginMsg.style.color = "green";
      localStorage.setItem("userId", data.userId);
      userId = data.userId;
      showDashboard();
      fetchRecords();
    } else {
      loginMsg.innerText = "❌ Invalid credentials";
      loginMsg.style.color = "red";
    }
  } catch (err) {
    loginMsg.innerText = "⚠️ Server error. Try again later.";
    loginMsg.style.color = "orange";
  }
}

function createLoginMsg() {
  const p = document.createElement('p');
  p.id = "loginMsg";
  p.style.marginTop = "10px";
  document.getElementById("loginBox").appendChild(p);
  return p;
}

// ============================
// REGISTER
// ============================
async function registerUser() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const registerBtn = document.getElementById("registerBtn");
  const registerMsg = document.getElementById("registerMsg");

  if (!username || !password) { 
    registerMsg.innerText = "⚠️ Enter username & password"; 
    registerMsg.style.color = "orange"; 
    return; 
  }

  try {
    registerBtn.innerText = "Registering...";
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      registerMsg.innerText = "✅ Registered! Now login."; 
      registerMsg.style.color = "green";
      registerBtn.disabled = true; 
      registerBtn.innerText = "Registered ✔";
      setTimeout(() => { 
        showLogin(); 
        registerBtn.disabled = false; 
        registerBtn.innerText = "Register"; 
      }, 1500);
    } else {
      registerMsg.innerText = "❌ " + data.detail; 
      registerMsg.style.color = "red"; 
      registerBtn.innerText = "Register";
    }
  } catch (err) {
    registerMsg.innerText = "⚠️ Server error"; 
    registerMsg.style.color = "orange"; 
    registerBtn.innerText = "Register";
  }
}

// ============================
// SWITCH AUTH
// ============================
function showLogin() { 
  document.getElementById("registerBox").style.display = "none"; 
  document.getElementById("loginBox").style.display = "block"; 
}
function showRegister() { 
  document.getElementById("loginBox").style.display = "none"; 
  document.getElementById("registerBox").style.display = "block"; 
}

// ============================
// FETCH RECORDS
// ============================
async function fetchRecords() {
  if (!userId) { 
    recordsTable.innerHTML = `<tr><td colspan="5">⚠️ Please login</td></tr>`; 
    return; 
  }
  try {
    const res = await fetch(`${API_BASE}/records/${userId}`);
    const data = await res.json();
    recordsTable.innerHTML = '';
    if (!data.length) { 
      recordsTable.innerHTML = `<tr><td colspan="5">No records found</td></tr>`; 
      return; 
    }
    data.forEach(record => {
      const tr = document.createElement('tr');
      const date = record.timestamp ? new Date(record.timestamp).toLocaleString() : "N/A";
      tr.innerHTML = `<td>${date}</td>
                      <td>${record.heart_rate}</td>
                      <td>${record.oxygen_level}</td>
                      <td>${record.steps}</td>
                      <td>${record.blood_pressure}</td>`;
      recordsTable.appendChild(tr);
    });
    const latest = data[data.length - 1];
    renderHealthSummary(latest);
    renderPieCharts(latest);
  } catch (err) { console.error(err); }
}

// ============================
// SAVE RECORD
// ============================
healthForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveMsg = document.getElementById("saveMsg") || createSaveMsg();

  if (!userId) { 
    saveMsg.innerText = "⚠️ Please login first!";
    saveMsg.style.color = "orange";
    return; 
  }

  const formData = new FormData(healthForm);
  const payload = {
    heart_rate: Number(formData.get('heart_rate')),
    oxygen_level: Number(formData.get('oxygen_level')),
    steps: Number(formData.get('steps')),
    blood_pressure: formData.get('blood_pressure'),
    userId
  };

  try {
    await fetch(`${API_BASE}/save`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    saveMsg.innerText = "✅ Record saved!";
    saveMsg.style.color = "green";
    setTimeout(() => { saveMsg.innerText = ""; }, 2000);

    healthForm.reset();
    fetchRecords();
  } catch (err) { 
    console.error(err);
    saveMsg.innerText = "⚠️ Failed to save record";
    saveMsg.style.color = "orange";
  }
});

function createSaveMsg() {
  const p = document.createElement('p');
  p.id = "saveMsg";
  p.style.marginTop = "10px";
  document.querySelector(".input-section").appendChild(p);
  return p;
}

// ============================
// HEALTH SUMMARY
// ============================
function renderHealthSummary(record) {
  const messages = [];
  const [systolic, diastolic] = record.blood_pressure.split("/").map(Number);
  messages.push(record.heart_rate <= 100 ? "✅ Heart normal" : "⚠️ Heart high");
  messages.push(record.oxygen_level >= 95 ? "✅ Oxygen good" : "⚠️ Oxygen low");
  messages.push(record.steps >= 7000 ? "✅ Steps good" : "⚠️ Walk more");
  messages.push((systolic <= 130 && diastolic <= 80) ? "✅ BP normal" : "⚠️ BP high");
  healthSummary.innerHTML = messages.join("<br>");
}

// ============================
// PIE CHARTS
// ============================
function renderPieCharts(record) {
  const [systolic] = record.blood_pressure.split("/").map(Number);

  const scores = {
    heart: Math.min(Math.max(Math.round((1 - Math.abs(record.heart_rate - 75) / 75) * 25), 0), 25),
    oxygen: Math.min(Math.max(Math.round((record.oxygen_level / 100) * 25), 0), 25),
    steps: Math.min(Math.max(Math.round((record.steps / 10000) * 25), 0), 25),
    bp: Math.min(Math.max(Math.round((1 - Math.abs(systolic - 120) / 120) * 25), 0), 25)
  };

  const updateOrCreateChart = (chartInstance, id, value, color, label) => {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartInstance) {
      chartInstance.data.datasets[0].data = [value, 25 - value];
      chartInstance.update();
      return chartInstance;
    } else {
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [label, 'Remaining'],
          datasets: [{
            data: [value, 25 - value],
            backgroundColor: [color, '#eee'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if(context.dataIndex === 0) return `${label}: ${value}/25`; 
                  return null;
                }
              }
            },
            datalabels: {
              display: true,
              color: '#000',
              font: { weight: 'bold', size: 14 },
              formatter: function(val, ctx) { if(ctx.dataIndex===0) return val + '/25'; return ''; }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  };

  heartChartInstance = updateOrCreateChart(heartChartInstance, 'heartChart', scores.heart, '#4facfe', 'Heart');
  oxygenChartInstance = updateOrCreateChart(oxygenChartInstance, 'oxygenChart', scores.oxygen, '#00f2fe', 'Oxygen');
  stepsChartInstance = updateOrCreateChart(stepsChartInstance, 'stepsChart', scores.steps, '#ff6b6b', 'Steps');
  bpChartInstance = updateOrCreateChart(bpChartInstance, 'bpChart', scores.bp, '#feca57', 'BP');

  document.getElementById('scoreHeart').innerText = `${scores.heart}/25`;
  document.getElementById('scoreOxygen').innerText = `${scores.oxygen}/25`;
  document.getElementById('scoreSteps').innerText = `${scores.steps}/25`;
  document.getElementById('scoreBP').innerText = `${scores.bp}/25`;

  const overall = scores.heart + scores.oxygen + scores.steps + scores.bp;
  document.getElementById('overallScore').innerText = `Overall Health Score: ${overall}/100`;
}

// ============================
// LOGOUT
// ============================
function logoutUser() {
  localStorage.removeItem("userId");
  userId = null;
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("authSection").style.display = "block";
  document.getElementById("logoutBtn").style.display = "none";
  recordsTable.innerHTML = `<tr><td colspan="5">⚠️ Please login</td></tr>`;
  healthSummary.innerText = "Your health summary will appear here.";
  document.getElementById("overallScore").innerText = "";
}

// ============================
// INITIAL LOAD
// ============================
if (userId) { 
  showDashboard(); 
  fetchRecords(); 
} else { 
  hideDashboard(); 
}