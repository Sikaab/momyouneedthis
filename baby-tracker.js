/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       GLOBAL STATE
    ===================================================== */

    const STORAGE_KEY = "momyouneedthis_baby_tracker_v1";

    let state = {
        babyName: "My Baby",
        voiceLanguage: "en-US",
        voiceConfirmation: true,
        logs: [],
        activeSleep: null
    };

    let recognition = null;
    let isListening = false;
    let speechSupported = false;
    let sleepTimerInterval = null;

    /* =====================================================
       DOM HELPERS
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function $all(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            return [];
        }
    }

    function safeText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function show(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }

    function hide(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }

    /* =====================================================
       STARTUP
    ===================================================== */

    document.addEventListener("DOMContentLoaded", function () {

        try {
            initializeTracker();
        } catch (error) {
            console.error("Baby Tracker startup error:", error);

            /*
             * IMPORTANT:
             * Never let one feature prevent the whole tracker
             * from loading.
             */
            try {
                loadFallbackState();
                updateAllUI();
                setupBasicEvents();
            } catch (fallbackError) {
                console.error(
                    "Baby Tracker fallback error:",
                    fallbackError
                );
            }
        }

    });

    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeTracker() {

        loadState();

        updateBabyName();

        updateTodayDate();

        initializeVoice();

        setupEvents();

        updateAllUI();

        restoreActiveSleep();

        console.log("Baby Tracker loaded successfully.");

    }

    /* =====================================================
       STATE
    ===================================================== */

    function loadState() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);

            if (!parsed || typeof parsed !== "object") {
                return;
            }

            state = {
                babyName:
                    typeof parsed.babyName === "string"
                        ? parsed.babyName
                        : "My Baby",

                voiceLanguage:
                    typeof parsed.voiceLanguage === "string"
                        ? parsed.voiceLanguage
                        : "en-US",

                voiceConfirmation:
                    typeof parsed.voiceConfirmation === "boolean"
                        ? parsed.voiceConfirmation
                        : true,

                logs:
                    Array.isArray(parsed.logs)
                        ? parsed.logs
                        : [],

                activeSleep:
                    parsed.activeSleep || null
            };

        } catch (error) {

            console.warn(
                "Could not load saved tracker data.",
                error
            );

            loadFallbackState();

        }

    }

    function loadFallbackState() {

        state = {
            babyName: "My Baby",
            voiceLanguage: "en-US",
            voiceConfirmation: true,
            logs: [],
            activeSleep: null
        };

    }

    function saveState() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

            return true;

        } catch (error) {

            console.error(
                "Could not save tracker data:",
                error
            );

            showToast(
                "Couldn't save data on this device",
                "⚠️"
            );

            return false;

        }

    }

    /* =====================================================
       BASIC EVENTS
    ===================================================== */

    function setupBasicEvents() {

        const settingsButton = $("settingsButton");

        if (settingsButton) {
            settingsButton.addEventListener(
                "click",
                openSettings
            );
        }

    }

    function setupEvents() {

        setupBasicEvents();

        /* -----------------------------------------------
           SETTINGS
        ------------------------------------------------ */

        const settingsClose = $("settingsClose");

        if (settingsClose) {
            settingsClose.addEventListener(
                "click",
                closeSettings
            );
        }

        document.addEventListener("click", function (event) {

            const target = event.target;

            if (!target) {
                return;
            }

            if (
                target.matches &&
                target.matches("[data-close-settings]")
            ) {
                closeSettings();
            }

            if (
                target.matches &&
                target.matches("[data-close-modal]")
            ) {
                closeActionModal();
            }

            if (
                target.matches &&
                target.matches("[data-close-baby-name]")
            ) {
                closeBabyNameModal();
            }

            if (
                target.matches &&
                target.matches("[data-close-delete]")
            ) {
                closeDeleteModal();
            }

        });

        /* -----------------------------------------------
           BABY NAME
        ------------------------------------------------ */

        const editBabyButton = $("editBabyButton");

        if (editBabyButton) {
            editBabyButton.addEventListener(
                "click",
                openBabyNameModal
            );
        }

        const babyNameModalClose = $("babyNameModalClose");

        if (babyNameModalClose) {
            babyNameModalClose.addEventListener(
                "click",
                closeBabyNameModal
            );
        }

        const babyNameForm = $("babyNameForm");

        if (babyNameForm) {

            babyNameForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    saveBabyName(
                        $("babyNameModalInput")
                    );

                }
            );

        }

        const saveBabyNameButton =
            $("saveBabyNameButton");

        if (saveBabyNameButton) {

            saveBabyNameButton.addEventListener(
                "click",
                function () {

                    saveBabyName(
                        $("babyNameInput")
                    );

                }
            );

        }

        /* -----------------------------------------------
           VOICE
        ------------------------------------------------ */

        const voiceButton = $("voiceButton");

        if (voiceButton) {

            voiceButton.addEventListener(
                "click",
                toggleVoice
            );

        }

        $all(".voice-example").forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const text =
                        button.getAttribute(
                            "data-voice-example"
                        );

                    if (text) {
                        processVoiceText(text);
                    }

                }
            );

        });

        const voicePermissionClose =
            $("voicePermissionClose");

        if (voicePermissionClose) {

            voicePermissionClose.addEventListener(
                "click",
                function () {

                    hide(
                        $("voicePermissionMessage")
                    );

                }
            );

        }

        /* -----------------------------------------------
           QUICK ACTIONS
        ------------------------------------------------ */

        $all(".quick-action").forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const action =
                        button.getAttribute(
                            "data-action"
                        );

                    handleQuickAction(action);

                }
            );

        });

        /* -----------------------------------------------
           SLEEP
        ------------------------------------------------ */

        const endSleepButton =
            $("endSleepButton");

        if (endSleepButton) {

            endSleepButton.addEventListener(
                "click",
                endSleep
            );

        }

        /* -----------------------------------------------
           CLEAR
        ------------------------------------------------ */

        const clearTodayButton =
            $("clearTodayButton");

        if (clearTodayButton) {

            clearTodayButton.addEventListener(
                "click",
                clearToday
            );

        }

        /* -----------------------------------------------
           MODAL
        ------------------------------------------------ */

        const modalClose = $("modalClose");

        if (modalClose) {

            modalClose.addEventListener(
                "click",
                closeActionModal
            );

        }

        /* -----------------------------------------------
           SETTINGS
        ------------------------------------------------ */

        const voiceLanguage =
            $("voiceLanguage");

        if (voiceLanguage) {

            voiceLanguage.value =
                state.voiceLanguage;

            voiceLanguage.addEventListener(
                "change",
                function () {

                    state.voiceLanguage =
                        voiceLanguage.value;

                    saveState();

                    initializeVoice();

                    showToast(
                        "Voice language updated",
                        "✓"
                    );

                }
            );

        }

        const voiceConfirmationToggle =
            $("voiceConfirmationToggle");

        if (voiceConfirmationToggle) {

            voiceConfirmationToggle.checked =
                state.voiceConfirmation;

            voiceConfirmationToggle.addEventListener(
                "change",
                function () {

                    state.voiceConfirmation =
                        voiceConfirmationToggle.checked;

                    saveState();

                }
            );

        }

        /* -----------------------------------------------
           EXPORT / IMPORT
        ------------------------------------------------ */

        const exportDataButton =
            $("exportDataButton");

        if (exportDataButton) {

            exportDataButton.addEventListener(
                "click",
                exportData
            );

        }

        const settingsExportButton =
            $("settingsExportButton");

        if (settingsExportButton) {

            settingsExportButton.addEventListener(
                "click",
                exportData
            );

        }

        const importDataButton =
            $("importDataButton");

        if (importDataButton) {

            importDataButton.addEventListener(
                "click",
                openImportPicker
            );

        }

        const settingsImportButton =
            $("settingsImportButton");

        if (settingsImportButton) {

            settingsImportButton.addEventListener(
                "click",
                openImportPicker
            );

        }

        const importDataInput =
            $("importDataInput");

        if (importDataInput) {

            importDataInput.addEventListener(
                "change",
                handleImport
            );

        }

        /* -----------------------------------------------
           DELETE
        ------------------------------------------------ */

        const deleteAllDataButton =
            $("deleteAllDataButton");

        if (deleteAllDataButton) {

            deleteAllDataButton.addEventListener(
                "click",
                openDeleteModal
            );

        }

        const cancelDeleteButton =
            $("cancelDeleteButton");

        if (cancelDeleteButton) {

            cancelDeleteButton.addEventListener(
                "click",
                closeDeleteModal
            );

        }

        const confirmDeleteButton =
            $("confirmDeleteButton");

        if (confirmDeleteButton) {

            confirmDeleteButton.addEventListener(
                "click",
                deleteEverything
            );

        }

        /* -----------------------------------------------
           ESCAPE KEY
        ------------------------------------------------ */

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

                if (isListening) {
                    stopVoice();
                }

            }
        );

    }

    /* =====================================================
       BABY NAME
    ===================================================== */

    function updateBabyName() {

        const name =
            state.babyName || "My Baby";

        safeText(
            $("babyNameDisplay"),
            name
        );

        const input =
            $("babyNameInput");

        if (input) {
            input.value = name === "My Baby"
                ? ""
                : name;
        }

        const modalInput =
            $("babyNameModalInput");

        if (modalInput) {
            modalInput.value = name === "My Baby"
                ? ""
                : name;
        }

    }

    function saveBabyName(input) {

        if (!input) {
            return;
        }

        let name =
            input.value.trim();

        if (!name) {
            name = "My Baby";
        }

        name = name.substring(0, 40);

        state.babyName = name;

        saveState();

        updateBabyName();

        closeSettings();
        closeBabyNameModal();

        showToast(
            "Baby's name saved",
            "💗"
        );

    }

    /* =====================================================
       DATE
    ===================================================== */

    function updateTodayDate() {

        const dateElement =
            $("todayDate");

        if (!dateElement) {
            return;
        }

        const now = new Date();

        const formatted =
            now.toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                }
            );

        dateElement.textContent =
            formatted;

    }

    /* =====================================================
       VOICE RECOGNITION
    ===================================================== */

    function initializeVoice() {

        speechSupported = false;
        recognition = null;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            console.info(
                "Speech recognition is not supported in this browser."
            );

            return;

        }

        try {

            recognition =
                new SpeechRecognition();

            speechSupported = true;

            recognition.continuous = false;

            recognition.interimResults = true;

            recognition.lang =
                state.voiceLanguage ||
                "en-US";

            recognition.maxAlternatives = 1;

            recognition.onstart =
                handleVoiceStart;

            recognition.onresult =
                handleVoiceResult;

            recognition.onerror =
                handleVoiceError;

            recognition.onend =
                handleVoiceEnd;

        } catch (error) {

            console.warn(
                "Could not initialize speech recognition.",
                error
            );

            recognition = null;
            speechSupported = false;

        }

    }

    function toggleVoice() {

        if (isListening) {

            stopVoice();

            return;

        }

        if (!speechSupported || !recognition) {

            showVoicePermissionMessage(
                "Voice recognition is not available in this browser. Try Chrome on desktop/Android, or use the Quick Tap buttons."
            );

            return;

        }

        try {

            recognition.lang =
                state.voiceLanguage ||
                "en-US";

            recognition.start();

        } catch (error) {

            console.warn(
                "Could not start voice recognition:",
                error
            );

            /*
             * Calling start() twice can throw an error.
             * Reset and let the user try again.
             */

            isListening = false;

            updateVoiceUI();

        }

    }

    function stopVoice() {

        if (!recognition) {
            return;
        }

        try {
            recognition.stop();
        } catch (error) {
            console.warn(
                "Could not stop speech recognition:",
                error
            );
        }

        isListening = false;

        updateVoiceUI();

    }

    function handleVoiceStart() {

        isListening = true;

        updateVoiceUI();

        const statusTitle =
            $("voiceStatusTitle");

        const statusText =
            $("voiceStatusText");

        safeText(
            statusTitle,
            "Listening…"
        );

        safeText(
            statusText,
            "Tell me what happened"
        );

        show(
            $("voiceStatus")
        );

    }

    function handleVoiceResult(event) {

        try {

            let finalText = "";

            let interimText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0]
                        .transcript;

                if (
                    event.results[i].isFinal
                ) {

                    finalText +=
                        transcript;

                } else {

                    interimText +=
                        transcript;

                }

            }

            const text =
                (
                    finalText ||
                    interimText
                ).trim();

            if (!text) {
                return;
            }

            showTranscript(text);

            if (finalText) {

                processVoiceText(
                    finalText.trim()
                );

            }

        } catch (error) {

            console.error(
                "Voice result error:",
                error
            );

        }

    }

    function handleVoiceError(event) {

        console.warn(
            "Speech recognition error:",
            event
        );

        isListening = false;

        updateVoiceUI();

        let message =
            "Voice logging could not start.";

        if (
            event &&
            event.error === "not-allowed"
        ) {

            message =
                "Microphone access was denied. Please allow microphone access in your browser.";

        } else if (
            event &&
            event.error === "no-speech"
        ) {

            message =
                "I didn't hear anything. Try again.";

        } else if (
            event &&
            event.error === "network"
        ) {

            message =
                "Voice recognition needs an internet connection in this browser.";

        }

        showVoicePermissionMessage(
            message
        );

    }

    function handleVoiceEnd() {

        isListening = false;

        updateVoiceUI();

    }

    function updateVoiceUI() {

        const button =
            $("voiceButton");

        const icon =
            $("voiceButtonIcon");

        const wave =
            $("voiceWave");

        if (button) {

            button.classList.toggle(
                "recording",
                isListening
            );

            button.setAttribute(
                "aria-pressed",
                isListening
                    ? "true"
                    : "false"
            );

            button.setAttribute(
                "aria-label",
                isListening
                    ? "Stop voice logging"
                    : "Start voice logging"
            );

        }

        if (icon) {

            icon.textContent =
                isListening
                    ? "⏹️"
                    : "🎙️";

        }

        if (wave) {

            wave.classList.toggle(
                "active",
                isListening
            );

        }

    }

    function showTranscript(text) {

        const transcript =
            $("voiceTranscript");

        const transcriptText =
            $("voiceTranscriptText");

        if (!transcript) {
            return;
        }

        safeText(
            transcriptText,
            text
        );

        show(transcript);

    }

    function showVoicePermissionMessage(
        message
    ) {

        const messageElement =
            $("voicePermissionMessage");

        const textElement =
            $("voicePermissionText");

        if (!messageElement) {
            return;
        }

        safeText(
            textElement,
            message
        );

        show(messageElement);

    }

    /* =====================================================
       VOICE PARSING
    ===================================================== */

    function processVoiceText(text) {

        if (!text) {
            return;
        }

        const lower =
            text.toLowerCase();

        let type = "note";

        /* -----------------------------------------------
           DIAPER
        ------------------------------------------------ */

        if (
            lower.includes("diaper") ||
            lower.includes("nappy")
        ) {

            type = "diaper";

            let diaperType = "wet";

            if (
                lower.includes("dirty") ||
                lower.includes("poop") ||
                lower.includes("poopy") ||
                lower.includes("stool")
            ) {

                diaperType = "dirty";

            }

            addLog({
                type: "diaper",
                subtype: diaperType,
                title:
                    diaperType === "dirty"
                        ? "Dirty diaper"
                        : "Wet diaper",
                details:
                    text,
                timestamp:
                    new Date().toISOString()
            });

            return;

        }

        /* -----------------------------------------------
           FEEDING
        ------------------------------------------------ */

        if (
            lower.includes("feed") ||
            lower.includes("fed") ||
            lower.includes("drank") ||
            lower.includes("milk") ||
            lower.includes("bottle") ||
            lower.includes("nursed") ||
            lower.includes("nursing") ||
            lower.includes("breast")
        ) {

            type = "feed";

            const amount =
                extractAmount(text);

            const duration =
                extractDuration(text);

            let title =
                "Feed";

            if (
                lower.includes("nursed") ||
                lower.includes("nursing") ||
                lower.includes("breast")
            ) {

                title =
                    "Nursing";

            } else if (
                lower.includes("bottle")
            ) {

                title =
                    "Bottle";

            }

            let details = text;

            if (amount) {
                details +=
                    " • " + amount + " ml";
            }

            if (duration) {
                details +=
                    " • " + duration + " min";
            }

            addLog({
                type: "feed",
                title: title,
                details: details,
                timestamp:
                    new Date().toISOString()
            });

            return;

        }

        /* -----------------------------------------------
           SLEEP
        ------------------------------------------------ */

        if (
            lower.includes("sleep") ||
            lower.includes("nap") ||
            lower.includes("asleep") ||
            lower.includes("woke up") ||
            lower.includes("woke")
        ) {

            if (
                lower.includes("woke") ||
                lower.includes("awake")
            ) {

                if (state.activeSleep) {
                    endSleep();
                } else {

                    addLog({
                        type: "sleep",
                        title: "Woke up",
                        details: text,
                        timestamp:
                            new Date().toISOString()
                    });

                }

            } else {

                startSleep();

            }

            return;

        }

        /* -----------------------------------------------
           NOTE
        ------------------------------------------------ */

        addLog({
            type: "note",
            title: "Note",
            details: text,
            timestamp:
                new Date().toISOString()
        });

    }

    function extractAmount(text) {

        const match =
            text.match(
                /(\d+(?:[.,]\d+)?)\s*(?:ml|milliliters?|mL)/i
            );

        if (!match) {
            return null;
        }

        return Math.round(
            parseFloat(
                match[1].replace(",", ".")
            )
        );

    }

    function extractDuration(text) {

        const match =
            text.match(
                /(\d+)\s*(?:minutes?|mins?|min)/i
            );

        if (!match) {
            return null;
        }

        return parseInt(
            match[1],
            10
        );

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
                handleSleepAction();
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
       FEED
    ===================================================== */

    function openFeedModal() {

        openActionModal(`
            <div class="settings-header">
                <span class="tracker-badge">🍼 FEED</span>
                <h2>Log a feed</h2>
                <p>What did baby have?</p>
            </div>

            <form id="feedForm" class="tracker-form">

                <div>
                    <label for="feedType">
                        Type
                    </label>

                    <select id="feedType">
                        <option value="Bottle">
                            Bottle
                        </option>
                        <option value="Nursing">
                            Nursing
                        </option>
                        <option value="Solids">
                            Solids
                        </option>
                    </select>
                </div>

                <div>
                    <label for="feedAmount">
                        Amount (optional)
                    </label>

                    <input
                        id="feedAmount"
                        type="number"
                        min="0"
                        placeholder="120"
                        inputmode="numeric"
                    >
                </div>

                <div>
                    <label for="feedNotes">
                        Note (optional)
                    </label>

                    <textarea
                        id="feedNotes"
                        rows="3"
                        placeholder="Anything else?"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    class="form-submit"
                >
                    🍼 Save Feed
                </button>

            </form>
        `);

        const form =
            $("feedForm");

        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const type =
                        $("feedType").value;

                    const amount =
                        $("feedAmount").value;

                    const notes =
                        $("feedNotes").value.trim();

                    let details =
                        type;

                    if (amount) {
                        details +=
                            " • " +
                            amount +
                            " ml";
                    }

                    if (notes) {
                        details +=
                            " • " +
                            notes;
                    }

                    addLog({
                        type: "feed",
                        title: type,
                        details: details,
                        timestamp:
                            new Date().toISOString()
                    });

                    closeActionModal();

                }
            );

        }

    }

    /* =====================================================
       DIAPER
    ===================================================== */

    function openDiaperModal() {

        openActionModal(`
            <div class="settings-header">
                <span class="tracker-badge">💧 DIAPER</span>
                <h2>Log a diaper</h2>
                <p>What kind was it?</p>
            </div>

            <form id="diaperForm" class="tracker-form">

                <div>
                    <label for="diaperType">
                        Type
                    </label>

                    <select id="diaperType">
                        <option value="Wet">
                            Wet
                        </option>
                        <option value="Dirty">
                            Dirty
                        </option>
                        <option value="Wet + Dirty">
                            Wet + Dirty
                        </option>
                    </select>
                </div>

                <button
                    type="submit"
                    class="form-submit"
                >
                    💧 Save Diaper
                </button>

            </form>
        `);

        const form =
            $("diaperForm");

        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const type =
                        $("diaperType").value;

                    addLog({
                        type: "diaper",
                        title:
                            type + " diaper",
                        details: "",
                        timestamp:
                            new Date().toISOString()
                    });

                    closeActionModal();

                }
            );

        }

    }

    /* =====================================================
       SLEEP
    ===================================================== */

    function handleSleepAction() {

        if (state.activeSleep) {

            endSleep();

        } else {

            startSleep();

        }

    }

    function startSleep() {

        if (state.activeSleep) {
            return;
        }

        state.activeSleep = {
            start:
                new Date().toISOString()
        };

        saveState();

        updateActiveSleep();

        startSleepTimer();

        showToast(
            "Nap started",
            "😴"
        );

    }

    function endSleep() {

        if (!state.activeSleep) {
            return;
        }

        const start =
            new Date(
                state.activeSleep.start
            );

        const end =
            new Date();

        const duration =
            Math.max(
                0,
                Math.round(
                    (
                        end.getTime() -
                        start.getTime()
                    ) / 60000
                )
            );

        addLog({
            type: "sleep",
            title: "Nap",
            details:
                duration +
                " minute" +
                (
                    duration === 1
                        ? ""
                        : "s"
                ),
            duration: duration,
            start:
                state.activeSleep.start,
            timestamp:
                end.toISOString()
        }, false);

        state.activeSleep = null;

        saveState();

        stopSleepTimer();

        updateActiveSleep();

        updateAllUI();

        showToast(
            "Nap saved",
            "😴"
        );

    }

    function restoreActiveSleep() {

        if (!state.activeSleep) {
            return;
        }

        const start =
            new Date(
                state.activeSleep.start
            );

        if (
            Number.isNaN(
                start.getTime()
            )
        ) {

            state.activeSleep = null;

            saveState();

            return;

        }

        updateActiveSleep();

        startSleepTimer();

    }

    function updateActiveSleep() {

        const card =
            $("activeSleepCard");

        if (!card) {
            return;
        }

        if (!state.activeSleep) {

            hide(card);

            return;

        }

        show(card);

        updateSleepTimer();

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

        const timer =
            $("sleepTimer");

        if (
            !timer ||
            !state.activeSleep
        ) {
            return;
        }

        const start =
            new Date(
                state.activeSleep.start
            );

        const seconds =
            Math.max(
                0,
                Math.floor(
                    (
                        Date.now() -
                        start.getTime()
                    ) / 1000
                )
            );

        timer.textContent =
            formatClock(
                seconds
            );

    }

    function formatClock(seconds) {

        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );

        const secs =
            seconds % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");

    }

    /* =====================================================
       NOTE
    ===================================================== */

    function openNoteModal() {

        openActionModal(`
            <div class="settings-header">
                <span class="tracker-badge">📝 NOTE</span>
                <h2>Add a note</h2>
                <p>Write something you want to remember.</p>
            </div>

            <form id="noteForm" class="tracker-form">

                <div>
                    <label for="noteText">
                        Note
                    </label>

                    <textarea
                        id="noteText"
                        rows="5"
                        placeholder="Baby seemed extra happy today..."
                        required
                    ></textarea>
                </div>

                <button
                    type="submit"
                    class="form-submit"
                >
                    📝 Save Note
                </button>

            </form>
        `);

        const form =
            $("noteForm");

        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const note =
                        $("noteText")
                            .value
                            .trim();

                    if (!note) {
                        return;
                    }

                    addLog({
                        type: "note",
                        title: "Note",
                        details: note,
                        timestamp:
                            new Date().toISOString()
                    });

                    closeActionModal();

                }
            );

        }

    }

    /* =====================================================
       LOGGING
    ===================================================== */

    function addLog(log, showMessage = true) {

        const newLog = {
            id:
                Date.now().toString() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 9),

            type:
                log.type || "note",

            title:
                log.title || "Note",

            details:
                log.details || "",

            subtype:
                log.subtype || "",

            duration:
                Number.isFinite(log.duration)
                    ? log.duration
                    : null,

            start:
                log.start || null,

            timestamp:
                log.timestamp ||
                new Date().toISOString()
        };

        state.logs.push(newLog);

        saveState();

        updateAllUI();

        if (showMessage) {

            showToast(
                getSavedMessage(
                    newLog.type
                ),
                "✓"
            );

        }

    }

    function getSavedMessage(type) {

        switch (type) {

            case "feed":
                return "Feed saved";

            case "diaper":
                return "Diaper saved";

            case "sleep":
                return "Sleep saved";

            case "note":
                return "Note saved";

            default:
                return "Saved";

        }

    }

    /* =====================================================
       UI UPDATE
    ===================================================== */

    function updateAllUI() {

        updateBabyName();

        updateTodayDate();

        renderTimeline();

        updateSummary();

        updateActiveSleep();

    }

    /* =====================================================
       TODAY LOGS
    ===================================================== */

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

    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary() {

        const logs =
            getTodayLogs();

        safeText(
            $("totalLogs"),
            String(logs.length)
        );

        const feeds =
            logs.filter(
                function (log) {
                    return log.type === "feed";
                }
            ).length;

        const diapers =
            logs.filter(
                function (log) {
                    return log.type === "diaper";
                }
            ).length;

        const sleep =
            logs
                .filter(
                    function (log) {
                        return log.type === "sleep";
                    }
                )
                .reduce(
                    function (total, log) {
                        return total +
                            (
                                Number(
                                    log.duration
                                ) || 0
                            );
                    },
                    0
                );

        safeText(
            $("feedCount"),
            String(feeds)
        );

        safeText(
            $("diaperCount"),
            String(diapers)
        );

        safeText(
            $("sleepTotal"),
            formatSleepTotal(sleep)
        );

    }

    function formatSleepTotal(minutes) {

        if (!minutes) {
            return "0m";
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        const mins =
            minutes % 60;

        if (!hours) {
            return mins + "m";
        }

        if (!mins) {
            return hours + "h";
        }

        return (
            hours +
            "h " +
            mins +
            "m"
        );

    }

    /* =====================================================
       TIMELINE
    ===================================================== */

    function renderTimeline() {

        const timeline =
            $("timeline");

        const emptyState =
            $("emptyState");

        if (!timeline) {
            return;
        }

        /*
         * Remove previous timeline items
         * but keep empty state.
         */

        Array.from(
            timeline.children
        ).forEach(
            function (child) {

                if (
                    child.id !==
                    "emptyState"
                ) {

                    child.remove();

                }

            }
        );

        const logs =
            getTodayLogs()
                .slice()
                .sort(
                    function (a, b) {

                        return (
                            new Date(b.timestamp) -
                            new Date(a.timestamp)
                        );

                    }
                );

        if (!logs.length) {

            if (emptyState) {
                show(emptyState);
            }

            return;

        }

        if (emptyState) {
            hide(emptyState);
        }

        logs.forEach(
            function (log) {

                const item =
                    createTimelineItem(
                        log
                    );

                timeline.appendChild(
                    item
                );

            }
        );

    }

    function createTimelineItem(log) {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "timeline-item";

        item.dataset.id =
            log.id;

        const icon =
            document.createElement(
                "div"
            );

        icon.className =
            "timeline-icon";

        icon.textContent =
            getLogIcon(log);

        const info =
            document.createElement(
                "div"
            );

        info.className =
            "timeline-info";

        const title =
            document.createElement(
                "strong"
            );

        title.textContent =
            log.title;

        const details =
            document.createElement(
                "span"
            );

        details.textContent =
            log.details || "";

        info.appendChild(
            title
        );

        if (log.details) {
            info.appendChild(
                details
            );
        }

        const time =
            document.createElement(
                "div"
            );

        time.className =
            "timeline-time";

        time.textContent =
            formatTime(
                log.timestamp
            );

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "timeline-delete";

        deleteButton.textContent =
            "×";

        deleteButton.setAttribute(
            "aria-label",
            "Delete log"
        );

        deleteButton.addEventListener(
            "click",
            function () {

                deleteLog(
                    log.id
                );

            }
        );

        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(time);
        item.appendChild(deleteButton);

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

    function formatTime(timestamp) {

        const date =
            new Date(timestamp);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        return date.toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
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

        saveState();

        updateAllUI();

        showToast(
            "Log deleted",
            "✓"
        );

    }

    /* =====================================================
       CLEAR TODAY
    ===================================================== */

    function clearToday() {

        const today =
            getTodayLogs();

        if (!today.length) {

            showToast(
                "Nothing to clear",
                "✓"
            );

            return;

        }

        const confirmed =
            window.confirm(
                "Clear all of today's tracker logs?"
            );

        if (!confirmed) {
            return;
        }

        const todayIds =
            new Set(
                today.map(
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

        saveState();

        updateAllUI();

        showToast(
            "Today's logs cleared",
            "✓"
        );

    }

    /* =====================================================
       MODALS
    ===================================================== */

    function openActionModal(content) {

        const modal =
            $("actionModal");

        const container =
            $("modalContent");

        if (!modal || !container) {
            return;
        }

        container.innerHTML =
            content;

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

    function closeActionModal() {

        const modal =
            $("actionModal");

        if (!modal) {
            return;
        }

        hide(modal);

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    function openSettings() {

        const modal =
            $("settingsModal");

        if (!modal) {
            return;
        }

        updateBabyName();

        const language =
            $("voiceLanguage");

        if (language) {
            language.value =
                state.voiceLanguage;
        }

        const confirmation =
            $("voiceConfirmationToggle");

        if (confirmation) {
            confirmation.checked =
                state.voiceConfirmation;
        }

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        const button =
            $("settingsButton");

        if (button) {
            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }

    }

    function closeSettings() {

        const modal =
            $("settingsModal");

        if (!modal) {
            return;
        }

        hide(modal);

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        const button =
            $("settingsButton");

        if (button) {
            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

    }

    function openBabyNameModal() {

        const modal =
            $("babyNameModal");

        if (!modal) {
            return;
        }

        const input =
            $("babyNameModalInput");

        if (input) {

            input.value =
                state.babyName === "My Baby"
                    ? ""
                    : state.babyName;

        }

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

    function closeBabyNameModal() {

        const modal =
            $("babyNameModal");

        if (!modal) {
            return;
        }

        hide(modal);

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    /* =====================================================
       DELETE MODAL
    ===================================================== */

    function openDeleteModal() {

        const modal =
            $("deleteDataModal");

        if (!modal) {
            return;
        }

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

    function closeDeleteModal() {

        const modal =
            $("deleteDataModal");

        if (!modal) {
            return;
        }

        hide(modal);

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    function deleteEverything() {

        try {

            localStorage.removeItem(
                STORAGE_KEY
            );

        } catch (error) {

            console.warn(
                "Could not clear localStorage.",
                error
            );

        }

        state = {
            babyName: "My Baby",
            voiceLanguage: "en-US",
            voiceConfirmation: true,
            logs: [],
            activeSleep: null
        };

        stopSleepTimer();

        closeDeleteModal();

        closeSettings();

        updateAllUI();

        showToast(
            "All tracker data deleted",
            "✓"
        );

    }

    /* =====================================================
       EXPORT
    ===================================================== */

    function exportData() {

        try {

            const backup = {
                app:
                    "MomYouNeedThis Baby Tracker",

                version:
                    1,

                exportedAt:
                    new Date().toISOString(),

                data:
                    state
            };

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
                new Date()
                    .toISOString()
                    .slice(0, 10) +
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
                "Backup exported",
                "⬇️"
            );

        } catch (error) {

            console.error(
                "Export error:",
                error
            );

            showToast(
                "Could not export data",
                "⚠️"
            );

        }

    }

    /* =====================================================
       IMPORT
    ===================================================== */

    function openImportPicker() {

        const input =
            $("importDataInput");

        if (!input) {
            return;
        }

        input.value = "";

        input.click();

    }

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

                    const imported =
                        parsed.data ||
                        parsed;

                    if (
                        !imported ||
                        typeof imported !==
                        "object"
                    ) {
                        throw new Error(
                            "Invalid backup"
                        );
                    }

                    state = {
                        babyName:
                            typeof imported.babyName ===
                            "string"
                                ? imported.babyName
                                : "My Baby",

                        voiceLanguage:
                            typeof imported.voiceLanguage ===
                            "string"
                                ? imported.voiceLanguage
                                : "en-US",

                        voiceConfirmation:
                            typeof imported.voiceConfirmation ===
                            "boolean"
                                ? imported.voiceConfirmation
                                : true,

                        logs:
                            Array.isArray(
                                imported.logs
                            )
                                ? imported.logs
                                : [],

                        activeSleep:
                            imported.activeSleep ||
                            null
                    };

                    saveState();

                    initializeVoice();

                    updateAllUI();

                    closeSettings();

                    showToast(
                        "Backup imported",
                        "⬆️"
                    );

                } catch (error) {

                    console.error(
                        "Import error:",
                        error
                    );

                    showToast(
                        "Invalid backup file",
                        "⚠️"
                    );

                }

            };

        reader.onerror =
            function () {

                showToast(
                    "Could not read backup",
                    "⚠️"
                );

            };

        reader.readAsText(
            file
        );

    }

    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout = null;

    function showToast(
        message,
        icon = "✓"
    ) {

        const toast =
            $("trackerToast");

        const toastMessage =
            $("toastMessage");

        const toastIcon =
            $("toastIcon");

        if (!toast) {
            return;
        }

        safeText(
            toastMessage,
            message
        );

        safeText(
            toastIcon,
            icon
        );

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
                2500
            );

    }

})();