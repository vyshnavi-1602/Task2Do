

import './BoardFilters.css'; 

interface BoardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onlyMyIssues: boolean;
  onOnlyMyIssuesChange: (val: boolean) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
}

export const BoardFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  onlyMyIssues,
  onOnlyMyIssuesChange,
  priorityFilter,
  setPriorityFilter
}: BoardFiltersProps) => {

  const handleClear = () => {
    setSearchQuery('');
    onOnlyMyIssuesChange(false);
    setPriorityFilter('');
  };

  const hasActiveFilters = searchQuery.length > 0 || onlyMyIssues || priorityFilter !== '';

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

        <select 
          className="board-filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {hasActiveFilters && (
          <button className="board-filter-clear-btn" onClick={handleClear}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
