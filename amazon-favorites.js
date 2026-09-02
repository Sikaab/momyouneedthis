/*
 * ============================================================
 * MOMYOU NEED THIS
 * MOM-VOTED PRODUCT BATTLES
 *
 * UNIFIED TWO-PRODUCT BATTLE EXPERIENCE
 * ============================================================
 *
 * Firebase:
 * - Anonymous Authentication
 * - Firestore
 *
 * Firestore collection:
 *     productVotes
 *
 * Vote document:
 *     UID_category_productId
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

}


/* ============================================================
   PRODUCT DATA
   ============================================================ */

const battles = {

    baby: [

        {
            id: "baby-einstein-soother",
            name: "Soother Musical Crib Toy",
            brand: "Baby Einstein",
            image: "assets/babyeinstein-aquarium.jpeg",
            description:
                "A popular option for keeping little ones entertained during quiet moments and daily routines.",
            score: "8.4",
            percentage: 62,
            link: "https://amzn.to/4fNqr9j"
        },

        {
            id: "baby-einstein-aquarium",
            name: "Baby Einstein Aquarium",
            brand: "Baby Einstein",
            image: "assets/babyeinstein-aquarium.jpeg",
            description:
                "A colorful interactive option designed to keep babies engaged during everyday routines.",
            score: "8.2",
            percentage: 59,
            link: "https://amzn.to/4fNqr9j"
        }

    ],


    toddler: [

        {
            id: "toddler-favorite-1",
            name: "Toddler Favorite",
            brand: "MomYouNeedThis Pick",
            image: "assets/product2.jpg",
            description:
                "A practical everyday product designed to make life with toddlers a little easier.",
            score: "8.1",
            percentage: 57,
            link: "#"
        },

        {
            id: "toddler-favorite-2",
            name: "Toddler Favorite #2",
            brand: "MomYouNeedThis Pick",
            image: "assets/product2.jpg",
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
            brand: "Parent Favorite",
            image: "assets/white-noise-machine.jpeg",
            description:
                "A popular choice for creating a consistent sleep environment for little ones.",
            score: "8.7",
            percentage: 71,
            link: "https://amzn.to/4z8LxGC"
        },

        {
            id: "sleep-helper-2",
            name: "Sleep Helper",
            brand: "Parent Favorite",
            image: "assets/white-noise-machine.jpeg",
            description:
                "A simple sleep-support product designed to make bedtime routines easier.",
            score: "8.4",
            percentage: 65,
            link: "https://amzn.to/4z8LxGC"
        }

    ],


    potty: [

        {
            id: "babybjorn-potty",
            name: "Potty Training Seat",
            brand: "BabyBjörn",
            image: "assets/babybjorn-potty-toilet.jpeg",
            description:
                "A simple potty-training option designed to help toddlers feel comfortable and confident.",
            score: "8.6",
            percentage: 68,
            link: "https://amzn.to/3S23eqS"
        },

        {
            id: "potty-training-seat-2",
            name: "Potty Training Favorite",
            brand: "Mom Pick",
            image: "assets/babybjorn-potty-toilet.jpeg",
            description:
                "Another popular potty-training option designed for everyday use.",
            score: "8.2",
            percentage: 61,
            link: "https://amzn.to/3S23eqS"
        }

    ],


    feeding: [

        {
            id: "feeding-favorite-1",
            name: "Feeding Favorite",
            brand: "Mom Pick",
            image: "assets/product2.jpg",
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
            image: "assets/product2.jpg",
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
            brand: "MomYouNeedThis Pick",
            image: "assets/product2.jpg",
            description:
                "A useful little find that could make everyday parenting just a bit easier.",
            score: "8.3",
            percentage: 63,
            link: "#"
        },

        {
            id: "under25-find-2",
            name: "Budget Mom Find #2",
            brand: "MomYouNeedThis Pick",
            image: "assets/product2.jpg",
            description:
                "A small everyday find that could make a practical difference for parents.",
            score: "8.1",
            percentage: 59,
            link: "#"
        }

    ]

};


/* ============================================================
   STATE
   ============================================================ */

const categoryOrder = [
    "baby",
    "toddler",
    "sleep",
    "potty",
    "feeding",
    "under25"
];

