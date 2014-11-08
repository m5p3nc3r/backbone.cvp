var gulp = require('gulp');
var argv = require('yargs').argv;

var jshint = require('gulp-jshint');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');

gulp.task('lint', function() {
    return gulp.src(['**/*.js',
		     '!node_modules/**/*',
		     '!**/gen/*'])
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

function rebundle(b, dstFolder, dstFile) {
    console.log("Rebundling " + dstFolder + "/" + dstFile);
    b.bundle().on('error', function(err) {
        console.log("Error: " + err);
        this.end();
    })
    .pipe(source(dstFile))
    .pipe(gulp.dest(dstFolder));
}

function watch(src, dstFolder, dstFile, needWatch) {
    var b=browserify({
	   cache: {},
	   packageCache: {},
	   fullPaths: true,
	   debug: !argv.production
    });
    b.add(src);
    rebundle(b, dstFolder, dstFile);
    if(needWatch) {
	   var w=watchify(b);
	   w.on('update', function() {
	       rebundle(w, dstFolder, dstFile);
	   });
    }
}

var bundles=[
    { src: './examples/simple.js', dstFolder: './examples/gen', dstFile: 'simplebundle.js' },
    { src: './examples/grid.js', dstFolder: './examples/gen', dstFile: 'gridbundle.js' },
    { src: './examples/simpleinf.js', dstFolder: './examples/gen', dstFile: 'simpleinf.js'},
    { src: './examples/tv.js', dstFolder: './examples/gen', dstFile: 'tv.js'},
];

gulp.task('watchify', function() {
    for(var index in bundles) {
	var bundle=bundles[index];
	watch(bundle.src, bundle.dstFolder, bundle.dstFile, true);
    }
});

gulp.task('browserify', function() {
    for(var index in bundles) {
	var bundle=bundles[index];
	watch(bundle.src, bundle.dstFolder, bundle.dstFile, false);
    }
});

gulp.task('watch', ['watchify']);
gulp.task('build', ['browserify']);
gulp.task('default', ['watch']);
