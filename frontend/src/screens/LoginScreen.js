// (Nou): Interfața vizuală cu formularele de email și parolă.

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router'; // NOU: Am importat motorul de navigare Expo

const LoginScreen = ({ navigation }) => {
  // Conectăm ecranul la Turnul de Radio pentru a folosi funcția de logare și starea de încărcare
  const { login, isLoading, userToken } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter(); // NOU: Instanțiem motorul de navigare
  // --- NOU: PAZNICUL DE LA INTRARE ---
  // Acest senzor ascultă non-stop Turnul de Radio cât timp ești pe pagina asta.
  useEffect(() => {
    // Dacă token-ul a apărut (deci Python a zis OK și logarea a reușit)
    if (userToken) {
      // Teleportează utilizatorul în grupul de tab-uri (în Dulap)
      router.replace('/(tabs)');
    }
  }, [userToken]); // Spunem senzorului să reacționeze doar când se modifică 'userToken'
  // -----------------------------------

  // Randarea interfeței
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Closet</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Parola" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#8A2BE2" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => login(email, password)}>
          <Text style={styles.buttonText}>Logare</Text>
        </TouchableOpacity>
      )}

      {/* Când vom face ecranul de Register, acest buton va duce acolo */}
      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace('/register')}>
        <Text style={{ color: '#8A2BE2' }}>Nu ai cont? Creează unul!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 40 },
  input: { width: '100%', height: 50,backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#8A2BE2', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default LoginScreen;