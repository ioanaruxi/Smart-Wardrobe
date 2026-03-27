from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
# Va trebui să importăm Base din fișierul nostru de configurare a bazei de date (îl facem la pasul următor)
from app.core.database import Base 

# Fișierul 1: backend/app/models/models.py
# Aici îi spui bazei de date (MySQL) cum arată tabelul fizic.

class User(Base):
    # (Modificat): Am adăugat coloana hashed_password în tabelul User (și am șters numele) ca să avem unde salva parola.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # --- ASIGURĂ-TE CĂ AI ACEASTĂ LINIE PENTRU A SALVA PAROLA CRIPTATĂ ---
    hashed_password = Column(String(255))

    clothes = relationship("ClothingItem", back_populates="owner")
    outfits = relationship("Outfit", back_populates="owner")

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String(255)) 
    category = Column(String(50))   
    color = Column(String(50))
    weather_type = Column(String(50)) 
    formality = Column(String(50))    
    wear_count = Column(Integer, default=0)
    
    # --- NOUTATEA PENTRU LICENȚĂ (MATEMATICĂ) ---
    # Aici vom stoca reprezentarea vectorială a hainei pentru Cosine Similarity
    # Ex: [0.5, 0.1, 0.9, ...] (calculat de AI pe baza culorii/categoriei)
    feature_vector = Column(JSON, nullable=True)

    owner = relationship("User", back_populates="clothes")
    # --- MODIFICAREA 1: Adăugăm relația către OutfitItem cu regula de cascadă ---
    outfit_items = relationship("OutfitItem", back_populates="clothing_item", cascade="all, delete-orphan")

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="outfits")
    items = relationship("OutfitItem", back_populates="outfit")


class OutfitItem(Base):
    __tablename__ = "outfit_items"

    id = Column(Integer, primary_key=True, index=True)
    outfit_id = Column(Integer, ForeignKey("outfits.id"))
    clothing_item_id = Column(Integer, ForeignKey("clothing_items.id"))

    outfit = relationship("Outfit", back_populates="items")
    # --- MODIFICAREA 2: Legăm acest copil înapoi de părinte prin back_populates ---
    clothing_item = relationship("ClothingItem", back_populates="outfit_items")