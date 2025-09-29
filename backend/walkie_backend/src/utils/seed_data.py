from src.models.models import db, Badge

def seed_badges():
    """Popula o banco de dados com badges iniciais"""
    
    badges_data = [
        {
            'name': 'Primeiro Passeio',
            'description': 'Parabéns pelo seu primeiro passeio!',
            'condition_type': 'first_walk',
            'condition_value': None,
            'points_required': 0
        },
        {
            'name': 'Caminhante Dedicado',
            'description': 'Caminhou por 7 dias consecutivos',
            'condition_type': 'daily_streak',
            'condition_value': 7,
            'points_required': 0
        },
        {
            'name': 'Explorador Iniciante',
            'description': 'Caminhou um total de 5km',
            'condition_type': 'total_distance',
            'condition_value': 5,  # em km
            'points_required': 0
        },
        {
            'name': 'Aventureiro',
            'description': 'Caminhou um total de 25km',
            'condition_type': 'total_distance',
            'condition_value': 25,  # em km
            'points_required': 0
        },
        {
            'name': 'Maratonista',
            'description': 'Caminhou um total de 100km',
            'condition_type': 'total_distance',
            'condition_value': 100,  # em km
            'points_required': 0
        },
        {
            'name': 'Lenda das Caminhadas',
            'description': 'Caminhou um total de 500km',
            'condition_type': 'total_distance',
            'condition_value': 500,  # em km
            'points_required': 0
        },
        {
            'name': 'Ponteiro de Bronze',
            'description': 'Acumulou 1000 pontos',
            'condition_type': 'total_points',
            'condition_value': 1000,
            'points_required': 1000
        },
        {
            'name': 'Ponteiro de Prata',
            'description': 'Acumulou 5000 pontos',
            'condition_type': 'total_points',
            'condition_value': 5000,
            'points_required': 5000
        },
        {
            'name': 'Ponteiro de Ouro',
            'description': 'Acumulou 10000 pontos',
            'condition_type': 'total_points',
            'condition_value': 10000,
            'points_required': 10000
        }
    ]
    
    for badge_data in badges_data:
        # Verificar se o badge já existe
        existing_badge = Badge.query.filter_by(name=badge_data['name']).first()
        if not existing_badge:
            badge = Badge(**badge_data)
            db.session.add(badge)
    
    try:
        db.session.commit()
        print("Badges criados com sucesso!")
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar badges: {e}")

def seed_all():
    """Executa todos os scripts de seed"""
    seed_badges()
    print("Dados iniciais inseridos com sucesso!")

