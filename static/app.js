// Bell sound for countdown completion
const bellSound = new Audio("https://orangefreesounds.com/wp-content/uploads/2024/02/Happy-bell-sound-effect.mp3");

// DOM Elements
const timerDisplay = document.getElementById("timer-display");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const finishButton = document.getElementById("finish-button");

const countdownDisplay = document.getElementById("countdown-display");
const countdownStartButton = document.getElementById("countdown-start-button");
const countdownPauseButton = document.getElementById("countdown-pause-button");
const countdownFinishButton = document.getElementById("countdown-finish-button");

const timerMinutesInput = document.getElementById("timer-minutes");
const timerSecondsInput = document.getElementById("timer-seconds");
const timerPresetButtons = document.querySelectorAll("[data-timer-preset]");

const sessionsTableBody = document.getElementById("sessions-table-body");
const weeklyStat = document.getElementById("weekly-total");
const monthlyStat = document.getElementById("monthly-total");
const yearlyStat = document.getElementById("yearly-total");
const totalStat = document.getElementById("total-time");
const totalSessionsStat = document.getElementById("total-sessions");
const weeklyTargetDisplay = document.getElementById("weekly-target");
const weeklyProgressBar = document.getElementById("weekly-progress-bar");
const weeklyProgressText = document.getElementById("weekly-progress-text");
const weeklyGoalForm = document.getElementById("weekly-goal-form");
const weeklyGoalInput = document.getElementById("weekly-goal-input");

// Stopwatch State
const stopwatchState = {
  interval: null,
  startTimestamp: null,
  initialStartTimestamp: null,
  elapsedBeforePause: 0,
  isRunning: false,
  hasSession: false,
};

// Countdown State
const countdownState = {
  interval: null,
  startTimestamp: null,
  initialStartTimestamp: null,
  targetDurationMs: 0,
  elapsedBeforePause: 0,
  isRunning: false,
  hasSession: false,
};

// Utility Functions
function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function formatCountdown(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

// Stopwatch Functions
function getStopwatchElapsed() {
  let elapsed = stopwatchState.elapsedBeforePause;
  if (stopwatchState.isRunning && stopwatchState.startTimestamp) {
    elapsed += Date.now() - stopwatchState.startTimestamp;
  }
  return elapsed;
}

function updateStopwatchDisplay() {
  const elapsedMs = getStopwatchElapsed();
  const displaySeconds = elapsedMs / 1000;
  timerDisplay.textContent = formatDuration(displaySeconds);
}

function startStopwatch() {
  if (stopwatchState.isRunning) return;

  const now = Date.now();
  if (!stopwatchState.hasSession) {
    stopwatchState.initialStartTimestamp = now;
    stopwatchState.elapsedBeforePause = 0;
    stopwatchState.hasSession = true;
  }

  stopwatchState.startTimestamp = now;
  stopwatchState.isRunning = true;
  stopwatchState.interval = setInterval(updateStopwatchDisplay, 250);
  updateStopwatchDisplay();
  updateStopwatchButtons();
}

function pauseStopwatch() {
  if (!stopwatchState.isRunning) return;

  if (stopwatchState.interval) {
    clearInterval(stopwatchState.interval);
    stopwatchState.interval = null;
  }

  stopwatchState.elapsedBeforePause += Date.now() - stopwatchState.startTimestamp;
  stopwatchState.startTimestamp = null;
  stopwatchState.isRunning = false;
  updateStopwatchDisplay();
  updateStopwatchButtons();
}

function resetStopwatch() {
  if (stopwatchState.interval) {
    clearInterval(stopwatchState.interval);
    stopwatchState.interval = null;
  }
  stopwatchState.startTimestamp = null;
  stopwatchState.initialStartTimestamp = null;
  stopwatchState.elapsedBeforePause = 0;
  stopwatchState.isRunning = false;
  stopwatchState.hasSession = false;
  updateStopwatchDisplay();
  updateStopwatchButtons();
}

async function finishStopwatch() {
  if (!stopwatchState.hasSession) return;

  const totalElapsed = getStopwatchElapsed();
  if (totalElapsed <= 0) return;

  const durationSeconds = totalElapsed / 1000;
  const endTime = new Date();
  const startTime = stopwatchState.initialStartTimestamp
    ? new Date(stopwatchState.initialStartTimestamp)
    : new Date(endTime.getTime() - totalElapsed);

  const payload = {
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_seconds: durationSeconds,
  };

  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to save session");
    }

    await Promise.all([loadSessions(), loadStats()]);
  } catch (error) {
    alert(error.message || "Something went wrong.");
  } finally {
    resetStopwatch();
  }
}

function updateStopwatchButtons() {
  startButton.disabled = stopwatchState.isRunning;
  pauseButton.disabled = !stopwatchState.isRunning;
  finishButton.disabled = !stopwatchState.hasSession;
}

