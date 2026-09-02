/*
 * ============================================================
 * MOMYOU NEED THIS — MOM-VOTED PRODUCT BATTLES
 * ============================================================
 *
 * Firebase:
 * - Anonymous Authentication
 * - Firestore
 *
 * Collection:
 *     productVotes
 *
 * Swipe experience:
 * - One category visible at a time
 * - Swipe left → next product
 * - Swipe left from final product → next category
 * - Swipe right → previous product/category
 *
 * ============================================================
 */


/* ============================================================
   FIREBASE IMPORTS
   ============================================================ */

import { app, db } from "./firebase-config.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* ============================================================
   FIREBASE AUTH
   ============================================================ */

let auth = null;
let currentUser = null;
let authenticationReady = false;
let authenticationPromise = null;

try {

    auth = getAuth(app);

    console.log(
        "Firebase Authentication initialized."
    );

} catch (error) {

    console.error(
        "Firebase Authentication initialization failed:",
        error
    );

}


if (!db) {

    console.error(
        "Firestore database was not initialized. " +
        "Check firebase-config.js."
    );

} else {

    console.log(
        "Firestore initialized."
    );

}


/* ============================================================
   STATE
   ============================================================ */

const battleIndexes = {};

const voteInProgress = new Set();

const confirmedVotes = new Map();

let activeCategory = null;

let categoryTransitionInProgress = false;


/*
 * Prevents the browser from treating a swipe as
 * normal scrolling while the user is actively dragging
 * the battle card horizontally.
 */

let activeSwipe = null;


/* ============================================================
   CATEGORY ORDER
   ============================================================ */

const categoryOrder = [
    "baby",
    "toddler",
    "sleep",
    "potty",
    "feeding",
    "under25"
];


/* ============================================================
   PRODUCT DATA
   ============================================================ */

const battles = {

    baby: [

        {
            id: "baby-einstein-soother",

            name: "Soother Musical Crib Toy",

            brand: "Baby Einstein",

            image:
                "assets/babyeinstein-aquarium.jpeg",

            description:
                "A popular option for keeping little ones entertained during quiet moments and daily routines.",

            score: "8.4",

            percentage: 62,

            link:
                "https://amzn.to/4fNqr9j"
        },

        {
            id: "baby-einstein-aquarium",

            name: "Baby Einstein Aquarium",

            brand: "Baby Einstein",

            image:
                "assets/babyeinstein-aquarium.jpeg",

            description:
                "A colorful interactive option designed to keep babies engaged during everyday routines.",

            score: "8.2",

            percentage: 59,

            link:
                "https://amzn.to/4fNqr9j"
        }

    ],


    toddler: [

        {
            id: "toddler-favorite-1",

            name: "Toddler Favorite",

            brand:
                "MomYouNeedThis Pick",

            image:
                "assets/product2.jpg",

            description:
                "A practical everyday product designed to make life with toddlers a little easier.",

            score: "8.1",

            percentage: 57,

            link: "#"
        },

        {
            id: "toddler-favorite-2",

            name: "Toddler Favorite #2",

            brand:
                "MomYouNeedThis Pick",

            image:
                "assets/product2.jpg",

            description:
                "Another practical favorite parents may find useful during everyday toddler life.",

            score: "8.3",

            percentage: 61,

            link: "#"
        }

    ],


    sleep: [

        {
            id: "white-noise-machine",

            name: "White Noise Machine",

            brand:
                "Parent Favorite",

            image:
                "assets/white-noise-machine.jpeg",

            description:
                "A popular choice for creating a consistent sleep environment for little ones.",

            score: "8.7",

            percentage: 71,

            link:
                "https://amzn.to/4z8LxGC"
        },

        {
            id: "sleep-helper-2",

            name: "Sleep Helper",

            brand:
                "Parent Favorite",

            image:
                "assets/white-noise-machine.jpeg",

            description:
                "A simple sleep-support product designed to make bedtime routines easier.",

            score: "8.4",

            percentage: 65,

            link:
                "https://amzn.to/4z8LxGC"
        }

    ],


    potty: [

        {
            id: "babybjorn-potty",

            name: "Potty Training Seat",

            brand: "BabyBjörn",

            image:
                "assets/babybjorn-potty-toilet.jpeg",

            description:
                "A simple potty-training option designed to help toddlers feel comfortable and confident.",

            score: "8.6",

            percentage: 68,

            link:
                "https://amzn.to/3S23eqS"
        },

        {
            id: "potty-training-seat-2",

            name: "Potty Training Favorite",

            brand: "Mom Pick",

            image:
                "assets/babybjorn-potty-toilet.jpeg",

            description:
                "Another popular potty-training option designed for everyday use.",

            score: "8.2",

            percentage: 61,

            link:
                "https://amzn.to/3S23eqS"
        }

    ],


    feeding: [

        {
            id: "feeding-favorite-1",

            name: "Feeding Favorite",

            brand: "Mom Pick",

            image:
                "assets/product2.jpg",

            description:
                "A practical feeding favorite designed to make everyday mealtimes a little easier.",

            score: "8.0",

            percentage: 54,

            link: "#"
        },

        {
            id: "feeding-favorite-2",

            name: "Feeding Favorite #2",

            brand: "Mom Pick",

            image:
                "assets/product2.jpg",

            description:
                "A useful everyday feeding product designed to simplify mealtime routines.",

            score: "8.2",

            percentage: 58,

            link: "#"
        }

    ],


    under25: [

        {
            id: "under25-find-1",

            name: "Budget Mom Find",

            brand:
                "MomYouNeedThis Pick",

            image:
                "assets/product2.jpg",

            description:
                "A useful little find that could make everyday parenting just a bit easier.",

            score: "8.3",

            percentage: 63,

            link: "#"
        },

        {
            id: "under25-find-2",

            name: "Budget Mom Find #2",

            brand:
                "MomYouNeedThis Pick",

            image:
                "assets/product2.jpg",

            description:
                "A small everyday find that could make a practical difference for parents.",

            score: "8.1",

            percentage: 59,

            link: "#"
        }

    ]

};


