/*
 * ============================================================
 * MOMYOU NEED THIS — MOM BATTLES
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
const battleIndexes = {};
const voteInProgress = new Set();
const confirmedVotes = new Map();
const confirmedBattleChoices = new Map();
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
function getBattleProducts(
    category
) {
    const products =
        battles[category];
    if (
        !products ||
        products.length < 2
    ) {
        return [];
    }
    return products.slice(
        0,
        2
    );
}
/*
 * Safely get a product percentage.
 */
function getProductPercentage(
    product
) {
    if (!product) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(
            100,
            Number(
                product.percentage
            ) || 0
        )
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
                             * Create anonymous user.
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
function getLocalBattleChoiceKey(
    category
) {
    return (
        `momYouNeedThis_battle_${category}`
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
function saveBattleChoiceLocally(
    category,
    productId
) {
    try {
        localStorage.setItem(
            getLocalBattleChoiceKey(
                category
            ),
            productId
        );
    } catch (error) {
        console.warn(
            "Could not save local battle choice:",
            error
        );
    }
}
function getLocalBattleChoice(
    category
) {
    try {
        const productId =
            localStorage.getItem(
                getLocalBattleChoiceKey(
                    category
                )
            );
        return productId || null;
    } catch (error) {
        console.warn(
            "Could not read local battle choice:",
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
function getProductSelector(
    position,
    attribute
) {
    return `[data-${attribute}-${position}]`;
}
/* ============================================================
   LEADER / WINNER STATE
   ============================================================ */
function updateBattleLeaderState(
    battle,
    products
) {
    if (
        !battle ||
        products.length < 2
    ) {
        return;
    }
    const product1 =
        products[0];
    const product2 =
        products[1];
    const percentage1 =
        getProductPercentage(
            product1
        );
    const percentage2 =
        getProductPercentage(
            product2
        );
    const contender1 =
        battle.querySelector(
            '.contender[data-product="1"]'
        );
    const contender2 =
        battle.querySelector(
            '.contender[data-product="2"]'
        );
    /*
     * Remove old states.
     */
    [
        contender1,
        contender2
    ]
        .forEach(
            contender => {
                if (!contender) {
                    return;
                }
                contender.classList.remove(
                    "leading"
                );
                contender.classList.remove(
                    "trailing"
                );
                contender.classList.remove(
                    "winner"
                );
            }
        );
    /*
     * Remove existing leader badges.
     */
    battle
        .querySelectorAll(
            ".battle-leader-badge"
        )
        .forEach(
            badge => {
                badge.remove();
            }
        );
    /*
     * Determine the leader.
     *
     * Equal percentages = no leader.
     */
    if (
        percentage1 ===
        percentage2
    ) {
        return;
    }
    const leadingContender =
        percentage1 >
        percentage2
            ? contender1
            : contender2;
    const trailingContender =
        percentage1 >
        percentage2
            ? contender2
            : contender1;
    if (leadingContender) {
        leadingContender.classList.add(
            "leading"
        );
    }
    if (trailingContender) {
        trailingContender.classList.add(
            "trailing"
        );
    }
    /*
     * Add a small dynamic badge.
     *
     * CSS controls the actual visual treatment.
     */
    if (leadingContender) {
        const badge =
            document.createElement(
                "span"
            );
        badge.className =
            "battle-leader-badge";
        badge.textContent =
            "🔥 LEADING";
        const image =
            leadingContender.querySelector(
                ".contender-image"
            );
        if (image) {
            image.appendChild(
                badge
            );
        }
    }
}
/* ============================================================
   DISPLAY BOTH PRODUCTS
   ============================================================ */
function updateProductCard(
    battle,
    product,
    position
) {
    if (!product) {
        return;
    }
    const image =
        battle.querySelector(
            getProductSelector(
                position,
                "image"
            )
        );
    const label =
        battle.querySelector(
            getProductSelector(
                position,
                "label"
            )
        );
    const name =
        battle.querySelector(
            getProductSelector(
                position,
                "name"
            )
        );
    const brand =
        battle.querySelector(
            getProductSelector(
                position,
                "brand"
            )
        );
    const description =
        battle.querySelector(
            getProductSelector(
                position,
                "description"
            )
        );
    const score =
        battle.querySelector(
            getProductSelector(
                position,
                "score"
            )
        );
    const link =
        battle.querySelector(
            getProductSelector(
                position,
                "link"
            )
        );
    setImage(
        image,
        product.image,
        product.name
    );
    setText(
        label,
        `PRODUCT ${position}`
    );
    setText(
        name,
        product.name
    );
    setText(
        brand,
        product.brand
    );
    setText(
        description,
        product.description
    );
    setText(
        score,
        product.score
    );
    if (link) {
        link.href =
            product.link || "#";
        /*
         * Only real product links open in a new tab.
         */
        if (
            product.link &&
            product.link !== "#"
        ) {
            link.target =
                "_blank";
            link.rel =
                "noopener noreferrer nofollow sponsored";
        } else {
            link.removeAttribute(
                "target"
            );
            link.removeAttribute(
                "rel"
            );
        }
    }
}
/* ============================================================
   RESULT PERCENTAGES
   ============================================================ */
function updateBattlePercentages(
    battle,
    products
) {
    if (
        products.length < 2
    ) {
        return;
    }
    const product1 =
        products[0];
    const product2 =
        products[1];
    const percentage1 =
        getProductPercentage(
            product1
        );
    const percentage2 =
        getProductPercentage(
            product2
        );
    /*
     * These are intentionally the percentages
     * stored in the battle data.
     *
     * They are not recalculated from this user's vote.
     */
    setText(
        battle.querySelector(
            "[data-yes-percentage]"
        ),
        `${percentage1}%`
    );
    setText(
        battle.querySelector(
            "[data-no-percentage]"
        ),
        `${percentage2}%`
    );
    /*
     * Optional percentage labels if added to HTML.
     */
    setText(
        battle.querySelector(
            "[data-percentage-1]"
        ),
        `${percentage1}%`
    );
    setText(
        battle.querySelector(
            "[data-percentage-2]"
        ),
        `${percentage2}%`
    );
    /*
     * Update the visual leader.
     */
    updateBattleLeaderState(
        battle,
        products
    );
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
    if (result) {
        result.classList.remove(
            "visible"
        );
    }
    /*
     * Reset both vote buttons.
     */
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
                button.classList.remove(
                    "loading"
                );
                const productNumber =
                    button.dataset.product;
                button.textContent =
                    "💗 PICK THIS ONE";
                /*
                 * Keep aria state clean.
                 */
                button.setAttribute(
                    "aria-pressed",
                    "false"
                );
                if (
                    productNumber
                ) {
                    button.dataset.product =
                        productNumber;
                }
            }
        );
    /*
     * Reset contender selection.
     *
     * Do not remove leading/trailing state here.
     */
    battle
        .querySelectorAll(
            ".contender"
        )
        .forEach(
            contender => {
                contender.classList.remove(
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
    selectedProductId
) {
    const category =
        battle.dataset.category;
    const products =
        getBattleProducts(
            category
        );
    if (
        products.length < 2
    ) {
        return;
    }
    const selectedIndex =
        products.findIndex(
            product =>
                product.id ===
                selectedProductId
        );
    if (
        selectedIndex === -1
    ) {
        return;
    }
    const selectedProduct =
        products[
            selectedIndex
        ];
    const otherProduct =
        products.find(
            product =>
                product.id !==
                selectedProductId
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
    const yourPosition =
        battle.querySelector(
            "[data-your-position]"
        );
    /*
     * Disable both buttons.
     */
    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {
                button.disabled =
                    true;
                button.classList.remove(
                    "loading"
                );
                const productNumber =
                    Number(
                        button.dataset.product
                    );
                if (
                    productNumber ===
                    selectedIndex + 1
                ) {
                    button.classList.add(
                        "selected"
                    );
                    button.textContent =
                        "💗 YOUR PICK";
                    button.setAttribute(
                        "aria-pressed",
                        "true"
                    );
                } else {
                    button.textContent =
                        "PICK THIS ONE";
                    button.setAttribute(
                        "aria-pressed",
                        "false"
                    );
                }
            }
        );
    /*
     * IMPORTANT:
     *
     * Select the contender by data-product.
     * Do NOT use nth-of-type().
     */
    const selectedCard =
        battle.querySelector(
            `.contender[data-product="${selectedIndex + 1}"]`
        );
    if (selectedCard) {
        selectedCard.classList.add(
            "selected"
        );
    }
    /*
     * Mark the battle as having a completed vote.
     */
    battle.classList.add(
        "vote-complete"
    );
    /*
     * Show result panel.
     */
    if (result) {
        result.classList.add(
            "visible"
        );
    }
    setText(
        resultTitle,
        `You picked ${selectedProduct.name}!`
    );
    setText(
        resultText,
        "Here's how moms are voting."
    );
    /*
     * Compare the stored battle percentages.
     *
     * IMPORTANT:
     * These are the percentages already supplied
     * in the product data. The user's individual vote
     * does NOT artificially change them.
     */
    const selectedPercentage =
        getProductPercentage(
            selectedProduct
        );
    const otherPercentage =
        getProductPercentage(
            otherProduct
        );
    if (yourPosition) {
        if (
            selectedPercentage >
            otherPercentage
        ) {
            yourPosition.textContent =
                "You're with the majority. 🙌";
        } else if (
            selectedPercentage <
            otherPercentage
        ) {
            yourPosition.textContent =
                "You're with the minority. 👀";
        } else {
            yourPosition.textContent =
                "It's a tie. Moms are split! 🤷🏻‍♀️";
        }
    }
    /*
     * Re-apply leader state after selection.
     */
    updateBattleLeaderState(
        battle,
        products
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
    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {
                button.disabled =
                    false;
                button.classList.remove(
                    "loading"
                );
                button.classList.remove(
                    "selected"
                );
                button.textContent =
                    "💗 PICK THIS ONE";
                button.setAttribute(
                    "aria-pressed",
                    "false"
                );
            }
        );
    battle.classList.remove(
        "vote-complete"
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
        return confirmedVotes.get(
            key
        );
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
         * Verify the document belongs
         * to the current anonymous user.
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
         * Validate vote.
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
         * A failed READ is never treated
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
            "No product was selected."
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
     * Prevent duplicate simultaneous writes.
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
         * before the UI reports success.
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
         * Nothing is cached when Firestore
         * rejects the write.
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
   HANDLE BATTLE VOTE
   ============================================================ */
async function handleBattleVote(
    battle,
    productIndex
) {
    const category =
        battle.dataset.category;
    const products =
        getBattleProducts(
            category
        );
    if (
        products.length < 2
    ) {
        console.warn(
            `Battle "${category}" does not have two products.`
        );
        return;
    }
    const product =
        products[
            productIndex
        ];
    if (!product) {
        return;
    }
    /*
     * One choice per battle.
     */
    const existingBattleChoice =
        confirmedBattleChoices.get(
            category
        );
    if (
        existingBattleChoice
    ) {
        return;
    }
    /*
     * Also check localStorage.
     */
    const localBattleChoice =
        getLocalBattleChoice(
            category
        );
    if (localBattleChoice) {
        const matchingProduct =
            products.find(
                item =>
                    item.id ===
                    localBattleChoice
            );
        /*
         * Only trust the local choice if
         * it still belongs to this battle.
         */
        if (matchingProduct) {
            confirmedBattleChoices.set(
                category,
                localBattleChoice
            );
            showVoteUI(
                battle,
                localBattleChoice
            );
            return;
        }
    }
    /*
     * The selected product is represented
     * by a YES vote.
     */
    const vote =
        "yes";
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
     * Check whether this exact product
     * already has a confirmed vote.
     */
    const existingProductVote =
        await loadExistingVote(
            category,
            product
        );
    if (
        existingProductVote ===
        "yes"
    ) {
        confirmedBattleChoices.set(
            category,
            product.id
        );
        saveBattleChoiceLocally(
            category,
            product.id
        );
        showVoteUI(
            battle,
            product.id
        );
        return;
    }
    /*
     * Disable ONLY the clicked button while
     * Firestore is saving.
     */
    const selectedButton =
        battle.querySelector(
            `[data-vote][data-product="${productIndex + 1}"]`
        );
    if (selectedButton) {
        selectedButton.disabled =
            true;
        selectedButton.classList.add(
            "loading"
        );
        selectedButton.textContent =
            "SAVING YOUR PICK…";
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
         * ONLY after Firestore confirms the write
         * do we permanently record the battle choice.
         */
        if (saved) {
            confirmedBattleChoices.set(
                category,
                product.id
            );
            saveBattleChoiceLocally(
                category,
                product.id
            );
            showVoteUI(
                battle,
                product.id
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
   LOAD EXISTING BATTLE CHOICE
   ============================================================ */
async function loadExistingBattleChoice(
    battle
) {
    const category =
        battle.dataset.category;
    const products =
        getBattleProducts(
            category
        );
    if (
        products.length < 2
    ) {
        return null;
    }
    /*
     * Check localStorage first.
     */
    const localChoice =
        getLocalBattleChoice(
            category
        );
    if (localChoice) {
        const matchingProduct =
            products.find(
                product =>
                    product.id ===
                    localChoice
            );
        if (matchingProduct) {
            confirmedBattleChoices.set(
                category,
                localChoice
            );
            return localChoice;
        }
    }
    /*
     * If there is no local choice,
     * check Firestore for YES votes.
     */
    if (!currentUser || !db) {
        return null;
    }
    for (
        const product of products
    ) {
        try {
            const existingVote =
                await loadExistingVote(
                    category,
                    product
                );
            if (
                existingVote ===
                "yes"
            ) {
                confirmedBattleChoices.set(
                    category,
                    product.id
                );
                saveBattleChoiceLocally(
                    category,
                    product.id
                );
                return product.id;
            }
        } catch (error) {
            console.warn(
                "Could not check existing battle vote:",
                error
            );
        }
    }
    return null;
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
    const products =
        getBattleProducts(
            category
        );
    if (
        products.length < 2
    ) {
        console.warn(
            `Battle "${category}" needs at least two products.`
        );
        return;
    }
    battleIndexes[category] =
        0;
    /*
     * Give each contender an explicit product number.
     *
     * This makes the JS independent of DOM order
     * and fixes the old nth-of-type issue.
     */
    const contenders =
        battle.querySelectorAll(
            ".contender"
        );
    contenders.forEach(
        (contender, index) => {
            if (
                index < 2
            ) {
                contender.dataset.product =
                    String(
                        index + 1
                    );
            }
        }
    );
    /*
     * Display both products.
     */
    updateProductCard(
        battle,
        products[0],
        1
    );
    updateProductCard(
        battle,
        products[1],
        2
    );
    /*
     * Update percentages and leader state.
     */
    updateBattlePercentages(
        battle,
        products
    );
    /*
     * Reset voting UI.
     */
    resetVoteUI(
        battle
    );
    /*
     * PRODUCT 1 VOTE
     */
    const product1Button =
        battle.querySelector(
            '[data-vote][data-product="1"]'
        );
    if (product1Button) {
        product1Button.addEventListener(
            "click",
            () => {
                handleBattleVote(
                    battle,
                    0
                );
            }
        );
    }
    /*
     * PRODUCT 2 VOTE
     */
    const product2Button =
        battle.querySelector(
            '[data-vote][data-product="2"]'
        );
    if (product2Button) {
        product2Button.addEventListener(
            "click",
            () => {
                handleBattleVote(
                    battle,
                    1
                );
            }
        );
    }
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
     * Render every battle immediately.
     *
     * Firebase does not block the page.
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
         * Check existing votes for every battle.
         */
        for (
            const battle of battlesOnPage
        ) {
            const existingChoice =
                await loadExistingBattleChoice(
                    battle
                );
            if (existingChoice) {
                showVoteUI(
                    battle,
                    existingChoice
                );
            }
        }
    } catch (error) {
        console.error(
            "Firebase authentication could not start:",
            error
        );
        /*
         * The page still works visually.
         *
         * If a user attempts to vote,
         * the error is shown properly.
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