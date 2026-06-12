import { useState } from "react";
import { motion } from "framer-motion";

export default function Filters({ data, setFiltered, setSearchPerformed }) {
  const [q, setQ] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    const query = q.trim().toLowerCase();

    if (!query) {
      setFiltered([]);
      setSearchPerformed(false);
      return;
    }

    const result = data.filter((row) =>
      Object.values(row).some((cell) => {
        if (cell === null || cell === undefined) return false;
        const text = String(cell).trim().toLowerCase();
        return text.includes(query);
      })
    );

    setFiltered(result);
    setSearchPerformed(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card filter-panel"
    >
      <div className="filter-row">
        <div>
          <p className="eyebrow">Shortlist explorer</p>
          <h3>Search the ranked output</h3>
        </div>

        <form className="filter-actions" onSubmit={handleSearch}>
          <input
            className="search-input"
            placeholder="Search candidate ID, rank, or score"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button type="submit" className="button button-primary">
            🔍
          </button>
        </form>
        <div className="filter-hint">
          Type a full ID like <strong>CAND_0091534</strong>, a rank number, or a score to display matching rows.
        </div>
      </div>
    </motion.section>
  );
}
