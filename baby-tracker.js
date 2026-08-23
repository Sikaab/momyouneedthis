/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const DB_NAME = "MomYouNeedThisBabyTracker";
    const DB_VERSION = 1;
    const STORE_NAME = "tracker";

    const STORAGE_KEY = "momyouneedthis_baby_tracker";

    const DEFAULT_STATE = {
        babyName: "My Baby",
        voiceLanguage: "en-US",
        voiceConfirmation: true,
        logs: []
    };


    /* =====================================================
       STATE
    ===================================================== */

    let state = {
        ...DEFAULT_STATE
    };

    let db = null;

    let recognition = null;
    let isListening = false;
    let recognitionManuallyStopped = false;

    let activeSleep = null;
    let sleepTimerInterval = null;

    let currentModal = null;


    /* =====================================================
       DOM HELPER
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function $all(selector) {
        return Array.from(document.querySelectorAll(selector));
    }


    /* =====================================================
       SAFE EVENT LISTENER
    ===================================================== */

    function on(element, event, handler) {
        if (!element) return;

        element.addEventListener(event, function (e) {
            try {
                handler(e);
            } catch (error) {
                console.error("Baby Tracker event error:", error);
                showToast("Something went wrong.");
            }
        });
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    document.addEventListener("DOMContentLoaded", function () {

        try {
            initializeTracker();
        } catch (error) {
            console.error("Baby Tracker initialization error:", error);
            showFatalError();
        }

    });


    async function initializeTracker() {

        /*
         * IMPORTANT:
         * Nothing here is allowed to assume that IndexedDB,
         * SpeechRecognition, or optional DOM elements exist.
         */

        loadLocalState();

        await initializeIndexedDB();

        await loadDatabaseState();

        initializeUI();

        initializeVoiceRecognition();

        updateAllUI();

        initializeEventListeners();

        restoreActiveSleep();

        console.log("MomYouNeedThis Baby Tracker loaded successfully.");

    }


    /* =====================================================
       LOCAL STORAGE
       SAFE FALLBACK
    ===================================================== */

    function loadLocalState() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                state = {
                    ...DEFAULT_STATE
                };

                return;
            }

            const parsed = JSON.parse(saved);

            if (!parsed || typeof parsed !== "object") {
                return;
            }

            state = {
                ...DEFAULT_STATE,
                ...parsed
            };

            if (!Array.isArray(state.logs)) {
                state.logs = [];
            }

        } catch (error) {

            console.warn(
                "Could not read local storage:",
                error
            );

            state = {
                ...DEFAULT_STATE
            };

        }

    }


    function saveLocalState() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

        } catch (error) {

            console.warn(
                "Could not save local state:",
                error
            );

        }

    }


    /* =====================================================
       INDEXED DB
    ===================================================== */

    function initializeIndexedDB() {

        return new Promise(function (resolve) {

            if (!("indexedDB" in window)) {

                console.warn(
                    "IndexedDB is not supported. Using localStorage."
                );

                resolve(null);
                return;
            }


            let request;

            try {

                request = indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );

            } catch (error) {

                console.warn(
                    "IndexedDB could not be opened:",
                    error
                );

                resolve(null);
                return;
            }


            request.onupgradeneeded = function (event) {

                try {

                    const database = event.target.result;

                    if (!database.objectStoreNames.contains(STORE_NAME)) {

                        database.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );

                    }

                } catch (error) {

                    console.warn(
                        "IndexedDB upgrade error:",
                        error
                    );

                }

            };


            request.onsuccess = function (event) {

                db = event.target.result;

                db.onerror = function (error) {

                    console.warn(
                        "IndexedDB runtime error:",
                        error
                    );

                };

                resolve(db);

            };


            request.onerror = function (event) {

                console.warn(
                    "IndexedDB unavailable:",
                    event.target.error
                );

                db = null;

                resolve(null);

            };


            request.onblocked = function () {

                console.warn(
                    "IndexedDB request blocked."
                );

                resolve(null);

            };

        });

    }


    /* =====================================================
       LOAD DATABASE STATE
    ===================================================== */

    async function loadDatabaseState() {

        if (!db) {
            return;
        }

        try {

            const databaseState = await idbGet(
                "state"
            );

            if (
                databaseState &&
                databaseState.value &&
                typeof databaseState.value === "object"
            ) {

                state = {
                    ...DEFAULT_STATE,
                    ...databaseState.value
                };

                if (!Array.isArray(state.logs)) {
                    state.logs = [];
                }

                saveLocalState();

            } else {

                await saveDatabaseState();

            }

        } catch (error) {

            console.warn(
                "Could not load IndexedDB state:",
                error
            );

        }

    }


    function saveDatabaseState() {

        if (!db) {
            return Promise.resolve();
        }

        return idbPut({
            id: "state",
            value: state
        });

    }


    function persistState() {

        saveLocalState();

        saveDatabaseState().catch(function (error) {

            console.warn(
                "Could not save IndexedDB state:",
                error
            );

        });

    }


    function idbGet(id) {

        return new Promise(function (resolve, reject) {

            if (!db) {
                resolve(null);
                return;
            }

            try {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );

                const request =
                    store.get(id);

                request.onsuccess =
                    function () {
                        resolve(request.result || null);
                    };

                request.onerror =
                    function () {
                        reject(
                            request.error ||
                            new Error("IndexedDB read failed")
                        );
                    };

            } catch (error) {

                reject(error);

            }

        });

    }


    function idbPut(value) {

        return new Promise(function (resolve, reject) {

            if (!db) {
                resolve();
                return;
            }

            try {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );

                const request =
                    store.put(value);

                request.onsuccess =
                    function () {
                        resolve();
                    };

                request.onerror =
                    function () {
                        reject(
                            request.error ||
                            new Error("IndexedDB write failed")
                        );
                    };

            } catch (error) {

                reject(error);

            }

        });

    }


    /* =====================================================
       UI INITIALIZATION
    ===================================================== */

    function initializeUI() {

        const babyNameDisplay =
            $("babyNameDisplay");

        const babyNameInput =
            $("babyNameInput");

        const babyNameModalInput =
            $("babyNameModalInput");

        const voiceLanguage =
            $("voiceLanguage");

        const confirmationToggle =
            $("voiceConfirmationToggle");


        if (babyNameDisplay) {
            babyNameDisplay.textContent =
                state.babyName || "My Baby";
        }


        if (babyNameInput) {
            babyNameInput.value =
                state.babyName || "";
        }


        if (babyNameModalInput) {
            babyNameModalInput.value =
                state.babyName || "";
        }


        if (voiceLanguage) {

            voiceLanguage.value =
                state.voiceLanguage || "en-US";

        }


        if (confirmationToggle) {

            confirmationToggle.checked =
                state.voiceConfirmation !== false;

        }

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    function initializeEventListeners() {

        /* ---------------------------------------------
           VOICE
        --------------------------------------------- */

        on(
            $("voiceButton"),
            "click",
            toggleVoiceRecognition
        );


        /* ---------------------------------------------
           QUICK ACTIONS
        --------------------------------------------- */

        $all(".quick-action").forEach(function (button) {

            on(
                button,
                "click",
                function () {

                    const action =
                        button.dataset.action;

                    handleQuickAction(action);

                }
            );

        });


        /* ---------------------------------------------
           EXAMPLE VOICE BUTTONS
        --------------------------------------------- */

        $all(".voice-example").forEach(function (button) {

            on(
                button,
                "click",
                function () {

                    const example =
                        button.dataset.voiceExample;

                    if (!example) {
                        return;
                    }

                    handleVoiceTranscript(
                        example
                    );

                }
            );

        });


        /* ---------------------------------------------
           SETTINGS
        --------------------------------------------- */

        on(
            $("settingsButton"),
            "click",
            openSettings
        );


        on(
            $("settingsClose"),
            "click",
            closeSettings
        );


        $all("[data-close-settings]")
            .forEach(function (element) {

                on(
                    element,
                    "click",
                    closeSettings
                );

            });


        /* ---------------------------------------------
           BABY PROFILE
        --------------------------------------------- */

        on(
            $("editBabyButton"),
            "click",
            openBabyNameModal
        );


        on(
            $("babyNameModalClose"),
            "click",
            closeBabyNameModal
        );


        $all("[data-close-baby-name]")
            .forEach(function (element) {

                on(
                    element,
                    "click",
                    closeBabyNameModal
                );

            });


        on(
            $("babyNameForm"),
            "submit",
            function (event) {

                event.preventDefault();

                saveBabyName(
                    $("babyNameModalInput")
                        ? $("babyNameModalInput").value
                        : ""
                );

            }
        );


        on(
            $("saveBabyNameButton"),
            "click",
            function () {

                saveBabyName(
                    $("babyNameInput")
                        ? $("babyNameInput").value
                        : ""
                );

            }
        );


        /* ---------------------------------------------
           VOICE SETTINGS
        --------------------------------------------- */

        on(
            $("voiceLanguage"),
            "change",
            function (event) {

                state.voiceLanguage =
                    event.target.value ||
                    "en-US";

                persistState();

                initializeVoiceRecognition();

                showToast(
                    "Voice language updated"
                );

            }
        );


        on(
            $("voiceConfirmationToggle"),
            "change",
            function (event) {

                state.voiceConfirmation =
                    event.target.checked;

                persistState();

            }
        );


        /* ---------------------------------------------
           MODAL
        --------------------------------------------- */

        on(
            $("modalClose"),
            "click",
            closeActionModal
        );


        $all("[data-close-modal]")
            .forEach(function (element) {

                on(
                    element,
                    "click",
                    closeActionModal
                );

            });


        /* ---------------------------------------------
           ACTIVE SLEEP
        --------------------------------------------- */

        on(
            $("endSleepButton"),
            "click",
            endSleep
        );


        /* ---------------------------------------------
           CLEAR TODAY
        --------------------------------------------- */

        on(
            $("clearTodayButton"),
            "click",
            clearToday
        );


        /* ---------------------------------------------
           EXPORT
        --------------------------------------------- */

        on(
            $("exportDataButton"),
            "click",
            exportData
        );


        on(
            $("settingsExportButton"),
            "click",
            exportData
        );


        /* ---------------------------------------------
           IMPORT
        --------------------------------------------- */

        on(
            $("importDataButton"),
            "click",
            function () {

                const input =
                    $("importDataInput");

                if (input) {
                    input.click();
                }

            }
        );


        on(
            $("settingsImportButton"),
            "click",
            function () {

                const input =
                    $("importDataInput");

                if (input) {
                    input.click();
                }

            }
        );


        on(
            $("importDataInput"),
            "change",
            handleImport
        );


        /* ---------------------------------------------
           DELETE
        --------------------------------------------- */

        on(
            $("deleteAllDataButton"),
            "click",
            openDeleteModal
        );


        on(
            $("cancelDeleteButton"),
            "click",
            closeDeleteModal
        );


        on(
            $("confirmDeleteButton"),
            "click",
            deleteAllData
        );


        $all("[data-close-delete]")
            .forEach(function (element) {

                on(
                    element,
                    "click",
                    closeDeleteModal
                );

            });


        /* ---------------------------------------------
           PERMISSION MESSAGE
        --------------------------------------------- */

        on(
            $("voicePermissionClose"),
            "click",
            hideVoicePermissionMessage
        );


        /* ---------------------------------------------
           ESC KEY
        --------------------------------------------- */

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key !== "Escape") {
                    return;
                }

                closeActionModal();
                closeSettings();
                closeBabyNameModal();
                closeDeleteModal();

            }
        );

    }


    /* =====================================================
       VOICE RECOGNITION
    ===================================================== */

    function initializeVoiceRecognition() {

        recognition = null;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            console.warn(
                "Speech recognition is not available in this browser."
            );

            updateVoiceUnavailableUI();

            return;

        }


        try {

            recognition =
                new SpeechRecognition();

            recognition.continuous = false;

            recognition.interimResults = true;

            recognition.maxAlternatives = 1;

            recognition.lang =
                state.voiceLanguage ||
                "en-US";


            recognition.onstart =
                function () {

                    isListening = true;

                    updateVoiceListeningUI();

                };


            recognition.onresult =
                function (event) {

                    let transcript = "";

                    for (
                        let i = event.resultIndex;
                        i < event.results.length;
                        i++
                    ) {

                        transcript +=
                            event.results[i][0]
                                .transcript;

                    }

                    transcript =
                        transcript.trim();

                    if (!transcript) {
                        return;
                    }

                    showTranscript(
                        transcript
                    );

                    /*
                     * With confirmation enabled, we wait
                     * briefly and then save the recognized
                     * command.
                     */
                    if (
                        event.results[
                            event.results.length - 1
                        ].isFinal
                    ) {

                        handleVoiceTranscript(
                            transcript
                        );

                    }

                };


            recognition.onerror =
                function (event) {

                    console.warn(
                        "Speech recognition error:",
                        event.error
                    );

                    isListening = false;

                    updateVoiceIdleUI();

                    handleVoiceError(
                        event.error
                    );

                };


            recognition.onend =
                function () {

                    isListening = false;

                    updateVoiceIdleUI();

                };


        } catch (error) {

            console.warn(
                "Could not initialize speech recognition:",
                error
            );

            recognition = null;

            updateVoiceUnavailableUI();

        }

    }


    function toggleVoiceRecognition() {

        if (!recognition) {

            showVoicePermissionMessage(
                "Voice recognition is not available in this browser. You can still use Quick Tap logging."
            );

            return;

        }


        if (isListening) {

            recognitionManuallyStopped = true;

            try {
                recognition.stop();
            } catch (error) {
                console.warn(error);
            }

            return;

        }


        recognitionManuallyStopped = false;

        try {

            recognition.lang =
                state.voiceLanguage ||
                "en-US";

            recognition.start();

        } catch (error) {

            console.warn(
                "Could not start speech recognition:",
                error
            );

            /*
             * Chrome/Safari can throw if start() is called
             * while recognition is already starting.
             */
            if (
                error &&
                error.name === "InvalidStateError"
            ) {

                return;

            }

            showVoicePermissionMessage(
                "Your browser could not start voice recognition. Please check microphone permissions."
            );

        }

    }


    /* =====================================================
       VOICE UI
    ===================================================== */

    function updateVoiceListeningUI() {

        const button =
            $("voiceButton");

        const icon =
            $("voiceButtonIcon");

        const status =
            $("voiceStatus");

        const title =
            $("voiceStatusTitle");

        const text =
            $("voiceStatusText");

        const wave =
            $("voiceWave");


        if (button) {

            button.classList.add(
                "recording"
            );

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        }


        if (icon) {
            icon.textContent = "⏹️";
        }


        if (status) {
            status.classList.add("active");
        }


        if (title) {
            title.textContent =
                "Listening…";
        }


        if (text) {
            text.textContent =
                "Tell me what happened";
        }


        if (wave) {
            wave.classList.add("active");
        }

    }


    function updateVoiceIdleUI() {

        const button =
            $("voiceButton");

        const icon =
            $("voiceButtonIcon");

        const status =
            $("voiceStatus");

        const title =
            $("voiceStatusTitle");

        const text =
            $("voiceStatusText");

        const wave =
            $("voiceWave");


        if (button) {

            button.classList.remove(
                "recording"
            );

            button.setAttribute(
                "aria-pressed",
                "false"
            );

        }


        if (icon) {
            icon.textContent = "🎙️";
        }


        if (status) {
            status.classList.remove(
                "active"
            );
        }


        if (title) {
            title.textContent =
                "Tap & tell me";
        }


        if (text) {
            text.textContent =
                "“Baby had a wet diaper”";
        }


        if (wave) {
            wave.classList.remove(
                "active"
            );
        }

    }


    function updateVoiceUnavailableUI() {

        const status =
            $("voiceStatus");

        const title =
            $("voiceStatusTitle");

        const text =
            $("voiceStatusText");


        if (status) {
            status.classList.add("active");
        }


        if (title) {
            title.textContent =
                "Voice logging unavailable";
        }


        if (text) {
            text.textContent =
                "Use Quick Tap instead";
        }

    }


    function showTranscript(text) {

        const container =
            $("voiceTranscript");

        const output =
            $("voiceTranscriptText");


        if (!container || !output) {
            return;
        }


        output.textContent =
            text;

        container.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       VOICE COMMAND PARSER
    ===================================================== */

    function handleVoiceTranscript(transcript) {

        if (!transcript) {
            return;
        }


        const clean =
            transcript
                .trim()
                .toLowerCase();


        showTranscript(transcript);


        /*
         * DIAPER
         */

        if (
            clean.includes("diaper") ||
            clean.includes("nappy") ||
            clean.includes("couche")
        ) {

            let type = "wet";

            if (
                clean.includes("dirty") ||
                clean.includes("poop") ||
                clean.includes("poopy") ||
                clean.includes("stool") ||
                clean.includes("feces") ||
                clean.includes("selle") ||
                clean.includes("caca")
            ) {

                type = "dirty";

            }

            addLog({
                type: "diaper",
                subtype: type,
                note: transcript
            });

            return;
        }


        /*
         * FEEDING
         */

        if (
            clean.includes("feed") ||
            clean.includes("fed") ||
            clean.includes("milk") ||
            clean.includes("nursed") ||
            clean.includes("nursing") ||
            clean.includes("breast") ||
            clean.includes("bottle") ||
            clean.includes("formula") ||
            clean.includes("milk")
        ) {

            const amount =
                extractAmount(
                    clean
                );

            const side =
                extractNursingSide(
                    clean
                );

            addLog({
                type: "feed",
                amount: amount,
                side: side,
                note: transcript
            });

            return;
        }


        /*
         * SLEEP
         */

        if (
            clean.includes("sleep") ||
            clean.includes("nap") ||
            clean.includes("slept") ||
            clean.includes("asleep") ||
            clean.includes("dormi") ||
            clean.includes("sieste")
        ) {

            if (
                clean.includes("woke") ||
                clean.includes("wake") ||
                clean.includes("awake") ||
                clean.includes("réve")
            ) {

                if (activeSleep) {
                    endSleep();
                } else {

                    addLog({
                        type: "sleep",
                        duration: 0,
                        note: transcript
                    });

                }

            } else {

                if (!activeSleep) {
                    startSleep();
                }

            }

            return;
        }


        /*
         * NOTE
         */

        addLog({
            type: "note",
            note: transcript
        });

    }


    function extractAmount(text) {

        const match =
            text.match(
                /(\d+(?:\.\d+)?)\s*(ml|milliliter|milliliters|oz|ounce|ounces|minutes|minute|min)/i
            );

        if (!match) {
            return null;
        }

        return {
            value: Number(match[1]),
            unit: match[2]
        };

    }


    function extractNursingSide(text) {

        if (
            text.includes("left") ||
            text.includes("gauche")
        ) {
            return "left";
        }

        if (
            text.includes("right") ||
            text.includes("droite") ||
            text.includes("droit")
        ) {
            return "right";
        }

        return null;

    }


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    function handleQuickAction(action) {

        switch (action) {

            case "feed":
                openFeedModal();
                break;

            case "diaper":
                openDiaperModal();
                break;

            case "sleep":

                if (activeSleep) {
                    endSleep();
                } else {
                    startSleep();
                }

                break;

            case "note":
                openNoteModal();
                break;

            default:
                console.warn(
                    "Unknown action:",
                    action
                );

        }

    }


    /* =====================================================
       FEED MODAL
    ===================================================== */

    function openFeedModal() {

        openActionModal(`
            <span class="tracker-badge">🍼 FEEDING</span>

            <h2 id="modalContentTitle">
                Log a feed
            </h2>

            <p class="modal-subtitle">
                What kind of feeding was it?
            </p>

            <div class="modal-options">

                <button
                    type="button"
                    class="modal-option"
                    data-feed-type="nursing"
                >
                    🤱 Nursing
                </button>

                <button
                    type="button"
                    class="modal-option"
                    data-feed-type="bottle"
                >
                    🍼 Bottle
                </button>

                <button
                    type="button"
                    class="modal-option"
                    data-feed-type="formula"
                >
                    🥛 Formula
                </button>

            </div>
        `);


        $all("[data-feed-type]")
            .forEach(function (button) {

                on(
                    button,
                    "click",
                    function () {

                        const type =
                            button.dataset.feedType;

                        closeActionModal();

                        if (
                            type === "nursing"
                        ) {

                            addLog({
                                type: "feed",
                                subtype: "nursing"
                            });

                        } else {

                            addLog({
                                type: "feed",
                                subtype: type
                            });

                        }

                    }
                );

            });

    }


    /* =====================================================
       DIAPER MODAL
    ===================================================== */

    function openDiaperModal() {

        openActionModal(`
            <span class="tracker-badge">💧 DIAPER</span>

            <h2 id="modalContentTitle">
                Log a diaper
            </h2>

            <p class="modal-subtitle">
                What did you change?
            </p>

            <div class="modal-options">

                <button
                    type="button"
                    class="modal-option"
                    data-diaper-type="wet"
                >
                    💧 Wet
                </button>

                <button
                    type="button"
                    class="modal-option"
                    data-diaper-type="dirty"
                >
                    💩 Dirty
                </button>

                <button
                    type="button"
                    class="modal-option"
                    data-diaper-type="both"
                >
                    💧💩 Both
                </button>

            </div>
        `);


        $all("[data-diaper-type]")
            .forEach(function (button) {

                on(
                    button,
                    "click",
                    function () {

                        addLog({
                            type: "diaper",
                            subtype:
                                button.dataset.diaperType
                        });

                        closeActionModal();

                    }
                );

            });

    }


    /* =====================================================
       NOTE MODAL
    ===================================================== */

    function openNoteModal() {

        openActionModal(`
            <span class="tracker-badge">📝 NOTE</span>

            <h2 id="modalContentTitle">
                Add a note
            </h2>

            <p class="modal-subtitle">
                Anything you want to remember.
            </p>

            <form id="noteForm" class="tracker-form">

                <div>

                    <label for="noteInput">
                        Note
                    </label>

                    <textarea
                        id="noteInput"
                        rows="4"
                        placeholder="Baby was especially happy today..."
                    ></textarea>

                </div>

                <button
                    type="submit"
                    class="form-submit"
                >
                    Save Note
                </button>

            </form>
        `);


        on(
            $("noteForm"),
            "submit",
            function (event) {

                event.preventDefault();

                const input =
                    $("noteInput");

                if (!input) {
                    return;
                }

                const note =
                    input.value.trim();

                if (!note) {

                    showToast(
                        "Write something first."
                    );

                    return;

                }

                addLog({
                    type: "note",
                    note: note
                });

                closeActionModal();

            }
        );

    }


    /* =====================================================
       LOG CREATION
    ===================================================== */

    function addLog(data) {

        const log = {
            id:
                createId(),

            type:
                data.type || "note",

            subtype:
                data.subtype || null,

            amount:
                data.amount || null,

            side:
                data.side || null,

            note:
                data.note || "",

            timestamp:
                new Date().toISOString()
        };


        state.logs.unshift(log);

        persistState();

        updateAllUI();

        showToast(
            getLogSavedMessage(log)
        );

    }


    function createId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();

        }

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2)
        );

    }


    function getLogSavedMessage(log) {

        switch (log.type) {

            case "feed":
                return "Feed logged";

            case "diaper":
                return "Diaper logged";

            case "sleep":
                return "Sleep logged";

            case "note":
                return "Note saved";

            default:
                return "Saved";

        }

    }


    /* =====================================================
       SLEEP
    ===================================================== */

    function startSleep() {

        if (activeSleep) {
            return;
        }


        activeSleep = {
            startTime:
                Date.now()
        };


        try {

            localStorage.setItem(
                "momyouneedthis_active_sleep",
                JSON.stringify(activeSleep)
            );

        } catch (error) {
            console.warn(error);
        }


        updateSleepUI();

        startSleepTimer();

        showToast(
            "Nap started"
        );

    }


    function restoreActiveSleep() {

        try {

            const saved =
                localStorage.getItem(
                    "momyouneedthis_active_sleep"
                );

            if (!saved) {
                return;
            }

            const parsed =
                JSON.parse(saved);

            if (
                parsed &&
                parsed.startTime
            ) {

                activeSleep =
                    parsed;

                updateSleepUI();

                startSleepTimer();

            }

        } catch (error) {

            console.warn(
                "Could not restore active sleep:",
                error
            );

        }

    }


    function startSleepTimer() {

        stopSleepTimer();

        updateSleepTimer();

        sleepTimerInterval =
            setInterval(
                updateSleepTimer,
                1000
            );

    }


    function stopSleepTimer() {

        if (sleepTimerInterval) {

            clearInterval(
                sleepTimerInterval
            );

            sleepTimerInterval = null;

        }

    }


    function updateSleepTimer() {

        if (!activeSleep) {
            return;
        }


        const elapsed =
            Math.max(
                0,
                Date.now() -
                activeSleep.startTime
            );


        const seconds =
            Math.floor(
                elapsed / 1000
            );


        const hours =
            Math.floor(
                seconds / 3600
            );


        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );


        const remainingSeconds =
            seconds % 60;


        const formatted =
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(remainingSeconds)
                .padStart(2, "0");


        const timer =
            $("sleepTimer");

        if (timer) {
            timer.textContent =
                formatted;
        }

    }


    function updateSleepUI() {

        const card =
            $("activeSleepCard");


        if (!card) {
            return;
        }


        if (activeSleep) {

            card.classList.remove(
                "hidden"
            );

            updateSleepTimer();

        } else {

            card.classList.add(
                "hidden"
            );

        }

    }


    function endSleep() {

        if (!activeSleep) {
            return;
        }


        const endTime =
            Date.now();


        const durationMs =
            Math.max(
                0,
                endTime -
                activeSleep.startTime
            );


        const durationMinutes =
            Math.max(
                1,
                Math.round(
                    durationMs /
                    60000
                )
            );


        addLog({
            type: "sleep",
            duration:
                durationMinutes
        });


        activeSleep = null;

        stopSleepTimer();

        try {

            localStorage.removeItem(
                "momyouneedthis_active_sleep"
            );

        } catch (error) {
            console.warn(error);
        }


        updateSleepUI();

    }


    /* =====================================================
       UI UPDATE
    ===================================================== */

    function updateAllUI() {

        updateBabyName();

        updateDate();

        updateSummary();

        renderTimeline();

        updateSleepUI();

    }


    function updateBabyName() {

        const display =
            $("babyNameDisplay");

        if (display) {

            display.textContent =
                state.babyName ||
                "My Baby";

        }

    }


    function updateDate() {

        const element =
            $("todayDate");

        if (!element) {
            return;
        }


        const today =
            new Date();


        try {

            element.textContent =
                today.toLocaleDateString(
                    undefined,
                    {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    }
                );

        } catch (error) {

            element.textContent =
                "Today";

        }

    }


    function updateSummary() {

        const todayLogs =
            getTodayLogs();


        const totalLogs =
            $("totalLogs");

        const feedCount =
            $("feedCount");

        const diaperCount =
            $("diaperCount");

        const sleepTotal =
            $("sleepTotal");


        if (totalLogs) {

            totalLogs.textContent =
                todayLogs.length;

        }


        if (feedCount) {

            feedCount.textContent =
                todayLogs.filter(
                    function (log) {
                        return log.type === "feed";
                    }
                ).length;

        }


        if (diaperCount) {

            diaperCount.textContent =
                todayLogs.filter(
                    function (log) {
                        return log.type === "diaper";
                    }
                ).length;

        }


        if (sleepTotal) {

            const minutes =
                todayLogs
                    .filter(
                        function (log) {
                            return log.type === "sleep";
                        }
                    )
                    .reduce(
                        function (total, log) {

                            return (
                                total +
                                Number(
                                    log.duration || 0
                                )
                            );

                        },
                        0
                    );


            sleepTotal.textContent =
                formatMinutes(minutes);

        }

    }


    function getTodayLogs() {

        const now =
            new Date();


        const year =
            now.getFullYear();

        const month =
            now.getMonth();

        const day =
            now.getDate();


        return state.logs.filter(
            function (log) {

                const date =
                    new Date(
                        log.timestamp
                    );

                return (
                    date.getFullYear() === year &&
                    date.getMonth() === month &&
                    date.getDate() === day
                );

            }
        );

    }


    function formatMinutes(minutes) {

        minutes =
            Number(minutes) || 0;


        if (minutes < 60) {

            return (
                Math.round(minutes) +
                "m"
            );

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        const remaining =
            Math.round(
                minutes % 60
            );


        if (!remaining) {

            return (
                hours +
                "h"
            );

        }


        return (
            hours +
            "h " +
            remaining +
            "m"
        );

    }


    /* =====================================================
       TIMELINE
    ===================================================== */

    function renderTimeline() {

        const timeline =
            $("timeline");

        if (!timeline) {
            return;
        }


        const todayLogs =
            getTodayLogs();


        timeline.innerHTML = "";


        if (!todayLogs.length) {

            timeline.innerHTML = `
                <div class="empty-state" id="emptyState">

                    <div class="empty-state-icon">
                        🌸
                    </div>

                    <h3>
                        Your day starts here
                    </h3>

                    <p>
                        Tell me what happened and
                        I'll keep track for you.
                    </p>

                </div>
            `;

            return;
        }


        todayLogs.forEach(
            function (log) {

                timeline.appendChild(
                    createTimelineItem(log)
                );

            }
        );

    }


    function createTimelineItem(log) {

        const item =
            document.createElement("div");

        item.className =
            "timeline-item";


        const icon =
            getLogIcon(log);


        const title =
            getLogTitle(log);


        const subtitle =
            getLogSubtitle(log);


        const time =
            formatTime(
                log.timestamp
            );


        item.innerHTML = `
            <div class="timeline-icon">
                ${icon}
            </div>

            <div class="timeline-info">

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <span>
                    ${escapeHTML(subtitle)}
                </span>

            </div>

            <div class="timeline-time">
                ${escapeHTML(time)}
            </div>

            <button
                type="button"
                class="timeline-delete"
                aria-label="Delete log"
                data-delete-log="${escapeHTML(log.id)}"
            >
                ×
            </button>
        `;


        const deleteButton =
            item.querySelector(
                "[data-delete-log]"
            );


        on(
            deleteButton,
            "click",
            function () {

                deleteLog(
                    log.id
                );

            }
        );


        return item;

    }


    function getLogIcon(log) {

        switch (log.type) {

            case "feed":
                return "🍼";

            case "diaper":
                return "💧";

            case "sleep":
                return "😴";

            case "note":
                return "📝";

            default:
                return "💗";

        }

    }


    function getLogTitle(log) {

        if (log.type === "feed") {

            if (
                log.subtype === "nursing"
            ) {
                return "Nursing";
            }

            if (
                log.subtype === "bottle"
            ) {
                return "Bottle";
            }

            if (
                log.subtype === "formula"
            ) {
                return "Formula";
            }

            return "Feed";

        }


        if (log.type === "diaper") {

            if (
                log.subtype === "wet"
            ) {
                return "Wet diaper";
            }

            if (
                log.subtype === "dirty"
            ) {
                return "Dirty diaper";
            }

            if (
                log.subtype === "both"
            ) {
                return "Wet + dirty diaper";
            }

            return "Diaper";

        }


        if (log.type === "sleep") {

            return "Sleep";

        }


        if (log.type === "note") {

            return "Note";

        }


        return "Activity";

    }


    function getLogSubtitle(log) {

        if (log.note) {

            return log.note;

        }


        if (
            log.type === "sleep" &&
            log.duration
        ) {

            return (
                "Duration: " +
                formatMinutes(
                    log.duration
                )
            );

        }


        if (
            log.type === "feed"
        ) {

            const parts = [];


            if (log.side) {

                parts.push(
                    log.side === "left"
                        ? "Left"
                        : "Right"
                );

            }


            if (
                log.amount &&
                log.amount.value
            ) {

                parts.push(
                    log.amount.value +
                    " " +
                    log.amount.unit
                );

            }


            if (parts.length) {
                return parts.join(" • ");
            }


            return "Logged";

        }


        return "Logged";

    }


    function formatTime(timestamp) {

        try {

            return new Date(
                timestamp
            ).toLocaleTimeString(
                undefined,
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        } catch (error) {

            return "";

        }

    }


    function escapeHTML(value) {

        return String(
            value == null
                ? ""
                : value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       DELETE LOG
    ===================================================== */

    function deleteLog(id) {

        const confirmed =
            window.confirm(
                "Delete this log?"
            );


        if (!confirmed) {
            return;
        }


        state.logs =
            state.logs.filter(
                function (log) {
                    return log.id !== id;
                }
            );


        persistState();

        updateAllUI();

        showToast(
            "Log deleted"
        );

    }


    /* =====================================================
       CLEAR TODAY
    ===================================================== */

    function clearToday() {

        const todayLogs =
            getTodayLogs();


        if (!todayLogs.length) {

            showToast(
                "Nothing to clear"
            );

            return;

        }


        const confirmed =
            window.confirm(
                "Clear all of today's logs?"
            );


        if (!confirmed) {
            return;
        }


        const todayIds =
            new Set(
                todayLogs.map(
                    function (log) {
                        return log.id;
                    }
                )
            );


        state.logs =
            state.logs.filter(
                function (log) {
                    return !todayIds.has(
                        log.id
                    );
                }
            );


        persistState();

        updateAllUI();

        showToast(
            "Today's logs cleared"
        );

    }


    /* =====================================================
       BABY NAME
    ===================================================== */

    function saveBabyName(name) {

        name =
            String(name || "")
                .trim();


        if (!name) {
            name = "My Baby";
        }


        state.babyName =
            name.substring(0, 40);


        persistState();

        updateBabyName();

        closeBabyNameModal();

        showToast(
            "Baby's name saved"
        );

    }


    function openBabyNameModal() {

        const input =
            $("babyNameModalInput");


        if (input) {

            input.value =
                state.babyName || "";

            setTimeout(
                function () {
                    input.focus();
                },
                100
            );

        }


        showModal(
            "babyNameModal"
        );

    }


    function closeBabyNameModal() {

        hideModal(
            "babyNameModal"
        );

    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    function openSettings() {

        const input =
            $("babyNameInput");


        if (input) {

            input.value =
                state.babyName || "";

        }


        const language =
            $("voiceLanguage");


        if (language) {

            language.value =
                state.voiceLanguage ||
                "en-US";

        }


        const toggle =
            $("voiceConfirmationToggle");


        if (toggle) {

            toggle.checked =
                state.voiceConfirmation !== false;

        }


        showModal(
            "settingsModal"
        );

    }


    function closeSettings() {

        hideModal(
            "settingsModal"
        );

    }


    /* =====================================================
       ACTION MODAL
    ===================================================== */

    function openActionModal(content) {

        const container =
            $("modalContent");


        if (!container) {
            return;
        }


        container.innerHTML =
            content;


        showModal(
            "actionModal"
        );

    }


    function closeActionModal() {

        hideModal(
            "actionModal"
        );

    }


    /* =====================================================
       DELETE MODAL
    ===================================================== */

    function openDeleteModal() {

        showModal(
            "deleteDataModal"
        );

    }


    function closeDeleteModal() {

        hideModal(
            "deleteDataModal"
        );

    }


    function deleteAllData() {

        state = {
            ...DEFAULT_STATE
        };


        persistState();

        activeSleep = null;

        stopSleepTimer();


        try {

            localStorage.removeItem(
                "momyouneedthis_active_sleep"
            );

        } catch (error) {
            console.warn(error);
        }


        updateAllUI();

        closeDeleteModal();

        closeSettings();

        showToast(
            "All tracker data deleted"
        );

    }


    /* =====================================================
       MODALS
    ===================================================== */

    function showModal(id) {

        const modal =
            $(id);

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        if (id === "settingsModal") {

            const button =
                $("settingsButton");

            if (button) {

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }


        currentModal =
            id;

    }


    function hideModal(id) {

        const modal =
            $(id);

        if (!modal) {
            return;
        }


        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        if (id === "settingsModal") {

            const button =
                $("settingsButton");

            if (button) {

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }


        if (currentModal === id) {
            currentModal = null;
        }

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    function exportData() {

        const backup = {

            app:
                "MomYouNeedThis Baby Tracker",

            version:
                1,

            exportedAt:
                new Date().toISOString(),

            state:
                state

        };


        try {

            const blob =
                new Blob(
                    [
                        JSON.stringify(
                            backup,
                            null,
                            2
                        )
                    ],
                    {
                        type:
                            "application/json"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "baby-tracker-backup-" +
                getDateForFilename() +
                ".json";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                function () {
                    URL.revokeObjectURL(
                        url
                    );
                },
                1000
            );


            showToast(
                "Backup exported"
            );

        } catch (error) {

            console.error(
                "Export failed:",
                error
            );

            showToast(
                "Could not export backup"
            );

        }

    }


    function getDateForFilename() {

        const date =
            new Date();


        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                date.getDate()
            ).padStart(2, "0")
        );

    }


    /* =====================================================
       IMPORT
    ===================================================== */

    function handleImport(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                try {

                    const parsed =
                        JSON.parse(
                            reader.result
                        );


                    const importedState =
                        parsed.state ||
                        parsed;


                    if (
                        !importedState ||
                        typeof importedState !==
                            "object"
                    ) {

                        throw new Error(
                            "Invalid backup"
                        );

                    }


                    state = {
                        ...DEFAULT_STATE,
                        ...importedState
                    };


                    if (
                        !Array.isArray(
                            state.logs
                        )
                    ) {

                        state.logs = [];

                    }


                    persistState();

                    initializeUI();

                    updateAllUI();

                    showToast(
                        "Backup imported"
                    );

                } catch (error) {

                    console.error(
                        "Import failed:",
                        error
                    );

                    showToast(
                        "Invalid backup file"
                    );

                }

            };


        reader.onerror =
            function () {

                showToast(
                    "Could not read backup"
                );

            };


        reader.readAsText(
            file
        );


        event.target.value = "";

    }


    /* =====================================================
       VOICE ERRORS
    ===================================================== */

    function handleVoiceError(error) {

        switch (error) {

            case "not-allowed":

            case "service-not-allowed":

                showVoicePermissionMessage(
                    "Microphone access was blocked. Check your browser's microphone permissions and try again."
                );

                break;


            case "no-speech":

                showToast(
                    "I didn't hear anything."
                );

                break;


            case "audio-capture":

                showVoicePermissionMessage(
                    "Your microphone could not be accessed."
                );

                break;


            case "network":

                showVoicePermissionMessage(
                    "Voice recognition needs a connection to the speech recognition service."
                );

                break;


            default:

                showToast(
                    "Voice recognition stopped."
                );

        }

    }


    function showVoicePermissionMessage(
        message
    ) {

        const container =
            $("voicePermissionMessage");

        const text =
            $("voicePermissionText");


        if (!container) {

            showToast(message);

            return;

        }


        if (text) {
            text.textContent =
                message;
        }


        container.classList.remove(
            "hidden"
        );

    }


    function hideVoicePermissionMessage() {

        const container =
            $("voicePermissionMessage");

        if (container) {

            container.classList.add(
                "hidden"
            );

        }

    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout = null;


    function showToast(message) {

        const toast =
            $("trackerToast");

        const text =
            $("toastMessage");


        if (!toast || !text) {
            return;
        }


        text.textContent =
            message;


        toast.classList.add(
            "show"
        );


        if (toastTimeout) {

            clearTimeout(
                toastTimeout
            );

        }


        toastTimeout =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2600
            );

    }


    /* =====================================================
       FATAL ERROR
    ===================================================== */

    function showFatalError() {

        /*
         * Do NOT destroy the whole page if something fails.
         * The user can still see the tracker and get an
         * understandable message.
         */

        const existing =
            document.querySelector(
                ".tracker-fatal-error"
            );


        if (existing) {
            return;
        }


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "tracker-fatal-error";


        message.innerHTML = `
            <strong>
                The tracker could not finish loading.
            </strong>

            <p>
                Please refresh the page.
                Your existing saved data has not been deleted.
            </p>
        `;


        document.body.appendChild(
            message
        );

    }

})();