### 开发背景
电脑系统：Windows 10企业版G
electron：13.1.2
electron-builder：22.11.7

### 先过一遍Electron中关于通知的文档
网址：<a href="https://www.electronjs.org/docs/tutorial/notifications" target="_blank">Electron 文档
Docs / Guides / 通知 (Windows, Linux, macOS) </a>

这里就给大家截图下，我认为使用通知功能中最重要的部分吧。

![image-20210626155717002](https://i.loli.net/2021/06/26/hcajd8bPgX6tZ4D.png)

注意：文档中说的启动菜单，对应的就是这个目录【C:\ProgramData\Microsoft\Windows\Start Menu\Programs】，这里小编不确定的是大家的开始菜单的路径是否一致，所以在文章的开头已经交代了开发背景，如果不一致的话，大家可以使用以下的方法进行查看。

按`Win键+R`进入运行窗口，输入并执行`shell:Common Programs`命令


### 开发环境下怎么使用并开启通知？

1、打开开始菜单的路径，然后右键->新建——>快捷方式->选择自己项目下的node_modules\electron\dist\electron.exe->点击下一步->点击完成

![image-20210626164705170](https://i.loli.net/2021/06/26/NxCAldgnbDTYaFt.png)

2、在主进程添加上这行代码：
```
app.setAppUserModelId(process.execPath);//这里代码固定这样的，不用怀疑，因为小编也怀疑过，然并卵，相信官方文档才是王道。
```
3、根据官方文档的列子，使用Notification，如
```electron
const { Notification } = require('electron')

const NOTIFICATION_TITLE = 'Basic Notification'
const NOTIFICATION_BODY = 'Notification from the Main process'

function showNotification () {
  new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show()
}

app.whenReady().then(createWindow).then(showNotification)
```

### 生产环境下怎么使用并开启通知？

由于生成环境下，已经打包成了安装包，而安装后，就会把对应的程序添加到开始菜单中（也就相当于生成环境的步骤1），所以我们不需要做步骤1了，而接下来的的步骤2，3都是一样的，直接copy代码就好了。

### 都按照上面的步骤做了，还是没有显示通知？

1、首先，用`Notification.isSupported()`看下当前系统是不是支持通知，如果返回的true，既是支持，否则不支持。

2、排查了系统支持的问题，那么接下来看下系统设置里面，是否把【获取来自应用和其他发送者的通知】给关闭了/开启了【专注助手】。

开启获取来自应用和其他发送者的通知的方法，桌面右键->显示设置->通知和操作->勾选获取来自应用和其他发送者的通知

关闭专注助手的方法：桌面右键->显示设置->专注助手->勾选关

![image-20210626171401985](https://i.loli.net/2021/06/26/EeGIdJml3VhaNRW.png)

### 手动把应用添加到开始菜单中，好麻烦啊，有没有自动化啊？

有的，我们的原则就是代码能做的，坚决不手动，哈哈哈，代码如下：
```electron
const { shell } = require("electron");
if (process.platform === 'win32') {
    //这里大家要注意下获取到的路径是否跟你电脑上开始菜单的路径是否一致，如果不一致的话，记得改下路径（就说明这个脚本不自动化了，欢迎大家测试）。
    let shortcutPath = path.join(process.env.ALLUSERSPROFILE, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'electron.lnk');
    let res = shell.writeShortcutLink(shortcutPath, {
        target: process.execPath,
        appUserModelId: process.execPath,
        icon: path.join(__dirname, 'img', 'icon.ico'),
        iconIndex: 0
    });
    if (res) {
        console.log('Shortcut created successfully');
    } else {
        console.log('Failed to create the shortcut');
    }
}
```
参考资料：<a href="https://www.tabnine.com/code/javascript/functions/electron/Shell/writeShortcutLink" target="_blank">https://www.tabnine.com/code/javascript/functions/electron/Shell/writeShortcutLink</a>

### 20210627更新

惊呆了，相同的代码，换了台电脑，啥都不用设置，直接就可以显示通知，文章是不是白写了？

当然不是啦，毕竟每台电脑的环境不同，把所有可能出现的情况都列举出来，还怕搞不定electron的Notification通知，把它吃的透透的，哈哈。
