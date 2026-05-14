const rankingRows = document.querySelector("#rankingRows");
const seasonBadge = document.querySelector("#seasonBadge");
const snapshotMeta = document.querySelector("#snapshotMeta");
const totalMeta = document.querySelector("#totalMeta");
const entryCount = document.querySelector("#entryCount");
const snapshotSelect = document.querySelector("#snapshotSelect");
const prevSnapshot = document.querySelector("#prevSnapshot");
const nextSnapshot = document.querySelector("#nextSnapshot");
const searchInput = document.querySelector("#searchInput");
const filterToggle = document.querySelector("#filterToggle");
const rankingFilters = document.querySelector("#rankingFilters");
const serverFilterInput = document.querySelector("#serverFilterInput");
const nameFilterInput = document.querySelector("#nameFilterInput");
const winsFilterInput = document.querySelector("#winsFilterInput");
const recentDaysInput = document.querySelector("#recentDaysInput");
const newUserFilterInput = document.querySelector("#newUserFilterInput");
const filterReset = document.querySelector("#filterReset");
const sortHeaders = [...document.querySelectorAll("[data-sort-key]")];
const tableWrap = document.querySelector(".table-wrap");
const selectedCharacter = document.querySelector("#selectedCharacter");
const seasonExtremes = document.querySelector("#seasonExtremes");
const detailPanel = document.querySelector(".detail-panel");
const chartContainer = document.querySelector(".chart-container");
const detailName = document.querySelector("#detailName");
const detailPoints = document.querySelector("#detailPoints");
const detailWins = document.querySelector("#detailWins");
const detailDelta = document.querySelector("#detailDelta");
const honorGrid = document.querySelector("#honorGrid");
const honorMeta = document.querySelector("#honorMeta");
const honorTabs = document.querySelector("#honorTabs");
const honorHead = honorTabs?.closest(".section-head");
const honorRotateToggle = document.querySelector("#honorRotateToggle");
const kpiSnapshots = document.querySelector("#kpiSnapshots");
const kpiNewEntries = document.querySelector("#kpiNewEntries");
const kpiWinGain = document.querySelector("#kpiWinGain");
const tierHeatmap = document.querySelector("#tierHeatmap");
const tierHeatmapLabels = document.querySelector("#tierHeatmapLabels");
const tierHeatmapMeta = document.querySelector("#tierHeatmapMeta");
const tierHeatmapPrev = document.querySelector("#tierHeatmapPrev");
const tierHeatmapNext = document.querySelector("#tierHeatmapNext");
const currentMapName = document.querySelector("#currentMapName");
const currentMapTime = document.querySelector("#currentMapTime");
const nextMapName = document.querySelector("#nextMapName");
const nextMapTime = document.querySelector("#nextMapTime");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const projectHeart = document.querySelector("#projectHeart");
const projectHeartCount = document.querySelector("#projectHeartCount");
const jumpTop = document.querySelector("#jumpTop");
const jumpBottom = document.querySelector("#jumpBottom");
const officialLink = document.querySelector("#officialLink");
const confirmModal = document.querySelector("#confirmModal");
const confirmOk = document.querySelector("#confirmOk");
const confirmCancel = document.querySelector("#confirmCancel");
const openSnapshotModal = document.querySelector("#openSnapshotModal");
const closeSnapshotModal = document.querySelector("#closeSnapshotModal");
const snapshotModal = document.querySelector("#snapshotModal");
const snapshotSelectMobile = document.querySelector("#snapshotSelectMobile");
const prevSnapshotMobile = document.querySelector("#prevSnapshotMobile");
const nextSnapshotMobile = document.querySelector("#nextSnapshotMobile");
const canvas = document.querySelector("#rankChart");
const ctx = canvas.getContext("2d");
const tierHeatmapCtx = tierHeatmap?.getContext("2d");
const detailOverlay = document.querySelector("#detailOverlay");
const detailBackBtn = document.querySelector("#detailBackBtn");
const detailOverlayTitle = document.querySelector("#detailOverlayTitle");
const detailOverlaySeasonBadge = document.querySelector("#detailOverlaySeasonBadge");
const detailOverlayMeta = document.querySelector("#detailOverlayMeta");
const detailOverlaySummary = document.querySelector("#detailOverlaySummary");
const detailOverlayHistoryCount = document.querySelector("#detailOverlayHistoryCount");
const detailOverlayHistoryRows = document.querySelector("#detailOverlayHistoryRows");
const detailOverlayCanvas = document.querySelector("#detailOverlayChart");
const detailOverlayCtx = detailOverlayCanvas?.getContext("2d");
const detailRecommendBtn = document.querySelector("#detailRecommendBtn");
const detailRecommendCount = document.querySelector("#detailRecommendCount");
let chartInstance = null;
let tierHeatmapChartInstance = null;
let currentTierHeatmapData = null;
let tierHeatmapSelectedDate = "";


let selectedKey = null;
let snapshots = [];
let currentSnapshotIndex = -1;
let currentHistory = [];
let latestEntries = [];
let rankingSort = { key: "rank", direction: "asc" };
let honorMode = 'rank';
let honorExitTimer = null;
let honorRotateTimer = null;
let honorCountdownTimer = null;
let honorRotateDueAt = 0;
let honorRotateRemainingMs = 0;
let honorRotatePaused = false;
let honorGridHovering = false;
const HONOR_MODES = ['rank', 'wins', 'rise'];
const HONOR_ROTATE_MS = 10000;
let chartTransitionTimer = null;
let rowRenderVersion = 0;
let characterRequestToken = 0;
let themeSwitchTimer = null;
let staticHistoryData = null;
let staticHistoryLoading = false;
let heatmapRequestToken = 0;
let heatmapWindowStart = null;
let snapshotTransitionTimer = null;
const SKELETON_ROW_COUNT = 12;
const SNAPSHOT_TRANSITION_MS = 160;

const THEMES = ["dark", "light"];
const THEME_ICONS = {
  dark: "☾",
  light: "☀",
};
const DEFAULT_THEME = "dark";
const THEME_SWITCH_MS = 360;
const HEART_STORAGE_KEY = "ccRankingProjectHeart";
const HEART_CLIENT_KEY = "ccRankingProjectHeartClient";
const UI_FONT_STACK = '"Pretendard", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO_FONT_STACK = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const OUT_OF_RANK_GRAPH_RANK = 101;
const OUT_OF_TIER_GRAPH_RANK = 11;
const HEATMAP_WINDOW_SIZE = 30;
const HEATMAP_ROWS = [
  { key: "ultima", label: "Ultima", group: "티어", source: "tier" },
  { key: "omega", label: "Omega", group: "티어", source: "tier" },
  { key: "crystal", label: "Crystal", group: "티어", source: "tier" },
  { key: "diamond", label: "Diamond", group: "티어", source: "tier" },
  { key: "platinum", label: "Platinum", group: "티어", source: "tier" },
  { key: "gold", label: "Gold", group: "티어", source: "tier" },
  { key: "silver", label: "Silver", group: "티어", source: "tier" },
  { key: "bronze", label: "Bronze", group: "티어", source: "tier" },
  { key: "in100", label: "In-100", source: "overall" },
];

const API_BASE = String(window.CC_API_BASE || "").replace(/\/$/, "");
const STATIC_DATA_BASE = String(window.CC_STATIC_DATA_BASE || "static/data").replace(/\/$/, "");
let staticDataPromise = null;
let mapNamesPromise = null;
let mapNameLookup = {};

function canvasFont(size, weight = "") {
  return `${weight ? `${weight} ` : ""}${size}px ${UI_FONT_STACK}`;
}

const MAP_ROTATION_CONFIG = {
  maps: ["Palaistra", "Volcanic Heart", "Bayside Battleground", "Cloud Nine", "Clockwork Castletown", "Archeia Harmonias", "Red Sands"],
  startMap: "Volcanic Heart",
  startTime: "2024-04-21T08:00:00-05:00",
};

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
          return { snapshots: [], entries_by_snapshot: {}, characters: [], history_by_key: {}, history_by_id: {} };
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

async function loadMapNames() {
  if (!mapNamesPromise) {
    const cacheKey = Date.now().toString(36);
    mapNamesPromise = fetchStaticJson("map-names.json", cacheKey, "map names")
      .catch(() => ({}))
      .then((payload) => {
        mapNameLookup = payload && typeof payload === "object" ? payload : {};
        return mapNameLookup;
      });
  }
  return mapNamesPromise;
}

async function staticApi(path) {
  const url = new URL(path, window.location.origin);
  if (url.pathname === "/api/map-rotation") {
    return localMapRotationPayload();
  }
  if (url.pathname === "/api/project-heart") {
    return { count: null };
  }

  const data = await loadStaticData();
  if (url.pathname === "/api/snapshots" || url.pathname === "/api/v1/snapshots") {
    return { snapshots: data.snapshots || [] };
  }
  if (url.pathname === "/api/season-periods") {
    return { season_periods: data.season_period ? [data.season_period] : data.season_periods || [] };
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
    const id = url.searchParams.get("id") || "";
    const key = url.searchParams.get("key") || characterKeyFromId(id);
    return {
      history: (data.history_by_id || {})[id] || (data.history_by_key || {})[key] || [],
    };
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
  if (entry.movement_direction === "out" || entry.is_dropped) return "OUT";
  if (entry.movement_direction === "new") return "NEW";
  if (!entry.movement_direction || entry.movement_value == null) return "-";
  const arrow = entry.movement_direction === "up" ? "▲" : "▼";
  return `${arrow} ${entry.movement_value}`;
}

function rankClass(rank) {
  if (rank == null) return "rank-dropped";
  if (rank === 1)  return "rank-first";
  if (rank <= 30)  return "rank-top30";
  return "rank-rest";
}

function tierClass(tier) {
  return `tier-${String(tier || "unknown").toLowerCase()}`;
}

function rankAuraClass(rank) {
  const r = numberValue(rank);
  if (r <= 100) return "tier-border";
  return "";
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

function movementBadge(entry) {
  const dir = entry.movement_direction;
  if (entry.is_dropped || dir === "out") return '<span class="move" data-dir="out">OUT</span>';
  if (dir === "new") return '<span class="move" data-dir="new">NEW</span>';
  if (dir === "up") return `<span class="move" data-dir="up"><span class="arrow">▲</span>${escapeHtml(String(entry.movement_value ?? ""))}</span>`;
  if (dir === "down") return `<span class="move" data-dir="down"><span class="arrow">▼</span>${escapeHtml(String(entry.movement_value ?? ""))}</span>`;
  return '<span class="move" data-dir="flat">—</span>';
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
  const nextTheme = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  if (options.animate && document.body.dataset.theme !== nextTheme) {
    window.clearTimeout(themeSwitchTimer);
    document.body.classList.add("is-theme-switching");
    themeSwitchTimer = window.setTimeout(() => {
      document.body.classList.remove("is-theme-switching");
    }, THEME_SWITCH_MS);
  }
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
  updateChart(currentHistory);
  if (currentTierHeatmapData) {
    renderTierHeatmapChart(currentTierHeatmapData);
  }
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

function storedProjectHeart() {
  try {
    return window.localStorage.getItem(HEART_STORAGE_KEY) === "1";
  } catch (error) {
    return readCookie(HEART_STORAGE_KEY) === "1";
  }
}

function projectHeartClientId() {
  try {
    let value = window.localStorage.getItem(HEART_CLIENT_KEY);
    if (!value) {
      value = makeClientId();
      window.localStorage.setItem(HEART_CLIENT_KEY, value);
    }
    return value;
  } catch (error) {
    let value = readCookie(HEART_CLIENT_KEY);
    if (!value) {
      value = makeClientId();
      writeCookie(HEART_CLIENT_KEY, value);
    }
    return value;
  }
}

function makeClientId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replaceAll("-", "");
  }
  const random = new Uint32Array(4);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(random);
  } else {
    random.forEach((_, index) => {
      random[index] = Math.floor(Math.random() * 0xffffffff);
    });
  }
  return Array.from(random, (part) => part.toString(36).padStart(7, "0")).join("");
}

function updateProjectHeartCount(count) {
  if (count == null || Number.isNaN(Number(count))) {
    projectHeartCount.textContent = "-";
    projectHeart.classList.add("is-heart-offline");
    return;
  }
  projectHeart.classList.remove("is-heart-offline");
  projectHeartCount.textContent = Number(count).toLocaleString("ko-KR");
}

function applyProjectHeart(isLiked, options = {}) {
  projectHeart.classList.toggle("is-liked", isLiked);
  projectHeart.setAttribute("aria-pressed", isLiked ? "true" : "false");
  const countText = projectHeartCount.textContent && projectHeartCount.textContent !== "-" ? ` ${projectHeartCount.textContent}명` : "";
  projectHeart.title = isLiked ? `하트를 눌렀습니다${countText}` : `프로젝트가 마음에 들었다면 눌러주세요${countText}`;
  projectHeart.setAttribute("aria-label", projectHeart.title);
  if (options.persist === false) return;
  try {
    window.localStorage.setItem(HEART_STORAGE_KEY, isLiked ? "1" : "0");
  } catch (error) {
    writeCookie(HEART_STORAGE_KEY, isLiked ? "1" : "0");
  }
}

async function loadProjectHeartCount() {
  const payload = await api("/api/project-heart");
  updateProjectHeartCount(payload.count);
  applyProjectHeart(storedProjectHeart(), { persist: false });
  if (storedProjectHeart()) {
    saveProjectHeart(true).catch(() => {});
  }
}

async function saveProjectHeart(isLiked) {
  const payload = await api("/api/project-heart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: projectHeartClientId(),
      liked: isLiked,
    }),
  });
  updateProjectHeartCount(payload.count);
  applyProjectHeart(Boolean(payload.liked), { persist: false });
}

function renderDashboardSkeleton() {
  document.body.classList.add("is-loading");
  seasonBadge.textContent = "-";
  snapshotMeta.innerHTML = '<span class="skeleton-line skeleton-meta"></span>';
  if (totalMeta) totalMeta.innerHTML = '<span class="skeleton-line skeleton-total"></span>';
  entryCount.innerHTML = '<span class="skeleton-line skeleton-count"></span>';
  snapshotSelect.innerHTML = "<option>불러오는 중</option>";
  snapshotSelect.disabled = true;
  prevSnapshot.disabled = true;
  nextSnapshot.disabled = true;
  rankingRows.innerHTML = skeletonRowsHtml(SKELETON_ROW_COUNT);
  renderCharacterSkeleton();
  renderMapSkeleton();
}

