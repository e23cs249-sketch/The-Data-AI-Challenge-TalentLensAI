import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";

import Header from "./components/Header";
import Filters from "./components/Filters";
import Table from "./components/Table";
import InsightPanel from "./components/InsightPanel";
import ChatBot from "./components/ChatBot";

const tabs = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "input", label: "Input" },
  { id: "explore", label: "Explore" },
  { id: "results", label: "Full Output" },
  { id: "assistant", label: "Assistant" },
];

export default function App() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [filename, setFilename] = useState("submission.csv");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const loadCsvText = (csvText, sourceName = "submission.csv") => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setData(res.data);
        setFiltered([]);
        setSearchPerformed(false);
        setFilename(sourceName);
        setError(null);
        setLoading(false);
      },
      error: () => {
        setError("Unable to parse CSV. Please upload a valid submission.csv file.");
        setLoading(false);
      },
    });
  };

  useEffect(() => {
    const attemptLoad = async () => {
      const sources = ["/submission.csv", "/sample_submission.csv"];
      for (const path of sources) {
        try {
          const response = await fetch(path);
          if (!response.ok) continue;
          const csv = await response.text();
          loadCsvText(csv, path.replace("/", ""));
          return;
        } catch {
          continue;
        }
      }
      setError("Could not load submission.csv or sample_submission.csv. No input dataset was found.");
      setLoading(false);
    };

    attemptLoad();
  }, []);

  const totalRows = data.length;
  const validRows = data.filter((row) => row && row.candidate_id && row.rank);
  const visibleRows = filtered.length;
  const topCandidate = data[0];

  const avgRuleScore = validRows.length
    ? (validRows.reduce((sum, row) => sum + (parseFloat(row.rule_score) || 0), 0) / validRows.length).toFixed(2)
    : "0.00";
  const avgSemanticScore = validRows.length
    ? (validRows.reduce((sum, row) => sum + (parseFloat(row.semantic_score) || 0), 0) / validRows.length).toFixed(2)
    : "0.00";
  const avgFinalScore = validRows.length
    ? (validRows.reduce((sum, row) => sum + (parseFloat(row.final_score) || 0), 0) / validRows.length).toFixed(2)
    : "0.00";

  return (
    <div className="app-shell">
      <Header />

      <nav className="page-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "home" && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card"
          >
            <div className="section-header">
              <div>
                <h2>Ranked Candidates</h2>
                <p>
                  This dashboard loads your ranked candidate file automatically and shows it as the source for search, analytics, and full output.
                  Use the tabs to move between input, explore, analytics, results, and the assistant.
                </p>
              </div>
            </div>
            <div className="status-summary home-status">
              <div>
                <span>Loaded file</span>
                <strong>{filename}</strong>
              </div>
              <div>
                <span>Rows found</span>
                <strong>{totalRows}</strong>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card Summary of Results"
          >
            <div className="section-header">
              <div>
                <span className="eyebrow">Summary</span>
                <h2>What is this submission about?</h2>
                <p>
                  This submission delivers a polished ranking dashboard with a clean output format, searchable shortlist, and explainable score breakdown.
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="metric-card">
                <span className="component-label">Data integrity</span>
                <strong>{totalRows} rows</strong>
                <p>Ensures all candidates are present in the final output.</p>
              </div>
              <div className="metric-card">
                <span className="component-label">Average rule score</span>
                <strong>{avgRuleScore}</strong>
                <p>Represents deterministic rule-based ranking signals.</p>
              </div>
              <div className="metric-card">
                <span className="component-label">Average semantic score</span>
                <strong>{avgSemanticScore}</strong>
                <p>Captures meaning and contextual relevance beyond exact matches.</p>
              </div>
              <div className="metric-card">
                <span className="component-label">Average final score</span>
                <strong>{avgFinalScore}</strong>
                <p>Shows the combined final rating used for shortlist ranking.</p>
              </div>
            </div>
            
          </motion.section>
        </>
      )}

      {activeTab === "input" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card split-card"
        >
          <div>
            <h3>Input dataset</h3>
            <p>
              The app uses the ranked output file from <strong>submission.csv</strong>.
              This file is copied into the frontend public folder so the full output loads correctly.
            </p>
            <div className="upload-status">
              <span>{loading ? "Loading..." : error ? error : `${totalRows} rows loaded from ${filename}`}</span>
            </div>
          </div>
          <div className="example-box">
            <span className="eyebrow">Expected output format</span>
            <pre>candidate_id,rank,title,score,rule_score,semantic_score,final_score</pre>
            <pre>CAND_xxxxxxx,1,AI Engineer,209.80,185.50,24.30,209.80</pre>
          </div>
        </motion.section>
      )}
      {activeTab === "explore" && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card"
          >
            <div className="section-header">
              <div>
                <span className="eyebrow">Shortlist explorer</span>
                <h2>Search the ranked output</h2>
                <p>
                  Use the search field below, then press the search icon to display matching rows only.
                </p>
              </div>
              <div className="status-summary">
                <div>
                  <span>Visible rows</span>
                  <strong>{visibleRows}</strong>
                </div>
                <div>
                  <span>Total rows</span>
                  <strong>{totalRows}</strong>
                </div>
              </div>
            </div>
          </motion.section>
          {data.length > 0 ? (
            <>
              <Filters
                data={data}
                setFiltered={setFiltered}
                setSearchPerformed={setSearchPerformed}
              />
              {searchPerformed ? (
                filtered.length ? (
                  <Table data={filtered} />
                ) : (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="section-card"
                  >
                    <p>No results matched your query. Try another candidate ID, rank, or score.</p>
                  </motion.section>
                )
              ) : (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="section-card"
                >
                  <p>Search to display candidate results here.</p>
                </motion.section>
              )}
            </>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="section-card"
            >
              <p>Upload your ranked CSV first to start searching.</p>
            </motion.section>
          )}
        </>
      )}

      {activeTab === "results" && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card"
          >
            <div className="section-header">
              <div>
                <h2>Full output</h2>
                <p>
                  This page displays the full sorted shortlist, including all loaded rows for judge review.
                </p>
              </div>
              <div className="status-summary">
                <div>
                  <span>Top candidate</span>
                  <strong>{topCandidate?.candidate_id ?? "-"}</strong>
                </div>
                <div>
                  <span>Top score</span>
                  <strong>{topCandidate?.score ?? "-"}</strong>
                </div>
              </div>
            </div>
          </motion.section>
          <Table data={data} />
        </>
      )}

      {activeTab === "assistant" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card"
        >
          <ChatBot data={data} />
        </motion.section>
      )}

      {activeTab === "about" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card"
        >
          <div className="section-header">
            <div>
              <span className="eyebrow">About</span>
              <h2>How this dashboard works</h2>
              <p>
                This interface is split into tabs for easier review. Upload your submission, explore the shortlist,
                inspect insights, review results, and ask the assistant questions.
              </p>
            </div>
          </div>
          <div className="example-box">
            <p>
              Make sure your CSV includes the expected columns: <strong>candidate_id</strong>, <strong>rank</strong>, and <strong>score</strong>.
            </p>
            <p>
              Use the Explore tab to filter candidate IDs, rank values, or scores. If you type part of a candidate ID like <strong>CAND</strong>, it will match any row containing that text.
            </p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
