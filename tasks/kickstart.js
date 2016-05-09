'use strict';

var _ = require('lodash');
var del = require('del');
var KickstartPrompt = require('../lib/prompts/kickstart_prompt');
var lfrThemeConfig = require('../lib/liferay_theme_config');
var path = require('path');
var plugins = require('gulp-load-plugins')();

var gutil = plugins.util;

var themeConfig = lfrThemeConfig.getConfig(true);

module.exports = function(options) {
	var gulp = options.gulp;

	var pathSrc = options.pathSrc;

	var runSequence = require('run-sequence').use(gulp);

	var argv = options.argv;

	gulp.task('kickstart', function(cb) {
		new KickstartPrompt(function(answers) {
			var tempNodeModulesPath;
			var themeSrcPath;

			if (answers.modulePath) {
				themeSrcPath = path.join(answers.modulePath, 'src');
			}
			else {
				tempNodeModulesPath = path.join(process.cwd(), '.temp_node_modules');

				themeSrcPath = path.join(tempNodeModulesPath, 'node_modules', answers.module, 'src');
			}

			if (themeSrcPath) {
				var globs = _.map(['css', 'images', 'js', 'templates'], function(folder) {
					return path.join(themeSrcPath, folder, '**/*');
				});

				gulp.src(globs, {
						base: themeSrcPath
					})
					.pipe(gulp.dest('src'))
					.on('end', function() {
						if (tempNodeModulesPath) {
							del([tempNodeModulesPath], cb);
						}
						else {
							cb();
						}
					});
			}
			else {
				cb();
			}
		});
	});
};