const battleIndexes = {};

const voteInProgress = new Set();

const confirmedVotes = new Map();

let activeCategoryIndex = 0;


/* ============================================================
   UTILITY
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

    const products = battles[category];

    if (!products?.length) {

        return null;

    }

    const index =
        typeof battleIndexes[category] === "number"
            ? battleIndexes[category]
            : 0;

    return products[
        Math.max(
            0,
            Math.min(
                index,
                products.length - 1
            )
        )
    ];

}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;

    }

}


function createElement(
    tag,
    className,
    text
) {

    const element =
        document.createElement(tag);

    if (className) {

        element.className =
            className;

    }

    if (typeof text === "string") {

        element.textContent =
            text;

    }

    return element;

}


/* ============================================================
   LOCAL VOTE CACHE
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
   FIREBASE AUTHENTICATION
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
                    user => {

                        if (finished) {

                            return;

                        }

                        finished =
                            true;

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
                    error => {

                        if (finished) {

                            return;

                        }

                        finished =
                            true;

                        authenticationReady =
                            false;

                        currentUser =
                            null;

                        authenticationPromise =
                            null;

                        if (unsubscribe) {

                            unsubscribe();

                        }

                        reject(
                            error
                        );

                    };

                unsubscribe =
                    onAuthStateChanged(
                        auth,

                        async user => {

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
                                    credential?.user
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

                        error => {

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
   IMAGE
   ============================================================ */

function setImage(
    element,
    src,
    alt
) {

    if (!element) {

        return;

    }

    element.onerror =
        () => {

            element.classList.add(
                "image-load-error"
            );

        };

    element.src =
        src;

    element.alt =
        alt || "";

}


/* ============================================================
   FIRESTORE EXISTING VOTE
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

            return null;

        }

        if (
            data.vote !== "yes" &&
            data.vote !== "no"
        ) {

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
   FIRESTORE SAVE
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
   BUILD ONE PRODUCT SIDE
   ============================================================ */

function createProductSide(
    product,
    side,
    productNumber
) {

    const wrapper =
        createElement(
            "div",
            `battle-product-side ${side}`
        );

    const label =
        createElement(
            "div",
            "battle-side-label",
            side === "left"
                ? "CONTENDER A"
                : "CONTENDER B"
        );

    wrapper.appendChild(
        label
    );


    const imageArea =
        createElement(
            "div",
            "battle-product-image-area"
        );


    const image =
        createElement(
            "img",
            "battle-product-image"
        );

    setImage(
        image,
        product.image,
        product.name
    );

    imageArea.appendChild(
        image
    );

    wrapper.appendChild(
        imageArea
    );


    const info =
        createElement(
            "div",
            "battle-product-info"
        );


    const brand =
        createElement(
            "div",
            "battle-product-brand",
            product.brand
        );

    const name =
        createElement(
            "h3",
            "battle-product-name",
            product.name
        );

    const description =
        createElement(
            "p",
            "battle-product-description",
            product.description
        );


    info.appendChild(
        brand
    );

    info.appendChild(
        name
    );

    info.appendChild(
        description
    );

    wrapper.appendChild(
        info
    );


    wrapper.dataset.productId =
        product.id;

    wrapper.dataset.productNumber =
        productNumber;

    return wrapper;

}


/* ============================================================
   BUILD BATTLE ARENA
   ============================================================ */

function buildBattleArena(
    battle,
    leftProduct,
    rightProduct
) {

    const oldViewer =
        battle.querySelector(
            ".product-viewer"
        );

    if (!oldViewer) {

        return null;

    }

    oldViewer.innerHTML =
        "";

    const arena =
        createElement(
            "div",
            "battle-arena"
        );

    arena.setAttribute(
        "aria-label",
        `Product battle: ${leftProduct.name} versus ${rightProduct.name}`
    );


    const leftSide =
        createProductSide(
            leftProduct,
            "left",
            1
        );


    const vsColumn =
        createElement(
            "div",
            "battle-vs-column"
        );


    const vsBadge =
        createElement(
            "div",
            "battle-vs-badge",
            "VS"
        );


    vsColumn.appendChild(
        vsBadge
    );


    const rightSide =
        createProductSide(
            rightProduct,
            "right",
            2
        );


    arena.appendChild(
        leftSide
    );

    arena.appendChild(
        vsColumn
    );

    arena.appendChild(
        rightSide
    );


    oldViewer.appendChild(
        arena
    );


    const hint =
        createElement(
            "div",
            "swipe-hint"
        );

    const arrow =
        createElement(
            "span",
            "swipe-hint-arrow",
            "←"
        );

    const text =
        createElement(
            "span",
            "",
            "Swipe left for the next battle"
        );

    hint.appendChild(
        arrow
    );

    hint.appendChild(
        text
    );


    oldViewer.appendChild(
        hint
    );


    setupSwipe(
        battle,
        arena
    );


    return arena;

}


