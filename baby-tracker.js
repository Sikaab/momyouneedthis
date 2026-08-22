/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
========================================================= */


/* =========================================================
   DATABASE
========================================================= */

const DB_NAME = "MomYouNeedThisBabyTracker";
const DB_VERSION = 1;

const LOG_STORE = "logs";
const SETTINGS_STORE = "settings";

let db = null;
let logs = [];

let activeSleep = null;
let sleepTimerInterval = null;

let recognition = null;
let isListening = false;

let toastTimeout;


/* =========================================================
   ELEMENTS
========================================================= */

const timeline =
    document.getElementById("timeline");

const actionModal =
    document.getElementById("actionModal");

const modalContent =
    document.getElementById("modalContent");

const modalClose =
    document.getElementById("modalClose");

const toast =
    document.getElementById("trackerToast");

const toastMessage =
    document.getElementById("toastMessage");

const toastIcon =
    document.getElementById("toastIcon");


/* =========================================================
   DATABASE
========================================================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = event => {

            const database =
                event.target.result;


            if (
                !database.objectStoreNames.contains(
                    LOG_STORE
                )
            ) {

                const logStore =
                    database.createObjectStore(
                        LOG_STORE,
                        {
                            keyPath: "id"
                        }
                    );


                logStore.createIndex(
                    "date",
                    "date",
                    {
                        unique: false
                    }
                );


                logStore.createIndex(
                    "timestamp",
                    "timestamp",
                    {
                        unique: false
                    }
                );

            }


            if (
                !database.objectStoreNames.contains(
                    SETTINGS_STORE
                )
            ) {

                database.createObjectStore(
                    SETTINGS_STORE,
                    {
                        keyPath: "key"
                    }
                );

            }

        };


        request.onsuccess = event => {

            db =
                event.target.result;

            resolve(db);

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


/* =========================================================
   DATABASE HELPERS
========================================================= */

