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
const seasonExtremes = document.querySelector("#seasonExtremes");
const currentMapName = document.querySelector("#currentMapName");
const currentMapTime = document.querySelector("#currentMapTime");
const nextMapName = document.querySelector("#nextMapName");
const nextMapTime = document.querySelector("#nextMapTime");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const projectHeart = document.querySelector("#projectHeart");
const projectHeartCount = document.querySelector("#projectHeartCount");
const canvas = document.querySelector("#rankChart");
const ctx = canvas.getContext("2d");

let selectedKey = null;
let snapshots = [];
let currentSnapshotIndex = -1;
let currentHistory = [];
let latestEntries = [];
const snapshotPayloadCache = new Map();
let leaderStreakToken = 0;
let chartTransitionTimer = null;
const SKELETON_ROW_COUNT = 12;

const THEMES = ["dark", "light", "crystal", "rose"];
const THEME_ICONS = {
  dark: "☾",
  light: "☀",
  crystal: "✦",
  rose: "◆",
};
const DEFAULT_THEME = "dark";
const HEART_STORAGE_KEY = "ccRankingProjectHeart";
const HEART_CLIENT_KEY = "ccRankingProjectHeartClient";

const API_BASE = String(window.CC_API_BASE || "").replace(/\/$/, "");
const STATIC_DATA_BASE = String(window.CC_STATIC_DATA_BASE || "static/data").replace(/\/$/, "");
let staticDataPromise = null;
let mapNamesPromise = null;
let mapNameLookup = {};

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

function movementBadge(entry) {
  const text = movementText(entry);
  const movementClass = entry.movement_direction === "up"
    ? "movement-up"
    : entry.movement_direction === "down"
      ? "movement-down"
      : entry.movement_direction === "new"
        ? "movement-new"
        : entry.movement_direction === "out" || entry.is_dropped
          ? "movement-out"
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
  updateChart(currentHistory);
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
  seasonBadge.innerHTML = '<span class="skeleton-line skeleton-season"></span>';
  snapshotMeta.innerHTML = '<span class="skeleton-line skeleton-meta"></span>';
  totalMeta.innerHTML = '<span class="skeleton-line skeleton-total"></span>';
  entryCount.innerHTML = '<span class="skeleton-line skeleton-count"></span>';
  leaderStat.innerHTML = '<span class="skeleton-line skeleton-leader-name"></span>';
  leaderMeta.innerHTML = '<span class="skeleton-line skeleton-leader-meta"></span>';
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
  leaderStat.innerHTML = '<span class="skeleton-line skeleton-leader-name"></span>';
  leaderMeta.innerHTML = '<span class="skeleton-line skeleton-leader-meta"></span>';
  rankingRows.innerHTML = skeletonRowsHtml(SKELETON_ROW_COUNT);
}

