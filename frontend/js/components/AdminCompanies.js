const AdminCompanies = {
  template: `
    <div class="ppa-shell">
      <h2>Companies</h2>
      <p class="text-muted mb-3">Approve, reject, or blacklist registered companies</p>

      <div class="mb-3 d-flex gap-2">
        <select class="form-select" style="max-width:200px;" v-model="statusFilter" @change="load">
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="companies.length === 0" class="empty-state ppa-card">
        <i class="bi bi-building"></i>
        <p class="mt-2">No companies found for this filter.</p>
      </div>
      <div v-else class="ppa-card p-0">
        <table class="table ppa-table mb-0">
          <thead>
            <tr><th>Company</th><th>Email</th><th>HR Contact</th><th>Status</th><th>Account</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in companies" :key="c.id">
              <td>{{ c.company_name }}</td>
              <td>{{ c.email }}</td>
              <td>{{ c.hr_contact || '—' }}</td>
              <td><span class="badge-status" :class="'badge-'+c.approval_status">{{ c.approval_status }}</span></td>
              <td>
                <span class="badge-status" :class="c.is_blacklisted ? 'badge-Inactive' : (c.is_active ? 'badge-Active' : 'badge-Inactive')">
                  {{ c.is_blacklisted ? 'Blacklisted' : (c.is_active ? 'Active' : 'Deactivated') }}
                </span>
              </td>
              <td class="d-flex gap-1 flex-wrap">
                <button v-if="c.approval_status==='Pending'" class="btn btn-sm btn-ppa" @click="approve(c)">Approve</button>
                <button v-if="c.approval_status==='Pending'" class="btn btn-sm btn-outline-ppa" @click="reject(c)">Reject</button>
                <button v-if="!c.is_blacklisted" class="btn btn-sm btn-outline-danger" @click="blacklist(c)">Blacklist</button>
                <button v-else class="btn btn-sm btn-outline-secondary" @click="unblacklist(c)">Un-blacklist</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return { companies: [], loading: true, statusFilter: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/admin/companies", { params: { status: this.statusFilter || undefined } });
        this.companies = res.data;
      } finally {
        this.loading = false;
      }
    },
    async approve(c) {
      await api.put(`/admin/companies/${c.id}/approve`);
      this.load();
    },
    async reject(c) {
      await api.put(`/admin/companies/${c.id}/reject`);
      this.load();
    },
    async blacklist(c) {
      if (!confirm(`Blacklist ${c.company_name}?`)) return;
      await api.put(`/admin/users/${c.user_id}/blacklist`);
      this.load();
    },
    async unblacklist(c) {
      await api.put(`/admin/users/${c.user_id}/unblacklist`);
      this.load();
    },
  },
};
