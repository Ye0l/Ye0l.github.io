
import { sampleData, mergePetData } from './data.js';
import { updateEncounter, updateCombatantViews } from './ui.js';

// --- Main Update Function ---
function update(data) {
    if (!data || !data.Encounter || !data.Combatant) return;

    // Process data
    updateEncounter(data);
    const duration = parseFloat(data.Encounter.duration) || 1;
    const processedCombatants = mergePetData(Object.values(data.Combatant), duration);

    // Sort data
    const dpsSorted = [...processedCombatants].sort((a, b) => (parseFloat(b.encdps) || 0) - (parseFloat(a.encdps) || 0));
    const hpsSorted = [...processedCombatants].sort((a, b) => (parseFloat(b.enchps) || 0) - (parseFloat(a.enchps) || 0));

    // Render UI
    updateCombatantViews(dpsSorted, hpsSorted);
}

function toggleScanline() {
    const div = document.getElementsByClassName('terminal-window')[0];
    if(div.classList.contains('scanline')) {
        div.classList.remove('scanline');
    } else {
        div.classList.add('scanline');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const sampleBtn = document.getElementById('sample-data-btn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', () => update(sampleData));
    }
    const scanlienBtn = document.getElementById('scanline-btn');
    scanlienBtn.addEventListener('click', () => toggleScanline())
    // Initial load with sample data
    update(sampleData);
});

document.addEventListener("onOverlayStateUpdate", e => {
    if (!e.detail.isLocked) {
        document.documentElement.classList.add("resizeHandle");
    } else {
        document.documentElement.classList.remove("resizeHandle");
    }
});

addOverlayListener("CombatData", e => update(e));
startOverlayEvents();
