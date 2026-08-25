/* =====================================
   HOLY GRAIL PRODUCT SUBMISSION
   MomYouNeedThis

   Firebase:
   - Anonymous Authentication
   - Firestore
   - Collection:
       holyGrailRecommendations

   IMPORTANT:
   Firebase errors are logged to the console
   for debugging but friendly messages are
   shown to visitors.
===================================== */


/* ===========================
   FIREBASE
=========================== */

import { app, db } from "./firebase-config.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


/* ===========================
   ELEMENTS
=========================== */

const form =
    document.getElementById("holyGrailForm");

const productNameInput =
    document.getElementById("productName");

const brandInput =
    document.getElementById("brandName");

const submitButton =
    document.getElementById("holyGrailSubmit");

const submitText =
    document.getElementById("submitText");

const submitLoading =
    document.getElementById("submitLoading");

const errorMessage =
    document.getElementById("holyGrailError");

const successMessage =
    document.getElementById("holyGrailSuccess");

const submitAnother =
    document.getElementById("submitAnother");


/* ===========================
   AUTH STATE
=========================== */

let auth = null;

let currentUser = null;

let authenticationPromise = null;

let authenticationReady = false;


/* ===========================
   FIREBASE INITIALIZATION
=========================== */

try {

    if (!app) {

        throw new Error(
            "Firebase app is unavailable."
        );

    }


    auth =
        getAuth(app);


    console.log(
        "Holy Grail Firebase Authentication initialized."
    );

} catch (error) {

    console.error(
        "Firebase Authentication initialization failed:",
        error
    );

}


/* ===========================
   FIRESTORE CHECK
=========================== */

if (!db) {

    console.error(
        "Firestore was not initialized. " +
        "Check firebase-config.js."
    );

}


/* ============================================================
   AUTHENTICATION
============================================================ */

