const $ = (selector) => document.querySelector(selector);
let editors = [], tabs = [], state;
const preview = $("#preview-frame"), autoLive = $("#auto-live"), previewStatus = $("#preview-status");
const consoleOutput = $("#console-output"), saveStatus = $("#save-status"), activeFileLabel = $("#active-file-label");
const defaults = {
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>My Project</title></head>
<body><div class="card"><p>HELLO.WORLD</p><h1>VOID.CODE</h1><button id="hello">CLICK ME</button></div></body></html>`,
    css: `* { box-sizing: border-box; }
body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #181818; color: #aaa; font-family: "Courier New", monospace; }
.card { padding: 30px; text-align: center; background: #242424; border: 1px solid #333; }
p, button:hover { color: #5ee68a; }`,
    js: `const button = document.getElementById("hello");
button.addEventListener("click", () => { console.log("hello from VOID.CODE"); button.textContent = "IT WORKS"; });`
};
let updateTimer, wrapped = false;
const activeInput = () => editors.find(editor => editor.dataset.fileId === state.activeFileId);

const escapeHTML = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const token = (kind, value) => `<span class="${kind}">${escapeHTML(value)}</span>`;
function highlightHTML(code) {
    const matcher = /<!--[\s\S]*?(?:-->|$)|<![^>]*(?:>|$)|<\/?[a-zA-Z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*(?:>|$)|&(?:#\d+|#x[\da-f]+|\w+);/gi;
    return colorize(code, matcher, (value) => {
        if (value.startsWith("<!--")) return token("token-comment", value);
        if (value.startsWith("<!")) return token("token-keyword", value);
        if (value.startsWith("&")) return token("token-number", value);
        let tagName = true;
        return colorize(value, /<\/?|\/?>|=|"[^"]*"|'[^']*'|[^\s<>="']+/g, part => {
            if (/^(<\/?|\/?>|=)$/.test(part)) return token("token-punctuation", part);
            if (tagName) { tagName = false; return token("token-tag", part); }
            if (/^["']/.test(part)) return token("token-string", part);
            return token("token-attr", part);
        });
    });
}
// Each token is taken from the original source, preserving cursor alignment.
function colorize(code, matcher, render) {
    let output = "", end = 0;
    for (const match of code.matchAll(matcher)) {
        output += escapeHTML(code.slice(end, match.index)) + render(match[0], match.index);
        end = match.index + match[0].length;
    }
    return output + escapeHTML(code.slice(end));
}
function highlightCSS(code) {
    const matcher = /\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[\w-]+|#[\w-]+|-?(?:\d*\.\d+|\d+)(?:[a-z]+|%)?|--[\w-]+|[\w-]+|[{}:;(),.\[\]>+~*=!]/gi;
    let inValue = false;
    return colorize(code, matcher, (value, index) => {
        const rest = code.slice(index + value.length);
        if (value.startsWith("/*")) return token("token-comment", value);
        if (/^["']/.test(value)) return token("token-string", value);
        if (/^[{};]$/.test(value)) { inValue = false; return token("token-punctuation", value); }
        if (value === ":") {
            // A selector pseudo-class has a rule-opening brace ahead of its value.
            inValue = !/^[^;{}]*\{/.test(rest);
            return token("token-punctuation", value);
        }
        if (value.startsWith("@") || value === "important") return token("token-keyword", value);
        if (/^-?(?:\d|\.\d)/.test(value) || (inValue && /^#[\da-f]{3,8}$/i.test(value))) return token("token-number", value);
        if (/^[(),.\[\]>+~*=!]$/.test(value)) return token("token-punctuation", value);
        if (/^\s*\(/.test(rest)) return token("token-function", value);
        if (/^\s*:/.test(rest) && !/^[^;{}]*\{/.test(rest)) return token("token-property", value);
        return token(inValue ? "token-value" : "token-selector", value);
    });
}
function highlightJS(code) {
    const matcher = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:0[xob][\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)n?\b|[$a-zA-Z_][$\w]*|[{}()[\].,;:]|[=+*\/!%&|<>?~^-]+/gi;
    const keywords = new Set("const let var function return if else for while do switch case break continue class extends new async await try catch finally throw import from export default typeof instanceof in of delete void yield this super static get set debugger with".split(" "));
    const builtins = new Set("console document window Math JSON Object Array String Number Boolean Promise Date Map Set Error RegExp localStorage navigator".split(" "));
    return colorize(code, matcher, (value, index) => {
        if (value.startsWith("//") || value.startsWith("/*")) return token("token-comment", value);
        if (/^["'`]/.test(value)) return token("token-string", value);
        if (/^\d/.test(value)) return token("token-number", value);
        if (/^(true|false|null|undefined|NaN|Infinity)$/.test(value)) return token("token-boolean", value);
        if (keywords.has(value)) return token("token-keyword", value);
        if (/^[{}()[\].,;:]$/.test(value)) return token("token-punctuation", value);
        if (/^[=+*\/!%&|<>?~^-]+$/.test(value)) return token("token-operator", value);
        if (/^\s*\(/.test(code.slice(index + value.length))) return token("token-function", value);
        if (builtins.has(value)) return token("token-builtin", value);
        if (/\.\s*$/.test(code.slice(0, index)) || /^\s*:/.test(code.slice(index + value.length))) return token("token-property", value);
        return token("token-variable", value);
    });
}
function syncScroll(editor) {
    const panel = editor.closest(".code-editor");
    panel.querySelector(".highlighting").scrollTop = editor.scrollTop;
    panel.querySelector(".highlighting").scrollLeft = editor.scrollLeft;
    panel.querySelector(".line-numbers").scrollTop = editor.scrollTop;
}
function refresh(editor) {
    const panel = editor.closest(".code-editor"), language = editor.dataset.language;
    // A space makes the final empty line visible without adding an extra row.
    panel.querySelector("code").innerHTML = (language === "html" ? highlightHTML : language === "css" ? highlightCSS : highlightJS)(editor.value) + (editor.value.endsWith("\n") || !editor.value ? " " : "");
    refreshLineNumbers(editor);
    syncScroll(editor);
}
function refreshLineNumbers(editor) {
    const panel = editor.closest(".code-editor");
    if (!panel.classList.contains("active")) return;
    const gutter = panel.querySelector(".line-numbers");
    const wrapped = panel.classList.contains("wrap");
    const style = getComputedStyle(editor);
    let measure = panel.querySelector(".line-measure");
    if (!measure) {
        measure = document.createElement("div");
        measure.className = "line-measure";
        measure.setAttribute("aria-hidden", "true");
        panel.append(measure);
    }
    measure.style.width = `${Math.max(1, editor.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))}px`;
    const rows = editor.value.split("\n").map((line, index) => {
        const row = document.createElement("div");
        row.textContent = index + 1;
        if (wrapped) {
            measure.textContent = line || " ";
            row.style.height = `${measure.getBoundingClientRect().height}px`;
        }
        return row;
    });
    gutter.replaceChildren(...rows);
    // Match the input's full scroll range, including its horizontal scrollbar.
    gutter.style.paddingBottom = `${parseFloat(style.paddingBottom) + editor.offsetHeight - editor.clientHeight}px`;
}
function refreshAll() { editors.forEach(refresh); }
function project() { return state; }
function updateLabels() {
    tabs.forEach(tab => { tab.textContent = state.files.find(file => file.id === tab.dataset.editor).name; });
    activeFileLabel.textContent = state.files.find(file => file.id === state.activeFileId).name;
    $("#delete-file-button").disabled = state.files.length === 1;
    const pageSelect = $("#preview-page");
    pageSelect.replaceChildren();
    state.files.filter(file => VoidProject.language(file.name) === "html").forEach(file => {
        const option = document.createElement("option");
        option.value = file.id;
        option.textContent = file.name;
        pageSelect.append(option);
    });
    pageSelect.disabled = !state.previewFileId;
    if (!state.previewFileId) {
        const option = document.createElement("option");
        option.textContent = "No HTML file";
        pageSelect.append(option);
    } else pageSelect.value = state.previewFileId;
}
function renderFiles() {
    const tabList = $(".file-tabs"), wrapper = $(".editor-wrap");
    tabList.replaceChildren(); wrapper.replaceChildren();
    editors = []; tabs = [];
    state.files.forEach(file => {
        const tab = document.createElement("button");
        tab.type = "button"; tab.className = "file-tab"; tab.dataset.editor = file.id;
        tab.id = `tab-${file.id}`; tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", `panel-${file.id}`);
        tab.onclick = () => switchEditor(file.id);
        tabList.append(tab); tabs.push(tab);
        const panel = document.createElement("div");
        panel.className = `code-editor${wrapped ? " wrap" : ""}`;
        panel.dataset.editorPanel = file.id; panel.id = `panel-${file.id}`;
        panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id);
        panel.innerHTML = '<div class="line-numbers" aria-hidden="true"></div><pre class="highlighting" aria-hidden="true"><code></code></pre><textarea spellcheck="false" autocomplete="off"></textarea>';
        const editor = panel.querySelector("textarea");
        editor.dataset.language = VoidProject.language(file.name);
        editor.dataset.fileId = file.id; editor.id = `${file.id}-editor`;
        editor.setAttribute("aria-label", `${file.name} editor`); editor.value = file.content;
        bindEditor(editor); wrapper.append(panel); editors.push(editor);
    });
    switchEditor(state.activeFileId, false); refreshAll();
}
function setProject(data) { state = VoidProject.normalize(data); renderFiles(); }
function saveLocal() { try { localStorage.setItem("void-code-project", JSON.stringify(project())); saveStatus.textContent = "LOCAL AUTOSAVE // SAVED"; } catch { saveStatus.textContent = "AUTOSAVE FAILED"; } }
function consoleLine(type, message) { const line = document.createElement("div"); line.className = `console-line ${type}`; line.textContent = message; consoleOutput.append(line); consoleOutput.scrollTop = consoleOutput.scrollHeight; }
function buildPreview(includeConsole = true) {
    const htmlFile = state.files.find(file => file.id === state.previewFileId);
    const doc = new DOMParser().parseFromString(htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>', "text/html");
    // Project styles/scripts are bundled in tab order; remove matching local references to avoid duplicate execution.
    const localFile = (path) => {
        if (!path || /^(?:[a-z]+:|\/\/)/i.test(path)) return null;
        let name;
        try { name = decodeURIComponent(path.split(/[?#]/)[0].replace(/^\.\//, "")); } catch { return null; }
        return state.files.find(file => file.name === name);
    };
    doc.querySelectorAll('link[rel="stylesheet"][href], script[src]').forEach(node => {
        const file = localFile(node.getAttribute(node.tagName === "LINK" ? "href" : "src"));
        if (file && ((node.tagName === "LINK" && VoidProject.language(file.name) === "css") || (node.tagName === "SCRIPT" && VoidProject.language(file.name) === "javascript"))) node.remove();
    });
    state.files.filter(file => VoidProject.language(file.name) === "css").forEach(file => {
        const style = doc.createElement("style");
        style.textContent = file.content.replace(/<\/style/gi, "<\\/style");
        doc.head.append(style);
    });
    const bridge = `<script>(function(){["log","warn","error"].forEach(function(t){var o=console[t];console[t]=function(){var a=Array.from(arguments).map(function(v){try{return typeof v==="object"?JSON.stringify(v):String(v)}catch(e){return String(v)}});parent.postMessage({source:"VOID_CONSOLE",type:t,message:a.join(" ")},"*");o.apply(console,arguments)}});window.addEventListener("error",function(e){parent.postMessage({source:"VOID_CONSOLE",type:"error",message:e.message},"*")})})();<\/script>`;
    if (includeConsole) {
        const template = doc.createElement("template");
        template.innerHTML = bridge;
        doc.head.prepend(template.content);
    }
    state.files.filter(file => VoidProject.language(file.name) === "javascript").forEach(file => {
        const script = doc.createElement("script");
        script.textContent = file.content.replace(/<\/script/gi, "<\\/script");
        doc.body.append(script);
    });
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
function runPreview() { clearTimeout(updateTimer); consoleOutput.innerHTML = ""; previewStatus.textContent = "RUNNING..."; preview.srcdoc = buildPreview(); }
preview.addEventListener("load", () => { previewStatus.textContent = "LIVE"; });
function schedulePreview() { clearTimeout(updateTimer); if (!autoLive.checked) { previewStatus.textContent = "CHANGES NOT RUN"; return; } previewStatus.textContent = "UPDATING..."; updateTimer = setTimeout(runPreview, 300); }
function editorChanged(editor) { state.files.find(file => file.id === editor.dataset.fileId).content = editor.value; refresh(editor); saveLocal(); schedulePreview(); }
function switchEditor(name, focus = true) {
    state.activeFileId = name;
    tabs.forEach(tab => { const on = tab.dataset.editor === name; tab.classList.toggle("active", on); tab.setAttribute("aria-selected", on); });
    document.querySelectorAll(".code-editor").forEach(panel => panel.classList.toggle("active", panel.dataset.editorPanel === name));
    updateLabels(); refresh(activeInput());
    if (focus) { activeInput().focus(); saveLocal(); }
}
function renameActive() {
    const file = state.files.find(file => file.id === state.activeFileId);
    const name = prompt(`Rename ${file.name} (keep the same extension)`, file.name);
    if (name === null) return;
    try { VoidProject.rename(state, file.id, name); } catch (error) { alert(error.message); return; }
    updateLabels(); activeInput().setAttribute("aria-label", `${file.name} editor`); saveLocal(); schedulePreview();
}
function addFile() {
    const name = prompt("New filename (.html, .css or .js)", "new-file.js");
    if (name === null) return;
    try { VoidProject.add(state, name); } catch (error) { alert(error.message); return; }
    renderFiles(); activeInput().focus(); saveLocal(); schedulePreview();
}
function deleteFile() {
    const file = state.files.find(file => file.id === state.activeFileId);
    if (!confirm(`Delete ${file.name} and its contents? This cannot be undone.`)) return;
    try { VoidProject.remove(state, file.id); } catch (error) { alert(error.message); return; }
    renderFiles(); activeInput().focus(); saveLocal(); schedulePreview();
}
function encode() { let binary = ""; for (const byte of new TextEncoder().encode(JSON.stringify(project()))) binary += String.fromCharCode(byte); return btoa(binary); }
function saveLink() { location.hash = `code=${encode()}`; saveStatus.textContent = "SHARE LINK // CREATED"; }

function bindEditor(editor) {
    editor.addEventListener("input", () => editorChanged(editor)); editor.addEventListener("scroll", () => syncScroll(editor));
    editor.addEventListener("keydown", event => { if (event.key !== "Tab") return; event.preventDefault(); const start = editor.selectionStart, end = editor.selectionEnd, selection = editor.value.slice(start, end); const insert = event.shiftKey ? selection.replace(/^ {1,4}/gm, "") : selection.includes("\n") ? selection.replace(/^/gm, "    ") : "    "; editor.setRangeText(insert, start, end, "end"); editorChanged(editor); });
}
autoLive.addEventListener("change", () => { clearTimeout(updateTimer); if (autoLive.checked) runPreview(); else previewStatus.textContent = "AUTO LIVE OFF"; });
$("#add-file-button").onclick = addFile;
$("#delete-file-button").onclick = deleteFile;
$("#preview-page").onchange = event => { state.previewFileId = event.target.value; saveLocal(); runPreview(); };
$("#run-button").onclick = runPreview; $("#rename-button").onclick = renameActive; $("#clear-console-button").onclick = () => consoleOutput.innerHTML = "";
$("#clear-button").onclick = () => { const editor = activeInput(); editor.value = ""; editorChanged(editor); editor.focus(); };
$("#reset-button").onclick = () => { if (confirm("Reset the entire project?")) { setProject(defaults); saveLocal(); runPreview(); } };
$("#wrap-button").onclick = event => { wrapped = !wrapped; document.querySelectorAll(".code-editor").forEach(panel => panel.classList.toggle("wrap", wrapped)); event.currentTarget.textContent = `WRAP: ${wrapped ? "ON" : "OFF"}`; event.currentTarget.setAttribute("aria-pressed", wrapped); refreshAll(); };
$("#save-link-button").onclick = saveLink;
$("#copy-link-button").onclick = async () => { saveLink(); try { await navigator.clipboard.writeText(location.href); saveStatus.textContent = "SHARE LINK // COPIED"; } catch { saveStatus.textContent = "LINK CREATED // COPY MANUALLY"; } };
$("#download-button").onclick = () => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([buildPreview(false)], { type: "text/html" })); link.download = state.files.find(file => file.id === state.previewFileId)?.name || "project.html"; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); };
window.addEventListener("message", event => { if (event.source === preview.contentWindow && event.data?.source === "VOID_CONSOLE") consoleLine(event.data.type, event.data.message); });
document.addEventListener("keydown", event => { const ctrl = event.ctrlKey || event.metaKey; if (event.key === "F2") { event.preventDefault(); renameActive(); } if (ctrl && event.key === "Enter") { event.preventDefault(); runPreview(); } if (ctrl && event.key.toLowerCase() === "s") { event.preventDefault(); saveLink(); } });
try { const code = location.hash.startsWith("#code=") ? JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(location.hash.slice(6)), char => char.charCodeAt(0)))) : JSON.parse(localStorage.getItem("void-code-project")); setProject(code || defaults); } catch { setProject(defaults); }
new ResizeObserver(() => {
    const editor = activeInput();
    refreshLineNumbers(editor);
    syncScroll(editor);
}).observe($(".editor-wrap"));
runPreview();
