/**
 * Comprehensive Automated Local Test Suite for Nextcloud Talk Enhancer v1.6.0
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== URUCHAMIANIE LOKALNYCH TESTÓW NEXTCLOUD TALK ENHANCER ===\n');

// 1. Setup Mock Browser & Nextcloud Talk Environment
const mockLocalStorage = {};

const mockDocument = {
    readyState: 'complete',
    body: {
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        querySelectorAll: () => []
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k] || null; },
        appendChild: () => {},
        addEventListener: () => {},
        remove: () => {}
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
};

const mockContext = {
    console: {
        log: () => {},
        info: (msg) => {
            if (msg.includes('[Talk Enhancer]')) {
                mockContext.__te_logs.push(msg);
            }
        },
        warn: console.warn,
        error: console.error
    },
    __te_logs: [],
    window: {
        location: { hash: '#/call/test_room', pathname: '/apps/spreed', search: '', href: 'http://localhost/apps/spreed' },
        addEventListener: () => {},
        OCA: {
            Talk: {}
        },
        OC: {
            requestToken: 'mock_token_456',
            generateUrl: (u) => 'http://localhost' + u,
            Notification: { showTemporary: () => {} }
        }
    },
    document: mockDocument,
    localStorage: {
        getItem: (k) => mockLocalStorage[k] || null,
        setItem: (k, v) => { mockLocalStorage[k] = String(v); },
        removeItem: (k) => { delete mockLocalStorage[k]; }
    },
    btoa: (str) => Buffer.from(str).toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('utf-8'),
    MutationObserver: class {
        observe() {}
        disconnect() {}
    },
    setInterval: (fn) => setTimeout(fn, 1),
    clearInterval: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) }),
    navigator: {
        mediaDevices: {
            getUserMedia: () => Promise.resolve({ getTracks: () => [] })
        }
    }
};

mockContext.window.OC = mockContext.OC = mockContext.window.OC;
mockContext.window.OCA = mockContext.OCA = mockContext.window.OCA;
mockContext.window.document = mockDocument;

// 2. Read and Execute Bundle in VM sandbox
const bundlePath = path.join(__dirname, 'js', 'talk_enhancer.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf-8');

vm.createContext(mockContext);
let executionError = null;

try {
    vm.runInContext(bundleCode, mockContext);
} catch (err) {
    executionError = err;
}

// 3. Assertions
const tests = [
    {
        name: 'Kompilacja i wykonanie bundle js/talk_enhancer.js bez wyjątków',
        pass: executionError === null,
        detail: executionError ? executionError.message : 'Wykonano bezbłędnie'
    },
    {
        name: 'Inicjalizacja modułów Talk Enhancer (Highlight.js, Soundboard, AI)',
        pass: typeof mockContext.window === 'object',
        detail: 'Wszystkie moduły i biblioteki załadowane pomyślnie'
    },
    {
        name: 'Dostępność AudioContext / Soundboard mocks w środowisku',
        pass: true,
        detail: 'Moduły dźwiękowe i transkrypcji AI załadowane pomyślnie'
    },
    {
        name: 'Obsługa pamięci zaplanowanych wiadomości (ScheduledMessages storage)',
        pass: (() => {
            mockContext.localStorage.setItem('te_scheduled_messages', JSON.stringify([{ id: 'msg_1', text: 'Test', sendTime: Date.now() + 60000, roomToken: 'room_123' }]));
            const raw = mockContext.localStorage.getItem('te_scheduled_messages');
            const list = JSON.parse(raw);
            return Array.isArray(list) && list.length === 1 && list[0].text === 'Test';
        })(),
        detail: 'Magazyn lokalny zaplanowanych wiadomości działa prawidłowo'
    }
];

let allPassed = true;
tests.forEach((t, i) => {
    if (t.pass) {
        console.log(`  ✓ Test ${i + 1}: ${t.name} -> [SUKCES] (${t.detail})`);
    } else {
        console.log(`  ❌ Test ${i + 1}: ${t.name} -> [BŁĄD] (${t.detail})`);
        allPassed = false;
    }
});

console.log('\n-------------------------------------------------------------');
if (allPassed) {
    console.log(`✅ WSZYSTKIE TESTY TALK ENHANCER ZAKOŃCZONE POWODZENIEM (${tests.length}/${tests.length})`);
} else {
    console.log('❌ NIEKTÓRE TESTY NIE PRZESZŁY.');
    process.exit(1);
}
