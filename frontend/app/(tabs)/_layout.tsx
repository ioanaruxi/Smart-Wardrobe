
// Acesta este fișierul de la exteriorul aplicației. Aici punem "Turnul de Radio" 
// (AuthContext) și "Paznicul" care decide dacă te lasă să intri în casă sau te trimite la logare.
// el vede tot ce se intampla diferit in cele 4 taburi

import React, {useContext} from 'react';
import { Tabs, Redirect } from 'expo-router';
// NOU: Importăm iconițele vectoriale!
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';

// Aici definim exclusiv meniul de navigație de la baza ecranului
export default function TabLayout() {
  const { userToken } = useContext(AuthContext);

  // 2. PAZNICUL DECLARATIV (Fără useEffect, fără erori de sincronizare!)
  // Dacă Expo citește fișierul și vede că nu ai token, aruncă instant componenta Redirect.
  // Asta nu dă crash NICIODATĂ, pentru că se întâmplă nativ în ciclul de randare.
  if (userToken === null) {
    return <Redirect href="/login" />;
  }
  // 3. Dacă are token, desenează meniul normal
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, // Ascundem titlul de sus implicit al lui Expo
        tabBarActiveTintColor: '#8A2BE2', // Culoarea mov pentru butonul selectat
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 } // Un pic mai înalt ca să respire
      }}
    >
      {/* 1. Primul Tab (Ecranul principal) - fișierul trebuie să se numească "index.tsx" sau "index.js" în folderul (tabs) */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dulap',
          // Desenăm iconița pentru Dulap
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="filter-outline" size={size} color={color} />
          )
          
        }} 
      />
      
      {/* 2. Al doilea Tab - presupunând că ai un fișier "upload.js" în folderul (tabs) */}
      <Tabs.Screen 
        name="upload" 
        options={{ 
          title: 'Adaugă',
          // Desenăm iconița pentru Upload (plus)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          )
        }} 
      />
      
      {/* 3. Al treilea Tab - presupunând că ai un fișier "stylist.js" în folderul (tabs) */}
      <Tabs.Screen 
        name="stylist" 
        options={{ 
          title: 'Stylist',
          // Desenăm iconița pentru AI / Magie
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-wand-outline" size={size} color={color} />
          )
        }} 
      />

    {/* 3. Al treilea Tab - presupunând că ai un fișier "stylist.js" în folderul (tabs) */}
      <Tabs.Screen 
        name="outfits" 
        options={{ 
          title: 'Outfits',
          // Desenăm iconița pentru AI / Magie
          // Desenăm iconița pentru Dulap
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" size={size} color={color} />
          )
        }} 
      />

    </Tabs>
  );
}