/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

function getBattleKey(
    category,
    productId
) {

    return `${category}_${productId}`;

}


function getVoteDocumentId(
    category,
    productId,
    uid
) {

    return `${uid}_${category}_${productId}`;

}


function getCurrentProduct(
    category
) {

    const products =
        battles[category];

    if (
        !products ||
        products.length === 0
    ) {

        return null;

    }


    let index =
        battleIndexes[category];


    if (
        typeof index !== "number" ||
        index < 0 ||
        index >= products.length
    ) {

        index = 0;

        battleIndexes[category] = 0;

    }


    return products[index];

}


/* ============================================================
   CATEGORY HELPERS
   ============================================================ */

function getBattleElement(
    category
) {

    return document.querySelector(
        `.product-battle[data-category="${category}"]`
    );

}


function getCategoryIndex(
    category
) {

    return categoryOrder.indexOf(
        category
    );

}


function getNextCategory(
    category
) {

    const index =
        getCategoryIndex(category);

    if (index < 0) {

        return null;

    }

    return (
        categoryOrder[index + 1] ||
        null
    );

}


function getPreviousCategory(
    category
) {

    const index =
        getCategoryIndex(category);

    if (index <= 0) {

        return null;

    }

    return categoryOrder[index - 1];

}


/* ============================================================
   CATEGORY NAVIGATION
   ============================================================ */

function updateCategoryNavigation(
    category
) {

    document
        .querySelectorAll(
            ".category-link"
        )
        .forEach(
            link => {

                const isActive =
                    link.getAttribute("href") ===
                    `#${category}`;

                link.classList.toggle(
                    "active",
                    isActive
                );

                if (isActive) {

                    link.setAttribute(
                        "aria-current",
                        "page"
                    );

                    try {

                        link.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "center"
                        });

                    } catch (error) {

                        /* Older browsers can safely ignore this. */

                    }

                } else {

                    link.removeAttribute(
                        "aria-current"
                    );

                }

            }
        );

}


/*
 * Update the small global discovery indicator
 * if one exists.
 *
 * This also creates one automatically if the page
 * does not already contain one.
 */

function updateDiscoveryProgress(
    category
) {

    const categoryIndex =
        getCategoryIndex(category);

    const totalCategories =
        categoryOrder.length;

    const battle =
        getBattleElement(category);

    if (!battle) {

        return;

    }


    const productIndex =
        battleIndexes[category] || 0;

    const products =
        battles[category] || [];

    const totalProducts =
        products.length;


    let indicator =
        document.querySelector(
            "[data-discovery-progress]"
        );


    if (!indicator) {

        indicator =
            document.createElement(
                "div"
            );

        indicator.setAttribute(
            "data-discovery-progress",
            ""
        );

        indicator.className =
            "mv-discovery-progress";


        const nav =
            document.querySelector(
                ".voting-categories"
            );


        if (nav) {

            nav.parentNode.insertBefore(
                indicator,
                nav.nextSibling
            );

        }

    }


    setText(
        indicator.querySelector(
            "[data-discovery-category]"
        ),
        `BATTLE ${categoryIndex + 1} OF ${totalCategories}`
    );


    setText(
        indicator.querySelector(
            "[data-discovery-product]"
        ),
        `PRODUCT ${productIndex + 1} OF ${totalProducts}`
    );


    const fill =
        indicator.querySelector(
            "[data-discovery-fill]"
        );


    if (fill) {

        const totalSteps =
            categoryOrder.reduce(
                (sum, currentCategory) => {

                    return sum +
                        (
                            battles[currentCategory]
                                ? battles[currentCategory].length
                                : 0
                        );

                },
                0
            );


        const completedBefore =
            categoryOrder
                .slice(
                    0,
                    categoryIndex
                )
                .reduce(
                    (sum, currentCategory) => {

                        return sum +
                            (
                                battles[currentCategory]
                                    ? battles[currentCategory].length
                                    : 0
                            );

                    },
                    0
                );


        const currentStep =
            completedBefore +
            productIndex +
            1;


        const percentage =
            totalSteps > 0
                ? (currentStep / totalSteps) * 100
                : 0;


        fill.style.width =
            `${percentage}%`;

    }

}


/* ============================================================
   DISPLAY ONE CATEGORY
   ============================================================ */

