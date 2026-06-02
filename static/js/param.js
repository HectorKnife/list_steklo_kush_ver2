// Список имен переменных
const xNames = [
    "Скорость выработки ленты", "Скорость вращения роликов", "Темп. расплава", 
    "Темп. кожуха", "Темп. бортов", "Стабильность ленты", "Расх. электроэнергии", 
    "Расх. газа", "Расх. атмосферы", "Расх. металла", "Квалиф. оператора", 
    "Размер бригады", "Сложность режима"
];

// МАСКА ВЛИЯНИЙ: только значимые связи (i: [j1, j2, ...])
const INFLUENCE_MASK = {
    0:  [1, 5, 6, 7, 8, 9, 10, 12],           // X1
    1:  [0, 5, 6, 7, 8, 9, 10, 12],           // X2
    2:  [3, 4, 6, 7, 9, 12],                   // X3
    3:  [2, 4, 6, 7],                           // X4
    4:  [2, 3, 6, 7],                           // X5
    5:  [0, 1, 10, 11, 12],                     // X6
    6:  [0, 1, 2, 3, 4, 10, 12],               // X7
    7:  [2, 3, 4, 10, 12],                      // X8
    8:  [5, 10, 12],                             // X9
    9:  [2, 3, 4],                               // X10
    10: [0, 1, 5, 11, 12],                      // X11
    11: [0, 5, 10, 12],                          // X12
    12: [0, 10, 11]                              // X13
};

// Z-возмущения: какие Z влияют на каждый X
const Z_MASK = {
    0:  [0, 1, 2, 4],    // X1: Z1,Z2,Z3,Z5
    1:  [0, 1, 2, 4],    // X2: Z1,Z2,Z3,Z5
    2:  [0, 1, 4],       // X3: Z1,Z2,Z5
    3:  [0, 1, 3, 4],    // X4: Z1,Z2,Z4,Z5
    4:  [0, 1, 3, 4],    // X5: Z1,Z2,Z4,Z5
    5:  [0, 1, 3, 4],    // X6: Z1,Z2,Z4,Z5
    6:  [0, 4],          // X7: Z1,Z5
    7:  [1],             // X8: Z2
    8:  [2, 4],          // X9: Z3,Z5
    9:  [4],             // X10: Z5
    10: [0, 1, 2, 3, 4], // X11: все Z
    11: [0, 1, 2, 4],    // X12: Z1,Z2,Z3,Z5
    12: [0, 1, 2, 4]     // X13: Z1,Z2,Z3,Z5
};

const zNames = [
    "Отключение электроэнергии",
    "Отключение природного газа", 
    "Прекращение подачи защитной атмосферы",
    "Параметры внешней среды",
    "Износ и отказ оборудования"
];

// Приглушённая палитра (пастельные тона)
const COLORS = [
    '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#3B1F2B',
    '#006494', '#8B1E3F', '#E55812', '#2D6A4F', '#7B2D8B',
    '#1B98A6', '#D1345B', '#C3830D'
];

function generateXParams() {
    const container = document.getElementById('x-params-container');
    container.innerHTML = `
        <div class="row mb-2 fw-bold text-secondary">
            <div class="col-4">Параметр</div>
            <div class="col-2">Нач. знач (X₀)</div>
            <div class="col-2">Норма (Norm)</div>
        </div>`;
    
    xNames.forEach((name, i) => {
        container.innerHTML += `
            <div class="row mb-2 align-items-center">
                <div class="col-4">X${i+1}: ${name}</div>
                <div class="col-2"><input type="number" id="X0_${i}" value="0.5" step="0.01" class="form-control"></div>
                <div class="col-2"><input type="number" id="norm_${i}" value="1.0" step="0.1" class="form-control"></div>
            </div>`;
    });
}

function generatePolyMatrix() {
    const container = document.getElementById('poly-matrix-container');
    container.innerHTML = '<h5>Коэффициенты полиномов f(Xⱼ) = a·X³ + b·X² + c·X + d</h5>';
    
    let fCounter = 1;
    
    for (let i = 0; i < 13; i++) {
        const influences = INFLUENCE_MASK[i] || [];
        if (influences.length === 0) continue;
        
        container.innerHTML += `<h6 class="mt-3 text-secondary">Влияние на X${i+1} (${xNames[i]}):</h6>`;
        
        for (const j of influences) {
            container.innerHTML += `
                <div class="row mb-2 align-items-center border-bottom pb-2">
                    <div class="col-12 mb-1"><b>f${fCounter}(X${j+1})</b> = 
                        <span style="display: inline-flex; align-items: center; gap: 2px;">
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="0" placeholder="a" step="0.01" style="width:60px;">
                            ·X${j+1}³ +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="1" placeholder="b" step="0.01" style="width:60px;">
                            ·X${j+1}² +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="2" placeholder="c" step="0.01" style="width:60px;">
                            ·X${j+1} +
                            <input type="number" class="form-control form-control-sm" data-i="${i}" data-j="${j}" data-c="3" placeholder="d" step="0.01" style="width:60px;">
                        </span>
                        → <b>X${i+1}</b>
                    </div>
                </div>`;
            fCounter++;
        }
    }
}

function generateDisturbances() {
    const container = document.getElementById('z-params-container');
    container.innerHTML = '<h5>Возмущения Zₖ(t) = a·t³ + b·t² + c·t + d</h5>';
    
    for (let k = 0; k < 5; k++) {
        container.innerHTML += `
            <div class="mb-3 border-bottom pb-2">
                <h6>Z${k+1}: ${zNames[k]}</h6>
                <div class="d-flex gap-2">
                    <div><small>a·t³</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="0" value="0" step="0.01"></div>
                    <div><small>b·t²</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="1" value="0" step="0.01"></div>
                    <div><small>c·t</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="2" value="0" step="0.01"></div>
                    <div><small>d</small><input type="number" class="form-control form-control-sm z-input" data-k="${k}" data-coeff="3" value="0" step="0.01"></div>
                </div>
            </div>`;
    }
}

generateXParams();
generatePolyMatrix();
generateDisturbances();

document.getElementById('randomBtn').addEventListener('click', () => {
    document.querySelectorAll('input[id^="X0_"]').forEach(input => {
        input.value = (Math.random()).toFixed(2);
    });
    document.querySelectorAll('input[id^="norm_"]').forEach(input => {
        input.value = (0.5 + Math.random()).toFixed(2);
    });
    document.querySelectorAll('#poly-matrix-container input').forEach(input => {
        input.value = ((Math.random() * 0.1 - 0.05)).toFixed(4);
    });
    document.querySelectorAll('.z-input').forEach(input => {
        input.value = (Math.random() * 0.01).toFixed(4);
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => input.value = '0');
});