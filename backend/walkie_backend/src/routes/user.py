import os
import uuid
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from src.models.user import User  # Assumindo que seu model está aqui
from src.models.models import db  # Assumindo que seu db está aqui
from dotenv import load_dotenv

# Carrega variáveis de ambiente (necessário para a BASE_URL)
load_dotenv()

# Corrigido para 'users_bp' para bater com seu app.py
users_bp = Blueprint('users', __name__)

# --- Lógica de Upload (A Solução Adicionada) ---

# Define a pasta onde as imagens serão salvas
# Pega o caminho do diretório 'src' e sobe um nível, depois entra em 'static/uploads/profiles'
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads', 'profiles')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Verifica se a extensão do arquivo é permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Rotas de Perfil (Necessárias para Profile.jsx) ---

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    
    # Você precisa implementar a lógica para buscar estatísticas
    # O Profile.jsx espera por 'statistics' e 'total_points'
    statistics = {
        "total_walks": 0, # Exemplo: len(user.walks)
        "total_distance": 0, # Exemplo: sum(walk.distance for walk in user.walks)
        "total_badges": 0 # Exemplo: len(user.badges)
    }
    
    profile_data = user.to_dict()
    profile_data['statistics'] = statistics
    # Certifique-se que seu model User tem um campo 'total_points'
    profile_data['total_points'] = getattr(user, 'total_points', 0) 

    return jsonify(profile_data), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Atualiza dados de texto do perfil (ex: nome)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
        
    data = request.json
    
    # Esta rota só atualiza os dados de texto (o upload é separado)
    if 'name' in data:
        user.name = data['name']
    
    db.session.commit()
    return jsonify({"message": "Perfil atualizado", "user": user.to_dict()}), 200

# --- Nova Rota de Upload (A Solução) ---

@users_bp.route('/profile/upload', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    # 1. Verifica se o arquivo está na requisição
    if 'profile_picture' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado (procure por 'profile_picture')"}), 400

    file = request.files['profile_picture']

    # 2. Verifica se o nome do arquivo está vazio
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    # 3. Verifica se a extensão é válida
    if file and allowed_file(file.filename):
        # 4. Cria um nome de arquivo seguro e único
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{user_id}_{uuid.uuid4()}.{ext}"
        
        # 5. Cria a pasta de uploads se ela não existir
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # 6. Salva o arquivo no servidor
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # 7. Gera a URL pública do arquivo
        #    IMPORTANTE: Você DEVE definir BASE_URL no seu .env
        #    Ex: BASE_URL=http://localhost:8000
        base_url = os.getenv('BASE_URL')
        if not base_url:
            print("AVISO: BASE_URL não definida no arquivo .env. O link da imagem pode ficar quebrado.")
            # Em produção, isso deve ser um erro
            # return jsonify({"error": "Configuração do servidor incompleta: BASE_URL não definida"}), 500

        file_url = f"{base_url}/static/uploads/profiles/{filename}"

        # 8. Atualiza o banco de dados com a nova URL
        user.profile_picture = file_url
        db.session.commit()

        return jsonify({
            "message": "Upload bem-sucedido", 
            "user": user.to_dict() # Retorna o usuário atualizado
        }), 200
    else:
        return jsonify({"error": "Tipo de arquivo não permitido (use: png, jpg, jpeg, gif)"}), 400


# --- Rotas CRUD de Pet (Necessárias para Pets.jsx) ---
# (Você precisará criar o Model 'Pet' e 'pet.to_dict()')

@users_bp.route('/pets', methods=['GET'])
@jwt_required()
def get_user_pets():
    user_id = get_jwt_identity()
    # IMPLEMENTAR: Busque os pets do usuário
    # from src.models.pet import Pet
    # pets = Pet.query.filter_by(user_id=user_id).all()
    # return jsonify([pet.to_dict() for pet in pets]), 200
    return jsonify([]), 200 # Retorno temporário

@users_bp.route('/pets', methods=['POST'])
@jwt_required()
def create_user_pet():
    user_id = get_jwt_identity()
    data = request.json
    # IMPLEMENTAR: Crie um novo pet
    # from src.models.pet import Pet
    # new_pet = Pet(user_id=user_id, name=data['name'], ...)
    # db.session.add(new_pet)
    # db.session.commit()
    # return jsonify(new_pet.to_dict()), 201
    return jsonify({"message": "Pet criado - IMPLEMENTAR"}), 201

@users_bp.route('/pets/<int:pet_id>', methods=['PUT'])
@jwt_required()
def update_user_pet(pet_id):
    user_id = get_jwt_identity()
    # IMPLEMENTAR: Busque o pet e valide se pertence ao user_id
    # from src.models.pet import Pet
    # pet = Pet.query.get_or_404(pet_id)
    # if pet.user_id != user_id:
    #     return jsonify({"error": "Não autorizado"}), 403
    # data = request.json
    # ... (lógica de atualização) ...
    # db.session.commit()
    # return jsonify(pet.to_dict()), 200
    return jsonify({"message": f"Pet {pet_id} atualizado - IMPLEMENTAR"}), 200

@users_bp.route('/pets/<int:pet_id>', methods=['DELETE'])
@jwt_required()
def delete_user_pet(pet_id):
    user_id = get_jwt_identity()
    # IMPLEMENTAR: Busque o pet e valide se pertence ao user_id
    # from src.models.pet import Pet
    # pet = Pet.query.get_or_404(pet_id)
    # if pet.user_id != user_id:
    #     return jsonify({"error": "Não autorizado"}), 403
    # db.session.delete(pet)
    # db.session.commit()
    return '', 204


# --- Rotas CRUD de Admin (Seu código original, corrigido) ---
# (Estas rotas são para admin, não são usadas pelo Profile.jsx)

@users_bp.route('/', methods=['GET'])
def get_users():
    """Pega todos os usuários (para admin)"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Pega um usuário específico (para admin)"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Atualiza um usuário específico (para admin)"""
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Deleta um usuário específico (para admin)"""
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

# A rota POST /users foi removida pois a criação de usuário
# deve estar no seu 'auth.py' (ex: /api/auth/register)