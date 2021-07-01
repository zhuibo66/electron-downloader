const { app, BrowserWindow, ipcMain, dialog, Notification, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { getAriaProc, killAriaProc } = require('./Aria2cControler');
if (process.platform === 'win32') {
    //通知的具体注意事项查看项目中的，electron-Notification使用方法.md
    let shortcut = path.join(process.env.ALLUSERSPROFILE, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'my-downloader.lnk');
    let res = shell.writeShortcutLink(shortcut, {
        target: process.execPath,
        appUserModelId: process.execPath,
        iconIndex: 0,
    });
    console.log(res, 'Shortcut created');
}
// const log=require('electron-log');
let mainWindow = null;
const debug = /--debug/.test(process.argv[2]);
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        minHeight: 400,
        minWidth: 600,
        webPreferences: {
            preload: path.join(__dirname, '/preload.js'),
        },
    });
    mainWindow.loadURL(debug || !app.isPackaged ? `http://localhost:8080/` : path.join('file://', __dirname, '../build/index.html'));
    // mainWindow.loadURL(path.join("file://", __dirname, "../build/index.html"));
    // mainWindow.loadFile(path.join(__dirname, "../build/index.html"));

    //判断是否 --debug或者应用是否打包（打包true/未打包false），打开开发者工具，窗口最大化，
    if (debug || !app.isPackaged) {
        mainWindow.webContents.openDevTools();
        mainWindow.maximize();
    } else {
        //隐藏菜单栏
        Menu.setApplicationMenu(null);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('maximize', () => {});
}

app.on('ready', () => {
    // const installExtension = require("electron-devtools-installer").default;
    // const {
    //   REACT_DEVELOPER_TOOLS,
    //   REDUX_DEVTOOLS,
    // } = require("electron-devtools-installer");
    // installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((err) => console.log("An error occurred: ", err));

    app.setAppUserModelId(process.execPath);
    createWindow();
});

app.on('before-quit', () => {
    // kill aria2 process
    if (getAriaProc()) {
        console.log('kill aria2 from main');
        killAriaProc();
    } else {
        console.log('cannot find aria2 alive from main');
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

//推送消息给系统，告知那些文件已下载成功
ipcMain.handle('showNotification', (event, data) => {
    const { title, body } = data;
    new Notification({
        title, // 通知的标题, 将在通知窗口的顶部显示
        body, // 通知的正文文本, 将显示在标题或副标题下面
    }).show();
});

//获取用户下载目录的路径
ipcMain.handle('getDownloadDir', event => {
    return app.getPath('downloads');
});

/**
 * 打开文件选择框
 * @param oldPath - 上一次打开的路径
 */
ipcMain.handle('openFileDialog', async (event, oldPath = app.getPath('downloads')) => {
    if (!mainWindow) return oldPath;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: '选择保存位置',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: oldPath,
    });
    return !canceled ? filePaths[0] : oldPath;
});

//图片转base64
function imgToBase64(path) {
    try {
        const imageBuffer = fs.readFileSync(path);
        if (!imageBuffer) return false;
        const imageSuffix = getImageSuffix(imageBuffer);
        if (!imageSuffix) return false;
        const bufferData = Buffer.from(imageBuffer).toString('base64');
        const base64 = 'data:image/' + imageSuffix + ';base64,' + bufferData;
        return base64;
    } catch (error) {
        return false;
    }
}

//获取图片真实的类型
function getImageSuffix(fileBuffer) {
    // 1.JPEG/JPG - 文件头标识 (2 bytes): ff, d8 文件结束标识 (2 bytes): ff, d9
    // 2.TGA - 未压缩的前 5 字节 00 00 02 00 00 - RLE 压缩的前 5 字节 00 00 10 00 00
    // 3.PNG - 文件头标识 (8 bytes) 89 50 4E 47 0D 0A 1A 0A
    // 4.GIF - 文件头标识 (6 bytes) 47 49 46 38 39(37) 61
    // 5.BMP - 文件头标识 (2 bytes) 42 4D B M
    // 6.PCX - 文件头标识 (1 bytes) 0A
    // 7.TIFF - 文件头标识 (2 bytes) 4D 4D 或 49 49
    // 8.ICO - 文件头标识 (8 bytes) 00 00 01 00 01 00 20 20
    // 9.CUR - 文件头标识 (8 bytes) 00 00 02 00 01 00 20 20
    // 10.IFF - 文件头标识 (4 bytes) 46 4F 52 4D
    // 11.ANI - 文件头标识 (4 bytes) 52 49 46 46
    // 将上文提到的 文件标识头 按 字节 整理到数组中
    // 来源：https://segmentfault.com/a/1190000020074437
    const imageBufferHeaders = [
        { bufBegin: [0xff, 0xd8], bufEnd: [0xff, 0xd9], suffix: 'jpg' },
        { bufBegin: [0x00, 0x00, 0x02, 0x00, 0x00], suffix: 'tga' },
        { bufBegin: [0x00, 0x00, 0x10, 0x00, 0x00], suffix: 'rle' },
        {
            bufBegin: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
            suffix: 'png',
        },
        { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], suffix: 'gif' },
        { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], suffix: 'gif' },
        { bufBegin: [0x42, 0x4d], suffix: 'bmp' },
        { bufBegin: [0x0a], suffix: 'pcx' },
        { bufBegin: [0x49, 0x49], suffix: 'tif' },
        { bufBegin: [0x4d, 0x4d], suffix: 'tif' },
        {
            bufBegin: [0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x20, 0x20],
            suffix: 'ico',
        },
        {
            bufBegin: [0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x20, 0x20],
            suffix: 'cur',
        },
        { bufBegin: [0x46, 0x4f, 0x52, 0x4d], suffix: 'iff' },
        { bufBegin: [0x52, 0x49, 0x46, 0x46], suffix: 'ani' },
    ];
    for (const imageBufferHeader of imageBufferHeaders) {
        let isEqual;
        // 判断标识头前缀
        if (imageBufferHeader.bufBegin) {
            const buf = Buffer.from(imageBufferHeader.bufBegin);
            isEqual = buf.equals(
                //使用 buffer.slice 方法 对 buffer 以字节为单位切割
                fileBuffer.slice(0, imageBufferHeader.bufBegin.length)
            );
        }
        // 判断标识头后缀
        if (isEqual && imageBufferHeader.bufEnd) {
            const buf = Buffer.from(imageBufferHeader.bufEnd);
            isEqual = buf.equals(fileBuffer.slice(-imageBufferHeader.bufEnd.length));
        }
        if (isEqual) {
            return imageBufferHeader.suffix;
        }
    }
    // 未能识别到该文件类型
    return false;
}

ipcMain.handle('getFileIcon', async (event, filePath) => {
    const defaultFileIconPath = path.join(__dirname, './static/images/icon_default.png');
    const iconDefault = await imgToBase64(defaultFileIconPath);
    if (!filePath) return iconDefault;
    const icon = await app.getFileIcon(filePath, {
        size: 'large',
    });
    return icon.toDataURL();
});
