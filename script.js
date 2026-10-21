/* =========================================================
   SIMPLE PAGE REPLACEMENT ALGORITHM SIMULATOR

   Algorithms implemented:
   1. FIFO - First In First Out
   2. Optimal Page Replacement

   This file contains all the simulation logic.
========================================================= */


/* =========================================================
   GET HTML ELEMENTS
========================================================= */

const referenceInput = document.getElementById("referenceString");
const frameInput = document.getElementById("frameCount");

const fifoButton = document.getElementById("fifoBtn");
const optimalButton = document.getElementById("optimalBtn");
const compareButton = document.getElementById("compareBtn");
const resetButton = document.getElementById("resetBtn");

const errorMessage = document.getElementById("errorMessage");

const resultsSection = document.getElementById("resultsSection");

const fifoResult = document.getElementById("fifoResult");
const optimalResult = document.getElementById("optimalResult");

const comparisonSection = document.getElementById("comparisonSection");

const fifoTable = document.getElementById("fifoTable");
const optimalTable = document.getElementById("optimalTable");

const fifoSummary = document.getElementById("fifoSummary");
const optimalSummary = document.getElementById("optimalSummary");

const summaryCards = document.getElementById("summaryCards");


/* =========================================================
   BUTTON EVENT LISTENERS
========================================================= */

fifoButton.addEventListener("click", function () {

    const input = getValidatedInput();

    if (!input) {
        return;
    }

    const result = runFIFO(input.pages, input.frameCount);

    displayResults(result, "FIFO");

});


optimalButton.addEventListener("click", function () {

    const input = getValidatedInput();

    if (!input) {
        return;
    }

    const result = runOptimal(input.pages, input.frameCount);

    displayResults(result, "Optimal");

});


compareButton.addEventListener("click", function () {

    const input = getValidatedInput();

    if (!input) {
        return;
    }

    const fifoResultData = runFIFO(
        input.pages,
        input.frameCount
    );

    const optimalResultData = runOptimal(
        input.pages,
        input.frameCount
    );

    displayComparison(
        fifoResultData,
        optimalResultData
    );

});


resetButton.addEventListener("click", resetSimulator);


/* =========================================================
   INPUT VALIDATION
========================================================= */

/*
    This function checks whether the user has entered
    valid reference pages and a valid number of frames.

    It returns:
    {
        pages: [...],
        frameCount: number
    }

    or null if the input is invalid.
*/

function getValidatedInput() {

    hideError();


    /* Get reference string */
    const referenceString = referenceInput.value.trim();


    /* Get number of frames */
    const frameValue = frameInput.value.trim();


    /* Check empty reference string */
    if (referenceString === "") {

        showError("Please enter a page reference string.");

        return null;
    }


    /* Check empty frame count */
    if (frameValue === "") {

        showError("Please enter the number of page frames.");

        return null;
    }


    /*
        Split input using spaces or commas.

        Example:

        "7 0 1 2 0"

        becomes:

        ["7", "0", "1", "2", "0"]
    */

    const pageValues = referenceString.split(/[\s,]+/);


    /* Convert each value into a number */

    const pages = pageValues.map(function (value) {

        return Number(value);

    });


    /*
        Check whether every page is a valid number.
    */

    for (let page of pages) {

        if (!Number.isInteger(page) || page < 0) {

            showError(
                "Page reference string can contain only non-negative integers."
            );

            return null;
        }

    }


    /* Convert frame count into a number */

    const frameCount = Number(frameValue);


    /*
        Frame count must be an integer
        between 1 and 20.
    */

    if (
        !Number.isInteger(frameCount) ||
        frameCount < 1 ||
        frameCount > 20
    ) {

        showError(
            "Number of frames must be an integer between 1 and 20."
        );

        return null;
    }


    /* Everything is valid */

    return {
        pages: pages,
        frameCount: frameCount
    };
}


/* =========================================================
   FIFO PAGE REPLACEMENT
========================================================= */

/*
    FIFO = First In First Out

    Idea:

    The page that entered memory first
    is removed first.

    Example:

    Frames = 3

    If memory contains:

    [7, 0, 1]

    and page 2 arrives,

    the oldest page (7) is replaced.

    We use "pointer" to keep track of
    the next frame that should be replaced.
*/

