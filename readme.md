# TalentLens AI Candidate Ranker

## Overview
TalentLens AI is a hybrid AI-powered candidate ranking system that combines rule-based scoring with semantic embeddings to identify the best-fit candidates for specialized AI/ML roles. The system uses sentence-transformers to compute semantic similarity between candidate profiles and job descriptions, ensuring that candidates are ranked based on both traditional keyword matching and deep semantic understanding.

This submission is aligned to the hackathon prompt: it includes a working backend ranking pipeline, a React frontend dashboard with explainability features, a documented approach PDF, and a ranked candidate output.

## Submission includes
* **GitHub Repository:** Complete working code, frontend, and backend
* **Approach PDF:** `submission_deck.pdf` — detailed explanation of the ranking algorithm and methodology
* **Ranked Output:** `output/submission.csv` — top 100 ranked candidates with explainability scores
* **Current Output Copy:** `output/crt_output.csv`

## Architecture
Hybrid scoring with semantic embeddings and rule-based matching.

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AI Candidate Ranker                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT LAYER                                                    │
│  ┌──────────────────┐         ┌──────────────────────┐          │
│  │ Job Description  │         │ Candidate Profiles   │          │
│  │ (text)           │         │ (JSONL format)       │          │
│  └────────┬─────────┘         └──────────┬───────────┘          │
│           │                              │                      │
│  PROCESSING LAYER                        │                      │
│  ┌────────▼──────────────────────────────▼──────────────────┐   │
│  │        Backend Ranking Engine (rank_candidates.py)       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  1. SEMANTIC SCORING (SentenceTransformers)              │   │
│  │     ├─ Load all-MiniLM-L6-v2 embedding model            │   │
│  │     ├─ Encode job description → embedding vector        │   │
│  │     ├─ For each candidate:                              │   │
│  │     │  ├─ Combine profile + skills + history → text     │   │
│  │     │  ├─ Encode candidate text → embedding vector      │   │
│  │     │  ├─ Compute cosine similarity [0-1]               │   │
│  │     │  └─ Scale to semantic score                       │   │
│  │     └─ Normalize semantic score                         │   │
│  │                                                         │   │
│  │  2. RULE-BASED SCORING (Traditional Keywords)            │   │
│  │     ├─ Title matching                                   │   │
│  │     ├─ Experience level scoring                          │   │
│  │     ├─ Core skill matching                               │   │
│  │     ├─ Career history keyword scoring                    │   │
│  │     ├─ JD phrase overlap                                 │   │
│  │     └─ Recruiter signal adjustments                      │   │
│  │                                                         │   │
│  │  3. FINAL SCORE COMPUTATION                              │   │
│  │     Final Score = Semantic Score × Weight + Rule Score × Weight │ │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                    │
│  OUTPUT LAYER                                                │
│  ┌────────▼──────────────────────────────────┐                │
│  │        submission.csv (Ranked Results)    │                │
│  │  Columns:                                 │                │
│  │  - candidate_id                           │                │
│  │  - rank                                   │                │
│  │  - score (final score)                    │                │
│  │  - rule_score (explainability)            │                │
│  │  - semantic_score (explainability)        │                │
│  └──────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Problem Statement
Recruiters often review hundreds of candidate profiles and miss highly relevant candidates for specialized AI/ML roles. The issue is not the talent — it is that keyword filters cannot see what actually matters. TalentLens AI solves this by reading the job description deeply and ranking candidates using semantic and signal-based relevance.

## Data Sets
* Candidate data: `DATA/candidates.jsonl`
* Job description: `DATA/job_description.txt`
* Channel sample IDs: `DATA/sample_submission.csv`
* Ranked output: `output/submission.csv`
* Current output copy: `output/crt_output.csv`

> Challenge dataset link: Click Here

## Approach
This system uses a hybrid scoring model combining semantic embeddings and traditional keyword matching.

### Semantic Similarity Scoring
* Technology: Sentence-Transformers (`all-MiniLM-L6-v2`)
* Job Description Embedding: The job description is encoded into an embedding vector
* Candidate Embedding: Each candidate's profile text is encoded into the same embedding space
* Similarity Calculation: Cosine similarity is computed and normalized
* Benefits: Captures meaning beyond exact keywords, finds strong matches with different terminology

### Rule-Based Scoring
The algorithm also evaluates explicit recruiter signals and domain-specific keywords.

