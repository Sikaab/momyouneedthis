/*
 * ============================================================
 * MOMYOU NEED THIS — MOM-VOTED PRODUCT BATTLES
 * ============================================================
 *
 * Requires Firebase modular SDK.
 *
 * IMPORTANT:
 * Replace the firebaseConfig values below with the SAME
 * Firebase web app configuration used by your other working
 * MomYouNeedThis tools.
 *
 * Firestore collection:
 *     productVotes
 *
 * Required fields:
 *     uid
 *     category
 *     productId
 *     productName
 *     productBrand
 *
 * Firebase Authentication:
 *     Anonymous authentication
 *
 * ============================================================
 */


/* ============================================================
   FIREBASE IMPORTS
   ============================================================ */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ============================================================
   FIREBASE CONFIG
   ============================================================

   IMPORTANT:
   Use your EXISTING Firebase configuration.

   Do NOT create a second Firebase project.

   ============================================================ */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};


/* ============================================================
   INITIALIZE FIREBASE
   ============================================================ */

let firebaseApp;
let auth;
let db;

try {

    firebaseApp = initializeApp(firebaseConfig);

    auth = getAuth(firebaseApp);

    db = getFirestore(firebaseApp);

} catch (error) {

    console.error(
        "Firebase initialization failed:",
        error
    );

}


/* ============================================================
   STATE
   ============================================================ */

let currentUser = null;

let authenticationReady = false;

let authenticationPromise = null;


/*
 * Tracks the product currently being displayed in each battle.
 *
 * Example:
 *
 * {
 *     baby: 0,
 *     toddler: 1
 * }
 */

const battleIndexes = {};


/*
 * Prevents double-clicks while a vote is being written.
 */

const voteInProgress = new Set();


/*
 * Stores votes only AFTER Firestore successfully confirms
 * the write.
 *
 * Key:
 *
 * category_productId
 */

const confirmedVotes = new Map();


/* ============================================================
   PRODUCT DATA
   ============================================================

   These IDs are stable identifiers.

   DO NOT change them after votes have started accumulating.

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
   UTILITY FUNCTIONS
   ============================================================ */

function getBattleKey(category, productId) {

    return `${category}_${productId}`;

}


function getVoteDocumentId(category, productId, uid) {

    /*
     * This produces:
     *
     * UID_category_productId
     *
     * Your Firestore rule checks that the document ID begins
     * with the authenticated UID.
     */

    return `${uid}_${category}_${productId}`;

}


function getCurrentProduct(category) {

    const products = battles[category];

    if (!products || products.length === 0) {
        return null;
    }

    let index = battleIndexes[category];

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

    if (!auth) {

        return Promise.reject(
            new Error(
                "Firebase Authentication is not initialized."
            )
        );

    }


    /*
     * If Firebase already has a user, use it.
     */

    if (auth.currentUser) {

        currentUser = auth.currentUser;

        authenticationReady = true;

        return Promise.resolve(currentUser);

    }


    /*
     * Wait for Firebase's authentication state.
     */

    authenticationPromise = new Promise(
        (resolve, reject) => {

            let resolved = false;


            const unsubscribe = onAuthStateChanged(
                auth,
                async (user) => {

                    if (resolved) {
                        return;
                    }


                    if (user) {

                        resolved = true;

                        currentUser = user;

                        authenticationReady = true;

                        unsubscribe();

                        console.log(
                            "Anonymous Firebase user ready:",
                            user.uid
                        );

                        resolve(user);

                        return;

                    }


                    /*
                     * No authenticated user exists yet.
                     *
                     * Create one anonymously.
                     */

                    try {

                        const credential =
                            await signInAnonymously(auth);

                        if (
                            credential &&
                            credential.user
                        ) {

                            currentUser =
                                credential.user;

                            authenticationReady = true;

                            resolved = true;

                            unsubscribe();

                            console.log(
                                "Anonymous authentication successful:",
                                currentUser.uid
                            );

                            resolve(currentUser);

                        }

                    } catch (error) {

                        console.error(
                            "Anonymous authentication failed:",
                            error
                        );

                        if (!resolved) {

                            resolved = true;

                            unsubscribe();

                            reject(error);

                        }

                    }

                },

                (error) => {

                    if (resolved) {
                        return;
                    }

                    resolved = true;

                    unsubscribe();

                    reject(error);

                }

            );

        }
    );


    return authenticationPromise;

}


