import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from collections import Counter
import numpy as np
import pickle

# ── Label mapping ────────────────────────────────────────
def map_specialty(specialty):
    s = str(specialty).lower().strip()
    if any(x in s for x in ['cardio', 'pulmonary', 'vascular']):
        return 'Cardiology'
    elif any(x in s for x in ['neuro', 'neurosurg']):
        return 'Neurology'
    elif any(x in s for x in ['orthopedic', 'ortho']):
        return 'Orthopedics'
    elif any(x in s for x in ['gastro']):
        return 'Gastroenterology'
    else:
        return 'Other'

LABEL_MAP = {
    '1': 'Orthopedics',
    '2': 'Gastroenterology',
    '3': 'Neurology',
    '4': 'Cardiology',
    '5': 'Other'
}

# ── Load datasets ────────────────────────────────────────
print("Loading datasets...")
texts, labels = [], []

# Dataset 1 - train.dat (primary)
with open('train.dat', 'r') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 2 and parts[0] in LABEL_MAP:
            texts.append(parts[1])
            labels.append(LABEL_MAP[parts[0]])
print(f"train.dat samples: {len(texts)}")

# Dataset 2 - mtsamples.csv (supplementary)
try:
    df = pd.read_csv('mtsamples.csv', encoding='utf-8')
    df = df.dropna(subset=['transcription', 'medical_specialty'])
    df['category'] = df['medical_specialty'].apply(map_specialty)
    texts += list(df['transcription'])
    labels += list(df['category'])
    print(f"mtsamples.csv samples added: {len(df)}")
except:
    print("mtsamples.csv not found, continuing with train.dat only")

print(f"Total training samples: {len(texts)}")
print("Distribution:", Counter(labels))

# ── Train model ──────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42)

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words='english'
    )),
    ('classifier', LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        C=5
    ))
])

print("\nTraining model...")
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# ── Error analysis ───────────────────────────────────────
print("\n" + "="*50)
print("ERROR ANALYSIS")
print("="*50)

wrong = [(X_test[i], y_test[i], y_pred[i])
         for i in range(len(y_test))
         if y_test[i] != y_pred[i]]

print(f"Total errors: {len(wrong)} out of {len(y_test)}")
print(f"Error rate: {len(wrong)/len(y_test):.1%}")

print("\nMost common confusions:")
confusions = Counter([(true, pred) for _, true, pred in wrong])
for (true, pred), count in confusions.most_common(10):
    print(f"  {true} misclassified as {pred}: {count} times")

print("\nSample errors:")
for note, true, pred in wrong[:3]:
    print(f"\nTrue: {true} | Predicted: {pred}")
    print(f"Note: {note[:150]}...")

# ── Save model ───────────────────────────────────────────
with open('model.pkl', 'wb') as f:
    pickle.dump(pipeline, f)
print("\nModel saved to model.pkl")

# ── Parse final test file ────────────────────────────────
def parse_test_file(filename):
    cases = {}
    current_case = None
    current_text = []
    with open(filename, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('Case '):
                if current_case is not None:
                    cases[current_case] = ' '.join(current_text)
                current_case = int(line.replace('Case ', ''))
                current_text = []
            elif line:
                current_text.append(line)
        if current_case is not None:
            cases[current_case] = ' '.join(current_text)
    return cases

# ── Generate submission.csv ──────────────────────────────
try:
    print("\nLooking for final test file...")
    cases = parse_test_file('final_test.dat')
    case_numbers = list(cases.keys())
    notes = list(cases.values())

    predictions = pipeline.predict(notes)

    submission = pd.DataFrame({
        'case_number': case_numbers,
        'prediction': predictions
    })
    submission.to_csv('submission.csv', index=False)
    print(f"Submission saved to submission.csv")
    print(submission['prediction'].value_counts())
except FileNotFoundError:
    print("final_test.dat not ready yet - run again when test set arrives")

# ── Run on test.dat if exists ────────────────────────────
try:
    with open('test.dat', 'r') as f:
        test_notes = [line.strip() for line in f if line.strip()]
    predictions = pipeline.predict(test_notes)
    proba = pipeline.predict_proba(test_notes)
    results = pd.DataFrame({
        'note': test_notes,
        'predicted_specialty': predictions,
        'confidence': np.max(proba, axis=1).round(3)
    })
    results.to_csv('predictions.csv', index=False)
    print(f"\npredictions.csv saved ({len(test_notes)} notes)")
except FileNotFoundError:
    print("No test.dat found")