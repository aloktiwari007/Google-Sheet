/**
 * @author sumanta.mishra
 * Initialize when ready.
 * Invoke the content showroom role.
 * Set initial variables.
 */
var currentReaderVersion = "v5.7.32";
var click = { x: 0, y: 0 };
var _objQueryParams = {};
var ismobile = navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i);
var isTouchAndType = navigator.userAgent.match(/\bCrOS\b/);
var lastVisitedPage;
var isWinRT = false;
var WinRTPointerEventType = "";
var WinRTPointerEventType_Up = "";
var WinRTPointerType = "";
var hmhPolicy = null;

var nCSSLoadCounter = 0;
var nCSSLoadedCounter = 0;
var isLayoutAdded = false;
var isContentCSSLoaded = false;
var isAppInitialized = false;
var instanceScrollView = null;
var isToLoadReaderSettingsFile = true;

var _bUseOnDemandLoader = true;
//true will use onDemandLoader utility to load files asynchronously while false will load the files synchronously using locally written method	
var preloaderPath = "";

var _iTaskNumber = 0;
var isNative;
var isNativePublisher;
var topNavigationBarHeight = 0;
//this variable contain the tasks in a sequential manner
var arrTaskSequence = [
    AppConst.LOAD_ANNOTATION_FILE,
    AppConst.LOAD_AUTOBOOKMARK_FILE,
    AppConst.LOAD_LEARNOSITY_FILE,
    AppConst.PARSE_QUERY_STRING,
    AppConst.LOAD_EPUB_GLOABL_SETTINGS,
    AppConst.LOAD_LTIHELPER_FILE,
    AppConst.INITIALIZE_APP
];

var arrTasksBeforeInitialization = [
    AppConst.LOAD_APP_FEATURES,
    AppConst.LOAD_LOCALIZATION_DATA,
    AppConst.LOAD_CSS,
    AppConst.LOAD_TOC_XHTML,
    AppConst.LOAD_LAYOUT_HTML
];

    


$(function() {
    
    //console.log("strReaderPath: " + strReaderPath);
    if (strReaderPath != undefined) {
        preloaderPath = strReaderPath + "src/assets/6TO12/images/main/Preloader_circles.gif";
        //console.log("preloaderPath: " + preloaderPath);
        $('<img/>').attr('src', preloaderPath);
    }
    //log( navigator.userAgent.match(/Touch/), "navigator.userAgent");
    if( window.navigator.msPointerEnabled && navigator.userAgent.match(/Touch/) != null )
    {
        if( window.MSPointerEvent )
        {
            WinRTPointerEventType = "MSPointerDown";
            WinRTPointerEventType_Up = "MSPointerUp";
        }
        else
        {
            WinRTPointerEventType = "pointerdown";
            WinRTPointerEventType_Up = "pointerup";
        }
        isWinRT = true;
    }

    //$($('head').find('[href*="jquery.mobile-1.0.1.min.css"]')[0]).remove();
    $($('head').find('[href*="jquery.mobile.simpledialog.css"]')[0]).remove();
    
    mainAppModule = angular.module('mainApp', ['templates-app','ngSanitize']);
    startTask();
    
});

/**
 * This function starts a given task (through _iTaskNumber)
 * @param none
 * @return void
 */
 var noteOperator;// = new MG.NoteOperator();
function startTask() {
    var strTask = arrTaskSequence[_iTaskNumber];
    switch (strTask) {
        case AppConst.LOAD_ANNOTATION_FILE:
            loadAnnotationFile();
            break;

        case AppConst.LOAD_LEARNOSITY_FILE:
            loadLearnosityFile();
            break;

        case AppConst.LOAD_AUTOBOOKMARK_FILE:
            loadAutobookmarkFile();
            break;

        case AppConst.PARSE_QUERY_STRING:
            parseQueryString();
            break;

        case AppConst.LOAD_EPUB_GLOABL_SETTINGS:
            loadEPubGlobalSettings();
            break;

        case AppConst.LOAD_LTIHELPER_FILE:
            loadltiHelperFile(); 
            /*if(document.location.hostname == "localhost" || document.location.hostname == "10.11.3.110"){
                taskComplete();
            }
            else{
                var userInfoDetail = jwt_decode($.cookie('Authn'));
                var issValue = userInfoDetail.iss;
                if (issValue.toLowerCase().indexOf("hmhco.com") != -1){
                    loadltiHelperFile(); 
                }
                else{
                    taskComplete();//If the platform is not HMHOne, continue with task complete function
                }
            }*/
            taskComplete();
            break;

        case AppConst.INITIALIZE_APP:
            //below localhost check is to remove DPerror popup when running ebook locally.
            if(document.location.hostname == "localhost"){
                GlobalModel.isLoginPopup = false;
            }
            if(GlobalModel.isLoginPopup) {
                $("#appPreloaderContainer").css("display","none");
                showDPerror();
            }
            else
            {
                $( document ).trigger("initializeAngularApp");
                noteOperator = new NoteOperator();
                if( instanceScrollView == null )
                {
                    if (EPubConfig.isReflowable) {
                        instanceScrollView = new objReflowScrollView();
                    }
                    else {
                        instanceScrollView = new objScrollView();
                    }                    
                    instanceScrollView._init();
                }
                angular.forEach($('[objectcontainer]'), function (obj) {
                    var objName = $(obj).attr('objectcontainer');
                    var instanceComponent = new window[objName]();
                    instanceComponent._init();
                })
                noteOperator._init();
                storeUserDetails();
                $("#appPreloaderContainer").html('<div class="loading"><div id="preloadMsgImg" class="IEloader"></div></div>');
                //getUserRole();
                $("#mainShowroom").css("visibility", "visible");
                $("#mainShowroom").css("opacity", "0.3");
                $( "#mainShowroom" ).addClass( "shellFadeInEffect" );
                //console.log("$('.ui-loader'): ", $('.ui-loader'));
                $('.ui-loader').remove();
            }
            
            /* To set the Language attribute on the basis of cofig property */
            if(EPubConfig.LocalizationLanguage == "es"){
                document.getElementsByTagName('html')[0].setAttribute('xml:lang',"es-US");
            }
            else{
                document.getElementsByTagName('html')[0].setAttribute('xml:lang',"en-US");
            }

            if($('#pg').css('display') != "block" && !$("#pg").attr("data-url")){
                location.reload();
            }
            break;
    }
}

