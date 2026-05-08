from django.contrib.auth.models import User
from django.db import models
from datetime import date

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    goals = models.TextField(blank=True)

    strength = models.IntegerField(default=0)
    intelligence = models.IntegerField(default=0)
    creativity = models.IntegerField(default=0)
    stamina = models.IntegerField(default=0)


class Quest(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    ATTRIBUTE_CHOICES = [
        ('strength', 'Strength'),
        ('intelligence', 'Intelligence'),
        ('creativity', 'Creativity'),
        ('stamina', 'Stamina'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    attribute = models.CharField(max_length=20, choices=ATTRIBUTE_CHOICES)
    xp_reward = models.IntegerField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    date = models.DateField(default=date.today)