function renderSnapshotSkeleton() {
  entryCount.innerHTML = '<span class="skeleton-line skeleton-count"></span>';
  rankingRows.innerHTML = skeletonRowsHtml(SKELETON_ROW_COUNT);
}

function renderCharacterSkeleton() {
  detailPanel.classList.add("is-history-loading");
  if (detailName) detailName.innerHTML = '<span class="skeleton-line skeleton-selected-name"></span>';
  selectedCharacter.innerHTML = '<span class="skeleton-line skeleton-selected-tier"></span>';
  if (detailPoints) detailPoints.innerHTML = '<span class="skeleton-line skeleton-points"></span>';
  if (detailWins) detailWins.innerHTML = '<span class="skeleton-line skeleton-wins"></span>';
  if (detailDelta) detailDelta.textContent = "-";
  seasonExtremes.innerHTML = `
    <div class="extreme-card skeleton-card" aria-hidden="true">
      <span class="skeleton-line skeleton-card-label"></span>
      <strong><span class="skeleton-line skeleton-card-title"></span></strong>
      <small><span class="skeleton-line skeleton-card-meta"></span></small>
    </div>
    <div class="extreme-card skeleton-card" aria-hidden="true">
      <span class="skeleton-line skeleton-card-label"></span>
      <strong><span class="skeleton-line skeleton-card-title"></span></strong>
      <small><span class="skeleton-line skeleton-card-meta"></span></small>
    </div>
  `;
  canvas.classList.add("chart-loading");
}

function beginCharacterHistoryLoading() {
  detailPanel.classList.add("is-history-loading");
  canvas.classList.add("chart-loading");
}

function endCharacterHistoryLoading() {
  detailPanel.classList.remove("is-history-loading");
  canvas.classList.remove("chart-loading");
}

function renderMapSkeleton() {
  currentMapName.innerHTML = '<span class="skeleton-line skeleton-map-name"></span>';
  currentMapTime.innerHTML = '<span class="skeleton-line skeleton-map-time"></span>';
  nextMapName.innerHTML = '<span class="skeleton-line skeleton-map-name"></span>';
  nextMapTime.innerHTML = '<span class="skeleton-line skeleton-map-time"></span>';
}

function skeletonRowsHtml(count) {
  return Array.from({ length: count }, (_, index) => `
    <tr class="skeleton-row" aria-hidden="true">
      <td><span class="skeleton-line skeleton-rank"></span></td>
      <td><span class="skeleton-line ${index % 3 === 0 ? "skeleton-name-wide" : "skeleton-name"}"></span></td>
      <td><span class="skeleton-line skeleton-server"></span></td>
      <td><span class="skeleton-line skeleton-tier"></span></td>
      <td><span class="skeleton-line skeleton-rank"></span></td>
      <td><span class="skeleton-line skeleton-points"></span></td>
      <td><span class="skeleton-line skeleton-wins"></span></td>
      <td><span class="skeleton-line skeleton-movement"></span></td>
    </tr>
  `).join("");
}

function renderLatest(payload, options = {}) {
  const smoothTransition = Boolean(options.smoothTransition);
  document.body.classList.remove("is-loading");
  document.body.classList.remove("is-snapshot-loading");
  canvas.classList.remove("chart-loading");
  const snapshot = payload.snapshot;
  let entries = payload.entries || [];

  const params = new URLSearchParams(window.location.search);
  if (params.has("dev") || params.has("mock")) {
    const tiers = [
      { label: "Ultima", code: "tier8", color: "Moogle" },
      { label: "Omega", code: "tier7", color: "Chocobo" },
      { label: "Crystal", code: "tier6", color: "Bahamut" },
      { label: "Diamond", code: "tier5", color: "Shinryu" },
      { label: "Platinum", code: "tier4", color: "Garuda" },
      { label: "Gold", code: "tier3", color: "Ifrit" },
      { label: "Silver", code: "tier2", color: "Titan" },
      { label: "Bronze", code: "tier1", color: "Ramuh" },
    ];
    entries = tiers.map((t, i) => ({
      character_name: `Mock ${t.label} User`,
      character_key: `mock-${t.label.toLowerCase()}`,
      server_name: t.color,
      tier_label: t.label,
      tier_code: t.code,
      rank: i + 1,
      wins: 100 * (8 - i),
      movement_direction: i % 2 === 0 ? "up" : "flat",
      movement_value: i,
      crystal_points: 1000 * (8 - i),
    }));
  }

  latestEntries = entries;
  renderServerFilterOptions(entries);
  if (!snapshot) {
    endCharacterHistoryLoading();
    seasonBadge.textContent = "-";
    snapshotMeta.textContent = "저장된 스냅샷이 없습니다.";
    if (totalMeta) totalMeta.textContent = "-";
    entryCount.textContent = "";
    selectedCharacter.innerHTML = "";
    seasonExtremes.innerHTML = "";
    rankingRows.innerHTML = `<tr><td class="empty" colspan="8">아직 데이터가 없습니다.</td></tr>`;
    renderTierHeatmap(null, entries, { snapshots: [], entries_by_snapshot: {} });
    updateChart([], { animate: false });
    renderHonorGrid();
    return;
  }

  seasonBadge.textContent = snapshot.season ? `${snapshot.season}` : "-";
  snapshotMeta.textContent = snapshot.source_time_text || snapshot.scraped_at || "-";
  if (totalMeta) totalMeta.textContent = rankingCountText(entries);
  entryCount.textContent = rankingCountText(entries);
  renderRankingRows();
  renderHonorGrid({ animate: !smoothTransition });
  scheduleHonorRotate();
  updateKpis(snapshot, entries);
  scheduleTierHeatmapRender(snapshot, entries, { preserveExisting: smoothTransition });
  if (currentHistory.length === 0) {
    updateChart([], { animate: false });
  }
}

function renderRankingRows() {
  const version = ++rowRenderVersion;
  const entries = filteredRankingEntries();
  entryCount.textContent = hasActiveRankingFilters()
    ? `${entries.length} / ${rankingCountText(latestEntries)}`
    : rankingCountText(latestEntries);
  updateSortHeaders();

  const commit = () => {
    if (version !== rowRenderVersion) return;
    rankingRows.classList.remove("rows-fading");
    if (entries.length === 0) {
      rankingRows.innerHTML = `<tr><td class="empty" colspan="8">검색 결과가 없습니다.</td></tr>`;
      return;
    }
    rankingRows.innerHTML = entries.map((entry) => {
      const isNew = entry.movement_direction === "new";
      const isDropped = Boolean(entry.is_dropped);
      const rowClass = [
        isNew ? "is-new" : "",
        isDropped ? "is-dropped" : "",
      ].filter(Boolean).join(" ");
      return `
        <tr class="${rowClass}" data-key="${escapeHtml(entry.character_key)}">
          <td>${rankCellHtml(entry)}</td>
          <td>
            <span class="name-cell">
              <a class="character-detail-link" href="details/?id=${encodeURIComponent(characterIdForEntry(entry))}">${escapeHtml(entry.character_name)}</a>
              ${isNew ? '<span class="new-pill">NEW</span>' : ""}
            </span>
          </td>
          <td>${escapeHtml(entry.server_name)}</td>
          <td><span class="tier-pill ${tierClass(entry.tier_label)} ${rankAuraClass(entry.rank)}">${tierIconHtml(entry)}<span>${escapeHtml(entry.tier_label || "-")}</span></span></td>
          <td>${tierRankCellHtml(entry)}</td>
          <td>${pointsWithDeltaHtml(entry)}</td>
          <td>${winsWithDeltaHtml(entry)}</td>
          <td>${movementBadge(entry)}</td>
        </tr>
      `;
    }).join("");
    [...rankingRows.querySelectorAll("tr[data-key]")].forEach((row) => {
      row.querySelector(".character-detail-link")?.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        const url = new URL(event.currentTarget.href);
        const characterId = url.searchParams.get("id");
        if (characterId) openDetailOverlay(characterId);
      });
      row.addEventListener("click", () => {
        selectCharacter(row.dataset.key, { scrollRanking: false, scrollDetail: true });
      });
    });
    updateRankingSelection(selectedKey);
  };

  const hasRealRows = rankingRows.querySelector("tr[data-key]") !== null;
  if (hasRealRows) {
    rankingRows.classList.add("rows-fading");
    window.setTimeout(commit, 115);
  } else {
    commit();
  }
}

function sortedRankingEntries(entries) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const result = compareRankingEntries(left.entry, right.entry, rankingSort.key, rankingSort.direction);
      return result || left.index - right.index;
    })
    .map((item) => item.entry);
}

function compareRankingEntries(left, right, key, direction) {
  const leftDropped = left.is_dropped || left.rank == null;
  const rightDropped = right.is_dropped || right.rank == null;
  if (leftDropped && rightDropped) {
    return compareNumber(tierSortValue(left), tierSortValue(right), "desc", { missingLast: false })
      || compareNumber(numberValue(left.wins), numberValue(right.wins), "desc");
  }
  if (key === "character") {
    return compareText(left.character_name, right.character_name, direction);
  }
  if (key === "server") {
    return compareText(left.server_name, right.server_name, direction);
  }
  if (key === "tier") {
    return compareNumber(tierSortValue(left), tierSortValue(right), direction, { missingLast: false })
      || compareNumber(pointsSortValue(left), pointsSortValue(right), direction)
      || compareNumber(rankSortValue(left), rankSortValue(right), "asc");
  }
  if (key === "tier_rank") {
    return compareNumber(tierSortValue(left), tierSortValue(right), "desc", { missingLast: false })
      || compareNumber(tierRankSortValue(left), tierRankSortValue(right), direction)
      || compareNumber(numberValue(left.wins), numberValue(right.wins), "desc");
  }
  if (key === "points") {
    return compareNumber(pointsSortValue(left), pointsSortValue(right), direction)
      || compareNumber(rankSortValue(left), rankSortValue(right), "asc");
  }
  if (key === "wins") {
    return compareNumber(numberValue(left.wins), numberValue(right.wins), direction)
      || compareNumber(rankSortValue(left), rankSortValue(right), "asc");
  }
  if (key === "movement") {
    return compareNumber(movementSortValue(left), movementSortValue(right), direction, { missingLast: false })
      || compareNumber(rankSortValue(left), rankSortValue(right), "asc");
  }
  return compareNumber(rankSortValue(left), rankSortValue(right), direction);
}

function compareText(left, right, direction) {
  const result = String(left || "").localeCompare(String(right || ""), "ko", {
    numeric: true,
    sensitivity: "base",
  });
  return direction === "asc" ? result : -result;
}

function compareNumber(left, right, direction, options = {}) {
  const { missingLast = true } = options;
  const leftMissing = !Number.isFinite(left);
  const rightMissing = !Number.isFinite(right);
  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return missingLast ? 1 : -1;
  if (rightMissing) return missingLast ? -1 : 1;
  const result = left - right;
  return direction === "asc" ? result : -result;
}

function rankSortValue(entry) {
  return numberValue(entry.rank);
}

function tierSortValue(entry) {
  return tierScore(entry.tier_label);
}

function tierRankSortValue(entry) {
  return numberValue(entry.tier_rank);
}

function pointsSortValue(entry) {
  return numberValue(pointsDisplay(entry));
}

function movementSortValue(entry) {
  if (entry.movement_direction === "out" || entry.is_dropped) return -1000000;
  if (entry.movement_direction === "new") return 1000000;
  const amount = numberValue(entry.movement_value);
  if (entry.movement_direction === "up") return Number.isFinite(amount) ? amount : 0;
  if (entry.movement_direction === "down") return Number.isFinite(amount) ? -amount : 0;
  return 0;
}

