import google.generativeai as genai
import os
import json
import time
from dotenv import load_dotenv
from google.api_core import exceptions

load_dotenv()

def generate_quests(goals: str):
    # Получаем ключ из окружения
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        raise ValueError("GEMINI_API_KEY не найден в переменных окружения")

    genai.configure(api_key=api_key)
    
    # Рекомендуется вынести инициализацию модели за пределы функции, 
    # но для простоты оставим здесь
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = fprompt = f"""
создай 4 квеста по целям

Цели игрока: "{goals}"

Требования к квестам:
- Квесты должны быть не смешаны между целями на каждую цель СВОЙ квест
-
- Квесты должны НАПРЯМУЮ помогать достичь целей игрока
- Первый квест — лёгкий (разминка), второй и третий — средний, четвертый сложный — сложный
- Каждый квест выполняется за ОДИН день
- Описание должно быть конкретным: что именно делать, сколько времени, как именно
- Название звучит эпично без кринжа

Атрибуты:
- strength — всё физическое (спорт, тренировки, тело)
- intelligence — умственное (учёба, чтение, изучение языков, программирование)  
- creativity — творческое (рисование, музыка, письмо, дизайн)
- stamina — режим и выносливость (медитация, прогулки, сон, здоровые привычки)

XP награда: easy = 20-40, medium = 40-70, hard = 70-100

Верни ТОЛЬКО JSON без лишнего текста:
[
    {{
        "title": "Название",
        "description": "Описание",
        "difficulty": "easy/medium/hard",
        "attribute": "strength/intelligence/creativity/stamina",
        "xp_reward": число
    }}
]
"""

    try:
        # Указываем generation_config, чтобы модель выдавала только JSON
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Проверяем наличие текста в ответе
        if not response.text:
            return []
            
        return json.loads(response.text)

    except exceptions.ResourceExhausted:
        print("Ошибка: Превышен лимит запросов (Quota Exceeded).")
        # Здесь можно вернуть пустой список или статические квесты
        return []
    except exceptions.InvalidArgument as e:
        print(f"Ошибка в параметрах или API ключе: {e}")
        return []
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")
        return []