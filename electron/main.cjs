const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Mira do Obot",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '../public/vite.svg'),
    });

    // Se estiver em desenvolvimento (não empacotado)
    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000');
        // Abre o console automaticamente para debug se der tela branca
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Tratamento de erro de carregamento
    win.webContents.on('did-fail-load', () => {
        if (!app.isPackaged) {
            win.loadURL('http://localhost:3000');
        }
    });
}

app.whenReady().then(() => {
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