function numberValue(value) {
  const parsed = Number.parseInt(String(value ?? "").replaceAll(",", ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function updateSortHeaders() {
  sortHeaders.forEach((header) => {
    const active = header.dataset.sortKey === rankingSort.key;
    header.classList.toggle("is-active", active);
    header.dataset.direction = active ? rankingSort.direction : "";
    header.setAttribute(
      "aria-sort",
      active ? (rankingSort.direction === "asc" ? "ascending" : "descending") : "none",
    );
  });
}

function rankingCountText(entries) {
  const droppedCount = entries.filter((entry) => entry.is_dropped).length;
  const officialCount = entries.length - droppedCount;
  return droppedCount > 0 ? `${officialCount}명 + 순위권 밖 ${droppedCount}명` : `${officialCount}명`;
}

function officialCollectedEntries(entries) {
  return entries.filter((entry) => !entry.is_dropped);
}

function rankCellHtml(entry) {
  if (entry.is_dropped || entry.rank == null) {
    return '<span class="rank-badge rank-dropped" aria-label="순위권 밖"></span>';
  }
  return `<span class="rank-badge ${rankClass(entry.rank)}">${escapeHtml(entry.rank)}</span>`;
}

function tierRankCellHtml(entry) {
  const tierRank = numberValue(entry.tier_rank);
  if (!Number.isFinite(tierRank)) return '<span class="tier-rank-empty">-</span>';
  return `<span class="tier-rank-badge">${tierIconHtml(entry)}<span>${escapeHtml(String(tierRank))}</span></span>`;
}

function filteredRankingEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const filters = rankingFilterValues();
  if (filters.recentDays && filters.minWins != null && !staticHistoryData && !staticHistoryLoading) {
    loadStaticHistoryForFilters();
  }
  const entries = latestEntries.filter((entry) => matchesRankingFilters(entry, query, filters));
  return sortedRankingEntries(entries);
}

function rankingFilterValues() {
  const minWins = numberValue(winsFilterInput.value);
  const recentDays = numberValue(recentDaysInput.value);
  return {
    server: serverFilterInput.value.trim().toLowerCase(),
    name: nameFilterInput.value.trim().toLowerCase(),
    minWins: Number.isFinite(minWins) ? minWins : null,
    recentDays: Number.isFinite(recentDays) && recentDays > 0 ? recentDays : null,
    newOnly: newUserFilterInput.checked,
  };
}

function renderServerFilterOptions(entries = latestEntries) {
  const selected = serverFilterInput.value;
  const servers = [...new Set(entries.map((entry) => String(entry.server_name || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ko"));
  serverFilterInput.innerHTML = [
    '<option value="">전체 서버</option>',
    ...servers.map((server) => `<option value="${escapeHtml(server)}">${escapeHtml(server)}</option>`),
  ].join("");
  serverFilterInput.value = servers.includes(selected) ? selected : "";
  filterToggle.classList.toggle("is-active", hasActiveAdvancedFilters());
}

function hasActiveRankingFilters() {
  const filters = rankingFilterValues();
  return Boolean(
    searchInput.value.trim()
    || hasActiveAdvancedFilters(filters)
  );
}

function hasActiveAdvancedFilters(filters = rankingFilterValues()) {
  return Boolean(
    filters.server
    || filters.name
    || filters.minWins != null
    || filters.recentDays
    || filters.newOnly
  );
}

function updateFilterToggleLabel(expanded) {
  filterToggle.setAttribute("aria-label", expanded ? "필터 닫기" : "필터 열기");
  filterToggle.setAttribute("title", expanded ? "필터 닫기" : "필터 열기");
}

function matchesRankingFilters(entry, query, filters) {
  const characterName = String(entry.character_name || "").toLowerCase();
  const serverName = String(entry.server_name || "").toLowerCase();
  if (query && !characterName.includes(query)) return false;
  if (filters.server && serverName !== filters.server) return false;
  if (filters.name && !characterName.includes(filters.name)) return false;
  if (filters.newOnly && entry.movement_direction !== "new") return false;
  if (filters.minWins == null) return true;
  if (filters.recentDays && !staticHistoryData) return true;
  const wins = filters.recentDays
    ? recentWinsForEntry(entry, filters.recentDays)
    : numberValue(entry.wins);
  return Number.isFinite(wins) && wins >= filters.minWins;
}

function loadStaticHistoryForFilters() {
  staticHistoryLoading = true;
  loadStaticData()
    .then((data) => {
      staticHistoryData = data;
    })
    .catch(() => {
      staticHistoryData = { history_by_key: {}, history_by_id: {} };
    })
    .finally(() => {
      staticHistoryLoading = false;
      renderRankingRows();
    });
}

function recentWinsForEntry(entry, days) {
  const history = historyForEntry(entry);
  if (history.length === 0) return Number.NaN;
  const currentTime = entryTimeMs(entry);
  if (!Number.isFinite(currentTime)) return Number.NaN;
  const startTime = currentTime - days * 24 * 60 * 60 * 1000;
  return history.reduce((total, row) => {
    const rowTime = entryTimeMs(row);
    if (!Number.isFinite(rowTime) || rowTime < startTime || rowTime > currentTime) return total;
    const delta = numberValue(row.win_delta);
    return Number.isFinite(delta) ? total + Math.max(0, delta) : total;
  }, 0);
}

function historyForEntry(entry) {
  if (!staticHistoryData) return [];
  const id = characterIdForEntry(entry);
  return (staticHistoryData.history_by_id || {})[id]
    || (staticHistoryData.history_by_key || {})[entry.character_key]
    || [];
}

function entryTimeMs(entry) {
  const sourceTime = String(entry.source_time_text || entry.source_time || "").trim();
  const sourceMatch = sourceTime.match(/(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (sourceMatch) {
    const [, year, month, day, hour = "0", minute = "0"] = sourceMatch;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+09:00`).getTime();
  }
  const snapshot = snapshots.find((item) => String(item.id) === String(entry.snapshot_id));
  if (snapshot) {
    return entryTimeMs(snapshot);
  }
  const scrapedTime = Date.parse(entry.scraped_at || "");
  return Number.isFinite(scrapedTime) ? scrapedTime : Number.NaN;
}

function characterIdForEntry(entry) {
  return entry.character_id || characterIdForKey(entry.character_key);
}

function characterIdForKey(key) {
  const bytes = new TextEncoder().encode(String(key || ""));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `c1_${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
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

async function loadLatest() {
  const payload = await api("/api/latest");
  renderLatest(payload);
  setCurrentSnapshot(payload.snapshot?.id);
  await selectDefaultCharacter();
}

async function loadMapRotation() {
  try {
    await loadMapNames();
    renderMapRotation(await api("/api/map-rotation"));
  } catch (error) {
    renderMapRotation(localMapRotationPayload());
  }
}

function renderMapRotation(payload) {
  const current = payload.current || {};
  const next = (payload.upcoming || [])[0] || {};
  currentMapName.textContent = mapDisplayName(current.map);
  currentMapTime.textContent = current.time_label || "-";
  nextMapName.textContent = mapDisplayName(next.map);
  nextMapTime.textContent = next.time_label || "-";
}

function mapDisplayName(mapName) {
  const key = String(mapName || "");
  const displayName = String(mapNameLookup[key] || "").trim();
  return displayName || key || "-";
}

function localMapRotationPayload() {
  const intervalMs = 60 * 60 * 1000;
  const startTime = new Date(MAP_ROTATION_CONFIG.startTime);
  const intervals = Math.floor((Date.now() - startTime.getTime()) / intervalMs);
  const currentStart = new Date(startTime.getTime() + intervals * intervalMs);
  const startIndex = MAP_ROTATION_CONFIG.maps.indexOf(MAP_ROTATION_CONFIG.startMap);
  const currentIndex = (startIndex + intervals) % MAP_ROTATION_CONFIG.maps.length;
  const slots = Array.from({ length: 7 }, (_, index) =>
    localMapSlot(currentIndex + index, new Date(currentStart.getTime() + index * intervalMs), intervalMs)
  );
  return {
    source_url: "https://cc.shilin.net/",
    timezone: "Asia/Seoul",
    interval_minutes: 60,
    current: slots[0],
    upcoming: slots.slice(1),
  };
}

function localMapSlot(mapIndex, start, intervalMs) {
  const end = new Date(start.getTime() + intervalMs);
  return {
    map: MAP_ROTATION_CONFIG.maps[((mapIndex % MAP_ROTATION_CONFIG.maps.length) + MAP_ROTATION_CONFIG.maps.length) % MAP_ROTATION_CONFIG.maps.length],
    start: formatKstIso(start),
    end: formatKstIso(end),
    date_label: formatKstDate(start),
    time_label: `${formatKstTime(start)} - ${formatKstTime(end)} KST`,
  };
}

function formatKstIso(date) {
  const parts = kstDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}+09:00`;
}

function formatKstDate(date) {
  const parts = kstDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatKstTime(date) {
  const parts = kstDateParts(date);
  return `${parts.hour}:${parts.minute}`;
}

function kstDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

async function loadSnapshots() {
  const payload = await api("/api/snapshots");
  snapshots = (payload.snapshots || []).slice();
  snapshotSelect.innerHTML = snapshots.map((snapshot, index) => `
    <option value="${snapshot.id}">${escapeHtml(formatSnapshotDate(snapshot.source_time_text || snapshot.scraped_at || `Snapshot ${snapshot.id}`))}</option>
  `).join("");
  if (snapshotSelectMobile) snapshotSelectMobile.innerHTML = snapshotSelect.innerHTML;
  if (snapshots.length === 0) {
    snapshotSelect.innerHTML = `<option>저장된 데이터 없음</option>`;
    if (snapshotSelectMobile) snapshotSelectMobile.innerHTML = snapshotSelect.innerHTML;
    snapshotSelect.disabled = true;
    prevSnapshot.disabled = true;
    nextSnapshot.disabled = true;
  } else {
    snapshotSelect.disabled = false;
  }
}

function formatSnapshotDate(value) {
  const text = String(value || "-");
  const match = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (match) return match[0].replaceAll("/", "-").replaceAll(".", "-");
  return text.split(/\s+/)[0] || "-";
}

async function loadSnapshot(snapshotId, options = {}) {
  const smoothTransition = options.smoothTransition !== false;
  const direction = snapshotTransitionDirection(snapshotId);
  if (smoothTransition) {
    beginSnapshotTransition(direction);
  } else {
    renderSnapshotSkeleton();
  }
  try {
    const payloadPromise = api(`/api/snapshot?id=${encodeURIComponent(snapshotId)}`);
    const payload = smoothTransition
      ? await Promise.all([payloadPromise, wait(SNAPSHOT_TRANSITION_MS)]).then(([result]) => result)
      : await payloadPromise;
    renderLatest(payload, { smoothTransition });
    setCurrentSnapshot(Number(snapshotId));
    await selectDefaultCharacter();
    const url = new URL(window.location.href);
    url.searchParams.set("snapshot", snapshotId);
    window.history.replaceState({}, "", url);
  } finally {
    if (smoothTransition) endSnapshotTransition();
    else document.body.classList.remove("is-snapshot-loading");
  }
}

function snapshotTransitionDirection(snapshotId) {
  const nextIndex = snapshots.findIndex((snapshot) => String(snapshot.id) === String(snapshotId));
  if (currentSnapshotIndex < 0 || nextIndex < 0 || nextIndex === currentSnapshotIndex) return 1;
  return nextIndex > currentSnapshotIndex ? -1 : 1;
}

function beginSnapshotTransition(direction) {
  window.clearTimeout(snapshotTransitionTimer);
  document.body.style.setProperty("--snapshot-slide-dir", String(direction < 0 ? -1 : 1));
  document.body.classList.remove("snapshot-slide-in");
  document.body.classList.add("is-snapshot-loading", "snapshot-slide-out");
}

function endSnapshotTransition() {
  document.body.classList.remove("snapshot-slide-out");
  document.body.classList.add("snapshot-slide-in");
  window.clearTimeout(snapshotTransitionTimer);
  snapshotTransitionTimer = window.setTimeout(() => {
    document.body.classList.remove("is-snapshot-loading", "snapshot-slide-in");
  }, SNAPSHOT_TRANSITION_MS + 40);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function selectDefaultCharacter() {
  if (selectedKey || !latestEntries[0]) return;
  await selectCharacter(latestEntries[0].character_key, { scrollRanking: false });
}

function setCurrentSnapshot(snapshotId) {
  currentSnapshotIndex = snapshots.findIndex((snapshot) => snapshot.id === snapshotId);
  if (currentSnapshotIndex >= 0) {
    snapshotSelect.value = String(snapshotId);
  }
  prevSnapshot.disabled = currentSnapshotIndex < 0 || currentSnapshotIndex >= snapshots.length - 1;
  nextSnapshot.disabled = currentSnapshotIndex <= 0;
}

async function selectCharacter(key, options = {}) {
  const { scrollRanking = true, scrollDetail = false } = options;
  selectedKey = key;
  const requestToken = ++characterRequestToken;
  const hasRenderedDetail = currentHistory.length > 0 || selectedCharacter.innerHTML.trim() || seasonExtremes.innerHTML.trim();
  if (hasRenderedDetail) {
    beginCharacterHistoryLoading();
  } else {
    renderCharacterSkeleton();
  }
  if (scrollDetail) {
    scrollDetailIntoView();
  }
  try {
    const payload = await api(`/api/history?key=${encodeURIComponent(key)}`);
    if (requestToken !== characterRequestToken) return;
    const history = payload.history || [];
    currentHistory = history;
    const latest = history[history.length - 1];
    endCharacterHistoryLoading();
    updateDetailStats(latest);
    selectedCharacter.innerHTML = latest ? selectedCharacterHtml(latest, history.length) : "";
    seasonExtremes.innerHTML = latest ? seasonExtremesHtml(history, latest.season) : "";
    updateHonorGridSelection(key);
    updateRankingSelection(key);
    updateChart(history);
    if (scrollRanking) {
      scrollRankingIntoView(key);
    }
  } catch (error) {
    if (requestToken !== characterRequestToken) return;
    endCharacterHistoryLoading();
    updateChart(currentHistory, { animate: false });
    selectedCharacter.textContent = error.message;
    seasonExtremes.innerHTML = "";
  }
}

function selectedCharacterHtml(latest, sampleCount) {
  return `
    <span>@${escapeHtml(latest.server_name)}</span>
    <span class="dot-sep">·</span>
    <span class="selected-tier">${tierIconHtml(latest)}<span>${escapeHtml(latest.tier_label || "-")}</span></span>
    <span class="dot-sep">·</span>
    <span>${sampleCount}개 스냅샷</span>
  `;
}

function updateDetailStats(latest) {
  if (!latest) {
    if (detailName) detailName.textContent = "캐릭터를 선택하세요";
    if (detailPoints) detailPoints.textContent = "-";
    if (detailWins) detailWins.textContent = "-";
    if (detailDelta) { detailDelta.textContent = "-"; detailDelta.style.color = ""; }
    return;
  }
  if (detailName) detailName.innerHTML = detailNameHtml(latest);
  if (detailPoints) detailPoints.textContent = pointsDisplay(latest);
  if (detailWins) detailWins.innerHTML = winsWithDeltaHtml(latest);
  if (detailDelta) {
    const delta = latest.points_delta != null ? Number(latest.points_delta) : null;
    detailDelta.textContent = delta != null ? (delta >= 0 ? `+${delta}` : `${delta}`) : "-";
    detailDelta.style.color = delta > 0 ? "var(--up)" : delta < 0 ? "var(--down)" : "var(--fg-3)";
  }
}

function detailNameHtml(entry) {
  const detailEntry = { ...entry, character_key: entry.character_key || selectedKey };
  return `
    <span class="detail-name-text">${escapeHtml(entry.character_name)}</span>
    <a class="detail-open-link" href="details/?id=${encodeURIComponent(characterIdForEntry(detailEntry))}">상세보기<span class="detail-open-icon" aria-hidden="true"></span></a>
  `;
}

function seasonExtremesHtml(history, season) {
  const seasonHistory = history.filter((row) => row.season === season);
  if (seasonHistory.length === 0) return "";

  const bestRank = seasonHistory.reduce((best, row) => betterTier(row, best) ? row : best, seasonHistory[0]);
  const worstRank = seasonHistory.reduce((worst, row) => worseTier(row, worst) ? row : worst, seasonHistory[0]);
  const rankedHistory = seasonHistory.filter((row) => Number.isFinite(numberValue(row.rank)));
  const bestRanking = rankedHistory.reduce((best, row) => row.rank < best.rank ? row : best, rankedHistory[0] || null);
  const worstRanking = rankedHistory.reduce((worst, row) => row.rank > worst.rank ? row : worst, rankedHistory[0] || null);
  const bestRankText = bestRanking ? `#${escapeHtml(bestRanking.rank)}` : "100위권 밖";
  const worstRankText = worstRanking ? `#${escapeHtml(worstRanking.rank)}` : "100위권 밖";
  const bestRankDate = bestRanking || bestRank;
  const worstRankDate = worstRanking || worstRank;

  return `
    <div class="extreme-card">
      <span>이번 시즌 최고 랭크</span>
      <strong>${tierIconHtml(bestRank)}${escapeHtml(tierWithPoints(bestRank))}</strong>
      <small>이번 시즌 최고 랭킹 ${bestRankText} · ${escapeHtml(formatSnapshotDate(bestRankDate.source_time_text || bestRankDate.scraped_at))}</small>
    </div>
    <div class="extreme-card">
      <span>이번 시즌 최저 랭크</span>
      <strong>${tierIconHtml(worstRank)}${escapeHtml(tierWithPoints(worstRank))}</strong>
      <small>이번 시즌 최저 랭킹 ${worstRankText} · ${escapeHtml(formatSnapshotDate(worstRankDate.source_time_text || worstRankDate.scraped_at))}</small>
    </div>
  `;
}

function betterTier(row, best) {
  const rowScore = tierScore(row.tier_label);
  const bestScore = tierScore(best.tier_label);
  if (rowScore !== bestScore) return rowScore > bestScore;
  const rowPoints = pointsValue(row);
  const bestPoints = pointsValue(best);
  if (rowPoints !== bestPoints) return rowPoints > bestPoints;
  return rankingComparableValue(row) < rankingComparableValue(best);
}

function worseTier(row, worst) {
  const rowScore = tierScore(row.tier_label);
  const worstScore = tierScore(worst.tier_label);
  if (rowScore !== worstScore) return rowScore < worstScore;
  const rowPoints = pointsValue(row);
  const worstPoints = pointsValue(worst);
  if (rowPoints !== worstPoints) return rowPoints < worstPoints;
  return rankingComparableValue(row) > rankingComparableValue(worst);
}

function rankingComparableValue(row) {
  const rank = numberValue(row.rank);
  if (Number.isFinite(rank)) return rank;
  const tierRank = numberValue(row.tier_rank);
  if (Number.isFinite(tierRank)) return 100 + tierRank;
  return 1000;
}

function tierWithPoints(entry) {
  const tier = entry.tier_label || "-";
  const points = pointsDisplay(entry);
  return points === "-" ? tier : `${tier} · ${points}`;
}

function pointsDisplay(entry) {
  const points = entry.points_text ?? entry.points;
  const text = String(points ?? "").trim();
  return text ? text : "-";
}

function pointsWithDeltaHtml(entry) {
  const base = escapeHtml(pointsDisplay(entry));
  const delta = entry.points_delta ?? null;
  if (delta == null) return base;
  const sign = delta >= 0 ? '+' : '';
  return `${base}<span class="pts-delta">(${sign}${delta})</span>`;
}

function winsWithDeltaHtml(entry) {
  const base = escapeHtml(String(entry.wins ?? "-"));
  const delta = entry.win_delta ?? null;
  if (delta == null) return base;
  const sign = delta >= 0 ? '+' : '';
  return `${base}<span class="pts-delta">(${sign}${escapeHtml(String(delta))})</span>`;
}

function pointsValue(entry) {
  const parsed = Number.parseInt(String(pointsDisplay(entry)).replaceAll(",", ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function tierScore(tier) {
  const value = normalizeTier(tier);
  if (value === "ultima") return 8;
  if (value === "omega") return 7;
  if (value === "crystal") return 6;
  if (value === "diamond") return 5;
  if (value === "platinum") return 4;
  if (value === "gold") return 3;
  if (value === "silver") return 2;
  if (value === "bronze") return 1;
  return 0;
}

function scrollRankingIntoView(key) {
  const target = rankingRows.querySelector(`[data-key="${cssEscape(key)}"]`);
  scrollAndFlash(target);
}

function scrollDetailIntoView() {
  const target = document.querySelector("#ranking") || chartContainer || detailPanel;
  if (!target) return;
  window.requestAnimationFrame(() => {
    const top = target.getBoundingClientRect().top + window.pageYOffset - 12;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  });
}

function scrollPageToEdge(edge) {
  const top = edge === "bottom" ? document.documentElement.scrollHeight : 0;
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
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

function updateChart(history, options = {}) {
  canvas.classList.remove("chart-loading");
  const animate = options.animate !== false && !prefersReducedMotion();
  window.clearTimeout(chartTransitionTimer);
  if (!animate) {
    canvas.classList.remove("chart-transitioning");
    renderChart(history);
    return;
  }

  canvas.classList.add("chart-transitioning");
  chartTransitionTimer = window.setTimeout(() => {
    renderChart(history);
    window.requestAnimationFrame(() => {
      canvas.classList.remove("chart-transitioning");
    });
  }, 110);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let detailChartInstance = null;

function renderDetailChart(history) {
  renderChart(history, { forDetail: true });
}

function renderChart(history, opts = {}) {
  const chartCtx = opts.forDetail ? detailOverlayCtx : ctx;
  const chartCanvas = opts.forDetail ? detailOverlayCanvas : canvas;
  if (!chartCtx || !chartCanvas) return;
  if (opts.forDetail) {
    if (detailChartInstance) { detailChartInstance.destroy(); detailChartInstance = null; }
  } else {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  }

  const styles = getComputedStyle(document.body);
  const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(148, 163, 184, 0.18)";
  const lineColor = styles.getPropertyValue("--chart-line").trim() || "#66e3d3";
  const pointColor = styles.getPropertyValue("--chart-point").trim() || "#f7c76a";
  const textColor = styles.getPropertyValue("--chart-text").trim() || "#dbeafe";
  const mutedColor = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  const barFillStrong = styles.getPropertyValue("--chart-bar-fill-strong").trim() || "rgba(96, 165, 250, 0.22)";
  const gradTop = styles.getPropertyValue("--chart-gradient-top").trim() || "rgba(96, 165, 250, 0.14)";
  const gradBot = styles.getPropertyValue("--chart-gradient-bot").trim() || "rgba(96, 165, 250, 0)";
  const markerColor = styles.getPropertyValue("--chart-marker").trim() || "#ff8fb3";
  const markerLineColor = styles.getPropertyValue("--chart-marker-line").trim() || "rgba(255, 143, 179, 0.42)";
  const markerTextColor = styles.getPropertyValue("--chart-marker-text").trim() || "#ffd4df";

  if (history.length === 0) {
    drawChartPlaceholder(opts);
    return;
  }

  const chartHistory = chartHistoryWithAllSnapshotDates(history);
  const labels = chartHistory.map(row => formatGraphDate(row.source_time_text || row.scraped_at));
  const missingRankData = chartHistory.map(row => !Number.isFinite(numberValue(row.rank)));
  const rankData = chartHistory.map(row => Number.isFinite(numberValue(row.rank)) ? numberValue(row.rank) : OUT_OF_RANK_GRAPH_RANK);
  const tierRankData = chartHistory.map(row => Number.isFinite(numberValue(row.tier_rank)) ? numberValue(row.tier_rank) : null);
  const winDeltaData = chartHistory.map(row => Number.isFinite(numberValue(row.win_delta)) ? numberValue(row.win_delta) : null);
  const tierLabels = chartHistory.map(row => row.tier_label);
  const hasOfficialRankData = chartHistory.some(row => Number.isFinite(numberValue(row.rank)));
  const finiteRanks = rankData.filter(value => Number.isFinite(value));
  const hasTierRankData = tierRankData.some(value => Number.isFinite(value));

  if (finiteRanks.length === 0 && !hasTierRankData) {
    drawChartPlaceholder(opts);
    return;
  }

  const minRank = Math.min(...finiteRanks);
  const maxRank = Math.max(...finiteRanks);
  const graphMaxRank = missingRankData.some(Boolean) ? Math.max(maxRank, OUT_OF_RANK_GRAPH_RANK) : maxRank;
  const spread = Math.max(10, maxRank - minRank);
  const yMin = Math.max(0.2, minRank - Math.max(2, Math.floor(spread * 0.25)));
  const yMax = graphMaxRank + Math.max(2, Math.floor(spread * 0.25));
  const winDeltaMax = Math.max(...winDeltaData.filter(v => Number.isFinite(v)), 1);

  const gradientPlugin = {
    id: 'areaGradient',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea: { top, bottom } } = chart;
      const grad = ctx.createLinearGradient(0, top, 0, bottom);
      grad.addColorStop(0, gradTop);
      grad.addColorStop(1, gradBot);
      chart.data.datasets[0].backgroundColor = grad;
    }
  };

  const customPlugin = {
    id: 'customLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
      ctx.save();
      
      const points = chart.getDatasetMeta(0).data;
      if (!points.length) return;

      const lastPoints = points.filter((point) => !point.skip).slice(-6);
      ctx.font = canvasFont(12, "bold");
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      lastPoints.forEach((point) => {
        const idx = points.indexOf(point);
        const rank = data.datasets[0].data[idx];
        if (!Number.isFinite(rank)) return;
        const label = missingRankData[idx] ? "OUT" : `#${rank}`;
        const hasTierChange = previousKnownTier(tierLabels, idx) !== normalizeTier(tierLabels[idx]);

        const placeBelow = (hasTierChange && point.y >= 80) || point.y < 60;
        const labelY = placeBelow ? Math.min(point.y + 28, height + top - 12) : Math.max(point.y - 20, top + 12);
        ctx.fillText(label, point.x, labelY);
      });

      points.forEach((point, idx) => {
        if (idx === 0 || point.skip || missingRankData[idx] || !Number.isFinite(data.datasets[0].data[idx])) return;
        const currentTier = tierLabels[idx];
        const prevTier = previousKnownTier(tierLabels, idx);
        if (normalizeTier(currentTier) !== normalizeTier(prevTier)) {
          const label = currentTier || "계급 변경";
          const labelBelow = point.y < 78;
          const labelY = labelBelow
            ? Math.min(point.y + 32 + (idx % 2) * 14, height + top - 20)
            : Math.max(top + 20, Math.min(point.y - 22 - (idx % 2) * 14, height + top - 20));

          ctx.save();

          // Ring around the line dot
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.stroke();

          // Dashed connector
          ctx.strokeStyle = mutedColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(point.x, labelBelow ? point.y + 8 : point.y - 8);
          ctx.lineTo(point.x, labelBelow ? labelY - 10 : labelY + 4);
          ctx.stroke();
          ctx.setLineDash([]);

          // Label
          ctx.font = canvasFont(10, "bold");
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.fillText(label, point.x, labelY);

          ctx.restore();
        }
      });

      const latestDeltaPoint = [...chartHistory].reverse().find(row => Number.isFinite(numberValue(row.win_delta)));
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
      ctx.fillText(hasOfficialRankData ? `best #${minRank}` : "best OUT", left, top - 14);
      
      ctx.textAlign = "center";
      ctx.fillText(hasOfficialRankData ? `worst #${maxRank}` : "worst OUT", (left + right) / 2, top - 14);

      const bars = chart.getDatasetMeta(2).data;
      ctx.font = canvasFont(10, "bold");
      ctx.fillStyle = styles.getPropertyValue("--chart-bar-text").trim() || "#f7c76a";
      ctx.textAlign = "center";
      bars.forEach((bar, idx) => {
        const val = winDeltaData[idx];
        if (bar && !bar.skip && Number.isFinite(val) && val > 0) {
          ctx.fillText(`+${val}`, bar.x, bar.y - 4);
        }
      });

      ctx.restore();
    }
  };

  const newInstance = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rank',
          data: rankData,
          borderColor: lineColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBorderWidth: 0,
          pointBackgroundColor: (context) => missingRankData[context.dataIndex] ? mutedColor : lineColor,
          tension: 0,
          fill: 'start',
          yAxisID: 'y',
          clip: false
        },
        {
          label: 'Tier Rank',
          data: tierRankData,
          borderColor: markerColor,
          backgroundColor: 'transparent',
          borderWidth: 1.8,
          borderDash: [5, 4],
          pointRadius: 2.5,
          pointHoverRadius: 4,
          pointBorderWidth: 0,
          pointBackgroundColor: markerColor,
          tension: 0,
          fill: false,
          yAxisID: 'yTier',
          spanGaps: true,
          clip: false
        },
        {
          label: 'Daily Wins',
          type: 'bar',
          data: winDeltaData,
          backgroundColor: barFillStrong,
          borderColor: 'transparent',
          borderRadius: 2,
          yAxisID: 'yWin',
          barPercentage: 0.42,
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
              const row = chartHistory[idx];
              if (context.datasetIndex === 0) {
                if (!Number.isFinite(numberValue(row.rank))) return "순위: 100위권 밖 / 데이터 없음";
                return `순위: #${row.rank} (${row.tier_label})`;
              }
              if (context.datasetIndex === 1) {
                if (!Number.isFinite(numberValue(row.tier_rank))) return "등급별 순위: 데이터 없음";
                return `등급별 순위: ${row.tier_label || "-"} #${row.tier_rank}`;
              } else {
                if (!Number.isFinite(numberValue(row.win_delta))) return "일일 승리: 데이터 없음";
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
            font: { size: 11, family: MONO_FONT_STACK },
            maxRotation: 0,
            autoSkip: labels.length > 5,
            maxTicksLimit: 5
          }
        },
        y: {
          reverse: true,
          min: yMin,
          max: yMax,
          grid: { color: gridColor, borderDash: [2, 4] },
          ticks: { display: false },
          border: { display: false }
        },
        yTier: {
          position: 'right',
          reverse: true,
          min: 1,
          max: OUT_OF_TIER_GRAPH_RANK,
          grid: { display: false },
          ticks: {
            color: markerTextColor,
            font: { size: 10, family: MONO_FONT_STACK },
            callback: (value) => Number(value) <= 10 ? `T${value}` : "OUT"
          },
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
    plugins: [gradientPlugin, customPlugin]
  });
  if (opts.forDetail) { detailChartInstance = newInstance; } else { chartInstance = newInstance; }
}

function chartHistoryWithAllSnapshotDates(history) {
  if (!history.length || !snapshots.length) return history;
  const latestSeason = String(history[history.length - 1].season ?? "");
  const historyBySnapshot = new Map(history.map((row) => [String(row.snapshot_id), row]));
  const seasonSnapshots = snapshots
    .filter((snapshot) => String(snapshot.season ?? "") === latestSeason)
    .slice()
    .reverse();
  if (!seasonSnapshots.length) return history;
  return seasonSnapshots.map((snapshot) => {
    const existing = historyBySnapshot.get(String(snapshot.id));
    if (existing) return existing;
    return {
      snapshot_id: snapshot.id,
      season: snapshot.season,
      source_time_text: snapshot.source_time_text,
      scraped_at: snapshot.scraped_at,
      rank: null,
      tier_label: "",
      win_delta: null,
      is_missing_snapshot_entry: true,
    };
  });
}

function previousKnownTier(tierLabels, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const tier = normalizeTier(tierLabels[i]);
    if (tier) return tier;
  }
  return "";
}

function drawChartPlaceholder(opts = {}) {
  const chartCtx = opts.forDetail ? detailOverlayCtx : ctx;
  if (!chartCtx) return;
  const styles = getComputedStyle(document.body);
  const previewColor = styles.getPropertyValue("--chart-preview").trim() || "rgba(102, 227, 211, 0.48)";
  const pointColor = styles.getPropertyValue("--chart-point").trim() || "rgba(247, 199, 106, 0.74)";
  const mutedColor = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";

  const instance = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: ['', '', '', ''],
      datasets: [{
        data: [65, 46, 54, 28],
        borderColor: previewColor,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBorderWidth: 0,
        pointBackgroundColor: previewColor,
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
    },
    plugins: [{
      id: 'placeholderText',
      afterDraw(chart) {
        const { ctx, chartArea: { width, height, top, left } } = chart;
        ctx.save();
        ctx.fillStyle = mutedColor;
        ctx.font = canvasFont(13);
        ctx.textAlign = "left";
        if (!opts.forDetail) ctx.fillText("캐릭터를 선택하면 이 영역에 순위 추이가 표시됩니다.", 24, height + top - 24);
        ctx.restore();
      }
    }]
  });
  if (opts.forDetail) { detailChartInstance = instance; } else { chartInstance = instance; }
}

function normalizeTierLabel(tier) {
  const t = normalizeTier(tier);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function honorMoveChip(entry) {
  const dir = entry.movement_direction;
  if (entry.is_dropped || dir === "out") return '<span class="move" data-dir="out">OUT</span>';
  if (dir === "new") return '<span class="move" data-dir="new">NEW</span>';
  if (dir === "up") return `<span class="move" data-dir="up"><span class="arrow">▲</span>${escapeHtml(String(entry.movement_value ?? ""))}</span>`;
  if (dir === "down") return `<span class="move" data-dir="down"><span class="arrow">▼</span>${escapeHtml(String(entry.movement_value ?? ""))}</span>`;
  return '<span class="move" data-dir="flat">—</span>';
}

function renderHonorGrid(options = {}) {
  const animate = options.animate !== false;
  if (!honorGrid) return;

  if (honorTabs) {
    honorTabs.querySelectorAll('.honor-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.mode === honorMode);
    });
  }

  if (honorGrid.classList.contains('is-exiting')) return;

  const existingTiles = [...honorGrid.querySelectorAll('.tile')];
  if (animate && existingTiles.length > 0 && !prefersReducedMotion()) {
    honorGrid.classList.remove('is-revealing');
    honorGrid.classList.add('is-exiting');
    clearTimeout(honorExitTimer);
    honorExitTimer = setTimeout(() => {
      honorGrid.classList.remove('is-exiting');
      renderHonorGridContent(animate);
    }, 270);
    return;
  }
  renderHonorGridContent(animate);
}

function renderHonorGridContent(animate) {
  if (!honorGrid) return;
  const all = latestEntries.filter((e) => !e.is_dropped);
  let top10;
  if (honorMode === 'wins') {
    top10 = all
      .filter(e => numberValue(e.win_delta) > 0)
      .sort((a, b) => numberValue(b.win_delta) - numberValue(a.win_delta))
      .slice(0, 10);
  } else if (honorMode === 'rise') {
    top10 = all
      .filter(e => e.movement_direction === 'up' && numberValue(e.movement_value) > 0)
      .sort((a, b) => numberValue(b.movement_value) - numberValue(a.movement_value))
      .slice(0, 10);
  } else {
    top10 = all.slice(0, 10);
  }

  if (top10.length === 0) { honorGrid.innerHTML = ""; return; }

  const hero = top10[0];

  let heroRankLine, heroStats, heroWatermark;
  if (honorMode === 'wins') {
    heroWatermark = String(hero.win_delta ?? '-');
    heroRankLine = `<span class="hash">+</span>${escapeHtml(heroWatermark)} · <span style="font-family:var(--font-display);font-weight:700;letter-spacing:.14em">WINS</span>`;
    heroStats = `
      <div class="stat"><div class="l">오늘 승리</div><div class="v" style="color:var(--up)">+${escapeHtml(heroWatermark)}</div></div>
      <div class="stat"><div class="l">순위</div><div class="v">#${escapeHtml(String(hero.rank))}</div></div>
      <div class="stat"><div class="l">Points</div><div class="v">${escapeHtml(pointsDisplay(hero))}</div></div>
    `;
  } else if (honorMode === 'rise') {
    heroWatermark = String(hero.movement_value ?? '-');
    heroRankLine = `<span class="hash">↑</span>${escapeHtml(heroWatermark)} · <span style="font-family:var(--font-display);font-weight:700;letter-spacing:.14em">RISE</span>`;
    heroStats = `
      <div class="stat"><div class="l">순위 상승</div><div class="v" style="color:var(--up)">↑${escapeHtml(heroWatermark)}</div></div>
      <div class="stat"><div class="l">현재 순위</div><div class="v">#${escapeHtml(String(hero.rank))}</div></div>
      <div class="stat"><div class="l">Points</div><div class="v">${escapeHtml(pointsDisplay(hero))}</div></div>
    `;
  } else {
    heroWatermark = '1';
    heroRankLine = `<span class="hash">#</span>01 · <span style="font-family:var(--font-display);font-weight:700;letter-spacing:.14em">CHAMPION</span>`;
    heroStats = `
      <div class="stat"><div class="l">Points</div><div class="v">${escapeHtml(pointsDisplay(hero))}</div></div>
      <div class="stat"><div class="l">Wins</div><div class="v">${escapeHtml(String(hero.wins ?? "-"))}</div></div>
      <div class="stat"><div class="l">+Δ Today</div><div class="v" style="color:var(--up)">${hero.points_delta != null ? `+${hero.points_delta}` : "-"}</div></div>
    `;
  }

  const rankOrInfo = honorMode !== 'rank'
    ? hero.rank != null
      ? ` · <span style="opacity:0.55">Rank #${escapeHtml(String(hero.rank))}</span>`
      : ` · <span style="opacity:0.40">100위권 밖</span>`
    : '';
  let html = `
    <div class="tile is-hero" data-rank-display="${escapeHtml(heroWatermark)}" data-key="${escapeHtml(hero.character_key)}">
      <div class="tile-hero-tier-icon">${tierIconHtml(hero)}</div>
      <div class="tile-rank">${heroRankLine}</div>
      <div class="tile-name"><span class="tile-character-name">${escapeHtml(hero.character_name)}</span><span class="tile-meta-server">@${escapeHtml(hero.server_name)}</span></div>
      <div class="tile-server"><span class="tier ${rankAuraClass(hero.rank)}" data-tier="${escapeHtml(normalizeTierLabel(hero.tier_label))}">${tierIconHtml(hero)}<span>${escapeHtml(hero.tier_label || "-")}</span></span>${rankOrInfo}</div>
      <div class="tile-stats">${heroStats}</div>
      <div class="tile-foot">
        <span class="tile-points">${escapeHtml(pointsDisplay(hero))}<span class="pts-unit"> pts</span></span>
        ${honorMoveChip(hero)}
      </div>
    </div>
  `;

  top10.slice(1).forEach((e) => {
    let tileRankLine, tileWatermark, tileServer;
    const tierBadge = e.tier_label
      ? `<span class="tile-meta-tier tier ${rankAuraClass(e.rank)}" data-tier="${escapeHtml(normalizeTierLabel(e.tier_label))}">${tierIconHtml(e)}<span>${escapeHtml(e.tier_label)}</span></span>`
      : '';
    const serverMeta = `<span class="tile-meta-server">@${escapeHtml(e.server_name)}</span>`;
    const rankMeta = e.rank != null
      ? `<span class="tile-meta-rank">#${escapeHtml(String(e.rank))}</span>`
      : `<span class="tile-meta-rank" style="opacity:0.45">100위권 밖</span>`;
    if (honorMode === 'wins') {
      tileWatermark = String(e.win_delta ?? '-');
      tileRankLine = `<span class="hash">+</span>${escapeHtml(tileWatermark)}<span style="color:var(--fg-3);font-size:9px;margin-left:4px;letter-spacing:.06em">WINS</span>`;
      tileServer = `${rankMeta}${tierBadge}`;
    } else if (honorMode === 'rise') {
      tileWatermark = String(e.movement_value ?? '-');
      tileRankLine = `<span class="hash">↑</span>${escapeHtml(tileWatermark)}`;
      tileServer = `${rankMeta}${tierBadge}`;
    } else {
      tileWatermark = e.rank != null ? String(e.rank) : '-';
      tileRankLine = e.rank != null
        ? `<span class="hash">#</span>${escapeHtml(String(e.rank).padStart(2, "0"))}`
        : `<span style="opacity:0.45;font-size:11px;letter-spacing:.04em">100위권 밖</span>`;
      tileServer = `${rankMeta}${tierBadge}`;
    }
    html += `
      <div class="tile is-row" data-rank-display="${escapeHtml(tileWatermark)}" data-key="${escapeHtml(e.character_key)}">
        <div class="tile-rank">${tileRankLine}</div>
        <div class="tile-name"><span class="tile-character-name">${escapeHtml(e.character_name)}</span>${serverMeta}</div>
        <div class="tile-server">${tileServer}</div>
        <div class="tile-foot">
          <span class="tile-points">${escapeHtml(pointsDisplay(e))}<span class="pts-unit"> pts</span></span>
          ${honorMoveChip(e)}
        </div>
      </div>
    `;
  });

  honorGrid.innerHTML = html;
  honorGrid.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => selectCharacter(tile.dataset.key, { scrollDetail: true }));
  });
  if (animate) {
    revealHonorTiles();
  } else {
    honorGrid.classList.remove("is-revealing");
  }
  updateHonorGridSelection(selectedKey);
}

function revealHonorTiles() {
  honorGrid.classList.remove("is-revealing");
  window.requestAnimationFrame(() => {
    honorGrid.classList.add("is-revealing");
  });
}

function honorRotationBlocked() {
  return honorRotatePaused || honorGridHovering;
}

function updateHonorRotateUi() {
  const remaining = honorRotationBlocked()
    ? honorRotateRemainingMs || HONOR_ROTATE_MS
    : Math.max(0, honorRotateDueAt - Date.now());
  if (honorMeta) {
    const progress = 1 - Math.min(1, Math.max(0, remaining / HONOR_ROTATE_MS));
    honorMeta.style.setProperty("--honor-progress", String(progress));
  }
  if (honorRotateToggle) {
    honorRotateToggle.dataset.state = honorRotatePaused ? "play" : "pause";
    honorRotateToggle.setAttribute("aria-pressed", String(honorRotatePaused));
    honorRotateToggle.setAttribute("aria-label", honorRotatePaused ? "자동 전환 재생" : "자동 전환 일시정지");
    honorRotateToggle.title = honorRotatePaused ? "자동 전환 재생" : "자동 전환 일시정지";
  }
}

function startHonorCountdown() {
  cancelAnimationFrame(honorCountdownTimer);
  const tick = () => {
    updateHonorRotateUi();
    honorCountdownTimer = requestAnimationFrame(tick);
  };
  honorCountdownTimer = requestAnimationFrame(tick);
}

function pauseHonorRotate() {
  if (honorRotateDueAt > 0) {
    honorRotateRemainingMs = Math.max(1, honorRotateDueAt - Date.now());
  }
  clearTimeout(honorRotateTimer);
  honorRotateTimer = null;
  updateHonorRotateUi();
}

function resumeHonorRotate() {
  if (honorRotationBlocked()) {
    updateHonorRotateUi();
    return;
  }
  scheduleHonorRotate(honorRotateRemainingMs || HONOR_ROTATE_MS);
}

function advanceHonorMode() {
  honorMode = HONOR_MODES[(HONOR_MODES.indexOf(honorMode) + 1) % HONOR_MODES.length];
  renderHonorGrid();
  updateHonorGridSelection(selectedKey);
  scheduleHonorRotate(HONOR_ROTATE_MS);
}

function scheduleHonorRotate(delay = HONOR_ROTATE_MS) {
  clearTimeout(honorRotateTimer);
  honorRotateRemainingMs = delay;
  if (honorRotationBlocked()) {
    updateHonorRotateUi();
    return;
  }
  honorRotateDueAt = Date.now() + delay;
  honorRotateTimer = setTimeout(advanceHonorMode, delay);
  startHonorCountdown();
}

function updateHonorGridSelection(key) {
  if (!honorGrid) return;
  honorGrid.querySelectorAll(".tile").forEach((tile) => {
    tile.dataset.selected = String(tile.dataset.key === key);
  });
}

function updateRankingSelection(key) {
  if (!rankingRows) return;
  rankingRows.querySelectorAll("tr[data-key]").forEach((row) => {
    row.dataset.selected = String(row.dataset.key === key);
  });
}

function updateKpis(snapshot, entries) {
  if (honorMeta && snapshot) {
    updateHonorRotateUi();
  }
  if (kpiSnapshots && snapshots.length > 0) {
    kpiSnapshots.childNodes[0].textContent = snapshots.length;
    const snapshotFootEl = document.querySelector("#kpiSnapshotFoot");
    if (snapshotFootEl) {
      const byId = [...snapshots].sort((a, b) => a.id - b.id);
      const oldest = formatSnapshotDate(byId[0].source_time_text || byId[0].scraped_at || "");
      const newest = formatSnapshotDate(byId[byId.length - 1].source_time_text || byId[byId.length - 1].scraped_at || "");
      snapshotFootEl.textContent = `${oldest} → ${newest}`;
    }
  }
  if (entries && entries.length > 0) {
    const officialEntries = officialCollectedEntries(entries);
    if (kpiNewEntries) {
      const newCount = officialEntries.filter((entry) => entry.movement_direction === "new").length;
      kpiNewEntries.childNodes[0].textContent = newCount.toLocaleString("ko-KR");
    }
    if (kpiWinGain) {
      const deltas = officialEntries
        .map((entry) => numberValue(entry.win_delta))
        .filter((value) => Number.isFinite(value) && value > 0);
      const winGain = deltas.reduce((total, value) => total + value, 0);
      kpiWinGain.childNodes[0].textContent = deltas.length > 0 ? `+${winGain.toLocaleString("ko-KR")}` : "-";
    }
  }
}

function scheduleTierHeatmapRender(snapshot, entries, options = {}) {
  if (!tierHeatmap) return;
  const requestToken = ++heatmapRequestToken;
  if (!options.preserveExisting) {
    renderTierHeatmap(snapshot, entries, null);
  } else if (tierHeatmapMeta) {
    tierHeatmapMeta.textContent = "업데이트 중";
  }
  Promise.all([
    api(`/api/heatmap?season=${encodeURIComponent(snapshot.season || "")}`).catch(() => ({ snapshots: [], entries_by_snapshot: {} })),
    api("/api/season-periods").catch(() => ({ season_periods: [] })),
  ])
    .then(([heatmapData, periodsPayload]) => {
      if (requestToken !== heatmapRequestToken) return;
      renderTierHeatmap(snapshot, entries, {
        ...heatmapData,
        season_periods: periodsPayload.season_periods || heatmapData.season_periods || [],
      });
    })
    .catch(() => {
      if (requestToken !== heatmapRequestToken) return;
      renderTierHeatmap(snapshot, entries, { snapshots: [], entries_by_snapshot: {} });
    });
}

function renderTierHeatmap(snapshot, currentEntries, seasonData) {
  if (!tierHeatmap || !tierHeatmapCtx) return;
  if (!snapshot) {
    destroyTierHeatmapChart();
    if (tierHeatmapMeta) tierHeatmapMeta.textContent = "-";
    return;
  }
  if (!seasonData) {
    destroyTierHeatmapChart();
    if (tierHeatmapMeta) tierHeatmapMeta.textContent = "계산 중";
    return;
  }

  const heatmapData = buildTierHeatmapData(snapshot, currentEntries, seasonData);
  heatmapWindowStart = initialHeatmapWindowStart(heatmapData);
  if (heatmapData.snapshots.length === 0) {
    destroyTierHeatmapChart();
    if (tierHeatmapMeta) tierHeatmapMeta.textContent = "-";
    return;
  }

  renderTierHeatmapChart(heatmapData);
}

function renderTierHeatmapChart(heatmapData) {
  const nextSelectedDate = heatmapData.snapshots.find((item) => item.isSelected)?.shortDate || "";
  const previousSelectedDate = tierHeatmapSelectedDate === nextSelectedDate ? "" : tierHeatmapSelectedDate;
  if (nextSelectedDate && nextSelectedDate !== tierHeatmapSelectedDate) {
    tierHeatmapSelectedDate = nextSelectedDate;
  }
  currentTierHeatmapData = heatmapData;
  const visibleData = visibleTierHeatmapData(heatmapData);
  const styles = getComputedStyle(document.body);
  const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(148, 163, 184, 0.18)";
  const textColor = styles.getPropertyValue("--chart-text").trim() || "#dbeafe";
  const mutedColor = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  const accentColor = styles.getPropertyValue("--accent").trim() || "#66e3d3";
  const labels = visibleData.snapshots.map((item) => item.shortDate);
  renderTierHeatmapLabels(styles, textColor);
  const points = visibleData.snapshots.flatMap((item) => HEATMAP_ROWS.map((row, rowIndex) => {
    const value = item.values[row.key] || 0;
    return {
      x: item.shortDate,
      y: HEATMAP_ROWS.length - 1 - rowIndex,
      rowKey: row.key,
      rowLabel: row.label,
      source: row.source,
      fullDate: item.fullDate,
      snapshotId: item.snapshotId,
      value,
      isSelected: item.isSelected,
      isSeasonStart: Boolean(item.isSeasonStart),
      intensity: Number(heatmapIntensity(value, visibleData.maxGain)),
    };
  }));

  const scrollArea = tierHeatmap.closest('.tier-heatmap-scroll');
  const availableCanvasWidth = scrollArea ? Math.max(300, scrollArea.clientWidth - 113) : 720;
  const MIN_CELL_PX = 14;
  const naturalCellPx = availableCanvasWidth / Math.max(1, labels.length);
  const canvasWidth = naturalCellPx >= MIN_CELL_PX ? availableCanvasWidth : labels.length * MIN_CELL_PX;
  const heatmapBody = tierHeatmap.closest('.tier-heatmap-body');
  if (heatmapBody) heatmapBody.style.width = `${112 + canvasWidth}px`;
  tierHeatmap.style.removeProperty('minWidth');
  updateTierHeatmapWindowUi(heatmapData, visibleData);
  destroyTierHeatmapChart({ preserveData: true });
  tierHeatmapChartInstance = new Chart(tierHeatmapCtx, {
    type: "scatter",
    data: {
      labels,
      datasets: [{
        data: points,
        pointRadius: 0,
        pointHitRadius: 12,
        showLine: false,
      }],
    },
    options: {
      animation: prefersReducedMotion() ? false : { duration: 220 },
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: heatmapExternalTooltip,
        },
      },
      scales: {
        x: {
          type: "category",
          labels,
          offset: true,
          grid: { display: false, color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: {
            color: mutedColor,
            font: { family: MONO_FONT_STACK, size: 10, weight: "600" },
            maxRotation: 0,
            autoSkip: true,
          },
        },
        y: {
          display: false,
          type: "linear",
          min: -0.5,
          max: HEATMAP_ROWS.length - 0.5,
          grid: { display: false, color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: {
            display: false,
            font: { family: UI_FONT_STACK, size: 12, weight: "700" },
            stepSize: 1,
          },
        },
      },
    },
    plugins: [tierHeatmapPlugin(styles, accentColor, {
      previousDate: previousSelectedDate,
      selectedDate: nextSelectedDate,
      startedAt: performance.now(),
    })],
  });
}

function moveTierHeatmapSelectionToSnapshot(snapshotId) {
  if (!currentTierHeatmapData) return;
  const target = currentTierHeatmapData.snapshots.find((item) => String(item.snapshotId) === String(snapshotId));
  if (!target || target.shortDate === tierHeatmapSelectedDate) return;
  const previousDate = tierHeatmapSelectedDate;
  currentTierHeatmapData = {
    ...currentTierHeatmapData,
    snapshots: currentTierHeatmapData.snapshots.map((item) => ({
      ...item,
      isSelected: item.fullDate === target.fullDate,
    })),
  };
  tierHeatmapSelectedDate = target.shortDate;
  if (!tierHeatmapChartInstance) return;
  const points = tierHeatmapChartInstance.data.datasets[0]?.data || [];
  points.forEach((point) => { point.isSelected = point.x === target.shortDate; });
  tierHeatmapChartInstance.$heatmapSelection = { previousDate, selectedDate: target.shortDate, startedAt: performance.now() };
  tierHeatmapChartInstance.update("none");
}

function renderTierHeatmapLabels(styles, fallbackColor) {
  if (!tierHeatmapLabels) return;
  tierHeatmapLabels.innerHTML = HEATMAP_ROWS.map((row) => {
    const color = heatmapRowLabelColor(row, styles, fallbackColor);
    const prefix = row.group ? `<span>${escapeHtml(row.group)}</span>` : "";
    const extraClass = row.key === "in100" ? " tier-heatmap-label--overall" : "";
    return `<div class="tier-heatmap-label${extraClass}" style="color:${escapeHtml(color)}">${prefix}<strong>${escapeHtml(row.label)}</strong></div>`;
  }).join("");
}

function initialHeatmapWindowStart(heatmapData) {
  const total = heatmapData.snapshots.length;
  if (total <= HEATMAP_WINDOW_SIZE) return 0;
  const selectedIndex = heatmapData.snapshots.findIndex((item) => item.isSelected);
  const endIndex = selectedIndex >= 0 ? selectedIndex : total - 1;
  return Math.max(0, Math.min(endIndex - HEATMAP_WINDOW_SIZE + 1, total - HEATMAP_WINDOW_SIZE));
}

function visibleTierHeatmapData(heatmapData) {
  const total = heatmapData.snapshots.length;
  if (heatmapData.hasPeriod) {
    const maxGain = heatmapData.snapshots.reduce((maxValue, item) => Math.max(maxValue, ...Object.values(item.values)), 0);
    return { snapshots: heatmapData.snapshots, maxGain, start: 0, total };
  }
  const maxStart = Math.max(0, total - HEATMAP_WINDOW_SIZE);
  const start = Math.max(0, Math.min(heatmapWindowStart ?? initialHeatmapWindowStart(heatmapData), maxStart));
  heatmapWindowStart = start;
  const visibleSnapshots = heatmapData.snapshots.slice(start, start + HEATMAP_WINDOW_SIZE);
  const maxGain = visibleSnapshots.reduce((maxValue, item) => Math.max(maxValue, ...Object.values(item.values)), 0);
  return { snapshots: visibleSnapshots, maxGain, start, total };
}

function updateTierHeatmapWindowUi(heatmapData, visibleData) {
  const total = heatmapData.snapshots.length;
  const from = visibleData.start + 1;
  const to = visibleData.start + visibleData.snapshots.length;
  const totalGain = visibleData.snapshots.reduce((totalValue, item) => (
    totalValue + Object.values(item.values).reduce((sum, value) => sum + value, 0)
  ), 0);
  if (tierHeatmapMeta) {
    tierHeatmapMeta.textContent = `${from}-${to}/${total} · +${totalGain.toLocaleString("ko-KR")}승`;
  }
  if (tierHeatmapPrev) tierHeatmapPrev.disabled = visibleData.start <= 0;
  if (tierHeatmapNext) tierHeatmapNext.disabled = visibleData.start + visibleData.snapshots.length >= total;
}

function moveTierHeatmapWindow(delta) {
  if (!currentTierHeatmapData || currentTierHeatmapData.hasPeriod) return;
  const maxStart = Math.max(0, currentTierHeatmapData.snapshots.length - HEATMAP_WINDOW_SIZE);
  heatmapWindowStart = Math.max(0, Math.min((heatmapWindowStart ?? maxStart) + delta, maxStart));
  renderTierHeatmapChart(currentTierHeatmapData);
}

function destroyTierHeatmapChart(options = {}) {
  const tt = document.getElementById('heatmap-tooltip');
  if (tt) tt.hidden = true;
  if (!options.preserveData) currentTierHeatmapData = null;
  if (tierHeatmapChartInstance) {
    tierHeatmapChartInstance.destroy();
    tierHeatmapChartInstance = null;
  }
}

function tierHeatmapPlugin(styles, accentColor, selection = {}) {
  const heatColor = styles.getPropertyValue("--chart-line").trim() || accentColor;
  return {
    id: "tierWinGainHeatmap",
    beforeDatasetsDraw(chart) {
      const dataset = chart.data.datasets[0];
      const points = dataset?.data || [];
      const { ctx: chartCtx, chartArea, scales } = chart;
      if (!points.length || !chartArea || !scales.x || !scales.y) return;
      const cellWidth = chartArea.width / Math.max(1, chart.data.labels.length);
      const cellHeight = chartArea.height / Math.max(1, HEATMAP_ROWS.length);
      const selectedPoint = points.find((point) => point.isSelected);
      if (selectedPoint) {
        const activeSelection = chart.$heatmapSelection || selection;
        const selectedX = scales.x.getPixelForValue(selectedPoint.x);
        const previousX = activeSelection.previousDate && chart.data.labels.includes(activeSelection.previousDate)
          ? scales.x.getPixelForValue(activeSelection.previousDate)
          : selectedX;
        const progress = selectionProgress(chart, activeSelection.startedAt);
        const highlightX = previousX + (selectedX - previousX) * progress;
        chartCtx.save();
        chartCtx.fillStyle = colorWithAlpha(accentColor, 0.06);
        chartCtx.strokeStyle = colorWithAlpha(accentColor, 0.72);
        chartCtx.lineWidth = 1.2;
        roundedRect(chartCtx, highlightX - cellWidth / 2 + 0.5, chartArea.top + 0.5, cellWidth - 1, chartArea.height - 1, 5);
        chartCtx.fill();
        chartCtx.stroke();
        chartCtx.restore();
      }
      points.forEach((point) => {
        const x = scales.x.getPixelForValue(point.x);
        const y = scales.y.getPixelForValue(point.y);
        const intensity = point.intensity || 0;
        const alpha = intensity > 0 ? 0.10 + intensity * 0.68 : 0.04;
        chartCtx.save();
        chartCtx.fillStyle = colorWithAlpha(heatColor, alpha);
        chartCtx.fillRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);
        if (point.value > 0 && cellWidth >= 32 && cellHeight >= 20) {
          chartCtx.fillStyle = colorWithAlpha(styles.getPropertyValue("--fg-1").trim() || "#fff", Math.min(1, 0.42 + intensity));
          chartCtx.font = `700 10px ${MONO_FONT_STACK}`;
          chartCtx.textAlign = "center";
          chartCtx.textBaseline = "middle";
          chartCtx.fillText(point.value.toLocaleString("ko-KR"), x, y);
        }
        chartCtx.restore();
      });

      // Separator between tier rows and In-100
      const separatorY = Math.round(scales.y.getPixelForValue(0.5));
      chartCtx.save();
      chartCtx.strokeStyle = colorWithAlpha(accentColor, 0.28);
      chartCtx.lineWidth = 1;
      chartCtx.setLineDash([3, 4]);
      chartCtx.beginPath();
      chartCtx.moveTo(chartArea.left, separatorY);
      chartCtx.lineTo(chartArea.right, separatorY);
      chartCtx.stroke();
      chartCtx.restore();

      // Season start marker
      const seasonStartPoint = points.find((p) => p.isSeasonStart);
      if (seasonStartPoint) {
        const sx = Math.round(scales.x.getPixelForValue(seasonStartPoint.x) - cellWidth / 2);
        chartCtx.save();
        chartCtx.strokeStyle = colorWithAlpha(accentColor, 0.55);
        chartCtx.lineWidth = 1.5;
        chartCtx.setLineDash([2, 3]);
        chartCtx.beginPath();
        chartCtx.moveTo(sx, chartArea.top);
        chartCtx.lineTo(sx, chartArea.bottom);
        chartCtx.stroke();
        chartCtx.setLineDash([]);
        chartCtx.font = `600 9px ${MONO_FONT_STACK}`;
        chartCtx.fillStyle = colorWithAlpha(accentColor, 0.75);
        chartCtx.textAlign = 'left';
        chartCtx.textBaseline = 'top';
        chartCtx.fillText('시즌 시작', sx + 3, chartArea.top + 3);
        chartCtx.restore();
      }
    },
    afterEvent(chart, args) {
      const event = args.event;
      const { chartArea } = chart;
      const points = chart.data.datasets[0]?.data || [];
      if (!chartArea || !points.length) return;
      const clearActive = () => {
        if (chart.$heatmapActiveIndex == null) return;
        chart.$heatmapActiveIndex = null;
        chart.setActiveElements([]);
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.update("none");
      };
      if (event.type === "mouseout") {
        clearActive();
        return;
      }
      const x = event.x;
      const y = event.y;
      if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
        clearActive();
        return;
      }
      const columnCount = Math.max(1, chart.data.labels.length);
      const cellWidth = chartArea.width / columnCount;
      const cellHeight = chartArea.height / Math.max(1, HEATMAP_ROWS.length);
      const column = Math.min(columnCount - 1, Math.max(0, Math.floor((x - chartArea.left) / cellWidth)));
      const row = Math.min(HEATMAP_ROWS.length - 1, Math.max(0, Math.floor((y - chartArea.top) / cellHeight)));
      const dataIndex = column * HEATMAP_ROWS.length + row;
      const point = points[dataIndex];
      if (event.type === "click") {
        if (point?.snapshotId && !document.body.classList.contains("is-snapshot-loading")) {
          moveTierHeatmapSelectionToSnapshot(point.snapshotId);
          loadSnapshot(point.snapshotId).catch((error) => {
            snapshotMeta.textContent = error.message;
          });
        }
        return;
      }
      if (chart.$heatmapActiveIndex === dataIndex) return;
      chart.$heatmapActiveIndex = dataIndex;
      const tooltipX = chart.scales.x.getPixelForValue(point.x);
      const tooltipY = chart.scales.y.getPixelForValue(point.y);
      chart.setActiveElements([{ datasetIndex: 0, index: dataIndex }]);
      chart.tooltip?.setActiveElements([{ datasetIndex: 0, index: dataIndex }], { x: tooltipX, y: tooltipY });
      chart.update("none");
    },
  };
}

function heatmapExternalTooltip({ chart, tooltip }) {
  let el = document.getElementById('heatmap-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'heatmap-tooltip';
    el.className = 'heatmap-tooltip';
    document.body.appendChild(el);
  }
  if (!tooltip.dataPoints?.length || tooltip.opacity === 0) {
    el.hidden = true;
    return;
  }
  const raw = tooltip.dataPoints[0]?.raw;
  if (!raw) { el.hidden = true; return; }

  const value = raw.value || 0;
  const isOverall = raw.source === 'overall';
  const num = isOverall ? '' : tierNumber(raw.rowKey);
  const iconHtml = num ? `<span class="tier-icon tier-icon-${num}" aria-hidden="true"></span>` : '';
  const labelText = isOverall ? 'In-100' : `${raw.rowLabel} Top10`;
  const color = isOverall ? 'var(--accent)' : `var(--tier-${raw.rowKey})`;

  el.innerHTML =
    `<div class="heatmap-tooltip-date">${escapeHtml(raw.fullDate)}</div>` +
    `<div class="heatmap-tooltip-body" style="color:${color}">${iconHtml}<span>${escapeHtml(labelText)} +${value.toLocaleString('ko-KR')}승 증가</span></div>`;

  el.hidden = false;
  const rect = chart.canvas.getBoundingClientRect();
  const tx = rect.left + tooltip.caretX;
  const ty = rect.top + tooltip.caretY;
  const elW = el.offsetWidth;
  const elH = el.offsetHeight;
  el.style.top = `${ty > elH + 12 ? ty - elH - 8 : ty + 8}px`;
  el.style.left = `${Math.max(8, Math.min(tx - elW / 2, window.innerWidth - elW - 8))}px`;
}

function heatmapRowLabelColor(row, styles, fallback) {
  if (!row) return fallback;
  if (row.key === "in100") return styles.getPropertyValue("--accent").trim() || fallback;
  return styles.getPropertyValue(`--tier-${row.key}`).trim() || fallback;
}

function selectionProgress(chart, startedAt) {
  if (prefersReducedMotion() || !startedAt) return 1;
  const raw = Math.min(1, Math.max(0, (performance.now() - startedAt) / 260));
  if (raw < 1) {
    window.requestAnimationFrame(() => { if (chart === tierHeatmapChartInstance) chart.draw(); });
  }
  return 1 - Math.pow(1 - raw, 3);
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function colorWithAlpha(color, alpha) {
  const text = String(color || "").trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const value = hex[1].length === 3
      ? hex[1].split("").map((part) => part + part).join("")
      : hex[1];
    const numeric = Number.parseInt(value, 16);
    const r = (numeric >> 16) & 255;
    const g = (numeric >> 8) & 255;
    const b = numeric & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgb = text.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((part) => Number.parseFloat(part));
    if ([r, g, b].every(Number.isFinite)) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return text;
}

function buildTierHeatmapData(snapshot, currentEntries, seasonData) {
  const entriesBySnapshot = seasonData.entries_by_snapshot || {};
  const currentSnapshotId = String(snapshot.id);
  const snapshotSource = (seasonData.snapshots && seasonData.snapshots.length > 0) ? seasonData.snapshots : snapshots;
  const period = seasonPeriodForSnapshot(snapshot, seasonData);
  const seasonSnapshots = snapshotSource
    .filter((item) => String(item.season ?? "") === String(snapshot.season ?? ""))
    .sort((a, b) => entryTimeMs(a) - entryTimeMs(b) || numberValue(a.id) - numberValue(b.id));
  const currentInSource = seasonSnapshots.some((item) => String(item.id) === currentSnapshotId);
  const sourceSnapshots = seasonSnapshots.length > 0
    ? (currentInSource ? seasonSnapshots : [...seasonSnapshots, snapshot].sort((a, b) => entryTimeMs(a) - entryTimeMs(b) || numberValue(a.id) - numberValue(b.id)))
    : [snapshot];
  const byDate = new Map();
  sourceSnapshots.forEach((item) => {
    const snapshotId = String(item.id);
    const entries = snapshotId === currentSnapshotId
      ? currentEntries
      : entriesBySnapshot[snapshotId] || [];
    const values = (entries && !Array.isArray(entries)) ? entries : tierWinGainValues(entries);
    const fullDate = formatSnapshotDate(item.source_time_text || item.scraped_at || item.id);
    const existing = byDate.get(fullDate);
      if (existing) {
        HEATMAP_ROWS.forEach((row) => {
          existing.values[row.key] += values[row.key] || 0;
        });
        existing.isSelected = existing.isSelected || snapshotId === currentSnapshotId;
        if (!existing.snapshotId || snapshotId === currentSnapshotId) existing.snapshotId = snapshotId;
      } else {
      byDate.set(fullDate, {
        id: snapshotId,
        snapshotId,
        isSelected: snapshotId === currentSnapshotId,
        shortDate: formatHeatmapDate(fullDate),
        fullDate,
        values,
      });
    }
  });

  const selectedDate = formatSnapshotDate(snapshot.source_time_text || snapshot.scraped_at || "");
  const dateKeys = [...byDate.keys()].filter((date) => dateToUtcMs(date) != null);
  if (!dateKeys.includes(selectedDate) && dateToUtcMs(selectedDate) != null) dateKeys.push(selectedDate);
  const selectedMs = dateToUtcMs(selectedDate);
  const dateTimes = dateKeys.map(dateToUtcMs).filter((value) => value != null);
  if (dateTimes.length === 0) return { snapshots: [], maxGain: 0 };
  const periodStartMs = dateToUtcMs(period?.start_date);
  const periodEndMs = dateToUtcMs(period?.end_date);
  const minDataMs = Math.min(...dateTimes);
  const maxDataMs = Math.max(...dateTimes);
  const startMs = periodStartMs ?? Math.min(minDataMs, (selectedMs ?? maxDataMs) - (HEATMAP_WINDOW_SIZE - 1) * 24 * 60 * 60 * 1000);
  const endMs = periodEndMs ?? Math.max(maxDataMs, selectedMs ?? maxDataMs);
  const items = [];
  for (let time = startMs; time <= endMs; time += 24 * 60 * 60 * 1000) {
    const date = utcDateKey(time);
    const isSeasonStart = periodStartMs != null && time === periodStartMs;
    const existing = byDate.get(date);
    items.push(existing
      ? { ...existing, isSeasonStart }
      : { id: date, snapshotId: null, isSelected: date === selectedDate, shortDate: formatHeatmapDate(date), fullDate: date, values: emptyHeatmapValues(), isSeasonStart }
    );
  }
  const maxGain = items.reduce((maxValue, item) => Math.max(maxValue, ...Object.values(item.values)), 0);
  return { snapshots: items, maxGain, hasPeriod: Boolean(periodStartMs != null && periodEndMs != null) };
}

function seasonPeriodForSnapshot(snapshot, seasonData) {
  if (seasonData.season_period && String(seasonData.season_period.season ?? "") === String(snapshot.season ?? "")) {
    return seasonData.season_period;
  }
  return (seasonData.season_periods || []).find((period) => String(period.season ?? "") === String(snapshot.season ?? "")) || null;
}

function emptyHeatmapValues() {
  return Object.fromEntries(HEATMAP_ROWS.map((row) => [row.key, 0]));
}

function tierWinGainValues(entries) {
  const values = Object.fromEntries(HEATMAP_ROWS.map((row) => [row.key, 0]));
  officialCollectedEntries(entries || []).forEach((entry) => {
    const delta = numberValue(entry.win_delta);
    if (!Number.isFinite(delta) || delta <= 0) return;
    if (Number.isFinite(numberValue(entry.rank))) values.in100 += delta;
    const tier = normalizeTier(entry.tier_label);
    if (Number.isFinite(numberValue(entry.tier_rank)) && tier in values) values[tier] += delta;
  });
  return values;
}

function heatmapIntensity(value, maxGain) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(maxGain) || maxGain <= 0) return "0";
  return Math.max(0.14, Math.sqrt(value / maxGain)).toFixed(3);
}

function formatHeatmapDate(value) {
  const date = formatSnapshotDate(value);
  const match = date.match(/^\d{4}-(\d{1,2})-(\d{1,2})$/);
  if (!match) return date;
  return `${match[1]}/${match[2]}`;
}

function dateToUtcMs(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (![year, month, day].every(Number.isFinite)) return null;
  return Date.UTC(year, month - 1, day);
}

function utcDateKey(time) {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
applyProjectHeart(storedProjectHeart());
updateFilterToggleLabel(false);
renderDashboardSkeleton();
installDirectionalTableScroll();

themeToggle.addEventListener("click", () => {
  applyTheme(nextTheme(document.body.dataset.theme), { animate: true });
});

projectHeart.addEventListener("click", () => {
  const isLiked = !projectHeart.classList.contains("is-liked");
  applyProjectHeart(isLiked);
  saveProjectHeart(isLiked).catch(() => {
    applyProjectHeart(storedProjectHeart(), { persist: false });
  });
});

jumpTop?.addEventListener("click", () => scrollPageToEdge("top"));
jumpBottom?.addEventListener("click", () => scrollPageToEdge("bottom"));

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-active");
  modal.setAttribute("aria-hidden", "true");
}

officialLink?.addEventListener("click", (event) => {
  event.preventDefault();
  openModal(confirmModal);
});

confirmOk?.addEventListener("click", () => {
  closeModal(confirmModal);
  if (officialLink) {
    window.open(officialLink.href, "_blank", "noopener,noreferrer");
  }
});

confirmCancel?.addEventListener("click", () => {
  closeModal(confirmModal);
});

confirmModal?.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeModal(confirmModal);
  }
});

