/* =========================================================
   MOMYOuNEEDTHIS BABY TRACKER
========================================================= */

(() => {

"use strict";


/* =========================================================
   DATABASE
========================================================= */

const DB_NAME = "MomYouNeedThisBabyTracker";
const DB_VERSION = 1;
const STORE_NAME = "events";

let db = null;

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store = database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

                store.createIndex(
                    "timestamp",
                    "timestamp",
                    { unique: false }
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


/* =========================================================
   DATABASE HELPERS
========================================================= */

function addEvent(event) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.add(event);

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


function getAllEvents() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readonly");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


function deleteEvent(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.delete(id);

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


function clearEvents() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(STORE_NAME, "readwrite");

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.clear();

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   DATE HELPERS
========================================================= */

function isToday(timestamp) {

    const date = new Date(timestamp);
    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );

}


function formatTime(timestamp) {

    return new Intl.DateTimeFormat(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(new Date(timestamp));

}


function formatDate() {

    return new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    ).format(new Date());

}


function getGreeting() {

    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning 🤍";
    }

    if (hour < 18) {
        return "Good afternoon 🤍";
    }

    return "Good evening 🤍";

}


/* =========================================================
   UI
========================================================= */

const timeline =
    document.getElementById("timeline");

const emptyState =
    document.getElementById("emptyState");

const feedTotal =
    document.getElementById("feedTotal");

const wetTotal =
    document.getElementById("wetTotal");

const dirtyTotal =
    document.getElementById("dirtyTotal");

const sleepTotal =
    document.getElementById("sleepTotal");

const todayDate =
    document.getElementById("todayDate");

const greeting =
    document.getElementById("trackerGreeting");

const toast =
    document.getElementById("trackerToast");

const toastText =
    document.getElementById("toastText");

const toastIcon =
    document.getElementById("toastIcon");


greeting.textContent = getGreeting();
todayDate.textContent = formatDate();


/* =========================================================
   EVENT DEFINITIONS
========================================================= */

const EVENT_INFO = {

    feed: {
        icon: "🍼",
        label: "Feed",
        className: "event-feed"
    },

    wet: {
        icon: "💧",
        label: "Wet diaper",
        className: "event-wet"
    },

    dirty: {
        icon: "💩",
        label: "Dirty diaper",
        className: "event-dirty"
    },

    sleep: {
        icon: "😴",
        label: "Sleep",
        className: "event-sleep"
    }

};


/* =========================================================
   LOG EVENT
========================================================= */

async function logEvent(type, details = "") {

    const event = {

        type,

        details,

        timestamp: Date.now()

    };

    await addEvent(event);

    await render();

    showToast(
        EVENT_INFO[type]?.icon || "✓",
        buildEventLabel(event)
    );

}


/* =========================================================
   EVENT LABEL
========================================================= */

function buildEventLabel(event) {

    const info = EVENT_INFO[event.type];

    if (!info) {
        return "Logged";
    }

    if (event.type === "feed" && event.details) {

        return `Feed · ${event.details}`;

    }

    return info.label;

}


/* =========================================================
   RENDER
========================================================= */

async function render() {

    const events = await getAllEvents();

    const todaysEvents =
        events
            .filter(event => isToday(event.timestamp))
            .sort(
                (a, b) =>
                    b.timestamp - a.timestamp
            );


    renderTimeline(todaysEvents);

    renderSummary(todaysEvents);

}


function renderTimeline(events) {

    timeline.innerHTML = "";

    if (!events.length) {

        timeline.appendChild(emptyState);

        return;

    }


    events.forEach(event => {

        const info =
            EVENT_INFO[event.type];

        if (!info) return;


        const row =
            document.createElement("div");

        row.className =
            `timeline-event ${info.className}`;


        const icon =
            document.createElement("div");

        icon.className = "event-icon";

        icon.textContent = info.icon;


        const content =
            document.createElement("div");

        content.className =
            "event-content";


        const title =
            document.createElement("div");

        title.className =
            "event-title";

        title.textContent =
            buildEventLabel(event);


        const time =
            document.createElement("div");

        time.className =
            "event-time";

        time.textContent =
            formatTime(event.timestamp);


        content.appendChild(title);
        content.appendChild(time);


        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "event-delete";

        deleteButton.textContent =
            "×";

        deleteButton.setAttribute(
            "aria-label",
            "Delete event"
        );


        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteEvent(event.id);

                await render();

                showToast(
                    "↩",
                    "Entry removed"
                );

            }
        );


        row.appendChild(icon);
        row.appendChild(content);
        row.appendChild(deleteButton);


        timeline.appendChild(row);

    });

}


function renderSummary(events) {

    const feeds =
        events.filter(
            event => event.type === "feed"
        ).length;

    const wet =
        events.filter(
            event => event.type === "wet"
        ).length;

    const dirty =
        events.filter(
            event => event.type === "dirty"
        ).length;


    const sleepEvents =
        events.filter(
            event => event.type === "sleep"
        );


    let sleepMinutes = 0;

    sleepEvents.forEach(event => {

        if (event.duration) {

            sleepMinutes +=
                event.duration;

        }

    });


    feedTotal.textContent = feeds;
    wetTotal.textContent = wet;
    dirtyTotal.textContent = dirty;

    sleepTotal.textContent =
        formatDuration(sleepMinutes);

}