function loadAppTemplate(grade) {
       
    var filePath = 'src/app/app.templates'+grade+'.js';
    var scriptTag = document.createElement('script');
    scriptTag.onload = function () {
        taskComplete();
    };
    scriptTag.onerror = function () {
        
    };
    scriptTag.setAttribute('src', filePath);
    document.head.appendChild(scriptTag);
}

function loadPolicyFile(){
    var policyUrl = getPathManager().appendReaderPath('content/antisamy/policies/antisamy-hmh-1.0.1.xml');
    var deferred = [
        $.ajax({
            url: policyUrl,
            dataType: 'text'
        })
    ];    

    $.when.apply(null, deferred).done(function(policy) {
        hmhPolicy = policy;
    });
}

function loadAnnotationFile() {
    /*if (strReaderPath != "") {
        var annoFileURL = "/content/tools/common/sdks/annotations/annotations-service-2-latest.min.js";
    }
    else {
        var annoFileURL = "http://my-review-cert.hrw.com/content/tools/common/sdks/annotations/annotations-service-2-latest.min.js";
    }*/
    var annoFileURL = "https://sal.hmhco.com/annotations/annotations-service-2-latest.min.js?date=" + Date.now();
    var scriptTag = document.createElement('script');
    scriptTag.onload = function () {
        taskComplete();
    };
    scriptTag.onerror = function () {
         taskComplete();        
    };
    scriptTag.setAttribute('src', annoFileURL);
    document.head.appendChild(scriptTag);
    // $.getScript("/content/tools/common/sdks/annotations/annotations-service-2-latest.min.js", function (){
    //    taskComplete();
    //})
    var googleClassroomPlatformCDNPath = "https://apis.google.com/js/platform.js";
    var scriptTagCDN = document.createElement('script');
    scriptTagCDN.setAttribute('src', googleClassroomPlatformCDNPath);
    document.head.appendChild(scriptTagCDN);
}

/**
 * This function is used to load the learnosity Helper file in the script tag.
 * @param none
 */
function loadLearnosityFile(){
    if (strReaderPath != "") {
        var learnosityHelperURL = "/content/tools/common/sdks/learnosity-helper/learnosity-helper-0.2-latest.min.js";
    }
    else {
        var learnosityHelperURL = "https://sal.hmhco.com/learnosity-helper/learnosity-helper-0.1.0.min.js?date=" + Date.now();
    }
    /*var learnosityHelperURL = "https://sal.hmhco.com/learnosity-helper/learnosity-helper-0.1.0.min.js?date=" + Date.now();*/
    var scriptTag = document.createElement('script');
    scriptTag.onload = function () {
        taskComplete();
    };
    scriptTag.onerror = function () {
         taskComplete();        
    };
    scriptTag.setAttribute('src', learnosityHelperURL);
    document.head.appendChild(scriptTag);
}

/*
* This function is used to load the LtiHelper file in script tag.
*/
function loadltiHelperFile(){
    var ltiHelperURL = "/content/tools/common/sdks/lti-helper/lti-helper-0-latest.min.js";
    // var ltiHelperURL = "http://sal.hmhco.com/lti-helper/lti-helper-0-latest.min.js";
    var scriptTag = document.createElement('script');
    scriptTag.onload = function () {
        // taskComplete();
    };
    scriptTag.onerror = function (err) {
        // taskComplete();
        console.log("Unable to load LtiHelper Library", err);
    };
    scriptTag.setAttribute('src', ltiHelperURL);
    document.head.appendChild(scriptTag);
}

function loadAutobookmarkFile(){
    var abmURL = "/content/tools/common/sdks/auto-bookmark-js/auto-bookmark-js-0.3-latest.min.js";
    var scriptTag = document.createElement('script');
    scriptTag.onload = function () {
        taskComplete();
    };
    scriptTag.onerror = function (err) {
        taskComplete();
        console.log("Unable to load Autobookmark Library", err);
    };
    scriptTag.setAttribute('src', abmURL);
    document.head.appendChild(scriptTag);
}

/**
 * This function is called at the end of a task
 * @param none
 * @return void
 */
function taskComplete() {
    _iTaskNumber++;
	
    //if all tasks are not complete, start the next task;
    if (_iTaskNumber < arrTaskSequence.length) {
        startTask();
    }
}

function parseQueryString() {
    var parts = window.location.search.substr(1).split("&");
    for (var i = 0; i < parts.length; i++) {
        if(parts[i] != ""){
            var queryParamAndValue = parts[i].split("=");
            var parameter = "";
            //value at index 0 represents the query parameter and at index 1 represents the value for the parameter;
            if(queryParamAndValue.length > 2){
                parameter = parts[i].substring(parseInt(parts[i].indexOf("=")) + 1, parts[i].length);
                _objQueryParams[queryParamAndValue[0].toLowerCase()] = parameter;
            }
            else{
                parameter = queryParamAndValue[1];
                _objQueryParams[queryParamAndValue[0].toLowerCase()] = queryParamAndValue[1];
            }

        }
    }
    if(_objQueryParams.booktitle)
        EPubConfig.bookTitle = _objQueryParams.booktitle;



    if (_objQueryParams.printpage){
        EPubConfig.Print_isAvailable = true;
    }

    if (_objQueryParams.grade) {
        if (AppConst["GRADE_" + _objQueryParams.grade.toUpperCase()] == null) {
            alert("Invalid Grade. Kindly enter correct grade")
            throw new Error("Invalid Grade");
        }

        //ensuring that value of grade is in required case;
        _objQueryParams.grade = AppConst["GRADE_" + _objQueryParams.grade.toUpperCase()];        

    }  
	
    loadPolicyFile();
    taskComplete();
}



/**
 * This function loads the Global Settings file available in ePub
 * @param none
 * @return void
 */