/* ============================================================
   SCORE UI
   ============================================================ */

function updateBattleScore(
    battle,
    leftProduct,
    rightProduct
) {

    let scoreStrip =
        battle.querySelector(
            ".battle-score-strip"
        );

    if (!scoreStrip) {

        scoreStrip =
            createElement(
                "div",
                "battle-score-strip"
            );

        const viewer =
            battle.querySelector(
                ".product-viewer"
            );

        if (
            viewer?.nextSibling
        ) {

            battle
                .querySelector(
                    ".battle-card"
                )
                ?.insertBefore(
                    scoreStrip,
                    viewer.nextSibling
                );

        } else {

            battle
                .querySelector(
                    ".battle-card"
                )
                ?.appendChild(
                    scoreStrip
                );

        }

    }

    scoreStrip.innerHTML =
        "";


    const left =
        createElement(
            "div",
            "battle-score-side left"
        );

    const leftNumber =
        createElement(
            "strong",
            "battle-score-number",
            leftProduct.score
        );

    const leftLabel =
        createElement(
            "span",
            "battle-score-label",
            `${leftProduct.percentage}% mom approval`
        );

    left.appendChild(
        leftNumber
    );

    left.appendChild(
        leftLabel
    );


    const centre =
        createElement(
            "div",
            "battle-score-vs",
            "MOM SCORE"
        );


    const right =
        createElement(
            "div",
            "battle-score-side right"
        );

    const rightNumber =
        createElement(
            "strong",
            "battle-score-number",
            rightProduct.score
        );

    const rightLabel =
        createElement(
            "span",
            "battle-score-label",
            `${rightProduct.percentage}% mom approval`
        );

    right.appendChild(
        rightNumber
    );

    right.appendChild(
        rightLabel
    );


    scoreStrip.appendChild(
        left
    );

    scoreStrip.appendChild(
        centre
    );

    scoreStrip.appendChild(
        right
    );

}


/* ============================================================
   MOM SCORE
   ============================================================ */

function updateMomScore(
    battle,
    leftProduct,
    rightProduct
) {

    let score =
        battle.querySelector(
            ".mom-score"
        );

    if (!score) {

        score =
            createElement(
                "div",
                "mom-score"
            );

        const viewer =
            battle.querySelector(
                ".product-viewer"
            );

        if (viewer) {

            viewer.after(
                score
            );

        }

    }

    const winner =
        leftProduct.percentage >=
        rightProduct.percentage
            ? leftProduct
            : rightProduct;

    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    winner.percentage
                ) || 0
            )
        );

    let heading =
        "MOM VERDICT";

    let consensus =
        "👀 Moms are deciding";

    if (percentage >= 70) {

        consensus =
            "🔥 Mom favorite";

    } else if (percentage >= 60) {

        consensus =
            "💗 Strong mom approval";

    }


    score.innerHTML =
        "";


    const headingElement =
        createElement(
            "div",
            "mom-score-heading",
            heading
        );


    const main =
        createElement(
            "div",
            "mom-score-main"
        );


    const strong =
        createElement(
            "strong",
            "",
            `${percentage}%`
        );

    const label =
        createElement(
            "span",
            "",
            "approval"
        );


    main.appendChild(
        strong
    );

    main.appendChild(
        label
    );


    const bar =
        createElement(
            "div",
            "consensus-bar"
        );


    const fill =
        createElement(
            "div",
            "consensus-bar-fill"
        );


    fill.style.width =
        `${percentage}%`;


    bar.appendChild(
        fill
    );


    const consensusText =
        createElement(
            "span",
            "",
            consensus
        );


    score.appendChild(
        headingElement
    );

    score.appendChild(
        main
    );

    score.appendChild(
        bar
    );

    score.appendChild(
        consensusText
    );

}


