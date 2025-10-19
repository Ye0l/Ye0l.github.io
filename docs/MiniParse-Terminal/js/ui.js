import { JOB_ICON_MAP } from './config.js';
import { formatNumber, animateNumber } from './utils.js';

// --- State Management ---
let dpsMeterContainer = null;
let hpsMeterContainer = null;
const combatantRegistry = new Map(); // Stores { dpsRow, dpsGraph, hpsRow, hpsGraph, cells, prevData }

// --- UI Initialization ---
function createMeterContainer(title, gridTemplateColumns, headers) {
    const container = document.createElement('div');
    container.className = 'meter-container';
    const titleEl = document.createElement('div');
    titleEl.className = 'meter-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);
    const headerEl = document.createElement('div');
    headerEl.className = 'grid-header';
    headerEl.style.gridTemplateColumns = gridTemplateColumns;
    headers.forEach(text => {
        const cell = document.createElement('span');
        cell.textContent = text;
        headerEl.appendChild(cell);
    });
    container.appendChild(headerEl);
    return container;
}

function initMeters() {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    output.innerHTML = ''; // Clear only once
    dpsMeterContainer = createMeterContainer(
        '[DAMAGE DONE]',
        '30px 1fr 70px 50px 80px 60px 60px 60px 60px 140px 50px',
        ['Job', 'Name', 'DPS', 'DMG%', 'Damage', 'Swing', 'D.HIT', 'C.HIT', 'C.D.HIT', 'MaxHit', 'Death']
    );
    output.appendChild(dpsMeterContainer);
    hpsMeterContainer = createMeterContainer(
        '[HEALING]',
        '30px 1fr 70px 50px 80px 80px 80px',
        ['Job', 'Name', 'HPS', 'H%', 'Healed', 'Eff.Heal', 'OverHeal']
    );
    output.appendChild(hpsMeterContainer);
}

// --- Cell Creation ---
function createCell(content, { isIcon = false, job = '' } = {}) {
    const cell = document.createElement('span');
    if (isIcon) {
        const iconName = JOB_ICON_MAP[job.toUpperCase()];
        if (iconName) {
            const img = document.createElement('img');
            img.className = 'job-icon';
            img.src = `images/${iconName}`;
            cell.appendChild(img);
        } else {
            cell.textContent = job; // Fallback
        }
    } else {
        cell.textContent = content || '0';
    }
    return cell;
}

