const CompanyCreateDrive = {
  template: `
    <div class="ppa-shell" style="max-width:640px;">
      <h2>Create Placement Drive</h2>
      <p class="text-muted mb-3">Your drive will be visible to students only after admin approval.</p>

      <div v-if="error" class="alert-ppa-error mb-3">{{ error }}</div>
      <div v-if="success" class="alert-ppa-success mb-3">{{ success }}</div>
      <div v-if="!isApproved" class="alert-ppa-error">
        Your company must be approved by the admin before you can create a placement drive.
      </div>
      <form v-else @submit.prevent="submit" class="ppa-card">
        <div class="mb-3">
          <label class="form-label">Job Title</label>
          <input class="form-control" v-model="form.job_title" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Job Description</label>
          <textarea class="form-control" rows="4" v-model="form.job_description"></textarea>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Eligible Branches (comma separated)</label>
            <input class="form-control" v-model="form.eligible_branches" placeholder="CSE, ECE, EEE" />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label">Min CGPA</label>
            <input type="number" step="0.1" class="form-control" v-model.number="form.min_cgpa" />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label">Eligible Grad Year</label>
            <input type="number" class="form-control" v-model.number="form.eligible_year" />
          </div>
        </div>
        <div class="mb-4">
          <label class="form-label">Application Deadline</label>
          <input type="datetime-local" class="form-control" v-model="form.application_deadline" step="1" required />
        </div>
        <button class="btn btn-ppa" type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit Drive for Approval' }}
        </button>
      </form>
    </div>
  `,
  data() {
  return {
    form: { job_title: "", job_description: "", eligible_branches: "", min_cgpa: 0, eligible_year: null, application_deadline: "" },
    error: "",
    success: "",
    loading: false,
    isApproved: true,
  };
},
async mounted() {
  const res = await api.get("/company/profile");
  this.isApproved = res.data.approval_status === "Approved";
},
  methods: {
    async submit() {
      this.error = "";
      this.success = "";
      this.loading = true;
      try {
        await api.post("/company/drives", this.form);
        this.success = "Drive submitted for admin approval!";
        setTimeout(() => this.$router.push("/company/dashboard"), 1200);
      } catch (e) {
        this.error = e.response?.data?.error || "Failed to create drive.";
      } finally {
        this.loading = false;
      }
    },
  },
};
