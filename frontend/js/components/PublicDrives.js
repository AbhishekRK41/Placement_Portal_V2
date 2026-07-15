const PublicDrives = {
  template: `
    <div class="ppa-shell">
      <h2>Open Placement Drives</h2>
      <p class="text-muted">Browse currently approved drives. Sign in as a student to apply.</p>

      <div class="mb-3" style="max-width:340px;">
        <input class="form-control" v-model="search" @input="load" placeholder="Search by job title..." />
      </div>

      <div v-if="loading" class="text-muted">Loading drives...</div>

      <div v-else-if="drives.length === 0" class="empty-state ppa-card">
        <i class="bi bi-inboxes"></i>
        <p class="mt-2">No approved drives available right now.</p>
      </div>

      <div v-else class="row">
        <div class="col-md-6" v-for="d in drives" :key="d.id">
          <div class="ppa-card">
            <div class="d-flex justify-content-between">
              <h5 class="mb-1">{{ d.job_title }}</h5>
              <span class="badge-status badge-Approved">Open</span>
            </div>
            <p class="text-muted mb-1" style="font-size:0.85rem;">{{ d.company_name }}</p>
            <p class="mb-2" style="font-size:0.9rem;">{{ (d.job_description || '').slice(0,140) }}<span v-if="(d.job_description||'').length>140">...</span></p>
            <p class="text-muted mb-0" style="font-size:0.8rem;">
              Deadline: {{ new Date(d.application_deadline).toLocaleDateString() }} &middot; {{ d.applicant_count }} applicants
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { drives: [], loading: true, search: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/drives", { params: { search: this.search } });
        this.drives = res.data;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
