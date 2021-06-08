import { Update } from "../actions/index";
import AriaJsonRPC from "@/GlobalComponents/AriaJsonRpc";
const { launchAria, hostUrl, secret } = window.Aria2cControler;

class aria2cModule {
  connectionState: null | boolean = null; //aria2c连接的状态
  refreshLoopId: null | number = null; //aria2c获取任务的定时器
  rpc: AriaJsonRPC = null;
  
  @Update
  update() {}

  setConnectionState(status) {
    this.connectionState = status;
    this.update();
  }

  refreshTasks() {
    this.rpc.getTasksAndStatus().then(({ tasks, stat }) => {
      console.log(tasks, stat);
    });
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
        func();
        this.onAriaNotification(event, message);
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
    // const { gid } = response;
    // if (!this.props.server.tasks.has(gid)) {
    //   console.warn(`task with gid ${gid} cannot be found`);
    // }
    // const task = this.props.server.tasks.get(gid);
    // const name = getName(task);
    // switch (method) {
    //   case "aria2.onDownloadStart":
    //     console.log(`Task "${name}" started`);
    //     break;
    //   case "aria2.onDownloadPause":
    //     console.log(`Task "${name}" paused`);
    //     break;
    //   case "aria2.onDownloadStop":
    //     console.log(`Task "${name}" stopped`);
    //     break;
    //   case "aria2.onDownloadComplete":
    //     console.log(`Task "${name}" completed`, "success");
    //     break;
    //   case "aria2.onDownloadError":
    //     console.log(`Task "${name}" has error`, "error");
    //     break;
    //   case "aria2.onBtDownloadComplete":
    //     console.log(`Task "${name}" completed`);
    //     break;
    //   default:
    //     break;
    // }
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
}

export default new aria2cModule();
