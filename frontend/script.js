const healthForm = document.getElementById('healthForm');
const recordsTable = document.querySelector('#recordsTable tbody');
const healthSummary = document.getElementById('healthSummary');

// ✅ MAIN SECTIONS CONTROL
const mainContent = document.querySelector("main");

// Pie chart instances
let heartChartInstance, oxygenChartInstance, stepsChartInstance, bpChartInstance;

// ✅ USER SESSION
let userId = localStorage.getItem("userId");

// ✅ BACKEND URL
const API_BASE = 'https://healthtwinai-v2-2.onrender.com';


// ============================
// 🔐 UI CONTROL (IMPORTANT)
// ============================
function showDashboard() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";
}

function hideDashboard() {
  mainContent.style.display = "none";
}


// ============================
// 🔐 LOGIN
// ============================
async function loginUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    alert("✅ Login Successful");
    localStorage.setItem("userId", data.userId);
    userId = data.userId;

    showDashboard();      // ✅ SHOW DASHBOARD
    fetchRecords();       // ✅ LOAD DATA
  } else {
    alert("❌ Invalid credentials");
  }
}


async function registerUser() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const registerBtn = document.getElementById("registerBtn");
  const registerMsg = document.getElementById("registerMsg");

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    registerMsg.innerText = "✅ Registered successfully! Now login using your credentials.";
    registerMsg.style.color = "green";

    // 🔥 Disable button after success
    registerBtn.disabled = true;
    registerBtn.innerText = "Registered ✔";

  } else {
    registerMsg.innerText = "❌ " + data.detail;
    registerMsg.style.color = "red";
  }
}


// ============================
// 📥 FETCH RECORDS (USER BASED)
// ============================
async function fetchRecords() {

  // ❗ STOP if not logged in
  if (!userId) {
    recordsTable.innerHTML = `<tr><td colspan="5">⚠️ Please login to see your data</td></tr>`;
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

      const date = record.timestamp
        ? new Date(record.timestamp).toLocaleString()
        : "N/A";

      tr.innerHTML = `
        <td>${date}</td>
        <td>${record.heart_rate}</td>
        <td>${record.oxygen_level}</td>
        <td>${record.steps}</td>
        <td>${record.blood_pressure}</td>
      `;
      recordsTable.appendChild(tr);
    });

    const latest = data[data.length - 1];
    renderPieCharts(latest);
    renderHealthSummary(latest);

  } catch(err) {
    console.error('Error fetching records:', err);
  }
}


// ============================
// 💾 SAVE RECORD
// ============================
healthForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!userId) {
    alert("⚠️ Please login first!");
    return;
  }

  const formData = new FormData(healthForm);

  const payload = {
    heart_rate: Number(formData.get('heart_rate')),
    oxygen_level: Number(formData.get('oxygen_level')),
    steps: Number(formData.get('steps')),
    blood_pressure: formData.get('blood_pressure'),
    userId: userId
  };

  try {
    await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    alert('✅ Record Saved Successfully!');
    healthForm.reset();

    fetchRecords();

  } catch(err) {
    console.error('Error saving record:', err);
  }
});


// ============================
// 🧠 HEALTH SUMMARY
// ============================
function renderHealthSummary(record) {
  const messages = [];

  const [systolic, diastolic] = record.blood_pressure.split("/").map(Number);

  if(record.heart_rate < 60) messages.push("⚠️ Heart rate is low");
  else if(record.heart_rate <= 100) messages.push("✅ Heart rate normal");
  else messages.push("⚠️ Heart rate high");

  if(record.oxygen_level >= 95) messages.push("✅ Oxygen good");
  else messages.push("⚠️ Oxygen low");

  if(record.steps >= 7000) messages.push("✅ Steps good");
  else if(record.steps >= 4000) messages.push("⚠️ Steps moderate");
  else messages.push("⚠️ Steps low");

  if(systolic <= 130 && diastolic <= 80) messages.push("✅ BP normal");
  else messages.push("⚠️ BP high");

  healthSummary.innerHTML = messages.join("<br>");
}


// ============================
// 📊 PIE CHARTS
// ============================
function renderPieCharts(record) {

  const scores = {
    heart: Math.min(Math.max(Math.round((100 - Math.abs(record.heart_rate-80))/4),0),25),
    oxygen: Math.min(Math.max(Math.round((record.oxygen_level-90)/2),0),25),
    steps: Math.min(Math.max(Math.round(record.steps/400),0),25),
    bp: Math.min(Math.max(Math.round((130- Math.abs(record.blood_pressure.split("/")[0]-120))/2),0),25)
  };

  const colors = ['#4facfe','#00f2fe','#ff6b6b','#feca57'];

  if(heartChartInstance) heartChartInstance.destroy();
  heartChartInstance = new Chart(document.getElementById('heartChart'), {
    type:'pie',
    data:{datasets:[{data:[scores.heart,25-scores.heart], backgroundColor:[colors[0],'#ddd']}]},
    options:{plugins:{legend:{display:false}}}
  });

  if(oxygenChartInstance) oxygenChartInstance.destroy();
  oxygenChartInstance = new Chart(document.getElementById('oxygenChart'), {
    type:'pie',
    data:{datasets:[{data:[scores.oxygen,25-scores.oxygen], backgroundColor:[colors[1],'#ddd']}]},
    options:{plugins:{legend:{display:false}}}
  });

  if(stepsChartInstance) stepsChartInstance.destroy();
  stepsChartInstance = new Chart(document.getElementById('stepsChart'), {
    type:'pie',
    data:{datasets:[{data:[scores.steps,25-scores.steps], backgroundColor:[colors[2],'#ddd']}]},
    options:{plugins:{legend:{display:false}}}
  });

  if(bpChartInstance) bpChartInstance.destroy();
  bpChartInstance = new Chart(document.getElementById('bpChart'), {
    type:'pie',
    data:{datasets:[{data:[scores.bp,25-scores.bp], backgroundColor:[colors[3],'#ddd']}]},
    options:{plugins:{legend:{display:false}}}
  });

  const overall = scores.heart + scores.oxygen + scores.steps + scores.bp;
  document.getElementById('overallScore').innerText = `Overall Health Score: ${overall}/100`;
}
function logoutUser() {
  localStorage.removeItem("userId");
  userId = null;

  document.getElementById("dashboard").style.display = "none";
  document.getElementById("authSection").style.display = "block";
  document.getElementById("logoutBtn").style.display = "none";

  // Clear UI
  document.querySelector("#recordsTable tbody").innerHTML =
    "<tr><td colspan='5'>⚠️ Please login to see your data</td></tr>";

  document.getElementById("healthSummary").innerText =
    "Your health summary will appear here.";

  document.getElementById("overallScore").innerText = "";
}

// ============================
// 🚀 INITIAL LOAD
// ============================
if (userId) {
  showDashboard();   // ✅ already logged in
  fetchRecords();
} else {
  hideDashboard();   // ❗ hide dashboard initially
}