function dbGetAllLogs() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                LOG_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                LOG_STORE
            );


        const request =
            store.getAll();


        request.onsuccess = () => {

            resolve(
                request.result || []
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


function dbPutLog(log) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                LOG_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                LOG_STORE
            );


        const request =
            store.put(log);


        request.onsuccess = () => {

            resolve();

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


function dbDeleteLog(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                LOG_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                LOG_STORE
            );


        const request =
            store.delete(id);


        request.onsuccess = () => {

            resolve();

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


function dbClearLogs() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                LOG_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                LOG_STORE
            );


        const request =
            store.clear();


        request.onsuccess = () => {

            resolve();

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


function dbGetSetting(key) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                SETTINGS_STORE,
                "readonly"
            );


        const store =
            transaction.objectStore(
                SETTINGS_STORE
            );


        const request =
            store.get(key);


        request.onsuccess = () => {

            resolve(
                request.result?.value ?? null
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


function dbSetSetting(key, value) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                SETTINGS_STORE,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                SETTINGS_STORE
            );


        const request =
            store.put({
                key,
                value
            });


        request.onsuccess = () => {

            resolve();

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeTracker() {

    try {

        await openDatabase();


        logs =
            await dbGetAllLogs();


        const savedSleep =
            await dbGetSetting(
                "activeSleep"
            );


        if (savedSleep) {

            activeSleep =
                savedSleep;

        }


        render();

        restoreActiveSleep();

        setupVoiceRecognition();

        setupButtons();

        setupSettings();

        /*
           Backup controls are NOT initialized here.
           They are initialized when Settings is opened.
        */

    } catch (error) {

        console.error(
            "Baby Tracker initialization failed:",
            error
        );


        showToast(
            "⚠️",
            "Unable to load your tracker"
        );

    }

}


/* =========================================================
   ID
========================================================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


/* =========================================================
   DATE
========================================================= */

function todayKey(
    date = new Date()
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatTime(date) {

    return new Date(date)
        .toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

}


function formatToday() {

    return new Date()
        .toLocaleDateString(
            [],
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );

}


/* =========================================================
   ADD LOG
========================================================= */

async function addLog(
    type,
    details = {}
) {

    const now =
        new Date();


    const log = {

        id:
            createId(),

        type,

        timestamp:
            now.toISOString(),

        date:
            todayKey(now),

        ...details

    };


    logs.push(log);


    await dbPutLog(log);


    render();


    showToast(
        getLogIcon(log),
        getLogTitle(log)
    );

}


/* =========================================================
   LOG HELPERS
========================================================= */

function getLogIcon(log) {

    const icons = {

        feed: "🍼",

        diaper: "💧",

        sleep: "😴",

        note: "📝"

    };


    return (
        icons[log.type] ||
        "💗"
    );

}


function getLogTitle(log) {

    if (
        log.type === "feed"
    ) {

        if (
            log.method === "breast"
        ) {

            return (
                `Breastfeeding · ${
                    log.side || "Both"
                }`
            );

        }


        if (
            log.method === "bottle"
        ) {

            return (
                `Bottle · ${
                    log.amount || 0
                } ${
                    log.unit || "ml"
                }`
            );

        }


        return "Feeding";

    }


    if (
        log.type === "diaper"
    ) {

        return (
            `${capitalize(log.kind)} diaper`
        );

    }


    if (
        log.type === "sleep"
    ) {

        return "Nap";

    }


    if (
        log.type === "note"
    ) {

        return (
            log.text ||
            "Note"
        );

    }


    return "Activity";

}


function getLogDetails(log) {

    if (
        log.type === "feed"
    ) {

        if (
            log.method === "breast"
        ) {

            return (
                `${log.side || "Both"}${
                    log.duration
                        ? ` · ${log.duration} min`
                        : ""
                }`
            );

        }


        if (
            log.method === "bottle"
        ) {

            return (
                `${log.amount || 0} ${
                    log.unit || "ml"
                }`
            );

        }

    }


    if (
        log.type === "diaper"
    ) {

        if (
            log.kind === "wet"
        ) {

            return "Wet";

        }


        if (
            log.kind === "dirty"
        ) {

            return "Dirty";

        }


        return "Wet + dirty";

    }


    if (
        log.type === "sleep"
    ) {

        return log.duration
            ? formatDuration(
                log.duration
            )
            : "Sleep";

    }


    return "";

}


/* =========================================================
   UTILITIES
========================================================= */

function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function formatDuration(minutes) {

    if (!minutes) {

        return "0m";

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const mins =
        minutes % 60;


    if (hours) {

        return `${hours}h ${mins}m`;

    }


    return `${mins}m`;

}


/* =========================================================
   TODAY
========================================================= */

function getTodayLogs() {

    const today =
        todayKey();


    return logs

        .filter(
            log =>
                log.date === today
        )

        .sort(
            (a, b) =>
                new Date(
                    b.timestamp
                ) -
                new Date(
                    a.timestamp
                )
        );

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    renderDate();

    renderTimeline();

    renderSummary();

    renderSleepState();

}


function renderDate() {

    const date =
        document.getElementById(
            "todayDate"
        );


    if (date) {

        date.textContent =
            formatToday();

    }

}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline() {

    if (!timeline) return;


    const todayLogs =
        getTodayLogs();


    timeline.innerHTML = "";


    if (!todayLogs.length) {

        timeline.appendChild(
            createEmptyState()
        );

        return;

    }


    todayLogs.forEach(
        log => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "timeline-item";


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
                getLogTitle(log);


            const details =
                document.createElement(
                    "span"
                );


            details.textContent =
                getLogDetails(log);


            info.appendChild(
                title
            );


            if (
                details.textContent
            ) {

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


            deleteButton.className =
                "timeline-delete";


            deleteButton.type =
                "button";


            deleteButton.textContent =
                "×";


            deleteButton.setAttribute(
                "aria-label",
                "Delete log"
            );


            deleteButton.addEventListener(
                "click",
                () =>
                    deleteLog(
                        log.id
                    )
            );


            item.appendChild(icon);

            item.appendChild(info);

            item.appendChild(time);

            item.appendChild(
                deleteButton
            );


            timeline.appendChild(item);

        }
    );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function createEmptyState() {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "empty-state";


    wrapper.innerHTML = `

        <div class="empty-state-icon">
            🌸
        </div>

        <h3>
            Your day starts here
        </h3>

        <p>
            Tap the microphone and simply
            tell me what happened.
        </p>

    `;


    return wrapper;

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

    const todayLogs =
        getTodayLogs();


    const total =
        document.getElementById(
            "totalLogs"
        );


    const feeds =
        document.getElementById(
            "feedCount"
        );


    const diapers =
        document.getElementById(
            "diaperCount"
        );


    const sleep =
        document.getElementById(
            "sleepTotal"
        );


    if (total) {

        total.textContent =
            todayLogs.length;

    }


    if (feeds) {

        feeds.textContent =
            todayLogs.filter(
                log =>
                    log.type === "feed"
            ).length;

    }


    if (diapers) {

        diapers.textContent =
            todayLogs.filter(
                log =>
                    log.type === "diaper"
            ).length;

    }


    const sleepMinutes =
        todayLogs

            .filter(
                log =>
                    log.type === "sleep"
            )

            .reduce(
                (
                    total,
                    log
                ) =>
                    total +
                    (
                        log.duration ||
                        0
                    ),
                0
            );


    if (sleep) {

        sleep.textContent =
            formatDuration(
                sleepMinutes
            );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteLog(id) {

    logs =
        logs.filter(
            log =>
                log.id !== id
        );


    await dbDeleteLog(id);


    render();


    showToast(
        "✓",
        "Log removed"
    );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(content) {

    if (!actionModal) return;


    modalContent.innerHTML =
        content;


    actionModal.classList.remove(
        "hidden"
    );

}


function closeModal() {

    if (!actionModal) return;


    actionModal.classList.add(
        "hidden"
    );

}


if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeModal
    );

}


if (actionModal) {

    actionModal.addEventListener(
        "click",
        event => {

            if (
                event.target.hasAttribute(
                    "data-close-modal"
                )
            ) {

                closeModal();

            }

        }
    );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupButtons() {

    document
        .querySelectorAll(
            ".quick-action"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        if (
                            action === "feed"
                        ) {

                            openFeedModal();

                        }


                        if (
                            action === "diaper"
                        ) {

                            openDiaperModal();

                        }


                        if (
                            action === "sleep"
                        ) {

                            openSleepModal();

                        }


                        if (
                            action === "note"
                        ) {

                            openNoteModal();

                        }

                    }
                );

            }
        );


    const voiceButton =
        document.getElementById(
            "voiceButton"
        );


    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            toggleVoice
        );

    }


    const endSleepButton =
        document.getElementById(
            "endSleepButton"
        );


    if (endSleepButton) {

        endSleepButton.addEventListener(
            "click",
            endSleep
        );

    }


    const clearButton =
        document.getElementById(
            "clearTodayButton"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearToday
        );

    }

}


/* =========================================================
   FEED
========================================================= */

function openFeedModal() {

    openModal(`

        <h2>🍼 Feeding</h2>

        <p class="modal-subtitle">
            What kind of feed?
        </p>

        <div class="modal-options">

            <button
                class="modal-option"
                data-feed="breast">

                🤱 Breastfeeding

            </button>

            <button
                class="modal-option"
                data-feed="bottle">

                🍼 Bottle

            </button>

        </div>

    `);


    document
        .querySelectorAll(
            "[data-feed]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            button.dataset.feed ===
                            "breast"
                        ) {

                            openBreastModal();

                        } else {

                            openBottleModal();

                        }

                    }
                );

            }
        );

}


