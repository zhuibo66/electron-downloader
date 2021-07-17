## 介绍

基于这么个需求，就是打开一个网盘的分享链接，但是并不想登录网盘，也可以进行下载，当然这块已经有人做了（可自行搜索【网盘链接在线解析】的相关关键词），用过这类网站的朋友，应该都知道，解析出来的下载链接，下载的时候是需要在header中带上特定的参数，才可以进行下载的。

尽管说在解析网站上已经提供了全套的下载工具和解决方案，但是出于学习的目的，于是就开始研究了Electron+aria2c。

## 下载

+ [Stable release](https://github.com/zhuibo66/electron-downloader/releases)

## 预览

![添加下载任务](https://github.com/zhuibo66/electron-downloader/raw/master/.Screenshots/addDownloadTask.jpg)

![下载任务进行中](https://github.com/zhuibo66/electron-downloader/raw/master/.Screenshots/downloading.jpg)

![下载任务已完成](https://github.com/zhuibo66/electron-downloader/raw/master/.Screenshots/downloaded.jpg)

## 安装

```bash
git clone https://github.com/zhuibo66/electron-downloader.git
```

### 第一步：安装项目所需依赖

```bash
# 通过 npm 安装
npm install

# 通过 yarn 安装
yarn
```
### 第二步. 运行/打包

```bash
# 运行
npm run dev:web
npm run dev:electron

# 打包
npm run build:web
npm run build:win
```

## 参考链接

* [Motrix](https://github.com/agalwood/Motrix)
* [electron-aria2](https://github.com/jack9966qk/electron-aria2)
* [aria2c官方文档](http://aria2.github.io/)
* [aria2c](https://aria2c.cn/)