function displayCategory(
    category,
    options = {}
) {

    if (
        !category ||
        !battles[category]
    ) {

        return;

    }


    const battlesOnPage =
        document.querySelectorAll(
            ".product-battle"
        );


    if (!battlesOnPage.length) {

        return;

    }


    const previousCategory =
        activeCategory;


    activeCategory =
        category;


    battlesOnPage.forEach(
        battle => {

            const isActive =
                battle.dataset.category ===
                category;


            battle.classList.toggle(
                "active-battle",
                isActive
            );


            battle.setAttribute(
                "aria-hidden",
                isActive
                    ? "false"
                    : "true"
            );


            if (!isActive) {

                battle.style.display =
                    "none";

            }

        }
    );


    const activeBattle =
        getBattleElement(category);


    if (!activeBattle) {

        return;

    }


    activeBattle.style.display =
        "";


    updateCategoryNavigation(
        category
    );


    updateDiscoveryProgress(
        category
    );


    /*
     * Update URL without causing the browser
     * to jump down the page.
     */

    if (
        options.updateHash !== false
    ) {

        try {

            const newUrl =
                `${window.location.pathname}${window.location.search}#${category}`;

            window.history.replaceState(
                null,
                "",
                newUrl
            );

        } catch (error) {

            console.warn(
                "Could not update category URL:",
                error
            );

        }

    }


    /*
     * Animate category changes.
     */

    if (
        previousCategory &&
        previousCategory !== category &&
        options.animate !== false
    ) {

        activeBattle.classList.remove(
            "category-enter-left",
            "category-enter-right"
        );


        void activeBattle.offsetWidth;


        const previousIndex =
            getCategoryIndex(
                previousCategory
            );


        const currentIndex =
            getCategoryIndex(
                category
            );


        if (
            currentIndex >
            previousIndex
        ) {

            activeBattle.classList.add(
                "category-enter-left"
            );

        } else {

            activeBattle.classList.add(
                "category-enter-right"
            );

        }


        window.setTimeout(
            () => {

                activeBattle.classList.remove(
                    "category-enter-left",
                    "category-enter-right"
                );

            },
            450
        );

    }

}


/* ============================================================
   MOVE TO NEXT CATEGORY
   ============================================================ */

function moveToNextCategory(
    animate = true
) {

    if (!activeCategory) {

        return;

    }


    const nextCategory =
        getNextCategory(
            activeCategory
        );


    if (!nextCategory) {

        /*
         * At the end, give the card a tiny bounce
         * rather than appearing broken.
         */

        const battle =
            getBattleElement(
                activeCategory
            );


        if (battle) {

            battle.classList.remove(
                "swipe-end"
            );

            void battle.offsetWidth;

            battle.classList.add(
                "swipe-end"
            );

        }

        return;

    }


    displayCategory(
        nextCategory,
        {
            animate
        }
    );


    showProduct(
        getBattleElement(
            nextCategory
        ),
        0
    );

}


/* ============================================================
   MOVE TO PREVIOUS CATEGORY
   ============================================================ */

function moveToPreviousCategory() {

    if (!activeCategory) {

        return;

    }


    const previousCategory =
        getPreviousCategory(
            activeCategory
        );


    if (!previousCategory) {

        return;

    }


    displayCategory(
        previousCategory,
        {
            animate: true
        }
    );


    const previousBattle =
        getBattleElement(
            previousCategory
        );


    const products =
        battles[previousCategory] || [];


    showProduct(
        previousBattle,
        Math.max(
            0,
            products.length - 1
        )
    );

}


/* ============================================================
   MOVE PRODUCT
   ============================================================ */

function goToNextProduct(
    battle
) {

    const category =
        battle.dataset.category;


    const products =
        battles[category];


    if (
        !products ||
        products.length === 0
    ) {

        return;

    }


    const currentIndex =
        battleIndexes[category] || 0;


    /*
     * Final product → next category.
     */

    if (
        currentIndex >=
        products.length - 1
    ) {

        if (
            category === activeCategory
        ) {

            moveToNextCategory();

        }

        return;

    }


    animateProductExit(
        battle,
        "left",
        () => {

            showProduct(
                battle,
                currentIndex + 1
            );

        }
    );

}


function goToPreviousProduct(
    battle
) {

    const category =
        battle.dataset.category;


    const products =
        battles[category];


    if (
        !products ||
        products.length === 0
    ) {

        return;

    }


    const currentIndex =
        battleIndexes[category] || 0;


    /*
     * First product → previous category.
     */

    if (
        currentIndex <= 0
    ) {

        if (
            category === activeCategory
        ) {

            moveToPreviousCategory();

        }

        return;

    }


    animateProductExit(
        battle,
        "right",
        () => {

            showProduct(
                battle,
                currentIndex - 1
            );

        }
    );

}


/* ============================================================
   PRODUCT EXIT ANIMATION
   ============================================================ */

