var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    tsProject = ts.createProject("tsconfig.json"),
    clientTsProject = ts.createProject("client/tsconfig.json"),
    webpack = require('webpack-stream'),
    nodemon = require('gulp-nodemon'),
    spawn = require('child_process').spawn,
    nodemon = require('gulp-nodemon'),
    mocha = require('gulp-spawn-mocha'),
    tslint = require("gulp-tslint"),
    newer = require('gulp-newer'),
    sourcemaps = require('gulp-sourcemaps'),
    www;

//www
gulp.task('default', ['www']);
gulp.task('www', ['www-start', 'www-watch', 'client-watch', 'static-move-watch']);

gulp.task('www-start', ['build-dist'], function () {
    if (www) www.kill();
    www = spawn('node', ['./dist/src/www'], { stdio: 'inherit' });
    www.on('close', function (code) {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...');
        }
    });
});

gulp.task('www-watch', function () {
    // restarts the server when server side code changes, or the client side asset map
    return gulp.watch(['src/**/*.ts', 'dist/assets/webpack-assets.json'], ["www"]);
});

var filesToMove = ['public/**/*', 'views/**/*'];

gulp.task("move-files", function () {
    return gulp.src(filesToMove, {base: '.'})
        .pipe(gulp.dest('dist'));
});

gulp.task('static-move-watch', function () {
    return gulp.watch(filesToMove, ["move-files"]);
});


//Build
gulp.task("build-dist", ['compile-typescript', 'client-compile-typescript', 'move-files']);

gulp.task("compile-typescript", ["ts-lint"], function () {
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    return tsResult.js
            .pipe(sourcemaps.write())
            .pipe(gulp.dest("dist"));
});

gulp.task("ts-lint", function () {
    return tsProject.src()
        .pipe(tslint({
            formatter: "prose"
        }))
        .pipe(tslint.report({
            summarizeFailureOutput: false
        }));
});

// Client build

gulp.task("client-compile-typescript", ["client-ts-lint"], function () {
    return clientTsProject.src()
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('dist/assets'));
});

gulp.task("client-ts-lint", function () {
    return clientTsProject.src()
        .pipe(tslint({
            formatter: "prose"
        }))
        .pipe(tslint.report({
            summarizeFailureOutput: false
        }));
});

gulp.task('client-watch', function () {
    return gulp.watch(['client/**/*.ts', 'client/**/*.tsx'], ["client-compile-typescript"]);
});

//Testing
gulp.task('test', ["run-tests","test-watch"]);

gulp.task('run-tests', ['build-dist'], function () {
    return gulp
        .src(['./dist/test/*.js'])
        .pipe(mocha());
});

gulp.task('test-watch', function () {
    gulp.watch(['src/**/*.ts', 'test/**/*.ts'], ['run-tests']);
});