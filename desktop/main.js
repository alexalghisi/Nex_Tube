const path = require('node:path');
const { app, BrowserWindow, protocol } = require('electron');

const webDir = path.join(__dirname, 'web');

function serveWebFolder() {
    protocol.interceptFileProtocol('file', (request, callback) => {
        const requested = decodeURIComponent(new URL(request.url).pathname);
        callback({ path: requested.startsWith(webDir) ? requested : path.join(webDir, requested) });
    });
}

function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: '#0f0f0f',
        webPreferences: {
            contextIsolation: true,
        },
    });

    window.loadFile(path.join(webDir, 'index.html'));
}

app.whenReady().then(() => {
    serveWebFolder();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