function runFIFO(pages, frameCount) {

    /* Create empty frames */

    const frames = new Array(frameCount).fill(null);


    /*
        Pointer tells us which frame should
        be replaced next.
    */

    let pointer = 0;


    let hits = 0;
    let faults = 0;


    /*
        This array stores the state of memory
        after every page request.
    */

    const steps = [];


    /* Process every requested page */

    for (let i = 0; i < pages.length; i++) {

        const requestedPage = pages[i];


        /*
            Check whether the requested page
            already exists in memory.
        */

        const pageFound = frames.includes(requestedPage);


        if (pageFound) {

            /* Page is already in memory */

            hits++;

        } else {

            /*
                Page is not in memory,
                therefore page fault occurs.
            */

            faults++;


            /*
                Replace the page at the current
                FIFO pointer position.
            */

            frames[pointer] = requestedPage;


            /*
                Move pointer to the next frame.

                The % operator makes the pointer
                return to 0 after reaching the
                last frame.
            */

            pointer = (pointer + 1) % frameCount;

        }


        /*
            Save the current memory state.

            We use [...frames] to create a copy
            instead of storing the original array.
        */

        steps.push({

            step: i + 1,

            page: requestedPage,

            frames: [...frames],

            result: pageFound ? "Hit" : "Fault"

        });

    }


    /*
        Calculate page fault percentage.
    */

    const faultPercentage =
        (faults / pages.length) * 100;


    return {

        algorithm: "FIFO",

        pages: pages,

        frameCount: frameCount,

        hits: hits,

        faults: faults,

        faultPercentage: faultPercentage,

        steps: steps

    };
}


/* =========================================================
   OPTIMAL PAGE REPLACEMENT
========================================================= */

/*
    Optimal Page Replacement

    Idea:

    When a page fault occurs and all frames
    are occupied, replace the page whose
    NEXT use is farthest in the future.

    Example:

    Frames:

    [7, 0, 1]

    Future reference:

    2 0 3 0 4 ...

    Page 7 is never needed again.

    Therefore, page 7 should be replaced.
*/


function runOptimal(pages, frameCount) {

    /* Create empty frames */

    const frames = new Array(frameCount).fill(null);


    let hits = 0;
    let faults = 0;


    const steps = [];


    /* Process each requested page */

    for (let i = 0; i < pages.length; i++) {

        const requestedPage = pages[i];


        /*
            Check if the page is already
            present in memory.
        */

        const pageFound = frames.includes(requestedPage);


        if (pageFound) {

            /* Page hit */

            hits++;

        } else {

            /* Page fault */

            faults++;


            /*
                First check if there is an
                empty frame.
            */

            const emptyIndex = frames.indexOf(null);


            if (emptyIndex !== -1) {

                /*
                    If an empty frame exists,
                    place the new page there.
                */

                frames[emptyIndex] = requestedPage;

            } else {

                /*
                    All frames are full.

                    We must find the page whose
                    next use is farthest in the future.
                */

                let pageToReplaceIndex = 0;

                let farthestUse = -1;


                /*
                    Check every page currently
                    stored in the frames.
                */

                for (
                    let frameIndex = 0;
                    frameIndex < frameCount;
                    frameIndex++
                ) {

                    const currentPage =
                        frames[frameIndex];


                    /*
                        Search for the next occurrence
                        of this page in the remaining
                        reference string.
                    */

                    let nextUse = -1;


                    for (
                        let futureIndex = i + 1;
                        futureIndex < pages.length;
                        futureIndex++
                    ) {

                        if (
                            pages[futureIndex] ===
                            currentPage
                        ) {

                            nextUse = futureIndex;

                            break;
                        }

                    }


                    /*
                        If the page is never used again,
                        it is the best page to replace.
                    */

                    if (nextUse === -1) {

                        pageToReplaceIndex = frameIndex;

                        break;

                    }


                    /*
                        Otherwise, choose the page whose
                        next use occurs farthest in the future.
                    */

                    if (nextUse > farthestUse) {

                        farthestUse = nextUse;

                        pageToReplaceIndex = frameIndex;

                    }

                }


                /*
                    Replace the selected page.
                */

                frames[pageToReplaceIndex] =
                    requestedPage;
            }

        }


        /*
            Store a copy of the frame state
            after this page request.
        */

        steps.push({

            step: i + 1,

            page: requestedPage,

            frames: [...frames],

            result: pageFound ? "Hit" : "Fault"

        });

    }


    /*
        Calculate page fault percentage.
    */

    const faultPercentage =
        (faults / pages.length) * 100;


    return {

        algorithm: "Optimal",

        pages: pages,

        frameCount: frameCount,

        hits: hits,

        faults: faults,

        faultPercentage: faultPercentage,

        steps: steps

    };
}


