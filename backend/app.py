from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load model once at startup
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

# Non-English keyword detection
NON_ENGLISH_KEYWORDS = [
    # Spanish
    'paciente', 'dolor', 'fiebre', 'años', 'medicamento',
    'diagnóstico', 'tratamiento', 'enfermedad', 'prescribe',
    'embarazo', 'síntomas', 'médico', 'cirugía', 'pastillas',
    'hospital', 'receta', 'enfermero', 'sangre', 'pulmón',
    # French
    'douleur', 'fièvre', 'médicament', 'traitement',
    'maladie', 'chirurgie', 'médecin', 'hôpital', 'diagnostic',
    'symptômes', 'ordonnance', 'infirmier', 'sang', 'poumon',
    # Portuguese
    'dor', 'febre', 'tratamento', 'doença', 'cirurgia',
    'sintomas', 'receita', 'enfermeiro', 'sangue', 'pulmão'
]

def is_non_english(text):
    text_lower = text.lower()
    return any(word in text_lower for word in NON_ENGLISH_KEYWORDS)

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json
    note = data.get('note', '')
    if not note.strip():
        return jsonify({'error': 'No note provided'}), 400

    # Force Other for non-English
    if is_non_english(note):
        return jsonify({
            'prediction': 'Other',
            'confidence': 99.0,
            'probabilities': {
                'Cardiology': 0.0,
                'Gastroenterology': 0.0,
                'Neurology': 0.0,
                'Orthopedics': 0.0,
                'Other': 99.0
            },
            'keywords': ['non-english', 'language-detected']
        })

    prediction = model.predict([note])[0]
    proba = model.predict_proba([note])[0]
    classes = list(model.classes_)

    tfidf = model.named_steps['tfidf']
    clf = model.named_steps['classifier']
    feature_names = tfidf.get_feature_names_out()
    note_vector = tfidf.transform([note])
    pred_idx = classes.index(prediction)
    scores = note_vector.multiply(clf.coef_[pred_idx])
    top_indices = np.array(scores.todense()).flatten().argsort()[-8:][::-1]
    top_keywords = [feature_names[i] for i in top_indices]

    return jsonify({
        'prediction': prediction,
        'confidence': round(float(np.max(proba)) * 100, 1),
        'probabilities': {
            classes[i]: round(float(proba[i]) * 100, 1)
            for i in range(len(classes))
        },
        'keywords': top_keywords[:8]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')