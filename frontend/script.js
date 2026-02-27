const API = "http://127.0.0.1:8000";

function getInputData() {
    return {
        heart_rate: Number(document.getElementById("heart").value),
        spo2: Number(document.getElementById("spo2").value),
        steps: Number(document.getElementById("steps").value),
        sleep: Number(document.getElementById("sleep").value)
    };
}

async function submitData() {
    const data = getInputData();

    await fetch(`${API}/add-data`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    alert("Data Saved ✅");
    loadRecords();
}

async function predict() {
    const data = getInputData();

    const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("result").innerText = result.risk;
}

async function loadRecords() {
    const res = await fetch(`${API}/records`);
    const data = await res.json();

    const list = document.getElementById("records");
    list.innerHTML = "";

    data.forEach(r => {
        const li = document.createElement("li");
        li.innerText = JSON.stringify(r);
        list.appendChild(li);
    });
}

loadRecords();