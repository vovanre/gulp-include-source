'use strict';

var through = require('through2'),
    glob = require('glob'),
    path = require('path'),
    replaceExt = require('replace-ext'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    util = require('util'),
    PluginError = gutil.PluginError,
    CRC32 = require('crc-32')
;

var PLUGIN_NAME = 'gulp-include-source-ex';

var placeholders = {
    'js': '<script src="%s"></script>',
    'css': '<link rel="stylesheet" href="%s">'
};


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

function parseFiles(source, cwd, context, skipEmptyFiles) {
    var result;
    if (source.indexOf('list:') === 0) {
        var cleanSrc = source.replace('list:', '');
        if (!context.hasOwnProperty(cleanSrc)) {
            return false;
        }
        result = globArray(context[cleanSrc], cwd);
    } else if (source.indexOf('file:') === 0) {
        var cleanSrc = source.replace('file:', '');
        var result = fs.readFileSync(cleanSrc).toString().split('\n');
        result = globArray(result, cwd);
    } else {
        result = glob.sync(source, {
            cwd: cwd
        });
    }

    if (skipEmptyFiles) {
        result = result.filter(function (file) {
            return fs.statSync(cwd + file).size > 0;
        });
    }
    return result;
}

function injectFiles(file, options) {
    var contents = file.contents.toString();
    var cwd = options.cwd || path.dirname(file.path);
    return contents.replace(/<!--\s+include:([a-z]+)\(([^)]+)\)\s+-->/g, function (str, type, argument) {
        var placeholder;
        if (options.placeholder && options.placeholder[type]) {
            placeholder = options.placeholder[type];
        } else {
            placeholder = placeholders[type];
        }

        var files = parseFiles(argument, cwd, options.context || {}, options.skipEmptyFiles || false);
        if (placeholder && files) {
            if (files.length == 0)
                return '';
            return files.map(function (filename) {
                filename = (options.prefix || "") + replaceExtension(filename, type, options);
                if (options.useHash) {
                    filename += '?' + CRC32.buf(fs.readFileSync(cwd + file));
                }
                return util.format(placeholder, filename);
            }).join('\n');
        }
        return str;
    });
}

function gulpIncludeSource(options) {
    options = options || {};

    return through.obj(function (file, enc, callback) {
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
}

module.exports = gulpIncludeSource;
