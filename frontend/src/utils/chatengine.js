import { analyzeData } from "./analyzeData";

export function getAIResponse(question, data) {
  const insights = analyzeData(data);

  if (!insights) return "Upload data first.";

  const q = question.toLowerCase();

  // Score Distribution Questions
  if (q.includes("distribution") || q.includes("spread")) {
    const ruleScores = data.map((d) => parseFloat(d.rule_score) || 0);
    const avgRule = (ruleScores.reduce((a, b) => a + b, 0) / ruleScores.length).toFixed(2);
    const semanticScores = data.map((d) => parseFloat(d.semantic_score) || 0);
    const avgSemantic = (semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length).toFixed(2);
    
    return `Score Distribution: Average rule-based score is ${avgRule}, and average semantic score is ${avgSemantic}. This shows how traditional keyword matching and AI embedding similarity balance out.`;
  }

  // Semantic vs Rule-Based Comparison
  if (q.includes("semantic") && (q.includes("vs") || q.includes("rule") || q.includes("compare"))) {
    const top5 = data.slice(0, 5);
    const avgSemanticTop5 = (top5.reduce((s, c) => s + (parseFloat(c.semantic_score) || 0), 0) / 5).toFixed(2);
    const avgRuleTop5 = (top5.reduce((s, c) => s + (parseFloat(c.rule_score) || 0), 0) / 5).toFixed(2);
    
    return `Semantic vs Rule-Based: Top 5 candidates average ${avgRuleTop5} in rule-based scoring (keywords, experience) and ${avgSemanticTop5} in semantic scoring (embedding similarity). The combination provides both explicit signals and deep contextual matching.`;
  }

  // Candidate Score Breakdown
  if (q.includes("candidate") && q.includes("score")) {
    const topCandidate = insights.topRow;
    return `Top Candidate ${topCandidate.candidate_id}: Final Score ${topCandidate.score}, comprised of Rule Score ${topCandidate.rule_score || 'N/A'} (keywords/experience) and Semantic Score ${topCandidate.semantic_score || 'N/A'} (embedding similarity).`;
  }

  // Scoring Methodology
  if (q.includes("how") && (q.includes("score") || q.includes("rank"))) {
    return `Scoring Methodology: The system uses a hybrid approach combining Rule-Based scoring (keywords, titles, experience: typically 50-200+ points) with Semantic scoring (embedding-based similarity: 0-50 points). Final Score = Rule Score + Semantic Score. This balances explicit signals with AI-powered understanding.`;
  }

  // Top Candidates
  if (q.includes("top 5") || q.includes("top five")) {
    const top5 = data.slice(0, 5);
    const list = top5.map((c, i) => `${i + 1}. ${c.candidate_id} (Score: ${c.score})`).join(", ");
    return `Top 5 Candidates: ${list}`;
  }

  if (q.includes("average")) {
    const ruleScores = data.map((d) => parseFloat(d.rule_score) || 0);
    const semanticScores = data.map((d) => parseFloat(d.semantic_score) || 0);
    const avgRule = (ruleScores.reduce((a, b) => a + b, 0) / ruleScores.length).toFixed(2);
    const avgSemantic = (semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length).toFixed(2);
    
    return `Average Scores: Combined average is ${insights.avg}. Breakdown - Rule-based: ${avgRule}, Semantic: ${avgSemantic}.`;
  }

  if (q.includes("highest") || q.includes("top score")) {
    const topCandidate = insights.topRow;
    return `The highest score is ${insights.max} (${topCandidate.candidate_id}, Rank ${topCandidate.rank}). Rule Score: ${topCandidate.rule_score}, Semantic Score: ${topCandidate.semantic_score}.`;
  }

  if (q.includes("lowest") || q.includes("minimum")) {
    return `The lowest score in the top 100 is ${insights.min}.`;
  }

  if (q.includes("candidate")) {
    const topCandidate = insights.topRow;
    return `Top Candidate: ${topCandidate.candidate_id} with final score ${topCandidate.score} (Rank ${topCandidate.rank}). Rule-based strength: ${topCandidate.rule_score}, Semantic fit: ${topCandidate.semantic_score}.`;
  }

  // Default helpful response
  return `I can help! Try asking about: "average score", "top score", "top 5 candidates", "score distribution", "how scoring works", "semantic vs rule-based", or details about specific candidates.`;
}