/* ============================================================
   VOTE AREA
   ============================================================ */

function ensureVoteArea(
    battle
) {

    let voteArea =
        battle.querySelector(
            "[data-vote-area]"
        );

    if (voteArea) {

        return voteArea;

    }

    voteArea =
        createElement(
            "div",
            "vote-area"
        );

    voteArea.dataset.voteArea =
        "";

    const question =
        createElement(
            "div",
            "vote-question",
            "WHO GETS YOUR VOTE?"
        );

    const buttons =
        createElement(
            "div",
            "vote-buttons"
        );


    const yes =
        createElement(
            "button",
            "",
            "💗 I'D PICK THIS"
        );

    yes.type =
        "button";

    yes.dataset.vote =
        "yes";


    const no =
        createElement(
            "button",
            "",
            "👎 NOT FOR ME"
        );

    no.type =
        "button";

    no.dataset.vote =
        "no";


    buttons.appendChild(
        yes
    );

    buttons.appendChild(
        no
    );


    voteArea.appendChild(
        question
    );

    voteArea.appendChild(
        buttons
    );


    const score =
        battle.querySelector(
            ".mom-score"
        );

    if (score) {

        score.after(
            voteArea
        );

    } else {

        const viewer =
            battle.querySelector(
                ".product-viewer"
            );

        viewer?.after(
            voteArea
        );

    }


    return voteArea;

}


/* ============================================================
   VOTE RESULT
   ============================================================ */

function ensureResultArea(
    battle
) {

    let result =
        battle.querySelector(
            "[data-result]"
        );

    if (result) {

        return result;

    }

    result =
        createElement(
            "div",
            "vote-result"
        );

    result.dataset.result =
        "";


    const title =
        createElement(
            "div",
            "",
            "Your vote is saved!"
        );

    title.dataset.resultTitle =
        "";


    const text =
        createElement(
            "div",
            "",
            "Your vote was successfully registered."
        );

    text.dataset.resultText =
        "";


    result.appendChild(
        title
    );

    result.appendChild(
        text
    );


    const voteArea =
        battle.querySelector(
            "[data-vote-area]"
        );

    voteArea?.after(
        result
    );


    return result;

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

    const social =
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

    if (social) {

        social.classList.remove(
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
   SHOW VOTE SUCCESS
   ============================================================ */

function showVoteUI(
    battle,
    product,
    vote
) {

    const result =
        ensureResultArea(
            battle
        );

    const title =
        result.querySelector(
            "[data-result-title]"
        );

    const text =
        result.querySelector(
            "[data-result-text]"
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


    result.classList.add(
        "visible"
    );


    setText(
        title,
        "Your vote is saved! 💗"
    );


    const percentage =
        Number(
            product.percentage
        ) || 0;


    const majority =
        vote === "yes"
            ? percentage >= 50
            : percentage < 50;


    setText(
        text,
        majority
            ? "You're with the mom majority."
            : "You're with the mom minority."
    );


    showSwipeNextMessage(
        battle
    );

}


/* ============================================================
   VOTE ERROR
   ============================================================ */

function showVoteError(
    battle,
    message
) {

    const result =
        ensureResultArea(
            battle
        );

    const title =
        result.querySelector(
            "[data-result-title]"
        );

    const text =
        result.querySelector(
            "[data-result-text]"
        );


    result.classList.add(
        "visible"
    );


    setText(
        title,
        "Vote not registered"
    );


    setText(
        text,
        message
    );


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
   VOTE HANDLER
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
                product,
                vote
            );

        }

    } catch (error) {

        showVoteError(
            battle,
            getReadableFirebaseError(
                error
            )
        );

    }

}


/* ============================================================
   FIREBASE ERROR MESSAGE
   ============================================================ */

function getReadableFirebaseError(
    error
) {

    if (!error) {

        return "Your vote could not be registered.";

    }

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

    return (
        "Your vote could not be registered. " +
        "Please try again."
    );

}


/* ============================================================
   CATEGORY NAV
   ============================================================ */

function getBattleElements() {

    return Array.from(
        document.querySelectorAll(
            ".product-battle"
        )
    );

}


function getCategoryIndex(
    category
) {

    return categoryOrder.indexOf(
        category
    );

}


function updateCategoryNavigation(
    category
) {

    document
        .querySelectorAll(
            ".category-link"
        )
        .forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    ) || "";

                const linkCategory =
                    href.replace(
                        "#",
                        ""
                    );

                link.classList.toggle(
                    "active",
                    linkCategory ===
                    category
                );

            }
        );


    const activeLink =
        Array.from(
            document.querySelectorAll(
                ".category-link"
            )
        ).find(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    ) || "";

                return (
                    href.replace(
                        "#",
                        ""
                    ) ===
                    category
                );

            }
        );


    if (activeLink) {

        activeLink.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });

    }

}


