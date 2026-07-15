const AdminStudents = {
  template: `
    <div class="ppa-shell">
      <h2>Students</h2>
      <p class="text-muted mb-3">Search, view, and manage student accounts</p>

      <div class="mb-3" style="max-width:340px;">
        <input class="form-control" v-model="search" @input="load" placeholder="Search by name or branch..." />
      </div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="students.length === 0" class="empty-state ppa-card">
        <i class="bi bi-people"></i>
        <p class="mt-2">No students found.</p>
      </div>
      <div v-else class="ppa-card p-0">
        <table class="table ppa-table mb-0">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Account</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in students" :key="s.id">
              <td>{{ s.full_name }}</td>
              <td>{{ s.email }}</td>
              <td>{{ s.branch || '—' }}</td>
              <td>{{ s.year || '—' }}</td>
              <td>{{ s.cgpa ?? '—' }}</td>
              <td>
                <span class="badge-status" :class="s.is_blacklisted ? 'badge-Inactive' : (s.is_active ? 'badge-Active' : 'badge-Inactive')">
                  {{ s.is_blacklisted ? 'Blacklisted' : (s.is_active ? 'Active' : 'Deactivated') }}
                </span>
              </td>
              <td class="d-flex gap-1">
                <button v-if="!s.is_blacklisted" class="btn btn-sm btn-outline-danger" @click="blacklist(s)">Blacklist</button>
                <button v-else class="btn btn-sm btn-outline-secondary" @click="unblacklist(s)">Un-blacklist</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return { students: [], loading: true, search: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/admin/students", { params: { search: this.search } });
        this.students = res.data;
      } finally {
        this.loading = false;
      }
    },
    async blacklist(s) {
      if (!confirm(`Blacklist ${s.full_name}?`)) return;
      await api.put(`/admin/users/${s.user_id}/blacklist`);
      this.load();
    },
    async unblacklist(s) {
      await api.put(`/admin/users/${s.user_id}/unblacklist`);
      this.load();
    },
  },
};
