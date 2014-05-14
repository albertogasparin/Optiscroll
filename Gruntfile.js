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
                    'src/intro.js',
                    'src/polyfills/*.js',
                    'src/optiscroll.js',
                    'src/events.js',
                    'src/scrollbar.js',
                    'src/utils.js',
                    'src/globals.js',
                    'src/outro.js',
                ],
                dest: 'dist/optiscroll.js'
            },
            jquery: {
                src: [
                    'dist/optiscroll.js',
                    'src/jquery.plugin.js'
                ],
                dest: 'dist/jquery.optiscroll.js'
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
            dist: {
                options: {
                    preserveComments: 'some'
                },
                files: {
                    'dist/optiscroll.min.js': ['dist/optiscroll.js'],
                    'dist/jquery.optiscroll.min.js': ['dist/jquery.optiscroll.js']
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