function updateCategoryProgress(
    battle,
    category
) {

    let position =
        battle.querySelector(
            "[data-position]"
        );


    if (!position) {

        position =
            createElement(
                "span",
                "battle-position"
            );

        position.dataset.position =
            "";

        battle
            .querySelector(
                ".battle-top"
            )
            ?.prepend(
                position
            );

    }


    const categoryIndex =
        getCategoryIndex(
            category
        );


    setText(
        position,
        `BATTLE ${categoryIndex + 1} OF ${categoryOrder.length}`
    );


    let categoryLabel =
        battle.querySelector(
            ".battle-category-label"
        );


    if (!categoryLabel) {

        categoryLabel =
            createElement(
                "span",
                "battle-category-label"
            );

        battle
            .querySelector(
                ".battle-top"
            )
            ?.appendChild(
                categoryLabel
            );

    }


    const names = {
        baby: "BABY",
        toddler: "TODDLER",
        sleep: "SLEEP",
        potty: "POTTY",
        feeding: "FEEDING",
        under25: "UNDER $25"
    };


    setText(
        categoryLabel,
        names[category] ||
        category.toUpperCase()
    );

}


function activateCategory(
    category,
    options = {}
) {

    if (!battles[category]) {

        return;

    }


    const battleElements =
        getBattleElements();


    const target =
        battleElements.find(
            battle =>
                battle.dataset.category ===
                category
        );


    if (!target) {

        return;

    }


    activeCategoryIndex =
        getCategoryIndex(
            category
        );


    battleElements.forEach(
        battle => {

            const active =
                battle === target;

            battle.classList.toggle(
                "battle-active",
                active
            );

            battle.classList.toggle(
                "battle-hidden",
                !active
            );

        }
    );


    updateCategoryNavigation(
        category
    );


    renderBattle(
        target
    );


    if (
        options.updateHash !== false
    ) {

        history.replaceState(
            null,
            "",
            `#${category}`
        );

    }


    if (
        options.scroll !== false
    ) {

        requestAnimationFrame(
            () => {

                target.scrollIntoView({
                    behavior:
                        options.instant
                            ? "auto"
                            : "smooth",
                    block: "start"
                });

            }
        );

    }

}


/* ============================================================
   MOVE BETWEEN CATEGORIES
   ============================================================ */

function moveToCategory(
    direction
) {

    const nextIndex =
        activeCategoryIndex +
        direction;


    if (
        nextIndex < 0 ||
        nextIndex >= categoryOrder.length
    ) {

        return;

    }


    const nextCategory =
        categoryOrder[
            nextIndex
        ];


    activateCategory(
        nextCategory
    );

}


/* ============================================================
   PRODUCT NAVIGATION
   ============================================================ */

function moveToNextProduct(
    category
) {

    const products =
        battles[category];

    if (!products?.length) {

        return;

    }


    const current =
        battleIndexes[category] || 0;


    if (
        current <
        products.length - 1
    ) {

        battleIndexes[category] =
            current + 1;

        const battle =
            getBattleElements()
                .find(
                    element =>
                        element.dataset.category ===
                        category
                );

        if (battle) {

            renderBattle(
                battle
            );

        }

        return;

    }


    moveToCategory(
        1
    );

}


