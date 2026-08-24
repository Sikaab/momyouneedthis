/* =========================================================
   MOM-VOTED PRODUCTS
   MomYouNeedThis

========================================================= */

import { db } from "./firebase-config.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* =========================================================
   FIREBASE AUTH
========================================================= */

const auth = getAuth();

let currentUser = null;

let firebaseReady = false;


/*
   Anonymous authentication happens once when
   the page loads.
*/

async function initializeVoting() {

    try {

        const userCredential =
            await signInAnonymously(auth);

        currentUser =
            userCredential.user;

        firebaseReady = true;

        console.log(
            "Anonymous voting ready:",
            currentUser.uid
        );

        initializeBattles();

    } catch (error) {

        console.error(
            "Anonymous authentication failed:",
            error
        );

        firebaseReady = false;

        /*
           We still initialize the carousel even if
           authentication fails.
        */

        initializeBattles();

    }

}


/* =========================================================
   PRODUCT DATA
========================================================= */

const competitions = {

    baby: [

        {
            id: "baby-einstein-aquarium",

            name: "Soother Musical Crib Toy",

            brand: "Baby Einstein",

            image:
                "assets/babyeinstein-aquarium.jpeg",

            alt:
                "Baby Einstein Soother Musical Crib Toy",

            description:
                "A popular option for keeping little ones entertained during quiet moments and daily routines.",

            link:
                "https://amzn.to/4fNqr9j"
        },


        {
            id: "white-noise-machine",

            name: "White Noise Machine",

            brand: "Parent Favorite",

            image:
                "assets/white-noise-machine.jpeg",

            alt:
                "White noise machine",

            description:
                "A popular choice for creating a consistent sleep environment for little ones.",

            link:
                "https://amzn.to/4z8LxGC"
        }

    ],


    toddler: [

        {
            id: "toddler-favorite",

            name: "Toddler Favorite",

            brand: "MomYouNeedThis Pick",

            image:
                "assets/product2.jpg",

            alt:
                "Toddler favorite product",

            description:
                "A practical everyday product designed to make life with toddlers a little easier.",

            link:
                "YOUR-AMAZON-LINK-HERE"
        },


        {
            id: "red-light",

            name: "Red Light",

            brand: "Parent Favorite",

            image:
                "assets/redlight.jpeg",

            alt:
                "Red light for baby and toddler routines",

            description:
                "A useful addition to bedtime and nighttime routines.",

            link:
                "https://amzn.to/3U5XzAB"
        }

    ],


    sleep: [

        {
            id: "sleep-white-noise",

            name: "White Noise Machine",

            brand: "Parent Favorite",

            image:
                "assets/white-noise-machine.jpeg",

            alt:
                "White noise machine",

            description:
                "A popular choice for creating a consistent sleep environment for little ones.",

            link:
                "https://amzn.to/4z8LxGC"
        },


        {
            id: "sleep-red-light",

            name: "Red Light",

            brand: "Parent Favorite",

            image:
                "assets/redlight.jpeg",

            alt:
                "Red light",

            description:
                "A simple option some parents incorporate into nighttime routines.",

            link:
                "https://amzn.to/3U5XzAB"
        }

    ],


    potty: [

        {
            id: "babybjorn-potty",

            name: "Potty Training Seat",

            brand: "BabyBjörn",

            image:
                "assets/babybjorn-potty-toilet.jpeg",

            alt:
                "BabyBjorn potty",

            description:
                "A simple potty-training option designed to help toddlers feel comfortable and confident.",

            link:
                "https://amzn.to/3S23eqS"
        },


        {
            id: "potty-training-contender",

            name: "Potty Training Favorite",

            brand: "Mom Favorite",

            image:
                "assets/babybjorn-potty-toilet.jpeg",

            alt:
                "Potty training product",

            description:
                "Another contender will be added as more moms submit their favorite products.",

            link:
                "submit-holy-grail.html"
        }

    ]

};


/* =========================================================
   BATTLE INITIALIZATION
========================================================= */

function initializeBattles() {

    const battles =
        document.querySelectorAll(
            ".product-battle"
        );


    battles.forEach(function (battle) {

        initializeBattle(battle);

    });

}


