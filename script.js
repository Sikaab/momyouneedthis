// Smooth button interaction

const chartButton = document.querySelector("button");

if (chartButton) {

    chartButton.addEventListener("click", function () {

        chartButton.innerHTML = "✅ Chart Ready!";

        chartButton.style.transform = "scale(0.96)";

        setTimeout(() => {

            chartButton.style.transform = "scale(1)";

            window.location.href = "#download";

        }, 200);

    });

}

window.addEventListener("load", () => {

    const page = document.querySelector(".page");

    if (page) {

        page.style.opacity = "1";

    }

});