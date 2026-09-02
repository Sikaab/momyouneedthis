import {
    auth,
    db
} from "./firebase-config.js";

import {
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* =========================================================
   PRODUCT DATA
   ========================================================= */

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


/* =========================================================
   CATEGORY ORDER
   ========================================================= */

const categoryOrder = [
    "baby",
    "toddler",
    "sleep",
    "potty",
    "feeding",
    "under25"
];


/* =========================================================
   STATE
   ========================================================= */

let currentCategory = "baby";

const currentIndexes = {};

const confirmedVotes = new Map();

const voteInProgress = new Set();

let authPromise = null;


/* =========================================================
   INITIAL INDEXES
   ========================================================= */

categoryOrder.forEach((category) => {
    currentIndexes[category] = 0;
});


/* =========================================================
   DOM HELPERS
   ========================================================= */

function getBattleSection(category) {
    return document.querySelector(
        `.product-battle[data-category="${category}"]`
    );
}


function getViewer(category) {
    const section = getBattleSection(category);

    return section?.querySelector(
        "[data-product-viewer]"
    );
}


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

function ensureAnonymousAuth() {

    if (auth.currentUser) {
        return Promise.resolve(auth.currentUser);
    }

    if (authPromise) {
        return authPromise;
    }

    authPromise = new Promise((resolve, reject) => {

        let unsubscribe = null;

        const timeout = setTimeout(() => {

            if (unsubscribe) {
                unsubscribe();
            }

            reject(
                new Error(
                    "Authentication timed out. Please try again."
                )
            );

        }, 15000);


        unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {

                if (user) {

                    clearTimeout(timeout);

                    unsubscribe();

                    resolve(user);

                    return;
                }


                try {

                    await signInAnonymously(auth);

                } catch (error) {

                    clearTimeout(timeout);

                    unsubscribe();

                    reject(error);

                }

            }
        );

    }).finally(() => {

        authPromise = null;

    });

    return authPromise;
}


/* =========================================================
   FIREBASE ERROR MESSAGE
   ========================================================= */

function readableFirebaseError(error) {

    const code = error?.code || "";

    if (
        code.includes("permission-denied")
    ) {
        return "Voting is temporarily unavailable. Please try again.";
    }

    if (
        code.includes("network")
    ) {
        return "Please check your connection and try again.";
    }

    if (
        code.includes("unauthenticated")
    ) {
        return "We couldn't connect your vote. Please try again.";
    }

    return "Something went wrong while saving your vote. Please try again.";
}


/* =========================================================
   LOCAL VOTE KEY
   ========================================================= */

function getLocalVoteKey(
    category,
    productId
) {

    return `momYouNeedThis_vote_${category}_${productId}`;

}


/* =========================================================
   VOTE DOCUMENT
   ========================================================= */

function getVoteDocument(
    uid,
    category,
    productId
) {

    return doc(
        collection(
            db,
            "productVotes"
        ),
        `${uid}_${category}_${productId}`
    );

}


/* =========================================================
   CHECK EXISTING VOTE
   ========================================================= */

async function checkExistingVote(
    category,
    productId
) {

    try {

        const user = await ensureAnonymousAuth();

        const voteRef = getVoteDocument(
            user.uid,
            category,
            productId
        );

        const snapshot = await getDoc(
            voteRef
        );


        if (snapshot.exists()) {

            const data = snapshot.data();

            if (
                data &&
                (
                    data.vote === "yes" ||
                    data.vote === "no"
                )
            ) {

                confirmedVotes.set(
                    `${category}_${productId}`,
                    data.vote
                );


                localStorage.setItem(
                    getLocalVoteKey(
                        category,
                        productId
                    ),
                    data.vote
                );


                return data.vote;
            }

        }


        return null;

    } catch (error) {

        console.error(
            "Error checking existing vote:",
            error
        );

        /*
         * IMPORTANT:
         * A failed read does NOT mean there is no vote.
         *
         * We intentionally return null instead of falsely
         * telling the user that voting is available.
         */

        return null;
    }

}


