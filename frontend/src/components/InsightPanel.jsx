import { motion } from "framer-motion";
import { analyzeData } from "../utils/analyzeData";

export default function InsightPanel({ data }) {
  const insights = analyzeData(data);

  if (!insights) return null;

  // Calculate semantic vs rule-based distribution
  const ruleScores = data.map((d) => parseFloat(d.rule_score) || 0);
  const semanticScores = data.map((d) => parseFloat(d.semantic_score) || 0);
  
  const avgRuleScore = (ruleScores.reduce((a, b) => a + b, 0) / ruleScores.length).toFixed(2);
  const avgSemanticScore = (semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length).toFixed(2);

  // Calculate score ranges
  const top20Candidates = data.slice(0, 20);
  const top20RuleScores = top20Candidates.map((d) => parseFloat(d.rule_score) || 0);
  const top20SemanticScores = top20Candidates.map((d) => parseFloat(d.semantic_score) || 0);
  
  const top20AvgRule = (top20RuleScores.reduce((a, b) => a + b, 0) / 20).toFixed(2);
  const top20AvgSemantic = (top20SemanticScores.reduce((a, b) => a + b, 0) / 20).toFixed(2);

  // Get score distribution buckets
  const getScoreBucket = (scores) => {
    const buckets = { high: 0, medium: 0, low: 0 };
    scores.forEach((s) => {
      if (s >= 200) buckets.high++;
      else if (s >= 100) buckets.medium++;
      else buckets.low++;
    });
    return buckets;
  };

  const ruleBuckets = getScoreBucket(ruleScores);
  const semanticBuckets = getScoreBucket(semanticScores);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card insight-card"
    >
      <div className="insight-header">
        <div>
          <span className="eyebrow">Insight engine</span>
          <h3>Score analysis & explainability</h3>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="insight-grid">
        <div className="metric-card">
          <span>Average score</span>
          <strong>{insights.avg}</strong>
          <small>Combined (Rule + Semantic)</small>
        </div>

        <div className="metric-card">
          <span>Highest score</span>
          <strong>{insights.max}</strong>
          <small>Top candidate ranking</small>
        </div>

        <div className="metric-card">
          <span>Lowest score</span>
          <strong>{insights.min}</strong>
          <small>Within top 100</small>
        </div>
      </div>

      {/* Score Component Breakdown */}
      <div className="score-breakdown">
        <h4>Score Component Analysis</h4>
        
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <span className="component-label">Rule-Based Scoring</span>
            <div className="stats-row">
              <div className="stat">
                <small>Overall Average</small>
                <strong>{avgRuleScore}</strong>
              </div>
              <div className="stat">
                <small>Top 20 Average</small>
                <strong>{top20AvgRule}</strong>
              </div>
            </div>
            <small className="description">Keyword matching, experience, career history</small>
          </div>

          <div className="breakdown-card">
            <span className="component-label">Semantic Scoring</span>
            <div className="stats-row">
              <div className="stat">
                <small>Overall Average</small>
                <strong>{avgSemanticScore}</strong>
              </div>
              <div className="stat">
                <small>Top 20 Average</small>
                <strong>{top20AvgSemantic}</strong>
              </div>
            </div>
            <small className="description">Embedding-based semantic similarity (0-50 scale)</small>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="distribution-section">
        <h4>Candidate Score Distribution</h4>
        
        <div className="distribution-charts">
          <div className="chart-container">
            <div className="chart-title">Rule-Based Scores</div>
            <div className="distribution-bars">
              <div className="bar-group">
                <div className="bar" style={{height: `${(ruleBuckets.high / data.length) * 100}%`, background: '#2e7d32'}}></div>
                <label>High (200+): {ruleBuckets.high}</label>
              </div>
              <div className="bar-group">
                <div className="bar" style={{height: `${(ruleBuckets.medium / data.length) * 100}%`, background: '#ff9800'}}></div>
                <label>Med (100-199): {ruleBuckets.medium}</label>
              </div>
              <div className="bar-group">
                <div className="bar" style={{height: `${(ruleBuckets.low / data.length) * 100}%`, background: '#d32f2f'}}></div>
                <label>Low (&lt;100): {ruleBuckets.low}</label>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-title">Semantic Scores</div>
            <div className="distribution-bars">
              <div className="bar-group">
                <div className="bar" style={{height: `${(semanticBuckets.high / data.length) * 100}%`, background: '#2e7d32'}}></div>
                <label>High (200+): {semanticBuckets.high}</label>
              </div>
              <div className="bar-group">
                <div className="bar" style={{height: `${(semanticBuckets.medium / data.length) * 100}%`, background: '#ff9800'}}></div>
                <label>Med (100-199): {semanticBuckets.medium}</label>
              </div>
              <div className="bar-group">
                <div className="bar" style={{height: `${(semanticBuckets.low / data.length) * 100}%`, background: '#d32f2f'}}></div>
                <label>Low (&lt;100): {semanticBuckets.low}</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Candidate Card */}
      <div className="top-candidate-card">
        <span className="eyebrow">Top ranked candidate</span>
        <h4>{insights.topRow.candidate_id}</h4>
        <div className="candidate-scores">
          <div className="score-item">
            <small>Rule-Based Score</small>
            <strong>{insights.topRow.rule_score || 'N/A'}</strong>
          </div>
          <div className="score-item">
            <small>Semantic Score</small>
            <strong>{insights.topRow.semantic_score || 'N/A'}</strong>
          </div>
          <div className="score-item">
            <small>Final Score</small>
            <strong className="final">{insights.topRow.score}</strong>
          </div>
        </div>
        <p>
          Rank {insights.topRow.rank} is the strongest candidate in your shortlist. This score combines traditional keyword matching with semantic embedding similarity.
        </p>
      </div>

      {/* Key Insights */}
      <div className="insights-summary">
        <h4>Key Insights</h4>
        <ul className="insight-list">
          <li>
            <strong>Semantic signals matter:</strong> Top candidates average <strong>{top20AvgSemantic}</strong> semantic score, showing strong alignment with job description.
          </li>
          <li>
            <strong>Experience & keywords:</strong> Rule-based scores average <strong>{top20AvgRule}</strong> among top 20, indicating strong traditional signal matches.
          </li>
          <li>
            <strong>Hybrid approach:</strong> Combined scoring balances explicit keywords with semantic understanding for robust matching.
          </li>
          <li>
            <strong>Score explanation:</strong> View individual candidate breakdown by clicking rows to understand what factors drove each ranking.
          </li>
        </ul>
      </div>
    </motion.section>
  );
}
