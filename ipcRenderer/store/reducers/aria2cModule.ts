import { Update } from "../actions/index";
import AriaJsonRPC from "@/GlobalComponents/AriaJsonRpc";
const { launchAria, hostUrl, secret } = window.Aria2cControler;
const { electron } = window;
class aria2cModule {
  connectionState: null | boolean = null; //aria2c连接的状态
  refreshLoopId: null | number = null; //aria2c获取任务的定时器
  rpc: AriaJsonRPC = null;
  tasks: Map<string, Task> = new Map();
  noLocalFileTasks: Map<string, Task> = new Map(); //当本地文件被删除了，但是在aria2c那边无法更改其状态，所以我们在获取到最新的tasks后，过滤下
  @Update
  update() {}

  setConnectionState(status) {
    this.connectionState = status;
    this.update();
  }

  refreshTasks() {
    this.rpc.getTasksAndStatus().then(({ tasks, stat }) => {
      const keys: any = tasks.keys();
      for (const key of keys) {
        if (this.noLocalFileTasks.has(key)) {
          tasks.set(key, this.noLocalFileTasks.get(key));
        }
      }

      this.tasks = tasks;
      this.update();
    });
  }

  setNoLocalFileTasks(type: "add" | "delete", noLocalFileTasks: Task) {
    switch (type) {
      case "add":
        this.noLocalFileTasks.set(noLocalFileTasks.gid, noLocalFileTasks);
        break;
      case "delete":
        this.noLocalFileTasks.delete(noLocalFileTasks.gid);
        break;
    }
    this.update();
  }

  //连接rpc
  connect() {
    this.rpc = new AriaJsonRPC(
      hostUrl,
      secret,
      this.onAriaResponse,
      this.onAriaError
    );
    // register handlers for notifications
    const eventHandlers = {
      "aria2.onDownloadStart": this.refreshTasks,
      "aria2.onDownloadPause": this.refreshTasks,
      "aria2.onDownloadStop": this.refreshTasks,
      "aria2.onDownloadComplete": this.refreshTasks,
      "aria2.onDownloadError": this.refreshTasks,
      "aria2.onBtDownloadComplete": this.refreshTasks,
    };
    for (const event in eventHandlers) {
      const func = eventHandlers[event];
      this.rpc.on(event, (message) => {
        this.onAriaNotification(event, message);
        func();
      });
    }
    this.rpc.connect(
      () => this.onConnSuccess(),
      () => this.onConnClose(),
      () => this.onConnErr()
    );
    this.update();
  }

  //建立WebSocket连接成功
  onConnSuccess() {
    console.log("onConnSuccess");
    this.connectionState = true;
    this.refreshLoopId = window.setInterval(() => {
      this.refreshTasks();
    }, 500);
    this.update();
  }

  //建立WebSocket连接失败
  onConnErr() {
    launchAria();
    // it seems to be necessary to wait a little
    // for aria2c server to fully start
    setTimeout(() => {
      this.rpc.connect(
        () => this.onConnSuccess(),
        () => this.onConnClose(),
        () => this.onConnErr()
      );
    }, 200);
    this.update();
  }

  //手动关闭已有的WebSocket连接，成功后的回调
  onConnClose() {
    this.connectionState = null;
    this.refreshLoopId = null;
    this.rpc = null;
    this.update();
  }

  //收到Aria的异步提示的消息，优先级最高
  onAriaNotification(method, response) {
    console.log("onAriaNotification", method, response);
    const { gid } = response;
    if (!this.tasks.has(gid)) {
      console.warn(`task with gid ${gid} cannot be found`);
    }
    const task = this.tasks.get(gid);
    const name = task.fileName;
    let eventDesc = {
      "aria2.onDownloadComplete": () => {
        electron.ipcRenderer.invoke("showNotification", {
          title: "",
          body: name + "——" + "下载已完成",
        });
      },
      "aria2.onDownloadStart": () => {},
      "aria2.onDownloadPause": () => {},
      "aria2.onDownloadStop": () => {},
      "aria2.onDownloadError": () => {},
      "aria2.onBtDownloadComplete": () => {},
    };
    eventDesc[method] && eventDesc[method]();
  }

  //收到Aria的正确的回应
  onAriaResponse(method, args, response) {
    console.log("onAriaResponse", method, response);
    // const func = AriaMessages[method];

    // if (func !== undefined) {
    //   const message = func(args, response);
    //   if (message !== null) {
    //     this.props.displayNotification(message);
    //   }
    // } else {
    //   this.props.displayNotification(
    //     `${method.replace("aria2.", "")} succeeded`
    //   );
    // }
  }

  //收到Aria的错误的回应
  onAriaError(_method, _args, error) {
    console.log(`Error: ${error.message}`, "error");
  }

  //手动触发关闭websocket的连接
  disconnect() {
    window.clearInterval(this.refreshLoopId);
    this.rpc.disconnect();
  }

  displayNotification(message) {
    console.log(message, "message");
  }

  /**
   * 添加下载
   * @param uris
   * @param options
   */
  addUris(uris: string[], options: Options) {
    const requests = uris.map((uri) =>
      this.rpc.call("aria2.addUri", [[uri], options])
    );
    Promise.all(requests)
      .then(() => this.rpc.getTasksAndStatus())
      .then(({ tasks, stat }) => {
        this.tasks = tasks;
        this.update();
        // dispatch(newNotification({
        //     type: "success",
        //     message: `Added ${uris.length} task${uris.length > 1 ? "s": ""}`
        // }))
      });
  }

