export function sanitizeUnsupportedColorFunctions() {
  if (typeof document === "undefined") return;

  const sanitize = () => {
    const lab = ["ok", "lab"].join("");
    const lch = ["ok", "lch"].join("");
    const unsupported = new RegExp(`${lab}|${lch}`, "i");
    document.querySelectorAll("style").forEach((style) => {
      const text = style.textContent || "";
      if (!unsupported.test(text)) return;
      style.textContent = text
        .replace(new RegExp(`color-mix\\(in ${lab},[^)]+\\)`, "gi"), "#111827")
        .replace(new RegExp(`color-mix\\(in ${lch},[^)]+\\)`, "gi"), "#111827")
        .replace(new RegExp(`${lab}\\([^)]*\\)`, "gi"), "#111827")
        .replace(new RegExp(`${lch}\\([^)]*\\)`, "gi"), "#111827");
    });
  };

  sanitize();
  requestAnimationFrame(sanitize);
}