from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import List
import random

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.agents.stylist_agent import StylistAgent
from app.agents.weather_agent import WeatherAgent

router = APIRouter()


# 1. Definim Arborele de Taxonomie (Regulile de Business)
MACRO_CATEGORIES = {
    "Top": ["Tricou", "Camasa", "Hanorac", "Pulover", "Top", "Bluza", "Vesta", "Maieu", "Helanca"],
    "Bottom": ["Blugi", "Pantaloni", "Joggers", "Fusta", "Colanti", "Pantaloni scurti"],
    "Footwear": ["Adidasi", "Pantofi", "Ghete", "Sandale", "Cizme","Balerini"],
    "Outerwear": ["Geaca", "Palton", "Sacou", "Jacheta"],
    "Accessories": ["Geanta", "Rucsac", "Curea", "Palarie", "Fular", "Ochelari", "Accesoriu"],
    "Single": ["Rochie", "Salopeta", "Salopeta"]
}

@router.get("/recommend/{item_id}")
def recommend_outfit_for_item(
    item_id: int = Path(..., description="ID-ul hainei pe care vrei să o porți (Piesa de bază)"),
    db: Session = Depends(get_db)
):
    """
    Sistem de Recomandare Hibrid (Reguli + Algebră Liniară).
    Găsește haina dorită, îi extrage categoria și culoarea, 
    filtrează restul dulapului pentru a exclude hainele din aceeași categorie,
    și apoi aplică Cosine Similarity pentru a potrivi culorile.
    """
    target_item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    
    if not target_item or not target_item.category or not target_item.color:
        raise HTTPException(status_code=400, detail="Haina nu a fost găsită sau nu are categoria/culoarea setate!")

    # 2. Găsim din ce MACRO-categorie face parte haina curentă
    forbidden_categories = [target_item.category] # Implicit, interzicem categoria ei însăși
    
    target_macro = "Altele"
    for macro, micro_list in MACRO_CATEGORIES.items():
        if target_item.category in micro_list:
            # Dacă am găsit că "Blugi" e în "Bottom", interzicem TOATE hainele din "Bottom"
            forbidden_categories = micro_list
            target_macro = macro
            break

    # 1. CEREM VREMEA ACTUALĂ
    weather_info = WeatherAgent.get_weather_context(city="București")
    sezon_recomandat = weather_info["recommended_season"]

    # 4. EXTRAGEM HAINELE DIN DULAP (O SINGURĂ INTEROGARE SQL INTELIGENTĂ)
    # Punem filtrele de bază: să fie ale userului curent, să nu fie haina însăși, să nu fie în categoria interzisă
    query = db.query(models.ClothingItem).filter(
        models.ClothingItem.user_id == target_item.user_id,
        models.ClothingItem.id != target_item.id,
        ~models.ClothingItem.category.in_(forbidden_categories)
    )
    
    # 2. ADUCEM HAINELE DIN DULAP (Filtrare Inteligentă)
    # Aducem doar hainele care se potrivesc cu sezonul recomandat SAU sunt "Toate" (All-season)
    # Plus, aducem mereu piesa de bază pe care a selectat-o utilizatorul, indiferent de vreme.
    if weather_info["success"] and sezon_recomandat != "Toate":
        query = query.filter(models.ClothingItem.weather_type.in_([sezon_recomandat, "Toate"]))
    # Acum executăm interogarea!
    available_clothes = query.all()
    
    if not available_clothes:
        raise HTTPException(status_code=404, detail="Nu ai alte haine compatibile în dulap (ținând cont de vreme și categorie). Mai adaugă!")

    # 4. Agentul AI sortează ce a mai rămas pe baza culorilor
    recommendations = StylistAgent.find_similar_items(
        target_color_name=target_item.color,
        database_items=available_clothes
    )# returneaza un dictionar: [{"item": {"category": "Blugi", "color": "Gri", "formality": null, "id": 8, "image_url": "uploaded_images/clean_blugi_evazati.png", "user_id": 1, "weather_type": null}, "similarity_score": 0.5774}]
    
    # 5. THRESHOLDING: Filtrăm rezultatele slabe!
    # Păstrăm în listă DOAR elementele care au un scor de potrivire mai mare de 0.2 (20%)
    good_recommendations = [rec for rec in recommendations if rec["similarity_score"] > 0.0]
    
    # Dacă după filtrare nu mai rămâne nimic bun, îi spunem utilizatorului
    if not good_recommendations:
        raise HTTPException(status_code=404, detail="Nu am găsit nicio haină care să se asorteze cromatic cu aceasta.")

    # LOGICA NOUĂ DE BUCKETS (Fără scurgeri de date)
    buckets = {}
    for rec in good_recommendations:
        # Folosim .strip() ca să tăiem orice spațiu accidental din baza de date ("Blugi " -> "Blugi")
        item_cat = rec["item"].category.strip() if rec["item"].category else "Necunoscut"
        
        item_macro = "Altele" # PLASA DE SIGURANȚĂ: Dacă nu găsim categoria, o punem aici, nu o ștergem!
        
        for macro, micro_list in MACRO_CATEGORIES.items():
            micro_list_lower = [m.lower() for m in micro_list]
            if item_cat.lower() in micro_list_lower:
                item_macro = macro
                break
        
        if item_macro not in buckets:
            buckets[item_macro] = []
        buckets[item_macro].append(rec)

    # --- NOU: LOGICA ANTI-CIORBĂ (EXCLUDEREA SINGLE vs TOP/BOTTOM) ---
    # Dacă utilizatorul a selectat o Rochie (Single), distrugem gălețile de Top și Bottom (ca să nu i le dea AI-ul)
    if target_macro == "Single":
        buckets.pop("Top", None)
        buckets.pop("Bottom", None)
    
    # Dacă utilizatorul a selectat un Top sau un Bottom, distrugem găleata de "Single" (Să nu-i dea o rochie peste blugi)
    elif target_macro in ["Top", "Bottom"]:
        buckets.pop("Single", None)
    # -----------------------------------------------------------------

    # 6. CREAREA ȚINUTEI FINALE (Randomizare inteligentă)
    final_outfit = []
    gasite_macro = [] # Ținem minte ce macro-categorii am reușit să acoperim

    # Punem piesa de bază prima în listă!
    gasite_macro.append(target_macro)
    final_outfit.append(target_item)

    # Parcurgem fiecare găleată (ex: Top, Footwear) pe rând
    for macro, items_in_bucket in buckets.items():
        # Ne asigurăm că sunt sortate de la cel mai bun scor la cel mai slab
        items_in_bucket.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Luăm doar primele 5 cele mai bune opțiuni
        top_7 = items_in_bucket[:7]
        
        # Alegem UNA singură la întâmplare și o adăugăm în ținută
        chosen_item = random.choice(top_7)
        final_outfit.append(chosen_item["item"]) # Adăugăm doar obiectul hainei
        gasite_macro.append(macro)
        
   # --- NOU: CALCULUL PIESELOR LIPSĂ INTELIGENT ---
    # Dacă avem o rochie în ținută, nu ne interesează dacă lipsește Top sau Bottom!
    if "Single" in gasite_macro:
        categorii_esentiale = ["Footwear"] # La o rochie, doar pantofii sunt esențiali
    else:
        categorii_esentiale = ["Top", "Bottom", "Footwear"]

    
    piese_lipsa = [cat for cat in categorii_esentiale if cat not in gasite_macro]

    # 10. TEXTUL PENTRU VREME
    if weather_info["success"]:
        weather_banner = f"⛅ {weather_info['temperature']}°C în {weather_info['city']} | Sezon: {weather_info['recommended_season']}"
    else:
        weather_banner = "Nu am putut obține datele meteo."

    # RETURNĂM PACHETUL COMPLET!
    # Atenție: Dacă sus la @router.get ai 'response_model=...', șterge-l temporar ca să nu dea eroare de validare, 
    # sau creează o schemă nouă în schemas.py pentru acest pachet.
    return {
        "weather_text": weather_banner,
        "missing_pieces": piese_lipsa,
        "outfit": final_outfit
    }

