const timerDisplay = document.getElementById("timer-display");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const finishButton = document.getElementById("finish-button");
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
const weeklyGoalSaveButton = document.querySelector(".goal-save-button");

const modes = {
  STOPWATCH: "stopwatch",
  TIMER: "timer",
};

const modeButtons = {
  [modes.STOPWATCH]: document.getElementById("mode-stopwatch"),
  [modes.TIMER]: document.getElementById("mode-timer"),
};

const timerConfig = document.getElementById("timer-config");
const timerMinutesInput = document.getElementById("timer-minutes");
const timerSecondsInput = document.getElementById("timer-seconds");
const timerPresetButtons = document.querySelectorAll("[data-timer-preset]");

const state = {
  timerInterval: null,
  sessionStartTimestamp: null,
  initialStartTimestamp: null,
  elapsedBeforePause: 0,
  isRunning: false,
  hasSession: false,
  mode: modes.STOPWATCH,
  targetDurationMs: 0,
  visibilityPromptActive: false,
  autoCompleting: false,
};

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function normalizeTimerInputs() {
  if (!timerMinutesInput || !timerSecondsInput) {
    return;
  }

  let minutes = parseInt(timerMinutesInput.value, 10);
  if (!Number.isFinite(minutes) || minutes < 0) {
    minutes = 0;
  }
  if (minutes > 999) {
    minutes = 999;
  }

  let seconds = parseInt(timerSecondsInput.value, 10);
  if (!Number.isFinite(seconds) || seconds < 0) {
    seconds = 0;
  }
  if (seconds > 59) {
    seconds = 59;
  }

  timerMinutesInput.value = String(minutes);
  timerSecondsInput.value = String(seconds);
  updateTimerDisplay();
}

function getConfiguredTimerMs() {
  if (!timerMinutesInput || !timerSecondsInput) {
    return 0;
  }
  const minutes = Number(timerMinutesInput.value) || 0;
  const seconds = Number(timerSecondsInput.value) || 0;
  const totalSeconds = minutes * 60 + seconds;
  return totalSeconds * 1000;
}

function updateModeButtons() {
  Object.entries(modeButtons).forEach(([mode, button]) => {
    if (!button) {
      return;
    }
    if (mode === state.mode) {
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    }
  });
}

function updateTimerConfigVisibility() {
  if (!timerConfig) {
    return;
  }
  if (state.mode === modes.TIMER) {
    timerConfig.classList.remove("hidden");
    timerConfig.setAttribute("aria-hidden", "false");
  } else {
    timerConfig.classList.add("hidden");
    timerConfig.setAttribute("aria-hidden", "true");
  }
}

function updateTimerConfigAvailability() {
  const disabled = state.hasSession;
  if (timerMinutesInput) {
    timerMinutesInput.disabled = disabled;
  }
  if (timerSecondsInput) {
    timerSecondsInput.disabled = disabled;
  }
  if (timerConfig) {
    timerConfig.classList.toggle("disabled", disabled);
    timerConfig.setAttribute("aria-disabled", String(disabled));
  }
  timerPresetButtons.forEach((button) => {
    button.disabled = disabled;
    button.setAttribute("aria-disabled", String(disabled));
  });
}

function setMode(mode, options = {}) {
  const { skipConfirm = false } = options;
  if (!Object.values(modes).includes(mode)) {
    return;
  }

  if (mode === state.mode) {
    updateModeButtons();
    updateTimerConfigVisibility();
    updateTimerConfigAvailability();
    updateTimerDisplay();
    return;
  }

  if (state.hasSession && !skipConfirm) {
    const confirmed = window.confirm(
      "Switching modes will reset your current session. Continue?"
    );
    if (!confirmed) {
      return;
    }
    resetTimer();
  } else if (state.hasSession) {
    resetTimer();
  }

  state.mode = mode;
  updateModeButtons();
  updateTimerConfigVisibility();
  if (state.mode === modes.TIMER) {
    normalizeTimerInputs();
  }
  updateTimerConfigAvailability();
  updateTimerDisplay();
}

function getElapsedMs() {
  let elapsed = state.elapsedBeforePause;
  if (state.isRunning && state.sessionStartTimestamp) {
    elapsed += Date.now() - state.sessionStartTimestamp;
  }
  return elapsed;
}

function updateTimerDisplay() {
  let displaySeconds = 0;
  const elapsedMs = getElapsedMs();

  if (state.mode === modes.STOPWATCH) {
    displaySeconds = elapsedMs / 1000;
  } else {
    const targetMs = state.hasSession ? state.targetDurationMs : getConfiguredTimerMs();
    const remainingMs = Math.max(targetMs - elapsedMs, 0);
    displaySeconds = remainingMs / 1000;

    if (
      state.isRunning &&
      state.hasSession &&
      targetMs > 0 &&
      !state.autoCompleting &&
      elapsedMs >= targetMs
    ) {
      handleTimerAutoCompletion();
      return;
    }
  }

  timerDisplay.textContent = formatDuration(displaySeconds);
}

function updateButtonState() {
  startButton.disabled = state.isRunning;
  pauseButton.disabled = !state.isRunning;
  finishButton.disabled = !state.hasSession;
  updateTimerConfigAvailability();
}

function startTimer() {
  if (state.isRunning) {
    return;
  }

  const now = Date.now();

  if (!state.hasSession) {
    if (state.mode === modes.TIMER) {
      const targetMs = getConfiguredTimerMs();
      if (targetMs <= 0) {
        alert("Please set a timer duration greater than zero.");
        return;
      }
      state.targetDurationMs = targetMs;
    } else {
      state.targetDurationMs = 0;
    }

    state.initialStartTimestamp = now;
    state.elapsedBeforePause = 0;
    state.hasSession = true;
  }

  state.sessionStartTimestamp = now;
  state.isRunning = true;
  state.timerInterval = setInterval(updateTimerDisplay, 250);
  updateTimerDisplay();
  updateButtonState();
}

