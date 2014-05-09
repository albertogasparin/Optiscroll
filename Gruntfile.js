/*global exports:true, require:true */
module.exports = exports = function(grunt) {
    'use strict';

    grunt.initConfig({

        connect: {
            server: {
              options: {
                port: 8181,
                hostname: '*'
              }
            }
        },

        concat: {
            options: {
                separator: "\n\n",
            },
            nojquery: {
                src: [
                    'src/polyfills/*.js',
                    'src/intro.js',
                    'src/optiscroll.js',
                    'src/events.js',
                    'src/scrollbar.js',
                    'src/utils.js',
                    'src/globals.js',
                    'src/outro.js',
                ],
                dest: 'dist/optiscroll.js'
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            // source: ['src/*.js', 'src/**/*.js']
            source: ['dist/optiscroll.js']
        },
        uglify: {
            nojquery: {
                files: {
                    'dist/optiscroll.min.js': ['dist/optiscroll.js']
                }
            }
        },
        watch: {
            build: {
                files: ['src/*.js', 'src/**/*.js'],
                tasks: ['build']
            },
            grunt: {
                files: [
                    'Gruntfile.js'
                ]
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['connect', 'build', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);

    grunt.registerTask('test', ['build', 'connect']);
};
