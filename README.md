# Smart Closet - AI Wardrobe Assistant

O aplicație mobilă Full-Stack creată pentru a-ți digitaliza garderoba. Folosește Inteligența Artificială pentru a genera recomandări de ținute (outfits) în funcție de vremea de afară și asortarea cromatică a hainelor.

## Arhitectură și Tehnologii
Acest proiect este împărțit în două module principale:

### Frontend (Mobile App)
* **Framework:** React Native cu Expo Router v3 (Navigare declarativă pe bază de fișiere).
* **Comunicare:** Axios cu Interceptori pentru gestionarea token-urilor.
* **State Management:** React Context API global pentru autentificare.
* **UI/UX:** Componente customizate, Flexbox, layout-uri dinamice.

### Backend (API Server)
* **Framework:** Python cu FastAPI (Asincron și extrem de rapid).
* **Bază de date:** MySQL integrat prin SQLAlchemy (ORM).
* **Securitate:** Autentificare Stateless cu JWT (JSON Web Tokens) și hashing de parole cu Bcrypt.
* **Integrare AI & Externe:** * Algoritmi de potrivire cromatică (Cosine Similarity).
  * Constrângeri de styling logic (ex: excluderea combinării unei rochii cu un tricou).
  * Integrare API OpenWeatherMap pentru recomandări contextuale de sezon.

## ✨ Funcționalități Principale
1. **Sistem Securizat de Conturi:** Logare și înregistrare criptată end-to-end.
2. **Garderobă Virtuală:** Încărcarea pozelor direct din galeria telefonului pe server.
3. **AI Stylist:** Generarea de ținute zilnice complet asortate (Top, Bottom, Footwear sau Single Pieces) bazate pe hainele disponibile în dulapul utilizatorului.
4. **Vreme în timp real:** Preluarea condițiilor meteo curente pentru a recomanda haine adecvate temperaturii.