function animateProductExit(
    battle,
    direction,
    callback
) {

    if (
        !battle ||
        categoryTransitionInProgress
    ) {

        return;

    }


    categoryTransitionInProgress =
        true;


    battle.classList.remove(
        "swipe-exit-left",
        "swipe-exit-right"
    );


    void battle.offsetWidth;


    battle.classList.add(
        direction === "left"
            ? "swipe-exit-left"
            : "swipe-exit-right"
    );


    window.setTimeout(
        () => {

            battle.classList.remove(
                "swipe-exit-left",
                "swipe-exit-right"
            );


            categoryTransitionInProgress =
                false;


            if (typeof callback === "function") {

                callback();

            }

        },
        330
    );

}


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function startAnonymousAuthentication() {

    if (!auth) {

        return Promise.reject(
            new Error(
                "Firebase Authentication is not initialized."
            )
        );

    }


    if (auth.currentUser) {

        currentUser =
            auth.currentUser;

        authenticationReady =
            true;

        return Promise.resolve(
            currentUser
        );

    }


    if (authenticationPromise) {

        return authenticationPromise;

    }


    authenticationPromise =
        new Promise(
            (resolve, reject) => {

                let finished = false;

                let unsubscribe = null;


                const finishSuccess =
                    (user) => {

                        if (finished) {

                            return;

                        }


                        finished = true;

                        currentUser =
                            user;

                        authenticationReady =
                            true;


                        if (unsubscribe) {

                            unsubscribe();

                        }


                        console.log(
                            "Firebase user ready:",
                            user.uid
                        );


                        resolve(
                            user
                        );

                    };


                const finishError =
                    (error) => {

                        if (finished) {

                            return;

                        }


                        finished = true;

                        authenticationReady =
                            false;

                        currentUser =
                            null;

                        authenticationPromise =
                            null;


                        if (unsubscribe) {

                            unsubscribe();

                        }


                        console.error(
                            "Firebase authentication error:",
                            error
                        );


                        reject(
                            error
                        );

                    };


                unsubscribe =
                    onAuthStateChanged(
                        auth,

                        async (user) => {

                            if (finished) {

                                return;

                            }


                            if (user) {

                                finishSuccess(
                                    user
                                );

                                return;

                            }


                            try {

                                const credential =
                                    await signInAnonymously(
                                        auth
                                    );


                                if (
                                    credential &&
                                    credential.user
                                ) {

                                    finishSuccess(
                                        credential.user
                                    );

                                } else {

                                    throw new Error(
                                        "Firebase did not return an authenticated user."
                                    );

                                }

                            } catch (error) {

                                finishError(
                                    error
                                );

                            }

                        },

                        (error) => {

                            finishError(
                                error
                            );

                        }
                    );

            }
        );


    return authenticationPromise;

}


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function getLocalVoteKey(
    category,
    productId
) {

    return (
        `momYouNeedThis_vote_${category}_${productId}`
    );

}


function saveConfirmedVoteLocally(
    category,
    productId,
    vote
) {

    if (
        vote !== "yes" &&
        vote !== "no"
    ) {

        return;

    }


    try {

        localStorage.setItem(
            getLocalVoteKey(
                category,
                productId
            ),
            vote
        );

    } catch (error) {

        console.warn(
            "Could not save local vote state:",
            error
        );

    }

}


function getConfirmedLocalVote(
    category,
    productId
) {

    try {

        const vote =
            localStorage.getItem(
                getLocalVoteKey(
                    category,
                    productId
                )
            );


        if (
            vote === "yes" ||
            vote === "no"
        ) {

            return vote;

        }

    } catch (error) {

        console.warn(
            "Could not read local vote state:",
            error
        );

    }


    return null;

}


/* ============================================================
   UI HELPERS
   ============================================================ */

function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;

    }

}


function setImage(
    imageElement,
    src,
    alt
) {

    if (!imageElement) {

        return;

    }


    imageElement.onerror =
        () => {

            console.warn(
                "Product image failed to load:",
                src
            );

            imageElement.classList.add(
                "image-load-error"
            );

        };


    imageElement.src =
        src;


    imageElement.alt =
        alt || "";

}


function updateProductPosition(
    battle,
    index,
    total
) {

    const position =
        battle.querySelector(
            "[data-position]"
        );


    const progressText =
        battle.querySelector(
            "[data-progress-text]"
        );


    const progress =
        battle.querySelector(
            "[data-progress]"
        );


    setText(
        position,
        `PRODUCT ${index + 1} OF ${total}`
    );


    setText(
        progressText,
        `${index + 1} / ${total}`
    );


    if (progress) {

        const percentage =
            total > 0
                ? ((index + 1) / total) * 100
                : 0;


        progress.style.width =
            `${percentage}%`;

    }

}


function updateDots(
    battle,
    products,
    activeIndex
) {

    const dots =
        battle.querySelector(
            "[data-dots]"
        );


    if (!dots) {

        return;

    }


    dots.innerHTML =
        "";


    products.forEach(
        (_, index) => {

            const dot =
                document.createElement(
                    "button"
                );


            dot.type =
                "button";


            dot.className =
                "battle-dot";


            if (
                index === activeIndex
            ) {

                dot.classList.add(
                    "active"
                );

            }


            dot.setAttribute(
                "aria-label",
                `View product ${index + 1}`
            );


            dot.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    showProduct(
                        battle,
                        index
                    );

                }
            );


            dots.appendChild(
                dot
            );

        }
    );

}


function updateScoreUI(
    battle,
    product
) {

    const percentage =
        Number(
            product.percentage
        ) || 0;


    const noPercentage =
        Math.max(
            0,
            100 - percentage
        );


    setText(
        battle.querySelector(
            "[data-score]"
        ),
        product.score
    );


    setText(
        battle.querySelector(
            "[data-percentage]"
        ),
        `${percentage}%`
    );


    setText(
        battle.querySelector(
            "[data-yes-percentage]"
        ),
        `${percentage}%`
    );


    setText(
        battle.querySelector(
            "[data-no-percentage]"
        ),
        `${noPercentage}%`
    );


    const consensusBar =
        battle.querySelector(
            "[data-consensus-bar]"
        );


    if (consensusBar) {

        consensusBar.style.width =
            `${percentage}%`;

    }


    const consensus =
        battle.querySelector(
            "[data-consensus]"
        );


    if (consensus) {

        if (
            percentage >= 70
        ) {

            consensus.textContent =
                "🔥 Mom favorite";

        } else if (
            percentage >= 60
        ) {

            consensus.textContent =
                "💗 Strong mom approval";

        } else {

            consensus.textContent =
                "👀 Moms are deciding";

        }

    }

}


