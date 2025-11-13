const { useCallback, useEffect, useMemo, useRef, useState } = React;

const CORRECT_PASSWORD = "upalupal";
const BELL_SOUND_URL =
  "https://orangefreesounds.com/wp-content/uploads/2024/02/Happy-bell-sound-effect.mp3";
const AUTH_COOKIE_NAME = "mt_auth";
const AUTH_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const QUOTES = [
  "Meditation is not evasion; it is a serene encounter with reality. — Thich Nhat Hanh",
  "The thing about meditation is: you become more and more you. — David Lynch",
  "Quiet the mind, and the soul will speak. — Ma Jaya Sati Bhagavati",
  "Meditation is the discovery that the point of life is always arrived at in the immediate moment. — Alan Watts",
  "Inhale the future, exhale the past. — Unknown",
  "The goal of meditation isn't to control your thoughts, it's to stop letting them control you. — Unknown",
  "Within you there is a stillness and a sanctuary to which you can retreat at any time. — Hermann Hesse",
  "Meditation is the tongue of the soul and the language of our spirit. — Jeremy Taylor",
  "The quieter you become, the more you can hear. — Ram Dass",
  "You should sit in meditation for twenty minutes every day—unless you're too busy; then you should sit for an hour. — Zen Proverb",
];
const TIMER_PRESETS = [
  { label: "2 min", value: 120 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
];
const YOUTUBE_EMBED =
  "https://www.youtube.com/embed/8sYK7lm3UKg?si=5-UyVXF5I7VI6rkg";

// Sidebar Component
function Sidebar({ isOpen, currentPage, onNavigate, onToggle }) {
  const menuItems = [
    { id: "meditation", label: "Meditation", icon: "🧘" },
    { id: "pomodoro", label: "Pomodoro", icon: "🍅" },
    { id: "journal", label: "Journal", icon: "📔" },
  ];

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`fixed top-5 z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-2xl text-white shadow-2xl ring-2 ring-slate-600 transition-all hover:bg-slate-600 hover:ring-slate-500 hover:shadow-xl ${isOpen ? "left-[270px]" : "left-5"
          }`}
      >
        {isOpen ? "◀" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-full w-64 transform bg-gradient-to-b from-slate-200 to-slate-300 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-64"
          }`}
      >
        <div className="flex h-16 items-center justify-between border-b-2 border-slate-400/50 bg-slate-300/80 px-5 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-800">Menu</h2>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 border-l-4 px-5 py-4 text-left text-base font-semibold transition-all ${currentPage === item.id
                ? "border-l-blue-600 bg-blue-100 text-blue-900 shadow-md"
                : "border-l-transparent text-slate-700 hover:border-l-slate-400 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

// Pomodoro Page Component
function PomodoroPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="inline-flex rounded-full bg-slate-900/90 px-4 py-1 text-sm font-semibold text-slate-100 shadow">
          Pomodoro Timer 🍅
        </p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Focus & Productivity
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Coming soon! Use the Pomodoro Technique to boost your productivity.
        </p>
      </header>

      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg ring-1 ring-slate-200">
        <div className="text-6xl mb-6">🍅</div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Pomodoro Timer
        </h2>
        <p className="text-slate-600">
          This feature is under development. Check back soon!
        </p>
      </div>
    </div>
  );
}

// Journal Page Component
function JournalPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="inline-flex rounded-full bg-slate-900/90 px-4 py-1 text-sm font-semibold text-slate-100 shadow">
          Journal 📔
        </p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Meditation Journal
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Coming soon! Track your meditation insights and reflections.
        </p>
      </header>

      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg ring-1 ring-slate-200">
        <div className="text-6xl mb-6">📔</div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Journal
        </h2>
        <p className="text-slate-600">
          This feature is under development. Check back soon!
        </p>
      </div>
    </div>
  );
}

function createInitialStopwatchState() {
  return {
    elapsedMs: 0,
    isRunning: false,
    startTimestamp: null,
    hasSession: false,
    initialStartTimestamp: null,
  };
}

function createInitialCountdownState() {
  return {
    elapsedMs: 0,
    targetDurationMs: 0,
    isRunning: false,
    hasSession: false,
    startTimestamp: null,
    initialStartTimestamp: null,
    isCompleting: false,
  };
}

function formatDurationHMS(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function secondsFromInputs(inputs) {
  const minutes = Number.parseInt(inputs.minutes, 10);
  const seconds = Number.parseInt(inputs.seconds, 10);
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  return Math.max(0, safeMinutes * 60 + Math.min(safeSeconds, 59));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleString();
}

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function readCookie(name) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setCookie(name, value, { expires } = {}) {
  const expiresStr =
    expires instanceof Date ? `; expires=${expires.toUTCString()}` : "";
  document.cookie = `${name}=${value}; path=/; SameSite=Lax${expiresStr}`;
}

function clearCookie(name) {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        message = data.detail;
      }
    } catch (error) {
      // Ignore parse errors, fall back to default message
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function GradientButton({ className = "", children, ...rest }) {
  const base =
    "rounded-full px-5 py-2.5 font-semibold shadow-sm transition bg-gradient-to-r from-brand-rose to-brand-roseLight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-rose disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}

function PasswordModal({
  isVisible,
  password,
  onPasswordChange,
  onSubmit,
  error,
  inputRef,
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">
          🔒 Access Required
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Enter the password to unlock the meditation tracker.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="password-input"
            >
              Password
            </label>
            <input
              id="password-input"
              ref={inputRef}
              type="password"
              autoComplete="off"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
            {error ? (
              <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
            ) : null}
          </div>
          <GradientButton
            type="submit"
            className="w-full from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
          >
            Unlock
          </GradientButton>
        </form>
      </div>
    </div>
  );
}

function CountdownCompleteModal({ open, quote, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">
          🧘 Session Complete!
        </h2>
        <p className="mt-4 text-base italic text-slate-600">{quote}</p>
        <button
          type="button"
          className="mt-6 rounded-full bg-[#CA6B52] px-5 py-2.5 font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA6B52] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function MeditationApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const passwordInputRef = useRef(null);
  const [authExpiry, setAuthExpiry] = useState(null);
  const authTimeoutRef = useRef(null);

  // Sidebar and navigation state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("meditation");

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);

  const [stopwatch, setStopwatch] = useState(createInitialStopwatchState);
  const [countdown, setCountdown] = useState(createInitialCountdownState);

  const stopwatchRef = useRef(stopwatch);
  const countdownRef = useRef(countdown);

  const [stopwatchTick, setStopwatchTick] = useState(0);
  const [countdownTick, setCountdownTick] = useState(0);

  const stopwatchIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const [timerInputs, setTimerInputs] = useState({ minutes: "0", seconds: "0" });
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [modalQuote, setModalQuote] = useState("");

  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState("");
  const weeklyGoalInputRef = useRef(null);
  const [isSavingWeeklyGoal, setIsSavingWeeklyGoal] = useState(false);

  const bellRef = useRef(null);

  useEffect(() => {
    stopwatchRef.current = stopwatch;
  }, [stopwatch]);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    if (stopwatch.isRunning) {
      stopwatchIntervalRef.current = window.setInterval(() => {
        setStopwatchTick((tick) => tick + 1);
      }, 250);
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        window.clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
    };
  }, [stopwatch.isRunning]);

  useEffect(() => {
    if (countdown.isRunning) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTick((tick) => tick + 1);
      }, 250);
    }
    return () => {
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [countdown.isRunning]);

  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        window.clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    bellRef.current = new Audio(BELL_SOUND_URL);
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        requestJson("/api/sessions"),
        requestJson("/api/stats"),
      ]);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setStats(statsData ?? null);
      setDataError("");
    } catch (error) {
      console.error(error);
      setDataError(error.message || "Failed to load data.");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const resetStopwatchState = useCallback(() => {
    const next = createInitialStopwatchState();
    stopwatchRef.current = next;
    setStopwatch(next);
  }, []);

  const resetCountdownState = useCallback(() => {
    const next = createInitialCountdownState();
    countdownRef.current = next;
    setCountdown(next);
  }, []);

  const handleStopwatchStart = useCallback(() => {
    setStopwatch((prev) => {
      if (prev.isRunning) {
        return prev;
      }
      const now = Date.now();
      const next = prev.hasSession
        ? { ...prev, isRunning: true, startTimestamp: now }
        : {
          ...createInitialStopwatchState(),
          isRunning: true,
          hasSession: true,
          startTimestamp: now,
          initialStartTimestamp: now,
        };
      stopwatchRef.current = next;
      return next;
    });
  }, []);

  const handleStopwatchPause = useCallback(() => {
    setStopwatch((prev) => {
      if (!prev.isRunning || !prev.startTimestamp) {
        return prev;
      }
      const now = Date.now();
      const next = {
        ...prev,
        elapsedMs: prev.elapsedMs + (now - prev.startTimestamp),
        isRunning: false,
        startTimestamp: null,
      };
      stopwatchRef.current = next;
      return next;
    });
  }, []);

  const handleStopwatchFinish = useCallback(async () => {
    const current = stopwatchRef.current;
    if (!current.hasSession) {
      return;
    }
    let totalMs = current.elapsedMs;
    if (current.isRunning && current.startTimestamp) {
      totalMs += Date.now() - current.startTimestamp;
    }
    if (totalMs <= 0) {
      resetStopwatchState();
      return;
    }
    const durationSeconds = totalMs / 1000;
    const endTime = new Date();
    const startTime = current.initialStartTimestamp
      ? new Date(current.initialStartTimestamp)
      : new Date(endTime.getTime() - totalMs);

    try {
      await requestJson("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
        }),
      });
      await loadAllData();
    } catch (error) {
      window.alert(error.message || "Failed to save session.");
    } finally {
      resetStopwatchState();
    }
  }, [loadAllData, resetStopwatchState]);

  const handleCountdownStart = useCallback(() => {
    setCountdown((prev) => {
      if (prev.isRunning) {
        return prev;
      }
      const now = Date.now();
      if (!prev.hasSession) {
        const totalSeconds = secondsFromInputs(timerInputs);
        if (totalSeconds <= 0) {
          window.alert("Please set a timer duration greater than zero.");
          return prev;
        }
        const next = {
          ...createInitialCountdownState(),
          elapsedMs: 0,
          targetDurationMs: totalSeconds * 1000,
          isRunning: true,
          hasSession: true,
          startTimestamp: now,
          initialStartTimestamp: now,
        };
        countdownRef.current = next;
        return next;
      }
      const next = { ...prev, isRunning: true, startTimestamp: now };
      countdownRef.current = next;
      return next;
    });
  }, [timerInputs]);

  const handleCountdownPause = useCallback(() => {
    setCountdown((prev) => {
      if (!prev.isRunning || !prev.startTimestamp) {
        return prev;
      }
      const now = Date.now();
      const next = {
        ...prev,
        elapsedMs: prev.elapsedMs + (now - prev.startTimestamp),
        isRunning: false,
        startTimestamp: null,
      };
      countdownRef.current = next;
      return next;
    });
  }, []);

  const handleCountdownFinish = useCallback(
    async (autoComplete = false) => {
      const current = countdownRef.current;
      if (!current.hasSession || current.isCompleting) {
        return;
      }

      const now = Date.now();
      let totalMs = current.elapsedMs;
      if (current.isRunning && current.startTimestamp) {
        totalMs += now - current.startTimestamp;
      }

      if (totalMs <= 0) {
        resetCountdownState();
        return;
      }

      let durationSeconds = totalMs / 1000;
      if (autoComplete && current.targetDurationMs > 0) {
        durationSeconds = current.targetDurationMs / 1000;
      }

      const endTime = new Date();
      const startTime = current.initialStartTimestamp
        ? new Date(current.initialStartTimestamp)
        : new Date(endTime.getTime() - durationSeconds * 1000);

      const updatingState = {
        ...current,
        isRunning: false,
        isCompleting: true,
        startTimestamp: null,
      };
      countdownRef.current = updatingState;
      setCountdown(updatingState);

      try {
        await requestJson("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_seconds: durationSeconds,
          }),
        });
        await loadAllData();
        if (autoComplete) {
          setModalQuote(getRandomQuote());
          setShowCountdownModal(true);
        }
      } catch (error) {
        window.alert(error.message || "Failed to save session.");
      } finally {
        resetCountdownState();
      }
    },
    [loadAllData, resetCountdownState]
  );

  const handleCountdownReset = useCallback(() => {
    resetCountdownState();
    setTimerInputs({ minutes: "0", seconds: "0" });
  }, [resetCountdownState]);

  useEffect(() => {
    if (!countdown.isRunning || !countdown.hasSession || countdown.isCompleting) {
      return;
    }
    const totalElapsed =
      countdown.elapsedMs +
      (countdown.startTimestamp ? Date.now() - countdown.startTimestamp : 0);
    if (
      countdown.targetDurationMs > 0 &&
      totalElapsed >= countdown.targetDurationMs
    ) {
      if (bellRef.current) {
        try {
          bellRef.current.currentTime = 0;
          void bellRef.current.play();
        } catch (error) {
          // Ignore autoplay failures
        }
      }
      handleCountdownFinish(true);
    }
  }, [
    countdownTick,
    countdown.elapsedMs,
    countdown.hasSession,
    countdown.isCompleting,
    countdown.isRunning,
    countdown.startTimestamp,
    countdown.targetDurationMs,
    handleCountdownFinish,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      passwordInputRef.current?.focus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  useEffect(() => {
    if (!stats) {
      return;
    }
    const minutes =
      stats.weekly_target_seconds && stats.weekly_target_seconds > 0
        ? Math.round(stats.weekly_target_seconds / 60)
        : "";
    if (document.activeElement !== weeklyGoalInputRef.current) {
      setWeeklyGoalMinutes(minutes ? String(minutes) : "");
    }
  }, [stats]);

  const handleLogout = useCallback(() => {
    if (authTimeoutRef.current) {
      window.clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    clearCookie(AUTH_COOKIE_NAME);
    setIsAuthenticated(false);
    setAuthExpiry(null);
    setPassword("");
    setPasswordError("Session expired. Please log in again.");
    passwordInputRef.current?.focus();
  }, []);

  const scheduleLogout = useCallback(
    (expiryTimestamp) => {
      if (authTimeoutRef.current) {
        window.clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      const remaining = expiryTimestamp - Date.now();
      if (remaining <= 0) {
        handleLogout();
        return;
      }
      authTimeoutRef.current = window.setTimeout(() => {
        handleLogout();
      }, remaining);
    },
    [handleLogout]
  );

  const handlePasswordSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (password.trim() === CORRECT_PASSWORD) {
        setIsAuthenticated(true);
        setPassword("");
        setPasswordError("");
        const expiryTimestamp = Date.now() + AUTH_DURATION_MS;
        setAuthExpiry(expiryTimestamp);
        setCookie(AUTH_COOKIE_NAME, String(expiryTimestamp), {
          expires: new Date(expiryTimestamp),
        });
        scheduleLogout(expiryTimestamp);
        return;
      }
      setPasswordError("❌ Wrong password. Try again.");
      setPassword("");
      window.requestAnimationFrame(() => {
        passwordInputRef.current?.focus();
      });
    },
    [password, scheduleLogout]
  );

  const handleTimerInputChange = useCallback((field, value) => {
    setTimerInputs((prev) => {
      const next = { ...prev, [field]: value };
      return next;
    });
  }, []);

  useEffect(() => {
    const cookieValue = readCookie(AUTH_COOKIE_NAME);
    if (!cookieValue) {
      return;
    }
    const parsed = Number(cookieValue);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      clearCookie(AUTH_COOKIE_NAME);
      return;
    }
    setIsAuthenticated(true);
    setAuthExpiry(parsed);
    scheduleLogout(parsed);
  }, [scheduleLogout]);

  useEffect(() => {
    if (!authExpiry) {
      return;
    }
    scheduleLogout(authExpiry);
  }, [authExpiry, scheduleLogout]);

  const applyTimerPreset = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.max(seconds % 60, 0);
    setTimerInputs({
      minutes: String(minutes),
      seconds: String(remainingSeconds),
    });
  }, []);

  const handleWeeklyGoalSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const minutesValue = Number(weeklyGoalMinutes);
      if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
        window.alert("Please enter a positive number of minutes.");
        return;
      }
      try {
        setIsSavingWeeklyGoal(true);
        await requestJson("/api/weekly-target", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_seconds: minutesValue * 60 }),
        });
        await loadAllData();
      } catch (error) {
        window.alert(error.message || "Unable to update target.");
      } finally {
        setIsSavingWeeklyGoal(false);
      }
    },
    [weeklyGoalMinutes, loadAllData]
  );

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      try {
        await requestJson(`/api/sessions/${sessionId}`, {
          method: "DELETE",
        });
        await loadAllData();
      } catch (error) {
        window.alert(error.message || "Failed to delete session.");
      }
    },
    [loadAllData]
  );

  const statsSnapshot = useMemo(
    () => ({
      weekly_seconds: stats?.weekly_seconds ?? 0,
      monthly_seconds: stats?.monthly_seconds ?? 0,
      yearly_seconds: stats?.yearly_seconds ?? 0,
      total_seconds: stats?.total_seconds ?? 0,
      total_sessions: stats?.total_sessions ?? 0,
      weekly_target_seconds: stats?.weekly_target_seconds ?? 0,
      weekly_progress_percentage: stats?.weekly_progress_percentage ?? 0,
    }),
    [stats]
  );

  const countdownConfiguredMs = useMemo(
    () => secondsFromInputs(timerInputs) * 1000,
    [timerInputs]
  );

  const renderNow = Date.now();
  const stopwatchDisplay = formatDurationHMS(
    (stopwatch.elapsedMs +
      (stopwatch.isRunning && stopwatch.startTimestamp
        ? renderNow - stopwatch.startTimestamp
        : 0)) /
    1000
  );

  const countdownElapsedMs =
    countdown.elapsedMs +
    (countdown.isRunning && countdown.startTimestamp
      ? renderNow - countdown.startTimestamp
      : 0);

  const countdownRemainingMs = countdown.hasSession
    ? Math.max(countdown.targetDurationMs - countdownElapsedMs, 0)
    : countdownConfiguredMs;

  const countdownDisplay = formatCountdown(countdownRemainingMs / 1000);

  const weeklyTargetSeconds = statsSnapshot.weekly_target_seconds;
  const weeklyProgressLabel =
    weeklyTargetSeconds > 0
      ? `${Math.round(statsSnapshot.weekly_progress_percentage)}%`
      : "Set a target";
  const weeklyProgressWidth =
    weeklyTargetSeconds > 0
      ? `${clamp(statsSnapshot.weekly_progress_percentage, 0, 100)}%`
      : "0%";
  const isStatsLoading = isLoadingData && !stats;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200">
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar
          isOpen={sidebarOpen}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content */}
      <div
        className={`min-h-screen pb-16 transition-all duration-300 ${isAuthenticated && sidebarOpen ? "lg:ml-64" : ""
          }`}
      >
        <div
          className={`mx-auto w-full max-w-6xl px-4 py-10 transition duration-300 ${isAuthenticated ? "" : "pointer-events-none blur-md"
            }`}
        >
          {/* Meditation Page Content */}
          {currentPage === "meditation" && (
            <>
              <header className="mb-10 space-y-3">
                <p className="inline-flex rounded-full bg-slate-900/90 px-4 py-1 text-sm font-semibold text-slate-100 shadow">
                  Upal&apos;s Meditation Tracker 🕉️
                </p>
                <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
                  Track, reflect, and celebrate your practice...
                </h1>
                <p className="max-w-2xl text-base text-slate-600">
                  Use the stopwatch or countdown timer to log sessions, stay aligned
                  with your weekly target, and review your progress over time.
                </p>
                {isLoadingData ? (
                  <p className="text-sm font-medium text-slate-500">
                    Refreshing your latest stats…
                  </p>
                ) : null}
              </header>

              {dataError ? (
                <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {dataError}
                </div>
              ) : null}

              <section className="mb-8">
                <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-lg ring-1 ring-slate-200">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={YOUTUBE_EMBED}
                      title="Meditation guidance"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Stopwatch
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Start and pause freely, then finish to log a session.
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <div className="font-mono text-4xl font-semibold tracking-widest text-slate-900 sm:text-5xl">
                      {stopwatchDisplay}
                    </div>
                  </div>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <GradientButton
                      type="button"
                      disabled={stopwatch.isRunning}
                      onClick={handleStopwatchStart}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Start / Resume
                    </GradientButton>
                    <GradientButton
                      type="button"
                      disabled={!stopwatch.isRunning}
                      onClick={handleStopwatchPause}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Pause
                    </GradientButton>
                    <GradientButton
                      type="button"
                      disabled={!stopwatch.hasSession}
                      onClick={handleStopwatchFinish}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Finish
                    </GradientButton>
                  </div>
                </section>

                <section className="rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Countdown Timer
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Set a duration, start the timer, and we&apos;ll log it when you
                        finish.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
                      onClick={handleCountdownReset}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-5">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <label className="text-sm font-medium text-slate-600" htmlFor="timer-minutes">
                        Minutes
                      </label>
                      <input
                        id="timer-minutes"
                        type="number"
                        min="0"
                        max="999"
                        inputMode="numeric"
                        value={timerInputs.minutes}
                        disabled={countdown.hasSession}
                        onChange={(event) =>
                          handleTimerInputChange("minutes", event.target.value)
                        }
                        className="w-24 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <label className="text-sm font-medium text-slate-600" htmlFor="timer-seconds">
                        Seconds
                      </label>
                      <input
                        id="timer-seconds"
                        type="number"
                        min="0"
                        max="59"
                        inputMode="numeric"
                        value={timerInputs.seconds}
                        disabled={countdown.hasSession}
                        onChange={(event) =>
                          handleTimerInputChange("seconds", event.target.value)
                        }
                        className="w-24 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {TIMER_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          disabled={countdown.hasSession}
                          onClick={() => applyTimerPreset(preset.value)}
                          className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <div className="font-mono text-4xl font-semibold tracking-widest text-slate-900 sm:text-5xl">
                      {countdownDisplay}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <GradientButton
                      type="button"
                      disabled={countdown.isRunning}
                      onClick={handleCountdownStart}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Start Countdown
                    </GradientButton>
                    <GradientButton
                      type="button"
                      disabled={!countdown.isRunning}
                      onClick={handleCountdownPause}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Pause
                    </GradientButton>
                    <GradientButton
                      type="button"
                      disabled={!countdown.hasSession}
                      onClick={() => handleCountdownFinish(false)}
                      className="from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                    >
                      Finish
                    </GradientButton>
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                <h2 className="text-xl font-semibold text-slate-900">Your Stats</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep an eye on your consistency across different time horizons.
                </p>
                {isStatsLoading ? (
                  <div
                    className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-600"
                    aria-live="polite"
                  >
                    <span
                      className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#CA6A51]"
                      aria-hidden="true"
                    />
                    Loading your progress…
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                      label="This Week"
                      value={formatDurationHMS(statsSnapshot.weekly_seconds)}
                    />
                    <StatCard
                      label="This Month"
                      value={formatDurationHMS(statsSnapshot.monthly_seconds)}
                    />
                    <StatCard
                      label="This Year"
                      value={formatDurationHMS(statsSnapshot.yearly_seconds)}
                    />
                    <StatCard
                      label="All Time Total"
                      value={formatDurationHMS(statsSnapshot.total_seconds)}
                    />
                    <StatCard
                      label="Total Sessions"
                      value={statsSnapshot.total_sessions}
                    />
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Weekly Target
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {formatDurationHMS(weeklyTargetSeconds)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-full rounded-full bg-[#F3E1D9]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#E8A68F] via-[#D98469] to-[#CA6A51] transition-all"
                            style={{ width: weeklyProgressWidth }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                          {weeklyProgressLabel}
                        </span>
                      </div>
                      <form className="space-y-3" onSubmit={handleWeeklyGoalSubmit}>
                        <label
                          className="text-sm font-medium text-slate-600"
                          htmlFor="weekly-goal-input"
                        >
                          Update target (minutes)
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            id="weekly-goal-input"
                            type="number"
                            min="1"
                            step="1"
                            ref={weeklyGoalInputRef}
                            value={weeklyGoalMinutes}
                            onChange={(event) => setWeeklyGoalMinutes(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                          <GradientButton
                            type="submit"
                            className="sm:w-auto from-[#CA6A51] to-[#CA6A51] focus-visible:outline-[#CA6A51]"
                            disabled={isSavingWeeklyGoal}
                          >
                            {isSavingWeeklyGoal ? "Saving…" : "Save"}
                          </GradientButton>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </section>

              <section className="mt-6 rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Session History
                  </h2>
                  <p className="text-sm text-slate-500">
                    {sessions.length
                      ? "Review, reflect, or remove logged sessions."
                      : "No sessions logged yet. Your next one will appear here."}
                  </p>
                </div>
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Start</th>
                          <th className="px-4 py-3">End</th>
                          <th className="px-4 py-3">Duration</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {sessions.length ? (
                          sessions.map((session) => (
                            <tr key={session.id}>
                              <td className="px-4 py-3">{formatDateTime(session.start_time)}</td>
                              <td className="px-4 py-3">{formatDateTime(session.end_time)}</td>
                              <td className="px-4 py-3">
                                {formatDurationHMS(session.duration_seconds)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              className="px-4 py-6 text-center text-sm text-slate-500"
                              colSpan={4}
                            >
                              Nothing here yet — log a session to see it reflected.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Pomodoro Page Content */}
          {currentPage === "pomodoro" && <PomodoroPage />}

          {/* Journal Page Content */}
          {currentPage === "journal" && <JournalPage />}
        </div>

        <PasswordModal
          isVisible={!isAuthenticated}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
          inputRef={passwordInputRef}
        />

        <CountdownCompleteModal
          open={showCountdownModal}
          quote={modalQuote}
          onClose={() => setShowCountdownModal(false)}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<MeditationApp />);
