

import './BoardFilters.css'; 

interface BoardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onlyMyIssues: boolean;
  onOnlyMyIssuesChange: (val: boolean) => void;
}

export const BoardFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  onlyMyIssues,
  onOnlyMyIssuesChange
}: BoardFiltersProps) => {

  const handleClear = () => {
    setSearchQuery('');
    onOnlyMyIssuesChange(false);
  };

  const hasActiveFilters = searchQuery.length > 0 || onlyMyIssues;

  return (
    <div className="board-filters">
      <div className="board-filters-inputs">
        <input 
          type="text" 
          className="board-filter-search"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <button 
          className={`board-filter-btn ${onlyMyIssues ? 'active' : ''}`}
          onClick={() => onOnlyMyIssuesChange(!onlyMyIssues)}
        >
          Only My Issues
        </button>

        {hasActiveFilters && (
          <button className="board-filter-clear-btn" onClick={handleClear}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
