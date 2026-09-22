/* =========================================================
   MOMYOU NEED THIS — TODDLER WARDROBE BUILDER
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

interfaceState();

function interfaceState(): void {
    // This function intentionally exists to keep initialization explicit.
}

interface WardrobeAnswers {
    age: number;
    laundryDays: number;
    outfitChanges: number;
    daycare: boolean;
    pottyTraining: boolean;
    style: "minimal" | "practical" | "variety";
}

interface WardrobeItem {
    name: string;
    icon: string;
    quantity: number;
    description: string;
}

interface WardrobeResult {
    items: WardrobeItem[];
    total: number;
    daycareBackup: number;
    underwear: number;
}

interface Outfit {
    label: string;
    pieces: string[];
}


/* =========================================================
   ELEMENTS
   ========================================================= */

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");

const calculateButton = document.getElementById("calculateButton");
const buildWardrobeButton = document.getElementById("buildWardrobeButton");

const backToQuestions = document.getElementById("backToQuestions");
const backToResults = document.getElementById("backToResults");

const resultsGrid = document.getElementById("resultsGrid");
const totalPieces = document.getElementById("totalPieces");
const resultSummary = document.getElementById("resultSummary");

const daycareResult = document.getElementById("daycareResult");
const daycareText = document.getElementById("daycareText");

const pottyResult = document.getElementById("pottyResult");
const pottyText = document.getElementById("pottyText");

const outfitGrid = document.getElementById("outfitGrid");
const shoppingList = document.getElementById("shoppingList");

const copyChecklist = document.getElementById("copyChecklist");
const printWardrobe = document.getElementById("printWardrobe");


/* =========================================================
   FORM STATE
   ========================================================= */

let selectedDaycare: boolean = true;
let selectedPottyTraining: boolean = false;

let currentAnswers: WardrobeAnswers | null = null;
let currentResult: WardrobeResult | null = null;


/* =========================================================
   CHOICE BUTTONS
   ========================================================= */

const choiceButtons = document.querySelectorAll<HTMLButtonElement>(
    ".choice-button"
);

choiceButtons.forEach((button: HTMLButtonElement): void => {
    button.addEventListener("click", (): void => {

        const group: string | null = button.dataset.group ?? null;
        const value: string | null = button.dataset.value ?? null;

        if (group === "daycare") {
            selectedDaycare = value === "yes";
        }

        if (group === "potty") {
            selectedPottyTraining = value === "yes";
        }

        document
            .querySelectorAll<HTMLButtonElement>(
                `.choice-button[data-group="${group}"]`
            )
            .forEach((groupButton: HTMLButtonElement): void => {
                groupButton.classList.remove("selected");
            });

        button.classList.add("selected");
    });
});


/* =========================================================
   HELPERS
   ========================================================= */

function getSelectValue(id: string): string {
    const element = document.getElementById(id);

    if (!(element instanceof HTMLSelectElement)) {
        return "";
    }

    return element.value;
}


function clamp(
    value: number,
    minimum: number,
    maximum: number
): number {
    return Math.min(Math.max(value, minimum), maximum);
}


function roundToWhole(value: number): number {
    return Math.max(1, Math.ceil(value));
}


function getAgeAdjustment(age: number): number {
    if (age === 1) {
        return 0;
    }

    if (age === 2) {
        return 0;
    }

    if (age === 3) {
        return 0.5;
    }

    if (age === 4) {
        return 0.5;
    }

    return 1;
}


/* =========================================================
   CALCULATOR
   ========================================================= */

