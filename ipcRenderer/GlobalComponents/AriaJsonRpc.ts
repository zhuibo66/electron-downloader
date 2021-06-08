import JsonRPC from "simple-jsonrpc-js";

export type MethodName = string;
export type Token = string;
export type JsonRPC = any;

export type NotificationResponse = { gid: string };

const callback = (func: Function, args: any[], notify) => {
  if (notify) {
    func(...args);
  }
};

const getAllTasksMethods = [
  { methodName: "aria2.tellActive", args: [] },
  { methodName: "aria2.tellWaiting", args: [0, 100] },
  { methodName: "aria2.tellStopped", args: [0, 100] },
];

export default class AriaJsonRpc {
  url: string;
  secret: string;
  jrpc: JsonRPC;
  socket: WebSocket;
  onAriaResponse: Function;
  onAriaError: Function;
  hasBeenOpen: boolean;

  constructor(
    url: string,
    secret: string,
    onAriaResponse: Function,
    onAriaError: Function
  ) {
    this.url = url;
    this.secret = secret;
    this.jrpc = new JsonRPC();
    this.socket = undefined;
    this.onAriaResponse = onAriaResponse;
    this.onAriaError = onAriaError;
    this.hasBeenOpen = false;
  }

  connect(
    onOpen: () => void,
    onConnClose: () => void,
    onConnErr: () => void
  ) {
    const socket = new WebSocket(this.url);
    //JsonRPC 一个函数指针，使用前需要确定。将被调用以向远程主机发送消息
    this.jrpc.toStream = (_msg) => {
      socket.send(_msg);
    };
    socket.onmessage = (event) => {
      this.jrpc.messageHandler(event.data);
    };
    socket.onclose = (event) => {
      //如果正常的手动关闭的话，就不需要重新连接了
      if (this.hasBeenOpen) {
        onConnClose();
      } else {
        onConnErr();
      }
    };
    // TODO: handle normal WS errors better
    socket.onerror = (event) => {
      console.log(event);
    };
    socket.onopen = () => {
      this.socket = socket;
      this.hasBeenOpen = true;
      onOpen();
    };
  }

  disconnect() {
    this.socket.close();
    this.socket = null;
    this.jrpc = null;
  }

  on(event, callback: (response: NotificationResponse) => void) {
    this.jrpc.on(event, callback);
  }

  async call(method: MethodName, args: any[], notify = false): Promise<any> {
    try {
      const result = await this.jrpc.call(
        method,
        [`token:${this.secret}`].concat(args)
      );
      callback(this.onAriaResponse, [method, args, result], notify);
      return result;
    } catch (error) {
      callback(this.onAriaError, [method, args, error], notify);
      throw error;
    }
  }

  async multiCall(
    methods: { methodName: MethodName; args: any[] }[],
    notify = false
  ): Promise<any> {
    const methodsWithSecret = methods.map(({ methodName, args }) => ({
      methodName,
      params: [`token:${this.secret}`].concat(args),
    }));
    const unpack = ([val]) => val;
    try {
      const response = await this.jrpc.call("system.multicall", [
        methodsWithSecret,
      ]);
      const result = response.map(unpack);
      callback(
        this.onAriaResponse,
        ["system.multicall", [methods], result],
        notify
      );
      return result;
    } catch (error) {
      callback(
        this.onAriaError,
        ["system.multicall", [methods], error],
        notify
      );
      throw error;
    }
  }

  async getTasksAndStatus() {
    const methods = getAllTasksMethods.concat([
      {
        methodName: "aria2.getGlobalStat",
        args: [],
      },
    ]);
    const [active, waiting, stopped, stat] = await this.multiCall(methods);
    const tasks: Map<string, any> = new Map();
    for (const ts of [active, waiting, stopped]) {
      for (const t of ts) {
        tasks.set(t.gid, t);
      }
    }
    console.log(tasks, "tasks");
    return { tasks, stat: stat as any };
  }
}
