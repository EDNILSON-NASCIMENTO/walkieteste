# Em: backend/walkie_backend/src/utils/decorators.py
# (Arquivo Novo)

from functools import wraps
from flask import jsonify, request
# Importa o modelo User e a função de verificação de token do seu auth.py
from src.models.models import User 
from src.routes.auth import verify_token 

def get_current_user_from_request():
    """
    Extrai, verifica o token JWT do header 'Authorization' e retorna o objeto User.
    Retorna None se o token for inválido, ausente ou o usuário não for encontrado.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    # Extrai o token da string 'Bearer <token>'
    token = auth_header.split(' ')[1]
    user_id = verify_token(token) # Usa sua função de verificação

    if not user_id:
        return None

    # Buscar usuário pelo ID no banco de dados
    return User.query.get(user_id)

def admin_required(f):
    """
    Decorador para rotas Flask que requerem privilégios de administrador.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user_from_request()

        # Checagem 1: Usuário autenticado (token válido)
        if not current_user:
            return jsonify(
                {'error': "Autenticação necessária. Token inválido ou expirado."}
            ), 401

        # Checagem 2: Privilégio de administrador
        if current_user.role != 'admin':
            return jsonify(
                {'error': "Acesso não permitido. Requer privilégios de administrador."}
            ), 403
        
        # Se for admin, executa a função da rota
        return f(*args, **kwargs)
        
    return decorated_function

def login_required(f):
    """Decorador para rotas que requerem qualquer usuário logado (opcional)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user_from_request()
        if not current_user:
            return jsonify(
                {'error': "Autenticação necessária. Token inválido ou expirado."}
            ), 401
        
        return f(*args, **kwargs)

    return decorated_function