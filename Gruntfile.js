module.exports = function(grunt) {
 
  // configure grunt
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
	tests: {
	    src: "./tests/test.js",
	    dest: "./tests/gen/testsbundle.js"
	},
	simple: {
	    src: "./examples/simple.js",
	    dest: "./examples/gen/simplebundle.js"
	},
	grid: {
	    src: "./examples/grid.js",
	    dest: "./examples/gen/gridbundle.js"
	}
    },
 
    jshint: {
      files: [
        '**/*.js',
        '!node_modules/**/*',
	'!**/gen/*',
	'!js/libs/**/*',
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
  });
 
  // Load plug-ins
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
 
  // define tasks
  grunt.registerTask('default', [
    'browserify',
    'jshint',
  ]);
};