function startAnonymousAuthentication() {

    /*
     * Firebase Auth isn't available.
     */

    if (!auth) {

        return Promise.reject(
            new Error(
                "Firebase Authentication is unavailable."
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
     * Authentication already in progress.
     */

    if (authenticationPromise) {

        return authenticationPromise;

    }


    authenticationPromise =
        new Promise(
            (resolve, reject) => {

                let finished =
                    false;


                const unsubscribe =
                    onAuthStateChanged(
                        auth,

                        async (user) => {

                            if (finished) {

                                return;

                            }


                            /*
                             * Existing user.
                             */

                            if (user) {

                                finished =
                                    true;

                                currentUser =
                                    user;

                                authenticationReady =
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
                                    !credential ||
                                    !credential.user
                                ) {

                                    throw new Error(
                                        "Firebase did not return an authenticated user."
                                    );

                                }


                                finished =
                                    true;

                                currentUser =
                                    credential.user;

                                authenticationReady =
                                    true;

                                unsubscribe();


                                console.log(
                                    "Anonymous Firebase authentication successful:",
                                    currentUser.uid
                                );


                                resolve(
                                    currentUser
                                );

                            } catch (error) {

                                console.error(
                                    "Anonymous authentication failed:",
                                    error
                                );


                                if (!finished) {

                                    finished =
                                        true;

                                    authenticationPromise =
                                        null;

                                    unsubscribe();

                                    reject(
                                        error
                                    );

                                }

                            }

                        },

                        (error) => {

                            if (finished) {

                                return;

                            }


                            finished =
                                true;

                            authenticationPromise =
                                null;

                            unsubscribe();


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
   FRIENDLY ERROR HANDLING
============================================================ */

/*
 * IMPORTANT:
 *
 * Visitors NEVER see Firebase error codes.
 *
 * Developers can still see the real error
 * in the browser console.
 */

function getFriendlyErrorMessage(
    error,
    context = "submission"
) {

    /*
     * Always log the technical error
     * for debugging.
     */

    console.error(
        `Holy Grail ${context} error:`,
        error
    );


    /*
     * Authentication errors.
     */

    if (
        error &&
        error.code ===
        "auth/operation-not-allowed"
    ) {

        console.error(
            "ACTION REQUIRED: Anonymous Authentication " +
            "is not enabled in Firebase."
        );


        return (
            "We couldn't connect your submission right now. " +
            "Please try again in a moment."
        );

    }


    if (
        error &&
        error.code ===
        "auth/network-request-failed"
    ) {

        return (
            "It looks like there's a connection problem. " +
            "Please check your internet connection and try again."
        );

    }


    if (
        error &&
        (
            error.code ===
            "auth/internal-error" ||

            error.code ===
            "auth/network-request-failed"
        )
    ) {

        return (
            "We couldn't connect right now. " +
            "Please try again."
        );

    }


    /*
     * Firestore permission error.
     *
     * This is likely the error you are currently
     * seeing if your Firestore rules don't match
     * the document being created.
     */

    if (
        error &&
        (
            error.code ===
            "permission-denied" ||

            error.code ===
            "firestore/permission-denied"
        )
    ) {

        console.error(
            "Firestore rejected the submission. " +
            "Check the security rule for " +
            "holyGrailRecommendations."
        );


        return (
            "We couldn't send your recommendation right now. " +
            "Please try again in a moment."
        );

    }


    /*
     * Firestore unavailable.
     */

    if (
        error &&
        (
            error.code ===
            "unavailable" ||

            error.code ===
            "deadline-exceeded"
        )
    ) {

        return (
            "Our service is temporarily unavailable. " +
            "Please try again in a moment."
        );

    }


    /*
     * Firestore failed precondition.
     */

    if (
        error &&
        error.code ===
        "failed-precondition"
    ) {

        console.error(
            "Firestore failed precondition. " +
            "Check Firebase configuration."
        );


        return (
            "We couldn't complete your submission right now. " +
            "Please try again."
        );

    }


    /*
     * Invalid argument.
     */

    if (
        error &&
        error.code ===
        "invalid-argument"
    ) {

        return (
            "Something went wrong with your submission. " +
            "Please check the information and try again."
        );

    }


    /*
     * Generic fallback.
     *
     * Never expose technical details.
     */

    if (
        context ===
        "authentication"
    ) {

        return (
            "We couldn't connect your submission right now. " +
            "Please try again."
        );

    }


    return (
        "We couldn't send your recommendation right now. " +
        "Please try again in a moment."
    );

}


/* ============================================================
   UI ERROR
============================================================ */

function showError(
    message
) {

    if (!errorMessage) {

        return;

    }


    errorMessage.textContent =
        message;


    errorMessage.hidden =
        false;

}


/* ============================================================
   CLEAR ERROR
============================================================ */

function clearError() {

    if (!errorMessage) {

        return;

    }


    errorMessage.textContent =
        "";

}


/* ============================================================
   LOADING STATE
============================================================ */

function setLoading(
    loading
) {

    if (submitButton) {

        submitButton.disabled =
            loading;

    }


    if (submitText) {

        submitText.hidden =
            loading;

    }


    if (submitLoading) {

        submitLoading.hidden =
            !loading;

    }

}


/* ============================================================
   SUBMIT RECOMMENDATION
============================================================ */

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            clearError();


            /* =========================
               GET VALUES
            ========================= */

            const productName =
                productNameInput
                    ? productNameInput.value.trim()
                    : "";


            const brand =
                brandInput
                    ? brandInput.value.trim()
                    : "";


            /* =========================
               VALIDATION
            ========================= */

            if (!productName) {

                showError(
                    "Please enter the product name."
                );


                if (productNameInput) {

                    productNameInput.focus();

                }


                return;

            }


            if (!brand) {

                showError(
                    "Please enter the brand."
                );


                if (brandInput) {

                    brandInput.focus();

                }


                return;

            }


            /* =========================
               LOADING
            ========================= */

            setLoading(
                true
            );


            try {

                console.log(
                    "Submitting Holy Grail recommendation..."
                );


                /* =========================
                   FIREBASE CHECKS
                ========================= */

                if (!db) {

                    throw new Error(
                        "Firestore is not initialized."
                    );

                }


                if (!auth) {

                    throw new Error(
                        "Firebase Authentication is not initialized."
                    );

                }


                /* =========================
                   AUTHENTICATE
                ========================= */

                const user =
                    await startAnonymousAuthentication();


                if (!user) {

                    throw new Error(
                        "No authenticated Firebase user exists."
                    );

                }


                currentUser =
                    user;


                console.log(
                    "Authenticated UID:",
                    currentUser.uid
                );


                /* =========================
                   SAVE
                ========================= */

                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "holyGrailRecommendations"
                        ),
                        {

                            productName:
                                productName,

                            brand:
                                brand,

                            uid:
                                currentUser.uid,

                            createdAt:
                                serverTimestamp(),

                            status:
                                "pending"

                        }
                    );


                /*
                 * IMPORTANT:
                 *
                 * If execution reaches here,
                 * Firestore accepted the write.
                 */

                console.log(
                    "Holy Grail recommendation successfully saved:",
                    docRef.id
                );


                /* =========================
                   SUCCESS
                ========================= */

                if (productNameInput) {

                    productNameInput.value =
                        "";

                }


                if (brandInput) {

                    brandInput.value =
                        "";

                }


                if (form) {

                    form.hidden =
                        true;

                }


                if (successMessage) {

                    successMessage.hidden =
                        false;

                }


                clearError();


            } catch (error) {

                /*
                 * Technical error stays in
                 * console.
                 *
                 * Visitor gets friendly message.
                 */

                showError(
                    getFriendlyErrorMessage(
                        error,
                        "submission"
                    )
                );


                /*
                 * Restore form controls.
                 */

                setLoading(
                    false
                );

            }

        }
    );

}


/* ============================================================
   SUBMIT ANOTHER
============================================================ */

if (submitAnother) {

    submitAnother.addEventListener(
        "click",
        () => {

            if (successMessage) {

                successMessage.hidden =
                    true;

            }


            if (form) {

                form.hidden =
                    false;

            }


            setLoading(
                false
            );


            clearError();


            if (productNameInput) {

                productNameInput.focus();

            }

        }
    );

}


/* ============================================================
   INITIALIZE PAGE
============================================================ */

async function initializeHolyGrail() {

    console.log(
        "Holy Grail page initializing..."
    );


    /*
     * Start authentication in the background.
     *
     * The visitor does not have to wait
     * for this before seeing the page.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Holy Grail authentication ready:",
            user.uid
        );

    } catch (error) {

        /*
         * Keep technical information
         * in the console.
         */

        console.error(
            "Holy Grail authentication initialization failed:",
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
        initializeHolyGrail,
        {
            once: true
        }
    );

} else {

    initializeHolyGrail();

}