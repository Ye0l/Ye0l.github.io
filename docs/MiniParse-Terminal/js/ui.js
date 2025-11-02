import { JOB_ICON_MAP } from './config.js';
import { formatNumber, formatNumberK, animateNumber, animateWidth, createGraphBar } from './utils.js';

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

    dpsMeterContainer = createMeterContainer('⚔ DAMAGE');
    dpsOutput.appendChild(dpsMeterContainer);

    hpsMeterContainer = createMeterContainer('✚ HEALING');
    dpsOutput.appendChild(hpsMeterContainer); // Add HPS container to same output
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

    combatants.forEach((c, index) => {
        const id = c.name;
        presentIds.add(id);
        let entry = combatantRegistry.get(id) || { cells: {}, prevData: {} };

        const data = {
            job: c.Job, name: c.name, dps: parseFloat(c.encdps) || 0,
            damagePct: c['damage%'], damage: parseFloat(c.damage) || 0,
            swings: c.swings, dhit: c.DirectHitPct, chit: c['crithit%'],
            cdhit: c.CritDirectHitPct, deaths: c.deaths,
            maxhit: (c.maxhit || '-').split('-').length > 1 ? `${(c.maxhit || '-').split('-')[0]}-${formatNumber((c.maxhit || '-').split('-')[1])}` : c.maxhit,
        };

        if (!entry.dpsCard) {
            const card = document.createElement('div');
            card.className = 'combatant-card';
            card.dataset.job = (data.job || '').toUpperCase();
            if (c.name === 'YOU') card.classList.add('is-you');

            // Header with job icon, name and inline stats
            const header = document.createElement('div');
            header.className = 'combatant-header';

            const iconCell = createCell(null, { isIcon: true, job: data.job });
            const nameCell = document.createElement('div');
            nameCell.className = 'combatant-name';
            nameCell.textContent = data.name;

            // Inline stats (right side of name)
            const inlineStats = document.createElement('div');
            inlineStats.className = 'combatant-stats-inline';

            const inlineStatItems = [
                { label: 'DPS', value: formatNumber(data.dps.toFixed(0)) },
                { label: 'DMG%', value: data.damagePct || '0' },
                { label: 'Damage', value: formatNumberK(data.damage) || '0' },
                { label: 'D.HIT', value: data.dhit || '0' },
                { label: 'C.HIT', value: data.chit || '0' },
                { label: 'C.D.HIT', value: data.cdhit || '0' },
                { label: 'Swing', value: data.swings || '0' },
                { label: 'MaxHit', value: data.maxhit, isMaxHit: true },
                { label: 'Deaths', value: data.deaths || '0' }
            ];

            inlineStatItems.forEach((item, index) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                statItem.style.display = 'flex';
                statItem.style.flexDirection = 'column';
                statItem.style.alignItems = 'center';
                statItem.style.minWidth = '20px';

                const label = document.createElement('span');
                label.className = 'stat-label';
                label.textContent = item.label;
                label.style.marginBottom = '1px';

                if (item.isMaxHit) {
                    // Parse MaxHit into skill name and damage
                    let skillName = '-';
                    let damageValue = '-';
                    if (item.value && item.value !== '-') {
                        const parts = item.value.split('-');
                        if (parts.length === 2) {
                            skillName = parts[0];
                            damageValue = parts[1];
                        } else {
                            skillName = item.value;
                        }
                    }

                    const maxHitContent = document.createElement('div');
                    maxHitContent.style.display = 'flex';
                    maxHitContent.style.alignItems = 'center';
                    maxHitContent.style.gap = '4px';

                    const maxHitSkill = document.createElement('span');
                    maxHitSkill.className = 'stat-value';
                    maxHitSkill.style.color = '#87CEEB'; // Sky blue for skill name
                    maxHitSkill.style.fontStyle = 'italic';
                    maxHitSkill.style.fontSize = '10px';
                    maxHitSkill.textContent = skillName;

                    const maxHitDamage = document.createElement('span');
                    maxHitDamage.className = 'stat-value';
                    maxHitDamage.textContent = damageValue;

                    maxHitContent.appendChild(maxHitSkill);
                    maxHitContent.appendChild(maxHitDamage);

                    statItem.appendChild(label);
                    statItem.appendChild(maxHitContent);
                } else {
                    const value = document.createElement('span');
                    value.className = 'stat-value';
                    value.textContent = item.value;

                    statItem.appendChild(label);
                    statItem.appendChild(value);
                }

                inlineStats.appendChild(statItem);

                // Add divider except after last item
                if (index < inlineStatItems.length - 1) {
                    const divider = document.createElement('div');
                    divider.className = 'stat-divider';
                    inlineStats.appendChild(divider);
                }
            });

            header.appendChild(iconCell);
            header.appendChild(nameCell);
            header.appendChild(inlineStats);

            card.appendChild(header);

            entry.dpsCard = card;
            entry.cells = {
                jobIcon: iconCell
            };

            dpsMeterContainer.appendChild(card);
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;

        // Update job icon if changed
        if (data.job !== prev.job) {
            const iconCell = entry.cells.jobIcon;
            iconCell.innerHTML = ''; // Clear previous content
            const upperJob = (data.job || '').toUpperCase();
            if (upperJob !== 'LIMIT BREAK') {
                const iconName = JOB_ICON_MAP[upperJob];
                if (iconName) {
                    const img = document.createElement('img');
                    img.className = 'job-icon';
                    img.src = `images/${iconName}`;
                    iconCell.appendChild(img);
                } else {
                    iconCell.textContent = data.job; // Fallback
                }
            }
        }

        // Update inline stats (right side of name)
        const inlineStatElements = entry.dpsCard.querySelector('.combatant-stats-inline').querySelectorAll('.stat-item');
        if (inlineStatElements[0]) {
            // DPS with animation (moved to front)
            const dpsElement = inlineStatElements[0].querySelector('.stat-value');
            animateNumber(dpsElement, prev.dps || 0, data.dps);
        }
        if (inlineStatElements[1]) {
            // Damage% with animation
            const damagePctElement = inlineStatElements[1].querySelector('.stat-value');
            const prevDamagePct = parseFloat(prev.damagePct) || 0;
            const currentDamagePct = parseFloat(data.damagePct) || 0;
            if (Math.abs(currentDamagePct - prevDamagePct) >= 0.1) {
                animateNumber(damagePctElement, prevDamagePct, currentDamagePct, 1000, 'percent');
            } else {
                damagePctElement.textContent = currentDamagePct.toFixed(1) + '%';
            }
        }
        if (inlineStatElements[2]) {
            // Damage with animation (K format)
            const damageElement = inlineStatElements[2].querySelector('.stat-value');
            const prevDamage = prev.damage || 0;
            if (Math.abs(data.damage - prevDamage) > 1) {
                animateNumber(damageElement, prevDamage, data.damage, 1000, 'k');
            } else {
                damageElement.textContent = formatNumberK(data.damage) || '0';
            }
        }
        if (inlineStatElements[3]) {
            // D.HIT with animation
            const dhitElement = inlineStatElements[3].querySelector('.stat-value');
            const prevDhit = parseFloat(prev.dhit) || 0;
            const currentDhit = parseFloat(data.dhit) || 0;
            if (Math.abs(currentDhit - prevDhit) >= 0.1) {
                animateNumber(dhitElement, prevDhit, currentDhit, 1000, 'percent');
            } else {
                dhitElement.textContent = currentDhit.toFixed(1) + '%';
            }
        }
        if (inlineStatElements[4]) {
            // C.HIT with animation
            const chitElement = inlineStatElements[4].querySelector('.stat-value');
            const prevChit = parseFloat(prev.chit) || 0;
            const currentChit = parseFloat(data.chit) || 0;
            if (Math.abs(currentChit - prevChit) >= 0.1) {
                animateNumber(chitElement, prevChit, currentChit, 1000, 'percent');
            } else {
                chitElement.textContent = currentChit.toFixed(1) + '%';
            }
        }
        if (inlineStatElements[5]) {
            // C.D.HIT with animation
            const cdhitElement = inlineStatElements[5].querySelector('.stat-value');
            const prevCdhit = parseFloat(prev.cdhit) || 0;
            const currentCdhit = parseFloat(data.cdhit) || 0;
            if (Math.abs(currentCdhit - prevCdhit) >= 0.1) {
                animateNumber(cdhitElement, prevCdhit, currentCdhit, 1000, 'percent');
            } else {
                cdhitElement.textContent = currentCdhit.toFixed(1) + '%';
            }
        }
        if (inlineStatElements[6]) {
            // Swings with animation
            const swingsElement = inlineStatElements[6].querySelector('.stat-value');
            const prevSwings = parseInt(prev.swings) || 0;
            const currentSwings = parseInt(data.swings) || 0;
            if (currentSwings !== prevSwings) {
                animateNumber(swingsElement, prevSwings, currentSwings);
            }
        }
        if (inlineStatElements[7]) {
            // MaxHit (moved before Deaths) - separate skill and damage styling
            let skillName = '-';
            let damageValue = '-';
            if (data.maxhit && data.maxhit !== '-') {
                const parts = data.maxhit.split('-');
                if (parts.length === 2) {
                    skillName = parts[0];
                    damageValue = parts[1];
                } else {
                    skillName = data.maxhit;
                }
            }
            const maxHitContainer = inlineStatElements[7].querySelector('div');
            if (maxHitContainer) {
                const maxHitElements = maxHitContainer.querySelectorAll('.stat-value');
                if (maxHitElements[0]) maxHitElements[0].textContent = skillName;
                if (maxHitElements[1]) {
                    // MaxHit damage with animation
                    const prevMaxHitParts = (prev.maxhit || '-').split('-');
                    let prevDamage = 0;
                    if (prevMaxHitParts.length === 2) {
                        // Remove any commas and parse as number
                        prevDamage = parseFloat(prevMaxHitParts[1].replace(/,/g, '')) || 0;
                    }

                    let currentDamage = 0;
                    if (damageValue !== '-') {
                        currentDamage = parseFloat(damageValue.replace(/,/g, '')) || 0;
                    }

                    if (Math.abs(currentDamage - prevDamage) >= 1) {
                        animateNumber(maxHitElements[1], prevDamage, currentDamage);
                    } else {
                        maxHitElements[1].textContent = damageValue;
                    }
                }
            }
        }
        if (inlineStatElements[8]) inlineStatElements[8].querySelector('.stat-value').textContent = data.deaths || '0';

        // Update graph background
        if (entry.dpsCard) {
            const relativeDps = (maxDps > 0) ? (data.dps / maxDps) * 100 : 0;

            // Set background gradient based on job color and DPS percentage
            const job = (data.job || '').toUpperCase();
            const jobColors = {
                'PLD': 'rgba(133, 155, 162, 0.4)',
                'WAR': 'rgba(204, 73, 64, 0.4)',
                'DRK': 'rgba(154, 75, 87, 0.4)',
                'GNB': 'rgba(146, 131, 65, 0.4)',
                'WHM': 'rgba(193, 193, 193, 0.4)',
                'SCH': 'rgba(98, 93, 172, 0.4)',
                'AST': 'rgba(201, 117, 65, 0.4)',
                'SGE': 'rgba(137, 196, 211, 0.4)',
                'MNK': 'rgba(202, 156, 49, 0.4)',
                'DRG': 'rgba(91, 111, 232, 0.4)',
                'NIN': 'rgba(240, 89, 110, 0.4)',
                'SAM': 'rgba(232, 119, 57, 0.4)',
                'RPR': 'rgba(234, 221, 111, 0.4)',
                'VPR': 'rgba(165, 93, 67, 0.4)',
                'BRD': 'rgba(181, 201, 95, 0.4)',
                'MCH': 'rgba(69, 172, 196, 0.4)',
                'DNC': 'rgba(228, 178, 177, 0.4)',
                'BLM': 'rgba(138, 106, 189, 0.4)',
                'SMN': 'rgba(96, 133, 49, 0.4)',
                'RDM': 'rgba(200, 84, 176, 0.4)',
                'PCT': 'rgba(214, 113, 116, 0.4)',
                'BLU': 'rgba(65, 99, 189, 0.4)',
                'LIMIT BREAK': 'rgba(255, 215, 0, 0.5)'
            };

            const jobColor = jobColors[job] || 'rgba(100, 100, 100, 0.4)';
            const graphWidth = Math.min(relativeDps, 100);

            // Create smooth width animation for graph
            const graphBar = entry.dpsCard.querySelector('.graph-bar') || createGraphBar(entry.dpsCard);
            graphBar.style.setProperty('--graph-color', jobColor);

            // Animate width
            const currentWidth = parseFloat(graphBar.style.width) || 0;
            const targetWidth = Math.min(relativeDps, 100);

            animateWidth(graphBar, currentWidth, targetWidth, 800);
        }

        // Set order for flexbox sorting with smooth animation
        if (entry.dpsCard) {
            const prevOrder = entry.prevOrder || index;

            if (prevOrder !== index) {
                // Rank changed - trigger animation
                entry.dpsCard.style.transform = 'scale(1.02)';
                entry.dpsCard.style.boxShadow = '0 4px 12px rgba(100, 150, 255, 0.3)';

                // Set order first, then clear animation
                entry.dpsCard.style.order = index;

                setTimeout(() => {
                    if (entry.dpsCard) {
                        entry.dpsCard.style.transform = '';
                        entry.dpsCard.style.boxShadow = '';
                    }
                }, 200);
            } else {
                // No rank change, just set order
                entry.dpsCard.style.order = index;
            }
            entry.prevOrder = index;
        }

        entry.prevData = { ...entry.prevData, ...data };
    });

    return presentIds;
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
            overHealPct: c.OverHealPct || '0%'
        };

        if (!entry.hpsCard) {
            const card = document.createElement('div');
            card.className = 'combatant-card';
            card.dataset.job = (data.job || '').toUpperCase();
            if (c.name === 'YOU') card.classList.add('is-you');

            // Header with job icon, name and inline stats
            const header = document.createElement('div');
            header.className = 'combatant-header';

            const iconCell = createCell(null, { isIcon: true, job: data.job });
            const nameCell = document.createElement('div');
            nameCell.className = 'combatant-name';
            nameCell.textContent = data.name;

            // Inline stats (right side of name)
            const inlineStats = document.createElement('div');
            inlineStats.className = 'combatant-stats-inline';

            const inlineStatItems = [
                { label: 'HPS', value: formatNumber(data.hps.toFixed(0)) },
                { label: 'HEAL%', value: data.healedPct || '0' },
                { label: 'Healed', value: formatNumberK(data.healed) || '0' },
                { label: 'EffHeal', value: formatNumberK(data.effHeal) || '0' },
                { label: 'OverHeal', value: formatNumberK(data.overHeal) || '0' },
                { label: 'OverHeal%', value: data.overHealPct || '0' }
            ];

            inlineStatItems.forEach((item, index) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                statItem.style.display = 'flex';
                statItem.style.flexDirection = 'column';
                statItem.style.alignItems = 'center';
                statItem.style.minWidth = '20px';

                const label = document.createElement('span');
                label.className = 'stat-label';
                label.textContent = item.label;
                label.style.marginBottom = '1px';

                const value = document.createElement('span');
                value.className = 'stat-value';
                value.textContent = item.value;

                statItem.appendChild(label);
                statItem.appendChild(value);
                inlineStats.appendChild(statItem);

                // Add divider except after last item
                if (index < inlineStatItems.length - 1) {
                    const divider = document.createElement('div');
                    divider.className = 'stat-divider';
                    inlineStats.appendChild(divider);
                }
            });

            header.appendChild(iconCell);
            header.appendChild(nameCell);
            header.appendChild(inlineStats);

            card.appendChild(header);

            entry.hpsCard = card;
            entry.hpsCells = {
                jobIcon: iconCell
            };

            hpsMeterContainer.appendChild(card);
            combatantRegistry.set(id, entry);
        }

        const prev = entry.prevData;

        // Update job icon if changed
        if (data.job !== prev.job) {
            const iconCell = entry.hpsCells.jobIcon;
            iconCell.innerHTML = ''; // Clear previous content
            const upperJob = (data.job || '').toUpperCase();
            if (upperJob !== 'LIMIT BREAK') {
                const iconName = JOB_ICON_MAP[upperJob];
                if (iconName) {
                    const img = document.createElement('img');
                    img.className = 'job-icon';
                    img.src = `images/${iconName}`;
                    iconCell.appendChild(img);
                } else {
                    iconCell.textContent = data.job; // Fallback
                }
            }
        }

        // Update HPS inline stats
        const inlineStatElements = entry.hpsCard.querySelector('.combatant-stats-inline').querySelectorAll('.stat-item');
        if (inlineStatElements[0]) {
            // HPS with animation
            const hpsElement = inlineStatElements[0].querySelector('.stat-value');
            animateNumber(hpsElement, prev.hps || 0, data.hps);
        }
        if (inlineStatElements[1]) {
            // HEAL% with animation
            const healedPctElement = inlineStatElements[1].querySelector('.stat-value');
            const prevHealedPct = parseFloat(prev.healedPct) || 0;
            const currentHealedPct = parseFloat(data.healedPct) || 0;
            if (Math.abs(currentHealedPct - prevHealedPct) >= 0.1) {
                animateNumber(healedPctElement, prevHealedPct, currentHealedPct, 1000, 'percent');
            } else {
                healedPctElement.textContent = currentHealedPct.toFixed(1) + '%';
            }
        }
        if (inlineStatElements[2]) {
            // Healed with animation (K format)
            const healedElement = inlineStatElements[2].querySelector('.stat-value');
            const prevHealed = prev.healed || 0;
            if (Math.abs(data.healed - prevHealed) > 1) {
                animateNumber(healedElement, prevHealed, data.healed, 1000, 'k');
            } else {
                healedElement.textContent = formatNumberK(data.healed) || '0';
            }
        }
        if (inlineStatElements[3]) {
            // EffHeal with animation (K format)
            const effHealElement = inlineStatElements[3].querySelector('.stat-value');
            const prevEffHeal = prev.effHeal || 0;
            if (Math.abs(data.effHeal - prevEffHeal) > 1) {
                animateNumber(effHealElement, prevEffHeal, data.effHeal, 1000, 'k');
            } else {
                effHealElement.textContent = formatNumberK(data.effHeal) || '0';
            }
        }
        if (inlineStatElements[4]) {
            // OverHeal with animation (K format)
            const overHealElement = inlineStatElements[4].querySelector('.stat-value');
            const prevOverHeal = prev.overHeal || 0;
            if (Math.abs(data.overHeal - prevOverHeal) > 1) {
                animateNumber(overHealElement, prevOverHeal, data.overHeal, 1000, 'k');
            } else {
                overHealElement.textContent = formatNumberK(data.overHeal) || '0';
            }
        }
        if (inlineStatElements[5]) {
            // OverHeal% with animation
            const overHealPctElement = inlineStatElements[5].querySelector('.stat-value');
            const prevOverHealPct = parseFloat(prev.overHealPct) || 0;
            const currentOverHealPct = parseFloat(data.overHealPct) || 0;
            if (Math.abs(currentOverHealPct - prevOverHealPct) >= 0.1) {
                animateNumber(overHealPctElement, prevOverHealPct, currentOverHealPct, 1000, 'percent');
            } else {
                overHealPctElement.textContent = currentOverHealPct.toFixed(1) + '%';
            }
        }

        // Update graph background for HPS with overheal
        if (entry.hpsCard) {
            const relativeHps = (maxHps > 0) ? (data.hps / maxHps) * 100 : 0;

            // Calculate overheal percentage
            const totalHealing = Math.max(data.healed || 1, 1);
            const effectiveHealing = Math.max(data.effHeal || 0, 0);
            const overhealing = Math.max(data.overHeal || 0, 0);

            const effPercentage = (effectiveHealing / totalHealing) * 100;
            const overPercentage = (overhealing / totalHealing) * 100;

            // Create smooth width animation for HPS graph with overheal
            const graphBar = entry.hpsCard.querySelector('.graph-bar') || createGraphBar(entry.hpsCard);

            // For healers, use stacked approach: total width for HPS, color composition for overheal
            const totalWidth = Math.min(relativeHps, 100);

            // Create gradient for effective heal vs overheal
            const effWidthPercent = effPercentage / 100;
            const healGradient = `linear-gradient(90deg,
                rgba(100, 200, 100, 0.6) 0%,
                rgba(100, 200, 100, 0.6) ${effWidthPercent * 100}%,
                rgba(255, 150, 150, 0.6) ${effWidthPercent * 100}%,
                rgba(255, 150, 150, 0.6) 100%)`;

            graphBar.style.setProperty('--graph-color', healGradient);

            // Animate width
            const currentWidth = parseFloat(graphBar.style.width) || 0;
            animateWidth(graphBar, currentWidth, totalWidth, 800);
        }

        // Set order for flexbox sorting with smooth animation
        if (entry.hpsCard) {
            const prevOrder = entry.prevHpsOrder || index;

            if (prevOrder !== index) {
                // Rank changed - trigger animation
                entry.hpsCard.style.transform = 'scale(1.02)';
                entry.hpsCard.style.boxShadow = '0 4px 12px rgba(100, 200, 255, 0.3)';

                // Set order first, then clear animation
                entry.hpsCard.style.order = index;

                setTimeout(() => {
                    if (entry.hpsCard) {
                        entry.hpsCard.style.transform = '';
                        entry.hpsCard.style.boxShadow = '';
                    }
                }, 200);
            } else {
                // No rank change, just set order
                entry.hpsCard.style.order = index;
            }
            entry.prevHpsOrder = index;
        }

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
            if (entry.dpsCard) {
                entry.dpsCard.remove();
            }
            if (entry.hpsCard) {
                entry.hpsCard.remove();
            }
            combatantRegistry.delete(id);
        }
    });
}