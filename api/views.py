from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import date

from .models import Quest, UserProfile
from .serializers import QuestSerializer, UserProfileSerializer
from .auth import generate_jwt
from .gemini_servise import generate_quests as gemini_generate  # ← переименовали
from .utils import parse_gemini_json

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'PATCH':
        data = request.data
        if 'goals' in data and data['goals'] is not None:
            profile.goals = data['goals']
        if 'level' in data and data['level'] is not None:
            profile.level = data['level']
        if 'xp' in data and data['xp'] is not None:
            profile.xp = data['xp']
        
        # Обработка атрибутов если пришли отдельно
        attrs = data.get('attributes', {})
        if attrs:
            if attrs.get('strength') is not None:
                profile.strength = attrs['strength']
            if attrs.get('intelligence') is not None:
                profile.intelligence = attrs['intelligence']
            if attrs.get('creativity') is not None:
                profile.creativity = attrs['creativity']
            if attrs.get('stamina') is not None:
                profile.stamina = attrs['stamina']
        
        profile.save()
    
    return Response({
        'uid': request.user.id,
        'email': request.user.email,
        'displayName': request.user.username,
        'goals': profile.goals,
        'level': profile.level,
        'xp': profile.xp,
        'attributes': {
            'strength': profile.strength,
            'intelligence': profile.intelligence,
            'creativity': profile.creativity,
            'stamina': profile.stamina,
        }
    })
    
@api_view(['POST'])
@permission_classes([AllowAny])
def dev_login(request):
    user, created = User.objects.get_or_create(username='dev_user')
    if created:  # только для нового пользователя
        user.set_password('dev')
        user.save()
    token = generate_jwt(user)
    return Response({'token': token})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Неверные данные'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = generate_jwt(user)
    return Response({'token': token})


@api_view(['GET'])
def get_quests(request):
    today = date.today()
    # Удаляем завершённые квесты не за сегодня
    Quest.objects.filter(
        user=request.user,
        status='completed'
    ).exclude(date=today).delete()
    
    # Возвращаем только сегодняшние квесты
    quests = Quest.objects.filter(user=request.user, date=today)
    return Response(QuestSerializer(quests, many=True).data)


# api/views.py
from google.api_core.exceptions import ResourceExhausted

from google.api_core.exceptions import ResourceExhausted

from google.api_core.exceptions import ResourceExhausted

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quests_view(request):
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    try:
        # Теперь 'data' — это уже распарсенный список (list)
        data = gemini_generate(user_profile.goals)
        
        # Если API вернуло пустой список из-за лимитов или ошибок
        if not data:
            return Response(
                {"message": "Не удалось сгенерировать квесты. Попробуйте через пару минут."}, 
                status=503
            )
            
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        return Response({"message": "Ошибка на стороне сервера нейросети."}, status=500)

    # УБИРАЕМ строку data = parse_gemini_json(raw), 
    # так как генератор сам вернул JSON через json.loads()

    created = []
    try:
        for q in data:
            obj = Quest.objects.create(
                user=request.user,
                title=q.get("title", "Без названия"),
                description=q.get("description", ""),
                difficulty=q.get("difficulty", "easy"),
                attribute=q.get("attribute", "strength"),
                xp_reward=q.get("xp_reward", 10),
                status="pending"
            )
            created.append(obj)
    except (KeyError, TypeError) as e:
        print(f"Ошибка структуры JSON: {e}")
        return Response({"message": "Нейросеть прислала неверный формат данных."}, status=400)

    return Response(QuestSerializer(created, many=True).data)


from django.shortcuts import get_object_or_404

@api_view(['PATCH'])
@permission_classes([IsAuthenticated]) # Не забудьте добавить защиту здесь тоже
def update_quest(request, id):
    quest = get_object_or_404(Quest, id=id, user=request.user)
    quest.status = request.data.get("status", quest.status)
    quest.save()
    return Response(QuestSerializer(quest).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_quest(request, id):
    quest = get_object_or_404(Quest, id=id, user=request.user)
    
    if quest.status == 'completed':
        return Response({'message': 'Квест уже завершён'}, status=400)
    
    # Завершаем квест
    quest.status = 'completed'
    quest.save()
    
    # Обновляем профиль
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    # Добавляем XP
    profile.xp += quest.xp_reward
    
    # Проверяем левелап
    while profile.xp >= profile.level * 100:
        profile.xp -= profile.level * 100
        profile.level += 1
    
    # Добавляем атрибут
    if quest.attribute == 'strength':
        profile.strength += quest.xp_reward
    elif quest.attribute == 'intelligence':
        profile.intelligence += quest.xp_reward
    elif quest.attribute == 'creativity':
        profile.creativity += quest.xp_reward
    elif quest.attribute == 'stamina':
        profile.stamina += quest.xp_reward
    
    profile.save()
    
    return Response({
        'quest': QuestSerializer(quest).data,
        'profile': {
            'level': profile.level,
            'xp': profile.xp,
            'attributes': {
                'strength': profile.strength,
                'intelligence': profile.intelligence,
                'creativity': profile.creativity,
                'stamina': profile.stamina,
            }
        }
    })


from django.utils import timezone
import calendar

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quest_stats(request):
    today = date.today()
    first_day = today.replace(day=1)
    
    total_completed = Quest.objects.filter(user=request.user, status='completed').count()
    monthly_completed = Quest.objects.filter(
        user=request.user, 
        status='completed',
        date__gte=first_day,
        date__lte=today
    ).count()
    
    return Response({
        'total_completed': total_completed,
        'monthly_completed': monthly_completed,
    })