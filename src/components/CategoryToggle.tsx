import { CATEGORY_ICONS } from '../utils/dailyUtils';

interface CategoryToggleProps {
    categories: string[];
    activeCategory: string;
    onChange: (category: string) => void;
}

export function CategoryToggle({ categories, activeCategory, onChange }: CategoryToggleProps) {
    return (
        <div className="flex items-center border border-charcoal shrink-0" data-tutorial="category-toggle">
            {categories.map((cat, index) => {
                const isActive = cat === activeCategory;
                const icon = CATEGORY_ICONS[cat];
                return (
                    <button
                        key={cat}
                        onClick={() => onChange(cat)}
                        className={[
                            'px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                            'transition-colors touch-manipulation font-mono',
                            'flex items-center gap-1.5',
                            isActive
                                ? 'bg-charcoal text-paper-white'
                                : 'bg-transparent text-charcoal hover:bg-charcoal/10',
                            index < categories.length - 1 ? 'border-r border-charcoal' : '',
                        ].join(' ')}
                    >
                        {icon && <span className="text-sm leading-none">{icon}</span>}
                        {cat}
                    </button>
                );
            })}
        </div>
    );
}
