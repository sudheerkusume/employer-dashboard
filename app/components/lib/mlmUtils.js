// app/components/lib/mlmUtils.js

export const LEVELS = {
    ME: { name: "Marketing Executive", order: 1, commission: 50, minDirect: 0, minSales: 0 },
    MM: { name: "Marketing Manager", order: 2, commission: 15, minDirect: 2, minSales: 50000 },
    SMM: { name: "Senior Marketing Manager", order: 3, commission: 10, minDirect: 4, minSales: 150000 },
    AGM: { name: "Assistant General Manager", order: 4, commission: 7.5, minDirect: 6, minSales: 300000 },
    DGM: { name: "Deputy General Manager", order: 5, commission: 5, minDirect: 8, minSales: 500000 },
    GM: { name: "General Manager", order: 6, commission: 2.5, minDirect: 10, minSales: 1000000 }
};

export const COMMISSION_CONFIG = {
    ME: 50,
    MM: 15,
    SMM: 10,
    AGM: 7.5,
    DGM: 5,
    GM: 2.5
};

export function calculateNextLevel(currentLevel, directCount, totalSales) {
    const levels = Object.keys(LEVELS);
    const currentIndex = levels.indexOf(currentLevel);

    for (let i = currentIndex + 1; i < levels.length; i++) {
        const level = levels[i];
        const requirements = LEVELS[level];

        if (directCount >= requirements.minDirect && totalSales >= requirements.minSales) {
            return level;
        }
    }
    return null;
}

export function formatCurrency(amount) {
    if (!amount && amount !== 0) return "₹0";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export function calculateCommission(diff, amount) {
    return (diff / 100) * amount;
}

export function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function getLevelColor(level) {
    const colors = {
        'GM': 'bg-red-100 text-red-700',
        'DGM': 'bg-orange-100 text-orange-700',
        'AGM': 'bg-yellow-100 text-yellow-700',
        'SMM': 'bg-green-100 text-green-700',
        'MM': 'bg-blue-100 text-blue-700',
        'ME': 'bg-purple-100 text-purple-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
}