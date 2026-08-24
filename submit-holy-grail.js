/* =====================================
   HOLY GRAIL PRODUCT SUBMISSION
   MomYouNeedThis
===================================== */

import { db } from "./firebase-config.js";

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

            /* Clear previous error */

            errorMessage.textContent = "";

            /* =========================
               GET VALUES
            ========================= */

            const productName =
                productNameInput.value.trim();

            const brand =
                brandInput.value.trim();

            /* =========================
               VALIDATION
            ========================= */

            if (!productName) {

                errorMessage.textContent =
                    "Please enter the product name.";

                productNameInput.focus();

                return;

            }

            if (!brand) {

                errorMessage.textContent =
                    "Please enter the brand.";

                brandInput.focus();

                return;

            }

            /* =========================
               LOADING STATE
            ========================= */

            submitButton.disabled = true;

            submitText.hidden = true;

            submitLoading.hidden = false;

            try {

                console.log(
                    "Submitting Holy Grail recommendation..."
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

                form.hidden = true;

                successMessage.hidden = false;

                /* Clear fields */

                productNameInput.value = "";

                brandInput.value = "";

            }

            catch (error) {

                console.error(
                    "Holy Grail Firebase error:",
                    error
                );

                errorMessage.textContent =
                    "We couldn't submit your recommendation right now. Please try again.";

                submitButton.disabled = false;

                submitText.hidden = false;

                submitLoading.hidden = true;

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

            successMessage.hidden = true;

            form.hidden = false;

            submitButton.disabled = false;

            submitText.hidden = false;

            submitLoading.hidden = true;

            errorMessage.textContent = "";

            productNameInput.focus();

        }
    );

}