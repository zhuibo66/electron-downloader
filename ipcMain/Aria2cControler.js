const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { ipcRenderer } = require("electron");
// fix broken OS $PATH when launched from GUI
// https://github.com/electron-userland/electron-packager/issues/603
// const fixPath = require("fix-path");
// fixPath();

let ariaProc;
const secret = "secret";
module.exports = {
  hostUrl: "ws://localhost:6800/jsonrpc",
  secret,
  getAriaProc: () => {
    return ariaProc;
  },
  launchAria: async () => {
    console.log("launchAria get called");
    // const dhtPath = path.join(__dirname, "save", "dht.dat");
    const sessionPath = path.join(__dirname, "save", "session");
    //获取用户下载目录的路径
    const downloadPath = await ipcRenderer.invoke("getDownloadDir");
    console.log(downloadPath, "downloadPath");
    const ariaPath =
      process.platform === "win32"
        ? path.join(__dirname, "bin", "win64", "aria2c.exe")
        : process.platform === "darwin"
        ? path.join(__dirname, "bin", "macOS", "aria2c")
        : "aria2c";
    const args = [
      // `--dir=${downloadPath}`,
      //添加代理用以调试
      // "--all-proxy=127.0.0.1:8888",
      "--enable-rpc=true",
      `--rpc-listen-port=6800`,
      `--rpc-secret=${secret}`,
      //   下面这几个参数都是跟bt下载有关系的
      //   `--enable-dht=true`,
      //   `--dht-file-path=${dhtPath}`,
      //   `--dht-entry-point=router.bittorrent.com:6881`,
      //   `--bt-enable-lpd=true`,
      `--save-session=${sessionPath}`,
    ];
    if (fs.existsSync(sessionPath)) {
      args.push(`--input-file=${sessionPath}`);
    }
    console.log(`launch aria2 with args: ${args}`);
    ariaProc = spawn(ariaPath, args);
    ariaProc.stdout.pipe(process.stdout);
    ariaProc.stderr.pipe(process.stderr);
    return ariaProc;
  },
  killAriaProc: () => {
    ariaProc.kill();
  },
};
