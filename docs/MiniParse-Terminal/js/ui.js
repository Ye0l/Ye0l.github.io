import { JOB_ICON_MAP } from './config.js';
import { formatNumber, formatNumberK, animateNumber } from './utils.js';

// --- 설정 ---
const MAX_HISTORY = 40; // 그래프 포인트 개수
const combatantRegistry = new Map();

const JOB_COLORS = {
    'PLD': '#A8D2E6', 'WAR': '#CF2621', 'DRK': '#D126CC', 'GNB': '#796D30',
    'WHM': '#FFF0DC', 'SCH': '#8657FF', 'AST': '#FFE74A', 'SGE': '#80A0F0',
    'MNK': '#D69C00', 'DRG': '#4164CD', 'NIN': '#AF1964', 'SAM': '#E46D04', 'RPR': '#965A90', 'VPR': '#10433F',
    'BRD': '#91BA5E', 'MCH': '#6EE1D6', 'DNC': '#E2B0AF',
    'BLM': '#A579D6', 'SMN': '#2D9B78', 'RDM': '#E87B7B', 'PCT': '#FF7FBF', 'BLU': '#2459FF',
    'L.B': '#FFC636', 'LIMIT BREAK': '#FFC636'
};

// --- 메인 업데이트 함수 ---
export function updateEncounter(data) {
    const encounterEl = document.getElementById('encounter-info');
    if(encounterEl) {
        document.getElementById('encounter-title').textContent = data.Encounter.title;
        document.getElementById('enc-dps').textContent = formatNumber(data.Encounter.ENCDPS);
        document.getElementById('enc-time').textContent = data.Encounter.duration;
    }
}

export function updateCombatantViews(dpsData, hpsData) {
    const dpsContainer = document.getElementById('dps-output');
    if (!dpsContainer) return;

    // 파티 최고 DPS 구하기
    let partyMaxDps = 0;
    if (dpsData.length > 0) {
        partyMaxDps = parseFloat(dpsData[0].encdps) || 1;
    }

    const presentIds = new Set();

    dpsData.forEach((c, index) => {
        const id = c.name;
        presentIds.add(id);

        let entry = combatantRegistry.get(id);
        
        // 신규 등록
        if (!entry) {
            entry = createCombatantEntry(id, c);
            dpsContainer.appendChild(entry.card);
            
            const svg = document.getElementById('main-graph');
            if (svg) svg.appendChild(entry.graphLine);
            
            combatantRegistry.set(id, entry);
        }

        const currentDps = parseFloat(c.encdps) || 0;
        const data = {
            dps: currentDps,
            damage: parseFloat(c.damage) || 0,
            critPct: c['crithit%'],
            dhPct: c.DirectHitPct,
            maxHit: c.maxhit,
            deaths: c.deaths
        };

        // 히스토리 저장
        entry.history.push(currentDps);
        if (entry.history.length > MAX_HISTORY) entry.history.shift();

        // UI 업데이트
        updateCard(entry, data, partyMaxDps);
        updateGraphLine(entry.graphLine, entry.history, partyMaxDps);
        
        // 순서 정렬
        entry.card.style.order = index;
    });

    // 삭제된 유저 정리
    combatantRegistry.forEach((entry, id) => {
        if (!presentIds.has(id)) {
            entry.card.remove();
            entry.graphLine.remove();
            combatantRegistry.delete(id);
        }
    });
}

// --- 헬퍼 함수들 ---

function createCombatantEntry(id, c) {
    const upperJob = (c.Job || '').toUpperCase();
    const isYou = (c.name === 'YOU');
    const jobColor = JOB_COLORS[upperJob] || '#888';

    // 1. 카드 생성
    const card = document.createElement('div');
    card.className = 'combatant-card';
    if (isYou) card.classList.add('is-you');

    // 배경 막대 그래프
    const bar = document.createElement('div');
    bar.className = 'bar-graph';
    bar.style.setProperty('--job-color', jobColor);
    card.appendChild(bar);

    // 아이콘
    const iconName = JOB_ICON_MAP[upperJob] || 'error.png';
    const iconImg = document.createElement('img');
    iconImg.className = 'job-icon';
    if (JOB_ICON_MAP[upperJob]) iconImg.src = `images/${iconName}`;
    card.appendChild(iconImg);

    // 정보 텍스트
    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `
        <div class="name-group">
            <div class="c-name">${c.name}</div>
        </div>
        <div class="stats-group">
            <div class="stat-cell" style="min-width: 50px;">
                <span class="stat-val val-dps">0</span>
                <span class="stat-sub">DPS</span>
            </div>
            <div class="stat-cell">
                <span class="stat-val val-crit">0%</span>
                <span class="stat-sub">Crit</span>
            </div>
            <div class="stat-cell">
                <span class="stat-val val-dh">0%</span>
                <span class="stat-sub">DH</span>
            </div>
             <div class="stat-cell">
                <span class="stat-val val-death">0</span>
                <span class="stat-sub">Die</span>
            </div>
        </div>
    `;
    card.appendChild(info);

    // 2. 꺾은선 그래프 (SVG Line) 생성
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.classList.add('graph-line');
    if (isYou) line.classList.add('is-you');
    line.style.stroke = jobColor;
    
    return {
        card: card,
        bar: bar,
        graphLine: line,
        history: [],
        els: {
            dps: info.querySelector('.val-dps'),
            crit: info.querySelector('.val-crit'),
            dh: info.querySelector('.val-dh'),
            death: info.querySelector('.val-death')
        },
        prevDps: 0
    };
}

function updateCard(entry, data, partyMaxDps) {
    animateNumber(entry.els.dps, entry.prevDps, data.dps);
    entry.prevDps = data.dps;

    entry.els.crit.textContent = data.critPct;
    entry.els.dh.textContent = data.dhPct;
    entry.els.death.textContent = data.deaths;
    
    if (parseInt(data.deaths) > 0) entry.els.death.style.color = '#ff5555';
    else entry.els.death.style.color = '#eee';

    const widthPct = partyMaxDps > 0 ? (data.dps / partyMaxDps) * 100 : 0;
    entry.bar.style.width = `${Math.min(100, Math.max(0, widthPct))}%`;
}

function updateGraphLine(lineEl, history, maxDps) {
    if (history.length < 2) return;

    const width = 100;
    const height = 100;
    
    // 여백을 10으로 줄여서 그래프를 더 크게 그림 (높이가 늘어났으므로 안전)
    const paddingY = 10; 
    const drawHeight = height - (paddingY * 2); 

    const points = history.map((val, i) => {
        const x = (i / (MAX_HISTORY - 1)) * width;
        
        const ratio = maxDps > 0 ? (val / maxDps) : 0;
        const y = (height - paddingY) - (ratio * drawHeight);
        
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    lineEl.setAttribute('points', points);
}