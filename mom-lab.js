document.addEventListener("DOMContentLoaded", () => {

    const filterButtons =
        document.querySelectorAll(".database-filter");

    const productCards =
        document.querySelectorAll(".lab-product-card");

    const revealButtons =
        document.querySelectorAll(".verdict-reveal-button");


    /* =====================================================
       ARCHIVE FILTERS
    ====================================================== */

    filterButtons.forEach((button) => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            const filter =
                button.dataset.filter || "all";

            filterButtons.forEach((item) => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            productCards.forEach((card) => {

                const status =
                    card.dataset.status || "";

                const shouldShow =
                    filter === "all" ||
                    status === filter;

                if (shouldShow) {

                    card.hidden = false;

                    requestAnimationFrame(() => {
                        card.classList.remove("filter-hidden");
                    });

                } else {

                    card.classList.add("filter-hidden");

                    window.setTimeout(() => {

                        if (
                            card.classList.contains(
                                "filter-hidden"
                            )
                        ) {
                            card.hidden = true;
                        }

                    }, 180);
                }
            });

            const target =
                document.querySelector("#tested");

            if (target) {

                const targetTop =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    20;

                window.scrollTo({
                    top: targetTop,
                    behavior: "smooth"
                });
            }
        });
    });


    /* =====================================================
       VERDICT REVEALS
    ====================================================== */

    revealButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const card =
                button.closest(".lab-product-card");

            if (!card) {
                return;
            }

            const verdict =
                card.querySelector(".product-verdict");

            if (!verdict) {
                return;
            }

            const isRevealed =
                verdict.classList.contains("revealed");

            if (isRevealed) {

                verdict.classList.remove("revealed");

                button.classList.remove("is-open");

                button.innerHTML =
                    'REVEAL VERDICT <span>+</span>';

                return;
            }

            verdict.classList.add("revealed");

            button.classList.add("is-open");

            button.innerHTML =
                'HIDE VERDICT <span>−</span>';

            createLabSpark(button);
        });
    });


    /* =====================================================
       SMALL MICRO-JOY
    ====================================================== */

    function createLabSpark(sourceElement) {

        const rect =
            sourceElement.getBoundingClientRect();

        const spark =
            document.createElement("span");

        spark.className =
            "lab-micro-spark";

        spark.textContent =
            ["✦", "✧", "•"][
                Math.floor(
                    Math.random() * 3
                )
            ];

        spark.style.left =
            `${rect.right - 8}px`;

        spark.style.top =
            `${rect.top + 4}px`;

        document.body.appendChild(spark);

        window.setTimeout(() => {
            spark.remove();
        }, 650);
    }


    /* =====================================================
       ADD FILTER ANIMATION STYLES
    ====================================================== */

    const dynamicStyle =
        document.createElement("style");

    dynamicStyle.textContent = `

        .lab-product-card.filter-hidden {
            opacity: 0;
            transform: translateY(8px);
            pointer-events: none;
        }

        .lab-micro-spark {
            position: fixed;
            z-index: 9999;
            pointer-events: none;

            color: #e89aaa;

            font-size: 18px;
            font-weight: 900;

            animation:
                labSparkPop
                .6s
                cubic-bezier(.2,.8,.25,1)
                forwards;
        }

        @keyframes labSparkPop {

            0% {
                opacity: 0;
                transform:
                    translateY(4px)
                    scale(.3)
                    rotate(-15deg);
            }

            25% {
                opacity: 1;
                transform:
                    translateY(-3px)
                    scale(1.2)
                    rotate(8deg);
            }

            100% {
                opacity: 0;
                transform:
                    translateY(-22px)
                    scale(.7)
                    rotate(25deg);
            }
        }

        @media (prefers-reduced-motion: reduce) {

            .lab-product-card.filter-hidden {
                opacity: 0;
                transform: none;
            }

            .lab-micro-spark {
                display: none;
            }
        }
    `;

    document.head.appendChild(dynamicStyle);

});