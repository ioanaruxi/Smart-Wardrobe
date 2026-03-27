# backend/app/core/security.py
# Aici am pus "Motorul Criptografic". Conține logica matematică pentru ascunderea parolelor 
# (Bcrypt) și generarea "Buletinelor Digitale" (JWT Tokens).

# 2. Autentificare "Stateless" cu JWT (Backend)

# Concept: Serverul Python este "amnezic". El nu ține minte cine ești de la o secundă la alta. 
# De aceea, la login, îți dă un JSON Web Token (JWT). La fiecare cerere nouă (să vezi o haină), tu prezinți acest token,
# iar serverul îl validează matematic.

from datetime import datetime, timedelta
import bcrypt  # <-- Folosim direct bcrypt, fără passlib
import jwt
import os
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    print("⚠️ ATENȚIE: SECRET_KEY nu a fost găsită în .env! Se folosește o cheie nesigură.")
    SECRET_KEY = "cheie_temporara_de_test"
    
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Token-ul e valabil 7 zile

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifică dacă parola scrisă se potrivește cu hash-ul din baza de date"""
    # Bcrypt are nevoie strict de text transformat în format binar (bytes)
    password_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(password_bytes, hash_bytes)

def get_password_hash(password: str) -> str:
    """Transformă parola simplă într-un hash ireversibil"""
    password_bytes = password.encode('utf-8')
    
    # Generăm o "sare" (salt) random pentru a securiza și mai mult parola
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    
    # Îl transformăm înapoi în text (string) ca să-l putem salva liniștiți în MySQL
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict):
    """Generează 'Buletinul Digital' (JWT) pentru utilizator"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt