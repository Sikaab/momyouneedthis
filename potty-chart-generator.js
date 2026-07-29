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







function createChartDays(totalDays){


chartGrid.innerHTML = "";



const numberOfWeeks =
Math.ceil(totalDays / 7);



for(let i = 1; i <= numberOfWeeks; i++){


const week =
createWeek();



week.querySelector(".week-title").textContent =
`Week ${i}`;



chartGrid.appendChild(week);



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
    Create temporary printable version
    */

    const clone =
    preview.cloneNode(true);

    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";

    clone.style.width = "1100px";
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

    table.style.minWidth = "auto";
    table.style.width = "100%";

    }

    document.body.appendChild(clone);

    const canvas =
    await html2canvas(
    clone,
    {

    scale:2,

    backgroundColor:"#ffffff",

    useCORS:true

    }

    );

    document.body.removeChild(clone);

    const image =
    canvas.toDataURL(
    "image/png"
    );

    const {
    jsPDF
    } =
    window.jspdf;

    /*
    Landscape is better for 14 and 30 days
    */

    const orientation =
    chartData.days > 7
    ? "landscape"
    : "portrait";

    const pdf =
    new jsPDF(
    {

    orientation:orientation,

    unit:"mm",

    format:"a4"

    }

    );

    const pageWidth =
    orientation === "landscape"
    ? 277
    : 190;

    const pageHeight =
    orientation === "landscape"
    ? 190
    : 277;

    let imageHeight =
    (canvas.height * pageWidth)
    /
    canvas.width;

    if(imageHeight > pageHeight){

    const ratio =
    pageHeight / imageHeight;

    pdf.addImage(
    image,
    "PNG",
    10,
    10,
    pageWidth * ratio,
    pageHeight
    );

    }
    else{

    pdf.addImage(
    image,
    "PNG",
    10,
    10,
    pageWidth,
    imageHeight
    );

    }

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
