const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const handlers = {}, messages = [], external = [];
const context = vm.createContext({ URL,
    document: { addEventListener(type, fn) { handlers[type] = fn; } },
    parent: { postMessage(message) { messages.push(message); } },
    window: { open(url) { external.push(url); } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'preview-navigation.js'), 'utf8'), context);
context.installPreviewNavigation({ current: 'index.html', names: ['index.html', 'form.html'], hash: '' });
function click(href, download = false) {
    const event = { target: { closest: () => ({ getAttribute: () => href, hasAttribute: () => download }) }, preventDefault() { this.prevented = true; } };
    handlers.click(event);
    return event;
}
assert.ok(click('./form.html?from=home#signup').prevented);
assert.equal(messages.at(-1).name, 'form.html');
assert.equal(messages.at(-1).hash, '#signup');
assert.ok(!click('#section').prevented);
assert.ok(!click('missing.html').prevented);
assert.ok(!click('https://example.com/form.html').prevented);
assert.ok(!click('form.html', true).prevented);
context.window.open('form.html', '_blank');
assert.equal(messages.at(-1).source, 'VOID_NAVIGATE');
assert.equal(external.length, 0);
context.window.open('https://example.com');
assert.equal(external.length, 1);
const save = { ctrlKey: true, key: 's', preventDefault() { this.prevented = true; } };
handlers.keydown(save);
assert.ok(save.prevented);
assert.equal(messages.at(-1).source, 'VOID_SAVE_LOCAL');
console.log('PASS: local links, fragments, window.open, external/download exclusions and preview Ctrl+S.');
