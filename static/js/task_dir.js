

function cohcon() {

  window.myscreen = initScreen();

  window.myscreen.ppi = 80;

	var instructionPages = [ // add as a list as many pages as you like
		"instructions/instruct-1.html",
		"instructions/instruct-2.html",
		"instructions/instruct-3.html",
		"instructions/instruct-4.html",
		"instructions/instruct-5.html",
		"instructions/instruct-ready.html"
	];

	var pracTrials = Infinity;

	// Trial Phases:
	// wait = wait for spacebar press
	// fixation = 667 ms wait
	// stimulus = 667 ms
	// delay = 1013 ms
	// test = 667 ms

	var taskDir = 2; // 1 = directions, 2 = categories

	var segs = {};
	segs.wait = 0;
	segs.fixation = 1;
	segs.stimulus = 2;
	segs.delay = 3;
	segs.test = 4;
	segs.resp = 5;
	segs.fback = 6;

	var params = {};
	params.directions = [0,1,2,3,4,5,6,7]
	params.trials = Infinity;

	window.task = [];
	task[0] = [];

	window.stimulus = {};
	initStimulus('stimulus');
	myInitStimulus(task);
	// stimulus.categories = randomElement([0,1]);
	stimulus.categories = -1;
	stimulus.categoryGroups = [[0,1,2,3],[4,5,6,7]];
	stimulus.seg = segs;


	ct = 0;

	task[0][ct] = {};
	task[0][ct].waitForBacktick = 0;
	task[0][ct].seglen = [1.25, .650, .650, 1.000, .65,3,1];
	task[0][ct].numTrials = params.trials;
	task[0][ct].parameter = {};
	task[0][ct].parameter.match = [0,1];
	task[0][ct].parameter.categories = 0;
	task[0][ct].parameter.known = 0;
	task[0][ct].parameter.showresp = 1;
	task[0][ct].parameter.getready = 1;
	task[0][ct].parameter.block = 0;
	if (task[0][ct].parameter.categories==1) {
		task[0][ct].parameter.direction = [0,1];
		task[0][ct].parameter.nomatchdir = [0];
	} else {
		task[0][ct].parameter.direction = params.directions;
		task[0][ct].parameter.nomatchdir = [-Math.PI*3/8,-Math.PI*2/8,-Math.PI*1/8,Math.PI*1/8,Math.PI*2/8,Math.PI*3/8];
	}
	task[0][ct].random = 1;
	task[0][ct].usingScreen = 1;
	task[0][ct].getResponse = [0,0,0,0,0,1,0];
	task[0][ct].html = "canvas.html";

	task[0][ct] = initTask(task[0][ct], startSegmentCallback, screenUpdateCallback, getResponseCallback, startTrialCallback,endTrialCallbackPrac,startBlockCallback,blockRandomization);

	initData();
	//response related
	jglData.responses = [];
	jglData.correct = [];
	jglData.direction = [];
	jglData.categories = [];
	jglData.postSurvey = {};
	jglData.match = [];
	jglData.rot1 = [];
	jglData.rot2 = [];
	jglData.known = [];
	jglData.trial = [];
	jglData.block = [];
	jglData.corrLimit = 1;
	jglData.dirC = zeros(64);
	jglData.dirN = zeros(64);
	stimulus.lastFrame = jglGetSecs();


	startPhase(task[0]);
}

var rot2ind = function(a,b) {
	return a*8+b;
}
var ind2rot = function(ind) {
	var a = floor(ind/8);
	var b = ind % 8;
	return [a,b];
}

var startBlockCallback = function(task, myscreen) {
	//savePartialData();
	//myscreen.psiTurk.saveData();
	return [task, myscreen];
}

var endTrialCallbackPrac = function(task,myscreen) {
	jglData.correct[jglData.correct.length-1] = stimulus.gotResp;
	var ind = rot2ind(stimulus.num1,stimulus.num2);
	if (stimulus.gotResp==1) {jglData.dirC[ind] += 1;}
	return [task,myscreen];
}

