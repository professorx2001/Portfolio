import os
import sys
import json

sys.path.append(os.path.dirname(__file__))


# pyrefly: ignore [missing-import]
from groq import Groq
from system_prompt import SYSTEM_PROMPT

# Only these roles are passed to the model — prevents prompt injection via crafted history payloads
_ALLOWED_ROLES = {'user', 'assistant'}
_MAX_QUERY_LEN = 1000
_MAX_HISTORY_CONTENT_LEN = 2000
_ORIGIN = 'https://mdzakihussainx.netlify.app'

def handler(event, context):
    """
    Netlify Python Serverless Function Handler for X-Bot AI Chatbot
    Powered by Groq API (openai/gpt-oss-120b)
    """
    http_method = event.get('httpMethod', 'POST')
    
    # Handle CORS Preflight
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': _ORIGIN,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }

    if http_method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method Not Allowed'})
        }

    try:
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body)

        # Cap user query length to prevent quota drain / context overflow
        user_query = str(body.get('message', ''))[:_MAX_QUERY_LEN]
        history = body.get('history', [])

        if not user_query or not user_query.strip():
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': _ORIGIN,
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Message is required'})
            }

        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': _ORIGIN,
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'reply': "⚠️ System Down, Sorry for inconvenience."
                })
            }

        client = Groq(api_key=api_key)

        # Build messages payload for Groq OpenAI-compatible format
        messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]

        if history:
            for msg in history[-6:]:
                role = msg.get('role', '')
                # Whitelist only allowed roles — blocks system-role injection via crafted payloads
                if role not in _ALLOWED_ROLES:
                    continue
                content = str(msg.get('content', ''))[:_MAX_HISTORY_CONTENT_LEN]
                messages.append({'role': role, 'content': content})

        messages.append({'role': 'user', 'content': user_query})

        completion = client.chat.completions.create(
            model='openai/gpt-oss-120b',
            messages=messages,
            temperature=0,
            max_tokens=500,
            stream=True
        )

        reply_chunks = []
        for chunk in completion:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                reply_chunks.append(chunk.choices[0].delta.content)
        reply = "".join(reply_chunks) or "I couldn't generate a response."

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': _ORIGIN,
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'reply': reply})
        }

    except Exception as e:
        # Log internally — never expose raw exception strings to the client
        print(f"[chat.py ERROR] {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': _ORIGIN,
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'reply': '⚠️ Something went wrong. Please try again later.'})
        }
