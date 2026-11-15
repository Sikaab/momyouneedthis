function applyImgFallback(img) {
    if (img.dataset.fallback === "sibling") {
        img.style.display = "none";
        if (img.nextElementSibling) {
            img.nextElementSibling.style.display = "block";
        }
    } else if (img.dataset.fallback === "emoji") {
        const span = document.createElement("span");
        span.className = "thumb-emoji";
        span.textContent = img.dataset.fallbackEmoji;
        img.replaceWith(span);
    }
}

document.addEventListener("error", function (event) {
    if (event.target.tagName === "IMG" && event.target.dataset.fallback) {
        applyImgFallback(event.target);
    }
}, true);

document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
        applyImgFallback(img);
    }
});
