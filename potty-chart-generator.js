/* =====================================
   POTTY TRAINING GENERATOR
   MomYouNeedThis
===================================== */


let selectedColor = "pink";

let chartData = {
    name: "Your Child",
    theme: "princess",
    days: 7,
    color: "pink"
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
        background:"#fff1f7",
        border:"#ffb6d5",
        title:"#ff6fae"
    },

    purple:{
        background:"#f4edff",
        border:"#d7bfff",
        title:"#9b6cff"
    },

    blue:{
        background:"#edf8ff",
        border:"#a8dcff",
        title:"#4da6ff"
    },

    green:{
        background:"#effff1",
        border:"#a8e6b0",
        title:"#48a868"
    },

    rainbow:{
        background:"#fff7fc",
        border:"#ffb6d5",
        title:"#ff6fae"
    }

};





/* ===========================
   THEMES
=========================== */


const themes = {

    princess:"👑",
    dinosaur:"🦖",
    animals:"🐻",
    space:"🚀",
    unicorn:"🦄"

};





/* ===========================
   UPDATE PREVIEW
=========================== */


function updatePreview(){


    chartData.name =
    childNameInput.value || "Your Child";


    chartData.theme =
    chartTheme.value;


    chartData.days =
    Number(chartLength.value);


    chartData.color =
    selectedColor;



    const style = colors[selectedColor];


    preview.style.background =
    style.background;


    preview.style.borderColor =
    style.border;



    preview.querySelector("h3").innerHTML =
    `${themes[chartData.theme]} ${chartData.name}'s Potty Chart`;



    chartDays.innerHTML = "";



    for(let i = 1; i <= chartData.days; i++){


        const day = document.createElement("div");


        day.innerHTML =
        `Day ${i} ⭐ ⭐ ⭐`;


        chartDays.appendChild(day);


    }


}






/* ===========================
   LISTENERS
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





document.querySelectorAll(".color-choice")
.forEach(button => {


    button.addEventListener(
    "click",
    ()=>{


        selectedColor =
        button.dataset.color;


        updatePreview();


    });


});





/* ===========================
   OPEN EMAIL GATE
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
   GENERATE PDF
=========================== */


downloadButton.addEventListener(
"click",
async ()=>{


const email =
document.getElementById("emailInput").value;



if(!email){

alert("Please enter your email first.");

return;

}




/*
 HERE YOU CONNECT EMAIL SERVICE LATER

 Example:
 EmailJS
 Brevo
 MailerLite

 For now it continues directly.
*/



const canvas =
await html2canvas(preview);



const imgData =
canvas.toDataURL("image/png");



const { jsPDF } =
window.jspdf;



const pdf =
new jsPDF();



const width =
190;


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



});






/* INITIAL LOAD */

updatePreview();