@router.post("/create/{user_id}", response_model=schemas.OutfitResponse)
def create_outfit(
    user_id: int,
    outfit_data: schemas.OutfitCreate,
    db: Session = Depends(get_db)
):
    """
    Salvează o ținută nouă în baza de date, legând mai multe haine 
    de un singur nume de Outfit. Verifică tranzacțional dacă hainele aparțin utilizatorului.
    """
    # 1. Verificăm utilizatorul
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu există!")

    # 2. Creăm Părintele (Înregistrarea principală a ținutei)
    new_outfit = models.Outfit(
        user_id=user_id,
        name=outfit_data.name
    )
    db.add(new_outfit)
    db.flush() # flush() trimite datele la MySQL pentru a genera ID-ul ținutei, DAR nu face commit final încă!

    # 3. Parcurgem lista de ID-uri primită de la telefon și creăm legăturile (Copiii)
    for item_id in outfit_data.clothing_item_ids:
        # Ne asigurăm că haina există și aparține chiar acestui utilizator (Securitate)
        db_item = db.query(models.ClothingItem).filter(
            models.ClothingItem.id == item_id,
            models.ClothingItem.user_id == user_id
        ).first()
        
        if not db_item:
            # Dacă haina nu e validă, SQLAlchemy va anula (Rollback) tot ce am făcut la pasul 2
            raise HTTPException(status_code=400, detail=f"Haina cu ID-ul {item_id} nu îți aparține sau nu există.")
            
        # Creăm legătura în tabelul de asociere
        outfit_link = models.OutfitItem(
            outfit_id=new_outfit.id,
            clothing_item_id=item_id
        )
        db.add(outfit_link)

    # 4. Salvăm absolut tot dintr-un singur foc (Tranzacție ACID)
    db.commit()
    db.refresh(new_outfit)

    return new_outfit

