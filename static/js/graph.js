let lineChart = null;
let radarCharts = [null, null, null];

function destroyChart(chart) {
    if (chart) chart.destroy();
}

function shortName(index) {
    return `X${index + 1}`;
}

function updateResultMeta(res) {
    const meta = document.getElementById("resultMeta");
    if (!meta) return;
    const lastTime = res.time[res.time.length - 1];
    meta.textContent = `${res.time.length} точек, t = ${lastTime.toFixed(2)}`;
}

function buildLineChart(res) {
    const canvas = document.getElementById("lineChart");
    if (!canvas) return;

    const datasets = res.X.map((values, i) => ({
        label: `${shortName(i)}: ${xNames[i]}`,
        data: values,
        borderColor: COLORS[i],
        backgroundColor: `${COLORS[i]}22`,
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4
    }));

    destroyChart(lineChart);
    lineChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: res.time.map(t => t.toFixed(2)),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        boxWidth: 28,
                        boxHeight: 3,
                        padding: 10,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            const i = ctx.datasetIndex;
                            return `${shortName(i)} (${xNames[i]}): ${ctx.raw.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: "Время t" },
                    grid: { color: "#eef2f5" }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: { display: true, text: "Нормированное значение" },
                    grid: { color: "#eef2f5" }
                }
            }
        }
    });
}

function buildRadarCharts(res) {
    const snapshots = [
        { idx: 0, label: "t = 0" },
        {
            idx: Math.floor(res.time.length / 2),
            label: `t = ${res.time[Math.floor(res.time.length / 2)].toFixed(2)}`
        },
        {
            idx: res.time.length - 1,
            label: `t = ${res.time[res.time.length - 1].toFixed(2)}`
        }
    ];

    const radarColors = [
        { bg: "rgba(35, 100, 170, 0.20)", border: "#2364AA" },
        { bg: "rgba(115, 191, 184, 0.24)", border: "#32827D" },
        { bg: "rgba(234, 115, 23, 0.20)", border: "#B85612" }
    ];

    snapshots.forEach((snapshot, chartIndex) => {
        const canvas = document.getElementById(`radarChart${chartIndex}`);
        if (!canvas) return;

        destroyChart(radarCharts[chartIndex]);
        radarCharts[chartIndex] = new Chart(canvas, {
            type: "radar",
            data: {
                labels: Array.from({ length: VARIABLE_COUNT }, (_, i) => shortName(i)),
                datasets: [{
                    label: snapshot.label,
                    data: res.X.map(row => row[snapshot.idx]),
                    backgroundColor: radarColors[chartIndex].bg,
                    borderColor: radarColors[chartIndex].border,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: radarColors[chartIndex].border
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: snapshot.label,
                        font: { size: 14, weight: "bold" }
                    },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const i = ctx.dataIndex;
                                return `${shortName(i)} (${xNames[i]}): ${ctx.raw.toFixed(4)}`;
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
                            backdropColor: "transparent"
                        },
                        grid: { color: "#dde5ec" },
                        angleLines: { color: "#dde5ec" }
                    }
                }
            }
        });
    });
}

function updateCharts(res) {
    if (typeof Chart === "undefined") {
        setStatus("Chart.js не найден.", "error");
        return;
    }

    updateResultMeta(res);
    buildLineChart(res);
    buildRadarCharts(res);
}
