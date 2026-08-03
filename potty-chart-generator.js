/* =====================================
   POTTY TRAINING GENERATOR
   MomYouNeedThis
===================================== */

import { db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* ===========================
   STATE
=========================== */


let selectedColor = "pink";


const chartData = {

    name:"Your Child",
    theme:"princess",
    color:"pink",
    week:1

};

/* ===========================
   ELEMENTS
=========================== */


const childNameInput =
document.getElementById("childName");


const chartTheme =
document.getElementById("chartTheme");


const weekNumberInput =
document.getElementById("weekNumber");

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

subtitle:"Fill your chart and become a big kid!",

certificateTitle:"Potty Training Princess!",

couponTitle:"Princess Reward Coupons",

certificate:"assets/princess-potty-training-certificate.jpeg",

coupons:"assets/princess-potty-training-reward-coupons.jpeg"

},


dinosaur:{

icon:"🦖",

className:"theme-dinosaur",

title:"{name}'s Dinosaur Potty Quest",

subtitle:"Roar! Every success counts!",

certificateTitle:"Potty Training Dinosaur Champion!",

couponTitle:"Dinosaur Reward Coupons",

certificate:"assets/dinosaurs-potty-training-certificate.jpeg",

coupons:"assets/dinosaurs-potty-training-reward-coupons.jpeg"

},


unicorn:{

icon:"🦄",

className:"theme-unicorn",

title:"{name}'s Magical Unicorn Journey",

subtitle:"Sparkles, smiles, and potty wins!",

certificateTitle:"Magical Potty Training Unicorn!",

couponTitle:"Magical Unicorn Reward Coupons",

certificate:"assets/unicorn-potty-training-certificate.jpeg",

coupons:"assets/unicorn-potty-training-reward-coupons.jpeg"

},


space:{

icon:"🚀",

className:"theme-space",

title:"{name}'s Space Potty Mission",

subtitle:"Blast off toward big kid success!",

certificateTitle:"Potty Training Space Explorer!",

couponTitle:"Space Mission Reward Coupons",

certificate:"assets/space-potty-training-certificate.jpeg",

coupons:"assets/space-potty-training-reward-coupons.jpeg"

},


animals:{

icon:"🐻",

className:"theme-animals",

title:"{name}'s Animal Potty Adventure",

subtitle:"Small steps create big wins!",

certificateTitle:"Potty Training Superstar!",

couponTitle:"Superstar Reward Coupons",

certificate:"assets/animals-potty-training-certificate.jpeg",

coupons:"assets/animals-potty-training-reward-coupons.jpeg"

}

};

  /* ===========================
   CREATE WEEKLY POTTY TABLE
=========================== */


function createWeek(){


const week =
document.createElement("div");


week.className =
"potty-week";



week.innerHTML = `

<h4 class="week-title">
Week 1
</h4>


<table class="potty-chart-table">


<tr>

<th class="empty-cell"></th>

<th>Day 1</th>
<th>Day 2</th>
<th>Day 3</th>
<th>Day 4</th>
<th>Day 5</th>
<th>Day 6</th>
<th>Day 7</th>

</tr>




<tr>

<td class="activity-label">
🚽 Pee
</td>

<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>

</tr>




<tr>

<td class="activity-label">
💩 Poop
</td>

<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>

</tr>





<tr>

<td class="activity-label">
⭐ Tried
</td>

<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>

</tr>


</table>

`;


return week;

}




function createChartDays(){


chartGrid.innerHTML = "";



const table =
document.createElement("table");


table.className =
"potty-chart-table";



table.innerHTML = `

<tr>

<th class="empty-cell">
Week ${chartData.week}
</th>

<th>Day 1</th>
<th>Day 2</th>
<th>Day 3</th>
<th>Day 4</th>
<th>Day 5</th>
<th>Day 6</th>
<th>Day 7</th>

</tr>


<tr>

<td class="activity-label">
🚽 Pee
</td>

${createRewardCells()}

</tr>



<tr>

<td class="activity-label">
💩 Poop
</td>

${createRewardCells()}

</tr>



<tr>

<td class="activity-label">
⭐ Tried
</td>

${createRewardCells()}

</tr>

`;



chartGrid.appendChild(table);


}