/* ============================================================
   RESET VOTE UI
   ============================================================ */

function resetVoteUI(
    battle
) {

    const result =
        battle.querySelector(
            "[data-result]"
        );


    const socialComparison =
        battle.querySelector(
            "[data-social-comparison]"
        );


    const voteArea =
        battle.querySelector(
            "[data-vote-area]"
        );


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


    if (voteArea) {

        voteArea.classList.remove(
            "vote-complete"
        );

    }


    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {

                button.disabled =
                    false;

                button.classList.remove(
                    "selected"
                );

            }
        );

}


/* ============================================================
   SHOW SUCCESSFUL VOTE
   ============================================================ */

function showVoteUI(
    battle,
    vote
) {

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


    if (voteArea) {

        voteArea.classList.add(
            "vote-complete"
        );

    }


    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {

                button.disabled =
                    true;


                if (
                    button.dataset.vote ===
                    vote
                ) {

                    button.classList.add(
                        "selected"
                    );

                }

            }
        );


    if (result) {

        result.classList.add(
            "visible"
        );

    }


    setText(
        resultTitle,
        "Your vote is saved!"
    );


    setText(
        resultText,
        "Your vote was successfully registered."
    );


    if (socialComparison) {

        socialComparison.classList.add(
            "visible"
        );

    }


    const product =
        getCurrentProduct(
            battle.dataset.category
        );


    if (
        product &&
        yourPosition
    ) {

        const yes =
            Number(
                product.percentage
            ) || 0;


        const isMajority =
            vote === "yes"
                ? yes >= 50
                : yes < 50;


        setText(
            yourPosition,
            isMajority
                ? "You're with the majority."
                : "You're with the minority."
        );

    }


    /*
     * Add an extra visual confirmation.
     */

    battle.classList.remove(
        "vote-just-saved"
    );


    void battle.offsetWidth;


    battle.classList.add(
        "vote-just-saved"
    );

}


/* ============================================================
   SHOW VOTE ERROR
   ============================================================ */

function showVoteError(
    battle,
    message
) {

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


    const voteArea =
        battle.querySelector(
            "[data-vote-area]"
        );


    if (voteArea) {

        voteArea.classList.remove(
            "vote-complete"
        );

    }


    if (socialComparison) {

        socialComparison.classList.remove(
            "visible"
        );

    }


    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {

                button.disabled =
                    false;

                button.classList.remove(
                    "selected"
                );

            }
        );


    if (result) {

        result.classList.add(
            "visible"
        );

    }


    setText(
        resultTitle,
        "Vote not registered"
    );


    setText(
        resultText,
        message
    );

}


/* ============================================================
   LOAD EXISTING VOTE
   ============================================================ */

async function loadExistingVote(
    category,
    product
) {

    if (
        !currentUser ||
        !db
    ) {

        return null;

    }


    const key =
        getBattleKey(
            category,
            product.id
        );


    if (
        confirmedVotes.has(key)
    ) {

        return confirmedVotes.get(key);

    }


    const documentId =
        getVoteDocumentId(
            category,
            product.id,
            currentUser.uid
        );


    try {

        const voteRef =
            doc(
                db,
                "productVotes",
                documentId
            );


        const snapshot =
            await getDoc(
                voteRef
            );


        if (
            !snapshot.exists()
        ) {

            return null;

        }


        const data =
            snapshot.data();


        if (
            data.uid !==
            currentUser.uid
        ) {

            console.warn(
                "Vote document UID does not match current user."
            );

            return null;

        }


        if (
            data.vote !== "yes" &&
            data.vote !== "no"
        ) {

            console.warn(
                "Invalid vote value found in Firestore."
            );

            return null;

        }


        confirmedVotes.set(
            key,
            data.vote
        );


        saveConfirmedVoteLocally(
            category,
            product.id,
            data.vote
        );


        return data.vote;

    } catch (error) {

        console.warn(
            "Could not check existing Firestore vote:",
            error
        );


        return null;

    }

}


/* ============================================================
   SAVE VOTE
   ============================================================ */

async function saveVote(
    category,
    product,
    vote
) {

    if (!product) {

        throw new Error(
            "No product is currently selected."
        );

    }


    if (
        vote !== "yes" &&
        vote !== "no"
    ) {

        throw new Error(
            "Invalid vote."
        );

    }


    if (
        !authenticationReady ||
        !currentUser
    ) {

        await startAnonymousAuthentication();

    }


    if (!currentUser) {

        throw new Error(
            "No authenticated Firebase user exists."
        );

    }


    if (!db) {

        throw new Error(
            "Firestore is not initialized."
        );

    }


    const key =
        getBattleKey(
            category,
            product.id
        );


    if (
        voteInProgress.has(key)
    ) {

        return false;

    }


    if (
        confirmedVotes.has(key)
    ) {

        return false;

    }


    voteInProgress.add(
        key
    );


    try {

        const documentId =
            getVoteDocumentId(
                category,
                product.id,
                currentUser.uid
            );


        const voteRef =
            doc(
                db,
                "productVotes",
                documentId
            );


        await setDoc(
            voteRef,
            {
                uid:
                    currentUser.uid,

                category:
                    category,

                productId:
                    product.id,

                productName:
                    product.name,

                productBrand:
                    product.brand,

                vote:
                    vote,

                createdAt:
                    serverTimestamp()

            },
            {
                merge: false
            }
        );


        confirmedVotes.set(
            key,
            vote
        );


        saveConfirmedVoteLocally(
            category,
            product.id,
            vote
        );


        console.log(
            "Vote successfully saved:",
            {
                uid:
                    currentUser.uid,

                category:
                    category,

                productId:
                    product.id,

                vote:
                    vote
            }
        );


        return true;

    } catch (error) {

        console.error(
            "Vote was NOT saved:",
            error
        );


        throw error;

    } finally {

        voteInProgress.delete(
            key
        );

    }

}


