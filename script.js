let currentLand = null;
// 🔍 SEARCH FUNCTION
async function searchLand() {
    let surveyNo = document.getElementById("surveyNo").value;

    let response = await fetch(`http://127.0.0.1:8000/search?survey_no=${surveyNo}`);
    let data = await response.json();

    let resultDiv = document.getElementById("result");

    if (data.length === 0) {
        resultDiv.innerHTML = "❌ No data found";
    } else {

    let land = data[0];

    currentLand = land;   // ✅ ADD THIS
    loadMap();            // ✅ ADD THIS

    let riskClass = land["Risk Level"].toLowerCase();

    let caseDetails = land["Case Details"] || "No cases";
let caseList = caseDetails.split(";");

let caseHTML = caseList.map(c => `<li>${c}</li>`).join("");

resultDiv.innerHTML = `
    <h3>📄 Land Details</h3>

    <p><b>Owner:</b> ${land["Owner Name"]}</p>
    <p><b>Village:</b> ${land["Village"]}</p>
    <p><b>EC Status:</b> ${land["EC Status"]}</p>
    <p><b>📄 Registration:</b> ${land["Registration Status"]}</p>
    <p><b>📑 Document Status:</b> ${land["Document Status"]}</p>
    <p><b>🔄 Ownership History:</b> ${land["Ownership History"]}</p>   
    <p><b>Total Cases:</b> ${land["Cases"]}</p>

    <p><b>⚖️ Case Details:</b></p>
    <ul>${caseHTML}</ul>
    <p><b>Risk:</b> <span class="${riskClass}">${land["Risk Level"]}</span></p>
    <p><b>📊 Risk Score:</b> ${land["Risk %"]}%</p>
    <div class="risk-bar">
        <div class="risk-fill ${riskClass}"></div>
    </div>
`;
        // 🗺️ Load Map
        loadMap();   

    }
}

// 🗺️ MAP FUNCTION
function loadMap() {
    if (!currentLand) return;

    let lat = Number(currentLand["Lat"]);
    let lng = Number(currentLand["Lng"]);

    console.log("👉 MAP LOCATION:", lat, lng);

    let location = { lat: lat, lng: lng };

    // Clear old map (important fix)
    document.getElementById("map").innerHTML = "";

    let map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: location,
    });

    new google.maps.Marker({
        position: location,
        map: map,
    });
}

// 🎙️ VOICE SEARCH
function startVoice() {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "ta-IN";

    recognition.onresult = function(event) {
        let text = event.results[0][0].transcript;
        document.getElementById("surveyNo").value = text;
    };

    recognition.start();
}

