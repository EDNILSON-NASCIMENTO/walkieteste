import os
import sys
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.models import db
from src.routes.auth import auth_bp
from src.routes.users import users_bp
from src.routes.walks import walks_bp
from src.routes.gamification import gamification_bp

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Pega a SECRET_KEY do ambiente ou usa um valor padrão
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key_for_dev')

# Configurar CORS
CORS(app, origins=['*'])

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(walks_bp, url_prefix='/api/walks')
app.register_blueprint(gamification_bp, url_prefix='/api/gamification')

# --- CONFIGURAÇÃO CORRETA DO BANCO DE DADOS ---
# Pega as credenciais do arquivo .env
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_name = os.getenv('DB_NAME')

# Monta a string de conexão do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Criar tabelas e popular dados iniciais
with app.app_context():
    db.create_all()

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