export function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    const n = parseFloat(num);
    if (isNaN(n)) return num.toString();
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
