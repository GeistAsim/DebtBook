export const worker = {

  token_manager({action, token}) {

    switch (action) {
      case "store":
        if (!token) return false;
        localStorage.setItem("token", token);
        return true;

      case "remove":
        localStorage.removeItem("token");
        return true;

      case "get":
        return localStorage.getItem("token");

      default:
        return false;
    }
  },

  // Export close
}