function loadEPubGlobalSettings() {

    var url = getPathManager().getEPubGlobalSettingsPath();
    var isIE8or9;
	var ver = getInternetExplorerVersion();
	if (ver > -1) {
		if (ver <= 9.0) {
			isIE8or9 = true;
		}
	}
    var processData = function(objConfigSettings) {
        //mapping properties in Global Settings file to properties in Config.js
        for (var i = 0; i < readerPropertyList.length; i++) {
            var objPropertyInfo = readerPropertyList[i];

            //check if data exists or not. If it doesn't, check if it was mandatory. If data is mandatory, and property does not exists, throw an error;
            if (objConfigSettings[objPropertyInfo.propertyName] != null) {
                EPubConfig[objPropertyInfo.propertyName] = objConfigSettings[objPropertyInfo.propertyName];
            } else if (objPropertyInfo.isMandatory) {
                throw new Error("Mandatory Configuration Property (" + objPropertyInfo.propertyName + ") is missing, null or undefined in Global Settings File")
            }
        }

        ServiceManager.searchService = EPubConfig.Search_Service_URL;

        if(ismobile)
        {
            EPubConfig.KeyboardAccessibility_isAvailable = false;
        }
        if(_objQueryParams.viewtype)
            EPubConfig.Page_Navigation_Type = AppConst[_objQueryParams.viewtype.toUpperCase()];

        if (_objQueryParams.theme) {
            EPubConfig.Theme = _objQueryParams.theme;
        }

        if (_objQueryParams.componenttype){
            EPubConfig.Component_type = _objQueryParams.componenttype.toUpperCase();
        }

        if(EPubConfig.DPLive != undefined)
        {
            if(EPubConfig.DPLive == false)
            {
                GlobalModel.DPLive = EPubConfig.DPLive;
            }
        }

        if (EPubConfig.Title) {
            $('title').html(EPubConfig.Title);
        }
        if(EPubConfig.HTML5_audio){
            EPubConfig.AudioPlayer_isAvailable = true;
        }
        else
        {
            EPubConfig.AudioPlayer_isAvailable = false;
        }

        if(_objQueryParams.grade)
        {
            EPubConfig.ReaderType = _objQueryParams.grade;
        }
        if( EPubConfig.ReaderType.toUpperCase() == "PREKTO1" )
        {
            EPubConfig.ReaderType = "PREKTO1";
        }
            
        if( _objQueryParams.addcomments )
        {
            GlobalModel.AddComment = true;
        }
        
        if(ismobile || isIE8or9)
        {
            EPubConfig.Print_isAvailable = false;
        }

        //Setting the Default HELP URL if help type is Internal
        if(EPubConfig.Help_Type.toLowerCase() == "internal"){
           if( ServiceManager.getUserRole() == AppConst.USERTYPE_STUDENT )
           {
               if(EPubConfig.ReaderType.toUpperCase() == "6TO12"){
                   EPubConfig.Help_URL = getPathManager().appendReaderPath( 'content/pdf/QSG_SE_Gr6-12.pdf' );
               }
               else{
                   EPubConfig.Help_URL = getPathManager().appendReaderPath( 'content/pdf/QSG_SE_Gr2-5.pdf' );
               }
           }
           else{
               EPubConfig.Help_URL = getPathManager().appendReaderPath( 'content/pdf/QSG_TE-Grk-12.pdf' );
           }
        }
        if(EPubConfig.Volume == ""){
            EPubConfig.Volume = -1;
        }
		
		if(EPubConfig.ReaderType.toUpperCase() == "PREKTO1")
		{
			// EPubConfig.AnnotationSharing_isAvailable = false;
		}
		if(EPubConfig.ReaderType.toUpperCase() == "6TO12" || EPubConfig.ReaderType.toUpperCase() == "PREKTO1")
		{
			topNavigationBarHeight = 60;
		}
        if(EPubConfig.ReaderType.toUpperCase() == "2TO5")
        {
            topNavigationBarHeight = 60;
        }

	    if( EPubConfig.Notes_isAvailable == false )
	    {
	    	EPubConfig.AnnotationSharing_isAvailable = false;
	    }
	    
	    if( ( ServiceManager.getUserRole() == AppConst.USERTYPE_STUDENT ) && ( EPubConfig.Component_type == "TE" ) )
	    {
	    	EPubConfig.AnnotationSharing_isAvailable = false;
	    }
		if( _objQueryParams.scroll == "continuous" )
		{
			_objQueryParams.scroll = "continous";
		}
        if( EPubConfig.isReflowable )
        {
        	EPubConfig.DataRole = "reflowpagecomp";
        }
        else
        {
        	EPubConfig.DataRole = "pagecomp";
        }
        
        if (_objQueryParams.mdssortorder)
	    {
			if(_objQueryParams.mdssortorder.toUpperCase() == "ASC") 
			{
	        	EPubConfig.MDSSortOrder = "ASC";
	       }
	       else if(_objQueryParams.mdssortorder.toUpperCase() == "DESC") 
	       {
	       		EPubConfig.MDSSortOrder = "DESC";
	       }
	    }
	    if(EPubConfig.Page_Navigation_Type.toUpperCase() == AppConst.SCROLL_VIEW.toUpperCase())
	    {
	    	EPubConfig.Page_Navigation_Type = AppConst.SINGLE_PAGE;
	    }

        if($.cookie('Authn') != null)
        {
            //below cookie is given hard coded so that to run ebook locally.
            var getCookie = $.cookie('Authn');
            if(document.location.hostname == "localhost"){
                getCookie = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL215Lmhydy5jb20iLCJhdWQiOiJodHRwOi8vd3d3LmhtaGNvLmNvbSIsImlhdCI6MTQ4ODI1NjkyOSwic3ViIjoiY25cdTAwM2RVTUNBUkVWSUVXQix1aWRcdTAwM2RVTUNBUkVWSUVXQix1bmlxdWVJZGVudGlmaWVyXHUwMDNkZGJhYTU1Mjk4ZTllNDQ2ODk4YTc5ZjRjMmVkNzU1OTIsb1x1MDAzZDg4MjAwMDExLGRjXHUwMDNkODgyMDAwMDksc3RcdTAwM2RDQSxjXHUwMDNkTi9BIiwiaHR0cDovL3d3dy5pbXNnbG9iYWwub3JnL2ltc3B1cmwvbGlzL3YxL3ZvY2FiL3BlcnNvbiI6WyJJbnN0cnVjdG9yIl0sIlBsYXRmb3JtSWQiOiJITU9GIiwiZGlzdF9yZWZpZCI6Ijk1OWQyZjExLWE3YWUtNDE0Mi1hNmU2LWEwNTg2NjMyY2E4NCIsImV4cCI6MTQ4ODI2ODEwNn0.hQQ96s-bcpoKLCd9wv57Vw9OCBqJ4IAXVhITS1ZouPk";
            }
            var strAuthCookieVal = jwt_decode(getCookie);
            strAuthCookieVal = JSON.stringify(strAuthCookieVal);
            strAuthCookieVal = strAuthCookieVal.toLowerCase();
            if(strAuthCookieVal.indexOf('uniqueidentifier') == -1)
            {
                EPubConfig.My_Notebook_isAvailable = false;
            }
        }
	    else if( $.cookie('SCK_REF') != null )
	    {
	    	EPubConfig.My_Notebook_isAvailable = false;
	    }
	    if( EPubConfig.Language_isAvailable == false && EPubConfig.Print_isAvailable == false && EPubConfig.Help_isAvailable == false){
            EPubConfig.Settings_isAvailable = false;
        }

        var iLength = GlobalModel.ePubGlobalSettings.PageBreaks.length;
        /*self.member.totalPagesOnCreation = iLength;
        if (EPubConfig.isPageOrderInSequence == false) {
            this.member.arrPageNames = this.options.arrPageLinkList;
            iLength = this.options.arrPageLinkList.length;
        }*/

        for (var i = 0; i < iLength; i++) {

            objPgNameReg = /.xhtml/gi;
            strPageName = GlobalModel.ePubGlobalSettings.PageBreaks[i].pageName;//this.options.arrPageLinkList[i];
            strPageName = strPageName.replace(objPgNameReg, "");
            var pageBrkValue = 0;
            var pageBreakId = "";

            if (GlobalModel.ePubGlobalSettings.PageBreaks) {
                if (GlobalModel.ePubGlobalSettings.PageBreaks[i]) {
                    pageBrkValue = GlobalModel.ePubGlobalSettings.PageBreaks[i].pageBreakValue;
                    pageBreakId = GlobalModel.ePubGlobalSettings.PageBreaks[i].pageBreakId;
                    var objPageData = GlobalModel.ePubGlobalSettings.Page[i];
                    for (var strProp in GlobalModel.ePubGlobalSettings.PageBreaks[i]) {
                        objPageData[strProp] = GlobalModel.ePubGlobalSettings.PageBreaks[i][strProp];
                    }
                    objPageData["pagebreakname"] = objPageData["pageName"].replace(/.xhtml/gi, "");
                    objPageData.pagesequence = i;
                    GlobalModel.pageDataByPageBreakValue["pagebreakid_" + pageBrkValue] = objPageData;
                    GlobalModel.pageDataByPageName[objPageData["pagebreakname"]] = objPageData;
                    GlobalModel.pageDataBySequence["pagesequence_" + i] = objPageData;
                } else {
                    pageBrkValue = i + 1;
                }
            } else {
                pageBrkValue = i + 1;
            }

            GlobalModel.pageBrkValueArr[i] = pageBrkValue + "";
            //Ensuring that the value is a string.    
        }

        configSettingsParseCompleteHandler();
		
        //taskComplete();
    }
    
    try {
        GlobalModel.ePubGlobalSettings = objConfig;
        //processData(objConfig["Settings"])
		
		if (_objQueryParams.tshare == undefined && isToLoadReaderSettingsFile == true) {
			$.getJSON(getPathManager().getReaderSettingsFilePath(), function(objData){
				EPubConfig.AnnotationSharing_isAvailable = objData.AnnotationSharing_isAvailable;
				processData(objConfig["Settings"]);
			}).error(function(){
				processData(objConfig["Settings"]);
			});
		}
		else
		{
			if(_objQueryParams.tshare != undefined)
			{
				if(_objQueryParams.tshare == "true")
				{
					EPubConfig.AnnotationSharing_isAvailable = true;
				}
				else
				{
					EPubConfig.AnnotationSharing_isAvailable = false;
				}
			}
			
			processData(objConfig["Settings"]);
		}
    } catch(e) {
    	
        $.getJSON(url, function(objData) {
            GlobalModel.ePubGlobalSettings = objData;

            var objConfigSettings = objData["Settings"];

            //LOADS settings.txt FILE FOR CONFIGURATION SETTINGS OF READER
			if (_objQueryParams.tshare == undefined && isToLoadReaderSettingsFile == true) {
				$.getJSON(getPathManager().getReaderSettingsFilePath(), function(objData){
					EPubConfig.AnnotationSharing_isAvailable = objData.AnnotationSharing_isAvailable;
					processData(objConfigSettings);
				}).error(function(){
					processData(objConfigSettings);
				});
			}
			else
			{
				//EPubConfig.AnnotationSharing_isAvailable = (_objQueryParams.tshare != undefined) ? _objQueryParams.tshare : true;
				if(_objQueryParams.tshare != undefined)
				{
					if(_objQueryParams.tshare == "true")
					{
						EPubConfig.AnnotationSharing_isAvailable = true;
					}
					else
					{
						EPubConfig.AnnotationSharing_isAvailable = false;
					}
				}
				
				processData(objConfigSettings);
			}
        }).error(function() {
            alert("Unable to load book")
            console.error("Global Settings file not found")
        });
    }
}

