/*
 * ============================================================
 * MOMYOU NEED THIS — MOM-VOTED PRODUCT BATTLES
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
 * Example:
 *     abc123_baby_baby-einstein-soother
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


/*
 * Initialize Firebase Authentication.
 */

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


/*
 * Check Firestore.
 */

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


/*
 * Tracks which product is currently displayed
 * in each category.
 */

const battleIndexes = {};


/*
 * Prevents multiple simultaneous votes for
 * the same product.
 */

const voteInProgress = new Set();


/*
 * Votes confirmed by Firestore during this
 * page session.
 *
 * Key:
 *     category_productId
 *
 * Value:
 *     "yes" / "no"
 */

const confirmedVotes = new Map();


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

    /*
     * Firestore document ID:
     *
     * UID_category_productId
     */

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
   AUTHENTICATION
   ============================================================ */

function startAnonymousAuthentication() {

    /*
     * Firebase Authentication isn't available.
     */

    if (!auth) {

        return Promise.reject(
            new Error(
                "Firebase Authentication is not initialized."
            )
        );

    }


    /*
     * Already authenticated.
     */

    if (auth.currentUser) {

        currentUser =
            auth.currentUser;

        authenticationReady =
            true;

        return Promise.resolve(
            currentUser
        );

    }


    /*
     * Authentication is already being established.
     *
     * Reuse the same Promise.
     */

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


                            /*
                             * Existing Firebase user.
                             */

                            if (user) {

                                finishSuccess(
                                    user
                                );

                                return;

                            }


                            /*
                             * No user exists.
                             *
                             * Create an anonymous user.
                             */

                            try {

                                console.log(
                                    "Creating anonymous Firebase user..."
                                );


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

                                console.error(
                                    "Anonymous authentication failed:",
                                    error
                                );


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
                () => {

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


    if (product && yourPosition) {

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


    /*
     * Already confirmed during this session.
     */

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


        /*
         * Verify the document belongs to
         * the current anonymous user.
         */

        if (
            data.uid !==
            currentUser.uid
        ) {

            console.warn(
                "Vote document UID does not match current user."
            );

            return null;

        }


        /*
         * Validate the vote.
         */

        if (
            data.vote !== "yes" &&
            data.vote !== "no"
        ) {

            console.warn(
                "Invalid vote value found in Firestore."
            );

            return null;

        }


        /*
         * Firestore confirmed the vote.
         */

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

        /*
         * A failed READ must never be interpreted
         * as a successful vote.
         */

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


    /*
     * Make sure authentication exists.
     */

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


    /*
     * Prevent duplicate writes.
     */

    if (
        voteInProgress.has(key)
    ) {

        return false;

    }


    /*
     * A confirmed vote cannot be replaced.
     */

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


        /*
         * Firestore must confirm the write
         * before the UI says "saved".
         */

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


        /*
         * Firestore accepted the vote.
         */

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

        /*
         * IMPORTANT:
         *
         * Nothing is cached when Firestore rejects
         * the write.
         */

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


    /*
     * Prevent duplicate clicks.
     */

    if (
        voteInProgress.has(key)
    ) {

        return;

    }


    /*
     * Authenticate first.
     */

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


    /*
     * Save vote.
     */

    try {

        const saved =
            await saveVote(
                category,
                product,
                vote
            );


        /*
         * ONLY show success after Firestore
         * confirms the write.
         */

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
   BATTLE NAVIGATION
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


    showProduct(
        battle,
        currentIndex + 1
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


    showProduct(
        battle,
        currentIndex - 1
    );

}


/* ============================================================
   DISPLAY PRODUCT
   ============================================================ */

async function showProduct(
    battle,
    index
) {

    const category =
        battle.dataset.category;


    const products =
        battles[category];


    if (
        !products ||
        products.length === 0
    ) {

        console.warn(
            `No products configured for category: ${category}`
        );

        return;

    }


    /*
     * Keep index inside the array.
     */

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


    /*
     * Update position.
     */

    updateProductPosition(
        battle,
        index,
        products.length
    );


    /*
     * Update dots.
     */

    updateDots(
        battle,
        products,
        index
    );


    /*
     * Update image.
     */

    setImage(
        battle.querySelector(
            "[data-image]"
        ),
        product.image,
        product.name
    );


    /*
     * Update product label.
     */

    setText(
        battle.querySelector(
            "[data-label]"
        ),
        `PRODUCT ${index + 1}`
    );


    /*
     * Update name.
     */

    setText(
        battle.querySelector(
            "[data-name]"
        ),
        product.name
    );


    /*
     * Update brand.
     */

    setText(
        battle.querySelector(
            "[data-brand]"
        ),
        product.brand
    );


    /*
     * Update description.
     */

    setText(
        battle.querySelector(
            "[data-description]"
        ),
        product.description
    );


    /*
     * Update product link.
     */

    const link =
        battle.querySelector(
            "[data-link]"
        );


    if (link) {

        link.href =
            product.link || "#";

    }


    /*
     * Update score.
     */

    updateScoreUI(
        battle,
        product
    );


    /*
     * Reset vote UI first.
     */

    resetVoteUI(
        battle
    );


    /*
     * --------------------------------------------------------
     * CHECK LOCAL CACHE
     * --------------------------------------------------------
     */

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


    /*
     * --------------------------------------------------------
     * CHECK FIRESTORE
     * --------------------------------------------------------
     *
     * This does NOT prevent voting if the read fails.
     */

    try {

        await startAnonymousAuthentication();


        if (!currentUser) {

            return;

        }


        /*
         * Make sure the product hasn't changed while
         * authentication was loading.
         */

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


        /*
         * Make sure the user hasn't navigated to another
         * product while Firestore was loading.
         */

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

        /*
         * Existing-vote check failed.
         *
         * The product remains votable.
         */

        console.warn(
            "Could not check existing vote:",
            error
        );

    }

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

        console.warn(
            "Battle has no data-category:",
            battle
        );

        return;

    }


    if (!battles[category]) {

        console.warn(
            `No product data exists for category: ${category}`
        );

        return;

    }


    battleIndexes[category] =
        0;


    /*
     * NEXT ARROW
     */

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


    /*
     * PREVIOUS ARROW
     */

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


    /*
     * NEXT CONTENDER
     */

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


    /*
     * YES / NO VOTING
     */

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


    /*
     * Render first product.
     */

    showProduct(
        battle,
        0
    );

}


/* ============================================================
   INITIALIZE PAGE
   ============================================================ */

async function initializePage() {

    console.log(
        "MomYouNeedThis voting page initializing..."
    );


    /*
     * Find battles on page.
     */

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
     * Render the UI immediately.
     *
     * Firebase must NOT block the product cards.
     */

    battlesOnPage.forEach(
        battle => {

            initializeBattle(
                battle
            );

        }
    );


    /*
     * Start Firebase authentication.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Firebase authentication ready:",
            user.uid
        );


        /*
         * Now that authentication is ready,
         * check the currently displayed products.
         *
         * We do this only once here instead of triggering
         * another initialization cycle unnecessarily.
         */

        for (
            const battle of battlesOnPage
        ) {

            const category =
                battle.dataset.category;


            const index =
                battleIndexes[category] || 0;


            await showProduct(
                battle,
                index
            );

        }

    } catch (error) {

        console.error(
            "Firebase authentication could not start:",
            error
        );


        /*
         * The visual page still works.
         *
         * If the user tries to vote, they will receive
         * an appropriate error.
         */

    }

}


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