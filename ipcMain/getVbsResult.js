const { execSync } = require("child_process");
let result= execSync('CScript ./ipcMain/getStartMenuPath.vbs',{encoding:"utf-8"})
console.log(result.split('\r\n'));