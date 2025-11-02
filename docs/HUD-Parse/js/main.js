import { sampleData, mergePetData } from './data.js';
import { updateEncounter, updateCombatantViews } from './ui.js';

// --- Main Update Function ---
function update(data) {
    if (!data || !Array.isArray(data)) return;

    // Process data - new format is already an array
    const processedCombatants = mergePetData(data, 647); // Use average duration from sample

    // Sort data
    const dpsSorted = [...processedCombatants].sort((a, b) => (parseFloat(b.encdps) || 0) - (parseFloat(a.encdps) || 0));
    const hpsSorted = [...processedCombatants].sort((a, b) => (parseFloat(b.enchps) || 0) - (parseFloat(a.enchps) || 0));

    // Update encounter with sample data
    updateEncounter({
        Encounter: {
            title: 'Sample Battle',
            duration: '10:47',
            ENCDPS: Math.round(dpsSorted.reduce((sum, c) => sum + parseFloat(c.encdps || 0), 0)).toString()
        }
    });

    // Render UI
    updateCombatantViews(dpsSorted, hpsSorted);
}

function toggleScanline() {
    const div = document.getElementsByClassName('terminal-window')[0];
    const isScanlineNowPresent = div.classList.toggle('scanline');
    localStorage.setItem('scanlineEnabled', isScanlineNowPresent);
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