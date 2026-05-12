/*Created by some freelancer. Edited by:
  1. Arindam Sarkar
  2. Arjun Suresh
  Contact for clarification. 
  You know where to find us! */
/*

   Question Statuses:
0: Unvisited
1: Visited
2: Answered
3: Marked for review
4: Answered-Marked review
*/

//Base URL for convience
//var sBaseURL = "/";	
var sBaseURL = "/";
/*for localhost*/
if(window.location.hostname=="127.0.0.1")
	sBaseURL+="acegate/quiz/";

//console.log(sBaseURL);

//Simple time retrieval function
Date.now = Date.now || function () { return +new Date; };

//Simple time comparison function (to the minute)
Date.minsBetween = function (date1, date2) {
	//Get 1 min in milliseconds
	var one_min = 1000 * 60;

	// Convert both dates to milliseconds
	var date1_ms = date1.getTime();
	var date2_ms = date2.getTime();

	// Calculate the difference in milliseconds
	var difference_ms = date2_ms - date1_ms;

	// Convert back to min and return
	return Math.round(difference_ms / one_min);
}

//Improved rounding technique
var round = Math.round;
Math.round = function (value, decimals) {
	decimals = decimals || 0;
	return Number(round(value + 'e' + decimals) + 'e-' + decimals);
}

//URL parameter retrieval function (.com/index.html/?x=1&y=2)
function getURLParameter(param, url) {
	var svalue = url.match(new RegExp("[\?\&]" + param + "=([^\&]*)(\&?)", "i"));
	return svalue ? svalue[1] : svalue;
}

//A simple dom class attribute selector
if (!document.getElementsByClassName) {
	document.getElementsByClassName = function (cn) {
		var allT = document.getElementsByTagName('*'), allCN = [], i = 0, a;
		while (a = allT[i++]) {
			a.className == cn ? allCN[allCN.length] = a : null;
		}
		return allCN
	}
}

//Multi-browser listener (IE8+ support)
function addListener(element, event, fn) {
	if (element.addEventListener) { // Use addEventListener if available
		element.removeEventListener(event, fn, false);
		element.addEventListener(event, fn, false);
	}
	else if (element.attachEvent) {// Otherwise use attachEvent, set this and event
		element.detachEvent(event, fn);
		element.attachEvent('on' + event, (function (el) {
			return function () {
				fn.call(el, window.event);
			};
		} (element)));

		// Break closure and primary circular reference to element
		element = null;
	}
}

function generate13DigitNumber() {
	// First digit non-zero for clean 13-digit number
	let first = Math.floor(Math.random() * 9) + 1;
	let rest = Math.floor(Math.random() * 1e12).toString().padStart(12, '0');
	return first + rest;
}

function getPersistentWatermark() {
	let val = sessionStorage.getItem("wm_id");
	if (!val) {
		val = generate13DigitNumber();
		sessionStorage.setItem("wm_id", val);
	}
	return val;
}

function ec_apply_question_watermark() {
	var questionContainer = document.getElementById('quesOuterDiv');
	if (!questionContainer) return;

	// Use persistent 13-digit number
	var watermarkText = getPersistentWatermark();

	var svgMarkup =
		"<svg xmlns='http://www.w3.org/2000/svg' width='240' height='170' viewBox='0 0 240 170'>" +
			"<g transform='translate(120 85) rotate(-30)'>" +
				"<text x='0' y='0' text-anchor='middle' fill='#808080' fill-opacity='0.1' font-size='26' " +
					"font-family='Arial, Helvetica, sans-serif' font-weight='200' stroke='#808080' stroke-opacity='0.1' stroke-width='0.2' letter-spacing='1'>" +
					watermarkText +
				"</text>" +
				"</g>" +
			"</svg>";
	questionContainer.style.setProperty(
		'--ques-contents-watermark',
		'url(\"data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarkup) + '\")'
	);
}

function ec_apply_candidate_image(imageSource) {
	var candidateImage = document.getElementById('candidateImg');
	if (!candidateImage) {
		return;
	}

	var fallbackSource = candidateImage.getAttribute('data-fallback-src') || candidateImage.getAttribute('src') || '';
	if (!candidateImage.getAttribute('data-fallback-src') && fallbackSource) {
		candidateImage.setAttribute('data-fallback-src', fallbackSource);
	}

	candidateImage.onerror = function () {
		var fallback = candidateImage.getAttribute('data-fallback-src');
		if (fallback && candidateImage.src !== fallback) {
			candidateImage.onerror = null;
			candidateImage.src = fallback;
		}
	};

	var normalizedSource = imageSource ? imageSource.split("$").join("=") : '';
	if (normalizedSource.length > 2) {
		candidateImage.src = normalizedSource;
		return;
	}

	if (fallbackSource) {
		candidateImage.src = fallbackSource;
	}
}

var ecNumericAnswerSelection = {
	start: 0,
	end: 0
};

function ec_get_numeric_answer_input() {
	return document.getElementById('numericAnswerContent');
}

function ec_store_numeric_answer_selection(start, end) {
	ecNumericAnswerSelection.start = start;
	ecNumericAnswerSelection.end = end;
}

function ec_sync_numeric_answer_selection(input) {
	var currentInput = input || ec_get_numeric_answer_input();
	if (!currentInput) {
		return;
	}

	var valueLength = (currentInput.value || '').length;
	var start = typeof currentInput.selectionStart === 'number' ? currentInput.selectionStart : valueLength;
	var end = typeof currentInput.selectionEnd === 'number' ? currentInput.selectionEnd : start;

	ec_store_numeric_answer_selection(start, end);
}

function ec_set_numeric_answer_value(value, caretPosition) {
	var input = ec_get_numeric_answer_input();
	var nextValue = value == null ? '' : String(value);

	if (!input) {
		ec_store_numeric_answer_selection(nextValue.length, nextValue.length);
		return;
	}

	input.value = nextValue;

	var nextPosition = typeof caretPosition === 'number' ? caretPosition : nextValue.length;
	nextPosition = Math.max(0, Math.min(nextPosition, nextValue.length));
	ec_store_numeric_answer_selection(nextPosition, nextPosition);

	if (document.activeElement === input && input.setSelectionRange) {
		input.setSelectionRange(nextPosition, nextPosition);
	}
}

function ec_focus_numeric_answer_input(caretPosition) {
	var input = ec_get_numeric_answer_input();
	if (!input) {
		return;
	}

	var valueLength = (input.value || '').length;
	var nextPosition = typeof caretPosition === 'number' ? caretPosition : valueLength;
	nextPosition = Math.max(0, Math.min(nextPosition, valueLength));

	input.focus();

	if (input.setSelectionRange) {
		input.setSelectionRange(nextPosition, nextPosition);
	}

	ec_store_numeric_answer_selection(nextPosition, nextPosition);
}

function ec_get_numeric_answer_selection(input) {
	var currentInput = input || ec_get_numeric_answer_input();
	var valueLength = currentInput ? (currentInput.value || '').length : 0;
	var start = currentInput && typeof currentInput.selectionStart === 'number' ? currentInput.selectionStart : ecNumericAnswerSelection.start;
	var end = currentInput && typeof currentInput.selectionEnd === 'number' ? currentInput.selectionEnd : ecNumericAnswerSelection.end;

	if (typeof start !== 'number') {
		start = valueLength;
	}

	if (typeof end !== 'number') {
		end = start;
	}

	start = Math.max(0, Math.min(start, valueLength));
	end = Math.max(start, Math.min(end, valueLength));

	return {
		start: start,
		end: end
	};
}

//AJAX HTTP request function
PHPRequest = function (fileName, sendData, POST, Image) {
	POST = typeof POST !== 'undefined' ? POST : true;
	//POST = typeof POST !== 'undefined' ? POST : false;
	Image = typeof Image !== 'undefined' ? Image : false;

	var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'); // IE8+
	if (POST) { //POST or GET
		xmlhttp.open("POST", fileName, true);
		if (Image) {
			var formData;
			formData = new FormData();
			formData.append('file', sendData);
			xmlhttp.send(formData);
		}
		else {
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
			xmlhttp.send(sendData);
		}
	}
	else {
		xmlhttp.open("GET", fileName + "?" + sendData, true);
		xmlhttp.send(null);
	}

	return xmlhttp;
};

//Initialise Website Application On Page Load
function ec_quiz_init()
{
	WebApp.Initialize();
}

window.onload = function () { 
	ec_quiz_init();
};

var sec = -1;
function mytime(val) { return val > 9 ? val : "0" + val; }
setInterval(function () {
    $("#seconds").html(mytime(++sec % 60));
    $("#minutes").html(mytime(parseInt(sec / 60, 10) % 60));
    $("#hours").html(mytime(parseInt(sec / 3600, 10)));
}, 1000);

