const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const FOOTER_PATH = path.join(
    ROOT,
    "components",
    "footer.html"
);

const EXCLUDED_FILES = new Set([
    "components",
    "scripts"
]);

function loadFooter() {
    if (!fs.existsSync(FOOTER_PATH)) {
        throw new Error(
            "Could not find components/footer.html"
        );
    }

    const footer = fs.readFileSync(
        FOOTER_PATH,
        "utf8"
    ).trim();

    if (!footer) {
        throw new Error(
            "components/footer.html is empty"
        );
    }

    if (!/<footer\b[^>]*>[\s\S]*<\/footer>/i.test(footer)) {
        throw new Error(
            "components/footer.html must contain a complete <footer>...</footer>."
        );
    }

    return footer;
}

function getHtmlFiles() {
    return fs.readdirSync(ROOT, {
        withFileTypes: true
    })
        .filter((entry) => {
            return (
                entry.isFile() &&
                entry.name.endsWith(".html")
            );
        })
        .map((entry) => path.join(ROOT, entry.name));
}

function updateFooter(filePath, footer) {
    const html = fs.readFileSync(
        filePath,
        "utf8"
    );

    const footerMatches = html.match(
        /<footer\b[^>]*>[\s\S]*?<\/footer>/gi
    );

    if (!footerMatches) {
        return {
            status: "skipped",
            reason: "No footer found"
        };
    }

    if (footerMatches.length > 1) {
        return {
            status: "skipped",
            reason: `Found ${footerMatches.length} footers`
        };
    }

    const updatedHtml = html.replace(
        /<footer\b[^>]*>[\s\S]*?<\/footer>/i,
        footer
    );

    if (updatedHtml === html) {
        return {
            status: "unchanged"
        };
    }

    fs.writeFileSync(
        filePath,
        updatedHtml,
        "utf8"
    );

    return {
        status: "updated"
    };
}

function main() {
    console.log("Updating MomYouNeedThis footers...\n");

    const footer = loadFooter();
    const htmlFiles = getHtmlFiles();

    const updatedFiles = [];
    const skippedFiles = [];

    for (const filePath of htmlFiles) {
        const filename = path.basename(filePath);

        const result = updateFooter(
            filePath,
            footer
        );

        if (result.status === "updated") {
            updatedFiles.push(filename);
            console.log(`✓ Updated: ${filename}`);
        }

        if (result.status === "skipped") {
            skippedFiles.push({
                filename,
                reason: result.reason
            });

            console.log(
                `⚠ Skipped: ${filename} — ${result.reason}`
            );
        }
    }

    console.log("\n--------------------------------");
    console.log("Footer update complete.");
    console.log("--------------------------------");

    console.log(`Updated: ${updatedFiles.length}`);
    console.log(`Skipped: ${skippedFiles.length}`);

    if (skippedFiles.length > 0) {
        console.log("\nSkipped files:");

        for (const file of skippedFiles) {
            console.log(
                `- ${file.filename}: ${file.reason}`
            );
        }
    }

    console.log("");
}

main();
