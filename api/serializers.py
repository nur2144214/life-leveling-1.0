from rest_framework import serializers
from .models import Quest, UserProfile


class QuestSerializer(serializers.ModelSerializer):
    xpReward = serializers.IntegerField(source='xp_reward')
    
    class Meta:
        model = Quest
        fields = ['id', 'user', 'title', 'description', 'difficulty', 
                  'attribute', 'xpReward', 'status', 'date']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'