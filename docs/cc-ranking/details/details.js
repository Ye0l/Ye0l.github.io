const detailsTitle = document.querySelector("#detailsTitle");
const seasonBadge = document.querySelector("#seasonBadge");
const detailsMeta = document.querySelector("#detailsMeta");
const characterSummary = document.querySelector("#characterSummary");
const historyCount = document.querySelector("#historyCount");
const historyRows = document.querySelector("#historyRows");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const canvas = document.querySelector("#rankChart");
const ctx = canvas.getContext("2d");

const THEMES = ["dark", "light", "crystal", "rose"];
const THEME_ICONS = {
  dark: "☾",
  light: "☀",
  crystal: "✦",
  rose: "◆",
};
const DEFAULT_THEME = "dark";
const API_BASE = String(window.CC_API_BASE || "").replace(/\/$/, "");
const configuredStaticBase = String(window.CC_STATIC_DATA_BASE || "static/data").replace(/\/$/, "");
const STATIC_DATA_BASE = configuredStaticBase === "static/data" ? "../static/data" : configuredStaticBase;
let staticDataPromise = null;
let currentHistory = [];

async function api(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (options.method && options.method !== "GET") throw error;
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
        if (!latestSeason) return { history_by_key: {}, history_by_id: {} };
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
  const url = new URL(path, window.location.origin);
  const data = await loadStaticData();
  if (url.pathname === "/api/history") {
    const id = url.searchParams.get("id") || "";
    const key = url.searchParams.get("key") || characterKeyFromId(id);
    return {
      history: (data.history_by_id || {})[id] || (data.history_by_key || {})[key] || [],
    };
  }
  throw new Error(`No static fallback for ${url.pathname}`);
}

function init() {
  applyTheme(storedTheme());
  const params = new URLSearchParams(window.location.search);
  const characterId = params.get("id") || params.get("key") || "";
  if (!characterId) {
    renderEmpty("주소에 캐릭터 id가 없습니다.");
    return;
  }
  loadCharacter(characterId).catch((error) => renderEmpty(error.message));
}

async function loadCharacter(characterId) {
  const history = await loadCharacterHistory(characterId);
  currentHistory = history;
  if (history.length === 0) {
    renderEmpty("해당 캐릭터 기록을 찾을 수 없습니다.");
    return;
  }

  const latest = history[history.length - 1];
  detailsTitle.textContent = latest.character_name;
  seasonBadge.textContent = latest.season ? `Season ${latest.season}` : "Season -";
  detailsMeta.textContent = `${latest.server_name} · 최신 #${latest.rank} · ${formatSnapshotDate(latest.source_time_text || latest.scraped_at)}`;
  historyCount.textContent = `${history.length}개`;
  characterSummary.innerHTML = summaryHtml(latest, history);
  historyRows.innerHTML = history.slice().reverse().map(historyRowHtml).join("");
  renderChart(history);
}

async function loadCharacterHistory(characterId) {
  const payload = await api(`/api/history?id=${encodeURIComponent(characterId)}`);
  const history = payload.history || [];
  if (history.length > 0 || !String(characterId || "").startsWith("c1_")) {
    return history;
  }

  const legacyKey = characterKeyFromId(characterId);
  if (!legacyKey || legacyKey === characterId) return history;
  const legacyPayload = await api(`/api/history?key=${encodeURIComponent(legacyKey)}`);
  return legacyPayload.history || [];
}

function characterKeyFromId(value) {
  const text = String(value || "");
  if (!text.startsWith("c1_")) return text;
  const encoded = text.slice(3).replaceAll("-", "+").replaceAll("_", "/");
  const padded = encoded.padEnd(encoded.length + ((4 - encoded.length % 4) % 4), "=");
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    return "";
  }
}

function renderEmpty(message) {
  detailsMeta.textContent = message;
  historyCount.textContent = "-";
  characterSummary.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
  historyRows.innerHTML = `<tr><td class="empty" colspan="6">${escapeHtml(message)}</td></tr>`;
  renderChart([]);
}