/* =========================================================
   BREAST
========================================================= */

function openBreastModal() {

    openModal(`

        <h2>🤱 Breastfeeding</h2>

        <form
            class="tracker-form"
            id="breastForm">

            <label>
                Side
            </label>

            <select id="breastSide">

                <option value="Left">
                    Left
                </option>

                <option value="Right">
                    Right
                </option>

                <option value="Both">
                    Both
                </option>

            </select>


            <label>
                Duration
            </label>

            <input
                id="breastDuration"
                type="number"
                min="0"
                inputmode="numeric"
                placeholder="Minutes">


            <button
                class="form-submit"
                type="submit">

                💗 Save Feed

            </button>

        </form>

    `);


    document
        .getElementById(
            "breastForm"
        )
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                await addLog(
                    "feed",
                    {

                        method:
                            "breast",

                        side:
                            document
                                .getElementById(
                                    "breastSide"
                                )
                                .value,

                        duration:
                            Number(
                                document
                                    .getElementById(
                                        "breastDuration"
                                    )
                                    .value
                            ) || null

                    }
                );


                closeModal();

            }
        );

}


/* =========================================================
   BOTTLE
========================================================= */

function openBottleModal() {

    openModal(`

        <h2>🍼 Bottle</h2>

        <form
            class="tracker-form"
            id="bottleForm">

            <label>
                Amount
            </label>

            <input
                id="bottleAmount"
                type="number"
                min="0"
                inputmode="decimal"
                placeholder="ml"
                required>


            <button
                class="form-submit"
                type="submit">

                💗 Save Feed

            </button>

        </form>

    `);


    document
        .getElementById(
            "bottleForm"
        )
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                await addLog(
                    "feed",
                    {

                        method:
                            "bottle",

                        amount:
                            Number(
                                document
                                    .getElementById(
                                        "bottleAmount"
                                    )
                                    .value
                            ),

                        unit:
                            "ml"

                    }
                );


                closeModal();

            }
        );

}


