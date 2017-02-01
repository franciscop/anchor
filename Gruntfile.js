// This builds the library itself
module.exports = function (grunt) {
  // Configuration
  grunt.initConfig({

    browserify: {
      client: {
        src: ['src/javascript.js'],
        dest: 'javascript.min.js',
        options: {
          external: ['jquery', 'momentWrapper'],
        }
      }
    },

    concat: {
      main: {
        options: {
          process: content => content
            .replace(/^\ *\/\/[^\n]+/gm, '')
            // .replace(/\n[^\S]*/g, ' ')
            // .replace(/\s?\;\s?/g, ';')
            // .replace(/\s?\)\s?/g, ')')
            .replace(/\/\*[^*]+\*\/\s+/, '')
            .replace(/\s?\=\>\s?/g, '=>')
            .replace(/\s?\{\s?/g, '{')
            .replace(/\s?\}\s?/g, '}')
            .replace(/\s?\(\s?/g, '(')
            .replace(/\s?\=\s?/g, '=')
            .replace(/\s?\:\s?/g, ':')
            .replace(/\s?\+\s?/g, '+')
            .replace(/\s?\,\s?/g, ',')
            .replace(/;}/g, '}')
        },
        files: {
          'javascript.min.js': [
            'src/recordar/index.js',
            'src/touch.js',
            'src/store.js',
            'src/analyze.js',
            'src/memory.js',
            'src/flash.js',
            'src/javascript.js'
          ]
        }
      }
    },

    watch: {
      scripts: {
        files: [
          'package.js', // To bump versions
          'Gruntfile.js',
          'superdom.js',
          'src/**/*',
          'test/**/*'
        ],
        tasks: ['default'],
        options: {
          spawn: false,
          livereload: true
        }
      }
    },

    bytesize: {
      all: {
        src: [
          'superdom.min.js'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-semistandard');
  // grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bytesize');

  grunt.registerTask('default', ['browserify', 'bytesize']);
};
