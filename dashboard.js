// Demo data for KPIs and charts
const kpiData = {
    month: {
        customers: { value: 120, change: 12, up: true },
        revenue: { value: 3449, change: 8, up: true },
        expenses: { value: 1250.46, change: 3, up: false },
        profit: { value: 2198.54, change: 10, up: true },
        pie: [99, 150, 200, 3000],
        bar: [99, 150, 200, 3000],
        barLabels: ['99', '150', '200', '3000']
    },
    week: {
        customers: { value: 30, change: 5, up: true },
        revenue: { value: 900, change: 2, up: true },
        expenses: { value: 400, change: 1, up: false },
        profit: { value: 500, change: 3, up: true },
        pie: [25, 25, 25, 25],
        bar: [1, 1, 1, 1],
        barLabels: ['Mon', 'Tue', 'Wed', 'Thu']
    }
};

const periodSelector = document.getElementById('periodSelector');
const kpiCustomers = document.getElementById('kpiCustomers');
const kpiCustomersChange = document.getElementById('kpiCustomersChange');
const kpiRevenue = document.getElementById('kpiRevenue');
kpiRevenueChange = document.getElementById('kpiRevenueChange');
const kpiExpenses = document.getElementById('kpiExpenses');
const kpiExpensesChange = document.getElementById('kpiExpensesChange');
const kpiProfit = document.getElementById('kpiProfit');
const kpiProfitChange = document.getElementById('kpiProfitChange');

let currentPeriod = periodSelector.value;

function updateKPIs() {
    const data = kpiData[currentPeriod];
    kpiCustomers.textContent = data.customers.value;
    kpiCustomersChange.className = 'kpi-change ' + (data.customers.up ? 'up' : 'down');
    kpiCustomersChange.innerHTML = `<i class="fas fa-arrow-${data.customers.up ? 'up' : 'down'}"></i> <span>${data.customers.change}%</span>`;
    kpiRevenue.textContent = `$${data.revenue.value.toLocaleString()}`;
    kpiRevenueChange.className = 'kpi-change ' + (data.revenue.up ? 'up' : 'down');
    kpiRevenueChange.innerHTML = `<i class="fas fa-arrow-${data.revenue.up ? 'up' : 'down'}"></i> <span>${data.revenue.change}%</span>`;
    kpiExpenses.textContent = `$${data.expenses.value.toLocaleString()}`;
    kpiExpensesChange.className = 'kpi-change ' + (data.expenses.up ? 'up' : 'down');
    kpiExpensesChange.innerHTML = `<i class="fas fa-arrow-${data.expenses.up ? 'up' : 'down'}"></i> <span>${data.expenses.change}%</span>`;
    kpiProfit.textContent = `$${data.profit.value.toLocaleString()}`;
    kpiProfitChange.className = 'kpi-change ' + (data.profit.up ? 'up' : 'down');
    kpiProfitChange.innerHTML = `<i class="fas fa-arrow-${data.profit.up ? 'up' : 'down'}"></i> <span>${data.profit.change}%</span>`;
}

periodSelector.addEventListener('change', function() {
    currentPeriod = this.value;
    updateKPIs();
    updateCharts();
});

// Chart.js setup
let pieChart, barChart;
function updateCharts() {
    const data = kpiData[currentPeriod];
    // Pie chart
    if (!pieChart) {
        pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: data.pie.map((v, i) => `${data.pie[i]}: 25%`),
                datasets: [{
                    data: data.pie,
                    backgroundColor: ['#4285f4', '#fbbc04', '#a259f7', '#e2445c']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    } else {
        pieChart.data.datasets[0].data = data.pie;
        pieChart.data.labels = data.pie.map((v, i) => `${data.pie[i]}: 25%`);
        pieChart.update();
    }
    // Bar chart
    if (!barChart) {
        barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.barLabels,
                datasets: [{
                    label: 'Count',
                    data: data.bar,
                    backgroundColor: '#4285f4',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    } else {
        barChart.data.labels = data.barLabels;
        barChart.data.datasets[0].data = data.bar;
        barChart.update();
    }
}

// Drag-and-drop with Sortable.js
const dashboardWidgets = document.getElementById('dashboardWidgets');
const widgetOrderKey = 'dashboardWidgetOrder';
function saveWidgetOrder() {
    const order = Array.from(dashboardWidgets.children).map(w => w.getAttribute('data-widget'));
    localStorage.setItem(widgetOrderKey, JSON.stringify(order));
}
function loadWidgetOrder() {
    const order = JSON.parse(localStorage.getItem(widgetOrderKey) || '[]');
    if (order.length) {
        const widgets = {};
        Array.from(dashboardWidgets.children).forEach(w => {
            widgets[w.getAttribute('data-widget')] = w;
        });
        order.forEach(key => {
            if (widgets[key]) dashboardWidgets.appendChild(widgets[key]);
        });
    }
}
Sortable.create(dashboardWidgets, {
    animation: 200,
    onEnd: saveWidgetOrder
});

// Initial load
loadWidgetOrder();
updateKPIs();
updateCharts(); 