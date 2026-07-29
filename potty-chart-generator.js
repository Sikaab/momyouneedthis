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
 CREATE CHART
=========================== */


function createChartDays(totalDays){


chartGrid.innerHTML="";



let sections = Math.ceil(totalDays / 7);



for(let section=0; section < sections; section++){


let startDay =
(section * 7) + 1;


let endDay =
Math.min(startDay + 6,totalDays);



let days=[];



for(let i=startDay;i<=endDay;i++){

days.push(i);

}





const table =
document.createElement("div");


table.className =
"week-chart";





table.innerHTML = `


<div class="corner-cell"></div>


${days.map(day=>`

<div class="day-header">
Day ${day}
</div>

`).join("")}




<div class="activity-label">
🚽 Pee
</div>


${days.map(()=>`

<div class="stamp-box">
<span>⭐</span>
</div>

`).join("")}






<div class="activity-label">
💩 Poop
</div>


${days.map(()=>`

<div class="stamp-box">
<span>⭐</span>
</div>

`).join("")}





<div class="activity-label">
⭐ Tried
</div>


${days.map(()=>`

<div class="stamp-box">
<span>⭐</span>
</div>

`).join("")}



`;



chartGrid.appendChild(table);



}


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





preview.className =
`potty-preview ${theme.className}`;





preview.style.background =
color.background;



preview.style.borderColor =
color.border;





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




const canvas =
await html2canvas(
preview,
{

scale:2,

backgroundColor:"#ffffff",

useCORS:true

}

);





const image =
canvas.toDataURL(
"image/png"
);





const {
jsPDF
} =
window.jspdf;




const landscape =
chartData.days > 7;





const pdf =
new jsPDF({

orientation:
landscape ? "landscape":"portrait",

unit:"mm",

format:"a4"

});






let width =
landscape ? 277 : 190;



let height =
(canvas.height * width)
/
canvas.width;





let maxHeight =
landscape ? 190 : 277;




if(height > maxHeight){


height=maxHeight;


width =
(canvas.width * height)
/
canvas.height;


}






pdf.addImage(

image,

"PNG",

(landscape?277:210-width)/2,

10,

width,

height

);





pdf.save(
`${chartData.name}-potty-chart.pdf`
);



emailModal.style.display="none";


});







/* ===========================
 INITIALIZE
=========================== */


updatePreview();