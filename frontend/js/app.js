const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

function requireRole(...roles) {
  return (to, from, next) => {
    if (!Auth.isAuthenticated()) {
      next("/login");
    } else if (!roles.includes(Auth.getRole())) {
      next("/");
    } else {
      next();
    }
  };
}

const routes = [
  { path: "/", redirect: "/drives" },
  { path: "/drives", component: PublicDrives },
  { path: "/login", component: Login },
  { path: "/register/student", component: RegisterStudent },
  { path: "/register/company", component: RegisterCompany },

  { path: "/admin/dashboard", component: AdminDashboard, beforeEnter: requireRole("admin") },
  { path: "/admin/companies", component: AdminCompanies, beforeEnter: requireRole("admin") },
  { path: "/admin/drives", component: AdminDrives, beforeEnter: requireRole("admin") },
  { path: "/admin/students", component: AdminStudents, beforeEnter: requireRole("admin") },
  { path: "/admin/reports", component: AdminReports, beforeEnter: requireRole("admin") },

  { path: "/company/dashboard", component: CompanyDashboard, beforeEnter: requireRole("company") },
  { path: "/company/profile", component: CompanyProfile, beforeEnter: requireRole("company") },
  { path: "/company/create-drive", component: CompanyCreateDrive, beforeEnter: requireRole("company") },
  { path: "/company/drives/:id/applications", component: CompanyDriveApplications, beforeEnter: requireRole("company") },

  { path: "/student/dashboard", component: StudentDashboard, beforeEnter: requireRole("student") },
  { path: "/student/profile", component: StudentProfile, beforeEnter: requireRole("student") },
  { path: "/student/drives", component: StudentDrives, beforeEnter: requireRole("student") },
  { path: "/student/applications", component: StudentApplications, beforeEnter: requireRole("student") },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const App = {
  template: `
    <NavBar />
    <router-view />
  `,
};

const app = createApp(App);
app.component("NavBar", NavBar);
app.use(router);
app.mount("#app");
