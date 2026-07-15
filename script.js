// Smooth button interaction

const chartButton = document.querySelector("button");


chartButton.addEventListener("click", function () {

    chartButton.innerHTML = "✅ Chart Ready!";

    chartButton.style.transform = "scale(0.96)";


    setTimeout(() => {

        chartButton.style.transform = "scale(1)";

        // Replace this with your actual freebie link later
        window.location.href = "#download";


    }, 200);


});



// Small animation when page loads

window.addEventListener("load", () => {


    document.querySelector(".page").style.opacity = "1";


});