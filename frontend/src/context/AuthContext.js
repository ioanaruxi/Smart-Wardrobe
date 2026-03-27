// "Turnul de Radio". Locul unde ținem minte global cine este logat și unde se execută cererile de logare/delogare.
//portal: React Context API explained visually

import React, { createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

// 1. CREĂM TURNUL DE RADIO (Contextul) -portalul
export const AuthContext = createContext();

// 2. CREĂM STAȚIA DE EMISIE (Provider-ul)
// "children" reprezintă toate ecranele aplicației tale care vor fi învelite de acest context
export const AuthProvider = ({ children }) => {// am folosit AuthProvider în loc să pasăm variabilele din mână în mână
  // --- ZONA DE MEMORIE A TURNULUI ---
  const [isLoading, setIsLoading] = useState(false); // Pentru ecranul de încărcare (cât timp verifică memoria)
  const [userToken, setUserToken] = useState(null);  // Ține minte "Buletinul"
  const [userId, setUserId] = useState(null);        // Ține minte ID-ul (pentru a înlocui acel "1" scris de mână)

  // --- FUNCȚIA DE LOGARE ---
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // ATENȚIE TEHNICĂ: FastAPI cu OAuth2 așteaptă datele în format "Formular (x-www-form-urlencoded)", NU ca JSON normal!
      // Chichița FastAPI (URLSearchParams): La funcția login, nu am trimis { email, password } ca la register. De ce? Pentru că 
      // în Python ai scris Depends(OAuth2PasswordRequestForm). Acest standard de securitate internațional refuză JSON-urile și cere datele exclusiv sub formă
      // de Form-Data (cum trimit site-urile vechi). URLSearchParams transformă datele exact în acel format acceptat de Python.
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI cere câmpul 'username', dar noi îi dăm email-ul
      formData.append('password', password);

      const response = await apiClient.post('/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Dacă a mers, serverul ne-a dat Token-ul și ID-ul
      if (response.data.access_token) {
        const token = response.data.access_token;
        const id = response.data.user_id.toString();

        // 1. Salvăm pe "Hard-Disk-ul" telefonului (ca să nu ne delogăm când închidem aplicația)
       // AsyncStorage este pentru viitor (când vei deschide aplicația mâine). E lent pentru că citește fizic din telefon.
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', id);
        
        // 2. Salvăm în "Memoria RAM" a turnului radio (ca să actualizeze ecranele instant)
        // setUserToken (State) este pentru prezent (acum). Este instantaneu. React va vedea că s-a 
        // schimbat variabila și va muta imediat utilizatorul de pe ecranul de Login pe ecranul cu Dulapul.
        setUserToken(token);
        setUserId(id);
      }
    } catch (error) {
      console.error("Eroare la logare:", error);
      throw error; // Aruncăm eroarea mai departe ca s-o prindem în ecranul de Login și să arătăm o alertă
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCȚIA DE ÎNREGISTRARE ---
  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      // Aici e o rută normală (nu OAuth2), deci trimitem JSON simplu, cum e Schema ta Pydantic
      await apiClient.post('/auth/register', {
        username: username,
        email: email,
        password: password
      });
      // Dacă a mers, nu setăm token-ul, ci îl punem pe utilizator să se logheze cu noile date
    } catch (error) {
      console.error("Eroare la înregistrare:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCȚIA DE DELOGARE ---
  const logout = async () => {
    setIsLoading(true);
    // Ștergem din RAM
    setUserToken(null);
    setUserId(null);
    // Ștergem de pe Hard-Disk
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    setIsLoading(false);
  };

  // --- VERIFICAREA INIȚIALĂ ---
  // Se execută o singură dată când deschizi aplicația pe telefon
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let id = await AsyncStorage.getItem('userId');
      
      if (token) {
        setUserToken(token);
        setUserId(id);
      }
    } catch (e) {
      console.log(`Eroare la citirea din memorie: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect (Auto-Logarea): Când pornești aplicația, ea e tehnic "delogată" pentru o fracțiune de secundă. 
  // Funcția isLoggedIn se duce în seiful telefonului, găsește token-ul de ieri, îl pune în RAM (setUserToken) și, BAM, 
  // te aruncă direct în dulap fără să mai ceară parola.
  useEffect(() => {
    isLoggedIn();
  }, []);

  // --- CE EMITE TURNUL DE RADIO? ---
  // context provider
  // Orice funcție de mai jos va putea fi "auzită" și folosită din orice ecran al aplicației
  // Aici punem itemurile pe care le pot accesa prin value
  // Iar {children} reprezintă restul aplicației care va avea acces la portal
  return (
    <AuthContext.Provider value={{ login, logout, register, isLoading, userToken, userId }}> 
      {children} 
    </AuthContext.Provider>
  );
};