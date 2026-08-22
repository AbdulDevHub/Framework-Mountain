// ---------- Notes app logic (works with or without a network) ----------
const STORAGE_KEY = "pwa-notes";
const form = document.getElementById("note-form");
const input = document.getElementById("note-input");
const list = document.getElementById("note-list");

function loadNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes() {
  const notes = loadNotes();
  list.innerHTML = "";
  notes.forEach((note, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${note}</span><button class="delete" data-i="${i}">✕</button>`;
    list.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  const notes = loadNotes();
  notes.unshift(value);
  saveNotes(notes);
  input.value = "";
  renderNotes();
});

list.addEventListener("click", (e) => {
  if (!e.target.matches(".delete")) return;
  const i = Number(e.target.dataset.i);
  const notes = loadNotes();
  notes.splice(i, 1);
  saveNotes(notes);
  renderNotes();
});

renderNotes();

// ---------- Online / offline indicator ----------
const statusPill = document.getElementById("status-pill");

function updateOnlineStatus() {
  const online = navigator.onLine;
  statusPill.textContent = online ? "online" : "offline";
  statusPill.className = `pill ${online ? "pill-online" : "pill-offline"}`;
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

// ---------- Service worker registration ----------
const swStatus = document.getElementById("sw-status");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        swStatus.textContent = "service worker registered — offline caching is active";

        // Listen for a new service worker taking over (i.e. an app update)
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              swStatus.textContent = "a new version is ready — reload to update";
            }
          });
        });
      })
      .catch((err) => {
        swStatus.textContent = "service worker registration failed";
        console.error("SW registration failed:", err);
      });
  });
} else {
  swStatus.textContent = "service workers are not supported in this browser";
}

// ---------- "Add to Home Screen" install prompt ----------
const installBanner = document.getElementById("install-banner");
const installBtn = document.getElementById("install-btn");
const dismissBtn = document.getElementById("dismiss-btn");
let deferredPrompt = null;

// Chrome/Edge/Android fire this instead of showing their own install UI,
// which lets us show a custom prompt at a moment of our choosing.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log("Install prompt outcome:", outcome); // "accepted" or "dismissed"
  deferredPrompt = null;
  installBanner.classList.add("hidden");
});

dismissBtn.addEventListener("click", () => {
  installBanner.classList.add("hidden");
});

// Fired once the app is actually installed (any browser)
window.addEventListener("appinstalled", () => {
  installBanner.classList.add("hidden");
  console.log("PWA was installed");
});
