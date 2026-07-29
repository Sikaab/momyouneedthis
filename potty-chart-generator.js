/* =====================================
   POTTY TRAINING GENERATOR
   MomYouNeedThis
===================================== */


/* ===========================
   STATE
=========================== */


let selectedColor = "pink";


const chartData = {

    name:"Your Child",
    theme:"princess",
    days:7,
    color:"pink"

};





/* ===========================
   ELEMENTS
=========================== */


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

subtitle:"Fill your chart and become a big kid!"

},




dinosaur:{

icon:"🦖",

className:"theme-dinosaur",

title:"{name}'s Dinosaur Potty Quest",

subtitle:"Roar! Every success counts!"

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

subtitle:"Small steps create big wins!"

}


};









/* ===========================
   CREATE POTTY TABLE
=========================== */


function createChartDays(totalDays){


chartGrid.innerHTML = "";



chartGrid.className =
"chart-grid potty-table";





const table =
document.createElement("table");



table.className =
"potty-chart-table";







/* HEADER ROW */


const header =
document.createElement("tr");



let headerHTML =
`
<th class="empty-cell"></th>
`;



for(let i = 1; i <= totalDays; i++){


headerHTML +=
`

<th>
Day ${i}
</th>

`;

}



header.innerHTML =
headerHTML;



table.appendChild(header);








/* ACTIVITY ROWS */


const activities = [

{
icon:"🚽",
name:"Pee"
},

{
icon:"💩",
name:"Poop"
},

{
icon:"⭐",
name:"Tried"
}

];






activities.forEach(activity=>{


const row =
document.createElement("tr");



let html =

`

<td class="activity-label">

${activity.icon}
<span>
${activity.name}
</span>

</td>

`;





for(let i = 1; i <= totalDays; i++){


html +=

`

<td>

<div class="reward-circle">

</div>

</td>

`;



}



row.innerHTML =
html;



table.appendChild(row);



});






chartGrid.appendChild(table);



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







/* UPDATE PREVIEW STYLE */


preview.className =
`potty-preview ${theme.className}`;



preview.style.background =
color.background;



preview.style.borderColor =
color.border;







/* UPDATE TEXT */


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
   EMAIL MODAL
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






/*
Create a temporary clean printable
version so the PDF captures the
whole chart instead of cutting it.
*/


const canvas =
await html2canvas(
preview,
{

scale:2,

backgroundColor:"#ffffff",

useCORS:true,

windowWidth:1200

}

);





const image =
canvas.toDataURL(
"image/png"
);






const {
jsPDF
}
=
window.jspdf;






const pdf =
new jsPDF(
{

orientation:"portrait",

unit:"mm",

format:"a4"

}

);







const pageWidth = 190;


const pageHeight = 277;




let imageHeight =
(canvas.height * pageWidth)
/
canvas.width;






/*
If chart is too tall,
fit it on the page
*/


if(imageHeight > pageHeight){

imageHeight = pageHeight;

}





pdf.addImage(

image,

"PNG",

10,

10,

pageWidth,

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


updatePreview();