  /**
   * 删除下载
   * @param gid
   */
  deleteTask(gid: string, fullData) {
    if (fullData.status == "complete" || fullData.status == "noLocalFile") {
      //此方法 从内存中删除由gid表示的已完成/错误/已删除下载。此方法返回OK成功
      this.rpc.call("aria2.removeDownloadResult", [gid]).then(() => {
        this.refreshTasks();
      });
    } else {
      this.rpc
        .call("aria2.remove", [gid])
        .then(() => {
          this.refreshTasks();
        })
        .catch(() => {
          this.rpc.call("aria2.forceRemove", [gid]).then(() => {
            this.refreshTasks();
          });
        });
    }
  }

  /**
   * 暂停下载
   * @param gid
   */
  pauseTask(gid: string) {
    this.rpc
      .call("aria2.pause", [gid])
      .then(() => {
        this.refreshTasks();
      })
      .catch(() => {
        this.rpc.call("aria2.forceRemove", [gid]).then(() => {
          this.refreshTasks();
        });
      });
  }

  /**
   * 恢复下载
   * @param gid
   */
  resumeTask(gid: string) {
    this.rpc.call("aria2.unpause", [gid]).then(() => {
      this.refreshTasks();
    });
  }

  /**
   * 清空所有已下载的
   */
  cleanEmptyTask() {
    this.rpc.call("aria2.purgeDownloadResult", []).then(() => {
      this.refreshTasks();
    });
  }
}

export default new aria2cModule();

type Status =
  | "active"
  | "waiting"
  | "paused"
  | "error"
  | "complete"
  | "removed"
  | "noLocalFile";
export interface Task {
  bitfield?: string;
  bittorrent?: {
    announceList?: string[][];
    comment: string;
    creationDate: number;
    info: {
      name: string;
    };
    mode: string;
  };
  completedLength: string;
  connections: string;
  dir: string;
  downloadSpeed: string;
  errorCode?: string;
  errorMessage?: string;
  followedBy?: string[];
  following?: string;
  belongsTo?: string;
  files: {
    completedLength: string;
    index: string;
    length: string;
    path: string;
    selected: string;
    uris: {
      status: string;
      uri: string;
    }[];
  }[];
  gid: string;
  infoHash: string;
  numPieces: string;
  numSeeders: string;
  pieceLength: string;
  seeder: string;
  status: Status;
  totalLength: string;
  uploadLength: string;
  uploadSpeed: string;
  fileName: string;
  fileIcon: string;
}
// union type from tuple, see
// https://stackoverflow.com/questions/45251664/typescript-derive-union-type-from-tuple-array-values
type Lit = string | number | boolean | undefined | null | void | {};
const tuple = <T extends Lit[]>(...args: T) => args;
export const optionNames = tuple(
  "all-proxy",
  "all-proxy-passwd",
  "all-proxy-user",
  "allow-overwrite",
  "allow-piece-length-change",
  "always-resume",
  "async-dns",
  "auto-file-renaming",
  "bt-enable-hook-after-hash-check",
  "bt-enable-lpd",
  "bt-exclude-tracker",
  "bt-external-ip",
  "bt-force-encryption",
  "bt-hash-check-seed",
  "bt-load-saved-metadata",
  "bt-max-peers",
  "bt-metadata-only",
  "bt-min-crypto-level",
  "bt-prioritize-piece",
  "bt-remove-unselected-file",
  "bt-request-peer-speed-limit",
  "bt-require-crypto",
  "bt-save-metadata",
  "bt-seed-unverified",
  "bt-stop-timeout",
  "bt-tracker",
  "bt-tracker-connect-timeout",
  "bt-tracker-interval",
  "bt-tracker-timeout",
  "check-integrity",
  "checksum",
  "conditional-get",
  "connect-timeout",
  "content-disposition-default-utf8",
  "continue",
  "dir",
  "dry-run",
  "enable-http-keep-alive",
  "enable-http-pipelining",
  "enable-mmap",
  "enable-peer-exchange",
  "file-allocation",
  "follow-metalink",
  "follow-torrent",
  "force-save",
  "ftp-passwd",
  "ftp-pasv",
  "ftp-proxy",
  "ftp-proxy-passwd",
  "ftp-proxy-user",
  "ftp-reuse-connection",
  "ftp-type",
  "ftp-user",
  "gid",
  "hash-check-only",
  "header",
  "http-accept-gzip",
  "http-auth-challenge",
  "http-no-cache",
  "http-passwd",
  "http-proxy",
  "http-proxy-passwd",
  "http-proxy-user",
  "http-user",
  "https-proxy",
  "https-proxy-passwd",
  "https-proxy-user",
  "index-out",
  "lowest-speed-limit",
  "max-connection-per-server",
  "max-download-limit",
  "max-file-not-found",
  "max-mmap-limit",
  "max-resume-failure-tries",
  "max-tries",
  "max-upload-limit",
  "metalink-base-uri",
  "metalink-enable-unique-protocol",
  "metalink-language",
  "metalink-location",
  "metalink-os",
  "metalink-preferred-protocol",
  "metalink-version",
  "min-split-size",
  "no-file-allocation-limit",
  "no-netrc",
  "no-proxy",
  "out",
  "parameterized-uri",
  "pause",
  "pause-metadata",
  "piece-length",
  "proxy-method",
  "realtime-chunk-checksum",
  "referer",
  "remote-time",
  "remove-control-file",
  "retry-wait",
  "reuse-uri",
  "rpc-save-upload-metadata",
  "seed-ratio",
  "seed-time",
  "select-file",
  "split",
  "ssh-host-key-md",
  "stream-piece-selector",
  "timeout",
  "uri-selector",
  "use-head",
  "user-agent"
);

export type OptionName = typeof optionNames[number];
export type Options = {
  [option in OptionName]?: string;
};
