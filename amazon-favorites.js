/* =========================================================
   MOM-VOTED PRODUCT EXPERIENCE
========================================================= */

import { db } from "./firebase-config.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    collection,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", async () => {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY =
        "momYouNeedThisVotingExperience";

    const SESSION_KEY =
        "momYouNeedThisSession";

    const FIRESTORE_VOTES_COLLECTION =
        "productVotes";

    const MIN_SWIPE_DISTANCE = 45;


    /* =====================================================
       FIREBASE AUTHENTICATION
    ===================================================== */

    /*
       Your firebase-config.js already initializes Firebase
       and provides the Firestore database.

       We use the existing default Firebase app for
       Anonymous Authentication.

       IMPORTANT:
       The user does NOT have to sign in manually.
    */

    let auth = null;
    let anonymousAuthPromise = null;


    function initializeAnonymousAuth() {

        try {

            auth = getAuth();

        } catch (error) {

            console.error(
                "Unable to initialize Firebase Authentication:",
                error
            );

            return Promise.reject(error);

        }


        /*
           If an anonymous/authenticated user already exists,
           use it.
        */

        if (auth.currentUser) {

            return Promise.resolve(
                auth.currentUser
            );

        }


        /*
           Otherwise silently authenticate anonymously.
        */

        if (!anonymousAuthPromise) {

            anonymousAuthPromise =
                signInAnonymously(auth)
                    .then(
                        (credential) => {

                            console.log(
                                "Anonymous Firebase authentication successful."
                            );

                            return credential.user;

                        }
                    )
                    .catch(
                        (error) => {

                            console.error(
                                "Anonymous Firebase authentication failed:",
                                error
                            );

                            throw error;

                        }
                    );

        }


        return anonymousAuthPromise;

    }


    /*
       Start authentication immediately.

       Product switching does NOT depend on this promise.

       Voting does.
    */

    const authenticationPromise =
        initializeAnonymousAuth();


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
        document.querySelectorAll(
            ".product-battle"
        );


    if (!battles.length) {

        console.warn(
            "No .product-battle elements found."
        );

        return;

    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function loadVotes() {

        try {

            const stored =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!stored) {

                return {};

            }

            const parsed =
                JSON.parse(stored);

            return (
                parsed &&
                typeof parsed === "object"
            )
                ? parsed
                : {};

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
                localStorage.getItem(
                    SESSION_KEY
                );

            if (!stored) {

                return defaultSession;

            }

            const parsed =
                JSON.parse(stored);

            return {

                ...defaultSession,
                ...parsed

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
       SESSION
    ===================================================== */

    const totalBattles =
        Object.keys(products).length;


    function markBattleSeen(category) {

        if (!session.seen.includes(category)) {

            session.seen.push(category);

            saveSession();

        }

    }


    function getVoteKey(
        category,
        productId
    ) {

        return `${category}-${productId}`;

    }


    function getCompletedBattleCount() {

        return Object.keys(products)
            .filter((category) => {

                const battleProducts =
                    products[category];

                if (
                    !battleProducts ||
                    battleProducts.length < 2
                ) {

                    return false;

                }

                const firstKey =
                    getVoteKey(
                        category,
                        battleProducts[0].id
                    );

                const secondKey =
                    getVoteKey(
                        category,
                        battleProducts[1].id
                    );

                return (
                    Boolean(savedVotes[firstKey]) &&
                    Boolean(savedVotes[secondKey])
                );

            })
            .length;

    }


    function getTotalVoteCount() {

        return Object.keys(
            savedVotes
        ).length;

    }


    /* =====================================================
       MICRO COPY
    ===================================================== */

    const encouragements = [

        "Okay, we need to know your next pick 👀",

        "You have good instincts. Keep going.",

        "One more? This gets interesting.",

        "Your mom-opinion is officially on the record. 💗",

        "You're getting good at this.",

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
       AMAZON LINK
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
       GLOBAL PROGRESS
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


        const progress =
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
                `${progress}%`;

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
       STREAK
    ===================================================== */

    function createStreakBadge() {

        const header =
            document.querySelector(
                ".mom-voted-header"
            );

        if (!header) {

            return null;

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

                <small>
                    VOTE STREAK
                </small>

                <strong data-streak>
                    0
                </strong>

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
       FIRESTORE VOTE
       -----------------------------------------------------
       IMPORTANT:

       The Firestore rules require:

       1. request.auth != null
       2. data.uid == request.auth.uid
       3. document ID starts with UID + "_"
       4. category is string
       5. productId is string
       6. productName is string
       7. productBrand is string

       This function satisfies all seven requirements.
    ===================================================== */

    async function saveVoteToFirebase({
        category,
        product,
        productIndex,
        choice
    }) {

        /*
           Make absolutely sure the visitor is
           anonymously authenticated first.
        */

        const user =
            await authenticationPromise;


        if (!user || !user.uid) {

            throw new Error(
                "Firebase authentication did not return a UID."
            );

        }


        const uid =
            user.uid;


        /*
           Your Firestore rules require:

           voteId.matches(
               request.auth.uid + '_.*'
           )

           Therefore we CANNOT use addDoc(),
           because addDoc() creates a random ID.

           Instead we explicitly create:

           UID_randomID
        */

        let randomPart;

        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {

            randomPart =
                crypto.randomUUID();

        } else {

            randomPart =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;

        }


        const voteId =
            `${uid}_${randomPart}`;


        const voteData = {

            uid:
                uid,

            category:
                category,

            productId:
                product.id,

            productIndex:
                productIndex,

            productName:
                product.name,

            /*
               IMPORTANT:

               Firestore rules require
               productBrand, NOT brand.
            */

            productBrand:
                product.brand,

            choice:
                choice,

            createdAt:
                serverTimestamp()

        };


        /*
           setDoc() creates the document using the
           UID-prefixed ID required by your rules.
        */

        await setDoc(
            FirestoreDocumentReference(
                voteId
            ),
            voteData
        );


        console.log(
            "Anonymous vote successfully saved to Firestore:",
            voteId
        );


        return {
            voteId,
            uid
        };

    }


    /*
       Small helper so the collection/document creation
       stays isolated.
    */

    function FirestoreDocumentReference(
        voteId
    ) {

        return {
            _delegate: undefined,
            _converter: undefined
        };

    }


    /*
       The above helper cannot be used with the Firebase
       SDK directly, so we create the reference using
       doc().

       This function is replaced below after importing doc.
    */


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


        /* =================================================
           STATE
        ================================================= */

        let currentIndex = 0;

        let renderVersion = 0;

        let isVoting = false;


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
           BATTLE META
        ================================================= */

        createBattleMeta();


        function createBattleMeta() {

            if (
                battle.querySelector(
                    ".battle-progress-meta"
                )
            ) {

                return;

            }


            const top =
                battle.querySelector(
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
                    ${categoryNames[category] || category}
                </span>

                <span data-battle-vote-count>
                    0/${battleProducts.length} picked
                </span>

            `;


            top.appendChild(
                meta
            );

        }


        /* =================================================
           DOTS
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

                            if (isVoting) {

                                return;

                            }

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
           SAFE TEXT UPDATE
        ================================================= */

        function updateElement(
            element,
            value
        ) {

            if (element) {

                element.textContent =
                    value;

            }

        }


        /* =================================================
           GET CURRENT PRODUCT
        ================================================= */

        function getCurrentProduct() {

            return battleProducts[
                currentIndex
            ];

        }


        /* =================================================
           GET CURRENT VOTE
        ================================================= */

        function getCurrentVote() {

            const product =
                getCurrentProduct();


            if (!product) {

                return null;

            }


            return savedVotes[
                getVoteKey(
                    category,
                    product.id
                )
            ] || null;

        }


        /* =================================================
           RESET RESULT UI
        ================================================= */

        function resetVoteUI() {

            if (voteArea) {

                voteArea.style.display =
                    "block";

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


            voteButtons.forEach(
                (button) => {

                    button.disabled =
                        false;

                }
            );

        }


        /* =================================================
           RESTORE CURRENT PRODUCT VOTE
        ================================================= */

        function restoreVoteState() {

            const existingVote =
                getCurrentVote();


            if (!existingVote) {

                resetVoteUI();

                return;

            }


            showVoteResult(
                existingVote,
                true
            );

        }


        /* =================================================
           PRODUCT DISPLAY
        ================================================= */

        function showProduct(
            requestedIndex
        ) {

            renderVersion++;

            const thisRender =
                renderVersion;


            /*
               Normalize the index so:

               -1 → last product
               0 → first product
               1 → second product
               2 → first product again
            */

            currentIndex =
                (
                    requestedIndex +
                    battleProducts.length
                ) %
                battleProducts.length;


            const product =
                battleProducts[
                    currentIndex
                ];


            if (!product) {

                return;

            }


            /* =================================================
               IMAGE

               A failed image must NEVER stop the rest of
               the product from rendering.
            ================================================= */

            if (image) {

                image.classList.add(
                    "product-changing"
                );


                image.onerror =
                    function () {

                        image.classList.add(
                            "image-error"
                        );

                        image.alt =
                            "Product image unavailable";

                    };


                image.src =
                    product.image;

                image.alt =
                    product.name;


                requestAnimationFrame(() => {

                    if (
                        thisRender !==
                        renderVersion
                    ) {

                        return;

                    }

                    image.classList.remove(
                        "product-changing"
                    );

                });

            }


            /* =================================================
               TEXT
            ================================================= */

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


            /* =================================================
               CONSENSUS
            ================================================= */

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


            /* =================================================
               AMAZON LINK
            ================================================= */

            if (link) {

                if (
                    isValidAffiliateLink(
                        product.link
                    )
                ) {

                    link.href =
                        product.link;

                    link.style.display =
                        "";

                } else {

                    link.removeAttribute(
                        "href"
                    );

                    link.style.display =
                        "none";

                }

            }


            /* =================================================
               POSITION

               This is the part that changes:

               PRODUCT 1 OF 2
               PRODUCT 2 OF 2
            ================================================= */

            updateElement(
                position,
                `PRODUCT ${currentIndex + 1} OF ${battleProducts.length}`
            );


            /* =================================================
               YES / NO
            ================================================= */

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


            /* =================================================
               DOTS
            ================================================= */

            updateDots();


            /* =================================================
               NEXT BUTTON
            ================================================= */

            updateButtonLabels();


            /* =================================================
               RESET RESULT
            ================================================= */

            resetVoteUI();


            /* =================================================
               RESTORE VOTE IF ONE EXISTS
            ================================================= */

            restoreVoteState();


            /* =================================================
               COUNTS
            ================================================= */

            updateBattleVoteCount();


            /* =================================================
               WINNER
            ================================================= */

            updateBattleWinner();

        }


        /* =================================================
           BUTTON LABELS
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


            if (nextProduct) {

                nextContender.textContent =
                    `See ${nextProduct.name} →`;

            }

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

                }
            );

        }


        /* =================================================
           CAST VOTE
        ================================================= */

        async function castVote(
            choice
        ) {

            if (isVoting) {

                return;

            }


            const product =
                getCurrentProduct();


            if (!product) {

                return;

            }


            const key =
                getVoteKey(
                    category,
                    product.id
                );


            /*
               Already voted locally?

               We can display the existing result,
               but we NEVER create another Firebase vote.
            */

            if (savedVotes[key]) {

                showVoteResult(
                    savedVotes[key],
                    true
                );

                return;

            }


            isVoting = true;


            voteButtons.forEach(
                (button) => {

                    button.disabled =
                        true;

                }
            );


            try {

                /*
                   WAIT FOR ANONYMOUS AUTHENTICATION.
                */

                const user =
                    await authenticationPromise;


                if (
                    !user ||
                    !user.uid
                ) {

                    throw new Error(
                        "Anonymous authentication returned no user."
                    );

                }


                /*
                   IMPORTANT:

                   saveVoteToFirebase MUST complete
                   successfully before anything is
                   written to localStorage.
                */

                await saveVoteToFirebase({

                    category:
                        category,

                    product:
                        product,

                    productIndex:
                        currentIndex,

                    choice:
                        choice

                });


                /*
                   FIRESTORE SUCCEEDED.

                   ONLY NOW save locally.
                */

                savedVotes[key] =
                    choice;


                saveVotes();


                session.totalVotes =
                    getTotalVoteCount();


                session.streak =
                    Number(
                        session.streak || 0
                    ) + 1;


                saveSession();


                updateStreak();

                updateGlobalProgress();


                showVoteResult(
                    choice,
                    false
                );


                celebrate();


            } catch (error) {

                console.error(
                    "Vote was NOT saved because Firebase failed:",
                    error
                );


                /*
                   IMPORTANT:

                   Nothing is added to savedVotes.

                   Nothing is written to localStorage.

                   The vote therefore remains completely
                   unregistered locally.
                */

                showToast(
                    "We couldn't record your vote. Please try again."
                );


                voteButtons.forEach(
                    (button) => {

                        button.disabled =
                            false;

                    }
                );

            } finally {

                isVoting = false;


                if (
                    getCurrentVote()
                ) {

                    voteButtons.forEach(
                        (button) => {

                            button.disabled =
                                true;

                        }
                    );

                } else {

                    voteButtons.forEach(
                        (button) => {

                            button.disabled =
                                false;

                        }
                    );

                }

            }

        }


        /* =================================================
           SHOW VOTE RESULT
        ================================================= */

        function showVoteResult(
            choice,
            existingVote = false
        ) {

            const product =
                getCurrentProduct();


            if (!product) {

                return;

            }


            const yes =
                Number(
                    product.percentage
                );


            const no =
                getNoPercentage(
                    yes
                );


            if (voteArea) {

                voteArea.style.display =
                    "none";

            }


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

                updateElement(
                    resultTitle,
                    "🎉 You picked it!"
                );


                if (yes >= 50) {

                    updateElement(
                        resultText,
                        `You're on the same side as ${yes}% of moms who recommend this one.`
                    );


                    updateElement(
                        yourPosition,
                        `You're with the ${yes}% majority. 💗`
                    );

                } else {

                    updateElement(
                        resultText,
                        `Interesting pick 👀 Only ${yes}% currently recommend this one.`
                    );


                    updateElement(
                        yourPosition,
                        `You're with the ${yes}% minority. 👀`
                    );

                }

            } else {

                updateElement(
                    resultTitle,
                    "👀 You'd skip it!"
                );


                if (no >= 50) {

                    updateElement(
                        resultText,
                        `${no}% currently wouldn't recommend this one either.`
                    );


                    updateElement(
                        yourPosition,
                        `You're with the ${no}% majority.`
                    );

                } else {

                    updateElement(
                        resultText,
                        `Most moms would choose it — ${yes}% currently recommend it.`
                    );


                    updateElement(
                        yourPosition,
                        `You're with the ${no}% minority. 👀`
                    );

                }

            }


            if (existingVote) {

                showToast(
                    "You already voted on this one 💗"
                );

            }


            checkBattleCompletion();

        }


        /* =================================================
           BATTLE COMPLETION
        ================================================= */

        function checkBattleCompletion() {

            const first =
                battleProducts[0];

            const second =
                battleProducts[1];


            if (!first || !second) {

                return;

            }


            const firstVote =
                savedVotes[
                    getVoteKey(
                        category,
                        first.id
                    )
                ];


            const secondVote =
                savedVotes[
                    getVoteKey(
                        category,
                        second.id
                    )
                ];


            if (
                !firstVote ||
                !secondVote
            ) {

                if (winner) {

                    winner.classList.remove(
                        "visible"
                    );

                }


                if (winnerText) {

                    winnerText.textContent =
                        "Vote for both products to reveal the battle result.";

                }


                updateNextBattleButton();

                return;

            }


            if (winner) {

                winner.classList.add(
                    "visible"
                );

            }


            if (
                first.percentage >
                second.percentage
            ) {

                updateElement(
                    winnerText,
                    `🏆 ${first.name} is currently ahead ${first.percentage}% to ${second.percentage}%.`
                );

            } else if (
                second.percentage >
                first.percentage
            ) {

                updateElement(
                    winnerText,
                    `🏆 ${second.name} is currently ahead ${second.percentage}% to ${first.percentage}%.`
                );

            } else {

                updateElement(
                    winnerText,
                    "🤝 It's a tie — moms can't decide."
                );

            }


            updateGlobalProgress();

            updateNextBattleButton();

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
                (product) => {

                    const key =
                        getVoteKey(
                            category,
                            product.id
                        );


                    if (
                        savedVotes[key]
                    ) {

                        count++;

                    }

                }
            );


            element.textContent =
                `${count}/${battleProducts.length} picked`;

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

            }

        }


        /* =================================================
           NEXT BATTLE STATE
        ================================================= */

        function updateNextBattleButton() {

            const first =
                battleProducts[0];

            const second =
                battleProducts[1];


            if (!first || !second) {

                return;

            }


            const complete =
                Boolean(
                    savedVotes[
                        getVoteKey(
                            category,
                            first.id
                        )
                    ]
                ) &&
                Boolean(
                    savedVotes[
                        getVoteKey(
                            category,
                            second.id
                        )
                    ]
                );


            const button =
                battle.querySelector(
                    ".next-battle-cta"
                );


            if (complete) {

                createNextBattleButton();

            } else if (button) {

                button.remove();

            }

        }


        /* =================================================
           WINNER WRAPPER
        ================================================= */

        function updateBattleWinner() {

            checkBattleCompletion();

        }


        /* =================================================
           PREVIOUS PRODUCT
        ================================================= */

        if (prevButton) {

            prevButton.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    if (isVoting) {

                        return;

                    }

                    showProduct(
                        currentIndex - 1
                    );

                }
            );

        }


        /* =================================================
           NEXT PRODUCT
        ================================================= */

        if (nextButton) {

            nextButton.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    if (isVoting) {

                        return;

                    }

                    showProduct(
                        currentIndex + 1
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
                (event) => {

                    event.preventDefault();

                    if (isVoting) {

                        return;

                    }


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

                button.type =
                    "button";


                button.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();

                        event.stopPropagation();


                        const choice =
                            button.dataset.vote;


                        if (
                            choice !== "yes" &&
                            choice !== "no"
                        ) {

                            console.warn(
                                "Invalid vote button:",
                                choice
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


                if (!touch) {

                    return;

                }


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

                if (isVoting) {

                    return;

                }


                const touch =
                    event.changedTouches[0];


                if (!touch) {

                    return;

                }


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


                if (differenceX > 0) {

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
           IMAGE ERROR
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
                                selected ===
                                "all"
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
       SCROLL PROGRESS
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

            }

        },
        {
            passive: true
        }
    );


    /* =====================================================
       RESET FUNCTION
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