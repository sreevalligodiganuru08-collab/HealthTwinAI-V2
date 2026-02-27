async function predict() {
    const heart_rate = document.getElementById("heart_rate").value;
    const steps = document.getElementById("steps").value;
    const sleep = document.getElementById("sleep").value;

    const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            heart_rate: Number(heart_rate),
            steps: Number(steps),
            sleep: Number(sleep)
        })
    });

    const data = await response.json();
    alert("Prediction: " + data.prediction);
}