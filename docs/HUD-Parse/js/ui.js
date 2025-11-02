import { JOB_ICON_MAP } from './config.js';
import { formatNumber, animateNumber, formatCritStats, getCritColorClass } from './utils.js';

// --- State Management ---
let dpsMeterContainer = null;
let hpsMeterContainer = null;
const combatantRegistry = new Map(); // Stores { dpsRow, dpsGraph, hpsRow, hpsGraph, cells, prevData }

// --- UI Initialization ---
function createMeterContainer(title) {
    const container = document.createElement('div');
    container.className = 'meter-container';
    const titleEl = document.createElement('div');
    titleEl.className = 'meter-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);
    return container;
}

function initMeters() {
    const dpsOutput = document.getElementById('dps-output');
    const hpsOutput = document.getElementById('hps-output');
    if (!dpsOutput || !hpsOutput) return;

    dpsOutput.innerHTML = ''; // Clear DPS area
    hpsOutput.innerHTML = ''; // Clear HPS area

    dpsMeterContainer = createMeterContainer('[DAMAGE DONE]');
    dpsOutput.appendChild(dpsMeterContainer);

    hpsMeterContainer = createMeterContainer('[HEALING]');
    hpsOutput.appendChild(hpsMeterContainer);
}

// --- Cell Creation ---
function createCell(content, { isIcon = false, job = '' } = {}) {
    const cell = document.createElement('span');
    if (isIcon) {
        const upperJob = (job || '').toUpperCase();
        if (upperJob === 'LIMIT BREAK') {
            cell.textContent = ''; // Set to empty string
            return cell;
        }
        const iconName = JOB_ICON_MAP[upperJob];
        if (iconName) {
            const img = document.createElement('img');
            img.className = 'combatant-job-icon';
            img.src = `images/${iconName}`;
            cell.appendChild(img);
        } else {
            cell.textContent = job; // Fallback
        }
    } else {
        cell.textContent = content;
    }
    return cell;
}