1. **Job Title Matching**
   * +40 for AI/ML titles such as AI Engineer, ML Engineer, NLP Engineer, Search Engineer, Recommendation Systems Engineer, Data Scientist
   * -60 for irrelevant titles like Marketing, HR, Sales, Accountant

2. **Experience Level**
   * +25 for 5-9 years
   * +15 for 4-11 years

3. **Core Skills Matching**
   * Rewards skills such as embeddings, semantic search, vector search, retrieval, RAG, Faiss, Pinecone, Milvus, Qdrant, Weaviate, Elasticsearch, BM25, recommendation systems, sentence transformers, LLMs, LoRA, fine-tuning
   * +5 per matching core skill

4. **Career History Analysis**
   * Additional points for experience in search, recommendation, ranking, retrieval, semantic search, embeddings, production deployments, evaluation metrics, and model tuning

5. **Job Description Phrase Matching**
   * Adds points for overlapping JD phrases like embeddings, retrieval, semantic search, ranking, production, deployed, evaluation, benchmark

6. **Recruiter Signals**
   * Open-to-work indicator adds score
   * Response rate multiplies relevance
   * Search appearance frequency contributes additional signal

### Final Score Calculation
* Final score is a weighted combination of semantic and rule-based scores.
* This produces explainable rankings with both `rule_score` and `semantic_score` visible.

## Project Structure
```text
TalentLens AI/
├── backend/
│   ├── rank_candidates.py
│   ├── config.yaml
│   └── ...
├── DATA/
│   ├── candidates.jsonl
│   ├── job_description.txt
│   └── sample_submission.csv
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── submission.csv
│   └── src/
│       ├── app.jsx
│       ├── index.css
│       ├── main.jsx
│       └── components/
├── output/
│   ├── submission.csv
│   └── crt_output.csv
├── requirements.txt
├── submission_deck.pdf
└── README.md
```

## Installation & Dependencies
### Python
```powershell
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

### Frontend
```powershell
cd frontend
npm install
```

## How to Run
### Backend ranking
```powershell
cd "C:\Users\acer\OneDrive\Desktop\TalentLens AI"
.venv\Scripts\activate
python backend\rank_candidates.py
```

### Frontend dashboard
```powershell
cd frontend
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

## Output Format
The backend generates `output/submission.csv` with these columns:
* `candidate_id`
* `rank`
* `score`
* `rule_score`
* `semantic_score`

The latest ranked output is available in `output/submission.csv`
```text
The latest ranked output is available in `output/submission.csv`
Top 10 candidates in the current ranking:

| Rank | Candidate ID | Score | Rule Score | Semantic Score |
|------|--------------|-------|------------|----------------|
| 1 | CAND_0001218 | 0.7384 | 0.8267 | 0.7005 |
| 2 | CAND_0001021 | 0.6515 | 0.4243 | 0.7489 |
| 3 | CAND_0000699 | 0.6505 | 0.4606 | 0.7319 |
| 4 | CAND_0000007 | 0.6499 | 0.3560 | 0.7759 |
| 5 | CAND_0001082 | 0.6496 | 0.3733 | 0.7680 |
| 6 | CAND_0002446 | 0.6417 | 0.3733 | 0.7567 |
| 7 | CAND_0003114 | 0.6392 | 0.3202 | 0.7760 |
| 8 | CAND_0000217 | 0.6388 | 0.4050 | 0.7391 |
| 9 | CAND_0003693 | 0.6384 | 0.2928 | 0.7865 |
| 10 | CAND_0002974 | 0.6382 | 0.3654 | 0.7551 |
```

## Scoring Philosophy
The system balances:
* Semantic fit from deep sentence embeddings
* Explicit role signals from recruiter-driven keywords
* Career trajectory and experience level
* Platform activity and engagement signals

This hybrid approach is more robust than keyword-only ranking because it can surface candidates who describe the same skills using different language.

## Methodology Transparency
Why hybrid scoring?
* Semantic embeddings capture meaning beyond exact text matches.
* Rule-based scoring preserves interpretability and domain signal.
* Combined scoring gives a recruiter a ranked shortlist that is both relevant and explainable.

## Result

The system produces a ranked list of the top 100 candidates with full explainability scores. The dashboard enables recruiters to:

Review ranked candidates with confidence scores
Understand what drove each ranking decision (rule vs. semantic)
Search and filter by criteria
Chat with an AI assistant for insights about candidates
The approach balances modern AI techniques (semantic embeddings) with proven traditional signals (keyword matching), creating a more robust and interpretable ranking system.