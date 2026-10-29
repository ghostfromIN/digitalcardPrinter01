// Dictionary for standard Aadhaar prefixes
const PREFIX_MAP = {
    "s/o": "आत्मज:",
    "d/o": "आत्मजा:",
    "w/o": "पत्नी:",
    "c/o": "मार्फत:",
    "so": "आत्मज:",
    "do": "आत्मजा:",
    "wo": "पत्नी:",
    "co": "मार्फत:"
};

// Google Input Tools Transliterate API single token
async function transliterateToken(word) {
    if (!word.trim()) return word;

    const lower = word.toLowerCase().trim();
    if (PREFIX_MAP[lower]) {
        return PREFIX_MAP[lower];
    }

    // Number, pure symbols, ya alphanumeric codes (eg: C-147, B-12, 110094) ko direct preserve karein
    if (/^[0-9]+$/.test(word) || /^[a-zA-Z]-[0-9]+$/i.test(word) || /^[a-zA-Z0-9]+[0-9]+[a-zA-Z0-9]*$/.test(word)) {
        return word;
    }

    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=hi-t-i0-und&num=1`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data[0] === "SUCCESS" && data[1][0][1].length > 0) {
            return data[1][0][1][0];
        }
    } catch (err) {
        console.error("Transliteration Error:", err);
    }
    return word;
}

// Tokenize text keeping spaces, punctuation, commas intact
async function transliterateSentence(text) {
    if (!text) return "";

    // Split words while preserving delimiters (spaces, commas, colons, slashes)
    const tokens = text.split(/([ \t\n,:\/]+)/);

    const convertedTokens = await Promise.all(
        tokens.map(async (token) => {
            if (/^[ \t\n,:\/]+$/.test(token) || !token.trim()) {
                return token;
            }
            return await transliterateToken(token);
        })
    );

    return convertedTokens.join("");
}

function debounce(func, delay = 350) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const photoInput = document.getElementById("in-photo");
    const nameEn = document.getElementById("in-name-en");
    const nameHi = document.getElementById("in-name-hi");
    const dobInput = document.getElementById("in-dob");
    const genderInput = document.getElementById("in-gender");
    const numberInput = document.getElementById("in-number");
    const addrEn = document.getElementById("in-addr-en");
    const addrHi = document.getElementById("in-addr-hi");

    // Displays
    const dispPhoto = document.getElementById("disp-photo");
    const dispNameHi = document.getElementById("disp-name-hi");
    const dispNameEn = document.getElementById("disp-name-en");
    const dispDob = document.getElementById("disp-dob");
    const dispGender = document.getElementById("disp-gender");
    const dispNumber = document.getElementById("disp-number");
    const dispAddrHi = document.getElementById("disp-addr-hi");
    const dispAddrEn = document.getElementById("disp-addr-en");

    // Sections
    const formSection = document.getElementById("form-section");
    const cardWrapper = document.getElementById("card-wrapper");
    const actionBar = document.getElementById("action-bar");

    // English Name -> Hindi Name Auto Update
    nameEn.addEventListener("input", debounce(async (e) => {
        const val = e.target.value;
        nameHi.value = await transliterateSentence(val);
    }));

    // English Address -> Hindi Address Auto Update
    addrEn.addEventListener("input", debounce(async (e) => {
        const val = e.target.value;
        addrHi.value = await transliterateSentence(val);
    }));

    // 12-digit formatting
    numberInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "").substring(0, 12);
        let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
        e.target.value = formatted;
    });

    // Image Upload
    photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                dispPhoto.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Generate Action
    document.getElementById("btn-generate").addEventListener("click", () => {
        dispNameEn.innerText = nameEn.value.trim() || "Name";
        dispNameHi.innerText = nameHi.value.trim() || "नाम";
        dispDob.innerText = dobInput.value.trim() || "DD/MM/YYYY";
        dispGender.innerText = genderInput.value;
        dispNumber.innerText = numberInput.value.trim() || "[12-Digit Number]";
        dispAddrEn.innerText = addrEn.value.trim() || "Address Line...";
        dispAddrHi.innerText = addrHi.value.trim() || "पता...";

        formSection.style.display = "none";
        cardWrapper.style.display = "block";
        actionBar.style.display = "flex";
        window.scrollTo(0, 0);
    });

    // Edit Action
    document.getElementById("btn-edit").addEventListener("click", () => {
        formSection.style.display = "block";
        cardWrapper.style.display = "none";
        actionBar.style.display = "none";
        window.scrollTo(0, 0);
    });

    // Print Action
    document.getElementById("btn-print").addEventListener("click", () => {
        window.print();
    });
});