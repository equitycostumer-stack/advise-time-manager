const KEY = "equityline_data";

export function loadData() {
    const data = localStorage.getItem(KEY);

    if (!data) return [];

    return JSON.parse(data);
}

export function saveData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
}