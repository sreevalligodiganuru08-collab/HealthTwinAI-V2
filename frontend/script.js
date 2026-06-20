// -------------------------
// script.js (Updated Full Version)
// -------------------------

const API_BASE = "https://healthtwinai-v2-2.onrender.com"; // Change to your backend IP if needed

let userId = localStorage.getItem("userId") || null;
let heartChart = null, oxygenChart = null, stepsChart = null, bpChart = null;

// ----------------- REGISTER -----------------
async function registerUser() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  if (!username || !password) return alert("Enter username and password");
  
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.detail || "Registration failed");
    alert("Registered successfully. Please login.");
    showLogin();
  } catch (err) {
    console.error(err);
    alert("Server error during registration. Check backend URL.");
  }
}

// ----------------- LOGIN -----------------
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return alert("Enter username and password");

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.detail || "Login failed");

    userId = data.userId;
    localStorage.setItem("userId", userId);

    document.getElementById("authSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";

    fetchRecords();
  } catch (err) {
    console.error(err);
    alert("Server error during login. Check backend URL.");
  }
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
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();

    const tbody = document.getElementById("recordsTable");
    tbody.innerHTML = "";

    if (!data.records || !data.records.length) {
      tbody.innerHTML = `<tr><td colspan="5">No records yet</td></tr>`;
      return;
    }

    data.records.forEach(r => {
      const time = r.timestamp ? new Date(r.timestamp).toLocaleString() : "-";
      tbody.innerHTML += `<tr>
        <td>${time}</td>
        <td>${r.heart_rate ?? "-"}</td>
        <td>${r.spo2 ?? "-"}</td>
        <td>${r.steps ?? "-"}</td>
        <td>${r.systolic_bp ?? "-"} / ${r.diastolic_bp ?? "-"}</td>
      </tr>`;
    });

    renderCharts(data.chart_scores); // <-- Use chart_scores from model.py
    renderSummary(data); // Entire analysis object
  } catch (err) {
    console.error(err);
    alert("Error fetching records. Check backend URL and CORS.");
  }
}

// ----------------- RENDER SUMMARY -----------------
function renderSummary(analysis) {
  if (!analysis) return;
  const summaryElement = document.getElementById("healthSummary");

  const avgHR = analysis.avg?.heart_rate ?? "-";
  const avgSpO2 = analysis.avg?.spo2 ?? "-";
  const avgSystolic = analysis.avg?.systolic_bp ?? "-";
  const avgDiastolic = analysis.avg?.diastolic_bp ?? "-";
  const avgSteps = analysis.avg?.steps ?? "-";

  summaryElement.innerText = `
💡 Latest Status: ${analysis.health_status ?? "-"}
🧮 Overall Risk: ${analysis.risk_percentage ?? "-"}%
✅ Confidence: ${analysis.confidence ?? "-"}%

📊 Average Across All Records:
- Heart Rate: ${avgHR}
- SpO2: ${avgSpO2}
- Blood Pressure: ${avgSystolic}/${avgDiastolic}
- Steps: ${avgSteps}

🔍 Parameter Analysis:
- Heart Rate: ${analysis.parameter_analysis?.heart_rate ?? "-" }
- SpO2: ${analysis.parameter_analysis?.spo2 ?? "-" }
- Blood Pressure: ${analysis.parameter_analysis?.blood_pressure ?? "-" }
- Activity: ${analysis.parameter_analysis?.activity ?? "-" }

💡 Extra Insights:
${analysis.extra_insights ?? "None"}
`.trim();
}

// ----------------- CHARTS -----------------
function renderCharts(chartScores) {
  if (!chartScores) return;

  function createChart(id, score, existing) {
    if (existing) existing.destroy();
    return new Chart(document.getElementById(id), {
      type: "doughnut",
      data: { datasets: [{ data: [score, 25 - score], backgroundColor: ["#4facfe", "#e0e0e0"] }] },
      options: { cutout: "70%", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  heartChart = createChart("heartChart", chartScores.heart, heartChart);
  oxygenChart = createChart("oxygenChart", chartScores.spo2, oxygenChart);
  stepsChart = createChart("stepsChart", chartScores.steps, stepsChart);
  bpChart = createChart("bpChart", chartScores.bp, bpChart);

  document.getElementById("heartScore").innerText = `${chartScores.heart}/25`;
  document.getElementById("oxygenScore").innerText = `${chartScores.spo2}/25`;
  document.getElementById("stepsScore").innerText = `${chartScores.steps}/25`;
  document.getElementById("bpScore").innerText = `${chartScores.bp}/25`;
  document.getElementById("overallScore").innerText = `Overall Health Score: ${chartScores.overall}/100`;
}

// ----------------- UI SWITCH -----------------
function showLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}
function showRegister() {
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("loginBox").style.display = "none";
}

// ----------------- FORM SUBMISSION -----------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("healthForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return alert("Login first");

    const formData = new FormData(e.target);
    const bp = formData.get("blood_pressure");
    if (!bp || !bp.includes("/")) return alert("BP must be like 120/80");
    const [systolic, diastolic] = bp.split("/").map(Number);

    const payload = {
      userId,
      heart_rate: Number(formData.get("heart_rate") ?? 0),
      spo2: Number(formData.get("spo2") ?? 0),
      steps: Number(formData.get("steps") ?? 0),
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return alert(data.detail || "Save failed");
      alert("Record saved successfully!");
      e.target.reset();
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert("Server error while saving record.");
    }
  });

  // Auto-login if already logged in
  if (userId) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    fetchRecords();
  }
});

// ----------------- FUTURE RISK -----------------
async function analyzeFutureRisk() {
  if (!userId) return alert("Login first");

  const box = document.getElementById("futureRiskResult");
  box.innerText = "Analyzing future risk... ⏳";

  try {
    // Use the records endpoint for analysis
    const res = await fetch(`${API_BASE}/records/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch records for future risk");
    const data = await res.json();

    if (!data.records?.length) {
      box.innerText = "No records available to predict future risk.";
      return;
    }

    const abnormal = [];
    data.records.forEach(r => {
      if (r.heart_rate < 50 || r.heart_rate > 100) abnormal.push("Heart Rate");
      if (r.spo2 < 95) abnormal.push("Oxygen Level");
      if (r.systolic_bp > 140 || r.diastolic_bp > 90) abnormal.push("Blood Pressure");
      if (r.steps < 2000) abnormal.push("Activity");
    });

    box.innerText = abnormal.length
      ? `⚠️ Future risk may increase. Watch: ${[...new Set(abnormal)].join(", ")}.`
      : "✅ Your parameters are stable.";
  } catch (err) {
    console.error(err);
    box.innerText = "Unable to analyze future risk. Check backend.";
  }
}