function formatDuration(minutes) {

    if (!minutes) {
        return "0m";
    }

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    if (hours === 0) {
        return `${remaining}m`;
    }

    if (remaining === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

document
    .querySelectorAll(".quick-action")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                if (action === "feed") {

                    openModal("feedModal");

                    return;

                }

                if (action === "sleep") {

                    handleSleep();

                    return;

                }

                logEvent(action);

            }
        );

    });


/* =========================================================
   FEED MODAL
========================================================= */

document
    .querySelectorAll("[data-feed-type]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.feedType;

                closeAllModals();

                if (type === "breast") {

                    logEvent(
                        "feed",
                        "Breast"
                    );

                    return;

                }

                openModal("bottleModal");

            }
        );

    });


/* =========================================================
   BOTTLE
========================================================= */

document
    .querySelectorAll("[data-amount]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const amount =
                    button.dataset.amount;

                closeAllModals();

                logEvent(
                    "feed",
                    `${amount} oz`
                );

            }
        );

    });


document
    .getElementById("customBottleButton")
    .addEventListener(
        "click",
        () => {

            const amount =
                prompt(
                    "How many ounces?"
                );

            if (!amount) {
                return;
            }

            const numericAmount =
                Number(amount);

            if (
                !Number.isFinite(
                    numericAmount
                ) ||
                numericAmount <= 0
            ) {

                showToast(
                    "!",
                    "Please enter a valid amount"
                );

                return;

            }

            closeAllModals();

            logEvent(
                "feed",
                `${numericAmount} oz`
            );

        }
    );


/* =========================================================
   SLEEP
========================================================= */

let sleepStartedAt = null;


function handleSleep() {

    if (!sleepStartedAt) {

        sleepStartedAt =
            Date.now();

        localStorage.setItem(
            "babyTrackerSleepStarted",
            String(sleepStartedAt)
        );

        updateSleepButton();

        showToast(
            "😴",
            "Sleep started"
        );

        return;

    }


    const end =
        Date.now();

    const duration =
        Math.round(
            (end - sleepStartedAt)
            / 60000
        );


    const event = {

        type: "sleep",

        details:
            `${formatDuration(duration)}`,

        duration,

        timestamp: sleepStartedAt,

        endedAt: end

    };


    addEvent(event)
        .then(render)
        .then(() => {

            showToast(
                "😴",
                `Sleep · ${formatDuration(duration)}`
            );

        });


    sleepStartedAt = null;

    localStorage.removeItem(
        "babyTrackerSleepStarted"
    );

    updateSleepButton();

}


function updateSleepButton() {

    const button =
        document.getElementById(
            "sleepQuickButton"
        );

    const text =
        document.getElementById(
            "sleepButtonText"
        );

    const icon =
        document.getElementById(
            "sleepIcon"
        );


    if (sleepStartedAt) {

        text.textContent =
            "Wake";

        icon.textContent =
            "☀️";

        button.classList.add(
            "sleep-active"
        );

    } else {

        text.textContent =
            "Sleep";

        icon.textContent =
            "😴";

        button.classList.remove(
            "sleep-active"
        );

    }

}


const savedSleep =
    localStorage.getItem(
        "babyTrackerSleepStarted"
    );

if (savedSleep) {

    sleepStartedAt =
        Number(savedSleep);

}

updateSleepButton();


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeAllModals() {

    document
        .querySelectorAll(".tracker-modal")
        .forEach(modal => {

            modal.classList.remove(
                "active"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        });

}


document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

        button.addEventListener(
            "click",
            closeAllModals
        );

    });


document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            closeAllModals
        );

    });


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeAllModals();

        }

    }
);


/* =========================================================
   VOICE RECOGNITION
========================================================= */

const voiceButton =
    document.getElementById(
        "voiceButton"
    );

const voiceIcon =
    document.getElementById(
        "voiceIcon"
    );

const voiceTitle =
    document.getElementById(
        "voiceButtonTitle"
    );

const voiceSubtitle =
    document.getElementById(
        "voiceButtonSubtitle"
    );

const voiceStatus =
    document.getElementById(
        "voiceStatus"
    );


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        voiceButton.classList.add(
            "listening"
        );

        voiceIcon.textContent =
            "🔴";

        voiceTitle.textContent =
            "LISTENING...";

        voiceSubtitle.textContent =
            "Tell me what happened";

        voiceStatus.textContent =
            "I'm listening";

    };


    recognition.onresult = event => {

        const transcript =
            event.results[0][0]
                .transcript
                .trim();

        voiceStatus.textContent =
            `"${transcript}"`;

        processVoiceInput(
            transcript
        );

    };


    recognition.onerror = event => {

        voiceStatus.textContent =
            getSpeechErrorMessage(
                event.error
            );

    };


    recognition.onend = () => {

        voiceButton.classList.remove(
            "listening"
        );

        voiceIcon.textContent =
            "🎙️";

        voiceTitle.textContent =
            "TAP TO LOG";

        voiceSubtitle.textContent =
            "Say what happened";

    };


} else {

    voiceButton.addEventListener(
        "click",
        () => {

            voiceStatus.textContent =
                "Voice logging isn't supported in this browser yet. Use the quick buttons below.";

        }
    );

}