openSnapshotModal?.addEventListener("click", () => {
  openModal(snapshotModal);
  syncSnapshotControls(true);
});

closeSnapshotModal?.addEventListener("click", () => {
  closeModal(snapshotModal);
});

snapshotModal?.addEventListener("click", (event) => {
  if (event.target === snapshotModal) {
    closeModal(snapshotModal);
  }
});
function syncSnapshotControls(toMobile = true) {
  if (toMobile && snapshotSelect && snapshotSelectMobile) {
    snapshotSelectMobile.value = snapshotSelect.value;
    updateSnapshotModalNav();
  } else if (!toMobile && snapshotSelect && snapshotSelectMobile) {
    snapshotSelect.value = snapshotSelectMobile.value;
    const event = new Event("change");
    snapshotSelect.dispatchEvent(event);
  }
}

function updateSnapshotModalNav() {
  if (!prevSnapshotMobile || !nextSnapshotMobile) return;
  prevSnapshotMobile.disabled = currentSnapshotIndex < 0 || currentSnapshotIndex >= snapshots.length - 1;
  nextSnapshotMobile.disabled = currentSnapshotIndex <= 0;
}

snapshotSelectMobile?.addEventListener("change", () => {
  syncSnapshotControls(false);
});

prevSnapshotMobile?.addEventListener("click", () => {
  if (currentSnapshotIndex >= 0 && currentSnapshotIndex < snapshots.length - 1) {
    const nextId = snapshots[currentSnapshotIndex + 1].id;
    loadSnapshot(nextId).then(() => {
      syncSnapshotControls(true);
    }).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});

nextSnapshotMobile?.addEventListener("click", () => {
  if (currentSnapshotIndex > 0) {
    const prevId = snapshots[currentSnapshotIndex - 1].id;
    loadSnapshot(prevId).then(() => {
      syncSnapshotControls(true);
    }).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => renderRankingRows(), 120);
});

filterToggle.addEventListener("click", () => {
  const expanded = filterToggle.getAttribute("aria-expanded") === "true";
  const nextExpanded = !expanded;
  filterToggle.setAttribute("aria-expanded", String(nextExpanded));
  updateFilterToggleLabel(nextExpanded);
  rankingFilters.classList.toggle("is-open", nextExpanded);
});

[serverFilterInput, nameFilterInput, winsFilterInput, recentDaysInput, newUserFilterInput].forEach((input) => {
  const eventName = input.tagName === "SELECT" ? "change" : "input";
  input.addEventListener(eventName, () => {
    filterToggle.classList.toggle("is-active", hasActiveAdvancedFilters());
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => renderRankingRows(), 120);
  });
});

