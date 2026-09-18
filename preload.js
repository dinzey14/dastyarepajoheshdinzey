const { ipcRenderer } = require('electron');

window.APP_VERSION = '1.1.0';

window.showDirectoryPicker = async function () {
  const info = await ipcRenderer.invoke('fs:pickFolder');
  if (!info) { const err = new Error('User aborted'); err.name = 'AbortError'; throw err; }
  return makeHandle(info.path, info.name);
};