if (recognition) {

    voiceButton.addEventListener(
        "click",
        () => {

            if (
                voiceButton.classList.contains(
                    "listening"
                )
            ) {

                recognition.stop();

                return;

            }

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Speech recognition:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   VOICE PARSER
========================================================= */

function processVoiceInput(text) {

    const normalized =
        text.toLowerCase();


    /* DIAPER */

    if (
        normalized.includes("wet diaper") ||
        normalized.includes("wet")
    ) {

        logEvent("wet");

        return;

    }


    if (
        normalized.includes("dirty diaper") ||
        normalized.includes("dirty") ||
        normalized.includes("poopy") ||
        normalized.includes("poop")
    ) {

        logEvent("dirty");

        return;

    }


    /* SLEEP */

    if (
        normalized.includes("start nap") ||
        normalized.includes("started nap") ||
        normalized.includes("going to sleep") ||
        normalized.includes("start sleep")
    ) {

        if (!sleepStartedAt) {

            handleSleep();

        }

        return;

    }


    /* BREAST */

    if (
        normalized.includes("breast") ||
        normalized.includes("nursed") ||
        normalized.includes("nursing")
    ) {

        logEvent(
            "feed",
            "Breast"
        );

        return;

    }


    /* BOTTLE / OUNCES */

    const ounceMatch =
        normalized.match(
            /(\d+(?:\.\d+)?)\s*(?:ounces|ounce|oz)/
        );


    if (ounceMatch) {

        logEvent(
            "feed",
            `${ounceMatch[1]} oz`
        );

        return;

    }


    /* FEED */

    if (
        normalized.includes("feed") ||
        normalized.includes("bottle")
    ) {

        logEvent(
            "feed",
            "Feed"
        );

        return;

    }


    voiceStatus.textContent =
        "I didn't quite catch that. Try “4 ounces”, “wet diaper”, or “breastfed”.";

}


/* =========================================================
   SPEECH ERROR
========================================================= */

function getSpeechErrorMessage(error) {

    switch (error) {

        case "not-allowed":
            return "Microphone permission was blocked.";

        case "no-speech":
            return "I didn't hear anything. Try again.";

        case "network":
            return "Voice recognition isn't available right now.";

        default:
            return "Something went wrong. Try again.";

    }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(icon, message) {

    toastIcon.textContent =
        icon;

    toastText.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   CLEAR TODAY
========================================================= */

document
    .getElementById("clearTodayButton")
    .addEventListener(
        "click",
        async () => {

            const events =
                await getAllEvents();

            const todaysEvents =
                events.filter(
                    event =>
                        isToday(
                            event.timestamp
                        )
                );


            if (!todaysEvents.length) {

                return;

            }


            const confirmed =
                confirm(
                    "Clear today's baby tracker entries?"
                );


            if (!confirmed) {

                return;

            }


            for (
                const event
                of todaysEvents
            ) {

                await deleteEvent(
                    event.id
                );

            }


            await render();

            showToast(
                "✓",
                "Today's entries cleared"
            );

        }
    );


/* =========================================================
   EXPORT
========================================================= */

document
    .getElementById("exportButton")
    .addEventListener(
        "click",
        async () => {

            const events =
                await getAllEvents();


            const backup = {

                app:
                    "MomYouNeedThis Baby Tracker",

                version: 1,

                exportedAt:
                    new Date().toISOString(),

                events

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

            link.href = url;

            link.download =
                `baby-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;

            link.click();


            URL.revokeObjectURL(
                url
            );


            showToast(
                "💾",
                "Backup downloaded"
            );

        }
    );


/* =========================================================
   IMPORT
========================================================= */

document
    .getElementById("importInput")
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            if (!file) return;


            const reader =
                new FileReader();


            reader.onload =
                async () => {

                    try {

                        const backup =
                            JSON.parse(
                                reader.result
                            );


                        if (
                            !backup.events ||
                            !Array.isArray(
                                backup.events
                            )
                        ) {

                            throw new Error(
                                "Invalid backup"
                            );

                        }


                        for (
                            const event
                            of backup.events
                        ) {

                            const restored = {
                                ...event
                            };

                            delete restored.id;

                            await addEvent(
                                restored
                            );

                        }


                        await render();

                        showToast(
                            "↩️",
                            "Backup restored"
                        );


                    } catch (error) {

                        showToast(
                            "!",
                            "That backup file isn't valid"
                        );

                    }

                };


            reader.readAsText(file);

            event.target.value = "";

        }
    );


/* =========================================================
   INITIALIZE
========================================================= */

async function init() {

    try {

        await openDatabase();

        await render();

    } catch (error) {

        console.error(
            "Baby tracker database error:",
            error
        );

        showToast(
            "!",
            "Unable to open local storage"
        );

    }

}


init();

})();