function configSettingsParseCompleteHandler(){
    //ensuring that all properties are in required format;
    //areAllPropertiesInRequiredFormat();
    ServiceManager.DPLive = ServiceManager.isDPLive()//GlobalModel.DPLive,
    setPageViewType();

    loadContentCSSFiles();
    loadThemeCSS();
    loadLayoutXHTMLFile();
    loadLocalizationData();
    loadTocXHTMLFile();
    loadApplicationAndCoreJSFiles();
}


function setPageViewType() {
    var _isDefaultViewVisible = true;

    if (!EPubConfig.SinglePageView_isAvailable && !EPubConfig.ScrollPageView_isAvailable && !EPubConfig.DoublePageView_isAvailable) {
        // do nothing
    } else {
        _isDefaultViewVisible = checkifDefaultViewisVisible();
        if (_isDefaultViewVisible == false) {
            if (EPubConfig.SinglePageView_isAvailable) {
                EPubConfig.Page_Navigation_Type = AppConst.SINGLE_PAGE;
            } else if (EPubConfig.ScrollPageView_isAvailable) {
                EPubConfig.Page_Navigation_Type = AppConst.SCROLL_VIEW;
            } else if (EPubConfig.DoublePageView_isAvailable) {
                EPubConfig.Page_Navigation_Type = AppConst.DOUBLE_PAGE;
            }
        }
    }

    switch(EPubConfig.Page_Navigation_Type) {
        case AppConst.SCROLL_VIEW:
            EPubConfig.pageView = AppConst.SCROLL_VIEW_CAMEL_CASING;
            //	EPubConfig.swipeNavEnabled = false;
            break;

        case AppConst.SINGLE_PAGE:
            EPubConfig.pageView = AppConst.SINGLE_PAGE_CAMEL_CASING;
            //EPubConfig.swipeNavEnabled = true;
            break;

        case AppConst.DOUBLE_PAGE:
            EPubConfig.pageView = AppConst.DOUBLE_PAGE_CAMEL_CASING;
            //EPubConfig.swipeNavEnabled = true;
            break;

        default:
            throw new Error("Value of config property Page_Navigation_Type is not either " + AppConst.SCROLL_VIEW + " or " + AppConst.SINGLE_PAGE + " or " + AppConst.DOUBLE_PAGE)
            break;
    }
}


