# Fișierul 3: backend/app/api/endpoints/clothes.py (EXPEDITORUL)
# Acesta este endpoint-ul. Observă parametrul response_model! El ia datele din MySQL (models), le 
# trece prin traducător (schemas) și le scuipă pe internet.

# Ce pleacă efectiv pe cablul de internet spre telefon? Acest text (JSON):
# [ {"id": 1, "category": "Tricou", "color": "Rosu"}, {"id": 2, "category": "Blugi", "color": "Albastru"} ]


from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
import os

# Aducem Agentul de Viziune
from app.agents.vision_agent import VisionAgent

from app.core.database import get_db
from app.models import models
from app.schemas import schemas


from typing import List
# Funcția matematică de extragere a culorii
from app.math_engine.color_extraction import get_dominant_color
router = APIRouter()

# Creăm un folder automat unde să se salveze pozele fizic pe calculatorul tău
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/", response_model=schemas.ClothingItemResponse) #schemas.ClothingItemResponse este schema pentru raspunsul la cererea de upload
def upload_clothing_item(
    # Folosim Form(...) pentru text și File(...) pentru poză
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Acest endpoint primește o poză cu o haină și ID-ul utilizatorului.
    Salvează poza pe server și creează o înregistrare goală în baza de date
    """
    
    # 1. Verificăm dacă utilizatorul există în baza de date
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit!")

    
    # 1. Salvăm poza ORIGINALĂ temporar
    original_path = f"{UPLOAD_DIR}/temp_{file.filename}"
    with open(original_path, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # 2. Setăm numele pentru poza PROCESATĂ (fără fundal). Trebuie să fie mereu .png pentru transparență!
    clean_filename = f"clean_{file.filename.split('.')[0]}.png"
    processed_path = f"{UPLOAD_DIR}/{clean_filename}"
    
    # 3. CHEMĂM AGENTUL AI SĂ TAIE FUNDALUL
    success = VisionAgent.remove_background(input_path=original_path, output_path=processed_path)
    
    if not success:
        # Dacă AI-ul a eșuat din ceva motiv, ștergem temp-ul și dăm eroare
        os.remove(original_path)
        raise HTTPException(status_code=500, detail="Eroare la procesarea AI a imaginii.")
        
    # Dacă a mers bine, ștergem poza originală cu fundal urât ca să nu ocupe spațiu
    os.remove(original_path)
    # NU: 
    # # 2. MATEMATICĂ: Extragerea culorii dominante prin K-Means
    # # Pasăm poza procesată (fără fundal) către algoritm
    # extracted_color = get_dominant_color(image_path=processed_path, k=3)
# ==========================================
    # ==========================================
    # DA:
    # 3.5 NOU: CHEMĂM GEMINI SĂ ETICHETEZE HAINA
    # Îi dăm poza deja curățată de fundal!
    # ==========================================
    ai_tags = VisionAgent.analyze_clothing_image(processed_path)
    # ai_tags va fi un dicționar de genul: {"category": "Camasa", "color": "Alb", ...}

    # 4. Acum că avem poza salvată fizic, creăm rândul complet în MySQL
    new_item = models.ClothingItem(
        user_id=user_id,
        image_url=processed_path,
        # Luăm culoarea strict de la AI. Dacă dă fail, punem "Necunoscut"
        color=ai_tags.get("color", "Necunoscut"), 
        category=ai_tags.get("category", "Necunoscut"),
        weather_type=ai_tags.get("weather_type", "Toate"),
        formality=ai_tags.get("formality", "Casual")
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item

# Creăm o rută GET. 
# {user_id} în interiorul URL-ului se numește "Path Parameter" (Parametru de Cale).
# response_model=List[...] îi spune lui FastAPI că rezultatul va fi un Array (o listă) de obiecte JSON.
@router.get("/user/{user_id}", response_model=List[schemas.ClothingItemResponse])
def get_user_clothes(user_id: int, db: Session = Depends(get_db)):
    """
    Acest endpoint interoghează baza de date și aduce toate articolele
    vestimentare asociate cu un anumit ID de utilizator.
    """
    # 1. ORM: Interogăm MySQL folosind SQLAlchemy
    # Traducere: SELECT * FROM clothing_items WHERE user_id = {user_id}
    clothes = db.query(models.ClothingItem).filter(models.ClothingItem.user_id == user_id).all()
    
    # 3. Returnăm lista. FastAPI va transforma automat obiectele SQL în JSON-uri.
    return clothes


# Folosim metoda PUT (sau PATCH) pentru actualizări.
# {item_id} ne spune exact ce haină vrem să modificăm.
@router.put("/{item_id}", response_model=schemas.ClothingItemResponse)
def update_clothing_item(
    item_id: int, 
    item_update: schemas.ClothingItemUpdate, 
    db: Session = Depends(get_db)
):
    """
    Acest endpoint primește un ID de haină și o listă de atribute noi.
    Dacă haina există, actualizează doar câmpurile care au fost trimise de utilizator.
    """"""
    Actualizează detaliile unei haine (Categorie, Culoare etc.)
    după validarea manuală a utilizatorului din frontend.
    """
    # 1. Căutăm rândul în baza de date
    db_item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Haina nu a fost găsită.")

    # 2. Actualizăm doar câmpurile care au fost trimise (suprascriem ce a greșit AI-ul)
    if item_update.category is not None:
        db_item.category = item_update.category
    if item_update.color is not None:
        db_item.color = item_update.color
    if item_update.weather_type is not None:
        db_item.weather_type = item_update.weather_type
    if item_update.formality is not None:
        db_item.formality = item_update.formality
    # 4. Salvăm modificările în MySQL
    db.commit() #ai in detalii la linia ~500 
    db.refresh(db_item)
    
    return db_item


@router.delete("/{item_id}")
def delete_clothing_item(item_id: int, db: Session = Depends(get_db)):
    """
    Șterge o haină din baza de date și elimină poza fizică de pe server
    pentru a elibera spațiul de stocare.
    """
    # 1. ORM: Căutăm haina în baza de date
    db_item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Haina nu a fost găsită în dulap.")
        
    # 2. Salvăm calea pozei într-o variabilă ÎNAINTE să ștergem obiectul
    image_path = db_item.image_url
    
    # 2. EFECTUL DE DOMINO: Căutăm în ce ținute este folosită această haină
    outfit_links = db.query(models.OutfitItem).filter(models.OutfitItem.clothing_item_id == item_id).all()
    
    # Ștergem complet ținutele compromise
    for link in outfit_links:
        compromised_outfit = db.query(models.Outfit).filter(models.Outfit.id == link.outfit_id).first()
        if compromised_outfit:
            db.delete(compromised_outfit)
            
    # 3. Tranzacție ACID: Ștergem rândul din MySQL. 
    # SQLAlchemy va curăța automat tabelul 'outfit_items' de legăturile cu această haină.
    db.delete(db_item)
    db.commit()
    
    # 4. Gestiunea Fișierelor: Dacă fișierul fizic mai există, îl ștergem. Dacă nu, trecem mai departe în liniște.
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except Exception as e:
            # Nu dăm eroare aplicației (HTTP 500) dacă doar poza lipsește, 
            # dar printăm în terminal ca să știe administratorul serverului.
            print(f"Avertisment: Nu am putut șterge fișierul fizic {image_path}. Eroare: {e}")
            
    # La un DELETE de succes, returnăm un simplu mesaj de confirmare
    return {"message": f"Haina cu ID-ul {item_id} a fost ștearsă complet din sistem!"}