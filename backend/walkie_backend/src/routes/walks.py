from flask import Blueprint, request, jsonify
from src.models.models import db, User, Pet, Walk, Badge, UserBadge
from src.routes.users import token_required
from datetime import datetime
import json
import math

walks_bp = Blueprint('walks', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcula a distância entre duas coordenadas usando a fórmula de Haversine"""
    R = 6371000  # Raio da Terra em metros
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def calculate_calories(distance_m, duration_s, weight_kg=70):
    """Calcula calorias queimadas baseado na distância, duração e peso"""
    # Fórmula aproximada: MET * peso * tempo_horas
    # Caminhada moderada = 3.5 METs
    if duration_s == 0:
        return 0
    
    speed_kmh = (distance_m / 1000) / (duration_s / 3600)
    
    # Ajustar MET baseado na velocidade
    if speed_kmh < 3:
        met = 2.5
    elif speed_kmh < 5:
        met = 3.5
    elif speed_kmh < 6:
        met = 4.3
    else:
        met = 5.0
    
    hours = duration_s / 3600
    calories = met * weight_kg * hours
    
    return int(calories)

def calculate_points(distance_m, duration_s):
    """Calcula pontos baseado na distância e duração do passeio"""
    # 1 ponto por 100m + 1 ponto por minuto
    distance_points = int(distance_m / 100)
    duration_points = int(duration_s / 60)
    
    return distance_points + duration_points

def check_and_award_badges(user_id):
    """Verifica e concede badges baseado nas atividades do usuário"""
    user = User.query.get(user_id)
    if not user:
        return
    
    # Verificar badge de primeiro passeio
    first_walk_badge = Badge.query.filter_by(condition_type='first_walk').first()
    if first_walk_badge:
        existing_badge = UserBadge.query.filter_by(user_id=user_id, badge_id=first_walk_badge.id).first()
        if not existing_badge:
            user_badge = UserBadge(user_id=user_id, badge_id=first_walk_badge.id)
            db.session.add(user_badge)
    
    # Verificar badge de streak diário (7 dias consecutivos)
    from datetime import date, timedelta
    today = date.today()
    streak_days = 0
    
    for i in range(7):
        check_date = today - timedelta(days=i)
        day_walks = Walk.query.filter_by(user_id=user_id)\
                             .filter(db.func.date(Walk.created_at) == check_date).first()
        if day_walks:
            streak_days += 1
        else:
            break
    
    if streak_days >= 7:
        streak_badge = Badge.query.filter_by(condition_type='daily_streak', condition_value=7).first()
        if streak_badge:
            existing_badge = UserBadge.query.filter_by(user_id=user_id, badge_id=streak_badge.id).first()
            if not existing_badge:
                user_badge = UserBadge(user_id=user_id, badge_id=streak_badge.id)
                db.session.add(user_badge)
    
    # Verificar badges de distância
    total_distance = db.session.query(db.func.sum(Walk.distance)).filter_by(user_id=user_id).scalar() or 0
    
    distance_badges = Badge.query.filter_by(condition_type='total_distance').all()
    for badge in distance_badges:
        if total_distance >= (badge.condition_value * 1000):  # condition_value em km
            existing_badge = UserBadge.query.filter_by(user_id=user_id, badge_id=badge.id).first()
            if not existing_badge:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
                db.session.add(user_badge)

@walks_bp.route('/start', methods=['POST'])
@token_required
def start_walk(current_user):
    """Iniciar um novo passeio"""
    try:
        data = request.get_json()
        
        if not data or not data.get('pet_id'):
            return jsonify({'error': 'ID do pet é obrigatório'}), 400
        
        # Verificar se o pet pertence ao usuário
        pet = Pet.query.filter_by(id=data['pet_id'], owner_id=current_user.id).first()
        if not pet:
            return jsonify({'error': 'Pet não encontrado'}), 404
        
        # Verificar se não há passeio em andamento
        active_walk = Walk.query.filter_by(user_id=current_user.id, end_time=None).first()
        if active_walk:
            return jsonify({'error': 'Já existe um passeio em andamento'}), 409
        
        # Criar novo passeio
        walk = Walk(
            start_time=datetime.utcnow(),
            user_id=current_user.id,
            pet_id=data['pet_id']
        )
        
        db.session.add(walk)
        db.session.commit()
        
        return jsonify({
            'message': 'Passeio iniciado com sucesso',
            'walk': walk.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@walks_bp.route('/update/<int:walk_id>', methods=['PUT'])
@token_required
def update_walk(current_user, walk_id):
    """Atualizar dados do passeio em andamento"""
    try:
        walk = Walk.query.filter_by(id=walk_id, user_id=current_user.id).first()
        
        if not walk:
            return jsonify({'error': 'Passeio não encontrado'}), 404
        
        if walk.end_time:
            return jsonify({'error': 'Passeio já foi finalizado'}), 409
        
        data = request.get_json()
        
        # Atualizar coordenadas da rota
        if data.get('route_data'):
            walk.route_data = json.dumps(data['route_data'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Passeio atualizado com sucesso',
            'walk': walk.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@walks_bp.route('/finish/<int:walk_id>', methods=['PUT'])
@token_required
def finish_walk(current_user, walk_id):
    """Finalizar um passeio"""
    try:
        walk = Walk.query.filter_by(id=walk_id, user_id=current_user.id).first()
        
        if not walk:
            return jsonify({'error': 'Passeio não encontrado'}), 404
        
        if walk.end_time:
            return jsonify({'error': 'Passeio já foi finalizado'}), 409
        
        data = request.get_json()
        
        # Finalizar passeio
        walk.end_time = datetime.utcnow()
        walk.duration = int((walk.end_time - walk.start_time).total_seconds())
        
        # Calcular distância se houver dados de rota
        if data.get('route_data'):
            walk.route_data = json.dumps(data['route_data'])
            
            # Calcular distância total
            route_points = data['route_data']
            total_distance = 0
            
            for i in range(1, len(route_points)):
                prev_point = route_points[i-1]
                curr_point = route_points[i]
                
                distance = calculate_distance(
                    prev_point['lat'], prev_point['lng'],
                    curr_point['lat'], curr_point['lng']
                )
                total_distance += distance
            
            walk.distance = total_distance
        
        # Calcular métricas
        if walk.distance and walk.duration:
            # Ritmo médio (min/km)
            walk.average_pace = (walk.duration / 60) / (walk.distance / 1000)
            
            # Calorias (assumindo peso médio de 70kg)
            walk.calories = calculate_calories(walk.distance, walk.duration)
            
            # Pontos
            walk.points_earned = calculate_points(walk.distance, walk.duration)
            
            # Atualizar pontos totais do usuário
            current_user.total_points += walk.points_earned
        
        # Feedback opcional
        if data.get('feedback'):
            walk.feedback = data['feedback']
        
        db.session.commit()
        
        # Verificar e conceder badges
        check_and_award_badges(current_user.id)
        db.session.commit()
        
        return jsonify({
            'message': 'Passeio finalizado com sucesso',
            'walk': walk.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@walks_bp.route('/history', methods=['GET'])
@token_required
def get_walk_history(current_user):
    """Obter histórico de passeios do usuário"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        walks = Walk.query.filter_by(user_id=current_user.id)\
                         .filter(Walk.end_time.isnot(None))\
                         .order_by(Walk.created_at.desc())\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'walks': [walk.to_dict() for walk in walks.items],
            'total': walks.total,
            'pages': walks.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@walks_bp.route('/active', methods=['GET'])
@token_required
def get_active_walk(current_user):
    """Obter passeio ativo (em andamento)"""
    try:
        active_walk = Walk.query.filter_by(user_id=current_user.id, end_time=None).first()
        
        if not active_walk:
            return jsonify({'message': 'Nenhum passeio ativo'}), 404
        
        return jsonify(active_walk.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@walks_bp.route('/<int:walk_id>', methods=['GET'])
@token_required
def get_walk_details(current_user, walk_id):
    """Obter detalhes de um passeio específico"""
    try:
        walk = Walk.query.filter_by(id=walk_id, user_id=current_user.id).first()
        
        if not walk:
            return jsonify({'error': 'Passeio não encontrado'}), 404
        
        return jsonify(walk.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

