const { contextBridge, ipcRenderer, clipboard } = require('electron');
contextBridge.exposeInMainWorld('electron', require('electron'));
contextBridge.exposeInMainWorld('node_fs', require('fs'));
contextBridge.exposeInMainWorld('node_path', require('path'));
contextBridge.exposeInMainWorld('Aria2cControler', require('./Aria2cControler'));

/**
 * 右键菜单控制
 * @param {*} e 事件
 * @returns 
 */
const handleContextMenu = e => {
    e.preventDefault();
    const tagName = document.activeElement.tagName; // 焦点元素的tagName
    const str = clipboard.readText(); // 剪贴板中的内容
    const selectStr = window.getSelection ? window.getSelection().toString() : document.selection.createRange().text; // 选中的内容
    const text = e.target.innerText || ''; // 目标标签的innerText
    const value = e.target.value || ''; // 目标标签的value
    if (selectStr) {
        // 在选中的元素或者输入框 上面点右键，这样在选中后点别处就不会出现右键复制菜单
        if (text.includes(selectStr) || value.includes(selectStr)) {
            ipcRenderer.invoke('setMenu', { label: '复制', role: 'copy' });
            return;
        }
    }
    if (str && (tagName === 'INPUT' || tagName === 'TEXTAREA')) {
        // 若为输入框 且 剪贴板中有内容，则显示粘贴菜单
        ipcRenderer.invoke('setMenu', { label: '粘贴', role: 'paste' });
        return;
    }
};
window.addEventListener('contextmenu', handleContextMenu);
