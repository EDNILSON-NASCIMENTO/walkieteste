import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.models import db
from src.routes.auth import auth_bp
from src.routes.users import users_bp
from src.routes.walks import walks_bp
from src.routes.gamification import gamification_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Configurar CORS para permitir requisições do frontend
CORS(app, origins=['*'])

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(walks_bp, url_prefix='/api/walks')
app.register_blueprint(gamification_bp, url_prefix='/api/gamification')

# Configuração do banco de dados para MySQL
# ATENÇÃO: A senha está exposta no código. Em produção, use variáveis de ambiente.
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:1234@localhost/walkie_db'

import os

# Railway injeta a variável DATABASE_URL automaticamente.
# Este código a lê e a adapta para o SQLAlchemy.
db_url = os.environ.get('DATABASE_URL')
if db_url:
    # A URL do Railway vem como "mysql://...", o SQLAlchemy precisa de "mysql+mysqlconnector://..."
    db_url = db_url.replace("mysql://", "mysql+mysqlconnector://", 1)

# Usa a URL do Railway ou, se não encontrar, usa a local para desenvolvimento.
app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'mysql+mysqlconnector://root:1234@localhost/walkie_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Criar tabelas e popular dados iniciais
with app.app_context():
    db.create_all()
    
    # Verificar se é a primeira execução e popular dados iniciais
    from src.models.models import Badge
    if Badge.query.count() == 0:
        from src.utils.seed_data import seed_all
        seed_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return {'status': 'OK', 'message': 'Walkie API is running!'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
