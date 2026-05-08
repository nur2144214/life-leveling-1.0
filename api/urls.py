from django.urls import path
from .views import dev_login, profile, get_quests, generate_quests_view, update_quest, complete_quest, quest_stats

urlpatterns = [
    path('login/', dev_login),
    path('profile/', profile),  # ← новый
    path('quests/', get_quests),
    path('quests/generate/', generate_quests_view),
    path('quests/<int:id>/', update_quest),
    path('quests/<int:id>/complete/', complete_quest),
    path('quests/stats/', quest_stats)]