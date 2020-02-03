/**
 @author sumanta.mishra and andrew.gribben	

 GRUNT TASK LIST:
 'clean': REMOVES bin folder
 'minifyMainJSFiles': Minifies all JS files included in index.html
 'minifyCoreMinJSFiles': Minifies all JS files grouped for separate grades in LayoutConfig.js
 'createVersionFile': Creates verion file
 'exportContentFolder': Exports content folder from within source folder
 'exportCSSFolder': Exports css folder from within source folder
 'minifyThemeCSSFiles': Minifies theme css files for different grades
 'minifyHTMLFiles': Minifies layout (player) html files
 'createLayoutConfig': Creates LayoutConfig file for minified version of source code


 **/

module.exports = function (grunt) {

    var strBuildName = "latest";
	var strVersion = "v5.7.41";
    var strOutputFoldername = "" + strBuildName + "/";
    var strSourceFolderName = "source";
	var strDateAndTime = "";

    var isToUglifyJSFiles = true;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: {
                src: ["latest/**"]
            }
        }
    });

    grunt.registerTask('promptUserToSelectServer', "Sets Build and Pushlist SVN commit paths", function() {
        grunt.config('prompt', {
            server: {
                options: {
                    questions: [
                        {
                            config: 'server.prompt',
                            type: 'list',
                            message: 'Which Mocha reporter would you like to use?',
                            default: "hmof_sample_content",
                            choices: [
                                {value: "hmof_content", name: "1. HMOF"},
                                {value: "tck6", name: "2. TCK6"}]
                        }
                    ]
                }
            }
        });
        grunt.task.run('prompt');
    });

    grunt.registerTask('mergetemplatesforgrades', "Merge PREKTO1 Template HTML to js file", function() {
       grunt.config('ngtemplates', {            
              app:        {
                cwd:      strSourceFolderName + '/src/app',
                src:      ['**/6TO12/template/*.tpl.html', '**/2TO5/template/*.tpl.html','**/PREKTO1/template/*.tpl.html'],
                dest:     strSourceFolderName + '/src/app/app.templatesPREKTO1.js',
                options:{
                    module: 'templates-app',
                    standalone: true
                }
              }
        });     
        grunt.task.run('ngtemplates');
    });

	
    grunt.registerTask('updateVersionInMainJS', "Updates version in MainJS file", function() {
        var objReg = /currentReaderVersion = \"[\s\S]*?(\")/gi;
        var strData = grunt.file.read(strSourceFolderName + "/src/app/Main.js", {encoding: 'utf8'});
        strData = strData.replace(objReg, 'currentReaderVersion = "' + strVersion +'"');
        grunt.file.write(strSourceFolderName + "/src/app/Main.js" , strData );
    });


    grunt.registerTask('minifyMainJSFiles', "Minifies all JS files", function() {

        var strData = grunt.file.read(strSourceFolderName + '/index.html', {encoding: 'utf8'});
        var objReg = /<\!-- 1\:MINIFICATIONSTART [\s\S]*?(1\:MINIFICATIONENDS --\>)/gi;//new RegExp("</html>", "gi");
        strData = strData.match(objReg)[0];
        objReg = /vendor\//gi;
        strData = strData.replace(objReg, strSourceFolderName + "/vendor/");
		objReg = /src\//gi;
		strData = strData.replace(objReg, strSourceFolderName + "/src/");
        //objReg = /source\/js\/[\s\S]*?(\.js\")/gi;
        var strReg = strSourceFolderName + '[\\s\\S]*?(.js")'
        objReg = new RegExp(strReg, 'gi');
        var arr = strData.match(objReg);
        var arrFileList = [];
        //grunt.log.write("****************************\n")
        for(var i = 0; i < arr.length; i++)
        {
            objReg = /\"/gi;
            var strFPath = arr[i];
            strFPath = strFPath.replace(objReg, "");
            if(strFPath.indexOf("/logger") == -1)
            {
                arrFileList.push(strFPath);
                grunt.log.write(strFPath+"\n")
            }

        }
        //grunt.log.write("****************************\n")

        grunt.config('concat', {
            options: {
                separator: ';\n\n'
            },
            latest: {
                src: arrFileList,
                dest: strOutputFoldername + 'js/MinJS.js'
            }
        });
        grunt.task.run('concat');

        var objToUglify = {};
        objToUglify.options = {mangle: false};
        objToUglify.my_target = {};
        objToUglify.my_target.files = {};
        objToUglify.my_target.files[strOutputFoldername + 'js/MinJS.js'] = [strOutputFoldername + 'js/MinJS.js'];

        if(isToUglifyJSFiles)
        {
            grunt.config('uglify', objToUglify);
            grunt.task.run('uglify');
        }
    });
	
    grunt.registerTask('minifyCoreMinJSFiles', "Minifies core files for widgets", function(){

        var strMainData = grunt.file.read(strSourceFolderName + '/index.html', {encoding: 'utf8'});
        var objReg = /<\!-- 2\:MINIFICATIONSTART [\s\S]*?(2\:MINIFICATIONENDS --\>)/gi;//new RegExp("</html>", "gi");
        strMainData = strMainData.match(objReg)[0];
        objReg = /vendor\//gi;
        strMainData = strMainData.replace(objReg, strSourceFolderName + "/vendor/");
		objReg = /src\//gi;
		strMainData = strMainData.replace(objReg, strSourceFolderName + "/src/");
        //objReg = /source\/js\/[\s\S]*?(\.js\")/gi;
        var strReg = strSourceFolderName + '[\\s\\S]*?(.js")';
        objReg = new RegExp(strReg, 'gi');
        var arr = strMainData.match(objReg);
        var arrFileList = [];
        //grunt.log.write("****************************\n",arr)
        for(var l = 0; l < arr.length; l++)
        {
            objReg = /\"/gi;
            var strFPath = arr[l];
            strFPath = strFPath.replace(objReg, "");
            if(strFPath.indexOf("/logger") == -1)
            {
                arrFileList.push(strFPath);
                grunt.log.write(strFPath+"\n")
            }

        }
        //grunt.log.write(arrFileList+"\n");
        grunt.log.write("***end*************************\n");

        var strData = grunt.file.read(strSourceFolderName + '/src/app/LayoutConfig.js', {encoding: 'utf8'});

        objReg = /src\//gi;
        strData = strData.replace(objReg, strSourceFolderName + "/src/");
        objReg = /READER_TYPE[\s\S]*?(])/gi;
        var arrMinElements = strData.match(objReg);

        var objMinifyTask = {};
        objMinifyTask.options = {separator: ";"};
        objMinifyTask.basic = {files: {}};

        var objUglifyTask = {};
        objUglifyTask.options = {mangle: false};
        objUglifyTask.my_target = {files: {}};

        for(var i=0; i < arrMinElements.length; i++)
        {
            strData = arrMinElements[i];
            var arrFilesToMin = [];
            //arrFilesToMin = arrFileList;
            for(var k = 0; k < arrFileList.length; k++)
            {
                arrFilesToMin.push(arrFileList[k])
            }
            //grunt.log.write(arrFilesToMin);
            //objReg = /source\/js[\s\S]*?(\")/gi;
            strReg = strSourceFolderName + '[\\s\\S]*?(")';
                objReg = new RegExp(strReg, 'gi');

            var arrMatches = strData.match(objReg);
            var iLen = arrMatches.length;
            var strFolderName = strOutputFoldername + "src/app/components/";

            for(var j = 0; j < iLen; j++)
            {
                var strFilePath = arrMatches[j];
                if(j == 0)
                {
                    grunt.log.write(strFilePath + "\n");
                    strFolderName += strFilePath.split("/")[5] + "/core_min.js";
                }
                var objFReg = /\"/gi;
                strFilePath = strFilePath.replace(objFReg, ".js");
                arrFilesToMin.push(strFilePath);
                //grunt.log.write(arrFilesToMin)
            }
            //grunt.log.write(arrFilesToMin + "\n\n");
            //grunt.log.write("****************************************\n\n");
            objMinifyTask.basic.files[strFolderName] = arrFilesToMin;

            var arrFilesToUglify = [];
            arrFilesToUglify.push(strFolderName);
            objUglifyTask.my_target.files[strFolderName] = arrFilesToUglify;
        }
        grunt.config('concat', objMinifyTask);
        grunt.task.run('concat');

        if(isToUglifyJSFiles) {
            grunt.config('uglify', objUglifyTask);
            grunt.task.run('uglify');
        }
    });

    grunt.registerTask('copyjQueryFile', "Copies jquery file", function(){
        grunt.config('copy', {
            main: {
                src: strSourceFolderName + '/vendor/jquery-1.7.1.min.js',
                dest: strOutputFoldername + 'js/libs/jquery-1.7.1.min.js'
            }
        });
        grunt.task.run('copy');
    });

	grunt.registerTask('copyCSSDirectory', "Copies css files", function(){
        grunt.config('copy', {
            main: {
                cwd: strSourceFolderName + '/css', 
                src: '**/*',           // copy all files and subfolders
                dest: strOutputFoldername + 'css',
                expand: true
            }
        });
        grunt.task.run('copy');
        
    });
	
    grunt.registerTask('exportContentFolder', "Exports content folder", function(){
        grunt.config('copy', {
            main: {
                cwd: strSourceFolderName + '/content', 
                src: '**/*',           // copy all files and subfolders
                dest: strOutputFoldername + 'content',
                expand: true
            }
        });
        grunt.task.run('copy');
    });

    grunt.registerTask('deleteEnFolder', "Delete content folder", function(){
        grunt.config('clean', {
            build: {
                src: [strOutputFoldername + "content/en/**", strOutputFoldername + "content/filelisttominify.json"]
            }
        });
        grunt.task.run('clean');
    });

    grunt.registerTask('exportCSSFolder', "Exports CSS folder", function(){

        grunt.config('copy', {
            main: {
                cwd: strSourceFolderName + '/src/css', 
                src: '**/*',           // copy all files and subfolders
                dest: strOutputFoldername + 'src/css',
                expand: true
            }
        });

        grunt.task.run('copy');
        

    });
	
	grunt.registerTask('exportAssetFolder', "Exports Assets folder", function(){
        grunt.config('copy', {
            main: {
                cwd: strSourceFolderName + '/src/assets', 
                src: '**/*',           // copy all files and subfolders
                dest: strOutputFoldername + 'src/assets',
                expand: true
            }
        });
        grunt.task.run('copy');
    });

    grunt.registerTask('exportGoogleClassroomWhileListFile', "Exports Google Classroom whitelist file", function(){
        grunt.config('copy', {
            main: {
                src: strSourceFolderName + '/googleClassroom_whiteList.json',
                dest: strOutputFoldername + 'googleClassroom_whiteList.json'
            }
        });
        grunt.task.run('copy');
    });

    grunt.registerTask('minifyThemeCSSFiles', "Minifies theme and all global CSS files", function(){
        var objUglifyTask = {};
        objUglifyTask.combine = {files: {}};
        var arrFilesToUglify = [];
        var objData = grunt.file.readJSON(strSourceFolderName + "/content/filelisttominify.json");

        for(var i = 0; i < objData.cssfiles.length; i++)
        {
            arrFilesToUglify = [];
            var strPath = strOutputFoldername + objData.cssfiles[i];
            arrFilesToUglify.push(strPath);
         objUglifyTask.combine.files[strPath] = arrFilesToUglify;
        }
        grunt.config('cssmin', objUglifyTask);
        grunt.task.run('cssmin');
    });

    grunt.registerTask('minifyHTMLFiles', "Minifies all HTML files", function(){
        var objUglifyTask = {};
        objUglifyTask.compile = {};
        objUglifyTask.compile.options = {type: 'html', preserveServerScript: true};
        objUglifyTask.compile.files = {};
        //var arrFilesToUglify = [];
        var objData = grunt.file.readJSON(strSourceFolderName + "/content/filelisttominify.json");

        for(var i = 0; i < objData.htmlfiles.length; i++)
        {
            var strPath = objData.htmlfiles[i];
            objUglifyTask.compile.files[strOutputFoldername + strPath] = strSourceFolderName +  "/" + strPath;
        }
        grunt.config('htmlcompressor', objUglifyTask);
        grunt.task.run('htmlcompressor');
    });

    grunt.registerTask('mergeHTMLCSSFiles', "Copies version.txt file", function(){
        var objData = grunt.file.readJSON(strSourceFolderName + "/content/filelisttominify.json");
        var strHTMLData = "";//grunt.file.read('source/index.html', {encoding: 'utf8'});
        var strCSSData = "";
        for(var i = 0; i < objData.filemerge.length; i++)
        {
            strCSSData = "<style>" + grunt.file.read(strOutputFoldername + objData.filemerge[i].css, {encoding: 'utf8'}) + "</style> \n\n";
            strHTMLData = strCSSData + grunt.file.read(strOutputFoldername + objData.filemerge[i].html, {encoding: 'utf8'});
            grunt.file.write(strOutputFoldername + objData.filemerge[i].html, strHTMLData);
        }
    });

    grunt.registerTask('createVersionFile', "Copies version.txt file", function(){
        var strVersitionFileTxt = "FILE: version\nVERSION: "+ strVersion +"\nCREATED: ";
        var d = new Date();
        
		
		var strHr = d.getHours().toString();
		strHr = (strHr.length == 1) ? "0" + strHr : strHr;
		
		var strMin = d.getMinutes().toString();
		strMin = (strMin.length == 1) ? "0" + strMin : strMin;
		
		var strSec = d.getSeconds().toString();
		strSec = (strSec.length == 1) ? "0" + strSec : strSec;
		
		strDateAndTime = d.toDateString() + " " + strHr + ":" + strMin + ":" + strSec;
		strVersitionFileTxt += strDateAndTime;//d.toDateString() + " " + strHr + ":" + strMin + ":" + strSec;
		
		
        grunt.file.write(strOutputFoldername + "version.txt", strVersitionFileTxt);
    });

    grunt.registerTask('createLayoutConfig', "Copies version.txt file", function(){
        var strData = 'var LayoutConfig = {';
        strData += 'READER_TYPE_6TO12: {';
        strData += 'CORE: [';
        strData += '"src/app/components/6TO12/core_min"';
        strData += ']';
        strData += '},';
        strData += 'READER_TYPE_2TO5: {';
        strData += 'CORE: [';
        strData += '"src/app/components/6TO12/core_min"';
        strData += ']';
        strData += '},';
        strData += 'READER_TYPE_PREKTO1: {';
        strData += 'CORE: [';
        strData += '"src/app/components/6TO12/core_min"';
        strData += ']';
        strData += '}';
        strData += '}';
        grunt.file.write(strOutputFoldername + 'js/LayoutConfig.js', strData);
    });

    grunt.registerTask('cleanTempFolders', "Delete content folder", function(){
        grunt.config('clean', {
            build: {
                src: ["tmp"]
            }
        });
        grunt.task.run('clean');
		grunt.log.write("Build creation time: " + strDateAndTime + "\n\n");
    });

    grunt.loadNpmTasks('grunt-svn-fetch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-htmlcompressor');
    grunt.loadNpmTasks('grunt-svn-export');
    grunt.loadNpmTasks('grunt-push-svn');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['clean',
                                    'mergetemplatesforgrades',
                                    'updateVersionInMainJS',
                                    'minifyMainJSFiles', 
                                    'minifyCoreMinJSFiles',
                                    'createVersionFile',
                                    'exportContentFolder',
                                    'deleteEnFolder',
                                    'exportCSSFolder',
									'exportAssetFolder',
                                    'exportGoogleClassroomWhileListFile',
									'copyCSSDirectory',
                                    'minifyThemeCSSFiles',
                                    'minifyHTMLFiles',
                                    'createLayoutConfig',
                                    'cleanTempFolders'
                                ]);

    

};