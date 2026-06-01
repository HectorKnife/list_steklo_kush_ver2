let lineChart = null;
let radarChart = null;

function updateCharts(res) {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    const ctxRadar = document.getElementById('radarChart').getContext('2d');

    // 1. Линейный график (все X_i от 0 до 1)
    const datasets = res.X.map((data, i) => ({
        label: `X${i + 1}`,
        data: data,
        borderWidth: 2,
        fill: false
    }));

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctxLine, {
    type: 'line',
    data: { labels: res.time.map(t => t.toFixed(2)), datasets: datasets },
    options: {
        scales: { 
            y: { min: 0, max: 1 } // Оставьте только Y
            // Удалите блок x: { min: 0, max: 1 }
        },
        responsive: true
    }
    });

    // 2. Радарная диаграмма (временные срезы)
    // Возьмем срез в 3-х точках: t=0, t=mid, t=end
    const midIdx = Math.floor(res.time.length / 2);
    const endIdx = res.time.length - 1;

    // Подготавливаем данные для 3-х точек во времени
    const radarData = [
        { label: 't=0', data: res.X.map(row => row[0]), color: 'rgba(253, 67, 67, 0.5)' },
        { label: `t=${res.time[midIdx].toFixed(1)}`, data: res.X.map(row => row[midIdx]), color: 'rgba(54, 162, 235, 0.5)' },
        { label: `t=${res.time[endIdx].toFixed(1)}`, data: res.X.map(row => row[endIdx]), color: 'rgba(251, 226, 0, 0.5)' }
    ];

    if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: Array.from({length: 13}, (_, i) => `X${i+1}`),
            datasets: radarData.map(d => ({
                label: d.label,
                data: d.data,
                backgroundColor: d.color,
                borderColor: d.color.replace('0.5', '1'), 
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            scales: { r: { min: 0, max: 1 } }
        }
    });
}