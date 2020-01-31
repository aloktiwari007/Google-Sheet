const GoogleSpreadsheet= require('google-spreadsheet');
var Shelljs =require('shelljs');
const fs=require('fs');
var copyDir = require("copy-dir");
const prompts = require('prompts');
var dateFormat = require('dateformat');
var validator = require('is-my-json-valid/require');
const {promisify} = require('util');
const creds=require('./client_secret.json');

var current_datetime=dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");



var jsonfile_path="./ebook_shell/source/googleClassroom_whiteList.json";
var gruntjs_url="./ebook_shell/Gruntfile.js";

var mainjs_url="./ebook_shell/source/src/app/Main.js";

//Below mentioned jsonvalidator meyhod is used to validdate googleClassroom_whiteList.json file. 

function jsonvalidator()
{
    try{
        var validate = validator(jsonfile_path);

  
        var n= Shelljs.exec('git clone https://alok07@bitbucket.org/alok07/niit');
    
        console.log(n);
        updatefiles(gruntjs_url);

    }
    catch(exception)
    {
        
        console.log("Error in Json file !!..");

    }
    
}
// Below mentioned runcommand method is used run github commands..


function runcommand()
{
   try{

   
        


    
    copyDir('./niit/.git','./.git',function(err){

        if(err)
        {
            console.log("err"+err)
        }
        else{

            (async function(){
                const questions = [
                    {
                        type: 'text',
                        name: 'BranchName',
                        message: `Enter your Branche Name`,
                       
                        
                    },
                    {
                        type: 'text',
                        name: 'comment',
                        message: 'Enter comment',
                      
                    }
                 
                ]
                const answers = await prompts(questions);
                var branch_name=answers.BranchName;
                var comment=answers.comment;
                var git_command='git commit -m '+"\"" + comment+"\" "+'./hello/niit/';
               
                console.log(git_command);

                console.log(Shelljs.exec('git checkout --orphan '+branch_name));
            	//Shelljs.exec('git config --global user.name "alok07"');
                Shelljs.exec('git add .');
                Shelljs.exec(git_command);
                Shelljs.exec('git push origin '+branch_name);
            
            })();
        }








// console.log(Shelljs.exec('git checkout --orphan NIIT9191'));
// 	Shelljs.exec('git config --global user.name "alok07"');
// Shelljs.exec('git add .');
//    Shelljs.exec('git commit -m "msg" ./my.json');
//    Shelljs.exec('git push origin NIIT9191');
        
 
     
    });

   //----------------------------------------------

  /*console.log(Shelljs.exec('git checkout --orphan NIIT99'));
	Shelljs.exec('git config --global user.name "alok07"');
Shelljs.exec('git add .');
   Shelljs.exec('git commit -m "msg"');
   Shelljs.exec('git push origin NIIT99');
   */
   }
  catch(error)
  {
      console.log("Error while commiting the files on bitbucket . Please try again");
      
  }
  

}


// Below mentioned updatefiles method is use to update the version of Grunt.js and Main.js file.

function updatefiles(path)
{
 
    
    
    fs.readFile(path, function (err, data) {
        
        if (err) throw err;
        if((path.indexOf("Main.js")==-1))
        {  
            let str='var strVersion = "v5.7.';
            let data2=str;    
        var index=data.indexOf(str);
        console.log(index);
        var stringfs=data.toString();
        var fstr=stringfs.substring(index+=23,index+3);
        data2+=fstr+";";
        let i=parseFloat(fstr);

        let version=(i+1);
        str+=version+"\";";
           

          var d= Shelljs.sed('-i', data2,str, path);
          updatefiles(mainjs_url)
        }
        else{           
            let str='var currentReaderVersion = "v5.7.';
            let data2=str; 
        var index=data.indexOf(str);
        console.log(index);
        let stringfs=data.toString();
         let fstr=stringfs.substring(index+=33,index+2);
         console.log(fstr);
        data2+=fstr+"\";";
        console.log(data2); 
        let i=parseFloat(fstr);

         let version=(i+1);
         str+=version+"\";";

           

           var d= Shelljs.sed('-i', data2,str, path);
           runcommand();
           

        }

      });

    


 
}

var b
async function printdata(row)
 {
       

      
    
        fs.appendFile(jsonfile_path,b,function(err){
            if(!err)
            {
              //  console.log("data save"); 
             // runcommand();
             jsonvalidator();
            }
            else
            {
            //	runcommand();
            jsonvalidator();
            
                console.log("error "+ error); 

            }
            

        })
    
 }



 var   b="  { \"dist_refid\":\"\",\"date_updated\":\"'"+current_datetime+"'\",\"whitelisted_ids\":[";

// Bellow mention accessSpreadsheet method are responsible for fetching the data from google spread sheet and create new json file with the help of printdata method.

 async function accessSpreadsheet() {
     var counter=0,counter1;
     const doc=new GoogleSpreadsheet('1wazpIyk2pEWNOZylAbVJ1Fa3Quf2vINO1EnNxMgobn8')
     await promisify(doc.useServiceAccountAuth)(creds);
     const info=await promisify(doc.getInfo)();
     const sheet=info.worksheets[0];
    console.log(`Title:${sheet.title}, Rows: ${sheet.rowCount}`);
    counter1=sheet.rowCount;
     const rows=await promisify(sheet.getRows)({
        offset:1
		


     });
   

    rows.forEach(row  => {
      
       
        counter++;
       
       
        if(rows.length != counter)
        {
            
            b+=row.json;

        }
       else{
        console.log("hello");
           b=b.substring(',', b.length-1)
           b+="]}";
           
           fs.unlink(jsonfile_path,function(err){
            if(err)
            {
                console.log("error");
            }

           });
        printdata(b);

       }
        
  
        
   
    
        
     });
    

      
 }

accessSpreadsheet();