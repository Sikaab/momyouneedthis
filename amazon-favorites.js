/* =========================================================
   MOMYOU NEED THIS
   AMAZON FAVORITES / MOM VOTED PRODUCTS
========================================================= */


/* =========================================================
   PRODUCT DATA
========================================================= */

const productData = {

    baby: [

        {
            image: "assets/babyeinstein-aquarium.jpeg",

            alt: "Baby Einstein Soother Musical Crib Toy",

            name: "Soother Musical Crib Toy",

            brand: "Baby Einstein",

            description:
                "A popular option for keeping little ones entertained during quiet moments and daily routines.",

            percentage: 62,

            link: "https://amzn.to/4fNqr9j"
        },


        {
            image: "assets/product2.jpg",

            alt: "Baby product favorite",

            name: "Another Baby Favorite",

            brand: "MomYouNeedThis Pick",

            description:
                "A practical baby product that many parents appreciate during everyday routines.",

            percentage: 54,

            link: "YOUR-AMAZON-LINK-HERE"
        }

    ],


    toddler: [

        {
            image: "assets/product2.jpg",

            alt: "Toddler favorite product",

            name: "Toddler Favorite",

            brand: "MomYouNeedThis Pick",

            description:
                "A practical everyday product designed to make life with toddlers a little easier.",

            percentage: 57,

            link: "YOUR-AMAZON-LINK-HERE"
        },


        {
            image: "assets/product2.jpg",

            alt: "Toddler product favorite",

            name: "Another Toddler Favorite",

            brand: "Parent Pick",

            description:
                "A simple product parents keep coming back to because it makes everyday toddler life easier.",

            percentage: 64,

            link: "YOUR-AMAZON-LINK-HERE"
        }

    ],


    sleep: [

        {
            image: "assets/white-noise-machine.jpeg",

            alt: "White noise machine",

            name: "White Noise Machine",

            brand: "Parent Favorite",

            description:
                "A popular choice for creating a consistent sleep environment for little ones.",

            percentage: 71,

            link: "https://amzn.to/4z8LxGC"
        },


        {
            image: "assets/product2.jpg",

            alt: "Baby sleep product",

            name: "Sleep Time Favorite",

            brand: "Mom Pick",

            description:
                "A simple sleep-time helper parents often keep nearby during naps and bedtime.",

            percentage: 63,

            link: "YOUR-AMAZON-LINK-HERE"
        }

    ],


    potty: [

        {
            image: "assets/babybjorn-potty-toilet.jpeg",

            alt: "BabyBjörn potty",

            name: "Potty Training Seat",

            brand: "BabyBjörn",

            description:
                "A simple potty-training option designed to help toddlers feel comfortable and confident.",

            percentage: 68,

            link: "https://amzn.to/3S23eqS"
        },


        {
            image: "assets/product2.jpg",

            alt: "Potty training favorite",

            name: "Potty Training Favorite",

            brand: "Parent Pick",

            description:
                "A practical potty-training helper designed to make the transition a little easier.",

            percentage: 59,

            link: "YOUR-AMAZON-LINK-HERE"
        }

    ]

};


/* =========================================================
   STATE
========================================================= */

const state = {};

let totalVotes =
    Number(
        localStorage.getItem("momYouNeedThisTotalVotes")
    ) || 1284;


let yourPicks =
    Number(
        localStorage.getItem("momYouNeedThisYourPicks")
    ) || 0;


const votedProducts =
    JSON.parse(
        localStorage.getItem("momYouNeedThisVotedProducts") || "{}"
    );


/* =========================================================
   DOM HELPERS
========================================================= */

const qs = (selector, parent = document) =>
    parent.querySelector(selector);


const qsa = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =========================================================
   UPDATE GLOBAL PARTICIPATION
========================================================= */