filterReset.addEventListener("click", () => {
  serverFilterInput.value = "";
  nameFilterInput.value = "";
  winsFilterInput.value = "";
  recentDaysInput.value = "";
  newUserFilterInput.checked = false;
  filterToggle.classList.remove("is-active");
  renderRankingRows();
});

function installDirectionalTableScroll() {
  if (!tableWrap || !window.matchMedia("(pointer: coarse)").matches) return;

  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;
  let lockedAxis = "";
  const threshold = 8;

  tableWrap.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) {
      lockedAxis = "";
      return;
    }
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startScrollLeft = tableWrap.scrollLeft;
    startScrollTop = tableWrap.scrollTop;
    lockedAxis = "";
  }, { passive: true });

  tableWrap.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (!lockedAxis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    event.preventDefault();
    if (lockedAxis === "x") {
      tableWrap.scrollLeft = startScrollLeft - dx;
    } else {
      tableWrap.scrollTop = startScrollTop - dy;
    }
  }, { passive: false });

  tableWrap.addEventListener("touchend", () => {
    lockedAxis = "";
  }, { passive: true });

  tableWrap.addEventListener("touchcancel", () => {
    lockedAxis = "";
  }, { passive: true });
}

sortHeaders.forEach((header) => {
  const applySort = () => {
    const key = header.dataset.sortKey;
    rankingSort = {
      key,
      direction: rankingSort.key === key && rankingSort.direction === "asc" ? "desc" : "asc",
    };
    renderRankingRows();
  };
  header.addEventListener("click", applySort);
  header.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      applySort();
    }
  });
});

