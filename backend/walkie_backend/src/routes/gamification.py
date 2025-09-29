from flask import Blueprint, request, jsonify
from src.models.models import db, User, Badge, UserBadge, Ranking, Walk
from src.routes.users import token_required
from datetime import datetime, timedelta
from sqlalchemy import desc, func

gamification_bp = Blueprint('gamification', __name__)

@gamification_bp.route('/badges', methods=['GET'])
@token_required
def get_available_badges(current_user):
    """Obter todos os badges disponíveis"""
    try:
        badges = Badge.query.all()
        
        # Verificar quais badges o usuário já possui
        user_badges = UserBadge.query.filter_by(user_id=current_user.id).all()
        user_badge_ids = [ub.badge_id for ub in user_badges]
        
        badges_data = []
        for badge in badges:
            badge_dict = badge.to_dict()
            badge_dict['earned'] = badge.id in user_badge_ids
            badge_dict['earned_at'] = None
            
            # Se o usuário possui o badge, adicionar data de conquista
            if badge.id in user_badge_ids:
                user_badge = next(ub for ub in user_badges if ub.badge_id == badge.id)
                badge_dict['earned_at'] = user_badge.earned_at.isoformat()
            
            badges_data.append(badge_dict)
        
        return jsonify(badges_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gamification_bp.route('/my-badges', methods=['GET'])
@token_required
def get_user_badges(current_user):
    """Obter badges conquistados pelo usuário"""
    try:
        user_badges = UserBadge.query.filter_by(user_id=current_user.id)\
                                    .order_by(UserBadge.earned_at.desc()).all()
        
        return jsonify([ub.to_dict() for ub in user_badges]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gamification_bp.route('/ranking', methods=['GET'])
@token_required
def get_ranking(current_user):
    """Obter ranking de usuários"""
    try:
        rank_type = request.args.get('type', 'global')  # 'global' ou 'local'
        period = request.args.get('period', 'all_time')  # 'weekly', 'monthly', 'all_time'
        limit = request.args.get('limit', 50, type=int)
        
        # Calcular pontos baseado no período
        query = db.session.query(
            User.id,
            User.name,
            User.profile_picture,
            func.sum(Walk.points_earned).label('total_points')
        ).join(Walk, User.id == Walk.user_id)
        
        # Filtrar por período
        if period == 'weekly':
            week_ago = datetime.utcnow() - timedelta(days=7)
            query = query.filter(Walk.created_at >= week_ago)
        elif period == 'monthly':
            month_ago = datetime.utcnow() - timedelta(days=30)
            query = query.filter(Walk.created_at >= month_ago)
        
        # Agrupar e ordenar
        ranking_data = query.group_by(User.id, User.name, User.profile_picture)\
                           .order_by(desc('total_points'))\
                           .limit(limit).all()
        
        # Formatar dados do ranking
        ranking = []
        for i, (user_id, name, profile_picture, points) in enumerate(ranking_data, 1):
            ranking.append({
                'position': i,
                'user_id': user_id,
                'name': name,
                'profile_picture': profile_picture,
                'points': int(points or 0),
                'is_current_user': user_id == current_user.id
            })
        
        # Encontrar posição do usuário atual se não estiver no top
        current_user_position = None
        for item in ranking:
            if item['is_current_user']:
                current_user_position = item['position']
                break
        
        if not current_user_position:
            # Calcular posição do usuário atual
            user_points_query = db.session.query(func.sum(Walk.points_earned))\
                                         .filter_by(user_id=current_user.id)
            
            if period == 'weekly':
                week_ago = datetime.utcnow() - timedelta(days=7)
                user_points_query = user_points_query.filter(Walk.created_at >= week_ago)
            elif period == 'monthly':
                month_ago = datetime.utcnow() - timedelta(days=30)
                user_points_query = user_points_query.filter(Walk.created_at >= month_ago)
            
            user_points = user_points_query.scalar() or 0
            
            # Contar quantos usuários têm mais pontos
            better_users_query = db.session.query(func.count(func.distinct(User.id)))\
                                          .join(Walk, User.id == Walk.user_id)
            
            if period == 'weekly':
                better_users_query = better_users_query.filter(Walk.created_at >= week_ago)
            elif period == 'monthly':
                better_users_query = better_users_query.filter(Walk.created_at >= month_ago)
            
            better_users_subquery = better_users_query.group_by(User.id)\
                                                     .having(func.sum(Walk.points_earned) > user_points)\
                                                     .subquery()
            
            better_users_count = db.session.query(func.count()).select_from(better_users_subquery).scalar()
            current_user_position = better_users_count + 1
        
        return jsonify({
            'ranking': ranking,
            'current_user_position': current_user_position,
            'period': period,
            'type': rank_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gamification_bp.route('/challenges', methods=['GET'])
@token_required
def get_challenges(current_user):
    """Obter desafios disponíveis (placeholder)"""
    try:
        # Por enquanto, retornar desafios estáticos
        # Em uma implementação futura, estes poderiam vir do banco de dados
        
        challenges = [
            {
                'id': 1,
                'title': 'Caminhada Diária',
                'description': 'Faça pelo menos um passeio hoje',
                'type': 'daily',
                'target': 1,
                'progress': 0,
                'reward_points': 50,
                'completed': False
            },
            {
                'id': 2,
                'title': 'Explorador da Semana',
                'description': 'Caminhe pelo menos 10km esta semana',
                'type': 'weekly',
                'target': 10000,  # em metros
                'progress': 0,
                'reward_points': 200,
                'completed': False
            },
            {
                'id': 3,
                'title': 'Maratonista do Mês',
                'description': 'Acumule 50km de caminhadas este mês',
                'type': 'monthly',
                'target': 50000,  # em metros
                'progress': 0,
                'reward_points': 500,
                'completed': False
            }
        ]
        
        # Calcular progresso real dos desafios
        from datetime import date
        today = date.today()
        
        # Desafio diário
        today_walks = Walk.query.filter_by(user_id=current_user.id)\
                               .filter(func.date(Walk.created_at) == today).count()
        challenges[0]['progress'] = today_walks
        challenges[0]['completed'] = today_walks >= 1
        
        # Desafio semanal
        week_start = today - timedelta(days=today.weekday())
        week_distance = db.session.query(func.sum(Walk.distance))\
                                 .filter_by(user_id=current_user.id)\
                                 .filter(Walk.created_at >= week_start).scalar() or 0
        challenges[1]['progress'] = int(week_distance)
        challenges[1]['completed'] = week_distance >= 10000
        
        # Desafio mensal
        month_start = today.replace(day=1)
        month_distance = db.session.query(func.sum(Walk.distance))\
                                  .filter_by(user_id=current_user.id)\
                                  .filter(Walk.created_at >= month_start).scalar() or 0
        challenges[2]['progress'] = int(month_distance)
        challenges[2]['completed'] = month_distance >= 50000
        
        return jsonify(challenges), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gamification_bp.route('/leaderboard', methods=['GET'])
@token_required
def get_leaderboard(current_user):
    """Obter leaderboard simplificado para o dashboard"""
    try:
        # Top 10 usuários por pontos totais
        top_users = db.session.query(
            User.id,
            User.name,
            User.profile_picture,
            User.total_points
        ).order_by(desc(User.total_points)).limit(10).all()
        
        leaderboard = []
        for i, (user_id, name, profile_picture, points) in enumerate(top_users, 1):
            leaderboard.append({
                'position': i,
                'user_id': user_id,
                'name': name,
                'profile_picture': profile_picture,
                'points': points,
                'is_current_user': user_id == current_user.id
            })
        
        return jsonify(leaderboard), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

