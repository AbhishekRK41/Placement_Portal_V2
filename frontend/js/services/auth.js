const Auth = {
  login(token, user, profile) {
    localStorage.setItem("ppa_token", token);
    localStorage.setItem("ppa_user", JSON.stringify(user));
    localStorage.setItem("ppa_profile", JSON.stringify(profile || {}));
  },
  logout() {
    localStorage.removeItem("ppa_token");
    localStorage.removeItem("ppa_user");
    localStorage.removeItem("ppa_profile");
  },
  getUser() {
    const raw = localStorage.getItem("ppa_user");
    return raw ? JSON.parse(raw) : null;
  },
  getProfile() {
    const raw = localStorage.getItem("ppa_profile");
    return raw ? JSON.parse(raw) : null;
  },
  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },
  isAuthenticated() {
    return !!localStorage.getItem("ppa_token");
  },
};