function updateParticipation() {

    const totalElement =
        qs("[data-total-votes]");

    const picksElement =
        qs("[data-your-picks]");

    const messageElement =
        qs("[data-participation-message]");


    if (totalElement) {

        totalElement.textContent =
            totalVotes.toLocaleString();

    }


    if (picksElement) {

        picksElement.textContent =
            yourPicks;

    }


    if (!messageElement) return;


    if (yourPicks === 0) {

        messageElement.textContent =
            "Your votes help other moms decide.";

    }

    else if (yourPicks === 1) {

        messageElement.textContent =
            "You've made your first mom pick 💗";

    }

    else if (yourPicks < 4) {

        messageElement.textContent =
            "You're helping other moms choose.";

    }

    else {

        messageElement.textContent =
            "You're becoming a serious MomYouNeedThis voter ✨";

    }

}


/* =========================================================
   SAVE STATE
========================================================= */

function saveState() {

    localStorage.setItem(
        "momYouNeedThisTotalVotes",
        String(totalVotes)
    );


    localStorage.setItem(
        "momYouNeedThisYourPicks",
        String(yourPicks)
    );


    localStorage.setItem(
        "momYouNeedThisVotedProducts",
        JSON.stringify(votedProducts)
    );

}


/* =========================================================
   GET LEADING PRODUCT
========================================================= */

function getLeadingProduct(products) {

    let leaderIndex = 0;

    products.forEach((product, index) => {

        if (
            product.percentage >
            products[leaderIndex].percentage
        ) {

            leaderIndex = index;

        }

    });

    return leaderIndex;
}


/* =========================================================
   UPDATE MOM PICK
========================================================= */

function updateMomPick(
    battle,
    products,
    currentIndex
) {

    const banner =
        qs("[data-mom-pick]", battle);


    if (!banner) return;


    const leaderIndex =
        getLeadingProduct(products);


    if (leaderIndex === currentIndex) {

        banner.textContent =
            "✨ Current Mom Favorite";

        banner.classList.remove(
            "not-leading"
        );

    }

    else {

        banner.textContent =
            "💗 Another Mom Favorite";

        banner.classList.add(
            "not-leading"
        );

    }

}


/* =========================================================
   RENDER PRODUCT
========================================================= */

function renderProduct(
    battle,
    products,
    index,
    direction = "next"
) {

    const image =
        qs("[data-image]", battle);

    const name =
        qs("[data-name]", battle);

    const brand =
        qs("[data-brand]", battle);

    const description =
        qs("[data-description]", battle);

    const label =
        qs("[data-label]", battle);

    const percentage =
        qs("[data-vote-percentage]", battle);

    const progress =
        qs("[data-vote-progress]", battle);

    const link =
        qs("[data-link]", battle);

    const position =
        qs("[data-position]", battle);

    const confirmation =
        qs("[data-confirmation]", battle);

    const voteButton =
        qs("[data-vote]", battle);


    const product =
        products[index];


    if (!product) return;


    /* -----------------------------------------
       TRANSITION
    ----------------------------------------- */

    image.classList.add(
        "product-changing"
    );


    setTimeout(() => {

        image.src =
            product.image;

        image.alt =
            product.alt;


        name.textContent =
            product.name;


        brand.textContent =
            product.brand;


        description.textContent =
            product.description;


        label.textContent =
            `PRODUCT ${index + 1}`;


        percentage.textContent =
            `${product.percentage}%`;


        progress.style.width =
            `${product.percentage}%`;


        link.href =
            product.link;


        position.textContent =
            `${index + 1} / ${products.length}`;


        confirmation.textContent = "";

        confirmation.classList.remove(
            "visible"
        );


        voteButton.classList.remove(
            "has-voted"
        );


        if (
            votedProducts[
                `${battle.dataset.category}-${index}`
            ]
        ) {

            voteButton.classList.add(
                "has-voted"
            );

            confirmation.textContent =
                "You already recommended this one 💗";

            confirmation.classList.add(
                "visible"
            );

        }


        image.classList.remove(
            "product-changing"
        );


        updateMomPick(
            battle,
            products,
            index
        );


        updateDots(
            battle,
            products,
            index
        );

    }, 140);

}


/* =========================================================
   DOTS
========================================================= */

