const CompanyDriveApplications = {
  template: `
    <div class="ppa-shell">
      <h2>Applicants</h2>
      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="applications.length === 0" class="empty-state ppa-card">
        <i class="bi bi-person-x"></i>
        <p class="mt-2">No students have applied to this drive yet.</p>
      </div>
      <div v-else class="ppa-card p-0">
        <table class="table ppa-table mb-0">
          <thead><tr><th>Student</th><th>Email</th><th>Resume</th><th>Applied On</th><th>Status</th><th>Update Status</th></tr></thead>
          <tbody>
            <tr v-for="a in applications" :key="a.id">
              <td>{{ a.student_name }}</td>
              <td>{{ a.student_email }}</td>
              <td>
                <a v-if="a.resume_path" :href="'http://localhost:5000/api/student/resume/' + a.resume_path" target="_blank">Download</a>
                <span v-else class="text-muted">—</span>
              </td>
              <td>{{ new Date(a.application_date).toLocaleDateString() }}</td>
              <td><span class="badge-status" :class="'badge-'+a.status">{{ a.status }}</span></td>
              <td>
                <select class="form-select form-select-sm" style="max-width:160px;" :value="a.status" @change="updateStatus(a, $event.target.value)">
                  <option>Shortlisted</option>
                  <option>Selected</option>
                  <option>Rejected</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return { applications: [], loading: true };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const driveId = this.$route.params.id;
        const res = await api.get(`/company/drives/${driveId}/applications`);
        this.applications = res.data;
      } finally {
        this.loading = false;
      }
    },
    async updateStatus(app, newStatus) {
      await api.put(`/company/applications/${app.id}/status`, { status: newStatus });
      this.load();
    },
  },
};
