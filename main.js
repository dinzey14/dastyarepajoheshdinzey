const { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const APP_DIR = __dirname;
const FIXED_PORT = 7777;
let mainWindow = null;
let server = null;

// ==================== Settings ====================
let SETTINGS_PATH = '';
function getSettingsPath() {
  if (!SETTINGS_PATH) SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
  return SETTINGS_PATH;
}
function loadSettings() {
  try { var fp = getSettingsPath(); if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) {}
  return {};
}
function saveSettings(obj) {
  try { fs.writeFileSync(getSettingsPath(), JSON.stringify(obj, null, 2)); } catch (e) {}
}
function getLastFolder() { return loadSettings().lastFolder || null; }
function setLastFolder(p) { var s = loadSettings(); s.lastFolder = p; saveSettings(s); }
function clearLastFolder() { var s = loadSettings(); delete s.lastFolder; saveSettings(s); }
function getLastProjectId() { return loadSettings().lastProjectId || ''; }
function setLastProjectId(pid) { var s = loadSettings(); s.lastProjectId = pid || ''; saveSettings(s); }

// ==================== MIME ====================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.tflite': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.bin': 'application/octet-stream'
};
function getMime(fp) { return MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream'; }

// ==================== Server ====================
function startServer() {
  return new Promise(function (resolve, reject) {
    server = http.createServer(function (req, res) {
      let pn;
      try { pn = decodeURIComponent(url.parse(req.url).pathname); } catch (e) { pn = '/'; }
      if (pn === '/' || pn === '') pn = '/index.html';
      const resolved = path.resolve(path.join(APP_DIR, pn));
      const baseDir = path.resolve(APP_DIR);
      if (!resolved.startsWith(baseDir)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(resolved, function (err, data) {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not Found: ' + pn); return; }
        res.writeHead(200, { 'Content-Type': getMime(resolved), 'Cache-Control': 'no-cache' });
        res.end(data);
      });
    });
    server.once('error', function (e) {
      if (e.code === 'EADDRINUSE') {
        dialog.showErrorBox('خطا', 'پورت ' + FIXED_PORT + ' اشغال است.\nسایر نمونه‌های برنامه را ببندید.');
        reject(e);
      } else reject(e);
    });
    server.listen(FIXED_PORT, '127.0.0.1', function () { resolve(FIXED_PORT); });
  });
}

// ==================== IPC ====================
function focusWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    if (mainWindow.webContents) mainWindow.webContents.focus();
  }
}

ipcMain.handle('fs:pickFolder', async function () {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'پوشه‌ای برای ذخیره انتخاب کنید',
    buttonLabel: 'انتخاب این پوشه',
    properties: ['openDirectory', 'createDirectory']
  });
  focusWindow();
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const folderPath = result.filePaths[0];
  setLastFolder(folderPath);
  return { path: folderPath, name: path.basename(folderPath) || folderPath };
});

ipcMain.handle('fs:getLastFolder', async function () {
  var p = getLastFolder();
  if (!p) return null;
  try { if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) { clearLastFolder(); return null; } }
  catch (e) { return null; }
  return { path: p, name: path.basename(p) || p };
});
ipcMain.handle('fs:clearLastFolder', async function () { clearLastFolder(); return true; });

ipcMain.handle('fs:readFile', async function (e, folderPath, name) {
  var safeName = path.basename(name);
  var fp = path.join(folderPath, safeName);
  if (!fs.existsSync(fp)) { var err = new Error('FileNotFound'); err.name = 'NotFoundError'; throw err; }
  return fs.readFileSync(fp, 'utf8');
});
ipcMain.handle('fs:writeFile', async function (e, folderPath, name, text) {
  var safeName = path.basename(name);
  var fp = path.join(folderPath, safeName);
  fs.writeFileSync(fp, text, 'utf8');
  return true;
});
ipcMain.handle('fs:exists', async function (e, folderPath, name) {
  var safeName = path.basename(name);
  try { return fs.existsSync(path.join(folderPath, safeName)); } catch (err) { return false; }
});
ipcMain.handle('app:setLastProjectId', async function (e, pid) { setLastProjectId(pid); return true; });
ipcMain.handle('app:getLastProjectId', async function () { return getLastProjectId(); });
ipcMain.handle('app:focus', async function () { focusWindow(); return true; });

// ★★★ هندلرهای اضافه‌شده برای رفع خطا
ipcMain.handle('debug:settings', async function () {
  var fp = getSettingsPath();
  return {
    path: fp,
    exists: fs.existsSync(fp),
    content: fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null,
    userData: app.getPath('userData'),
    productName: app.getName()
  };
});

ipcMain.handle('fs:folderFromPath', async function (e, folderPath) {
  if (!folderPath) return null;
  try {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) return null;
    setLastFolder(folderPath);
    return { path: folderPath, name: path.basename(folderPath) || folderPath };
  } catch (err) { return null; }
});

// ★ هندلر alert/confirm بومی
ipcMain.on('alert-sync', function (e, msg) {
  dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    message: String(msg || ''),
    buttons: ['تأیید'],
    noLink: true,
    title: 'دستیار پژوهش دینزی'
  });
  e.returnValue = true;
});

ipcMain.on('confirm-sync', function (e, msg) {
  var r = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    message: String(msg || ''),
    buttons: ['خیر', 'بله'],
    defaultId: 1,
    cancelId: 0,
    noLink: true,
    title: 'دستیار پژوهش دینزی'
  });
  e.returnValue = (r === 1);
});

// ==================== Window ====================
async function createWindow() {
  var port;
  try { port = await startServer(); } catch (e) { app.quit(); return; }

  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    show: false, backgroundColor: '#eef2f7',
    title: 'دستیار پژوهش دینزی',
    icon: path.join(APP_DIR, 'icon.ico'),
    webPreferences: {
      preload: path.join(APP_DIR, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true,
      devTools: true
    }
  });

  Menu.setApplicationMenu(null);

  // ★★ مجوز میکروفن برای Vosk
  mainWindow.webContents.session.setPermissionRequestHandler(function (webContents, permission, callback) {
    if (permission === 'media' || permission === 'microphone' || permission === 'audioCapture') {
      console.log('Microphone permission granted');
      return callback(true);
    }
    callback(false);
  });

  mainWindow.loadURL('http://127.0.0.1:' + port + '/');

  mainWindow.once('ready-to-show', function () {
    mainWindow.maximize();
    mainWindow.show();
    focusWindow();
  });

  mainWindow.webContents.on('did-finish-load', function () { focusWindow(); });

  mainWindow.on('focus', function () {
    if (mainWindow.webContents) mainWindow.webContents.focus();
  });

  // F12 + Ctrl+Shift+I
  mainWindow.webContents.on('before-input-event', function (event, input) {
    if (input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(function (o) {
    if (o.url.startsWith('http://127.0.0.1') || o.url.startsWith('http://localhost')) return { action: 'allow' };
    shell.openExternal(o.url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', function (e, u) {
    if (!u.startsWith('http://127.0.0.1') && !u.startsWith('http://localhost')) {
      e.preventDefault(); shell.openExternal(u);
    }
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on('second-instance', function () {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); focusWindow(); }
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', function () { if (server) server.close(); if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}