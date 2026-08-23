/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const DB_NAME = "MomYouNeedThisBabyTracker";
    const DB_VERSION = 1;
    const STORE_NAME = "trackerData";

    const DEFAULT_SETTINGS = {
        babyName: "My Baby",
        voiceLanguage: "en-US",
        voiceConfirmation: true
    };


    /* =====================================================
       STATE
    ===================================================== */

    let db = null;

    let logs = [];

    let settings = {
        ...DEFAULT_SETTINGS
    };

    let activeSleepLog = null;

    let sleepTimerInterval = null;

    let recognition = null;

    let isListening = false;

    let lastTranscript = "";

    let currentModal = null;


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const $$ = (selector) => document.querySelectorAll(selector);


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener("DOMContentLoaded", init);


    async function init() {

        try {

            cacheElements();

            await initializeDatabase();

            await loadSettings();

            await loadLogs();

            initializeVoiceRecognition();

            bindEvents();

            renderEverything();

            startSleepTimerIfNeeded();

        } catch (error) {

            console.error(
                "Baby Tracker initialization error:",
                error
            );

            showToast(
                "The tracker could not finish loading.",
                "⚠️"
            );
        }
    }


    /* =====================================================
       ELEMENT CACHE
    ===================================================== */

    let elements = {};


    function cacheElements() {

        const ids = [

            "settingsButton",
            "settingsModal",
            "settingsClose",

            "actionModal",
            "modalClose",
            "modalContent",

            "babyNameModal",
            "babyNameModalClose",
            "babyNameForm",

            "babyNameDisplay",
            "editBabyButton",

            "babyNameInput",
            "saveBabyNameButton",

            "babyNameModalInput",

            "voiceLanguage",
            "voiceConfirmationToggle",

            "voiceButton",
            "voiceButtonIcon",
            "voiceStatus",
            "voiceStatusTitle",
            "voiceStatusText",

            "voiceWave",

            "voiceTranscript",
            "voiceTranscriptText",

            "activeSleepCard",
            "sleepTimer",
            "endSleepButton",

            "timeline",
            "emptyState",

            "todayDate",
            "totalLogs",

            "feedCount",
            "diaperCount",
            "sleepTotal",

            "clearTodayButton",

            "trackerToast",
            "toastIcon",
            "toastMessage",

            "exportDataButton",
            "importDataButton",
            "importDataInput",

            "settingsExportButton",
            "settingsImportButton",

            "deleteAllDataButton",

            "deleteDataModal",
            "cancelDeleteButton",
            "confirmDeleteButton",

            "voicePermissionMessage",
            "voicePermissionText",
            "voicePermissionClose"
        ];

        ids.forEach(id => {

            elements[id] = $(id);

        });
    }


    /* =====================================================
       INDEXED DB
    ===================================================== */

    function initializeDatabase() {

        return new Promise((resolve, reject) => {

            if (!("indexedDB" in window)) {

                reject(
                    new Error(
                        "IndexedDB is not supported by this browser."
                    )
                );

                return;
            }


            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


            request.onupgradeneeded = (event) => {

                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {

                    database.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "key"
                        }
                    );
                }
            };


            request.onsuccess = () => {

                db = request.result;

                db.onerror = (event) => {

                    console.error(
                        "IndexedDB error:",
                        event.target.error
                    );
                };

                resolve();

            };


            request.onerror = () => {

                reject(request.error);

            };

        });
    }


    /* =====================================================
       DATABASE SAVE
    ===================================================== */

    function dbSet(key, value) {

        return new Promise((resolve, reject) => {

            if (!db) {

                reject(
                    new Error("Database is not initialized.")
                );

                return;
            }


            const transaction = db.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.put({
                key,
                value
            });


            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);

        });
    }


    /* =====================================================
       DATABASE GET
    ===================================================== */

    function dbGet(key) {

        return new Promise((resolve, reject) => {

            if (!db) {

                reject(
                    new Error("Database is not initialized.")
                );

                return;
            }


            const transaction = db.transaction(
                STORE_NAME,
                "readonly"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.get(key);


            request.onsuccess = () => {

                resolve(
                    request.result
                        ? request.result.value
                        : null
                );

            };


            request.onerror = () => reject(request.error);

        });
    }


    /* =====================================================
       DATABASE DELETE
    ===================================================== */

    function dbDelete(key) {

        return new Promise((resolve, reject) => {

            if (!db) {

                reject(
                    new Error("Database is not initialized.")
                );

                return;
            }


            const transaction = db.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.delete(key);


            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);

        });
    }


    /* =====================================================
       LOAD SETTINGS
    ===================================================== */

    async function loadSettings() {

        const storedSettings =
            await dbGet("settings");


        if (
            storedSettings &&
            typeof storedSettings === "object"
        ) {

            settings = {
                ...DEFAULT_SETTINGS,
                ...storedSettings
            };

        } else {

            settings = {
                ...DEFAULT_SETTINGS
            };

            await dbSet(
                "settings",
                settings
            );
        }
    }


    /* =====================================================
       SAVE SETTINGS
    ===================================================== */

    async function saveSettings() {

        await dbSet(
            "settings",
            settings
        );
    }


    /* =====================================================
       LOAD LOGS
    ===================================================== */

    async function loadLogs() {

        const storedLogs =
            await dbGet("logs");


        if (Array.isArray(storedLogs)) {

            logs = storedLogs;

        } else {

            logs = [];

            await dbSet(
                "logs",
                logs
            );
        }


        activeSleepLog =
            logs.find(
                log =>
                    log.type === "sleep" &&
                    log.status === "active"
            ) || null;
    }


    /* =====================================================
       SAVE LOGS
    ===================================================== */

    async function saveLogs() {

        await dbSet(
            "logs",
            logs
        );
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        /* Settings */

        elements.settingsButton?.addEventListener(
            "click",
            openSettings
        );

        elements.settingsClose?.addEventListener(
            "click",
            closeSettings
        );


        /* Baby profile */

        elements.editBabyButton?.addEventListener(
            "click",
            openBabyNameModal
        );


        /* Baby name */

        elements.babyNameModalClose?.addEventListener(
            "click",
            closeBabyNameModal
        );


        elements.babyNameForm?.addEventListener(
            "submit",
            saveBabyNameFromModal
        );


        elements.saveBabyNameButton?.addEventListener(
            "click",
            saveBabyNameFromSettings
        );


        /* Voice */

        elements.voiceButton?.addEventListener(
            "click",
            toggleVoiceRecognition
        );


        /* Voice examples */

        $$(".voice-example").forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const text =
                        button.dataset.voiceExample || "";

                    handleVoiceText(
                        text,
                        true
                    );
                }
            );

        });


        /* Quick actions */

        $$(".quick-action").forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.action;

                    openActionModal(action);

                }
            );

        });


        /* Action modal */

        elements.modalClose?.addEventListener(
            "click",
            closeActionModal
        );


        /* Sleep */

        elements.endSleepButton?.addEventListener(
            "click",
            endSleep
        );


        /* Clear */

        elements.clearTodayButton?.addEventListener(
            "click",
            clearToday
        );


        /* Voice settings */

        elements.voiceLanguage?.addEventListener(
            "change",
            async () => {

                settings.voiceLanguage =
                    elements.voiceLanguage.value;

                await saveSettings();

                initializeVoiceRecognition();

                showToast(
                    "Voice language updated.",
                    "✓"
                );
            }
        );


        elements.voiceConfirmationToggle?.addEventListener(
            "change",
            async () => {

                settings.voiceConfirmation =
                    elements.voiceConfirmationToggle.checked;

                await saveSettings();

            }
        );


        /* Export */

        elements.exportDataButton?.addEventListener(
            "click",
            exportData
        );

        elements.settingsExportButton?.addEventListener(
            "click",
            exportData
        );


        /* Import */

        elements.importDataButton?.addEventListener(
            "click",
            () => {

                elements.importDataInput?.click();

            }
        );


        elements.settingsImportButton?.addEventListener(
            "click",
            () => {

                elements.importDataInput?.click();

            }
        );


        elements.importDataInput?.addEventListener(
            "change",
            handleImport
        );


        /* Delete */

        elements.deleteAllDataButton?.addEventListener(
            "click",
            openDeleteModal
        );


        elements.cancelDeleteButton?.addEventListener(
            "click",
            closeDeleteModal
        );


        elements.confirmDeleteButton?.addEventListener(
            "click",
            deleteEverything
        );


        /* Close modals */

        $$("[data-close-modal]").forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeActionModal
                );

            }
        );


        $$("[data-close-settings]").forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeSettings
                );

            }
        );


        $$("[data-close-baby-name]").forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeBabyNameModal
                );

            }
        );


        $$("[data-close-delete]").forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeDeleteModal
                );

            }
        );


        elements.voicePermissionClose?.addEventListener(
            "click",
            hideVoicePermissionMessage
        );


        /* Escape key */

        document.addEventListener(
            "keydown",
            event => {

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
       RENDER EVERYTHING
    ===================================================== */

    function renderEverything() {

        renderBabyName();

        renderSettings();

        renderDate();

        renderSummary();

        renderTimeline();

        renderActiveSleep();

    }


    /* =====================================================
       BABY NAME
    ===================================================== */

    function renderBabyName() {

        if (elements.babyNameDisplay) {

            elements.babyNameDisplay.textContent =
                settings.babyName || "My Baby";
        }


        if (elements.babyNameInput) {

            elements.babyNameInput.value =
                settings.babyName || "";
        }


        if (elements.babyNameModalInput) {

            elements.babyNameModalInput.value =
                settings.babyName === "My Baby"
                    ? ""
                    : settings.babyName;
        }
    }


    /* =====================================================
       SAVE BABY NAME — SETTINGS
    ===================================================== */

    async function saveBabyNameFromSettings() {

        const input =
            elements.babyNameInput;

        if (!input) return;


        const name =
            input.value.trim();


        settings.babyName =
            name || "My Baby";


        await saveSettings();

        renderBabyName();

        showToast(
            "Baby's name saved.",
            "✓"
        );
    }


    /* =====================================================
       SAVE BABY NAME — MODAL
    ===================================================== */

    async function saveBabyNameFromModal(event) {

        event.preventDefault();


        const input =
            elements.babyNameModalInput;


        const name =
            input?.value.trim() || "";


        settings.babyName =
            name || "My Baby";


        await saveSettings();

        renderBabyName();

        closeBabyNameModal();

        showToast(
            "Baby's profile saved.",
            "💗"
        );
    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    function renderSettings() {

        if (elements.voiceLanguage) {

            elements.voiceLanguage.value =
                settings.voiceLanguage ||
                "en-US";
        }


        if (elements.voiceConfirmationToggle) {

            elements.voiceConfirmationToggle.checked =
                settings.voiceConfirmation !== false;
        }
    }


    function openSettings() {

        closeAllModalsExcept("settings");

        elements.settingsModal?.classList.remove(
            "hidden"
        );

        elements.settingsModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        elements.settingsButton?.setAttribute(
            "aria-expanded",
            "true"
        );

        currentModal = "settings";

        renderSettings();
    }


    function closeSettings() {

        elements.settingsModal?.classList.add(
            "hidden"
        );

        elements.settingsModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        elements.settingsButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        if (currentModal === "settings") {
            currentModal = null;
        }
    }


    /* =====================================================
       BABY NAME MODAL
    ===================================================== */

    function openBabyNameModal() {

        closeAllModalsExcept("baby");

        elements.babyNameModal?.classList.remove(
            "hidden"
        );

        elements.babyNameModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        currentModal = "baby";


        setTimeout(() => {

            elements.babyNameModalInput?.focus();

        }, 100);
    }


    function closeBabyNameModal() {

        elements.babyNameModal?.classList.add(
            "hidden"
        );

        elements.babyNameModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        if (currentModal === "baby") {
            currentModal = null;
        }
    }


    /* =====================================================
       MODAL MANAGEMENT
    ===================================================== */

    function closeAllModalsExcept(type) {

        if (type !== "settings") {
            closeSettings();
        }

        if (type !== "action") {
            closeActionModal();
        }

        if (type !== "baby") {
            closeBabyNameModal();
        }

        if (type !== "delete") {
            closeDeleteModal();
        }
    }


    /* =====================================================
       ACTION MODAL
    ===================================================== */

    function openActionModal(action) {

        closeAllModalsExcept("action");


        if (!elements.modalContent) {
            return;
        }


        const content =
            getActionForm(action);


        elements.modalContent.innerHTML =
            content;


        elements.actionModal?.classList.remove(
            "hidden"
        );

        elements.actionModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        currentModal = "action";


        bindActionForm(action);

    }


    function closeActionModal() {

        elements.actionModal?.classList.add(
            "hidden"
        );

        elements.actionModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        if (currentModal === "action") {
            currentModal = null;
        }
    }


    /* =====================================================
       ACTION FORMS
    ===================================================== */

    function getActionForm(action) {

        if (action === "feed") {

            return `
                <span class="tracker-badge">🍼 FEEDING</span>

                <h2>Log a feed</h2>

                <p class="modal-subtitle">
                    What kind of feeding was it?
                </p>

                <form class="tracker-form" id="feedForm">

                    <div>
                        <label for="feedType">
                            Type
                        </label>

                        <select id="feedType">
                            <option value="Bottle">Bottle</option>
                            <option value="Nursing">Nursing</option>
                            <option value="Formula">Formula</option>
                            <option value="Solid food">Solid food</option>
                        </select>
                    </div>

                    <div>
                        <label for="feedAmount">
                            Amount / details
                        </label>

                        <input
                            id="feedAmount"
                            type="text"
                            placeholder="e.g. 120 ml or 15 min"
                        >
                    </div>

                    <div>
                        <label for="feedSide">
                            Side
                        </label>

                        <select id="feedSide">
                            <option value="">Not applicable</option>
                            <option value="Left">Left</option>
                            <option value="Right">Right</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        class="form-submit settings-primary-button"
                    >
                        🍼 Save Feed
                    </button>

                </form>
            `;
        }


        if (action === "diaper") {

            return `
                <span class="tracker-badge">💧 DIAPER</span>

                <h2>Log a diaper</h2>

                <p class="modal-subtitle">
                    What kind was it?
                </p>

                <form class="tracker-form" id="diaperForm">

                    <div>
                        <label for="diaperType">
                            Type
                        </label>

                        <select id="diaperType">
                            <option value="Wet">Wet</option>
                            <option value="Dirty">Dirty</option>
                            <option value="Wet + Dirty">
                                Wet + Dirty
                            </option>
                        </select>
                    </div>

                    <div>
                        <label for="diaperNote">
                            Note (optional)
                        </label>

                        <input
                            id="diaperNote"
                            type="text"
                            placeholder="Anything to remember?"
                        >
                    </div>

                    <button
                        type="submit"
                        class="form-submit settings-primary-button"
                    >
                        💧 Save Diaper
                    </button>

                </form>
            `;
        }


        if (action === "sleep") {

            return `
                <span class="tracker-badge">😴 SLEEP</span>

                <h2>Sleep</h2>

                <p class="modal-subtitle">
                    Start a nap now or log a completed sleep.
                </p>

                <div class="modal-options">

                    <button
                        type="button"
                        class="modal-option"
                        id="startSleepModalButton"
                    >
                        😴 Start Nap Now
                    </button>

                    <button
                        type="button"
                        class="modal-option"
                        id="manualSleepButton"
                    >
                        📝 Log Completed Sleep
                    </button>

                </div>
            `;
        }


        if (action === "note") {

            return `
                <span class="tracker-badge">📝 NOTE</span>

                <h2>Add a note</h2>

                <p class="modal-subtitle">
                    Save something you want to remember.
                </p>

                <form class="tracker-form" id="noteForm">

                    <div>
                        <label for="noteText">
                            Note
                        </label>

                        <textarea
                            id="noteText"
                            rows="5"
                            placeholder="e.g. Baby seemed extra sleepy today..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        class="form-submit settings-primary-button"
                    >
                        📝 Save Note
                    </button>

                </form>
            `;
        }


        return "";
    }


    /* =====================================================
       BIND ACTION FORM
    ===================================================== */

    function bindActionForm(action) {

        if (action === "feed") {

            $("feedForm")?.addEventListener(
                "submit",
                saveFeed
            );
        }


        if (action === "diaper") {

            $("diaperForm")?.addEventListener(
                "submit",
                saveDiaper
            );
        }


        if (action === "note") {

            $("noteForm")?.addEventListener(
                "submit",
                saveNote
            );
        }


        if (action === "sleep") {

            $("startSleepModalButton")?.addEventListener(
                "click",
                async () => {

                    closeActionModal();

                    await startSleep();

                }
            );


            $("manualSleepButton")?.addEventListener(
                "click",
                openManualSleepForm
            );
        }
    }


    /* =====================================================
       FEED
    ===================================================== */

    async function saveFeed(event) {

        event.preventDefault();


        const type =
            $("feedType")?.value || "Feed";


        const amount =
            $("feedAmount")?.value.trim() || "";


        const side =
            $("feedSide")?.value || "";


        const details =
            [amount, side]
                .filter(Boolean)
                .join(" • ");


        await addLog({

            type: "feed",

            title: type,

            details:
                details ||
                "Feeding logged",

            icon: "🍼"
        });


        closeActionModal();

        showToast(
            "Feed logged.",
            "🍼"
        );
    }


    /* =====================================================
       DIAPER
    ===================================================== */

    async function saveDiaper(event) {

        event.preventDefault();


        const type =
            $("diaperType")?.value ||
            "Diaper";


        const note =
            $("diaperNote")?.value.trim() ||
            "";


        await addLog({

            type: "diaper",

            title: `${type} diaper`,

            details:
                note ||
                "Diaper change logged",

            icon: "💧"
        });


        closeActionModal();

        showToast(
            "Diaper logged.",
            "💧"
        );
    }


    /* =====================================================
       NOTE
    ===================================================== */

    async function saveNote(event) {

        event.preventDefault();


        const text =
            $("noteText")?.value.trim();


        if (!text) {

            showToast(
                "Please enter a note.",
                "⚠️"
            );

            return;
        }


        await addLog({

            type: "note",

            title: "Note",

            details: text,

            icon: "📝"
        });


        closeActionModal();

        showToast(
            "Note saved.",
            "📝"
        );
    }


    /* =====================================================
       MANUAL SLEEP FORM
    ===================================================== */

    function openManualSleepForm() {

        if (!elements.modalContent) {
            return;
        }


        elements.modalContent.innerHTML = `

            <span class="tracker-badge">
                😴 SLEEP
            </span>

            <h2>
                Log completed sleep
            </h2>

            <p class="modal-subtitle">
                Enter when the nap started and ended.
            </p>

            <form
                class="tracker-form"
                id="manualSleepForm"
            >

                <div>

                    <label for="sleepStart">
                        Started
                    </label>

                    <input
                        type="time"
                        id="sleepStart"
                        required
                    >

                </div>


                <div>

                    <label for="sleepEnd">
                        Ended
                    </label>

                    <input
                        type="time"
                        id="sleepEnd"
                        required
                    >

                </div>


                <button
                    type="submit"
                    class="form-submit settings-primary-button"
                >
                    😴 Save Sleep
                </button>

            </form>
        `;


        $("manualSleepForm")?.addEventListener(
            "submit",
            saveManualSleep
        );
    }


    async function saveManualSleep(event) {

        event.preventDefault();


        const start =
            $("sleepStart")?.value;


        const end =
            $("sleepEnd")?.value;


        if (!start || !end) {
            return;
        }


        const duration =
            calculateTimeDifference(
                start,
                end
            );


        if (duration <= 0) {

            showToast(
                "Please check the sleep times.",
                "⚠️"
            );

            return;
        }


        await addLog({

            type: "sleep",

            title: "Nap",

            details:
                formatDuration(duration),

            icon: "😴",

            duration

        });


        closeActionModal();

        showToast(
            "Sleep logged.",
            "😴"
        );
    }


    /* =====================================================
       START SLEEP
    ===================================================== */

    async function startSleep() {

        if (activeSleepLog) {

            showToast(
                "A nap is already in progress.",
                "😴"
            );

            return;
        }


        const log = {

            id: generateId(),

            type: "sleep",

            title: "Nap",

            details: "Nap in progress",

            icon: "😴",

            timestamp: Date.now(),

            status: "active",

            startTime: Date.now()

        };


        logs.push(log);

        activeSleepLog = log;


        await saveLogs();

        renderEverything();

        startSleepTimer();


        showToast(
            "Nap started.",
            "😴"
        );
    }


    /* =====================================================
       END SLEEP
    ===================================================== */

    async function endSleep() {

        if (!activeSleepLog) {
            return;
        }


        const now = Date.now();

        const start =
            activeSleepLog.startTime;


        const duration =
            Math.max(
                0,
                now - start
            );


        activeSleepLog.status =
            "completed";


        activeSleepLog.endTime =
            now;


        activeSleepLog.timestamp =
            now;


        activeSleepLog.duration =
            duration;


        activeSleepLog.details =
            formatDuration(duration);


        const index =
            logs.findIndex(
                log =>
                    log.id === activeSleepLog.id
            );


        if (index !== -1) {

            logs[index] =
                activeSleepLog;
        }


        activeSleepLog = null;


        stopSleepTimer();

        await saveLogs();

        renderEverything();


        showToast(
            `Nap ended • ${formatDuration(duration)}`,
            "😴"
        );
    }


    /* =====================================================
       SLEEP TIMER
    ===================================================== */

    function startSleepTimerIfNeeded() {

        if (activeSleepLog) {

            startSleepTimer();

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

        if (
            !activeSleepLog ||
            !elements.sleepTimer
        ) {
            return;
        }


        const elapsed =
            Date.now() -
            activeSleepLog.startTime;


        elements.sleepTimer.textContent =
            formatClockDuration(
                elapsed
            );
    }


    /* =====================================================
       ADD LOG
    ===================================================== */

    async function addLog(data) {

        const log = {

            id:
                data.id ||
                generateId(),

            type:
                data.type,

            title:
                data.title,

            details:
                data.details || "",

            icon:
                data.icon || "📝",

            timestamp:
                data.timestamp ||
                Date.now(),

            duration:
                data.duration ||
                0,

            status:
                data.status ||
                "completed"

        };


        logs.push(log);


        await saveLogs();

        renderEverything();

    }


    /* =====================================================
       RENDER ACTIVE SLEEP
    ===================================================== */

    function renderActiveSleep() {

        if (
            !elements.activeSleepCard
        ) {
            return;
        }


        if (activeSleepLog) {

            elements.activeSleepCard.classList.remove(
                "hidden"
            );

            updateSleepTimer();

        } else {

            elements.activeSleepCard.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       RENDER DATE
    ===================================================== */

    function renderDate() {

        if (!elements.todayDate) {
            return;
        }


        const today =
            new Date();


        elements.todayDate.textContent =
            today.toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                }
            );
    }


    /* =====================================================
       TODAY LOGS
    ===================================================== */

    function getTodayLogs() {

        const start =
            new Date();

        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date();

        end.setHours(
            23,
            59,
            59,
            999
        );


        return logs.filter(
            log =>
                log.timestamp >= start.getTime() &&
                log.timestamp <= end.getTime()
        );
    }


    /* =====================================================
       RENDER SUMMARY
    ===================================================== */

    function renderSummary() {

        const todayLogs =
            getTodayLogs();


        const feedCount =
            todayLogs.filter(
                log =>
                    log.type === "feed"
            ).length;


        const diaperCount =
            todayLogs.filter(
                log =>
                    log.type === "diaper"
            ).length;


        const sleepTotal =
            todayLogs
                .filter(
                    log =>
                        log.type === "sleep" &&
                        log.status !== "active"
                )
                .reduce(
                    (
                        total,
                        log
                    ) =>
                        total +
                        (Number(log.duration) || 0),
                    0
                );


        if (elements.totalLogs) {

            elements.totalLogs.textContent =
                todayLogs.length;
        }


        if (elements.feedCount) {

            elements.feedCount.textContent =
                feedCount;
        }


        if (elements.diaperCount) {

            elements.diaperCount.textContent =
                diaperCount;
        }


        if (elements.sleepTotal) {

            elements.sleepTotal.textContent =
                formatShortDuration(
                    sleepTotal
                );
        }
    }


    /* =====================================================
       RENDER TIMELINE
    ===================================================== */

    function renderTimeline() {

        if (!elements.timeline) {
            return;
        }


        const todayLogs =
            getTodayLogs()
                .sort(
                    (a, b) =>
                        b.timestamp -
                        a.timestamp
                );


        elements.timeline.innerHTML = "";


        if (!todayLogs.length) {

            elements.timeline.appendChild(
                createEmptyState()
            );

            return;
        }


        todayLogs.forEach(
            log => {

                const item =
                    createTimelineItem(log);

                elements.timeline.appendChild(
                    item
                );

            }
        );
    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    function createEmptyState() {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "empty-state";


        div.innerHTML = `

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

        `;


        return div;
    }


    /* =====================================================
       TIMELINE ITEM
    ===================================================== */

    function createTimelineItem(log) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "timeline-item";


        const time =
            formatTime(
                log.timestamp
            );


        const details =
            escapeHtml(
                log.details || ""
            );


        item.innerHTML = `

            <div class="timeline-icon">
                ${log.icon || "📝"}
            </div>

            <div class="timeline-info">

                <strong>
                    ${escapeHtml(
                        log.title || "Activity"
                    )}
                </strong>

                <span>
                    ${details}
                </span>

            </div>

            <div class="timeline-time">
                ${time}
            </div>

            <button
                type="button"
                class="timeline-delete"
                aria-label="Delete log"
                title="Delete log"
            >
                ×
            </button>

        `;


        const deleteButton =
            item.querySelector(
                ".timeline-delete"
            );


        deleteButton?.addEventListener(
            "click",
            async () => {

                await deleteLog(
                    log.id
                );

            }
        );


        return item;
    }


    /* =====================================================
       DELETE SINGLE LOG
    ===================================================== */

    async function deleteLog(id) {

        const confirmed =
            window.confirm(
                "Delete this log?"
            );


        if (!confirmed) {
            return;
        }


        logs =
            logs.filter(
                log =>
                    log.id !== id
            );


        if (
            activeSleepLog &&
            activeSleepLog.id === id
        ) {

            activeSleepLog = null;

            stopSleepTimer();
        }


        await saveLogs();

        renderEverything();


        showToast(
            "Log deleted.",
            "✓"
        );
    }


    /* =====================================================
       CLEAR TODAY
    ===================================================== */

    async function clearToday() {

        const todayLogs =
            getTodayLogs();


        if (!todayLogs.length) {

            showToast(
                "There are no logs to clear.",
                "ℹ️"
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


        const ids =
            new Set(
                todayLogs.map(
                    log =>
                        log.id
                )
            );


        logs =
            logs.filter(
                log =>
                    !ids.has(log.id)
            );


        if (
            activeSleepLog &&
            ids.has(activeSleepLog.id)
        ) {

            activeSleepLog = null;

            stopSleepTimer();
        }


        await saveLogs();

        renderEverything();


        showToast(
            "Today's logs cleared.",
            "✓"
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

            showVoiceUnsupportedState();

            return;
        }


        try {

            recognition =
                new SpeechRecognition();


            recognition.continuous =
                false;


            recognition.interimResults =
                true;


            recognition.lang =
                settings.voiceLanguage ||
                "en-US";


            recognition.maxAlternatives =
                1;


            recognition.onstart =
                handleRecognitionStart;


            recognition.onresult =
                handleRecognitionResult;


            recognition.onerror =
                handleRecognitionError;


            recognition.onend =
                handleRecognitionEnd;

        } catch (error) {

            console.error(
                "Could not initialize speech recognition:",
                error
            );

            recognition = null;

            showVoiceUnsupportedState();
        }
    }


    /* =====================================================
       VOICE SUPPORT
    ===================================================== */

    function showVoiceUnsupportedState() {

        if (!elements.voiceButton) {
            return;
        }


        elements.voiceButton.disabled =
            true;


        elements.voiceButton.setAttribute(
            "aria-label",
            "Voice logging is not supported in this browser"
        );


        if (elements.voiceButtonIcon) {

            elements.voiceButtonIcon.textContent =
                "⌨️";
        }


        if (elements.voiceStatus) {

            elements.voiceStatus.classList.add(
                "active"
            );


            if (elements.voiceStatusTitle) {

                elements.voiceStatusTitle.textContent =
                    "Voice unavailable";
            }


            if (elements.voiceStatusText) {

                elements.voiceStatusText.textContent =
                    "Use Chrome on desktop or Android for voice logging.";
            }
        }
    }


    /* =====================================================
       TOGGLE VOICE
    ===================================================== */

    function toggleVoiceRecognition() {

        if (!recognition) {

            showVoicePermission();

            return;
        }


        if (isListening) {

            stopVoiceRecognition();

        } else {

            startVoiceRecognition();

        }
    }


    /* =====================================================
       START VOICE
    ===================================================== */

    function startVoiceRecognition() {

        if (!recognition) {

            showVoicePermission();

            return;
        }


        try {

            lastTranscript = "";

            recognition.start();

        } catch (error) {

            /*
             Chrome can throw InvalidStateError if start()
             is called while recognition is already active.
            */

            console.warn(
                "Speech recognition could not start:",
                error
            );

            if (
                error.name ===
                "InvalidStateError"
            ) {
                return;
            }

            showVoicePermission();

        }
    }


    /* =====================================================
       STOP VOICE
    ===================================================== */

    function stopVoiceRecognition() {

        if (!recognition) {
            return;
        }


        try {

            recognition.stop();

        } catch (error) {

            console.warn(
                "Speech recognition stop error:",
                error
            );

        }
    }


    /* =====================================================
       RECOGNITION START
    ===================================================== */

    function handleRecognitionStart() {

        isListening = true;


        elements.voiceButton?.classList.add(
            "recording"
        );


        elements.voiceButton?.setAttribute(
            "aria-pressed",
            "true"
        );


        if (elements.voiceButtonIcon) {

            elements.voiceButtonIcon.textContent =
                "⏹️";
        }


        elements.voiceStatus?.classList.add(
            "active"
        );


        if (elements.voiceStatusTitle) {

            elements.voiceStatusTitle.textContent =
                "Listening…";
        }


        if (elements.voiceStatusText) {

            elements.voiceStatusText.textContent =
                "Tell me what happened.";
        }


        elements.voiceWave?.classList.add(
            "active"
        );
    }


    /* =====================================================
       RECOGNITION RESULT
    ===================================================== */

    function handleRecognitionResult(event) {

        let transcript = "";


        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            transcript +=
                event.results[i][0].transcript;

        }


        transcript =
            transcript.trim();


        if (!transcript) {
            return;
        }


        lastTranscript =
            transcript;


        if (elements.voiceTranscript) {

            elements.voiceTranscript.classList.remove(
                "hidden"
            );
        }


        if (elements.voiceTranscriptText) {

            elements.voiceTranscriptText.textContent =
                transcript;
        }


        const result =
            event.results[
                event.results.length - 1
            ];


        if (
            result &&
            result.isFinal
        ) {

            handleVoiceText(
                transcript,
                false
            );
        }
    }


    /* =====================================================
       RECOGNITION ERROR
    ===================================================== */

    function handleRecognitionError(event) {

        console.warn(
            "Speech recognition error:",
            event.error
        );


        isListening = false;


        if (
            event.error ===
            "not-allowed" ||
            event.error ===
            "service-not-allowed"
        ) {

            showVoicePermission();

            return;
        }


        if (
            event.error ===
            "no-speech"
        ) {

            showToast(
                "I didn't hear anything. Try again.",
                "🎙️"
            );

            return;
        }


        if (
            event.error ===
            "audio-capture"
        ) {

            showToast(
                "Chrome could not access your microphone.",
                "🎙️"
            );

            return;
        }


        showToast(
            "Voice recognition had a problem. Try again.",
            "⚠️"
        );
    }


    /* =====================================================
       RECOGNITION END
    ===================================================== */

    function handleRecognitionEnd() {

        isListening = false;


        elements.voiceButton?.classList.remove(
            "recording"
        );


        elements.voiceButton?.setAttribute(
            "aria-pressed",
            "false"
        );


        if (elements.voiceButtonIcon) {

            elements.voiceButtonIcon.textContent =
                "🎙️";
        }


        elements.voiceWave?.classList.remove(
            "active"
        );


        if (
            !lastTranscript &&
            elements.voiceStatusTitle
        ) {

            elements.voiceStatusTitle.textContent =
                "Tap & tell me";
        }
    }


    /* =====================================================
       HANDLE VOICE TEXT
    ===================================================== */

    async function handleVoiceText(
        transcript,
        isExample = false
    ) {

        const text =
            String(
                transcript || ""
            ).trim();


        if (!text) {
            return;
        }


        if (
            settings.voiceConfirmation &&
            !isExample
        ) {

            showVoiceConfirmation(
                text
            );

            return;
        }


        await parseAndSaveVoiceText(
            text
        );
    }


    /* =====================================================
       VOICE CONFIRMATION
    ===================================================== */

    function showVoiceConfirmation(text) {

        if (!elements.modalContent) {
            return;
        }


        closeAllModalsExcept("action");


        elements.modalContent.innerHTML = `

            <span class="tracker-badge">
                🎙️ I HEARD
            </span>

            <h2>
                Does this look right?
            </h2>

            <p class="modal-subtitle">
                ${escapeHtml(text)}
            </p>

            <div class="modal-options">

                <button
                    type="button"
                    class="modal-option"
                    id="confirmVoiceLogButton"
                >
                    ✓ Save this
                </button>

                <button
                    type="button"
                    class="modal-option"
                    id="cancelVoiceLogButton"
                >
                    Try again
                </button>

            </div>

        `;


        elements.actionModal?.classList.remove(
            "hidden"
        );

        elements.actionModal?.setAttribute(
            "aria-hidden",
            "false"
        );


        currentModal = "action";


        $("confirmVoiceLogButton")?.addEventListener(
            "click",
            async () => {

                closeActionModal();

                await parseAndSaveVoiceText(
                    text
                );

            }
        );


        $("cancelVoiceLogButton")?.addEventListener(
            "click",
            closeActionModal
        );
    }


    /* =====================================================
       PARSE VOICE
    ===================================================== */

    async function parseAndSaveVoiceText(text) {

        const lower =
            text.toLowerCase();


        let type =
            "note";


        let title =
            "Note";


        let icon =
            "📝";


        let details =
            text;


        /* ---------------------------------------------
           DIAPER
        --------------------------------------------- */

        if (
            lower.includes("diaper") ||
            lower.includes("nappy") ||
            lower.includes("wet") ||
            lower.includes("poop") ||
            lower.includes("poopy") ||
            lower.includes("dirty")
        ) {

            type =
                "diaper";

            icon =
                "💧";


            if (
                lower.includes("dirty") ||
                lower.includes("poop") ||
                lower.includes("poopy")
            ) {

                title =
                    lower.includes("wet")
                        ? "Wet + Dirty diaper"
                        : "Dirty diaper";

            } else {

                title =
                    "Wet diaper";
            }


            details =
                text;
        }


        /* ---------------------------------------------
           FEED
        --------------------------------------------- */

        else if (
            lower.includes("feed") ||
            lower.includes("fed") ||
            lower.includes("drank") ||
            lower.includes("drink") ||
            lower.includes("bottle") ||
            lower.includes("nursed") ||
            lower.includes("nursing") ||
            lower.includes("breastfed") ||
            lower.includes("breast")
        ) {

            type =
                "feed";

            icon =
                "🍼";


            if (
                lower.includes("nursed") ||
                lower.includes("nursing") ||
                lower.includes("breastfed")
            ) {

                title =
                    "Nursing";

            } else {

                title =
                    "Feed";
            }


            details =
                text;
        }


        /* ---------------------------------------------
           SLEEP
        --------------------------------------------- */

        else if (
            lower.includes("sleep") ||
            lower.includes("nap") ||
            lower.includes("slept") ||
            lower.includes("asleep")
        ) {

            type =
                "sleep";

            icon =
                "😴";

            title =
                "Sleep";

            details =
                text;
        }


        /* ---------------------------------------------
           SAVE
        --------------------------------------------- */

        await addLog({

            type,

            title,

            details,

            icon

        });


        renderEverything();


        if (elements.voiceTranscript) {

            elements.voiceTranscript.classList.remove(
                "hidden"
            );
        }


        if (elements.voiceTranscriptText) {

            elements.voiceTranscriptText.textContent =
                text;
        }


        if (
            type === "diaper"
        ) {

            showToast(
                "Diaper logged.",
                "💧"
            );

        } else if (
            type === "feed"
        ) {

            showToast(
                "Feed logged.",
                "🍼"
            );

        } else if (
            type === "sleep"
        ) {

            showToast(
                "Sleep note logged.",
                "😴"
            );

        } else {

            showToast(
                "Note saved.",
                "📝"
            );
        }
    }


    /* =====================================================
       VOICE PERMISSION
    ===================================================== */

    function showVoicePermission() {

        elements.voicePermissionMessage?.classList.remove(
            "hidden"
        );


        if (
            elements.voicePermissionText
        ) {

            if (
                window.location.protocol !==
                "https:" &&
                window.location.hostname !==
                "localhost"
            ) {

                elements.voicePermissionText.textContent =
                    "Voice logging requires HTTPS or localhost. Open this site through your secure HTTPS address.";

            } else {

                elements.voicePermissionText.textContent =
                    "Please allow microphone access in Chrome, then try again.";
            }
        }
    }


    function hideVoicePermissionMessage() {

        elements.voicePermissionMessage?.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       EXPORT
    ===================================================== */

    async function exportData() {

        try {

            const backup = {

                version: 1,

                exportedAt:
                    new Date().toISOString(),

                settings: {
                    ...settings
                },

                logs: [
                    ...logs
                ]

            };


            const json =
                JSON.stringify(
                    backup,
                    null,
                    2
                );


            const blob =
                new Blob(
                    [json],
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


            const date =
                new Date()
                    .toISOString()
                    .slice(0, 10);


            link.href =
                url;


            link.download =
                `baby-tracker-backup-${date}.json`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () =>
                    URL.revokeObjectURL(url),
                1000
            );


            showToast(
                "Backup exported.",
                "⬇️"
            );

        } catch (error) {

            console.error(
                "Export error:",
                error
            );

            showToast(
                "Could not export backup.",
                "⚠️"
            );
        }
    }


    /* =====================================================
       IMPORT
    ===================================================== */

    async function handleImport(event) {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        try {

            const text =
                await file.text();


            const data =
                JSON.parse(text);


            if (
                !data ||
                !Array.isArray(data.logs)
            ) {

                throw new Error(
                    "Invalid backup file."
                );
            }


            const confirmed =
                window.confirm(
                    "Import this backup? Your current tracker data will be replaced."
                );


            if (!confirmed) {

                event.target.value =
                    "";

                return;
            }


            logs =
                data.logs;


            if (
                data.settings &&
                typeof data.settings ===
                "object"
            ) {

                settings = {

                    ...DEFAULT_SETTINGS,

                    ...data.settings

                };

            }


            await saveSettings();

            await saveLogs();


            activeSleepLog =
                logs.find(
                    log =>
                        log.type === "sleep" &&
                        log.status === "active"
                ) || null;


            renderEverything();


            initializeVoiceRecognition();


            if (activeSleepLog) {

                startSleepTimer();

            } else {

                stopSleepTimer();

            }


            showToast(
                "Backup imported.",
                "⬆️"
            );

        } catch (error) {

            console.error(
                "Import error:",
                error
            );


            showToast(
                "That backup file is not valid.",
                "⚠️"
            );

        } finally {

            event.target.value =
                "";
        }
    }


    /* =====================================================
       DELETE ALL DATA
    ===================================================== */

    function openDeleteModal() {

        closeAllModalsExcept(
            "delete"
        );


        elements.deleteDataModal?.classList.remove(
            "hidden"
        );

        elements.deleteDataModal?.setAttribute(
            "aria-hidden",
            "false"
        );


        currentModal =
            "delete";
    }


    function closeDeleteModal() {

        elements.deleteDataModal?.classList.add(
            "hidden"
        );

        elements.deleteDataModal?.setAttribute(
            "aria-hidden",
            "true"
        );


        if (
            currentModal ===
            "delete"
        ) {

            currentModal =
                null;
        }
    }


    async function deleteEverything() {

        try {

            logs = [];

            activeSleepLog = null;


            stopSleepTimer();


            settings = {
                ...DEFAULT_SETTINGS
            };


            await dbDelete("logs");

            await dbDelete("settings");


            await saveLogs();

            await saveSettings();


            renderEverything();

            initializeVoiceRecognition();


            closeDeleteModal();

            closeSettings();


            showToast(
                "All tracker data deleted.",
                "✓"
            );

        } catch (error) {

            console.error(
                "Delete error:",
                error
            );


            showToast(
                "Could not delete the data.",
                "⚠️"
            );
        }
    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout = null;


    function showToast(
        message,
        icon = "✓"
    ) {

        if (
            !elements.trackerToast
        ) {
            return;
        }


        if (
            elements.toastMessage
        ) {

            elements.toastMessage.textContent =
                message;
        }


        if (
            elements.toastIcon
        ) {

            elements.toastIcon.textContent =
                icon;
        }


        elements.trackerToast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimeout
        );


        toastTimeout =
            setTimeout(
                () => {

                    elements.trackerToast.classList.remove(
                        "show"
                    );

                },
                3000
            );
    }


    /* =====================================================
       TIME HELPERS
    ===================================================== */

    function formatTime(timestamp) {

        return new Date(
            timestamp
        ).toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }


    function calculateTimeDifference(
        start,
        end
    ) {

        const [
            startHours,
            startMinutes
        ] =
            start.split(":")
                .map(Number);


        const [
            endHours,
            endMinutes
        ] =
            end.split(":")
                .map(Number);


        let startTotal =
            startHours * 60 +
            startMinutes;


        let endTotal =
            endHours * 60 +
            endMinutes;


        /*
         Handles naps crossing midnight.
        */

        if (
            endTotal <= startTotal
        ) {

            endTotal +=
                24 * 60;
        }


        return (
            endTotal -
            startTotal
        ) * 60 * 1000;
    }


    function formatDuration(
        milliseconds
    ) {

        const totalMinutes =
            Math.floor(
                milliseconds /
                60000
            );


        const hours =
            Math.floor(
                totalMinutes /
                60
            );


        const minutes =
            totalMinutes %
            60;


        if (hours > 0) {

            return `${hours}h ${minutes}m`;

        }


        return `${minutes}m`;
    }


    function formatShortDuration(
        milliseconds
    ) {

        if (
            !milliseconds ||
            milliseconds <= 0
        ) {

            return "0m";
        }


        const minutes =
            Math.floor(
                milliseconds /
                60000
            );


        const hours =
            Math.floor(
                minutes /
                60
            );


        const remainingMinutes =
            minutes %
            60;


        if (hours > 0) {

            return `${hours}h ${remainingMinutes}m`;

        }


        return `${minutes}m`;
    }


    function formatClockDuration(
        milliseconds
    ) {

        const totalSeconds =
            Math.floor(
                milliseconds /
                1000
            );


        const hours =
            Math.floor(
                totalSeconds /
                3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );


        const seconds =
            totalSeconds %
            60;


        return [

            String(hours)
                .padStart(2, "0"),

            String(minutes)
                .padStart(2, "0"),

            String(seconds)
                .padStart(2, "0")

        ].join(":");
    }


    /* =====================================================
       ID
    ===================================================== */

    function generateId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
            "function"
        ) {

            return window.crypto.randomUUID();

        }


        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2)
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================================
       GLOBAL ERROR PROTECTION
       Prevent one unrelated error from killing the tracker.
    ===================================================== */

    window.addEventListener(
        "error",
        event => {

            console.error(
                "Baby Tracker runtime error:",
                event.error ||
                event.message
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        event => {

            console.error(
                "Baby Tracker promise error:",
                event.reason
            );

        }
    );

})();