import requests
from datetime import datetime, timedelta
# Caching pe Agentul Meteorologic
from dotenv import load_dotenv
import os

class WeatherAgent:
    load_dotenv()

    # Citește cheia din memorie
    API_KEY = os.getenv("OPENWEATHER_API_KEY")
    BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

    # --- MEMORIA CACHE ---
    _cached_weather = None
    _last_fetch_time = None
    CACHE_DURATION_MINUTES = 30 # Cât timp ținem minte vremea
    # Cuvântul magic @classmethod îi spune Python-ului: "Hei, când cineva apelează această funcție, trimite-i automat clasa ca prim parametru (cls)".
    @classmethod
    def get_weather_context(cls, city: str = "Bucuresti") -> dict:
        """
        Apelează API-ul de vreme(sau folosește Cache-ul) și traduce temperatura într-un sezon vestimentar
        pe care baza noastră de date îl înțelege.
        """
        # 1. VERIFICĂM CACHE-UL
        if cls._cached_weather and cls._last_fetch_time:
            timp_trecut = datetime.now() - cls._last_fetch_time
            if timp_trecut < timedelta(minutes=cls.CACHE_DURATION_MINUTES):
                print(f"[CACHE] Folosim datele meteo salvate pentru {city} (expiră în {cls.CACHE_DURATION_MINUTES - timp_trecut.seconds//60} min)")
                return cls._cached_weather

        # 2. DACĂ NU AVEM CACHE, FACEM CEREREA REALĂ
        print(f"[API] Facem cerere nouă către OpenWeather pentru {city}...")
        try:
            # Facem cererea către OpenWeatherMap (units=metric pentru grade Celsius)
            url = f"{WeatherAgent.BASE_URL}?q={city}&appid={WeatherAgent.API_KEY}&units=metric"
            response = requests.get(url, timeout=5)
            response.raise_for_status() # Aruncă eroare dacă codul nu e 200 OK
            
            data = response.json()
            temp = data["main"]["temp"]
            condition = data["weather"][0]["main"] # Ex: Rain, Clear, Clouds
            
            # --- LOGICA INTELIGENTĂ (Reguli de mapare a vremii) ---
            if temp >= 22:
                recommended_season = "Vara"
            elif 15 <= temp < 22:
                recommended_season = "Primavara"
            elif 5 <= temp < 15:
                recommended_season = "Toamna"
            else:
                recommended_season = "Iarna"
                
            rezultat = {
                "city": city,
                "temperature": round(temp),
                "condition": condition,
                "recommended_season": recommended_season,
                "success": True
            }
        
        # 3. SALVĂM ÎN CACHE PENTRU DATA VIITOARE
            cls._cached_weather = rezultat
            cls._last_fetch_time = datetime.now()
            
            return rezultat
            
        except Exception as e:
            print(f"Eroare în WeatherAgent: {e}")
            # Fallback (Plan de rezervă) dacă pică internetul sau API-ul
            return {
                "city": city,
                "temperature": 20,
                "condition": "Unknown",
                "recommended_season": "Toate", # Permitem orice haină ca să nu blocăm aplicația
                "success": False
            }