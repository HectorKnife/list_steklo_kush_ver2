// Список имен переменных для удобства
const xNames = [
    "Скорость выработки ленты", "Скорость вращения роликов", "Темп. расплава", 
    "Темп. кожуха", "Темп. бортов", "Стабильность ленты", "Расх. электроэнергии", 
    "Расх. газа", "Расх. атмосферы", "Расх. металла", "Квалиф. оператора", 
    "Размер бригады", "Сложность режима"
];

// Генерация полей для Xi (Параметры)
function generateXParams() {
    const container = document.getElementById('x-params-container');
    container.innerHTML = `
        <div class="row mb-2 fw-bold text-secondary">
            <div class="col-4">Параметр</div>
            <div class="col-2">Нач. знач (X0)</div>
            <div class="col-2">Норма (Norm)</div>
            <div class="col-2">Граница (Border)</div>
        </div>`;
    
    xNames.forEach((name, i) => {
        container.innerHTML += `
            <div class="row mb-2 align-items-center">
                <div class="col-4">X${i+1}: ${name}</div>
                <div class="col-2"><input type="number" id="X0_${i}" value="0.5" class="form-control"></div>
                <div class="col-2"><input type="number" id="norm_${i}" value="1.0" class="form-control"></div>
                <div class="col-2"><input type="number" id="border_${i}" value="1.0" class="form-control"></div>
            </div>`;
    });
}

// Генерация матрицы полиномов 13x13 (Матрица влияния)
function generatePolyMatrix() {
    const container = document.getElementById('poly-matrix-container');
    container.innerHTML = ''; 

    for (let i = 0; i < 13; i++) {
        container.innerHTML += `<h5 class="mt-4 border-bottom">Влияние на X${i+1}</h5>`;
        for (let j = 0; j < 13; j++) {
            container.innerHTML += `
                <div class="row mb-2 align-items-center">
                    <div class="col-2"><b>f${i+1} ← X${j+1}</b></div>
                    <div class="col-2 d-flex align-items-center">
                        <input type="number" class="form-control" data-i="${i}" data-j="${j}" data-c="0" placeholder="a"> 
                        <span class="ms-1">X³</span>
                    </div>
                    <div class="col-2 d-flex align-items-center">
                        <input type="number" class="form-control" data-i="${i}" data-j="${j}" data-c="1" placeholder="b"> 
                        <span class="ms-1">X²</span>
                    </div>
                    <div class="col-2 d-flex align-items-center">
                        <input type="number" class="form-control" data-i="${i}" data-j="${j}" data-c="2" placeholder="c"> 
                        <span class="ms-1">X</span>
                    </div>
                    <div class="col-2"><input type="number" class="form-control" data-i="${i}" data-j="${j}" data-c="3" placeholder="d"></div>
                </div>`;
        }
    }
}

// Генерация возмущений Zk
function generateDisturbances() {
    const container = document.getElementById('z-params-container');
    for (let k = 0; k < 5; k++) {
        container.innerHTML += `
            <div class="mb-3">
                <h5>Возмущение Z${k+1} (a, b, c, d)</h5>
                <div class="d-flex gap-2">
                    <input type="number" class="form-control z-input" data-k="${k}" data-coeff="0" value="0">
                    <input type="number" class="form-control z-input" data-k="${k}" data-coeff="1" value="0">
                    <input type="number" class="form-control z-input" data-k="${k}" data-coeff="2" value="0">
                    <input type="number" class="form-control z-input" data-k="${k}" data-coeff="3" value="0">
                </div>
            </div>`;
    }
}

// Запуск при загрузке
generateXParams();
generatePolyMatrix();
generateDisturbances();

document.getElementById('randomBtn').addEventListener('click', () => {
    //Рандом для Xi (Параметры)
    document.querySelectorAll('input[id^="X0_"], input[id^="norm_"]').forEach(input => {
        input.value = (Math.random()).toFixed(2);
    });

    // ИЗМЕНИТЕ ЭТОТ БЛОК:
    // Генерируем очень маленькие числа, чтобы система не "взрывалась"
    document.querySelectorAll('#poly-matrix-container input').forEach(input => {
        // Диапазон от -0.05 до 0.05 вместо -1 до 1
        input.value = ((Math.random() * 0.1 - 0.05)).toFixed(4); 
    });

    // Рандом для возмущений Zk
    document.querySelectorAll('.z-input').forEach(input => {
        input.value = (Math.random() * 0.01).toFixed(4);
    });
});
document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => input.value = 0);
});