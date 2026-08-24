/* =========================================================
   MOM-VOTED PRODUCT EXPERIENCE
   MomYouNeedThis
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const battles = document.querySelectorAll(".product-battle");

    if (!battles.length) {
        return;
    }


    /* =====================================================
       PRODUCT DATA

       Replace/add products here.

       The percentage represents the current community
       recommendation rate you want displayed.

       IMPORTANT:
       Do not use fake vote totals.
    ===================================================== */

    const products = {

        baby: [

            {
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
                name: "Baby Favorite",
                brand: "MomYouNeedThis Pick",
                image: "assets/product2.jpg",
                description:
                    "Another mom-loved option worth comparing before making your choice.",
                percentage: 38,
                score: 7.7,
                link: "YOUR-AMAZON-LINK-HERE"
            }

        ],


        toddler: [

            {
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
       LOCAL STORAGE
    ===================================================== */

    const STORAGE_KEY = "momYouNeedThisVotes";


    function getSavedVotes() {

        try {

            return JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};

        } catch (error) {

            return {};

        }

    }


    function saveVotes(votes) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(votes)
            );

        } catch (error) {

            console.warn(
                "Unable to save vote.",
                error
            );

        }

    }


    let savedVotes = getSavedVotes();


    /* =====================================================
       HELPERS
    ===================================================== */

    function getConsensusLabel(percentage) {

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


    function getNoPercentage(percentage) {

        return Math.max(
            0,
            Math.min(
                100,
                100 - percentage
            )
        );

    }


    function updateElement(element, value) {

        if (element) {
            element.textContent = value;
        }

    }


    /* =====================================================
       INITIALIZE BATTLE
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


        let currentIndex = 0;


        const image =
            battle.querySelector("[data-image]");

        const label =
            battle.querySelector("[data-label]");

        const name =
            battle.querySelector("[data-name]");

        const brand =
            battle.querySelector("[data-brand]");

        const description =
            battle.querySelector("[data-description]");

        const score =
            battle.querySelector("[data-score]");

        const percentage =
            battle.querySelector("[data-percentage]");

        const consensus =
            battle.querySelector("[data-consensus]");

        const consensusBar =
            battle.querySelector("[data-consensus-bar]");

        const link =
            battle.querySelector("[data-link]");

        const position =
            battle.querySelector("[data-position]");

        const yesPercentage =
            battle.querySelector("[data-yes-percentage]");

        const noPercentage =
            battle.querySelector("[data-no-percentage]");

        const result =
            battle.querySelector("[data-result]");

        const resultTitle =
            battle.querySelector("[data-result-title]");

        const resultText =
            battle.querySelector("[data-result-text]");

        const socialComparison =
            battle.querySelector(
                "[data-social-comparison]"
            );

        const yourPosition =
            battle.querySelector("[data-your-position]");

        const voteArea =
            battle.querySelector("[data-vote-area]");

        const winner =
            battle.querySelector("[data-winner]");

        const winnerText =
            battle.querySelector("[data-winner-text]");

        const dotsContainer =
            battle.querySelector("[data-dots]");

        const nextContender =
            battle.querySelector("[data-next-contender]");

        const prevButton =
            battle.querySelector("[data-prev]");

        const nextButton =
            battle.querySelector("[data-next]");


        /* =================================================
           CREATE DOTS
        ================================================= */

        dotsContainer.innerHTML = "";


        battleProducts.forEach((product, index) => {

            const dot =
                document.createElement("button");

            dot.type = "button";

            dot.className =
                "battle-dot";

            dot.setAttribute(
                "aria-label",
                `View product ${index + 1}`
            );


            dot.addEventListener(
                "click",
                () => {

                    showProduct(index);

                }
            );


            dotsContainer.appendChild(dot);

        });


        /* =================================================
           SHOW PRODUCT
        ================================================= */

        function showProduct(index) {

            currentIndex =
                (index + battleProducts.length)
                % battleProducts.length;


            const product =
                battleProducts[currentIndex];


            /* ---------------------------------------------
               ANIMATION
            --------------------------------------------- */

            image.classList.add(
                "product-changing"
            );


            setTimeout(() => {

                image.src =
                    product.image;

                image.alt =
                    product.name;

                label.textContent =
                    `PRODUCT ${currentIndex + 1}`;

                name.textContent =
                    product.name;

                brand.textContent =
                    product.brand;

                description.textContent =
                    product.description;

                score.textContent =
                    Number(product.score)
                    .toFixed(1);

                percentage.textContent =
                    `${product.percentage}%`;

                consensus.textContent =
                    getConsensusLabel(
                        product.percentage
                    );

                consensusBar.style.width =
                    `${product.percentage}%`;

                link.href =
                    product.link;

                position.textContent =
                    `PRODUCT ${currentIndex + 1} OF ${battleProducts.length}`;


                const noPercent =
                    getNoPercentage(
                        product.percentage
                    );


                yesPercentage.textContent =
                    `${product.percentage}%`;

                noPercentage.textContent =
                    `${noPercent}%`;


                image.classList.remove(
                    "product-changing"
                );


                updateDots();

                restoreVoteState();

            }, 130);

        }


        /* =================================================
           DOTS
        ================================================= */

        function updateDots() {

            const dots =
                dotsContainer.querySelectorAll(
                    ".battle-dot"
                );


            dots.forEach((dot, index) => {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );

            });

        }


        /* =================================================
           VOTE KEY
        ================================================= */

        function getVoteKey() {

            return `${category}-${currentIndex}`;

        }


        /* =================================================
           VOTE
        ================================================= */

        function castVote(choice) {

            const key =
                getVoteKey();


            savedVotes[key] =
                choice;


            saveVotes(savedVotes);


            showVoteResult(choice);

        }


        /* =================================================
           SHOW VOTE RESULT
        ================================================= */

        function showVoteResult(choice) {

            const product =
                battleProducts[currentIndex];


            const yes =
                product.percentage;

            const no =
                getNoPercentage(
                    product.percentage
                );


            voteArea.style.display =
                "none";


            result.classList.add(
                "visible"
            );


            socialComparison.classList.add(
                "visible"
            );


            if (choice === "yes") {

                resultTitle.textContent =
                    "🎉 You picked it!";


                if (yes >= 50) {

                    resultText.textContent =
                        `You're in the majority — ${yes}% of moms recommend this one.`;

                    yourPosition.textContent =
                        `You're with ${yes}% of moms. 💗`;

                } else {

                    resultText.textContent =
                        `You're in the minority — only ${yes}% of moms recommend this one.`;

                    yourPosition.textContent =
                        `You're with the ${yes}% minority. 👀`;

                }

            } else {

                resultTitle.textContent =
                    "👀 You'd skip it!";


                if (no >= 50) {

                    resultText.textContent =
                        `You're in the majority — ${no}% of moms would skip it.`;

                    yourPosition.textContent =
                        `You're with ${no}% of moms.`;

                } else {

                    resultText.textContent =
                        `Most moms disagree — ${yes}% would recommend it.`;

                    yourPosition.textContent =
                        `You're with the ${no}% minority.`;

                }

            }


            checkBattleCompletion();

        }


        /* =================================================
           RESTORE VOTE
        ================================================= */

        function restoreVoteState() {

            const key =
                getVoteKey();


            const existingVote =
                savedVotes[key];


            if (!existingVote) {

                voteArea.style.display =
                    "block";

                result.classList.remove(
                    "visible"
                );

                socialComparison.classList.remove(
                    "visible"
                );

                return;

            }


            showVoteResult(
                existingVote
            );

        }


        /* =================================================
           CHECK BATTLE
        ================================================= */

        function checkBattleCompletion() {

            const firstVote =
                savedVotes[
                    `${category}-0`
                ];

            const secondVote =
                savedVotes[
                    `${category}-1`
                ];


            if (
                !firstVote ||
                !secondVote
            ) {

                winner.classList.remove(
                    "visible"
                );

                winnerText.textContent =
                    "Vote for both products to see the winner.";

                return;

            }


            const first =
                battleProducts[0];

            const second =
                battleProducts[1];


            winner.classList.add(
                "visible"
            );


            if (
                first.percentage >
                second.percentage
            ) {

                winnerText.textContent =
                    `${first.name} is currently winning ${first.percentage}% to ${second.percentage}%.`;

            } else if (
                second.percentage >
                first.percentage
            ) {

                winnerText.textContent =
                    `${second.name} is currently winning ${second.percentage}% to ${first.percentage}%.`;

            } else {

                winnerText.textContent =
                    "It's a tie! Moms can't decide.";

            }

        }


        /* =================================================
           ARROWS
        ================================================= */

        prevButton.addEventListener(
            "click",
            () => {

                showProduct(
                    currentIndex - 1
                );

            }
        );


        nextButton.addEventListener(
            "click",
            () => {

                showProduct(
                    currentIndex + 1
                );

            }
        );


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


                    battle.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }
            );

        }


        /* =================================================
           VOTE BUTTONS
        ================================================= */

        const voteButtons =
            battle.querySelectorAll(
                "[data-vote]"
            );


        voteButtons.forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    castVote(
                        button.dataset.vote
                    );

                }
            );

        });


        /* =================================================
           SWIPE SUPPORT
        ================================================= */

        let touchStartX = 0;

        let touchEndX = 0;


        battle.addEventListener(
            "touchstart",
            (event) => {

                touchStartX =
                    event.changedTouches[0].screenX;

            },
            { passive: true }
        );


        battle.addEventListener(
            "touchend",
            (event) => {

                touchEndX =
                    event.changedTouches[0].screenX;


                const difference =
                    touchStartX - touchEndX;


                if (Math.abs(difference) < 45) {
                    return;
                }


                if (difference > 0) {

                    showProduct(
                        currentIndex + 1
                    );

                } else {

                    showProduct(
                        currentIndex - 1
                    );

                }

            },
            { passive: true }
        );


        /* =================================================
           INITIAL
        ================================================= */

        showProduct(0);

    });



    /* =====================================================
       CATEGORY NAV ACTIVE STATE
    ===================================================== */

    const categoryLinks =
        document.querySelectorAll(
            ".category-link"
        );


    categoryLinks.forEach((link) => {

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

    });



    /* =====================================================
       DISCOVERY FILTERS
    ===================================================== */

    const filters =
        document.querySelectorAll(
            ".discovery-filter"
        );


    filters.forEach((filter) => {

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
                                    .filterTags || ""
                            ).split(" ");


                        if (
                            tags.includes(selected)
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

                    }, 100);

                }

            }
        );

    });


});