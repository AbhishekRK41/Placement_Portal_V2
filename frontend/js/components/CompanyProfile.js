const CompanyProfile = {
  template: `
    <div class="ppa-shell" style="max-width:640px;">
      <h2>Company Profile</h2>
      <div v-if="success" class="alert-ppa-success mb-3">{{ success }}</div>
      <div v-if="loading" class="text-muted">Loading...</div>
      <form v-else @submit.prevent="save" class="ppa-card">
        <div class="mb-3">
          <label class="form-label">Company Name</label>
          <input class="form-control" v-model="form.company_name" required />
        </div>
        <div class="mb-3">
          <label class="form-label">HR Contact</label>
          <input class="form-control" v-model="form.hr_contact" />
        </div>
        <div class="mb-3">
          <label class="form-label">Website</label>
          <input class="form-control" v-model="form.website" />
        </div>
        <div class="mb-3">
          <label class="form-label">Approval Status</label>
          <div><span class="badge-status" :class="'badge-'+form.approval_status">{{ form.approval_status }}</span></div>
        </div>
        <button class="btn btn-ppa" type="submit">Save Changes</button>
      </form>
    </div>
  `,
  data() {
    return { form: {}, loading: true, success: "" };
  },
  async mounted() {
    try {
      const res = await api.get("/company/profile");
      this.form = res.data;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async save() {
      const res = await api.put("/company/profile", this.form);
      this.form = res.data.profile;
      this.success = "Profile updated successfully";
      setTimeout(() => (this.success = ""), 2000);
    },
  },
};