function createRewardCells(){

return `

<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>
<td><div class="reward-circle"></div></td>

`;

}


/* ===========================
   UPDATE PREVIEW
=========================== */


function updatePreview(){


chartData.name =
childNameInput.value.trim() || "Your Child";


chartData.theme =
chartTheme.value;

chartData.week =
Number(weekNumberInput.value) || 1;


chartData.color =
selectedColor;


const theme =
themes[chartData.theme];


const color =
colors[selectedColor];


/* UPDATE PREVIEW STYLE */

preview.className =
`potty-preview ${theme.className}`;

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
   ACTIONS
=========================== */

async function saveLead(){

    console.log("saveLead started");

    const email =
    document.getElementById("emailInput").value.trim();

    console.log("Email:", email);

    if(!email){
        console.log("No email");
        return;
    }


    try {

        const docRef = await addDoc(
            collection(db, "leads"),
            {
                email: email || "unknown email",
                childName: chartData.name || "unknown child name",
                theme: chartData.theme || "unknown theme",
                createdAt: serverTimestamp()
            }
        );

        console.log("Lead saved with ID:", docRef.id);

    } catch(error){

        console.error(
            "Firebase save error:",
            error
        );

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

weekNumberInput.addEventListener(
"input",
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

try{


const email =
document.getElementById("emailInput").value.trim();


if(!email){

alert("Please enter your email first.");

return;

}

downloadButton.disabled = true;
downloadButton.textContent = "Downloading...";

await saveLead();



const clone =
preview.cloneNode(true);


clone.style.position = "absolute";
clone.style.left = "-9999px";
clone.style.top = "0";
clone.style.width = "1400px";
clone.style.height = "auto";
clone.style.overflow = "visible";


const scroll =
clone.querySelector(".chart-scroll");

if(scroll){

    scroll.style.overflow = "visible";
    scroll.style.width = "100%";

}


const table =
clone.querySelector(".potty-chart-table");

if(table){

    table.style.width = "100%";
    table.style.tableLayout = "auto";

}


document.body.appendChild(clone);


const canvas =
await html2canvas(
clone,
{
scale:3,
backgroundColor:"#ffffff",
useCORS:true
}
);



document.body.removeChild(clone);



const chartImage =
canvas.toDataURL("image/png");



const {
jsPDF
}=window.jspdf;



const pdf =
new jsPDF(
{
orientation:"landscape",
unit:"mm",
format:"a4"
}
);



const pageWidth=297;
const pageHeight=210;



/* =========================
PAGE 1 CHART
========================= */


const chartWidth=287;


const chartHeight =
(canvas.height * chartWidth) /
canvas.width;



pdf.addImage(
chartImage,
"PNG",
5,
(pageHeight-chartHeight)/2,
chartWidth,
chartHeight
);



/* =========================
PAGE 2 CERTIFICATE
========================= */


const certificateImg =
new Image();


certificateImg.src =
themes[chartData.theme].certificate;



await new Promise(
(resolve,reject)=>{

certificateImg.onload=resolve;

certificateImg.onerror=reject;

});



pdf.addPage();



const certWidth=287;


const certHeight =
(certificateImg.height * certWidth) /
certificateImg.width;



pdf.addImage(
certificateImg,
"JPEG",
5,
(pageHeight-certHeight)/2,
certWidth,
certHeight
);



pdf.setTextColor(80,80,80);



pdf.setFont(
"helvetica",
"bold"
);


pdf.setFontSize(28);


pdf.text(
"Certificate of Achievement",
148,
55,
{
align:"center"
}
);



pdf.setFontSize(16);


pdf.setFont(
"helvetica",
"normal"
);


pdf.text(
"Presented with pride to",
148,
75,
{
align:"center"
}
);



pdf.setFontSize(32);


pdf.setFont(
"helvetica",
"bold"
);


pdf.text(
chartData.name,
148,
100,
{
align:"center"
}
);



pdf.setFontSize(15);


pdf.setFont(
"helvetica",
"normal"
);


pdf.text(
`For becoming a ${themes[chartData.theme].certificateTitle}`,
148,
125,
{
align:"center"
}
);



/* =========================
PAGE 3 COUPONS
========================= */


const couponsImg =
new Image();



couponsImg.src =
themes[chartData.theme].coupons;



await new Promise(
(resolve,reject)=>{

couponsImg.onload=resolve;

couponsImg.onerror=reject;

});



pdf.addPage();



const couponWidth=287;


const couponHeight =
(couponsImg.height * couponWidth) /
couponsImg.width;



pdf.addImage(
couponsImg,
"JPEG",
5,
(pageHeight-couponHeight)/2,
couponWidth,
couponHeight
);


/* =========================
COUPON PAGE TEXT
========================= */


pdf.setTextColor(80,80,80);


/* TITLE */

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(28);


pdf.text(
themes[chartData.theme].couponTitle,
148,
13,
{
align:"center"
}
);


/* =========================
PAGE 4 POTTY TRAINING GUIDE
========================= */

pdf.addPage();


pdf.setTextColor(80,80,80);


pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(26);


pdf.text(
"Potty Training Success Plan",
148,
25,
{
align:"center"
}
);



pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(14);


pdf.text(
"A simple routine to help your child build confidence & independence",
148,
38,
{
align:"center"
}
);



let guideY = 55;



function addGuideSection(title, lines){


pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(16);


pdf.text(
title,
15,
guideY
);



guideY += 8;


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(12);



lines.forEach(line=>{

pdf.text(
line,
20,
guideY
);


guideY += 6;


});


guideY += 8;


}



/* SECTION 1 */

addGuideSection(
"1. Create Predictable Potty Moments",
[
"Offer regular potty opportunities:",
"• After waking up",
"• Before leaving the house",
"• After meals",
"• Before bath time",
"• Before bedtime",
"",
"Keep it calm and positive:",
"\"Let's give your potty a try!\""
]
);



/* SECTION 2 */

addGuideSection(
"2. Teach Independence",
[
"Help your child learn the steps:",
"1. Walk to the potty",
"2. Pull clothing down",
"3. Sit comfortably",
"4. Try to go",
"5. Wipe",
"6. Flush",
"7. Wash hands",
"",
"Allow your child to do as much as they can independently."
]
);



/* SECTION 3 */

addGuideSection(
"3. Celebrate Progress",
[
"Celebrate:",
"• Trying",
"• Sitting on the potty",
"• Telling you they need to go",
"• Using the potty successfully",
"",
"\"I'm proud of you for trying!\""
]
);



/* SECTION 4 */

addGuideSection(
"4. Handle Accidents Calmly",
[
"Accidents are a normal part of learning.",
"",
"\"It's okay. Accidents happen.",
"Let's clean up and try again.\""
]
);



/* REWARD BOX */

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(16);


pdf.text(
"Reward Ideas For Potty Coupons",
15,
guideY
);


guideY += 10;


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(12);


[
"Small Rewards:",
"• Choose bedtime story",
"• Pick a family song",
"• Extra cuddle time",
"• Choose an activity",
"",
"Special Rewards:",
"• Family movie night",
"• Special outing",
"• Bake a treat together",
"• Pick a small toy",
"• Choose a new book"
].forEach(line=>{


pdf.text(
line,
20,
guideY
);


guideY += 6;


});



guideY += 8;


pdf.setFont(
"helvetica",
"bold"
);

pdf.text(
"Small steps create big wins.",
148,
guideY,
{
align:"center"
}
);


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(11);


pdf.text(
"Created with love by MomYouNeedThis",
148,
guideY + 12,
{
align:"center"
}
);



pdf.save(
`${chartData.name}-potty-chart.pdf`
);



emailModal.style.display="none";


}

catch(error){

console.error(
"PDF Error:",
error
);

alert(
"PDF creation failed. Check console."
);

}

finally{

downloadButton.disabled = false;
downloadButton.textContent = "Download My Chart";

}


}

);

/* ===========================
   INITIAL LOAD
=========================== */


updatePreview();
