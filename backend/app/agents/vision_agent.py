from rembg import remove
from PIL import Image
import io
import os
import google.generativeai as genai
import json
import PIL.Image
import re 
from dotenv import load_dotenv

# Încarcă variabilele din .env
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configurează AI-ul
genai.configure(api_key=GOOGLE_API_KEY)

class VisionAgent:
    """
    Agentul responsabil cu procesarea imaginilor (AI Vision).
    Folosește modele de rețele neurale pentru a extrage trăsături și a elimina fundalul.
    """
    
    @staticmethod
    def remove_background(input_path: str, output_path: str) -> bool:
        """
        Citește o imagine de la `input_path`, folosește AI pentru a elimina fundalul,
        și salvează rezultatul cu fundal transparent la `output_path`.
        """
        try:
            # 1. Citim imaginea originală ca un șir de biți (bytes)
            with open(input_path, 'rb') as img_file:
                input_bytes = img_file.read()
            
            # 2. MAGIA AI: Rețeaua neurală procesează imaginea
            # (Prima oară când rulezi, va descărca automat modelul u2net în fundal)
            output_bytes = remove(input_bytes)
            
            # 3. Salvăm imaginea nouă (va fi în format PNG pentru a suporta transparența)
            with open(output_path, 'wb') as out_file:
                out_file.write(output_bytes)
                
            return True
            
        except Exception as e:
            print(f"Eroare în VisionAgent la tăierea fundalului: {e}")
            return False


    @staticmethod
    def analyze_clothing_image(image_path: str) -> dict:
        """
        Primește calea către o poză de pe hard disk, o trimite la Gemini Vision 
        și returnează un dicționar cu atributele hainei.
        """
        try:
            # 1. Deschidem poza de pe hard disk
            img = PIL.Image.open(image_path)
            
            # 2. Selectăm modelul vizual de la Google (Gemini 2.5 Flash e perfect pentru poze și foarte rapid)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # 3. PROMPT ENGINEERING: Îi dăm instrucțiuni stricte AI-ului
            prompt = """
            Ești un asistent de modă expert (AI Stylist).
            Privește această imagine cu o haină și extrage următoarele caracteristici.
            
            Trebuie să răspunzi STRICT cu un obiect JSON valid, fără alte texte sau explicații.
            Folosește această structură exactă:
            {
                "category": "Alege DOAR din: Tricou, Camasa, Hanorac, Pulover, Top, Bluza, Maieu, Blugi, Pantaloni, Joggers, Fusta, Pantaloni scurti, Colanti, Adidasi, Pantofi, Ghete, Cizme, Sandale, Geaca, Palton, Sacou, Jacheta, Geanta, Rucsac, Curea, Palarie, Fular, Ochelari, Accesoriu",
                "color": "Alege DOAR din această listă de culori standard: Negru, Alb, Gri, Bej, Crem, Maro, Bleumarin, Albastru, Bleu, Rosu, Visiniu, Roz, Mov, Violet, Verde, Kaki, Galben, Mustar, Portocaliu, Auriu, Argintiu, Multicolor",
                "weather_type": "Alege DOAR din: Vara, Iarna, Primavara, Toamna, Toate",
                "formality": "Alege DOAR din: Casual, Elegant, Sport, Office"
            }
            """
            
            # 4. Trimitem poza și instrucțiunile la Google
            response = model.generate_content([prompt, img])
            
            # 5. Răspunsul vine ca text. Curățăm textul de posibilele marcaje de cod (```json ... ```)
            response_text = response.text.strip()

            # 5. PARSARE ROBUSTĂ (Căutăm forțat doar blocul cu acolade {...})
            match = re.search(r'\{.*\}', response_text, re.DOTALL) #regexp de la baze de date
            if not match:
                raise ValueError(f"AI-ul nu a returnat un JSON valid. Răspuns brut: {response_text}")
                
            json_string = match.group(0)
            extracted_data = json.loads(json_string)
            
            return extracted_data
            
        except Exception as e:
            # AICI E CHEIA: Printăm eroarea reală în terminal ca să o vezi!
            print(f"\n[!!!] EROARE CRITICĂ ÎN VISION AGENT: {e}\n")
            return {
                "category": "Necunoscut",
                "color": "Necunoscut",
                "weather_type": "Toate",
                "formality": "Casual"
            }