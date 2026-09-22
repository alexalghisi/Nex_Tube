export function formatDuration(total: number): string {
    const s = Math.max(0, Math.floor(total));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return `${h}:${pad(m)}:${pad(sec)}`;
    }
    return `${m}:${pad(sec)}`;
}

export function formatViews(n: number): string {
    if (n >= 1_000_000) {
        return `${trimFloat(n / 1_000_000)}M views`;
    }
    if (n >= 1_000) {
        return `${trimFloat(n / 1_000)}K views`;
    }
    return `${n} views`;
}

export function publishedDay(iso: string): string {
    return iso.slice(0, 10);
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function trimFloat(n: number): string {
    const t = n.toFixed(1);
    return t.endsWith('.0') ? t.slice(0, -2) : t;
}
