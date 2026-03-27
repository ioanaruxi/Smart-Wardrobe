// (Modificat radical): Am curățat fișierul de erori de rutare și l-am lăsat doar să "învelească" aplicația 
// în AuthProvider și Stack.

// Documentare: "React Context API explained visually" (Să înțelegi de ce am folosit AuthProvider în loc să pasăm variabilele 
// din mână în mână). 

// Este prima pagină a întregii aplicații (ruta /). Când deschizi aplicația, Expo citește întâi app/_layout.tsx 
// (care construiește casa), iar apoi intră automat în app/index.tsx. De aceea, noi am pus Macazul aici (care te 
// redirecționează spre Login sau spre Tabs).

// Fundația și Turnul de Radio



//// 1. Aducem culorile și elementele de design nativ din React Navigation
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// Importăm Contextul
import { useColorScheme } from '@/hooks/use-color-scheme';

// 2. Aducem Turnul de Radio creat de noi
import { AuthProvider } from '../src/context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 4. TURNUL DE RADIO. Punându-l aici, sus de tot, absolut orice ecran 
  // din aplicație va avea semnal și va ști cine este logat.: <AuthProvider>

  // 5. STACK-ul. Este modul de navigare. "Stack" înseamnă teanc de cărți de joc.
  // Când deschizi un ecran nou, îl pune peste cel vechi. Când dai "Back", îl ia de deasupra.: <Stack>
  // Definim ecranele, dar nu le blocăm aici 

  // 6. Spunem Expo-ului: "Ascunde titlurile urâte (header) pe care le generezi automat 
  // pentru aceste ecrane, pentru că vreau să îmi fac eu propriul design". */}: <Stack.Screen name="index" options={{ headerShown: false }} />
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}