// --- Meter Rendering ---
function renderDpsMeter(combatants) {
    if (!dpsMeterContainer) return new Set();
    const maxDps = combatants.length > 0 ? (parseFloat(combatants[0].encdps) || 1) : 1;
    const presentIds = new Set();

    combatants.forEach(c => {
        const id = c.name;
        presentIds.add(id);
        let entry = combatantRegistry.get(id) || { cells: {}, prevData: {} };

        const data = {
            job: c.Job, name: c.name, dps: parseFloat(c.encdps) || 0,
            damagePct: c['damage%'], damage: parseFloat(c.damage) || 0,
            swings: c.swings, dhit: c.DirectHitCount, chit: c.CriticalHitCount,
            cdhit: c.CritDirectHitCount, deaths: c.deaths,
            maxhit: (c.maxhit || '-').split('-').length > 1 ? `${(c.maxhit || '-').split('-')[0]}-${formatNumber((c.maxhit || '-').split('-')[1])}` : c.maxhit,
        };

        if (!entry.dpsRow) {
            const textRow = document.createElement('div');
            textRow.className = 'grid-row';
            textRow.style.gridTemplateColumns = dpsMeterContainer.querySelector('.grid-header').style.gridTemplateColumns;
            if (c.name === 'YOU') textRow.classList.add('is-you');
            const graphRow = document.createElement('div');
            graphRow.className = 'dps-graph-container';
            graphRow.dataset.job = (c.Job || '').toUpperCase();
            const percentBar = document.createElement('div');
            percentBar.className = 'percent-bar';
            graphRow.appendChild(percentBar);

            entry.dpsRow = textRow;
            entry.dpsGraph = graphRow;
            entry.cells.job = createCell(null, { isIcon: true, job: data.job });
            entry.cells.name = createCell(data.name);
            entry.cells.dps = createCell(formatNumber(data.dps.toFixed(0)));
            entry.cells.damagePct = createCell(data.damagePct);
            entry.cells.damage = createCell(formatNumber(data.damage.toFixed(0)));
            entry.cells.swings = createCell(data.swings);
            entry.cells.dhit = createCell(data.dhit);
            entry.cells.chit = createCell(data.chit);
            entry.cells.cdhit = createCell(data.cdhit);
            entry.cells.maxhit = createCell(data.maxhit);
            entry.cells.deaths = createCell(data.deaths);
            Object.values(entry.cells).forEach(cell => textRow.appendChild(cell));
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;
        animateNumber(entry.cells.dps, prev.dps || 0, data.dps);
        animateNumber(entry.cells.damage, prev.damage || 0, data.damage);
        entry.cells.damagePct.textContent = data.damagePct;
        entry.cells.swings.textContent = data.swings;
        entry.cells.dhit.textContent = data.dhit;
        entry.cells.chit.textContent = data.chit;
        entry.cells.cdhit.textContent = data.cdhit;
        entry.cells.maxhit.textContent = data.maxhit;
        entry.cells.deaths.textContent = data.deaths;
        const relativeDps = (maxDps > 0) ? (data.dps / maxDps) * 100 : 0;
        entry.dpsGraph.querySelector('.percent-bar').style.width = relativeDps + '%';
        entry.prevData = { ...entry.prevData, ...data };
    });

    // Re-order DOM elements to match the sorted list
    combatants.forEach(c => {
        const entry = combatantRegistry.get(c.name);
        if (entry && entry.dpsRow) {
            dpsMeterContainer.appendChild(entry.dpsRow);
            dpsMeterContainer.appendChild(entry.dpsGraph);
        }
    });

    return presentIds;
}

function renderHpsMeter(combatants) {
    if (!hpsMeterContainer) return new Set();
    const HEALER_JOBS = ['WHM', 'SCH', 'AST', 'SGE', 'CNJ'];
    const healers = combatants.filter(c => HEALER_JOBS.includes((c.Job || '').toUpperCase()));
    const presentIds = new Set();

    healers.forEach(c => {
        const id = c.name;
        presentIds.add(id);
        let entry = combatantRegistry.get(id) || { cells: {}, prevData: {} };

        const healed = parseFloat(c.healed) || 0;
        const overHeal = parseFloat(c.overHeal) || 0;
        const data = {
            job: c.Job, name: c.name, hps: parseFloat(c.enchps) || 0,
            healedPct: c['healed%'], healed: healed,
            effHeal: healed - overHeal, overHeal: overHeal,
        };

        if (!entry.hpsRow) {
            const textRow = document.createElement('div');
            textRow.className = 'grid-row';
            textRow.style.gridTemplateColumns = hpsMeterContainer.querySelector('.grid-header').style.gridTemplateColumns;
            if (c.name === 'YOU') textRow.classList.add('is-you');
            const graphRow = document.createElement('div');
            graphRow.className = 'stacked-bar-container';
            graphRow.dataset.job = (c.Job || '').toUpperCase();
            const effBar = document.createElement('div');
            effBar.className = 'eff-heal-bar';
            const overBar = document.createElement('div');
            overBar.className = 'over-heal-bar';
            graphRow.appendChild(effBar);
            graphRow.appendChild(overBar);

            entry.hpsRow = textRow;
            entry.hpsGraph = graphRow;
            entry.cells.h_job = createCell(null, { isIcon: true, job: data.job });
            entry.cells.h_name = createCell(data.name);
            entry.cells.hps = createCell(formatNumber(data.hps.toFixed(0)));
            entry.cells.healedPct = createCell(data.healedPct);
            entry.cells.healed = createCell(formatNumber(data.healed.toFixed(0)));
            entry.cells.effHeal = createCell(formatNumber(data.effHeal.toFixed(0)));
            entry.cells.overHeal = createCell(formatNumber(data.overHeal.toFixed(0)));
            [entry.cells.h_job, entry.cells.h_name, entry.cells.hps, entry.cells.healedPct, entry.cells.healed, entry.cells.effHeal, entry.cells.overHeal].forEach(cell => textRow.appendChild(cell));
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;
        animateNumber(entry.cells.hps, prev.hps || 0, data.hps);
        animateNumber(entry.cells.healed, prev.healed || 0, data.healed);
        animateNumber(entry.cells.effHeal, prev.effHeal || 0, data.effHeal);
        animateNumber(entry.cells.overHeal, prev.overHeal || 0, data.overHeal);
        entry.cells.healedPct.textContent = data.healedPct;
        const effHealPct = (data.healed > 0) ? (data.effHeal / data.healed) * 100 : 0;
        const overHealPct = (data.healed > 0) ? (data.overHeal / data.healed) * 100 : 0;
        entry.hpsGraph.querySelector('.eff-heal-bar').style.width = effHealPct + '%';
        entry.hpsGraph.querySelector('.over-heal-bar').style.width = overHealPct + '%';
        entry.prevData = { ...entry.prevData, ...data };
    });

    // Re-order DOM elements to match the sorted list
    healers.forEach(c => {
        const entry = combatantRegistry.get(c.name);
        if (entry && entry.hpsRow) {
            hpsMeterContainer.appendChild(entry.hpsRow);
            hpsMeterContainer.appendChild(entry.hpsGraph);
        }
    });

    return presentIds;
}

// --- Main Update Functions ---
export function updateEncounter(data) {
    const encounterEl = document.getElementById('encounter');
    if(encounterEl) {
        const titleEl = document.getElementById('encounter-title');
        if (titleEl) titleEl.textContent = data.Encounter.title;
        const dpsEl = document.getElementById('enc-dps');
        if (dpsEl) dpsEl.textContent = formatNumber(data.Encounter.ENCDPS);
        const timeEl = document.getElementById('enc-time');
        if (timeEl) timeEl.textContent = data.Encounter.duration;
    }
}

export function updateCombatantViews(dpsData, hpsData) {
    if (!dpsMeterContainer) {
        initMeters();
    }
    const presentDpsIds = renderDpsMeter(dpsData);
    const presentHpsIds = renderHpsMeter(hpsData);
    const allPresentIds = new Set([...presentDpsIds, ...presentHpsIds]);

    combatantRegistry.forEach((entry, id) => {
        if (!allPresentIds.has(id)) {
            if (entry.dpsRow) {
                entry.dpsRow.remove();
                entry.dpsGraph.remove();
            }
            if (entry.hpsRow) {
                entry.hpsRow.remove();
                entry.hpsGraph.remove();
            }
            combatantRegistry.delete(id);
        }
    });
}