/* =========================================================
   DIAPER
========================================================= */

function openDiaperModal() {

    openModal(`

        <h2>💧 Diaper</h2>

        <p class="modal-subtitle">
            What kind?
        </p>

        <div class="modal-options">

            <button
                class="modal-option"
                data-diaper="wet">

                💧 Wet

            </button>

            <button
                class="modal-option"
                data-diaper="dirty">

                💩 Dirty

            </button>

            <button
                class="modal-option"
                data-diaper="both">

                💧💩 Wet + Dirty

            </button>

        </div>

    `);


    document
        .querySelectorAll(
            "[data-diaper]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await addLog(
                            "diaper",
                            {
                                kind:
                                    button.dataset
                                        .diaper
                            }
                        );


                        closeModal();

                    }
                );

            }
        );

}


/* =========================================================
   SLEEP
========================================================= */

function openSleepModal() {

    if (activeSleep) {

        endSleep();

        return;

    }


    openModal(`

        <h2>😴 Sleep</h2>

        <p class="modal-subtitle">
            Start baby's nap.
        </p>

        <button
            id="startSleepButton"
            class="form-submit"
            type="button">

            😴 Start Nap Now

        </button>

    `);


    document
        .getElementById(
            "startSleepButton"
        )
        .addEventListener(
            "click",
            () => {

                startSleep();

                closeModal();

            }
        );

}


/* =========================================================
   START SLEEP
========================================================= */

async function startSleep() {

    if (activeSleep) return;


    activeSleep = {

        startedAt:
            new Date().toISOString()

    };


    await dbSetSetting(
        "activeSleep",
        activeSleep
    );


    renderSleepState();

    startSleepTimer();


    showToast(
        "😴",
        "Nap started"
    );

}


/* =========================================================
   END SLEEP
========================================================= */

async function endSleep() {

    if (!activeSleep) return;


    const start =
        new Date(
            activeSleep.startedAt
        );


    const end =
        new Date();


    const duration =
        Math.max(
            1,
            Math.round(
                (
                    end - start
                ) / 60000
            )
        );


    /*
       Save sleep before clearing
       activeSleep.
    */
    await addLog(
        "sleep",
        {
            duration
        }
    );


    activeSleep = null;


    await dbSetSetting(
        "activeSleep",
        null
    );


    stopSleepTimer();


    renderSleepState();


    showToast(
        "😴",
        `Nap · ${formatDuration(duration)}`
    );

}


/* =========================================================
   SLEEP STATE
========================================================= */

function renderSleepState() {

    const card =
        document.getElementById(
            "activeSleepCard"
        );


    if (!card) return;


    if (!activeSleep) {

        card.classList.add(
            "hidden"
        );

        return;

    }


    card.classList.remove(
        "hidden"
    );


    updateSleepTimer();

}


/* =========================================================
   TIMER
========================================================= */

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

    if (
        sleepTimerInterval
    ) {

        clearInterval(
            sleepTimerInterval
        );


        sleepTimerInterval =
            null;

    }

}


function updateSleepTimer() {

    if (!activeSleep) return;


    const start =
        new Date(
            activeSleep.startedAt
        );


    const elapsed =
        Math.max(
            0,
            Math.floor(
                (
                    Date.now() -
                    start.getTime()
                ) / 1000
            )
        );


    const hours =
        Math.floor(
            elapsed / 3600
        );


    const minutes =
        Math.floor(
            (
                elapsed % 3600
            ) / 60
        );


    const seconds =
        elapsed % 60;


    const timer =
        document.getElementById(
            "sleepTimer"
        );


    if (timer) {

        timer.textContent =

            `${String(hours).padStart(2, "0")}:` +

            `${String(minutes).padStart(2, "0")}:` +

            `${String(seconds).padStart(2, "0")}`;

    }

}


/* =========================================================
   NOTE
========================================================= */

