// "Macazul". Primul fișier pe care îl citește telefonul și care te aruncă fie spre Login, fie spre Dulap, 
// folosind <Redirect>.

// Expo Router și "Race Conditions" 
// Concept: React Native folosea înainte React Navigation (unde scriai tu de mână un fișier cu toate rutele). 
// Expo Router folosește File-based Routing (navigare bazată pe foldere). Numele folderului este ruta.
// Eroarea de Race Condition: Am învățat că Expo desenează <Stack>-ul (arhitectura) foarte rapid. Când noi încercam 
// să mutăm utilizatorul cu router.replace în timp ce arhitectura se construia, dădea crash. Soluția supremă a fost să 
// folosim abordarea pură React: un ecran index.tsx care folosește <Redirect />, mutând utilizatorul elegant și sigur.

import { useContext, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect} from 'expo-router';
import { AuthContext } from '../src/context/AuthContext';

export default function Index() {
  // Se numește Object Destructuring (Destructurarea obiectelor) în JavaScript.
  // Contextul nostru (AuthContext) returnează un obiect mare care conține multe lucruri: { login, logout, register, 
  // userToken, isLoading, userId }

  // noi "extragem" doar cele două variabile de care avem nevoie din acel obiect mare, pentru a scrie cod mai curat și mai scurt.
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  // Aici e magia! <Redirect /> mută utilizatorul în siguranță, FĂRĂ să strice Stack-ul
  // E logat? Nu. Atunci dă-i Redirect către /login
  if (userToken) {
    return <Redirect href="/(tabs)" />;
  } else {
    // Dacă ar fi fost logat, te-ar fi trimis la app/(tabs)/_layout.tsx, care la rândul lui deschidea app/(tabs)/index.tsx
    return <Redirect href="/login" />;
  }
}