/* ============================================================
   FIREBASE ERROR MESSAGES
   ============================================================ */

function getReadableFirebaseError(
    error
) {

    if (!error) {

        return (
            "Your vote could not be registered."
        );

    }


    console.error(
        "Full Firebase error:",
        error
    );


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "Firebase rejected the vote. " +
            "Check that Anonymous Authentication is enabled " +
            "and your Firestore rules allow authenticated users to create votes."
        );

    }


    if (
        error.code ===
        "auth/operation-not-allowed"
    ) {

        return (
            "Anonymous Authentication is not enabled " +
            "in your Firebase project."
        );

    }


    if (
        error.code ===
        "auth/network-request-failed"
    ) {

        return (
            "There was a network problem. " +
            "Your vote was not saved."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable. " +
            "Your vote was not saved."
        );

    }


    if (
        error.code ===
        "failed-precondition"
    ) {

        return (
            "Firebase could not complete the vote. " +
            "Please try again."
        );

    }


    return (
        "Your vote could not be registered. " +
        "Please try again."
    );

}


/* ============================================================
   HANDLE VOTE
   ============================================================ */

async function handleVote(
    battle,
    vote
) {

    const category =
        battle.dataset.category;


    const product =
        getCurrentProduct(
            category
        );


    if (!product) {

        return;

    }


    const key =
        getBattleKey(
            category,
            product.id
        );


    if (
        voteInProgress.has(key)
    ) {

        return;

    }


    try {

        await startAnonymousAuthentication();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );


        showVoteError(
            battle,
            "We couldn't connect your vote. Please try again."
        );


        return;

    }


    if (!currentUser) {

        showVoteError(
            battle,
            "We couldn't create your voting session. Please try again."
        );


        return;

    }


    try {

        const saved =
            await saveVote(
                category,
                product,
                vote
            );


        if (saved) {

            showVoteUI(
                battle,
                vote
            );

        }

    } catch (error) {

        console.error(
            "Vote registration failed:",
            error
        );


        showVoteError(
            battle,
            getReadableFirebaseError(
                error
            )
        );

    }

}


/* ============================================================
   DISPLAY PRODUCT
   ============================================================ */

async function showProduct(
    battle,
    index
) {

    if (!battle) {

        return;

    }


    const category =
        battle.dataset.category;


    const products =
        battles[category];


    if (
        !products ||
        products.length === 0
    ) {

        return;

    }


    if (index < 0) {

        index =
            products.length - 1;

    }


    if (
        index >= products.length
    ) {

        index = 0;

    }


    battleIndexes[category] =
        index;


    const product =
        products[index];


    updateProductPosition(
        battle,
        index,
        products.length
    );


    updateDots(
        battle,
        products,
        index
    );


    updateDiscoveryProgress(
        category
    );


    setImage(
        battle.querySelector(
            "[data-image]"
        ),
        product.image,
        product.name
    );


    setText(
        battle.querySelector(
            "[data-label]"
        ),
        `PRODUCT ${index + 1}`
    );


    setText(
        battle.querySelector(
            "[data-name]"
        ),
        product.name
    );


    setText(
        battle.querySelector(
            "[data-brand]"
        ),
        product.brand
    );


    setText(
        battle.querySelector(
            "[data-description]"
        ),
        product.description
    );


    const link =
        battle.querySelector(
            "[data-link]"
        );


    if (link) {

        link.href =
            product.link || "#";

    }


    updateScoreUI(
        battle,
        product
    );


    resetVoteUI(
        battle
    );


    const localVote =
        getConfirmedLocalVote(
            category,
            product.id
        );


    if (localVote) {

        const key =
            getBattleKey(
                category,
                product.id
            );


        confirmedVotes.set(
            key,
            localVote
        );


        showVoteUI(
            battle,
            localVote
        );


        return;

    }


    try {

        await startAnonymousAuthentication();


        if (!currentUser) {

            return;

        }


        if (
            battleIndexes[category] !==
            index
        ) {

            return;

        }


        const existingVote =
            await loadExistingVote(
                category,
                product
            );


        if (
            battleIndexes[category] !==
            index
        ) {

            return;

        }


        if (existingVote) {

            showVoteUI(
                battle,
                existingVote
            );

        }

    } catch (error) {

        console.warn(
            "Could not check existing vote:",
            error
        );

    }

}


/* ============================================================
   SWIPE SYSTEM
   ============================================================ */

function isSwipeBlockedTarget(
    target
) {

    if (!target) {

        return false;

    }


    return Boolean(
        target.closest(
            "button, a, input, select, textarea, label, [data-vote], [data-link], [data-next], [data-prev], [data-next-contender], [data-dots]"
        )
    );

}


