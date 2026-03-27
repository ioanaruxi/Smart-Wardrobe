import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl} from 'react-native';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';

// NOU 2: Importăm Contextul
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const StylistScreen = () => {
  // --- ZONA DE MEMORIE (STATE) ---
  // Aici creăm "cutiuțele" în care ținem datele. Dacă valoarea dintr-o cutiuță se schimbă, 
  // React va redesena ecranul automat.
  const [myClothes, setMyClothes] = useState([]); // Dulapul curent
  const [recommendations, setRecommendations] = useState([]); // Ținuta propusă
  const [selectedBaseItemId, setSelectedBaseItemId] = useState(null);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Starea pentru "Pull-to-Refresh"

  // NOU: Stări pentru funcțiile AI avansate
  const [weatherText, setWeatherText] = useState("");
  const [missingPieces, setMissingPieces] = useState([]);
  
  // NOU 3: Tragem `userId` din stația radio.
  const { userId } = useContext(AuthContext);
  // --- DECLANȘATORUL AUTOMAT (EFFECT) ---
  // useEffect cu [] la final înseamnă: "Rulează codul din interior o singură dată, exact în secunda în care utilizatorul a deschis această pagină".
  // 1. Când deschidem ecranul, descărcăm hainele ca să avem de unde alege "Piesa de bază"
  useEffect(() => {
    if(userId){
    fetchMyClothes();
    }
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true); // 1. Pornim rotița de sus
    await fetchMyClothes(); // 2. Cerem datele proaspete de la Python
    setRefreshing(false); // 3. Oprim rotița după ce au venit datele
  };
  
  // --- FUNCȚIA DE REȚEA 1 (Aduce dulapul) ---
  const fetchMyClothes = async () => {
    try {
      const response = await apiClient.get(`/clothes/user/${userId}`);
      setMyClothes(response.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Eroare", "Nu am putut aduce dulapul tău.");
    } finally {
      setLoadingWardrobe(false);
    }
  };

  // --- FUNCȚIA DE REȚEA 2 (Vorbește cu AI-ul) ---
  // Se declanșează DOAR când utilizatorul apasă pe o haină (primește itemId-ul hainei apăsate)
  // 2. Funcția care apelează ruta ta de Python: /recommend/{item_id}
  const getOutfitFor = async (itemId) => {
    setIsGenerating(true);
    setRecommendations([]); // Curățăm recomandările vechi
    setSelectedBaseItemId(itemId);
    setWeatherText("");
    setMissingPieces([]);
    // Trimite ID-ul către Python -> Python calculează -> se întoarce rezultatul
    try {
      const response = await apiClient.get(`/outfits/recommend/${itemId}`);
      // ADĂUGĂM ASTA CA SĂ VEDEM CE TRIMITE PYTHON-UL:
      console.log("Date primite de la AI:", response.data); 
      // Salvăm pachetul de date primit de la noul backend
      setRecommendations(response.data.outfit);
      setWeatherText(response.data.weather_text);
      setMissingPieces(response.data.missing_pieces);
    } catch (err) {
      // Tratăm eroarea inteligentă de 404 pe care ai scris-o în Python
      if (err.response && err.response.status === 404) {
        Alert.alert("Sfat", err.response.data.detail); 
      } else {
        Alert.alert("Eroare", "Agentul AI nu a putut procesa recomandarea.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveOutfit = async () => {
    // Extragem ID-urile direct din lista de haine
    const recomendedIds = recommendations.map(haina => haina.id);
    // Folosim Set pentru a ne asigura că nu avem ID-uri duplicate
    // (pentru că backend-ul a adăugat deja piesa de bază în ținută)
    const allIds = [... new Set([selectedBaseItemId, ...recomendedIds])];

    const payload = {
      name: "Ținută Generată AI", 
      clothing_item_ids: allIds
    };

    try {
      await apiClient.post(`/outfits/create/${userId}`, payload);
      Alert.alert("Succes!", "Ținuta a fost salvată cu succes în baza de date! 👗");
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Nu am putut salva ținuta.");
    }
  };

  // --- NOU: Șablonul vizual pentru pozele mari din Moodboard ---
  const renderMoodboardItem = ({ item }) => {
    // item este acum direct obiectul hainei, nu mai e un dicționar cu "similarity_score"
    const fullImageUrl = item.image_url ? `${BASE_URL}/${item.image_url}` : null;
    
    return (
      <View style={styles.moodboardCard}>
        {fullImageUrl ? (
          <Image source={{ uri: fullImageUrl }} style={styles.moodboardImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderMoodboard}>
            <Ionicons name="image-outline" size={40} color="#999" />
          </View>
        )}
        <Text style={styles.moodboardCategory}>{item.category}</Text>
      </View>
    );
  };

  if (loadingWardrobe) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
  }

  // --- ZONA VIZUALĂ (Ce se desenează pe ecran) ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Stylist</Text>
      
      {/* SECȚIUNEA 1: Alege piesa de bază */}
      <Text style={styles.subtitle}>Alege o piesă de bază pentru ținuta ta:</Text>
      
      <View style={styles.pickerContainer}>
        <FlatList
          horizontal 
          showsHorizontalScrollIndicator={false}
          data={myClothes}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          }
          renderItem={({ item }) => {
            const isSelected = selectedBaseItemId === item.id;
            const fullImageUrl = item.image_url ? `${BASE_URL}/${item.image_url}` : null;
          
            return (
              <TouchableOpacity 
                style={[
                  styles.baseItemWrapper, 
                  isSelected && styles.baseItemSelected 
                ]} 
                onPress={() => getOutfitFor(item.id)}
              >
                {fullImageUrl ? (
                  <Image source={{ uri: fullImageUrl }} style={styles.baseItemImage} resizeMode="cover" />
                ) : (
                  <View style={styles.baseItemImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={24} color="#888" />
                  </View>
                )}
                <Text style={[styles.baseItemMiniText, isSelected && { color: '#8A2BE2', fontWeight: 'bold' }]} numberOfLines={1}>
                  {item.category || "Articol"}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 10 }} 
        />
      </View>

      {/* 2. ZONA MOODBOARD-ULUI (Ținuta Generată) */}
      <View style={styles.moodboardContainer}>
        {isGenerating ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text style={{ marginTop: 15, color: '#8A2BE2', fontWeight: 'bold' }}>Agentul AI citește vremea și creează ținuta...</Text>
          </View>
        ) : recommendations.length > 0 ? (
          <View style={{ flex: 1 }}>
            
            {/* NOU: BANNERUL DE VREME */}
            {weatherText ? (
              <View style={styles.weatherBanner}>
                <Text style={styles.weatherText}>{weatherText}</Text>
              </View>
            ) : null}

            <Text style={styles.moodboardTitle}>✨ Ținuta propusă:</Text>
            
            {/* Grila cu pozele mari ale hainelor */}
            <FlatList
              data={recommendations}
              numColumns={2} 
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={renderMoodboardItem}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            />

            {/* NOU: BANNERUL PENTRU PIESE LIPSĂ */}
            {missingPieces && missingPieces.length > 0 && (
              <View style={styles.missingBanner}>
                <Ionicons name="warning-outline" size={24} color="#FF9500" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.missingTitle}>Ținuta este incompletă!</Text>
                  <Text style={styles.missingText}>
                    Îți lipsește un articol din categoria <Text style={{fontWeight: 'bold'}}>{missingPieces.join(", ")}</Text>. 
                  </Text>
                </View>
              </View>
            )}
            
            {/* 3. ZONA DE BUTOANE (Acțiunile utilizatorului) */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#FF9500' }]} 
                onPress={() => getOutfitFor(selectedBaseItemId)} 
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.actionButtonText}> Altă opțiune</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#34C759' }]} 
                onPress={saveOutfit}
              >
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}> Salvează</Text>
              </TouchableOpacity>
            </View>

          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="sparkles-outline" size={60} color="#ccc" />
            <Text style={styles.placeholderText}>Apasă pe o haină din carusel pentru a genera o ținută bazată pe vreme!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 15 },
  placeholderText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 50, fontStyle: 'italic' },
  
  pickerContainer: { height: 110, marginBottom: 15 },
  
  baseItemWrapper: { alignItems: 'center', marginRight: 15, opacity: 0.7, transform: [{ scale: 0.95 }] },
  baseItemSelected: { opacity: 1, transform: [{ scale: 1.05 }] },
  baseItemImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  baseItemImagePlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ccc' },
  baseItemMiniText: { marginTop: 6, fontSize: 12, color: '#666', maxWidth: 70, textAlign: 'center' },
  
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  actionButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold', marginLeft: 5 },
  
  moodboardCard: { width: '48%', marginBottom: 15, alignItems: 'center' },
  moodboardImage: { width: '100%', height: 160, borderRadius: 15, backgroundColor: '#f0f0f0' },
  placeholderMoodboard: { width: '100%', height: 160, borderRadius: 15, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  moodboardCategory: { marginTop: 8, fontSize: 15, fontWeight: '600', color: '#333' },
  moodboardContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  moodboardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  
  // --- STILURILE NOI PENTRU BANNERE ---
  weatherBanner: { backgroundColor: '#E6F2FF', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#B3D9FF', alignItems: 'center' },
  weatherText: { color: '#0059B3', fontWeight: 'bold', fontSize: 16 },
  
  missingBanner: { flexDirection: 'row', backgroundColor: '#FFF5E6', padding: 15, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#FFD699', alignItems: 'center' },
  missingTitle: { color: '#CC7A00', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  missingText: { color: '#666', fontSize: 13 }
});

export default StylistScreen;