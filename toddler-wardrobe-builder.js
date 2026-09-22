(function () {
    "use strict";

    var currentStep = 1;

    var step1 = document.getElementById("wardrobe-step-1");
    var step2 = document.getElementById("wardrobe-step-2");
    var step3 = document.getElementById("wardrobe-step-3");

    var progressSteps = document.querySelectorAll(
        ".wardrobe-progress-step"
    );

    var step1Next = document.getElementById("step-1-next");
    var step2Back = document.getElementById("step-2-back");
    var step2Next = document.getElementById("step-2-next");
    var step3Back = document.getElementById("step-3-back");
    var startOver = document.getElementById("start-over");

    var resultsContainer = document.getElementById(
        "wardrobe-results"
    );

    var summaryContainer = document.getElementById(
        "wardrobe-summary"
    );

    var specialNote = document.getElementById(
        "wardrobe-special-note"
    );

    var outfitsContainer = document.getElementById(
        "wardrobe-outfits"
    );

    var shoppingList = document.getElementById(
        "wardrobe-shopping-list"
    );

    var copyChecklistButton = document.getElementById(
        "copy-checklist"
    );

    var printButton = document.getElementById(
        "print-wardrobe"
    );


    function getRadioValue(name, fallback) {
        var selected = document.querySelector(
            'input[name="' + name + '"]:checked'
        );

        if (!selected) {
            return fallback;
        }

        return selected.value;
    }


    function getAnswers() {
        return {
            age: document.getElementById("child-age").value,

            laundry: getRadioValue(
                "laundry",
                "twice"
            ),

            changes: Number(
                getRadioValue(
                    "changes",
                    "1"
                )
            ),

            daycare: getRadioValue(
                "daycare",
                "no"
            ),

            potty: getRadioValue(
                "potty",
                "no"
            ),

            style: getRadioValue(
                "style",
                "practical"
            )
        };
    }


    function showStep(stepNumber) {
        currentStep = stepNumber;

        step1.classList.remove("active");
        step2.classList.remove("active");
        step3.classList.remove("active");

        if (stepNumber === 1) {
            step1.classList.add("active");
        }

        if (stepNumber === 2) {
            step2.classList.add("active");
        }

        if (stepNumber === 3) {
            step3.classList.add("active");
        }

        progressSteps.forEach(function (step) {
            var number = Number(
                step.getAttribute("data-progress")
            );

            step.classList.toggle(
                "active",
                number <= stepNumber
            );
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function calculateWardrobe(answers) {
        var laundryMultiplier = {
            daily: 0.75,
            twice: 1,
            weekly: 1.35,
            less: 1.65
        };

        var styleMultiplier = {
            minimal: 0.8,
            practical: 1,
            variety: 1.25
        };

        var multiplier =
            laundryMultiplier[answers.laundry] *
            styleMultiplier[answers.style];

        var baseOutfits = 6;

        if (answers.changes === 2) {
            baseOutfits += 3;
        }

        if (answers.changes >= 3) {
            baseOutfits += 5;
        }

        var tops = Math.ceil(
            baseOutfits * multiplier
        );

        var bottoms = Math.ceil(
            (baseOutfits - 1) * multiplier
        );

        var pajamas = Math.max(
            3,
            Math.ceil(
                4 * multiplier
            )
        );

        var underwear = Math.max(
            5,
            Math.ceil(
                7 * multiplier
            )
        );

        var socks = Math.max(
            6,
            Math.ceil(
                7 * multiplier
            )
        );

        var layers = Math.max(
            2,
            Math.ceil(
                3 * styleMultiplier[answers.style]
            )
        );

        var dressy = Math.max(
            1,
            Math.ceil(
                2 * styleMultiplier[answers.style]
            )
        );

        var daycareBackups = 0;

        if (answers.daycare === "yes") {
            daycareBackups = answers.potty === "yes"
                ? 4
                : 2;
        }

        if (answers.potty === "yes") {
            underwear += 3;
            bottoms += 2;
        }

        return {
            tops: tops,
            bottoms: bottoms,
            pajamas: pajamas,
            underwear: underwear,
            socks: socks,
            layers: layers,
            dressy: dressy,
            daycareBackups: daycareBackups
        };
    }


    function formatAge(age) {
        var ages = {
            "12-18": "12–18 months",
            "18-24": "18–24 months",
            "2": "2 years",
            "3": "3 years",
            "4": "4 years"
        };

        return ages[age] || "toddler";
    }


    function formatLaundry(laundry) {
        var labels = {
            daily: "almost-daily laundry",
            twice: "laundry about twice a week",
            weekly: "weekly laundry",
            less: "less-than-weekly laundry"
        };

        return labels[laundry] || "your laundry routine";
    }


    function renderResults(answers, wardrobe) {
        summaryContainer.innerHTML =
            "For a <strong>" +
            formatAge(answers.age) +
            "</strong> with " +
            formatLaundry(answers.laundry) +
            ", " +
            answers.changes +
            " outfit change" +
            (answers.changes === 1 ? "" : "s") +
            " per day, and a " +
            answers.style +
            " wardrobe style, here's a practical starting point.";

        var items = [
            {
                title: "Everyday tops",
                quantity: wardrobe.tops,
                note: "T-shirts, long sleeves, everyday shirts."
            },
            {
                title: "Everyday bottoms",
                quantity: wardrobe.bottoms,
                note: "Pants, leggings, joggers, shorts or similar."
            },
            {
                title: "Pajamas",
                quantity: wardrobe.pajamas,
                note: "Enough to work with your laundry rhythm."
            },
            {
                title: "Underwear",
                quantity: wardrobe.underwear,
                note: answers.potty === "yes"
                    ? "Extra included for potty-training accidents."
                    : "A practical everyday rotation."
            },
            {
                title: "Pairs of socks",
                quantity: wardrobe.socks,
                note: "Adjust upward if socks mysteriously disappear."
            },
            {
                title: "Layers",
                quantity: wardrobe.layers,
                note: "Sweaters, cardigans, hoodies or light jackets."
            },
            {
                title: "Dressy / special outfits",
                quantity: wardrobe.dressy,
                note: "For events, photos, holidays or nicer outings."
            }
        ];

        if (wardrobe.daycareBackups > 0) {
            items.push({
                title: "Daycare backup outfits",
                quantity: wardrobe.daycareBackups,
                note: "Complete backup outfits to leave at daycare."
            });
        }

        resultsContainer.innerHTML = "";

        items.forEach(function (item) {
            var card = document.createElement("div");

            card.className = "wardrobe-result-item";

            card.innerHTML =
                "<h3>" +
                item.title +
                "</h3>" +
                '<span class="wardrobe-result-quantity">' +
                item.quantity +
                "</span>" +
                '<span class="wardrobe-result-note">' +
                item.note +
                "</span>";

            resultsContainer.appendChild(card);
        });


        var noteTitle = "A note about your result";
        var noteText =
            "Think of these numbers as a useful target, not a rule. " +
            "If you regularly have clean clothes left over, you probably " +
            "don't need more. If you're constantly doing emergency laundry, " +
            "your real wardrobe needs may be higher.";

        if (answers.daycare === "yes") {
            noteText +=
                " Because your toddler attends daycare, the calculator " +
                "also includes a dedicated backup supply.";
        }

        if (answers.potty === "yes") {
            noteText +=
                " Because you're potty training, the calculation gives " +
                "you additional underwear and bottoms.";
        }

        specialNote.innerHTML =
            "<strong>" +
            noteTitle +
            "</strong>" +
            "<p>" +
            noteText +
            "</p>";


        outfitsContainer.innerHTML = "";

        var outfitFormulas = [
            {
                name: "Everyday",
                formula: "top + bottom + socks + everyday shoes"
            },
            {
                name: "Messy play",
                formula: "older top + comfortable bottom + easy-to-wash layer"
            },
            {
                name: "Cool weather",
                formula: "base top + bottom + warm layer"
            },
            {
                name: "Nicer outing",
                formula: "special outfit + comfortable shoes + optional layer"
            }
        ];

        outfitFormulas.forEach(function (outfit) {
            var element = document.createElement("div");

            element.className = "wardrobe-outfit";

            element.innerHTML =
                "<strong>" +
                outfit.name +
                ":</strong> " +
                outfit.formula +
                ".";

            outfitsContainer.appendChild(element);
        });


        shoppingList.innerHTML = "";

        var shoppingItems = [
            wardrobe.tops + " everyday tops",
            wardrobe.bottoms + " everyday bottoms",
            wardrobe.pajamas + " pairs of pajamas",
            wardrobe.underwear + " pairs of underwear",
            wardrobe.socks + " pairs of socks",
            wardrobe.layers + " layers"
        ];

        if (wardrobe.dressy > 0) {
            shoppingItems.push(
                wardrobe.dressy +
                " dressy / special outfit" +
                (wardrobe.dressy === 1 ? "" : "s")
            );
        }

        if (wardrobe.daycareBackups > 0) {
            shoppingItems.push(
                wardrobe.daycareBackups +
                " complete daycare backup outfit" +
                (wardrobe.daycareBackups === 1 ? "" : "s")
            );
        }

        shoppingItems.forEach(function (item) {
            var li = document.createElement("li");

            li.textContent = "☐ " + item;

            shoppingList.appendChild(li);
        });
    }


    function buildChecklistText() {
        var items = Array.from(
            shoppingList.querySelectorAll("li")
        );

        return [
            "MY TODDLER WARDROBE CHECKLIST",
            "",
            ...items.map(function (item) {
                return item.textContent;
            }),
            "",
            "Created with MomYouNeedThis.com"
        ].join("\n");
    }


    step1Next.addEventListener(
        "click",
        function () {
            showStep(2);
        }
    );


    step2Back.addEventListener(
        "click",
        function () {
            showStep(1);
        }
    );


    step2Next.addEventListener(
        "click",
        function () {
            var answers = getAnswers();

            var wardrobe = calculateWardrobe(
                answers
            );

            renderResults(
                answers,
                wardrobe
            );

            showStep(3);
        }
    );


    step3Back.addEventListener(
        "click",
        function () {
            showStep(2);
        }
    );


    startOver.addEventListener(
        "click",
        function () {
            showStep(1);
        }
    );


    copyChecklistButton.addEventListener(
        "click",
        function () {
            var text = buildChecklistText();

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {
                navigator.clipboard.writeText(text)
                    .then(function () {
                        copyChecklistButton.textContent =
                            "✓ Copied!";
                    })
                    .catch(function () {
                        fallbackCopy(text);
                    });
            } else {
                fallbackCopy(text);
            }

            setTimeout(function () {
                copyChecklistButton.textContent =
                    "Copy checklist";
            }, 2000);
        }
    );


    function fallbackCopy(text) {
        var textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        try {
            document.execCommand("copy");

            copyChecklistButton.textContent =
                "✓ Copied!";
        } catch (error) {
            copyChecklistButton.textContent =
                "Select & copy manually";
        }

        document.body.removeChild(
            textarea
        );
    }


    printButton.addEventListener(
        "click",
        function () {
            window.print();
        }
    );


    showStep(1);

})();