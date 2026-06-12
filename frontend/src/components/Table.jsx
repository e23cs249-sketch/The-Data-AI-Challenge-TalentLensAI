import { motion } from "framer-motion";
import { useState } from "react";

export default function Table({ data }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!data.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card empty-state"
      >
        No candidate shortlist loaded yet.
      </motion.div>
    );
  }

  const cols = Object.keys(data[0]);
  
  // Reorder columns to show key ones first
  const scoreColumns = ['rule_score', 'semantic_score'];
  const priorityCols = ['rank', 'candidate_id', 'score', ...scoreColumns];
  const orderedCols = [
    ...priorityCols.filter(col => cols.includes(col)),
    ...cols.filter(col => !priorityCols.includes(col))
  ];

  const formatScore = (value, column) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (column === 'score' || column === 'rule_score' || column === 'semantic_score') {
      return num.toFixed(1);
    }
    return value;
  };

  const getScoreBadgeClass = (value, column) => {
    if (!value || isNaN(parseFloat(value))) return '';
    const num = parseFloat(value);
    
    if (column === 'semantic_score') {
      return num > 25 ? 'badge-semantic-high' : num > 10 ? 'badge-semantic-med' : 'badge-semantic-low';
    }
    return '';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card table-panel"
    >
      <div className="table-header">
        <div>
          <p className="eyebrow">Ranked shortlist</p>
          <h3>Candidate ranking table with explainability scores</h3>
        </div>
      </div>

      <div className="table-scroll">
        <table className="rank-table">
          <thead>
            <tr>
              {orderedCols.map((column) => (
                <th key={column} className={scoreColumns.includes(column) ? 'score-col' : ''}>
                  {column === 'rule_score' ? 'Rule-Based Score' : 
                   column === 'semantic_score' ? 'Semantic Score' :
                   column.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <motion.tr
                key={`${row.candidate_id}-${index}`}
                className={`${index < 3 ? "highlight-row" : ""} ${expandedRow === index ? 'expanded' : ''}`}
                onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                {orderedCols.map((column) => {
                  const value = row[column];
                  const formatted = formatScore(value, column);
                  const badgeClass = getScoreBadgeClass(value, column);
                  
                  return (
                    <td key={`${column}-${index}`} className={scoreColumns.includes(column) ? 'score-cell' : ''}>
                      {column === "rank" ? (
                        <span className="badge">{formatted}</span>
                      ) : scoreColumns.includes(column) ? (
                        <span className={`score-badge ${badgeClass}`}>{formatted}</span>
                      ) : column === "score" ? (
                        <strong className="final-score">{formatted}</strong>
                      ) : (
                        formatted
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-legend">
        <p className="eyebrow">Score Breakdown</p>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#b67749'}}></span>
            <small><strong>Rule-Based Score:</strong> Traditional keyword and experience matching</small>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#4caf50'}}></span>
            <small><strong>Semantic Score:</strong> AI-powered semantic similarity to job description</small>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#ff9800'}}></span>
            <small><strong>Final Score:</strong> Combined score (Rule + Semantic)</small>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
