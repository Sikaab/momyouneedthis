import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const form = document.getElementById("holyGrailForm");

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


// =========================================================
// SUBMIT HOLY GRAIL
// =========================================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    errorMessage.textContent = "";


    const productName =
        productNameInput.value.trim();

    const brand =
        brandInput.value.trim();


    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // LOADING STATE
    // -----------------------------------------------------

    submitButton.disabled = true;

    submitText.hidden = true;

    submitLoading.hidden = false;


    try {

        // -------------------------------------------------
        // SAVE TO FIRESTORE
        // -------------------------------------------------

        await addDoc(
            collection(
                db,
                "holyGrailRecommendations"
            ),
            {
                productName: productName,
                brand: brand,
                submittedAt: serverTimestamp()
            }
        );


        // -------------------------------------------------
        // SHOW SUCCESS
        // -------------------------------------------------

        form.hidden = true;

        successMessage.hidden = false;

        productNameInput.value = "";

        brandInput.value = "";


    } catch (error) {

        console.error(
            "Holy Grail submission error:",
            error
        );


        errorMessage.textContent =
            "We couldn't send your recommendation. Please try again.";

        submitButton.disabled = false;

        submitText.hidden = false;

        submitLoading.hidden = true;

    }

});


// =========================================================
// SUBMIT ANOTHER
// =========================================================

submitAnother.addEventListener("click", () => {

    successMessage.hidden = true;

    form.hidden = false;

    submitButton.disabled = false;

    submitText.hidden = false;

    submitLoading.hidden = true;

    errorMessage.textContent = "";

    productNameInput.focus();

});