const VARIABLE_COUNT = 13;
const DISTURBANCE_COUNT = 5;

const xNames = [
    "Скорость выработки ленты стекла",
    "Скорость вращения роликов утоняющих устройств",
    "Температура расплава металла",
    "Температура кожуха дна",
    "Температура бортов ванны расплава",
    "Стабильность положения ленты в ванне расплава",
    "Расход электроэнергии",
    "Расход природного газа",
    "Расход защитной атмосферы",
    "Расход металла",
    "Уровень квалификации оператора",
    "Размер и состав дежурной бригады",
    "Сложность выбранного режима производства"
];

const INFLUENCE_MASK = {
    0: [1, 5, 6, 7, 8, 9, 10, 12],
    1: [0, 5, 6, 7, 8, 9, 10, 12],
    2: [3, 4, 6, 7, 9, 12],
    3: [2, 4, 6, 7],
    4: [2, 3, 6, 7],
    5: [0, 1, 10, 11, 12],
    6: [0, 1, 2, 3, 4, 10, 12],
    7: [2, 3, 4, 10, 12],
    8: [5, 10, 12],
    9: [2, 3, 4],
    10: [0, 1, 5, 11, 12],
    11: [0, 5, 10, 12],
    12: [0, 10, 11]
};

const DEFAULT_LINEAR_COEFF = 0.015;

const X_EFFECTS = [
    [0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, -1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1],
    [0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [-1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, -1],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, -1, 0, 1],
    [0, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 1],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 1],
    [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 1],
    [-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0]
];

const DEFAULT_Z_EFFECTS = [
    [-1, -1, -1, 0, -1],
    [-1, -1, -1, 0, -1],
    [-1, -1, 0, 0, -1],
    [-1, -1, 0, 1, -1],
    [-1, -1, 0, 1, -1],
    [-1, 0, 0, 1, -1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1],
    [0, 0, 0, 0, 1],
    [-1, -1, -1, 1, -1],
    [-1, 0, -1, 0, -1],
    [-1, -1, -1, 0, -1]
];

let zEffects = DEFAULT_Z_EFFECTS.map(row => [...row]);

const zNames = [
    "Отключение электроэнергии",
    "Отключение природного газа",
    "Прекращение подачи защитной атмосферы",
    "Параметры внешней среды",
    "Износ и отказ оборудования"
];

const COLORS = [
    "#2364AA", "#3DA5D9", "#73BFB8", "#FEC601", "#EA7317",
    "#8C2F39", "#5B8E7D", "#5A4E7C", "#C33C54", "#2F4858",
    "#7A9E7E", "#BC6C25", "#6D597A"
];

function setStatus(message, type = "") {
    const statusLine = document.getElementById("statusLine");
    if (!statusLine) return;
    statusLine.textContent = message;
    statusLine.classList.toggle("is-error", type === "error");
    statusLine.classList.toggle("is-ok", type === "ok");
}

function activateTab(tabId) {
    document.querySelectorAll(".app-tab").forEach(button => {
        button.classList.toggle("active", button.dataset.tabTarget === tabId);
    });
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.toggle("active", panel.id === tabId);
    });
}

function createNumberInput({ id, value = 0, step = "0.01", className = "form-control form-control-sm", data = {} }) {
    const input = document.createElement("input");
    input.type = "number";
    input.value = value;
    input.step = step;
    input.className = className;
    if (id) input.id = id;
    Object.entries(data).forEach(([key, val]) => {
        input.dataset[key] = val;
    });
    return input;
}

function defaultPolyCoeff(i, j, c) {
    return c === 2 ? X_EFFECTS[i][j] * DEFAULT_LINEAR_COEFF : 0;
}

function applyDefaultModel() {
    document.querySelectorAll("input[id^='X0_']").forEach(input => {
        input.value = "0.50";
    });
    document.querySelectorAll("input[id^='norm_']").forEach(input => {
        input.value = "1.00";
    });
    document.querySelectorAll("#poly-matrix-container input").forEach(input => {
        const i = Number.parseInt(input.dataset.i, 10);
        const j = Number.parseInt(input.dataset.j, 10);
        const c = Number.parseInt(input.dataset.c, 10);
        input.value = defaultPolyCoeff(i, j, c).toString();
    });
    document.querySelectorAll(".z-input").forEach(input => {
        input.value = "0";
    });
    document.getElementById("tEnd").value = "10";
    document.getElementById("steps").value = "120";
    zEffects = DEFAULT_Z_EFFECTS.map(row => [...row]);
}

