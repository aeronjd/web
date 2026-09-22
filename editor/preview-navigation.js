// Runs inside the sandboxed preview. It only requests navigation; the host validates the file.
function installPreviewNavigation(config) {
    const base = new URL(config.current || "index.html", "https://void-code.invalid/");
    function resolve(value) {
        if (typeof value !== "string" || !value || value.startsWith("#")) return null;
        try {
            const url = new URL(value, base);
            if (url.origin !== base.origin) return null;
            const name = decodeURIComponent(url.pathname.slice(1));
            if (!config.names.includes(name)) return null;
            return { name, hash: url.hash };
        } catch { return null; }
    }
    function navigate(value) {
        const target = resolve(value);
        if (!target) return false;
        parent.postMessage({ source: "VOID_NAVIGATE", ...target }, "*");
        return true;
    }
    document.addEventListener("click", event => {
        const link = event.target.closest?.("a[href]");
        if (!link || link.hasAttribute("download") || event.defaultPrevented) return;
        if (navigate(link.getAttribute("href"))) event.preventDefault();
    });
    const originalOpen = window.open;
    window.open = function (url, ...args) {
        if (navigate(url)) return null;
        return originalOpen.call(window, url, ...args);
    };
    document.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            parent.postMessage({ source: "VOID_SAVE_LOCAL" }, "*");
        }
    });
    if (config.hash) {
        document.addEventListener("DOMContentLoaded", () => {
            try { document.getElementById(decodeURIComponent(config.hash.slice(1)))?.scrollIntoView(); } catch { /* invalid fragment */ }
        });
    }
}
