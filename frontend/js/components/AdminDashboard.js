const AdminDashboard = {
  template: `
    <div class="ppa-shell">
      <h2>Admin Dashboard</h2>
      <p class="text-muted mb-4">Overview of the institute's placement activity</p>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else class="row g-3">
        <div class="col-md-3 col-6">
          <div class="stat-tile">
            <div class="stat-num">{{ stats.total_students }}</div>
            <div class="stat-label">Students</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile">
            <div class="stat-num">{{ stats.total_companies }}</div>
            <div class="stat-label">Companies</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile">
            <div class="stat-num">{{ stats.total_placement_drives }}</div>
            <div class="stat-label">Placement Drives</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile">
            <div class="stat-num">{{ stats.total_applications }}</div>
            <div class="stat-label">Applications</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile" style="border-left-color:#C97F1E;">
            <div class="stat-num">{{ stats.pending_company_approvals }}</div>
            <div class="stat-label">Pending Company Approvals</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile" style="border-left-color:#C97F1E;">
            <div class="stat-num">{{ stats.pending_drive_approvals }}</div>
            <div class="stat-label">Pending Drive Approvals</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-tile" style="border-left-color:#3E8E5A;">
            <div class="stat-num">{{ stats.total_selected }}</div>
            <div class="stat-label">Students Selected</div>
          </div>
        </div>
      </div>

      <div class="mt-4 d-flex gap-2">
        <router-link class="btn btn-ppa" to="/admin/companies">Review Companies</router-link>
        <router-link class="btn btn-outline-ppa" to="/admin/drives">Review Drives</router-link>
        <router-link class="btn btn-outline-ppa" to="/admin/students">Manage Students</router-link>
      </div>
    </div>
  `,
  data() {
    return { stats: {}, loading: true };
  },
  async mounted() {
    try {
      const res = await api.get("/admin/dashboard");
      this.stats = res.data;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  },
};
