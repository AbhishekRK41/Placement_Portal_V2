const AdminReports = {
  template: `
    <div class="ppa-shell">
      <h2>Placement Reports</h2>
      <p class="text-muted mb-4">Statistics on applications and company activity</p>

    <div v-if="hasData" class="row">
      <div class="col-md-6">
        <div class="ppa-card">
          <h5>Application Status Breakdown</h5>
          <canvas id="statusChart" height="220"></canvas>
        </div>
      </div>
      <div class="col-md-6">
        <div class="ppa-card">
          <h5>Drives per Company</h5>
          <canvas id="companyChart" height="220"></canvas>
        </div>
      </div>
    </div>
    <div v-else class="empty-state ppa-card">
      <p>No placement data yet — approve a company and drive, then have a student apply, to see charts here.</p>
    </div>
  `,
  data() {
    return { stats: null, hasData: false };
  },
  async mounted() {
    const res = await api.get("/admin/reports/stats");
    this.stats = res.data;
    this.hasData = Object.values(this.stats.application_status_breakdown).some(v => v > 0)
      || this.stats.drives_per_company.length > 0;
    if (this.hasData) {
      // wait one tick so the canvas elements actually exist in the DOM before Chart.js touches them
      this.$nextTick(() => this.renderCharts());
    }
  },
  methods: {
    renderCharts() {
      const statusCtx = document.getElementById("statusChart");
      new Chart(statusCtx, {
        type: "doughnut",
        data: {
          labels: Object.keys(this.stats.application_status_breakdown),
          datasets: [{
            data: Object.values(this.stats.application_status_breakdown),
            backgroundColor: ["#E8A33D", "#33538F", "#3E8E5A", "#C1443C"],
          }],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });

      const companyCtx = document.getElementById("companyChart");
      new Chart(companyCtx, {
        type: "bar",
        data: {
          labels: this.stats.drives_per_company.map(c => c.company_name),
          datasets: [{
            label: "Drives",
            data: this.stats.drives_per_company.map(c => c.drive_count),
            backgroundColor: "#1E2A44",
          }],
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      });
    },
  },
};
