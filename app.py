from flask import Flask, request, jsonify, render_template
import requests, os
from dotenv import load_dotenv
from groq import Groq
load_dotenv()
app = Flask(__name__)

client = Groq(
        api_key = os.getenv('GROQ_API_KEY'),
    )

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/api/prompt", methods=["POST"])
def handlePrompt():
    prompt = request.json['prompt']
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.3-70b-versatile",
    )

    return jsonify({
        'response':chat_completion.choices[0].message.content
        })


if __name__ == '__main__':
    app.run(debug=True)