@router.post("/{outfit_id}/wear")
def record_outfit_wear(outfit_id: int, db: Session = Depends(get_db)):
    """
    Înregistrează o purtare pentru o ținută întreagă.
    Caută toate hainele din ținuta respectivă și le crește `wear_count` cu 1.
    """
    # 1. Găsim ținuta în baza de date
    outfit = db.query(models.Outfit).filter(models.Outfit.id == outfit_id).first()
    
    if not outfit:
        raise HTTPException(status_code=404, detail="Ținuta nu a fost găsită.")

    # 2. MAGIA ORM: Folosim portalurile de navigare!
    # 'outfit.items' este lista de legături din tabelul outfit_items
    for piesa in outfit.items:
        # 'piesa.clothing_item' sare direct la haina fizică din tabelul clothing_items
        haina = piesa.clothing_item
        if haina:
            # Creștem contorul cu 1
            haina.wear_count += 1
            
    # 3. Salvăm toate modificările dintr-un singur foc
    db.commit()
    
    return {"message": "Contorul de purtare a fost actualizat cu succes pentru toate hainele!"}

@router.get("/user/{user_id}", response_model=List[schemas.OutfitResponse])
def get_user_outfits(user_id: int, db: Session = Depends(get_db)):
    """
    Returnează toate ținutele (Outfits) salvate de un utilizator, 
    inclusiv detaliile complete ale hainelor din fiecare ținută.
    """
    # 1. Verificăm validitatea utilizatorului
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit.")

    # 2. ORM: Interogăm tabela părinte (Outfits)
    outfits = db.query(models.Outfit).filter(models.Outfit.user_id == user_id).all()
    
    # Dacă nu are ținute salvate, returnăm o listă goală (este o practică mai bună 
    # pentru Frontend decât să aruncăm o eroare 404).
    if not outfits:
        return []

    # 3. Magia ORM: Datorită relațiilor setate în models.py, SQLAlchemy 
    # va aduce automat și toate hainele (copiii) asociate fiecărei ținute!
    return outfits

@router.delete("/{outfit_id}")
def delete_saved_outfit(outfit_id: int, db: Session = Depends(get_db)):
    """
    Șterge o ținută completă din baza de date.
    Datorită regulilor ORM, va curăța automat și legăturile din tabelul outfit_items.
    """
    outfit = db.query(models.Outfit).filter(models.Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Ținuta nu a fost găsită.")
    
    db.delete(outfit)
    db.commit()

    return {"message": "Tinuta a fost salvata cu succes!"}