//AJAX Enabled Website Application
WebApp = {
	//Options
	mSessionTimeout: 15, //In mins
	mExamDurationWarning: 5, //In mins
	//Internal
	mCurrentQ: 0,
	mInstuctionsPage: "next",
	mExamPageSection: 0,
	mClientTimeout: null,
	mSectionNames: [''],
	mSecQuesCount: [''],
	mSecCurrQuestion: [''],
	mQuestionStatus: [''],
	mQuestionAnswers: [''],
	mQuestionPostIds:[''],
	mQuestionTimers: [''],
	mExamBegin:0, /*Time when exam began : Date()*/
	mstartTimer:(+new Date),
	mPageActiveStart: 0,    /* timestamp when page became active (for elapsed timer) */
	mAutoSaveInterval: null, /* periodic auto-save timer */
	_offlineBanner: null,    /* reference to offline status bar element */
	mSecAnsweredCount: [],
	mSecMarkedCount: [],
	mSecMarkedAnsweredCount: [],
	mSecUnVisitedCount: [],
	mAllowResume: 0,        /* whether this exam allows resume (admin option) */
	mExamResumed: 0,        /* flag to track if this session was resumed */
	mExamStartTime: 0,      /* timestamp when exam was started (for ranking tolerance) */
	mSessionToken: null,    /* unique token for this exam session to prevent concurrent tabs */
	mSessionInvalidated: false, /* set true when server rejects our token */
	mSubmitting: false,     /* set true during submit to prevent stale saves */
	mExamInfo:{
		set:false,
		value:null
	},
	mExamId:-1,

	/* Generate unique session token */
	generateSessionToken: function() {
		return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	},

	/* Initialize session token for this exam.
	   Uses sessionStorage (per-tab) so a reload in the same tab keeps the
	   same token, but a new tab/window/browser always gets a fresh one.
	   The server enforces that only one token is active per user+exam. */
	initSessionToken: function(examId) {
		var key = 'ec_session_token_' + examId;
		var existing = sessionStorage.getItem(key);
		if (existing) {
			this.mSessionToken = existing;
		} else {
			this.mSessionToken = this.generateSessionToken();
			sessionStorage.setItem(key, this.mSessionToken);
		}
	},

	/* Force a new token (used when starting a fresh exam attempt) */
	resetSessionToken: function(examId) {
		var key = 'ec_session_token_' + examId;
		this.mSessionToken = this.generateSessionToken();
		sessionStorage.setItem(key, this.mSessionToken);
	},

	/* Tell the server THIS session owns the exam. Called once when the user
	   actively clicks Resume or Start Fresh. The server unconditionally sets
	   the token, so any other tab/browser's SaveProgress will be rejected.
	   Uses a direct synchronous POST (PHPRequest's 3rd arg is POST not async). */
	claimSession: function(examId) {
		if (!examId || !this.mSessionToken) return;
		var postData = "fn=ClaimSession"
			+ "&post_exam_id=" + encodeURIComponent(examId)
			+ "&post_session_token=" + encodeURIComponent(this.mSessionToken);
		/* Synchronous POST — must complete before auto-save starts */
		var xhr = new XMLHttpRequest();
		xhr.open("POST", sBaseURL + "resources/php/webapp.php", false); /* false = synchronous */
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
		xhr.send(postData);
		if (xhr.status == 200) {
			console.log("Session claimed for exam " + examId + " with token " + this.mSessionToken);
			try {
				var resp = JSON.parse(xhr.responseText);
				if (resp.error) {
					console.error("ClaimSession failed: " + resp.error);
				}
			} catch(e) {}
		} else {
			console.error("ClaimSession HTTP error: " + xhr.status);
		}
	},

	/* localStorage helpers (replacing cookies) */
	getVal: function(name) {
		return localStorage.getItem(name);
	},

	setVal: function(name, value) {
		localStorage.setItem(name, value);
	},

	removeVal: function(name) {
		localStorage.removeItem(name);
	},

	/* Keep old name as alias for backward compatibility within this file */
	get_cookie_value: function(name) {
		return localStorage.getItem(name);
	},

	Initialize: function () {
		$(document).ready(function () {
			//disable_scroll();
			$('select').css('cursor', 'url("/resources/images/BLACK.cur")');

			/* If there's a queued submit from a previous offline session, flush it now */
			if (navigator.onLine && WebApp.getVal('ec_queued_submit')) {
				WebApp._flushQueuedSubmit();
			}
		});

		//console.log('Initializing..');

		/* save exam_id which is present in GET param */
		/*check if required pattern is present*/
		var request_url=window.location.href;
		var exam_id_str="exam_id=" + WebApp.get_cookie_value("ec_exam_id");

		if(typeof(exam_id_str)!="undefined")
		{
			exam_id_str = exam_id_str.match(/exam_id=[0-9]+/)[0];

			var exam_id=-1;

			if(exam_id_str!=null && exam_id_str.length!=0)
			{
				exam_id=exam_id_str.split("=")[1];
			}
			//console.log(exam_id);
			if(exam_id!=-1)
			{
				//if another session exists, different from this one's exam_id, log out!
				/*try to get info from cookies*/
				var cookie_val=WebApp.get_cookie_value("ec_exam_id");
				if(cookie_val!=null && cookie_val!=exam_id)
				{
					/* Different exam — flush any queued submit for the old exam first */
					if (navigator.onLine && WebApp.getVal('ec_queued_submit')) {
						WebApp._flushQueuedSubmit();
					}
					WebApp.LogOut("Getting you a Brand New Session");
				}

				//Valid exam_id value. Save it!
				WebApp.mExamId=exam_id;
			}
		}

		else
		{
			/*try to get info from cookies*/
			var cookie_val=WebApp.get_cookie_value("ec_exam_id");
			if(cookie_val!=null)
			{
				exam_id=cookie_val;

				//Valid exam_id value. Save it!
				WebApp.mExamId=exam_id;
				//console.log(WebApp.mExamId);
			}
		}

		if(typeof(WebApp.mExamId)!="undefined" && WebApp.mExamId!=-1)
		{
			//Retrieve member information from localStorage
			var sessExpires = WebApp.getVal("ec_sessExpires") || '';
			var userRegId = WebApp.getVal("ec_userRegId") || '';
			var userImage = WebApp.getVal("ec_userImage") || '';
			var candidateName = WebApp.getVal("ec_candidateName") || '';
			var userBirthDate = WebApp.getVal("ec_userBirthDate") || '';
			var examName = WebApp.getVal("ec_examName") || '';
			var examDuration = WebApp.getVal("ec_examDuration") || '';

			if (document.getElementsByClassName("examName") && examName.length > 2) {
				for (var i = 0; i < document.getElementsByClassName("examName").length; ++i)
					document.getElementsByClassName("examName")[i].innerHTML = examName;
			}
			if (document.getElementsByClassName("examDuration") && examDuration.length > 2) {
				for (var i = 0; i < document.getElementsByClassName("examDuration").length; ++i)
					document.getElementsByClassName("examDuration")[i].innerHTML = examDuration;
			}
			if (document.getElementById("candDateOfBirth") && userBirthDate.length > 2) {
				document.getElementById("candDateOfBirth").innerHTML = userBirthDate;
			}
			if (document.getElementById("userRegId") && userRegId.length > 2) {
				document.getElementById("userRegId").innerHTML = userRegId;
			}
			if (document.getElementById("candidateImg")) {
				ec_apply_candidate_image(userImage);
			}
			if (document.getElementsByClassName("candidateName") && candidateName.length > 2) {
				for (var i = 0; i < document.getElementsByClassName("candidateName").length; ++i)
					document.getElementsByClassName("candidateName")[i].innerHTML = candidateName;
				ec_apply_question_watermark(candidateName);
			}
			if (examName < 2) {
				/*set exam name & blah blah meta stuff*/
				xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=RetrieveExamMetaInfo&exam_id="+WebApp.mExamId);
				xmlhttp.onreadystatechange = function () {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						var obj = eval("(" + xmlhttp.responseText + ")");
						if (document.getElementsByClassName("examName")) {
							for (var i = 0; i < document.getElementsByClassName("examName").length; ++i)
								document.getElementsByClassName("examName")[i].innerHTML = obj.name;
						}
						if (document.getElementsByClassName("examDuration")) {
							for (var i = 0; i < document.getElementsByClassName("examDuration").length; ++i)
								document.getElementsByClassName("examDuration")[i].innerHTML = obj.duration;
						}
						WebApp.setVal("ec_examName", obj.name);
						WebApp.setVal("ec_examDuration", obj.duration);
						WebApp.setVal("ec_total_marks", obj.total_marks);
						WebApp.setVal("ec_exam_id", WebApp.mExamId);
					}
				}
			}
		}

		else{
			console.log("Redirection!");
			window.location.href=sBaseURL;
		}
	},

	ExamDurationTimer: function () {
		clearTimeout(WebApp.mClientTimeout);
		var examDuration = WebApp.getVal("ec_examDuration") || '';
		if (examDuration === '') return;

		var examDuration_ms = examDuration.valueOf() * 60 * 1000;
		var msLeft = examDuration_ms - WebApp._getElapsedMs();

		var mExamDurationWarning_ms = WebApp.mExamDurationWarning * 60 * 1000;

		if (msLeft > 0) {
			var timeLeft = new Date(msLeft);
			var hoursLeft = timeLeft.getUTCHours();
			var minutesLeft = hoursLeft * 60 + timeLeft.getUTCMinutes();
			var secondsLeft = timeLeft.getUTCSeconds();

			if (msLeft <= mExamDurationWarning_ms)
				document.getElementById('timeInMins').setAttribute('style', 'color:#ff0000;');

			document.getElementById('timeInMins').innerHTML = minutesLeft + ":" + secondsLeft;
			WebApp.mClientTimeout = setTimeout(function () { WebApp.ExamDurationTimer(); }, 1000);
		}
		else { /*Exam timeout*/
			alert("Time out !!! Your Answers have been saved successfully, please wait for results...");
			console.log("Time out !!!");
			if (navigator.onLine) {
				WebApp.SubmitResults();
			} else {
				/* Offline: queue the submission for when connectivity returns */
				WebApp._queueSubmit();
			}
		}
	},

	/* Get total elapsed ms = stored elapsed + time since page became active */
	_getElapsedMs: function() {
		var stored = parseInt(WebApp.getVal('ec_exam_elapsed') || '0', 10);
		if (WebApp.mPageActiveStart > 0) {
			stored += (+new Date) - WebApp.mPageActiveStart;
		}
		return stored;
	},

	/* Flush current active time into ec_exam_elapsed and reset mPageActiveStart */
	_persistElapsed: function() {
		if (WebApp.mPageActiveStart > 0) {
			var stored = parseInt(WebApp.getVal('ec_exam_elapsed') || '0', 10);
			stored += (+new Date) - WebApp.mPageActiveStart;
			WebApp.setVal('ec_exam_elapsed', String(stored));
			WebApp.mPageActiveStart = (+new Date);
		}
	},

	DeleteAllCookies: function()
	{
		/*Delete All Cookies*/
		/*Code reference: http://stackoverflow.com/questions/10593013/delete-cookie-by-name */

		/* Remove all ec_ keys from localStorage, preserving ec_queued_submit */
		console.log('Clearing all ec_ localStorage entries');
		var keysToRemove = [];
		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key && key.indexOf('ec_') === 0 && key !== 'ec_queued_submit') {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
	},
	DeleteBackupCookies: function()
	{
		/* Remove backup_ keys from localStorage */
		console.log('Clearing backup localStorage entries');
		var keysToRemove = [];
		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key && key.indexOf('backup_') === 0) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
	},

	LogOut: function (msg) {
		var now = new Date();

		if(typeof msg =='undefined' || msg==null)
			msg="Logging Out";

		WebApp.DeleteAllCookies();

		/* document.cookie = 'examBegin=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'userRegId=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'candidateName=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'sessExpires=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'examName=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'examDuration=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'userBirthDate=0;expires=' + now.toGMTString() + ';path=/';
		   document.cookie = 'userImage=0;expires=' + now.toGMTString() + ';path=/'; */


		//document.getElementById("regnum").value = '11111';
		//document.getElementById("password").value = 'guest';
	//	document.getElementsByClassName("candidateName")[0].innerHTML = 'Guest';
	//	document.getElementById("candidateImg").src = './resources/images/avatars/NewCandidateImage.jpg';
		alert(msg);
	},

	LogIn: function () {

		//xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=Login&id=11111" + document.getElementById("regnum").value + "&pw=" + document.getElementById("password").value);
		xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=Login&id=11111&pw=guest");
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var obj = eval("(" + xmlhttp.responseText + ")");
				//console.log("here "+obj);
				if (obj.user == "valid") {
					var date = new Date();
					var expires = date.toGMTString();
					WebApp.setVal("ec_sessExpires", expires);
					WebApp.setVal("ec_userRegId", obj.regid);
					WebApp.setVal("ec_candidateName", obj.name);
					WebApp.setVal("ec_userBirthDate", obj.birthdate);
					WebApp.setVal("ec_userImage", obj.image);
					//document.getElementById("regnum").value = '';
					//document.getElementById("password").value = '';
					//document.getElementById("candidateImg").src = './resources/images/avatars/' + obj.image;
					/*document.getElementById("candidateImg").src = obj.image.split("$").join( "=");
					for (var i = 0; i < document.getElementsByClassName("candidateName").length; ++i)
						document.getElementsByClassName("candidateName")[i].innerHTML = obj.name;
					*/
					ec_apply_question_watermark(obj.name);
					WebApp.Initialize(); //Reinitialize
					WebApp.setVal("ec_exam_ready", "true");

					/* With localStorage, values are available immediately */
					function proceed_if_ready()
					{
						if(!WebApp.getVal("ec_exam_id"))
						{
							setTimeout(proceed_if_ready,1000);
						}
						else{
							WebApp.OpenInstructions();

				WebApp.setVal("ec_sessExpires", new Date().toGMTString());
				//Open exam page
				window.location.href = "quiz.php";
				return false;
						}
					}

					proceed_if_ready();
				}

				else {
					alert("Invalid user information. Please try again.");
				}
			}
		}
	},
	LogInReady: function () {

		xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=Login&id=" + document.getElementById("regnum").value + "&pw=" + document.getElementById("password").value);
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var obj = eval("(" + xmlhttp.responseText + ")");
				if (obj.user == "valid") {
					var date = new Date();
					var expires = date.toGMTString();
					WebApp.setVal("ec_sessExpires", expires);
					WebApp.setVal("ec_userRegId", obj.regid);
					WebApp.setVal("ec_candidateName", obj.name);
					WebApp.setVal("ec_userBirthDate", obj.birthdate);
					WebApp.setVal("ec_userImage", obj.image);
					document.getElementById("regnum").value = '';
					document.getElementById("password").value = '';
					//document.getElementById("candidateImg").src = './resources/images/avatars/' + obj.image;
					ec_apply_candidate_image(obj.image);
					for (var i = 0; i < document.getElementsByClassName("candidateName").length; ++i)
						document.getElementsByClassName("candidateName")[i].innerHTML = obj.name;
					ec_apply_question_watermark(obj.name);

					WebApp.Initialize(); //Reinitialize
					WebApp.setVal("ec_exam_ready", "true");

					/* With localStorage, values are available immediately */
					function proceed_if_ready()
					{
						if(!WebApp.getVal("ec_exam_id"))
						{
							setTimeout(proceed_if_ready,1000);
						}
						else{
							//	WebApp.OpenInstructions();
						}
					}

					proceed_if_ready();
				}

				else {
					alert("Invalid user information. Please try again.");
				}
			}
		}
	},

	OpenInstructions: function () {
		var params = [
			'height=' + screen.height,
			'width=' + screen.width,
			'fullscreen=yes'
		].join(',');
		/*
		*/
		/*removing pop up*/
		document.location.href = sBaseURL + 'instructions.php';
	},

	DisplayInstructionsPage: function () {
		/*setup meta*/
		var examDuration = WebApp.get_cookie_value("ec_examDuration");
		$('.examDuration').html(examDuration);
		var total_marks = WebApp.get_cookie_value("ec_total_marks");
		$('.total_marks').html(total_marks);

		$(".instFirstPage").hide();
		$(".instSecondPage").hide();
		$("#secondPagep2").hide();
		if (WebApp.mInstuctionsPage == "next") {
			$(".instSecondPage").show();
			$("#secondPagep2").show();
			$(".mainLeft").css('margin-bottom', '170px');
			WebApp.mInstuctionsPage = "previous";
			$("#instPaginationa").text("<< Previous");
		} else if (WebApp.mInstuctionsPage == "previous") {
			$(".instFirstPage").show();
			$(".mainLeft").css('margin-bottom', '70px');
			WebApp.mInstuctionsPage = "next";
			$("#instPaginationa").text("Next >>");
		}
	},

	DisplayExamLink: function () {
		if (document.getElementById("disclaimer").checked == true) {
			document.getElementById("readylink").removeAttribute("disabled", 0);
			$('#readylink').click(function () {
				//Reset session expiration timeout
				WebApp.setVal("ec_sessExpires", new Date().toGMTString());
				//Open exam page
				window.location.href = "quiz.php";
				return false;
			});
		} else { //Must accept terms and conditions first
			document.getElementById("readylink").disabled = "disabled";
			$('#readylink').unbind('click');
		}
	},

	setExamInfo: function(obj)
	{
		console.log('Set Exam..');
		//WebApp.DeleteBackupCookies();
		//Iterate through sections

		for (var s = 0, aq = 0; s < obj.section.length; ++s) 
		{
			//Set section questions page & navpanel names
			var hr = document.createElement("h2");
			hr.setAttribute('style', 'color: rgb(47, 114, 183);');
			hr.innerHTML = "Section : " + obj.section[s].name;
			document.getElementById('viewQPDiv').appendChild(hr);
			var newtbody = document.createElement('tbody');
			newtbody.appendChild(document.createElement('tr'));
			newtbody.setAttribute('id', 'quesNavPanel' + s);
			document.getElementById('question_area').appendChild(newtbody);
			var classStyle = '', tooltip = ''; var visited = 0, unvisited = obj.section[s].question.length;
			if (s == 0) {
				document.getElementById('viewSection').innerHTML = obj.section[s].name;
				classStyle = 'currentSectionSelected';
				tooltip = 'tooltipSelected';
				visited = 1;
				unvisited -= 1;
				WebApp.mSectionNames[0] = obj.section[s].name;
				WebApp.mSecQuesCount[0] = obj.section[s].question.length;
				WebApp.mSecUnVisitedCount[0] = obj.section[s].question.length-1;
				WebApp.mSecAnsweredCount[0] = 0;
				WebApp.mSecMarkedCount[0] = 0;
				WebApp.mSecMarkedAnsweredCount[0] = 0;
				WebApp.mSecCurrQuestion[0] = 1;
				MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
			} else {
				newtbody.setAttribute('style', 'display:none;');
				WebApp.mSectionNames.push(obj.section[s].name);
				WebApp.mSecQuesCount.push(obj.section[s].question.length);
				WebApp.mSecUnVisitedCount.push(obj.section[s].question.length);
				WebApp.mSecAnsweredCount.push(0);
				WebApp.mSecMarkedCount.push(0);
				WebApp.mSecMarkedAnsweredCount.push(0);
				WebApp.mSecCurrQuestion.push(1);
			}

			//Add section menu
			document.getElementById("sections").innerHTML += '<div class="allSections ' + classStyle + '" id="s' + (s + 1) + '" onmouseover="WebApp.DisplayExamSectionMenu(' + s + ',true)" onmouseout="WebApp.DisplayExamSectionMenu(' + s + ',false)" onclick="WebApp.DisplayExamSectionPage(' + s + ')"> <div class="tooltip ' + tooltip + '" id="st' + s + '"> <div style="text-overflow:ellipsis;width:90%;overflow:hidden;white-space:nowrap;padding-left:10px;cursor:pointer">' + obj.section[s].name + '</div><span class="classic" id="section' + s + '" style="display:none; z-index:1001;"> <center style="color: #000000;"> <table width="95%" style="font-size:14px;margin-top:10px" class="question_area" cellspacing="0"> <tbody> <tr> <td colspan="2"> <b>' + obj.section[s].name + '</b> </td></tr><tr> <td colspan="2"><hr/></td></tr></tbody> </table> <table width="95%" style="margin-top:0%" class="question_area" cellspacing="5"> <tbody> <tr><td style="text-align:left;padding-top:10px" width="80%"><span class="gate-info" id="exam-answered"> </span>Answered: </td><td valign="top"><span id="tooltip_answered' + s + '" class="answered button_item">0</span></td></tr><tr><td style="text-align:left;padding-top:10px" width="80%"><span class="gate-info" id="exam-not-answered"> </span>Not Answered: </td><td valign="top"><span id="tooltip_not_answered' + s + '" class="not_answered button_item">' + visited + '</span></td></tr><tr><td style="text-align:left;padding-top:10px" width="80%"><span class="gate-info" id="exam-marked"></span>Marked for Review: </td><td valign="top"><span id="tooltip_review' + s + '" class="review button_item">0</span></td></tr><tr><td style="text-align:left;padding-top:10px" width="80%"><span class="gate-info" id="exam-not-visited"></span>Not Visited: </td><td valign="top"><span id="tooltip_not_visited' + s + '" class="not_visited button_item">' + unvisited + '</span></td></tr></tbody> </table> </center> </span> </div> </div>';

			//Iterate through section questions
			for (var q = 0, c = 0, g = 0; q < obj.section[s].question.length; ++q, ++c, ++aq)
			{
				//Set section question & navigation panel content
				var qt = 'not_visited';
				var title = "Not Visited";
				var contents = obj.section[s].question[q].contents;
				var qs_text = obj.section[s].question[q].text;
				WebApp.startTimer = (+new Date);
				/*Assuming content field is empty*/
				contents=qs_text;

				/*Initialize Answers & Statuses*/

				if (s == 0 && q == 0) {
					qt = 'not_answered';
					title = "Not Answered";
					WebApp.mQuestionAnswers[0] = null;
					WebApp.mQuestionStatus[0] = 1;
					WebApp.mQuestionPostIds[0]= obj.section[0].question[0].post_id;
					WebApp.mQuestionTimers[0] = 0;

					document.getElementById('quesContents').innerHTML = contents;
					MathJax.Hub.Queue(["Typeset",MathJax.Hub, "quesContents"]);
					document.getElementById('quesNumber').innerHTML = 'Question Number. 1';
					document.getElementById('quesAward').innerHTML = obj.section[s].question[q].award;
					document.getElementById('quesPenalty').innerHTML = parseFloat(obj.section[s].question[q].penalty).toFixed(2);
					document.getElementById('quesType').innerHTML = obj.section[s].question[q].type;
					if (obj.section[s].question[q].type == "Numerical") {
						$('#choiceAnswer').hide();
						$('#multipleAnswer').hide();
						$('#numericAnswer').show();
					}
					else if (obj.section[s].question[q].type == "Multiple Select") {
						$('#choiceAnswer').hide();
						$('#numericAnswer').hide();
						$('#multipleAnswer').show();
						if(WebApp.mExamInfo.val.num_options < 5)
						{
							$('#select5a').hide();
							$('#select5b').hide();
						}
					}
					else {
						$('#choiceAnswer').show();
						$('#multipleAnswer').hide();
						$('#numericAnswer').hide();
						//console.log("Object ");
						if(WebApp.mExamInfo.val.num_options < 5)
						{
							//console.log("Object hide");
							$('#choice5a').hide();
							$('#choice5b').hide();
						}
					}
					MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
				} else {
					WebApp.mQuestionAnswers.push(null);
					WebApp.mQuestionStatus.push(0);
					WebApp.mQuestionPostIds.push(obj.section[s].question[q].post_id);
					WebApp.mQuestionTimers.push(0);
				}

				var currElement = document.getElementById('quesNavPanel' + s);
				if (c > 3) { document.getElementById('quesNavPanel' + s).appendChild(document.createElement('tr')); ++g; c = 0; }
				document.getElementById('quesNavPanel' + s).childNodes[g].innerHTML += '<td id="qtd' + aq + '"><span title="' + title +'" class="' + qt + ' button_item" id="nvi' + (aq + 1) + '" onclick="WebApp.SelectNavItem(' + (q + 1) + ');"> ' + (q + 1) + '</span></td>';

				//Set section questions page content
				var p = document.createElement("p");
				p.setAttribute('style', 'padding-left:5px');
				p.innerHTML = '<table><tbody><tr><td>Q. ' + (q + 1) + ') </td><td>';

				/*
					if (obj.section[s].question[q].image.length > 0) //Include question image
					p.innerHTML += '<p>' + obj.section[s].question[q].contents + '</p><img src="./resources/images/questions/' + obj.section[s].question[q].image + '" style="left: -5px; position: relative; display: block;" />';
					*/

				/*This sets Question Paper section*/
				p.innerHTML += '<p>' + obj.section[s].question[q].text + '</p>';
				p.innerHTML += '</td></tr><tr><td width="50px"></td><td><i style="font-size:1em;">Question Type : <b>' + obj.section[s].question[q].type + '</b>;Marks for correct answer <font color="green"><b>' + obj.section[s].question[q].award + '</b></font>; Negative Marks <font color="red"><b> ' + obj.section[s].question[q].penalty + '</b></font></i></td><td></td></tr></tbody></table><hr style="border-top-style: inset; border-top-width: 1px; color: rgb(204, 204, 204);">';
				document.getElementById('viewQPDiv').appendChild(p);
			}
		}
		$('#exam-not-visited-count').text(WebApp.mSecUnVisitedCount[WebApp.mExamPageSection]);
		$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-answered-count').text(WebApp.mSecAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-not-answered-count').text(WebApp.mSecQuesCount[WebApp.mExamPageSection] - WebApp.mSecAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecUnVisitedCount[WebApp.mExamPageSection] - WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
		$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
		var currTime = (+new Date);
		WebApp.mCurrentQ = 0;
		WebApp.mstartTimer = currTime;
	},

	BeginExam: function () {
		WebApp.mSecCurrQuestion[0] = 1;
		console.log("Begin Exam");

		/* Resume/new-session logic — must run AFTER setExamInfo so arrays are populated */
		function _onExamReady() {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

			var exam_id = WebApp.getVal("ec_exam_id");

			var examBegin = WebApp.getVal("ec_examBegin") || '';

			if (examBegin.length > 2 && WebApp.mAllowResume) {
				/* Previous session exists and resume is allowed — ask user whether to resume or start fresh */
				var savedProgress = null;
				if (exam_id) {
					var raw = WebApp.getVal("ec_exam_progress_" + exam_id);
					if (raw) { try { savedProgress = JSON.parse(raw); } catch(e) {} }
				}

				/* Compute remaining time from elapsed (not wall-clock) */
				var examDuration = WebApp.getVal("ec_examDuration") || '';
				var storedElapsed = parseInt(WebApp.getVal('ec_exam_elapsed') || '0', 10);
				var msLeft = examDuration * 60 * 1000 - storedElapsed;

				if (msLeft <= 0) {
					/* Timer already expired — just start fresh */
					_startFresh();
					return;
				}

				var minsLeft = Math.floor(msLeft / 60000);
				var secsLeft = Math.floor((msLeft % 60000) / 1000);
				var answeredCount = 0;
				var totalCount = 0;
				if (savedProgress && savedProgress.answers) {
					totalCount = savedProgress.answers.length;
					for (var i = 0; i < savedProgress.answers.length; i++) {
						if (savedProgress.answers[i] !== null) answeredCount++;
					}
				}
				var savedAt = savedProgress && savedProgress.savedAt
					? new Date(savedProgress.savedAt).toLocaleString()
					: 'Unknown';

				WebApp._showResumeDialog({
					minsLeft: minsLeft,
					secsLeft: secsLeft,
					answered: answeredCount,
					total: totalCount,
					savedAt: savedAt
				}, function onResume() {
					WebApp.mExamResumed = 1; /* Mark this exam as resumed */
					WebApp.mExamBegin = new Date(examBegin);
					WebApp.mPageActiveStart = (+new Date);
					/* Claim session on server BEFORE auto-save starts */
					WebApp.initSessionToken(exam_id);
					WebApp.claimSession(exam_id);
					/* Restore exam start time from previous session */
					var storedStartTime = WebApp.getVal("ec_exam_start_time");
					if (storedStartTime) {
						WebApp.mExamStartTime = parseInt(storedStartTime, 10);
					}
					console.log("Resumed Session — elapsed so far: " + storedElapsed + "ms");
					WebApp.RestoreProgress();
					WebApp.ExamDurationTimer();
					WebApp.StartAutoSave();
				}, function onFresh() {
					_startFresh();
				});

				return;
			}

			_startFresh();
		}

		function _startFresh() {
			/* Clear any old progress data for this exam */
			var oldExamId = WebApp.getVal("ec_exam_id");
			if (oldExamId) {
				WebApp.removeVal("ec_exam_progress_" + oldExamId);
			}
			/* Force a new session token and claim it on the server */
			var freshExamId = WebApp.getVal("ec_exam_id");
			if (freshExamId) {
				WebApp.resetSessionToken(freshExamId);
				WebApp.claimSession(freshExamId);
			}
			/* Reset elapsed timer */
			WebApp.setVal('ec_exam_elapsed', '0');
			WebApp.mPageActiveStart = (+new Date);
			/* Reset resumed flag and set new exam start time */
			WebApp.mExamResumed = 0;
			WebApp.mExamStartTime = (+new Date);
			WebApp.setVal("ec_exam_start_time", WebApp.mExamStartTime.toString());
			/* Reset arrays to initial state (setExamInfo already ran) */
			for (var i = 0; i < WebApp.mQuestionAnswers.length; i++) {
				WebApp.mQuestionAnswers[i] = null;
				WebApp.mQuestionStatus[i] = (i === 0) ? 1 : 0;
				WebApp.mQuestionTimers[i] = 0;
			}
			/* Reset section counters */
			for (var s = 0; s < WebApp.mSecQuesCount.length; s++) {
				WebApp.mSecAnsweredCount[s] = 0;
				WebApp.mSecMarkedCount[s] = 0;
				WebApp.mSecMarkedAnsweredCount[s] = 0;
				WebApp.mSecUnVisitedCount[s] = (s === 0) ? WebApp.mSecQuesCount[s] - 1 : WebApp.mSecQuesCount[s];
				WebApp.mSecCurrQuestion[s] = 1;
			}
			/* Reset nav buttons */
			for (var i = 0; i < WebApp.mQuestionAnswers.length; i++) {
				var el = document.getElementById('nvi' + (i + 1));
				if (!el) continue;
				if (i === 0) {
					el.setAttribute('class', 'not_answered button_item');
					el.setAttribute('title', 'Not Answered');
				} else {
					el.setAttribute('class', 'not_visited button_item');
					el.setAttribute('title', 'Not Visited');
				}
			}
			/* Reset displayed counters */
			$('#exam-not-visited-count').text(WebApp.mSecUnVisitedCount[0]);
			$('#exam-answered-count').text(0);
			$('#exam-not-answered-count').text(0);
			$('#exam-marked-count').text(0);
			$('#exam-marked-answered-count').text(0);

			/* New session timer */
			var date = new Date();
			WebApp.mExamBegin = date;
			WebApp.setVal("ec_examBegin", date.toGMTString());
			console.log("New Session: " + date);
			WebApp.mCurrentQ = 0;
			WebApp.mExamPageSection = 0;
			/* Re-display Q1 */
			if (WebApp.mExamInfo.set) {
				WebApp.displayExamSection(WebApp.mExamInfo.val, 0, 0);
			}
			WebApp.ExamDurationTimer();
			WebApp.StartAutoSave();
		}

		/*get json for setting up quiz page*/

		/*check if it exists*/
		if(WebApp.mExamInfo.set)
		{
			/*set obj*/
			var obj=WebApp.mExamInfo.val;
			//console.log(obj);
			WebApp.setExamInfo(obj);
			_onExamReady();
		}

		else
		{
			/* If resuming with saved progress, pass the saved postIds order
			   so the server returns questions in the same shuffled order */
			var postData = "fn=RetrieveExamInfo&exam_id=" + WebApp.mExamId;
			var _examBegin = WebApp.getVal("ec_examBegin") || '';
			if (_examBegin.length > 2) {
				var _pid = WebApp.getVal("ec_exam_progress_" + WebApp.mExamId);
				if (_pid) {
					try {
						var _prog = JSON.parse(_pid);
						if (_prog.postIds && _prog.postIds.length) {
							postData += "&post_order=" + encodeURIComponent(JSON.stringify(_prog.postIds));
						}
					} catch(e) {}
				}
			}
			xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", postData);
			xmlhttp.onreadystatechange = function ()
			{
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
				{
					var obj = eval("(" + xmlhttp.responseText + ")");

					/* Store allow_resume flag */
					WebApp.mAllowResume = obj.allow_resume || 0;

					var num_options = obj.num_options;
					if(num_options == 4)
					{
						//$("#choice5").style="display:none";//hide();
						//$("#select5").style="display:none";//hide();
						//console.log("4 option = ");
					}
					else
					{
						//console.log("5 = ");
					}
					/*save the obj*/
					WebApp.mExamInfo.val=obj;
					WebApp.mExamInfo.set=true;
					/*Obj stuff done*/

					WebApp.setExamInfo(obj);
					_onExamReady();
				}
			}

		}
	},

	DisplayExamPage: function (page) {
		$("#instructionsDiv").hide();
		$("#profileDiv").hide();
		$("#QPDiv").hide();
		$("#questionCont").hide();
		$("#sectionSummaryDiv").hide();
		switch (page) {
			case "active":
				$("#questionCont").show();
				MathJax.Hub.Queue(["Typeset",MathJax.Hub, "questionCont"]);
				break;
			case "instructions":
				$("#instructionsDiv").show();
				break;
			case "profile":
				$("#profileDiv").show();
				break;
			case "questions":
				$("#QPDiv").show();
				$('#QPDiv').style = "display: inline-flex;";
				//MathJax.Hub.Queue(["Typeset",MathJax.Hub, "QPDiv"]);
				MathJax.Hub.Queue(["Typeset",MathJax.Hub, "QPDiv"]);
				break;
			case "summary":
				WebApp.DisplayExamSummary();
				$("#sectionSummaryDiv").show();
				break;
			default:
				//do nothing...
				break;
		}
		},

		ToggleExamPage: function (page) {
			// Toggle behavior for toolbar buttons: clicking the same page twice returns to "active".
			if (page === "instructions") {
				if ($("#instructionsDiv").is(":visible")) {
					WebApp.DisplayExamPage("active");
					return;
				}
				WebApp.DisplayExamPage("instructions");
				return;
			}

			if (page === "questions") {
				if ($("#QPDiv").is(":visible")) {
					WebApp.DisplayExamPage("active");
					return;
				}
				WebApp.DisplayExamPage("questions");
				return;
			}

			WebApp.DisplayExamPage(page);
		},

	DisplayExamSummary: function () {
		var results = '<tr><th>Section Name</th><th>No. of Questions</th><th>Answered</th><th>Not Answered</th><th>Marked for Review</th><th>Answered and Marked for Review</th><th>Not Visited</th></tr>';
		var tanswered = 0, tnot_answered = 0, treview = 0, treview_answered = 0, tnot_visited = 0;
		for (var s = 0, q = 0; s < WebApp.mSecQuesCount.length; ++s) {

			var quesIdx = 0; for (var i = 0; i < s; ++i) { for (var j = 0; j < WebApp.mSecQuesCount[i]; ++j) quesIdx++; } //Current question index within arrays
			//is this a dumb code?

			var answered = 0, not_answered = 0, review = 0, review_answered = 0, not_visited = 0;
			for (var j = 0; j < WebApp.mSecQuesCount[s]; ++j) {
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 0) {
					not_visited++; tnot_visited++;
				}
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 1) {
					not_answered++; tnot_answered++;
				}
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 2) {
					answered++; tanswered++;
				}
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 3) {
					review++; treview++;
				}
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 4) {
					review_answered++; treview_answered++;
				}
			}
			results +=
				'<tr><td width="13%">'
				+ WebApp.mSectionNames[s] + '</td><td width="13%">'
				+ WebApp.mSecQuesCount[s] + '</td><td width="13%">'
				+ answered + '</td><td width="13%">'
				+ not_answered + '</td><td width="13%">'
				+ review + '</td><td width="13%">'
				+ review_answered + '</td><td width="13%">'
				+ not_visited + '</td></tr>';

		}
		results += '<tr><td><b>Total</b></td><td><b>' + WebApp.mQuestionStatus.length + '</b></td><td><b>' + tanswered + '</b></td><td><b>' + tnot_answered + '</b></td><td><b>' + treview +  '</b></td><td><b>' + treview_answered +  '</b></td><td><b>' + tnot_visited + '</b></td></tr>';
		document.getElementById('group_summary').innerHTML = results;
	},

	displayExamSection: function(obj,s,q)
	{
		var quesIdx = 0; 
		for (var i = 0; i < WebApp.mExamPageSection; ++i) 
		{
			for (var j = 0; j < WebApp.mSecQuesCount[i]; ++j) quesIdx++; 
		} /*Current question index within arrays */

		if (WebApp.mQuestionStatus[(q + quesIdx)] == 0){ //Unvisited
			WebApp.mQuestionStatus[(q + quesIdx)] = 1; //set to visited (not answered)
			WebApp.mSecUnVisitedCount[WebApp.mExamPageSection]--;
		}

		var qsStatus=WebApp.mQuestionStatus[(q + quesIdx)];
	/*	console.log(qsStatus);*/

		/*Nav-btn-display*/
		//console.log('Section: '+s+" Qs: "+q+"Status: "+qsStatus + " qsIndex:" + quesIdx);

		if (WebApp.mQuestionStatus[(q + quesIdx)] == 1) {
			document.getElementById('nvi' + (1+q + quesIdx)).setAttribute('class', 'not_answered button_item');		
			document.getElementById('nvi' + (1+q + quesIdx)).setAttribute('title', 'Not Answered');		
		}

		/*Nav-btn-display END*/

		//Select new section menu panel
		document.getElementById('s' + (s + 1)).setAttribute('class', 'allSections currentSectionSelected');
		document.getElementById('st' + s).setAttribute('class', 'tooltip tooltipSelected');
		document.getElementById('quesNavPanel' + s).setAttribute('style', 'display:inherit;');

		/*set question content*/
		var text_contents = obj.section[s].question[q].text;
		//console.log(text_contents);

		/*Question setup*/
		document.getElementById('quesContents').innerHTML = text_contents;
		/* Reset scroll to top so new question is visible from the beginning */
		var quesOuter = document.getElementById('quesOuterDiv');
		if (quesOuter) { quesOuter.scrollTop = 0; }
		/*CALL MathJAX*/

		MathJax.Hub.Queue(["Typeset",MathJax.Hub, "quesContents"]);
		/*END*/
		document.getElementById('quesNumber').innerHTML = 'Question Number. ' + (q + 1);
		document.getElementById('quesAward').innerHTML = obj.section[s].question[q].award;
		document.getElementById('quesPenalty').innerHTML = parseFloat(obj.section[s].question[q].penalty).toFixed(2);
		// document.getElementById('quesPenalty').innerHTML = obj.section[s].question[q].penalty;
		document.getElementById('quesType').innerHTML = obj.section[s].question[q].type;


		/* Flush leftovers from other section */
		$('input[name="answers"]:checked').removeAttr("checked");
		ec_set_numeric_answer_value('');
		/* END */

		/*Show appropriate answering apparatus :p, and fill them if possible */
		if (obj.section[s].question[q].type == "Numerical") {
			$('#choiceAnswer').hide();
			$('#multipleAnswer').hide();
			$('#numericAnswer').show();

			if(qsStatus==2 || qsStatus==4) /*Answered or Ans-Review-Mark*/
			{
				/*Get Answer*/
				var ans=WebApp.mQuestionAnswers[(q + quesIdx)];

				/*Set Answer*/
				ec_set_numeric_answer_value(ans);

			}
		}
		else if (obj.section[s].question[q].type == "Multiple Select") {
			$('#choiceAnswer').hide();
			$('#numericAnswer').hide();
			$('#multipleAnswer').show();
			if(WebApp.mExamInfo.val.num_options < 5)
			{
				$('#select5a').hide();
				$('#select5b').hide();
			}

			if(qsStatus==2 || qsStatus==4) /*Answered or Ans-Review-Mark*/
			{
				/*Get Answer*/
				var checked_options=(WebApp.mQuestionAnswers[(q + quesIdx)]);
				var options = checked_options.split(",");
				/*
					       console.log('Section: '+s+" Qs: "+q+"Status: "+qsStatus+"Option Checked:"+checked_option);
					       */

				/*Set Option. Find appropriate child*/
				for(var i = 0; i < options.length; i++)
				{
					$('#multipleAnswer').find('.multipleAnswer')[options[i]-1].checked=true
				}
			}
		}
		else {
			$('#choiceAnswer').show();
			$('#multipleAnswer').hide();
			$('#numericAnswer').hide();
			if(WebApp.mExamInfo.val.num_options < 5)
			{
				$('#choice5a').hide();
				$('#choice5b').hide();
			}

			if(qsStatus==2 || qsStatus==4) /*Answered or Ans-Review-Mark*/
			{
				/*Get Answer*/
				var checked_option=(WebApp.mQuestionAnswers[(q + quesIdx)]);
				/*
					       console.log('Section: '+s+" Qs: "+q+"Status: "+qsStatus+"Option Checked:"+checked_option);
					       */

				/*Set Option. Find appropriate child*/
				$('#choiceAnswer').find('.answer')[checked_option-1].checked=true
			}
		}

		//Update & Display Section Questions Navigation Panel
		document.getElementById('viewSection').innerHTML = obj.section[s].name;
		for (var i = 0; i < WebApp.mQuestionStatus.length; ++i) {

		}
		$('#exam-not-visited-count').text(WebApp.mSecUnVisitedCount[WebApp.mExamPageSection]);
		$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-answered-count').text(WebApp.mSecAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-not-answered-count').text(WebApp.mSecQuesCount[WebApp.mExamPageSection] - WebApp.mSecAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecUnVisitedCount[WebApp.mExamPageSection] - WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
		$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
        window.setTimeout(function () {
            $(document).trigger('question-content-updated');
        }, 0);
	},

	DisplayExamSectionPage: function (s,q) {

		// Capture time for the current question before switching sections
		var currTime = (+new Date);
		var timeTaken = currTime - WebApp.mstartTimer;
		WebApp.mstartTimer = currTime;
		WebApp.mQuestionTimers[WebApp.mCurrentQ] += timeTaken;

		//Deselect section menu panel
		document.getElementById('s' + (WebApp.mExamPageSection + 1)).setAttribute('class', 'allSections');
		document.getElementById('st' + WebApp.mExamPageSection).setAttribute('class', 'tooltip');
		document.getElementById('quesNavPanel' + WebApp.mExamPageSection).setAttribute('style', 'display:none;');
		WebApp.mExamPageSection = s;
		q = typeof q !== 'undefined' ? q : (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] - 1);
		WebApp.DisplayExamPage('active');

		//check if examInfo object exists*/
		if(WebApp.mExamInfo.set)
		{
			/*set obj from past..*/
			var obj=WebApp.mExamInfo.val;
			//console.log(obj);
			WebApp.displayExamSection(obj,s,q);
		}

		else
		{
			//Request Exam.xml document data as JSON Object and parse values into Quiz.php document elements
			xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=RetrieveExamInfo&exam_id="+WebApp.mExamId);
			xmlhttp.onreadystatechange = function () 
			{
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					var obj = eval("(" + xmlhttp.responseText + ")");

					/*save the obj*/
					WebApp.mExamInfo.val=obj;
					WebApp.mExamInfo.set=true;
					/*Obj stuff done*/

					/*Display*/
					WebApp.displayExamSection(obj,s,q);

				}
			}
		}
	},

	DisplayExamSectionMenu: function (sm, show) {
		var display = show ? "block" : "none";
		document.getElementById('section' + sm).setAttribute('style', 'display:' + display);
		//Section Questions Menu Display Update
		if (show) {
			var quesIdx = 0; for (var i = 0; i < sm; ++i) { for (var j = 0; j < WebApp.mSecQuesCount[i]; ++j) quesIdx++; } //Current question index within arrays
			//console.log(sm + "index")
			var answered = 0, not_answered = 0, review = 0, not_visited = 0;
			for (var j = 0; j < WebApp.mSecQuesCount[sm]; ++j) {
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 0)
					not_visited++;
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 1)
					not_answered++;
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 2)
					answered++;
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 3)
					review++;
				if (WebApp.mQuestionStatus[(j + quesIdx)] == 4){
					review++;
					answered++;
				}
			}
			document.getElementById("tooltip_answered" + sm).innerHTML = answered;
			document.getElementById("tooltip_not_answered" + sm).innerHTML = not_answered;
			document.getElementById("tooltip_review" + sm).innerHTML = review;
			document.getElementById("tooltip_not_visited" + sm).innerHTML = not_visited;
		}
	},

	/*Question Navigation*/
	SelectNavItem: function (q) {
		if (WebApp.mSecQuesCount[WebApp.mExamPageSection] == (q - 1)) //Reset to first question
			q = 1;
		WebApp.mSecCurrQuestion[WebApp.mExamPageSection] = q;
		var quesIdx = 0; 
		for (var i = 0; i < WebApp.mExamPageSection; ++i) { 
			for (var j = 0; j < WebApp.mSecQuesCount[i]; ++j) quesIdx++; 
		} //Current question index within arrays

		var currTime = (+new Date);
		var timeTaken = currTime - WebApp.mstartTimer;
		WebApp.mstartTimer = currTime;
		WebApp.mQuestionTimers[WebApp.mCurrentQ] += timeTaken;
		//WebApp.mQuestionTimers[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] - 1)] += timeTaken;
		WebApp.mCurrentQ = q + quesIdx - 1;
		sec = Math.round(WebApp.mQuestionTimers[WebApp.mCurrentQ]/1000);




		/*
			  if (WebApp.mQuestionStatus[(q + quesIdx)] == 0)
			  document.getElementById('nvi' + (q + quesIdx)).setAttribute('class', 'not_answered button_item');
			  */

		/*For question?*/
		WebApp.DisplayExamSectionPage(WebApp.mExamPageSection, (q - 1));
	},

	/*Save answer and Next ..*/
	AnswerQuestion: function (type) {
		var quesIdx = 0; for (var i = 0; i < WebApp.mExamPageSection; ++i) { for (var j = 0; j < WebApp.mSecQuesCount[i]; ++j) quesIdx++; } quesIdx -= 1; //Current question index within arrays
		switch (type) {
			case "NEXT":
			case "PREV":
				/*It's either a MCQ, otherwise Numeric*/
				//	var answer = $('#choiceAnswer').is(':visible') ? $('input[name="answers"]:checked').val() : $('#numericAnswerContent').val();
				var answer = $('#choiceAnswer').is(':visible') ? $('input[name="answers"]:checked').val(): $('#multipleAnswer').is(':visible')?      'ppp' : $('#numericAnswerContent').val();
				if(answer == 'ppp')
				{
					var selects = $('.multipleAnswer');
					for(var i = 0; i < selects.length; i++)
					{
						if(selects[i].checked)
						{
							if(answer === 'ppp')
							{
								answer = selects[i].value;
							}
							else answer += ","+selects[i].value;
						}
					}
					if(answer === 'ppp')
					{
						answer = null;
					}
				}
				//console.log("ans = "+answer);
				answer = typeof answer !== 'undefined' ? answer : null; /*null replaced 0*/

				if(typeof(answer)=='undefined') answer=null;
				else if(answer=="") answer=null;


				if(answer) {
					answer = answer.replace(/['"]/g, '');
				}
				WebApp.mQuestionAnswers[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = answer;

				var qs_status=WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)];
				//console.log(answer);
				/*not answered, marked review*/
				if (answer == null && qs_status!=3) {

//					WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 1; //Visited
//					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('class', 'not_answered button_item');
					//$('#exam-not-answered-count').text(WebApp.mSecQuesCount[WebApp.mExamPageSection] - WebApp.mSecAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecUnVisitedCount[WebApp.mExamPageSection] - WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
				}

				/*answered*/
				else if(answer!=null && qs_status != 2) {
					WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 2; //Answered
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('class', 'answered button_item');
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('title', 'Answered');
					WebApp.mSecAnsweredCount[WebApp.mExamPageSection]++;
					$('#exam-answered-count').text(WebApp.mSecAnsweredCount[WebApp.mExamPageSection]);
					if(qs_status == 3) {
					WebApp.mSecMarkedCount[WebApp.mExamPageSection]--;
					$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
					}
					if(qs_status == 4){
					WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]--;
					$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
					}
				}

				$('input[name="answers"]:checked').removeAttr("checked");
				ec_set_numeric_answer_value('');

				if (type == "NEXT") {
					//Move to next question
					WebApp.mSecCurrQuestion[WebApp.mExamPageSection] += 1;
					WebApp.SelectNavItem(WebApp.mSecCurrQuestion[WebApp.mExamPageSection]);
				}
				else {
					console.log('[PREV] mSecCurrQuestion=', WebApp.mSecCurrQuestion[WebApp.mExamPageSection], ' mExamPageSection=', WebApp.mExamPageSection);
					if (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] > 1) {
						WebApp.mSecCurrQuestion[WebApp.mExamPageSection] -= 1;
						console.log('[PREV] going to Q', WebApp.mSecCurrQuestion[WebApp.mExamPageSection]);
						WebApp.SelectNavItem(WebApp.mSecCurrQuestion[WebApp.mExamPageSection]);
					}
					else if (WebApp.mExamPageSection > 0) {
						var previousSection = WebApp.mExamPageSection - 1;
						WebApp.mSecCurrQuestion[previousSection] = WebApp.mSecQuesCount[previousSection];
						WebApp.DisplayExamSectionPage(previousSection, WebApp.mSecCurrQuestion[previousSection] - 1);
					}
					else {
						console.log('[PREV] already on first question');
						WebApp.SelectNavItem(WebApp.mSecCurrQuestion[WebApp.mExamPageSection]);
					}
				}
				break;

			case "MARK":
				var answer = $('#choiceAnswer').is(':visible') ? $('input[name="answers"]:checked').val(): $('#multipleAnswer').is(':visible')?      'ppp' : $('#numericAnswerContent').val();
				if(answer == 'ppp')
				{
					var selects = $('.multipleAnswer');
					for(var i = 0; i < selects.length; i++)
					{
						if(selects[i].checked)
						{
							if(answer === 'ppp')
							{
								answer = selects[i].value;
							}
							else answer += ","+selects[i].value;
						}
					}
					if(answer === 'ppp')
					{
						answer = null;
					}
				}
				answer = typeof answer !== 'undefined' ? answer : 0;
				if(typeof(answer)=='undefined') answer=null;
				else if(answer=="") answer=null;
				var qs_status_old=WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)];
				if(answer) {
					answer = answer.replace(/['"]/g, '');
				}
				WebApp.mQuestionAnswers[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = answer;
				if (answer == null) {
					if(qs_status_old != 3) {
					WebApp.mSecMarkedCount[WebApp.mExamPageSection]++;
					WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 3; //Review
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('class', 'review button_item');
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('title', 'Marked for Review');
					$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
					if(qs_status_old == 4) {
					WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]--;
					$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
					}
					}
				}
				else {
					if(qs_status_old != 4) {
					WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]++;
					WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 4; //Review answered
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('class', 'review_answered button_item');
					document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('title', 'Answered and Marked for Review');
					$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
					if(qs_status_old == 3) {
					WebApp.mSecMarkedCount[WebApp.mExamPageSection]--;
					$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
					}
					if(qs_status_old == 2) {
					WebApp.mSecAnsweredCount[WebApp.mExamPageSection]--;
					$('#exam-answered-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
					}
					}
				}

				$('input[name="answers"]:checked').removeAttr("checked");
				ec_set_numeric_answer_value('');
/*
				// Time taken is collected and stored
				var currTime = (+new Date);
				var timeTaken = currTime - WebApp.mstartTimer;
				WebApp.mstartTimer = currTime;
				WebApp.mQuestionTimers[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] - 1)] += timeTaken;
				*/
				
				//Move to next question
				WebApp.mSecCurrQuestion[WebApp.mExamPageSection] += 1;
				WebApp.SelectNavItem(WebApp.mSecCurrQuestion[WebApp.mExamPageSection]);
				break;

			case "RESET":
				var qs_status=WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)];
				if(qs_status == 2) {
					WebApp.mSecAnsweredCount[WebApp.mExamPageSection]--;
					$('#exam-answered-count').text(WebApp.mSecAnsweredCount[WebApp.mExamPageSection]);
					$('#exam-not-answered-count').text(WebApp.mSecQuesCount[WebApp.mExamPageSection] - WebApp.mSecAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecUnVisitedCount[WebApp.mExamPageSection] - WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
				}
				else if(qs_status == 3) {
					WebApp.mSecMarkedCount[WebApp.mExamPageSection]--;
					$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
				}
				else if(qs_status == 4) {
					WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]--;
					$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
				}
				WebApp.mQuestionAnswers[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 0; //Not Answered
				WebApp.mQuestionStatus[(WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + quesIdx)] = 1; //Visited
				document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('class', 'not_answered button_item');
				document.getElementById('nvi' + (WebApp.mSecCurrQuestion[WebApp.mExamPageSection] + (quesIdx + 1))).setAttribute('title', 'Not Answered');

				/*Makes sense here..*/
				$('input[name="answers"]:checked').removeAttr("checked");
				ec_set_numeric_answer_value('');

				break;
			default:
				break;
		}
	},

	UpdateSiteNav: function () {

	},

	SubmitResults: function () {
		/* Finalize elapsed time */
		WebApp._persistElapsed();

		var currTime = (+new Date);
		var timeTaken = currTime - WebApp.mstartTimer;
		//WebApp.mstartTimer = currTime;
		WebApp.mQuestionTimers[WebApp.mCurrentQ] += timeTaken;

		if ( (typeof this.counter != 'undefined') && (this.counter == 0) ) {
		console.log("Submitting Results failed");
			return;
		}
		this.counter = 0;
		console.log("Submitting Results");
		WebApp.setVal("ec_sessExpires", new Date().toGMTString());

		/* Stop auto-save */
		WebApp.StopAutoSave();

		var examName = WebApp.getVal("ec_examName") || '';

		var results = '\t<results>\n\t\t<name>' + examName + '</name>';
		for (var s = 0, q = 0; s < WebApp.mSecQuesCount.length; ++s) {
			results += '\n\t\t<section>\n\t\t\t<name>' + WebApp.mSectionNames[s] + '</name>';
			for (var i = 0; i < WebApp.mSecQuesCount[s]; ++i, ++q) {
				results += '\n\t\t\t<question>\n\t\t\t\t<number>' + (q + 1) + '</number>';
				results += '\n\t\t\t\t<answer>' + WebApp.mQuestionAnswers[q] + '</answer>';
				results += '\n\t\t\t\t<status>' + WebApp.mQuestionStatus[q] + '</status>';
				results += '\n\t\t\t\t<time>' + WebApp.mQuestionTimers[q] + '</time>\n\t\t\t</question>';
			}
			results += '\n\t\t</section>';
		}
		results += '\n\t</results>';

		/* Store exam details in localStorage */
		var exam_id = WebApp.getVal("ec_exam_id");
		var exam_response_b64 = btoa(JSON.stringify(WebApp.mQuestionAnswers));
		var exam_postId_b64 = btoa(JSON.stringify(WebApp.mQuestionPostIds));
		var exam_qn_time_b64 = btoa(JSON.stringify(WebApp.mQuestionTimers));

		WebApp.setVal("ec_exam_response", exam_response_b64);
		WebApp.setVal("backup_ec_exam_response_" + exam_id, exam_response_b64);
		WebApp.setVal("backup_ec_exam_postid_" + exam_id, exam_postId_b64);
		WebApp.setVal("ec_exam_postId", exam_postId_b64);
		WebApp.setVal("ec_qn_time_taken", exam_qn_time_b64);

		var exam_begin = WebApp.getVal("ec_examBegin");
		var exam_time_taken = Math.round(WebApp._getElapsedMs() / 60000);
		WebApp.setVal("ec_exam_time_taken", JSON.stringify(exam_time_taken));

		/* Submit to server via POST with all data */
		var postData = "fn=SubmitResults&results=" + encodeURIComponent(results)
			+ "&post_exam_id=" + encodeURIComponent(exam_id)
			+ "&post_response=" + encodeURIComponent(exam_response_b64)
			+ "&post_postids=" + encodeURIComponent(exam_postId_b64)
			+ "&post_timetaken=" + encodeURIComponent(exam_time_taken)
			+ "&post_qtimetaken=" + encodeURIComponent(exam_qn_time_b64)
			+ "&post_resumed=" + encodeURIComponent(WebApp.mExamResumed)
			+ "&post_exam_start_time=" + encodeURIComponent(WebApp.mExamStartTime || WebApp.getVal("ec_exam_start_time") || "")
			+ "&post_session_token=" + encodeURIComponent(WebApp.mSessionToken || '');

		xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", postData);
		xmlhttp.onreadystatechange = function ()
		{
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
			{
				var resp = {};
				try { resp = JSON.parse(xmlhttp.responseText); } catch(e) {}
				if (resp.resultid) {
					WebApp.setVal("ec_exam_resultid", resp.resultid);
				}
				WebApp.SubmitFeedback();
			}
		}

	},

	SubmitFeedback: function () {
		WebApp.mSubmitting = true;
		WebApp.StopAutoSave();
		WebApp.setVal("ec_sessExpires", new Date().toGMTString());

		/* Extract values from localStorage */
		var exam_id = WebApp.getVal("ec_exam_id");
		var exam_response = WebApp.getVal("ec_exam_response");
		var exam_postId = WebApp.getVal("ec_exam_postId");
		var exam_time_taken = WebApp.getVal("ec_exam_time_taken");
		var exam_resultid = WebApp.getVal("ec_exam_resultid");
		var exam_qn_time_taken = WebApp.getVal("ec_qn_time_taken");

		if(exam_id!=null && exam_response!=null && exam_postId!=null && exam_time_taken!=null && exam_qn_time_taken!=null){
			/*Proceed..*/
			console.log("Results log");

			var answers = JSON.parse(atob(exam_response));
			var timetaken = JSON.parse(atob(exam_qn_time_taken));
			var posts = JSON.parse(atob(exam_postId));
                        var answerresponse = [];
			var timetakenresponse = [];
                        for(var i=0; i < posts.length; i++)
                        {
				answerresponse[posts[i]] = {};
                                answerresponse[posts[i]]=answers[i];

				timetakenresponse[posts[i]] = {};
                                timetakenresponse[posts[i]]=timetaken[i];
                        }
                        aresponse = JSON.stringify(answerresponse);
			timeresponse = JSON.stringify(timetakenresponse);

			var responseForm=document.createElement("form");
			responseForm.method="POST";	
			responseForm.action="./results.php";
			var res_exam_id=document.createElement("input");
			res_exam_id.type="hidden";
			res_exam_id.name="res_exam_id";
			res_exam_id.value=exam_id;
			var res_time_taken=document.createElement("input");
			res_time_taken.type="hidden";
			res_time_taken.name="res_time_taken";
			res_time_taken.value=exam_time_taken;
			var resInput=document.createElement("input");
			resInput.type="hidden";
			resInput.name="response";
			resInput.value=aresponse;
			var qnTimeInput=document.createElement("input");
			qnTimeInput.type="hidden";
			qnTimeInput.name="time_taken_qn";
			qnTimeInput.value=timeresponse;
			var resPostId=document.createElement("input");
			resPostId.type="hidden";
			resPostId.name="post_ids";
			resPostId.value=(exam_postId);
			var resultId=document.createElement("input");
			resultId.type="hidden";
			resultId.name="resultid";
			resultId.value=(exam_resultid);
			/*AppendTo*/
			responseForm.appendChild(res_exam_id);
			responseForm.appendChild(resInput);
			responseForm.appendChild(qnTimeInput);
			responseForm.appendChild(resPostId);
			responseForm.appendChild(res_time_taken);
			responseForm.appendChild(resultId);
			document.body.appendChild(responseForm);
			responseForm.submit();
		}

		/*END OF STUFF*/

		/*Clear localStorage*/
		WebApp.DeleteAllCookies();

		/*
			   window.location.href = "close.php"; PHASED OUT :(
			   */
	},

	/* Auto-save progress locally and to server every 30 seconds */
	StartAutoSave: function() {
		if (WebApp.mAutoSaveInterval) clearInterval(WebApp.mAutoSaveInterval);
		WebApp.mAutoSaveInterval = setInterval(function() {
			WebApp.SaveProgress();
		}, 30000);
		console.log("Auto-save started (every 30s)");

		/* Save progress + persist elapsed on tab/browser close */
		if (!WebApp._beforeUnloadBound) {
			WebApp._beforeUnloadBound = true;
			window.addEventListener('beforeunload', function() {
				if (WebApp.mSessionInvalidated || WebApp.mSubmitting) return;
				WebApp._persistElapsed();
				WebApp.SaveProgress();
			});
		}

		/* Pause / resume timer when tab becomes hidden / visible */
		if (!WebApp._visibilityBound) {
			WebApp._visibilityBound = true;
			document.addEventListener('visibilitychange', function() {
				if (document.hidden) {
					/* Tab hidden — save progress but keep timer running */
					if (!WebApp.mSessionInvalidated && !WebApp.mSubmitting) {
						WebApp.SaveProgress();
					}
					console.log('Tab hidden — progress saved, timer continues');
				} else {
					/* Tab visible again */
					console.log('Tab visible');
				}
			});
		}

		/* ── Offline / online listeners ────────────────────────── */
		if (!WebApp._offlineBanner) {
			var bar = document.createElement('div');
			bar.id = 'quiz-offline-banner';
			bar.textContent = '\u26A0 You are offline \u2014 your answers are saved locally and will be submitted when you reconnect.';
			document.body.appendChild(bar);
			WebApp._offlineBanner = bar;

			window.addEventListener('offline', function() {
				bar.classList.add('visible');
				console.log('Connection lost \u2014 offline mode');
			});

			window.addEventListener('online', function() {
				bar.classList.remove('visible');
				console.log('Connection restored');
				/* Flush any queued submission */
				WebApp._flushQueuedSubmit();
				/* Force an immediate server save */
				WebApp.SaveProgress();
			});

			/* Show immediately if already offline */
			if (!navigator.onLine) bar.classList.add('visible');
		}
	},

	StopAutoSave: function() {
		if (WebApp.mAutoSaveInterval) {
			clearInterval(WebApp.mAutoSaveInterval);
			WebApp.mAutoSaveInterval = null;
		}
		console.log("Auto-save stopped");
	},

	/* Show a modal dialog letting the user choose to resume or start fresh */
	_showResumeDialog: function(info, onResume, onFresh) {
		var overlay = document.createElement('div');
		overlay.id = 'quiz-resume-overlay';

		var box = document.createElement('div');
		box.id = 'quiz-resume-box';
		box.innerHTML =
			'<h3>Previous Session Found</h3>' +
			'<table class="quiz-resume-stats">' +
			'<tr><td>Questions Answered</td><td><strong>' + info.answered + ' / ' + info.total + '</strong></td></tr>' +
			'<tr><td>Time Remaining</td><td><strong>' + info.minsLeft + ' min ' + info.secsLeft + ' sec</strong></td></tr>' +
			'<tr><td>Last Saved</td><td>' + info.savedAt + '</td></tr>' +
			'</table>' +
			'<div class="quiz-resume-warning" style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin: 10px 0; color: #856404;">' +
			'<strong>\u26A0\uFE0F Warning:</strong> Resumed exams will <strong>NOT</strong> be considered for ranking. ' +
			'Only first attempts completed within the exam duration + 20 minutes tolerance are eligible for ranking.' +
			'</div>' +
			'<div class="quiz-resume-actions">' +
			'<button id="quiz-resume-btn" class="quiz-resume-btn resume">Resume Exam</button>' +
			'<button id="quiz-fresh-btn" class="quiz-resume-btn fresh">Start Fresh</button>' +
			'</div>';

		overlay.appendChild(box);
		document.body.appendChild(overlay);

		/* Force reflow then add class to trigger animation */
		overlay.offsetHeight;
		overlay.classList.add('visible');

		document.getElementById('quiz-resume-btn').addEventListener('click', function() {
			overlay.classList.remove('visible');
			setTimeout(function() { overlay.parentNode.removeChild(overlay); }, 300);
			onResume();
		});
		document.getElementById('quiz-fresh-btn').addEventListener('click', function() {
			overlay.classList.remove('visible');
			setTimeout(function() { overlay.parentNode.removeChild(overlay); }, 300);
			onFresh();
		});
	},

	/* Queue a submit when offline — stores all data needed for SubmitResults
	   in localStorage so it survives page close. Picked up by _flushQueuedSubmit
	   when the 'online' event fires. */
	_queueSubmit: function() {
		/* Finalize timers exactly as SubmitResults does */
		var currTime = (+new Date);
		var timeTaken = currTime - WebApp.mstartTimer;
		WebApp.mQuestionTimers[WebApp.mCurrentQ] += timeTaken;

		WebApp.StopAutoSave();

		var exam_id = WebApp.getVal('ec_exam_id');
		var payload = {
			exam_id: exam_id,
			answers: WebApp.mQuestionAnswers,
			postIds: WebApp.mQuestionPostIds,
			timers: WebApp.mQuestionTimers,
			statuses: WebApp.mQuestionStatus,
			sectionNames: WebApp.mSectionNames,
			secQuesCount: WebApp.mSecQuesCount,
			examBegin: WebApp.getVal('ec_examBegin'),
			elapsed: WebApp._getElapsedMs(),
			queuedAt: new Date().toISOString(),
			resumed: WebApp.mExamResumed,
			examStartTime: WebApp.mExamStartTime || WebApp.getVal("ec_exam_start_time")
		};
		WebApp.setVal('ec_queued_submit', JSON.stringify(payload));
		console.log('Submit queued offline — will auto-submit when connection returns');

		/* Also do a final localStorage progress save */
		WebApp.setVal('ec_exam_progress_' + exam_id, JSON.stringify({
			answers: payload.answers,
			statuses: payload.statuses,
			timers: payload.timers,
			postIds: payload.postIds,
			savedAt: payload.queuedAt
		}));

		/* Show waiting UI */
		var banner = WebApp._offlineBanner;
		if (banner) {
			banner.textContent = '\u23F3 Exam finished \u2014 waiting for internet to submit your answers\u2026';
			banner.classList.add('visible', 'waiting');
		}
	},

	/* Called when the browser comes back online. Picks up the queued
	   submission from localStorage and runs SubmitResults. */
	_flushQueuedSubmit: function() {
		var raw = WebApp.getVal('ec_queued_submit');
		if (!raw) return;

		try {
			var payload = JSON.parse(raw);
			console.log('Flushing queued submit for exam ' + payload.exam_id + ' (queued ' + payload.queuedAt + ')');

			/* Restore the state that SubmitResults needs */
			WebApp.mQuestionAnswers = payload.answers;
			WebApp.mQuestionPostIds = payload.postIds;
			WebApp.mQuestionTimers = payload.timers;
			WebApp.mQuestionStatus = payload.statuses;
			WebApp.mSectionNames = payload.sectionNames;
			WebApp.mSecQuesCount = payload.secQuesCount;
			if (payload.examBegin) {
				WebApp.setVal('ec_examBegin', payload.examBegin);
				WebApp.mExamBegin = new Date(payload.examBegin);
			}
			if (typeof payload.elapsed !== 'undefined') {
				WebApp.setVal('ec_exam_elapsed', String(payload.elapsed));
			}
			/* Restore resumed flag and exam start time */
			WebApp.mExamResumed = payload.resumed || 0;
			if (payload.examStartTime) {
				WebApp.mExamStartTime = payload.examStartTime;
				WebApp.setVal('ec_exam_start_time', String(payload.examStartTime));
			}
			WebApp.mPageActiveStart = (+new Date);
			WebApp.setVal('ec_exam_id', payload.exam_id);

			/* Clear the queue flag BEFORE submitting to avoid double-submit */
			WebApp.removeVal('ec_queued_submit');

			/* Now submit as normal */
			WebApp.SubmitResults();
		} catch(e) {
			console.log('Failed to flush queued submit: ' + e.message);
		}
	},

	/* Save current exam progress to localStorage and server */
	SaveProgress: function() {
		if (WebApp.mSessionInvalidated || WebApp.mSubmitting) return;
		var exam_id = WebApp.getVal("ec_exam_id");
		if (!exam_id || WebApp.mQuestionAnswers.length <= 1) return;

		/* Keep elapsed time in localStorage up to date */
		WebApp._persistElapsed();

		/* Capture time for current question */
		var currTime = (+new Date);
		var timeTaken = currTime - WebApp.mstartTimer;
		/* Don't reset mstartTimer here — let normal navigation handle it */

		/* Save a snapshot including current question's accumulated time */
		var timersCopy = WebApp.mQuestionTimers.slice();
		timersCopy[WebApp.mCurrentQ] += timeTaken;

		var progressData = {
			answers: WebApp.mQuestionAnswers,
			statuses: WebApp.mQuestionStatus,
			timers: timersCopy,
			postIds: WebApp.mQuestionPostIds,
			currentQ: WebApp.mCurrentQ,
			section: WebApp.mExamPageSection,
			secCurrQuestion: WebApp.mSecCurrQuestion,
			secAnsweredCount: WebApp.mSecAnsweredCount,
			secMarkedCount: WebApp.mSecMarkedCount,
			secMarkedAnsweredCount: WebApp.mSecMarkedAnsweredCount,
			secUnVisitedCount: WebApp.mSecUnVisitedCount,
			savedAt: new Date().toISOString()
		};

		/* Save to localStorage */
		WebApp.setVal("ec_exam_progress_" + exam_id, JSON.stringify(progressData));
		console.log("Progress saved locally at " + progressData.savedAt);

		/* Save to server */
		var postData = "fn=SaveProgress"
			+ "&post_exam_id=" + encodeURIComponent(exam_id)
			+ "&post_answers_json=" + encodeURIComponent(JSON.stringify(progressData.answers))
			+ "&post_timers_json=" + encodeURIComponent(JSON.stringify(timersCopy))
			+ "&post_statuses_json=" + encodeURIComponent(JSON.stringify(progressData.statuses))
			+ "&post_postids=" + encodeURIComponent(btoa(JSON.stringify(progressData.postIds)))
			+ "&post_session_token=" + encodeURIComponent(WebApp.mSessionToken || '');

		var xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", postData);
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200) {
					try {
						var resp = JSON.parse(xmlhttp.responseText);
						if (resp.error === 'session_conflict' || resp.error === 'no_session') {
							/* Token mismatch or no claimed session — another
							   session took over, or this is a stale tab. */
							WebApp.StopAutoSave();
							WebApp.mSessionInvalidated = true;
							alert(resp.message || 'Session error. This tab will stop saving.');
							window.location.href = sBaseURL + '../exams';
							return;
						}
					} catch(e) {}
					console.log("Progress saved to server");
				} else {
					console.log("Server save failed (will retry on next interval)");
				}
			}
		};
	},

	/* Restore exam progress from localStorage or server */
	RestoreProgress: function() {
		var exam_id = WebApp.getVal("ec_exam_id");
		if (!exam_id) return;

		/* Try localStorage first (faster) */
		var localData = WebApp.getVal("ec_exam_progress_" + exam_id);
		if (localData) {
			try {
				var progress = JSON.parse(localData);
				WebApp._applyProgress(progress);
				console.log("Progress restored from localStorage (saved " + progress.savedAt + ")");
				return;
			} catch(e) {
				console.log("Failed to parse local progress, trying server...");
			}
		}

		/* Fall back to server */
		var xmlhttp = PHPRequest(sBaseURL + "resources/php/webapp.php", "fn=LoadProgress&exam_id=" + encodeURIComponent(exam_id), false);
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				try {
					var resp = JSON.parse(xmlhttp.responseText);
					if (resp.found) {
						var progress = {
							answers: JSON.parse(resp.answers),
							timers: JSON.parse(resp.timers),
							statuses: JSON.parse(resp.statuses)
						};
						WebApp._applyProgress(progress);
						console.log("Progress restored from server");
					}
				} catch(e) {
					console.log("Failed to restore from server: " + e.message);
				}
			}
		};
	},

	/* Apply restored progress data to current exam state */
	_applyProgress: function(progress) {
		if (!progress || !progress.answers) return;

		/* Restore answers and statuses */
		for (var i = 0; i < progress.answers.length && i < WebApp.mQuestionAnswers.length; i++) {
			if (progress.answers[i] !== null) {
				WebApp.mQuestionAnswers[i] = progress.answers[i];
			}
			if (progress.statuses && progress.statuses[i] !== undefined) {
				WebApp.mQuestionStatus[i] = progress.statuses[i];
			}
			if (progress.timers && progress.timers[i] !== undefined) {
				WebApp.mQuestionTimers[i] = progress.timers[i];
			}
		}

		/* Restore section counters if available */
		if (progress.secAnsweredCount) WebApp.mSecAnsweredCount = progress.secAnsweredCount;
		if (progress.secMarkedCount) WebApp.mSecMarkedCount = progress.secMarkedCount;
		if (progress.secMarkedAnsweredCount) WebApp.mSecMarkedAnsweredCount = progress.secMarkedAnsweredCount;
		if (progress.secUnVisitedCount) WebApp.mSecUnVisitedCount = progress.secUnVisitedCount;
		if (progress.secCurrQuestion) WebApp.mSecCurrQuestion = progress.secCurrQuestion;

		/* Update navigation panel button states */
		for (var i = 0; i < WebApp.mQuestionStatus.length; i++) {
			var el = document.getElementById('nvi' + (i + 1));
			if (!el) continue;
			switch (WebApp.mQuestionStatus[i]) {
				case 0: el.setAttribute('class', 'not_visited button_item'); el.setAttribute('title', 'Not Visited'); break;
				case 1: el.setAttribute('class', 'not_answered button_item'); el.setAttribute('title', 'Not Answered'); break;
				case 2: el.setAttribute('class', 'answered button_item'); el.setAttribute('title', 'Answered'); break;
				case 3: el.setAttribute('class', 'review button_item'); el.setAttribute('title', 'Marked for Review'); break;
				case 4: el.setAttribute('class', 'review_answered button_item'); el.setAttribute('title', 'Answered and Marked for Review'); break;
			}
		}

		/* Update section counters display */
		$('#exam-not-visited-count').text(WebApp.mSecUnVisitedCount[WebApp.mExamPageSection]);
		$('#exam-marked-answered-count').text(WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-answered-count').text(WebApp.mSecAnsweredCount[WebApp.mExamPageSection]);
		$('#exam-not-answered-count').text(WebApp.mSecQuesCount[WebApp.mExamPageSection] - WebApp.mSecAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecUnVisitedCount[WebApp.mExamPageSection] - WebApp.mSecMarkedAnsweredCount[WebApp.mExamPageSection] - WebApp.mSecMarkedCount[WebApp.mExamPageSection]);
		$('#exam-marked-count').text(WebApp.mSecMarkedCount[WebApp.mExamPageSection]);

		/* Restore current question position */
		if (typeof progress.currentQ !== 'undefined') {
			WebApp.mCurrentQ = progress.currentQ;
		}
		var restoredSection = 0;
		if (typeof progress.section !== 'undefined') {
			restoredSection = progress.section;
		}

		/* Reset start timer so DisplayExamSectionPage adds near-zero time noise */
		WebApp.mstartTimer = (+new Date);

		/* Use the full section-switch path — it correctly hides the old
		   section panel, calls DisplayExamPage('active'), selects the
		   section tab, and shows the restored section's question palette */
		WebApp.DisplayExamSectionPage(restoredSection,
			WebApp.mSecCurrQuestion[restoredSection] - 1);
	},

	CheckVersion: function () {
		var sessExpires = WebApp.getVal("ec_sessExpires") || '';

		if (sessExpires.length > 2) {
			var expiration = new Date(sessExpires);
			var now = new Date();
			if (Date.minsBetween(expiration, now) >= WebApp.mSessionTimeout) {
				//Candidate session has expired force system restart
				window.location.href = "error.php";
			}
		}
	}
};

