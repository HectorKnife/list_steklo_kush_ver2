function toNumber(value, fallback = 0) {
    const normalized = String(value ?? "").replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getData() {
    const X0 = [];
    const norms = [];

    for (let i = 0; i < VARIABLE_COUNT; i += 1) {
        X0.push(toNumber(document.getElementById(`X0_${i}`).value));
        norms.push(toNumber(document.getElementById(`norm_${i}`).value, 1));
    }

    const poly_coeffs = [];
    for (let i = 0; i < VARIABLE_COUNT; i += 1) {
        const row = [];
        for (let j = 0; j < VARIABLE_COUNT; j += 1) {
            const coeffs = [];
            for (let c = 0; c < 4; c += 1) {
                const input = document.querySelector(`input[data-i="${i}"][data-j="${j}"][data-c="${c}"]`);
                coeffs.push(input ? toNumber(input.value) : 0);
            }
            row.push(coeffs);
        }
        poly_coeffs.push(row);
    }

    const z_coeffs = [];
    for (let k = 0; k < DISTURBANCE_COUNT; k += 1) {
        const coeffs = [];
        for (let c = 0; c < 4; c += 1) {
            const input = document.querySelector(`input.z-input[data-k="${k}"][data-coeff="${c}"]`);
            coeffs.push(input ? toNumber(input.value) : 0);
        }
        z_coeffs.push(coeffs);
    }

    return {
        X0,
        norms,
        poly_coeffs,
        z_coeffs,
        z_effects: zEffects,
        t_end: toNumber(document.getElementById("tEnd").value, 10),
        steps: Math.round(toNumber(document.getElementById("steps").value, 120))
    };
}

function validateClientData(data) {
    if (data.norms.some(norm => norm <= 0)) {
        throw new Error("Нормы должны быть больше нуля.");
    }
    if (data.t_end <= 0 || data.t_end > 100) {
        throw new Error("Время моделирования должно быть от 0.1 до 100.");
    }
    if (data.steps < 2 || data.steps > 1000) {
        throw new Error("Количество шагов должно быть от 2 до 1000.");
    }
}

async function calculate() {
    try {
        const data = getData();
        validateClientData(data);
        setStatus("Идет расчет...");

        const response = await fetch("/api/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || "Сервер вернул ошибку расчета.");
        }

        updateCharts(result);
        activateTab("results");
        setStatus("Расчет выполнен", "ok");
    } catch (error) {
        console.error(error);
        setStatus(error.message, "error");
    }
}

function decodeCsvBuffer(buffer) {
    const utf = new TextDecoder("utf-8").decode(buffer);
    let win1251 = utf;
    try {
        win1251 = new TextDecoder("windows-1251").decode(buffer);
    } catch (error) {
        return utf;
    }

    const badChars = text => (text.match(/\uFFFD/g) || []).length + (text.match(/[ЏђЋ€]/g) || []).length;
    return badChars(utf) <= badChars(win1251) ? utf : win1251;
}

function splitCsv(text) {
    const delimiter = text.split(";").length > text.split(",").length ? ";" : ",";
    return text
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(Boolean)
        .map(row => row.split(delimiter).map(cell => cell.trim()));
}

function resetPolynomialInputs() {
    document.querySelectorAll("#poly-matrix-container input").forEach(input => {
        input.value = "0";
    });
}

function signFromCell(cell) {
    const value = String(cell).trim().toUpperCase();
    if (!value || value === "0") return 0;
    if (value.includes("-")) return -1;
    if (value.includes("+") || value === "1" || value.startsWith("R")) return 1;
    return 0;
}

function loadCoefficientRows(rows) {
    let loaded = 0;
    rows.forEach(cols => {
        if (cols.length < 6) return;
        const i = Number.parseInt(cols[0], 10);
        const j = Number.parseInt(cols[1], 10);
        if (!Number.isInteger(i) || !Number.isInteger(j)) return;

        for (let c = 0; c < 4; c += 1) {
            const input = document.querySelector(`input[data-i="${i}"][data-j="${j}"][data-c="${c}"]`);
            if (input) {
                input.value = toNumber(cols[c + 2]).toString();
                loaded += 1;
            }
        }
    });
    return loaded;
}

function loadInfluenceMatrix(rows) {
    const dataRows = rows.filter(row => row.length >= 1 + VARIABLE_COUNT + DISTURBANCE_COUNT)
        .filter(row => row.slice(1, 1 + VARIABLE_COUNT).some(cell => signFromCell(cell) !== 0));

    if (dataRows.length < VARIABLE_COUNT) return 0;

    resetPolynomialInputs();
    zEffects = DEFAULT_Z_EFFECTS.map(row => [...row]);

    let loaded = 0;
    dataRows.slice(0, VARIABLE_COUNT).forEach((row, i) => {
        for (let j = 0; j < VARIABLE_COUNT; j += 1) {
            const sign = signFromCell(row[j + 1]);
            const inputs = [0, 1, 2, 3].map(c =>
                document.querySelector(`input[data-i="${i}"][data-j="${j}"][data-c="${c}"]`)
            );

            if (inputs.every(Boolean)) {
                inputs[0].value = "0";
                inputs[1].value = "0";
                inputs[2].value = sign ? (sign * DEFAULT_LINEAR_COEFF).toString() : "0";
                inputs[3].value = "0";
                loaded += 1;
            }
        }

        for (let k = 0; k < DISTURBANCE_COUNT; k += 1) {
            zEffects[i][k] = signFromCell(row[1 + VARIABLE_COUNT + k]);
        }
    });

    return loaded;
}

function loadCsvFile(file) {
    const reader = new FileReader();

    reader.onload = event => {
        try {
            const text = decodeCsvBuffer(event.target.result);
            const rows = splitCsv(text);
            const coeffCount = loadCoefficientRows(rows);
            const matrixCount = coeffCount > 0 ? 0 : loadInfluenceMatrix(rows);

            if (coeffCount > 0) {
                setStatus(`Загружено коэффициентов: ${coeffCount}`, "ok");
                return;
            }
            if (matrixCount > 0) {
                setStatus("Матрица влияний загружена как линейные коэффициенты", "ok");
                return;
            }

            throw new Error("CSV не похож на таблицу коэффициентов или матрицу влияний.");
        } catch (error) {
            setStatus(error.message, "error");
        }
    };

    reader.onerror = () => setStatus("Не удалось прочитать CSV-файл.", "error");
    reader.readAsArrayBuffer(file);
}

document.getElementById("calcBtn").addEventListener("click", calculate);
document.getElementById("csvFileInput").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) loadCsvFile(file);
    event.target.value = "";
});
