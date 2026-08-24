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
   FIREBASE
========================================================= */

const auth = getAuth();

let currentUser = null;
let firebaseReady = false;


/* =========================================================
   PRODUCT DATA
========================================================= */

const competitions = {

    baby: [

        {
            id: "baby-einstein-aquarium",
            name: "Soother Musical Crib Toy",
            brand: "Baby Einstein",
            image: "assets/babyeinstein-aquarium.jpeg",
            alt: "Baby Einstein Soother Musical Crib Toy",
            description:
                "A popular option for keeping little ones entertained during quiet moments and daily routines.",
            link: "https://amzn.to/4fNqr9j"
        },

        {
            id: "baby-white-noise-machine",
            name: "White Noise Machine",
            brand: "Parent Favorite",
            image: "assets/white-noise-machine.jpeg",
            alt: "White noise machine",
            description:
                "A popular choice for creating a consistent sleep environment for little ones.",
            link: "https://amzn.to/4z8LxGC"
        }

    ],


    toddler: [

        {
            id: "toddler-favorite",
            name: "Toddler Favorite",
            brand: "MomYouNeedThis Pick",
            image: "assets/product2.jpg",
            alt: "Toddler favorite product",
            description:
                "A practical everyday product designed to make life with toddlers a little easier.",
            link: "YOUR-AMAZON-LINK-HERE"
        },

        {
            id: "toddler-red-light",
            name: "Red Light",
            brand: "Parent Favorite",
            image: "assets/redlight.jpeg",
            alt: "Red light for baby and toddler routines",
            description:
                "A useful addition to bedtime and nighttime routines.",
            link: "https://amzn.to/3U5XzAB"
        }

    ],


    sleep: [

        {
            id: "sleep-white-noise",
            name: "White Noise Machine",
            brand: "Parent Favorite",
            image: "assets/white-noise-machine.jpeg",
            alt: "White noise machine",
            description:
                "A popular choice for creating a consistent sleep environment for little ones.",
            link: "https://amzn.to/4z8LxGC"
        },

        {
            id: "sleep-red-light",
            name: "Red Light",
            brand: "Parent Favorite",
            image: "assets/redlight.jpeg",
            alt: "Red light",
            description:
                "A simple option some parents incorporate into nighttime routines.",
            link: "https://amzn.to/3U5XzAB"
        }

    ],


    potty: [

        {
            id: "babybjorn-potty",
            name: "Potty Training Seat",
            brand: "BabyBjörn",
            image: "assets/babybjorn-potty-toilet.jpeg",
            alt: "BabyBjorn potty",
            description:
                "A simple potty-training option designed to help toddlers feel comfortable and confident.",
            link: "https://amzn.to/3S23eqS"
        },

        {
            id: "potty-training-contender",
            name: "Potty Training Favorite",
            brand: "Mom Favorite",
            image: "assets/babybjorn-potty-toilet.jpeg",
            alt: "Potty training product",
            description:
                "Another contender will be added as more moms submit their favorite products.",
            link: "submit-holy-grail.html"
        }

    ]

};


/* =========================================================
   ANONYMOUS AUTHENTICATION
========================================================= */

async function initializeVoting() {

    try {

        const credential =
            await signInAnonymously(auth);

        currentUser =
            credential.user;

        firebaseReady = true;

        console.log(
            "Voting authentication ready."
        );

        initializeBattles();

    } catch (error) {

        console.error(
            "Firebase anonymous authentication failed:",
            error
        );

        firebaseReady = false;

        initializeBattles();

    }

}


/* =========================================================
   INITIALIZE ALL BATTLES
========================================================= */