var startTrialCallback = function(task, myscreen) {
	stimulus.categories = task.thistrial.categories;

	//store data
	jglData.responses.push(-1);
	jglData.correct.push(0);
	jglData.direction.push(task.thistrial.direction);
	jglData.categories.push(stimulus.categories);
	jglData.known.push(task.thistrial.known);
	jglData.match.push(task.thistrial.match);
	jglData.trial.push(task.trialnum);
	jglData.block.push(task.thistrial.block);
	stimulus.gotResp = 0;

	if (!any(lessThan(jglData.dirC,jglData.corrLimit))) {jglData.corrLimit += 1;}

	var repick = true;
		
	var retry = 0;
	while (repick) {		
		var flip = [1, 0];
		if (stimulus.categories==1) {
			// pick two directions
			stimulus.num1 = randomElement(stimulus.categoryGroups[task.thistrial.direction]);
			if (task.thistrial.match==1) {
				// matching trial, use same category
				stimulus.num2 = randomElement(stimulus.categoryGroups[task.thistrial.direction]);
			} else {
				stimulus.num2 = randomElement(stimulus.categoryGroups[flip[task.thistrial.direction]]);
			}
			if (jglData.correct.length < 224) {
				// we picked two numbers, check to see if they are in the available indexes we haven't succeded at
				failInds = find(lessThan(jglData.dirC,jglData.corrLimit));
				var curInd = rot2ind(stimulus.num1,stimulus.num2);
				for (var i in failInds) {
					val = failInds[i];
					if (curInd==val) {
						repick = false; // we found our index in the avail, no repick needed
						break
					}
				}
			} else {
				repick = false;
			}
		} else {
			stimulus.num1 = task.thistrial.direction;
			if (task.thistrial.match==1) {
				stimulus.num2 = stimulus.num1;
			} else {
				stimulus.num2 = task.thistrial.direction + task.thistrial.nomatchdir;
			}
			repick = false;
		}
		retry += 1;
		if (retry > 80) {repick = false;}
	}
	var curInd = rot2ind(stimulus.num1,stimulus.num2);
	jglData.dirN[curInd] += 1;

	stimulus.rot1 = stimulus.num1 * Math.PI * 2 / 8;
	stimulus.rot2 = stimulus.num2 * Math.PI * 2 / 8;
	jglData.rot1.push(stimulus.rot1);
	jglData.rot2.push(stimulus.rot2);

	stimulus.dots.T = add(multiply(rand(task,stimulus.dots.n), (stimulus.dots.maxT-stimulus.dots.minT)),stimulus.dots.minT);
	stimulus.dots.R = add(multiply(rand(task,stimulus.dots.n), (stimulus.dots.maxR-stimulus.dots.minR)),stimulus.dots.minR);	
	stimulus.dots.holdx =  multiply(stimulus.dots.R,cos(mod(add(stimulus.dots.T, 0), Math.PI*2)));	
	stimulus.dots.holdy = multiply(stimulus.dots.R,sin(mod(add(stimulus.dots.T, 0), Math.PI*2)));

	stimulus.dots.x = multiply(stimulus.dots.R,cos(stimulus.dots.T));
	stimulus.dots.y = multiply(stimulus.dots.R,sin(stimulus.dots.T));

	stimulus.lastFrame = jglGetSecs();


	// contrast
	// convert to hex color

  	return [task, myscreen];
}

var getResponseCallback = function(task, myscreen) {
	jumpSegment(task,0);
	
	if (jglData.keys[jglData.keys.length - 1].keyCode == 32) {
		jglData.responses[jglData.responses.length-1] = 1;
		if (task.thistrial.match==1) {
			stimulus.gotResp = 1;
		} else {
			stimulus.gotResp = -1;
		}
	}
	return [task, myscreen];
}

var startSegmentCallback = function(task, myscreen) {
	switch (task.thistrial.thisseg) {
		case stimulus.seg.stimulus:
			stimulus.rot = stimulus.rot1;
			break;
		case stimulus.seg.test:
			stimulus.rot = stimulus.rot2;
			break;
		case stimulus.seg.fback:
			if (stimulus.gotResp==0) {
				// no response yet
				if (task.thistrial.match==0) {
					stimulus.gotResp=1;
				} else {
					stimulus.gotResp = -1;
				}

			}
			break;
	}

  	return [task, myscreen];
}

