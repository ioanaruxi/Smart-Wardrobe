from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List,Optional

# Fișierul 2: backend/app/schemas/schemas.py (TRADUCĂTORUL)
# FastAPI nu poate trimite obiecte de bază de date pe internet. 
# El are nevoie de o "matriță" (Schema) creată cu librăria Pydantic, care să transforme obiectul SQL 
# într-un text simplu (JSON).
# IMPLEMENTAREA CRUD

# 1. Schema pentru CREAREA unui user (Ce date primim de la telefon)
# (Modificat): Am învățat clasa UserCreate să accepte o parolă de la utilizator.
class UserCreate(BaseModel):
    username: str
    email: EmailStr # EmailStr validează automat că textul e un email real (are @ și domeniu)
    # --- ASTA LIPSEA: Acum utilizatorul poate trimite parola! ---
    password: str
# 2. Schema pentru RĂSPUNS (Ce date trimitem înapoi către telefon)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    # Această setare îi spune lui Pydantic să știe să citească direct din baza de date (SQLAlchemy)
    class Config:
        from_attributes = True # Magia care convertește SQL în JSON


# Schema pentru a trimite înapoi datele despre o haină adăugată
class ClothingItemResponse(BaseModel):
    id: int
    user_id: int
    image_url: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    weather_type: Optional[str] = None
    formality: Optional[str] = None

    class Config:
        from_attributes = True

# Această schemă combină haina (ClothingItemResponse) cu scorul dat de AI
class RecommendationResponse(BaseModel):
    item: ClothingItemResponse
    similarity_score: float

    class Config:
        from_attributes = True


# Schema pentru ACTUALIZAREA unei haine (Ce date primim de la telefon)
# Folosim Optional pentru că utilizatorul s-ar putea să vrea să schimbe doar categoria, nu și restul.
class ClothingItemUpdate(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    weather_type: Optional[str] = None
    formality: Optional[str] = None


# 1. Ce primim de la telefon pentru a CREA ținuta
class OutfitCreate(BaseModel):
    name: str  # ex: "Ținută de birou vineri"
    clothing_item_ids: List[int]  # ex: [1, 4, 7] (ID-ul blugilor, tricoului, adidașilor)

# 2. Scheme ajutătoare pentru RĂSPUNS
class OutfitItemDetail(BaseModel):
    clothing_item: ClothingItemResponse # Folosim schema de haină deja existentă

    class Config:
        from_attributes = True

# 3. Ce trimitem înapoi către telefon (Ținuta completă)
class OutfitResponse(BaseModel):
    id: int
    user_id: int
    name: str
    items: List[OutfitItemDetail] # Lista de haine incluse

    class Config:
        from_attributes = True


