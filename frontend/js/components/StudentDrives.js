const StudentDrives = {
  template: `
    <div class="ppa-shell">
      <h2>Browse Placement Drives</h2>

      <div class="mb-3 d-flex gap-2" style="max-width:520px;">
        <input class="form-control" v-model="search" @input="load" placeholder="Search job title..." />
        <input class="form-control" v-model="branch" @input="load" placeholder="Filter by branch..." />
      </div>

      <div v-if="msg" class="alert-ppa-success mb-3">{{ msg }}</div>
      <div v-if="err" class="alert-ppa-error mb-3">{{ err }}</div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="drives.length === 0" class="empty-state ppa-card">
        <i class="bi bi-inboxes"></i>
        <p class="mt-2">No drives match your search.</p>
      </div>
      <div v-else class="row">
        <div class="col-md-6" v-for="d in drives" :key="d.id">
          <div class="ppa-card">
            <div class="d-flex justify-content-between">
              <h5 class="mb-1">{{ d.job_title }}</h5>
              <span v-if="!d.is_eligible" class="badge-status badge-Rejected">Not Eligible</span>
              <span v-else-if="d.deadline_passed" class="badge-status badge-Inactive">Closed</span>
              <span v-else-if="d.already_applied" class="badge-status badge-Shortlisted">Applied</span>
              <span v-else class="badge-status badge-Approved">Open</span>
            </div>
            <p class="text-muted mb-1" style="font-size:0.85rem;">{{ d.company_name }}</p>
            <p class="mb-2" style="font-size:0.9rem;">{{ (d.job_description || '').slice(0,140) }}<span v-if="(d.job_description||'').length>140">...</span></p>
            <p class="text-muted mb-2" style="font-size:0.8rem;">
              Deadline: {{ new Date(d.application_deadline).toLocaleString() }}<br/>
              Eligibility: {{ d.eligible_branches || 'Any branch' }}, Min CGPA {{ d.min_cgpa }}
            </p>
            <button
              class="btn btn-sm btn-ppa"
              :disabled="d.already_applied || !d.is_eligible || d.deadline_passed"
              @click="apply(d)">
              {{ d.already_applied ? 'Already Applied' : 'Apply Now' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { drives: [], loading: true, search: "", branch: "", msg: "", err: "" };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.get("/student/drives", { params: { search: this.search, branch: this.branch } });
        this.drives = res.data;
      } finally {
        this.loading = false;
      }
    },
    async apply(d) {
      this.msg = ""; this.err = "";
      try {
        await api.post(`/student/drives/${d.id}/apply`);
        this.msg = `Applied to ${d.job_title} successfully!`;
        this.load();
      } catch (e) {
        this.err = e.response?.data?.error || "Failed to apply";
      }
    },
  },
};
