const CompanyDashboard = {
  template: `
    <div class="ppa-shell">
      <h2>Company Dashboard</h2>

      <div v-if="loading" class="text-muted">Loading...</div>
      <template v-else-if="data">
        <div v-if="data.company.approval_status !== 'Approved'" class="alert-ppa-error mb-3">
          Your company is <b>{{ data.company.approval_status }}</b>. You must be approved by admin before creating placement drives.
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ data.total_drives }}</div>
              <div class="stat-label">Placement Drives Created</div>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ totalApplicants }}</div>
              <div class="stat-label">Total Applicants</div>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ data.company.approval_status }}</div>
              <div class="stat-label">Approval Status</div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Your Placement Drives</h5>
          <router-link class="btn btn-ppa btn-sm" to="/company/create-drive">+ New Drive</router-link>
        </div>

        <div v-if="data.created_drives.length === 0" class="empty-state ppa-card">
          <i class="bi bi-briefcase"></i>
          <p class="mt-2">You haven't created any drives yet.</p>
        </div>
        <div v-else class="ppa-card p-0">
          <table class="table ppa-table mb-0">
            <thead><tr><th>Job Title</th><th>Deadline</th><th>Applicants</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr v-for="d in data.created_drives" :key="d.id">
                <td>{{ d.job_title }}</td>
                <td>{{ new Date(d.application_deadline).toLocaleDateString() }}</td>
                <td>{{ d.applicant_count }}</td>
                <td><span class="badge-status" :class="'badge-'+d.status">{{ d.status }}</span></td>
                <td><router-link :to="'/company/drives/'+d.id+'/applications'" class="btn btn-sm btn-outline-ppa">View Applicants</router-link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  `,
  data() {
    return { data: null, loading: true };
  },
  computed: {
    totalApplicants() {
      if (!this.data) return 0;
      return this.data.created_drives.reduce((sum, d) => sum + d.applicant_count, 0);
    },
  },
  async mounted() {
    try {
      const res = await api.get("/company/dashboard");
      this.data = res.data;
    } finally {
      this.loading = false;
    }
  },
};
