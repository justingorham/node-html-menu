var _ = require('lodash');
var S = require('string');
var EOL = require('os').EOL;

function MenuItem(newLabel, newPath, newMathcingPaths) {

    // private properties
    var that = this,
        attributes = {},
        childrenItems = [],
        label = standardizeLabel(newLabel),
        parent = null,
        path = standardizePath(newPath),
        cssClass = [],
        matchingPaths = [];
    if (_.isArray(newMathcingPaths)) {
        for (var i = 0; i < newMathcingPaths.length; i++) {
            if (newMathcingPaths[i] instanceof RegExp) {
                matchingPaths.push(newMathcingPaths[i]);
            }
        }
    }

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

    // private functions
    function standardizeLabel(labelToStandardize) {
        return _.isString(labelToStandardize) ? labelToStandardize : '';
    }

    function standardizePath(pathToStandardize) {
        return _.isString(pathToStandardize) ?
            S(pathToStandardize)
                .toLowerCase()
                .collapseWhitespace()
                .replaceAll('/ ', '/')
                .replaceAll(' ', '-')
                .escapeHTML()
                //.ensureLeft('/')
                .replace(/\/\/+/g, '/')
                .s
            : '/';
    }

    // public properties
    Object.defineProperty(that, 'label', {
        enumerable: true,
        get: function () {
            return label;
        }
    });

    Object.defineProperty(that, 'path', {
        enumerable: true,
        get: function () {
            return path;
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

    Object.defineProperty(that, 'children', {
        enumerable: true,
        get: function () {
            return childrenItems.slice();
        }
    });

    Object.defineProperty(that, 'matchingPaths', {
        enumerable: true,
        get: function () {
            return matchingPaths.slice();
        }
    });

    Object.defineProperty(that, 'parent', {
        enumerable: true,
        get: function () {
            return parent;
        },
        set: function (newParent) {
            if (parent === newParent) return;
            if (parent) {
                var oldParent = parent;
                parent = null;
                oldParent.removeChild(that);
            }
            if (newParent && newParent instanceof MenuItem) {
                parent = newParent;
                parent.addChild(that);
            }
        }
    });

    Object.defineProperty(that, 'cssClass', {
        enumerable: true,
        get: function () {
            return cssClass.join(' ');
        }
    });

    // instance methods
    this.findChild = function (properties) {
        if (!properties) return null;
        var filteredProperties = _.pick(properties, ['label', 'path']);
        if (_.keys(filteredProperties).length <= 0) return null;
        return _.findWhere(childrenItems, filteredProperties);
    };

    this.addChild = function (childItem) {
        if (childItem instanceof MenuItem) {
            if (that.findChild(childItem) === childItem) return;
            childrenItems.push(childItem);
            childItem.parent = that;
        }
    };

    this.addNewChild = function (newLabel, newPath, newMatchingPaths) {
        var child = new MenuItem(newLabel, newPath, newMatchingPaths);
        var existingChild = that.findChild(child);
        if (existingChild) return existingChild;
        that.addChild(child);
        return child;
    };

    this.removeChild = function (childItem) {
        if (!childItem) return null;
        var child = that.findChild(childItem);
        if (!child) return null;
        childrenItems = _.reject(childrenItems, function (element) {
            return element === child;
        });
        child.parent = null;
        return child;
    };

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

    this.addMatchPath = function (matchPath) {
        if (!(matchPath instanceof RegExp)) return;
        if (!_.contains(matchingPaths, matchPath))
            matchingPaths.push(matchPath);
    };

    this.removeMatchPath = function (matchPath) {
        if (!(matchPath instanceof RegExp)) return;
        matchingPaths = _.reject(matchingPaths, function (aPath) {
            return aPath === matchPath;
        });
    };
}

//private properties and methods accessible to public and static properties
MenuItem.prototype.defaultTemplate = '<li{{attributes}}><a href="{{path}}">{{label}}</a>{{childrenElements}}</li>';

MenuItem.prototype.childrenToHtml = function (menuItemChildren) {
    if (menuItemChildren.length === 0) return '';
    var childArray = _.map(menuItemChildren, function (child) {
        return child.toHTML();
    });
    return S(childArray.join(EOL)).wrapHTML('ul').s;
};

Object.defineProperty(MenuItem, 'defaultTemplate', {
    get: function () {
        return defaultTemplate;
    }
});

MenuItem.prototype.matchesPath = function (pathToMatch) {
    if (!_.isString(pathToMatch)) return false;
    if (pathToMatch === this.path) return true;
    for (var i = 0; i < this.matchingPaths.length; i++) {
        if (this.matchingPaths[i].test(pathToMatch)) {
            return true;
        }
    }
    return false;
};

MenuItem.prototype.toJSON = function () {
    var obj = {};
    obj.label = this.label;
    obj.path = this.path;
    obj.attributes = _.clone(this.attributes);
    obj.children = [];
    this.children.forEach(function (element) {
        obj.children.push(element.toJSON());
    });
    return obj;
};

MenuItem.prototype.toString = function () {
    return JSON.stringify(this.toJSON());
};

MenuItem.prototype.toHTML = function (configuration) {
    var config = configuration || {};
    var template = config.htmlTemplate || this.defaultTemplate;
    var renderChildrenFunction = config.renderChildren || this.childrenToHtml;
    var attributesString = this.attributes.toString({
        postProcess: function (val) {
            return val.length > 0 ? ' ' + val : val;
        }
    });
    var unchangeableValues = {
        attributes: attributesString,
        path: this.path,
        label: this.label,
        childrenElements: renderChildrenFunction(this.children)
    };

    // place non-override values in the ride place
    var values = _.extend(config.templateValues || {}, unchangeableValues);

    //return the filled out template
    return S(template).template(values).s;
};


module.exports = MenuItem;