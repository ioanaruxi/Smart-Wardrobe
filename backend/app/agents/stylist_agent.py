import numpy as np

class StylistAgent:
    """
    Agent responsabil cu recomandarea ținutelor folosind Algebră Liniară.
    Evaluează compatibilitatea vestimentară prin calcularea similarității 
    între vectorii de caracteristici (Feature Vectors).
    """

    @staticmethod
    def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
        """
        Calculează Cosine Similarity între doi vectori n-dimensionali.
        """
        # 1. Calculăm Produsul Scalar (Dot Product)
        dot_product = np.dot(v1, v2)
        
        # 2. Calculăm Normele Euclidiene (L2 Norm)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        # Evităm împărțirea la zero în cazul în care un vector este nul [0, 0, 0]
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
            
        # 3. Aplicăm formula cosinusului
        similarity = dot_product / (norm_v1 * norm_v2)
        
        return float(similarity)

    @staticmethod
    def color_to_vector(color_name: str) -> np.ndarray:
        """
        Feature Extraction: Transformă atributul categoric 'color' 
        într-un vector numeric în spațiul 3D (RGB).
        """
        colors = {
            "Negru": [0, 0, 0], "Alb": [255, 255, 255], "Rosu": [255, 0, 0],
            "Verde": [0, 255, 0], "Albastru": [0, 0, 255], "Galben": [255, 255, 0],
            "Gri": [128, 128, 128], "Portocaliu": [255, 165, 0], "Roz": [255, 192, 203],
            "Maro": [165, 42, 42], "Bej": [245, 245, 220], "Bleumarin": [0, 0, 128],
            # --- CULORILE NOI EXTRINSE PENTRU GEMINI AI ---
            "Crem": [255, 253, 208], "Bleu": [135, 206, 235], "Visiniu": [128, 0, 32],
            "Mov": [128, 0, 128], "Violet": [238, 130, 238], "Kaki": [240, 230, 140],
            "Mustar": [255, 219, 88], "Auriu": [255, 215, 0], "Argintiu": [192, 192, 192],
            "Multicolor": [128, 128, 128] # Multicolorul e neutru matematic
        }
        
        # Dacă culoarea nu e în dicționar, returnăm un gri neutru ca fallback
        vector_list = colors.get(color_name, [128, 128, 128])
        return np.array(vector_list)

    @classmethod
    def find_similar_items(cls, target_color_name: str, database_items: list) -> list:
        """
        Primește o culoare țintă și o listă de obiecte SQLAlchemy (haine).
        Returnează lista sortată descrescător după scorul de similaritate.
        """
        target_vector = cls.color_to_vector(target_color_name)
        results = []
        
        for item in database_items:
            # Ignorăm hainele care nu au culoare procesată încă
            if not item.color:
                continue
                
            item_vector = cls.color_to_vector(item.color)
            score = cls.cosine_similarity(target_vector, item_vector)
            
            # Adăugăm rezultatul într-un dicționar temporar
            results.append({
                "item": item,
                "similarity_score": round(score, 4) # Rotunjim la 4 zecimale pentru precizie
            })
            
        # Sortăm lista de dicționare bazat pe scor, de la cel mai mare (1.0) la cel mai mic (0.0)
        # Folosim o funcție lambda pentru a indica algoritmului de sortare cheia corectă
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return results