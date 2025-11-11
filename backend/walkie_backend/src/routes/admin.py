# Em: backend/walkie_backend/src/routes/admin.py
# (Arquivo Novo)

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
# Importa o decorador de segurança
from src.utils.decorators import admin_required 
# Importa os modelos e o 'db'
from src.models.models import User, Pet, Walk, db 

admin_bp = Blueprint('admin', __name__)

# --- Gestão de Usuários ---
@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """Lista todos os usuários para a interface administrativa."""
    users = User.query.all()
    # User.to_dict() agora inclui 'role'
    return jsonify([u.to_dict() for u in users])

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Exclui um usuário e suas entidades associadas (pets, etc.)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    
    # Seus modelos já estão configurados com 'cascade='all, delete-orphan'
    # o que deve lidar com a exclusão de pets e passeios associados.
    
    db.session.delete(user)
    db.session.commit()
    # Retorno 204 (No Content) é comum para DELETE, mas 200 com msg tbm é ok.
    return jsonify({"message": f"Usuário {user_id} excluído."}), 200

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    """Atualiza dados de um usuário (incluindo o role)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    data = request.json
    
    if 'role' in data:
        if data['role'] in ['admin', 'user']:
             user.role = data['role']
        else:
             return jsonify({"error": "Role inválido"}), 400
    
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Adicionar verificação se o email novo já existe
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({"error": "Email já em uso"}), 409
        user.email = data['email']
    
    db.session.commit()
    return jsonify(user.to_dict()), 200

# --- Gestão de Pets ---
@admin_bp.route("/pets", methods=["GET"])
@admin_required
def list_all_pets():
    """Lista todos os pets cadastrados no sistema."""
    pets = Pet.query.all()
    return jsonify([p.to_dict() for p in pets])

@admin_bp.route("/pets/<int:pet_id>", methods=["DELETE"])
@admin_required
def delete_pet(pet_id):
    """Exclui um pet do sistema."""
    pet = Pet.query.get(pet_id)
    if not pet:
        return jsonify({"error": "Pet não encontrado"}), 404
    
    db.session.delete(pet)
    db.session.commit()
    return jsonify({"message": f"Pet {pet_id} excluído."}), 200

# --- Gestão de Passeios (Foco em Travados) ---
@admin_bp.route("/walks/stuck", methods=["GET"])
@admin_required
def list_stuck_walks():
    """
    Lista passeios 'abertos' (end_time is null) há mais de 4 horas.
    """
    # 4 horas de limite
    four_hours_ago = datetime.utcnow() - timedelta(hours=4)
    
    stuck_walks = Walk.query.filter(
        Walk.end_time == None, 
        Walk.start_time < four_hours_ago
    ).all()
    
    return jsonify([w.to_dict() for w in stuck_walks])

@admin_bp.route("/walks/<int:walk_id>/complete", methods=["POST"])
@admin_required
def complete_walk(walk_id):
    """Força a conclusão de um passeio travado."""
    walk = Walk.query.get(walk_id)
    if not walk:
        return jsonify({"error": "Passeio não encontrado"}), 404
    
    if walk.end_time is not None: 
        return jsonify({"error": "Passeio já estava concluído."}), 400
    
    # Define o fim do passeio como agora
    walk.end_time = datetime.utcnow()
    # Calcula a duração
    duration_seconds = (walk.end_time - walk.start_time).total_seconds()
    walk.duration = int(duration_seconds)
    # Você pode adicionar lógicas de pontos aqui se desejar
    
    db.session.commit()
    return jsonify({"message": f"Passeio {walk_id} concluído com sucesso."}), 200

@admin_bp.route("/walks/<int:walk_id>", methods=["DELETE"])
@admin_required
def delete_walk(walk_id):
    """Exclui um passeio (aberto ou não)."""
    walk = Walk.query.get(walk_id)
    if not walk:
        return jsonify({"error": "Passeio não encontrado"}), 404
    
    db.session.delete(walk)
    db.session.commit()
    return jsonify({"message": f"Passeio {walk_id} excluído."}), 200