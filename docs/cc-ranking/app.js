const rankingRows = document.querySelector("#rankingRows");
const seasonBadge = document.querySelector("#seasonBadge");
const snapshotMeta = document.querySelector("#snapshotMeta");
const totalMeta = document.querySelector("#totalMeta");
const entryCount = document.querySelector("#entryCount");
const leaderStat = document.querySelector("#leaderStat");
const leaderMeta = document.querySelector("#leaderMeta");
const snapshotSelect = document.querySelector("#snapshotSelect");
const prevSnapshot = document.querySelector("#prevSnapshot");
const nextSnapshot = document.querySelector("#nextSnapshot");
const searchInput = document.querySelector("#searchInput");
const selectedCharacter = document.querySelector("#selectedCharacter");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const canvas = document.querySelector("#rankChart");
const ctx = canvas.getContext("2d");

let selectedKey = null;
let snapshots = [];
let currentSnapshotIndex = -1;
let currentHistory = [];
let latestEntries = [];
const snapshotPayloadCache = new Map();
let leaderStreakToken = 0;

const THEMES = ["dark", "light", "crystal", "rose"];
const THEME_ICONS = {
  dark: "☾",
  light: "☀",
  crystal: "✦",
  rose: "◆",
};
const DEFAULT_THEME = "dark";

const API_BASE = String(window.CC_API_BASE || "").replace(/\/$/, "");
const STATIC_DATA_BASE = String(window.CC_STATIC_DATA_BASE || "static/data").replace(/\/$/, "");
let staticDataPromise = null;

async function api(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (options.method && options.method !== "GET") {
      throw error;
    }
    return staticApi(path);
  }
}

async function loadStaticData() {
  if (!staticDataPromise) {
    const cacheKey = Date.now().toString(36);
    staticDataPromise = fetchStaticJson("manifest.json", cacheKey, "manifest")
      .then((manifest) => {
        const seasons = manifest.seasons || [];
        const latestSeason = seasons.find((season) => season.season === manifest.latest_season)
          || seasons[seasons.length - 1];
        if (!latestSeason) {
          return { snapshots: [], entries_by_snapshot: {}, characters: [], history_by_key: {} };
        }
        return fetchStaticJson(latestSeason.path, cacheKey, "data");
      });
  }
  return staticDataPromise;
}

