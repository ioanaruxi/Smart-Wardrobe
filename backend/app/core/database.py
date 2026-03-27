import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Construim calea absolută și precisă către fișierul .env
# Această magie află unde este database.py, și se duce 2 foldere mai sus (în backend/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Încărcăm explicit fișierul de la acea cale
load_dotenv(dotenv_path=ENV_PATH)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(f"Baza de date nu este configurată! Nu am găsit DATABASE_URL în fișierul: {ENV_PATH}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
# 4. Creăm o fabrică de Sesiuni
# O sesiune este practic o "conversație" temporară cu baza de date
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Clasa de bază pe care am folosit-o în models.py pentru a crea tabelele
Base = declarative_base()

# 6. Funcție ajutătoare (Dependency) pe care o vom folosi în API
# Aceasta deschide o conexiune când un user face un request și o închide la final
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()