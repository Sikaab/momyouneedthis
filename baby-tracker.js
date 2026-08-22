/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
   COMPLETE JAVASCRIPT
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const DB_NAME = "MomYouNeedThisBabyTracker";
    const DB_VERSION = 1;

    const LOG_STORE = "logs";
    const SETTINGS_STORE = "settings";

    const DEFAULT_SETTINGS = {
        babyName: "My Baby",
        voiceLanguage: "en-US",
        voiceConfirmation: true
    };

    let db = null;

    let settings = {
        ...DEFAULT_SETTINGS
    };

    let logs = [];

    let recognition = null;
    let isListening = false;

    let activeSleep = null;
    let sleepTimerInterval = null;

    let currentModal = null;

    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const $$ = (selector) => document.querySelectorAll(selector);

    function safeText(value) {
        return String(value ?? "").trim();
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        try {
            await openDatabase();
            await loadSettings();
            await loadLogs();

            initializeSpeechRecognition();
            bindEvents();

            updateBabyProfile();
            updateTodayDate();
            renderTimeline();
            updateSummary();
            restoreActiveSleep();

        } catch (error) {
            console.error("Baby Tracker initialization error:", error);
            showToast("Unable to load your tracker", "⚠️");
        }
    }

    /* =====================================================
       INDEXED DB
    ===================================================== */

    function openDatabase() {
        return new Promise((resolve, reject) => {

            if (!("indexedDB" in window)) {
                reject(new Error("IndexedDB is not supported."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {

                const database = event.target.result;

                if (!database.objectStoreNames.contains(LOG_STORE)) {
                    const logStore = database.createObjectStore(
                        LOG_STORE,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );

                    logStore.createIndex(
                        "date",
                        "date",
                        { unique: false }
                    );

                    logStore.createIndex(
                        "type",
                        "type",
                        { unique: false }
                    );

                    logStore.createIndex(
                        "timestamp",
                        "timestamp",
                        { unique: false }
                    );
                }

                if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
                    database.createObjectStore(
                        SETTINGS_STORE,
                        {
                            keyPath: "key"
                        }
                    );
                }
            };

            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    function dbTransaction(storeName, mode = "readonly") {
        return db
            .transaction(storeName, mode)
            .objectStore(storeName);
    }

    function saveLog(log) {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(LOG_STORE, "readwrite");

            const request = store.add(log);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    function updateLog(log) {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(LOG_STORE, "readwrite");

            const request = store.put(log);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    function deleteLogFromDB(id) {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(LOG_STORE, "readwrite");

            const request = store.delete(id);

            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);
        });
    }

    function getAllLogs() {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(LOG_STORE);

            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    function clearLogsDB() {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(LOG_STORE, "readwrite");

            const request = store.clear();

            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);
        });
    }

    function saveSetting(key, value) {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(SETTINGS_STORE, "readwrite");

            const request = store.put({
                key,
                value
            });

            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);
        });
    }

    function getSetting(key) {
        return new Promise((resolve, reject) => {

            const store = dbTransaction(SETTINGS_STORE);

            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result?.value);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function loadSettings() {

        const babyName = await getSetting("babyName");
        const voiceLanguage = await getSetting("voiceLanguage");
        const voiceConfirmation = await getSetting("voiceConfirmation");

        settings = {
            babyName:
                babyName !== undefined
                    ? babyName
                    : DEFAULT_SETTINGS.babyName,

            voiceLanguage:
                voiceLanguage !== undefined
                    ? voiceLanguage
                    : DEFAULT_SETTINGS.voiceLanguage,

            voiceConfirmation:
                voiceConfirmation !== undefined
                    ? voiceConfirmation
                    : DEFAULT_SETTINGS.voiceConfirmation
        };

        syncSettingsInputs();
    }

    async function loadLogs() {
        logs = await getAllLogs();

        logs.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }

    /* =====================================================
       DATE HELPERS
    ===================================================== */

    function dateKey(date = new Date()) {

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function isToday(timestamp) {
        return dateKey(new Date(timestamp)) === dateKey();
    }

    function formatTime(timestamp) {

        const date = new Date(timestamp);

        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }

    function formatDate(timestamp) {

        const date = new Date(timestamp);

        return date.toLocaleDateString(
            [],
            {
                month: "short",
                day: "numeric"
            }
        );
    }

    function updateTodayDate() {

        const element = $("todayDate");

        if (!element) return;

        element.textContent = new Date().toLocaleDateString(
            [],
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
    }

    /* =====================================================
       BABY PROFILE
    ===================================================== */

    function updateBabyProfile() {

        const display = $("babyNameDisplay");

        if (display) {
            display.textContent =
                settings.babyName || "My Baby";
        }

        const input = $("babyNameInput");

        if (input) {
            input.value =
                settings.babyName === "My Baby"
                    ? ""
                    : settings.babyName;
        }

        const modalInput = $("babyNameModalInput");

        if (modalInput) {
            modalInput.value =
                settings.babyName === "My Baby"
                    ? ""
                    : settings.babyName;
        }
    }

    function syncSettingsInputs() {

        const language = $("voiceLanguage");

        if (language) {
            language.value = settings.voiceLanguage;
        }

        const confirmation = $("voiceConfirmationToggle");

        if (confirmation) {
            confirmation.checked =
                Boolean(settings.voiceConfirmation);
        }

        updateBabyProfile();
    }

    async function saveBabyName(name) {

        const cleaned = safeText(name);

        settings.babyName =
            cleaned || "My Baby";

        await saveSetting(
            "babyName",
            settings.babyName
        );

        updateBabyProfile();

        showToast("Baby's name saved", "💗");
    }

    /* =====================================================
       LOG CREATION
    ===================================================== */

    function createLog({
        type,
        subtype = null,
        title,
        details = "",
        value = null,
        unit = null,
        timestamp = new Date(),
        source = "tap"
    }) {

        const date = new Date(timestamp);

        return {
            type,
            subtype,
            title,
            details,
            value,
            unit,
            timestamp: date.toISOString(),
            date: dateKey(date),
            source
        };
    }

    async function addLog(data) {

        const log = createLog(data);

        await saveLog(log);

        await loadLogs();

        renderTimeline();
        updateSummary();

        showToast(
            `${log.title} logged`,
            iconForType(log.type)
        );

        return log;
    }

    /* =====================================================
       LOG ICONS
    ===================================================== */

    function iconForType(type, subtype = null) {

        if (type === "feed") return "🍼";

        if (type === "diaper") {
            if (subtype === "dirty") return "💩";
            return "💧";
        }

        if (type === "sleep") return "😴";

        if (type === "note") return "📝";

        return "💗";
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
        }
    }

    /* =====================================================
       FEED MODAL
    ===================================================== */

    function openFeedModal() {

        openActionModal(`
            <div class="settings-header">

                <span class="tracker-badge">
                    🍼 FEEDING
                </span>

                <h2 id="modalContentTitle">
                    Log a feed
                </h2>

                <p>
                    Quickly record what your baby had.
                </p>

            </div>

            <form
                class="tracker-form"
                id="feedForm"
            >

                <div>
                    <label for="feedType">
                        What kind?
                    </label>

                    <select id="feedType">

                        <option value="bottle">
                            Bottle
                        </option>

                        <option value="breast">
                            Breastfeeding
                        </option>

                        <option value="solid">
                            Solid food
                        </option>

                    </select>
                </div>

                <div id="feedAmountGroup">

                    <label for="feedAmount">
                        Amount
                    </label>

                    <input
                        id="feedAmount"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="120"
                    >

                </div>

                <div id="feedUnitGroup">

                    <label for="feedUnit">
                        Unit
                    </label>

                    <select id="feedUnit">

                        <option value="ml">
                            ml
                        </option>

                        <option value="oz">
                            oz
                        </option>

                    </select>

                </div>

                <div id="breastSideGroup" class="hidden">

                    <label for="breastSide">
                        Side
                    </label>

                    <select id="breastSide">

                        <option value="left">
                            Left
                        </option>

                        <option value="right">
                            Right
                        </option>

                        <option value="both">
                            Both
                        </option>

                    </select>

                </div>

                <div id="breastDurationGroup" class="hidden">

                    <label for="breastDuration">
                        Duration in minutes
                    </label>

                    <input
                        id="breastDuration"
                        type="number"
                        min="1"
                        placeholder="15"
                    >

                </div>

                <div>
                    <label for="feedNotes">
                        Note <span>(optional)</span>
                    </label>

                    <textarea
                        id="feedNotes"
                        rows="2"
                        placeholder="Anything else?"
                    ></textarea>
                </div>

                <button
                    class="form-submit settings-primary-button"
                    type="submit"
                >
                    💗 Save Feed
                </button>

            </form>
        `);

        const feedType = $("feedType");

        feedType.addEventListener(
            "change",
            updateFeedForm
        );

        $("feedForm").addEventListener(
            "submit",
            submitFeedForm
        );

        updateFeedForm();
    }

    function updateFeedForm() {

        const type = $("feedType")?.value;

        const amountGroup = $("feedAmountGroup");
        const unitGroup = $("feedUnitGroup");
        const sideGroup = $("breastSideGroup");
        const durationGroup = $("breastDurationGroup");

        if (!amountGroup) return;

        if (type === "breast") {

            amountGroup.classList.add("hidden");
            unitGroup.classList.add("hidden");

            sideGroup.classList.remove("hidden");
            durationGroup.classList.remove("hidden");

        } else {

            amountGroup.classList.remove("hidden");
            unitGroup.classList.remove("hidden");

            sideGroup.classList.add("hidden");
            durationGroup.classList.add("hidden");
        }
    }

    async function submitFeedForm(event) {

        event.preventDefault();

        const type = $("feedType").value;

        const notes =
            safeText($("feedNotes").value);

        if (type === "breast") {

            const side =
                $("breastSide").value;

            const duration =
                Number($("breastDuration").value);

            if (!duration) {
                showToast(
                    "Enter the feeding duration",
                    "⚠️"
                );
                return;
            }

            await addLog({
                type: "feed",
                subtype: "breast",
                title: "Breastfeeding",
                details:
                    `${capitalize(side)} side • ${duration} min` +
                    (notes ? ` • ${notes}` : ""),
                value: duration,
                unit: "min"
            });

        } else {

            const amount =
                Number($("feedAmount").value);

            const unit =
                $("feedUnit").value;

            if (!amount) {

                await addLog({
                    type: "feed",
                    subtype: type,
                    title:
                        type === "bottle"
                            ? "Bottle feed"
                            : "Solid food",
                    details:
                        notes || "Feed logged"
                });

            } else {

                await addLog({
                    type: "feed",
                    subtype: type,
                    title:
                        type === "bottle"
                            ? "Bottle feed"
                            : "Solid food",
                    details:
                        `${amount} ${unit}` +
                        (notes ? ` • ${notes}` : ""),
                    value: amount,
                    unit
                });
            }
        }

        closeActionModal();
    }

    /* =====================================================
       DIAPER MODAL
    ===================================================== */

    function openDiaperModal() {

        openActionModal(`
            <div class="settings-header">

                <span class="tracker-badge">
                    💧 DIAPER
                </span>

                <h2 id="modalContentTitle">
                    Log a diaper
                </h2>

                <p>
                    Record a wet or dirty diaper.
                </p>

            </div>

            <form
                class="tracker-form"
                id="diaperForm"
            >

                <div>

                    <label for="diaperType">
                        Type
                    </label>

                    <select id="diaperType">

                        <option value="wet">
                            💧 Wet
                        </option>

                        <option value="dirty">
                            💩 Dirty
                        </option>

                        <option value="both">
                            💧💩 Wet + Dirty
                        </option>

                    </select>

                </div>

                <div>

                    <label for="diaperNotes">
                        Note <span>(optional)</span>
                    </label>

                    <textarea
                        id="diaperNotes"
                        rows="3"
                        placeholder="Anything to remember?"
                    ></textarea>

                </div>

                <button
                    class="form-submit settings-primary-button"
                    type="submit"
                >
                    💗 Save Diaper
                </button>

            </form>
        `);

        $("diaperForm").addEventListener(
            "submit",
            submitDiaperForm
        );
    }

    async function submitDiaperForm(event) {

        event.preventDefault();

        const type =
            $("diaperType").value;

        const notes =
            safeText($("diaperNotes").value);

        let title = "Wet diaper";
        let subtype = "wet";

        if (type === "dirty") {
            title = "Dirty diaper";
            subtype = "dirty";
        }

        if (type === "both") {
            title = "Wet + dirty diaper";
            subtype = "both";
        }

        await addLog({
            type: "diaper",
            subtype,
            title,
            details: notes
        });

        closeActionModal();
    }

    /* =====================================================
       NOTE MODAL
    ===================================================== */

    function openNoteModal() {

        openActionModal(`
            <div class="settings-header">

                <span class="tracker-badge">
                    📝 NOTE
                </span>

                <h2 id="modalContentTitle">
                    Add a note
                </h2>

                <p>
                    Save something you want to remember.
                </p>

            </div>

            <form
                class="tracker-form"
                id="noteForm"
            >

                <div>

                    <label for="noteText">
                        What happened?
                    </label>

                    <textarea
                        id="noteText"
                        rows="5"
                        placeholder="Write a quick note..."
                        required
                    ></textarea>

                </div>

                <button
                    class="form-submit settings-primary-button"
                    type="submit"
                >
                    📝 Save Note
                </button>

            </form>
        `);

        $("noteForm").addEventListener(
            "submit",
            submitNoteForm
        );

        setTimeout(() => {
            $("noteText")?.focus();
        }, 100);
    }

    async function submitNoteForm(event) {

        event.preventDefault();

        const text =
            safeText($("noteText").value);

        if (!text) return;

        await addLog({
            type: "note",
            title: "Note",
            details: text
        });

        closeActionModal();
    }

    /* =====================================================
       SLEEP
    ===================================================== */

    function handleSleepAction() {

        if (activeSleep) {

            endSleep();

        } else {

            startSleep();

        }
    }

    async function startSleep() {

        if (activeSleep) return;

        activeSleep = {
            startTime: new Date().toISOString()
        };

        localStorage.setItem(
            "momTrackerActiveSleep",
            JSON.stringify(activeSleep)
        );

        renderActiveSleep();

        showToast(
            "Nap started",
            "😴"
        );
    }

    async function endSleep() {

        if (!activeSleep) return;

        const start =
            new Date(activeSleep.startTime);

        const end =
            new Date();

        const duration =
            Math.max(
                1,
                Math.round(
                    (end - start) / 60000
                )
            );

        await addLog({
            type: "sleep",
            subtype: "nap",
            title: "Nap",
            details:
                `${formatDuration(duration)}`,
            value: duration,
            unit: "min",
            timestamp: end
        });

        activeSleep = null;

        localStorage.removeItem(
            "momTrackerActiveSleep"
        );

        renderActiveSleep();

        showToast(
            `Nap ended • ${formatDuration(duration)}`,
            "😴"
        );
    }

    function restoreActiveSleep() {

        try {

            const stored =
                localStorage.getItem(
                    "momTrackerActiveSleep"
                );

            if (!stored) return;

            const parsed =
                JSON.parse(stored);

            if (!parsed?.startTime) return;

            activeSleep = parsed;

            renderActiveSleep();

        } catch (error) {

            console.error(
                "Unable to restore sleep:",
                error
            );
        }
    }

    function renderActiveSleep() {

        const card =
            $("activeSleepCard");

        if (!card) return;

        if (!activeSleep) {

            card.classList.add("hidden");

            if (sleepTimerInterval) {
                clearInterval(sleepTimerInterval);
                sleepTimerInterval = null;
            }

            return;
        }

        card.classList.remove("hidden");

        updateSleepTimer();

        if (!sleepTimerInterval) {

            sleepTimerInterval =
                setInterval(
                    updateSleepTimer,
                    1000
                );
        }
    }

    function updateSleepTimer() {

        if (!activeSleep) return;

        const start =
            new Date(activeSleep.startTime);

        const seconds =
            Math.max(
                0,
                Math.floor(
                    (Date.now() - start.getTime()) / 1000
                )
            );

        const hours =
            Math.floor(seconds / 3600);

        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );

        const secs =
            seconds % 60;

        const element =
            $("sleepTimer");

        if (!element) return;

        element.textContent =
            [
                hours,
                minutes,
                secs
            ]
                .map(
                    number =>
                        String(number).padStart(2, "0")
                )
                .join(":");
    }

    function formatDuration(minutes) {

        const mins =
            Math.max(
                0,
                Math.round(Number(minutes) || 0)
            );

        const hours =
            Math.floor(mins / 60);

        const remaining =
            mins % 60;

        if (hours > 0) {

            return `${hours}h ${remaining}m`;

        }

        return `${remaining} min`;
    }

    /* =====================================================
       TIMELINE
    ===================================================== */

    function renderTimeline() {

        const timeline =
            $("timeline");

        const empty =
            $("emptyState");

        if (!timeline) return;

        const todayLogs =
            logs.filter(log => isToday(log.timestamp));

        const oldItems =
            timeline.querySelectorAll(
                ".timeline-item"
            );

        oldItems.forEach(item => item.remove());

        if (!todayLogs.length) {

            if (empty) {
                empty.classList.remove("hidden");
            }

            return;
        }

        if (empty) {
            empty.classList.add("hidden");
        }

        todayLogs.forEach(log => {

            const item =
                document.createElement("div");

            item.className =
                "timeline-item";

            item.dataset.id =
                String(log.id);

            item.innerHTML = `

                <div
                    class="timeline-icon"
                    aria-hidden="true"
                >
                    ${iconForType(
                        log.type,
                        log.subtype
                    )}
                </div>

                <div class="timeline-info">

                    <strong>
                        ${escapeHTML(log.title)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            log.details || ""
                        )}
                    </span>

                </div>

                <div class="timeline-time">

                    ${formatTime(
                        log.timestamp
                    )}

                </div>

                <button
                    type="button"
                    class="timeline-delete"
                    data-delete-log="${log.id}"
                    aria-label="Delete ${escapeHTML(log.title)}"
                >
                    ×
                </button>
            `;

            timeline.appendChild(item);
        });
    }

    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary() {

        const todayLogs =
            logs.filter(
                log => isToday(log.timestamp)
            );

        const feeds =
            todayLogs.filter(
                log => log.type === "feed"
            );

        const diapers =
            todayLogs.filter(
                log => log.type === "diaper"
            );

        const sleepMinutes =
            todayLogs
                .filter(
                    log => log.type === "sleep"
                )
                .reduce(
                    (total, log) =>
                        total +
                        Number(log.value || 0),
                    0
                );

        if ($("totalLogs")) {
            $("totalLogs").textContent =
                todayLogs.length;
        }

        if ($("feedCount")) {
            $("feedCount").textContent =
                feeds.length;
        }

        if ($("diaperCount")) {
            $("diaperCount").textContent =
                diapers.length;
        }

        if ($("sleepTotal")) {

            $("sleepTotal").textContent =
                formatShortDuration(
                    sleepMinutes
                );
        }
    }

    function formatShortDuration(minutes) {

        const total =
            Number(minutes) || 0;

        if (total < 60) {
            return `${Math.round(total)}m`;
        }

        const hours =
            Math.floor(total / 60);

        const mins =
            Math.round(total % 60);

        if (!mins) {
            return `${hours}h`;
        }

        return `${hours}h ${mins}m`;
    }

    /* =====================================================
       DELETE INDIVIDUAL LOG
    ===================================================== */

    async function deleteLog(id) {

        const log =
            logs.find(
                item => Number(item.id) === Number(id)
            );

        if (!log) return;

        const confirmed =
            window.confirm(
                `Delete "${log.title}" from today's tracker?`
            );

        if (!confirmed) return;

        await deleteLogFromDB(
            Number(id)
        );

        await loadLogs();

        renderTimeline();
        updateSummary();

        showToast(
            "Log deleted",
            "✓"
        );
    }

    /* =====================================================
       CLEAR TODAY
    ===================================================== */

    async function clearToday() {

        const todayLogs =
            logs.filter(
                log => isToday(log.timestamp)
            );

        if (!todayLogs.length) {

            showToast(
                "Nothing to clear",
                "ℹ️"
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Clear all ${todayLogs.length} logs from today?\n\nThis cannot be undone.`
            );

        if (!confirmed) return;

        for (const log of todayLogs) {
            await deleteLogFromDB(log.id);
        }

        await loadLogs();

        renderTimeline();
        updateSummary();

        showToast(
            "Today's logs cleared",
            "✓"
        );
    }

    /* =====================================================
       VOICE RECOGNITION
    ===================================================== */

    function initializeSpeechRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            disableVoiceButton();

            return;
        }

        recognition =
            new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.lang =
            settings.voiceLanguage;

        recognition.onstart = () => {

            isListening = true;

            updateVoiceUI(
                true
            );
        };

        recognition.onresult = (event) => {

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

            showTranscript(
                transcript
            );

            const latestResult =
                event.results[
                    event.results.length - 1
                ];

            if (latestResult?.isFinal) {

                handleVoiceTranscript(
                    transcript
                );
            }
        };

        recognition.onerror = (event) => {

            console.error(
                "Speech recognition error:",
                event.error
            );

            isListening = false;

            updateVoiceUI(false);

            handleVoiceError(
                event.error
            );
        };

        recognition.onend = () => {

            isListening = false;

            updateVoiceUI(false);
        };
    }

    function disableVoiceButton() {

        const button =
            $("voiceButton");

        if (!button) return;

        button.disabled = true;

        button.setAttribute(
            "aria-label",
            "Voice logging is not supported in this browser"
        );

        if ($("voiceStatusTitle")) {

            $("voiceStatusTitle")
                .textContent =
                "Voice logging unavailable";
        }

        if ($("voiceStatusText")) {

            $("voiceStatusText")
                .textContent =
                "Try Chrome or Safari on a supported device";
        }
    }

    function startVoiceRecognition() {

        if (!recognition) {

            showVoicePermission(
                "Your browser does not support voice recognition. Try a recent version of Chrome or Safari."
            );

            return;
        }

        if (isListening) {

            recognition.stop();

            return;
        }

        recognition.lang =
            settings.voiceLanguage;

        clearVoiceTranscript();

        try {

            recognition.start();

        } catch (error) {

            console.error(
                "Could not start recognition:",
                error
            );
        }
    }

    function updateVoiceUI(listening) {

        const button =
            $("voiceButton");

        const icon =
            $("voiceButtonIcon");

        const status =
            $("voiceStatus");

        const wave =
            $("voiceWave");

        if (!button) return;

        button.classList.toggle(
            "recording",
            listening
        );

        button.setAttribute(
            "aria-pressed",
            listening
                ? "true"
                : "false"
        );

        if (icon) {

            icon.textContent =
                listening
                    ? "⏹️"
                    : "🎙️";
        }

        if (status) {

            status.classList.toggle(
                "active",
                listening
            );
        }

        if (wave) {

            wave.classList.toggle(
                "active",
                listening
            );
        }

        if ($("voiceStatusTitle")) {

            $("voiceStatusTitle")
                .textContent =
                listening
                    ? "Listening..."
                    : "Tap & tell me";
        }

        if ($("voiceStatusText")) {

            $("voiceStatusText")
                .textContent =
                listening
                    ? "Tell me what happened"
                    : "“Baby had a wet diaper”";
        }
    }

    function showTranscript(text) {

        const container =
            $("voiceTranscript");

        const textElement =
            $("voiceTranscriptText");

        if (!container || !textElement) return;

        if (!text) return;

        container.classList.remove(
            "hidden"
        );

        textElement.textContent =
            text;
    }

    function clearVoiceTranscript() {

        const container =
            $("voiceTranscript");

        const textElement =
            $("voiceTranscriptText");

        if (container) {
            container.classList.add(
                "hidden"
            );
        }

        if (textElement) {
            textElement.textContent = "—";
        }
    }

    /* =====================================================
       VOICE PARSER
    ===================================================== */

    async function handleVoiceTranscript(
        transcript
    ) {

        const text =
            safeText(transcript);

        if (!text) return;

        if (settings.voiceConfirmation) {

            const confirmed =
                await showVoiceConfirmation(
                    text
                );

            if (!confirmed) {
                return;
            }
        }

        const parsed =
            parseVoiceCommand(text);

        if (!parsed) {

            await addLog({
                type: "note",
                title: "Voice note",
                details: text,
                source: "voice"
            });

            return;
        }

        await addLog({
            ...parsed,
            source: "voice"
        });
    }

    function parseVoiceCommand(originalText) {

        const original =
            safeText(originalText);

        const lower =
            original.toLowerCase();

        const normalized =
            lower
                .replace(/,/g, ".")
                .replace(/\s+/g, " ")
                .trim();

        /* ---------------------------------------------
           DIAPER
        --------------------------------------------- */

        const diaperWords = [
            "diaper",
            "nappy",
            "wet diaper",
            "dirty diaper",
            "poop",
            "pooped",
            "poopy",
            "caca",
            "couche",
            "mouillée",
            "mouillee",
            "sale",
            "pipi"
        ];

        const hasDiaper =
            diaperWords.some(
                word =>
                    normalized.includes(word)
            );

        if (hasDiaper) {

            let subtype = "wet";
            let title = "Wet diaper";

            const dirty =
                [
                    "dirty",
                    "poop",
                    "pooped",
                    "poopy",
                    "caca",
                    "sale"
                ].some(
                    word =>
                        normalized.includes(word)
                );

            const wet =
                [
                    "wet",
                    "pipi",
                    "mouille",
                    "mouillée"
                ].some(
                    word =>
                        normalized.includes(word)
                );

            if (dirty && wet) {

                subtype = "both";
                title = "Wet + dirty diaper";

            } else if (dirty) {

                subtype = "dirty";
                title = "Dirty diaper";
            }

            return {
                type: "diaper",
                subtype,
                title,
                details: cleanVoiceDetails(
                    original,
                    [
                        "diaper",
                        "nappy",
                        "wet",
                        "dirty",
                        "poop",
                        "pooped",
                        "poopy",
                        "couche",
                        "sale",
                        "pipi"
                    ]
                )
            };
        }

        /* ---------------------------------------------
           BREASTFEEDING
        --------------------------------------------- */

        const breastfeedingWords = [
            "nursed",
            "nursing",
            "breastfed",
            "breastfeeding",
            "breast fed",
            "breast feeding",
            "nursed on",
            "nourri au sein",
            "allaité",
            "allaite",
            "tété",
            "tete"
        ];

        const breastfeeding =
            breastfeedingWords.some(
                word =>
                    normalized.includes(word)
            );

        if (breastfeeding) {

            const minutes =
                extractMinutes(normalized);

            const side =
                extractBreastSide(normalized);

            let details = "";

            if (side) {
                details +=
                    `${capitalize(side)} side`;
            }

            if (minutes) {

                if (details) {
                    details += " • ";
                }

                details +=
                    `${minutes} min`;
            }

            if (!details) {
                details = original;
            }

            return {
                type: "feed",
                subtype: "breast",
                title: "Breastfeeding",
                details
            };
        }

        /* ---------------------------------------------
           BOTTLE / MILK
        --------------------------------------------- */

        const bottleWords = [
            "bottle",
            "formula",
            "milk",
            "ml",
            "milliliter",
            "milliliters",
            "millilitre",
            "millilitres",
            "ounce",
            "ounces",
            " oz"
        ];

        const hasBottle =
            bottleWords.some(
                word =>
                    normalized.includes(word)
            );

        if (hasBottle) {

            const amount =
                extractAmount(normalized);

            const unit =
                extractUnit(normalized);

            let details = "";

            if (amount) {

                details =
                    `${amount} ${unit || "ml"}`;

            } else {

                details =
                    original;
            }

            return {
                type: "feed",
                subtype: "bottle",
                title: "Bottle feed",
                details,
                value: amount || null,
                unit: unit || null
            };
        }

        /* ---------------------------------------------
           FOOD / SOLIDS
        --------------------------------------------- */

        const foodWords = [
            "ate",
            "eating",
            "food",
            "solid",
            "solids",
            "déjeuner",
            "mangé",
            "mange"
        ];

        if (
            foodWords.some(
                word =>
                    normalized.includes(word)
            )
        ) {

            return {
                type: "feed",
                subtype: "solid",
                title: "Solid food",
                details: original
            };
        }

        /* ---------------------------------------------
           SLEEP
        --------------------------------------------- */

        const sleepWords = [
            "sleep",
            "slept",
            "nap",
            "napped",
            "asleep",
            "sieste",
            "dormi",
            "dort",
            "endormi",
            "sommeil"
        ];

        if (
            sleepWords.some(
                word =>
                    normalized.includes(word)
            )
        ) {

            const minutes =
                extractMinutes(normalized);

            if (
                normalized.includes("started") ||
                normalized.includes("start") ||
                normalized.includes("going to sleep") ||
                normalized.includes("s'endort") ||
                normalized.includes("commencé")
            ) {

                if (!activeSleep) {
                    startSleep();
                }

                return null;
            }

            if (
                normalized.includes("woke") ||
                normalized.includes("wake") ||
                normalized.includes("ended") ||
                normalized.includes("finished") ||
                normalized.includes("réveillé") ||
                normalized.includes("reveillé")
            ) {

                if (activeSleep) {
                    endSleep();
                }

                return null;
            }

            if (minutes) {

                return {
                    type: "sleep",
                    subtype: "nap",
                    title: "Nap",
                    details:
                        formatDuration(minutes),
                    value: minutes,
                    unit: "min"
                };
            }

            return {
                type: "note",
                title: "Sleep note",
                details: original
            };
        }

        /* ---------------------------------------------
           NOTE FALLBACK
        --------------------------------------------- */

        return {
            type: "note",
            title: "Voice note",
            details: original
        };
    }

    function extractMinutes(text) {

        const match =
            text.match(
                /(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|minute|minutes)/i
            );

        if (!match) return null;

        return Number(match[1]);
    }

    function extractAmount(text) {

        const match =
            text.match(
                /(\d+(?:\.\d+)?)\s*(ml|milliliters?|millilitres?|oz|ounces?)/i
            );

        if (match) {
            return Number(match[1]);
        }

        return null;
    }

    function extractUnit(text) {

        if (
            /\b(oz|ounce|ounces)\b/i.test(text)
        ) {
            return "oz";
        }

        if (
            /\b(ml|milliliter|milliliters|millilitre|millilitres)\b/i.test(text)
        ) {
            return "ml";
        }

        return null;
    }

    function extractBreastSide(text) {

        if (
            /\b(left|gauche)\b/i.test(text)
        ) {
            return "left";
        }

        if (
            /\b(right|droite)\b/i.test(text)
        ) {
            return "right";
        }

        if (
            /\b(both|les deux|deux)\b/i.test(text)
        ) {
            return "both";
        }

        return null;
    }

    function cleanVoiceDetails(
        text,
        words
    ) {

        let result =
            safeText(text);

        words.forEach(word => {

            result =
                result.replace(
                    new RegExp(
                        `\\b${escapeRegex(word)}\\b`,
                        "gi"
                    ),
                    ""
                );
        });

        result =
            result
                .replace(/\s+/g, " ")
                .replace(/^[\s•,.-]+|[\s•,.-]+$/g, "");

        return result || "";
    }

    function escapeRegex(value) {

        return String(value)
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );
    }

    /* =====================================================
       VOICE CONFIRMATION
    ===================================================== */

    function showVoiceConfirmation(
        transcript
    ) {

        return new Promise(resolve => {

            const confirmed =
                window.confirm(
                    `I heard:\n\n“${transcript}”\n\nSave this to the tracker?`
                );

            resolve(confirmed);
        });
    }

    function handleVoiceError(error) {

        let message =
            "Something went wrong with voice logging.";

        if (
            error === "not-allowed" ||
            error === "service-not-allowed"
        ) {

            message =
                "Please allow microphone access in your browser.";
        }

        if (error === "no-speech") {

            message =
                "I didn't hear anything. Try again.";
        }

        if (error === "audio-capture") {

            message =
                "Your microphone could not be accessed.";
        }

        showVoicePermission(message);
    }

    function showVoicePermission(message) {

        const box =
            $("voicePermissionMessage");

        const text =
            $("voicePermissionText");

        if (!box) return;

        if (text) {
            text.textContent = message;
        }

        box.classList.remove(
            "hidden"
        );
    }

    /* =====================================================
       VOICE EXAMPLE BUTTONS
    ===================================================== */

    function handleVoiceExample(text) {

        if (!text) return;

        showTranscript(text);

        handleVoiceTranscript(
            text
        );
    }

    /* =====================================================
       MODALS
    ===================================================== */

    function openActionModal(html) {

        const modal =
            $("actionModal");

        const content =
            $("modalContent");

        if (!modal || !content) return;

        content.innerHTML = html;

        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        currentModal =
            "action";

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeActionModal() {

        const modal =
            $("actionModal");

        if (!modal) return;

        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        $("modalContent").innerHTML = "";

        currentModal = null;

        updateBodyModalState();
    }

    function openSettings() {

        const modal =
            $("settingsModal");

        if (!modal) return;

        syncSettingsInputs();

        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        $("settingsButton")?.setAttribute(
            "aria-expanded",
            "true"
        );

        currentModal =
            "settings";

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeSettings() {

        const modal =
            $("settingsModal");

        if (!modal) return;

        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        $("settingsButton")?.setAttribute(
            "aria-expanded",
            "false"
        );

        currentModal = null;

        updateBodyModalState();
    }

    function openBabyNameModal() {

        const modal =
            $("babyNameModal");

        if (!modal) return;

        const input =
            $("babyNameModalInput");

        if (input) {
            input.value =
                settings.babyName === "My Baby"
                    ? ""
                    : settings.babyName;
        }

        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        currentModal =
            "babyName";

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(() => {
            input?.focus();
        }, 100);
    }

    function closeBabyNameModal() {

        const modal =
            $("babyNameModal");

        if (!modal) return;

        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        currentModal = null;

        updateBodyModalState();
    }

    function openDeleteModal() {

        const modal =
            $("deleteDataModal");

        if (!modal) return;

        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        currentModal =
            "delete";

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeDeleteModal() {

        const modal =
            $("deleteDataModal");

        if (!modal) return;

        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        currentModal = null;

        updateBodyModalState();
    }

    function updateBodyModalState() {

        const anyOpen =
            [
                "actionModal",
                "settingsModal",
                "babyNameModal",
                "deleteDataModal"
            ]
                .some(id => {
                    const element = $(id);

                    return (
                        element &&
                        !element.classList.contains(
                            "hidden"
                        )
                    );
                });

        document.body.classList.toggle(
            "modal-open",
            anyOpen
        );
    }

    /* =====================================================
       SETTINGS
    ===================================================== */

    async function saveVoiceLanguage() {

        const select =
            $("voiceLanguage");

        if (!select) return;

        settings.voiceLanguage =
            select.value;

        await saveSetting(
            "voiceLanguage",
            settings.voiceLanguage
        );

        if (recognition) {
            recognition.lang =
                settings.voiceLanguage;
        }

        showToast(
            "Voice language updated",
            "🎙️"
        );
    }

    async function saveVoiceConfirmation() {

        const toggle =
            $("voiceConfirmationToggle");

        if (!toggle) return;

        settings.voiceConfirmation =
            toggle.checked;

        await saveSetting(
            "voiceConfirmation",
            settings.voiceConfirmation
        );

        showToast(
            settings.voiceConfirmation
                ? "Voice confirmation on"
                : "Voice confirmation off",
            "✓"
        );
    }

    /* =====================================================
       EXPORT
    ===================================================== */

    async function exportData() {

        await loadLogs();

        const backup = {
            app: "MomYouNeedThis Baby Tracker",
            version: 1,
            exportedAt:
                new Date().toISOString(),

            settings: {
                ...settings
            },

            logs: logs
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
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        const date =
            dateKey();

        link.href = url;

        link.download =
            `baby-tracker-backup-${date}.json`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showToast(
            "Backup exported",
            "⬇️"
        );
    }

    /* =====================================================
       IMPORT
    ===================================================== */

    function triggerImport() {

        const input =
            $("importDataInput");

        input?.click();
    }

    async function importDataFile(file) {

        if (!file) return;

        try {

            const text =
                await file.text();

            const backup =
                JSON.parse(text);

            if (
                !backup ||
                !Array.isArray(
                    backup.logs
                )
            ) {

                throw new Error(
                    "Invalid backup file."
                );
            }

            const confirmed =
                window.confirm(
                    `Import ${backup.logs.length} logs?\n\nThis will add them to your existing tracker data.`
                );

            if (!confirmed) return;

            if (backup.settings) {

                if (
                    typeof backup.settings.babyName ===
                    "string"
                ) {

                    settings.babyName =
                        backup.settings.babyName;

                    await saveSetting(
                        "babyName",
                        settings.babyName
                    );
                }

                if (
                    typeof backup.settings.voiceLanguage ===
                    "string"
                ) {

                    settings.voiceLanguage =
                        backup.settings.voiceLanguage;

                    await saveSetting(
                        "voiceLanguage",
                        settings.voiceLanguage
                    );
                }

                if (
                    typeof backup.settings.voiceConfirmation ===
                    "boolean"
                ) {

                    settings.voiceConfirmation =
                        backup.settings.voiceConfirmation;

                    await saveSetting(
                        "voiceConfirmation",
                        settings.voiceConfirmation
                    );
                }
            }

            let imported = 0;

            for (
                const backupLog of backup.logs
            ) {

                if (!backupLog.timestamp) {
                    continue;
                }

                const timestamp =
                    new Date(
                        backupLog.timestamp
                    );

                if (
                    Number.isNaN(
                        timestamp.getTime()
                    )
                ) {
                    continue;
                }

                await saveLog({
                    type:
                        backupLog.type ||
                        "note",

                    subtype:
                        backupLog.subtype ||
                        null,

                    title:
                        backupLog.title ||
                        "Imported note",

                    details:
                        backupLog.details ||
                        "",

                    value:
                        backupLog.value ??
                        null,

                    unit:
                        backupLog.unit ??
                        null,

                    timestamp:
                        timestamp.toISOString(),

                    date:
                        dateKey(timestamp),

                    source:
                        backupLog.source ||
                        "import"
                });

                imported++;
            }

            await loadSettings();
            await loadLogs();

            updateBabyProfile();
            updateTodayDate();
            renderTimeline();
            updateSummary();

            showToast(
                `${imported} logs imported`,
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
    }

    /* =====================================================
       DELETE ALL DATA
    ===================================================== */

    async function deleteAllData() {

        const confirmed =
            window.confirm(
                "Delete ALL baby tracker data from this device?\n\nThis cannot be undone."
            );

        if (!confirmed) return;

        await clearLogsDB();

        const store =
            dbTransaction(
                SETTINGS_STORE,
                "readwrite"
            );

        await new Promise(
            (resolve, reject) => {

                const request =
                    store.clear();

                request.onsuccess =
                    () => resolve();

                request.onerror =
                    () => reject(
                        request.error
                    );
            }
        );

        localStorage.removeItem(
            "momTrackerActiveSleep"
        );

        settings = {
            ...DEFAULT_SETTINGS
        };

        logs = [];

        activeSleep = null;

        renderActiveSleep();
        updateBabyProfile();
        renderTimeline();
        updateSummary();
        syncSettingsInputs();

        closeDeleteModal();
        closeSettings();

        showToast(
            "All tracker data deleted",
            "✓"
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

        const messageElement =
            $("toastMessage");

        const iconElement =
            $("toastIcon");

        if (!toast) return;

        if (messageElement) {
            messageElement.textContent =
                message;
        }

        if (iconElement) {
            iconElement.textContent =
                icon;
        }

        toast.classList.add(
            "show"
        );

        clearTimeout(
            toastTimeout
        );

        toastTimeout =
            setTimeout(
                () => {
                    toast.classList.remove(
                        "show"
                    );
                },
                3000
            );
    }

    /* =====================================================
       EVENT BINDING
    ===================================================== */

    function bindEvents() {

        /* ---------------------------------------------
           VOICE
        --------------------------------------------- */

        $("voiceButton")?.addEventListener(
            "click",
            startVoiceRecognition
        );

        $$(
            ".voice-example"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    handleVoiceExample(
                        button.dataset.voiceExample
                    );
                }
            );
        });

        $("voicePermissionClose")
            ?.addEventListener(
                "click",
                () => {

                    $("voicePermissionMessage")
                        ?.classList.add(
                            "hidden"
                        );
                }
            );

        /* ---------------------------------------------
           QUICK ACTIONS
        --------------------------------------------- */

        $$(
            ".quick-action"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    handleQuickAction(
                        button.dataset.action
                    );
                }
            );
        });

        /* ---------------------------------------------
           ACTIVE SLEEP
        --------------------------------------------- */

        $("endSleepButton")
            ?.addEventListener(
                "click",
                endSleep
            );

        /* ---------------------------------------------
           TIMELINE
        --------------------------------------------- */

        $("clearTodayButton")
            ?.addEventListener(
                "click",
                clearToday
            );

        $("timeline")
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-delete-log]"
                        );

                    if (!button) return;

                    deleteLog(
                        Number(
                            button.dataset.deleteLog
                        )
                    );
                }
            );

        /* ---------------------------------------------
           SETTINGS
        --------------------------------------------- */

        $("settingsButton")
            ?.addEventListener(
                "click",
                openSettings
            );

        $("settingsClose")
            ?.addEventListener(
                "click",
                closeSettings
            );

        $$(
            "[data-close-settings]"
        ).forEach(element => {

            element.addEventListener(
                "click",
                closeSettings
            );
        });

        $("saveBabyNameButton")
            ?.addEventListener(
                "click",
                async () => {

                    await saveBabyName(
                        $("babyNameInput")?.value
                    );
                }
            );

        $("voiceLanguage")
            ?.addEventListener(
                "change",
                saveVoiceLanguage
            );

        $("voiceConfirmationToggle")
            ?.addEventListener(
                "change",
                saveVoiceConfirmation
            );

        $("settingsExportButton")
            ?.addEventListener(
                "click",
                exportData
            );

        $("settingsImportButton")
            ?.addEventListener(
                "click",
                triggerImport
            );

        $("deleteAllDataButton")
            ?.addEventListener(
                "click",
                openDeleteModal
            );

        /* ---------------------------------------------
           BABY PROFILE
        --------------------------------------------- */

        $("editBabyButton")
            ?.addEventListener(
                "click",
                openBabyNameModal
            );

        $("babyNameModalClose")
            ?.addEventListener(
                "click",
                closeBabyNameModal
            );

        $$(
            "[data-close-baby-name]"
        ).forEach(element => {

            element.addEventListener(
                "click",
                closeBabyNameModal
            );
        });

        $("babyNameForm")
            ?.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    await saveBabyName(
                        $("babyNameModalInput")
                            ?.value
                    );

                    closeBabyNameModal();
                }
            );

        /* ---------------------------------------------
           ACTION MODAL
        --------------------------------------------- */

        $("modalClose")
            ?.addEventListener(
                "click",
                closeActionModal
            );

        $$(
            "[data-close-modal]"
        ).forEach(element => {

            element.addEventListener(
                "click",
                closeActionModal
            );
        });

        /* ---------------------------------------------
           DELETE MODAL
        --------------------------------------------- */

        $("cancelDeleteButton")
            ?.addEventListener(
                "click",
                closeDeleteModal
            );

        $("confirmDeleteButton")
            ?.addEventListener(
                "click",
                deleteAllData
            );

        $$(
            "[data-close-delete]"
        ).forEach(element => {

            element.addEventListener(
                "click",
                closeDeleteModal
            );
        });

        /* ---------------------------------------------
           BACKUP
        --------------------------------------------- */

        $("exportDataButton")
            ?.addEventListener(
                "click",
                exportData
            );

        $("importDataButton")
            ?.addEventListener(
                "click",
                triggerImport
            );

        $("importDataInput")
            ?.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target.files?.[0];

                    await importDataFile(file);

                    event.target.value = "";
                }
            );

        /* ---------------------------------------------
           ESCAPE
        --------------------------------------------- */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                if (
                    currentModal ===
                    "action"
                ) {
                    closeActionModal();
                }

                else if (
                    currentModal ===
                    "settings"
                ) {
                    closeSettings();
                }

                else if (
                    currentModal ===
                    "babyName"
                ) {
                    closeBabyNameModal();
                }

                else if (
                    currentModal ===
                    "delete"
                ) {
                    closeDeleteModal();
                }
            }
        );
    }

    /* =====================================================
       UTILITY
    ===================================================== */

    function capitalize(value) {

        const text =
            safeText(value);

        if (!text) return "";

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
    }

})();