/* =========================================================
   SAVE VOTE
   ========================================================= */

async function saveVote(
    category,
    productId,
    vote
) {

    const voteKey =
        `${category}_${productId}`;


    if (
        voteInProgress.has(voteKey)
    ) {
        return {
            success: false,
            reason: "in-progress"
        };
    }


    if (
        confirmedVotes.has(voteKey)
    ) {
        return {
            success: false,
            reason: "already-voted"
        };
    }


    voteInProgress.add(voteKey);


    try {

        const user =
            await ensureAnonymousAuth();


        const voteRef =
            getVoteDocument(
                user.uid,
                category,
                productId
            );


        await setDoc(
            voteRef,
            {
                category,
                productId,
                vote,
                uid: user.uid,
                createdAt: new Date().toISOString()
            },
            {
                merge: false
            }
        );


        /*
         * ONLY AFTER FIRESTORE SUCCESS:
         * mark the vote as confirmed.
         */

        confirmedVotes.set(
            voteKey,
            vote
        );


        localStorage.setItem(
            getLocalVoteKey(
                category,
                productId
            ),
            vote
        );


        return {
            success: true,
            vote
        };


    } catch (error) {

        console.error(
            "Error saving vote:",
            error
        );


        return {
            success: false,
            reason: "error",
            message:
                readableFirebaseError(error)
        };


    } finally {

        voteInProgress.delete(
            voteKey
        );

    }

}


/* =========================================================
   PRODUCT HTML
   ========================================================= */

function createProductHTML(
    product,
    position,
    category
) {

    const safeLink =
        product.link &&
        product.link !== "#"
            ? product.link
            : null;


    return `
        <article
            class="battle-product-side"
            data-product-id="${product.id}"
        >

            <div class="product-choice-label">

                <span class="product-choice-tag">
                    PICK ${position}
                </span>

                <span class="product-choice-number">
                    ${position === "A" ? "01" : "02"}
                </span>

            </div>


            <div class="battle-product-image-wrap">

                <img
                    class="battle-product-image"
                    src="${product.image}"
                    alt="${product.name}"
                    loading="eager"
                >

            </div>


            <div class="battle-product-details">

                <div class="battle-product-brand">
                    ${product.brand}
                </div>

                <h3 class="battle-product-name">
                    ${product.name}
                </h3>

                <p class="battle-product-description">
                    ${product.description}
                </p>


                <div class="product-score-box">

                    <div class="product-score-row">

                        <span class="product-score-label">
                            Mom score
                        </span>

                        <strong
                            class="product-score-number"
                        >
                            ${product.score}
                        </strong>

                    </div>


                    <div class="product-score-bar">

                        <div
                            class="product-score-bar-fill"
                            style="width:${product.percentage}%"
                        ></div>

                    </div>

                </div>


                <button
                    type="button"
                    class="product-pick-button"
                    data-pick-product="${product.id}"
                    data-category="${category}"
                >
                    I'D PICK ${product.name.toUpperCase()}
                </button>


                ${
                    safeLink
                        ? `
                            <a
                                href="${safeLink}"
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                class="product-shop-link"
                            >
                                VIEW ON AMAZON →
                            </a>
                        `
                        : ""
                }

            </div>

        </article>
    `;
}


/* =========================================================
   GET OPPONENT
   ========================================================= */

function getBattleProducts(
    category
) {

    const products =
        battles[category] || [];


    if (products.length < 2) {
        return [];
    }


    const currentIndex =
        currentIndexes[category] || 0;


    const currentProduct =
        products[currentIndex];


    const opponentIndex =
        (currentIndex + 1) %
        products.length;


    const opponentProduct =
        products[opponentIndex];


    return [
        currentProduct,
        opponentProduct
    ];

}


/* =========================================================
   RENDER BATTLE
   ========================================================= */

