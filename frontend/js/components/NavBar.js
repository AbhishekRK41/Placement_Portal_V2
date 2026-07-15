const NavBar = {
  template: `
    <nav class="ppa-navbar">
      <router-link to="/" class="brand"><span class="dot"></span> Placement Portal</router-link>
      <div class="nav-links d-flex align-items-center">
        <template v-if="!isAuthed">
          <router-link to="/drives">Browse Drives</router-link>
          <router-link to="/login">Login</router-link>
          <router-link to="/register/student">Student Signup</router-link>
          <router-link to="/register/company">Company Signup</router-link>
        </template>
        <template v-else-if="role === 'admin'">
          <router-link to="/admin/dashboard">Dashboard</router-link>
          <router-link to="/admin/companies">Companies</router-link>
          <router-link to="/admin/drives">Drives</router-link>
          <router-link to="/admin/students">Students</router-link>
          <router-link to="/admin/reports">Reports</router-link>
          <button @click="logout">Logout</button>
        </template>
        <template v-else-if="role === 'company'">
          <router-link to="/company/dashboard">Dashboard</router-link>
          <router-link to="/company/create-drive">Create Drive</router-link>
          <router-link to="/company/profile">Profile</router-link>
          <button @click="logout">Logout</button>
        </template>
        <template v-else-if="role === 'student'">
          <router-link to="/student/dashboard">Dashboard</router-link>
          <router-link to="/student/drives">Drives</router-link>
          <router-link to="/student/applications">My Applications</router-link>
          <router-link to="/student/profile">Profile</router-link>
          <button @click="logout">Logout</button>
        </template>
      </div>
    </nav>
  `,
  data() {
    return {
      isAuthed: Auth.isAuthenticated(),
      role: Auth.getRole(),
    };
  },
  created() {
    this.$router.afterEach(() => {
      this.isAuthed = Auth.isAuthenticated();
      this.role = Auth.getRole();
    });
  },
  methods: {
    logout() {
      Auth.logout();
      this.isAuthed = false;
      this.role = null;
      this.$router.push("/login");
    },
  },
};
