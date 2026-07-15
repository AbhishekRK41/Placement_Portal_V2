const StudentApplications = {
  template: `
    <div class="ppa-shell">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">My Applications</h2>
        <button class="btn btn-outline-ppa btn-sm" @click="exportCsv" :disabled="exporting">
          {{ exporting ? 'Preparing export...' : 'Export as CSV' }}
        </button>
      </div>

      <div v-if="exportMsg" class="alert-ppa-success mb-3">
        {{ exportMsg }} <a v-if="downloadUrl" :href="downloadUrl" target="_blank">Download file</a>
      </div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="applications.length === 0" class="empty-state ppa-card">
        <i class="bi bi-send"></i>
        <p class="mt-2">You haven't applied to any placement drives yet.</p>
      </div>
      <div v-else class="ppa-card p-0">
        <table class="table ppa-table mb-0">
          <thead><tr><th>Company</th><th>Job Title</th><th>Applied On</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="a in applications" :key="a.id">
              <td>{{ a.company_name }}</td>
              <td>{{ a.job_title }}</td>
              <td>{{ new Date(a.application_date).toLocaleDateString() }}</td>
              <td><span class="badge-status" :class="'badge-'+a.status">{{ a.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return { applications: [], loading: true, exporting: false, exportMsg: "", downloadUrl: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/student/applications");
        this.applications = res.data;
      } finally {
        this.loading = false;
      }
    },
    async exportCsv() {
      this.exporting = true;
      this.exportMsg = "";
      this.downloadUrl = "";
      try {
        const res = await api.post("/student/export");
        const taskId = res.data.task_id;
        this.pollExport(taskId);
      } catch (e) {
        this.exportMsg = "Failed to start export";
        this.exporting = false;
      }
    },
    async pollExport(taskId) {
      const check = async () => {
        const res = await api.get(`/student/export/status/${taskId}`);
        if (res.data.state === "SUCCESS") {
          const filename = res.data.result.filename;
          this.downloadUrl = `http://localhost:5000/api/student/export/download/${filename}`;
          this.exportMsg = "Export ready!";
          this.exporting = false;
        } else if (res.data.state === "FAILURE") {
          this.exportMsg = "Export failed.";
          this.exporting = false;
        } else {
          setTimeout(check, 1500);
        }
      };
      check();
    },
  },
};
