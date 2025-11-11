# Arquivo: backend/walkie_backend/setup_admin.py
import sys
import os
from sqlalchemy import text

# Configura o caminho para encontrar os módulos 'src'
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import app, db
from src.models.models import User

def update_database():
    with app.app_context():
        print("--- Iniciando Atualização ---")
        
        # 1. Tentar adicionar a coluna 'role' via SQL direto
        # Isso é necessário porque o db.create_all() não atualiza tabelas existentes
        try:
            print("1. Tentando adicionar coluna 'role' na tabela 'users'...")
            # Comando SQL para MySQL
            sql_command = text("ALTER TABLE users ADD COLUMN role VARCHAR(10) DEFAULT 'user' NOT NULL")
            db.session.execute(sql_command)
            db.session.commit()
            print("✅ Coluna 'role' adicionada com sucesso!")
        except Exception as e:
            db.session.rollback()
            # Se der erro, geralmente é porque a coluna já existe. Ignoramos.
            if "Duplicate column name" in str(e) or "exists" in str(e):
                print("ℹ️  A coluna 'role' já existe. Pulando etapa.")
            else:
                print(f"❌ Erro ao alterar tabela: {e}")

        # 2. Definir o usuário Admin
        target_email = "edmaster@hotmail.com"  # <--- COLOQUE SEU EMAIL AQUI
        print(f"\n2. Buscando usuário: {target_email}...")
        
        user = User.query.filter_by(email=target_email).first()
        
        if user:
            user.role = 'admin'
            db.session.commit()
            print(f"✅ SUCESSO! O usuário '{user.name}' ({user.email}) agora é ADMIN.")
            print(f"   Role atual no banco: {user.role}")
        else:
            print(f"❌ ERRO: Usuário com email '{target_email}' não encontrado.")
            print("   Cadastre-se no site primeiro ou verifique o email digitado.")

if __name__ == "__main__":
    update_database()