// =====================================
// BABY SLEEP TRACKER
// MomYouNeedThis
// =====================================


const sleepData = {

// Wake ranges match the "Wake windows by age" table on this page
// (single source of truth). naps = typical naps/day, daySleep =
// typical total daytime sleep in minutes — used for the bedtime estimate.

0:{
label:"Newborn",
wake:[45,60],
total:"14-17 hours",
naps:5,
daySleep:480
},

2:{
label:"2 months",
wake:[60,90],
total:"14-17 hours",
naps:4,
daySleep:420
},

4:{
label:"4 months",
wake:[90,120],
total:"12-16 hours",
naps:3,
daySleep:360
},

6:{
label:"6 months",
wake:[120,150],
total:"12-16 hours",
naps:3,
daySleep:270
},

8:{
label:"8 months",
wake:[150,210],
total:"12-16 hours",
naps:2,
daySleep:180
},

10:{
label:"10 months",
wake:[180,240],
total:"11-14 hours",
naps:2,
daySleep:150
},

12:{
label:"12 months",
wake:[180,240],
total:"11-14 hours",
naps:2,
daySleep:150
},

18:{
label:"18 months",
wake:[240,330],
total:"11-14 hours",
naps:1,
daySleep:120
},

24:{
label:"2 years",
wake:[300,360],
total:"11-14 hours",
naps:1,
daySleep:90
},

36:{
label:"3 years",
wake:[360,420],
total:"10-13 hours",
naps:0,
daySleep:45
}

};





const ageInput =
document.getElementById("babyAge");


const wakeInput =
document.getElementById("wakeTime");


const napList =
document.getElementById("napList");


const addNapButton =
document.getElementById("addNap");


const saveButton =
document.getElementById("saveDay");


const timeline =
document.getElementById("sleepTimeline");


const nextSleep =
document.getElementById("nextSleepTime");


const wakeText =
document.getElementById("wakeWindowText");


const bedtime =
document.getElementById("bedtimeResult");


const bedtimeDetail =
document.getElementById("bedtimeDetail");


const wakeWindowDetail =
document.getElementById("wakeWindowDetail");


const noNapNote =
document.getElementById("noNapNote");


const napWarnings =
document.getElementById("napWarnings");


const wwResetButton =
document.getElementById("wwReset");





let naps=[];


// User tweak to the wake window midpoint, in minutes.
// Lets moms adjust for babies who run short or long.

let wwAdjust=0;





// ================================
// TIME HELPERS
// ================================


const DEFAULT_WAKE = "07:00";


function toMinutes(time){

if(!time || typeof time !== "string")
return null;

let p=time.split(":");

if(p.length < 2)
return null;

let h=Number(p[0]);
let m=Number(p[1]);

if(!Number.isFinite(h) || !Number.isFinite(m))
return null;

return h*60 + m;

}


// Morning wake time in minutes, falling back to the default
// so a cleared field never produces NaN results.

function wakeMinutes(){

let v=toMinutes(wakeInput.value);

return v===null ? toMinutes(DEFAULT_WAKE) : v;

}



function formatTime(minutes){

if(minutes===null || minutes===undefined || !Number.isFinite(minutes))
return "—";

minutes = ((minutes % 1440) + 1440) % 1440;


let h=Math.floor(minutes/60);

let m=minutes%60;


let suffix=h>=12?"PM":"AM";


h=h%12;

if(h===0)
h=12;


return `${h}:${String(m).padStart(2,"0")} ${suffix}`;

}


// True when a computed time rolls past midnight.

function isNextDay(minutes){

return Number.isFinite(minutes) && minutes >= 1440;

}


// Appends " (tomorrow)" to post-midnight results.

function formatTimeWithDay(minutes){

let t=formatTime(minutes);

if(t==="—")
return t;

return isNextDay(minutes) ? t+" (tomorrow)" : t;

}




function formatDuration(minutes){

if(minutes===null || minutes===undefined || !Number.isFinite(minutes))
return "—";

minutes=Math.round(minutes);

if(minutes>=60){

let h=Math.floor(minutes/60);
let m=minutes%60;

return m ? `${h}h ${m}m` : `${h}h`;

}

return `${minutes} min`;

}


// Short range label, e.g. 150 -> "2.5h", 45 -> "45m"

function fmtShort(minutes){

if(minutes>=60){

let h=minutes/60;

return (Number.isInteger(h) ? h : h.toFixed(1))+"h";

}

return minutes+"m";

}






// ================================
// WAKE WINDOW
// ================================


function getWakeWindow(){

let data=sleepData[ageInput.value];

return Math.round(
(data.wake[0]+data.wake[1])/2
) + wwAdjust;

}