async function fetchStaticJson(path, cacheKey, label) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${STATIC_DATA_BASE}/${path}${separator}v=${encodeURIComponent(cacheKey)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Static ${label} HTTP ${response.status}`);
  return response.json();
}

async function staticApi(path) {
  const data = await loadStaticData();
  const url = new URL(path, window.location.origin);
  if (url.pathname === "/api/snapshots" || url.pathname === "/api/v1/snapshots") {
    return { snapshots: data.snapshots || [] };
  }
  if (url.pathname === "/api/latest") {
    const snapshot = latestStaticSnapshot(data);
    return {
      snapshot,
      entries: snapshot ? data.entries_by_snapshot[String(snapshot.id)] || [] : [],
    };
  }
  if (url.pathname === "/api/snapshot") {
    const snapshotId = url.searchParams.get("id");
    const snapshot = (data.snapshots || []).find((item) => String(item.id) === String(snapshotId));
    return {
      snapshot: snapshot || null,
      entries: snapshot ? data.entries_by_snapshot[String(snapshot.id)] || [] : [],
    };
  }
  if (url.pathname === "/api/characters") {
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const characters = (data.characters || [])
      .filter((character) => !query
        || String(character.character_name).toLowerCase().includes(query)
        || String(character.server_name).toLowerCase().includes(query))
      .slice(0, 50);
    return { characters };
  }
  if (url.pathname === "/api/history") {
    const key = url.searchParams.get("key") || "";
    return { history: (data.history_by_key || {})[key] || [] };
  }
  throw new Error(`No static fallback for ${url.pathname}`);
}

function latestStaticSnapshot(data) {
  const staticSnapshots = data.snapshots || [];
  if (staticSnapshots.length === 0) return null;
  return staticSnapshots.reduce(
    (latest, snapshot) => (snapshot.id > latest.id ? snapshot : latest),
    staticSnapshots[0],
  );
}

function movementText(entry) {
  if (entry.movement_direction === "new") return "NEW";
  if (!entry.movement_direction || entry.movement_value == null) return "-";
  const arrow = entry.movement_direction === "up" ? "▲" : "▼";
  return `${arrow} ${entry.movement_value}`;
}

function rankClass(rank) {
  if (rank === 1) return "rank-first";
  if (rank === 2) return "rank-second";
  if (rank === 3) return "rank-third";
  if (rank <= 10) return "rank-top10";
  if (rank <= 30) return "rank-top30";
  if (rank <= 60) return "rank-top60";
  return "rank-rest";
}

function tierClass(tier) {
  return `tier-${String(tier || "unknown").toLowerCase()}`;
}

function movementBadge(entry) {
  const text = movementText(entry);
  const movementClass = entry.movement_direction === "up"
    ? "movement-up"
    : entry.movement_direction === "down"
      ? "movement-down"
      : entry.movement_direction === "new"
        ? "movement-new"
        : "movement-flat";
  return `<span class="movement-chip ${movementClass}">${escapeHtml(text)}</span>`;
}

function storedTheme() {
  try {
    const value = window.localStorage.getItem("ccRankingTheme") || DEFAULT_THEME;
    return THEMES.includes(value) ? value : DEFAULT_THEME;
  } catch (error) {
    const value = readCookie("ccRankingTheme") || DEFAULT_THEME;
    return THEMES.includes(value) ? value : DEFAULT_THEME;
  }
}

function applyTheme(theme) {
  const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  document.body.dataset.theme = nextTheme;
  themeIcon.textContent = THEME_ICONS[nextTheme] || THEME_ICONS[DEFAULT_THEME];
  themeToggle.dataset.theme = nextTheme;
  themeToggle.setAttribute("aria-label", `테마 변경: ${nextTheme}`);
  themeToggle.title = `테마: ${nextTheme}`;
  try {
    window.localStorage.setItem("ccRankingTheme", nextTheme);
  } catch (error) {
    writeCookie("ccRankingTheme", nextTheme);
  }
  renderChart(currentHistory);
}

function nextTheme(theme) {
  const index = THEMES.indexOf(theme);
  return THEMES[(index + 1) % THEMES.length] || DEFAULT_THEME;
}

function readCookie(name) {
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
}

function renderLatest(payload) {
  const snapshot = payload.snapshot;
  const entries = payload.entries || [];
  latestEntries = entries;
  if (snapshot) {
    snapshotPayloadCache.set(String(snapshot.id), payload);
  }
  if (!snapshot) {
    seasonBadge.textContent = "Season -";
    snapshotMeta.textContent = "저장된 스냅샷이 없습니다.";
    totalMeta.textContent = "총 저장 인원 -";
    entryCount.textContent = "";
    leaderStat.textContent = "-";
    leaderMeta.textContent = "-";
    rankingRows.innerHTML = `<tr><td class="empty" colspan="6">아직 데이터가 없습니다.</td></tr>`;
    return;
  }

  seasonBadge.textContent = snapshot.season ? `Season ${snapshot.season}` : "Season -";
  snapshotMeta.textContent = snapshot.source_time_text || snapshot.scraped_at || "-";
  totalMeta.textContent = `총 저장 인원 ${snapshot.entry_count || entries.length}명`;
  entryCount.textContent = `${entries.length}명`;
  leaderStat.textContent = entries[0] ? entries[0].character_name : "-";
  leaderMeta.textContent = entries[0]
    ? `${entries[0].server_name} · ${entries[0].tier_label || "-"} · ${entries[0].wins ?? "-"}승 · 1위 유지일 계산 중`
    : "-";
  renderRankingRows();
  updateLeaderStreak(snapshot, entries[0]);
}

function renderRankingRows() {
  const entries = filteredRankingEntries();
  entryCount.textContent = searchInput.value.trim()
    ? `${entries.length} / ${latestEntries.length}명`
    : `${latestEntries.length}명`;
  if (entries.length === 0) {
    rankingRows.innerHTML = `<tr><td class="empty" colspan="6">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  rankingRows.innerHTML = entries.map((entry) => {
    const isNew = entry.movement_direction === "new";
    const rowClass = isNew ? "is-new" : "";
    return `
      <tr class="${rowClass}" data-key="${escapeHtml(entry.character_key)}">
        <td><span class="rank-badge ${rankClass(entry.rank)}">${entry.rank}</span></td>
        <td>
          <span class="name-cell">
            <span>${escapeHtml(entry.character_name)}</span>
            ${isNew ? '<span class="new-pill">NEW</span>' : ""}
          </span>
        </td>
        <td>${escapeHtml(entry.server_name)}</td>
        <td><span class="tier-pill ${tierClass(entry.tier_label)}">${escapeHtml(entry.tier_label || "-")}</span></td>
        <td>${entry.wins ?? "-"}</td>
        <td>${movementBadge(entry)}</td>
      </tr>
    `;
  }).join("");

  [...rankingRows.querySelectorAll("tr[data-key]")].forEach((row) => {
    row.addEventListener("click", () => {
      selectCharacter(row.dataset.key, { scrollRanking: false });
    });
  });
}

