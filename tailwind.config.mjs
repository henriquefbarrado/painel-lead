export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    boxShadow: { soft: "0 1px 2px rgba(15,23,42,.05)" },
    colors: { nav: {
      bg: "var(--nav-bg)", blur: "var(--nav-bg-a)", line: "var(--nav-line)", "line-strong": "var(--nav-line-strong)",
      ink: "var(--nav-ink)", ink2: "var(--nav-ink-2)", ink3: "var(--nav-ink-3)", ink4: "var(--nav-ink-4)",
      field: "var(--nav-field)", hover: "var(--nav-hover)", active: "var(--nav-active)",
      accent: "var(--nav-accent)", "accent-ink": "var(--nav-accent-ink)", avatar: "var(--nav-avatar-bg)", "avatar-ink": "var(--nav-avatar-ink)", pill: "var(--nav-pill)",
    } },
  } },
  plugins: [],
};
