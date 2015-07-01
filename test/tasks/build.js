'use strict';

var chai = require('chai');
var fs = require('fs-extra');
var gulp = require('gulp');
var os = require('os');
var parseString = require('xml2js').parseString;
var path = require('path');
var registerTasks = require('../../index.js').registerTasks;

var assert = chai.assert;
chai.use(require('chai-fs'));

var tempPath = path.join(os.tmpdir(), 'liferay-theme-tasks', 'base-theme');

describe('Build Tasks', function() {
	before(function(done) {
		this.timeout(10000);

		var instance = this;

		instance._initCwd = process.cwd();

		fs.copy(path.join(__dirname, '../assets/base-theme'), tempPath, function (err) {
			if (err) throw err;

			process.chdir(tempPath);

			instance._buildPath = path.join(tempPath, 'build');
			instance._tempPath = tempPath;

			registerTasks({
				gulp: gulp,
				supportCompass: false
			});

			console.log('Creating temp theme in', tempPath);

			done();
		});
	});

	after(function() {
		fs.removeSync(tempPath);

		process.chdir(this._initCwd);
	});

	it('should clean build directory', function(done) {
		var instance = this;

		gulp.start('build:base', function(err) {
			if (err) throw err;

			assert.isDirectory(instance._buildPath);

			gulp.start('build:clean', function(err) {
				if (err) throw err;

				if (fs.existsSync(instance._buildPath)) {
					throw new Error('Build path should not exist');
				}

				done();
			});
		});
	});

	it('should build files from Styled theme to /build', function(done) {
		var instance = this;

		gulp.start('build:base', function(err) {
			if (err) throw err;

			assert.isDirectory(instance._buildPath);

			done();
		});
	});

	it('should build custom.css file from /src to /build', function(done) {
		var instance = this;

		gulp.start('build:src', function(err) {
			if (err) throw err;

			var customCSSPath = path.join(instance._buildPath, 'css/custom.css');

			assert.fileContent(customCSSPath, '/* custom.css */');

			done();
		});
	});

	it('should build /WEB-INF', function(done) {
		var instance = this;

		gulp.start('build:web-inf', function(err) {
			if (err) throw err;

			var pathWebInf = path.join(instance._buildPath, 'WEB-INF');

			assert.isDirectory(pathWebInf);

			assert.isFile(path.join(pathWebInf, 'liferay-plugin-package.properties'));

			done();
		});
	});

	it('should build process liferay-hook.xml', function(done) {
		var instance = this;

		gulp.start('build:hook', function(err) {
			if (err) throw err;

			var hookPath = path.join(instance._buildPath, 'WEB-INF', 'liferay-hook.xml.processed');

			assert.isFile(hookPath);

			var liferayHookXML = fs.readFileSync(hookPath, {
				encoding: 'utf8'
			});

			parseString(liferayHookXML, function(err, result) {
				if (err) throw err;

				assert.deepEqual(
					['content/Language_en.properties', 'content/Language_es.properties'],
					result.hook['language-properties']
				);

				done();
			});
		});
	});

	it('should build test-themelet and generate themelet.css', function(done) {
		var instance = this;

		gulp.start('build:themelets', function(err) {
			if (err) throw err;

			var themeletCSSPath = path.join(process.cwd(), 'build/css/themelet.css');

			assert.isFile(path.join(instance._buildPath, 'js/test-themelet/main.js'));

			assert.fileContent(themeletCSSPath, '/* test-themelet/src/custom.css */');

			done();
		});
	});

	it('should rename css/ directory to _css/', function(done) {
		var instance = this;

		gulp.start('rename-css-dir', function(err) {
			if (err) throw err;

			assert.isDirectory(path.join(instance._buildPath, '_css'));

			done();
		});
	});

	it('should compile sass to css', function(done) {
		var instance = this;

		gulp.start('compile-scss', function(err) {
			if (err) throw err;

			done();
		});
	});

	it('should move all compiled css to css/ directory', function(done) {
		var instance = this;

		gulp.start('move-compiled-css', function(err) {
			if (err) throw err;

			assert.isDirectory(path.join(instance._buildPath, 'css'));

			done();
		});
	});

	it('should remove _css/ directory', function(done) {
		var instance = this;

		gulp.start('remove-old-css-dir', function(err) {
			if (err) throw err;

			if (fs.existsSync(path.join(instance._buildPath, '_css'))) {
				throw new Error('_css directory should not exist');
			}

			done();
		});
	});

	it('should build .war file that matches name of the project', function(done) {
		var instance = this;

		gulp.start('build:war', function(err) {
			if (err) throw err;

			assert.isFile(path.join(instance._tempPath, 'dist/base-theme.war'));

			done();
		});
	});
});