function filteredRankingEntries() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return latestEntries;
  return latestEntries.filter((entry) => (
    String(entry.character_name).toLowerCase().includes(query)
    || String(entry.server_name).toLowerCase().includes(query)
  ));
}

async function updateLeaderStreak(snapshot, leader) {
  const token = ++leaderStreakToken;
  if (!snapshot || !leader) return;
  let streak = 1;
  try {
    streak = await leaderStreakDays(snapshot.id, leader.character_key);
  } catch (error) {
    streak = 1;
  }
  if (token !== leaderStreakToken) return;
  leaderMeta.textContent = `${leader.server_name} · ${leader.tier_label || "-"} · ${leader.wins ?? "-"}승 · 1위 ${streak}일차`;
}

async function leaderStreakDays(snapshotId, leaderKey) {
  const index = snapshots.findIndex((snapshot) => String(snapshot.id) === String(snapshotId));
  if (index < 0) return 1;
  let streak = 0;
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const payload = await snapshotPayload(snapshots[cursor].id);
    const topEntry = (payload.entries || [])[0];
    if (!topEntry || topEntry.character_key !== leaderKey) break;
    streak += 1;
  }
  return Math.max(1, streak);
}

async function snapshotPayload(snapshotId) {
  const key = String(snapshotId);
  if (!snapshotPayloadCache.has(key)) {
    snapshotPayloadCache.set(key, api(`/api/snapshot?id=${encodeURIComponent(snapshotId)}`));
  }
  const payload = await snapshotPayloadCache.get(key);
  snapshotPayloadCache.set(key, payload);
  return payload;
}

async function loadLatest() {
  const payload = await api("/api/latest");
  renderLatest(payload);
  setCurrentSnapshot(payload.snapshot?.id);
}

async function loadSnapshots() {
  const payload = await api("/api/snapshots");
  snapshots = (payload.snapshots || []).slice().reverse();
  snapshotSelect.innerHTML = snapshots.map((snapshot, index) => `
    <option value="${snapshot.id}">${escapeHtml(formatSnapshotDate(snapshot.source_time_text || snapshot.scraped_at || `Snapshot ${snapshot.id}`))}</option>
  `).join("");
  if (snapshots.length === 0) {
    snapshotSelect.innerHTML = `<option>저장된 데이터 없음</option>`;
    snapshotSelect.disabled = true;
    prevSnapshot.disabled = true;
    nextSnapshot.disabled = true;
  }
}

function formatSnapshotDate(value) {
  const text = String(value || "-");
  const match = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (match) return match[0].replaceAll("/", "-").replaceAll(".", "-");
  return text.split(/\s+/)[0] || "-";
}

async function loadSnapshot(snapshotId) {
  renderLatest(await api(`/api/snapshot?id=${encodeURIComponent(snapshotId)}`));
  setCurrentSnapshot(Number(snapshotId));
  const url = new URL(window.location.href);
  url.searchParams.set("snapshot", snapshotId);
  window.history.replaceState({}, "", url);
}

function setCurrentSnapshot(snapshotId) {
  currentSnapshotIndex = snapshots.findIndex((snapshot) => snapshot.id === snapshotId);
  if (currentSnapshotIndex >= 0) {
    snapshotSelect.value = String(snapshotId);
  }
  prevSnapshot.disabled = currentSnapshotIndex <= 0;
  nextSnapshot.disabled = currentSnapshotIndex < 0 || currentSnapshotIndex >= snapshots.length - 1;
}

