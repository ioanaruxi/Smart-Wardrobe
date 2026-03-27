// Fișierul 6: frontend/src/components/ClothingCard.js (DESENATORUL COPIL)
// Copilul nu știe nimic de Python, de baze de date sau de Axios. El știe un singur lucru: 
// "Am primit prin cablul item un obiect JSON cu proprietățile category și color pe care trebuie să le scriu pe
// ecran".

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importăm iconițele

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


// Funcție ajutătoare pentru a transforma textul venit de la AI în cod de culoare HEX
const getColorHex = (colorName) => {
  const colors = {
    "Rosu": "#FF3B30", "Albastru": "#007AFF", "Verde": "#34C759",
    "Negru": "#000000", "Alb": "#FFFFFF", "Galben": "#FFCC00",
    "Gri": "#8E8E93", "Portocaliu": "#FF9500", "Roz": "#FF2D55",
    "Bleumarin": "#000080", "Bej": "#F5F5DC", "Maro": "#A52A2A",
    // --- CULORILE NOI ---
    "Crem": "#FFFDD0", "Bleu": "#87CEEB", "Visiniu": "#800020",
    "Mov": "#800080", "Violet": "#EE82EE", "Kaki": "#F0E68C",
    "Mustar": "#FFDB58", "Auriu": "#FFD700", "Argintiu": "#C0C0C0",
    "Multicolor": "#A9A9A9"
  };
  return colors[colorName] || "#E5E5EA"; // Un gri neutru dacă AI-ul dă o culoare necunoscută
};

// Componenta primește un obiect 'item' prin Props si o funcție de ștergere prin Props
// Aici primește obiectul (JSON-ul tradus din Python)
const ClothingCard = ({ item , onDelete}) => {
  const colorHex = getColorHex(item.color);
  // Dacă obiectul venit de la Python arată așa: {id: 1, category: "Tricou", color: "Rosu"}
  // Atunci item.category va fi "Tricou", iar item.color va fi "Rosu".

  // Construim link-ul complet. 
  // item.image_url vine din baza de date ca "uploaded_images/poza_mea.png"
  // Noi îl transformăm în "http://192.168.1.146:8000/uploaded_images/poza_mea.png"
  const fullImageUrl = item.image_url ? `${BASE_URL}/${item.image_url}` : null;
  return (
    <View style={styles.card}>
      {/* 1. ZONA PENTRU IMAGINE */}
      {fullImageUrl ? (
        <Image 
          source={{ uri: fullImageUrl }} 
          style={styles.clothingImage} 
          resizeMode="cover" // Taie poza frumos ca să umple pătratul
        />
      ) : (
        // Dacă haina nu are poză (sau s-a pierdut), arătăm un pătrat gri
        <View style={styles.placeholderImage}>
          <Ionicons name="image-outline" size={24} color="#999" />
        </View>
      )}
      
      {/* Partea dreaptă: Detaliile hainei */}
      <View style={styles.infoContainer}>
        <Text style={styles.categoryText}>{item.category || 'Articol neclasificat'}</Text>
        <Text style={styles.detailText}>Vreme: {item.weather_type || 'Nesetată'}</Text>
        <Text style={styles.detailText}>Stil: {item.formality || 'Nesetat'}</Text>
      </View>
      {/* Partea Dreaptă: Butonul de Ștergere */}
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    flexDirection: 'row', // Aliniază elementele pe orizontală (stânga-dreapta)
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center', // Centrează elementele vertical
    // Umbre pentru iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Umbre pentru Android
    elevation: 4, 
  },
  // --- STILURILE NOI PENTRU POZĂ ---
  clothingImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0', // Un fundal subtil cât se încarcă
  },
  infoContainer: {
    flex: 1, // Ia tot spațiul rămas liber
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  // Stilul pentru butonul de ștergere
  deleteButton: {
    padding: 10, // Zonă de apăsare mai mare pentru degete
  }
});

export default ClothingCard;