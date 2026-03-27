from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Importăm baza de date, modelele (SQL) și schemele (Pydantic)
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

# APIRouter este ca un "mini-FastAPI". Ne ajută să spargem rutele în mai multe fișiere.
router = APIRouter()

# Creăm ușa (ruta) de tip POST (folosită pentru a trimite date noi către server)
# response_model=schemas.UserResponse îi spune API-ului să filtreze răspunsul (fără parole/date extra)
@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Acest endpoint primește datele unui user (username, email), 
    verifică dacă există deja, și dacă nu, îl adaugă în baza de date.
    """
    
    # 1. Căutăm în baza de date dacă email-ul există deja
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        # Dacă există, dăm o eroare HTTP 400 (Bad Request)
        raise HTTPException(status_code=400, detail="Acest email este deja înregistrat!")
    
    # 2. Dacă nu există, transformăm datele Pydantic în Model SQLAlchemy
    new_user = models.User(username=user.username, email=user.email)
    
    # 3. Adăugăm în sesiune și salvăm (commit) în MySQL
    db.add(new_user)
    db.commit()
    
    # 4. Reîmprospătăm obiectul pentru a prelua ID-ul generat automat de MySQL și data creării
    db.refresh(new_user)
    
    # 5. Returnăm noul user (FastAPI îl va trece automat prin UserResponse schema)
    return new_user