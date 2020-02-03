/**
 @author sumanta.mishra
**/

module.exports = function (grunt) {

    
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')        
    });

    grunt.registerTask('mergetemplates6TO12', "Merge 6TO12 Template HTML to js file", function() {
       grunt.config('ngtemplates', {            
              app:        {
                cwd:      'src/app',
                src:      '**/6TO12/template/*.tpl.html',
                dest:     'src/app/app.templates6TO12.js',
                options:{
                    module: 'templates-app',
                    standalone: true
                }
              }
        });     
        grunt.task.run('ngtemplates');
    });

    grunt.registerTask('mergetemplates2TO5', "Merge 2TO5 Template HTML to js file", function() {
       grunt.config('ngtemplates', {            
              app:        {
                cwd:      'src/app',
                src:      '**/2TO5/template/*.tpl.html',
                dest:     'src/app/app.templates2TO5.js',
                options:{
                    module: 'templates-app',
                    standalone: true
                }
              }
        });     
        grunt.task.run('ngtemplates');
    });

    grunt.registerTask('mergetemplatesPREKTO1', "Merge PREKTO1 Template HTML to js file", function() {
       grunt.config('ngtemplates', {            
              app:        {
                cwd:      'src/app',
                src:      '**/PREKTO1/template/*.tpl.html',
                dest:     'src/app/app.templatesPREKTO1.js',
                options:{
                    module: 'templates-app',
                    standalone: true
                }
              }
        });     
        grunt.task.run('ngtemplates');
    });
    
    grunt.loadNpmTasks('grunt-angular-templates');

    grunt.registerTask('default', ['mergetemplates6TO12','mergetemplates2TO5','mergetemplatesPREKTO1']);

};