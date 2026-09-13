/*
 * ============================================================
 * MOMYOU NEED THIS — MOM BATTLES
 * ============================================================
 *
 * Product/battle content:
 *     mom-battles.json
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
 * Existing votes:
 *     Loaded from localStorage only.
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* ============================================================
   FIREBASE AUTH
   ============================================================ */

let auth = null;
let currentUser = null;
let authenticationReady = false;
let authenticationPromise = null;

/* ============================================================
   PRODUCT DATA
   ============================================================ */

let battles = {};

/*
 * Load battle/product data from the external JSON file.
 *
 * Product information is intentionally kept outside
 * JavaScript so it can be updated without touching
 * the application logic.
 */
async function loadBattleData() {
    try {
        const response =
            await fetch(
                "mom-battles.json",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `Could not load mom-battles.json (${response.status}).`
            );
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.battles ||
            typeof data.battles !== "object"
        ) {
            throw new Error(
                "mom-battles.json does not contain a valid battles object."
            );
        }

        battles =
            data.battles;

        console.log(
            "Mom Battles data loaded successfully."
        );

        return battles;
    } catch (error) {
        console.error(
            "Mom Battles JSON could not be loaded:",
            error
        );

        throw error;
    }
}

/* ============================================================
   FIREBASE INITIALIZATION
   ============================================================ */

try {
    auth =
        getAuth(app);

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
   BATTLE HELPERS
   ============================================================ */

function getBattleData(
    category
) {
    return battles[category] || null;
}

function getBattleProducts(
    category
) {
    const battle =
        getBattleData(
            category
        );

    if (
        !battle ||
        !Array.isArray(
            battle.products
        ) ||
        battle.products.length < 2
    ) {
        return [];
    }

    return battle.products.slice(
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

                            if (user) {
                                finishSuccess(
                                    user
                                );

                                return;
                            }

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

function updateBattleStaticContent(
    battle,
    battleData
) {
    if (
        !battle ||
        !battleData
    ) {
        return;
    }

    battle.dataset.filterTags =
        battleData.filterTags || "";

    setText(
        battle.querySelector(
            ".battle-eyebrow"
        ),
        battleData.eyebrow
    );

    setText(
        battle.querySelector(
            ".battle-heading h2"
        ),
        battleData.title
    );

    setText(
        battle.querySelector(
            ".battle-heading p"
        ),
        battleData.intro
    );

    setText(
        battle.querySelector(
            ".battle-card-header span"
        ),
        battleData.headerLeft
    );

    setText(
        battle.querySelector(
            ".battle-card-header strong"
        ),
        battleData.headerRight
    );

    setText(
        battle.querySelector(
            "[data-result-title]"
        ),
        battleData.resultTitle
    );

    setText(
        battle.querySelector(
            "[data-result-text]"
        ),
        battleData.resultText
    );

    setText(
        battle.querySelector(
            ".battle-footer"
        ),
        battleData.footer
    );
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

    [
        contender1,
        contender2
    ].forEach(
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
     * Remove the dynamically generated leader badges.
     *
     * The original badge in the HTML is only a fallback.
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

    if (
        percentage1 ===
        percentage2
    ) {
        return;
    }

    const product1IsLeading =
        percentage1 >
        percentage2;

    const leadingContender =
        product1IsLeading
            ? contender1
            : contender2;

    const trailingContender =
        product1IsLeading
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

    const badge =
        battle.querySelector(
            getProductSelector(
                position,
                "badge"
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
        product.alt || product.name
    );

    setText(
        badge,
        product.badge || ""
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

    const percentage1 =
        getProductPercentage(
            products[0]
        );

    const percentage2 =
        getProductPercentage(
            products[1]
        );

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
    if (!battle) {
        return;
    }

    const result =
        battle.querySelector(
            "[data-result]"
        );

    if (result) {
        result.classList.remove(
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

                button.classList.remove(
                    "loading"
                );

                button.textContent =
                    "💗 PICK THIS ONE";

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );
            }
        );

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

    battle.classList.remove(
        "vote-complete"
    );
}

/* ============================================================
   SHOW SUCCESSFUL VOTE
   ============================================================ */

function showVoteUI(
    battle,
    selectedProductId
) {
    if (!battle) {
        return;
    }

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

    battle
        .querySelectorAll(
            "[data-vote]"
        )
        .forEach(
            button => {
                const productNumber =
                    Number(
                        button.dataset.product
                    );

                button.disabled =
                    true;

                button.classList.remove(
                    "loading"
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
                    button.classList.remove(
                        "selected"
                    );

                    button.textContent =
                        "PICK THIS ONE";

                    button.setAttribute(
                        "aria-pressed",
                        "false"
                    );
                }
            }
        );

    const selectedCard =
        battle.querySelector(
            `.contender[data-product="${selectedIndex + 1}"]`
        );

    if (selectedCard) {
        selectedCard.classList.add(
            "selected"
        );
    }

    battle.classList.add(
        "vote-complete"
    );

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
    if (!battle) {
        return;
    }

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

    battle.classList.remove(
        "vote-complete"
    );
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
    if (!battle) {
        return;
    }

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

    const existingBattleChoice =
        confirmedBattleChoices.get(
            category
        );

    if (
        existingBattleChoice
    ) {
        return;
    }

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

    try {
        const saved =
            await saveVote(
                category,
                product,
                vote
            );

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

function loadExistingBattleChoice(
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

    const localChoice =
        getLocalBattleChoice(
            category
        );

    if (!localChoice) {
        return null;
    }

    const matchingProduct =
        products.find(
            product =>
                product.id ===
                localChoice
        );

    if (!matchingProduct) {
        return null;
    }

    confirmedBattleChoices.set(
        category,
        localChoice
    );

    return localChoice;
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

    const battleData =
        getBattleData(
            category
        );

    if (!battleData) {
        console.warn(
            `No JSON data found for battle "${category}".`
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
     * Populate editable battle content
     * from JSON.
     */
    updateBattleStaticContent(
        battle,
        battleData
    );

    /*
     * Give each contender an explicit
     * product number.
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
     * Vote buttons.
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
                        const productNumber =
                            Number(
                                button.dataset.product
                            );

                        if (
                            productNumber !==
                                1 &&
                            productNumber !==
                                2
                        ) {
                            return;
                        }

                        handleBattleVote(
                            battle,
                            productNumber - 1
                        );
                    }
                );
            }
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
     * Product data must load before battles
     * are initialized.
     */
    try {
        await loadBattleData();
    } catch (error) {
        console.error(
            "Mom Battles page could not initialize:",
            error
        );

        return;
    }

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
     * Firebase does not block product rendering.
     */
    battlesOnPage.forEach(
        battle => {
            initializeBattle(
                battle
            );
        }
    );

    /*
     * Load existing local choices immediately.
     */
    battlesOnPage.forEach(
        battle => {
            const existingChoice =
                loadExistingBattleChoice(
                    battle
                );

            if (existingChoice) {
                showVoteUI(
                    battle,
                    existingChoice
                );
            }
        }
    );

    /*
     * Firebase authentication still starts
     * in the background.
     */
    try {
        const user =
            await startAnonymousAuthentication();

        console.log(
            "Firebase authentication ready:",
            user.uid
        );
    } catch (error) {
        console.error(
            "Firebase authentication could not start:",
            error
        );
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