function openNoteModal() {

    openModal(`

        <h2>📝 Quick Note</h2>

        <form
            class="tracker-form"
            id="noteForm">

            <textarea
                id="noteText"
                rows="4"
                placeholder="Type your note..."
                required></textarea>

            <button
                class="form-submit"
                type="submit">

                💗 Save Note

            </button>

        </form>

    `);


    document
        .getElementById(
            "noteForm"
        )
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const text =
                    document
                        .getElementById(
                            "noteText"
                        )
                        .value
                        .trim();


                if (!text) return;


                await addLog(
                    "note",
                    {
                        text
                    }
                );


                closeModal();

            }
        );

}


/* =========================================================
   VOICE RECOGNITION
========================================================= */

/*
   IMPORTANT:

   SpeechRecognition is not supported consistently
   across all browsers.

   We support both:

       window.SpeechRecognition

   and:

       window.webkitSpeechRecognition
*/


function setupVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    /*
       Browser does not support speech recognition.
    */
    if (!SpeechRecognition) {

        recognition = null;

        console.warn(
            "Speech Recognition is not supported in this browser."
        );

        return false;

    }


    /*
       Don't create multiple recognition
       instances.
    */
    if (recognition) {

        return true;

    }


    recognition =
        new SpeechRecognition();


    /*
       Change this to "fr-CA" if you want
       French Canadian voice commands.
    */
    recognition.lang =
        "en-US";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    /* --------------------------------
       START
    -------------------------------- */

    recognition.onstart = () => {

        console.log(
            "🎙️ Speech recognition started"
        );


        isListening =
            true;


        updateVoiceUI(
            true
        );


        showToast(
            "🎙️",
            "Listening..."
        );

    };


    /* --------------------------------
       RESULT
    -------------------------------- */

    recognition.onresult =
        event => {

            console.log(
                "🎙️ Speech result received:",
                event
            );


            let transcript =
                "";


            /*
               Collect all final results.
            */
            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                if (
                    event.results[i].isFinal
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript;

                }

            }


            transcript =
                transcript.trim();


            console.log(
                "🎙️ Transcript:",
                transcript
            );


            if (!transcript) {

                showToast(
                    "🎙️",
                    "I didn't hear anything"
                );


                return;

            }


            /*
               Process recognized speech.
            */
            processVoiceCommand(
                transcript
            );

        };


    /* --------------------------------
       ERROR
    -------------------------------- */

    recognition.onerror =
        event => {

            console.error(
                "🎙️ Speech recognition error:",
                event.error,
                event
            );


            isListening =
                false;


            updateVoiceUI(
                false
            );


            const errors = {

                "not-allowed":
                    "Please allow microphone access",

                "service-not-allowed":
                    "Speech recognition service isn't available",

                "audio-capture":
                    "I can't access your microphone",

                "no-speech":
                    "I didn't hear anything",

                "network":
                    "Voice recognition needs an internet connection",

                "aborted":
                    "Voice logging stopped",

                "language-not-supported":
                    "This voice language isn't supported",

                "bad-grammar":
                    "Voice recognition configuration failed",

                "phrases-not-supported":
                    "Voice phrases aren't supported"

            };


            showToast(
                "🎙️",
                errors[event.error] ||
                `Voice error: ${event.error}`
            );

        };


    /* --------------------------------
       END
    -------------------------------- */

    recognition.onend = () => {

        console.log(
            "🎙️ Speech recognition ended"
        );


        isListening =
            false;


        updateVoiceUI(
            false
        );

    };


    return true;

}


/* =========================================================
   VOICE UI
========================================================= */

function updateVoiceUI(
    listening
) {

    const button =
        document.getElementById(
            "voiceButton"
        );


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


    const label =
        button.querySelector(
            ".voice-button-label"
        );


    if (label) {

        label.textContent =
            listening
                ? "Listening..."
                : "Tap to tell me";

    }

}


/* =========================================================
   VOICE TOGGLE
========================================================= */