function pauseTimer() {
  if (!state.isRunning) {
    return;
  }

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  state.elapsedBeforePause += Date.now() - state.sessionStartTimestamp;
  state.sessionStartTimestamp = null;
  state.isRunning = false;
  updateTimerDisplay();
  updateButtonState();
}

function resetTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  state.timerInterval = null;
  state.sessionStartTimestamp = null;
  state.initialStartTimestamp = null;
  state.elapsedBeforePause = 0;
  state.isRunning = false;
  state.hasSession = false;
  state.targetDurationMs = 0;
  state.visibilityPromptActive = false;
  state.autoCompleting = false;
  updateTimerDisplay();
  updateButtonState();
}

function applyTimerPreset(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return;
  }

  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds % 60);

  if (minutes > 999) {
    minutes = 999;
    seconds = 59;
  }

  if (timerMinutesInput) {
    timerMinutesInput.value = String(minutes);
  }
  if (timerSecondsInput) {
    timerSecondsInput.value = String(seconds);
  }

  state.targetDurationMs = 0;
  normalizeTimerInputs();
}

function setGoalSaving(saving) {
  if (weeklyGoalInput) {
    weeklyGoalInput.disabled = saving;
  }
  if (weeklyGoalSaveButton) {
    weeklyGoalSaveButton.disabled = saving;
  }
}

function renderWeeklyGoal(stats) {
  if (!weeklyTargetDisplay || !weeklyProgressBar || !weeklyProgressText) {
    return;
  }

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

async function loadSessions() {
  const response = await fetch("/api/sessions");
  if (!response.ok) {
    throw new Error("Unable to load sessions");
  }
  const sessions = await response.json();
  renderSessions(sessions);
}

async function loadStats() {
  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Unable to load stats");
  }
  const stats = await response.json();
  weeklyStat.textContent = formatDuration(stats.weekly_seconds);
  monthlyStat.textContent = formatDuration(stats.monthly_seconds);
  yearlyStat.textContent = formatDuration(stats.yearly_seconds);
  totalStat.textContent = formatDuration(stats.total_seconds);
  totalSessionsStat.textContent = stats.total_sessions;
  renderWeeklyGoal(stats);
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

async function finishTimer(options = {}) {
  const { autoComplete = false } = options;

  if (!state.hasSession) {
    return;
  }

  let totalElapsed = getElapsedMs();

  if (totalElapsed <= 0) {
    return;
  }

  let durationSeconds = totalElapsed / 1000;

  if (state.mode === modes.TIMER) {
    const targetSeconds = state.targetDurationMs > 0 ? state.targetDurationMs / 1000 : 0;
    if (autoComplete && targetSeconds > 0) {
      durationSeconds = targetSeconds;
      totalElapsed = state.targetDurationMs;
    }
  }

  const endTime = new Date();
  const startTime = state.initialStartTimestamp
    ? new Date(state.initialStartTimestamp)
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
    resetTimer();
  }
}

function handleTimerAutoCompletion() {
  if (state.autoCompleting) {
    return;
  }
  state.autoCompleting = true;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  finishTimer({ autoComplete: true });
}

async function init() {
  if (timerMinutesInput && !timerMinutesInput.value) {
    timerMinutesInput.value = "5";
  }
  if (timerSecondsInput && !timerSecondsInput.value) {
    timerSecondsInput.value = "0";
  }

  normalizeTimerInputs();
  setMode(state.mode, { skipConfirm: true });
  resetTimer();

  try {
    await Promise.all([loadSessions(), loadStats()]);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);

startButton?.addEventListener("click", () => {
  startTimer();
});

pauseButton?.addEventListener("click", () => {
  pauseTimer();
});

finishButton?.addEventListener("click", () => {
  finishTimer();
});

modeButtons[modes.STOPWATCH]?.addEventListener("click", () => {
  setMode(modes.STOPWATCH);
});

modeButtons[modes.TIMER]?.addEventListener("click", () => {
  setMode(modes.TIMER);
});

timerMinutesInput?.addEventListener("input", normalizeTimerInputs);
timerSecondsInput?.addEventListener("input", normalizeTimerInputs);

timerPresetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.hasSession) {
      return;
    }

    const presetSeconds = Number(button.dataset.timerPreset);
    if (!Number.isFinite(presetSeconds) || presetSeconds <= 0) {
      return;
    }

    if (state.mode !== modes.TIMER) {
      setMode(modes.TIMER, { skipConfirm: true });
    }

    applyTimerPreset(presetSeconds);
  });
});

weeklyGoalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!weeklyGoalInput) {
    return;
  }

  const minutesValue = Number(weeklyGoalInput.value);
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    alert("Please enter a positive number of minutes.");
    return;
  }

  const payload = {
    target_seconds: minutesValue * 60,
  };

  try {
    setGoalSaving(true);
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
    setGoalSaving(false);
  }
});

document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    state.visibilityPromptActive = false;
    return;
  }

  if (!state.isRunning || state.visibilityPromptActive || state.autoCompleting) {
    return;
  }

  state.visibilityPromptActive = true;
  const confirmFinish = window.confirm(
    "Your meditation timer is running. Finish the session before leaving this tab?"
  );

  if (confirmFinish) {
    try {
      await finishTimer();
    } finally {
      state.visibilityPromptActive = false;
    }
  } else {
    pauseTimer();
    state.visibilityPromptActive = false;
  }
});