/* ============================================================
   LOAD EXISTING VOTE
   ============================================================ */

async function loadExistingVote(
    category,
    product
) {

    if (!currentUser || !db) {
        return null;
    }


    const key = getBattleKey(
        category,
        product.id
    );


    /*
     * Already loaded during this page session.
     */

    if (confirmedVotes.has(key)) {

        return confirmedVotes.get(key);

    }


    const documentId =
        getVoteDocumentId(
            category,
            product.id,
            currentUser.uid
        );


    try {

        const voteRef = doc(
            db,
            "productVotes",
            documentId
        );


        const snapshot =
            await getDoc(voteRef);


        if (snapshot.exists()) {

            const data = snapshot.data();

            const vote =
                data.vote === "yes" ||
                data.vote === "no"
                    ? data.vote
                    : null;


            if (vote) {

                confirmedVotes.set(
                    key,
                    vote
                );

            }


            return vote;

        }


        return null;

    } catch (error) {

        /*
         * IMPORTANT:
         *
         * Your current Firestore rules explicitly say:
         *
         * allow read: if false;
         *
         * Therefore getDoc() will be denied.
         *
         * We intentionally DO NOT treat this as a vote.
         *
         * The application can still create votes because create
         * is allowed by your rules.
         */

        console.warn(
            "Existing vote cannot be read because Firestore read access is disabled:",
            error
        );

        return null;

    }

}


/* ============================================================
   WRITE VOTE
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
     * ABSOLUTELY REQUIRE AUTHENTICATION FIRST.
     */

    if (!authenticationReady || !currentUser) {

        try {

            await startAnonymousAuthentication();

        } catch (error) {

            throw new Error(
                "Authentication failed. Your vote was not saved."
            );

        }

    }


    if (!currentUser) {

        throw new Error(
            "No authenticated Firebase user exists. Your vote was not saved."
        );

    }


    if (!db) {

        throw new Error(
            "Firestore is not initialized. Your vote was not saved."
        );

    }


    const key =
        getBattleKey(
            category,
            product.id
        );


    /*
     * Prevent multiple clicks while the first request
     * is still being processed.
     */

    if (voteInProgress.has(key)) {

        return false;

    }


    /*
     * If this page already knows the vote was successfully
     * saved, don't create another one.
     */

    if (confirmedVotes.has(key)) {

        return false;

    }


    voteInProgress.add(key);


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
         * Nothing is saved locally before this succeeds.
         */

        await setDoc(
            voteRef,
            {
                uid: currentUser.uid,
                category: category,
                productId: product.id,
                productName: product.name,
                productBrand: product.brand,
                vote: vote,
                createdAt: serverTimestamp()
            },
            {
                merge: false
            }
        );


        /*
         * Only NOW do we consider the vote confirmed.
         */

        confirmedVotes.set(
            key,
            vote
        );


        /*
         * Only NOW save the local state.
         */

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


        /*
         * IMPORTANT:
         *
         * We deliberately DO NOT save anything locally here.
         */

        throw error;

    } finally {

        voteInProgress.delete(key);

    }

}


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function getLocalVoteKey(
    category,
    productId
) {

    return `momYouNeedThis_vote_${category}_${productId}`;

}


