// window.electron = require("electron");
// window.node_fs = require("fs");
// window.node_path = require("path");
// window.Aria2cControler = require("./Aria2cControler");
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("electron", require("electron"));
contextBridge.exposeInMainWorld("node_fs", require("fs"));
contextBridge.exposeInMainWorld("node_path", {});
contextBridge.exposeInMainWorld(
  "Aria2cControler",
  require("./Aria2cControler")
);
