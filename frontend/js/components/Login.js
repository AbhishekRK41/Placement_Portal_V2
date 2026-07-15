const Login = {
  template: `
    <div class="ppa-form-card">
      <h2 class="mb-1">Welcome back</h2>
      <p class="text-muted mb-4">Sign in to your Placement Portal account</p>

      <div v-if="error" class="alert-ppa-error mb-3">{{ error }}</div>

      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" v-model="email" required />
        </div>
        <div class="mb-4">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="password" required />
        </div>
        <button class="btn btn-ppa w-100" type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <hr class="my-4">
      <p class="text-center text-muted mb-1">New here?</p>
      <div class="d-flex gap-2">
        <router-link class="btn btn-outline-ppa flex-fill" to="/register/student">Student Signup</router-link>
        <router-link class="btn btn-outline-ppa flex-fill" to="/register/company">Company Signup</router-link>
      </div>
      <p class="text-center text-muted mt-4" style="font-size:0.8rem;">
        Admin login: Please use your work laptop.
      </p>
    </div>
  `,
  data() {
    return { email: "", password: "", error: "", loading: false };
  },
  methods: {
    async submit() {
      this.error = "";
      this.loading = true;
      try {
        const res = await api.post("/auth/login", { email: this.email, password: this.password });
        const { access_token, user, profile } = res.data;
        Auth.login(access_token, user, profile);
        if (user.role === "admin") await this.$router.push("/admin/dashboard");
        else if (user.role === "company") await this.$router.push("/company/dashboard");
        else await this.$router.push("/student/dashboard");
      } catch (e) {
        this.error = e.response?.data?.error || "Login failed. Please try again.";
      } finally {
        this.loading = false;
      }
    },
  },
};
