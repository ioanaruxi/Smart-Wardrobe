import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

// NOU 2: Importăm Turnul nostru de Radio ca să știm frecvența pe care ascultăm
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const MyOutfitsScreen = () => {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Starea pentru "Pull-to-Refresh"

  const { userId } = useContext(AuthContext);
  // Aducem ținutele din Python la încărcarea ecranului
  useEffect(() => {
    if (userId) {
    fetchOutfits();
    }
  }, [userId]);

  
  // Această funcție se declanșează când tragi de ecran în jos
  const onRefresh = async () => {
    setRefreshing(true); // 1. Pornim rotița de sus
    await fetchOutfits(); // 2. Cerem datele proaspete de la Python
    setRefreshing(false); // 3. Oprim rotița după ce au venit datele
  };

  const fetchOutfits = async () => {
    try {
      const response = await apiClient.get(`/outfits/user/${userId}`);
      setOutfits(response.data);
    } catch (error) {
      console.error("Eroare la aducerea ținutelor:", error);
    } finally {
      setLoading(false);
    }
  };

  const wearOutfit = async (outfitId) => {
    try {
      // Facem un apel POST către ruta pe care tocmai am creat-o în Python
      await apiClient.post(`/outfits/${outfitId}/wear`);
      Alert.alert("Super! 🎉", "Am înregistrat ținuta! Statisticile dulapului tău au fost actualizate.");
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Nu am putut înregistra purtarea.");
    }
  };

  const deleteOutfit = async (outfitId) => {
    Alert.alert(
      "Confirmare",
      "Sigur vrei să ștergi această ținută?",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Șterge", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/outfits/${outfitId}`);
              // Actualizăm ecranul eliminând ținuta ștearsă din lista locală
              setOutfits(outfits.filter(outfit => outfit.id !== outfitId));
            } catch (error) {
              Alert.alert("Eroare", "Nu am putut șterge ținuta.");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  // Cum desenăm fiecare ținută în parte
  const renderOutfitCard = ({ item }) => {
    return (
      <View style={styles.outfitCard}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitName}>{item.name}</Text>
          <Text style={styles.outfitDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        {/* Desenăm pozele hainelor care compun această ținută */}
        <View style={styles.itemsRow}>
          {item.items.map((outfitItem, index) => {
            const haina = outfitItem.clothing_item;
            
            // Verificăm de siguranță dacă haina există înainte să o procesăm
            if (!haina) return null; 

            const fullImageUrl = haina.image_url ? `${BASE_URL}/${haina.image_url}` : null;
            
            // Creăm o cheie cu adevărat unică combinând id-ul ținutei, al hainei și indexul
            const uniqueKey = `outfit_${item.id}_item_${haina.id}_pos_${index}`;

            return (
              <View key={uniqueKey} style={styles.miniItem}>
                {fullImageUrl ? (
                  <Image source={{ uri: fullImageUrl }} style={styles.miniImage} resizeMode="cover" />
                ) : (
                  <View style={styles.miniPlaceholder}><Ionicons name="shirt" size={16} color="#999" /></View>
                )}
              </View>
            );
          })}
        </View>

        {/* Butonul care apelează funcția noastră */}
        <TouchableOpacity style={styles.wearButton} onPress={() => wearOutfit(item.id)}>
          <Text style={styles.wearButtonText}>Am purtat asta azi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteOutfit(item.id)}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ținutele Salvate</Text>
      
      {outfits.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="albums-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Nu ai salvat nicio ținută încă.</Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfitCard}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#999' },
  
  outfitCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  outfitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  outfitName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  outfitDate: { fontSize: 12, color: '#888' },
  
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  miniItem: { marginRight: 10, marginBottom: 10 },
  miniImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#ddd' },
  miniPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  wearButton: { flex: 1, backgroundColor: '#100', padding: 10, borderRadius: 8, alignItems: 'center', marginRight: 15 },
  wearButtonText: { color: 'white', fontWeight: 'bold' },
  deleteButton: { padding: 5, alignItems: 'center'},
});

export default MyOutfitsScreen;