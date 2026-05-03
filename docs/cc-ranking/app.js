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
const characterList = document.querySelector("#characterList");
const selectedCharacter = document.querySelector("#selectedCharacter");
const historyRows = document.querySelector("#historyRows");
const canvas = document.querySelector("#rankChart");
const ctx = canvas.getContext("2d");

let selectedKey = null;
let snapshots = [];
let currentSnapshotIndex = -1;
let currentHistory = [];
let latestCharacters = [];

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

function renderLatest(payload) {
  const snapshot = payload.snapshot;
  const entries = payload.entries || [];
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
    ? `${entries[0].server_name} · ${entries[0].tier_label || "-"} · ${entries[0].wins ?? "-"}승`
    : "-";
  rankingRows.innerHTML = entries.map((entry) => {
    const isNew = entry.movement_direction === "new";
    const rowClass = isNew ? "is-new" : "";
    return `
      <tr class="${rowClass}" data-key="${escapeHtml(entry.character_key)}">
        <td><span class="rank-badge ${rankClass(entry.rank)}">${entry.rank}</span></td>
        <td>
          <span class="name-cell">${escapeHtml(entry.character_name)}${isNew ? '<span class="new-pill">NEW</span>' : ""}</span>
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
      selectCharacter(row.dataset.key, { scrollRanking: false, scrollCharacters: true });
    });
  });
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
    <option value="${snapshot.id}">${escapeHtml(snapshot.source_time_text || snapshot.scraped_at || `Snapshot ${snapshot.id}`)}</option>
  `).join("");
  if (snapshots.length === 0) {
    snapshotSelect.innerHTML = `<option>저장된 데이터 없음</option>`;
    snapshotSelect.disabled = true;
    prevSnapshot.disabled = true;
    nextSnapshot.disabled = true;
  }
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

async function loadCharacters(query = "") {
  const payload = await api(`/api/characters?q=${encodeURIComponent(query)}`);
  const characters = payload.characters || [];
  latestCharacters = characters;
  characterList.innerHTML = characters.map((character) => `
    <button type="button" class="character-item ${character.character_key === selectedKey ? "active" : ""}" data-key="${escapeHtml(character.character_key)}">
      <strong>${escapeHtml(character.character_name)}</strong>
      <span class="mini-rank ${rankClass(character.best_rank)}">#${character.best_rank}</span>
      <span class="character-meta">${escapeHtml(character.server_name)} · ${character.samples}회 기록 · 최고 ${character.best_rank} / 최저 ${character.worst_rank}</span>
    </button>
  `).join("") || `<div class="empty">검색 결과가 없습니다.</div>`;

  [...characterList.querySelectorAll("button[data-key]")].forEach((button) => {
    button.addEventListener("click", () => {
      selectCharacter(button.dataset.key, { scrollRanking: true, scrollCharacters: false });
    });
  });
}

async function selectCharacter(key, options = {}) {
  const { scrollRanking = true, scrollCharacters = true } = options;
  selectedKey = key;
  if (scrollCharacters && !latestCharacters.some((character) => character.character_key === key)) {
    searchInput.value = "";
  }
  await loadCharacters(searchInput.value);
  const payload = await api(`/api/history?key=${encodeURIComponent(key)}`);
  const history = payload.history || [];
  currentHistory = history;
  const latest = history[history.length - 1];
  selectedCharacter.textContent = latest
    ? `${latest.character_name} @ ${latest.server_name} · ${history.length}개 스냅샷`
    : "";
  renderChart(history);
  renderHistory(history);
  if (scrollCharacters) {
    scrollCharacterIntoView(key);
  }
  if (scrollRanking) {
    scrollRankingIntoView(key);
  }
}

function scrollCharacterIntoView(key) {
  const target = characterList.querySelector(`[data-key="${cssEscape(key)}"]`);
  scrollAndFlash(target);
}

function scrollRankingIntoView(key) {
  const target = rankingRows.querySelector(`[data-key="${cssEscape(key)}"]`);
  scrollAndFlash(target);
}

function scrollAndFlash(element) {
  if (!element) return;
  const container = element.closest(".table-wrap, .character-list");
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

function renderHistory(history) {
  historyRows.innerHTML = history.slice().reverse().map((row) => `
    <div class="history-row">
      <span class="mini-rank ${rankClass(row.rank)}">#${row.rank}</span>
      <span>${escapeHtml(row.source_time_text || row.scraped_at)}</span>
      <strong>${row.wins ?? "-"}승</strong>
    </div>
  `).join("") || `<div class="empty">추이 데이터가 없습니다.</div>`;
}

function renderChart(history) {
  const chartSize = resizeCanvas();
  ctx.clearRect(0, 0, chartSize.width, chartSize.height);
  ctx.fillStyle = "#07111f";
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

  ctx.strokeStyle = "#66e3d3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  if (points.length > 1) {
    ctx.stroke();
  }

  ctx.fillStyle = "#f7c76a";
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  drawTierChangeMarkers(points, chartSize.height);
  drawDateLabels(points, chartSize.height);

  ctx.fillStyle = "#dbeafe";
  ctx.font = "700 12px sans-serif";
  points.slice(-6).forEach((point) => {
    ctx.fillText(`#${point.row.rank}`, point.x - 12, point.y - 12);
  });

  ctx.fillStyle = "#93a4b8";
  ctx.font = "12px sans-serif";
  ctx.fillText(`best #${minRank}`, padding, 20);
  ctx.fillText(`worst #${maxRank}`, padding, chartSize.height - 14);
}

function drawTierChangeMarkers(points, chartHeight) {
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

    ctx.fillStyle = "#ff8fb3";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - 9);
    ctx.lineTo(point.x + 8, point.y);
    ctx.lineTo(point.x, point.y + 9);
    ctx.lineTo(point.x - 8, point.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 143, 179, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, labelY + 5);
    ctx.stroke();

    ctx.fillStyle = "#ffd4df";
    ctx.fillText(label, labelX, labelY);
  });
}

function drawDateLabels(points, chartHeight) {
  const labelPoints = dateLabelPoints(points);
  ctx.fillStyle = "#93a4b8";
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
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
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
  const points = [
    [padding, padding + plotHeight * 0.65],
    [padding + plotWidth * 0.32, padding + plotHeight * 0.46],
    [padding + plotWidth * 0.68, padding + plotHeight * 0.54],
    [padding + plotWidth, padding + plotHeight * 0.28],
  ];
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "rgba(102, 227, 211, 0.48)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(247, 199, 106, 0.74)";
  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawChartMessage(message, height) {
  ctx.fillStyle = "#93a4b8";
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
searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => loadCharacters(searchInput.value), 180);
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
  .then(() => loadCharacters())
  .catch((error) => {
    snapshotMeta.textContent = error.message;
  });

renderChart([]);
window.addEventListener("resize", () => renderChart(currentHistory));

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());