/* =========================================================
   DISPLAY RESULTS
========================================================= */

/*
    Displays either FIFO or Optimal result.
*/

function displayResults(result, algorithm) {

    /* Make results visible */

    resultsSection.style.display = "block";

    comparisonSection.style.display = "none";


    /*
        Show only the selected algorithm.
    */

    if (algorithm === "FIFO") {

        fifoResult.style.display = "block";

        optimalResult.style.display = "none";

        displayTable(result, fifoTable);

        displaySummary(result, fifoSummary);

    }


    if (algorithm === "Optimal") {

        fifoResult.style.display = "none";

        optimalResult.style.display = "block";

        displayTable(result, optimalTable);

        displaySummary(result, optimalSummary);

    }


    /*
        Display the general summary cards.
    */

    displayGeneralSummary(result);

}


/* =========================================================
   DISPLAY TABLE
========================================================= */

/*
    This function dynamically creates the
    frame columns according to the number
    of frames selected by the user.

    Example:

    3 frames:

    Step | Page | Frame 1 | Frame 2 | Frame 3 | Result

    4 frames:

    Step | Page | Frame 1 | Frame 2 | Frame 3 | Frame 4 | Result
*/

function displayTable(result, table) {

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");


    /* Clear old table */

    thead.innerHTML = "";
    tbody.innerHTML = "";


    /* Create table header row */

    const headerRow = document.createElement("tr");


    /* Step column */

    const stepHeader = document.createElement("th");

    stepHeader.textContent = "Step";

    headerRow.appendChild(stepHeader);


    /* Requested page column */

    const pageHeader = document.createElement("th");

    pageHeader.textContent = "Requested Page";

    headerRow.appendChild(pageHeader);


    /* Create frame columns */

    for (
        let i = 0;
        i < result.frameCount;
        i++
    ) {

        const frameHeader =
            document.createElement("th");

        frameHeader.textContent =
            `Frame ${i + 1}`;

        headerRow.appendChild(frameHeader);

    }


    /* Hit / Fault column */

    const resultHeader = document.createElement("th");

    resultHeader.textContent = "Hit / Fault";

    headerRow.appendChild(resultHeader);


    /* Add header row */

    thead.appendChild(headerRow);


    /* =========================================
       CREATE TABLE BODY
    ========================================= */

    result.steps.forEach(function (step) {

        const row = document.createElement("tr");


        /* Step number */

        const stepCell = document.createElement("td");

        stepCell.textContent = step.step;

        row.appendChild(stepCell);


        /* Requested page */

        const pageCell = document.createElement("td");

        pageCell.textContent = step.page;

        row.appendChild(pageCell);


        /* Frame values */

        step.frames.forEach(function (frame) {

            const frameCell =
                document.createElement("td");


            /*
                Empty frame is displayed
                as a dash.
            */

            if (frame === null) {

                frameCell.textContent = "-";

            } else {

                frameCell.textContent = frame;

            }


            row.appendChild(frameCell);

        });


        /* Hit / Fault */

        const statusCell = document.createElement("td");

        statusCell.textContent = step.result;


        /*
            Apply different CSS classes
            for Hit and Fault.
        */

        if (step.result === "Hit") {

            statusCell.classList.add("hit");

        } else {

            statusCell.classList.add("fault");

        }


        row.appendChild(statusCell);


        /* Add row to table */

        tbody.appendChild(row);

    });

}