/*
 * pointed interaction
 */

function initializeSwipe(
    battle
) {

    const slideArea =
        battle.querySelector(
            ".product-slide-area"
        );


    if (!slideArea) {

        return;

    }


    if (
        slideArea.dataset.swipeInitialized ===
        "true"
    ) {

        return;

    }


    slideArea.dataset.swipeInitialized =
        "true";


    slideArea.addEventListener(
        "pointerdown",
        (event) => {

            if (
                event.pointerType ===
                "mouse" &&
                event.button !== 0
            ) {

                return;

            }


            if (
                isSwipeBlockedTarget(
                    event.target
                )
            ) {

                return;

            }


            activeSwipe = {
                battle,
                pointerId:
                    event.pointerId,
                startX:
                    event.clientX,
                startY:
                    event.clientY,
                currentX:
                    event.clientX,
                currentY:
                    event.clientY,
                startedAt:
                    Date.now(),
                lockedAxis:
                    null
            };


            slideArea.setPointerCapture?.(
                event.pointerId
            );


            slideArea.classList.add(
                "is-dragging"
            );

        }
    );


    slideArea.addEventListener(
        "pointermove",
        (event) => {

            if (
                !activeSwipe ||
                activeSwipe.battle !== battle ||
                activeSwipe.pointerId !==
                    event.pointerId
            ) {

                return;

            }


            const dx =
                event.clientX -
                activeSwipe.startX;


            const dy =
                event.clientY -
                activeSwipe.startY;


            activeSwipe.currentX =
                event.clientX;


            activeSwipe.currentY =
                event.clientY;


            /*
             * Decide whether this is horizontal
             * before applying a card transformation.
             */

            if (
                !activeSwipe.lockedAxis
            ) {

                if (
                    Math.abs(dx) < 8 &&
                    Math.abs(dy) < 8
                ) {

                    return;

                }


                activeSwipe.lockedAxis =
                    Math.abs(dx) >
                    Math.abs(dy)
                        ? "horizontal"
                        : "vertical";

            }


            if (
                activeSwipe.lockedAxis !==
                "horizontal"
            ) {

                return;

            }


            /*
             * Once the gesture is clearly horizontal,
             * prevent the browser from interpreting it
             * as normal scrolling.
             */

            if (
                event.cancelable
            ) {

                event.preventDefault();

            }


            const limitedX =
                Math.max(
                    -220,
                    Math.min(
                        220,
                        dx
                    )
                );


            const rotation =
                limitedX *
                0.045;


            const opacity =
                Math.max(
                    0.72,
                    1 -
                    Math.abs(limitedX) /
                    500
                );


            slideArea.style.transform =
                `translate3d(${limitedX}px,0,0) rotate(${rotation}deg)`;


            slideArea.style.opacity =
                opacity;


            slideArea.classList.toggle(
                "swipe-ready-left",
                limitedX <
                    -80
            );


            slideArea.classList.toggle(
                "swipe-ready-right",
                limitedX >
                    80
            );

        },
        {
            passive: false
        }
    );


    const finishSwipe =
        (event) => {

            if (
                !activeSwipe ||
                activeSwipe.battle !== battle ||
                activeSwipe.pointerId !==
                    event.pointerId
            ) {

                return;

            }


            const dx =
                activeSwipe.currentX -
                activeSwipe.startX;


            const dy =
                activeSwipe.currentY -
                activeSwipe.startY;


            const elapsed =
                Math.max(
                    1,
                    Date.now() -
                    activeSwipe.startedAt
                );


            const velocity =
                Math.abs(dx) /
                elapsed;


            const distanceThreshold =
                Math.min(
                    125,
                    Math.max(
                        75,
                        window.innerWidth *
                        0.20
                    )
                );


            const shouldSwipe =
                activeSwipe.lockedAxis ===
                    "horizontal" &&
                (
                    Math.abs(dx) >=
                        distanceThreshold ||
                    velocity >=
                        0.65
                );


            slideArea.classList.remove(
                "is-dragging",
                "swipe-ready-left",
                "swipe-ready-right"
            );


            slideArea.style.transform =
                "";


            slideArea.style.opacity =
                "";


            activeSwipe =
                null;


            if (!shouldSwipe) {

                return;

            }


            if (dx < 0) {

                goToNextProduct(
                    battle
                );

            } else {

                goToPreviousProduct(
                    battle
                );

            }

        };


    slideArea.addEventListener(
        "pointerup",
        finishSwipe
    );


    slideArea.addEventListener(
        "pointercancel",
        finishSwipe
    );


    slideArea.addEventListener(
        "lostpointercapture",
        (event) => {

            if (
                activeSwipe &&
                activeSwipe.pointerId ===
                    event.pointerId
            ) {

                finishSwipe(
                    event
                );

            }

        }
    );

}


/* ============================================================
   SWIPE HINT
   ============================================================ */

function initializeSwipeHint(
    battle
) {

    const slideArea =
        battle.querySelector(
            ".product-slide-area"
        );


    if (!slideArea) {

        return;

    }


    if (
        slideArea.querySelector(
            ".mv-swipe-hint"
        )
    ) {

        return;

    }


    const hint =
        document.createElement(
            "div"
        );


    hint.className =
        "mv-swipe-hint";


    hint.innerHTML =
        `
            <span class="mv-swipe-arrow">←</span>
            <span>SWIPE FOR NEXT</span>
        `;


    slideArea.appendChild(
        hint
    );


    window.setTimeout(
        () => {

            hint.classList.add(
                "hint-hidden"
            );

        },
        5500
    );

}


