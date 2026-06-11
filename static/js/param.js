// Список имен переменных
const xNames = [
    "Эффективность функционирования DWH",
    "Качество ПО",
    "Корректность ПО",
    "Надёжность ПО",
    "Доступность ПО",
    "Возможность интенсивного использования ПО",
    "Прослеживаемость ПО",
    "Функциональная полнота ПО",
    "Обеспечение последовательности работ",
    "Практичность ПО",
    "Устойчивость к ошибкам данных",
    "Эффективность выполнения транзакций",
    "Степень мотивации персонала",
    "Удобство тестирования ПО"
];

// МАСКА ВЛИЯНИЙ: только значимые связи (i: [j1, j2, ...])
const INFLUENCE_MASK = {
    0:  [1, 5, 6, 7, 8, 9, 10, 12],          // X₁ ← X₂,X₆,X₇,X₈,X₉,X₁₀,X₁₁,X₁₃
    1:  [0, 5, 6, 7, 8, 9, 10, 12],          // X₂ ← X₁,X₆,X₇,X₈,X₉,X₁₀,X₁₁,X₁₃
    2:  [3, 4, 6, 11, 12],                    // X₃ ← X₄,X₅,X₇,X₁₂,X₁₃
    3:  [2, 10, 11],                           // X₄ ← X₃,X₁₁,X₁₂
    4:  [2, 10, 11],                           // X₅ ← X₃,X₁₁,X₁₂
    5:  [0, 1, 2, 10],                         // X₆ ← X₁,X₂,X₃,X₁₁
    6:  [0, 1, 2, 10],                         // X₇ ← X₁,X₂,X₃,X₁₁
    7:  [0, 1, 2, 10],                         // X₈ ← X₁,X₂,X₃,X₁₁
    8:  [0, 1, 2, 10],                         // X₉ ← X₁,X₂,X₃,X₁₁
    9:  [0, 1, 2, 10],                         // X₁₀ ← X₁,X₂,X₃,X₁₁
    10: [12],                                   // X₁₁ ← X₁₃
    11: [12],                                   // X₁₂ ← X₁₃
    12: [],                                     // X₁₃ — только управление p(t)
    13: [12]                                    // X₁₄ ← X₁₃
};

// Z-возмущения: какие Z влияют на каждый X
const Z_MASK = {
    0:  [0, 1, 2, 3, 4],    // X₁: все 5 возмущений
    1:  [0, 1, 2, 3, 4],    // X₂: все 5
    2:  [0, 1, 2],          // X₃: ζ₁,ζ₂,ζ₃
    3:  [0, 1, 4],          // X₄: ζ₁,ζ₂,ζ₅
    4:  [0, 1, 4],          // X₅: ζ₁,ζ₂,ζ₅
    5:  [2, 3],             // X₆: ζ₃,ζ₄
    6:  [2, 3],             // X₇: ζ₃,ζ₄
    7:  [2, 3],             // X₈: ζ₃,ζ₄
    8:  [2, 3],             // X₉: ζ₃,ζ₄
    9:  [2, 3],             // X₁₀: ζ₃,ζ₄
    10: [0, 1, 2, 3, 4],    // X₁₁: все 5
    11: [0, 1, 2, 3, 4],    // X₁₂: все 5
    12: [0, 1, 2, 3, 4],    // X₁₃: все 5
    13: [0, 1, 2, 3, 4]     // X₁₄: все 5
};

const zNames = [
    "Увеличение количества источников новых данных",
    "Частота изменения периодов отчётности",
    "Сокращение поддержки вендора (санкции)",
    "Рост перехода на OpenSource решения",
    "Увеличение новых стандартов OpenSource"
];

// Приглушённая палитра (пастельные тона)
const COLORS = [
    '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#3B1F2B',
    '#006494', '#8B1E3F', '#E55812', '#2D6A4F', '#7B2D8B',
    '#1B98A6', '#D1345B', '#C3830D', '#5B8C5A'
];

