module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Copy web assets from node_modules to more convenient directories.
        copy: {
            main: {
                files: [
                    // Vendor scripts.
                    {
                        expand: true,
                        cwd: 'node_modules/bootstrap/dist/js/',
                        src: ['**/*.js'],
                        dest: 'js/bootstrap/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/popper.js/dist/',
                        src: ['**/*.js'],
                        dest: 'js/popper/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/jquery/dist/',
                        src: ['**/*.js'],
                        dest: 'js/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/jquery-match-height/dist/',
                        src: ['**/*.js'],
                        dest: 'js/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/stickybits/dist/',
                        src: ['**/*.js'],
                        dest: 'js/stickybits/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/isotope-layout/dist/',
                        src: ['**/*.js'],
                        dest: 'js/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/isotope-fit-columns/',
                        src: ['**/*.js'],
                        dest: 'js/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/jquery/dist/',
                        src: ['**/*.js', '**/*.map'],
                        dest: 'js/jquery/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/jquery-lazy/',
                        src: ['**/*.js', '**/*.map'],
                        dest: 'js/',
                    },
                    {
                        expand: true,
                        cwd: 'node_modules/cookieconsent/build/',
                        src: ['**/*.js'],
                        dest: 'js/',
                    },
                    // Fonts.
                    {
                        expand: true,
                        filter: 'isFile',
                        flatten: true,
                        cwd: 'node_modules/',
                        src: ['open-iconic/font/fonts/**'],
                        dest: 'fonts/open-iconic/',
                    },

                    // Stylesheets
                    {
                        expand: true,
                        cwd: 'node_modules/bootstrap/scss/',
                        src: ['**/*.scss'],
                        dest: 'scss/bootstrap/',
                    },

                    //Open Iconic Stylsheet
                    {
                        expand: true,
                        cwd: 'node_modules/open-iconic/font/css/',
                        src: ['open-iconic-bootstrap.scss'],
                        dest: 'scss/',
                    },

                    //Open Iconic Fonts
                    {
                        expand: true,
                        filter: 'isFile',
                        flatten: true,
                        cwd: 'node_modules/open-iconic/font/fonts/',
                        src: ['**'],
                        dest: 'fonts/',
                    },

                    //FontAwesome Stylsheets
                    {
                        expand: true,
                        cwd: 'node_modules/font-awesome/scss/',
                        src: ['**/*.scss'],
                        dest: 'scss/font-awesome/',
                    },

                    //FontAwesome Fonts
                    {
                        expand: true,
                        filter: 'isFile',
                        flatten: true,
                        cwd: 'node_modules/',
                        src: ['font-awesome/fonts/**'],
                        dest: 'fonts/',
                    },
                ],
            },
        },

        // Compile SASS files into minified CSS./
        sass: {
            options: {
                includePaths: ['node_modules/bootstrap/scss/'],
            },
            dist: {
                options: {
                    outputStyle: 'compressed',
                },
                files: {
                    'css/app.css': 'scss/app.scss',
                },
            },
        },

        // Watch these files and notify of changes.
        watch: {
            grunt: { files: ['Gruntfile.js'] },

            sass: {
                files: ['scss/**/*.scss'],
                tasks: ['sass'],
            },
        },

        //Concat all the js to one file
        concat: {
            options: {
                separator: '\n\n',
            },
            dist: {
                src: [
                    'js/jquery.min.js',
                    'js/bootstrap/bootstrap.bundle.min.js',
                    'js/jquery.matchHeight-min.js',
                    'js/stickybits/jquery.stickybits.min.js',
                    'js/isotope.pkgd.min.js',
                    'js/cookieconsent.min.js',
                    'js/imagesloaded.pkgd.min.js',
                    'js/jquery.lazy.min.js',
                    'js/jquery.lazy.plugins.min.js',
                    'js/scrolling-nav.js',
                ],
                dest: 'js/all.min.js',
            },
        },
    });

    // Load externally defined tasks.
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Establish tasks we can run from the terminal.
    grunt.registerTask('build', ['sass', 'copy']);
    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('dist', ['build', 'concat']);
};
