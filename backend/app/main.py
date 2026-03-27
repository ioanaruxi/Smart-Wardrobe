from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# În mod implicit, FastAPI este securizat. Nu lasă pe nimeni de pe internet să îți citească fișierele 
# de pe hard disk. Trebuie să îi dăm voie explicit să deschidă doar folderul uploaded_images.
from fastapi.staticfiles import StaticFiles 
import os # 

# Importăm motorul bazei de date și modelele noastre
from app.core.database import engine
from app.models import models
# 1. IMPORTAREA router-ului de utilizatori
from app.api.endpoints import users
from app.api.endpoints import clothes
# 1. Sus la importuri, adaugă outfits:
from app.api.endpoints import outfits, auth

# 1. MAGIA: Această linie citește clasele din models.py și creează tabelele în MySQL
# Se execută o singură dată la pornirea serverului, doar dacă tabelele nu există deja.
models.Base.metadata.create_all(bind=engine)

# 2. Inițializăm aplicația FastAPI cu detalii pentru documentația automată
app = FastAPI(
    title="Smart Closet API - mini proiect Licență",
    description="API pentru sistemul multi-agent de recomandare vestimentară.",
    version="1.0.0"
)
# --- NOUTATE: SERVIREA FIȘIERELOR STATICE ---
# Ne asigurăm că folderul există, ca să nu crape serverul
os.makedirs("uploaded_images", exist_ok=True) 

# Spunem serverului: "Orice cerere web care începe cu /uploaded_images, 
# du-te și caut-o în folderul fizic 'uploaded_images'!"
app.mount("/uploaded_images", StaticFiles(directory="uploaded_images"), name="uploaded_images")


# 3. CONCEPT NOU: Configurarea CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite oricărui dispozitiv să acceseze API-ul (ex: telefonul tău)
    allow_credentials=True,
    allow_methods=["*"],  # Permite toate acțiunile: GET (citire), POST (trimitere date), etc.
    allow_headers=["*"],
)

# 2. CONECTARE NOUĂ: Legăm rutele de users la adresa /api/users
app.include_router(users.router, prefix="/api/users", tags=["Users"])

app.include_router(clothes.router, prefix="/api/clothes", tags=["Clothes"])

app.include_router(outfits.router, prefix="/api/outfits", tags=["Outfits & AI Stylist"])

app.include_router(auth.router, prefix="/api/auth", tags=["Autentificare"])
# 4. Ruta de bază (Health Check)  //// se verifica daca serverul este online
@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "API-ul Smart Closet este online! Tabelele MySQL au fost verificate/create."
    }