function generateXParams() {
    const container = document.getElementById("x-params-container");
    container.innerHTML = `
        <div class="section-title">
            <h2>Начальные параметры</h2>
            <span>X0 и нормировочные коэффициенты</span>
        </div>
        <div class="param-grid"></div>
    `;

    const grid = container.querySelector(".param-grid");
    xNames.forEach((name, i) => {
        const row = document.createElement("div");
        row.className = "param-row";
        row.innerHTML = `
            <div class="param-name">X${i + 1}<small>${name}</small></div>
            <label><small>X0</small></label>
            <label><small>Норма</small></label>
        `;
        row.children[1].appendChild(createNumberInput({ id: `X0_${i}`, value: "0.50", step: "0.01" }));
        row.children[2].appendChild(createNumberInput({ id: `norm_${i}`, value: "1.00", step: "0.10" }));
        grid.appendChild(row);
    });
}

function generatePolyMatrix() {
    const container = document.getElementById("poly-matrix-container");
    container.innerHTML = `
        <div class="section-title">
            <h2>Полиномиальные связи</h2>
            <span>f(Xj) = a*X^3 + b*X^2 + c*X + d</span>
        </div>
    `;

    let functionCounter = 1;
    for (let i = 0; i < VARIABLE_COUNT; i += 1) {
        const influences = INFLUENCE_MASK[i] || [];
        const group = document.createElement("div");
        group.className = "poly-group";
        group.innerHTML = `<h3>X${i + 1}: ${xNames[i]}</h3>`;

        influences.forEach(j => {
            const row = document.createElement("div");
            row.className = "poly-row";
            row.innerHTML = `
                <div class="poly-title">f${functionCounter}(X${j + 1}) -> X${i + 1}<small>${xNames[j]}</small></div>
                <label><span class="coeff-label">a</span></label>
                <label><span class="coeff-label">b</span></label>
                <label><span class="coeff-label">c</span></label>
                <label><span class="coeff-label">d</span></label>
            `;

            for (let c = 0; c < 4; c += 1) {
                row.children[c + 1].appendChild(createNumberInput({
                    value: defaultPolyCoeff(i, j, c).toString(),
                    step: "0.001",
                    data: { i, j, c }
                }));
            }

            group.appendChild(row);
            functionCounter += 1;
        });

        container.appendChild(group);
    }
}

function generateDisturbances() {
    const container = document.getElementById("z-params-container");
    container.innerHTML = `
        <div class="section-title">
            <h2>Внешние возмущения</h2>
            <span>Zk(t) = a*t^3 + b*t^2 + c*t + d</span>
        </div>
        <div class="disturbance-list"></div>
    `;

    const list = container.querySelector(".disturbance-list");
    zNames.forEach((name, k) => {
        const row = document.createElement("div");
        row.className = "disturbance-row";
        row.innerHTML = `
            <div class="disturbance-title">Z${k + 1}<small>${name}</small></div>
            <label><span class="coeff-label">a</span></label>
            <label><span class="coeff-label">b</span></label>
            <label><span class="coeff-label">c</span></label>
            <label><span class="coeff-label">d</span></label>
        `;

        for (let c = 0; c < 4; c += 1) {
            row.children[c + 1].appendChild(createNumberInput({
                value: "0",
                step: "0.001",
                className: "form-control form-control-sm z-input",
                data: { k, coeff: c }
            }));
        }

        list.appendChild(row);
    });
}

function clearInputs() {
    applyDefaultModel();
    setStatus("Восстановлена стартовая модель", "ok");
}

function fillRandomData() {
    document.querySelectorAll("input[id^='X0_']").forEach(input => {
        input.value = Math.random().toFixed(2);
    });
    document.querySelectorAll("input[id^='norm_']").forEach(input => {
        input.value = (0.7 + Math.random() * 0.8).toFixed(2);
    });
    document.querySelectorAll("#poly-matrix-container input").forEach(input => {
        input.value = (Math.random() * 0.08 - 0.04).toFixed(4);
    });
    document.querySelectorAll(".z-input").forEach(input => {
        input.value = (Math.random() * 0.02 - 0.01).toFixed(4);
    });
    setStatus("Случайные данные заполнены", "ok");
}

document.querySelectorAll(".app-tab").forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
});

generateXParams();
generatePolyMatrix();
generateDisturbances();

document.getElementById("randomBtn").addEventListener("click", fillRandomData);
document.getElementById("clearBtn").addEventListener("click", clearInputs);
document.getElementById("csvLoadBtn").addEventListener("click", () => {
    document.getElementById("csvFileInput").click();
});
