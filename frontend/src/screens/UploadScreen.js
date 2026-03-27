  import React, { useState, useContext } from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, ScrollView, RefreshControl} from 'react-native';
  import * as ImagePicker from 'expo-image-picker'; // Importăm accesul la Galeria telefonului
  import apiClient from '../api/client';
  import { Ionicons } from '@expo/vector-icons';

  // NOU 2: Importăm Contextul
  import { AuthContext } from '../context/AuthContext';
  
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const UploadScreen = () => {
    const [imageUri, setImageUri] = useState(null); // Aici ținem adresa pozei selectate de pe telefon
    const [loading, setLoading] = useState(false);
  // Aici vom stoca răspunsul de la AI după ce se face upload-ul
    const [analyzedItem, setAnalyzedItem] = useState(null);
    const [refreshing, setRefreshing] = useState(false); // Starea pentru "Pull-to-Refresh"

    // NOU 3: Tragem `userId` din stația radio.
    const { userId } = useContext(AuthContext);

    // Funcția 1: Deschiderea Galeriei
    const pickImage = async () => {
      // Cerem permisiunea (dacă e nevoie) și deschidem galeria
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Îi dăm voie utilizatorului să taie (crop) poza
        aspect: [4, 3],
        quality: 0.8, // Comprimăm puțin poza (80%) ca să se încarce mai repede
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri); // Salvăm calea locală a pozei în memorie
      }
    };

    // Această funcție se declanșează când tragi de ecran în jos
    const onRefresh = () => {
      setRefreshing(true); 
      
      // "Tăiem" orice acțiune și resetăm ecranul la starea inițială (curată)
      setImageUri(null);
      setAnalyzedItem(null);
      setLoading(false); // Dacă rotița AI-ului se blocase, o oprim forțat!

      // Oprim animația de refresh a ecranului după o secundă (doar pentru efect vizual)
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    };


    // Funcția 2: Trimiterea către Python
    const uploadAndAnalyze = async () => {
      if (!imageUri) {
        Alert.alert("Eroare", "Te rog selectează o poză mai întâi!");
        return;
      }

      setLoading(true);

      // Creăm un obiect special de tip FormData (standardul pentru fișiere)
      // Dar FormData este o clasă specială din JavaScript creată exclusiv pentru a mima modul în care un browser web 
      // trimite fisiere HTML clasice. 
      // API-ul acestei clase (modul în care a fost ea programată de creatorii JavaScript) nu acceptă să îi dai toate 
      // datele odată în paranteze când
      // o creezi (new FormData({...}) nu este permis).
      // Ești forțat, prin designul ei intern, să o creezi goală (new FormData()) și apoi să folosești metoda procedurală 
      // .append('cheie', 'valoare') pas cu pas,
      // ca și cum ai pune obiecte unul câte unul într-un coș de cumpărături.
      const formData = new FormData();
      
      // React Native are nevoie de acest format specific pentru a trimite fișiere fizice
      const localUri = imageUri;
      const filename = localUri.split('/').pop(); // Extragem numele fișierului din link
      
      // Ghicim tipul fișierului (MIME type)
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // Adăugăm poza în "plicul" formData. Numele 'file' trebuie să fie EXACT 
      // numele variabilei pe care o așteaptă Python-ul tău în ușa de POST!
      formData.append('file', { uri: localUri, name: filename, type });
      formData.append('user_id', String(userId));

      try {
        // Facem cererea de POST, adăugând manual header-ul de multipart/form-data
        const response = await apiClient.post('/clothes/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setAnalyzedItem(response.data);
        Alert.alert("Succes!", `Haina a fost salvată. AI-ul spune că este de culoare: ${response.data.color}`);
        
      } catch (error) {
          // Dacă eroarea vine de la serverul Python (avem un răspuns)
          if (error.response) {
            console.error("Motivul EXACT de la FastAPI:", JSON.stringify(error.response.data, null, 2));
            Alert.alert("Eroare de Validare", JSON.stringify(error.response.data.detail));
          } else {
            // Dacă e o eroare de rețea (ex: server oprit)
            console.error("Eroare generală Axios:", error.message);
          }
          
        }
        finally {
          // REZOLVAREA BUG-ULUI:
          // Indiferent dacă a fost succes sau eroare, la final oprim rotița de încărcare!
          setLoading(false);
      }
    };

    // Funcția pentru când utilizatorul corectează ceva manual și apasă Confirmă
    const confirmAndSave = async () => {
      // 1. Pornim starea de încărcare ca să blocăm butonul cât timp comunică cu baza de date
      setLoading(true);
      try {
        // Vom trimite noile texte scrise de utilizator către o rută de update (PUT)
        await apiClient.put(`/clothes/${analyzedItem.id}`, analyzedItem);
        Alert.alert("Succes", "Haina a fost salvată definitiv în dulapul tău!");
        
        // Resetăm ecranul pentru o haină nouă
        setImageUri(null);
        setAnalyzedItem(null);
      } catch (error) {
        console.error(error);
        Alert.alert("Eroare", "Nu am putut salva modificările.");
      }
      finally{
        // 4. Indiferent dacă a mers sau a dat eroare, oprim rotița de încărcare!
        // Dacă uitam asta, butonul rămânea blocat pentru a doua haină.
        setLoading(false);
      }
    };


    return (<ScrollView contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" colors={['#8A2BE2']} />
      }
    >
        <Text style={styles.title}>Adaugă o Haină</Text>
        
        {/* 1. ZONA DE UPLOAD */}
        {!analyzedItem && (
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera-outline" size={50} color="#8A2BE2" />
                  <Text style={styles.placeholderText}>Alege o poză din galerie</Text>
                </View>
              )}
            </TouchableOpacity>

            {imageUri && (
              <TouchableOpacity 
                style={[styles.button, loading && { backgroundColor: '#ccc' }]} 
                onPress={uploadAndAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>AI-ul analizează și decupează...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>✨ Trimite către AI Stylist</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 2. ZONA FORMULARULUI INTELIGENT (Apare după analiza AI) */}
        {analyzedItem && (
          <View style={styles.formSection}>
            <Text style={styles.subtitle}>Verifică datele extrase de AI:</Text>
            
            {/* Afișăm poza FĂRĂ FUNDAL venită de la server! */}
            <Image 
              source={{ uri: `${BASE_URL}/${analyzedItem.image_url}` }} 
              style={styles.cleanImage} 
              resizeMode="contain"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categorie</Text>
              <TextInput 
                style={styles.input} 
                value={analyzedItem.category} 
                onChangeText={(text) => setAnalyzedItem({...analyzedItem, category: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Culoare</Text>
              <TextInput 
                style={styles.input} 
                value={analyzedItem.color} 
                onChangeText={(text) => setAnalyzedItem({...analyzedItem, color: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sezon (Vreme)</Text>
              <TextInput 
                style={styles.input} 
                value={analyzedItem.weather_type} 
                onChangeText={(text) => setAnalyzedItem({...analyzedItem, weather_type: text})}
              />
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#34C759' }]} onPress={confirmAndSave}>
              <Text style={styles.buttonText}>💾 Actualizează Detaliile</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    );  
  };


  const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 15, textAlign: 'center' },
    
    uploadSection: { alignItems: 'center' },
    imagePicker: { width: 250, height: 250, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    previewImage: { width: '100%', height: '100%' },
    placeholder: { alignItems: 'center' },
    placeholderText: { marginTop: 10, color: '#888', fontSize: 16 },
    
    formSection: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    cleanImage: { width: 150, height: 150, alignSelf: 'center', marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 10 },
    
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
    
    button: { backgroundColor: '#8A2BE2', padding: 15, borderRadius: 25, alignItems: 'center', width: '100%', shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
  });

  export default UploadScreen;