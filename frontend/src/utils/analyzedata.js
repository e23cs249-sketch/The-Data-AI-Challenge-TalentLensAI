export function analyzeData(data) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  let numericKey = "score";

  if (!keys.includes("score")) {
    numericKey = keys.includes("rank") ? "rank" : keys.find((k) => !isNaN(data[0][k]));
  }

  const values = data.map((d) => Number(d[numericKey]) || 0);

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  const topIndex = values.indexOf(max);

  return {
    numericKey,
    avg: avg.toFixed(2),
    max,
    min,
    topRow: data[topIndex],
  };
}
