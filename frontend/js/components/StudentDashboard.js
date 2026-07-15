const StudentDashboard = {
  template: `
    <div class="ppa-shell">
      <h2>Welcome, {{ data?.profile?.full_name || '' }}</h2>
      <p class="text-muted mb-4">Here's your placement activity at a glance</p>

      <div v-if="loading" class="text-muted">Loading...</div>
      <template v-else-if="data">
        <div class="row g-3 mb-4">
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ data.total_approved_drives }}</div>
              <div class="stat-label">Open Drives</div>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ data.total_applications }}</div>
              <div class="stat-label">Applications Submitted</div>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <div class="stat-tile">
              <div class="stat-num">{{ selectedCount }}</div>
              <div class="stat-label">Offers Received</div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mb-4">
          <router-link class="btn btn-ppa" to="/student/drives">Browse Drives</router-link>
          <router-link class="btn btn-outline-ppa" to="/student/applications">My Applications</router-link>
        </div>

        <h5>Recent Applications</h5>
        <div v-if="data.applications.length === 0" class="empty-state ppa-card">
          <i class="bi bi-send"></i>
          <p class="mt-2">You haven't applied to any drives yet.</p>
        </div>
        <div v-else v-for="a in data.applications.slice(0,5)" :key="a.id" class="ppa-card">
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="mb-0">{{ a.job_title }}</h6>
              <p class="text-muted mb-2" style="font-size:0.85rem;">{{ a.company_name }}</p>
            </div>
            <span class="badge-status" :class="'badge-'+a.status">{{ a.status }}</span>
          </div>
          <div class="pipeline">
            <div class="stage" :class="stageClass(a.status,'Applied')"><span class="node"></span>Applied</div>
            <div class="connector"></div>
            <div class="stage" :class="stageClass(a.status,'Shortlisted')"><span class="node"></span>Shortlisted</div>
            <div class="connector"></div>
            <div class="stage" :class="stageClass(a.status,'Selected')"><span class="node"></span>Selected</div>
          </div>
        </div>
      </template>
    </div>
  `,
  data() {
    return { data: null, loading: true };
  },
  computed: {
    selectedCount() {
      if (!this.data) return 0;
      return this.data.applications.filter(a => a.status === "Selected").length;
    },
  },
  async mounted() {
    try {
      const res = await api.get("/student/dashboard");
      this.data = res.data;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    stageClass(status, stage) {
      const order = ["Applied", "Shortlisted", "Selected"];
      if (status === "Rejected") return stage === "Applied" ? "done" : "rejected";
      const statusIdx = order.indexOf(status);
      const stageIdx = order.indexOf(stage);
      if (stageIdx < statusIdx) return "done";
      if (stageIdx === statusIdx) return "current";
      return "";
    },
  },
};
