export const SIDEBAR_STORAGE_KEY = "boq.sidebar";

/**
 * Inline script for the root layout: applies the saved sidebar state to <html> before first paint,
 * so the expanded menu and the shifted content never flash on load.
 */
export const sidebarInitScript = `try{if(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="expanded")document.documentElement.dataset.sidebar="expanded"}catch(e){}`;
