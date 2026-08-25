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
   INITIALIZE FIREBASE AUTH
   ============================================================ */

let auth = null;

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


/* ============================================================
   FIRESTORE CHECK
   ============================================================ */

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

let currentUser = null;

let authenticationReady = false;

let authenticationPromise = null;


/*
 * Tracks the product currently being displayed
 * in each battle.
 */

const battleIndexes = {};


/*
 * Prevents duplicate clicks while a vote is being saved.
 */

const voteInProgress = new Set();


/*
 * Votes confirmed by Firestore.
 *
 * Key:
 *
 * category_productId
 *
 * Value:
 *
 * "yes" / "no"
 */

const confirmedVotes = new Map();


/*
 * Prevents multiple authentication listeners
 * from being created simultaneously.
 */

let authenticationListenerStarted = false;


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
     * IMPORTANT:
     *
     * This MUST match the Firestore security rule:
     *
     * voteId.matches(request.auth.uid + '_.*')
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
     * Firebase itself isn't initialized.
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

        authenticationReady = true;

        return Promise.resolve(
            currentUser
        );

    }


    /*
     * If authentication is already being established,
     * return the existing promise.
     */

    if (authenticationPromise) {

        return authenticationPromise;

    }


    authenticationPromise =
        new Promise(
            (resolve, reject) => {

                let resolved = false;


                const unsubscribe =
                    onAuthStateChanged(
                        auth,
                        async (user) => {

                            if (resolved) {
                                return;
                            }


                            /*
                             * Firebase already has a user.
                             */

                            if (user) {

                                resolved = true;

                                currentUser =
                                    user;

                                authenticationReady =
                                    true;

                                authenticationListenerStarted =
                                    true;

                                unsubscribe();


                                console.log(
                                    "Firebase user ready:",
                                    user.uid
                                );


                                resolve(
                                    user
                                );

                                return;

                            }


                            /*
                             * No user exists.
                             *
                             * Create anonymous account.
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

                                    currentUser =
                                        credential.user;

                                    authenticationReady =
                                        true;

                                    resolved = true;

                                    authenticationListenerStarted =
                                        true;

                                    unsubscribe();


                                    console.log(
                                        "Anonymous authentication successful:",
                                        currentUser.uid
                                    );


                                    resolve(
                                        currentUser
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


                                if (!resolved) {

                                    resolved = true;

                                    unsubscribe();

                                    authenticationPromise =
                                        null;

                                    reject(
                                        error
                                    );

                                }

                            }

                        },

                        (error) => {

                            if (resolved) {
                                return;
                            }


                            resolved = true;

                            unsubscribe();

                            authenticationPromise =
                                null;


                            console.error(
                                "Firebase authentication state error:",
                                error
                            );


                            reject(
                                error
                            );

                        }
                    );

            }
        );


    return authenticationPromise;

}


/* ============================================================
   LOAD EXISTING VOTE FROM FIRESTORE
   ============================================================ */

async function loadExistingVote(
    category,
    product
) {

    /*
     * Authentication and Firestore are required.
     */

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
     * If we already confirmed this vote during the
     * current page session, use it.
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


        /*
         * No vote exists for this user/product.
         */

        if (
            !snapshot.exists()
        ) {

            return null;

        }


        const data =
            snapshot.data();


        /*
         * Extra safety check:
         *
         * The returned vote must belong to the current user.
         */

        if (
            data.uid !==
            currentUser.uid
        ) {

            console.warn(
                "Firestore returned a vote belonging to another UID."
            );

            return null;

        }


        /*
         * Only accept our two valid vote values.
         */

        if (
            data.vote !== "yes" &&
            data.vote !== "no"
        ) {

            console.warn(
                "Firestore vote contains an invalid vote value."
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


        /*
         * Cache the confirmed result locally.
         */

        saveConfirmedVoteLocally(
            category,
            product.id,
            data.vote
        );


        return data.vote;

    } catch (error) {

        /*
         * IMPORTANT:
         *
         * A failed read is NOT considered a vote.
         *
         * The visitor can still attempt to vote.
         */

        console.warn(
            "Could not check existing Firestore vote:",
            error
        );


        return null;

    }

}


/* ============================================================
   WRITE VOTE TO FIRESTORE
   ============================================================ */

async function saveVote(
    category,
    product,
    vote
) {

    /*
     * Validate product.
     */

    if (!product) {

        throw new Error(
            "No product is currently selected."
        );

    }


    /*
     * Validate vote.
     */

    if (
        vote !== "yes" &&
        vote !== "no"
    ) {

        throw new Error(
            "Invalid vote."
        );

    }


    /*
     * Make absolutely sure authentication exists.
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
     * Prevent double-clicks.
     */

    if (
        voteInProgress.has(key)
    ) {

        return false;

    }


    /*
     * If Firestore already confirmed this vote during
     * this session, don't write another vote.
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
         * IMPORTANT:
         *
         * setDoc() is awaited.
         *
         * The UI is NOT told that the vote succeeded
         * until Firebase confirms the write.
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
         * Firestore successfully accepted the vote.
         */

        confirmedVotes.set(
            key,
            vote
        );


        /*
         * Cache the confirmed result.
         */

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
         * DO NOT cache the vote.
         *
         * If Firestore rejected it, it is NOT registered.
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
   LOCAL STORAGE
   ============================================================ */

/*
 * IMPORTANT:
 *
 * localStorage is ONLY a convenience cache.
 *
 * Firestore is the actual source of truth.
 */

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


    if (product) {

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


    /*
     * Do NOT leave the vote area looking completed
     * after an unsuccessful vote.
     */

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
            "Make sure Anonymous Authentication is enabled " +
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
     * Authenticate before attempting the vote.
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


    /*
     * Authentication must have produced a user.
     */

    if (!currentUser) {

        showVoteError(
            battle,
            "We couldn't create your voting session. Please try again."
        );


        return;

    }


    /*
     * Save the vote.
     */

    try {

        const saved =
            await saveVote(
                category,
                product,
                vote
            );


        /*
         * ONLY show success if Firestore confirmed
         * the write.
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


        /*
         * Failed vote is NOT cached.
         */

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
     * Keep index safely inside the array.
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
     * UPDATE POSITION
     */

    updateProductPosition(
        battle,
        index,
        products.length
    );


    /*
     * UPDATE DOTS
     */

    updateDots(
        battle,
        products,
        index
    );


    /*
     * UPDATE IMAGE
     */

    setImage(
        battle.querySelector(
            "[data-image]"
        ),
        product.image,
        product.name
    );


    /*
     * UPDATE PRODUCT LABEL
     */

    setText(
        battle.querySelector(
            "[data-label]"
        ),
        `PRODUCT ${index + 1}`
    );


    /*
     * UPDATE NAME
     */

    setText(
        battle.querySelector(
            "[data-name]"
        ),
        product.name
    );


    /*
     * UPDATE BRAND
     */

    setText(
        battle.querySelector(
            "[data-brand]"
        ),
        product.brand
    );


    /*
     * UPDATE DESCRIPTION
     */

    setText(
        battle.querySelector(
            "[data-description]"
        ),
        product.description
    );


    /*
     * UPDATE PRODUCT LINK
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
     * UPDATE SCORE
     */

    updateScoreUI(
        battle,
        product
    );


    /*
     * RESET VOTE UI
     */

    resetVoteUI(
        battle
    );


    /*
     * --------------------------------------------------------
     * CHECK LOCAL CACHE
     * --------------------------------------------------------
     *
     * This is only a speed optimization.
     */

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


        showVoteUI(
            battle,
            localVote
        );


        /*
         * We still don't need to perform a Firestore read
         * immediately because this local value was previously
         * created only after a successful Firestore write.
         */

        return;

    }


    /*
     * --------------------------------------------------------
     * CHECK FIRESTORE
     * --------------------------------------------------------
     *
     * This is what was missing in your previous code.
     */

    try {

        await startAnonymousAuthentication();


        if (!currentUser) {

            return;

        }


        const existingVote =
            await loadExistingVote(
                category,
                product
            );


        if (existingVote) {

            showVoteUI(
                battle,
                existingVote
            );

        }

    } catch (error) {

        /*
         * A failed read must NOT prevent voting.
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
     * Initial product.
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
     * Find all battles.
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
     * Initialize the UI immediately.
     *
     * Firebase must never prevent the product cards
     * from rendering.
     */

    battlesOnPage.forEach(
        battle => {

            initializeBattle(
                battle
            );

        }
    );


    /*
     * Start anonymous authentication.
     *
     * This happens after the UI is initialized.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Firebase authentication ready.",
            user.uid
        );


        /*
         * Authentication is now ready.
         *
         * Refresh the currently displayed products so
         * Firestore can check for existing votes.
         */

        battlesOnPage.forEach(
            battle => {

                const category =
                    battle.dataset.category;


                const index =
                    battleIndexes[category] || 0;


                showProduct(
                    battle,
                    index
                );

            }
        );

    } catch (error) {

        console.error(
            "Firebase authentication could not start:",
            error
        );


        /*
         * The page still works visually.
         *
         * Voting will show an appropriate error if
         * the visitor attempts to vote.
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