const { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const APP_VERSION = '1.1.0';
const APP_DIR = __dirname;
const FIXED_PORT = 7777;
let mainWindow = null;
