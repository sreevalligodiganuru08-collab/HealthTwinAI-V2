const API_BASE = "https://healthtwinai-v2-4.onrender.com";

let userId = localStorage.getItem("userId") || null;

let heartChart = null;
let oxygenChart = null;
let stepsChart = null;
let bpChart = null;

// ---------------- REGISTER ----------------
async function registerUser() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!username || !password) return alert("Enter username & password");

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return alert(data?.detail || "Register failed");
  }

  alert("Registered successfully!");
  showLogin();
}

// ---------------- LOGIN ----------------
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Enter credentials");

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return alert(data?.detail || "Login failed");
  }

  userId = data.userId;
  localStorage.setItem("userId", userId);

  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";

  fetchRecords();
}

// ---------------- FETCH RECORDS ----------------
async function fetchRecords() {
  if (!userId) return;

  const res = await fetch(`${API_BASE}/records/${userId}`);
  const data = await res.json();

  const analysis = data.analysis;

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

  renderSummary(analysis);
  renderCharts(analysis.chart_scores);
}

// ---------------- SAVE FORM ----------------
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
      diastolic_bp: dia,
      timestamp: new Date().toISOString() // ✅ REAL DEVICE TIME
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

// ---------------- UI ----------------
function showLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function showRegister() {
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("loginBox").style.display = "none";
}