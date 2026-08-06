// =====================================
// BABY SLEEP SCHEDULE GENERATOR
// MomYouNeedThis
// =====================================


/*
Evidence-informed averages based on
common pediatric sleep recommendations.

These are starting points, not medical rules.
Every baby is different.
*/


const sleepData = {


0:{
    label:"Newborn",
    naps:"variable",
    wakeWindows:[45,60],
    totalSleep:"14-17 hours"
},


2:{
    label:"2 months",
    naps:5,
    wakeWindows:[60,90],
    totalSleep:"14-17 hours"
},


4:{
    label:"4 months",
    naps:4,
    wakeWindows:[90,120],
    totalSleep:"12-16 hours"
},


6:{
    label:"6 months",
    naps:3,
    wakeWindows:[135,165],
    totalSleep:"12-16 hours"
},


8:{
    label:"8 months",
    naps:3,
    wakeWindows:[150,195],
    totalSleep:"12-16 hours"
},


10:{
    label:"10 months",
    naps:2,
    wakeWindows:[180,225],
    totalSleep:"12-16 hours"
},


12:{
    label:"12 months",
    naps:2,
    wakeWindows:[180,240],
    totalSleep:"11-14 hours"
},


18:{
    label:"18 months",
    naps:1,
    wakeWindows:[240,330],
    totalSleep:"11-14 hours"
},


24:{
    label:"2 years",
    naps:1,
    wakeWindows:[300,390],
    totalSleep:"11-14 hours"
},


36:{
    label:"3 years",
    naps:"optional",
    wakeWindows:[330,420],
    totalSleep:"10-13 hours"
}


};





// =====================================
// ELEMENTS
// =====================================


const ageInput =
document.getElementById("babyAge");


const wakeInput =
document.getElementById("wakeTime");


const napInput =
document.getElementById("napCount");


const generateButton =
document.getElementById("generateSchedule");


const timeline =
document.getElementById("sleepTimeline");


const bedtimeResult =
document.getElementById("bedtimeResult");


const bedtimeExplanation =
document.getElementById("bedtimeExplanation");


const savedMessage =
document.getElementById("savedMessage");





// =====================================
// TIME HELPERS
// =====================================



function timeToMinutes(time){


const parts =
time.split(":");


return (
parseInt(parts[0]) * 60
+
parseInt(parts[1])
);


}





function minutesToTime(minutes){


minutes =
minutes % 1440;


let hours =
Math.floor(minutes / 60);


let mins =
minutes % 60;



let suffix =
hours >= 12 ? "PM":"AM";



hours =
hours % 12;


if(hours===0)
hours=12;



return `${hours}:${String(mins).padStart(2,"0")} ${suffix}`;


}






function addMinutes(time, amount){


return minutesToTime(
timeToMinutes(time)+amount
);


}





// =====================================
// WAKE WINDOW CALCULATION
// =====================================



function getWakeWindow(age){


const data =
sleepData[age];


const min =
data.wakeWindows[0];


const max =
data.wakeWindows[1];


return Math.round(
(min+max)/2
);


}






// =====================================
// NAP COUNT LOGIC
// =====================================


function getRecommendedNapCount(age){


const naps =
sleepData[age].naps;


if(typeof naps === "number")
return naps;


return 3;


}






// =====================================
// STORAGE
// =====================================


function saveSchedule(data){


localStorage.setItem(
"momYouNeedThisSleepSchedule",
JSON.stringify(data)
);


savedMessage.style.display="block";


setTimeout(()=>{


savedMessage.style.display="none";


},3000);


}





function loadSavedSchedule(){


const saved =
localStorage.getItem(
"momYouNeedThisSleepSchedule"
);


if(!saved)
return null;


return JSON.parse(saved);


}

// =====================================
// CREATE BASE SCHEDULE
// =====================================


function createSchedule(){


const age =
ageInput.value;


const wake =
wakeInput.value;


const baby =
sleepData[age];



let napCount;


if(napInput.value==="auto"){

    napCount =
    getRecommendedNapCount(age);

}
else{

    napCount =
    Number(napInput.value);

}



const wakeWindow =
getWakeWindow(age);



let schedule = [];


schedule.push({

type:"wake",

icon:"☀️",

title:"Wake Up",

time:minutesToTime(
timeToMinutes(wake)
)

});




let currentTime =
timeToMinutes(wake);





// Create naps


for(let i=1;i<=napCount;i++){



currentTime += wakeWindow;



schedule.push({

type:"nap",

icon:"😴",

title:`Nap ${i}`,

time:minutesToTime(currentTime),

duration:
getDefaultNapLength(age,i)

});



currentTime +=
getDefaultNapLength(age,i);



}





// Bedtime calculation


let bedtime =
calculateBedtime(
currentTime,
age
);



schedule.push({

type:"bed",

icon:"🌙",

title:"Bedtime",

time:minutesToTime(bedtime)

});





return {


age:age,

baby:baby.label,

wake:wake,

schedule:schedule,

bedtime:minutesToTime(bedtime)


};



}






// =====================================
// DEFAULT NAP LENGTH
// =====================================


