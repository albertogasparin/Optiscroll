/*global exports:true, require:true */
module.exports = exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        // casper: {
        //     options: {
        //         pre: './test/init.coffee',
        //         test: true
        //     },

        //     indexedDB: {
        //         options: {
        //             args: [
        //                 '--driver=asyncStorage',
        //                 '--driver-name=IndexedDB',
        //                 '--url=indexeddb'
        //             ],
        //             engine: 'slimerjs'
        //         },
        //         src: [
        //             'test/test.*.coffee'
        //         ]
        //     },

        //     localstorageGecko: {
        //         options: {
        //             args: [
        //                 '--driver=localStorageWrapper',
        //                 '--driver-name=localStorage',
        //                 '--url=localstorage'
        //             ],
        //             engine: 'slimerjs'
        //         },
        //         src: [
        //             'test/test.*.coffee'
        //         ]
        //     },

        //     localstorageWebKit: {
        //         src: [
        //             'test/test.*.coffee'
        //         ]
        //     },

        //     websql: {
        //         options: {
        //             args: [
        //                 '--driver=webSQLStorage',
        //                 '--driver-name=WebSQL',
        //                 '--url=websql'
        //             ]
        //         },
        //         src: [
        //             'test/test.*.coffee'
        //         ]
        //     }
        // },
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
        // jshint: {
        //     options: {
        //         jshintrc: '.jshintrc'
        //     },
        //     source: ['src/*.js', 'src/**/*.js']
        // },
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

    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    
    // grunt.registerTask('server', function() {
    //     grunt.log.writeln('Starting web server at test/server.coffee');

    //     require('./test/server.coffee').listen(8181);
    // });

    // grunt.registerTask('test', ['build', 'server', 'casper', 'jshint']);
};
