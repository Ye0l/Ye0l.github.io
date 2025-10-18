
import { JOB_ICON_MAP } from './config.js';
import { formatNumber, parseActFormat } from './utils.js';

function createCell(content, options = {}) {
    const cell = document.createElement('span');
    if (options.isIcon) {
        const iconName = JOB_ICON_MAP[options.job.toUpperCase()];
        if (iconName) {
            const img = document.createElement('img');
            img.className = 'job-icon';
            img.src = `images/${iconName}`;
            cell.appendChild(img);
        } else {
            cell.textContent = options.job; // Fallback to text
        }
    } else {
        cell.textContent = content || '0';
    }
    return cell;
}

function renderDpsMeter(container, combatants) {
    const dpsMeter = document.createElement('div');
    dpsMeter.className = 'dps-meter';

    const title = document.createElement('div');
    title.className = 'meter-title';
    title.textContent = '[DAMAGE DONE]';
    dpsMeter.appendChild(title);

    const header = document.createElement('div');
    header.className = 'grid-header';
    header.style.gridTemplateColumns = '30px 1fr 70px 50px 80px 60px 60px 60px 60px 140px 50px';
    ['Job', 'Name', 'DPS', 'DMG%', 'Damage', 'Swing', 'D.HIT', 'C.HIT', 'C.D.HIT', 'MaxHit', 'Death'].forEach(text => {
        header.appendChild(createCell(text));
    });
    dpsMeter.appendChild(header);

    const maxDps = combatants.length > 0 ? (parseFloat(combatants[0].encdps) || 1) : 1;

    for (const c of combatants) {
        const textRow = document.createElement('div');
        textRow.className = 'grid-row';
        textRow.style.gridTemplateColumns = header.style.gridTemplateColumns;
        if (c.name === 'YOU') textRow.classList.add('is-you');
        
        const maxHitSplit = (c.maxhit || '-').split('-');
        const maxHitFormatted = maxHitSplit.length > 1 ? `${maxHitSplit[0]}-${formatNumber(maxHitSplit[1])}` : c.maxhit;

        textRow.appendChild(createCell(c.Job, { isIcon: true, job: c.Job }));
        textRow.appendChild(createCell(c.name));
        textRow.appendChild(createCell(formatNumber(c.encdps)));
        textRow.appendChild(createCell(c['damage%']));
        textRow.appendChild(createCell(formatNumber(c.damage)));
        textRow.appendChild(createCell(c.swings));
        textRow.appendChild(createCell(c.DirectHitCount));
        textRow.appendChild(createCell(c.CriticalHitCount));
        textRow.appendChild(createCell(c.CritDirectHitCount));
        textRow.appendChild(createCell(maxHitFormatted));
        textRow.appendChild(createCell(c.deaths));
        
        dpsMeter.appendChild(textRow);

        const graphRow = document.createElement('div');
        graphRow.className = 'dps-graph-container';
        graphRow.dataset.job = (c.Job || '').toUpperCase();

        const percentBar = document.createElement('div');
        percentBar.className = 'percent-bar';
        const relativeDps = (maxDps > 0) ? ((parseFloat(c.encdps) || 0) / maxDps) * 100 : 0;
        percentBar.style.width = relativeDps + '%';
        
        graphRow.appendChild(percentBar);
        dpsMeter.appendChild(graphRow);
    }
    container.appendChild(dpsMeter);
}

function renderHpsMeter(container, combatants) {
    const HEALER_JOBS = ['WHM', 'SCH', 'AST', 'SGE'];
    const hpsMeter = document.createElement('div');
    hpsMeter.className = 'hps-meter';

    const title = document.createElement('div');
    title.className = 'meter-title';
    title.textContent = '[HEALING]';
    hpsMeter.appendChild(title);

    const header = document.createElement('div');
    header.className = 'grid-header';
    header.style.gridTemplateColumns = '30px 1fr 70px 50px 80px 80px 80px 80px';
    ['Job', 'Name', 'HPS', 'H%', 'Healed', 'Eff.Heal', 'Shield', 'OverHeal'].forEach(text => {
        header.appendChild(createCell(text));
    });
    hpsMeter.appendChild(header);

    const healers = combatants.filter(c => HEALER_JOBS.includes((c.Job || '').toUpperCase()));

    for (const c of healers) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.style.gridTemplateColumns = header.style.gridTemplateColumns;
        if (c.name === 'YOU') row.classList.add('is-you');
        row.dataset.job = (c.Job || '').toUpperCase();

        const healed = parseFloat(c.healed) || 0;
        const overHeal = parseFloat(c.overHeal) || 0;
        const effHeal = healed - overHeal;

        row.appendChild(createCell(c.Job, { isIcon: true, job: c.Job }));
        row.appendChild(createCell(c.name));
        row.appendChild(createCell(formatNumber(c.enchps)));
        row.appendChild(createCell(c['healed%']));
        row.appendChild(createCell(formatNumber(c.healed)));
        row.appendChild(createCell(formatNumber(effHeal.toFixed(0))));
        row.appendChild(createCell('N/A'));
        row.appendChild(createCell(formatNumber(overHeal)));

        const barContainer = document.createElement('div');
        barContainer.className = 'stacked-bar-container';
        
        const effHealPct = (healed > 0) ? (effHeal / healed) * 100 : 0;
        const overHealPct = (healed > 0) ? (overHeal / healed) * 100 : 0;

        const effBar = document.createElement('div');
        effBar.className = 'eff-heal-bar';
        effBar.style.width = effHealPct + '%';
        barContainer.appendChild(effBar);

        const overBar = document.createElement('div');
        overBar.className = 'over-heal-bar';
        overBar.style.width = overHealPct + '%';
        barContainer.appendChild(overBar);

        // barContainer.appendChild(barContainer);
        
        hpsMeter.appendChild(row);
        hpsMeter.appendChild(barContainer);
    }
    container.appendChild(hpsMeter);
}

export function updateEncounter(data) {
    const encounterEl = document.getElementById('encounter');
    if(encounterEl) encounterEl.innerHTML = parseActFormat(`
        <div id="encounter-stats">
            <span id="encounter-title">{title}</span>
            <span class="stat-item">ENCDPS: <span id="enc-dps">{ENCDPS}</span></span>
            <span class="stat-item"><span id="enc-time">{duration}</span></span>
        </div>
        `, data.Encounter);
    // if(encounterEl) encounterEl.innerHTML = parseActFormat(`{title} -- DURATION: {duration} -- ENCDPS: {ENCDPS}`, data.Encounter);
}

export function updateCombatantViews(dpsData, hpsData) {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    output.innerHTML = ''; // Clear previous content

    renderDpsMeter(output, dpsData);
    renderHpsMeter(output, hpsData);
}