function toggleVoice() {

    console.log(
        "🎙️ Voice button pressed"
    );


    /*
       Initialize if necessary.
    */
    if (!recognition) {

        const supported =
            setupVoiceRecognition();


        if (!supported) {

            showToast(
                "🎙️",
                "Voice recognition isn't supported in this browser"
            );


            return;

        }

    }


    /*
       Stop if already listening.
    */
    if (isListening) {

        console.log(
            "🎙️ Stopping recognition"
        );


        try {

            recognition.stop();

        } catch (error) {

            console.error(
                "Error stopping recognition:",
                error
            );

        }


        return;

    }


    /*
       Start listening.
    */
    try {

        console.log(
            "🎙️ Starting recognition..."
        );


        recognition.start();

    } catch (error) {

        console.error(
            "Error starting recognition:",
            error
        );


        /*
           Reset state if browser rejects start().
        */
        isListening =
            false;


        updateVoiceUI(
            false
        );


        showToast(
            "🎙️",
            "Couldn't start voice recognition. Try again."
        );

    }

}


/* =========================================================
   VOICE COMMAND PARSER
========================================================= */

async function processVoiceCommand(
    text
) {

    const lower =
        normalizeSpeech(
            text
        );


    console.log(
        "🎙️ Processing voice command:",
        text
    );


    /*
       Show recognized speech.
    */
    showToast(
        "🎙️",
        `"${text}"`
    );


    /* --------------------------------
       SLEEP END
    -------------------------------- */

    if (
        activeSleep &&
        includesAny(
            lower,
            [
                "woke up",
                "wake up",
                "awake",
                "is awake",
                "got up",
                "finished sleeping",
                "finished nap",
                "nap is over",
                "nap finished",
                "sleep is over"
            ]
        )
    ) {

        await endSleep();

        return;

    }


    /* --------------------------------
       SLEEP START
    -------------------------------- */

    if (
        includesAny(
            lower,
            [
                "started sleeping",
                "went to sleep",
                "fell asleep",
                "going to sleep",
                "start nap",
                "started nap",
                "went down for a nap",
                "is sleeping",
                "is asleep",
                "baby is sleeping",
                "baby fell asleep"
            ]
        )
    ) {

        if (!activeSleep) {

            await startSleep();

        } else {

            showToast(
                "😴",
                "Nap is already running"
            );

        }


        return;

    }


    /* --------------------------------
       DIAPER
    -------------------------------- */

    if (
        includesAny(
            lower,
            [
                "diaper",
                "nappy",
                "changed diaper",
                "changed his diaper",
                "changed her diaper",
                "change diaper",
                "change the diaper",
                "changed the diaper"
            ]
        )
    ) {

        let kind =
            "wet";


        const dirty =
            includesAny(
                lower,
                [
                    "dirty",
                    "poop",
                    "poopy",
                    "pooped",
                    "stool",
                    "number two",
                    "number 2",
                    "bm"
                ]
            );


        const wet =
            includesAny(
                lower,
                [
                    "wet",
                    "pee",
                    "peed",
                    "urine",
                    "piss"
                ]
            );


        if (
            dirty &&
            wet
        ) {

            kind =
                "both";

        } else if (
            dirty
        ) {

            kind =
                "dirty";

        } else {

            kind =
                "wet";

        }


        await addLog(
            "diaper",
            {
                kind
            }
        );


        return;

    }


    /* --------------------------------
       BOTTLE
    -------------------------------- */

    if (
        includesAny(
            lower,
            [
                "bottle",
                "formula",
                "milk bottle",
                "had a bottle",
                "drank a bottle",
                "gave a bottle",
                "gave baby a bottle"
            ]
        )
    ) {

        const amount =
            extractAmount(
                text
            );


        await addLog(
            "feed",
            {

                method:
                    "bottle",

                amount:
                    amount?.value ??
                    null,

                unit:
                    amount?.unit ||
                    "ml"

            }
        );


        return;

    }


    /* --------------------------------
       BREASTFEEDING
    -------------------------------- */

    if (
        includesAny(
            lower,
            [
                "breast",
                "breastfeeding",
                "breast fed",
                "breastfed",
                "nursed",
                "nursing",
                "nurse",
                "nursed baby",
                "breastfed baby",
                "fed from the breast"
            ]
        )
    ) {

        let side =
            "Both";


        if (
            includesAny(
                lower,
                [
                    "left breast",
                    "left side",
                    "left boob"
                ]
            )
        ) {

            side =
                "Left";

        } else if (
            includesAny(
                lower,
                [
                    "right breast",
                    "right side",
                    "right boob"
                ]
            )
        ) {

            side =
                "Right";

        }


        const duration =
            extractDuration(
                text
            );


        await addLog(
            "feed",
            {

                method:
                    "breast",

                side,

                duration

            }
        );


        return;

    }


    /* --------------------------------
       GENERIC FEED
    -------------------------------- */

    if (
        includesAny(
            lower,
            [
                "fed baby",
                "baby ate",
                "baby had a feed",
                "baby had milk",
                "feeding",
                "fed the baby"
            ]
        )
    ) {

        await addLog(
            "feed",
            {

                method:
                    "breast",

                side:
                    "Both"

            }
        );


        return;

    }


    /* --------------------------------
       NOTE FALLBACK
    -------------------------------- */

    await addLog(
        "note",
        {
            text
        }
    );

}


