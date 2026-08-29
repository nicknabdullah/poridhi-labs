// Configuration
const COLLECTOR_URL = "/status";
const REFRESH_INTERVAL = 5000;

// DOM Elements
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const systemStatus = document.getElementById("systemStatus");
const uptime = document.getElementById("uptime");
const memory = document.getElementById("memory");
const disk = document.getElementById("disk");
const lastUpdate = document.getElementById("lastUpdate");
const apiResponse = document.getElementById("apiResponse");
const refreshBtn = document.getElementById("refreshBtn");
const copyBtn = document.getElementById("copyBtn");

// State
let isOnline = false;
let refreshTimer = null;

// Update status badge
function updateStatusBadge(online) {
  isOnline = online;
  if (online) {
    statusText.textContent = "All Systems Online";
    statusDot.className = "dot online";
    systemStatus.textContent = "✅ Online";
    systemStatus.className = "metric-value online";
  } else {
    statusText.textContent = "System Offline";
    statusDot.className = "dot offline";
    systemStatus.textContent = "⚠️ Offline";
    systemStatus.className = "metric-value offline";
  }
}

// Format JSON with syntax highlighting
function formatJson(json) {
  try {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const formatted = JSON.stringify(obj, null, 2);
    return formatted.replace(
      /("(?:[^"\\]|\\.)*"):\s*("(?:[^"\\]|\\.)*"|true|false|null|\d+)/g,
      (match, key, value) => {
        const isString = value.startsWith('"');
        const isBoolean =
          value === "true" || value === "false" || value === "null";
        const isNumber = !isString && !isBoolean;

        let valueClass = "json-string";
        if (isBoolean) valueClass = "json-boolean";
        else if (isNumber) valueClass = "json-number";

        return `<span class="json-key">${key}</span>: <span class="${valueClass}">${value}</span>`;
      },
    );
  } catch {
    return json;
  }
}

// Fetch metrics from collector
async function fetchMetrics() {
  try {
    const response = await fetch(COLLECTOR_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    updateStatusBadge(true);
    apiResponse.innerHTML = formatJson(data);
    uptime.textContent = `${data.uptime_seconds} seconds`;
    memory.textContent = `${data.memory_percent}%`;
    disk.textContent = `${data.disk_percent}%`;
    lastUpdate.textContent = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    updateStatusBadge(false);
    apiResponse.innerHTML =
      "❌ Error: Could not connect to metrics collector\n\n" +
      "Please ensure the collector service is running.\n" +
      "Error: " +
      error.message;
    lastUpdate.textContent = "--";
  }
}

// Refresh with animation
function refreshMetrics() {
  refreshBtn.classList.add("spinning");
  fetchMetrics().finally(() => {
    setTimeout(() => {
      refreshBtn.classList.remove("spinning");
    }, 800);
  });
}

// Copy API response to clipboard
async function copyResponse() {
  const text = apiResponse.textContent || apiResponse.innerText;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.classList.remove("copied");
    }, 2000);
  }
}

// Event Listeners
refreshBtn.addEventListener("click", refreshMetrics);
copyBtn.addEventListener("click", copyResponse);

// Initial fetch
fetchMetrics();

// Auto-refresh every 5 seconds
refreshTimer = setInterval(fetchMetrics, REFRESH_INTERVAL);

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
