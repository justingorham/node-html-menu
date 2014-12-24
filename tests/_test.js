var path = require('path');
var menuSystem = require(path.join(__dirname, '..', 'index.js'));
var MenuItem = menuSystem.menuItem;
var Menu = menuSystem.menu;

var home = new MenuItem('Home', '/home');
home.addClass("hello world   yep");
var settings = home.addNewChild('Settings', 'settings');
home.addChild(settings);
home.addNewChild('HomeGrown', '/grown');
home.attributes['data-ng-click'] = 'runIt("yeah");';
settings.attributes.class = 'hello';
var child = settings.addNewChild('Little', '/child');
var config = {
    htmlTemplate: '<li{{attributes}}><a href="{{path}}">{{label}}{{renderIfChildren}}</a>{{childrenElements}}</li>',
    templateValues: {renderIfChildren: '<b class="caret"></b>'}
};
//console.log(home.toHTML(config));
var mainMenu = new Menu();
mainMenu.addMenuItem(home);
mainMenu.addClass('nav');
mainMenu.attributes["data-ng-bind"] = "a function";

console.log(mainMenu.toHTML());


module.exports = mainMenu;