import { SIZES } from './Constants.js';

export class SearchUtils {
    static normalizeText(text) {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    static searchInObject(obj, query) {
        const normalizedQuery = this.normalizeText(query);
        const searchableFields = ['name', 'title', 'description', 'client', 'location', 'country'];
        
        return searchableFields.some(field => {
            const value = obj[field];
            if (typeof value === 'string') {
                return this.normalizeText(value).includes(normalizedQuery);
            }
            return false;
        });
    }

    static filterResults(items, query, limit = SIZES.MAX_SEARCH_RESULTS) {
        if (!query || query.length < SIZES.MIN_QUERY_LENGTH) return [];
        
        return items
            .filter(item => this.searchInObject(item, query))
            .slice(0, limit);
    }

    static highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}