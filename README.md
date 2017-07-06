# gulp-include-source-ex

Gulp plugin to include scripts and styles into your HTML files automatically.

**Based on [gulp-include-source fork by Xlander11](https://github.com/Xlander11/gulp-include-source)**



## Install

Install with [npm](https://npmjs.org/package/gulp-ngmin)

```
npm install gulp-include-source-ex --save-dev
```



## Example

#### gulpfile.js

```js
const includeSources = require('gulp-include-source-ex');

return gulp.src('./client/index.html').pipe(includeSource({
		'cwd': 'src/',
		'prefix': 'js',
		'context': {
			'js_list': ['example/app.js', 'controllers/*.js']
		}
	})).pipe(gulp.dest('build/'));
```

#### index.html

```html
<html>
<head>
  <!-- include:css(style/**/*.css) -->
</head>
<body>
  <!-- include:js(file:vendorListFile) -->
  <!-- include:js(list:js_list) -->
  <!-- include:js(script/**/*.js) -->
</body>
</html>
```

#### vendorListFile

```
/jquery/dist/jquery.js
/angular/angular.js
```

#### Result:

```html
<html>
<head>
  <link rel="stylesheet" href="style/main.css">
</head>
<body>
  <script src="js/jquery/dist/jquery.js"></script>
  <script src="js/angular/angular.js"></script>
  <script src="js/example/app.js"></script>
  <script src="js/controllers/LoginController.js"></script>
  <script src="js/controllers/MainController.js"></script>
</body>
</html>
```



## API

### includeSources(options)

#### options.cwd

Type: `String`

Base directory from where the plugin will search for source files.

#### options.scriptExt

Type: `String`

When available, will override script extension in resulted HTML code.

#### options.styleExt

Type: `String`

When available, will override style extension in resulted HTML code.


#### options.prefix

Type: `String`

When available, will add before all filenames.



## License

MIT © [André Gil](http://somepixels.net)
