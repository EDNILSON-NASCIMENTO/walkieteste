# Em: backend/walkie_backend/src/models/models.py
# (Arquivo ajustado)

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    total_points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # ⬇️ NOVO CAMPO ADICIONADO ⬇️
    role = db.Column(db.String(10), default='user', nullable=False) # 'user' ou 'admin'
    
    # Relacionamentos
    pets = db.relationship('Pet', backref='owner', lazy=True, cascade='all, delete-orphan')
    walks = db.relationship('Walk', backref='user', lazy=True, cascade='all, delete-orphan')
    user_badges = db.relationship('UserBadge', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'profile_picture': self.profile_picture,
            'total_points': self.total_points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'role': self.role  # ⬅️ CAMPO ADICIONADO AO to_dict()
        }

class Pet(db.Model):
    __tablename__ = 'pets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    breed = db.Column(db.String(100), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    preferences = db.Column(db.Text, nullable=True)  # JSON string com preferências
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    walks = db.relationship('Walk', backref='pet', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'breed': self.breed,
            'age': self.age,
            'weight': self.weight,
            'profile_picture': self.profile_picture,
            'preferences': self.preferences,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Walk(db.Model):
    __tablename__ = 'walks'
    
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # em segundos
    distance = db.Column(db.Float, nullable=True)  # em metros
    calories = db.Column(db.Integer, nullable=True)
    average_pace = db.Column(db.Float, nullable=True)  # em min/km
    route_data = db.Column(db.Text, nullable=True)  # JSON string com coordenadas da rota
    feedback = db.Column(db.Text, nullable=True)
    points_earned = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'distance': self.distance,
            'calories': self.calories,
            'average_pace': self.average_pace,
            'route_data': self.route_data,
            'feedback': self.feedback,
            'points_earned': self.points_earned,
            'user_id': self.user_id,
            'pet_id': self.pet_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Badge(db.Model):
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(255), nullable=True)
    points_required = db.Column(db.Integer, default=0)
    condition_type = db.Column(db.String(50), nullable=False)  # 'first_walk', 'daily_streak', 'distance', etc.
    condition_value = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    user_badges = db.relationship('UserBadge', backref='badge', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'points_required': self.points_required,
            'condition_type': self.condition_type,
            'condition_value': self.condition_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserBadge(db.Model):
    __tablename__ = 'user_badges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Constraint para evitar badges duplicados por usuário
    __table_args__ = (db.UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'badge_id': self.badge_id,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'badge': self.badge.to_dict() if self.badge else None
        }

class Ranking(db.Model):
    __tablename__ = 'rankings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rank_type = db.Column(db.String(20), nullable=False)  # 'global' ou 'local'
    position = db.Column(db.Integer, nullable=False)
    points = db.Column(db.Integer, nullable=False)
    period = db.Column(db.String(20), nullable=False)  # 'weekly', 'monthly', 'all_time'
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    user = db.relationship('User', backref='rankings')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'rank_type': self.rank_type,
            'position': self.position,
            'points': self.points,
            'period': self.period,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict() if self.user else None
        }