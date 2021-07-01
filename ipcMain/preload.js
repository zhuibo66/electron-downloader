const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electron', require('electron'));
contextBridge.exposeInMainWorld('node_fs', require('fs'));
contextBridge.exposeInMainWorld('node_path', require('path'));
contextBridge.exposeInMainWorld('Aria2cControler', require('./Aria2cControler'));
