export function formatNumber(num, abbreviate = false) {
    if (num === undefined || num === null) return '0';
    const n = parseFloat(num);
    if (isNaN(n)) return num.toString();
    
    if (abbreviate && n >= 1000) {
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

export function animateNumber(element, start, end, duration = 1000) {
    // Safety check for null/undefined element
    if (!element || typeof element.textContent === 'undefined') {
        return;
    }
    
    const startTime = performance.now();
    const change = end - start;

    // If there's no change, just set the final value and return.
    if (change === 0) {
        const formattedEnd = formatNumber(end.toFixed(0));
        if (element.textContent !== formattedEnd) {
            element.textContent = formattedEnd;
        }
        return;
    }

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime >= duration) {
            element.textContent = formatNumber(end.toFixed(0));
            return;
        }

        const progress = elapsedTime / duration;
        const currentValue = start + change * progress;
        element.textContent = formatNumber(currentValue.toFixed(0));
        
        requestAnimationFrame(updateNumber);
    }
}

export function formatCritStats(chit, cdhit, swings) {
    if (!swings || swings === 0) return { ch: '0%', dh: '0%', cdh: '0%' };
    
    const chPercent = ((chit || 0) / swings * 100).toFixed(1);
    const dhPercent = 0; // Direct hit percentage not available in current data
    const cdhPercent = ((cdhit || 0) / swings * 100).toFixed(1);
    
    return {
        ch: chPercent + '%',
        dh: dhPercent + '%',
        cdh: cdhPercent + '%'
    };
}

export function getCritColorClass(percent) {
    const num = parseFloat(percent);
    if (num >= 25) return 'crit-high';
    if (num >= 15) return 'crit-medium';
    return 'crit-low';
}