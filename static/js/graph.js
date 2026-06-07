let lineChart = null;
let radarCharts = [null, null, null];

function updateCharts(res) {
    // ========================================
    // 1. ЛИНЕЙНЫЙ ГРАФИК (все X подписаны)
    // ========================================
    const ctxLine = document.getElementById('lineChart');
    if (!ctxLine) return;
    
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
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 6,
                        font: { size: 10 },
                        boxWidth: 12,
                        boxHeight: 3,
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((ds, i) => ({
                                text: `X${i+1} — ${xNames[i]}`,
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
                            const i = ctx.datasetIndex;
                            return `X${i+1} (${xNames[i]}): ${ctx.raw.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: { 
                x: { 
                    title: { 
                        display: true, 
                        text: 'Время (t)' 
                    } 
                },
                y: { 
                    min: 0, 
                    max: 1, 
                    title: { 
                        display: true, 
                        text: 'Значение (нормированное)' 
                    } 
                } 
            }
        }
    });

    // ========================================
    // 2. ТРИ РАДАРНЫЕ ДИАГРАММЫ
    // ========================================
    
    // Индексы для t=0, t=середина, t=конец
    const timeIndices = [
        { idx: 0, label: `t = 0` },
        { idx: Math.floor(res.time.length / 2), label: `t = ${res.time[Math.floor(res.time.length/2)].toFixed(1)}` },
        { idx: res.time.length - 1, label: `t = ${res.time[res.time.length-1].toFixed(1)}` }
    ];
    
    const radarColors = [
        { bg: 'rgba(91, 140, 90, 0.3)', border: '#5B8C5A' },
        { bg: 'rgba(107, 123, 140, 0.3)', border: '#6B7B8C' },
        { bg: 'rgba(140, 107, 107, 0.3)', border: '#8C6B6B' }
    ];

    timeIndices.forEach((t, chartIdx) => {
        const canvasId = `radarChart${chartIdx}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Уничтожаем старый график
        if (radarCharts[chartIdx]) {
            radarCharts[chartIdx].destroy();
        }

        radarCharts[chartIdx] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Array.from({length: 13}, (_, i) => `X${i+1}`),
                datasets: [{
                    label: t.label,
                    data: res.X.map(row => row[t.idx]),
                    backgroundColor: radarColors[chartIdx].bg,
                    borderColor: radarColors[chartIdx].border,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: radarColors[chartIdx].border
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: t.label,
                        font: { size: 14, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const i = ctx.dataIndex;
                                return `X${i+1} (${xNames[i]}): ${ctx.raw.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: { 
                    r: { 
                        min: 0, 
                        max: 1,
                        ticks: {
                            stepSize: 0.2,
                            backdropColor: 'transparent'
                        }
                    } 
                }
            }
        });
    });
}