/* =========================================================
   SPEECH NORMALIZATION
========================================================= */

function normalizeSpeech(
    text
) {

    return String(text)
        .toLowerCase()
        .replace(
            /[.,!?]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function includesAny(
    text,
    phrases
) {

    return phrases.some(
        phrase =>
            text.includes(
                phrase
            )
    );

}


/* =========================================================
   EXTRACT NUMBER
========================================================= */

function extractNumber(
    text
) {

    const match =
        text.match(
            /\b(\d+(?:\.\d+)?)\b/
        );


    return match
        ? Number(match[1])
        : null;

}


/* =========================================================
   EXTRACT AMOUNT
========================================================= */

function extractAmount(
    text
) {

    const lower =
        normalizeSpeech(
            text
        );


    /*
       Match things like:

       120 ml
       120 milliliters
       4 oz
       4 ounces

       Also handles:

       120ml
       4oz
    */
    const match =
        lower.match(
            /(\d+(?:\.\d+)?)\s*(ml|milliliters?|millilitres?|ounces?|oz)\b/
        );


    /*
       If there is no explicit unit,
       try to extract a number.
    */
    if (!match) {

        const number =
            extractNumber(
                lower
            );


        if (
            number !== null
        ) {

            return {

                value:
                    number,

                unit:
                    "ml"

            };

        }


        return null;

    }


    let value =
        Number(
            match[1]
        );


    let unit =
        match[2];


    if (
        unit.includes("ounce") ||
        unit === "oz"
    ) {

        unit =
            "oz";

    } else {

        unit =
            "ml";

    }


    return {

        value,

        unit

    };

}


/* =========================================================
   EXTRACT BREASTFEEDING DURATION
========================================================= */

function extractDuration(
    text
) {

    const lower =
        normalizeSpeech(
            text
        );


    const match =
        lower.match(
            /(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|hours?|hrs?|hr)\b/
        );


    if (!match) {

        return null;

    }


    const value =
        Number(
            match[1]
        );


    const unit =
        match[2];


    if (
        unit.startsWith("hour") ||
        unit.startsWith("hr")
    ) {

        return Math.round(
            value * 60
        );

    }


    return Math.round(
        value
    );

}


/* =========================================================
   CLEAR TODAY
========================================================= */

async function clearToday() {

    const confirmed =
        confirm(
            "Clear all of today's baby tracker logs?"
        );


    if (!confirmed) return;


    const today =
        todayKey();


    const todayLogs =
        logs.filter(
            log =>
                log.date === today
        );


    for (
        const log
        of todayLogs
    ) {

        await dbDeleteLog(
            log.id
        );

    }


    logs =
        logs.filter(
            log =>
                log.date !== today
        );


    render();


    showToast(
        "✓",
        "Today's logs cleared"
    );

}


/* =========================================================
   BACKUP / EXPORT
========================================================= */

function setupBackupControls() {

    const exportButton =
        document.getElementById(
            "exportDataButton"
        );


    const importButton =
        document.getElementById(
            "importDataButton"
        );


    const importInput =
        document.getElementById(
            "importDataInput"
        );


    if (
        exportButton &&
        !exportButton.dataset.bound
    ) {

        exportButton.dataset.bound =
            "true";


        exportButton.addEventListener(
            "click",
            exportBackup
        );

    }


    if (
        importButton &&
        importInput &&
        !importButton.dataset.bound
    ) {

        importButton.dataset.bound =
            "true";


        importButton.addEventListener(
            "click",
            () =>
                importInput.click()
        );


        importInput.addEventListener(
            "change",
            handleImport
        );

    }

}


/* =========================================================
   EXPORT
========================================================= */

async function exportBackup() {

    const settings = {

        babyName:
            await dbGetSetting(
                "babyName"
            ),

        units:
            await dbGetSetting(
                "units"
            )

    };


    const backup = {

        app:
            "MomYouNeedThis Baby Tracker",

        version:
            1,

        exportedAt:
            new Date().toISOString(),

        logs,

        settings

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


    const date =
        todayKey();


    link.href =
        url;


    link.download =
        `momyouneedthis-baby-tracker-${date}.json`;


    document
        .body
        .appendChild(
            link
        );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "💾",
        "Backup exported"
    );

}


/* =========================================================
   IMPORT
========================================================= */

async function handleImport(
    event
) {

    const file =
        event.target.files[0];


    if (!file) return;


    try {

        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        if (
            !backup ||
            !Array.isArray(
                backup.logs
            )
        ) {

            throw new Error(
                "Invalid backup"
            );

        }


        const confirmed =
            confirm(
                "Import this backup? This will replace the tracker data currently on this device."
            );


        if (!confirmed) {

            event.target.value =
                "";


            return;

        }


        await dbClearLogs();


        logs = [];


        for (
            const log
            of backup.logs
        ) {

            if (
                !log.id ||
                !log.type ||
                !log.timestamp
            ) {

                continue;

            }


            await dbPutLog(
                log
            );


            logs.push(
                log
            );

        }


        if (
            backup.settings
        ) {

            if (
                "babyName"
                in backup.settings
            ) {

                await dbSetSetting(
                    "babyName",
                    backup.settings.babyName
                );

            }


            if (
                "units"
                in backup.settings
            ) {

                await dbSetSetting(
                    "units",
                    backup.settings.units
                );

            }

        }


        render();


        showToast(
            "✓",
            "Backup restored"
        );


    } catch (error) {

        console.error(
            "Import failed:",
            error
        );


        showToast(
            "⚠️",
            "That backup file isn't valid"
        );

    }


    event.target.value =
        "";

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );


    if (!settingsButton) return;


    settingsButton.addEventListener(
        "click",
        openSettings
    );

}


async function openSettings() {

    const babyName =
        await dbGetSetting(
            "babyName"
        ) || "";


    const units =
        await dbGetSetting(
            "units"
        ) || "ml";


    openModal(`

        <h2>⚙️ Settings</h2>

        <p class="modal-subtitle">
            Your tracker stays on this device.
        </p>

        <form
            class="tracker-form"
            id="settingsForm">

            <label>
                Baby's name
            </label>

            <input
                id="babyNameInput"
                type="text"
                value="${escapeHtml(babyName)}"
                placeholder="Baby">


            <label>
                Bottle units
            </label>

            <select id="unitsInput">

                <option
                    value="ml"
                    ${units === "ml" ? "selected" : ""}>
                    Milliliters (ml)
                </option>

                <option
                    value="oz"
                    ${units === "oz" ? "selected" : ""}>
                    Ounces (oz)
                </option>

            </select>


            <button
                class="form-submit"
                type="submit">

                Save Settings

            </button>

        </form>


        <div class="settings-backup">

            <h3>
                💾 Your Data
            </h3>

            <p>
                Your tracker data is stored locally
                in this browser. Export a backup
                before changing devices.
            </p>


            <button
                id="exportDataButton"
                type="button">

                Export Backup

            </button>


            <button
                id="importDataButton"
                type="button">

                Import Backup

            </button>


            <input
                id="importDataInput"
                type="file"
                accept=".json,application/json"
                hidden>

        </div>

    `);


    document
        .getElementById(
            "settingsForm"
        )
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "babyNameInput"
                        )
                        .value
                        .trim();


                const units =
                    document
                        .getElementById(
                            "unitsInput"
                        )
                        .value;


                await dbSetSetting(
                    "babyName",
                    name
                );


                await dbSetSetting(
                    "units",
                    units
                );


                closeModal();


                showToast(
                    "✓",
                    "Settings saved"
                );

            }
        );


    /*
       Bind the dynamically-created
       backup buttons.
    */
    setupBackupControls();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value)
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


/* =========================================================
   RESTORE ACTIVE SLEEP
========================================================= */

function restoreActiveSleep() {

    if (!activeSleep) return;


    renderSleepState();

    startSleepTimer();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    icon,
    message
) {

    if (
        !toast ||
        !toastMessage ||
        !toastIcon
    ) return;


    toastIcon.textContent =
        icon;


    toastMessage.textContent =
        message;


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
            2500
        );

}


/* =========================================================
   START
========================================================= */

initializeTracker();