function calculateWardrobe(
    answers: WardrobeAnswers
): WardrobeResult {

    const laundryBuffer: number = answers.laundryDays / 3;

    const changeFactor: number = answers.outfitChanges / 1.5;

    let styleMultiplier: number = 1;

    if (answers.style === "minimal") {
        styleMultiplier = 0.82;
    }

    if (answers.style === "variety") {
        styleMultiplier = 1.18;
    }

    const ageAdjustment: number = getAgeAdjustment(answers.age);

    const topBase: number =
        6 *
        laundryBuffer *
        changeFactor *
        styleMultiplier;

    const bottomBase: number =
        5 *
        laundryBuffer *
        Math.max(0.9, changeFactor * 0.82) *
        styleMultiplier;

    const pajamasBase: number =
        6 *
        laundryBuffer *
        styleMultiplier;

    const socksBase: number =
        8 *
        laundryBuffer *
        Math.max(1, answers.outfitChanges / 1.5);

    let tops: number = roundToWhole(
        clamp(topBase + ageAdjustment, 4, 16)
    );

    let bottoms: number = roundToWhole(
        clamp(bottomBase + ageAdjustment, 4, 12)
    );

    let pajamas: number = roundToWhole(
        clamp(pajamasBase, 4, 12)
    );

    let socks: number = roundToWhole(
        clamp(socksBase, 6, 18)
    );

    let underwear: number = roundToWhole(
        clamp(
            8 *
                laundryBuffer *
                (answers.pottyTraining ? 1.65 : 1),
            answers.pottyTraining ? 10 : 6,
            answers.pottyTraining ? 24 : 18
        )
    );

    const layers: number = roundToWhole(
        clamp(
            3 *
                (answers.style === "variety" ? 1.3 : 1),
            2,
            5
        )
    );

    const dressesOrOnePieces: number = roundToWhole(
        clamp(
            2 *
                styleMultiplier,
            1,
            5
        )
    );

    const total: number =
        tops +
        bottoms +
        pajamas +
        socks +
        underwear +
        layers +
        dressesOrOnePieces;

    const daycareBackup: number = answers.daycare
        ? answers.pottyTraining
            ? 4
            : 2
        : 0;

    const items: WardrobeItem[] = [
        {
            name: "Everyday tops",
            icon: "👕",
            quantity: tops,
            description:
                "T-shirts, long-sleeve tops and everyday shirts."
        },
        {
            name: "Bottoms",
            icon: "👖",
            quantity: bottoms,
            description:
                "Pants, leggings, shorts or other everyday bottoms."
        },
        {
            name: "Pajamas",
            icon: "🌙",
            quantity: pajamas,
            description:
                "Complete sleep sets or pajama separates."
        },
        {
            name: "Underwear",
            icon: "🩲",
            quantity: underwear,
            description:
                answers.pottyTraining
                    ? "Extra buffer for potty-training accidents."
                    : "Enough to comfortably cover your laundry cycle."
        },
        {
            name: "Socks",
            icon: "🧦",
            quantity: socks,
            description:
                "Everyday socks plus a few inevitable missing ones."
        },
        {
            name: "Layers",
            icon: "🧥",
            quantity: layers,
            description:
                "Sweaters, hoodies or light layers."
        },
        {
            name: "Dressy / one-piece outfits",
            icon: "✨",
            quantity: dressesOrOnePieces,
            description:
                "Optional variety for outings, events or one-piece outfits."
        }
    ];

    return {
        items,
        total,
        daycareBackup,
        underwear
    };
}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResults(
    answers: WardrobeAnswers,
    result: WardrobeResult
): void {

    if (!resultsGrid || !totalPieces || !resultSummary) {
        return;
    }

    totalPieces.textContent = String(result.total);

    const laundryDescription: string =
        answers.laundryDays <= 2
            ? "Since you do laundry frequently, you can keep the wardrobe fairly lean."
            : answers.laundryDays <= 3
                ? "Your quantities include a comfortable buffer for a few days between laundry loads."
                : "Your wardrobe includes extra buffer because laundry happens less frequently.";

    resultSummary.textContent = laundryDescription;

    resultsGrid.innerHTML = result.items
        .map((item: WardrobeItem): string => {
            return `
                <article class="result-card">
                    <div class="result-icon">${item.icon}</div>
                    <h3>${item.name}</h3>
                    <div class="quantity">${item.quantity}</div>
                    <p>${item.description}</p>
                </article>
            `;
        })
        .join("");

    if (answers.daycare) {
        daycareResult?.classList.remove("hidden");

        if (daycareText) {
            daycareText.textContent =
                `Keep ${result.daycareBackup} complete backup outfits at daycare. ` +
                (
                    answers.pottyTraining
                        ? "Potty training makes the extra buffer especially useful."
                        : "Swap them out as your child grows or uses them."
                );
        }
    } else {
        daycareResult?.classList.add("hidden");
    }

    if (answers.pottyTraining) {
        pottyResult?.classList.remove("hidden");

        if (pottyText) {
            pottyText.textContent =
                `The calculator gives you ${result.underwear} pairs of underwear ` +
                "so accidents don't immediately trigger an emergency laundry cycle.";
        }
    } else {
        pottyResult?.classList.add("hidden");
    }
}


/* =========================================================
   BUILD OUTFITS
   ========================================================= */