/* =========================================================
   INDIVIDUAL BATTLE
========================================================= */

function initializeBattle(battle) {

    const category =
        battle.dataset.category;


    const products =
        competitions[category];


    if (
        !products ||
        products.length === 0
    ) {

        console.warn(
            "No products found for:",
            category
        );

        return;

    }


    let currentIndex = 0;


    /* =========================
       ELEMENTS
    ========================= */

    const image =
        battle.querySelector(
            "[data-image]"
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


    const link =
        battle.querySelector(
            "[data-link]"
        );


    const label =
        battle.querySelector(
            "[data-label]"
        );


    const position =
        battle.querySelector(
            "[data-position]"
        );


    const voteButton =
        battle.querySelector(
            "[data-vote]"
        );


    const confirmation =
        battle.querySelector(
            "[data-confirmation]"
        );


    const dotsContainer =
        battle.querySelector(
            "[data-dots]"
        );


    const previousButton =
        battle.querySelector(
            "[data-prev]"
        );


    const nextButton =
        battle.querySelector(
            "[data-next]"
        );


    /* =========================
       CREATE DOTS
    ========================= */

    products.forEach(
        function (_, index) {

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
                "Show product " +
                (index + 1)
            );


            dot.addEventListener(
                "click",
                function () {

                    currentIndex =
                        index;

                    updateProduct();

                }
            );


            dotsContainer.appendChild(
                dot
            );

        }
    );


    const dots =
        dotsContainer.querySelectorAll(
            ".battle-dot"
        );


    /* =====================================================
       UPDATE PRODUCT
    ===================================================== */

    async function updateProduct() {

        const product =
            products[currentIndex];


        image.classList.add(
            "product-changing"
        );


        setTimeout(
            async function () {

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


                link.href =
                    product.link;


                label.textContent =
                    "PRODUCT " +
                    (currentIndex + 1);


                position.textContent =
                    (currentIndex + 1) +
                    " / " +
                    products.length;


                confirmation.textContent =
                    "";


                image.classList.remove(
                    "product-changing"
                );


                updateDots();


                updateArrows();


                await updateVoteState(
                    category,
                    product
                );

            },
            120
        );

    }


    /* =====================================================
       DOTS
    ===================================================== */

    function updateDots() {

        dots.forEach(
            function (dot, index) {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );

            }
        );

    }


    /* =====================================================
       ARROWS
    ===================================================== */

    function updateArrows() {

        previousButton.disabled =
            currentIndex === 0;


        nextButton.disabled =
            currentIndex ===
            products.length - 1;

    }


    /* =====================================================
       VOTE DOCUMENT ID
    =====================================================

       IMPORTANT:

       One anonymous user gets ONE vote
       per battle/category.

       Example:

       baby_USER123

       toddler_USER123

       potty_USER123

    */

    function getVoteDocumentId() {

        if (!currentUser) {

            return null;

        }


        return (
            category +
            "_" +
            currentUser.uid
        );

    }


    /* =====================================================
       CHECK EXISTING VOTE
    ===================================================== */

    async function getExistingVote(
        category
    ) {

        if (!currentUser) {

            return null;

        }


        const voteDocumentId =
            getVoteDocumentId();


        if (!voteDocumentId) {

            return null;

        }


        try {

            const voteReference =
                doc(
                    db,
                    "votes",
                    voteDocumentId
                );


            const voteSnapshot =
                await getDoc(
                    voteReference
                );


            if (
                voteSnapshot.exists()
            ) {

                return voteSnapshot.data();

            }


            return null;

        } catch (error) {

            console.error(
                "Could not check vote:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       UPDATE VOTE BUTTON
    ===================================================== */

    async function updateVoteState(
        category,
        product
    ) {

        /*
           Firebase hasn't authenticated yet.
        */

        if (!firebaseReady) {

            voteButton.disabled =
                true;

            voteButton.innerHTML =
                '<span class="recommend-heart">♥</span>' +
                '<span>LOADING...</span>';

            return;

        }


        voteButton.disabled =
            true;


        const existingVote =
            await getExistingVote(
                category
            );


        if (
            existingVote &&
            existingVote.productId ===
                product.id
        ) {

            showVotedState();

        }

        else if (
            existingVote
        ) {

            /*
               User already voted for another
               product in this battle.
            */

            showAlreadyVotedState();

        }

        else {

            showAvailableVoteState();

        }


        voteButton.disabled =
            false;

    }


    /* =====================================================
       VOTE BUTTON STATES
    ===================================================== */

    function showAvailableVoteState() {

        voteButton.classList.remove(
            "has-voted"
        );


        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>I WOULD RECOMMEND THIS</span>';

    }


    function showVotedState() {

        voteButton.classList.add(
            "has-voted"
        );


        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>YOU RECOMMENDED THIS</span>';

    }


    function showAlreadyVotedState() {

        voteButton.classList.remove(
            "has-voted"
        );


        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>ALREADY VOTED</span>';

    }


    /* =====================================================
       CAST VOTE
    ===================================================== */

    voteButton.addEventListener(
        "click",
        async function () {

            const product =
                products[currentIndex];


            if (!firebaseReady) {

                confirmation.textContent =
                    "Please wait a moment and try again.";

                return;

            }


            if (!currentUser) {

                confirmation.textContent =
                    "We couldn't connect your vote. Please try again.";

                return;

            }


            /*
               Prevent multiple clicks while
               Firebase processes the vote.
            */

            voteButton.disabled =
                true;


            confirmation.textContent =
                "Recording your vote...";


            try {

                const voteDocumentId =
                    getVoteDocumentId();


                const voteReference =
                    doc(
                        db,
                        "votes",
                        voteDocumentId
                    );


                /*
                   Check first so we can give
                   the user a nice message.
                */

                const existingVote =
                    await getDoc(
                        voteReference
                    );


                if (
                    existingVote.exists()
                ) {

                    const previousVote =
                        existingVote.data();


                    if (
                        previousVote.productId ===
                        product.id
                    ) {

                        showVotedState();

                        confirmation.textContent =
                            "💗 You've already recommended this one.";

                    } else {

                        showAlreadyVotedState();

                        confirmation.textContent =
                            "💗 You've already voted in this category.";

                    }


                    voteButton.disabled =
                        false;

                    return;

                }


                /*
                   CREATE THE VOTE

                   The document ID is:

                   category + anonymous UID

                   This means one user can only
                   create one vote document for
                   each category.
                */

                await setDoc(
                    voteReference,
                    {

                        battleId:
                            category,

                        productId:
                            product.id,

                        productName:
                            product.name,

                        productBrand:
                            product.brand,

                        userId:
                            currentUser.uid,

                        createdAt:
                            serverTimestamp()

                    }
                );


                /*
                   SUCCESS
                */

                showVotedState();


                confirmation.textContent =
                    "💗 Thanks! Your recommendation has been recorded.";


            } catch (error) {

                console.error(
                    "Vote failed:",
                    error
                );


                /*
                   Firestore rules may reject
                   a duplicate vote.

                   Treat that as already voted.
                */

                if (
                    error.code ===
                    "permission-denied"
                ) {

                    showAlreadyVotedState();

                    confirmation.textContent =
                        "💗 You've already voted in this category.";

                } else {

                    confirmation.textContent =
                        "Something went wrong. Please try again.";

                    showAvailableVoteState();

                }

            }


            voteButton.disabled =
                false;

        }
    );


    /* =====================================================
       PREVIOUS
    ===================================================== */

    previousButton.addEventListener(
        "click",
        function () {

            if (
                currentIndex > 0
            ) {

                currentIndex--;

                updateProduct();

            }

        }
    );


    /* =====================================================
       NEXT
    ===================================================== */

    nextButton.addEventListener(
        "click",
        function () {

            if (
                currentIndex <
                products.length - 1
            ) {

                currentIndex++;

                updateProduct();

            }

        }
    );


    /* =====================================================
       INITIAL PRODUCT
    ===================================================== */

    updateProduct();

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeVoting();

    }
);