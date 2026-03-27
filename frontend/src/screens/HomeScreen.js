// frontend/src/screens/HomeScreen.js (RECEPTORUL PĂRINTE)
// Acest ecran importă poștașul (apiClient), importă piesa de LEGO (ClothingCard) și cere datele de pe internet.

// IMPORTURILE: Aducem uneltele de React, poștașul și componenta vizuală
import React, { useState, useEffect, useContext} from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Platform, RefreshControl, TouchableOpacity} from 'react-native';
import apiClient from '../api/client'; // Importăm instanța Axios pe care ai creat-o cu ip-ul laptopului tău din rețeaua Wi-Fi 
import ClothingCard from '../components/ClothingCard'; // noua piesa de cod pe care o vom folosi pentru a desena hainele

// NOU 2: Importăm Turnul nostru de Radio ca să știm frecvența pe care ascultăm
import { AuthContext } from '../context/AuthContext';

const HomeScreen = () => {
  // 1. MANAGEMENTUL STĂRII (State)
  // Folosim Hook-ul 'useState' pentru a stoca datele local în memoria telefonului.
  const [clothes, setClothes] = useState([]); // Array gol inițial pentru haine
  const [loading, setLoading] = useState(true); // Indicator vizual de încărcare
  const [error, setError] = useState(null); // Gestiunea erorilor HTTP
  const [refreshing, setRefreshing] = useState(false); // Starea pentru "Pull-to-Refresh"

  const { userId, logout} = useContext(AuthContext);
  // 2. CICLUL DE VIAȚĂ (Lifecycle / Side Effects)
  // Hook-ul 'useEffect' cu un array gol [] execută codul o singură dată, 
  // exact în momentul în care ecranul a fost randat pe telefon.
  // NOU acum nu mai e un array nou
  
  // Redirecționarea Reactivă: În React, ecranele nu se schimbă singure doar pentru că ai șters o variabilă. 
  // Trebuie să existe un useEffect (un observator) care să spună "Dacă variabila asta s-a schimbat, fă acțiunea asta 
  // (router.replace)".
  useEffect(() => {

    // NOU 5: Când se deschide ecranul, verificăm dacă avem un ID.
    // Dacă avem, abia atunci declanșăm cererea către Python.
    if (userId && userId !== 'null') {
      fetchClothes();
    }
  }, [userId]); // // React va rula funcția din nou dacă se schimbă utilizatorul logat

  // Această funcție se declanșează când tragi de ecran în jos
  const onRefresh = async () => {
    setRefreshing(true); // 1. Pornim rotița de sus
    await fetchClothes(); // 2. Cerem datele proaspete de la Python
    setRefreshing(false); // 3. Oprim rotița după ce au venit datele
  };

  // 3. PROGRAMARE ASINCRONĂ
  // La deschiderea aplicației, strigăm la Python!
  // Funcția trebuie să fie 'async' pentru a nu bloca interfața utilizatorului
  // cât timp așteptăm ca pachetele de rețea să se întoarcă de la serverul Python.
  const fetchClothes = async () => {
    try {
      // Facem cererea GET către ușa de backend creată anterior
      // NOU 4: Aici e magia! Am șters acel `1` scris manual.
      // Am folosit backticks ( ` ) pentru a putea injecta variabila ${userId} direct în textul adresei (URL).
      // Dacă `userId` este 4, Axios va trimite automat cererea la `/clothes/user/4`.
      const response = await apiClient.get(`/clothes/user/${userId}`);
      
      // Axios stochează răspunsul JSON în proprietatea '.data'
      // 2. response.data conține fix JSON-ul trimis de Python!
      // Adică lista: [ {id: 1, category: "Tricou", color: "Rosu"}, ... ]
      setClothes(response.data);
      setLoading(false); // Oprim animația de încărcare
    } catch (err) {
      console.error("Eroare de rețea:", err);
      setError("Nu m-am putut conecta la serverul Python. Verifică IP-ul!");
      setLoading(false);
    }
  };

  // FUNCȚIA NOUĂ: Logica de ștergere
  const deleteClothingItem = async (itemId) => {
    // 1. Întrebăm utilizatorul dacă e sigur (Confirmare)
    Alert.alert(
      "Șterge haina",
      "Ești sigur că vrei să arunci această haină din dulap?",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Șterge", 
          style: "destructive", // Face butonul roșu pe iOS
          onPress: async () => {
            try {
              // 2. Trimitem comanda către Python
              await apiClient.delete(`/clothes/${itemId}`); 
              
              // 3. Actualizăm interfața instantaneu, filtrând haina ștearsă
              // Asta forțează ecranul să se redeseneze fără haina respectivă
              setClothes((haineleCurente) => haineleCurente.filter(haina => haina.id !== itemId));
              
            } catch (err) {
              Alert.alert("Eroare", "Nu am putut șterge haina.");
              console.error(err);
            }
          }
        }
      ]
    );
  };

  // 4. RANDAREA CONDIȚIONALĂ (UI Rendering)
  // Dacă datele încă se descarcă, afișăm un spinner (rotiță de încărcare)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Dacă API-ul a picat, afișăm eroarea
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Randarea principală a interfeței
  return (
    <View style={styles.container}>
      
      {/* --- NOU: Containerul pentru Header (Titlu + Buton Logout) --- */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
      }}>
        {/* Titlul tău original (am scos marginea de jos dacă o avea în styles.title ca să fie aliniat) */}
        <Text style={styles.title}>Dulapul Meu</Text>
        
        {/* Butonul de Ieșire */}
        <TouchableOpacity 
          onPress={logout} 
          style={{ 
            backgroundColor: '#ff4444', 
            paddingVertical: 8, 
            paddingHorizontal: 12, 
            borderRadius: 8 
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Ieșire 🚪</Text>
        </TouchableOpacity>
      </View>
      {/* --- SFÂRȘIT NOU --- */}
      {/* FlatList este o componentă nativă hiper-optimizată pentru liste lungi. 
          Ea nu randează elementele care nu sunt vizibile pe ecran (Lazy Rendering). */}
      <FlatList
  data={clothes} // // Îi dăm listei de JSON-uri să o parcurgă
  keyExtractor={(item) => item.id.toString()}
  // Pentru FIECARE element din listă, FlatList extrage un obiect pe care îl numește generic "item"
  renderItem={({ item }) => 
    // Îi pasăm copilului acest obiect JSON prin "cablul" numit `item`
  <ClothingCard item={item} onDelete={() => deleteClothingItem(item.id)}/>} // Pasăm haina copilului prin prop-ul "item" si functia de stergere
  contentContainerStyle={{ paddingBottom: 20 }} // Lasă puțin spațiu la finalul listei
  // MAGIA PENTRU REFRESH ESTE AICI:
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
  }
/>
    </View>
  );
};

// 5. STILIZAREA (CSS în format JavaScript Object)
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupă tot spațiul ecranului
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    padding: 5,

  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow specific pentru Android
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default HomeScreen;