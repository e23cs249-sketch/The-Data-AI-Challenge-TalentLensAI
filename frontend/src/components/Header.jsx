import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-card hero-header"
    >
      <div>
        <span className="eyebrow">TalentLens AI</span>
        <h1>Discover Talent Beyond Keywords</h1>
        <p>
          AI-powered candidate discovery, intelligent ranking, and finalist-ready hiring recommendations.
        </p>
      </div>

      <div className="hero-pill">
        <strong>See Beyond Resumes</strong>
        <p>Semantic Search | Explainable AI | Hybrid Ranking Engine | Skill Validation</p>
      </div>
    </motion.header>
  );
}