async function selectCharacter(key, options = {}) {
  const { scrollRanking = true } = options;
  selectedKey = key;
  const payload = await api(`/api/history?key=${encodeURIComponent(key)}`);
  const history = payload.history || [];
  currentHistory = history;
  const latest = history[history.length - 1];
  selectedCharacter.innerHTML = latest ? selectedCharacterHtml(latest, history.length) : "";
  renderChart(history);
  if (scrollRanking) {
    scrollRankingIntoView(key);
  }
}

function selectedCharacterHtml(latest, sampleCount) {
  return `
    <span>${escapeHtml(latest.character_name)} @ ${escapeHtml(latest.server_name)} · ${sampleCount}개 스냅샷</span>
  `;
}

function scrollRankingIntoView(key) {
  const target = rankingRows.querySelector(`[data-key="${cssEscape(key)}"]`);
  scrollAndFlash(target);
}

function scrollAndFlash(element) {
  if (!element) return;
  const container = element.closest(".table-wrap");
  if (container) {
    const elementTop = element.offsetTop;
    const centeredTop = elementTop - (container.clientHeight / 2) + (element.clientHeight / 2);
    container.scrollTo({ top: Math.max(0, centeredTop), behavior: "smooth" });
  }
  element.classList.remove("focus-flash");
  window.setTimeout(() => element.classList.add("focus-flash"), 20);
  window.setTimeout(() => element.classList.remove("focus-flash"), 1300);
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function renderChart(history) {
  const chartSize = resizeCanvas();
  const styles = getComputedStyle(document.body);
  ctx.clearRect(0, 0, chartSize.width, chartSize.height);
  ctx.fillStyle = styles.getPropertyValue("--chart-bg").trim() || "#07111f";
  ctx.fillRect(0, 0, chartSize.width, chartSize.height);

  const padding = 42;
  const plotWidth = chartSize.width - padding * 2;
  const plotHeight = chartSize.height - padding * 2;

  drawChartGrid(padding, plotWidth, plotHeight);

  if (history.length === 0) {
    drawPreviewLine(padding, plotWidth, plotHeight);
    drawChartMessage("캐릭터를 선택하면 이 영역에 순위 추이가 표시됩니다.", chartSize.height);
    return;
  }

  const ranks = history.map((row) => row.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const spread = Math.max(1, maxRank - minRank);
  const xStep = plotWidth / Math.max(1, history.length - 1);
  const points = history.map((row, index) => {
    const x = history.length === 1 ? padding + plotWidth / 2 : padding + xStep * index;
    const y = history.length === 1
      ? padding + plotHeight / 2
      : padding + ((row.rank - minRank) / spread) * plotHeight;
    return { x, y, row };
  });

  ctx.strokeStyle = styles.getPropertyValue("--chart-line").trim() || "#66e3d3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  if (points.length > 1) {
    ctx.stroke();
  }

  ctx.fillStyle = styles.getPropertyValue("--chart-point").trim() || "#f7c76a";
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  drawTierChangeMarkers(points, chartSize.height);
  drawDateLabels(points, chartSize.height);

  ctx.fillStyle = styles.getPropertyValue("--chart-text").trim() || "#dbeafe";
  ctx.font = "700 12px sans-serif";
  points.slice(-6).forEach((point) => {
    ctx.fillText(`#${point.row.rank}`, point.x - 12, point.y - 12);
  });

  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "12px sans-serif";
  ctx.fillText(`best #${minRank}`, padding, 20);
  ctx.fillText(`worst #${maxRank}`, padding, chartSize.height - 14);
}

function drawTierChangeMarkers(points, chartHeight) {
  const styles = getComputedStyle(document.body);
  const changes = points.filter((point, index) => {
    if (index === 0) return false;
    return normalizeTier(point.row.tier_label) !== normalizeTier(points[index - 1].row.tier_label);
  });

  ctx.font = "700 11px sans-serif";
  changes.forEach((point, index) => {
    const label = point.row.tier_label || "계급 변경";
    const labelWidth = ctx.measureText(label).width;
    const labelX = Math.min(Math.max(point.x - labelWidth / 2, 8), canvas.clientWidth - labelWidth - 8);
    const labelY = Math.max(24, Math.min(point.y - 24 - (index % 2) * 18, chartHeight - 54));

    ctx.fillStyle = styles.getPropertyValue("--chart-marker").trim() || "#ff8fb3";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - 9);
    ctx.lineTo(point.x + 8, point.y);
    ctx.lineTo(point.x, point.y + 9);
    ctx.lineTo(point.x - 8, point.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = styles.getPropertyValue("--chart-marker-line").trim() || "rgba(255, 143, 179, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, labelY + 5);
    ctx.stroke();

    ctx.fillStyle = styles.getPropertyValue("--chart-marker-text").trim() || "#ffd4df";
    ctx.fillText(label, labelX, labelY);
  });
}

function drawDateLabels(points, chartHeight) {
  const labelPoints = dateLabelPoints(points);
  const styles = getComputedStyle(document.body);
  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "11px sans-serif";
  labelPoints.forEach((point) => {
    const label = formatGraphDate(point.row.source_time_text || point.row.scraped_at);
    const labelWidth = ctx.measureText(label).width;
    const labelX = Math.min(Math.max(point.x - labelWidth / 2, 8), canvas.clientWidth - labelWidth - 8);
    ctx.fillText(label, labelX, chartHeight - 30);
  });
}

function dateLabelPoints(points) {
  if (points.length <= 4) return points;
  const indexes = new Set([0, points.length - 1]);
  indexes.add(Math.floor((points.length - 1) / 3));
  indexes.add(Math.floor(((points.length - 1) * 2) / 3));
  return [...indexes].sort((a, b) => a - b).map((index) => points[index]);
}

function formatGraphDate(value) {
  const text = String(value || "-");
  const match = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (match) return match[0].replaceAll("/", "-").replaceAll(".", "-");
  return text.split(/\s+/)[0] || "-";
}

function normalizeTier(value) {
  return String(value || "").trim().toLowerCase();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(240, Math.floor(rect.height));
  const scaledWidth = Math.floor(width * ratio);
  const scaledHeight = Math.floor(height * ratio);
  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  return { width, height };
}

function drawChartGrid(padding, plotWidth, plotHeight) {
  const styles = getComputedStyle(document.body);
  ctx.strokeStyle = styles.getPropertyValue("--chart-grid").trim() || "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + plotWidth, y);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i += 1) {
    const x = padding + (plotWidth / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + plotHeight);
    ctx.stroke();
  }
}

