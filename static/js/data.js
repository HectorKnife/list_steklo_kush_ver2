function getData() {

    let X0 = [];
    let norms = [];
    for (let i = 0; i < 13; i++) {
        X0.push(parseFloat(document.getElementById(`X0_${i}`).value) || 0);
        norms.push(parseFloat(document.getElementById(`norm_${i}`).value) || 1.0);
    }

    let poly_coeffs = [];
    for (let i = 0; i < 13; i++) {
        let row = [];
        for (let j = 0; j < 13; j++) {
            let coeffs = [];
            for (let c = 0; c < 4; c++) {
                const input = document.querySelector(`input[data-i="${i}"][data-j="${j}"][data-c="${c}"]`);
                let val = input ? parseFloat(input.value) : 0;
                coeffs.push(isNaN(val) ? 0 : val);
            }
            row.push(coeffs);
        }
        poly_coeffs.push(row);
    }
    let z_coeffs = [];
    for (let k = 0; k < 5; k++) {
        let coeffs = [];
        for (let c = 0; c < 4; c++) {
            const input = document.querySelector(`input.z-input[data-k="${k}"][data-coeff="${c}"]`);
            coeffs.push(input ? parseFloat(input.value) : 0);
        }
        z_coeffs.push(coeffs);
    }

        return {
        X0: X0,
        norms: norms, 
        poly_coeffs: poly_coeffs,
        z_coeffs: z_coeffs, 
        t_end: 1.0,
        steps: 100
    };
}


document.getElementById('calcBtn').addEventListener('click', async () => {
    const data = getData();
    const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
        updateCharts(result); 
    } else {
        console.error("Ошибка сервера:", result.detail);
        alert("Ошибка расчета: система неустойчива. Попробуйте уменьшить коэффициенты полиномов.");
    }
});
document.getElementById('csvFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.split('\n');
        
        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 6) {
                const i = cols[0].trim();
                const j = cols[1].trim();
                for (let c = 0; c < 4; c++) {
                    const input = document.querySelector(`input[data-i="${i}"][data-j="${j}"][data-c="${c}"]`);
                    if (input) input.value = cols[c + 2].trim();
                }
            }
        });
        alert("Данные из CSV успешно загружены!");
    };
    reader.readAsText(file);
});