// Countdown Functions
function getConfiguredTimerMs() {
  const minutes = Number(timerMinutesInput.value) || 0;
  const seconds = Number(timerSecondsInput.value) || 0;
  return (minutes * 60 + seconds) * 1000;
}

function getCountdownElapsed() {
  let elapsed = countdownState.elapsedBeforePause;
  if (countdownState.isRunning && countdownState.startTimestamp) {
    elapsed += Date.now() - countdownState.startTimestamp;
  }
  return elapsed;
}

function updateCountdownDisplay() {
  const elapsedMs = getCountdownElapsed();
  const targetMs = countdownState.hasSession ? countdownState.targetDurationMs : getConfiguredTimerMs();
  const remainingMs = Math.max(targetMs - elapsedMs, 0);
  const displaySeconds = remainingMs / 1000;

  countdownDisplay.textContent = formatCountdown(displaySeconds);

  // Auto-complete when countdown reaches zero
  if (countdownState.isRunning && countdownState.hasSession && remainingMs <= 0) {
    // Play bell sound
    bellSound.play().catch(err => console.log("Could not play sound:", err));
    finishCountdown(true);
  }
}

function startCountdown() {
  console.log("startCountdown called");
  console.log("countdownState:", countdownState);

  if (countdownState.isRunning) {
    console.log("Already running, returning");
    return;
  }

  const now = Date.now();
  if (!countdownState.hasSession) {
    const targetMs = getConfiguredTimerMs();
    console.log("Target duration (ms):", targetMs);

    if (targetMs <= 0) {
      alert("Please set a timer duration greater than zero.");
      return;
    }
    countdownState.targetDurationMs = targetMs;
    countdownState.initialStartTimestamp = now;
    countdownState.elapsedBeforePause = 0;
    countdownState.hasSession = true;
  }

  countdownState.startTimestamp = now;
  countdownState.isRunning = true;
  countdownState.interval = setInterval(updateCountdownDisplay, 250);
  updateCountdownDisplay();
  updateCountdownButtons();
  console.log("Countdown started");
}

function pauseCountdown() {
  if (!countdownState.isRunning) return;

  if (countdownState.interval) {
    clearInterval(countdownState.interval);
    countdownState.interval = null;
  }

  countdownState.elapsedBeforePause += Date.now() - countdownState.startTimestamp;
  countdownState.startTimestamp = null;
  countdownState.isRunning = false;
  updateCountdownDisplay();
  updateCountdownButtons();
}

function resetCountdown() {
  if (countdownState.interval) {
    clearInterval(countdownState.interval);
    countdownState.interval = null;
  }
  countdownState.startTimestamp = null;
  countdownState.initialStartTimestamp = null;
  countdownState.targetDurationMs = 0;
  countdownState.elapsedBeforePause = 0;
  countdownState.isRunning = false;
  countdownState.hasSession = false;
  updateCountdownDisplay();
  updateCountdownButtons();
}

async function finishCountdown(autoComplete = false) {
  if (!countdownState.hasSession) return;

  const totalElapsed = getCountdownElapsed();
  if (totalElapsed <= 0) return;

  let durationSeconds = totalElapsed / 1000;

  // If auto-completing, use the target duration
  if (autoComplete && countdownState.targetDurationMs > 0) {
    durationSeconds = countdownState.targetDurationMs / 1000;
  }

  const endTime = new Date();
  const startTime = countdownState.initialStartTimestamp
    ? new Date(countdownState.initialStartTimestamp)
    : new Date(endTime.getTime() - (durationSeconds * 1000));

  const payload = {
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_seconds: durationSeconds,
  };

  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to save session");
    }

    await Promise.all([loadSessions(), loadStats()]);
  } catch (error) {
    alert(error.message || "Something went wrong.");
  } finally {
    resetCountdown();
  }
}

function updateCountdownButtons() {
  countdownStartButton.disabled = countdownState.isRunning;
  countdownPauseButton.disabled = !countdownState.isRunning;
  countdownFinishButton.disabled = !countdownState.hasSession;

  // Disable timer config when session is active
  if (timerMinutesInput) timerMinutesInput.disabled = countdownState.hasSession;
  if (timerSecondsInput) timerSecondsInput.disabled = countdownState.hasSession;
  timerPresetButtons.forEach(btn => btn.disabled = countdownState.hasSession);
}

