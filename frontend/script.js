const healthForm = document.getElementById('healthForm');
const recordsTable = document.querySelector('#recordsTable tbody');
const healthSummary = document.getElementById('healthSummary');

// Pie chart instances
let heartChartInstance, oxygenChartInstance, stepsChartInstance, bpChartInstance;

// API URL
const API_BASE = 'http://127.0.0.1:8000';

// Fetch and render records
async function fetchRecords() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();

    recordsTable.innerHTML = '';
    data.forEach(record => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(record.timestamp).toLocaleString()}</td>
        <td>${record.heart_rate}</td>
        <td>${record.oxygen_level}</td>
        <td>${record.steps}</td>
        <td>${record.blood_pressure}</td>
      `;
      recordsTable.appendChild(tr);
    });

    if (data.length) {
      const latest = data[data.length - 1];
      renderPieCharts(latest);
      renderHealthSummary(latest);
    }

  } catch (err) {
    console.error('Error fetching records:', err);
  }
}

// Save new record
healthForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(healthForm);
  const payload = {
    heart_rate: Number(formData.get('heart_rate')),
    oxygen_level: Number(formData.get('oxygen_level')),
    steps: Number(formData.get('steps')),
    blood_pressure: formData.get('blood_pressure')
  };

  try {
    await fetch(`${API_BASE}/health`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    alert('✅ Record Saved Successfully!');
    healthForm.reset();
    fetchRecords();
  } catch (err) {
    console.error('Error saving record:', err);
  }
});

// Dynamic health summary
function renderHealthSummary(record) {
  const messages = [];
  const [systolic, diastolic] = record.blood_pressure.split("/").map(Number);

  // Heart
  if (record.heart_rate < 60) messages.push("⚠️ Heart rate is low, consider mild activity.");
  else if (record.heart_rate <= 100) messages.push("✅ Heart rate is normal.");
  else messages.push("⚠️ Heart rate is high, relax and monitor.");

  // Oxygen
  if (record.oxygen_level >= 95) messages.push("✅ Oxygen level is good.");
  else messages.push("⚠️ Oxygen level is low, consult if persistent.");

  // Steps
  if (record.steps >= 7000) messages.push("✅ Steps are good today.");
  else if (record.steps >= 4000) messages.push("⚠️ Steps moderate, try walking more.");
  else messages.push("⚠️ Steps low, aim for more activity.");

  // Blood Pressure
  if (systolic <= 130 && diastolic <= 80) messages.push("✅ Blood pressure is normal.");
  else messages.push("⚠️ Blood pressure is slightly high, reduce stress & salt.");

  healthSummary.innerHTML = messages.join("<br>");
}

// Correct scoring system for each parameter (0-25)
function calculateScores(record) {
  const [systolic, diastolic] = record.blood_pressure.split("/").map(Number);

  // Heart Rate: ideal 60-100 bpm
  let heart = 25 - Math.max(0, Math.abs(record.heart_rate - 80)/2);
  heart = Math.min(Math.max(heart, 0), 25);

  // Oxygen Level: ideal >= 95%
  let oxygen = 25 - Math.max(0, (95 - record.oxygen_level));
  oxygen = Math.min(Math.max(oxygen, 0), 25);

  // Steps: target 7000+
  let steps = (record.steps / 7000) * 25;
  steps = Math.min(Math.max(steps, 0), 25);

  // Blood Pressure: ideal systolic 110-130
  let bp = 25 - Math.max(0, Math.abs(systolic - 120)/2);
  bp = Math.min(Math.max(bp, 0), 25);

  return {
    heart: Math.round(heart),
    oxygen: Math.round(oxygen),
    steps: Math.round(steps),
    bp: Math.round(bp)
  };
}

// Pie charts
function renderPieCharts(record) {
  const scores = calculateScores(record);
  const colors = ['#4facfe','#00f2fe','#ff6b6b','#feca57'];

  // Heart
  if (heartChartInstance) heartChartInstance.destroy();
  heartChartInstance = new Chart(document.getElementById('heartChart').getContext('2d'), {
    type:'pie',
    data: {labels:['Heart','Remaining'], datasets:[{data:[scores.heart,25-scores.heart], backgroundColor:[colors[0],'#ddd']}]},
    options:{plugins:{legend:{display:false}}, responsive:false}
  });

  // Oxygen
  if (oxygenChartInstance) oxygenChartInstance.destroy();
  oxygenChartInstance = new Chart(document.getElementById('oxygenChart').getContext('2d'), {
    type:'pie',
    data: {labels:['Oxygen','Remaining'], datasets:[{data:[scores.oxygen,25-scores.oxygen], backgroundColor:[colors[1],'#ddd']}]},
    options:{plugins:{legend:{display:false}}, responsive:false}
  });

  // Steps
  if (stepsChartInstance) stepsChartInstance.destroy();
  stepsChartInstance = new Chart(document.getElementById('stepsChart').getContext('2d'), {
    type:'pie',
    data: {labels:['Steps','Remaining'], datasets:[{data:[scores.steps,25-scores.steps], backgroundColor:[colors[2],'#ddd']}]},
    options:{plugins:{legend:{display:false}}, responsive:false}
  });

  // BP
  if (bpChartInstance) bpChartInstance.destroy();
  bpChartInstance = new Chart(document.getElementById('bpChart').getContext('2d'), {
    type:'pie',
    data: {labels:['BP','Remaining'], datasets:[{data:[scores.bp,25-scores.bp], backgroundColor:[colors[3],'#ddd']}]},
    options:{plugins:{legend:{display:false}}, responsive:false}
  });

  const overall = scores.heart + scores.oxygen + scores.steps + scores.bp;
  document.getElementById('overallScore').innerText = `Overall Health Score: ${overall}/100`;
}

// Initial fetch
fetchRecords();