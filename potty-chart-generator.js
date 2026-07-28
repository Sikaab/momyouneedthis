/* =====================================
   POTTY TRAINING GENERATOR
   MomYouNeedThis
===================================== */


let selectedColor = "pink";


let chartData = {

    name:"Your Child",
    theme:"princess",
    days:7,
    color:"pink"

};




const childNameInput = document.getElementById("childName");

const chartTheme = document.getElementById("chartTheme");

const chartLength = document.getElementById("chartLength");


const preview = document.getElementById("pottyPreview");

const chartDays = document.getElementById("chartDays");


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
border:"#ffb6d9"

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

},


rainbow:{

background:"#fff7fc",
border:"#ffb6d9"

}


};








/* ===========================
   THEMES
=========================== */


const themes = {


princess:{

icon:"👑",

class:"theme-princess",

title:"{name}'s Princess Potty Adventure",

subtitle:"Every sticker brings you closer to becoming a big kid!"

},



dinosaur:{

icon:"🦖",

class:"theme-dinosaur",

title:"{name}'s Dinosaur Potty Quest",

subtitle:"Roar! You're doing an amazing job!"

},



animals:{

icon:"🐻",

class:"theme-animals",

title:"{name}'s Animal Potty Journey",

subtitle:"Little steps make big achievements!"

},



space:{

icon:"🚀",

class:"theme-space",

title:"{name}'s Space Adventure",

subtitle:"Blast off into big kid success!"

},



unicorn:{

icon:"🦄",

class:"theme-unicorn",

title:"{name}'s Magical Potty Journey",

subtitle:"Sparkles, smiles, and lots of success!"

}


};









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





// Theme class

preview.className =
`potty-preview ${theme.class}`;





// Custom color

preview.style.background =
color.background;


preview.style.borderColor =
color.border;





// Header

document.getElementById("themeIcon").innerHTML =
theme.icon;



document.getElementById("chartTitle").innerHTML =
theme.title.replace(
"{name}",
chartData.name
);




document.getElementById("chartSubtitle").innerHTML =
theme.subtitle;






// Days

chartDays.innerHTML = "";




for(
let i = 1;
i <= chartData.days;
i++
){



const day =
document.createElement("div");


day.className =
"reward-day";



day.innerHTML = `

<span>
Day ${i}
</span>

<div>
⭐ ⭐ ⭐
</div>

`;



chartDays.appendChild(day);



}




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
   PDF GENERATION
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

scale:2

}
);





const imgData =
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
imgData,
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