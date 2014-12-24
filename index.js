var fs = require('fs');
var path = require('path');

var files = fs.readdirSync(__dirname);

files.forEach(function (element) {
    var firstChar = element[0];
    if (element === 'index.js' || element==='tests') return;
    var ind = element.lastIndexOf(".js");
    var name = element.slice(0, ind).replace(/\./g, '_');
    Object.defineProperty(exports, name, {
        enumerable: true,
        get: function () {
            return require(path.join(__dirname, element));
        }
    });
});