function getWakeWindowMidpoint(){

let data=sleepData[ageInput.value];

return Math.round(
(data.wake[0]+data.wake[1])/2
);

}





// ================================
// ADD NAP
// ================================


// Renumber nap headings so they stay sequential after a removal.

function renumberNaps(){

document.querySelectorAll(".nap-row").forEach((row,i)=>{

let h=row.querySelector("h3");

if(h)
h.textContent=`😴 Nap ${i+1}`;

});

}


// Duration for one nap row, honoring the custom-minutes field.

function getRowDuration(row){

let sel=row.querySelector(".nap-length");

if(!sel)
return 30;

if(sel.value==="custom"){

let custom=row.querySelector(".nap-custom");

let v=custom ? Number(custom.value) : NaN;

if(Number.isFinite(v) && v>0)
return Math.min(600,Math.round(v));

return 30;

}

return Number(sel.value) || 30;

}


let napCounter=0;


addNapButton.addEventListener(
"click",
()=>{


napCounter++;


let index=
document.querySelectorAll(".nap-row").length+1;


let startId="napStart"+napCounter;

let lengthId="napLength"+napCounter;

let customId="napCustom"+napCounter;


let div=document.createElement("div");

div.className="nap-row";


div.innerHTML=`

<h3>
😴 Nap ${index}
</h3>


<label for="${startId}">
Start Time
</label>


<input
type="time"
id="${startId}"
class="nap-start">


<label for="${lengthId}">
Duration
</label>


<select
id="${lengthId}"
class="nap-length">

<option value="30">
30 minutes
</option>

<option value="45">
45 minutes
</option>

<option value="60">
1 hour
</option>

<option value="90">
1.5 hours
</option>

<option value="120">
2 hours
</option>

<option value="custom">
Custom…
</option>

</select>


<input
type="number"
id="${customId}"
class="nap-custom"
min="5"
max="600"
placeholder="Minutes"
style="display:none"
aria-label="Custom nap length in minutes">


<button class="remove-nap">
Remove
</button>

`;



napList.appendChild(div);



div.querySelector(".remove-nap")
.addEventListener(
"click",
()=>{

div.remove();

renumberNaps();

updateTracker();

});


let lengthSelect=
div.querySelector(".nap-length");

let customInput=
div.querySelector(".nap-custom");


lengthSelect.addEventListener(
"change",
()=>{

customInput.style.display =
lengthSelect.value==="custom" ? "" : "none";

updateTracker();

});


customInput.addEventListener(
"input",
updateTracker
);


div.querySelector(".nap-start")
.addEventListener(
"change",
updateTracker
);


updateTracker();


});








// ================================
// CALCULATIONS
// ================================


function collectNaps(){


let rows=document.querySelectorAll(".nap-row");


naps=[];


rows.forEach(row=>{


let start =
row.querySelector(".nap-start").value;


let duration =
getRowDuration(row);



if(start){

naps.push({

start:start,

minutes:duration

});

}


});


}


// Chronological end of the last nap — not just the last row,
// so naps logged out of order still produce the right time.

function lastNapEnd(){

if(!naps.length)
return null;

let latest=null;

naps.forEach(n=>{

let s=toMinutes(n.start);

if(s===null)
return;

let end=s+n.minutes;

if(latest===null || end>latest)
latest=end;

});

return latest;

}


// Warnings for impossible nap input (shown, never silent).

function validateNaps(){

let warnings=[];

let wake=wakeMinutes();

let intervals=naps
.map(n=>{

let s=toMinutes(n.start);

if(s===null)
return null;

return {start:s, end:s+n.minutes};

})
.filter(Boolean);


intervals.forEach(iv=>{

if(iv.start < wake){

warnings.push(
`Nap at ${formatTime(iv.start)} starts before wake time (${formatTime(wake)}).`
);

}

});


let sorted=intervals.slice().sort((a,b)=>a.start-b.start);

for(let i=1;i<sorted.length;i++){

if(sorted[i].start < sorted[i-1].end){

warnings.push(
`Naps at ${formatTime(sorted[i-1].start)} and ${formatTime(sorted[i].start)} overlap.`
);

break;

}

}


return warnings;

}






function calculateNextSleep(){


let lastSleep=lastNapEnd();


if(lastSleep===null)
lastSleep=wakeMinutes();



return lastSleep + getWakeWindow();

}




// A real bedtime estimate, independent of today's logged naps:
// morning wake + one wake window per typical sleep period
// + typical daytime sleep for this age.

function calculateBedtime(){

let data=sleepData[ageInput.value];

let mid=getWakeWindowMidpoint()+wwAdjust;

let windows=data.naps===0 ? 2 : data.naps+1;

return wakeMinutes() + windows*mid + data.daySleep;

}








