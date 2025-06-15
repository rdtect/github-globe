// Comprehensive color definitions for the application
export const STATUS_COLORS = {
    active: '#00d4ff',
    'in progress': '#00d4ff',
    completed: '#9cff00',
    'on-hold': '#ff6b6b',
    'on hold': '#ff6b6b',
    planning: '#ffb84d',
    cancelled: '#999999',
    default: '#cccccc'
};

export const TYPE_COLORS = {
    office: '#ffd700',
    headquarters: '#ffd700',
    project: '#00d4ff',
    collaboration: '#28a745',
    workshop: '#6f42c1',
    talk: '#9966ff',
    contact: '#66ff99',
    default: '#6c757d'
};

export const ZYETA_BRAND_COLORS = {
    primary: '#00d4ff',
    gold: '#ffd700',
    white: '#ffffff',
    dark: '#061621',
    atmosphere: '#3a228a'
};

export function getStatusColor(status) {
    return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.default;
}

export function getTypeColor(type) {
    return TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.default;
}