function moveToPreviousProduct(
    category
) {

    const products =
        battles[category];

    if (!products?.length) {

        return;

    }


    const current =
        battleIndexes[category] || 0;


    if (
        current > 0
    ) {

        battleIndexes[category] =
            current - 1;

        const battle =
            getBattleElements()
                .find(
                    element =>
                        element.dataset.category ===
                        category
                );

        if (battle) {

            renderBattle(
                battle
            );

        }

        return;

    }


    moveToCategory(
        -1
    );

}


/* ============================================================
   RENDER BATTLE
   ============================================================ */

function renderBattle(
    battle
) {

    const category =
        battle.dataset.category;


    const products =
        battles[category];


    if (
        !products?.length
    ) {

        return;

    }


    let index =
        battleIndexes[category];


    if (
        typeof index !== "number"
    ) {

        index = 0;

    }


    index =
        clamp(
            index,
            0,
            Math.max(
                0,
                products.length - 1
            )
        );


    battleIndexes[category] =
        index;


    /*
     * For a true battle presentation,
     * compare the current product with the
     * next product.
     */

    const leftProduct =
        products[index];


    const rightIndex =
        index + 1 <
        products.length
            ? index + 1
            : 0;


    const rightProduct =
        products[rightIndex];


    updateCategoryProgress(
        battle,
        category
    );


    buildBattleArena(
        battle,
        leftProduct,
        rightProduct
    );


    updateBattleScore(
        battle,
        leftProduct,
        rightProduct
    );


    updateMomScore(
        battle,
        leftProduct,
        rightProduct
    );


    ensureVoteArea(
        battle
    );


    ensureResultArea(
        battle
    );


    attachVoteListeners(
        battle
    );


    resetVoteUI(
        battle
    );


    updateBattleDots(
        battle,
        products,
        index
    );


    updateProgressBar(
        battle,
        category
    );


    checkExistingVotes(
        battle,
        category,
        leftProduct,
        rightProduct
    );


    updateNextButton(
        battle
    );

}


/* ============================================================
   VOTE LISTENERS
   ============================================================ */

function attachVoteListeners(
    battle
) {

    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {

                if (
                    button.dataset.listenerAttached
                ) {

                    return;

                }


                button.dataset.listenerAttached =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();
                        event.stopPropagation();


                        handleVote(
                            battle,
                            button.dataset.vote
                        );

                    }
                );

            }
        );

}


/* ============================================================
   EXISTING VOTES
   ============================================================ */

async function checkExistingVotes(
    battle,
    category,
    leftProduct,
    rightProduct
) {

    try {

        await startAnonymousAuthentication();

        if (!currentUser) {

            return;

        }


        const products =
            [
                leftProduct,
                rightProduct
            ];


        for (
            const product of products
        ) {

            const localVote =
                getConfirmedLocalVote(
                    category,
                    product.id
                );


            if (localVote) {

                confirmedVotes.set(
                    getBattleKey(
                        category,
                        product.id
                    ),
                    localVote
                );

            } else {

                await loadExistingVote(
                    category,
                    product
                );

            }

        }


        const current =
            getCurrentProduct(
                category
            );


        if (
            current?.id ===
            leftProduct.id
        ) {

            const vote =
                confirmedVotes.get(
                    getBattleKey(
                        category,
                        leftProduct.id
                    )
                );


            if (vote) {

                showVoteUI(
                    battle,
                    leftProduct,
                    vote
                );

            }

        }

    } catch (error) {

        console.warn(
            "Existing vote check failed:",
            error
        );

    }

}


/* ============================================================
   PROGRESS BAR
   ============================================================ */

function updateProgressBar(
    battle,
    category
) {

    let progress =
        battle.querySelector(
            "[data-progress]"
        );


    if (!progress) {

        progress =
            createElement(
                "div",
                "battle-progress"
            );

        progress.dataset.progress =
            "";


        const fill =
            createElement(
                "div",
                "battle-progress-fill"
            );

        fill.dataset.progressFill =
            "";


        progress.appendChild(
            fill
        );


        battle
            .querySelector(
                ".battle-top"
            )
            ?.appendChild(
                progress
            );

    }


    const fill =
        progress.querySelector(
            "[data-progress-fill]"
        );


    if (fill) {

        const index =
            getCategoryIndex(
                category
            );


        const percentage =
            (
                (index + 1) /
                categoryOrder.length
            ) * 100;


        fill.style.width =
            `${percentage}%`;

    }

}


