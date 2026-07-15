const RegisterStudent = {
  template: `
    <div class="ppa-form-card" style="max-width:520px;">
      <h2 class="mb-1">Student Signup</h2>
      <p class="text-muted mb-4">Create your account to browse and apply to placement drives</p>

      <div v-if="error" class="alert-ppa-error mb-3">{{ error }}</div>
      <div v-if="success" class="alert-ppa-success mb-3">{{ success }}</div>

      <form @submit.prevent="submit">
        <div class="row">
          <div class="col-12 mb-3">
            <label class="form-label">Full Name</label>
            <input class="form-control" v-model="form.full_name" required />
          </div>
          <div class="col-12 mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" v-model="form.email" required />
          </div>
          <div class="col-12 mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" v-model="form.password" required minlength="6" />
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Branch</label>
            <input class="form-control" v-model="form.branch" placeholder="e.g. CSE" />
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Graduation Year</label>
            <input type="number" class="form-control" v-model.number="form.year" placeholder="2026" />
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
        <button class="btn btn-ppa w-100" type="submit" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>
      <p class="text-center text-muted mt-3">
        Already have an account? <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  `,
  data() {
    return {
      form: { full_name: "", email: "", password: "", branch: "", year: null, cgpa: null, phone: "" },
      error: "",
      success: "",
      loading: false,
    };
  },
  methods: {
    async submit() {
      this.error = "";
      this.success = "";
      this.loading = true;
      try {
        await api.post("/auth/register/student", this.form);
        this.success = "Account created! Redirecting to login...";
        setTimeout(() => this.$router.push("/login"), 1200);
      } catch (e) {
        this.error = e.response?.data?.error || "Registration failed.";
      } finally {
        this.loading = false;
      }
    },
  },
};
