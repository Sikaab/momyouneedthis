/* =========================================================
   MOMYOURENEEDTHIS
   BABY TRACKER
========================================================= */


/* =========================
   STORAGE
========================= */

const STORAGE_KEY = "momyouneedthis_baby_tracker";

let logs = loadLogs();

let activeSleep = null;

let sleepTimerInterval = null;


/* =========================
   ELEMENTS
========================= */

const timeline =
    document.getElementById("timeline");

const emptyState =
    document.getElementById("emptyState");

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


/* =========================
   LOAD / SAVE
========================= */

function loadLogs() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        return saved
            ? JSON.parse(saved)
            : [];

    } catch (error) {

        console.error(
            "Unable to load baby tracker data.",
            error
        );

        return [];

    }

}


function saveLogs() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(logs)
    );

}


/* =========================
   ID
========================= */

function createId() {

    return Date.now().toString(36) +
        Math.random().toString(36).substring(2);

}


/* =========================
   DATE
========================= */

function todayKey(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatTime(date) {

    return new Date(date)
        .toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });

}


function formatToday() {

    return new Date()
        .toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric"
        });

}


/* =========================
   ADD LOG
========================= */

function addLog(type, details = {}) {

    const now = new Date();

    const log = {

        id: createId(),

        type,

        timestamp: now.toISOString(),

        date: todayKey(now),

        ...details

    };

    logs.push(log);

    saveLogs();

    render();

    showToast(
        getLogIcon(log),
        getLogTitle(log)
    );

}


/* =========================
   LOG HELPERS
========================= */

function getLogIcon(log) {

    const icons = {

        feed: "🍼",

        diaper: "💧",

        sleep: "😴",

        note: "📝"

    };

    return icons[log.type] || "💗";

}


function getLogTitle(log) {

    if (log.type === "feed") {

        if (log.method === "breast") {

            return `Breastfeeding · ${log.side || "Both"}`;

        }

        if (log.method === "bottle") {

            return `Bottle · ${log.amount || 0} ml`;

        }

        return "Feeding";

    }


    if (log.type === "diaper") {

        return `${capitalize(log.kind)} diaper`;

    }


    if (log.type === "sleep") {

        return "Nap";

    }


    if (log.type === "note") {

        return log.text || "Note";

    }


    return "Activity";

}


function getLogDetails(log) {

    if (log.type === "feed") {

        if (log.method === "breast") {

            return `${log.side || "Both"}${log.duration ? ` · ${log.duration} min` : ""}`;

        }

        if (log.method === "bottle") {

            return `${log.amount || 0} ml`;

        }

        return "";

    }


    if (log.type === "diaper") {

        return log.kind === "wet"
            ? "Wet"
            : log.kind === "dirty"
                ? "Dirty"
                : "Wet + dirty";

    }


    if (log.type === "sleep") {

        return log.duration
            ? formatDuration(log.duration)
            : "Sleep";

    }


    if (log.type === "note") {

        return "";

    }


    return "";

}


/* =========================
   CAPITALIZE
========================= */

function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


/* =========================
   FORMAT DURATION
========================= */

function formatDuration(minutes) {

    if (!minutes) return "0m";

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    if (hours) {

        return `${hours}h ${mins}m`;

    }

    return `${mins}m`;

}


/* =========================
   TODAY LOGS
========================= */

function getTodayLogs() {

    const today =
        todayKey();

    return logs
        .filter(log => log.date === today)
        .sort(
            (a, b) =>
                new Date(b.timestamp) -
                new Date(a.timestamp)
        );

}


/* =========================
   RENDER
========================= */

function render() {

    renderDate();

    renderTimeline();

    renderSummary();

    renderSleepState();

}


/* =========================
   DATE
========================= */

function renderDate() {

    const date =
        document.getElementById("todayDate");

    if (date) {

        date.textContent =
            formatToday();

    }

}


/* =========================
   TIMELINE
========================= */

