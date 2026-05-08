import json
import re


def parse_gemini_json(text: str):
    text = re.sub(r"```json|```", "", text)

    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        return []

    try:
        return json.loads(match.group(0))
    except:
        return []