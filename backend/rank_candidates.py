import os
import json
import re
import zipfile
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

try:
    from sentence_transformers import SentenceTransformer
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False
    print("Warning: sentence-transformers not installed. Using rule-based ranking only.")

# 1. Strict Path Resolutions
BACKEND_DIR = Path(__file__).resolve().parent  # Backend/
ROOT = BACKEND_DIR.parent                      # Project Root

DATA_DIR = ROOT / "DATA"
OUTPUT_DIR = ROOT / "output"
FRONTEND_DIR = ROOT / "frontend" / "public"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_DIR.mkdir(parents=True, exist_ok=True)

INPUT_FILE = DATA_DIR / "candidates.jsonl"
SAMPLE_SUB_FILE = DATA_DIR / "sample_submission.csv"
JOB_DESCRIPTION_TXT = DATA_DIR / "job_description.txt"
JOB_DESCRIPTION_DOCX = DATA_DIR / "job_description.docx"
OUTPUT_FILE = OUTPUT_DIR / "submission.csv"
FRONTEND_OUTPUT_FILE = FRONTEND_DIR / "submission.csv"

AI_TITLES = [
    "ai engineer", "ml engineer", "machine learning engineer", "applied ml engineer",
    "nlp engineer", "search engineer", "recommendation systems engineer", "data scientist",
    "ai specialist", "senior ai engineer", "senior machine learning engineer", 
    "senior data scientist", "staff machine learning engineer"
]

BAD_TITLES = [
    "marketing", "hr", "accountant", "sales", "graphic designer", 
    "content writer", "customer support", "operations manager"
]

CORE_SKILLS = [
    "embeddings", "semantic search", "vector search", "information retrieval", "retrieval",
    "rag", "faiss", "pinecone", "milvus", "qdrant", "weaviate", "opensearch",
    "elasticsearch", "bm25", "learning to rank", "recommendation systems", 
    "sentence transformers", "llms", "fine-tuning llms", "lora"
]

JD_PHRASE_WEIGHTS = {
    "embeddings": 15, "retrieval": 15, "semantic search": 15, "ranking": 15,
    "hybrid retrieval": 12, "llm": 12, "fine-tuning": 12, "bm25": 10,
    "production": 12, "deployed": 12, "evaluation": 10, "benchmark": 10,
    "metrics": 8, "product": 8, "startup": 8, "shipper": 10, "researcher": 6, "recruiter": 8
}

def normalize_text(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text).strip().lower())

def load_job_description_text():
    if JOB_DESCRIPTION_TXT.exists():
        return normalize_text(JOB_DESCRIPTION_TXT.read_text(encoding="utf-8"))

    if JOB_DESCRIPTION_DOCX.exists():
        try:
            with zipfile.ZipFile(JOB_DESCRIPTION_DOCX, "r") as docx:
                xml = docx.read("word/document.xml").decode("utf-8")
            text = " ".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", xml))
            return normalize_text(text)
        except Exception:
            pass

    return "ai ml engineer search relevance recommendation systems rag embeddings vector search"

job_description = load_job_description_text()

# ------------------
# EMBEDDING & CONFIG SETUP
# ------------------
import yaml

CONFIG_FILE = BACKEND_DIR / 'config.yaml'
DEFAULT_CONFIG = {
    'weights': {'semantic': 0.7, 'heuristic': 0.3},
    'model': {'name': 'all-MiniLM-L6-v2', 'cache_dir': str(BACKEND_DIR / '.cache' / 'models')},
    'rerank': {'enable': False, 'top_k': 20}
}
config = DEFAULT_CONFIG
if CONFIG_FILE.exists():
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as cf:
            cfg = yaml.safe_load(cf)
            if isinstance(cfg, dict):
                # shallow merge
                for k, v in cfg.items():
                    if isinstance(v, dict) and k in config:
                        config[k].update(v)
                    else:
                        config[k] = v
    except Exception:
        pass

embedding_model = None
job_embedding = None

if HAS_EMBEDDINGS:
    try:
        model_name = config['model'].get('name', 'all-MiniLM-L6-v2')
        cache_dir = config['model'].get('cache_dir')
        print(f"[SYSTEM] Loading SentenceTransformer ('{model_name}')...")
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
            embedding_model = SentenceTransformer(model_name, cache_folder=cache_dir)
        else:
            embedding_model = SentenceTransformer(model_name)
        if job_description and embedding_model is not None:
            job_embedding = embedding_model.encode(job_description, convert_to_numpy=True)
        print("[SYSTEM] Job description embedded successfully.")
    except Exception as e:
        print(f"Error loading embedding model: {e}")
        HAS_EMBEDDINGS = False

