const StudentProfile = {
  template: `
    <div class="ppa-shell" style="max-width:640px;">
      <h2>My Profile</h2>
      <div v-if="success" class="alert-ppa-success mb-3">{{ success }}</div>
      <div v-if="error" class="alert-ppa-error mb-3">{{ error }}</div>

      <div v-if="loading" class="text-muted">Loading...</div>
      <form v-else @submit.prevent="save" class="ppa-card mb-3">
        <div class="mb-3">
          <label class="form-label">Full Name</label>
          <input class="form-control" v-model="form.full_name" required />
        </div>
        <div class="row">
          <div class="col-6 mb-3">
            <label class="form-label">Branch</label>
            <input class="form-control" v-model="form.branch" />
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Graduation Year</label>
            <input type="number" class="form-control" v-model.number="form.year" />
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">CGPA</label>
            <input type="number" step="0.01" class="form-control" v-model.number="form.cgpa" />
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Phone</label>
            <input class="form-control" v-model="form.phone" />
          </div>
        </div>
        <button class="btn btn-ppa" type="submit">Save Changes</button>
      </form>

      <div class="ppa-card">
        <h5>Resume</h5>
        <p class="text-muted" style="font-size:0.85rem;">
          Current: {{ form.resume_path || 'No resume uploaded yet' }}
        </p>
        <input type="file" class="form-control mb-2" ref="fileInput" accept=".pdf,.doc,.docx" />
        <button class="btn btn-outline-ppa btn-sm" @click="uploadResume">Upload Resume</button>
      </div>
    </div>
  `,
  data() {
    return { form: {}, loading: true, success: "", error: "" };
  },
  async mounted() {
    try {
      const res = await api.get("/student/profile");
      this.form = res.data;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async save() {
      try {
        const res = await api.put("/student/profile", this.form);
        this.form = res.data.profile;
        this.success = "Profile updated successfully";
        this.error = "";
        setTimeout(() => (this.success = ""), 2000);
      } catch (e) {
        this.error = e.response?.data?.error || "Update failed";
      }
    },
    async uploadResume() {
      const file = this.$refs.fileInput.files[0];
      if (!file) {
        this.error = "Please choose a file first";
        return;
      }
      const formData = new FormData();
      formData.append("resume", file);
      try {
        const res = await api.post("/student/resume", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.form.resume_path = res.data.resume_path;
        this.success = "Resume uploaded successfully";
        this.error = "";
      } catch (e) {
        this.error = e.response?.data?.error || "Upload failed";
      }
    },
  },
};
