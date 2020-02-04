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

//jsonfile_path is the varibale which contain the location of json (where we are creating the googleClassroom_whiteList.json) file.

//var jsonfile_path="./ebook_shell/source/googleClassroom_whiteList.json";

var jsonfile_path="./niit1/googleClassroom_whiteList.json";
//gruntjs_url and mainjs_url are the variable that contain the location of Gruntfile.js and Main.js File.

var gruntjs_url="./niit1/Gruntfile.js";
var mainjs_url="./niit1/Main.js";

/*Below mentioned jsonvalidator method is used to validate googleClassroom_whiteList.json file ,
 If the file is valid then it will run git clone command to clone the repositry, after that it will call updatefiles method which is responsible to update the version of Gruntfile.js and Main.js file. */

function jsonvalidator()
{
    try{
        let validate = validator(jsonfile_path);

  
        let gitclone= Shelljs.exec('git clone https://alok07@bitbucket.org/alok07/my1');

    
     console.log(gitclone);
        updatefiles(gruntjs_url);

    }
    catch(err)
    {
        
        console.log("Error in Json file !!.. " +err);

    }
    
}
// Below mentioned runcommand method is used run github commands. It will take Banchname and comment from user after that is will run git commands for committing the file on bitbucket using exec method of ShellJS module.

function runcommand()
{
   try{        
   
    copyDir('./niit/.git','./niit1/.git',function(err){

        if(err){
            console.log(err);
        }
        else{
            (async function(){
                const questions = [
                    {
                        type: 'text',
                        name: 'BranchName',
                        message: `Enter your Branch Name`,
                       
                        
                    },
                    {
                        type: 'text',
                        name: 'comment',
                        message: 'Enter comment',
                      
                    }
                 
                ]
                const answers = await prompts(questions);
                let branch_name=answers.BranchName;
                let comment=answers.comment;
                let git_command='git commit -m '+"\"" + comment+"\" "+ 'niit1'; 
                Shelljs.exec('git checkout --orphan '+branch_name);
            	Shelljs.exec('git add ./niit1/');
                Shelljs.exec(git_command);
                Shelljs.exec('git push origin '+branch_name);
            
            })();
        }
 
     
    });
   }
  catch(err) {
      console.log("Error while commiting the files on bitbucket . Please try again "+ err);
      
  }
  

}

// Below mentioned updatefiles method is used to update the version of Gruntfile.js and Main.js file. Once version of the files has been updated successfully then it will call runcommand method. 

function updatefiles(path)
{ 
    try{  
    
    fs.readFile(path, function (err, data) {
        
        //if (err) throw err;
        if(err){
            console.log(err);
        }
        if((path.indexOf("Main.js")==-1)){  
            let str='var strVersion = "v5.7.';
            let data2=str;    
            let index=data.indexOf(str);
            let stringfs=data.toString();
            let fstr=stringfs.substring(index+=23,index+3);
            data2+=fstr+";";
            let i=parseFloat(fstr);
            let version=(i+1);
            str+=version+"\";";         
            Shelljs.sed('-i', data2,str, path);
            updatefiles(mainjs_url);
        }
        else{           
            let str='var currentReaderVersion = "v5.7.';
            let data2=str; 
            let index=data.indexOf(str);
            let stringfs=data.toString();
            let fstr=stringfs.substring(index+=33,index+2);
            data2+=fstr+"\";";
            let i=parseFloat(fstr);
            let version=(i+1);
            str+=version+"\";";          
            Shelljs.sed('-i', data2,str, path);
            runcommand();          

        }

      });
    }
    catch(err){
        console.log("Error while updating the grunt and main js files "+ err);
    }

}

//Below mentioned printdata method is used to append the jondata in the googleClassroom_whiteList.jsn file and once the data has been successfully appended in the file then it will call jsonvalidator method to check that googleClassroom_whiteList.json file is valid or not.
async function printdata(row)
 {     
      try{
    
        fs.appendFile(jsonfile_path,jsondata,function(err){
            if(!err) {
         
             jsonvalidator();
            }
            else
            {        
            //jsonvalidator();
            console.log("error "+ err); 

            }
            

        })
    }
    catch(err)
    {
        console.log("Error while creating json file "+ err);
    }
    
 }



 var   jsondata="  { \"dist_refid\":\"\",\"date_updated\":\"'"+current_datetime+"'\",\"whitelisted_ids\":[";

// Bellow mention accessSpreadsheet method is responsible for fetching the data from google spread sheet and create new json file googleClassroom_whiteList.json with the help of printdata method.

 async function accessSpreadsheet() {
     try{    
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
         if(rows.length != counter){
            
            jsondata+=row.json;

        }
       else{
        jsondata=jsondata.substring(',', jsondata.length-1)
        jsondata+="]}";           
        fs.unlink(jsonfile_path,function(err){
            if(err){
                console.log(err);
            }
           });
        printdata(jsondata);

       }  

     });
    }
    catch(err) {
        console.log("Error while Fetching the data from google spreadsheet "+ err);
    }
      
 }

accessSpreadsheet();