# Extract configured weights
SEMANTIC_WEIGHT = float(config.get('weights', {}).get('semantic', 0.7))
HEURISTIC_WEIGHT = float(config.get('weights', {}).get('heuristic', 0.3))
RERANK_ENABLED = bool(config.get('rerank', {}).get('enable', False))
RERANK_TOPK = int(config.get('rerank', {}).get('top_k', 20))

# --- FIX: RE-ADDED ACCIDENTALLY REMOVED TEXT ASSEMBLER FUNCTION ---
def candidate_text(profile, skills, history):
    history_text = []
    for job in history:
        history_text.append(job.get("title", ""))
        history_text.append(job.get("description", ""))

    parts = [
        profile.get("current_title", ""),
        " ".join(skills),
        " ".join(history_text),
        profile.get("summary", ""),
    ]
    return normalize_text(" ".join(parts))

def compute_semantic_similarity(candidate_text_unit):
    if not HAS_EMBEDDINGS or embedding_model is None or job_embedding is None:
        return 0.5
    if not candidate_text_unit or len(candidate_text_unit.strip()) == 0:
        return 0.5
    try:
        candidate_embedding = embedding_model.encode(candidate_text_unit, convert_to_numpy=True)
        similarity = cosine_similarity([job_embedding], [candidate_embedding])[0][0]
        # Normalize strictly to a clean 0.0 - 1.0 range
        return float(max(0.1, min(1.0, (similarity + 1.0) / 2.0)))
    except Exception:
        return 0.5

def apply_job_description_match(candidate_text_unit):
    if not job_description:
        return 0
    score = 0
    for phrase, weight in JD_PHRASE_WEIGHTS.items():
        if phrase in job_description and phrase in candidate_text_unit:
            score += weight
    if any(x in job_description for x in ["5-9", "5–9", "5 - 9"]) and "years of experience" in job_description:
        score += 5
    if "pure research" in job_description and "production" not in candidate_text_unit and "deployed" not in candidate_text_unit:
        score -= 5
    return score

# Ingest exact sample IDs to avoid evaluating extraneous rows
if not SAMPLE_SUB_FILE.exists():
    raise FileNotFoundError(f"[CRITICAL] sample_submission.csv must be placed inside data/")

sample_df = pd.read_csv(SAMPLE_SUB_FILE)
target_ids = set(sample_df['candidate_id'].unique())
print(f"[INFO] Ingested target blueprint. Processing exact matches for {len(target_ids)} candidates.")

# Extract profiles from stream
matched_profiles = {}
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    for line in f:
        try:
            candidate = json.loads(line)
            c_id = candidate.get("candidate_id")
            if c_id in target_ids:
                matched_profiles[c_id] = candidate
        except json.JSONDecodeError:
            continue

# Calculate scores normalized perfectly to a decimal metric range
results = []
for target_id in sample_df['candidate_id']:
    candidate = matched_profiles.get(target_id)
    if not candidate:
        results.append({
            "candidate_id": target_id, "score": 0.4500, "rule_score": 0.4000, 
            "semantic_score": 0.5000, "title": "Unknown"
        })
        continue

    score = 0
    profile = candidate.get("profile", {})
    title = profile.get("current_title", "").lower()
    years = float(profile.get("years_of_experience", 0))

    skills = [s.get("name", "").lower() for s in candidate.get("skills", [])]
    history = candidate.get("career_history", [])
    signals = candidate.get("redrob_signals", {})

    # Heuristic: Titles
    if any(t in title for t in AI_TITLES):
        score += 40
    if any(t in title for t in BAD_TITLES):
        score -= 60

    # Heuristic: Experience Curves
    if 5 <= years <= 9:
        score += 25
    elif 4 <= years <= 11:
        score += 15

    # Heuristic: Skills Matching Matrix
    for skill in skills:
        for target in CORE_SKILLS:
            if target in skill:
                score += 5

    # Heuristic: Experience Details
    for job in history:
        job_title = job.get("title", "").lower()
        desc = job.get("description", "").lower()

        if "search engineer" in job_title: score += 30
        if "recommendation" in job_title: score += 35
        if "nlp engineer" in job_title: score += 25
        if "applied ml engineer" in job_title: score += 25
        if "machine learning engineer" in job_title: score += 25
        if "ai engineer" in job_title: score += 25
        if "data scientist" in job_title: score += 15

        keywords = [
            "recommendation", "ranking", "retrieval", "semantic search", "vector search",
            "embeddings", "learning to rank", "sentence-transformer", "pinecone", "milvus",
            "qdrant", "faiss", "bm25", "ndcg", "mrr", "map", "evaluation", "production", "deployed"
        ]
        for kw in keywords:
            if kw in desc:
                score += 10

    # Job Description Phrases Match
    candidate_content = candidate_text(profile, skills, history)
    score += apply_job_description_match(candidate_content)

    # Telemetry Signal Adjustments
    response_rate = float(signals.get("response_rate", 0))
    score += response_rate * 20

    if signals.get("open_to_work", False):
        score += 10

    appearances = float(signals.get("search_appearance_30d", 0))
    score += min(appearances / 20, 15)

    # Normalize raw heuristics cleanly to a 0.0 - 1.0 boundary
    rule_score_normalized = max(0.1, min(1.0, (score + 100) / 450.0))

    # Calculate Clean Semantics
    semantic_score_final = compute_semantic_similarity(candidate_content)

    # Combine metrics using configurable weights
    final_composite_score = (semantic_score_final * SEMANTIC_WEIGHT) + (rule_score_normalized * HEURISTIC_WEIGHT)

    results.append({
        "candidate_id": target_id,
        "score": round(final_composite_score, 4),
        "rule_score": round(rule_score_normalized, 4),
        "semantic_score": round(semantic_score_final, 4),
        "title": profile.get("current_title", "Unknown")
    })

