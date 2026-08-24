/* =========================================================
   MOMYOU NEED THIS
   MOM-VOTED PRODUCT BATTLES
   Firebase Anonymous Authentication + Firestore
========================================================= */

import { db } from "./firebase-config.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* =========================================================
   FIREBASE AUTH
========================================================= */

const auth = getAuth();

let currentUser = null;

let authReady = new Promise((resolve, reject) => {

    onAuthStateChanged(auth, (user) => {

        if (user) {

            currentUser = user;

            console.log(
                "Anonymous Firebase user ready:",
                user.uid
            );

            resolve(user);

        }

    });

});


/* =========================================================
   START ANONYMOUS AUTH
========================================================= */

async function initializeAuthentication() {

    try {

        if (!auth.currentUser) {

            await signInAnonymously(auth);

        }

    } catch (error) {

        console.error(
            "Anonymous authentication failed:",
            error
        );

        throw error;

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
            id: "sleep-white-noise-machine",

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
   CREATE SAFE DOCUMENT ID
========================================================= */

function createVoteId(category, productId) {

    return `${currentUser.uid}_${category}_${productId}`;

}


/* =========================================================
   SAVE VOTE
========================================================= */

async function saveVote(category, product) {

    await authReady;

    if (!currentUser) {

        throw new Error(
            "Firebase authentication is not ready."
        );

    }


    const voteId =
        createVoteId(
            category,
            product.id
        );


    const voteRef =
        doc(
            db,
            "productVotes",
            voteId
        );


    await setDoc(
        voteRef,
        {

            uid: currentUser.uid,

            category: category,

            productId: product.id,

            productName: product.name,

            productBrand: product.brand,

            createdAt: serverTimestamp()

        },

        {
            merge: false
        }

    );

}


/* =========================================================
   CAROUSELS
========================================================= */

function initializeBattles() {

    const battles =
        document.querySelectorAll(
            ".product-battle"
        );


    battles.forEach(function (battle) {

        const category =
            battle.dataset.category;


        const products =
            competitions[category];


        if (
            !products ||
            !products.length
        ) {

            return;

        }


        let currentIndex = 0;


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


        /* =================================================
           DOTS
        ================================================= */

        products.forEach(function (_, index) {

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
                function () {

                    currentIndex =
                        index;

                    updateProduct();

                }
            );


            dotsContainer.appendChild(
                dot
            );

        });


        const dots =
            dotsContainer.querySelectorAll(
                ".battle-dot"
            );


        /* =================================================
           VOTE STATE
        ================================================= */

        function updateVoteState() {

            /*
             * We intentionally use localStorage only
             * for the visual state.
             *
             * Firestore remains the actual vote record.
             */

            const product =
                products[currentIndex];


            const localVoteKey =
                `momVote_${category}_${product.id}`;


            const hasVoted =
                localStorage.getItem(
                    localVoteKey
                );


            if (hasVoted) {

                voteButton.classList.add(
                    "has-voted"
                );


                voteButton.innerHTML =
                    `
                    <span class="recommend-heart">
                        ♥
                    </span>

                    <span>
                        YOU RECOMMENDED THIS
                    </span>
                    `;

            } else {

                voteButton.classList.remove(
                    "has-voted"
                );


                voteButton.innerHTML =
                    `
                    <span class="recommend-heart">
                        ♥
                    </span>

                    <span>
                        I WOULD RECOMMEND THIS
                    </span>
                    `;

            }

        }


        /* =================================================
           UPDATE PRODUCT
        ================================================= */

        function updateProduct() {

            const product =
                products[currentIndex];


            image.classList.add(
                "product-changing"
            );


            setTimeout(function () {

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


                updateVoteState();

            }, 120);


            dots.forEach(function (
                dot,
                index
            ) {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );

            });


            previousButton.disabled =
                currentIndex === 0;


            nextButton.disabled =
                currentIndex ===
                products.length - 1;

        }


        /* =================================================
           VOTE BUTTON
        ================================================= */

        voteButton.addEventListener(
            "click",
            async function () {

                const product =
                    products[currentIndex];


                const localVoteKey =
                    `momVote_${category}_${product.id}`;


                /*
                 * Prevent accidental double-clicks
                 */

                if (
                    voteButton.dataset.saving ===
                    "true"
                ) {

                    return;

                }


                /*
                 * Local visual protection
                 */

                if (
                    localStorage.getItem(
                        localVoteKey
                    )
                ) {

                    return;

                }


                voteButton.dataset.saving =
                    "true";


                voteButton.disabled =
                    true;


                confirmation.textContent =
                    "Saving your vote…";


                try {

                    await saveVote(
                        category,
                        product
                    );


                    /*
                     * Only mark locally AFTER
                     * Firestore successfully accepts
                     * the vote.
                     */

                    localStorage.setItem(
                        localVoteKey,
                        "true"
                    );


                    voteButton.classList.add(
                        "has-voted"
                    );


                    voteButton.innerHTML =
                        `
                        <span class="recommend-heart">
                            ♥
                        </span>

                        <span>
                            YOU RECOMMENDED THIS
                        </span>
                        `;


                    confirmation.textContent =
                        "💗 Thanks! Your recommendation has been recorded.";


                } catch (error) {

                    console.error(
                        "Vote failed:",
                        error
                    );


                    /*
                     * If the document already exists,
                     * Firestore correctly rejected a
                     * duplicate vote.
                     */

                    if (
                        error.code ===
                        "permission-denied"
                    ) {

                        confirmation.textContent =
                            "You've already voted for this product.";

                        localStorage.setItem(
                            localVoteKey,
                            "true"
                        );


                        voteButton.classList.add(
                            "has-voted"
                        );


                        voteButton.innerHTML =
                            `
                            <span class="recommend-heart">
                                ♥
                            </span>

                            <span>
                                YOU RECOMMENDED THIS
                            </span>
                            `;

                    } else {

                        confirmation.textContent =
                            "Sorry — we couldn't record your vote. Please try again.";

                    }

                }


                voteButton.dataset.saving =
                    "false";


                voteButton.disabled =
                    false;

            }
        );


        /* =================================================
           PREVIOUS
        ================================================= */

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


        /* =================================================
           NEXT
        ================================================= */

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


        updateProduct();

    });

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            /*
             * Start anonymous authentication.
             */

            await initializeAuthentication();


            /*
             * Initialize all product battles.
             */

            initializeBattles();


            console.log(
                "Mom voting system initialized."
            );

        } catch (error) {

            console.error(
                "Voting system failed to initialize:",
                error
            );


            /*
             * Don't leave the page looking broken.
             */

            document
                .querySelectorAll("[data-vote]")
                .forEach(function (button) {

                    button.disabled =
                        true;

                });

        }

    }
);