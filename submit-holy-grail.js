/* =====================================
   HOLY GRAIL PRODUCT SUBMISSION
   MomYouNeedThis

   Firebase:
   - Shared firebase-config.js
   - Anonymous Authentication
   - Firestore
===================================== */


/* ===========================
   FIREBASE CONFIG
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
   FIREBASE AUTH
=========================== */

let auth = null;

let currentUser = null;

let authenticationPromise = null;

let authenticationReady = false;


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
   ELEMENTS
=========================== */

const form =
    document.getElementById(
        "holyGrailForm"
    );


const productNameInput =
    document.getElementById(
        "productName"
    );


const brandInput =
    document.getElementById(
        "brandName"
    );


const submitButton =
    document.getElementById(
        "holyGrailSubmit"
    );


const submitText =
    document.getElementById(
        "submitText"
    );


const submitLoading =
    document.getElementById(
        "submitLoading"
    );


const errorMessage =
    document.getElementById(
        "holyGrailError"
    );


const successMessage =
    document.getElementById(
        "holyGrailSuccess"
    );


const submitAnother =
    document.getElementById(
        "submitAnother"
    );


/* ===========================
   SAFETY CHECK
=========================== */

if (!form) {

    console.error(
        "Holy Grail form was not found."
    );

}


/* ===========================
   AUTHENTICATION
=========================== */

/*
 * Makes sure the visitor has an
 * anonymous Firebase account before
 * attempting to write to Firestore.
 */

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
     * Authentication already in progress.
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

                                finished = true;

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

                                    unsubscribe();

                                    authenticationPromise =
                                        null;

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

                            unsubscribe();

                            authenticationPromise =
                                null;


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

    console.error(
        "Full Firebase error:",
        error
    );


    if (!error) {

        return (
            "We couldn't submit your recommendation. " +
            "Please try again."
        );

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "Ooppss, we couldn't submit your holy grail for now. Contact us to report the issue."
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
            "Please check your connection and try again."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable. " +
            "Please try again in a moment."
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
   SET LOADING STATE
=========================== */

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
               CHECK FIREBASE
            ========================= */

            if (!db) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "The submission service is not available right now. Please try again later.";

                }


                return;

            }


            if (!auth) {

                if (errorMessage) {

                    errorMessage.textContent =
                        "The authentication service is not available right now. Please try again later.";

                }


                return;

            }


            /* =========================
               LOADING STATE
            ========================= */

            setLoading(
                true
            );


            try {

                console.log(
                    "Preparing Holy Grail submission..."
                );


                /* =========================
                   AUTHENTICATE
                ========================= */

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


                console.log(
                    "Authenticated user:",
                    currentUser.uid
                );


                /* =========================
                   SAVE TO FIRESTORE
                ========================= */

                const recommendationsCollection =
                    collection(
                        db,
                        "holyGrailRecommendations"
                    );


                const docRef =
                    await addDoc(
                        recommendationsCollection,
                        {

                            productName:
                                productName,

                            brand:
                                brand,

                            /*
                             * Store the anonymous UID so
                             * you can identify the submission
                             * without exposing personal data.
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


                setLoading(
                    false
                );

            }

            catch (error) {

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


                setLoading(
                    false
                );

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


            setLoading(
                false
            );


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
   START AUTHENTICATION EARLY
=========================== */

/*
 * Authentication starts in the background.
 *
 * The form itself does NOT have to wait for
 * Firebase before appearing.
 */

if (auth) {

    startAnonymousAuthentication()
        .then(
            (user) => {

                console.log(
                    "Holy Grail authentication ready:",
                    user.uid
                );

            }
        )
        .catch(
            (error) => {

                console.error(
                    "Holy Grail authentication startup failed:",
                    error
                );

            }
        );

}