snapshotSelect.addEventListener("change", () => {
  loadSnapshot(snapshotSelect.value).catch((error) => {
    snapshotMeta.textContent = error.message;
  });
});

prevSnapshot.addEventListener("click", () => {
  if (currentSnapshotIndex >= 0 && currentSnapshotIndex < snapshots.length - 1) {
    loadSnapshot(snapshots[currentSnapshotIndex + 1].id).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});

nextSnapshot.addEventListener("click", () => {
  if (currentSnapshotIndex > 0) {
    loadSnapshot(snapshots[currentSnapshotIndex - 1].id).catch((error) => {
      snapshotMeta.textContent = error.message;
    });
  }
});

if (tierHeatmapPrev) {
  tierHeatmapPrev.addEventListener("click", () => moveTierHeatmapWindow(-1));
}

if (tierHeatmapNext) {
  tierHeatmapNext.addEventListener("click", () => moveTierHeatmapWindow(1));
}

if (honorTabs) {
  honorTabs.querySelectorAll('.honor-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      clearTimeout(honorRotateTimer);
      honorRotateRemainingMs = HONOR_ROTATE_MS;
      honorMode = btn.dataset.mode;
      renderHonorGrid();
      updateHonorGridSelection(selectedKey);
      scheduleHonorRotate(HONOR_ROTATE_MS);
    });
  });
}

