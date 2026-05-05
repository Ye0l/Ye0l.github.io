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
let chartInstance = null;

const THEMES = ["dark", "light"];
const THEME_ICONS = {
  dark: "☾",
  light: "☀",
};
const DEFAULT_THEME = "dark";
const THEME_SWITCH_MS = 360;
const UI_FONT_STACK = '"Pretendard", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const API_BASE = String(window.CC_API_BASE || "").replace(/\/$/, "");
const configuredStaticBase = String(window.CC_STATIC_DATA_BASE || "static/data").replace(/\/$/, "");
const STATIC_DATA_BASE = configuredStaticBase === "static/data" ? "../static/data" : configuredStaticBase;
let staticDataPromise = null;
let currentHistory = [];
let themeSwitchTimer = null;

function canvasFont(size, weight = "") {
  return `${weight ? `${weight} ` : ""}${size}px ${UI_FONT_STACK}`;
}

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
  detailsTitle.className = `details-title ${tierClass(latest.tier_label)}`;
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
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const styles = getComputedStyle(document.body);
  const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(71, 85, 105, 0.16)";
  const lineColor = styles.getPropertyValue("--chart-line").trim() || "#0f9f95";
  const pointColor = styles.getPropertyValue("--chart-point").trim() || "#b45309";
  const textColor = styles.getPropertyValue("--chart-text").trim() || "#1e293b";
  const mutedColor = styles.getPropertyValue("--chart-muted").trim() || "#64748b";
  const barFillStrong = styles.getPropertyValue("--chart-bar-fill-strong").trim() || "rgba(180, 83, 9, 0.42)";
  const markerColor = styles.getPropertyValue("--chart-marker").trim() || "#be185d";
  const markerLineColor = styles.getPropertyValue("--chart-marker-line").trim() || "rgba(190, 24, 93, 0.3)";
  const markerTextColor = styles.getPropertyValue("--chart-marker-text").trim() || "#9d174d";

  if (history.length === 0) {
    drawChartPlaceholder();
    return;
  }

  const labels = history.map(row => formatSnapshotDate(row.source_time_text || row.scraped_at));
  const rankData = history.map(row => row.rank);
  const winDeltaData = history.map(row => numberValue(row.win_delta));
  const tierLabels = history.map(row => row.tier_label);

  const minRank = Math.min(...rankData);
  const maxRank = Math.max(...rankData);
  const spread = Math.max(10, maxRank - minRank);
  const yMin = Math.max(0.2, minRank - Math.max(2, Math.floor(spread * 0.25)));
  const yMax = maxRank + Math.max(2, Math.floor(spread * 0.25));
  const winDeltaMax = Math.max(...winDeltaData.filter(v => Number.isFinite(v)), 1);

  const customPlugin = {
    id: 'customLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data, chartArea: { top, bottom, left, right, height } } = chart;
      ctx.save();
      
      const points = chart.getDatasetMeta(0).data;
      if (!points.length) return;

      const lastPoints = points.slice(-8);
      ctx.font = canvasFont(12, "bold");
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      lastPoints.forEach((point) => {
        const idx = points.indexOf(point);
        const rank = data.datasets[0].data[idx];
        const label = `#${rank}`;
        const hasTierChange = idx > 0 && normalizeTier(tierLabels[idx]) !== normalizeTier(tierLabels[idx-1]);

        const placeBelow = (hasTierChange && point.y >= 80) || point.y < 60;
        const labelY = placeBelow ? Math.min(point.y + 28, height + top - 12) : Math.max(point.y - 20, top + 12);
        ctx.fillText(label, point.x, labelY);
      });

      ctx.font = canvasFont(11, "bold");
      points.forEach((point, idx) => {
        if (idx === 0) return;
        const currentTier = tierLabels[idx];
        const prevTier = tierLabels[idx - 1];
        if (normalizeTier(currentTier) !== normalizeTier(prevTier)) {
          const label = currentTier || "계급 변경";
          const labelBelow = point.y < 78;
          const labelY = labelBelow 
            ? Math.min(point.y + 34 + (idx % 2) * 16, height + top - 24)
            : Math.max(top + 24, Math.min(point.y - 24 - (idx % 2) * 18, height + top - 24));

          ctx.fillStyle = markerColor;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y - 9);
          ctx.lineTo(point.x + 8, point.y);
          ctx.lineTo(point.x, point.y + 9);
          ctx.lineTo(point.x - 8, point.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = markerLineColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.x, labelBelow ? labelY - 13 : labelY + 5);
          ctx.stroke();

          ctx.fillStyle = markerTextColor;
          ctx.fillText(label, point.x, labelY);
        }
      });

      const latestDeltaPoint = [...history].reverse().find(row => Number.isFinite(numberValue(row.win_delta)));
      if (latestDeltaPoint) {
        const latestDelta = numberValue(latestDeltaPoint.win_delta);
        const maxDelta = Math.max(...winDeltaData.filter(v => Number.isFinite(v)));
        const summaryLabel = `일일 승리 +${latestDelta} · max +${maxDelta}`;
        ctx.font = canvasFont(12);
        ctx.fillStyle = styles.getPropertyValue("--chart-bar-text").trim() || "#f7c76a";
        ctx.textAlign = "right";
        ctx.fillText(summaryLabel, right, top - 14);
      }

      ctx.font = canvasFont(12);
      ctx.fillStyle = mutedColor;
      ctx.textAlign = "left";
      ctx.fillText(`best #${minRank}`, left, top - 14);

      ctx.textAlign = "center";
      ctx.fillText(`worst #${maxRank}`, (left + right) / 2, top - 14);

      const bars = chart.getDatasetMeta(1).data;
      ctx.font = canvasFont(10, "bold");
      ctx.fillStyle = styles.getPropertyValue("--chart-bar-text").trim() || "#f7c76a";
      ctx.textAlign = "center";
      bars.forEach((bar, idx) => {
        const val = winDeltaData[idx];
        if (Number.isFinite(val) && val > 0) {
          ctx.fillText(`+${val}`, bar.x, bar.y - 4);
        }
      });

      ctx.restore();
    }
  };

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rank',
          data: rankData,
          borderColor: lineColor,
          backgroundColor: pointColor,
          borderDash: [5, 5],
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: pointColor,
          tension: 0,
          yAxisID: 'y',
          clip: false
        },
        {
          label: 'Daily Wins',
          type: 'bar',
          data: winDeltaData,
          backgroundColor: barFillStrong,
          borderColor: 'transparent',
          yAxisID: 'yWin',
          barPercentage: 0.5,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 42,
          bottom: 42,
          left: 12,
          right: 12
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              const row = history[idx];
              if (context.datasetIndex === 0) {
                return `순위: #${row.rank} (${row.tier_label})`;
              } else {
                return `일일 승리: +${row.win_delta || 0}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: mutedColor,
            font: { size: 11, family: UI_FONT_STACK },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          }
        },
        y: {
          reverse: true,
          min: yMin,
          max: yMax,
          grid: { color: gridColor },
          ticks: { display: false },
          border: { display: false }
        },
        yWin: {
          position: 'right',
          display: false,
          min: 0,
          max: winDeltaMax * 3,
        }
      }
    },
    plugins: [customPlugin]
  });
}

function drawChartPlaceholder() {
  const styles = getComputedStyle(document.body);
  const previewColor = styles.getPropertyValue("--chart-preview").trim() || "rgba(102, 227, 211, 0.48)";
  const pointColor = styles.getPropertyValue("--chart-point").trim() || "rgba(247, 199, 106, 0.74)";
  const mutedColor = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['', '', '', '', ''],
      datasets: [{
        data: [65, 46, 54, 28, 35],
        borderColor: previewColor,
        backgroundColor: pointColor,
        borderDash: [5, 5],
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: pointColor,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      animation: false
    }
  });
}

function numberValue(value) {
  const parsed = Number.parseInt(String(value ?? "").replaceAll(",", ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
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

function applyTheme(theme, options = {}) {
  const nextThemeValue = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  if (options.animate && document.body.dataset.theme !== nextThemeValue) {
    window.clearTimeout(themeSwitchTimer);
    document.body.classList.add("is-theme-switching");
    themeSwitchTimer = window.setTimeout(() => {
      document.body.classList.remove("is-theme-switching");
    }, THEME_SWITCH_MS);
  }
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
  applyTheme(nextTheme(document.body.dataset.theme), { animate: true });
});

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());

init();
