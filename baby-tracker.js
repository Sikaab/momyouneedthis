/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
   Robust version
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       GLOBAL STATE
    ===================================================== */

    const STORAGE_KEY = "momyouneedthis_baby_tracker_v1";

    const DEFAULT_STATE = {
        babyName: "My Baby",
        voiceLanguage: "en-US",
        voiceConfirmation: true,
        logs: [],
        activeSleep: null
    };

    let state = createDefaultState();

    let recognition = null;
    let isListening = false;
    let speechSupported = false;
    let sleepTimerInterval = null;
    let toastTimeout = null;

    /*
     * Prevent a browser from firing duplicate recognition
     * results that could create duplicate logs.
     */
    let lastVoiceText = "";
    let lastVoiceProcessedAt = 0;

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
            element.textContent =
                value == null ? "" : String(value);
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

    function createDefaultState() {
        return {
            babyName: DEFAULT_STATE.babyName,
            voiceLanguage: DEFAULT_STATE.voiceLanguage,
            voiceConfirmation:
                DEFAULT_STATE.voiceConfirmation,
            logs: [],
            activeSleep: null
        };
    }

    /* =====================================================
       STARTUP
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {
            try {
                initializeTracker();
            } catch (error) {
                console.error(
                    "Baby Tracker startup error:",
                    error
                );

                try {
                    loadFallbackState();
                    setupBasicEvents();
                    updateAllUI();
                } catch (fallbackError) {
                    console.error(
                        "Baby Tracker fallback error:",
                        fallbackError
                    );
                }
            }
        }
    );

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

        console.log(
            "MomYouNeedThis Baby Tracker loaded successfully."
        );
    }

    /* =====================================================
       STATE
    ===================================================== */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                state = createDefaultState();
                return;
            }

            const parsed =
                JSON.parse(saved);

            if (
                !parsed ||
                typeof parsed !== "object"
            ) {
                state = createDefaultState();
                return;
            }

            state = normalizeState(parsed);

        } catch (error) {

            console.warn(
                "Could not load saved tracker data.",
                error
            );

            loadFallbackState();
        }
    }

    function normalizeState(parsed) {

        const normalized =
            createDefaultState();

        if (
            typeof parsed.babyName ===
            "string"
        ) {
            normalized.babyName =
                parsed.babyName
                    .trim()
                    .substring(0, 40) ||
                "My Baby";
        }

        if (
            typeof parsed.voiceLanguage ===
            "string"
        ) {
            normalized.voiceLanguage =
                parsed.voiceLanguage;
        }

        if (
            typeof parsed.voiceConfirmation ===
            "boolean"
        ) {
            normalized.voiceConfirmation =
                parsed.voiceConfirmation;
        }

        if (
            Array.isArray(parsed.logs)
        ) {
            normalized.logs =
                parsed.logs
                    .filter(isValidLog)
                    .map(normalizeLog);
        }

        if (
            parsed.activeSleep &&
            typeof parsed.activeSleep ===
                "object" &&
            isValidDate(
                parsed.activeSleep.start
            )
        ) {
            normalized.activeSleep = {
                start:
                    new Date(
                        parsed.activeSleep.start
                    ).toISOString()
            };
        }

        return normalized;
    }

    function isValidLog(log) {

        if (
            !log ||
            typeof log !== "object"
        ) {
            return false;
        }

        if (
            typeof log.timestamp !==
            "string"
        ) {
            return false;
        }

        return isValidDate(
            log.timestamp
        );
    }

    function normalizeLog(log) {

        return {
            id:
                log.id ||
                createLogId(),

            type:
                typeof log.type ===
                "string"
                    ? log.type
                    : "note",

            title:
                typeof log.title ===
                "string"
                    ? log.title
                    : "Note",

            details:
                typeof log.details ===
                "string"
                    ? log.details
                    : "",

            subtype:
                typeof log.subtype ===
                "string"
                    ? log.subtype
                    : "",

            duration:
                Number.isFinite(
                    Number(log.duration)
                )
                    ? Number(log.duration)
                    : null,

            start:
                typeof log.start ===
                "string"
                    ? log.start
                    : null,

            timestamp:
                log.timestamp
        };
    }

    function loadFallbackState() {
        state = createDefaultState();
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

    function isValidDate(value) {

        if (!value) {
            return false;
        }

        const date =
            new Date(value);

        return !Number.isNaN(
            date.getTime()
        );
    }

    function createLogId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }

    /* =====================================================
       BASIC EVENTS
    ===================================================== */

    function setupBasicEvents() {

        const settingsButton =
            $("settingsButton");

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

        const settingsClose =
            $("settingsClose");

        if (settingsClose) {

            settingsClose.addEventListener(
                "click",
                closeSettings
            );
        }

        /* -----------------------------------------------
           GLOBAL MODAL CLICK HANDLING
        ------------------------------------------------ */

        document.addEventListener(
            "click",
            function (event) {

                const target =
                    event.target;

                if (!target) {
                    return;
                }

                if (
                    target.matches &&
                    target.matches(
                        "[data-close-settings]"
                    )
                ) {
                    closeSettings();
                }

                if (
                    target.matches &&
                    target.matches(
                        "[data-close-modal]"
                    )
                ) {
                    closeActionModal();
                }

                if (
                    target.matches &&
                    target.matches(
                        "[data-close-baby-name]"
                    )
                ) {
                    closeBabyNameModal();
                }

                if (
                    target.matches &&
                    target.matches(
                        "[data-close-delete]"
                    )
                ) {
                    closeDeleteModal();
                }
            }
        );

        /* -----------------------------------------------
           BABY NAME
        ------------------------------------------------ */

        const editBabyButton =
            $("editBabyButton");

        if (editBabyButton) {

            editBabyButton.addEventListener(
                "click",
                openBabyNameModal
            );
        }

        const babyNameModalClose =
            $("babyNameModalClose");

        if (babyNameModalClose) {

            babyNameModalClose.addEventListener(
                "click",
                closeBabyNameModal
            );
        }

        const babyNameForm =
            $("babyNameForm");

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

        const voiceButton =
            $("voiceButton");

        if (voiceButton) {

            voiceButton.addEventListener(
                "click",
                toggleVoice
            );
        }

        $all(".voice-example")
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const text =
                                button.getAttribute(
                                    "data-voice-example"
                                );

                            if (text) {
                                processVoiceText(
                                    text
                                );
                            }
                        }
                    );
                }
            );

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

        $all(".quick-action")
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const action =
                                button.getAttribute(
                                    "data-action"
                                );

                            handleQuickAction(
                                action
                            );
                        }
                    );
                }
            );

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
           ACTION MODAL
        ------------------------------------------------ */

        const modalClose =
            $("modalClose");

        if (modalClose) {

            modalClose.addEventListener(
                "click",
                closeActionModal
            );
        }

        /* -----------------------------------------------
           VOICE SETTINGS
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
            state.babyName ||
            "My Baby";

        safeText(
            $("babyNameDisplay"),
            name
        );

        const input =
            $("babyNameInput");

        if (input) {

            input.value =
                name === "My Baby"
                    ? ""
                    : name;
        }

        const modalInput =
            $("babyNameModalInput");

        if (modalInput) {

            modalInput.value =
                name === "My Baby"
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

        name =
            name.substring(0, 40);

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

        const now =
            new Date();

        dateElement.textContent =
            now.toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                }
            );
    }

    /* =====================================================
       VOICE RECOGNITION
    ===================================================== */

    function initializeVoice() {

        /*
         * Stop an existing recognition instance before
         * replacing it.
         */
        if (recognition) {

            try {
                recognition.onstart = null;
                recognition.onresult = null;
                recognition.onerror = null;
                recognition.onend = null;
                recognition.abort();
            } catch (error) {
                console.warn(
                    "Could not reset previous recognition.",
                    error
                );
            }
        }

        recognition = null;
        speechSupported = false;
        isListening = false;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            console.info(
                "Speech recognition is not supported in this browser."
            );

            updateVoiceUI();

            return;
        }

        try {

            recognition =
                new SpeechRecognition();

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

            speechSupported = true;

        } catch (error) {

            console.warn(
                "Could not initialize speech recognition.",
                error
            );

            recognition = null;
            speechSupported = false;
        }

        updateVoiceUI();
    }

    function toggleVoice() {

        if (isListening) {
            stopVoice();
            return;
        }

        if (
            !speechSupported ||
            !recognition
        ) {

            showVoicePermissionMessage(
                "Voice recognition isn't available in this browser. Try Chrome or use Quick Tap."
            );

            return;
        }

        try {

            recognition.lang =
                state.voiceLanguage ||
                "en-US";

            /*
             * Reset duplicate protection when starting
             * a new voice session.
             */
            lastVoiceText = "";
            lastVoiceProcessedAt = 0;

            recognition.start();

        } catch (error) {

            console.warn(
                "Could not start voice recognition:",
                error
            );

            isListening = false;

            updateVoiceUI();

            /*
             * Some browsers throw InvalidStateError if
             * recognition is already running.
             */
            if (
                error &&
                error.name ===
                    "InvalidStateError"
            ) {

                try {
                    recognition.abort();
                } catch (abortError) {
                    console.warn(
                        "Could not abort recognition.",
                        abortError
                    );
                }

                setTimeout(
                    function () {
                        isListening = false;
                        updateVoiceUI();
                    },
                    100
                );
            }
        }
    }

    function stopVoice() {

        if (!recognition) {

            isListening = false;
            updateVoiceUI();

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

        safeText(
            $("voiceStatusTitle"),
            "Listening…"
        );

        safeText(
            $("voiceStatusText"),
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

                const result =
                    event.results[i];

                if (!result ||
                    !result[0]) {
                    continue;
                }

                const transcript =
                    result[0]
                        .transcript
                        .trim();

                if (!transcript) {
                    continue;
                }

                if (result.isFinal) {

                    finalText +=
                        " " +
                        transcript;

                } else {

                    interimText +=
                        " " +
                        transcript;
                }
            }

            finalText =
                finalText.trim();

            interimText =
                interimText.trim();

            const displayText =
                finalText ||
                interimText;

            if (displayText) {

                showTranscript(
                    displayText
                );
            }

            /*
             * ONLY process final recognition results.
             * This is extremely important.
             *
             * Interim results must NEVER create a log.
             */
            if (finalText) {

                processVoiceText(
                    finalText
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

        const errorType =
            event &&
            event.error;

        if (
            errorType ===
            "not-allowed"
        ) {

            message =
                "Microphone access was denied. Please allow microphone access in your browser.";

        } else if (
            errorType ===
            "no-speech"
        ) {

            message =
                "I didn't hear anything. Try again.";

        } else if (
            errorType ===
            "network"
        ) {

            message =
                "Voice recognition needs an internet connection in this browser.";

        } else if (
            errorType ===
            "aborted"
        ) {

            /*
             * Aborted recognition isn't necessarily an error
             * from the user's perspective.
             */
            return;
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
       VOICE TEXT NORMALIZATION
    ===================================================== */

    function normalizeVoiceText(text) {

        return String(text || "")
            .toLowerCase()
            .replace(/[’']/g, "'")
            .replace(/[.,!?;:]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function isDuplicateVoiceCommand(text) {

        const now =
            Date.now();

        const normalized =
            normalizeVoiceText(text);

        if (
            normalized ===
                lastVoiceText &&
            now - lastVoiceProcessedAt <
                4000
        ) {
            return true;
        }

        lastVoiceText =
            normalized;

        lastVoiceProcessedAt =
            now;

        return false;
    }

    /* =====================================================
       VOICE PARSING
    ===================================================== */

    function processVoiceText(text) {

        if (!text) {
            return;
        }

        const originalText =
            String(text).trim();

        if (!originalText) {
            return;
        }

        if (
            isDuplicateVoiceCommand(
                originalText
            )
        ) {
            return;
        }

        const lower =
            normalizeVoiceText(
                originalText
            );

        if (!lower) {
            return;
        }

        /* -----------------------------------------------
           DIAPER
        ------------------------------------------------ */

        if (containsDiaperIntent(lower)) {

            const diaperType =
                determineDiaperType(lower);

            addLog({
                type: "diaper",
                subtype: diaperType,
                title:
                    getDiaperTitle(
                        diaperType
                    ),
                details:
                    originalText,
                timestamp:
                    new Date().toISOString()
            });

            return;
        }

        /* -----------------------------------------------
           FEEDING
        ------------------------------------------------ */

        if (containsFeedIntent(lower)) {

            const amount =
                extractAmount(
                    originalText
                );

            const duration =
                extractDuration(
                    originalText
                );

            let title =
                determineFeedTitle(
                    lower
                );

            let details =
                originalText;

            /*
             * Do not append an amount/duration if the
             * spoken sentence already contains it.
             *
             * The original sentence remains the most
             * useful note for the parent.
             */

            if (
                !amount &&
                !duration
            ) {
                details =
                    originalText;
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

        if (containsSleepIntent(lower)) {

            processSleepVoiceCommand(
                originalText,
                lower
            );

            return;
        }

        /* -----------------------------------------------
           EVERYTHING ELSE = NOTE
        ------------------------------------------------ */

        addLog({
            type: "note",
            title: "Note",
            details: originalText,
            timestamp:
                new Date().toISOString()
        });
    }

    /* =====================================================
       DIAPER VOICE PARSING
    ===================================================== */

    function containsDiaperIntent(text) {

        return (
            /\bdiaper\b/.test(text) ||
            /\bnappy\b/.test(text)
        );
    }

    function determineDiaperType(text) {

        const isDirty =
            /\bdirty\b/.test(text) ||
            /\bpoop\b/.test(text) ||
            /\bpoopy\b/.test(text) ||
            /\bstool\b/.test(text);

        const isWet =
            /\bwet\b/.test(text) ||
            /\bpee\b/.test(text) ||
            /\bpee(d|ing)?\b/.test(text);

        if (isDirty && isWet) {
            return "wet + dirty";
        }

        if (isDirty) {
            return "dirty";
        }

        return "wet";
    }

    function getDiaperTitle(type) {

        if (type === "dirty") {
            return "Dirty diaper";
        }

        if (type === "wet + dirty") {
            return "Wet + dirty diaper";
        }

        return "Wet diaper";
    }

    /* =====================================================
       FEED VOICE PARSING
    ===================================================== */

    function containsFeedIntent(text) {

        return (
            /\bfeed\b/.test(text) ||
            /\bfed\b/.test(text) ||
            /\bfeeding\b/.test(text) ||
            /\bdrank\b/.test(text) ||
            /\bdrink\b/.test(text) ||
            /\bmilk\b/.test(text) ||
            /\bbottle\b/.test(text) ||
            /\bnursed\b/.test(text) ||
            /\bnursing\b/.test(text) ||
            /\bbreastfed\b/.test(text) ||
            /\bbreastfeeding\b/.test(text)
        );
    }

    function determineFeedTitle(text) {

        if (
            /\bbottle\b/.test(text)
        ) {
            return "Bottle";
        }

        if (
            /\bnursed\b/.test(text) ||
            /\bnursing\b/.test(text) ||
            /\bbreastfed\b/.test(text) ||
            /\bbreastfeeding\b/.test(text)
        ) {
            return "Nursing";
        }

        if (
            /\bsolids?\b/.test(text) ||
            /\bfood\b/.test(text)
        ) {
            return "Solids";
        }

        return "Feed";
    }

    /* =====================================================
       SLEEP VOICE PARSING
    ===================================================== */

    function containsSleepIntent(text) {

        return (
            /\bsleep\b/.test(text) ||
            /\bslept\b/.test(text) ||
            /\bsleeping\b/.test(text) ||
            /\basleep\b/.test(text) ||
            /\bnap\b/.test(text) ||
            /\bnapped\b/.test(text) ||
            /\bnapping\b/.test(text)
        );
    }

    function processSleepVoiceCommand(
        originalText,
        lower
    ) {

        /* -------------------------------------------
           1. WAKE / END SLEEP
           
           ONLY explicit wake phrases trigger this.
           
           "woke" by itself is intentionally NOT used.
        ------------------------------------------- */

        const isWakeCommand =
            /\bwoke up\b/.test(lower) ||
            /\bjust woke up\b/.test(lower) ||
            /\bwake up\b/.test(lower) ||
            /\bis awake\b/.test(lower) ||
            /\bawake now\b/.test(lower) ||
            /\bhas woken up\b/.test(lower) ||
            /\bwoken up\b/.test(lower);

        if (isWakeCommand) {

            if (state.activeSleep) {

                endSleep();

            } else {

                addLog({
                    type: "sleep",
                    title: "Woke up",
                    details:
                        originalText,
                    timestamp:
                        new Date().toISOString()
                });
            }

            return;
        }

        /* -------------------------------------------
           2. COMPLETED SLEEP WITH DURATION

           THIS MUST COME BEFORE START SLEEP.

           Examples:
           "Baby napped 20 minutes"
           "Baby napped for 20 minutes"
           "Baby slept 1 hour"
           "Baby slept for 1 hour 20 minutes"
           "Baby had a 30 minute nap"

           These ALWAYS create a completed log.
           They NEVER start the live timer.
        ------------------------------------------- */

        const duration =
            extractDuration(
                originalText
            );

        if (duration !== null) {

            addLog({
                type: "sleep",
                title: "Nap",
                details:
                    originalText,
                duration:
                    duration,
                timestamp:
                    new Date().toISOString()
            });

            return;
        }

        /* -------------------------------------------
           3. EXPLICIT START COMMAND
        ------------------------------------------- */

        const explicitStart =
            /\bstart (a )?nap\b/.test(lower) ||
            /\bstarting (a )?nap\b/.test(lower) ||
            /\bstart (a )?sleep\b/.test(lower) ||
            /\bstarting (a )?sleep\b/.test(lower);

        if (explicitStart) {

            startSleep();

            return;
        }

        /* -------------------------------------------
           4. CLEARLY STARTED SLEEP
        ------------------------------------------- */

        const sleepStarted =
            /\bgoing down for (a )?nap\b/.test(lower) ||
            /\bgoing down for (a )?sleep\b/.test(lower) ||
            /\bgoing to sleep\b/.test(lower) ||
            /\bfell asleep\b/.test(lower) ||
            /\bfalling asleep\b/.test(lower) ||
            /\bhas fallen asleep\b/.test(lower) ||
            /\bis asleep\b/.test(lower) ||
            /\bis sleeping\b/.test(lower);

        if (sleepStarted) {

            startSleep();

            return;
        }

        /* -------------------------------------------
           5. SIMPLE COMMAND
        ------------------------------------------- */

        if (
            lower === "nap" ||
            lower === "a nap" ||
            lower === "sleep"
        ) {

            startSleep();

            return;
        }

        /* -------------------------------------------
           6. AMBIGUOUS SLEEP SENTENCE

           DO NOT CHANGE THE TIMER.

           Save it as a note.
        ------------------------------------------- */

        addLog({
            type: "note",
            title: "Note",
            details:
                originalText,
            timestamp:
                new Date().toISOString()
        });
    }

    /* =====================================================
       AMOUNT PARSER
    ===================================================== */

    function extractAmount(text) {

        if (!text) {
            return null;
        }

        const match =
            String(text).match(
                /(\d+(?:[.,]\d+)?)\s*(?:ml|milliliters?|millilitres?)\b/i
            );

        if (!match) {
            return null;
        }

        const amount =
            parseFloat(
                match[1]
                    .replace(",", ".")
            );

        if (!Number.isFinite(amount)) {
            return null;
        }

        return Math.round(amount);
    }

    /* =====================================================
       DURATION PARSER
    ===================================================== */

    function extractDuration(text) {

        if (!text) {
            return null;
        }

        const normalized =
            String(text)
                .toLowerCase()
                .replace(/,/g, ".")
                .trim();

        /*
         * HOURS + MINUTES
         *
         * "1 hour 20 minutes"
         * "1 hr 20 min"
         * "1h 20m"
         */

        const hoursAndMinutes =
            normalized.match(
                /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|min|m)\b/i
            );

        if (hoursAndMinutes) {

            const hours =
                parseFloat(
                    hoursAndMinutes[1]
                );

            const minutes =
                parseInt(
                    hoursAndMinutes[2],
                    10
                );

            if (
                Number.isFinite(hours) &&
                Number.isFinite(minutes)
            ) {

                return Math.round(
                    hours * 60 +
                    minutes
                );
            }
        }

        /*
         * HOURS ONLY
         *
         * "1 hour"
         * "2 hours"
         * "1 hr"
         * "1h"
         */

        const hours =
            normalized.match(
                /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i
            );

        if (hours) {

            const value =
                parseFloat(
                    hours[1]
                );

            if (
                Number.isFinite(value)
            ) {

                return Math.round(
                    value * 60
                );
            }
        }

        /*
         * MINUTES
         *
         * "20 minutes"
         * "20 mins"
         * "20 min"
         * "20m"
         */

        const minutes =
            normalized.match(
                /(\d+)\s*(?:minutes?|mins?|min|m)\b/i
            );

        if (minutes) {

            const value =
                parseInt(
                    minutes[1],
                    10
                );

            if (
                Number.isFinite(value)
            ) {
                return value;
            }
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
                handleSleepAction();
                break;

            case "note":
                openNoteModal();
                break;

            default:
                console.warn(
                    "Unknown quick action:",
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

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const typeElement =
                    $("feedType");

                const amountElement =
                    $("feedAmount");

                const notesElement =
                    $("feedNotes");

                const type =
                    typeElement
                        ? typeElement.value
                        : "Feed";

                const amount =
                    amountElement
                        ? amountElement.value.trim()
                        : "";

                const notes =
                    notesElement
                        ? notesElement.value.trim()
                        : "";

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

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const typeElement =
                    $("diaperType");

                const type =
                    typeElement
                        ? typeElement.value
                        : "Wet";

                addLog({
                    type: "diaper",
                    title:
                        type +
                        " diaper",
                    details: "",
                    timestamp:
                        new Date().toISOString()
                });

                closeActionModal();
            }
        );
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

        /*
         * Never start two simultaneous naps.
         */
        if (state.activeSleep) {
            return;
        }

        const now =
            new Date();

        state.activeSleep = {
            start:
                now.toISOString()
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

            /*
             * There is no active timer.
             * Do not create a fake duration.
             */
            showToast(
                "No active nap",
                "ℹ️"
            );

            return;
        }

        const start =
            new Date(
                state.activeSleep.start
            );

        const end =
            new Date();

        if (
            Number.isNaN(
                start.getTime()
            )
        ) {

            state.activeSleep = null;

            saveState();

            stopSleepTimer();

            updateActiveSleep();

            return;
        }

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

        addLog(
            {
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
            },
            false
        );

        state.activeSleep = null;

        saveState();

        stopSleepTimer();

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

        if (
            Number.isNaN(
                start.getTime()
            )
        ) {
            return;
        }

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

        const safeSeconds =
            Math.max(
                0,
                Number(seconds) || 0
            );

        const hours =
            Math.floor(
                safeSeconds / 3600
            );

        const minutes =
            Math.floor(
                (safeSeconds % 3600) /
                60
            );

        const secs =
            safeSeconds % 60;

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

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const input =
                    $("noteText");

                const note =
                    input
                        ? input.value.trim()
                        : "";

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

    /* =====================================================
       LOGGING
    ===================================================== */

    function addLog(
        log,
        showMessage = true
    ) {

        const newLog = {
            id:
                createLogId(),

            type:
                log &&
                typeof log.type ===
                    "string"
                    ? log.type
                    : "note",

            title:
                log &&
                typeof log.title ===
                    "string"
                    ? log.title
                    : "Note",

            details:
                log &&
                typeof log.details ===
                    "string"
                    ? log.details
                    : "",

            subtype:
                log &&
                typeof log.subtype ===
                    "string"
                    ? log.subtype
                    : "",

            duration:
                log &&
                Number.isFinite(
                    Number(log.duration)
                )
                    ? Number(log.duration)
                    : null,

            start:
                log &&
                typeof log.start ===
                    "string"
                    ? log.start
                    : null,

            timestamp:
                log &&
                isValidDate(
                    log.timestamp
                )
                    ? log.timestamp
                    : new Date().toISOString()
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

                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {
                    return false;
                }

                return (
                    date.getFullYear() ===
                        year &&
                    date.getMonth() ===
                        month &&
                    date.getDate() ===
                        day
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
            logs.length
        );

        const feeds =
            logs.filter(
                function (log) {
                    return (
                        log.type ===
                        "feed"
                    );
                }
            ).length;

        const diapers =
            logs.filter(
                function (log) {
                    return (
                        log.type ===
                        "diaper"
                    );
                }
            ).length;

        const sleep =
            logs
                .filter(
                    function (log) {
                        return (
                            log.type ===
                            "sleep"
                        );
                    }
                )
                .reduce(
                    function (
                        total,
                        log
                    ) {

                        const duration =
                            Number(
                                log.duration
                            );

                        return (
                            total +
                            (
                                Number.isFinite(
                                    duration
                                )
                                    ? duration
                                    : 0
                            )
                        );
                    },
                    0
                );

        safeText(
            $("feedCount"),
            feeds
        );

        safeText(
            $("diaperCount"),
            diapers
        );

        safeText(
            $("sleepTotal"),
            formatSleepTotal(
                sleep
            )
        );
    }

    function formatSleepTotal(
        minutes
    ) {

        const safeMinutes =
            Math.max(
                0,
                Number(minutes) || 0
            );

        if (!safeMinutes) {
            return "0m";
        }

        const hours =
            Math.floor(
                safeMinutes / 60
            );

        const mins =
            safeMinutes % 60;

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
                            new Date(
                                b.timestamp
                            ) -
                            new Date(
                                a.timestamp
                            )
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

                if (item) {
                    timeline.appendChild(
                        item
                    );
                }
            }
        );
    }

    function createTimelineItem(log) {

        if (!log) {
            return null;
        }

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
                    return (
                        log.id !== id
                    );
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

        if (
            !modal ||
            !container
        ) {
            return;
        }

        container.innerHTML =
            content;

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        /*
         * Prevent the browser from scrolling the page behind
         * the modal while it is open.
         */
        document.body.classList.add(
            "modal-open"
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

        document.body.classList.remove(
            "modal-open"
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

        document.body.classList.add(
            "modal-open"
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

        document.body.classList.remove(
            "modal-open"
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
                state.babyName ===
                    "My Baby"
                    ? ""
                    : state.babyName;
        }

        show(modal);

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
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

        document.body.classList.remove(
            "modal-open"
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

        document.body.classList.add(
            "modal-open"
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

        document.body.classList.remove(
            "modal-open"
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

        state =
            createDefaultState();

        stopSleepTimer();

        closeDeleteModal();

        closeSettings();

        closeActionModal();

        closeBabyNameModal();

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

                    state =
                        normalizeState(
                            imported
                        );

                    saveState();

                    initializeVoice();

                    updateAllUI();

                    restoreActiveSleep();

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