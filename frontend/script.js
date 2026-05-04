// -------------------------
// HealthTwin AI - FINAL PERFECT VERSION
// -------------------------

const API_BASE = "https://healthtwinai-v2-3.onrender.com";

let userId = localStorage.getItem("userId") || null;

let heartChart = null;
let oxygenChart = null;
let stepsChart = null;
let bpChart = null;

// ----------------- REGISTER -----------------
async function registerUser() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!username || !password) return alert("Enter username & password");

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.detail);

  alert("Registered successfully!");
  showLogin();
}

// ----------------- LOGIN -----------------
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Enter credentials");

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.detail);

  userId = data.userId;
  localStorage.setItem("userId", userId);

  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";

  fetchRecords();
}

// ----------------- LOGOUT -----------------
function logoutUser() {
  localStorage.removeItem("userId");
  location.reload();
}

// ----------------- FETCH RECORDS -----------------
async function fetchRecords() {
  if (!userId) return;

  try {
    const res = await fetch(`${API_BASE}/records/${userId}`);
    const data = await res.json();

    const analysis = data; // ✅ IMPORTANT FIX

    // -------- TABLE --------
    const tbody = document.getElementById("recordsTable");
    tbody.innerHTML = "";

    if (!data.records || data.records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No records</td></tr>`;
    } else {
      data.records.forEach(r => {
        tbody.innerHTML += `
          <tr>
            <td>${new Date(r.timestamp).toLocaleString()}</td>
            <td>${r.heart_rate}</td>
            <td>${r.spo2}</td>
            <td>${r.steps}</td>
            <td>${r.systolic_bp}/${r.diastolic_bp}</td>
          </tr>
        `;
      });
    }

    // -------- SUMMARY --------
    renderSummary(analysis);

    // -------- CHARTS --------
    renderCharts(analysis.chart_scores);

  } catch (err) {
    console.error(err);
    alert("Error fetching records");
  }
}

// ----------------- BEAUTIFUL SUMMARY -----------------
function renderSummary(a) {
  const el = document.getElementById("healthSummary");

  el.innerHTML = `
    <div style="
      padding:25px;
      border-radius:20px;
      background:white;
      box-shadow:0 4px 15px rgba(0,0,0,0.08);
      line-height:1.7;
    ">

      <h2 style="color:${a.color}; margin-bottom:10px;">
        🧠 ${a.health_status} Health Status
      </h2>
      <div style="display:flex; gap:30px; flex-wrap:wrap; margin-bottom:15px;">
        <p><b>💚 Health Score:</b> ${a.risk_percentage}%</p>
        <p><b>🎯 Confidence:</b> ${a.confidence}%</p>
      </div>


      <h3>📈 Average Readings</h3>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
        <p>❤️ Heart Rate: <b>${Math.round(a.avg.heart_rate)} bpm</b></p>
        <p>🫁 SpO2: <b>${Math.round(a.avg.spo2)}%</b></p>
        <p>🚶 Steps: <b>${Math.round(a.avg.steps)}</b></p>
        <p>💓 BP: <b>${Math.round(a.avg.systolic_bp)}/${Math.round(a.avg.diastolic_bp)}</b></p>
      </div>

      <h3>🧾 Detailed Health Insight</h3>
      <div style="
        background:#f8f9fa;
        padding:15px;
        border-radius:10px;
        font-size:14px;
      ">
        ${a.extra_insights.replace(/\n/g, "<br>")}
      </div>

    </div>
  `;
}

// ----------------- CHARTS -----------------
function renderCharts(scores) {
  if (!scores) return;

  function getColor(score) {
    if (score >= 20) return "#28a745";
    if (score >= 12) return "#ffc107";
    return "#dc3545";
  }

  function createChart(id, value, existing) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (existing) existing.destroy();

    return new Chart(canvas, {
      type: "doughnut",
      data: {
        datasets: [{
          data: [value, 25 - value],
          backgroundColor: [getColor(value), "#eee"]
        }]
      },
      options: {
        cutout: "70%",
        plugins: { legend: { display: false } }
      }
    });
  }

  heartChart = createChart("heartChart", scores.heart, heartChart);
  oxygenChart = createChart("oxygenChart", scores.spo2, oxygenChart);
  stepsChart = createChart("stepsChart", scores.steps, stepsChart);
  bpChart = createChart("bpChart", scores.bp, bpChart);

  document.getElementById("heartScore").innerText = `${scores.heart}/25`;
  document.getElementById("oxygenScore").innerText = `${scores.spo2}/25`;
  document.getElementById("stepsScore").innerText = `${scores.steps}/25`;
  document.getElementById("bpScore").innerText = `${scores.bp}/25`;

  document.getElementById("overallScore").innerText =
    `Overall Health Score: ${scores.overall}/100`;
}

// ----------------- FUTURE RISK (UPGRADED) -----------------
async function analyzeFutureRisk() {
  const box = document.getElementById("futureRiskResult");

  box.innerHTML = "🔍 Analyzing future health risk...";

  const res = await fetch(`${API_BASE}/records/${userId}`);
  const data = await res.json();

  const records = data.records;

  if (!records.length) {
    box.innerHTML = "No data available.";
    return;
  }

  let risks = [];
  let suggestions = [];

  records.forEach(r => {

    if (r.heart_rate > 100) {
      risks.push("High Heart Rate");
      suggestions.push("Reduce stress, avoid caffeine, try meditation.");
    }

    if (r.spo2 < 95) {
      risks.push("Low Oxygen Level");
      suggestions.push("Improve breathing, fresh air, consult doctor if needed.");
    }

    if (r.systolic_bp > 140 || r.diastolic_bp > 90) {
      risks.push("High Blood Pressure");
      suggestions.push("Reduce salt, exercise, manage stress.");
    }

    if (r.steps < 3000) {
      risks.push("Low Activity");
      suggestions.push("Walk at least 6000–10000 steps daily.");
    }
  });

  risks = [...new Set(risks)];
  suggestions = [...new Set(suggestions)];

  if (risks.length) {
    box.innerHTML = `
      <div style="background:#fff3cd;padding:20px;border-radius:12px;">
        <h3 style="color:#856404;">⚠️ Future Risk Detected</h3>
        <p>If habits continue, you may face:</p>
        <ul>${risks.map(r => `<li>${r}</li>`).join("")}</ul>

        <h4>📌 Recommendations:</h4>
        <ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>

        <p>👉 Improve now to avoid serious issues later.</p>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div style="background:#d4edda;padding:20px;border-radius:12px;">
        <h3 style="color:#155724;">✅ Low Future Risk</h3>
        <p>Your health habits are good. Keep it up!</p>
      </div>
    `;
  }
}

// ----------------- FORM -----------------
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("healthForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!userId) return alert("Login first");

    const formData = new FormData(e.target);
    const [sys, dia] = formData.get("blood_pressure").split("/").map(Number);

    const payload = {
      userId,
      heart_rate: Number(formData.get("heart_rate")),
      spo2: Number(formData.get("spo2")),
      steps: Number(formData.get("steps")),
      systolic_bp: sys,
      diastolic_bp: dia
    };

    const res = await fetch(`${API_BASE}/save`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    if (!res.ok) return alert("Save failed");

    alert("Saved!");
    e.target.reset();
    fetchRecords();
  });

  if (userId) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("logoutBtn").style.display = "block";

    fetchRecords();
  }
});

// ----------------- UI SWITCH -----------------
function showLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function showRegister() {
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("loginBox").style.display = "none";
}