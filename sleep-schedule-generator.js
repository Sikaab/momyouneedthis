// =====================================
// BABY SLEEP TRACKER
// MomYouNeedThis
// =====================================


const sleepData = {

0:{
label:"Newborn",
wake:[45,60],
total:"14-17 hours"
},

2:{
label:"2 months",
wake:[60,90],
total:"14-17 hours"
},

4:{
label:"4 months",
wake:[90,120],
total:"12-16 hours"
},

6:{
label:"6 months",
wake:[135,165],
total:"12-16 hours"
},

8:{
label:"8 months",
wake:[150,195],
total:"12-16 hours"
},

10:{
label:"10 months",
wake:[180,225],
total:"12-16 hours"
},

12:{
label:"12 months",
wake:[180,240],
total:"11-14 hours"
},

18:{
label:"18 months",
wake:[240,330],
total:"11-14 hours"
},

24:{
label:"2 years",
wake:[300,390],
total:"11-14 hours"
},

36:{
label:"3 years",
wake:[330,420],
total:"10-13 hours"
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


const bedtimeExplanation =
document.getElementById("bedtimeExplanation");





let naps=[];





// ================================
// TIME HELPERS
// ================================


function toMinutes(time){

let p=time.split(":");

return Number(p[0])*60 + Number(p[1]);

}



function formatTime(minutes){

minutes = minutes % 1440;


let h=Math.floor(minutes/60);

let m=minutes%60;


let suffix=h>=12?"PM":"AM";


h=h%12;

if(h===0)
h=12;


return `${h}:${String(m).padStart(2,"0")} ${suffix}`;

}




function formatDuration(minutes){

if(minutes>=60){

return `${Math.floor(minutes/60)}h ${minutes%60 || ""}`;

}

return `${minutes} min`;

}






// ================================
// WAKE WINDOW
// ================================


function getWakeWindow(){

let data=sleepData[ageInput.value];

return Math.round(
(data.wake[0]+data.wake[1])/2
);

}





// ================================
// ADD NAP
// ================================


addNapButton.addEventListener(
"click",
()=>{


let index=naps.length+1;


let div=document.createElement("div");

div.className="nap-row";


div.innerHTML=`

<h3>
😴 Nap ${index}
</h3>


<label>
Start Time
</label>


<input type="time" class="nap-start">


<label>
Duration
</label>


<select class="nap-length">

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

</select>


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

updateTracker();

});


div.querySelectorAll("input,select")
.forEach(input=>{

input.addEventListener(
"change",
updateTracker
);

});


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
Number(
row.querySelector(".nap-length").value
);



if(start){

naps.push({

start:start,

minutes:duration

});

}


});


}






function calculateNextSleep(){


let lastSleep;


if(naps.length){

let last=naps[naps.length-1];


lastSleep =
toMinutes(last.start)
+
last.minutes;


}
else{


lastSleep =
toMinutes(wakeInput.value);


}



let next =
lastSleep + getWakeWindow();


return next;


}







function calculateBedtime(){


let lastWake;


if(naps.length){

let last=naps[naps.length-1];

lastWake =
toMinutes(last.start)
+
last.minutes;

}

else{

lastWake=
toMinutes(wakeInput.value);

}



return lastWake + getWakeWindow();

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
${formatTime(toMinutes(wakeInput.value))}
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


wakeText.textContent =
`Recommended wake window: ${data.wake[0]}-${data.wake[1]} minutes`;



nextSleep.textContent =
formatTime(
calculateNextSleep()
);



bedtime.textContent =
formatTime(
calculateBedtime()
);



bedtimeExplanation.textContent =
"Adjusted using today's naps and your baby's age-based wake window.";



document.getElementById("summaryAge")
.textContent=data.label;



document.getElementById("summaryWake")
.textContent=formatTime(
toMinutes(wakeInput.value)
);



let total=0;


naps.forEach(n=>{

total+=n.minutes;

});


document.getElementById("summaryDaySleep")
.textContent=formatDuration(total);



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


row.querySelector(".nap-length").value=n.minutes;


});


}


updateTracker();


});