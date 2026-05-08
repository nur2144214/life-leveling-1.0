import { UserProfile } from "../types";
import { apiRequest } from "../lib/api";

export async function generateQuests(user: UserProfile, context: { date: string, recentActivity?: string }) {
  try {
    return await apiRequest('/quests/generate/', {
      method: 'POST',
      body: JSON.stringify({ user, context }),
    });
  } catch (error) {
    console.error("Error generating quests:", error);
    return [];
  }
}