const AdminDrives = {
  template: `
    <div class="ppa-shell">
      <h2>Placement Drives</h2>
      <p class="text-muted mb-3">Approve or reject drives created by companies</p>

      <div class="mb-3 d-flex gap-2">
        <select class="form-select" style="max-width:200px;" v-model="statusFilter" @change="load">
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="drives.length === 0" class="empty-state ppa-card">
        <i class="bi bi-briefcase"></i>
        <p class="mt-2">No drives found for this filter.</p>
      </div>
      <div v-else class="ppa-card p-0">
        <table class="table ppa-table mb-0">
          <thead>
            <tr><th>Job Title</th><th>Company</th><th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in drives" :key="d.id">
              <td>{{ d.job_title }}</td>
              <td>{{ d.company_name }}</td>
              <td>{{ new Date(d.application_deadline).toLocaleDateString() }}</td>
              <td>{{ d.applicant_count }}</td>
              <td><span class="badge-status" :class="'badge-'+d.status">{{ d.status }}</span></td>
              <td class="d-flex gap-1">
                <button v-if="d.status==='Pending'" class="btn btn-sm btn-ppa" @click="approve(d)">Approve</button>
                <button v-if="d.status==='Pending'" class="btn btn-sm btn-outline-ppa" @click="reject(d)">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return { drives: [], loading: true, statusFilter: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/admin/drives", { params: { status: this.statusFilter || undefined } });
        this.drives = res.data;
      } finally {
        this.loading = false;
      }
    },
    async approve(d) {
      await api.put(`/admin/drives/${d.id}/approve`);
      this.load();
    },
    async reject(d) {
      await api.put(`/admin/drives/${d.id}/reject`);
      this.load();
    },
  },
};