function renderBattle(
    category
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const products =
        getBattleProducts(category);


    if (products.length < 2) {

        viewer.innerHTML = `
            <div class="battle-result visible">
                <div class="battle-result-kicker">
                    COMING SOON
                </div>

                <h3 class="battle-result-title">
                    More products are coming.
                </h3>
            </div>
        `;

        return;
    }


    const productA = products[0];

    const productB = products[1];


    viewer.innerHTML = `

        <div
            class="battle-arena"
            data-battle-arena
        >

            ${createProductHTML(
                productA,
                "A",
                category
            )}


            <div class="battle-vs-column">

                <div class="battle-vs-line"></div>

                <div class="battle-vs-badge">
                    VS
                </div>

            </div>


            ${createProductHTML(
                productB,
                "B",
                category
            )}

        </div>


        <div class="swipe-hint">

            <span class="swipe-hint-arrow">
                ←
            </span>

            Swipe to discover another battle

            <span class="swipe-hint-arrow">
                →
            </span>

        </div>


        <div
            class="battle-result"
            data-battle-result
        ></div>

    `;


    updateBattleMeta(category);

    attachProductButtons(category);

    attachSwipe(category);

}


/* =========================================================
   UPDATE META
   ========================================================= */

function updateBattleMeta(
    category
) {

    const section =
        getBattleSection(category);


    if (!section) {
        return;
    }


    const products =
        battles[category] || [];


    const currentIndex =
        currentIndexes[category] || 0;


    const position =
        section.querySelector(
            "[data-position]"
        );


    if (position) {

        const battleNumber =
            currentIndex + 1;


        position.textContent =
            `BATTLE ${battleNumber} OF ${Math.max(
                1,
                products.length
            )}`;

    }


    const fill =
        section.querySelector(
            "[data-progress-fill]"
        );


    if (fill) {

        const progress =
            products.length > 0
                ? (
                    (
                        currentIndex + 1
                    ) /
                    products.length
                ) *
                  100
                : 0;


        fill.style.width =
            `${Math.min(
                100,
                progress
            )}%`;

    }

}


/* =========================================================
   ATTACH PICK BUTTONS
   ========================================================= */

function attachProductButtons(
    category
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const buttons =
        viewer.querySelectorAll(
            "[data-pick-product]"
        );


    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const productId =
                    button.dataset.pickProduct;


                await handleProductPick(
                    category,
                    productId
                );

            }
        );

    });

}


/* =========================================================
   HANDLE PRODUCT PICK
   ========================================================= */

async function handleProductPick(
    category,
    productId
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const button =
        viewer.querySelector(
            `[data-pick-product="${productId}"]`
        );


    if (!button) {
        return;
    }


    const product =
        battles[category]
            ?.find(
                (item) =>
                    item.id === productId
            );


    if (!product) {
        return;
    }


    const voteKey =
        `${category}_${productId}`;


    /*
     * Check local cache first.
     *
     * This is only treated as a confirmed vote because
     * the cache is written AFTER a successful Firestore write.
     */

    const cachedVote =
        localStorage.getItem(
            getLocalVoteKey(
                category,
                productId
            )
        );


    if (
        cachedVote === "yes" ||
        cachedVote === "no"
    ) {

        confirmedVotes.set(
            voteKey,
            cachedVote
        );

        showAlreadyVoted(
            category,
            productId
        );

        return;
    }


    /*
     * Verify Firestore before allowing the vote.
     */

    button.disabled = true;

    button.textContent =
        "SAVING YOUR PICK…";


    const existingVote =
        await checkExistingVote(
            category,
            productId
        );


    if (existingVote) {

        button.disabled = false;

        button.textContent =
            `I'D PICK ${product.name.toUpperCase()}`;


        showAlreadyVoted(
            category,
            productId
        );

        return;
    }


    /*
     * Existing architecture uses YES for a positive
     * product recommendation.
     *
     * We keep that semantics.
     */

    const result =
        await saveVote(
            category,
            productId,
            "yes"
        );


    if (!result.success) {

        button.disabled = false;

        button.textContent =
            `I'D PICK ${product.name.toUpperCase()}`;


        if (
            result.reason ===
            "already-voted"
        ) {

            showAlreadyVoted(
                category,
                productId
            );

            return;
        }


        showVoteError(
            category,
            result.message ||
                "Your vote couldn't be saved. Please try again."
        );

        return;
    }


    showBattleResult(
        category,
        productId
    );

}


