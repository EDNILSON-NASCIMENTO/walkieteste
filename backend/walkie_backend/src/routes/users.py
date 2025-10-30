import os
import uuid
from flask import Blueprint, request, jsonify
# Importe os models corretos
from src.models.models import db, User, Pet, Walk, UserBadge 
from src.routes.auth import verify_token
from functools import wraps
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from os import getenv

# Carrega o .env (necessário APENAS se você usar o getenv em outro lugar)
load_dotenv()

users_bp = Blueprint('users', __name__)

# --- CONFIGURAÇÃO DE UPLOAD ---
# Pasta para fotos de perfil de USUÁRIO
PROFILE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'static', 'uploads', 'profiles')
# (NOVO) Pasta para fotos de PET
PET_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'static', 'uploads', 'pets')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Verifica se a extensão do arquivo é permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
# --- FIM DA CONFIGURAÇÃO DE UPLOAD ---


def token_required(f):
    """Decorator para verificar autenticação"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token de acesso é obrigatório'}), 401
        
        try:
            # Remove 'Bearer ' do token se presente
            if token.startswith('Bearer '):
                token = token[7:]
            
            user_id = verify_token(token)
            if not user_id:
                return jsonify({'error': 'Token inválido'}), 401
            
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({'error': 'Usuário não encontrado'}), 404
            
        except Exception as e:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# --- Rotas de Perfil (Sem alteração) ---
@users_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Obter perfil do usuário logado"""
    try:
        # Buscar estatísticas do usuário
        total_walks = Walk.query.filter_by(user_id=current_user.id).count()
        total_distance = db.session.query(db.func.sum(Walk.distance)).filter_by(user_id=current_user.id).scalar() or 0
        total_badges = UserBadge.query.filter_by(user_id=current_user.id).count()
        
        profile_data = current_user.to_dict()
        profile_data.update({
            'statistics': {
                'total_walks': total_walks,
                'total_distance': round(total_distance / 1000, 2),  # Converter para km
                'total_badges': total_badges
            }
        })
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Atualizar perfil do usuário (APENAS DADOS DE TEXTO, ex: nome)"""
    try:
        data = request.get_json()
        
        if data.get('name'):
            current_user.name = data['name']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile/upload', methods=['POST'])
@token_required
def upload_profile_picture(current_user):
    """Lida com o UPLOAD da foto de perfil"""
    if 'profile_picture' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado (procure por 'profile_picture')"}), 400

    file = request.files['profile_picture']

    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{current_user.id}_{uuid.uuid4()}.{ext}"
        
        # Usa a pasta de UPLOAD DE PERFIL
        os.makedirs(PROFILE_UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(PROFILE_UPLOAD_FOLDER, filename)
        file.save(filepath)

        # --- CORREÇÃO AQUI ---
        # Remova o 'base_url'. Salve APENAS o caminho relativo.
        file_url = f"/static/uploads/profiles/{filename}"
        # --- FIM DA CORREÇÃO ---

        current_user.profile_picture = file_url
        db.session.commit()

        return jsonify({
            "message": "Upload bem-sucedido", 
            "user": current_user.to_dict()
        }), 200
    else:
        return jsonify({"error": "Tipo de arquivo não permitido"}), 400

# --- Rotas de Pet (ATUALIZADAS) ---

@users_bp.route('/pets', methods=['GET'])
@token_required
def get_pets(current_user):
    """Obter pets do usuário"""
    try:
        pets = Pet.query.filter_by(owner_id=current_user.id).all()
        return jsonify([pet.to_dict() for pet in pets]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/pets', methods=['POST'])
@token_required
def create_pet(current_user):
    """Criar novo pet (APENAS DADOS DE TEXTO)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Nome do pet é obrigatório'}), 400
        
        pet = Pet(
            name=data['name'],
            breed=data.get('breed'),
            age=data.get('age'),
            weight=data.get('weight'),
            # profile_picture é ignorado aqui, será salvo via upload
            preferences=data.get('preferences'),
            owner_id=current_user.id
        )
        
        db.session.add(pet)
        db.session.commit()
        
        return jsonify({
            'message': 'Pet cadastrado com sucesso',
            'pet': pet.to_dict() # Retorna o pet com o novo ID
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/pets/<int:pet_id>', methods=['PUT'])
@token_required
def update_pet(current_user, pet_id):
    """Atualizar dados do pet (APENAS DADOS DE TEXTO)"""
    try:
        pet = Pet.query.filter_by(id=pet_id, owner_id=current_user.id).first()
        
        if not pet:
            return jsonify({'error': 'Pet não encontrado'}), 404
        
        data = request.get_json()
        
        if data.get('name'):
            pet.name = data['name']
        if data.get('breed'):
            pet.breed = data['breed']
        if data.get('age'):
            pet.age = data['age']
        if data.get('weight'):
            pet.weight = data['weight']
        if data.get('preferences'):
            pet.preferences = data['preferences']
        # profile_picture é ignorado aqui, será salvo via upload
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pet atualizado com sucesso',
            'pet': pet.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/pets/<int:pet_id>', methods=['DELETE'])
@token_required
def delete_pet(current_user, pet_id):
    """Deletar pet"""
    try:
        pet = Pet.query.filter_by(id=pet_id, owner_id=current_user.id).first()
        
        if not pet:
            return jsonify({'error': 'Pet não encontrado'}), 404
        
        db.session.delete(pet)
        db.session.commit()
        
        return jsonify({'message': 'Pet removido com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ---
# --- NOVA ROTA DE UPLOAD DE FOTO DE PET ADICIONADA AQUI ---
# ---
@users_bp.route('/pets/<int:pet_id>/upload', methods=['POST'])
@token_required
def upload_pet_picture(current_user, pet_id):
    """Lida com o UPLOAD da foto de um pet específico"""
    
    # 1. Verifica se o pet existe e pertence ao usuário
    pet = Pet.query.filter_by(id=pet_id, owner_id=current_user.id).first()
    if not pet:
        return jsonify({'error': 'Pet não encontrado ou não autorizado'}), 404

    # 2. Verifica o arquivo
    if 'profile_picture' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado (procure por 'profile_picture')"}), 400
    
    file = request.files['profile_picture']

    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    # 3. Salva o arquivo
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"pet_{pet_id}_{uuid.uuid4()}.{ext}"
        
        # Usa a (NOVA) pasta de UPLOAD DE PET
        os.makedirs(PET_UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(PET_UPLOAD_FOLDER, filename)
        file.save(filepath)

        # --- CORREÇÃO AQUI ---
        # Remova o 'base_url'. Salve APENAS o caminho relativo.
        file_url = f"/static/uploads/pets/{filename}" 
        # --- FIM DA CORREÇÃO ---

        # 4. Atualiza o pet no banco
        pet.profile_picture = file_url
        db.session.commit()

        return jsonify({
            "message": "Upload do pet bem-sucedido", 
            "pet": pet.to_dict()
        }), 200
    else:
        return jsonify({"error": "Tipo de arquivo não permitido"}), 400

# --- Rota de Dashboard (Sem alteração) ---
@users_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    """Obter dados do dashboard"""
    try:
        # Últimos passeios
        recent_walks = Walk.query.filter_by(user_id=current_user.id)\
                                .order_by(Walk.created_at.desc())\
                                .limit(5).all()
        
        # Estatísticas do dia atual
        from datetime import date
        today = date.today()
        today_walks = Walk.query.filter_by(user_id=current_user.id)\
                               .filter(db.func.date(Walk.created_at) == today).all()
        
        today_distance = sum([walk.distance or 0 for walk in today_walks]) / 1000  # em km
        today_points = sum([walk.points_earned or 0 for walk in today_walks])
        
        # Badges recentes
        recent_badges = UserBadge.query.filter_by(user_id=current_user.id)\
                                      .order_by(UserBadge.earned_at.desc())\
                                      .limit(3).all()
        
        return jsonify({
            'recent_walks': [walk.to_dict() for walk in recent_walks],
            'today_stats': {
                'walks_count': len(today_walks),
                'distance': round(today_distance, 2),
                'points': today_points
            },
            'recent_badges': [badge.to_dict() for badge in recent_badges],
            'total_points': current_user.total_points
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500