function generateXParams() {
    const container = document.getElementById('x-params-container');
    if (!container) return;
    container.innerHTML = `
        <div class="row mb-2 fw-bold text-secondary">
            <div class="col-5">Параметр</div>
            <div class="col-3">Нач. знач (X₀)</div>
            <div class="col-3">Норма (maxX)</div>
        </div>`;
    
    xNames.forEach((name, i) => {
        container.innerHTML += `
            <div class="row mb-2 align-items-center">
                <div class="col-5"><b>X${i+1}</b>: ${name}</div>
                <div class="col-3"><input type="number" id="X0_${i}" value="0.5" step="0.01" class="form-control form-control-sm"></div>
                <div class="col-3"><input type="number" id="norm_${i}" value="1.0" step="0.1" class="form-control form-control-sm"></div>
            </div>`;
    });
}

function generatePolyMatrix() {
    const container = document.getElementById('poly-matrix-container');
    if (!container) return;
    container.innerHTML = '<h5>Коэффициенты полиномов влияния</h5><p class="text-muted small">f(Xⱼ) = a·Xⱼ³ + b·Xⱼ² + c·Xⱼ + d</p>';
    
    let fCounter = 1;
    
    for (let i = 0; i < 14; i++) {
        const influences = INFLUENCE_MASK[i] || [];
        if (influences.length === 0) {
            container.innerHTML += `<div class="alert alert-info py-1 px-2 mb-2"><small>X${i+1} (${xNames[i]}) — только управление p(t), нет X-связей</small></div>`;
            continue;
        }
        
        container.innerHTML += `<h6 class="mt-3 text-secondary border-bottom pb-1">Влияние на X${i+1} — ${xNames[i]}</h6>`;
        
        for (const j of influences) {
            container.innerHTML += `
                <div class="row mb-1 align-items-center py-1" style="font-size:13px;">
                    <div class="col-12">
                        <b>f${fCounter}(X${j+1})</b> = 
                        <span style="display: inline-flex; align-items: center; gap: 1px; flex-wrap: wrap;">
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="0" placeholder="a" step="0.01" style="width:55px;">
                            ·X${j+1}³ +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="1" placeholder="b" step="0.01" style="width:55px;">
                            ·X${j+1}² +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="2" placeholder="c" step="0.01" style="width:55px;">
                            ·X${j+1} +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="3" placeholder="d" step="0.01" style="width:55px;">
                        </span>
                        → <b>X${i+1}</b>
                    </div>
                </div>`;
            fCounter++;
        }
    }
    
    container.innerHTML += `<div class="mt-2 text-muted small">Всего полиномов: <b>${fCounter - 1}</b></div>`;
}

function generateDisturbances() {
    const container = document.getElementById('z-params-container');
    if (!container) return;
    container.innerHTML = '<h5>Возмущения ζₖ(t)</h5><p class="text-muted small">ζₖ(t) = a·t³ + b·t² + c·t + d</p>';
    
    for (let k = 0; k < 5; k++) {
        container.innerHTML += `
            <div class="mb-3 border-bottom pb-2">
                <h6>ζ${k+1}: ${zNames[k]}</h6>
                <div class="d-flex gap-2 flex-wrap">
                    <div><small>a·t³</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="0" value="0" step="0.01" style="width:65px;"></div>
                    <div><small>b·t²</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="1" value="0" step="0.01" style="width:65px;"></div>
                    <div><small>c·t</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="2" value="0" step="0.01" style="width:65px;"></div>
                    <div><small>d</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="3" value="0" step="0.01" style="width:65px;"></div>
                </div>
            </div>`;
    }
}

generateXParams();
generatePolyMatrix();
generateDisturbances();


document.getElementById('randomBtn')?.addEventListener('click', () => {
    document.querySelectorAll('input[id^="X0_"]').forEach(inp => inp.value = (Math.random()).toFixed(2));
    document.querySelectorAll('input[id^="norm_"]').forEach(inp => inp.value = (0.5 + Math.random()).toFixed(2));
    document.querySelectorAll('#poly-matrix-container input[type="number"]').forEach(inp => {
        inp.value = ((Math.random() * 0.1 - 0.05)).toFixed(4);
    });
    document.querySelectorAll('.z-input').forEach(inp => inp.value = (Math.random() * 0.01).toFixed(4));
});

document.getElementById('clearBtn')?.addEventListener('click', () => {
    document.querySelectorAll('input[type="number"]').forEach(inp => inp.value = '0');
    document.querySelectorAll('input[id^="norm_"]').forEach(inp => inp.value = '1.0');
    document.querySelectorAll('input[id^="X0_"]').forEach(inp => inp.value = '0.5');
});