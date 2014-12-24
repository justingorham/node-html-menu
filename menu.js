var _ = require('lodash');
var S = require('string');
var MenuItem = require('./menuItem.js');

function Menu(menuName) {
    var that = this,
        menuItems = [],
        name = _.isString(menuName) ? menuName : 'menu',
        attributes = {},
        cssClass = [];

    var attributesToString = function (settings) {
        var theseSettings = settings || {};
        var attributeArray = [];
        var cssClass = that.cssClass;
        if (cssClass.length > 0) {
            attributeArray.push('class="' + cssClass + '"');
        }
        var attrKeys = _.keys(attributes);
        attrKeys.forEach(function (element) {
            var lowerElement = element.toLowerCase().trim();
            if (lowerElement === 'class' || lowerElement === 'href') return;
            var value = attributes[element];
            if (typeof value !== 'string') return;
            value = value.replace(/"/g, "'");
            attributeArray.push(lowerElement + '="' + value + '"');
        });
        var stringValue = attributeArray.join(' ');
        if (_.isFunction(theseSettings.postProcess)) {
            stringValue = theseSettings.postProcess(stringValue);
        }
        return stringValue;
    };
    attributes.toString = attributesToString;

    Object.defineProperty(that, 'menuItems', {
        enumerable: true,
        get: function () {
            return menuItems.slice();
        }
    });

    Object.defineProperty(that, 'name', {
        enumerable: true,
        get: function () {
            return name;
        }
    });

    Object.defineProperty(that, 'attributes', {
        enumerable: true,
        get: function () {
            return attributes;
        },
        set: function (newValue) {
            attributes = _.isObject(newValue) ? newValue : {};
            attributes.toString = attributesToString;
        }
    });

    Object.defineProperty(that, 'cssClass', {
        enumerable: true,
        get: function () {
            return cssClass.join(' ');
        }
    });

    var validateClassName = function (className) {
        if (typeof className !== "string") return null;
        var cleanClassName = S(className).collapseWhitespace().replace(/["'.#]/g, '');
        if (cleanClassName.isEmpty()) return null;
        return cleanClassName.s.split(' ');
    };

    this.addClass = function (className) {
        var classNameArray = validateClassName(className);
        if (!classNameArray) return;
        cssClass = _.union(cssClass, classNameArray);
    };

    this.removeClass = function (className) {
        var classNameArray = validateClassName(className);
        if (!classNameArray) return;
        cssClass = _.difference(cssClass, classNameArray);
    };

    this.addMenuItem = function (menuItem) {
        if (!(menuItem instanceof MenuItem)) return;
        menuItems.push(menuItem);
    };

    this.addNewMenuItem = function (newLabel, newPath, newMatchingPaths) {
        var item = new MenuItem(newLabel, newPath, newMatchingPaths);
        menuItems.push(item);
        return item;
    };

    this.removeMenuItem = function (menuItem) {
        if (!menuItem) return null;
        var filteredProperties = _.pick(menuItem, ['label', 'path']);
        if (_.keys(filteredProperties).length <= 0) return null;
        var actualItem = _.findWhere(menuItems, filteredProperties);


        if (!actualItem) return null;
        menuItems = _.reject(menuItems, function (element) {
            return element === actualItem;
        });
        return actualItem;
    };
}

Menu.prototype.defaultTemplate = "<ul{{attributes}}>{{childrenElements}}</ul>"

Menu.prototype.toHTML = function (configuration) {
    var config = configuration || {};
    var template = config.template || this.defaultTemplate;
    var renderedMenu = _.map(this.menuItems, function (menuItem) {
        return menuItem.toHTML();
    });
    var attributesString = this.attributes.toString({
        postProcess: function (val) {
            return val.length > 0 ? ' ' + val : val;
        }
    });
    var unchangeableValues = {
        attributes: attributesString,
        path: this.path,
        label: this.label,
        childrenElements: renderedMenu
    };

    // place non-override values in the ride place
    var values = _.extend(config.templateValues || {}, unchangeableValues);

    return S(template).template(values).s;
};

Menu.prototype.findMenuItemByPath = function (pathString) {
    if (!(pathString && _.isString(pathString))) return null;
    var safePathString = pathString.toLowerCase();
    return doMenuSearch(safePathString, this.menuItems);
};

var doMenuSearch = function (safePathString, menuItems) {
    var item = _.find(menuItems, function (item) {
        return item.matchesPath(safePathString);
    });
    if (item) return item;
    for (var i = 0; i < menuItems.length; i++) {
        item = doMenuSearch(safePathString, menuItems[i].children);
        if (item) return item;
    }
    return null;
};

Menu.prototype.__express = function (req, res, next) {
    var menuItem = this.findMenuItemByPath(req.path);
    if (menuItem) {
        var tempItem = menuItem;
        while (tempItem.parent !== null) {
            tempItem = tempItem.parent;
        }
        tempItem.addClass('active');

    }
    res.locals[this.name] = this.toHTML();
    next();
};

module.exports = Menu;