function applyTimerPreset(totalSeconds) {
  console.log("applyTimerPreset called with:", totalSeconds);

  if (countdownState.hasSession) {
    console.log("Session active, cannot change preset");
    return;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  console.log("Setting minutes to:", minutes, "seconds to:", seconds);
  timerMinutesInput.value = String(minutes);
  timerSecondsInput.value = String(seconds);
  updateCountdownDisplay();
  console.log("Preset applied");
}

// Data Functions
async function loadSessions() {
  const response = await fetch("/api/sessions");
  if (!response.ok) throw new Error("Unable to load sessions");
  const sessions = await response.json();
  renderSessions(sessions);
}

async function loadStats() {
  const response = await fetch("/api/stats");
  if (!response.ok) throw new Error("Unable to load stats");
  const stats = await response.json();

  weeklyStat.textContent = formatDuration(stats.weekly_seconds);
  monthlyStat.textContent = formatDuration(stats.monthly_seconds);
  yearlyStat.textContent = formatDuration(stats.yearly_seconds);
  totalStat.textContent = formatDuration(stats.total_seconds);
  totalSessionsStat.textContent = stats.total_sessions;
  renderWeeklyGoal(stats);
}

function renderSessions(sessions) {
  sessionsTableBody.innerHTML = "";
  sessions.forEach((session) => {
    const row = document.createElement("tr");

    const startCell = document.createElement("td");
    startCell.textContent = new Date(session.start_time).toLocaleString();

    const endCell = document.createElement("td");
    endCell.textContent = new Date(session.end_time).toLocaleString();

    const durationCell = document.createElement("td");
    durationCell.textContent = formatDuration(session.duration_seconds);

    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteSession(session.id));
    deleteCell.appendChild(deleteButton);

    row.appendChild(startCell);
    row.appendChild(endCell);
    row.appendChild(durationCell);
    row.appendChild(deleteCell);

    sessionsTableBody.appendChild(row);
  });
}

function renderWeeklyGoal(stats) {
  const targetSeconds = Number(stats.weekly_target_seconds) || 0;
  weeklyTargetDisplay.textContent = formatDuration(targetSeconds);

  if (weeklyGoalInput && !weeklyGoalInput.matches(":focus")) {
    weeklyGoalInput.value = targetSeconds > 0 ? Math.round(targetSeconds / 60) : "";
  }

  if (targetSeconds > 0) {
    const percent = Number(stats.weekly_progress_percentage) || 0;
    const clampedPercent = Math.max(0, Math.min(percent, 100));
    weeklyProgressBar.style.width = `${clampedPercent}%`;
    weeklyProgressText.textContent = `${Math.round(percent)}%`;
  } else {
    weeklyProgressBar.style.width = "0%";
    weeklyProgressText.textContent = "Set a target";
  }
}

async function deleteSession(sessionId) {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    alert("Failed to delete session");
    return;
  }
  await Promise.all([loadSessions(), loadStats()]);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded");
  console.log("Countdown start button:", countdownStartButton);
  console.log("Timer minutes input:", timerMinutesInput);
  console.log("Timer seconds input:", timerSecondsInput);
  console.log("Preset buttons:", timerPresetButtons);

  // Initialize displays
  updateStopwatchDisplay();
  updateCountdownDisplay();
  updateStopwatchButtons();
  updateCountdownButtons();

  // Load data
  try {
    await Promise.all([loadSessions(), loadStats()]);
  } catch (error) {
    console.error(error);
  }

  console.log("Initialization complete");
});

// Stopwatch buttons
startButton.addEventListener("click", startStopwatch);
pauseButton.addEventListener("click", pauseStopwatch);
finishButton.addEventListener("click", () => finishStopwatch());

// Countdown buttons
if (countdownStartButton) {
  console.log("Countdown start button found, adding listener");
  countdownStartButton.addEventListener("click", () => {
    console.log("Countdown start button clicked!");
    startCountdown();
  });
} else {
  console.error("Countdown start button NOT found!");
}

if (countdownPauseButton) {
  countdownPauseButton.addEventListener("click", pauseCountdown);
} else {
  console.error("Countdown pause button NOT found!");
}

if (countdownFinishButton) {
  countdownFinishButton.addEventListener("click", () => finishCountdown(false));
} else {
  console.error("Countdown finish button NOT found!");
}

// Timer input changes
timerMinutesInput.addEventListener("input", updateCountdownDisplay);
timerSecondsInput.addEventListener("input", updateCountdownDisplay);

// Preset buttons
console.log("Found", timerPresetButtons.length, "preset buttons");
timerPresetButtons.forEach((button, index) => {
  console.log(`Preset button ${index}:`, button.dataset.timerPreset);
  button.addEventListener("click", () => {
    console.log("Preset button clicked!");
    const presetSeconds = Number(button.dataset.timerPreset);
    console.log("Preset seconds:", presetSeconds);
    if (presetSeconds > 0) {
      applyTimerPreset(presetSeconds);
    }
  });
});

// Weekly goal form
weeklyGoalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const minutesValue = Number(weeklyGoalInput.value);
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    alert("Please enter a positive number of minutes.");
    return;
  }

  const payload = { target_seconds: minutesValue * 60 };

  try {
    weeklyGoalInput.disabled = true;
    const response = await fetch("/api/weekly-target", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Unable to update target");
    }

    await loadStats();
  } catch (error) {
    alert(error.message || "Something went wrong.");
  } finally {
    weeklyGoalInput.disabled = false;
  }
});