function renderCharacterSkeleton() {
  selectedCharacter.innerHTML = `
    <span class="skeleton-line skeleton-selected-name"></span>
    <span class="skeleton-line skeleton-selected-tier"></span>
    <span class="skeleton-line skeleton-selected-count"></span>
  `;
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
      <td><span class="skeleton-line skeleton-points"></span></td>
      <td><span class="skeleton-line skeleton-wins"></span></td>
      <td><span class="skeleton-line skeleton-movement"></span></td>
    </tr>
  `).join("");
}

function renderLatest(payload) {
  document.body.classList.remove("is-loading");
  canvas.classList.remove("chart-loading");
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
    selectedCharacter.innerHTML = "";
    seasonExtremes.innerHTML = "";
    rankingRows.innerHTML = `<tr><td class="empty" colspan="7">아직 데이터가 없습니다.</td></tr>`;
    updateChart([], { animate: false });
    return;
  }

  seasonBadge.textContent = snapshot.season ? `Season ${snapshot.season}` : "Season -";
  snapshotMeta.textContent = snapshot.source_time_text || snapshot.scraped_at || "-";
  totalMeta.textContent = `총 저장 인원 ${snapshot.entry_count || entries.length}명`;
  entryCount.textContent = rankingCountText(entries);
  leaderStat.textContent = entries[0] ? entries[0].character_name : "-";
  leaderMeta.textContent = entries[0]
    ? `${entries[0].server_name} · ${tierWithPoints(entries[0])} · ${entries[0].wins ?? "-"}승 · 1위 유지일 계산 중`
    : "-";
  renderRankingRows();
  updateLeaderStreak(snapshot, entries[0]);
  if (currentHistory.length === 0) {
    updateChart([], { animate: false });
  }
}

function renderRankingRows() {
  const entries = filteredRankingEntries();
  entryCount.textContent = searchInput.value.trim()
    ? `${entries.length} / ${rankingCountText(latestEntries)}`
    : rankingCountText(latestEntries);
  if (entries.length === 0) {
    rankingRows.innerHTML = `<tr><td class="empty" colspan="7">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  rankingRows.innerHTML = entries.map((entry) => {
    const isNew = entry.movement_direction === "new";
    const isDropped = Boolean(entry.is_dropped);
    const rowClass = [isNew ? "is-new" : "", isDropped ? "is-dropped" : ""].filter(Boolean).join(" ");
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
        <td><span class="tier-pill ${tierClass(entry.tier_label)}">${tierIconHtml(entry)}<span>${escapeHtml(entry.tier_label || "-")}</span></span></td>
        <td>${escapeHtml(pointsDisplay(entry))}</td>
        <td>${entry.wins ?? "-"}</td>
        <td>${movementBadge(entry)}</td>
      </tr>
    `;
  }).join("");

  [...rankingRows.querySelectorAll("tr[data-key]")].forEach((row) => {
    row.querySelector(".character-detail-link")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    row.addEventListener("click", () => {
      selectCharacter(row.dataset.key, { scrollRanking: false });
    });
  });
}

function rankingCountText(entries) {
  const droppedCount = entries.filter((entry) => entry.is_dropped).length;
  const officialCount = entries.length - droppedCount;
  return droppedCount > 0 ? `${officialCount}명 + 순위권 밖 ${droppedCount}명` : `${officialCount}명`;
}

function rankCellHtml(entry) {
  if (entry.is_dropped || entry.rank == null) {
    return '<span class="rank-badge rank-dropped" aria-label="순위권 밖"></span>';
  }
  return `<span class="rank-badge ${rankClass(entry.rank)}">${escapeHtml(entry.rank)}</span>`;
}

function filteredRankingEntries() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return latestEntries;
  return latestEntries.filter((entry) => (
    String(entry.character_name).toLowerCase().includes(query)
    || String(entry.server_name).toLowerCase().includes(query)
  ));
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
  leaderMeta.textContent = `${leader.server_name} · ${tierWithPoints(leader)} · ${leader.wins ?? "-"}승 · 1위 ${streak}일차`;
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
  snapshots = (payload.snapshots || []).slice().reverse();
  snapshotSelect.innerHTML = snapshots.map((snapshot, index) => `
    <option value="${snapshot.id}">${escapeHtml(formatSnapshotDate(snapshot.source_time_text || snapshot.scraped_at || `Snapshot ${snapshot.id}`))}</option>
  `).join("");
  if (snapshots.length === 0) {
    snapshotSelect.innerHTML = `<option>저장된 데이터 없음</option>`;
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

async function loadSnapshot(snapshotId) {
  renderSnapshotSkeleton();
  renderLatest(await api(`/api/snapshot?id=${encodeURIComponent(snapshotId)}`));
  setCurrentSnapshot(Number(snapshotId));
  await selectDefaultCharacter();
  const url = new URL(window.location.href);
  url.searchParams.set("snapshot", snapshotId);
  window.history.replaceState({}, "", url);
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
  prevSnapshot.disabled = currentSnapshotIndex <= 0;
  nextSnapshot.disabled = currentSnapshotIndex < 0 || currentSnapshotIndex >= snapshots.length - 1;
}

async function selectCharacter(key, options = {}) {
  const { scrollRanking = true } = options;
  selectedKey = key;
  renderCharacterSkeleton();
  try {
    const payload = await api(`/api/history?key=${encodeURIComponent(key)}`);
    const history = payload.history || [];
    currentHistory = history;
    const latest = history[history.length - 1];
    selectedCharacter.innerHTML = latest ? selectedCharacterHtml(latest, history.length) : "";
    seasonExtremes.innerHTML = latest ? seasonExtremesHtml(history, latest.season) : "";
    updateChart(history);
    if (scrollRanking) {
      scrollRankingIntoView(key);
    }
  } catch (error) {
    canvas.classList.remove("chart-loading");
    updateChart(currentHistory, { animate: false });
    selectedCharacter.textContent = error.message;
    seasonExtremes.innerHTML = "";
  }
}

function selectedCharacterHtml(latest, sampleCount) {
  return `
    <span>${escapeHtml(latest.character_name)} @ ${escapeHtml(latest.server_name)} · </span>
    <span class="selected-tier">${tierIconHtml(latest)}<span>${escapeHtml(tierWithPoints(latest))}</span></span>
    <span> · ${sampleCount}개 스냅샷</span>
  `;
}

function seasonExtremesHtml(history, season) {
  const seasonHistory = history.filter((row) => row.season === season);
  if (seasonHistory.length === 0) return "";

  const bestRank = seasonHistory.reduce((best, row) => betterTier(row, best) ? row : best, seasonHistory[0]);
  const worstRank = seasonHistory.reduce((worst, row) => worseTier(row, worst) ? row : worst, seasonHistory[0]);
  const bestRanking = seasonHistory.reduce((best, row) => row.rank < best.rank ? row : best, seasonHistory[0]);
  const worstRanking = seasonHistory.reduce((worst, row) => row.rank > worst.rank ? row : worst, seasonHistory[0]);

  return `
    <div class="extreme-card">
      <span>이번 시즌 최고 랭크</span>
      <strong>${tierIconHtml(bestRank)}${escapeHtml(tierWithPoints(bestRank))}</strong>
      <small>이번 시즌 최고 랭킹 #${escapeHtml(bestRanking.rank)} · ${escapeHtml(formatSnapshotDate(bestRanking.source_time_text || bestRanking.scraped_at))}</small>
    </div>
    <div class="extreme-card">
      <span>이번 시즌 최저 랭크</span>
      <strong>${tierIconHtml(worstRank)}${escapeHtml(tierWithPoints(worstRank))}</strong>
      <small>이번 시즌 최저 랭킹 #${escapeHtml(worstRanking.rank)} · ${escapeHtml(formatSnapshotDate(worstRanking.source_time_text || worstRanking.scraped_at))}</small>
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
  return row.rank < best.rank;
}

function worseTier(row, worst) {
  const rowScore = tierScore(row.tier_label);
  const worstScore = tierScore(worst.tier_label);
  if (rowScore !== worstScore) return rowScore < worstScore;
  const rowPoints = pointsValue(row);
  const worstPoints = pointsValue(worst);
  if (rowPoints !== worstPoints) return rowPoints < worstPoints;
  return row.rank > worst.rank;
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

function pointsValue(entry) {
  const parsed = Number.parseInt(String(pointsDisplay(entry)).replaceAll(",", ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function tierScore(tier) {
  const value = normalizeTier(tier);
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

  const tierChangeIndexes = drawTierChangeMarkers(points, chartSize.width, chartSize.height);
  drawDateLabels(points, chartSize.height);
  drawRankLabels(points, tierChangeIndexes, chartSize.width, chartSize.height);

  ctx.fillStyle = styles.getPropertyValue("--chart-muted").trim() || "#93a4b8";
  ctx.font = "12px sans-serif";
  ctx.fillText(`best #${minRank}`, padding, 20);
  ctx.fillText(`worst #${maxRank}`, padding, chartSize.height - 14);
}

function drawTierChangeMarkers(points, chartWidth, chartHeight) {
  const styles = getComputedStyle(document.body);
  const changes = points.filter((point, index) => {
    if (index === 0) return false;
    return normalizeTier(point.row.tier_label) !== normalizeTier(points[index - 1].row.tier_label);
  });
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
  points.slice(-6).forEach((point) => {
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
applyProjectHeart(storedProjectHeart());
renderDashboardSkeleton();

themeToggle.addEventListener("click", () => {
  applyTheme(nextTheme(document.body.dataset.theme));
});

projectHeart.addEventListener("click", () => {
  const isLiked = !projectHeart.classList.contains("is-liked");
  applyProjectHeart(isLiked);
  saveProjectHeart(isLiked).catch(() => {
    applyProjectHeart(storedProjectHeart(), { persist: false });
  });
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

loadMapRotation();
window.setInterval(loadMapRotation, 60 * 1000);
loadProjectHeartCount().catch(() => updateProjectHeartCount(null));

window.addEventListener("resize", () => renderChart(currentHistory));

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());