/* =========================================================
   ALREADY VOTED
   ========================================================= */

function showAlreadyVoted(
    category,
    productId
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const product =
        battles[category]
            ?.find(
                (item) =>
                    item.id === productId
            );


    if (!product) {
        return;
    }


    const result =
        viewer.querySelector(
            "[data-battle-result]"
        );


    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="battle-result-kicker">
            💗 YOU ALREADY VOTED
        </div>

        <h3 class="battle-result-title">
            You picked ${product.name}.
        </h3>

        <p class="battle-result-text">
            Ready for another battle?
        </p>

    `;


    result.classList.add(
        "visible"
    );

}


/* =========================================================
   VOTE ERROR
   ========================================================= */

function showVoteError(
    category,
    message
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const result =
        viewer.querySelector(
            "[data-battle-result]"
        );


    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="battle-result-kicker">
            OOPS
        </div>

        <h3 class="battle-result-title">
            Vote not saved
        </h3>

        <p class="battle-result-text">
            ${message}
        </p>

    `;


    result.classList.add(
        "visible"
    );

}


/* =========================================================
   BATTLE RESULT
   ========================================================= */

function showBattleResult(
    category,
    productId
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const selectedProduct =
        battles[category]
            ?.find(
                (item) =>
                    item.id === productId
            );


    if (!selectedProduct) {
        return;
    }


    const result =
        viewer.querySelector(
            "[data-battle-result]"
        );


    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="battle-result-kicker">
            🏆 THE MOM VERDICT
        </div>

        <h3 class="battle-result-title">
            You picked ${selectedProduct.name}.
        </h3>

        <p class="battle-result-text">
            Your vote has been counted.
            Ready to see the next battle?
        </p>

    `;


    result.classList.add(
        "visible"
    );


    const buttons =
        viewer.querySelectorAll(
            "[data-pick-product]"
        );


    buttons.forEach((button) => {

        button.disabled = true;

        const id =
            button.dataset.pickProduct;


        const product =
            battles[category]
                ?.find(
                    (item) =>
                        item.id === id
                );


        if (product) {

            button.textContent =
                id === productId
                    ? "✓ YOUR PICK"
                    : `I'D PICK ${product.name.toUpperCase()}`;

        }

    });


    /*
     * Give the user a moment to see the result,
     * then automatically move forward.
     */

    setTimeout(() => {

        goToNextBattle(
            category
        );

    }, 1100);

}


/* =========================================================
   SWIPE
   ========================================================= */

function attachSwipe(
    category
) {

    const viewer =
        getViewer(category);


    if (!viewer) {
        return;
    }


    const arena =
        viewer.querySelector(
            "[data-battle-arena]"
        );


    if (!arena) {
        return;
    }


    let startX = 0;

    let startY = 0;

    let currentX = 0;

    let dragging = false;


    arena.addEventListener(
        "touchstart",
        (event) => {

            if (
                event.touches.length !== 1
            ) {
                return;
            }


            startX =
                event.touches[0].clientX;


            startY =
                event.touches[0].clientY;


            currentX =
                startX;


            dragging = true;

        },
        {
            passive: true
        }
    );


    arena.addEventListener(
        "touchmove",
        (event) => {

            if (!dragging) {
                return;
            }


            currentX =
                event.touches[0].clientX;


            const deltaX =
                currentX - startX;


            const deltaY =
                event.touches[0].clientY -
                startY;


            if (
                Math.abs(deltaX) >
                Math.abs(deltaY)
            ) {

                event.preventDefault();

            }


            if (
                Math.abs(deltaX) > 10
            ) {

                arena.style.transform =
                    `translateX(${deltaX * 0.15}px) rotate(${deltaX * 0.01}deg)`;

                arena.style.opacity =
                    `${Math.max(
                        0.65,
                        1 -
                            Math.abs(deltaX) /
                                800
                    )}`;

            }

        },
        {
            passive: false
        }
    );


    arena.addEventListener(
        "touchend",
        () => {

            if (!dragging) {
                return;
            }


            dragging = false;


            const deltaX =
                currentX - startX;


            arena.style.transform = "";

            arena.style.opacity = "";


            if (
                Math.abs(deltaX) >= 70
            ) {

                goToNextBattle(
                    category
                );

            }

        }
    );

}


