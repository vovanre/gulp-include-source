'use strict';

var through = require('through2'),
    glob = require('glob'),
    path = require('path'),
    replaceExt = require('replace-ext'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    util = require('util'),
    PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-include-source';

var placeholders = {
    'js': '<script src="%s"></script>',
    'css': '<link rel="stylesheet" href="%s">'
};

function matchExpressions(contents) {
    return contents.match(/<!--\s+include:([a-z]+)\(([^)]+)\)\s+-->/);
}

function replaceExtension(filename, type, options) {

    if (options.scriptExt && type === 'js') {
        filename = replaceExt(filename, '.' + options.scriptExt);
    } else if (options.styleExt && type === 'css') {
        filename = replaceExt(filename, '.' + options.styleExt);
    }

    return filename;
}

function globArray(array, cwd) {
    var result = [];
    array.filter(function (val) {
        if (!val || val.trim() == '')
            return false;
        return true;
    }).forEach(function (val) {
        result = result.concat(glob.sync(val, {
            cwd: cwd
        }));
    });
    return result;
}

function parseFiles(source, cwd, context) {
    if (source.indexOf('list:') === 0) {
        var cleanSrc = source.replace('list:', '');
        if (!context.hasOwnProperty(cleanSrc)) {
            return [];
        }
        return globArray(context[cleanSrc], cwd);
    }

    if (source.indexOf('file:') === 0) {
        var cleanSrc = source.replace('file:', '');
        var result = fs.readFileSync(cleanSrc).toString().split('\n');
        return globArray(result, cwd);
    }

    return glob.sync(source, {
        cwd: cwd
    });
}

function injectFiles(file, options) {
    var contents = file.contents.toString();
    var cwd = options.cwd || path.dirname(file.path);
    var matches = matchExpressions(contents);
    while (matches) {

        var type = matches[1];
        var placeholder;
        if (options.placeholder && options.placeholder[type]) {
            placeholder = options.placeholder[type];
        } else {
            placeholder = placeholders[type];
        }

        var files = parseFiles(matches[2], cwd, options.context || {});

        var includes = '';

        if (placeholder && files && files.length > 0) {

            includes = files.map(function (filename) {
                filename = (options.prefix || "") + replaceExtension(filename, type, options);
                return util.format(placeholder, filename);
            }).join('\n');
        }

        contents = contents.substring(0, matches.index) + includes + contents.substring(matches.index + matches[0].length);
        matches = matchExpressions(contents);
    }

    return contents;
}

function gulpIncludeSource(options) {

    options = options || {};

    var stream = through.obj(function (file, enc, callback) {
        try {
            if (file.isNull()) {
                this.push(file); // Do nothing if no contents
                return callback();
            }

            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported!'));
                return callback();
            }

            if (file.isBuffer()) {
                try {
                    file.contents = new Buffer(injectFiles(file, options));
                } catch (err) {
                    this.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                }
            }

            this.push(file);
        } catch (err) {
            this.emit('error', err);
        }
        return callback();
    });

    return stream;
}

module.exports = gulpIncludeSource;