function summaryHtml(latest, history) {
  const seasonHistory = history.filter((row) => row.season === latest.season);
  const bestRanking = seasonHistory.reduce((best, row) => row.rank < best.rank ? row : best, seasonHistory[0]);
  const worstRanking = seasonHistory.reduce((worst, row) => row.rank > worst.rank ? row : worst, seasonHistory[0]);
  return `
    <div class="details-stat-grid">
      <div><span>최신 순위</span><strong>#${escapeHtml(latest.rank)}</strong></div>
      <div><span>최신 티어</span><strong>${tierIconHtml(latest)}${escapeHtml(latest.tier_label || "-")}</strong></div>
      <div><span>최신 평점</span><strong>${escapeHtml(pointsDisplay(latest))}</strong></div>
      <div><span>이번 시즌 최고 랭킹</span><strong>#${escapeHtml(bestRanking.rank)}</strong></div>
      <div><span>이번 시즌 최저 랭킹</span><strong>#${escapeHtml(worstRanking.rank)}</strong></div>
      <div><span>스냅샷</span><strong>${escapeHtml(history.length)}개</strong></div>
    </div>
  `;
}

function historyRowHtml(row) {
  return `
    <tr>
      <td>${escapeHtml(formatSnapshotDate(row.source_time_text || row.scraped_at))}</td>
      <td><span class="rank-badge ${rankClass(row.rank)}">${escapeHtml(row.rank)}</span></td>
      <td><span class="tier-pill ${tierClass(row.tier_label)}">${tierIconHtml(row)}<span>${escapeHtml(row.tier_label || "-")}</span></span></td>
      <td>${escapeHtml(pointsDisplay(row))}</td>
      <td>${row.wins ?? "-"}</td>
      <td>${movementBadge(row)}</td>
    </tr>
  `;
}

