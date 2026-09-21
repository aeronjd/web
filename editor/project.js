/* File operations are independent of the UI so saved projects stay portable. */
const VoidProject = (() => {
    function language(name) {
        const extension = name.split(".").pop().toLowerCase();
        return extension === "js" ? "javascript" : extension;
    }

    function validateName(name, files, exceptId) {
        const clean = name.trim();
        if (!clean || clean.length > 100 || /[\\/:*?"<>|\x00-\x1f]/.test(clean) || !/^.+\.(html|css|js)$/i.test(clean)) {
            throw new Error("Use a filename ending in .html, .css or .js, without folders or special characters.");
        }
        if (files.some(file => file.id !== exceptId && file.name.toLowerCase() === clean.toLowerCase())) {
            throw new Error("A file with that name already exists. Please choose another name.");
        }
        return clean;
    }

    function normalize(data) {
        if (!data || typeof data !== "object") throw new Error("Invalid project.");
        const input = Array.isArray(data.files) ? data.files : ["html", "css", "js"].map(key => ({
            name: data.fileNames?.[key] || ({ html: "index.html", css: "style.css", js: "script.js" })[key],
            content: typeof data[key] === "string" ? data[key] : ""
        }));
        if (!input.length) throw new Error("A project needs at least one file.");
        const files = [];
        input.forEach((file, index) => {
            if (!file || typeof file.name !== "string" || typeof file.content !== "string") throw new Error("Invalid file.");
            const name = validateName(file.name, files);
            const id = typeof file.id === "string" && /^file-\d+$/.test(file.id) && !files.some(item => item.id === file.id) ? file.id : `file-${index + 1}`;
            let uniqueId = id;
            while (files.some(item => item.id === uniqueId)) uniqueId += "0";
            files.push({ id: uniqueId, name, content: file.content });
        });
        return {
            version: 2, files,
            activeFileId: files.some(file => file.id === data.activeFileId) ? data.activeFileId : files[0].id,
            previewFileId: files.find(file => file.id === data.previewFileId && language(file.name) === "html")?.id || files.find(file => language(file.name) === "html")?.id || null
        };
    }

    function add(state, name) {
        const clean = validateName(name, state.files);
        let number = 1;
        while (state.files.some(file => file.id === `file-${number}`)) number++;
        const file = { id: `file-${number}`, name: clean, content: "" };
        state.files.push(file);
        state.activeFileId = file.id;
        if (language(clean) === "html") state.previewFileId = file.id;
        return file;
    }

    function rename(state, id, name) {
        const file = state.files.find(file => file.id === id);
        if (!file) throw new Error("File not found.");
        const clean = validateName(name, state.files, id);
        if (language(clean) !== language(file.name)) throw new Error("Keep the same file extension when renaming.");
        file.name = clean;
    }

    function remove(state, id) {
        if (state.files.length === 1) throw new Error("Keep at least one file in your project. Use CLEAR to empty it.");
        const index = state.files.findIndex(file => file.id === id);
        if (index < 0) throw new Error("File not found.");
        state.files.splice(index, 1);
        if (state.activeFileId === id) state.activeFileId = state.files[Math.min(index, state.files.length - 1)].id;
        if (state.previewFileId === id) state.previewFileId = state.files.find(file => language(file.name) === "html")?.id || null;
    }

    return { language, normalize, add, rename, remove };
})();
