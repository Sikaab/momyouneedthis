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
 * Local storage:
 * - Remembers whether this browser has already voted
 * - Remembers the selected product for each battle
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
   FIREBASE AUTH STATE
   ============================================================ */

let auth = null;
let currentUser = null;
let authenticationReady = false;
let authenticationPromise = null;

/* ============================================================
   PRODUCT DATA
   ============================================================ */

let battles = {};

/* ============================================================
   APPLICATION STATE
   ============================================================ */

const voteInProgress = new Set();

const confirmedVotes = new Map();

const confirmedBattleChoices = new Map();

/* ============================================================
   LOAD JSON
   ============================================================ */

async function loadBattleData() {
    try {
        const response = await fetch(
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

        const data = await response.json();

        if (
            !data ||
            !data.battles ||
            typeof data.battles !== "object"
        ) {
            throw new Error(
                "mom-battles.json does not contain a valid battles object."
            );
        }

        battles = data.battles;

        console.log(
            "Mom Battles data loaded successfully.",
            battles
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
   BATTLE HELPERS
   ============================================================ */

function normalizeId(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}

function getBattleData(category) {
    if (!category) {
        return null;
    }

    return battles[category] || null;
}

function getBattleProducts(category) {
    const battle = getBattleData(category);

    if (
        !battle ||
        !Array.isArray(battle.products) ||
        battle.products.length < 2
    ) {
        return [];
    }

    return battle.products
        .slice(0, 2)
        .map(product => ({
            ...product,
            id: normalizeId(product.id)
        }));
}

/* ============================================================
   PRODUCT PERCENTAGE
   ============================================================ */

function getProductPercentage(product) {
    if (!product) {
        return 0;
    }

    const percentage =
        Number(product.percentage);

    if (!Number.isFinite(percentage)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(
            100,
            percentage
        )
    );
}

/* ============================================================
   BATTLE / VOTE KEYS
   ============================================================ */

function getBattleKey(
    category,
    productId
) {
    return (
        `${normalizeId(category)}_${normalizeId(productId)}`
    );
}

function getVoteDocumentId(
    category,
    productId,
    uid
) {
    const safeCategory =
        normalizeId(category)
            .replace(/\//g, "_");

    const safeProductId =
        normalizeId(productId)
            .replace(/\//g, "_");

    const safeUid =
        normalizeId(uid)
            .replace(/\//g, "_");

    return (
        `${safeUid}_${safeCategory}_${safeProductId}`
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

                let unsubscribe =
                    null;

                const finishSuccess =
                    user => {
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
                            "Firebase anonymous user ready:",
                            user.uid
                        );

                        resolve(
                            user
                        );
                    };

                const finishError =
                    error => {
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
                        async user => {
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
                                finishError(
                                    error
                                );
                            }
                        },
                        error => {
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
        `momYouNeedThis_vote_${normalizeId(category)}_${normalizeId(productId)}`
    );
}

function getLocalBattleChoiceKey(
    category
) {
    return (
        `momYouNeedThis_battle_${normalizeId(category)}`
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
            normalizeId(productId)
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

        return productId
            ? normalizeId(productId)
            : null;
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
    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);
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
        src || "";

    imageElement.alt =
        alt || "";
}

function getProductSelector(
    position,
    attribute
) {
    return (
        `[data-${attribute}-${position}]`
    );
}

/* ============================================================
   UPDATE STATIC BATTLE CONTENT
   ============================================================ */

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

    if (
        battleData.filterTags !==
        undefined
    ) {
        battle.dataset.filterTags =
            battleData.filterTags || "";
    }

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
   LEADER STATE
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

    if (
        !contender1 ||
        !contender2
    ) {
        return;
    }

    /*
     * Keep the existing HTML leader badges.
     * We only show/hide them.
     *
     * IMPORTANT:
     * We do NOT remove them and we do NOT
     * modify the .versus element.
     */

    const badge1 =
        contender1.querySelector(
            ".battle-leader-badge"
        );

    const badge2 =
        contender2.querySelector(
            ".battle-leader-badge"
        );

    contender1.classList.remove(
        "leading",
        "trailing"
    );

    contender2.classList.remove(
        "leading",
        "trailing"
    );

    if (badge1) {
        badge1.hidden =
            true;
    }

    if (badge2) {
        badge2.hidden =
            true;
    }

    if (
        percentage1 ===
        percentage2
    ) {
        return;
    }

    if (
        percentage1 >
        percentage2
    ) {
        contender1.classList.add(
            "leading"
        );

        contender2.classList.add(
            "trailing"
        );

        if (badge1) {
            badge1.hidden =
                false;
        }
    } else {
        contender1.classList.add(
            "trailing"
        );

        contender2.classList.add(
            "leading"
        );

        if (badge2) {
            badge2.hidden =
                false;
        }
    }
}

/* ============================================================
   DISPLAY PRODUCT CARD
   ============================================================ */

function updateProductCard(
    battle,
    product,
    position
) {
    if (
        !battle ||
        !product
    ) {
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
        product.alt ||
            product.name
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
        product.name || ""
    );

    setText(
        brand,
        product.brand || ""
    );

    setText(
        description,
        product.description || ""
    );

    setText(
        score,
        product.score ?? 0
    );

    if (link) {
        const productLink =
            product.link || "#";

        link.href =
            productLink;

        if (
            productLink !== "#"
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
   PERCENTAGES
   ============================================================ */

function updateBattlePercentages(
    battle,
    products
) {
    if (
        !battle ||
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

    const normalizedSelectedId =
        normalizeId(
            selectedProductId
        );

    const selectedIndex =
        products.findIndex(
            product =>
                normalizeId(
                    product.id
                ) ===
                normalizedSelectedId
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
        products[
            selectedIndex === 0
                ? 1
                : 0
        ];

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
        "Oops!"
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
   SAVE VOTE TO FIRESTORE
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

    const normalizedCategory =
        normalizeId(
            category
        );

    const normalizedProductId =
        normalizeId(
            product.id
        );

    const key =
        getBattleKey(
            normalizedCategory,
            normalizedProductId
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
                normalizedCategory,
                normalizedProductId,
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
                    normalizedCategory,

                productId:
                    normalizedProductId,

                productName:
                    product.name || "",

                productBrand:
                    product.brand || "",

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
            normalizedCategory,
            normalizedProductId,
            vote
        );

        console.log(
            "Vote successfully saved:",
            {
                uid:
                    currentUser.uid,

                category:
                    normalizedCategory,

                productId:
                    normalizedProductId,

                vote:
                    vote
            }
        );

        return true;
    } catch (error) {
        /*
         * Keep the complete technical error
         * in the developer console.
         *
         * NEVER expose Firebase details
         * to the visitor.
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
   USER-FACING FIREBASE ERROR
   ============================================================ */

function getReadableFirebaseError(
    error
) {
    /*
     * Technical Firebase information stays
     * in the browser console only.
     */

    console.error(
        "Full Firebase vote error:",
        error
    );

    return (
        "Oops! We weren’t able to register your vote " +
        "for technical reasons. Please try again later."
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

    if (!category) {
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
            `Battle "${category}" does not have two products.`
        );

        return;
    }

    if (
        productIndex !== 0 &&
        productIndex !== 1
    ) {
        return;
    }

    const product =
        products[
            productIndex
        ];

    if (!product) {
        return;
    }

    if (
        confirmedBattleChoices.has(
            category
        )
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
                    normalizeId(
                        item.id
                    ) ===
                    normalizeId(
                        localBattleChoice
                    )
            );

        if (matchingProduct) {
            confirmedBattleChoices.set(
                category,
                normalizeId(
                    matchingProduct.id
                )
            );

            showVoteUI(
                battle,
                matchingProduct.id
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
            "Oops! We weren’t able to register your vote for technical reasons. Please try again later."
        );

        return;
    }

    if (!currentUser) {
        showVoteError(
            battle,
            "Oops! We weren’t able to register your vote for technical reasons. Please try again later."
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

        if (!saved) {
            return;
        }

        confirmedBattleChoices.set(
            category,
            normalizeId(
                product.id
            )
        );

        saveBattleChoiceLocally(
            category,
            product.id
        );

        showVoteUI(
            battle,
            product.id
        );
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
   LOAD EXISTING LOCAL BATTLE CHOICE
   ============================================================ */

function loadExistingBattleChoice(
    battle
) {
    if (!battle) {
        return null;
    }

    const category =
        battle.dataset.category;

    if (!category) {
        return null;
    }

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
                normalizeId(
                    product.id
                ) ===
                normalizeId(
                    localChoice
                )
        );

    if (!matchingProduct) {
        return null;
    }

    const productId =
        normalizeId(
            matchingProduct.id
        );

    confirmedBattleChoices.set(
        category,
        productId
    );

    const localVote =
        getConfirmedLocalVote(
            category,
            productId
        );

    if (localVote) {
        confirmedVotes.set(
            getBattleKey(
                category,
                productId
            ),
            localVote
        );
    }

    return productId;
}

/* ============================================================
   INITIALIZE ONE BATTLE
   ============================================================ */

function initializeBattle(
    battle
) {
    if (!battle) {
        return;
    }

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

    updateBattleStaticContent(
        battle,
        battleData
    );

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

    updateBattlePercentages(
        battle,
        products
    );

    resetVoteUI(
        battle
    );

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
        "MomYouNeedThis Mom Battles initializing..."
    );

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

    battlesOnPage.forEach(
        battle => {
            initializeBattle(
                battle
            );
        }
    );

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