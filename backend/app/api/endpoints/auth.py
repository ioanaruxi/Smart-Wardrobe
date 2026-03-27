# Am creat ușile de Login și Register.


from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter()

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Ruta pentru crearea unui cont nou.
    """
    # 1. Verificăm dacă email-ul există deja
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Acest email este deja înregistrat!")
    
    # 2. Criptăm parola
    hashed_password = get_password_hash(user.password)
    
    # 3. Salvăm în baza de date
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        username=user.username
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Cont creat cu succes!"}

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Ruta pentru logare. Dacă e corect, returnează un JWT Token.
    Atenție: OAuth2 standard folosește câmpul 'username', dar noi vom scrie email-ul în el.
    """
    # 1. Căutăm utilizatorul după email (care vine în form_data.username)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Verificăm dacă există și dacă parola corespunde
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorectă",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Generăm token-ul. Punem ID-ul lui (user.id) în interiorul token-ului (subiectul)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Returnăm formatul standard așteptat de frontend-uri
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}