function loadContentCSSFiles(){
    var objThis = this;
    var url = getPathManager().getEPubCSSPath(EPubConfig.cssFileNames[nCSSLoadCounter]);
    //console.log("main::::",url)
    var hasPageLevelCss = false;

    $("<iframe/>").attr("src", url);

    nCSSLoadCounter++;
    if (nCSSLoadCounter < EPubConfig.cssFileNames.length) {
        loadContentCSSFiles();
    }
}

/**
 * This function loads the css of application based on set/selected theme
 * @param none
 * @return void
 */
function loadThemeCSS() {
    var url = ""
    var strHoverURL = "";
    /* */

    if (EPubConfig.Theme.toLowerCase() == "default" || EPubConfig.Theme.toLowerCase() == "6to12" || EPubConfig.Theme.toLowerCase() == "2to5" || EPubConfig.Theme.toLowerCase() == "prekto1") {
        EPubConfig.Theme = EPubConfig.ReaderType;
        url = getPathManager().appendReaderPath("src/css/" + EPubConfig.Theme.toUpperCase() + "/mg.theme.css");
        strHoverURL = getPathManager().appendReaderPath("src/css/" + EPubConfig.Theme.toUpperCase() + "/mg.theme.hover.css");
    }


    $.ajax({
        type : "GET",
        url : url,
        processData : false,
        dataType:"text",
        contentType : "plain/text",

        success : function(data) {
            appendCSSContent(data);
            preInitializationTaskCompleteHandler(AppConst.LOAD_CSS);
            loadThemeHoverCSS(strHoverURL);

        },

        error : function() {
            console.error("Error in loading requested theme.")
        }
    });
}

/**
 * This function loads the hover CSS of application based on set/selected theme if user is using desktop environment else it calls the task complete function.
 * @param none
 * @return void
 */
function loadThemeHoverCSS(strHoverURL) {
    if (ismobile == null) {
        var url = strHoverURL;
        //getPathManager().appendReaderPath("css/" + EPubConfig.Theme + "/mg.theme.hover.css");
        $.ajax({
            type : "GET",
            url : url,
            processData : false,
            dataType:"text",
            contentType : "plain/text",
            success : function(data) {
                appendCSSContent(data);
                //taskComplete();
            },
            error : function() {
                //in case hover states are not available, build can still run...
                //taskComplete();
            }
        })
    } else {
        //taskComplete();
    }
}

/**
 * This function adds the loaded css to the application
 * @param none
 * @return void
 */
