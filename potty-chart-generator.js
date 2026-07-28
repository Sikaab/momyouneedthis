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





const childNameInput =
document.getElementById("childName");


const chartTheme =
document.getElementById("chartTheme");


const chartLength =
document.getElementById("chartLength");


const preview =
document.getElementById("pottyPreview");


const chartGrid =
document.getElementById("chartGrid");


const previewButton =
document.getElementById("previewButton");


const emailModal =
document.getElementById("emailModal");


const closeModal =
document.getElementById("closeModal");


const downloadButton =
document.getElementById("downloadButton");







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

subtitle:"Fill your sticker chart and become a big kid!"

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

subtitle:"Sparkles, smiles, and potty wins!"

},



space:{

icon:"🚀",

className:"theme-space",

title:"{name}'s Space Potty Mission",

subtitle:"Blast off toward big kid success!"

},



animals:{

icon:"🐻",

className:"theme-animals",

title:"{name}'s Animal Potty Adventure",

subtitle:"Little steps create big achievements!"

}


};









/* ===========================
   DAY NAMES
=========================== */


const days = [

"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
"Saturday",
"Sunday"

];







/* ===========================
   CREATE GRID
=========================== */


function createChartDays(numberOfDays){


chartGrid.innerHTML = "";



for(let i = 0; i < numberOfDays; i++){


let dayName =
days[i % 7];



const day =
document.createElement("div");



day.className =
"chart-day";



day.innerHTML = `

<strong>
${dayName}
</strong>


<div class="sticker-row">

<span></span>
<span></span>
<span></span>

</div>

`;



chartGrid.appendChild(day);


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





document.getElementById("themeIcon").innerHTML =
theme.icon;



document.getElementById("chartTitle").innerHTML =
theme.title.replace(
"{name}",
chartData.name
);



document.getElementById("chartSubtitle").innerHTML =
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
   EMAIL POPUP
=========================== */


previewButton.addEventListener(
"click",
()=>{


updatePreview();


emailModal.style.display =
"flex";


});






closeModal.addEventListener(
"click",
()=>{


emailModal.style.display =
"none";


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

backgroundColor:null

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





const pdf =
new jsPDF(
"portrait",
"mm",
"a4"
);





const width = 190;



const height =
(canvas.height * width)
/
canvas.width;





pdf.addImage(

image,

"PNG",

10,

10,

width,

height

);





pdf.save(

`${chartData.name}-potty-chart.pdf`

);





emailModal.style.display =
"none";



}

);








/* INITIAL LOAD */


updatePreview();