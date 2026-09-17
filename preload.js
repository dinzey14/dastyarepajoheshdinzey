const { ipcRenderer } = require('electron');

window.showDirectoryPicker = async function () {
  const info = await ipcRenderer.invoke('fs:pickFolder');
  if (!info) { const err = new Error('User aborted'); err.name = 'AbortError'; throw err; }
  return makeHandle(info.path, info.name);
};

function makeHandle(folderPath, folderName) {
  return {
    kind: 'directory', name: folderName, _path: folderPath,
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
    getFileHandle: async function (filename, opts) {
      if (!opts || !opts.create) {
        var exists = await ipcRenderer.invoke('fs:exists', folderPath, filename);
        if (!exists) { var err = new Error('File not found'); err.name = 'NotFoundError'; throw err; }
      }
      return {
        kind: 'file', name: filename,
        getFile: async function () {
          var text = await ipcRenderer.invoke('fs:readFile', folderPath, filename);
          return { text: async () => text, name: filename, size: text.length };
        },
        createWritable: async function () {
          return {
            write: async function (content) { await ipcRenderer.invoke('fs:writeFile', folderPath, filename, content); },
            close: async function () {}
          };
        }
      };
    }
  };
}

window.__getLastFolderHandle = async function () {
  var info = await ipcRenderer.invoke('fs:getLastFolder');
  if (!info) return null;
  return makeHandle(info.path, info.name);
};

window.__clearLastFolder = async function () { await ipcRenderer.invoke('fs:clearLastFolder'); };
window.__setLastProjectId = async function (pid) { await ipcRenderer.invoke('app:setLastProjectId', pid); };
window.__getLastProjectId = async function () { return await ipcRenderer.invoke('app:getLastProjectId'); };
window.__focusWindow = async function () { await ipcRenderer.invoke('app:focus'); };
window.__alert = function (msg) {
  try { ipcRenderer.sendSync('alert-sync', String(msg || '')); }
  catch (e) { console.log('[alert]', msg); }
};

window.__confirm = function (msg) {
  try { return ipcRenderer.sendSync('confirm-sync', String(msg || '')); }
  catch (e) { return true; }
};
window.__debugSettings = async function () {
  return await ipcRenderer.invoke('debug:settings');
};

window.__getFolderHandleFromPath = async function (folderPath) {
  var info = await ipcRenderer.invoke('fs:folderFromPath', folderPath);
  if (!info) return null;
  return makeHandle(info.path, info.name);
};

console.log('[preload] v22 ready ✅');