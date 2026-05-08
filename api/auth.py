# api/auth.py
import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
SECRET = settings.SECRET_KEY

def generate_jwt(user):
    payload = {
        "id": user.id
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth = request.headers.get("Authorization")

        if not auth:
            return None

        try:
            token = auth.split(" ")[1]
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            user = User.objects.get(id=payload["id"])
            return (user, None)
        except Exception:
            raise AuthenticationFailed("Invalid token")