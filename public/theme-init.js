try {
  var stored = localStorage.getItem("mc_theme");
  // Default to dark unless the user has explicitly chosen light
  if (stored !== "light") {
    document.documentElement.classList.add("dark");
  }
} catch(e) {}
