/* =====================================
   HOLY GRAIL PRODUCT SUBMISSION
   MomYouNeedThis

   Firebase:
   - Anonymous Authentication
   - Firestore
   - Collection: holyGrailRecommendations
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
   FIREBASE AUTH STATE
=========================== */

let auth = null;

let currentUser = null;

let authenticationPromise = null;

let authenticationReady = false;


/* ===========================
   INITIALIZE FIREBASE AUTH
=========================== */

try {

    if (!app) {

        throw new Error(
            "Firebase app was not initialized."
        );

    }


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


/* ===========================
   FIRESTORE CHECK
=========================== */

if (!db) {

    console.error(
        "Firestore database was not initialized. " +
        "Check firebase-config.js."
    );

}


/* ===========================
   AUTHENTICATION
=========================== */

function startAnonymousAuthentication() {

    /*
     * Firebase Auth is unavailable.
     */

    if (!auth) {

        return Promise.reject(
            new Error(
                "Firebase Authentication is not initialized."
            )
        );

    }


    /*
     * User already exists.
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
     * Authentication is already
     * being established.
     */

    if (authenticationPromise) {

        return authenticationPromise;

    }


    authenticationPromise =
        new Promise(
            (resolve, reject) => {

                let finished = false;


                const unsubscribe =
                    onAuthStateChanged(
                        auth,
                        async (user) => {

                            if (finished) {

                                return;

                            }


                            /*
                             * Firebase already has
                             * an authenticated user.
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
                             * Create an anonymous user.
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

                                    finished =
                                        true;

                                    currentUser =
                                        credential.user;

                                    authenticationReady =
                                        true;

                                    unsubscribe();


                                    console.log(
                                        "Anonymous authentication successful:",
                                        currentUser.uid
                                    );


                                    resolve(
                                        currentUser
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


/* ===========================
   FIREBASE ERROR MESSAGE
=========================== */

function getReadableFirebaseError(
    error
) {

    if (!error) {

        return (
            "We couldn't submit your recommendation right now. Please try again."
        );

    }


    console.error(
        "Full Firebase error:",
        error
    );


    /*
     * Anonymous authentication
     * isn't enabled.
     */

    if (
        error.code ===
        "auth/operation-not-allowed"
    ) {

        return (
            "Anonymous Authentication is not enabled in Firebase. " +
            "Enable Anonymous Authentication in your Firebase Authentication settings."
        );

    }


    /*
     * Firestore security rules
     * rejected the request.
     */

    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "Firebase rejected the submission. " +
            "Please check your Firestore security rules."
        );

    }


    /*
     * Network problem.
     */

    if (
        error.code ===
        "auth/network-request-failed"
    ) {

        return (
            "There was a network problem. " +
            "Please check your connection and try again."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable. " +
            "Please try again."
        );

    }


    if (
        error.code ===
        "failed-precondition"
    ) {

        return (
            "Firebase could not complete the submission. " +
            "Please try again."
        );

    }


    return (
        "We couldn't submit your recommendation right now. " +
        "Please try again."
    );

}


/* ===========================
   SAFETY CHECK
=========================== */

if (!form) {

    console.error(
        "Holy Grail form was not found."
    );

}


/* ===========================
   SUBMIT RECOMMENDATION
=========================== */

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            /* =========================
               CLEAR PREVIOUS MESSAGES
            ========================= */

            if (errorMessage) {

                errorMessage.textContent =
                    "";

            }


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

                if (errorMessage) {

                    errorMessage.textContent =
                        "Please enter the product name.";

                }


                if (productNameInput) {

                    productNameInput.focus();

                }


                return;

            }


            if (!brand) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "Please enter the brand.";

                }


                if (brandInput) {

                    brandInput.focus();

                }


                return;

            }


            /* =========================
               LOADING STATE
            ========================= */

            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            if (submitText) {

                submitText.hidden =
                    true;

            }


            if (submitLoading) {

                submitLoading.hidden =
                    false;

            }


            try {

                console.log(
                    "Submitting Holy Grail recommendation..."
                );


                /* =========================
                   CHECK FIREBASE
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
                   AUTHENTICATE FIRST
                ========================= */

                await startAnonymousAuthentication();


                if (!currentUser) {

                    throw new Error(
                        "No authenticated Firebase user exists."
                    );

                }


                console.log(
                    "Authenticated user:",
                    currentUser.uid
                );


                /* =========================
                   SAVE TO FIRESTORE
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

                            /*
                             * Store the anonymous UID.
                             *
                             * This is useful for security
                             * rules and moderation.
                             */

                            uid:
                                currentUser.uid,

                            createdAt:
                                serverTimestamp(),

                            status:
                                "pending"

                        }
                    );


                console.log(
                    "Holy Grail recommendation saved:",
                    docRef.id
                );


                /* =========================
                   SUCCESS
                ========================= */

                if (form) {

                    form.hidden =
                        true;

                }


                if (successMessage) {

                    successMessage.hidden =
                        false;

                }


                /* =========================
                   CLEAR FIELDS
                ========================= */

                if (productNameInput) {

                    productNameInput.value =
                        "";

                }


                if (brandInput) {

                    brandInput.value =
                        "";

                }


            } catch (error) {

                console.error(
                    "Holy Grail Firebase error:",
                    error
                );


                if (errorMessage) {

                    errorMessage.textContent =
                        getReadableFirebaseError(
                            error
                        );

                }


                /*
                 * Restore button.
                 */

                if (submitButton) {

                    submitButton.disabled =
                        false;

                }


                if (submitText) {

                    submitText.hidden =
                        false;

                }


                if (submitLoading) {

                    submitLoading.hidden =
                        true;

                }

            }

        }
    );

}


/* ===========================
   SUBMIT ANOTHER
=========================== */

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


            if (submitButton) {

                submitButton.disabled =
                    false;

            }


            if (submitText) {

                submitText.hidden =
                    false;

            }


            if (submitLoading) {

                submitLoading.hidden =
                    true;

            }


            if (errorMessage) {

                errorMessage.textContent =
                    "";

            }


            if (productNameInput) {

                productNameInput.focus();

            }

        }
    );

}


/* ===========================
   INITIALIZE AUTH
=========================== */

async function initializeHolyGrail() {

    console.log(
        "Holy Grail page initializing..."
    );


    /*
     * Start authentication when the page loads.
     *
     * This means the anonymous user is ready
     * before the visitor submits the form.
     */

    try {

        const user =
            await startAnonymousAuthentication();


        console.log(
            "Holy Grail Firebase authentication ready:",
            user.uid
        );

    } catch (error) {

        console.error(
            "Holy Grail authentication could not start:",
            error
        );

    }

}


/* ===========================
   START
=========================== */

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