function createOutfits(
    answers: WardrobeAnswers
): Outfit[] {

    const outfits: Outfit[] = [
        {
            label: "Everyday",
            pieces: [
                "Basic top",
                "Comfortable bottoms",
                "Socks"
            ]
        },
        {
            label: "Messy-day backup",
            pieces: [
                "Backup top",
                "Easy-wash bottoms",
                "Socks"
            ]
        },
        {
            label: "Cool weather",
            pieces: [
                "Long-sleeve top",
                "Bottoms",
                "Sweater / hoodie"
            ]
        },
        {
            label: "Easy outing",
            pieces: [
                "Favorite top",
                "Comfortable bottoms",
                "Light layer"
            ]
        },
        {
            label: "Play day",
            pieces: [
                "Play top",
                "Durable bottoms",
                "Socks"
            ]
        },
        {
            label: "Simple dress-up",
            pieces: [
                "Dressy / one-piece outfit",
                "Light layer",
                "Socks"
            ]
        }
    ];

    if (answers.pottyTraining) {
        outfits.push({
            label: "Potty-training friendly",
            pieces: [
                "Easy-off top",
                "Elastic-waist bottoms",
                "Fresh underwear"
            ]
        });
    }

    if (answers.daycare) {
        outfits.push({
            label: "Daycare backup",
            pieces: [
                "Complete spare outfit",
                "Fresh socks",
                "Fresh underwear"
            ]
        });
    }

    return outfits;
}


function renderOutfits(
    answers: WardrobeAnswers
): void {

    if (!outfitGrid) {
        return;
    }

    const outfits: Outfit[] = createOutfits(answers);

    outfitGrid.innerHTML = outfits
        .map((outfit: Outfit): string => {
            return `
                <article class="outfit-card">
                    <div class="outfit-label">${outfit.label}</div>

                    <div class="outfit-pieces">
                        ${outfit.pieces
                            .map((piece: string): string => {
                                return `
                                    <span class="outfit-piece">
                                        ${piece}
                                    </span>
                                `;
                            })
                            .join("")}
                    </div>
                </article>
            `;
        })
        .join("");
}


/* =========================================================
   AMAZON SHOPPING LINKS
   ========================================================= */

function amazonSearchUrl(
    query: string
): string {

    return (
        "https://www.amazon.com/s?k=" +
        encodeURIComponent(query)
    );
}


function createShoppingList(
    result: WardrobeResult,
    answers: WardrobeAnswers
): void {

    if (!shoppingList) {
        return;
    }

    const shoppingItems: {
        icon: string;
        name: string;
        quantity: number;
        description: string;
        search: string;
    }[] = [
        {
            icon: "👕",
            name: "Everyday toddler tops",
            quantity: result.items[0].quantity,
            description: "Build your basic top rotation.",
            search: "toddler basic t shirts"
        },
        {
            icon: "👖",
            name: "Toddler bottoms",
            quantity: result.items[1].quantity,
            description: "Choose comfortable mix-and-match bottoms.",
            search: "toddler pants leggings"
        },
        {
            icon: "🌙",
            name: "Toddler pajamas",
            quantity: result.items[2].quantity,
            description: "Enough sleepwear for your laundry routine.",
            search: "toddler pajamas"
        },
        {
            icon: "🧦",
            name: "Toddler socks",
            quantity: result.items[4].quantity,
            description: "Stock up before the sock drawer mysteriously empties.",
            search: "toddler socks"
        },
        {
            icon: "🧥",
            name: "Toddler layers",
            quantity: result.items[5].quantity,
            description: "Sweaters, hoodies and everyday layers.",
            search: "toddler hoodies sweaters"
        }
    ];

    if (answers.pottyTraining) {
        shoppingItems.push({
            icon: "🩲",
            name: "Toddler underwear",
            quantity: result.underwear,
            description: "Extra pairs make potty training easier to manage.",
            search: "toddler underwear"
        });
    }

    if (answers.daycare) {
        shoppingItems.push({
            icon: "🎒",
            name: "Daycare backup outfits",
            quantity: result.daycareBackup,
            description: "Complete spare outfits for the daycare cubby.",
            search: "toddler daycare outfits"
        });
    }

    shoppingList.innerHTML = shoppingItems
        .map(
            (
                item: {
                    icon: string;
                    name: string;
                    quantity: number;
                    description: string;
                    search: string;
                }
            ): string => {
                return `
                    <div class="shopping-item">
                        <div class="shopping-item-left">
                            <div class="shopping-item-icon">
                                ${item.icon}
                            </div>

                            <div>
                                <strong>
                                    ${item.name} · ${item.quantity}
                                </strong>

                                <span>
                                    ${item.description}
                                </span>
                            </div>
                        </div>

                        <a
                            href="${amazonSearchUrl(item.search)}"
                            target="_blank"
                            rel="noopener"
                        >
                            Shop
                        </a>
                    </div>
                `;
            }
        )
        .join("");
}


