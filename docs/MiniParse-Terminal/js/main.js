import { sampleData, mergePetData } from './data.js';
import { updateEncounter, updateCombatantViews } from './ui.js';
import { formatNumberK } from './utils.js';

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


async function captureToClipboard() {
    const captureBtn = document.getElementById('capture-btn');
    const originalText = captureBtn.textContent;
    try {
        const element = document.querySelector('.terminal-window');
        const isResizable = document.documentElement.classList.contains("resizeHandle");
        if (isResizable) {
            document.documentElement.classList.remove("resizeHandle");
        }

        captureBtn.textContent = '[CAPTURING...]';

        const canvas = await html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        if (isResizable) {
            document.documentElement.classList.add("resizeHandle");
        }

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                captureBtn.textContent = '[COPIED!]';
            } catch (err) {
                console.error('Error copying to clipboard.', err);
                captureBtn.textContent = '[FAILED!]';
            } finally {
                setTimeout(() => {
                    captureBtn.textContent = originalText;
                }, 2000);
            }
        }, 'image/png');
    } catch (err) {
        console.error('Error using html2canvas.', err);
        captureBtn.textContent = '[FAILED!]';
        setTimeout(() => {
            captureBtn.textContent = originalText;
        }, 2000);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Disable right-click context menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    const sampleBtn = document.getElementById('sample-data-btn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', () => update(sampleData));
    }
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
        captureBtn.addEventListener('click', captureToClipboard);
    }
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