function renderDpsMeter(combatants) {
    console.log(combatants);
    if (!dpsMeterContainer) return new Set();
    const maxDps = combatants.length > 0 ? (parseFloat(combatants[0].encdps) || 1) : 1;
    const presentIds = new Set();

    combatants.forEach((c, index) => {
        const id = c.name;
        presentIds.add(id);
        let entry = combatantRegistry.get(id) || { cells: {}, prevData: {} };

        const currentRank = index + 1;
        const data = {
            job: c.Job, name: c.name, dps: parseFloat(c.encdps) || 0,
            damagePct: c['damage%'], damage: parseFloat(c.damage) || 0,
            swings: c.swings, dhit: c.DirectHitCount, chit: c.crithits || 0,
            cdhit: c.CritDirectHitCount, maxhit: c.maxhit, deaths: c.deaths,
            rank: currentRank
        };

        if (!entry.dpsRow) {
            const container = document.createElement('div');
            container.className = 'combatant-container';
            if (c.name === 'YOU') container.classList.add('is-you');
            
            // Background graph
            const graphRow = document.createElement('div');
            graphRow.className = 'combatant-graph';
            const graphFill = document.createElement('div');
            graphFill.className = 'combatant-graph-fill';
            graphRow.appendChild(graphFill);
            
            // Main layout with two rows
            const mainSection = document.createElement('div');
            mainSection.className = 'combatant-main-section';
            
            // First row: Icon, Name, Main DPS
            const firstRow = document.createElement('div');
            firstRow.className = 'combatant-row combatant-first-row';
            
            // 1. Job icon
            const jobIcon = createJobIcon(data.job);
            
            // 2. Name
            const nameEl = document.createElement('div');
            nameEl.className = 'combatant-name';
            nameEl.textContent = data.name;
            
            // 3. Main DPS (emphasized)
            const dpsMain = document.createElement('div');
            dpsMain.className = 'combatant-dps-main';
            dpsMain.innerHTML = `<span class="stat-label">DPS:</span> ${formatNumber(data.dps.toFixed(0))}`;
            
            firstRow.appendChild(jobIcon);
            firstRow.appendChild(nameEl);
            firstRow.appendChild(dpsMain);
            
            // Second row: Secondary stats with labels
            const secondRow = document.createElement('div');
            secondRow.className = 'combatant-row combatant-second-row';
            
            // 4. Secondary stats with labels
            const damageEl = document.createElement('div');
            damageEl.className = 'combatant-stat combatant-damage';
            damageEl.innerHTML = `<span class="stat-label">DMG:</span> ${formatNumber(data.damage.toFixed(0), true)}`;
            
            // Crit stats combined
            const critStats = formatCritStats(data.chit, data.cdhit, data.swings);
            
            const critEl = document.createElement('div');
            critEl.className = 'combatant-stat combatant-crit';
            critEl.innerHTML = `<span class="stat-label">Crit:</span> ${critStats.ch}/${critStats.cdh}`;
            
            const maxHitEl = document.createElement('div');
            maxHitEl.className = 'combatant-stat combatant-maxhit';
            // Format maxhit: "SkillName-Damage" -> just show damage or shortened skill name
            const maxhitParts = data.maxhit.split('-');
            if (maxhitParts.length >= 2) {
                const damage = maxhitParts[maxhitParts.length - 1];
                const skillName = maxhitParts.slice(0, -1).join('-');
                if (skillName.length > 6) {
                    maxHitEl.innerHTML = `<span class="stat-label">Max:</span> ${skillName.substring(0, 6)}-${formatNumber(damage, true)}`;
                } else {
                    maxHitEl.innerHTML = `<span class="stat-label">Max:</span> ${data.maxhit}`;
                }
            } else {
                maxHitEl.innerHTML = `<span class="stat-label">Max:</span> ${formatNumber(data.maxhit, true)}`;
            }
            
            secondRow.appendChild(damageEl);
            secondRow.appendChild(critEl);
            secondRow.appendChild(maxHitEl);
            
            mainSection.appendChild(firstRow);
            mainSection.appendChild(secondRow);

            container.appendChild(graphRow);
            container.appendChild(mainSection);

            entry.dpsRow = mainSection;
            entry.dpsGraph = graphRow;
            entry.dpsContainer = container;
            entry.cells = {
                job: jobIcon,
                name: nameEl,
                dps: dpsMain,
                damage: damageEl,
                crit: critEl,
                maxhit: maxHitEl
            };
            
            dpsMeterContainer.appendChild(container);
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;

        // Update job icon if changed
        if (data.job !== prev.job && entry.cells.job) {
            const newIcon = createJobIcon(data.job);
            entry.cells.job.replaceWith(newIcon);
            entry.cells.job = newIcon;
        }

        // Only animate if cells exist
        if (entry.cells.dps) {
            animateNumber(entry.cells.dps, prev.dps || 0, data.dps);
        }
        if (entry.cells.damage) {
            // For damage, we need to update the innerHTML with the formatted number
            const formattedDamage = formatNumber(data.damage.toFixed(0), true);
            entry.cells.damage.innerHTML = `<span class="stat-label">DMG:</span> ${formattedDamage}`;
        }
        // Update crit stats with new format
        if (entry.cells.crit) {
            const critStats = formatCritStats(data.chit, data.cdhit, data.swings);
            entry.cells.crit.innerHTML = `<span class="stat-label">Crit:</span> ${critStats.ch}/${critStats.cdh}`;
        }
        // Format maxhit with new format
        if (entry.cells.maxhit && data.maxhit) {
            const maxhitParts = data.maxhit.split('-');
            if (maxhitParts.length >= 2) {
                const damage = maxhitParts[maxhitParts.length - 1];
                const skillName = maxhitParts.slice(0, -1).join('-');
                if (skillName.length > 6) {
                    entry.cells.maxhit.innerHTML = `<span class="stat-label">Max:</span> ${skillName.substring(0, 6)}-${formatNumber(damage, true)}`;
                } else {
                    entry.cells.maxhit.innerHTML = `<span class="stat-label">Max:</span> ${data.maxhit}`;
                }
            } else {
                entry.cells.maxhit.innerHTML = `<span class="stat-label">Max:</span> ${formatNumber(data.maxhit, true)}`;
            }
        }
        const relativeDps = (maxDps > 0) ? (data.dps / maxDps) * 100 : 0;
        if (entry.dpsGraph) {
            const graphFill = entry.dpsGraph.querySelector('.combatant-graph-fill');
            if (graphFill) {
                graphFill.style.width = relativeDps + '%';
            }
        }
        
        // Set job color as CSS variable
        const upperJob = (data.job || '').toUpperCase();
        const jobColors = {
            'PLD': 'rgba(133, 155, 162, 0.6)',
            'WAR': 'rgba(204, 73, 64, 0.6)',
            'DRK': 'rgba(154, 75, 87, 0.6)',
            'GNB': 'rgba(146, 131, 65, 0.6)',
            'WHM': 'rgba(193, 193, 193, 0.6)',
            'SCH': 'rgba(98, 93, 172, 0.6)',
            'AST': 'rgba(201, 117, 65, 0.6)',
            'SGE': 'rgba(137, 196, 211, 0.6)',
            'MNK': 'rgba(202, 156, 49, 0.6)',
            'DRG': 'rgba(91, 111, 232, 0.6)',
            'NIN': 'rgba(240, 89, 110, 0.6)',
            'SAM': 'rgba(232, 119, 57, 0.6)',
            'RPR': 'rgba(234, 221, 111, 0.6)',
            'VPR': 'rgba(165, 93, 67, 0.6)',
            'BRD': 'rgba(181, 201, 95, 0.6)',
            'MCH': 'rgba(69, 172, 196, 0.6)',
            'DNC': 'rgba(228, 178, 177, 0.6)',
            'BLM': 'rgba(138, 106, 189, 0.6)',
            'SMN': 'rgba(96, 133, 49, 0.6)',
            'RDM': 'rgba(200, 84, 176, 0.6)',
            'PCT': 'rgba(214, 113, 116, 0.6)',
            'BLU': 'rgba(65, 99, 189, 0.6)'
        };
        
        entry.dpsContainer.style.setProperty('--job-color', jobColors[upperJob] || 'rgba(76, 175, 80, 0.6)');
        
        // Check for rank change and add animation
        const prevRank = entry.prevData.rank;
        if (prevRank !== undefined && prevRank !== data.rank) {
            entry.dpsContainer.classList.remove('rank-up', 'rank-down');
            if (data.rank < prevRank) {
                entry.dpsContainer.classList.add('rank-up');
            } else if (data.rank > prevRank) {
                entry.dpsContainer.classList.add('rank-down');
            }
            // Remove animation class after animation completes
            setTimeout(() => {
                entry.dpsContainer.classList.remove('rank-up', 'rank-down');
            }, 500);
        }

        // Animate position change
        const currentOrder = parseInt(entry.dpsContainer.style.order) || 0;
        const newOrder = index;
        if (currentOrder !== newOrder) {
            entry.dpsContainer.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        // Set order for flexbox sorting
        entry.dpsContainer.style.order = newOrder;

        entry.prevData = { ...entry.prevData, ...data };
    });

    return presentIds;
}

function createJobIcon(job) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'combatant-job-icon-container';
    
    const upperJob = (job || '').toUpperCase();
    if (upperJob === 'LIMIT BREAK') {
        iconContainer.textContent = '';
        return iconContainer;
    }
    
    const iconName = JOB_ICON_MAP[upperJob];
    if (iconName) {
        const img = document.createElement('img');
        img.className = 'combatant-job-icon';
        img.src = `images/${iconName}`;
        iconContainer.appendChild(img);
    } else {
        iconContainer.textContent = job || '';
        iconContainer.className += ' fallback-text';
    }
    
    return iconContainer;
}

function createStatCard(label, value, type) {
    const card = document.createElement('div');
    card.className = `stat-card stat-card-${type}`;
    
    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.textContent = label;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = value;
    
    card.appendChild(labelEl);
    card.appendChild(valueEl);
    
    return card;
}

function renderHpsMeter(combatants) {
    if (!hpsMeterContainer) return new Set();
    const HEALER_JOBS = ['WHM', 'SCH', 'AST', 'SGE', 'CNJ'];
    const healers = combatants.filter(c => HEALER_JOBS.includes((c.Job || '').toUpperCase()));
    const maxHps = healers.length > 0 ? (parseFloat(healers[0].enchps) || 1) : 1;
    const presentIds = new Set();

    healers.forEach((c, index) => {
        const id = c.name;
        presentIds.add(id);
        let entry = combatantRegistry.get(id) || { cells: {}, prevData: {} };

        const healed = parseFloat(c.healed) || 0;
        const overHeal = parseFloat(c.overHeal) || 0;
        const data = {
            job: c.Job, name: c.name, hps: parseFloat(c.enchps) || 0,
            healedPct: c['healed%'], healed: healed,
            effHeal: healed - overHeal, overHeal: overHeal,
            overHealPct: '0%' // New data point
        };

        if (!entry.hpsRow) {
            const container = document.createElement('div');
            container.className = 'combatant-container';
            if (c.name === 'YOU') container.classList.add('is-you');
            
            // Background stack graph
            const graphRow = document.createElement('div');
            graphRow.className = 'combatant-graph';
            
            // Effective heal layer (bottom)
            const effHealBar = document.createElement('div');
            effHealBar.className = 'eff-heal-bar';
            
            // Overheal layer (top)
            const overHealBar = document.createElement('div');
            overHealBar.className = 'over-heal-bar';
            overHealBar.style.left = '0%'; // Initialize left position
            
            graphRow.appendChild(effHealBar);
            graphRow.appendChild(overHealBar);
            
            // Main layout with two rows
            const mainSection = document.createElement('div');
            mainSection.className = 'combatant-main-section';
            
            // First row: Icon, Name, Main HPS
            const firstRow = document.createElement('div');
            firstRow.className = 'combatant-row combatant-first-row';
            
            // 1. Job icon
            const jobIcon = createJobIcon(data.job);
            
            // 2. Name
            const nameEl = document.createElement('div');
            nameEl.className = 'combatant-name';
            nameEl.textContent = data.name;
            
            // 3. Main HPS (emphasized)
            const hpsMain = document.createElement('div');
            hpsMain.className = 'combatant-hps-main';
            hpsMain.innerHTML = `<span class="stat-label">HPS:</span> ${formatNumber(data.hps.toFixed(0))}`;
            
            firstRow.appendChild(jobIcon);
            firstRow.appendChild(nameEl);
            firstRow.appendChild(hpsMain);
            
            // Second row: Secondary stats with labels
            const secondRow = document.createElement('div');
            secondRow.className = 'combatant-row combatant-second-row';
            
            // 4. Secondary stats with labels
            const healedEl = document.createElement('div');
            healedEl.className = 'combatant-stat combatant-healed';
            healedEl.innerHTML = `<span class="stat-label">Healed:</span> ${formatNumber(data.healed.toFixed(0), true)}`;
            
            const effHealEl = document.createElement('div');
            effHealEl.className = 'combatant-stat combatant-effheal';
            effHealEl.innerHTML = `<span class="stat-label">Eff:</span> ${formatNumber(data.effHeal.toFixed(0), true)}`;
            
            const overHealEl = document.createElement('div');
            overHealEl.className = 'combatant-stat combatant-overheal';
            overHealEl.innerHTML = `<span class="stat-label">Over:</span> ${formatNumber(data.overHeal.toFixed(0), true)}`;
            
            const healPctEl = document.createElement('div');
            healPctEl.className = 'combatant-stat combatant-healpct';
            healPctEl.innerHTML = `<span class="stat-label">%</span> ${data.healedPct}`;
            
            secondRow.appendChild(healedEl);
            secondRow.appendChild(effHealEl);
            secondRow.appendChild(overHealEl);
            secondRow.appendChild(healPctEl);
            
            mainSection.appendChild(firstRow);
            mainSection.appendChild(secondRow);

            container.appendChild(graphRow);
            container.appendChild(mainSection);

            entry.hpsRow = mainSection;
            entry.hpsGraph = graphRow;
            entry.hpsContainer = container;
            entry.cells = {
                h_job: jobIcon,
                h_name: nameEl,
                hps: hpsMain,
                healed: healedEl,
                effHeal: effHealEl,
                overHeal: overHealEl,
                healPct: healPctEl
            };
            
            hpsMeterContainer.appendChild(container);
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;

        // Update job icon if changed
        if (data.job !== prev.job && entry.cells.h_job) {
            const newIcon = createJobIcon(data.job);
            entry.cells.h_job.replaceWith(newIcon);
            entry.cells.h_job = newIcon;
        }

        // Only animate if cells exist
        if (entry.cells.hps) {
            animateNumber(entry.cells.hps, prev.hps || 0, data.hps);
        }
        if (entry.cells.healed) {
            entry.cells.healed.innerHTML = `<span class="stat-label">Healed:</span> ${formatNumber(data.healed.toFixed(0), true)}`;
        }
        if (entry.cells.effHeal) {
            entry.cells.effHeal.innerHTML = `<span class="stat-label">Eff:</span> ${formatNumber(data.effHeal.toFixed(0), true)}`;
        }
        if (entry.cells.overHeal) {
            entry.cells.overHeal.innerHTML = `<span class="stat-label">Over:</span> ${formatNumber(data.overHeal.toFixed(0), true)}`;
        }
        if (entry.cells.healPct) {
            entry.cells.healPct.innerHTML = `<span class="stat-label">%</span> ${data.healedPct}`;
        }
        entry.hpsGraph.dataset.job = (data.job || '').toUpperCase();

        const relativeHps = (maxHps > 0) ? (data.hps / maxHps) * 100 : 0;
        if (entry.hpsGraph) {
            const effHealBar = entry.hpsGraph.querySelector('.eff-heal-bar');
            const overHealBar = entry.hpsGraph.querySelector('.over-heal-bar');
            
            if (effHealBar && overHealBar) {
                const totalHeal = data.healed;
                const effHeal = data.effHeal;
                const overHeal = data.overHeal;
                
                if (totalHeal > 0) {
                    const effHealPercent = (effHeal / totalHeal) * relativeHps;
                    const overHealPercent = (overHeal / totalHeal) * relativeHps;
                    
                    // Stack: effHeal is bottom, overHeal is stacked on top
                    effHealBar.style.width = effHealPercent + '%';
                    overHealBar.style.width = overHealPercent + '%';
                    overHealBar.style.left = effHealPercent + '%'; // Position overHeal on top of effHeal
                } else {
                    effHealBar.style.width = '0%';
                    overHealBar.style.width = '0%';
                    overHealBar.style.left = '0%';
                }
            }
        }
        
        // Set job color as CSS variable for healers
        const upperJob = (data.job || '').toUpperCase();
        const jobColors = {
            'WHM': 'rgba(193, 193, 193, 0.6)',
            'SCH': 'rgba(98, 93, 172, 0.6)',
            'AST': 'rgba(201, 117, 65, 0.6)',
            'SGE': 'rgba(137, 196, 211, 0.6)'
        };
        
        entry.hpsContainer.style.setProperty('--job-color', jobColors[upperJob] || 'rgba(33, 150, 243, 0.6)');

        // Animate position change
        const currentOrder = parseInt(entry.hpsContainer.style.order) || 0;
        const newOrder = index;
        if (currentOrder !== newOrder) {
            entry.hpsContainer.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        // Set order for flexbox sorting
        entry.hpsContainer.style.order = newOrder;

        entry.prevData = { ...entry.prevData, ...data };
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
            if (entry.dpsContainer) {
                entry.dpsContainer.remove();
            }
            if (entry.hpsContainer) {
                entry.hpsContainer.remove();
            }
            combatantRegistry.delete(id);
        }
    });
}