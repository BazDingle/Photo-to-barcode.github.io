const cameraBtn = document.getElementById("cameraBtn");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("preview");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const serialInput = document.getElementById("serialInput");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const errorDiv = document.getElementById("error");

cameraBtn.onclick = () => photoInput.click();

photoInput.addEventListener("change", handleImage);

generateBtn.onclick = () => generateBarcode(serialInput.value);
downloadBtn.onclick = downloadBarcode;

async function handleImage(e) {
    resetUI();
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        preview.src = reader.result;
        preview.classList.remove("hidden");
        loading.classList.remove("hidden");

        try {
            const { data: { text } } = await Tesseract.recognize(reader.result, "eng");

            const serial = extractSerial(text);

            if (!serial) throw new Error("No serial detected");

            serialInput.value = serial;
            result.classList.remove("hidden");

        } catch (err) {
            showError(err.message);
        }

        loading.classList.add("hidden");
    };

    reader.readAsDataURL(file);
}

function extractSerial(text) {
    const lines = text.split("\n");

    for (let line of lines) {
        if (/serial|s\/n|sn/i.test(line)) {
            return clean(line);
        }
    }

    const matches = text.match(/[A-Z0-9]{6,}/gi);
    if (matches) return matches.sort((a,b)=>b.length-a.length)[0];

    return null;
}

function clean(line) {
    return line.replace(/serial|s\/n|sn|:/gi, "")
               .replace(/[^A-Z0-9]/gi, "")
               .trim();
}

function generateBarcode(text) {
    if (!text) return;

    bwipjs.toCanvas("barcodeCanvas", {
        bcid: "code128",
        text: text,
        scale: 3,
        height: 18,
        includetext: true,
        textxalign: "center",
    });
}

function downloadBarcode() {
    const canvas = document.getElementById("barcodeCanvas");
    const link = document.createElement("a");
    link.download = serialInput.value + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove("hidden");
}

function resetUI() {
    errorDiv.classList.add("hidden");
    result.classList.add("hidden");
}