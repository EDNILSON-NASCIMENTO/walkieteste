from flask import Blueprint, request, jsonify
from src.models.models import db, User
import jwt
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# SECRET_KEY = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    # Em um ambiente de produção, é crucial que essa variável esteja definida.
    # O programa irá falhar se não a encontrar, o que é um comportamento seguro.
    raise ValueError("A variável de ambiente SECRET_KEY não foi definida.")

def generate_token(user_id):
    """Gera um token JWT para o usuário"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token válido por 7 dias
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verifica e decodifica um token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint para cadastro de novos usuários"""
    try:
        data = request.get_json()
        
        # Validação dos dados
        if not data or not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Email, senha e nome são obrigatórios'}), 400
        
        # Verificar se o usuário já existe
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email já cadastrado'}), 409
        
        # Criar novo usuário
        user = User(
            email=data['email'],
            name=data['name']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Gerar token
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'Usuário cadastrado com sucesso',
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint para login de usuários"""
    try:
        data = request.get_json()
        
        # Validação dos dados
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Buscar usuário
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Email ou senha inválidos'}), 401
        
        # Gerar token
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_user_token():
    """Endpoint para verificar se um token é válido"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token é obrigatório'}), 400
        
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Token inválido ou expirado'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Endpoint para recuperação de senha (placeholder)"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Email não encontrado'}), 404
        
        # TODO: Implementar envio de email para recuperação de senha
        # Por enquanto, apenas retorna uma mensagem de sucesso
        
        return jsonify({
            'message': 'Instruções para recuperação de senha foram enviadas para seu email'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

