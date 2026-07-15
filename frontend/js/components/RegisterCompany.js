const RegisterCompany = {
  template: `
    <div class="ppa-form-card">
      <h2 class="mb-1">Company Signup</h2>
      <p class="text-muted mb-4">Register your company to create placement drives (admin approval required)</p>

      <div v-if="error" class="alert-ppa-error mb-3">{{ error }}</div>
      <div v-if="success" class="alert-ppa-success mb-3">{{ success }}</div>

      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label">Company Name</label>
          <input class="form-control" v-model="form.company_name" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Work Email</label>
          <input type="email" class="form-control" v-model="form.email" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="form.password" required minlength="6" />
        </div>
        <div class="mb-3">
          <label class="form-label">HR Contact</label>
          <input class="form-control" v-model="form.hr_contact" placeholder="Name / phone / email" />
        </div>
        <div class="mb-4">
          <label class="form-label">Website</label>
          <input class="form-control" v-model="form.website" placeholder="https://" />
        </div>
        <button class="btn btn-ppa w-100" type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Register Company' }}
        </button>
      </form>
      <p class="text-center text-muted mt-3">
        Already registered? <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  `,
  data() {
    return {
      form: { company_name: "", email: "", password: "", hr_contact: "", website: "" },
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
        await api.post("/auth/register/company", this.form);
        this.success = "Registered! Awaiting admin approval before you can create drives. Redirecting to login...";
        setTimeout(() => this.$router.push("/login"), 1500);
      } catch (e) {
        this.error = e.response?.data?.error || "Registration failed.";
      } finally {
        this.loading = false;
      }
    },
  },
};