/* ============================================================
   DOTS
   ============================================================ */

function updateBattleDots(
    battle,
    products,
    activeIndex
) {

    let dots =
        battle.querySelector(
            "[data-dots]"
        );


    if (!dots) {

        dots =
            createElement(
                "div",
                "battle-dots"
            );

        dots.dataset.dots =
            "";


        const footer =
            battle.querySelector(
                ".battle-footer"
            );


        if (footer) {

            footer.before(
                dots
            );

        } else {

            battle
                .querySelector(
                    ".battle-card"
                )
                ?.appendChild(
                    dots
                );

        }

    }


    dots.innerHTML =
        "";


    products.forEach(
        (_, index) => {

            const dot =
                createElement(
                    "button",
                    "battle-dot"
                );

            dot.type =
                "button";


            dot.setAttribute(
                "aria-label",
                `Battle ${index + 1}`
            );


            if (
                index === activeIndex
            ) {

                dot.classList.add(
                    "active"
                );

            }


            dot.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    battleIndexes[
                        battle.dataset.category
                    ] =
                        index;


                    renderBattle(
                        battle
                    );

                }
            );


            dots.appendChild(
                dot
            );

        }
    );

}


/* ============================================================
   NEXT BUTTON
   ============================================================ */

function updateNextButton(
    battle
) {

    let button =
        battle.querySelector(
            "[data-next-contender]"
        );


    if (!button) {

        button =
            createElement(
                "button",
                "next-contender",
                "SWIPE LEFT FOR THE NEXT BATTLE →"
            );

        button.type =
            "button";

        button.dataset.nextContender =
            "";


        const dots =
            battle.querySelector(
                "[data-dots]"
            );


        if (dots) {

            dots.after(
                button
            );

        } else {

            battle
                .querySelector(
                    ".battle-card"
                )
                ?.appendChild(
                    button
                );

        }

    }


    if (
        button.dataset.listenerAttached
    ) {

        return;

    }


    button.dataset.listenerAttached =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            moveToNextProduct(
                battle.dataset.category
            );

        }
    );

}


/* ============================================================
   SWIPE
   ============================================================ */

function setupSwipe(
    battle,
    arena
) {

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let dragging = false;
    let pointerId = null;


    const reset =
        () => {

            arena.classList.remove(
                "is-dragging"
            );

            arena.style.transform =
                "";

            dragging =
                false;

            pointerId =
                null;

        };


    arena.addEventListener(
        "pointerdown",
        event => {

            if (
                event.pointerType ===
                "mouse" &&
                event.button !== 0
            ) {

                return;

            }


            const target =
                event.target;


            if (
                target.closest(
                    "button, a, input, select, textarea"
                )
            ) {

                return;

            }


            pointerId =
                event.pointerId;


            startX =
                event.clientX;

            startY =
                event.clientY;

            currentX =
                startX;

            dragging =
                true;


            arena.classList.add(
                "is-dragging"
            );


            try {

                arena.setPointerCapture(
                    pointerId
                );

            } catch (_) {}

        }
    );


    arena.addEventListener(
        "pointermove",
        event => {

            if (
                !dragging ||
                event.pointerId !==
                pointerId
            ) {

                return;

            }


            currentX =
                event.clientX;


            const currentY =
                event.clientY;


            const deltaX =
                currentX -
                startX;


            const deltaY =
                currentY -
                startY;


            if (
                Math.abs(deltaY) >
                Math.abs(deltaX) &&
                Math.abs(deltaY) >
                15
            ) {

                reset();

                return;

            }


            const limited =
                clamp(
                    deltaX,
                    -110,
                    110
                );


            const rotation =
                limited *
                .025;


            arena.style.transform =
                `translateX(${limited}px) rotate(${rotation}deg)`;

        }
    );


    arena.addEventListener(
        "pointerup",
        event => {

            if (
                !dragging ||
                event.pointerId !==
                pointerId
            ) {

                return;

            }


            const deltaX =
                event.clientX -
                startX;


            reset();


            const threshold =
                window.innerWidth <
                650
                    ? 55
                    : 80;


            if (
                Math.abs(deltaX) <
                threshold
            ) {

                return;

            }


            if (
                deltaX < 0
            ) {

                animateSwipe(
                    arena,
                    "left",
                    () => {

                        moveToNextProduct(
                            battle.dataset.category
                        );

                    }
                );

            } else {

                animateSwipe(
                    arena,
                    "right",
                    () => {

                        moveToPreviousProduct(
                            battle.dataset.category
                        );

                    }
                );

            }

        }
    );


    arena.addEventListener(
        "pointercancel",
        reset
    );

}


