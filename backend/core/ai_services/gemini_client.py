import os
import json
from django.conf import settings
from google import genai
from google.genai import types


class GeminiClient:
    """Isolated Gemini provider wrapper.

    Keeping all Gemini-specific logic here means the AI provider can be
    swapped out later without touching the rest of the application.
    """

    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        self.available = bool(self.api_key)
        self.client = None
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-3.6-flash')
        if self.available:
            self.client = genai.Client(api_key=self.api_key)
    def generate_content(self, prompt, response_schema=None):
        if not self.available:
            raise Exception(
                "Gemini API key is not configured. Set GEMINI_API_KEY in your environment.")

        config = types.GenerateContentConfig(
            temperature=0.2,
            top_p=0.9,
            top_k=40,
            max_output_tokens=4096,
        )

        if response_schema:
            config.response_mime_type = 'application/json'
            config.response_schema = response_schema

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            text = response.text

            # Strip markdown code fences if present
            text = text.strip()
            if text.startswith('```'):
                lines = text.split('\n')
                lines = lines[1:] if lines[0].startswith('```') else lines
                if lines and lines[-1].strip() == '```':
                    lines = lines[:-1]
                text = '\n'.join(lines)

            if response_schema:
                return self._parse_json(text)
            return text
        except Exception as e:
            raise Exception(f"Gemini API call failed: {str(e)}")

    def _parse_json(self, text):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON object/array in the response
            import re
            match = re.search(r'\{.*\}|\[.*\]', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise Exception(f"Could not parse Gemini response as JSON: {text[:200]}")


_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client
