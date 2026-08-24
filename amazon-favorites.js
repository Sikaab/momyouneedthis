/* =========================================================
   MOM-VOTED PRODUCT EXPERIENCE
   MomYouNeedThis
   ---------------------------------------------------------
   Product battle / voting experience
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY =
        "momYouNeedThisVotingExperience";

    const SESSION_KEY =
        "momYouNeedThisSession";

    const AUTO_ADVANCE_DELAY = 1150;

    const MIN_SWIPE_DISTANCE = 45;


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const products = {

        baby: [

            {
                id: "baby-soother",
                name: "Soother Musical Crib Toy",
                brand: "Baby Einstein",
                image: "assets/babyeinstein-aquarium.jpeg",
                description:
                    "A popular option for keeping little ones entertained during quiet moments and daily routines.",
                percentage: 62,
                score: 8.4,
                link: "https://amzn.to/4fNqr9j"
            },

            {
                id: "baby-contender",
                name: "Baby Favorite",
                brand: "MomYouNeedThis Pick",
                image: "assets/product2.jpg",
                description:
                    "Another mom-approved option worth comparing before making your choice.",
                percentage: 38,
                score: 7.7,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        toddler: [

            {
                id: "toddler-favorite",
                name: "Toddler Favorite",
                brand: "MomYouNeedThis Pick",
                image: "assets/product2.jpg",
                description:
                    "A practical everyday product designed to make life with toddlers a little easier.",
                percentage: 57,
                score: 8.1,
                link: "YOUR-AMAZON-LINK-HERE"
            },

            {
                id: "toddler-contender",
                name: "Toddler Contender",
                brand: "Mom Favorite",
                image: "assets/product2.jpg",
                description:
                    "Another practical option parents may want to compare.",
                percentage: 43,
                score: 7.8,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        sleep: [

            {
                id: "sleep-white-noise",
                name: "White Noise Machine",
                brand: "Parent Favorite",
                image: "assets/white-noise-machine.jpeg",
                description:
                    "A popular choice for creating a consistent sleep environment for little ones.",
                percentage: 71,
                score: 8.7,
                link: "https://amzn.to/4z8LxGC"
            },

            {
                id: "sleep-contender",
                name: "Sleep Contender",
                brand: "Mom Pick",
                image: "assets/product2.jpg",
                description:
                    "Another sleep option parents may want to compare.",
                percentage: 29,
                score: 7.2,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        potty: [

            {
                id: "potty-babybjorn",
                name: "Potty Training Seat",
                brand: "BabyBjörn",
                image: "assets/babybjorn-potty-toilet.jpeg",
                description:
                    "A simple potty-training option designed to help toddlers feel comfortable and confident.",
                percentage: 68,
                score: 8.6,
                link: "https://amzn.to/3S23eqS"
            },

            {
                id: "potty-contender",
                name: "Potty Training Contender",
                brand: "Mom Pick",
                image: "assets/product2.jpg",
                description:
                    "Another potty-training option worth comparing before you decide.",
                percentage: 32,
                score: 7.4,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        feeding: [

            {
                id: "feeding-favorite",
                name: "Feeding Favorite",
                brand: "Mom Pick",
                image: "assets/product2.jpg",
                description:
                    "A practical feeding favorite designed to make everyday mealtimes a little easier.",
                percentage: 54,
                score: 8.0,
                link: "YOUR-AMAZON-LINK-HERE"
            },

            {
                id: "feeding-contender",
                name: "Feeding Contender",
                brand: "Mom Pick",
                image: "assets/product2.jpg",
                description:
                    "Another feeding option parents can compare.",
                percentage: 46,
                score: 7.8,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        under25: [

            {
                id: "budget-find",
                name: "Budget Mom Find",
                brand: "MomYouNeedThis Pick",
                image: "assets/product2.jpg",
                description:
                    "A useful little find that could make everyday parenting just a bit easier.",
                percentage: 63,
                score: 8.3,
                link: "YOUR-AMAZON-LINK-HERE"
            },

            {
                id: "budget-contender",
                name: "Budget Contender",
                brand: "Mom Pick",
                image: "assets/product2.jpg",
                description:
                    "Another affordable find worth putting to the mom test.",
                percentage: 37,
                score: 7.5,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ]

    };


    /* =====================================================
       CATEGORY INFORMATION
    ===================================================== */

    const categoryNames = {

        baby: "Baby",
        toddler: "Toddler",
        sleep: "Sleep",
        potty: "Potty",
        feeding: "Feeding",
        under25: "Under $25"

    };


    /* =====================================================
       DOM
    ===================================================== */

    const battles =
        document.querySelectorAll(".product-battle");


    if (!battles.length) {
        return;
    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadVotes() {

        try {

            return JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};

        } catch (error) {

            console.warn(
                "Unable to read saved votes.",
                error
            );

            return {};

        }

    }


    function saveVotes() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(savedVotes)
            );

        } catch (error) {

            console.warn(
                "Unable to save votes.",
                error
            );

        }

    }


    function loadSession() {

        const defaultSession = {

            streak: 0,

            totalVotes: 0,

            completedBattles: 0,

            seen: []

        };


        try {

            const stored =
                JSON.parse(
                    localStorage.getItem(
                        SESSION_KEY
                    )
                );


            if (!stored) {
                return defaultSession;
            }


            return {

                streak:
                    Number(stored.streak) || 0,

                totalVotes:
                    Number(stored.totalVotes) || 0,

                completedBattles:
                    Number(stored.completedBattles) || 0,

                seen:
                    Array.isArray(stored.seen)
                        ? stored.seen
                        : []

            };

        } catch (error) {

            return defaultSession;

        }

    }


    function saveSession() {

        try {

            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

        } catch (error) {

            console.warn(
                "Unable to save session.",
                error
            );

        }

    }


    let savedVotes =
        loadVotes();


    let session =
        loadSession();


    /* =====================================================
       SESSION STATE
    ===================================================== */

    const totalBattles =
        Object.keys(products).length;


    function markBattleSeen(category) {

        if (!session.seen.includes(category)) {

            session.seen.push(category);

            saveSession();

        }

    }


    /*
       IMPORTANT:
       A battle is complete only when BOTH products
       have an individual vote.

       Product position is NOT the same thing as
       voting progress.
    */

    function isBattleComplete(category) {

        return Boolean(
            savedVotes[`${category}-0`] &&
            savedVotes[`${category}-1`]
        );

    }


    function getCompletedBattleCount() {

        return Object.keys(products)
            .filter((category) => {

                return isBattleComplete(
                    category
                );

            })
            .length;

    }


    function getTotalVoteCount() {

        return Object.keys(savedVotes)
            .filter((key) => {

                return (
                    savedVotes[key] === "yes" ||
                    savedVotes[key] === "no"
                );

            })
            .length;

    }


    /* =====================================================
       MICRO COPY
    ===================================================== */

    const encouragements = [

        "Okay, we need to know your next pick 👀",

        "You have good instincts. Keep going.",

        "One more? This gets interesting.",

        "Your mom-opinion is officially on the record. 💗",

        "You’re getting good at this.",

        "Another battle is waiting…",

        "This one might be harder.",

        "Let's see if you agree with the crowd 👀"

    ];


    function randomEncouragement() {

        return encouragements[
            Math.floor(
                Math.random() *
                encouragements.length
            )
        ];

    }


    /* =====================================================
       CONSENSUS
    ===================================================== */

    function getConsensusLabel(
        percentage
    ) {

        if (percentage >= 80) {

            return "🔥 Mom favorite";

        }


        if (percentage >= 65) {

            return "💗 Strong mom approval";

        }


        if (percentage >= 50) {

            return "👀 Moms are split";

        }


        return "🤔 Not for everyone";

    }


    function getNoPercentage(
        percentage
    ) {

        return Math.max(
            0,
            Math.min(
                100,
                100 - percentage
            )
        );

    }


    /* =====================================================
       VALID AMAZON LINK
    ===================================================== */

    function isValidAffiliateLink(
        link
    ) {

        if (!link) {
            return false;
        }


        if (
            link.includes(
                "YOUR-AMAZON-LINK-HERE"
            )
        ) {

            return false;

        }


        return (
            link.startsWith("https://") ||
            link.startsWith("http://")
        );

    }


    /* =====================================================
       GLOBAL PROGRESS BAR
    ===================================================== */

    function createGlobalProgress() {

        const hero =
            document.querySelector(
                ".voting-hero"
            );


        if (!hero) {
            return null;
        }


        const existing =
            document.querySelector(
                ".mom-voting-progress"
            );


        if (existing) {
            return existing;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "mom-voting-progress";


        wrapper.innerHTML = `

            <div class="mom-voting-progress-top">

                <span>
                    💗 Your mom-vote journey
                </span>

                <strong data-global-progress-text>
                    0/${totalBattles} battles
                </strong>

            </div>


            <div class="mom-voting-progress-track">

                <div
                    class="mom-voting-progress-fill"
                    data-global-progress-fill
                ></div>

            </div>


            <div
                class="mom-voting-progress-message"
                data-global-progress-message
            >
                Pick your first product.
            </div>

        `;


        hero.appendChild(
            wrapper
        );


        return wrapper;

    }


    const globalProgress =
        createGlobalProgress();


    function updateGlobalProgress() {

        if (!globalProgress) {
            return;
        }


        const completed =
            getCompletedBattleCount();


        const percentage =
            totalBattles
                ? Math.round(
                    (
                        completed /
                        totalBattles
                    ) * 100
                )
                : 0;


        const text =
            globalProgress.querySelector(
                "[data-global-progress-text]"
            );


        const fill =
            globalProgress.querySelector(
                "[data-global-progress-fill]"
            );


        const message =
            globalProgress.querySelector(
                "[data-global-progress-message]"
            );


        if (text) {

            text.textContent =
                `${completed}/${totalBattles} battles`;

        }


        if (fill) {

            fill.style.width =
                `${percentage}%`;

        }


        if (message) {

            if (completed === 0) {

                message.textContent =
                    "Pick your first product.";

            } else if (
                completed < totalBattles
            ) {

                const remaining =
                    totalBattles -
                    completed;


                message.textContent =
                    `${remaining} more battle${remaining === 1 ? "" : "s"} waiting for you 👀`;

            } else {

                message.textContent =
                    "🏆 You completed every battle!";

            }

        }

    }


    /* =====================================================
       STREAK UI
    ===================================================== */

    function createStreakBadge() {

        const header =
            document.querySelector(
                ".mom-voted-header"
            );


        if (!header) {
            return null;
        }


        const existing =
            header.querySelector(
                ".mom-streak-badge"
            );


        if (existing) {
            return existing;
        }


        const badge =
            document.createElement(
                "div"
            );


        badge.className =
            "mom-streak-badge";


        badge.innerHTML = `

            <span class="mom-streak-fire">
                🔥
            </span>

            <span>
                <small>VOTE STREAK</small>
                <strong data-streak>0</strong>
            </span>

        `;


        header.appendChild(
            badge
        );


        return badge;

    }


    const streakBadge =
        createStreakBadge();


    function updateStreak() {

        if (!streakBadge) {
            return;
        }


        const streak =
            streakBadge.querySelector(
                "[data-streak]"
            );


        if (streak) {

            streak.textContent =
                session.streak;

        }


        streakBadge.classList.toggle(
            "has-streak",
            session.streak > 0
        );

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message
    ) {

        let toast =
            document.querySelector(
                ".mom-voting-toast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.className =
                "mom-voting-toast";


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.classList.add(
            "visible"
        );


        clearTimeout(
            toast._timer
        );


        toast._timer =
            setTimeout(() => {

                toast.classList.remove(
                    "visible"
                );

            }, 2200);

    }


    /* =====================================================
       CONFETTI
    ===================================================== */

    function celebrate() {

        const container =
            document.createElement(
                "div"
            );


        container.className =
            "vote-celebration";


        for (
            let i = 0;
            i < 18;
            i++
        ) {

            const piece =
                document.createElement(
                    "span"
                );


            piece.textContent =
                [
                    "💗",
                    "✨",
                    "🎉",
                    "⭐",
                    "💫"
                ][
                    Math.floor(
                        Math.random() * 5
                    )
                ];


            piece.style.setProperty(
                "--x",
                `${(
                    Math.random() * 200
                ) - 100}px`
            );


            piece.style.setProperty(
                "--delay",
                `${Math.random() * 0.25}s`
            );


            container.appendChild(
                piece
            );

        }


        document.body.appendChild(
            container
        );


        setTimeout(() => {

            container.remove();

        }, 1300);

    }


    /* =====================================================
       HELPER
    ===================================================== */

    function updateElement(
        element,
        value
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            value;

    }


    /* =====================================================
       BATTLE INITIALIZATION
    ===================================================== */

    battles.forEach((battle) => {

        const category =
            battle.dataset.category;


        const battleProducts =
            products[category];


        if (
            !battleProducts ||
            battleProducts.length < 2
        ) {

            console.warn(
                `No products configured for ${category}`
            );

            return;

        }


        markBattleSeen(
            category
        );


        /*
           IMPORTANT:
           currentIndex represents ONLY the
           product currently being displayed.

           0 = PRODUCT 1 OF 2
           1 = PRODUCT 2 OF 2

           It does NOT represent voting progress.
        */

        let currentIndex = 0;


        /* =================================================
           ELEMENTS
        ================================================= */

        const image =
            battle.querySelector(
                "[data-image]"
            );


        const label =
            battle.querySelector(
                "[data-label]"
            );


        const name =
            battle.querySelector(
                "[data-name]"
            );


        const brand =
            battle.querySelector(
                "[data-brand]"
            );


        const description =
            battle.querySelector(
                "[data-description]"
            );


        const score =
            battle.querySelector(
                "[data-score]"
            );


        const percentage =
            battle.querySelector(
                "[data-percentage]"
            );


        const consensus =
            battle.querySelector(
                "[data-consensus]"
            );


        const consensusBar =
            battle.querySelector(
                "[data-consensus-bar]"
            );


        const link =
            battle.querySelector(
                "[data-link]"
            );


        const position =
            battle.querySelector(
                "[data-position]"
            );


        const yesPercentage =
            battle.querySelector(
                "[data-yes-percentage]"
            );


        const noPercentage =
            battle.querySelector(
                "[data-no-percentage]"
            );


        const result =
            battle.querySelector(
                "[data-result]"
            );


        const resultTitle =
            battle.querySelector(
                "[data-result-title]"
            );


        const resultText =
            battle.querySelector(
                "[data-result-text]"
            );


        const socialComparison =
            battle.querySelector(
                "[data-social-comparison]"
            );


        const yourPosition =
            battle.querySelector(
                "[data-your-position]"
            );


        const voteArea =
            battle.querySelector(
                "[data-vote-area]"
            );


        const winner =
            battle.querySelector(
                "[data-winner]"
            );


        const winnerText =
            battle.querySelector(
                "[data-winner-text]"
            );


        const dotsContainer =
            battle.querySelector(
                "[data-dots]"
            );


        const nextContender =
            battle.querySelector(
                "[data-next-contender]"
            );


        const prevButton =
            battle.querySelector(
                "[data-prev]"
            );


        const nextButton =
            battle.querySelector(
                "[data-next]"
            );


        const voteButtons =
            battle.querySelectorAll(
                "[data-vote]"
            );


        /* =================================================
           ADD BATTLE META
        ================================================= */

        createBattleMeta(
            battle,
            category
        );


        /* =================================================
           CREATE DOTS
        ================================================= */

        if (dotsContainer) {

            dotsContainer.innerHTML = "";


            battleProducts.forEach(
                (product, index) => {

                    const dot =
                        document.createElement(
                            "button"
                        );


                    dot.type =
                        "button";


                    dot.className =
                        "battle-dot";


                    dot.setAttribute(
                        "aria-label",
                        `View ${product.name}`
                    );


                    dot.addEventListener(
                        "click",
                        () => {

                            showProduct(
                                index
                            );

                        }
                    );


                    dotsContainer.appendChild(
                        dot
                    );

                }
            );

        }


        /* =================================================
           BATTLE META
        ================================================= */

        function createBattleMeta(
            battleElement,
            categoryName
        ) {

            if (
                battleElement.querySelector(
                    ".battle-progress-meta"
                )
            ) {

                return;

            }


            const top =
                battleElement.querySelector(
                    ".battle-top"
                );


            if (!top) {
                return;
            }


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "battle-progress-meta";


            meta.innerHTML = `

                <span>
                    ${categoryNames[categoryName] || categoryName}
                </span>

                <span data-battle-vote-count>
                    0/2 picked
                </span>

            `;


            top.appendChild(
                meta
            );

        }


        /* =================================================
           PRODUCT DISPLAY
        ================================================= */

        function showProduct(
            index,
            direction = "next"
        ) {

            /*
               Normalize the index so navigation always
               remains inside the two-product battle.
            */

            currentIndex =
                (
                    index +
                    battleProducts.length
                ) %
                battleProducts.length;


            const product =
                battleProducts[
                    currentIndex
                ];


            if (image) {

                image.classList.add(
                    "product-changing"
                );

            }


            /*
               Small delay allows the existing transition
               animation to finish before replacing content.
            */

            setTimeout(() => {

                if (image) {

                    image.src =
                        product.image;

                    image.alt =
                        product.name;

                    image.classList.remove(
                        "product-changing"
                    );

                }


                /*
                   PRODUCT POSITION
                   ----------------
                   This is based ONLY on currentIndex.

                   First product:
                   PRODUCT 1 OF 2

                   Second product:
                   PRODUCT 2 OF 2
                */

                updateElement(
                    label,
                    `PRODUCT ${currentIndex + 1}`
                );


                updateElement(
                    name,
                    product.name
                );


                updateElement(
                    brand,
                    product.brand
                );


                updateElement(
                    description,
                    product.description
                );


                updateElement(
                    score,
                    Number(product.score)
                        .toFixed(1)
                );


                updateElement(
                    percentage,
                    `${product.percentage}%`
                );


                updateElement(
                    consensus,
                    getConsensusLabel(
                        product.percentage
                    )
                );


                if (consensusBar) {

                    consensusBar.style.width =
                        `${product.percentage}%`;

                }


                /*
                   AMAZON CTA
                   ----------------
                   Only show it when the product has
                   an actual configured link.

                   The CTA copy is intentionally
                   curiosity-driven.
                */

                if (link) {

                    const validLink =
                        isValidAffiliateLink(
                            product.link
                        );


                    if (validLink) {

                        link.href =
                            product.link;


                        link.textContent =
                            "See Why Moms Love It →";


                        link.style.display =
                            "";


                        link.setAttribute(
                            "target",
                            "_blank"
                        );


                        link.setAttribute(
                            "rel",
                            "nofollow sponsored noopener"
                        );

                    } else {

                        link.removeAttribute(
                            "href"
                        );


                        link.style.display =
                            "none";

                    }

                }


                /*
                   PRODUCT POSITION
                   ----------------
                   This is intentionally NOT tied
                   to vote count.
                */

                updateElement(
                    position,
                    `PRODUCT ${currentIndex + 1} OF ${battleProducts.length}`
                );


                const noPercent =
                    getNoPercentage(
                        product.percentage
                    );


                updateElement(
                    yesPercentage,
                    `${product.percentage}%`
                );


                updateElement(
                    noPercentage,
                    `${noPercent}%`
                );


                updateDots();


                /*
                   Restore this individual product's
                   vote, if one exists.
                */

                restoreVoteState();


                /*
                   Update how many products in this
                   battle have been voted on.
                */

                updateBattleVoteCount();


                /*
                   Check whether BOTH products have
                   been voted on.
                */

                updateBattleWinner();


                updateButtonLabels();


            }, 120);

        }


        /* =================================================
           UPDATE BUTTON COPY
        ================================================= */

        function updateButtonLabels() {

            if (!nextContender) {
                return;
            }


            const nextIndex =
                (
                    currentIndex + 1
                ) %
                battleProducts.length;


            const nextProduct =
                battleProducts[
                    nextIndex
                ];


            /*
               Keep the next-product CTA specific
               to the product the mom is about to see.
            */

            nextContender.textContent =
                `See ${nextProduct.name} →`;

        }


        /* =================================================
           DOT STATE
        ================================================= */

        function updateDots() {

            if (!dotsContainer) {
                return;
            }


            const dots =
                dotsContainer.querySelectorAll(
                    ".battle-dot"
                );


            dots.forEach(
                (dot, index) => {

                    dot.classList.toggle(
                        "active",
                        index === currentIndex
                    );


                    /*
                       Optional accessibility state.
                    */

                    dot.setAttribute(
                        "aria-current",
                        index === currentIndex
                            ? "true"
                            : "false"
                    );

                }
            );

        }


        /* =================================================
           VOTE KEY
        ================================================= */

        /*
           Each product has its own permanent key.

           Example:

           baby-0
           baby-1

           This means voting for Product 1 never
           accidentally marks Product 2 as voted.
        */

        function getVoteKey() {

            return `${category}-${currentIndex}`;

        }


        /* =================================================
           CAST VOTE
        ================================================= */

        function castVote(
            choice
        ) {

            const key =
                getVoteKey();


            /*
               Prevent duplicate votes.

               Returning to a product that was already
               voted on simply restores its result.
            */

            if (savedVotes[key]) {

                showVoteResult(
                    savedVotes[key],
                    true
                );


                return;

            }


            /*
               Save THIS product's vote.
            */

            savedVotes[key] =
                choice;


            saveVotes();


            /*
               Update session totals.
            */

            session.totalVotes =
                getTotalVoteCount();


            /*
               Streak increments only when a genuinely
               new vote is cast.
            */

            session.streak =
                Number(
                    session.streak || 0
                ) + 1;


            saveSession();


            updateStreak();

            updateGlobalProgress();

            updateBattleVoteCount();


            showVoteResult(
                choice,
                false
            );


            celebrate();


            /*
               Check whether this vote completed
               the entire two-product battle.
            */

            updateBattleWinner();

        }


        /* =================================================
           VOTE RESULT
        ================================================= */

        function showVoteResult(
            choice,
            existingVote = false
        ) {

            const product =
                battleProducts[
                    currentIndex
                ];


            const yes =
                product.percentage;


            const no =
                getNoPercentage(
                    product.percentage
                );


            /*
               Hide voting controls after the product
               has been voted on.
            */

            if (voteArea) {

                voteArea.style.display =
                    "none";

            }


            /*
               Reveal individual product result.
            */

            if (result) {

                result.classList.add(
                    "visible"
                );

            }


            if (socialComparison) {

                socialComparison.classList.add(
                    "visible"
                );

            }


            if (choice === "yes") {

                if (resultTitle) {

                    resultTitle.textContent =
                        "🎉 You picked it!";

                }


                if (yes >= 50) {

                    if (resultText) {

                        resultText.textContent =
                            `You're on the same side as ${yes}% of moms who recommend this one.`;

                    }


                    if (yourPosition) {

                        yourPosition.textContent =
                            `You're with the ${yes}% majority. 💗`;

                    }

                } else {

                    if (resultText) {

                        resultText.textContent =
                            `Interesting pick 👀 Only ${yes}% currently recommend this one.`;

                    }


                    if (yourPosition) {

                        yourPosition.textContent =
                            `You're with the ${yes}% minority. 👀`;

                    }

                }

            } else {

                if (resultTitle) {

                    resultTitle.textContent =
                        "👀 You'd skip it!";

                }


                if (no >= 50) {

                    if (resultText) {

                        resultText.textContent =
                            `${no}% currently wouldn't recommend this one either.`;

                    }


                    if (yourPosition) {

                        yourPosition.textContent =
                            `You're with the ${no}% majority.`;

                    }

                } else {

                    if (resultText) {

                        resultText.textContent =
                            `Most moms would choose it — ${yes}% currently recommend it.`;

                    }


                    if (yourPosition) {

                        yourPosition.textContent =
                            `You're with the ${no}% minority. 👀`;

                    }

                }

            }


            if (existingVote) {

                showToast(
                    "You already voted on this one 💗"
                );

            }


            /*
               This does NOT mean the battle is complete.

               It only checks whether BOTH products
               now have votes.
            */

            checkBattleCompletion();

            updateNextBattleButton();

        }


        /* =================================================
           RESTORE VOTE
        ================================================= */

        function restoreVoteState() {

            const key =
                getVoteKey();


            const existingVote =
                savedVotes[key];


            /*
               No vote for this particular product.

               Show the voting UI and hide the result.
            */

            if (!existingVote) {

                if (voteArea) {

                    voteArea.style.display =
                        "";

                }


                if (result) {

                    result.classList.remove(
                        "visible"
                    );

                }


                if (socialComparison) {

                    socialComparison.classList.remove(
                        "visible"
                    );

                }


                return;

            }


            /*
               A vote exists for THIS product.

               Restore exactly that result.
            */

            showVoteResult(
                existingVote,
                false
            );

        }


        /* =================================================
           BATTLE COMPLETION
        ================================================= */

        function checkBattleCompletion() {

            const complete =
                isBattleComplete(
                    category
                );


            /*
               IMPORTANT:
               Do NOT show the winner after only one vote.
            */

            if (!complete) {

                if (winner) {

                    winner.classList.remove(
                        "visible"
                    );

                }


                if (winnerText) {

                    const firstVoted =
                        Boolean(
                            savedVotes[
                                `${category}-0`
                            ]
                        );


                    const secondVoted =
                        Boolean(
                            savedVotes[
                                `${category}-1`
                            ]
                        );


                    if (
                        firstVoted &&
                        !secondVoted
                    ) {

                        winnerText.textContent =
                            "You picked Product 1. Now see what you think of Product 2.";

                    } else if (
                        !firstVoted &&
                        secondVoted
                    ) {

                        winnerText.textContent =
                            "You picked Product 2. Now see what you think of Product 1.";

                    } else {

                        winnerText.textContent =
                            "Vote for both products to reveal the battle result.";

                    }

                }


                return false;

            }


            const first =
                battleProducts[0];


            const second =
                battleProducts[1];


            if (winner) {

                winner.classList.add(
                    "visible"
                );

            }


            if (
                first.percentage >
                second.percentage
            ) {

                if (winnerText) {

                    winnerText.textContent =
                        `🏆 ${first.name} is currently ahead ${first.percentage}% to ${second.percentage}%.`;

                }

            } else if (
                second.percentage >
                first.percentage
            ) {

                if (winnerText) {

                    winnerText.textContent =
                        `🏆 ${second.name} is currently ahead ${second.percentage}% to ${first.percentage}%.`;

                }

            } else {

                if (winnerText) {

                    winnerText.textContent =
                        "🤝 It's a tie — moms can't decide.";

                }

            }


            updateGlobalProgress();


            return true;

        }


        /* =================================================
           VOTE COUNT
        ================================================= */

        function updateBattleVoteCount() {

            const element =
                battle.querySelector(
                    "[data-battle-vote-count]"
                );


            if (!element) {
                return;
            }


            let count = 0;


            battleProducts.forEach(
                (product, index) => {

                    if (
                        savedVotes[
                            `${category}-${index}`
                        ]
                    ) {

                        count++;

                    }

                }
            );


            /*
               This is VOTING progress.

               It is deliberately separate from
               PRODUCT 1 OF 2 / PRODUCT 2 OF 2.
            */

            element.textContent =
                `${count}/${battleProducts.length} picked`;


            element.classList.toggle(
                "complete",
                count === battleProducts.length
            );

        }


        /* =================================================
           NEXT BATTLE BUTTON
        ================================================= */

        function createNextBattleButton() {

            if (
                battle.querySelector(
                    ".next-battle-cta"
                )
            ) {

                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "next-battle-cta";


            button.innerHTML = `

                <span>
                    ${randomEncouragement()}
                </span>

                <strong>
                    Next battle →
                </strong>

            `;


            button.addEventListener(
                "click",
                () => {

                    goToNextBattle(
                        battle
                    );

                }
            );


            const footer =
                battle.querySelector(
                    ".battle-footer"
                );


            if (footer) {

                footer.parentNode.insertBefore(
                    button,
                    footer
                );

            } else {

                battle.appendChild(
                    button
                );

            }

        }


        /* =================================================
           CHECK NEXT BUTTON
        ================================================= */

        function updateNextBattleButton() {

            const complete =
                isBattleComplete(
                    category
                );


            const button =
                battle.querySelector(
                    ".next-battle-cta"
                );


            /*
               The next battle CTA is only available
               after BOTH products have been voted on.
            */

            if (complete) {

                createNextBattleButton();

            } else if (button) {

                button.remove();

            }

        }


        /* =================================================
           WINNER UPDATE WRAPPER
        ================================================= */

        function updateBattleWinner() {

            checkBattleCompletion();

            updateNextBattleButton();

        }


        /* =================================================
           ARROWS
        ================================================= */

        if (prevButton) {

            prevButton.addEventListener(
                "click",
                () => {

                    showProduct(
                        currentIndex - 1,
                        "previous"
                    );

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                "click",
                () => {

                    showProduct(
                        currentIndex + 1,
                        "next"
                    );

                }
            );

        }


        /* =================================================
           NEXT CONTENDER
        ================================================= */

        if (nextContender) {

            nextContender.addEventListener(
                "click",
                () => {

                    showProduct(
                        currentIndex + 1
                    );


                    setTimeout(() => {

                        battle.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }, 50);

                }
            );

        }


        /* =================================================
           VOTE BUTTONS
        ================================================= */

        voteButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const choice =
                            button.dataset.vote;


                        if (
                            choice !== "yes" &&
                            choice !== "no"
                        ) {

                            console.warn(
                                `Invalid vote choice: ${choice}`
                            );


                            return;

                        }


                        castVote(
                            choice
                        );

                    }
                );

            }
        );


        /* =================================================
           SWIPE SUPPORT
        ================================================= */

        let touchStartX = 0;

        let touchStartY = 0;


        battle.addEventListener(
            "touchstart",
            (event) => {

                const touch =
                    event.changedTouches[0];


                touchStartX =
                    touch.screenX;


                touchStartY =
                    touch.screenY;

            },
            {
                passive: true
            }
        );


        battle.addEventListener(
            "touchend",
            (event) => {

                const touch =
                    event.changedTouches[0];


                const differenceX =
                    touchStartX -
                    touch.screenX;


                const differenceY =
                    touchStartY -
                    touch.screenY;


                if (
                    Math.abs(differenceX) <
                    MIN_SWIPE_DISTANCE
                ) {

                    return;

                }


                if (
                    Math.abs(differenceY) >
                    Math.abs(differenceX)
                ) {

                    return;

                }


                if (
                    differenceX > 0
                ) {

                    showProduct(
                        currentIndex + 1
                    );

                } else {

                    showProduct(
                        currentIndex - 1
                    );

                }

            },
            {
                passive: true
            }
        );


        /* =================================================
           IMAGE ERROR HANDLING
        ================================================= */

        if (image) {

            image.addEventListener(
                "error",
                () => {

                    image.classList.add(
                        "image-error"
                    );


                    image.alt =
                        "Product image unavailable";

                }
            );

        }


        /* =================================================
           INITIALIZE BATTLE
        ================================================= */

        showProduct(
            0
        );

    });


    /* =====================================================
       NEXT BATTLE
    ===================================================== */

    function goToNextBattle(
        currentBattle
    ) {

        const allBattles =
            Array.from(
                document.querySelectorAll(
                    ".product-battle"
                )
            );


        const currentIndex =
            allBattles.indexOf(
                currentBattle
            );


        let nextBattle =
            null;


        /*
           First try to move forward.
        */

        for (
            let i = currentIndex + 1;
            i < allBattles.length;
            i++
        ) {

            if (
                !allBattles[i].classList.contains(
                    "filtered-out"
                )
            ) {

                nextBattle =
                    allBattles[i];

                break;

            }

        }


        /*
           If we're at the end, loop back to
           the first visible battle.
        */

        if (!nextBattle) {

            for (
                let i = 0;
                i < currentIndex;
                i++
            ) {

                if (
                    !allBattles[i].classList.contains(
                        "filtered-out"
                    )
                ) {

                    nextBattle =
                        allBattles[i];

                    break;

                }

            }

        }


        if (!nextBattle) {

            showToast(
                "You've reached the end! 🏆"
            );


            return;

        }


        nextBattle.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        setTimeout(() => {

            const firstButton =
                nextBattle.querySelector(
                    "[data-vote]"
                );


            if (
                firstButton &&
                firstButton.offsetParent !== null
            ) {

                firstButton.focus({
                    preventScroll: true
                });

            }

        }, 650);

    }


    /* =====================================================
       CATEGORY NAVIGATION
    ===================================================== */

    const categoryLinks =
        document.querySelectorAll(
            ".category-link"
        );


    categoryLinks.forEach(
        (link) => {

            link.addEventListener(
                "click",
                () => {

                    categoryLinks.forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================================
       CATEGORY OBSERVER
       Makes active category update while scrolling.
    ===================================================== */

    if (
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                (entries) => {

                    const visible =
                        entries
                            .filter(
                                (entry) =>
                                    entry.isIntersecting
                            )
                            .sort(
                                (a, b) =>
                                    b.intersectionRatio -
                                    a.intersectionRatio
                            );


                    if (!visible.length) {
                        return;
                    }


                    const category =
                        visible[0]
                            .target
                            .dataset
                            .category;


                    categoryLinks.forEach(
                        (link) => {

                            link.classList.toggle(
                                "active",
                                link.getAttribute(
                                    "href"
                                ) ===
                                `#${category}`
                            );

                        }
                    );

                },
                {
                    threshold: [
                        0.25,
                        0.5,
                        0.75
                    ]
                }
            );


        battles.forEach(
            (battle) => {

                observer.observe(
                    battle
                );

            }
        );

    }


    /* =====================================================
       DISCOVERY FILTERS
    ===================================================== */

    const filters =
        document.querySelectorAll(
            ".discovery-filter"
        );


    filters.forEach(
        (filter) => {

            filter.addEventListener(
                "click",
                () => {

                    const selected =
                        filter.dataset.filter;


                    filters.forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    filter.classList.add(
                        "active"
                    );


                    battles.forEach(
                        (battle) => {

                            if (
                                selected === "all"
                            ) {

                                battle.classList.remove(
                                    "filtered-out"
                                );


                                return;

                            }


                            const tags =
                                (
                                    battle.dataset
                                        .filterTags ||
                                    ""
                                )
                                    .split(/\s+/)
                                    .filter(Boolean);


                            if (
                                tags.includes(
                                    selected
                                )
                            ) {

                                battle.classList.remove(
                                    "filtered-out"
                                );

                            } else {

                                battle.classList.add(
                                    "filtered-out"
                                );

                            }

                        }
                    );


                    const firstVisible =
                        document.querySelector(
                            ".product-battle:not(.filtered-out)"
                        );


                    if (firstVisible) {

                        setTimeout(() => {

                            firstVisible.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }, 120);

                    }

                }
            );

        }
    );


    /* =====================================================
       INITIAL GLOBAL UI
    ===================================================== */

    updateGlobalProgress();

    updateStreak();


    /* =====================================================
       RETURN TO TOP / VOTING PROGRESS STATE
    ===================================================== */

    window.addEventListener(
        "scroll",
        () => {

            const completed =
                getCompletedBattleCount();


            if (
                completed > 0 &&
                completed < totalBattles
            ) {

                document.body.classList.add(
                    "has-voting-progress"
                );

            } else {

                document.body.classList.remove(
                    "has-voting-progress"
                );

            }

        },
        {
            passive: true
        }
    );


    /* =====================================================
       OPTIONAL RESET FUNCTION

       Console:
       resetMomVotes()
    ===================================================== */

    window.resetMomVotes =
        function () {

            localStorage.removeItem(
                STORAGE_KEY
            );


            localStorage.removeItem(
                SESSION_KEY
            );


            window.location.reload();

        };


});