function bindHonorHoverPause(element) {
  if (!element) return;
  element.addEventListener("mouseenter", () => {
    honorGridHovering = true;
    pauseHonorRotate();
  });
  element.addEventListener("mouseleave", () => {
    honorGridHovering = false;
    resumeHonorRotate();
  });
}

bindHonorHoverPause(honorHead);
bindHonorHoverPause(honorGrid);

if (honorRotateToggle) {
  honorRotateToggle.addEventListener("click", () => {
    honorRotatePaused = !honorRotatePaused;
    if (honorRotatePaused) {
      pauseHonorRotate();
    } else {
      resumeHonorRotate();
    }
  });
}

loadSnapshots()
  .then(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSnapshot = params.get("snapshot");
    return initialSnapshot ? loadSnapshot(initialSnapshot) : loadLatest();
  })
  .then(() => {
    const initialDetail = new URLSearchParams(window.location.search).get("detail");
    if (initialDetail) openDetailOverlay(initialDetail, { replace: true });
  })
  .catch((error) => {
    snapshotMeta.textContent = error.message;
  });

loadMapRotation();
window.setInterval(loadMapRotation, 60 * 1000);
loadProjectHeartCount().catch(() => updateProjectHeartCount(null));

document.addEventListener("click", (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const link = e.target.closest(".detail-open-link");
  if (!link) return;
  e.preventDefault();
  const url = new URL(link.href);
  const characterId = url.searchParams.get("id");
  if (characterId) openDetailOverlay(characterId);
});

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());

