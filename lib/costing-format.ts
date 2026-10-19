export function formatMoney(val: number, isTick = false): string {
    if (val === undefined || val === null || isNaN(val)) return isTick ? "₹0L" : "₹0";
    if (val === 0) return isTick ? "₹0L" : "₹0";
    const sign = val < 0 ? "-" : "";
    const abs = Math.abs(val);
    if (abs >= 10000000) {
        const cr = abs / 10000000;
        return `${sign}₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)}Cr`;
    }
    if (abs >= 100000) {
        const lk = abs / 100000;
        return `${sign}₹${lk % 1 === 0 && isTick ? lk.toFixed(0) : lk.toFixed(1)}L`;
    }
    if (abs >= 1000) {
        const k = abs / 1000;
        return `${sign}₹${k % 1 === 0 && isTick ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatFullCurrency(val: number): string {
    if (val === undefined || val === null || isNaN(val)) return "₹0";
    const sign = val < 0 ? "-" : "";
    const abs = Math.abs(val);
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatScenarioDate(dateStr?: string | null): string {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${datePart} ${displayHours}:${displayMinutes} ${ampm}`;
    } catch {
        return "-";
    }
}

export function formatScenarioVariance(val?: number | null, pct?: number | null): string {
    const numVal = Number(val || 0);
    const numPct = pct !== undefined && pct !== null ? Number(pct) : 0;
    if (numVal === 0) return "₹0 (0.0%)";
    const absMoney = formatMoney(Math.abs(numVal));
    const sign = numVal > 0 ? "+" : "";
    const pctText = numPct > 0 ? `+${numPct.toFixed(1)}%` : `${numPct.toFixed(1)}%`;
    return `${sign}${absMoney} (${pctText})`;
}