/* ============================================================
   SWIPE ANIMATION
   ============================================================ */

function animateSwipe(
    arena,
    direction,
    callback
) {

    arena.classList.add(
        direction === "left"
            ? "swipe-left"
            : "swipe-right"
    );


    setTimeout(
        () => {

            arena.classList.remove(
                "swipe-left",
                "swipe-right"
            );

            callback();

        },
        300
    );

}


/* ============================================================
   SWIPE MESSAGE
   ============================================================ */

function showSwipeNextMessage(
    battle
) {

    const hint =
        battle.querySelector(
            ".swipe-hint"
        );


    if (!hint) {

        return;

    }


    const text =
        hint.querySelector(
            "span:not(.swipe-hint-arrow)"
        );


    if (text) {

        text.textContent =
            "Swipe left for the next battle →";

    }

}


/* ============================================================
   CATEGORY NAV LISTENERS
   ============================================================ */

function initializeCategoryNavigation() {

    document
        .querySelectorAll(
            ".category-link"
        )
        .forEach(
            link => {

                if (
                    link.dataset.listenerAttached
                ) {

                    return;

                }


                link.dataset.listenerAttached =
                    "true";


                link.addEventListener(
                    "click",
                    event => {

                        const href =
                            link.getAttribute(
                                "href"
                            ) || "";


                        const category =
                            href.replace(
                                "#",
                                ""
                            );


                        if (
                            !battles[category]
                        ) {

                            return;

                        }


                        event.preventDefault();


                        activateCategory(
                            category
                        );

                    }
                );

            }
        );

}


/* ============================================================
   INITIALIZE BATTLE
   ============================================================ */

function initializeBattle(
    battle
) {

    const category =
        battle.dataset.category;


    if (
        !category ||
        !battles[category]
    ) {

        return;

    }


    battleIndexes[category] =
        0;


    /*
     * Existing arrow support.
     */

    const next =
        battle.querySelector(
            "[data-next]"
        );


    if (next) {

        next.addEventListener(
            "click",
            event => {

                event.preventDefault();

                moveToNextProduct(
                    category
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
            event => {

                event.preventDefault();

                moveToPreviousProduct(
                    category
                );

            }
        );

    }


    renderBattle(
        battle
    );

}


/* ============================================================
   INITIALIZE PAGE
   ============================================================ */

async function initializePage() {

    console.log(
        "MomYouNeedThis voting page initializing..."
    );


    const battleElements =
        getBattleElements();


    if (!battleElements.length) {

        console.warn(
            "No .product-battle elements found."
        );

        return;

    }


    battleElements.forEach(
        battle => {

            initializeBattle(
                battle
            );

        }
    );


    initializeCategoryNavigation();


    /*
     * Hide all categories except the
     * initial category.
     */

    let initialCategory =
        "baby";


    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    if (
        battles[hash]
    ) {

        initialCategory =
            hash;

    }


    activateCategory(
        initialCategory,
        {
            updateHash: false,
            scroll: false,
            instant: true
        }
    );


    /*
     * Firebase authentication runs
     * independently from the visual UI.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Firebase authentication ready:",
            user.uid
        );


        const activeBattle =
            battleElements.find(
                battle =>
                    battle.dataset.category ===
                    initialCategory
            );


        if (activeBattle) {

            renderBattle(
                activeBattle
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
   START
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