function saveConfirmedVoteLocally(
    category,
    productId,
    vote
) {

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
        element.textContent = value;
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


    /*
     * Do NOT allow a broken image to stop the application.
     */

    imageElement.onerror = () => {

        console.warn(
            "Product image failed to load:",
            src
        );

        imageElement.classList.add(
            "image-load-error"
        );

    };


    imageElement.src = src;

    imageElement.alt = alt || "";

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


    /*
     * THIS fixes:
     *
     * PRODUCT 1 OF 2
     *
     * becoming:
     *
     * PRODUCT 2 OF 2
     */

    setText(
        position,
        `PRODUCT ${index + 1} OF ${total}`
    );


    /*
     * Update:
     *
     * 1 / 2
     *
     * to:
     *
     * 2 / 2
     */

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


    dots.innerHTML = "";


    products.forEach(
        (_, index) => {

            const dot =
                document.createElement(
                    "button"
                );


            dot.type = "button";

            dot.className =
                "battle-dot";


            if (index === activeIndex) {

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


            dots.appendChild(dot);

        }
    );

}


function updateScoreUI(
    battle,
    product
) {

    const percentage =
        Number(product.percentage) || 0;


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

        if (percentage >= 70) {

            consensus.textContent =
                "🔥 Mom favorite";

        } else if (percentage >= 60) {

            consensus.textContent =
                "💗 Strong mom approval";

        } else {

            consensus.textContent =
                "👀 Moms are deciding";

        }

    }

}


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

                button.disabled = false;

                button.classList.remove(
                    "selected"
                );

            }
        );

}


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

                button.disabled = true;


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
            Number(product.percentage) || 0;


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


    if (!products || products.length === 0) {

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


    if (index >= products.length) {

        index = 0;

    }


    battleIndexes[category] = index;


    const product =
        products[index];


    /*
     * UPDATE POSITION FIRST
     */

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


    /*
     * UPDATE PRODUCT INFORMATION
     */

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


    /*
     * Do not trust localStorage alone.
     *
     * The local state is only considered confirmed if it was
     * previously created AFTER a successful Firestore write.
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

    }


    /*
     * Because your current rules have:
     *
     * allow read: if false;
     *
     * we cannot verify existing votes from Firestore.
     *
     * We therefore don't block the UI waiting for a read.
     */

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
        getCurrentProduct(category);


    if (!product) {

        return;

    }


    const key =
        getBattleKey(
            category,
            product.id
        );


    /*
     * Ignore duplicate clicks.
     */

    if (voteInProgress.has(key)) {

        return;

    }


    /*
     * Make sure the user is authenticated BEFORE showing
     * any successful vote UI.
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
     * Now attempt Firestore.
     */

    try {

        const saved =
            await saveVote(
                category,
                product,
                vote
            );


        /*
         * Only show success if Firestore actually returned
         * successfully.
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
         * IMPORTANT:
         *
         * No localStorage write happens here.
         *
         * Therefore a failed Firebase vote is NOT treated
         * as a registered vote.
         */

        showVoteError(
            battle,
            getReadableFirebaseError(error)
        );

    }

}


/* ============================================================
   VOTE ERROR UI
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

        return "Your vote could not be registered.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "Firebase rejected the vote. " +
            "Check that Anonymous Authentication is enabled " +
            "and that your Firestore rules match this application."
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


    return (
        "Your vote could not be registered. " +
        "Please try again."
    );

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


    if (!products || products.length === 0) {
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


    if (!products || products.length === 0) {
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


    battleIndexes[category] = 0;


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
     * NEXT CONTENDER BUTTON
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
     * YES / NO BUTTONS
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
     * Initial product display.
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


    const battlesOnPage =
        document.querySelectorAll(
            ".product-battle"
        );


    if (!battlesOnPage.length) {

        console.warn(
            "No .product-battle elements found."
        );

        return;

    }


    /*
     * Initialize the UI FIRST.
     *
     * A broken image must never prevent the voting interface
     * from being initialized.
     */

    battlesOnPage.forEach(
        battle => {

            initializeBattle(
                battle
            );

        }
    );


    /*
     * THEN initialize anonymous Firebase authentication.
     *
     * Voting buttons remain functional only after authentication
     * has been established.
     */

    try {

        await startAnonymousAuthentication();

        console.log(
            "Firebase authentication ready."
        );

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