function updateDots(
    battle,
    products,
    currentIndex
) {

    const dots =
        qs("[data-dots]", battle);


    if (!dots) return;


    qsa(
        ".battle-dot",
        dots
    ).forEach((dot, index) => {

        dot.classList.toggle(
            "active",
            index === currentIndex
        );

    });

}


/* =========================================================
   CREATE DOTS
========================================================= */

function createDots(
    battle,
    products,
    setIndex
) {

    const container =
        qs("[data-dots]", battle);


    if (!container) return;


    container.innerHTML = "";


    products.forEach(
        (product, index) => {

            const dot =
                document.createElement("button");


            dot.type = "button";

            dot.className =
                "battle-dot";


            dot.setAttribute(
                "aria-label",
                `Show product ${index + 1}`
            );


            dot.addEventListener(
                "click",
                () => {

                    setIndex(index);

                }
            );


            container.appendChild(dot);

        }
    );

}


/* =========================================================
   VOTE
========================================================= */

function voteForProduct(
    battle,
    products,
    currentIndex
) {

    const category =
        battle.dataset.category;


    const voteKey =
        `${category}-${currentIndex}`;


    const confirmation =
        qs("[data-confirmation]", battle);


    const button =
        qs("[data-vote]", battle);


    const product =
        products[currentIndex];


    /* -----------------------------------------
       PREVENT DUPLICATE VOTE
    ----------------------------------------- */

    if (votedProducts[voteKey]) {

        confirmation.textContent =
            "You've already recommended this one 💗";

        confirmation.classList.add(
            "visible"
        );

        return;

    }


    /* -----------------------------------------
       SAVE VOTE
    ----------------------------------------- */

    votedProducts[voteKey] = true;


    product.percentage =
        Math.min(
            99,
            product.percentage + 1
        );


    totalVotes += 1;

    yourPicks += 1;


    saveState();

    updateParticipation();


    /* -----------------------------------------
       UI
    ----------------------------------------- */

    button.classList.add(
        "has-voted"
    );


    button.querySelector(
        "span:first-child"
    ).textContent =
        "RECOMMENDED";


    confirmation.textContent =
        `You're with ${product.percentage}% of moms 💗`;


    confirmation.classList.add(
        "visible"
    );


    const percentage =
        qs(
            "[data-vote-percentage]",
            battle
        );


    const progress =
        qs(
            "[data-vote-progress]",
            battle
        );


    percentage.textContent =
        `${product.percentage}%`;


    progress.style.width =
        `${product.percentage}%`;


    updateMomPick(
        battle,
        products,
        currentIndex
    );


    /* -----------------------------------------
       LITTLE FEEDBACK EFFECT
    ----------------------------------------- */

    button.animate(
        [
            {
                transform: "scale(1)"
            },

            {
                transform: "scale(1.04)"
            },

            {
                transform: "scale(1)"
            }
        ],
        {
            duration: 300,
            easing: "ease-out"
        }
    );


    /* -----------------------------------------
       UPDATE DISCOVERY MESSAGE
    ----------------------------------------- */

    const nextButton =
        qs(
            "[data-next-product]",
            battle
        );


    if (nextButton) {

        nextButton.textContent =
            "Nice pick! Show Me Another →";

    }

}


/* =========================================================
   INITIALIZE BATTLE
========================================================= */

