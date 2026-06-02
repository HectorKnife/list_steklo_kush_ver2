let lineChart = null;
let radarChart = null;

function updateCharts(res) {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    const ctxRadar = document.getElementById('radarChart').getContext('2d');

    // Линейный график
    const datasets = res.X.map((data, i) => ({
        label: `X${i+1}: ${xNames[i]}`,
        data: data,
        borderColor: COLORS[i],
        backgroundColor: COLORS[i] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 1
    }));

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: { 
            labels: res.time.map(t => t.toFixed(2)), 
            datasets: datasets 
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 8,
                        font: { size: 11 },
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((ds, i) => ({
                                text: `X${i+1}`,
                                fillStyle: ds.borderColor,
                                strokeStyle: ds.borderColor,
                                lineWidth: 2,
                                hidden: false,
                                index: i,
                                pointStyle: 'line'
                            }));
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return `X${ctx.datasetIndex+1}: ${ctx.raw.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: { 
                x: { title: { display: true, text: 'Время' } },
                y: { min: 0, max: 1, title: { display: true, text: 'Значение' } } 
            }
        }
    });

    // Радарная диаграмма
    const midIdx = Math.floor(res.time.length / 2);
    const endIdx = res.time.length - 1;

    const radarColors = [
        'rgba(91, 140, 90, 0.3)',
        'rgba(107, 123, 140, 0.3)',
        'rgba(140, 107, 107, 0.3)'
    ];
    const radarBorders = ['#5B8C5A', '#6B7B8C', '#8C6B6B'];

    const radarData = [
        { label: 't=0', data: res.X.map(row => row[0]), color: radarColors[0], border: radarBorders[0] },
        { label: `t=${res.time[midIdx].toFixed(1)}`, data: res.X.map(row => row[midIdx]), color: radarColors[1], border: radarBorders[1] },
        { label: `t=${res.time[endIdx].toFixed(1)}`, data: res.X.map(row => row[endIdx]), color: radarColors[2], border: radarBorders[2] }
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
                borderColor: d.border,
                borderWidth: 2,
                pointRadius: 2
            }))
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return `X${ctx.dataIndex+1}: ${ctx.raw.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: { r: { min: 0, max: 1 } }
        }
    });
}