/* =========================================================
   STEP NAVIGATION
   ========================================================= */

function showStep(step: number): void {

    step1?.classList.remove("active");
    step2?.classList.remove("active");
    step3?.classList.remove("active");

    if (step === 1) {
        step1?.classList.add("active");
    }

    if (step === 2) {
        step2?.classList.add("active");
    }

    if (step === 3) {
        step3?.classList.add("active");
    }

    const percentage: number = Math.round(
        (step / 3) * 100
    );

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent = `Step ${step} of 3`;
    }

    if (progressPercent) {
        progressPercent.textContent = `${percentage}%`;
    }

    const tool: HTMLElement | null =
        document.getElementById("wardrobeTool");

    if (tool) {
        window.scrollTo({
            top: tool.offsetTop - 20,
            behavior: "smooth"
        });
    }
}


/* =========================================================
   CALCULATE BUTTON
   ========================================================= */

calculateButton?.addEventListener(
    "click",
    (): void => {

        const age: number = Number(
            getSelectValue("childAge")
        );

        const laundryDays: number = Number(
            getSelectValue("laundryFrequency")
        );

        const outfitChanges: number = Number(
            getSelectValue("outfitChanges")
        );

        const styleValue: string =
            getSelectValue("wardrobeStyle");

        const style:
            | "minimal"
            | "practical"
            | "variety" =
            styleValue === "minimal"
                ? "minimal"
                : styleValue === "variety"
                    ? "variety"
                    : "practical";

        currentAnswers = {
            age,
            laundryDays,
            outfitChanges,
            daycare: selectedDaycare,
            pottyTraining: selectedPottyTraining,
            style
        };

        currentResult =
            calculateWardrobe(currentAnswers);

        renderResults(
            currentAnswers,
            currentResult
        );

        showStep(2);
    }
);


/* =========================================================
   BUILD BUTTON
   ========================================================= */

buildWardrobeButton?.addEventListener(
    "click",
    (): void => {

        if (!currentAnswers || !currentResult) {
            return;
        }

        renderOutfits(currentAnswers);

        createShoppingList(
            currentResult,
            currentAnswers
        );

        showStep(3);
    }
);


/* =========================================================
   BACK BUTTONS
   ========================================================= */

backToQuestions?.addEventListener(
    "click",
    (): void => {
        showStep(1);
    }
);


backToResults?.addEventListener(
    "click",
    (): void => {
        showStep(2);
    }
);


/* =========================================================
   COPY CHECKLIST
   ========================================================= */

copyChecklist?.addEventListener(
    "click",
    async (): Promise<void> => {

        if (!currentAnswers || !currentResult) {
            return;
        }

        const lines: string[] = [
            "TODDLER WARDROBE CHECKLIST",
            "",
            `Age: ${currentAnswers.age}`,
            `Laundry: every ${currentAnswers.laundryDays} days`,
            `Outfit changes/day: ${currentAnswers.outfitChanges}`,
            `Daycare: ${currentAnswers.daycare ? "Yes" : "No"}`,
            `Potty training: ${
                currentAnswers.pottyTraining
                    ? "Yes"
                    : "No"
            }`,
            "",
            "WARDROBE",
            ""
        ];

        currentResult.items.forEach(
            (item: WardrobeItem): void => {
                lines.push(
                    `☐ ${item.name}: ${item.quantity}`
                );
            }
        );

        if (currentAnswers.daycare) {
            lines.push(
                "",
                `☐ Daycare backup outfits: ${currentResult.daycareBackup}`
            );
        }

        lines.push(
            "",
            "Built with MomYouNeedThis"
        );

        const text: string = lines.join("\n");

        try {
            await navigator.clipboard.writeText(text);

            copyChecklist.textContent = "Copied! ✓";

            window.setTimeout(
                (): void => {
                    copyChecklist.textContent =
                        "Copy Checklist";
                },
                1800
            );
        } catch {
            copyChecklist.textContent =
                "Select & copy manually";
        }
    }
);


/* =========================================================
   PRINT
   ========================================================= */

printWardrobe?.addEventListener(
    "click",
    (): void => {
        window.print();
    }
);


/* =========================================================
   INITIAL STATE
   ========================================================= */

showStep(1);