// ================================
// RENDER
// ================================


function renderTimeline(){


timeline.innerHTML="";


timeline.innerHTML += `

<div class="timeline-item">

<div class="timeline-icon">
☀️
</div>

<div class="timeline-content">

<strong>
Wake Up
</strong>

<span>
${formatTime(wakeMinutes())}
</span>

</div>

</div>

`;



naps.forEach((nap,index)=>{


timeline.innerHTML += `

<div class="timeline-item">


<div class="timeline-icon">
😴
</div>


<div class="timeline-content">


<strong>
Nap ${index+1}
</strong>


<span>

${formatTime(toMinutes(nap.start))}
•
${formatDuration(nap.minutes)}

</span>


</div>


</div>

`;



});



}








function updateTracker(){


collectNaps();



let data=sleepData[ageInput.value];


let mid=getWakeWindowMidpoint();

let used=mid+wwAdjust;


wakeText.textContent =
`Recommended wake window: ${data.wake[0]}-${data.wake[1]} minutes`;


// Show the working: which value the time is based on.

wakeWindowDetail.textContent =
`Using ~${formatDuration(used)} (midpoint of ${fmtShort(data.wake[0])}–${fmtShort(data.wake[1])})` +
(wwAdjust ? `, adjusted ${wwAdjust>0 ? "+" : ""}${wwAdjust}m for your baby` : "");


wwResetButton.hidden = (wwAdjust===0);



// No-nap ages: don't present a sweet spot time.

let noNap = data.naps===0;

noNapNote.hidden = !noNap;


if(noNap){

nextSleep.textContent="—";

}
else{

let ns=calculateNextSleep();

nextSleep.textContent=formatTimeWithDay(ns);

}



let bt=calculateBedtime();

bedtime.textContent=formatTimeWithDay(bt);


let windows=data.naps===0 ? 2 : data.naps+1;

bedtimeDetail.textContent =
`Based on ~${windows} wake windows of ${formatDuration(used)} + ~${formatDuration(data.daySleep)} of day sleep — a typical day for this age.`;


bedtimeExplanation.textContent =
"Typical bedtime for this age — estimated from usual naps and wake windows, not today's log.";



document.getElementById("summaryAge")
.textContent=data.label;



document.getElementById("summaryWake")
.textContent=formatTime(wakeMinutes());



let total=0;


naps.forEach(n=>{

total+=n.minutes;

});


document.getElementById("summaryDaySleep")
.textContent=formatDuration(total);



// Nap input warnings.

let warnings=validateNaps();

napWarnings.innerHTML="";

warnings.forEach(w=>{

let p=document.createElement("p");

p.textContent="⚠️ "+w;

napWarnings.appendChild(p);

});



renderTimeline();



}





// ================================
// SAVE
// ================================


saveButton.addEventListener(
"click",
()=>{


localStorage.setItem(

"momSleepTracker",

JSON.stringify({

age:ageInput.value,

wake:wakeInput.value,

naps:naps

})

);


saveButton.textContent=
"✅ Saved";


setTimeout(()=>{

saveButton.textContent=
"💾 Save Today's Sleep";

},2000);



});







// ================================
// EVENTS
// ================================


// Wake window ± adjuster: tweak the midpoint for babies
// who run shorter or longer than typical.

document.getElementById("wwMinus").addEventListener(
"click",
()=>{

wwAdjust=Math.max(-90, wwAdjust-15);

updateTracker();

});


document.getElementById("wwPlus").addEventListener(
"click",
()=>{

wwAdjust=Math.min(90, wwAdjust+15);

updateTracker();

});


wwResetButton.addEventListener(
"click",
()=>{

wwAdjust=0;

updateTracker();

});



ageInput.addEventListener(
"change",
updateTracker
);



wakeInput.addEventListener(
"change",
updateTracker
);







// ================================
// LOAD
// ================================


window.addEventListener(
"DOMContentLoaded",
()=>{


let saved =
localStorage.getItem(
"momSleepTracker"
);



if(saved){


let data=JSON.parse(saved);


ageInput.value=data.age;

wakeInput.value=data.wake;


data.naps.forEach(n=>{


addNapButton.click();


let rows=
document.querySelectorAll(".nap-row");


let row=
rows[rows.length-1];


row.querySelector(".nap-start").value=n.start;


let lengthSelect=
row.querySelector(".nap-length");


let presets=["30","45","60","90","120"];


if(presets.includes(String(n.minutes))){

lengthSelect.value=n.minutes;

}
else{

lengthSelect.value="custom";

let customInput=
row.querySelector(".nap-custom");

customInput.style.display="";

customInput.value=n.minutes;

}


});


}


updateTracker();


});