function renderTimeline() {

    const todayLogs =
        getTodayLogs();

    timeline.innerHTML = "";

    if (!todayLogs.length) {

        timeline.appendChild(
            createEmptyState()
        );

        return;

    }


    todayLogs.forEach(log => {

        const item =
            document.createElement("div");

        item.className =
            "timeline-item";

        const icon =
            document.createElement("div");

        icon.className =
            "timeline-icon";

        icon.textContent =
            getLogIcon(log);


        const info =
            document.createElement("div");

        info.className =
            "timeline-info";

        const title =
            document.createElement("strong");

        title.textContent =
            getLogTitle(log);


        const details =
            document.createElement("span");

        details.textContent =
            getLogDetails(log);


        info.appendChild(title);

        if (details.textContent) {

            info.appendChild(details);

        }


        const time =
            document.createElement("div");

        time.className =
            "timeline-time";

        time.textContent =
            formatTime(log.timestamp);


        const deleteButton =
            document.createElement("button");

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
            () => deleteLog(log.id)
        );


        item.appendChild(icon);

        item.appendChild(info);

        item.appendChild(time);

        item.appendChild(deleteButton);

        timeline.appendChild(item);

    });

}


/* =========================
   EMPTY STATE
========================= */

function createEmptyState() {

    const wrapper =
        document.createElement("div");

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
            Tap an activity above and
            we'll remember it for you.
        </p>

    `;

    return wrapper;

}


/* =========================
   SUMMARY
========================= */

function renderSummary() {

    const todayLogs =
        getTodayLogs();


    document.getElementById(
        "totalLogs"
    ).textContent =
        todayLogs.length;


    const feeds =
        todayLogs.filter(
            log => log.type === "feed"
        ).length;


    const diapers =
        todayLogs.filter(
            log => log.type === "diaper"
        ).length;


    const sleep =
        todayLogs

            .filter(
                log => log.type === "sleep"
            )

            .reduce(
                (total, log) =>
                    total + (log.duration || 0),
                0
            );


    document.getElementById(
        "feedCount"
    ).textContent = feeds;


    document.getElementById(
        "diaperCount"
    ).textContent = diapers;


    document.getElementById(
        "sleepTotal"
    ).textContent =
        formatDuration(sleep);

}


/* =========================
   DELETE
========================= */

function deleteLog(id) {

    logs =
        logs.filter(
            log => log.id !== id
        );

    saveLogs();

    render();

    showToast(
        "✓",
        "Log removed"
    );

}


/* =========================
   MODAL
========================= */

function openModal(content) {

    modalContent.innerHTML =
        content;

    actionModal.classList.remove(
        "hidden"
    );

}


function closeModal() {

    actionModal.classList.add(
        "hidden"
    );

}


modalClose.addEventListener(
    "click",
    closeModal
);


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


/* =========================
   QUICK ACTIONS
========================= */

document
    .querySelectorAll(".quick-action")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                if (action === "feed") {

                    openFeedModal();

                }

                if (action === "diaper") {

                    openDiaperModal();

                }

                if (action === "sleep") {

                    openSleepModal();

                }

                if (action === "note") {

                    openNoteModal();

                }

            }
        );

    });


/* =========================
   FEED MODAL
========================= */

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
        .querySelectorAll("[data-feed]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const method =
                        button.dataset.feed;

                    if (
                        method === "breast"
                    ) {

                        openBreastModal();

                    } else {

                        openBottleModal();

                    }

                }
            );

        });

}


/* =========================
   BREAST
========================= */

function openBreastModal() {

    openModal(`

        <h2>🤱 Breastfeeding</h2>

        <p class="modal-subtitle">
            A few quick details.
        </p>

        <form
            class="tracker-form"
            id="breastForm">

            <div>

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

            </div>


            <div>

                <label>
                    Duration (optional)
                </label>

                <input
                    id="breastDuration"
                    type="number"
                    min="0"
                    inputmode="numeric"
                    placeholder="Minutes">

            </div>


            <button
                class="form-submit"
                type="submit">

                💗 Save Feed

            </button>

        </form>

    `);


    document
        .getElementById("breastForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                addLog(
                    "feed",
                    {

                        method: "breast",

                        side:
                            document.getElementById(
                                "breastSide"
                            ).value,

                        duration:
                            Number(
                                document.getElementById(
                                    "breastDuration"
                                ).value
                            ) || null

                    }
                );

                closeModal();

            }
        );

}


/* =========================
   BOTTLE
========================= */

function openBottleModal() {

    openModal(`

        <h2>🍼 Bottle</h2>

        <p class="modal-subtitle">
            How much did baby have?
        </p>

        <form
            class="tracker-form"
            id="bottleForm">

            <div>

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

            </div>


            <button
                class="form-submit"
                type="submit">

                💗 Save Feed

            </button>

        </form>

    `);


    document
        .getElementById("bottleForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                addLog(
                    "feed",
                    {

                        method: "bottle",

                        amount:
                            Number(
                                document.getElementById(
                                    "bottleAmount"
                                ).value
                            )

                    }
                );

                closeModal();

            }
        );

}


/* =========================
   DIAPER
========================= */

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
        .querySelectorAll("[data-diaper]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    addLog(
                        "diaper",
                        {
                            kind:
                                button.dataset.diaper
                        }
                    );

                    closeModal();

                }
            );

        });

}


/* =========================
   SLEEP
========================= */

function openSleepModal() {

    if (activeSleep) {

        endSleep();

        return;

    }


    openModal(`

        <h2>😴 Sleep</h2>

        <p class="modal-subtitle">
            Start tracking baby's nap.
        </p>

        <button
            id="startSleepButton"
            class="form-submit"
            type="button">

            😴 Start Nap Now

        </button>

    `);


    document
        .getElementById("startSleepButton")
        .addEventListener(
            "click",
            () => {

                startSleep();

                closeModal();

            }
        );

}


/* =========================
   START SLEEP
========================= */

function startSleep() {

    activeSleep = {

        startedAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "momyouneedthis_active_sleep",
        JSON.stringify(activeSleep)
    );


    renderSleepState();

    showToast(
        "😴",
        "Nap started"
    );


    startSleepTimer();

}


/* =========================
   END SLEEP
========================= */

function endSleep() {

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
                (end - start) / 60000
            )
        );


    addLog(
        "sleep",
        {
            duration
        }
    );


    activeSleep = null;


    localStorage.removeItem(
        "momyouneedthis_active_sleep"
    );


    stopSleepTimer();

    renderSleepState();

}


/* =========================
   SLEEP STATE
========================= */

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

}


/* =========================
   SLEEP TIMER
========================= */

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

        sleepTimerInterval = null;

    }

}


function updateSleepTimer() {

    if (!activeSleep) return;


    const start =
        new Date(
            activeSleep.startedAt
        );


    const elapsed =
        Math.floor(
            (Date.now() - start) / 1000
        );


    const hours =
        Math.floor(
            elapsed / 3600
        );


    const minutes =
        Math.floor(
            (elapsed % 3600) / 60
        );


    const seconds =
        elapsed % 60;


    document.getElementById(
        "sleepTimer"
    ).textContent =

        `${String(hours).padStart(2,"0")}:` +

        `${String(minutes).padStart(2,"0")}:` +

        `${String(seconds).padStart(2,"0")}`;

}


/* =========================
   END SLEEP BUTTON
========================= */

document
    .getElementById("endSleepButton")
    .addEventListener(
        "click",
        endSleep
    );


/* =========================
   NOTE
========================= */

function openNoteModal() {

    openModal(`

        <h2>📝 Quick Note</h2>

        <p class="modal-subtitle">
            Save something you'll want to remember.
        </p>

        <form
            class="tracker-form"
            id="noteForm">

            <div>

                <textarea
                    id="noteText"
                    rows="4"
                    placeholder="Type your note..."
                    required></textarea>

            </div>


            <button
                class="form-submit"
                type="submit">

                💗 Save Note

            </button>

        </form>

    `);


    document
        .getElementById("noteForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const text =
                    document
                        .getElementById(
                            "noteText"
                        )
                        .value
                        .trim();


                if (!text) return;


                addLog(
                    "note",
                    { text }
                );

                closeModal();

            }
        );

}


/* =========================
   VOICE RECOGNITION
========================= */

let recognition = null;


function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        return false;

    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        navigator.language || "en-US";


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    recognition.onresult =
        event => {

            const text =
                event.results[0][0]
                    .transcript
                    .trim();

            processVoiceCommand(text);

        };


    recognition.onerror =
        () => {

            showToast(
                "🎙️",
                "I couldn't hear that"
            );

        };


    recognition.onend =
        () => {

            document
                .getElementById(
                    "voiceButton"
                )
                .classList.remove(
                    "recording"
                );

        };


    return true;

}


function startVoice() {

    if (!recognition) {

        const supported =
            setupSpeechRecognition();

        if (!supported) {

            showToast(
                "🎙️",
                "Voice logging isn't supported here"
            );

            return;

        }

    }


    try {

        recognition.start();

        document
            .getElementById(
                "voiceButton"
            )
            .classList.add(
                "recording"
            );


        showToast(
            "🎙️",
            "Listening..."
        );

    } catch (error) {

        console.log(error);

    }

}


function processVoiceCommand(text) {

    const lower =
        text.toLowerCase();


    /* DIAPER */

    if (
        lower.includes("diaper") ||
        lower.includes("nappy")
    ) {

        let kind = "wet";


        if (
            lower.includes("dirty") ||
            lower.includes("poop") ||
            lower.includes("poopy")
        ) {

            kind = "dirty";

        }


        if (
            (
                lower.includes("wet") &&
                (
                    lower.includes("dirty") ||
                    lower.includes("poop")
                )
            )
        ) {

            kind = "both";

        }


        addLog(
            "diaper",
            { kind }
        );

        return;

    }


    /* FEED */

    if (
        lower.includes("feed") ||
        lower.includes("breast") ||
        lower.includes("nurse") ||
        lower.includes("bottle")
    ) {

        if (
            lower.includes("bottle")
        ) {

            const amount =
                extractNumber(text);


            addLog(
                "feed",
                {
                    method: "bottle",
                    amount: amount || null
                }
            );

            return;

        }


        let side = "Both";


        if (
            lower.includes("left")
        ) {

            side = "Left";

        }


        if (
            lower.includes("right")
        ) {

            side = "Right";

        }


        addLog(
            "feed",
            {
                method: "breast",
                side
            }
        );

        return;

    }


    /* SLEEP */

    if (
        lower.includes("sleep") ||
        lower.includes("nap")
    ) {

        if (!activeSleep) {

            startSleep();

        } else {

            endSleep();

        }

        return;

    }


    /* FALLBACK NOTE */

    addLog(
        "note",
        {
            text
        }
    );

}


function extractNumber(text) {

    const match =
        text.match(
            /\d+(\.\d+)?/
        );

    return match
        ? Number(match[0])
        : null;

}


document
    .getElementById("voiceButton")
    .addEventListener(
        "click",
        startVoice
    );


/* =========================
   CLEAR TODAY
========================= */

document
    .getElementById(
        "clearTodayButton"
    )
    .addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Clear all of today's baby tracker logs?"
                );


            if (!confirmed) return;


            const today =
                todayKey();


            logs =
                logs.filter(
                    log => log.date !== today
                );


            saveLogs();

            render();

            showToast(
                "✓",
                "Today's logs cleared"
            );

        }
    );


/* =========================
   TOAST
========================= */

let toastTimeout;


function showToast(icon, message) {

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
            2200
        );

}


/* =========================
   RESTORE ACTIVE SLEEP
========================= */

function restoreActiveSleep() {

    try {

        const saved =
            localStorage.getItem(
                "momyouneedthis_active_sleep"
            );


        if (saved) {

            activeSleep =
                JSON.parse(saved);

            renderSleepState();

            startSleepTimer();

        }

    } catch (error) {

        console.error(error);

    }

}


/* =========================
   INITIALIZE
========================= */

restoreActiveSleep();

render();