function appendCSSContent(strCSS) {

    objReg = /url\(src/g;
    strCSS = strCSS.replace(objReg, "url(" + strReaderPath + "src");

    objReg = /url\(\"/g;
    strCSS = strCSS.replace(objReg, "url(\"" + strReaderPath);

    objReg = /url\(\'/g;
    strCSS = strCSS.replace(objReg, "url('" + strReaderPath);

    var scrScript = '<style type="text/css">' + strCSS + "</style>";
    $('head').append(scrScript);
}

function loadLayoutXHTMLFile()
{
    var type = "GET";
    var url = getPathManager().getLayoutFilePath();
    //console.log("loading layout html");
    $.ajax({
        url: url,
        type: type,
        dataType: "html",
        // Complete callback (responseText is used internally)
        complete: function(jqXHR, status, responseText){
            //console.log("** load complete of layout xhtml");
            // Store the response as specified by the jqXHR object
            responseText = jqXHR.responseText;
            // If successful, inject the HTML into all the matched elements
            if (jqXHR.isResolved()) {
                // #4825: Get the actual response in case
                // a dataFilter is present in ajaxSettings
                jqXHR.done(function(r){
                    responseText = r;
                });
                responseText = getPathManager().replaceMediaURLs(responseText);
                //console.log(responseText);

                objReg = /url\(\"/g;
                responseText = responseText.replace(objReg, "url(\"" + strReaderPath);

                objReg = /url\(\'/g;
                responseText = responseText.replace(objReg, "url('" + strReaderPath);
                // See if a selector was specified

                GlobalModel.layoutHTMLData = responseText;
                preInitializationTaskCompleteHandler(AppConst.LOAD_LAYOUT_HTML);

            }
        }
    });
}


/**
 * This function loads the localized data based on the configuration parameter
 * @param none
 * @return void
 */
function loadLocalizationData() {
    EPubConfig.LocalizationLanguage = EPubConfig.LocalizationLanguage.toLowerCase();
    EPubConfig.defaultLocalizationLanguage = EPubConfig.defaultLocalizationLanguage.toLowerCase();
    //alert(EPubConfig.ReaderType);
    var strReaderType = EPubConfig.ReaderType;    
    //alert(strReaderType);

    var strLocalizationFilePath = getPathManager().appendReaderPath('content/localization/' + strReaderType + "/"+ EPubConfig.LocalizationLanguage + '.txt');

    $.getJSON(strLocalizationFilePath, function(objData) {

        GlobalModel.localizationData = objData;
		if(EPubConfig.StandardsTitle != undefined)
		{
			GlobalModel.localizationData.COMMON_CORE_STANDARDS = EPubConfig.StandardsTitle;
		}
		preInitializationTaskCompleteHandler(AppConst.LOAD_LOCALIZATION_DATA);
    }).error(function(e) {

        //in case set localization language which failed to load is not the default localization language, then load the default default localization language.
        if (EPubConfig.LocalizationLanguage != EPubConfig.defaultLocalizationLanguage) {
            console.log("Unable to locate the required loacalization data. Loading default Localization data")
            EPubConfig.LocalizationLanguage = EPubConfig.defaultLocalizationLanguage;
            loadLocalizationData();
        } else {
            console.error("Localization file(s) missing")
        }
    });
}

function loadTocXHTMLFile()
{
    var strURL = getPathManager().getTOCPath();
    //console.log("loading TOC xhtml");
    $.ajax({
        type:"GET",
        url:strURL,
        processData: false,
        contentType: "plain/text",
        success: function(data)
        {
            //console.log("** load complete of TOC xhtml");
            try
            {
                GlobalModel.tocXHTMLData = data;
                preInitializationTaskCompleteHandler(AppConst.LOAD_TOC_XHTML);
            }
            catch(e)
            {
                console.error(e.message)
            }
        },
        error: function()
        {
            console.error("TOC ERROR: TOC failed to load.")
        }
    })
}

/**
 * This function loads the main application files and theme/widget specific files.
 * @param none
 * @return void
 */
function loadApplicationAndCoreJSFiles() {
    var arrFilesToLoad = [];
    var strExt = ".js";

    var coreFilesLoadCompleteHandler = function(){
        loadAppFeatures();
    }

    try {

        if(strReaderPath != "")
        {
            {
                LayoutConfig = {};

                LayoutConfig.READER_TYPE_6TO12 = {CORE: ["src/app/components/6TO12/core_min"]};
				LayoutConfig.READER_TYPE_6TO12_DEFAULT = {CORE: ["src/app/components/6TO12/core_min"]};
                LayoutConfig.READER_TYPE_2TO5 = {CORE: ["src/app/components/6TO12/core_min"]};
                LayoutConfig.READER_TYPE_PREKTO1 = {CORE: ["src/app/components/6TO12/core_min"]};
            }
        }

        if (LayoutConfig["READER_TYPE_" + EPubConfig.ReaderType] == null) {
            throw new Error("Invalid Reader Type");
        }
        //adding to list the widget specific files
        var arrCoreFiles = LayoutConfig["READER_TYPE_" + EPubConfig.ReaderType].CORE;
        
        //console.log("Main.js: 212: loadApplicationAndCoreJSFiles start");
        var nTotalFileLoadCounter = 0;
        var strFilePath = "";
        var fileLoadFailed = false;
        for ( i = 0; i < arrCoreFiles.length; i++) {
            strFilePath = getPathManager().appendReaderPath(arrCoreFiles[i] +  strExt);

            arrFilesToLoad.push(strFilePath);
            var scriptTag = document.createElement('script');
            scriptTag.onload = function(){

                nTotalFileLoadCounter++;
                if(nTotalFileLoadCounter == arrCoreFiles.length)
                {
                    if(fileLoadFailed)
                    {
                        alert("Unable to load some Javascript files.");
                    }
                    else
                    {
                        coreFilesLoadCompleteHandler();
                    }

                }
            };
            scriptTag.onerror = function(){
                fileLoadFailed =  true;
                nTotalFileLoadCounter++;
                if(nTotalFileLoadCounter == arrCoreFiles.length)
                {
                    alert("Unable to load some Javascript files.");
                }
            };
            scriptTag.setAttribute('src', strFilePath);
            document.head.appendChild(scriptTag);
        }
    } catch(e) {
        console.error(e.message);
    }
}




/**
 * This function loads the JS files of required features at runtime.
 * @param none
 * @return void
 */
function loadAppFeatures() {
    createRequiredFeaturesList();

    if (EPubConfig.RequiredApplicationComponents == null) {
        EPubConfig.RequiredApplicationComponents = [];
    }

    preInitializationTaskCompleteHandler(AppConst.LOAD_APP_FEATURES);

}

function checkifDefaultViewisVisible() {
    if (EPubConfig.Page_Navigation_Type == AppConst.SINGLE_PAGE) {
        if (EPubConfig.SinglePageView_isAvailable) {
            return true;
        } else {
            return false;
        }
    } else if (EPubConfig.Page_Navigation_Type == AppConst.SCROLL_VIEW) {
        if (EPubConfig.ScrollPageView_isAvailable) {
            return true;
        } else {
            return false;
        }
    } else if (EPubConfig.Page_Navigation_Type == AppConst.DOUBLE_PAGE) {
        if (EPubConfig.DoublePageView_isAvailable) {
            return true;
        } else {
            return false;
        }
    }
}

/**
 * This function creates required features list based on settings by HMH
 * @param none
 * @return void
 */
function createRequiredFeaturesList() {
    var strFeature = "";

    //if annotations are set to false, override isAvailable property of all annotation tools and set them to false;
    //if (EPubConfig.Markup_Tool_isAvailable
    if (EPubConfig.Markup_Tool_isAvailable == false) {
        for (strFeature in EPubConfig.AnnoToolNames) {
            var strIsAvailableProperty = EPubConfig.Feature_isAvaliblePropertyMapping[strFeature];

            if (strIsAvailableProperty) {
                EPubConfig[strIsAvailableProperty] = false;
            }
        }
    } else {
        var iFalse = 0;
        var iTotal = 0;
        for (strFeature in EPubConfig.AnnoToolNames) {

            var strIsAvailableProperty = EPubConfig.Feature_isAvaliblePropertyMapping[strFeature];
            if (strIsAvailableProperty) {
                iTotal++;
                if (EPubConfig[strIsAvailableProperty] == false) {
                    iFalse++;
                }
            }
        }

        if (iFalse == iTotal) {
            EPubConfig.Markup_Tool_isAvailable = false;
        }
    }

    //adding required tools to RequiredApplicationComponents property for further processing;
    EPubConfig.RequiredApplicationComponents = (EPubConfig.RequiredApplicationComponents == null) ? [] : EPubConfig.RequiredApplicationComponents;

    //creating tabbed panel required list
    for (strPanelType in EPubConfig.TabbedPanels) {
        var objPanelSubPanels = EPubConfig.TabbedPanels[strPanelType];
        var isPanelAvailable = false;

        for (strFeature in objPanelSubPanels) {
            var strIsAvailableProperty = EPubConfig.Feature_isAvaliblePropertyMapping[strFeature];

            //if any of the sub-panels is available, make the master panel available
            if (EPubConfig[strIsAvailableProperty] == true) {
                isPanelAvailable = true;
                break;
            }
        }

        var strPanelsIsAvailableProperty = EPubConfig.Feature_isAvaliblePropertyMapping[strPanelType];
        EPubConfig[strPanelsIsAvailableProperty] = isPanelAvailable;
    }

    for (strFeature in EPubConfig.Feature_isAvaliblePropertyMapping) {
        var strIsAvailableProperty = EPubConfig.Feature_isAvaliblePropertyMapping[strFeature];

        if (EPubConfig[strIsAvailableProperty] == true) {
            EPubConfig.RequiredApplicationComponents.push(strFeature);
        }
    }
}

function preInitializationTaskCompleteHandler(strTaskName)
{
    var iIndex = arrTasksBeforeInitialization.indexOf(strTaskName);
    if(iIndex > -1)
    {
        arrTasksBeforeInitialization.splice(iIndex, 1);
    }
    if(arrTasksBeforeInitialization.indexOf(AppConst.LOAD_CSS) == -1 && arrTasksBeforeInitialization.indexOf(AppConst.LOAD_LAYOUT_HTML) == -1)
    {
        if(isLayoutAdded == false)
        {
            $("#mainShowroom").append(GlobalModel.layoutHTMLData);
            isLayoutAdded = true;
            
            
            //initializeAngularModules();
            MainController.updateBrandingBar();
        }
    }
    //console.log(strTaskName, iIndex, arrTasksBeforeInitialization);
    if(arrTasksBeforeInitialization.length == 0)
    {
        console.log("initialization start------------------------------------");
        taskComplete();
        ServiceManager.initializeAnnotationServiceAPI();

    }
}

/**
 * This method check if all isAvailable properties hold a boolean value. If not, it throws an error.
 * @param	none
 * @return	void
 */
function areAllPropertiesInRequiredFormat() {
    var arrInvalidProperties = [];

    for (var i = 0; i < readerPropertyList.length; i++) {
        var objPropertyInfo = readerPropertyList[i];
        if (EPubConfig[objPropertyInfo.propertyName]) {
            switch(objPropertyInfo.type) {
                case "integer":
                    if(isInteger(EPubConfig[objPropertyInfo.propertyName]) == false)
                        arrInvalidProperties.push({
                            propertyName : objPropertyInfo.propertyName,
                            type : objPropertyInfo.type
                        });
                    break;

                case "number":
                    if(isNumber(EPubConfig[objPropertyInfo.propertyName]) == false)
                        arrInvalidProperties.push({
                            propertyName : objPropertyInfo.propertyName,
                            type : objPropertyInfo.type
                        });
                    break;

                case "string":
                    if((typeof EPubConfig[objPropertyInfo.propertyName] === "string") == false)
                        arrInvalidProperties.push({
                            propertyName : objPropertyInfo.propertyName,
                            type : objPropertyInfo.type
                        });
                    break;

                case "array":
                    if(isArray(EPubConfig[objPropertyInfo.propertyName]) == false)
                        arrInvalidProperties.push({
                            propertyName : objPropertyInfo.propertyName,
                            type : objPropertyInfo.type
                        });
                    break;

                case "boolean":
                    if((typeof EPubConfig[objPropertyInfo.propertyName] === "boolean") == false)
                        arrInvalidProperties.push({
                            propertyName : objPropertyInfo.propertyName,
                            type : objPropertyInfo.type
                        });
            }
        }
    }

    if (arrInvalidProperties.length > 0) {
        var strMessage = "";
        for (i = 0; i < arrInvalidProperties.length; i++) {
            var aOrAn = (arrInvalidProperties[i].type == "integer" || arrInvalidProperties[i].type == 'array') ? "an " : "a ";
            aOrAn = (arrInvalidProperties[i].type == "boolean") ? "" : aOrAn;

            strMessage += (i + 1) + ". " + arrInvalidProperties[i].propertyName + " is not " + aOrAn  + arrInvalidProperties[i].type + "\n"
        }

        var strMessage1 = (arrInvalidProperties.length == 1) ? "property" : "properties"

        throw new Error("Data type of following " + strMessage1 + " is incorrect\n\n" + strMessage)
    }
}

function initAppFlow()
{
    //return;
    AppConst.ORIENTATION = "landscape";

    var strOrientFunc = "onresize";
    var userAgent = navigator.userAgent;
    if (ismobile) {//if running on device.
        var strOrientFunc = "onorientationchange";
    }
    isAppInitialized = true;
    window[strOrientFunc] = function() {
        click = { x: 0, y: 0 };
        /*if(document.activeElement)
         document.activeElement.blur();*/
        updateShowroom("1");

        //adding a timeout to ensure that resize or orientation change related changes take effect.
        setTimeout(function() {
            updateShowroom("2");
        }, 500);
    };
    //$.keepalive.configure( { interval : 840000, url: pingUrl, method: "GET" } );
    if(EPubConfig.platformId != "hmhone"){
         var keepAliveErrorHandler = function()
        {
            //$.keepalive.stop();
        }
        try {
            $.keepalive.configure({
                interval: 840000,
                url: EPubConfig.DP_KEEP_LIVE_URL,
                method: "GET",
                errorCallback: keepAliveErrorHandler
            });
        } catch(e) {
            console.warn("WARNING: Error in Keep alive call request!");

        }   
    }
    
    updateShowroom();

    // HotkeyManager.init();
}

function updateShowroom(i) {
    if ($(window).height() != window.innerHeight) {
        height = $(window).height() - ($(window).height()-window.innerHeight);
    }
    else {
        height = $(window).height();
    }
    width = $(window).width();
    /*

     $("body").css("width", width);
     $("body").css("height", height);

     $("#pg").css({"width": width,"height": height, "margin-top": "0px", "top": "0px"});

     $("#mainShowroom").css("width", width);
     $("#mainShowroom").css("height", height);*/
}

function showDPerror() {
    /*
    $("body").append('<div id="loginAlertPanel" class="deleteConfirmationPanel" ><div class="warningIcon"><div id="confirmPanelClsBtn" class="bookmarkPanelTopBarCloseBtn"><!DOCTYPE SVG PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg class="bookmarkPanelTopBarCloseBtnSVG" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve"><g id="print"><rect y="0" opacity="0" fill="#FFFFFF" width="20" height="20" /><polygon points="17.6,3.4 16.6,2.4 10,9 3.4,2.4 2.4,3.4 9,10 2.4,16.6 3.4,17.6 10,11 16.6,17.6 17.6,16.6 11,10  " /></g><g id="square_guide"></g><g id="icons"></g><g id="Layer_1"></g><g id="Layer_10"></g></svg></div></div><div id="loginAlertTxt" class="dltConfirmationTxt" ></div><div id="loginAlertOKBtn" data-role="buttonComp" class="dltConfirmationSuccess deletePrimaryButton" ></div></div>');*/

    var loginAlertDialog = getAlertDialogHtml();
    $("body").append(loginAlertDialog);    

    $("#loginAlertOKBtn").html(GlobalModel.localizationData["ALERT_OK_BUTTON"]);
    $("#loginAlertTxt").html(GlobalModel.localizationData["ERROR_LOGIN"]);
    $("#loginAlertOKBtn").unbind('click').bind('click',function(){
        PopupManager.removePopup();
        window.location = "/";
        return;
    });
    $("#loginAlertPanel").find("#confirmPanelClsBtn").unbind('click').bind('click',function(){
        $("#loginAlertOKBtn").trigger("click");
    });
    setTimeout(function() {
        PopupManager.addPopup($("#loginAlertPanel"), null, {
            isModal : true,
            isCentered : true,
            popupOverlayStyle : "popupMgrMaskStyleSemiTransparent",
            isTapLayoutDisabled : true
        });
        setAriaAndFocus();
    }, 0);
}

/* Start : Custom functions to read the login error dialog */
var shiftKeyPressed = false;
function getAlertDialogHtml() {
    var loginAlertDialog = '';

    loginAlertDialog += '<div id="loginAlertPanel" class="deleteConfirmationPanel" role="dialog">';
        loginAlertDialog +=  '<div class="warningIcon">';
            loginAlertDialog += '<div id="confirmPanelClsBtn" class="bookmarkPanelTopBarCloseBtn" tabindex="2" role="button" onkeydown="confirmPanelClsBtn(event); sfiftKeyPressed(event); closePanel(event);" onkeyup="sfiftKeyNotPressed(event);">';
                loginAlertDialog += '<!DOCTYPE SVG PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
                loginAlertDialog += '<svg class="bookmarkPanelTopBarCloseBtnSVG" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve">';
                    loginAlertDialog += '<g id="print">';
                         loginAlertDialog += '<rect y="0" opacity="0" fill="#FFFFFF" width="20" height="20" />';
                         loginAlertDialog += '<polygon points="17.6,3.4 16.6,2.4 10,9 3.4,2.4 2.4,3.4 9,10 2.4,16.6 3.4,17.6 10,11 16.6,17.6 17.6,16.6 11,10  " />';
                    loginAlertDialog += '</g>';
                    loginAlertDialog += '<g id="square_guide"></g>';
                    loginAlertDialog += '<g id="icons"></g>';
                    loginAlertDialog += '<g id="Layer_1"></g>';
                    loginAlertDialog += '<g id="Layer_10"></g>';
                loginAlertDialog += '</svg>';
            loginAlertDialog += '</div>';
        loginAlertDialog += '</div>';

        loginAlertDialog += '<div id="loginAlertTxt" class="dltConfirmationTxt" tabindex="1" aria-describedby="loginAlertTxt" onkeydown="loginAlertTxt(event); sfiftKeyPressed(event);" onkeyup="sfiftKeyNotPressed(event);"></div>';
        loginAlertDialog += '<div id="loginAlertOKBtn" data-role="buttonComp" class="dltConfirmationSuccess deletePrimaryButton" role="button" tabindex="3" aria-describedby="loginAlertOKBtn" onkeydown="loginAlertOKBtn(event); closePanel(event); sfiftKeyPressed(event);" onkeyup="sfiftKeyNotPressed(event);" ></div>';
    loginAlertDialog += '</div>';

    return loginAlertDialog;
}

function setAriaAndFocus() {
    var closeButtonText = {
        "en" : "close",
        "es" : "cerca"
    };  

    $("div#loginAlertTxt").focus();    
    $("div#confirmPanelClsBtn.bookmarkPanelTopBarCloseBtn").attr("aria-label", closeButtonText[EPubConfig.LocalizationLanguage]);
}

function loginAlertTxt(evt) {
    /* Tabindex = 1 */
    if(evt.keyCode==9) {
        if(!shiftKeyPressed) {
            evt.preventDefault();
            $("[tabindex=2]").focus();
        } else {
            evt.preventDefault();
            $("[tabindex=3]").focus();
        }        
    } 
}

function confirmPanelClsBtn(evt) {
    /* Tabindex = 2 */
    if(evt.keyCode==9) {
        if(!shiftKeyPressed) {
            evt.preventDefault();
            evt.stopPropagation();
            $("[tabindex=3]").focus();
        } else {
            evt.preventDefault();
            $("[tabindex=1]").focus();
        }        
    } 
}

function loginAlertOKBtn(evt) {
    /* Tabindex = 3 */
    if(evt.keyCode==9) {
        if(!shiftKeyPressed) {
            evt.preventDefault();
            evt.stopPropagation();
            $("[tabindex=1]").focus();
        } else {
            evt.preventDefault();
            $("[tabindex=2]").focus();
        }
    }   
}

function sfiftKeyPressed(evt) {
    if(evt.keyCode==16) {
        shiftKeyPressed = true;
    }
}

function sfiftKeyNotPressed(evt) {
    shiftKeyPressed = false;
}

function closePanel(evt) {
    if(evt.keyCode==13) {
        $(evt.target).click();
    }
}

/* End : Custom functions to read the login error dialog */

function storeUserDetails()
{
	var Authn = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL215Lmhydy5jb20iLCJhdWQiOiJodHRwOi8vd3d3LmhtaGNvLmNvbSIsImlhdCI6MTQwMjI5MDk1MSwic3ViIjoiY25cdTAwM2RKV09MVFoyLHVpZFx1MDAzZEpXT0xUWjIsdW5pcXVlSWRlbnRpZmllclx1MDAzZDMyNkE3NUE2MjM2NzQxNDk2NzlGRDZCNDlDMjU2NzZFLG9cdTAwM2QwMDIwNTE2OSxkY1x1MDAzZDAwMjA1MTU3LHN0XHUwMDNkR0EsY1x1MDAzZE4vQSIsImh0dHA6Ly93d3cuaW1zZ2xvYmFsLm9yZy9pbXNwdXJsL2xpcy92MS92b2NhYi9wZXJzb24iOlsiSW5zdHJ1Y3RvciJdLCJQbGF0Zm9ybUlkIjoiSE1PRiIsImV4cCI6MTQwMjI5NDU1MX0.YWurpOwln7dX1WYnF27JiNhrd_cE3eGtrmbbpX5sjjQ";
	var userInfo = decodeBase64(Authn);//$.cookie('Authn')
	var objReg = /uniqueIdentifier[\s\S]*?(,)/gi;
	var arrUDet = userInfo.match(objReg);
	//console.log("arrUDet", arrUDet);
	objReg = /,/gi;
	var uid = arrUDet[0].replace(objReg, "").split("\\u003d")[1];	
	GlobalModel.uid = uid;
	initAppFlow();
}

function getInternetExplorerVersion() {

	var rv = -1;
	if (navigator.appName == 'Microsoft Internet Explorer') {

		var ua = navigator.userAgent;

		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");

		if (re.exec(ua) != null)

			rv = parseFloat(RegExp.$1);
	}

	return rv;

}