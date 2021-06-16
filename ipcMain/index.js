const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { getAriaProc, killAriaProc } = require("./Aria2cControler");
// const log=require('electron-log');
let mainWindow = null;
const debug = /--debug/.test(process.argv[2]);
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      //https://www.wyr.me/post/680
      // contextIsolation: false, //是否隔离上下文，简单的理解就是javascript是否在同一个环境中
      // nodeIntegration: true, //开启node支持
      preload: path.join(__dirname, "/preload.js"),
    },
  });
  mainWindow.loadURL(`http://localhost:8080/`);
  // mainWindow.loadURL(path.join("file://", __dirname, "../build/index.html"));
  // mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  mainWindow.webContents.openDevTools();

  //如果是--debug 打开开发者工具，窗口最大化，
  if (debug) {
    mainWindow.webContents.openDevTools();
    mainWindow.maximize();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  // const installExtension = require("electron-devtools-installer").default;
  // const {
  //   REACT_DEVELOPER_TOOLS,
  //   REDUX_DEVTOOLS,
  // } = require("electron-devtools-installer");
  // installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
  //   .then((name) => console.log(`Added Extension:  ${name}`))
  //   .catch((err) => console.log("An error occurred: ", err));
  createWindow();
});

app.on("before-quit", () => {
  // kill aria2 process
  if (getAriaProc()) {
    console.log("kill aria2 from main");
    killAriaProc();
  } else {
    console.log("cannot find aria2 alive from main");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

//获取用户下载目录的路径
ipcMain.handle("getDownloadDir", (event) => {
  return app.getPath("downloads");
});

/**
 * 打开文件选择框
 * @param oldPath - 上一次打开的路径
 */
ipcMain.handle(
  "openFileDialog",
  async (event, oldPath = app.getPath("downloads")) => {
    if (!mainWindow) return oldPath;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "选择保存位置",
      properties: ["openDirectory", "createDirectory"],
      defaultPath: oldPath,
    });
    return !canceled ? filePaths[0] : oldPath;
  }
);