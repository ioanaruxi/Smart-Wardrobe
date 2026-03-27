import numpy as np
from sklearn.cluster import KMeans
from PIL import Image


# NU MAI AVEM NEVOIE DE NIMIC DE AICI DEOARECE NU MAI FOLOSIM K-MEANS
def get_dominant_color(image_path: str, k: int = 3) -> str:
    """
    Algoritm matematic pentru extragerea culorii dominante folosind K-Means Clustering.
    Ignoră pixelii transparenți (fundalul eliminat anterior).
    """
    # 1. Deschidem imaginea și o forțăm în format RGBA (Red, Green, Blue, Alpha/Transparență)
    img = Image.open(image_path).convert("RGBA")
    
    # 2. Transformăm imaginea într-o matrice multidimensională (Numpy Array)
    img_data = np.array(img)
    
    # 3. ALGEBRĂ LINIARĂ: Filtrăm pixelii.
    # img_data[:, :, 3] reprezintă stratul de transparență. Păstrăm doar pixelii hainei (Alpha > 0)
    pixels = img_data[img_data[:, :, 3] > 0]
    
    # Păstrăm doar canalele R, G, B (primele 3) pentru a calcula culoarea
    rgb_pixels = pixels[:, :3]
    
    if len(rgb_pixels) == 0:
        return "Necunoscut"
        
    # 4. MACHINE LEARNING: Aplicăm K-Means
    # Împărțim milioanele de pixeli în 'k' (ex: 3) grupuri bazat pe similaritate
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(rgb_pixels)
    
    # 5. Găsim cluster-ul (grupul) care conține cei mai mulți pixeli
    labels = kmeans.labels_
    counts = np.bincount(labels)
    dominant_cluster_index = np.argmax(counts)
    
    # Extragem coordonatele RGB ale centrului acelui cluster
    dominant_rgb = kmeans.cluster_centers_[dominant_cluster_index]
    
    # 6. Convertim vectorul RGB într-un nume de culoare pe care utilizatorul să îl înțeleagă
    return rgb_to_color_name(dominant_rgb)

def rgb_to_color_name(rgb_array: np.ndarray) -> str:
    """
    Calculează Distanța Euclideană în spațiul 3D pentru a găsi cea mai apropiată culoare de bază.
    """
    # Definim un "dicționar" de vectori pentru culorile de bază
    colors = {
        "Negru": np.array([0, 0, 0]),
        "Alb": np.array([255, 255, 255]),
        "Rosu": np.array([255, 0, 0]),
        "Verde": np.array([0, 255, 0]),
        "Albastru": np.array([0, 0, 255]),
        "Galben": np.array([255, 255, 0]),
        "Gri": np.array([128, 128, 128]),
        "Portocaliu": np.array([255, 165, 0]),
        "Roz": np.array([255, 192, 203]),
        "Maro": np.array([165, 42, 42]),
        "Bej": np.array([245, 245, 220]),
        "Bleumarin": np.array([0, 0, 128])
    }
    
    min_distance = float("inf")
    closest_color = "Necunoscut"
    
    # Căutăm punctul cel mai apropiat în spațiul 3D
    for name, color_value in colors.items():
        # Linalg.norm calculează distanța matematică dintre 2 puncte
        distance = np.linalg.norm(rgb_array - color_value)
        if distance < min_distance:
            min_distance = distance
            closest_color = name
            
    return closest_color