function movementText(entry) {
  if (entry.movement_direction === "new") return "NEW";
  if (!entry.movement_direction || entry.movement_value == null) return "-";
  const arrow = entry.movement_direction === "up" ? "▲" : "▼";
  return `${arrow} ${entry.movement_value}`;
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

function tierNumber(entryOrTier) {
  const tierCode = typeof entryOrTier === "object" ? entryOrTier.tier_code : "";
  const codeMatch = String(tierCode || "").match(/^tier([1-8])$/);
  if (codeMatch) return codeMatch[1];

  const tier = normalizeTier(typeof entryOrTier === "object" ? entryOrTier.tier_label : entryOrTier);
  if (tier === "bronze") return "1";
  if (tier === "silver") return "2";
  if (tier === "gold") return "3";
  if (tier === "platinum") return "4";
  if (tier === "diamond") return "5";
  if (tier === "crystal") return "6";
  if (tier === "omega") return "7";
  if (tier === "ultima") return "8";
  return "";
}

function tierIconHtml(entry) {
  const number = tierNumber(entry);
  return number ? `<span class="tier-icon tier-icon-${number}" aria-hidden="true"></span>` : "";
}

function pointsDisplay(entry) {
  const points = entry.points_text ?? entry.points;
  const text = String(points ?? "").trim();
  return text ? text : "-";
}

function renderChart(history) {
  const chartSize = resizeCanvas();
  const styles = getComputedStyle(document.body);
  ctx.clearRect(0, 0, chartSize.width, chartSize.height);
  ctx.fillStyle = styles.getPropertyValue("--chart-bg").trim() || "#07111f";
  ctx.fillRect(0, 0, chartSize.width, chartSize.height);

  const padding = 46;
  const plotWidth = chartSize.width - padding * 2;
  const plotHeight = chartSize.height - padding * 2;
  drawChartGrid(padding, plotWidth, plotHeight);

  if (history.length === 0) {
    drawPreviewLine(padding, plotWidth, plotHeight);
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
  if (points.length > 1) ctx.stroke();

  ctx.fillStyle = styles.getPropertyValue("--chart-point").trim() || "#f7c76a";
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const tierChangeIndexes = drawTierChangeMarkers(points, chartSize.width, chartSize.height);
  drawDateLabels(points, chartSize.height);
  drawRankLabels(points, tierChangeIndexes, chartSize.width, chartSize.height);

  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "12px sans-serif";
  ctx.fillText(`best #${minRank}`, padding, 22);
  ctx.fillText(`worst #${maxRank}`, padding, chartSize.height - 14);
}

function drawTierChangeMarkers(points, chartWidth, chartHeight) {
  const styles = getComputedStyle(document.body);
  const changes = points.filter((point, index) => index > 0
    && normalizeTier(point.row.tier_label) !== normalizeTier(points[index - 1].row.tier_label));
  const changeIndexes = new Set(changes.map((point) => points.indexOf(point)));

  ctx.font = "700 11px sans-serif";
  ctx.textBaseline = "alphabetic";
  changes.forEach((point, index) => {
    const label = point.row.tier_label || "계급 변경";
    const labelWidth = ctx.measureText(label).width;
    const labelX = Math.min(Math.max(point.x - labelWidth / 2, 8), chartWidth - labelWidth - 8);
    const labelBelow = point.y < 78;
    const labelY = labelBelow
      ? Math.min(point.y + 34 + (index % 2) * 16, chartHeight - 54)
      : Math.max(24, Math.min(point.y - 24 - (index % 2) * 18, chartHeight - 54));

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
    ctx.lineTo(point.x, labelBelow ? labelY - 13 : labelY + 5);
    ctx.stroke();

    ctx.fillStyle = styles.getPropertyValue("--chart-marker-text").trim() || "#ffd4df";
    ctx.fillText(label, labelX, labelY);
  });
  return changeIndexes;
}

function drawRankLabels(points, tierChangeIndexes, chartWidth, chartHeight) {
  const styles = getComputedStyle(document.body);
  ctx.fillStyle = styles.getPropertyValue("--chart-text").trim() || "#dbeafe";
  ctx.font = "700 12px sans-serif";
  ctx.textBaseline = "alphabetic";
  points.slice(-8).forEach((point) => {
    const pointIndex = points.indexOf(point);
    const hasTierLabel = tierChangeIndexes.has(pointIndex);
    const placeBelow = (hasTierLabel && point.y >= 78) || point.y < 34;
    const label = `#${point.row.rank}`;
    const labelWidth = ctx.measureText(label).width;
    const labelX = Math.min(Math.max(point.x - labelWidth / 2, 8), chartWidth - labelWidth - 8);
    const labelY = placeBelow
      ? Math.min(point.y + 22, chartHeight - 44)
      : Math.max(point.y - 12, 16);
    ctx.fillText(label, labelX, labelY);
  });
}

function drawDateLabels(points, chartHeight) {
  const labelPoints = dateLabelPoints(points);
  const styles = getComputedStyle(document.body);
  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "11px sans-serif";
  labelPoints.forEach((point) => {
    const label = formatSnapshotDate(point.row.source_time_text || point.row.scraped_at);
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

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(260, Math.floor(rect.height));
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
}

function formatSnapshotDate(value) {
  const text = String(value || "-");
  const match = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (match) return match[0].replaceAll("/", "-").replaceAll(".", "-");
  return text.split(/\s+/)[0] || "-";
}

function normalizeTier(value) {
  return String(value || "").trim().toLowerCase();
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
  const nextThemeValue = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  document.body.dataset.theme = nextThemeValue;
  themeIcon.textContent = THEME_ICONS[nextThemeValue] || THEME_ICONS[DEFAULT_THEME];
  themeToggle.dataset.theme = nextThemeValue;
  themeToggle.setAttribute("aria-label", `테마 변경: ${nextThemeValue}`);
  themeToggle.title = `테마: ${nextThemeValue}`;
  try {
    window.localStorage.setItem("ccRankingTheme", nextThemeValue);
  } catch (error) {
    writeCookie("ccRankingTheme", nextThemeValue);
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

themeToggle.addEventListener("click", () => {
  applyTheme(nextTheme(document.body.dataset.theme));
});

window.addEventListener("resize", () => renderChart(currentHistory));
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());

init();