(function initNavScrollLag() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;
  const MAX = 10;
  const PUSH = 0.3;
  const DECAY = 0.82;
  let offset = 0;
  let lastY = window.scrollY;
  let rafId = null;
  function tick() {
    offset *= DECAY;
    nav.style.transform = `translateX(-50%) translateY(${offset.toFixed(2)}px)`;
    if (Math.abs(offset) > 0.15) {
      rafId = requestAnimationFrame(tick);
    } else {
      offset = 0;
      nav.style.transform = "translateX(-50%)";
      rafId = null;
    }
  }
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    offset = Math.max(-MAX, Math.min(MAX, offset - (y - lastY) * PUSH));
    lastY = y;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: true });
}());

// ─── Detail overlay (SPA) ────────────────────────────────────

const RECOMMEND_CLIENT_KEY = "ccRankingRecommendClient";
const RECOMMEND_STORAGE_PREFIX = "ccRankingRecommendChar_";

const detailState = {
  characterKey: null,
  characterId: null,
  history: [],
  closing: false,
};

function openDetailOverlay(characterId, { replace = false } = {}) {
  if (!detailOverlay) return;
  detailState.characterId = characterId;
  detailState.history = [];
  detailState.closing = false;
  detailOverlayTitle.textContent = "Character Details";
  detailOverlaySeasonBadge.textContent = "Season -";
  detailOverlayMeta.textContent = "캐릭터 기록을 불러오는 중";
  detailOverlayHistoryCount.textContent = "-";
  detailOverlayHistoryRows.innerHTML = "";
  if (detailChartInstance) { detailChartInstance.destroy(); detailChartInstance = null; }
  detailOverlay.hidden = false;
  requestAnimationFrame(() => detailOverlay.classList.add("is-open"));
  const detailUrl = `?detail=${encodeURIComponent(characterId)}`;
  if (replace) {
    window.history.replaceState({ detailId: characterId }, "", detailUrl);
  } else {
    window.history.pushState({ detailId: characterId }, "", detailUrl);
  }
  document.body.style.overflow = "hidden";
  loadDetailCharacter(characterId).catch((err) => {
    detailOverlayMeta.textContent = err.message;
  });
}

function closeDetailOverlay() {
  if (!detailOverlay || detailState.closing) return;
  detailState.closing = true;
  detailOverlay.classList.remove("is-open");
  detailOverlay.classList.add("is-closing");
  document.body.style.overflow = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("detail");
  window.history.pushState({}, "", url);
  setTimeout(() => {
    detailOverlay.classList.remove("is-closing");
    detailOverlay.hidden = true;
    detailState.closing = false;
    if (detailChartInstance) { detailChartInstance.destroy(); detailChartInstance = null; }
  }, 290);
}

async function loadDetailCharacter(characterId) {
  const [history, snapshotPayload] = await Promise.all([
    loadDetailCharacterHistory(characterId),
    api("/api/snapshots"),
  ]);
  if (detailState.characterId !== characterId) return;
  snapshots = snapshotPayload.snapshots || snapshots;
  detailState.history = history;

  if (history.length === 0) {
    detailOverlayMeta.textContent = "해당 캐릭터 기록을 찾을 수 없습니다.";
    detailOverlayHistoryRows.innerHTML = `<tr><td class="empty" colspan="7">기록 없음</td></tr>`;
    renderDetailChart([]);
    return;
  }

  const latest = history[history.length - 1];
  detailState.characterKey = latest.character_key || characterKeyFromId(characterId);
  detailOverlayTitle.textContent = latest.character_name;
  detailOverlayTitle.className = `details-title tier-${normalizeTier(latest.tier_label)}`;
  detailOverlaySeasonBadge.textContent = latest.season ? `Season ${latest.season}` : "Season -";
  detailOverlayMeta.textContent = `${latest.server_name} · 최신 #${latest.rank ?? "100위권 밖"} · ${formatSnapshotDate(latest.source_time_text || latest.scraped_at)}`;
  detailOverlayHistoryCount.textContent = `${history.length}개`;
  detailOverlaySummary.innerHTML = detailSummaryHtml(latest, history);
  detailOverlayHistoryRows.innerHTML = history.slice().reverse().map((row) => detailHistoryRowHtml(row, latest)).join("");
  renderDetailChart(history);
  loadDetailRecommendation().catch(() => updateDetailRecommendCount(null));
}

async function loadDetailCharacterHistory(characterId) {
  const payload = await api(`/api/history?id=${encodeURIComponent(characterId)}`);
  const history = payload.history || [];
  if (history.length > 0 || !String(characterId || "").startsWith("c1_")) return history;
  const legacyKey = characterKeyFromId(characterId);
  if (!legacyKey || legacyKey === characterId) return history;
  const legacyPayload = await api(`/api/history?key=${encodeURIComponent(legacyKey)}`);
  return legacyPayload.history || [];
}

function detailSummaryHtml(latest, history) {
  const seasonHistory = history.filter((row) => row.season === latest.season);
  const best = seasonHistory.reduce((b, r) => (r.rank != null && (b.rank == null || r.rank < b.rank)) ? r : b, seasonHistory[0]);
  const worst = seasonHistory.reduce((w, r) => (r.rank != null && (w.rank == null || r.rank > w.rank)) ? r : w, seasonHistory[0]);
  return `<div class="details-stat-grid">
    <div><span>최신 순위</span><strong>${best?.rank != null ? `#${escapeHtml(String(latest.rank))}` : "100위권 밖"}</strong></div>
    <div><span>최신 티어</span><strong>${tierIconHtml(latest)}${escapeHtml(latest.tier_label || "-")}</strong></div>
    <div><span>최신 평점</span><strong>${pointsWithDeltaHtml(latest)}</strong></div>
    <div><span>이번 시즌 최고 랭킹</span><strong>${best?.rank != null ? `#${escapeHtml(String(best.rank))}` : "-"}</strong></div>
    <div><span>이번 시즌 최저 랭킹</span><strong>${worst?.rank != null ? `#${escapeHtml(String(worst.rank))}` : "-"}</strong></div>
    <div><span>스냅샷</span><strong>${escapeHtml(String(history.length))}개</strong></div>
  </div>`;
}

function detailHistoryRowHtml(row, latest) {
  const isMerged = String(row.character_name || "") !== String(latest.character_name || "") ||
    String(row.server_name || "") !== String(latest.server_name || "");
  const name = row.character_name || "-";
  const server = row.server_name || "-";
  const identity = `<span class="history-identity">
    <span class="history-name">${escapeHtml(name)}</span>
    <span class="history-server">${escapeHtml(server)}</span>
    ${isMerged ? '<span class="merge-badge">병합됨</span>' : ""}
  </span>`;
  const rankDisplay = row.rank != null
    ? `<span class="rank-badge ${rankClass(row.rank)}">${escapeHtml(String(row.rank))}</span>`
    : `<span class="rank-badge" style="opacity:0.45">밖</span>`;
  return `<tr class="${isMerged ? "is-merged-history" : ""}">
    <td>${escapeHtml(formatSnapshotDate(row.source_time_text || row.scraped_at))}</td>
    <td>${identity}</td>
    <td>${rankDisplay}</td>
    <td><span class="tier-pill tier-${normalizeTier(row.tier_label)}">${tierIconHtml(row)}<span>${escapeHtml(row.tier_label || "-")}</span></span></td>
    <td>${pointsWithDeltaHtml(row)}</td>
    <td>${winsWithDeltaHtml(row)}</td>
    <td>${movementBadge(row)}</td>
  </tr>`;
}

function recommendClientId() {
  try {
    let v = window.localStorage.getItem(RECOMMEND_CLIENT_KEY);
    if (!v) { v = makeClientId(); window.localStorage.setItem(RECOMMEND_CLIENT_KEY, v); }
    return v;
  } catch {
    let v = readCookie(RECOMMEND_CLIENT_KEY);
    if (!v) { v = makeClientId(); writeCookie(RECOMMEND_CLIENT_KEY, v); }
    return v;
  }
}

function storedDetailRecommendation(key) {
  if (!key) return false;
  try { return window.localStorage.getItem(RECOMMEND_STORAGE_PREFIX + key) === "1"; }
  catch { return readCookie(RECOMMEND_STORAGE_PREFIX + key) === "1"; }
}

function applyDetailRecommendation(isLiked, options = {}) {
  if (!detailRecommendBtn) return;
  detailRecommendBtn.classList.toggle("is-liked", isLiked);
  detailRecommendBtn.setAttribute("aria-pressed", isLiked ? "true" : "false");
  const storageId = detailState.characterKey || detailState.characterId || "";
  if (options.persist !== false && storageId) {
    try { window.localStorage.setItem(RECOMMEND_STORAGE_PREFIX + storageId, isLiked ? "1" : "0"); }
    catch { writeCookie(RECOMMEND_STORAGE_PREFIX + storageId, isLiked ? "1" : "0"); }
  }
}

function updateDetailRecommendCount(count) {
  if (!detailRecommendCount) return;
  if (count == null) { detailRecommendCount.textContent = "-"; return; }
  detailRecommendCount.textContent = Number(count).toLocaleString("ko-KR");
}

async function loadDetailRecommendation() {
  const id = detailState.characterKey || detailState.characterId;
  if (!id) return;
  const clientId = recommendClientId();
  const idParam = detailState.characterKey
    ? `key=${encodeURIComponent(detailState.characterKey)}`
    : `id=${encodeURIComponent(detailState.characterId)}`;
  const payload = await api(`/api/recommend?${idParam}&client_id=${encodeURIComponent(clientId)}`);
  updateDetailRecommendCount(payload.count);
  applyDetailRecommendation(Boolean(payload.liked), { persist: true });
}

async function saveDetailRecommendation(isLiked) {
  const id = detailState.characterKey || detailState.characterId;
  if (!id) return;
  const body = { client_id: recommendClientId(), liked: isLiked };
  if (detailState.characterKey) body.key = detailState.characterKey;
  else body.id = detailState.characterId;
  const payload = await api("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  updateDetailRecommendCount(payload.count);
  applyDetailRecommendation(Boolean(payload.liked), { persist: true });
}

detailBackBtn?.addEventListener("click", closeDetailOverlay);

detailRecommendBtn?.addEventListener("click", () => {
  const isLiked = !detailRecommendBtn.classList.contains("is-liked");
  applyDetailRecommendation(isLiked);
  saveDetailRecommendation(isLiked).catch(() => {
    applyDetailRecommendation(storedDetailRecommendation(detailState.characterKey || detailState.characterId), { persist: false });
  });
});

window.addEventListener("popstate", (e) => {
  if (e.state?.detailId) {
    openDetailOverlay(e.state.detailId);
  } else if (!detailOverlay?.hidden) {
    closeDetailOverlay();
  }
});