function initializeBattles() {

    const battles =
        document.querySelectorAll(
            ".product-battle"
        );


    battles.forEach(
        initializeBattle
    );

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

        return;

    }


    let currentIndex = 0;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const image =
        battle.querySelector("[data-image]");

    const name =
        battle.querySelector("[data-name]");

    const brand =
        battle.querySelector("[data-brand]");

    const description =
        battle.querySelector("[data-description]");

    const link =
        battle.querySelector("[data-link]");

    const label =
        battle.querySelector("[data-label]");

    const position =
        battle.querySelector("[data-position]");

    const voteButton =
        battle.querySelector("[data-vote]");

    const confirmation =
        battle.querySelector("[data-confirmation]");

    const dotsContainer =
        battle.querySelector("[data-dots]");

    const previousButton =
        battle.querySelector("[data-prev]");

    const nextButton =
        battle.querySelector("[data-next]");


    /* =====================================================
       CREATE DOTS
    ===================================================== */

    products.forEach(
        function (_, index) {

            const dot =
                document.createElement("button");

            dot.type =
                "button";

            dot.className =
                "battle-dot";

            dot.setAttribute(
                "aria-label",
                `Show product ${index + 1}`
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

    function updateProduct() {

        const product =
            products[currentIndex];


        image.classList.add(
            "product-changing"
        );


        setTimeout(
            function () {

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
                    `PRODUCT ${currentIndex + 1}`;

                position.textContent =
                    `${currentIndex + 1} / ${products.length}`;

                confirmation.textContent =
                    "";

                image.classList.remove(
                    "product-changing"
                );

            },
            120
        );


        dots.forEach(
            function (dot, index) {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );

            }
        );


        previousButton.disabled =
            currentIndex === 0;

        nextButton.disabled =
            currentIndex === products.length - 1;


        /*
           IMPORTANT:

           No Firestore read here.

           Browsing products is completely local.
        */

        resetVoteButton();

    }


    /* =====================================================
       RESET VOTE BUTTON
    ===================================================== */

    function resetVoteButton() {

        voteButton.disabled =
            false;

        voteButton.classList.remove(
            "has-voted"
        );

        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>I WOULD RECOMMEND THIS</span>';

    }


    /* =====================================================
       VOTE DOCUMENT ID
    =====================================================

       One document per anonymous user per category.

       Example:

       baby_abc123

       toddler_abc123

       potty_abc123
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
       VOTE
    ===================================================== */

    voteButton.addEventListener(
        "click",
        async function () {

            const product =
                products[currentIndex];


            /* -----------------------------------------
               AUTH CHECK
            ----------------------------------------- */

            if (!firebaseReady || !currentUser) {

                confirmation.textContent =
                    "We're still connecting your vote. Please try again.";

                return;

            }


            /*
               Prevent accidental double-clicks.
            */

            voteButton.disabled =
                true;

            confirmation.textContent =
                "Recording your vote...";


            try {

                const voteId =
                    getVoteDocumentId();


                const voteRef =
                    doc(
                        db,
                        "votes",
                        voteId
                    );


                /* -----------------------------------------
                   CHECK EXISTING VOTE

                   This is the ONLY Firestore read
                   generated by voting.
                ----------------------------------------- */

                const existingVote =
                    await getDoc(
                        voteRef
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

                        showAlreadySelected();

                        confirmation.textContent =
                            "💗 You've already recommended this product.";

                    } else {

                        showAlreadyVoted();

                        confirmation.textContent =
                            "💗 You've already voted in this category.";

                    }


                    voteButton.disabled =
                        false;

                    return;

                }


                /* -----------------------------------------
                   CREATE VOTE
                ----------------------------------------- */

                await setDoc(
                    voteRef,
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


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                showAlreadySelected();


                confirmation.textContent =
                    "💗 Thanks! Your recommendation has been recorded.";


            } catch (error) {

                console.error(
                    "Vote error:",
                    error
                );


                if (
                    error.code ===
                    "permission-denied"
                ) {

                    showAlreadyVoted();

                    confirmation.textContent =
                        "💗 You've already voted in this category.";

                } else {

                    confirmation.textContent =
                        "Something went wrong. Please try again.";

                    resetVoteButton();

                }

            }

        }
    );


    /* =====================================================
       BUTTON STATES
    ===================================================== */

    function showAlreadySelected() {

        voteButton.classList.add(
            "has-voted"
        );

        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>YOU RECOMMENDED THIS</span>';

    }


    function showAlreadyVoted() {

        voteButton.classList.remove(
            "has-voted"
        );

        voteButton.innerHTML =
            '<span class="recommend-heart">♥</span>' +
            '<span>ALREADY VOTED</span>';

    }


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