function initializeBattle(battle) {

    const category =
        battle.dataset.category;


    const products =
        productData[category];


    if (
        !products ||
        products.length === 0
    ) {

        return;

    }


    state[category] = {
        index: 0
    };


    const getIndex = () =>
        state[category].index;


    const setIndex = (
        newIndex
    ) => {

        const oldIndex =
            state[category].index;


        if (newIndex === oldIndex) {

            return;

        }


        if (
            newIndex < 0
        ) {

            newIndex =
                products.length - 1;

        }


        if (
            newIndex >= products.length
        ) {

            newIndex = 0;

        }


        state[category].index =
            newIndex;


        renderProduct(
            battle,
            products,
            newIndex,
            newIndex > oldIndex
                ? "next"
                : "previous"
        );

    };


    /* -----------------------------------------
       DOTS
    ----------------------------------------- */

    createDots(
        battle,
        products,
        setIndex
    );


    /* -----------------------------------------
       ARROWS
    ----------------------------------------- */

    const previous =
        qs("[data-prev]", battle);


    const next =
        qs("[data-next]", battle);


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                setIndex(
                    getIndex() - 1
                );

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                setIndex(
                    getIndex() + 1
                );

            }
        );

    }


    /* -----------------------------------------
       VOTE
    ----------------------------------------- */

    const vote =
        qs("[data-vote]", battle);


    if (vote) {

        vote.addEventListener(
            "click",
            () => {

                voteForProduct(
                    battle,
                    products,
                    getIndex()
                );

            }
        );

    }


    /* -----------------------------------------
       NEXT PRODUCT CTA
    ----------------------------------------- */

    const nextProduct =
        qs(
            "[data-next-product]",
            battle
        );


    if (nextProduct) {

        nextProduct.addEventListener(
            "click",
            () => {

                setIndex(
                    getIndex() + 1
                );


                /* Scroll product into comfortable view
                   on mobile */

                if (
                    window.innerWidth <= 700
                ) {

                    setTimeout(() => {

                        battle.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }, 180);

                }

            }
        );

    }


    /* -----------------------------------------
       INITIAL RENDER
    ----------------------------------------- */

    renderProduct(
        battle,
        products,
        0
    );

}


/* =========================================================
   CATEGORY NAV SMOOTH SCROLL
========================================================= */

function initializeCategoryNavigation() {

    qsa(
        ".voting-categories a"
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const href =
                    link.getAttribute("href");


                if (
                    !href ||
                    !href.startsWith("#")
                ) {

                    return;

                }


                const target =
                    qs(href);


                if (!target) return;


                event.preventDefault();


                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });

}


/* =========================================================
   SWIPE SUPPORT
========================================================= */

function initializeSwipe(battle) {

    let startX = null;


    const viewer =
        qs(
            ".product-viewer",
            battle
        );


    if (!viewer) return;


    viewer.addEventListener(
        "touchstart",
        event => {

            if (
                event.touches.length !== 1
            ) {

                return;

            }


            startX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    viewer.addEventListener(
        "touchend",
        event => {

            if (
                startX === null
            ) {

                return;

            }


            const endX =
                event.changedTouches[0].clientX;


            const distance =
                endX - startX;


            startX = null;


            if (
                Math.abs(distance) < 50
            ) {

                return;

            }


            const category =
                battle.dataset.category;


            const products =
                productData[category];


            if (!products) return;


            const current =
                state[category].index;


            let nextIndex;


            if (distance < 0) {

                nextIndex =
                    current + 1;

            }

            else {

                nextIndex =
                    current - 1;

            }


            if (
                nextIndex < 0
            ) {

                nextIndex =
                    products.length - 1;

            }


            if (
                nextIndex >= products.length
            ) {

                nextIndex = 0;

            }


            state[category].index =
                nextIndex;


            renderProduct(
                battle,
                products,
                nextIndex
            );

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   INTERSECTION OBSERVER
   MAKES THE FEED FEEL ALIVE
========================================================= */

function initializeRevealAnimations() {

    const battles =
        qsa(".product-battle");


    if (
        !("IntersectionObserver" in window)
    ) {

        battles.forEach(
            battle =>
                battle.classList.add(
                    "battle-visible"
                )
        );

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "battle-visible"
                        );

                    }

                });

            },
            {
                threshold: .15
            }
        );


    battles.forEach(
        battle =>
            observer.observe(battle)
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

    updateParticipation();


    qsa(
        ".product-battle"
    ).forEach(
        battle => {

            initializeBattle(
                battle
            );

            initializeSwipe(
                battle
            );

        }
    );


    initializeCategoryNavigation();

    initializeRevealAnimations();

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

}

else {

    initialize();

}