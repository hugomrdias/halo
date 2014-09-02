'use strict';
var gulp = require('gulp'),
    bsync        = require('browser-sync'),
    reload       = bsync.reload,
    less         = require('gulp-less'),
    sourcemaps   = require('gulp-sourcemaps'),
    size         = require('gulp-size'),
    notify       = require('gulp-notify'),
    filter       = require('gulp-filter'),
    autoprefixer = require('gulp-autoprefixer'),
    util         = require('gulp-util'),
    sequence     = require('run-sequence'),
    cp           = require('child_process');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> <code>$ jekyll build</code>'
};

var handleError = function(e) {

    var args = Array.prototype.slice.call(arguments);

    // Send error to notification center with gulp-notify
    notify.onError({
        title: 'Compile Error',
        message: '<%= error.message %>'
    }).apply(this, args);

    util.log(e.message);

    // Keep gulp from hanging on this task
    this.emit('end');
};



/**
 * Build the Jekyll Site
 */
gulp.task('jekyll', function(done) {
    bsync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {
        stdio: 'inherit'
    })
        .on('close', reload)
        .on('close', done);
});

/**
 * Start Browser Sync
 */
gulp.task('serve', function() {
    bsync({
        server: {
            baseDir: '_site'
        },
        port: 3000,
        open: false
    });
});

/**
 * Build Less
 */
gulp.task('less', function() {
    bsync.notify('Compiling Less files... Please Wait');
    return gulp.src('less/style.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .on('error', handleError)
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: '/css'
        }))
        .pipe(gulp.dest('_site/css'))
        .pipe(gulp.dest('css'))
        .pipe(filter('**/*.css')) // Filtering stream to only css files
        .pipe(size({
            title: 'CSS'
        }))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('watch', function() {
    sequence('jekyll', 'less');
    var less = gulp.watch('less/**/*.less', ['less']);
    less.on('change', function(event) {
        util.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });

    var jekyll = gulp.watch(['**/*.{html,xml,yml,md}', '!_site/**'], ['jekyll']);
    jekyll.on('change', function(event) {
        util.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });

    // gulp.watch('app/fonts/*', ['fonts:b']);
    // gulp.watch('app/images/**/*', ['images:b']);
    //gulp.watch(['app/scripts/**/*.js', '!app/scripts/{vendor,vendor/**}'], ['lint']);
});

gulp.task('default', ['serve', 'watch']);
