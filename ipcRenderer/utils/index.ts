export default {
  //格式化最小单位到B
  mertic(bytes) {
    if (isNaN(bytes)) {
      return "";
    }
    var symbols = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
      exp = 0;
    }
    var i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);

    if (bytes.toString().length > bytes.toFixed(2).toString().length) {
      bytes = bytes.toFixed(2);
    }
    return bytes + " " + symbols[i];
  },
  //格式化最小单位到KB
  merticKB(bytes) {
    if (isNaN(bytes)) {
      return "";
    }
    var symbols = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
      exp = 0;
    }
    var i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);

    if (bytes.toString().length > bytes.toFixed(2).toString().length) {
      bytes = bytes.toFixed(2);
    }
    return bytes + " " + symbols[i];
  },
};
