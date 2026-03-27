import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const RegisterScreen = () => {
  // Tragem funcția de register din Turnul de Radio
  const { register, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  // Memoria RAM pentru căsuțele de text
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Funcția care se execută când apasă butonul
  const handleRegister = async () => {
    // Validare simplă: să nu lase câmpuri goale
    if (!username || !email || !password) {
      Alert.alert("Eroare", "Te rog completează toate câmpurile!");
      return;
    }

    try {
      // Apelăm funcția din Turnul de Radio care trimite datele la Python
      await register(username, email, password);
      
      // Dacă a mers, îi spunem "Bravo" și îl trimitem la Logare să bage parola
      Alert.alert("Succes!", "Contul a fost creat. Te poți loga acum.");
      router.replace('/login'); 
      
    } catch (error) {
      // Dacă Python zice că email-ul există deja, dă eroare
      Alert.alert("Eroare la creare", "E posibil ca acest email să fie deja folosit.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creare Cont Nou</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Numele tău" 
        value={username} 
        onChangeText={setUsername} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address"
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
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Creează Contul</Text>
        </TouchableOpacity>
      )}

      {/* Buton de întoarcere la Login */}
      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace('/login')}>
        <Text style={{ color: '#8A2BE2' }}>Ai deja cont? Loghează-te aici!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 40 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '100%', height: 50, backgroundColor: '#8A2BE2', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default RegisterScreen;