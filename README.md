# ClinicalAI Classifier ⚕️

An NLP-powered clinical note classifier built for the CodaMetrix Calling 
Hackathon — June 13, 2026, Boston MA.

Classifies clinical notes into one of five medical specialties:
**Cardiology · Neurology · Orthopedics · Gastroenterology · Other**

---

## The Challenge

CodaMetrix challenged teams to build an NLP model that reads short clinical 
notes and predicts which medical specialty each one belongs to. This is the 
same task hospitals face when routing transcripts to the right department.

- Dataset: ~19,400 labeled clinical notes (train.dat + mtsamples.csv)
- Test set: 1,000 unseen cases

---

## What It Does

- Paste any clinical note and get instant specialty classification
- Displays confidence score and probability breakdown across all 5 specialties
- Highlights the exact keywords that drove the model's decision
- Flags acuity level (Urgent / Semi-Urgent / Routine)
- Recommends referral specialties when multiple are relevant
- Detects and routes any non-English notes (Spanish, French, Portuguese) to Other
- Supports file upload for classifying transcripts directly

---

## Tech Stack

**Backend**
- Python, Flask, scikit-learn
- TF-IDF vectorizer (20,000 features, unigrams + bigrams)
- Logistic Regression (balanced class weights, C=5)
- Trained on 19,404 labeled samples across two datasets

**Frontend**
- React 18
- CSS custom properties
- Axios for API calls

---

## Model Performance

| Metric | Value |
|---|---|
| Validation Accuracy | 56% |
| Training Samples | 19,404 |
| Test Cases Classified | 1,000 |
| Baseline (random) | 20% |

**Most common confusions:**
- Neurology ↔ Orthopedics (spine cases sit on the boundary of both)
- Other misclassified as clinical specialties (catch-all category is noisy)

---

## Getting Started

### Backend
```bash
cd backend
pip install pandas scikit-learn numpy flask flask-cors
python q.py        # trains model and saves model.pkl
python app.py      # starts Flask API on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start          # opens on localhost:3000
```

---

## Project Structure
clinical-note-classifier/

├── backend/

│   ├── q.py           # Model training + error analysis + submission CSV

│   ├── app.py         # Flask REST API

│   ├── model.pkl      # Trained model (generated after running q.py)

│   └── submission.csv # Final predictions submitted to judges

├── frontend/

│   └── src/

│       ├── App.jsx    # Main UI with explainability layer

│       └── App.css    # Styles

└── .gitignore

---

## What We'd Do Differently

- Replace TF-IDF with **ClinicalBERT** — pre-trained on medical literature, 
  would push accuracy from 56% to ~80%+
- Train on real EHR notes instead of published abstracts
- Add confidence thresholds — low confidence predictions flagged for 
  human review
- Expand to 20+ specialties beyond the 5 categories
- Direct EHR integration via FHIR API (Epic, Cerner)

---

## Team

- **Edwin Sorto Rosales** — React frontend, explainability UI, API integration
- **Shyam Sriram** — Python model, data pipeline, NLP model workflow
- **Kavya Sura** — Clinical domain expertise, error analysis, presentation

---

## Event

CodaMetrix Calling Hackathon
June 13, 2026 · 399 Boylston Street, Boston MA