// 🤖 CHATBOT
function chatbot() {
    let input = document.getElementById("chatInput").value.toLowerCase();
    let out = document.getElementById("chatOutput");

    if (!currentLand) {
        out.innerHTML = "⚠️ Please search land first.";
        return;
    }

    let owner = currentLand["Owner Name"];
    let village = currentLand["Village"];
    let risk = currentLand["Risk Level"];
    let cases = currentLand["Case Details"];
    let totalCases = currentLand["Cases"];
    let ec = currentLand["EC Status"];

    // 🤖 AI-like responses

    if (input.includes("safe") || input.includes("buy") || input.includes("purchase")) {
        if (risk === "Low") {
            out.innerHTML = `✅ This land is SAFE to buy.<br>No major legal issues.`;
        } else if (risk === "Medium") {
            out.innerHTML = `⚠️ Moderate risk. Verify documents before buying.`;
        } else {
            out.innerHTML = `❌ High risk land. Not recommended.`;
        }
    }

    else if (input.includes("case") || input.includes("dispute") || input.includes("problem")) {
        out.innerHTML = `
        ⚖️ Total Cases: ${totalCases}<br><br>
        📄 Case Details:<br>
        ${cases.replaceAll(";", "<br>")}
        `;
    }

    else if (input.includes("owner")) {
        out.innerHTML = `👤 Owner: ${owner}`;
    }

    else if (input.includes("location") || input.includes("where") || input.includes("near")) {
        out.innerHTML = `📍 Location: ${village}`;
    }

    else if (input.includes("risk")) {
        out.innerHTML = `⚠️ Risk Level: ${risk}`;
    }

    else if (input.includes("ec") || input.includes("encumbrance")) {
        out.innerHTML = `📄 EC Status: ${ec}`;
    }

    else if (input.includes("suggest") || input.includes("advice")) {
        out.innerHTML = `
        💡 Suggestion:<br>
        ✔ Check EC documents<br>
        ✔ Verify ownership history<br>
        ✔ Visit location physically<br>
        ✔ Consult legal expert
        `;
    }

    else if (input.includes("details") || input.includes("full")) {
        out.innerHTML = `
        📄 Full Details:<br><br>
        👤 Owner: ${owner}<br>
        📍 Village: ${village}<br>
        ⚠️ Risk: ${risk}<br>
        📄 Cases: ${totalCases}<br>
        `;
    }

    else {
        out.innerHTML = `
        🤖 I can help with:<br><br>
        ✔ Is this land safe?<br>
        ✔ What cases are there?<br>
        ✔ Owner details<br>
        ✔ Risk level<br>
        ✔ Suggestions<br><br>
        Try asking something 😊
        `;
    }
    document.getElementById("chatInput").value = "";
    
}
// 🌙 DARK MODE
function toggleDarkMode() {
    document.body.classList.toggle("dark");
}
// 🚪 LOGOUT
function logout() {
    window.location.href = "login.html";
}
// 🔊 VOICE OUTPUT (Tamil + English)
function speak(text) {
    let speech = new SpeechSynthesisUtterance(text);

    // Detect Tamil characters
    if (/[\u0B80-\u0BFF]/.test(text)) {
        speech.lang = "ta-IN";   // Tamil
    } else {
        speech.lang = "en-IN";   // English
    }

    window.speechSynthesis.speak(speech);
}
function showSection(id) {
    let sections = document.querySelectorAll(".section");

    sections.forEach(sec => sec.classList.remove("active"));

    document.getElementById(id).classList.add("active");
}
// ⌨️ ENTER KEY SUPPORT (ADDED FEATURE - NO CHANGE TO EXISTING CODE)

document.addEventListener("DOMContentLoaded", function () {

    // 🔍 ENTER for Survey Search
    let searchInput = document.getElementById("surveyNo");

    if (searchInput) {
        searchInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                searchLand();   // 🔍 call your existing function
            }
        });
    }

    // 🤖 ENTER for Chatbot
    let chatInput = document.getElementById("chatInput");

    if (chatInput) {
        chatInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                chatbot();   // 🤖 call your existing chatbot
            }
        });
    }

});


// 🔄 SWITCH FORMS
function showSignup() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("signupBox").style.display = "block";
}

function showLogin() {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("signupBox").style.display = "none";
}

// 📝 SIGNUP FUNCTION
function signup() {
    let user = document.getElementById("newUsername").value;
    let pass = document.getElementById("newPassword").value;

    if (user === "" || pass === "") {
        alert("Please fill all fields");
        return;
    }

    // Save in browser
    localStorage.setItem("username", user);
    localStorage.setItem("password", pass);

    alert("✅ Registered successfully!");

    showLogin();
}

// 🔐 MODIFY LOGIN FUNCTION
function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    let savedUser = localStorage.getItem("username");
    let savedPass = localStorage.getItem("password");

    if (user === savedUser && pass === savedPass) {
        window.location.href = "index.html";
    } else {
        alert("❌ Invalid login");
    }
}
async function loadTotalLands() {
    let res = await fetch("http://127.0.0.1:8000/total_lands");
    let data = await res.json();

    document.getElementById("totalLands").innerHTML =
        `📊 Total Lands: ${data.total}`;
        loadTotalLands();
}
let reg = land["Registration Status"] || "Not Available";
let doc = land["Document Status"] || "Not Available";
let history = land["Ownership History"] || "Not Available";
