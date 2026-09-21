const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'project.js'), 'utf8') + '\nglobalThis.model = VoidProject;', context);
const model = context.model;
const legacy = { html: '<h1>Hello</h1>', css: 'h1 { color: red; }', js: 'console.log("hello")', fileNames: { html: 'home.html' } };
const state = model.normalize(legacy);
assert.equal(state.files.length, 3);
assert.equal(state.files[0].name, 'home.html');
assert.equal(state.files[0].content, legacy.html);
assert.equal(state.files[1].content, legacy.css);
assert.equal(state.files[2].content, legacy.js);

const script = model.add(state, 'events.js');
script.content = 'console.log("Hello 🌎");\n';
assert.equal(state.activeFileId, script.id);
assert.equal(model.language(script.name), 'javascript');
assert.throws(() => model.add(state, 'EVENTS.JS'), /already exists/);
for (const invalid of ['../bad.js', '', 'file.txt', 'bad?.css', 'folder/file.html']) {
    assert.throws(() => model.add(state, invalid));
}
const page = model.add(state, 'about.html');
page.content = '<p>About</p>';
assert.equal(state.previewFileId, page.id);
model.rename(state, script.id, 'interactions.js');
assert.equal(script.content, 'console.log("Hello 🌎");\n');
assert.throws(() => model.rename(state, script.id, 'home.html'));
assert.throws(() => model.rename(state, script.id, 'interactions.css'), /same file extension/);

// Simulate local autosave and the UTF-8/base64 share-link round trip.
const saved = JSON.stringify(state);
const restored = model.normalize(JSON.parse(Buffer.from(Buffer.from(saved).toString('base64'), 'base64').toString('utf8')));
assert.equal(JSON.stringify(restored), saved);
model.remove(restored, page.id);
assert.equal(restored.previewFileId, restored.files[0].id);
assert.ok(restored.files.some(file => file.id === restored.activeFileId));
model.remove(restored, restored.files[0].id);
assert.equal(restored.previewFileId, null);
while (restored.files.length > 1) model.remove(restored, restored.files[0].id);
assert.throws(() => model.remove(restored, restored.files[0].id), /at least one file/);
assert.equal(model.normalize(JSON.parse(JSON.stringify(restored))).files.length, 1);
const replacement = model.add(restored, 'new-page.html');
assert.equal(restored.previewFileId, replacement.id);
assert.equal(new Set(restored.files.map(file => file.id)).size, restored.files.length);
console.log('PASS: legacy migration, add/rename/delete, validation, active/preview fallback, autosave and Unicode share-link round trips.');