var screenUpdateCallback = function(task, myscreen) {
	var now = jglGetSecs();
	var elapsed = now - stimulus.lastFrame;
	stimulus.lastFrame = now;
	jglClearScreen(0);

	var segs = stimulus.seg;

	switch (task.thistrial.thisseg) {
		case segs.wait:
			if (task.thistrial.getready) {upText('Get Ready!','#ffffff');}
			break;
		case segs.fixation:
			upFix('#ffffff');
			break;
		case segs.stimulus:
			upDots(task,elapsed);
			break;
		case segs.delay:
			upFix('#ffffff');
			break;
		case segs.test:
			upDots(task,elapsed);
			break;
		case segs.resp:
			if (task.thistrial.showresp && task.thistrial.block < 2) {
				upNowRespondText();
			}
			upFix('#ffff00');
			break;
		case segs.fback:
			switch (stimulus.gotResp) {
				case -1: // incorrect
					upFix('#ff0000');
					upCorrectText();
					break;
				case 1: // incorrect
					upFix('#00ff00');
					upCorrectText();
					break;
				case 0:
					upFix('#000000');
					upCorrectText();
					break;
			}
			break;
	}

	return [task, myscreen];

}

function upCorrectText() {	
	if (stimulus.gotResp==-1) {
		upText('Wrong','#ff0000');
	} else if (stimulus.gotResp==1) {
		upText('Correct','#00ff00');
	} else if (stimulus.gotResp==0) {
		upText('Failed to Respond','#ffffff');
	}
}


function upNowRespondText() {	
	jglTextSet('Arial',1,'#ffff00',0,0);
	jglTextDraw('Respond Now',14 * - .25,-2.75);
	jglTextDraw('Press Space - or Do Nothing',27 * - .25,-1.75);
}

function upText(text, color) {
	jglTextSet('Arial',1,color,0,0);
	jglTextDraw(text,text.length * - .25,-1.75);

}

function upFix(color) {
	jglFixationCross(1,0.1,color,[0,0]);
}

function upDots(task,elapsed) {
	stimulus.dots = updateDots(task,stimulus.dots,elapsed);

	jglPoints2(stimulus.dots.x, stimulus.dots.y, 0.2, '#ffffff');
}

function updateDots(task,dots,elapsed) {

	// Check frequency? Not sure how to do this...
	freq_factor = 12*elapsed;

	// dots.x = add(dots.y,);

	// Flip dots back if they go too far
	for (var i=0;i<dots.R.length;i++) {
		if (dots.R[i] > dots.maxR && dots.holdx[i] > 0) {
			dots.holdx[i] = -dots.holdx[i];
		}
	}
	dots.holdx = add(dots.holdx,freq_factor);
	dots.R = sqrt(add(multiply(dots.holdx,dots.holdx),multiply(dots.holdy,dots.holdy)));
	dots.T = mod(add(atan2(dots.holdy,dots.holdx),Math.PI*2),Math.PI*2);

	// Update x, y

	dots.holdx =  multiply(dots.R,cos(mod(dots.T, Math.PI*2)));
	dots.holdy = multiply(dots.R,sin(mod(dots.T, Math.PI*2)));

	dots.x = multiply(dots.R,cos(mod(add(dots.T, stimulus.rot), Math.PI*2)));
	dots.y = multiply(dots.R,sin(mod(add(dots.T, stimulus.rot), Math.PI*2)));

	return(dots);
}

function myInitStimulus(task) {

	stimulus.dots = {};


	stimulus.dots.white = '#FFFFFF';

	stimulus.dots.minR = 0;
	stimulus.dots.maxR = 9
	stimulus.dots.minT = 0;
	stimulus.dots.maxT = Math.PI*2;
	stimulus.dots.n = 140;
	stimulus.dots.T = add(multiply(rand(task,stimulus.dots.n), (stimulus.dots.maxT-stimulus.dots.minT)),stimulus.dots.minT);
	stimulus.dots.R = add(multiply(rand(task,stimulus.dots.n), (stimulus.dots.maxR-stimulus.dots.minR)),stimulus.dots.minR);	
	stimulus.dots.holdx =  multiply(stimulus.dots.R,cos(mod(add(stimulus.dots.T, 0), Math.PI*2)));	
	stimulus.dots.holdy = multiply(stimulus.dots.R,sin(mod(add(stimulus.dots.T, 0), Math.PI*2)));

	stimulus.dots.x = multiply(stimulus.dots.R,cos(stimulus.dots.T));
	stimulus.dots.y = multiply(stimulus.dots.R,sin(stimulus.dots.T));
}