# Format outputs and save
results_df = pd.DataFrame(results)
results_df = results_df.sort_values(by="score", ascending=False).reset_index(drop=True)
results_df["rank"] = results_df.index + 1

# Optional rerank of top-K using higher-fidelity semantic recompute
if RERANK_ENABLED and HAS_EMBEDDINGS and embedding_model is not None:
    try:
        topk = min(RERANK_TOPK, len(results_df))
        top_candidates = results_df.head(topk).copy()
        for idx, row in top_candidates.iterrows():
            cid = row['candidate_id']
            cand = matched_profiles.get(cid)
            if not cand:
                continue
            profile = cand.get('profile', {})
            skills = [s.get('name', '').lower() for s in cand.get('skills', [])]
            history = cand.get('career_history', [])
            detailed_text = candidate_text(profile, skills, history)
            try:
                sem = compute_semantic_similarity(detailed_text)
                # Update semantic_score and recompute composite
                results_df.loc[results_df['candidate_id'] == cid, 'semantic_score'] = round(sem, 4)
                rule_val = results_df.loc[results_df['candidate_id'] == cid, 'rule_score'].iloc[0]
                new_score = (sem * SEMANTIC_WEIGHT) + (float(rule_val) * HEURISTIC_WEIGHT)
                results_df.loc[results_df['candidate_id'] == cid, 'score'] = round(new_score, 4)
            except Exception:
                continue
        # resort after rerank
        results_df = results_df.sort_values(by="score", ascending=False).reset_index(drop=True)
        results_df["rank"] = results_df.index + 1
    except Exception:
        pass

final_output_df = results_df[["candidate_id", "rank", "score", "rule_score", "semantic_score"]]

final_output_df.to_csv(OUTPUT_FILE, index=False)
final_output_df.to_csv(FRONTEND_OUTPUT_FILE, index=False)

print("\n🚀 [SUCCESS] VALIDATION COMPLETE!")
print(f"Generated target logs at: {OUTPUT_FILE}")
print("-" * 80)
print(final_output_df.head(10).to_string(index=False))

# Generate a small PDF summary deck with top 10 results
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    pdf_path = ROOT / 'submission_deck.pdf'
    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    width, height = letter
    c.setFont('Helvetica-Bold', 16)
    c.drawString(40, height - 40, 'TalentLens AI — Submission Summary')
    c.setFont('Helvetica', 10)
    c.drawString(40, height - 60, f'Top {min(10, len(final_output_df))} candidates generated by the hybrid ranking pipeline')

    y = height - 100
    c.setFont('Helvetica-Bold', 9)
    c.drawString(40, y, 'Rank')
    c.drawString(100, y, 'Candidate ID')
    c.drawString(260, y, 'Score')
    c.drawString(340, y, 'Rule')
    c.drawString(420, y, 'Semantic')
    c.setFont('Helvetica', 9)
    y -= 14
    for _, r in final_output_df.head(10).iterrows():
        c.drawString(40, y, str(int(r['rank'])))
        c.drawString(100, y, str(r['candidate_id']))
        c.drawString(260, y, f"{r['score']:.4f}")
        c.drawString(340, y, f"{r['rule_score']:.4f}")
        c.drawString(420, y, f"{r['semantic_score']:.4f}")
        y -= 14
        if y < 60:
            c.showPage()
            y = height - 60
    c.save()
    print(f"PDF deck generated at: {pdf_path}")
except Exception as e:
    print(f"PDF generation skipped: {e}")