/* =========================================================
   DISPLAY ALGORITHM SUMMARY
========================================================= */

function displaySummary(result, container) {

    container.innerHTML = `

        <div class="result-summary">

            <div class="result-stat">
                <strong>Total Page Hits:</strong>
                ${result.hits}
            </div>

            <div class="result-stat">
                <strong>Total Page Faults:</strong>
                ${result.faults}
            </div>

            <div class="result-stat">
                <strong>Page Fault Percentage:</strong>
                ${result.faultPercentage.toFixed(2)}%
            </div>

        </div>

    `;
}


/* =========================================================
   DISPLAY GENERAL SUMMARY
========================================================= */

function displayGeneralSummary(result) {

    summaryCards.innerHTML = `

        <div class="summary-card">

            <h3>Total Page References</h3>

            <div class="number">
                ${result.pages.length}
            </div>

        </div>


        <div class="summary-card">

            <h3>Total Page Hits</h3>

            <div class="number">
                ${result.hits}
            </div>

        </div>


        <div class="summary-card">

            <h3>Total Page Faults</h3>

            <div class="number">
                ${result.faults}
            </div>

        </div>

    `;
}


/* =========================================================
   COMPARE FIFO AND OPTIMAL
========================================================= */

function displayComparison(fifo, optimal) {

    /* Show results */

    resultsSection.style.display = "block";

    fifoResult.style.display = "none";

    optimalResult.style.display = "none";

    comparisonSection.style.display = "block";


    /*
        Display FIFO values.
    */

    document.getElementById(
        "compareFifoFaults"
    ).textContent = fifo.faults;


    document.getElementById(
        "compareFifoHits"
    ).textContent = fifo.hits;


    document.getElementById(
        "compareFifoPercentage"
    ).textContent =
        fifo.faultPercentage.toFixed(2) + "%";


    /*
        Display Optimal values.
    */

    document.getElementById(
        "compareOptimalFaults"
    ).textContent = optimal.faults;


    document.getElementById(
        "compareOptimalHits"
    ).textContent = optimal.hits;


    document.getElementById(
        "compareOptimalPercentage"
    ).textContent =
        optimal.faultPercentage.toFixed(2) + "%";


    /*
        Determine which algorithm produced
        fewer page faults.
    */

    const comparisonMessage =
        document.getElementById(
            "comparisonMessage"
        );


    if (fifo.faults < optimal.faults) {

        comparisonMessage.textContent =
            `FIFO produced fewer page faults than Optimal `
            + `for this reference string. FIFO: ${fifo.faults} faults, `
            + `Optimal: ${optimal.faults} faults.`;

    } else if (optimal.faults < fifo.faults) {

        comparisonMessage.textContent =
            `Optimal produced fewer page faults than FIFO `
            + `for this reference string. Optimal: ${optimal.faults} faults, `
            + `FIFO: ${fifo.faults} faults.`;

    } else {

        comparisonMessage.textContent =
            `Both algorithms produced the same number `
            + `of page faults: ${fifo.faults}.`;

    }


    /*
        Display a general summary using the FIFO result.
    */

    displayGeneralSummary(fifo);
}


/* =========================================================
   ERROR HANDLING
========================================================= */

function showError(message) {

    errorMessage.textContent = message;

    errorMessage.style.display = "block";
}


function hideError() {

    errorMessage.textContent = "";

    errorMessage.style.display = "none";
}


/* =========================================================
   RESET SIMULATOR
========================================================= */

function resetSimulator() {

    /* Clear input fields */

    referenceInput.value = "";

    frameInput.value = "";


    /* Hide error */

    hideError();


    /* Hide results */

    resultsSection.style.display = "none";


    fifoResult.style.display = "none";

    optimalResult.style.display = "none";

    comparisonSection.style.display = "none";


    /* Clear result content */

    summaryCards.innerHTML = "";

    fifoSummary.innerHTML = "";

    optimalSummary.innerHTML = "";

    fifoTable.querySelector("tbody").innerHTML = "";

    optimalTable.querySelector("tbody").innerHTML = "";

}