/* ============================================================
   CATEGORY CLICK EVENTS
   ============================================================ */

function initializeCategoryNavigation() {

    document
        .querySelectorAll(
            ".category-link"
        )
        .forEach(
            link => {

                if (
                    link.dataset.categoryNavigationInitialized ===
                    "true"
                ) {

                    return;

                }


                link.dataset.categoryNavigationInitialized =
                    "true";


                link.addEventListener(
                    "click",
                    (event) => {

                        const href =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !href ||
                            !href.startsWith("#")
                        ) {

                            return;

                        }


                        const category =
                            href.slice(1);


                        if (
                            !battles[category]
                        ) {

                            return;

                        }


                        event.preventDefault();


                        displayCategory(
                            category,
                            {
                                animate: true
                            }
                        );

                    }
                );

            }
        );

}


/* ============================================================
   KEYBOARD NAVIGATION
   ============================================================ */

function initializeKeyboardNavigation() {

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Don't hijack keyboard controls while
             * typing into an input.
             */

            if (
                event.target.matches(
                    "input, textarea, select"
                )
            ) {

                return;

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                const battle =
                    getBattleElement(
                        activeCategory
                    );


                if (battle) {

                    goToPreviousProduct(
                        battle
                    );

                }

            }


            if (
                event.key ===
                "ArrowRight"
            ) {

                const battle =
                    getBattleElement(
                        activeCategory
                    );


                if (battle) {

                    goToNextProduct(
                        battle
                    );

                }

            }

        }
    );

}


/* ============================================================
   INITIALIZE ONE BATTLE
   ============================================================ */

function initializeBattle(
    battle
) {

    const category =
        battle.dataset.category;


    if (!category) {

        return;

    }


    if (!battles[category]) {

        return;

    }


    battleIndexes[category] =
        0;


    const next =
        battle.querySelector(
            "[data-next]"
        );


    if (next) {

        next.addEventListener(
            "click",
            () => {

                goToNextProduct(
                    battle
                );

            }
        );

    }


    const previous =
        battle.querySelector(
            "[data-prev]"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                goToPreviousProduct(
                    battle
                );

            }
        );

    }


    const nextContender =
        battle.querySelector(
            "[data-next-contender]"
        );


    if (nextContender) {

        nextContender.addEventListener(
            "click",
            () => {

                goToNextProduct(
                    battle
                );

            }
        );

    }


    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const vote =
                            button.dataset.vote;


                        handleVote(
                            battle,
                            vote
                        );

                    }
                );

            }
        );


    initializeSwipe(
        battle
    );


    initializeSwipeHint(
        battle
    );


    showProduct(
        battle,
        0
    );

}


/* ============================================================
   INITIAL CATEGORY
   ============================================================ */

function getInitialCategory() {

    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            )
            .toLowerCase();


    if (
        battles[hash]
    ) {

        return hash;

    }


    return categoryOrder[0];

}


/* ============================================================
   INITIALIZE PAGE
   ============================================================ */

async function initializePage() {

    console.log(
        "MomYouNeedThis voting page initializing..."
    );


    const battlesOnPage =
        document.querySelectorAll(
            ".product-battle"
        );


    if (
        !battlesOnPage.length
    ) {

        console.warn(
            "No .product-battle elements found."
        );

        return;

    }


    /*
     * Initialize every battle so all existing
     * functionality remains available.
     */

    battlesOnPage.forEach(
        battle => {

            initializeBattle(
                battle
            );

        }
    );


    /*
     * Category navigation.
     */

    initializeCategoryNavigation();


    /*
     * Keyboard fallback.
     */

    initializeKeyboardNavigation();


    /*
     * Start with the requested hash,
     * otherwise Baby.
     */

    const initialCategory =
        getInitialCategory();


    displayCategory(
        initialCategory,
        {
            updateHash: false,
            animate: false
        }
    );


    /*
     * Make sure the initial battle starts
     * at its first product.
     */

    const initialBattle =
        getBattleElement(
            initialCategory
        );


    if (initialBattle) {

        showProduct(
            initialBattle,
            battleIndexes[initialCategory] || 0
        );

    }


    /*
     * Firebase authentication happens after
     * the visual UI is already available.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Firebase authentication ready:",
            user.uid
        );


        /*
         * Re-check currently visible products.
         */

        const activeBattle =
            getBattleElement(
                activeCategory
            );


        if (activeBattle) {

            const category =
                activeBattle.dataset.category;


            const index =
                battleIndexes[category] || 0;


            await showProduct(
                activeBattle,
                index
            );

        }

    } catch (error) {

        console.error(
            "Firebase authentication could not start:",
            error
        );

    }

}


/* ============================================================
   HANDLE BROWSER HASH CHANGES
   ============================================================ */

window.addEventListener(
    "hashchange",
    () => {

        const category =
            getInitialCategory();


        if (
            category !==
            activeCategory
        ) {

            displayCategory(
                category,
                {
                    updateHash: false,
                    animate: true
                }
            );


            const battle =
                getBattleElement(
                    category
                );


            if (battle) {

                showProduct(
                    battle,
                    battleIndexes[category] || 0
                );

            }

        }

    }
);


/* ============================================================
   START APPLICATION
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePage,
        {
            once: true
        }
    );

} else {

    initializePage();

}