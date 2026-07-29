/* =====================================
   POTTY TRAINING GENERATOR
   MomYouNeedThis
===================================== */


let selectedColor = "pink";


const chartData = {
    name:"Your Child",
    theme:"princess",
    days:7,
    color:"pink"
};



const childNameInput = document.getElementById("childName");
const chartTheme = document.getElementById("chartTheme");
const chartLength = document.getElementById("chartLength");

const preview = document.getElementById("pottyPreview");
const chartGrid = document.getElementById("chartGrid");

const previewButton = document.getElementById("previewButton");

const emailModal = document.getElementById("emailModal");
const closeModal = document.getElementById("closeModal");

const downloadButton = document.getElementById("downloadButton");





/* ===========================
 COLORS
=========================== */


const colors = {

pink:{
background:"#fff0f7",
border:"#ff9fc9"
},

purple:{
background:"#f8efff",
border:"#d59cff"
},

blue:{
background:"#eef3ff",
border:"#8aa9ff"
},

green:{
background:"#efffe8",
border:"#8bd66a"
}

};







/* ===========================
 THEMES
=========================== */


const themes = {

princess:{
icon:"👑",
className:"theme-princess",
title:"{name}'s Princess Potty Adventure",
subtitle:"Fill your chart and become a big kid!"
},


dinosaur:{
icon:"🦖",
className:"theme-dinosaur",
title:"{name}'s Dinosaur Potty Quest",
subtitle:"Roar! Every success is amazing!"
},


unicorn:{
icon:"🦄",
className:"theme-unicorn",
title:"{name}'s Magical Unicorn Journey",
subtitle:"Sparkles and potty wins!"
},


space:{
icon:"🚀",
className:"theme-space",
title:"{name}'s Space Potty Mission",
subtitle:"Blast off toward success!"
},


animals:{
icon:"🐻",
className:"theme-animals",
title:"{name}'s Animal Potty Adventure",
subtitle:"Little steps create big achievements!"
}


};






/* ===========================
 CREATE CHART TABLE
=========================== */


function createChartDays(days){


chartGrid.innerHTML="";



if(days === 30){

createThirtyDayChart();

return;

}




let startDay = 1;



for(let week=0; week < days/7; week++){


const table = document.createElement("div");

table.className="week-chart";



table.innerHTML = `

<div class="activity-cell"></div>

${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
.map(day=>`<div class="day-header">${day}</div>`).join("")}



<div class="activity-label">🚽 Pee</div>
${Array(7).fill("").map(()=>`
<div class="check-box"></div>
`).join("")}



<div class="activity-label">💩 Poop</div>
${Array(7).fill("").map(()=>`
<div class="check-box"></div>
`).join("")}



<div class="activity-label">⭐ Tried</div>
${Array(7).fill("").map(()=>`
<div class="check-box"></div>
`).join("")}


`;



chartGrid.appendChild(table);


}


}







function createThirtyDayChart(){


const calendar =
document.createElement("div");


calendar.className="month-chart";



for(let i=1;i<=30;i++){


const day=document.createElement("div");


day.className="month-day";


day.innerHTML=`

<strong>
Day ${i}
</strong>


<div>
🚽 ☐
</div>


<div>
💩 ☐
</div>


<div>
⭐ ☐
</div>


`;


calendar.appendChild(day);


}



chartGrid.appendChild(calendar);


}

/* ===========================
   UPDATE PREVIEW
=========================== */


function updatePreview(){


chartData.name =
childNameInput.value.trim() || "Your Child";



chartData.theme =
chartTheme.value;



chartData.days =
Number(chartLength.value);



chartData.color =
selectedColor;





const theme =
themes[chartData.theme];



const color =
colors[selectedColor];





/* UPDATE MAIN PREVIEW */


preview.className =
`potty-preview ${theme.className}`;





preview.style.background =
color.background;



preview.style.borderColor =
color.border;






/* TITLE */


document.getElementById("themeIcon")
.textContent =
theme.icon;





document.getElementById("chartTitle")
.textContent =
theme.title.replace(
"{name}",
chartData.name
);






document.getElementById("chartSubtitle")
.textContent =
theme.subtitle;






/* CHANGE PRINT ORIENTATION CLASS */


preview.classList.remove(
"portrait-chart",
"landscape-chart"
);



if(chartData.days === 7){

preview.classList.add(
"portrait-chart"
);

}

else{

preview.classList.add(
"landscape-chart"
);

}






/* CREATE TABLE */


createChartDays(
chartData.days
);



}








/* ===========================
   EVENTS
=========================== */


childNameInput.addEventListener(
"input",
updatePreview
);



chartTheme.addEventListener(
"change",
updatePreview
);



chartLength.addEventListener(
"change",
updatePreview
);







/* COLORS */


document
.querySelectorAll(".color-choice")
.forEach(button=>{


button.addEventListener(
"click",
()=>{


selectedColor =
button.dataset.color;



updatePreview();


});


});








/* ===========================
   MODAL
=========================== */


previewButton.addEventListener(
"click",
()=>{


updatePreview();


emailModal.style.display="flex";


});





closeModal.addEventListener(
"click",
()=>{


emailModal.style.display="none";


});





/* CLOSE MODAL OUTSIDE */


window.addEventListener(
"click",
(e)=>{


if(e.target === emailModal){

emailModal.style.display="none";

}


});

 
/* ===========================
   PDF DOWNLOAD
=========================== */


downloadButton.addEventListener(
"click",
async()=>{


const email =
document.getElementById("emailInput").value;



if(!email){


alert(
"Please enter your email first."
);


return;

}





/*
   Temporarily remove preview limitations
   so the whole chart is captured
*/


const oldOverflow =
preview.style.overflow;



preview.style.overflow =
"visible";





const canvas =
await html2canvas(
preview,
{

scale:2,

backgroundColor:"#ffffff",

useCORS:true,

scrollX:0,

scrollY:-window.scrollY

}

);





preview.style.overflow =
oldOverflow;







const image =
canvas.toDataURL(
"image/png"
);






const {
jsPDF
} =
window.jspdf;





/*
   7 DAYS = PORTRAIT
   14/30 DAYS = LANDSCAPE
*/


let orientation =
chartData.days === 7
?
"portrait"
:
"landscape";





const pdf =
new jsPDF({

orientation:orientation,

unit:"mm",

format:"a4"

});







let pageWidth;
let pageHeight;



if(orientation==="portrait"){


pageWidth = 190;

pageHeight = 277;


}

else{


pageWidth = 277;

pageHeight = 190;


}







let imageWidth =
pageWidth;



let imageHeight =
(canvas.height * imageWidth)
/
canvas.width;






/*
   Scale down if too tall
*/


if(imageHeight > pageHeight){


imageHeight = pageHeight;


imageWidth =
(canvas.width * imageHeight)
/
canvas.height;


}








const x =
(pageWidth-imageWidth)/2;



const y =
(pageHeight-imageHeight)/2;








pdf.addImage(

image,

"PNG",

x,

y,

imageWidth,

imageHeight

);







pdf.save(

`${chartData.name}-potty-chart.pdf`

);





emailModal.style.display =
"none";



}

);








/* ===========================
   INITIAL LOAD
=========================== */


document.addEventListener(
"DOMContentLoaded",
()=>{


updatePreview();


});