function getDefaultNapLength(age,index){


if(age<=4)
return 60;


if(age<=8){

if(index===1)
return 75;

return 60;

}



if(age<=12){

return 75;

}



return 90;


}






// =====================================
// BEDTIME CALCULATION
// =====================================


function calculateBedtime(lastSleepTime,age){



const data =
sleepData[age];


let finalWakeWindow =
data.wakeWindows[1];



// younger babies get shorter final wake time

if(age<=6){

finalWakeWindow =
data.wakeWindows[0];

}




return lastSleepTime + finalWakeWindow;



}







// =====================================
// RENDER TIMELINE
// =====================================



function renderTimeline(data){


timeline.innerHTML="";



data.schedule.forEach(item=>{



const card =
document.createElement("div");


card.className =
"timeline-item";



card.innerHTML = `

<div class="timeline-icon">

${item.icon}

</div>


<div class="timeline-content">


<strong>

${item.title}

</strong>


<span>

${item.time}

${item.duration ? 
" • "+formatDuration(item.duration)
:""}

</span>


</div>

`;



timeline.appendChild(card);



});



}





// =====================================
// FORMAT DURATION
// =====================================


function formatDuration(minutes){


if(minutes>=60){


let hours =
Math.floor(minutes/60);


let mins =
minutes % 60;



if(mins===0)

return `${hours} hour${hours>1?"s":""}`;



return `${hours}h ${mins}m`;



}



return `${minutes} minutes`;

}





// =====================================
// SLEEP SCORE
// =====================================


function calculateSleepScore(data){



let score = 5;



const naps =
data.schedule.filter(
item=>item.type==="nap"
).length;



if(naps===0)
score--;



if(data.schedule.length < 3)
score--;



return Math.max(
1,
Math.min(score,5)
);



}




function renderSleepScore(data){



const score =
calculateSleepScore(data);



const stars =
"⭐".repeat(score);



document.querySelector(".sleep-score")
.innerHTML = `


<div>

${stars}

</div>


<strong>

${score===5?
"Great Sleep Balance":
"Good Starting Point"}

</strong>


<span>

This schedule is based on age, wake windows and average sleep needs.

</span>


`;



}

// =====================================
// NAP ADJUSTMENT LOGIC
// =====================================


function getActualNapSleep(){


const durations =
document.querySelectorAll(".nap-duration");


let total = 0;


durations.forEach(select=>{


total += Number(select.value);


});


return total;


}






function adjustBedtimeForNaps(baseBedtime){


const napSleep =
getActualNapSleep();



let adjustment = 0;



// Short daytime sleep = earlier bedtime

if(napSleep < 60){

adjustment = -45;

}


else if(napSleep < 120){

adjustment = -25;

}


else if(napSleep > 240){

adjustment = 15;

}



return baseBedtime + adjustment;


}







// =====================================
// UPDATE BEDTIME DISPLAY
// =====================================


function updateBedtime(data){



let bedtime =
timeToMinutes(
data.bedtime
);



bedtime =
adjustBedtimeForNaps(
bedtime
);



bedtimeResult.textContent =
minutesToTime(bedtime);



const napSleep =
getActualNapSleep();



if(napSleep < 120){


bedtimeExplanation.textContent =
"Today's naps were shorter than average. An earlier bedtime may help prevent overtiredness.";

}


else if(napSleep > 240){


bedtimeExplanation.textContent =
"Your baby had a lot of daytime sleep. Bedtime may naturally move slightly later.";

}


else{


bedtimeExplanation.textContent =
"Your baby's schedule is balanced based on today's sleep.";

}



}








// =====================================
// UPDATE SUMMARY
// =====================================


function updateSummary(data){



document.getElementById(
"summaryAge"
).textContent =
data.baby;



document.getElementById(
"summaryWake"
).textContent =
minutesToTime(
timeToMinutes(data.wake)
);



document.getElementById(
"summaryTotal"
).textContent =
sleepData[data.age].totalSleep;



}







// =====================================
// MAIN GENERATE FUNCTION
// =====================================


function generate(){



const schedule =
createSchedule();



renderTimeline(schedule);


renderSleepScore(schedule);


updateSummary(schedule);


updateBedtime(schedule);



saveSchedule(schedule);



}







// =====================================
// EVENTS
// =====================================



generateButton.addEventListener(
"click",
generate
);




ageInput.addEventListener(
"change",
generate
);



wakeInput.addEventListener(
"change",
generate
);



napInput.addEventListener(
"change",
generate
);





document.querySelectorAll(".nap-duration")
.forEach(input=>{


input.addEventListener(
"change",
()=>{


const schedule =
createSchedule();


updateBedtime(schedule);


saveSchedule(schedule);


});



});







// =====================================
// LOAD PREVIOUS USER DATA
// =====================================



window.addEventListener(
"DOMContentLoaded",
()=>{



const saved =
loadSavedSchedule();



if(saved){



renderTimeline(saved);


renderSleepScore(saved);


updateSummary(saved);


updateBedtime(saved);



}



else{


generate();



}



});