$(document).ready(function() {
    var questionScrollUpdateTimer = null;

    var getQuestionScrollContainer = function () {
        return document.getElementById('quesOuterDiv');
    };

    var updateQuestionScrollControls = function () {
        var scrollContainer = getQuestionScrollContainer();
        var controls = document.getElementById('questionScrollControls');
        var scrollUpButton = document.getElementById('questionScrollUp');
        var scrollDownButton = document.getElementById('questionScrollDown');

        if (!scrollContainer || !controls || window.matchMedia('(max-width: 950px)').matches) {
            if (controls) {
                controls.classList.remove('is-visible');
                controls.setAttribute('aria-hidden', 'true');
            }

            if (scrollUpButton) {
                scrollUpButton.classList.add('is-hidden');
            }

            if (scrollDownButton) {
                scrollDownButton.classList.add('is-hidden');
            }
            return;
        }

        var hasOverflow = scrollContainer.scrollHeight > (scrollContainer.clientHeight + 4);
        var canScrollUp = scrollContainer.scrollTop > 4;
        var canScrollDown = (scrollContainer.scrollTop + scrollContainer.clientHeight) < (scrollContainer.scrollHeight - 4);

        controls.classList.toggle('is-visible', hasOverflow);
        controls.setAttribute('aria-hidden', hasOverflow ? 'false' : 'true');

        if (scrollUpButton) {
            scrollUpButton.classList.toggle('is-hidden', !hasOverflow || !canScrollUp);
        }

        if (scrollDownButton) {
            scrollDownButton.classList.toggle('is-hidden', !hasOverflow || !canScrollDown);
        }
    };

    var queueQuestionScrollControlUpdate = function () {
        window.clearTimeout(questionScrollUpdateTimer);
        questionScrollUpdateTimer = window.setTimeout(updateQuestionScrollControls, 60);
    };

	$(document).on('mousedown', '.nat-key', function (event) {
		event.preventDefault();
	});

	$(document).on('focus click keyup select input', '#numericAnswerContent', function () {
		ec_sync_numeric_answer_selection(this);
	});

	$(document).on('click', '.nat-key', function (event) {
		var input = ec_get_numeric_answer_input();
		if (!input || !$('#numericAnswer').is(':visible')) {
			return;
		}

		event.preventDefault();

		var action = this.getAttribute('data-action');
		var value = this.getAttribute('data-value');
		var currentValue = input.value || '';
		var selection = ec_get_numeric_answer_selection(input);
		var nextValue = currentValue;
		var nextPosition = selection.end;

		if (action === 'clear') {
			nextValue = '';
			nextPosition = 0;
		}
		else if (action === 'backspace') {
			if (selection.start !== selection.end) {
				nextValue = currentValue.slice(0, selection.start) + currentValue.slice(selection.end);
				nextPosition = selection.start;
			}
			else if (selection.start > 0) {
				nextValue = currentValue.slice(0, selection.start - 1) + currentValue.slice(selection.end);
				nextPosition = selection.start - 1;
			}
		}
		else if (action === 'left') {
			nextPosition = selection.start !== selection.end ? selection.start : Math.max(0, selection.start - 1);
		}
		else if (action === 'right') {
			nextPosition = selection.start !== selection.end ? selection.end : Math.min(currentValue.length, selection.end + 1);
		}
		else if (value !== null) {
			nextValue = currentValue.slice(0, selection.start) + value + currentValue.slice(selection.end);
			nextPosition = selection.start + value.length;
		}

		ec_set_numeric_answer_value(nextValue, nextPosition);
		ec_focus_numeric_answer_input(nextPosition);
	});

    var syncMainLeftWidthState = function () {
        var isRightPanelCollapsed = $('.mainRight').hasClass('panel-collapsed');
        $('.mainLeft').toggleClass('panel-collapsed', isRightPanelCollapsed);
        $('#actionButton').toggleClass('panel-collapsed', isRightPanelCollapsed);
        $('.quiz-top-bar').toggleClass('panel-collapsed', isRightPanelCollapsed);
        $('.sectionsStickyHeaderWrap').toggleClass('panel-collapsed', isRightPanelCollapsed);
    };

    if (window.matchMedia('(max-width: 950px)').matches) {
        $('.mainRight').addClass('panel-collapsed').removeClass('opened');
        $('.mainLeft').removeClass('panel-collapsed');
    } else {
        syncMainLeftWidthState();
    }

    var syncSectionsHeaderWrap = function () {
        var $mainLeft = $('.mainLeft');
        var $headerWrap = $('.sectionsStickyHeaderWrap');
        var $questionCont = $('#questionCont');
        var $questionScrollControls = $('#questionScrollControls');
        var $quesOuterDiv = $('#quesOuterDiv');

        if (!$mainLeft.length || !$headerWrap.length) {
            return;
        }

        var mainLeftRect = $mainLeft[0].getBoundingClientRect();

        $headerWrap.css({
            left: mainLeftRect.left + 'px',
            width: mainLeftRect.width + 'px'
        });

        /* #questionCont uses width:100% in CSS which correctly fills
           .mainLeft's content area.  Do NOT set an explicit pixel width
           here — mainLeftRect.width is the border-box width (includes
           padding) which would make #questionCont overflow by ~22px. */

        if ($questionScrollControls.length && $quesOuterDiv.length) {
            var quesOuterDivRect = $quesOuterDiv[0].getBoundingClientRect();
            var ctrlWidth = $questionScrollControls.outerWidth();

            /* The visible scroll area starts at the bottom of #quesNumberDiv
               (last element in the sticky header), not at quesOuterDiv top
               which extends behind the fixed header overlay. */
            var qnDiv = document.getElementById('quesNumberDiv');
            var visibleTop = qnDiv
                ? qnDiv.getBoundingClientRect().bottom
                : quesOuterDivRect.top;
            var visibleBottom = quesOuterDivRect.bottom;

            $questionScrollControls.css({
                top: (visibleTop + 4) + 'px',
                left: (quesOuterDivRect.right - ctrlWidth - 4) + 'px',
                height: Math.max(0, visibleBottom - visibleTop - 8) + 'px'
            });
        }
    };

    var syncSectionsHeaderWrapAfterLayout = function () {
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                syncSectionsHeaderWrap();
                queueQuestionScrollControlUpdate();
            });
        });
    };

    var syncExamNavState = function () {
        var isExpanded = !$('.mainRight').hasClass('panel-collapsed');
        $('#examNavButton').attr('aria-expanded', isExpanded ? 'true' : 'false');
    };

    $(document).on ('click', '#examNavButton', function () {
        $('.mainRight').toggleClass('panel-collapsed');
        $('.mainRight').toggleClass('opened', !$('.mainRight').hasClass('panel-collapsed'));
        syncMainLeftWidthState();
        syncExamNavState();
        syncSectionsHeaderWrapAfterLayout();
    });
	
	// close Exam Nav if any of the "Legend" buttons is clicked
	$(document).on ('click', '#legend .button1', function () {
        $('.mainRight').removeClass('panel-collapsed');
        $('.mainRight').removeClass('opened');
        syncMainLeftWidthState();
        syncExamNavState();
        syncSectionsHeaderWrapAfterLayout();
    });

    syncMainLeftWidthState();
    syncExamNavState();


    syncSectionsHeaderWrapAfterLayout();

    $(document).on('click', '#questionScrollUp', function () {
        var scrollContainer = getQuestionScrollContainer();
        if (!scrollContainer) {
            return;
        }

        scrollContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    $(document).on('click', '#questionScrollDown', function () {
        var scrollContainer = getQuestionScrollContainer();
        if (!scrollContainer) {
            return;
        }

        scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
        });
    });

    $('#quesOuterDiv').on('scroll', function () {
        queueQuestionScrollControlUpdate();
    });

    $(document).on('question-content-updated', function () {
        syncSectionsHeaderWrapAfterLayout();
        queueQuestionScrollControlUpdate();
    });

    $(window).on('resize', function () {
        syncSectionsHeaderWrapAfterLayout();
    });

    /* Re-sync after mainLeft width transition ends (panel collapse/expand) */
    $('.mainLeft').on('transitionend', function (e) {
        if (e.originalEvent.propertyName === 'width') {
            syncSectionsHeaderWrap();
            queueQuestionScrollControlUpdate();
        }
    });

    if (window.MutationObserver) {
        var questionContentTarget = document.getElementById('quesAnsContent');
        if (questionContentTarget) {
            new MutationObserver(function () {
                queueQuestionScrollControlUpdate();
            }).observe(questionContentTarget, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    queueQuestionScrollControlUpdate();
});
