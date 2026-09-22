(function () {

    "use strict";


    /* =========================================================
       STATE
    ========================================================= */

    const answers = {
        age: "",
        laundry: "",
        changes: "",
        daycare: "",
        potty: ""
    };


    let currentStep = 1;

    const totalSteps = 5;


    /* =========================================================
       ELEMENTS
    ========================================================= */

    const steps = document.querySelectorAll(".wardrobe-step");

    const nextButton = document.getElementById("wardrobe-next");

    const backButton = document.getElementById("wardrobe-back");

    const progressBar = document.getElementById("progress-bar");

    const progressCount = document.getElementById("progress-count");

    const progressLabel = document.getElementById("progress-label");

    const questionArea = document.getElementById("question-area");

    const results = document.getElementById("wardrobe-results");

    const resultGrid = document.getElementById("result-grid");

    const routineSummary = document.getElementById("routine-summary");

    const resultIntro = document.getElementById("result-intro");

    const totalNumber = document.getElementById("total-number");

    const explanationList = document.getElementById("explanation-list");

    const checklist = document.getElementById("checklist");

    const restartButton = document.getElementById("wardrobe-restart");


    /* =========================================================
       STEP LABELS
    ========================================================= */

    const stepLabels = [
        "Your toddler",
        "Your laundry",
        "Real life",
        "Daycare",
        "Potty training"
    ];


    /* =========================================================
       INITIALIZE
    ========================================================= */

    function initialize() {

        bindOptionButtons();

        nextButton.addEventListener(
            "click",
            handleNext
        );

        backButton.addEventListener(
            "click",
            handleBack
        );

        restartButton.addEventListener(
            "click",
            restart
        );

        updateStep();

    }


    /* =========================================================
       OPTION BUTTONS
    ========================================================= */

    function bindOptionButtons() {

        const optionButtons = document.querySelectorAll(
            ".wardrobe-option"
        );

        optionButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const question = button.dataset.question;

                    const value = button.dataset.value;

                    if (!question || !value) {
                        return;
                    }

                    answers[question] = value;


                    const currentOptions = document.querySelectorAll(
                        '.wardrobe-option[data-question="' +
                        question +
                        '"]'
                    );

                    currentOptions.forEach(function (option) {

                        option.classList.remove(
                            "selected"
                        );

                    });


                    button.classList.add(
                        "selected"
                    );


                    nextButton.disabled = false;

                }
            );

        });

    }


    /* =========================================================
       NEXT
    ========================================================= */

    function handleNext() {

        if (!isCurrentStepAnswered()) {
            return;
        }


        if (currentStep < totalSteps) {

            currentStep += 1;

            updateStep();

            return;

        }


        showResults();

    }


    /* =========================================================
       BACK
    ========================================================= */

    function handleBack() {

        if (currentStep <= 1) {
            return;
        }

        currentStep -= 1;

        updateStep();

    }


    /* =========================================================
       VALIDATION
    ========================================================= */

    function isCurrentStepAnswered() {

        const questionMap = {
            1: "age",
            2: "laundry",
            3: "changes",
            4: "daycare",
            5: "potty"
        };

        const question = questionMap[currentStep];

        return Boolean(
            answers[question]
        );

    }


    /* =========================================================
       UPDATE STEP
    ========================================================= */

    function updateStep() {

        steps.forEach(function (step) {

            const stepNumber = Number(
                step.dataset.step
            );

            step.classList.toggle(
                "active",
                stepNumber === currentStep
            );

        });


        const progressPercent =
            (currentStep / totalSteps) * 100;


        progressBar.style.width =
            progressPercent + "%";


        progressCount.textContent =
            currentStep +
            " of " +
            totalSteps;


        progressLabel.textContent =
            stepLabels[currentStep - 1];


        backButton.hidden =
            currentStep === 1;


        nextButton.textContent =
            currentStep === totalSteps
                ? "Build my wardrobe →"
                : "Next →";


        nextButton.disabled =
            !isCurrentStepAnswered();

    }


    /* =========================================================
       CALCULATOR
    ========================================================= */

    function calculateWardrobe() {

        /*
         * Start with a laundry-based rotation.
         *
         * The target is intentionally a practical rotation,
         * rather than a theoretical maximum.
         */

        let rotationDays = 5;


        switch (answers.laundry) {

            case "daily":
                rotationDays = 4;
                break;

            case "2-3":
                rotationDays = 6;
                break;

            case "weekly":
                rotationDays = 8;
                break;

            case "less":
                rotationDays = 10;
                break;

        }


        /*
         * Outfit changes increase the number of daytime
         * tops/bottoms that need to be available.
         */

        let changeMultiplier = 1;


        switch (answers.changes) {

            case "1":
                changeMultiplier = 1;
                break;

            case "2":
                changeMultiplier = 1.35;
                break;

            case "3":
                changeMultiplier = 1.7;
                break;

        }


        /*
         * Daycare adds a dedicated backup layer.
         */

        const daycareBackup =
            answers.daycare === "yes"
                ? 2
                : 0;


        /*
         * Potty training adds more bottom/underwear
         * capacity, but doesn't inflate everything equally.
         */

        const pottyAdjustment =
            answers.potty === "yes"
                ? 2
                : 0;


        /*
         * Age is deliberately a small adjustment.
         * Routine matters more than age.
         */

        let ageAdjustment = 0;

        switch (answers.age) {

            case "12-18":
                ageAdjustment = 1;
                break;

            case "18-24":
                ageAdjustment = 1;
                break;

            case "2":
                ageAdjustment = 0;
                break;

            case "3":
                ageAdjustment = 0;
                break;

            case "4":
                ageAdjustment = -1;
                break;

        }


        /*
         * Core daytime rotation.
         */

        const daytimeOutfits =
            Math.max(
                4,
                Math.round(
                    rotationDays *
                    changeMultiplier
                )
            );


        /*
         * Tops.
         *
         * Extra tops are useful because spills and food messes
         * often affect tops before bottoms.
         */

        const tops =
            Math.max(
                5,
                daytimeOutfits + 1 + ageAdjustment
            );


        /*
         * Bottoms need fewer duplicates because one bottom
         * can often survive multiple outfit combinations.
         */

        const bottoms =
            Math.max(
                4,
                Math.round(
                    daytimeOutfits * 0.72
                ) +
                (answers.potty === "yes" ? 2 : 0)
            );


        /*
         * Pajamas are calculated independently from daytime wear.
         */

        let pajamas;

        switch (answers.laundry) {

            case "daily":
                pajamas = 3;
                break;

            case "2-3":
                pajamas = 4;
                break;

            case "weekly":
                pajamas = 5;
                break;

            case "less":
                pajamas = 6;
                break;

            default:
                pajamas = 4;

        }


        /*
         * Underwear.
         */

        let underwear;

        if (answers.potty === "yes") {

            underwear =
                Math.max(
                    8,
                    Math.round(
                        rotationDays +
                        pottyAdjustment +
                        2
                    )
                );

        } else {

            underwear =
                Math.max(
                    5,
                    Math.round(
                        rotationDays * 0.8
                    )
                );

        }


        /*
         * Socks.
         */

        const socks =
            Math.max(
                6,
                Math.round(
                    rotationDays +
                    (answers.changes === "3" ? 2 : 0)
                )
            );


        /*
         * Layers.
         *
         * These are shared wardrobe pieces rather than
         * one layer per outfit.
         */

        const layers =
            answers.age === "12-18"
                ? 3
                : 4;


        /*
         * Special outfits are intentionally kept small.
         */

        const special =
            answers.age === "4"
                ? 2
                : 2;


        /*
         * Daycare backups.
         *
         * These are complete outfits, not additional
         * individual pieces.
         */

        const daycareOutfits =
            answers.daycare === "yes"
                ? 2
                : 0;


        /*
         * Emergency outfits at home.
         */

        const emergency =
            answers.changes === "3" ||
            answers.potty === "yes"
                ? 2
                : 1;


        /*
         * Total unique pieces.
         *
         * Daycare/emergency outfits are counted as full
         * outfit equivalents rather than adding every piece
         * again, preventing an inflated result.
         */

        const basePieces =
            tops +
            bottoms +
            pajamas +
            underwear +
            socks +
            layers +
            special;


        const backupPieces =
            daycareOutfits +
            emergency;


        const total =
            basePieces +
            backupPieces;


        return {
            tops: tops,
            bottoms: bottoms,
            pajamas: pajamas,
            underwear: underwear,
            socks: socks,
            layers: layers,
            special: special,
            daycareOutfits: daycareOutfits,
            emergency: emergency,
            total: total
        };

    }


    /* =========================================================
       SHOW RESULTS
    ========================================================= */

    function showResults() {

        const wardrobe =
            calculateWardrobe();


        questionArea.style.display =
            "none";


        results.classList.add(
            "active"
        );


        renderRoutine();

        renderIntro();

        renderWardrobe(
            wardrobe
        );

        renderExplanation(
            wardrobe
        );

        renderChecklist(
            wardrobe
        );


        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =========================================================
       RESULT INTRO
    ========================================================= */

    function renderIntro() {

        const laundryText = {
            daily: "frequent laundry",
            "2-3": "laundry a few times a week",
            weekly: "weekly laundry",
            less: "less-frequent laundry"
        };


        const changeText = {
            "1": "one main outfit most days",
            "2": "regular outfit changes",
            "3": "lots of outfit changes"
        };


        resultIntro.textContent =
            "Your plan assumes " +
            laundryText[answers.laundry] +
            " and " +
            changeText[answers.changes] +
            ". " +
            (
                answers.daycare === "yes"
                    ? "It also reserves clothes for daycare backups."
                    : "It keeps the core wardrobe focused on home rotation."
            );

    }


    /* =========================================================
       ROUTINE SUMMARY
    ========================================================= */

    function renderRoutine() {

        const labels = [];


        const ageLabels = {
            "12-18": "12–18 months",
            "18-24": "18–24 months",
            "2": "2 years",
            "3": "3 years",
            "4": "4 years"
        };


        const laundryLabels = {
            daily: "Laundry: daily",
            "2-3": "Laundry: 2–3× / week",
            weekly: "Laundry: weekly",
            less: "Laundry: less often"
        };


        labels.push(
            "🎂 " + ageLabels[answers.age]
        );


        labels.push(
            "🧺 " + laundryLabels[answers.laundry]
        );


        labels.push(
            answers.daycare === "yes"
                ? "🎒 Daycare"
                : "🏡 Home rotation"
        );


        labels.push(
            answers.potty === "yes"
                ? "🚽 Potty-training backups"
                : "👖 Regular rotation"
        );


        routineSummary.innerHTML = "";


        labels.forEach(function (label) {

            const span =
                document.createElement("span");

            span.textContent =
                label;

            routineSummary.appendChild(
                span
            );

        });

    }


    /* =========================================================
       RENDER WARDROBE
    ========================================================= */

    function renderWardrobe(wardrobe) {

        resultGrid.innerHTML = "";


        const items = [
            {
                icon: "👕",
                name: "Everyday tops",
                quantity: wardrobe.tops,
                description: "Tees, shirts and everyday tops for the main rotation."
            },
            {
                icon: "👖",
                name: "Everyday bottoms",
                quantity: wardrobe.bottoms,
                description: "Pants, leggings, shorts or other easy bottoms."
            },
            {
                icon: "🌙",
                name: "Pajamas",
                quantity: wardrobe.pajamas,
                description: "A separate sleepwear rotation."
            },
            {
                icon: "🩲",
                name: "Underwear",
                quantity: wardrobe.underwear,
                description: answers.potty === "yes"
                    ? "Extra breathing room for potty training."
                    : "Enough for your normal laundry rhythm."
            },
            {
                icon: "🧦",
                name: "Socks",
                quantity: wardrobe.socks,
                description: "Because somehow socks disappear."
            },
            {
                icon: "🧥",
                name: "Layers",
                quantity: wardrobe.layers,
                description: "Sweaters, cardigans, hoodies or light layers."
            },
            {
                icon: "✨",
                name: "Special outfits",
                quantity: wardrobe.special,
                description: "A small number for dressier occasions."
            },
            {
                icon: "🎒",
                name: "Daycare backup outfits",
                quantity: wardrobe.daycareOutfits,
                description: answers.daycare === "yes"
                    ? "Complete spare outfits kept ready for daycare."
                    : "No dedicated daycare supply needed."
            },
            {
                icon: "🚨",
                name: "Emergency outfits",
                quantity: wardrobe.emergency,
                description: "Extra complete outfits for particularly messy days."
            }
        ];


        items.forEach(function (item) {

            const card =
                document.createElement("div");

            card.className =
                "wardrobe-result-card";


            card.innerHTML =
                '<div class="wardrobe-result-card-top">' +
                    '<span class="wardrobe-result-icon">' +
                        item.icon +
                    '</span>' +

                    '<span class="wardrobe-result-quantity">' +
                        item.quantity +
                    '</span>' +
                '</div>' +

                '<h4>' +
                    item.name +
                '</h4>' +

                '<p>' +
                    item.description +
                '</p>';


            resultGrid.appendChild(
                card
            );

        });


        totalNumber.textContent =
            wardrobe.total;

    }


    /* =========================================================
       EXPLANATION
    ========================================================= */

    function renderExplanation(wardrobe) {

        explanationList.innerHTML = "";


        const reasons = [];


        switch (answers.laundry) {

            case "daily":
                reasons.push(
                    "Your frequent laundry schedule keeps the core rotation smaller."
                );
                break;

            case "2-3":
                reasons.push(
                    "Laundry a few times a week gives you a comfortable middle-ground rotation."
                );
                break;

            case "weekly":
                reasons.push(
                    "Weekly laundry requires more clothing to bridge the gap between loads."
                );
                break;

            case "less":
                reasons.push(
                    "Less-frequent laundry is the biggest reason your wardrobe needs a larger buffer."
                );
                break;

        }


        if (answers.changes === "2") {

            reasons.push(
                "Regular outfit changes increase your daytime top and bottom rotation."
            );

        }


        if (answers.changes === "3") {

            reasons.push(
                "Frequent outfit changes create a much bigger need for clean daytime clothes."
            );

        }


        if (answers.daycare === "yes") {

            reasons.push(
                "Daycare gets its own backup outfits so those clothes aren't taken out of your home rotation."
            );

        }


        if (answers.potty === "yes") {

            reasons.push(
                "Potty training increases the backup supply of underwear and bottoms."
            );

        }


        reasons.push(
            "Layers and special outfits are kept intentionally smaller because they can be reused across multiple outfits."
        );


        reasons.forEach(function (reason) {

            const li =
                document.createElement("li");

            li.textContent =
                reason;

            explanationList.appendChild(
                li
            );

        });

    }


    /* =========================================================
       SHOPPING CHECKLIST
    ========================================================= */

    function renderChecklist(wardrobe) {

        checklist.innerHTML = "";


        const items = [
            wardrobe.tops + " everyday tops",
            wardrobe.bottoms + " everyday bottoms",
            wardrobe.pajamas + " pajama sets",
            wardrobe.underwear + " pairs of underwear",
            wardrobe.socks + " pairs of socks",
            wardrobe.layers + " useful layers",
            wardrobe.special + " special-occasion outfits"
        ];


        if (answers.daycare === "yes") {

            items.push(
                wardrobe.daycareOutfits +
                " complete daycare backup outfits"
            );

        }


        if (answers.potty === "yes") {

            items.push(
                "Extra easy-change bottoms for potty training"
            );

        }


        items.forEach(function (item) {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "wardrobe-check-item";


            wrapper.innerHTML =
                '<span>✓</span>' +
                '<strong>' +
                    item +
                '</strong>';


            checklist.appendChild(
                wrapper
            );

        });

    }


    /* =========================================================
       RESTART
    ========================================================= */

    function restart() {

        answers.age = "";
        answers.laundry = "";
        answers.changes = "";
        answers.daycare = "";
        answers.potty = "";


        currentStep = 1;


        const selectedOptions =
            document.querySelectorAll(
                ".wardrobe-option.selected"
            );


        selectedOptions.forEach(function (option) {

            option.classList.remove(
                "selected"
            );

        });


        results.classList.remove(
            "active"
        );


        questionArea.style.display =
            "";


        updateStep();


        document.getElementById(
            "wardrobe-tool"
        ).scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =========================================================
       START
    ========================================================= */

    initialize();

})();