/* =========================================================
   NEXT BATTLE
   ========================================================= */

function goToNextBattle(
    category
) {

    const products =
        battles[category] || [];


    if (!products.length) {
        return;
    }


    const currentIndex =
        currentIndexes[category] || 0;


    /*
     * If there are more products inside the category,
     * move to the next product pairing.
     */

    if (
        currentIndex <
        products.length - 1
    ) {

        currentIndexes[category] =
            currentIndex + 1;


        renderBattle(
            category
        );


        return;
    }


    /*
     * Current category is finished.
     * Move directly to the next category.
     */

    const currentCategoryIndex =
        categoryOrder.indexOf(
            category
        );


    const nextCategoryIndex =
        (
            currentCategoryIndex + 1
        ) %
        categoryOrder.length;


    const nextCategory =
        categoryOrder[
            nextCategoryIndex
        ];


    currentIndexes[nextCategory] = 0;


    showCategory(
        nextCategory
    );

}


/* =========================================================
   SHOW CATEGORY
   ========================================================= */

function showCategory(
    category
) {

    if (
        !categoryOrder.includes(
            category
        )
    ) {
        return;
    }


    currentCategory =
        category;


    document
        .querySelectorAll(
            ".product-battle"
        )
        .forEach((section) => {

            const isActive =
                section.dataset.category ===
                category;


            section.classList.toggle(
                "active-category",
                isActive
            );

        });


    document
        .querySelectorAll(
            "[data-category-link]"
        )
        .forEach((link) => {

            link.classList.toggle(
                "active",
                link.dataset.categoryLink ===
                    category
            );

        });


    renderBattle(
        category
    );


    /*
     * Scroll only to the battle area.
     * The user does not need to hunt for the
     * next category further down the page.
     */

    const battleSection =
        getBattleSection(category);


    if (battleSection) {

        const top =
            battleSection.getBoundingClientRect().top +
            window.scrollY -
            85;


        window.scrollTo({
            top,
            behavior: "smooth"
        });

    }

}


/* =========================================================
   CATEGORY NAV
   ========================================================= */

function setupCategoryNavigation() {

    document
        .querySelectorAll(
            "[data-category-link]"
        )
        .forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    const category =
                        link.dataset.categoryLink;


                    showCategory(
                        category
                    );

                }
            );

        });

}


/* =========================================================
   DISCOVERY FILTERS
   ========================================================= */

function setupDiscoveryFilters() {

    document
        .querySelectorAll(
            "[data-filter]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const filter =
                        button.dataset.filter;


                    const matchingCategory =
                        categoryOrder.find(
                            (category) => {

                                const section =
                                    getBattleSection(
                                        category
                                    );


                                const tags =
                                    section
                                        ?.dataset
                                        .filterTags
                                        ?.split(
                                            " "
                                        ) || [];


                                return tags.includes(
                                    filter
                                );

                            }
                        );


                    if (
                        matchingCategory
                    ) {

                        showCategory(
                            matchingCategory
                        );

                    }

                }
            );

        });

}


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

function setupKeyboardNavigation() {

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "ArrowLeft"
            ) {

                goToNextBattle(
                    currentCategory
                );

            }

        }
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initialize() {

    setupCategoryNavigation();

    setupDiscoveryFilters();

    setupKeyboardNavigation();

    showCategory(
        "baby"
    );

}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}