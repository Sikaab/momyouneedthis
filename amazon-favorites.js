/* =========================================================
   MOM-VOTED PRODUCT EXPERIENCE
   amazon-favorites.js

   Features:
   - Persistent votes
   - Personal voting count
   - Voting progress
   - Instant vote feedback
   - "Keep discovering" interaction
   - Smooth scrolling
   - Returning-user vote state
   - No fake activity numbers
========================================================= */


document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       STORAGE
    ===================================================== */

    const STORAGE_KEY = "momYouNeedThisVoting";


    const defaultState = {
        votes: {},
        totalVotes: 0
    };


    let state = loadState();


    function loadState() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return {
                    ...defaultState
                };
            }


            const parsed = JSON.parse(saved);


            return {
                votes:
                    parsed &&
                    typeof parsed.votes === "object"
                        ? parsed.votes
                        : {},

                totalVotes:
                    parsed &&
                    Number.isFinite(parsed.totalVotes)
                        ? parsed.totalVotes
                        : 0
            };

        } catch (error) {

            console.warn(
                "MomYouNeedThis voting data could not be loaded.",
                error
            );


            return {
                ...defaultState
            };

        }

    }


    function saveState() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

        } catch (error) {

            console.warn(
                "MomYouNeedThis voting data could not be saved.",
                error
            );

        }

    }


    /* =====================================================
       DOM
    ===================================================== */

    const productSections = [
        ...document.querySelectorAll(".product-battle")
    ];


    const voteCountElement =
        document.querySelector("[data-vote-count]");


    const progressFill =
        document.querySelector("[data-progress-fill]");


    const progressMessage =
        document.querySelector("[data-progress-message]");


    /* =====================================================
       PROGRESS
    ===================================================== */

    const totalProducts =
        productSections.length;


    function updatePersonalProgress() {

        const count = state.totalVotes;


        if (voteCountElement) {

            voteCountElement.textContent =
                `${count} ${count === 1 ? "vote" : "votes"}`;

        }


        /*
         * This is deliberately personal progress.
         *
         * It does NOT pretend to represent other users.
         */

        const progress =
            totalProducts > 0
                ? Math.min(
                    100,
                    (count / totalProducts) * 100
                )
                : 0;


        if (progressFill) {

            progressFill.style.width =
                `${progress}%`;

        }


        if (!progressMessage) {
            return;
        }


        if (count === 0) {

            progressMessage.textContent =
                "Cast your first vote to get started.";

            return;

        }


        if (count === 1) {

            progressMessage.textContent =
                "Nice start. Keep discovering.";

            return;

        }


        if (count < totalProducts) {

            progressMessage.textContent =
                "You're getting the hang of it. Keep going.";

            return;

        }


        progressMessage.textContent =
            "You've voted on every product you've discovered here.";

    }


    /* =====================================================
       PRODUCT SECTIONS
    ===================================================== */

    productSections.forEach((section) => {

        setupProductSection(section);

    });


    function setupProductSection(section) {

        const productId =
            section.dataset.productId;


        if (!productId) {
            return;
        }


        const voteButton =
            section.querySelector("[data-vote]");


        const voteResult =
            section.querySelector("[data-result]");


        const nextButton =
            section.querySelector("[data-next-discovery]");


        const votePercentage =
            section.querySelector("[data-vote-percentage]");


        const productName =
            section.querySelector("[data-name]");


        if (!voteButton) {
            return;
        }


        /*
         * Restore previous vote.
         */

        if (state.votes[productId]) {

            setVotedState(
                section,
                false
            );

        }


        /* =================================================
           VOTE
        ================================================= */

        voteButton.addEventListener(
            "click",
            () => {

                handleVote(
                    section,
                    productId
                );

            }
        );


        /* =================================================
           KEEP DISCOVERING
        ================================================= */

        if (nextButton) {

            nextButton.addEventListener(
                "click",
                () => {

                    goToNextProduct(
                        section
                    );

                }
            );

        }


        /* =================================================
           PREVENT EMPTY AMAZON LINK
        ================================================= */

        const shopLink =
            section.querySelector("[data-link]");


        if (
            shopLink &&
            shopLink.getAttribute("href") ===
            "YOUR-AMAZON-LINK-HERE"
        ) {

            shopLink.classList.add(
                "missing-affiliate-link"
            );

            shopLink.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    alert(
                        "Add the Amazon affiliate link for this product first."
                    );

                }
            );

        }


        /*
         * Keep variables referenced so future
         * product data can easily expand.
         */

        void voteResult;
        void votePercentage;
        void productName;

    }


    /* =====================================================
       HANDLE VOTE
    ===================================================== */

    function handleVote(
        section,
        productId
    ) {

        /*
         * Prevent multiple votes from the same
         * browser for the same product.
         */

        if (state.votes[productId]) {

            setVotedState(
                section,
                true
            );

            return;

        }


        state.votes[productId] = {
            votedAt: Date.now()
        };


        state.totalVotes += 1;


        saveState();


        setVotedState(
            section,
            true
        );


        updatePersonalProgress();


        /*
         * Tiny scroll adjustment on mobile.
         * It keeps the feedback visible without
         * aggressively jumping the user around.
         */

        if (
            window.innerWidth <= 700
        ) {

            setTimeout(() => {

                const result =
                    section.querySelector(
                        "[data-result]"
                    );


                if (result) {

                    const rect =
                        result.getBoundingClientRect();


                    if (
                        rect.bottom >
                        window.innerHeight
                    ) {

                        result.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });

                    }

                }

            }, 100);

        }

    }


    /* =====================================================
       VOTED STATE
    ===================================================== */

    function setVotedState(
        section,
        isReturningUser
    ) {

        const button =
            section.querySelector("[data-vote]");


        const result =
            section.querySelector("[data-result]");


        const resultTitle =
            section.querySelector("[data-result-title]");


        const resultMessage =
            section.querySelector("[data-result-message]");


        if (!button) {
            return;
        }


        button.classList.add(
            "has-voted"
        );


        button.disabled = true;


        button.querySelector("span:first-child")
            .textContent =
            "YOU RECOMMENDED THIS";


        const arrow =
            button.querySelector(".vote-arrow");


        if (arrow) {

            arrow.textContent = "✓";

        }


        if (result) {

            result.classList.add(
                "visible"
            );

        }


        if (resultTitle) {

            resultTitle.textContent =
                isReturningUser
                    ? "You already voted for this."
                    : "Your vote is in!";

        }


        if (resultMessage) {

            resultMessage.textContent =
                isReturningUser
                    ? "Your recommendation is saved on this device."
                    : "You just helped another mom narrow it down.";

        }

    }


    /* =====================================================
       NEXT DISCOVERY
    ===================================================== */

    function goToNextProduct(
        currentSection
    ) {

        const currentIndex =
            productSections.indexOf(
                currentSection
            );


        if (currentIndex === -1) {
            return;
        }


        /*
         * Find the next product section.
         *
         * If we're at the last one, loop back
         * to the first one.
         */

        let nextIndex =
            currentIndex + 1;


        if (
            nextIndex >=
            productSections.length
        ) {

            nextIndex = 0;

        }


        const nextSection =
            productSections[nextIndex];


        if (!nextSection) {
            return;
        }


        /*
         * Small delay makes the interaction feel
         * deliberate rather than abrupt.
         */

        window.setTimeout(() => {

            nextSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 80);

    }


    /* =====================================================
       UPDATE PROGRESS ON LOAD
    ===================================================== */

    updatePersonalProgress();


    /* =====================================================
       SMOOTH CATEGORY NAVIGATION
    ===================================================== */

    document
        .querySelectorAll(
            ".voting-categories a"
        )
        .forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    const targetId =
                        link.getAttribute("href");


                    if (
                        !targetId ||
                        !targetId.startsWith("#")
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        });


    /* =====================================================
       INTERSECTION OBSERVER
       Highlights the category currently being viewed.
    ===================================================== */

    const categoryLinks =
        new Map();


    document
        .querySelectorAll(
            ".voting-categories a"
        )
        .forEach((link) => {

            const targetId =
                link.getAttribute("href");


            if (!targetId) {
                return;
            }


            categoryLinks.set(
                targetId,
                link
            );

        });


    if (
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                !entry.isIntersecting
                            ) {

                                return;

                            }


                            const id =
                                `#${entry.target.id}`;


                            categoryLinks.forEach(
                                (link) => {

                                    link.classList.remove(
                                        "active"
                                    );

                                }
                            );


                            const activeLink =
                                categoryLinks.get(
                                    id
                                );


                            if (activeLink) {

                                activeLink.classList.add(
                                    "active"
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.25,
                    rootMargin:
                        "-15% 0px -55% 0px"
                }
            );


        productSections.forEach(
            (section) => {

                observer.observe(
                    section
                );

            }
        );

    }


    /* =====================================================
       IMAGE LOADING
       Adds a subtle premium reveal.
    ===================================================== */

    document
        .querySelectorAll(
            ".battle-product-image"
        )
        .forEach((image) => {

            if (image.complete) {

                image.classList.add(
                    "image-loaded"
                );

                return;

            }


            image.addEventListener(
                "load",
                () => {

                    image.classList.add(
                        "image-loaded"
                    );

                },
                {
                    once: true
                }
            );

        });


    /* =====================================================
       KEYBOARD ACCESSIBILITY
    ===================================================== */

    document
        .querySelectorAll(
            ".recommend-button"
        )
        .forEach((button) => {

            button.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        button.click();

                    }

                }
            );

        });


});