function drawPreviewLine(padding, plotWidth, plotHeight) {
  const styles = getComputedStyle(document.body);
  const points = [
    [padding, padding + plotHeight * 0.65],
    [padding + plotWidth * 0.32, padding + plotHeight * 0.46],
    [padding + plotWidth * 0.68, padding + plotHeight * 0.54],
    [padding + plotWidth, padding + plotHeight * 0.28],
  ];
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = styles.getPropertyValue("--chart-preview").trim() || "rgba(102, 227, 211, 0.48)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = styles.getPropertyValue("--chart-point").trim() || "rgba(247, 199, 106, 0.74)";
  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawChartMessage(message, height) {
  const styles = getComputedStyle(document.body);
  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "13px sans-serif";
  ctx.fillText(message, 24, height - 24);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let searchTimer = null;
applyTheme(storedTheme());

themeToggle.addEventListener("click", () => {
  applyTheme(nextTheme(document.body.dataset.theme));
});

searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => renderRankingRows(), 120);
});

snapshotSelect.addEventListener("change", () => {
  loadSnapshot(snapshotSelect.value).catch((error) => {
    snapshotMeta.textContent = error.message;
  });
});

prevSnapshot.addEventListener("click", () => {
  if (currentSnapshotIndex > 0) {
    loadSnapshot(snapshots[currentSnapshotIndex - 1].id).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});

nextSnapshot.addEventListener("click", () => {
  if (currentSnapshotIndex >= 0 && currentSnapshotIndex < snapshots.length - 1) {
    loadSnapshot(snapshots[currentSnapshotIndex + 1].id).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});

loadSnapshots()
  .then(() => {
    const initialSnapshot = new URLSearchParams(window.location.search).get("snapshot");
    return initialSnapshot ? loadSnapshot(initialSnapshot) : loadLatest();
  })
  .catch((error) => {
    snapshotMeta.textContent = error.message;
  });

renderChart([]);
window.addEventListener("resize", () => renderChart(currentHistory));

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());
