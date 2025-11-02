export function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    const n = parseFloat(num);
    if (isNaN(n)) return num.toString();
    return n.toLocaleString('en-US');
}

export function formatNumberK(num) {
    if (num === undefined || num === null) return '0';
    const n = parseFloat(num);
    if (isNaN(n)) return num.toString();

    if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'k';
    }
    return n.toLocaleString('en-US');
}

export function parseActFormat(str, dictionary) {
    if (!dictionary) return str;
    return str.replace(/\{(\w+|\w+%)\}/g, (match, key) => {
        if (key === 'ENCDPS') {
            return formatNumber(dictionary[key]) || '0';
        }
        return dictionary[key] || '0';
    });
}

export function animateNumber(element, start, end, duration = 1000, format = 'number') {
    const startTime = performance.now();
    const change = end - start;

    // If there's no change, just set the final value and return.
    if (change === 0) {
        const formattedEnd = formatValue(end, format);
        if (element.textContent !== formattedEnd) {
            element.textContent = formattedEnd;
        }
        return;
    }

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;

        if (elapsedTime >= duration) {
            element.textContent = formatValue(end, format);
            return;
        }

        const progress = elapsedTime / duration;
        const currentValue = start + change * progress;
        element.textContent = formatValue(currentValue, format);

        requestAnimationFrame(updateNumber);
    }

    requestAnimationFrame(updateNumber);
}

function formatValue(value, format) {
    switch (format) {
        case 'k':
            return formatNumberK(value);
        case 'percent':
            return value.toFixed(1) + '%';
        case 'number':
        default:
            return formatNumber(value.toFixed(0));
    }
}

export function animateWidth(element, startWidth, endWidth, duration = 800) {
    if (!element) return;

    const startTime = performance.now();
    const change = endWidth - startWidth;

    function updateWidth(currentTime) {
        const elapsedTime = currentTime - startTime;

        if (elapsedTime >= duration) {
            element.style.width = endWidth + '%';
            return;
        }

        const progress = elapsedTime / duration;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const currentWidth = startWidth + change * easeProgress;
        element.style.width = currentWidth + '%';

        requestAnimationFrame(updateWidth);
    }

    requestAnimationFrame(updateWidth);
}

export function createGraphBar(cardElement) {
    // Remove existing graph bar if any
    const existing = cardElement.querySelector('.graph-bar');
    if (existing) existing.remove();

    const graphBar = document.createElement('div');
    graphBar.className = 'graph-bar';
    graphBar.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 0%;
        background: var(--graph-color, rgba(100, 100, 100, 0.4));
        transition: background-color 0.3s ease;
        pointer-events: none;
        z-index: 0;
    `;

    cardElement.appendChild(graphBar);
    return graphBar;
}