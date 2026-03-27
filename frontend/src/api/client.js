// frontend/src/api/client.js (POȘTAȘUL)
// Aici am configurat Axios ca să știe la ce adresă să bată la ușă. -- adresa laptopului meu

import axios from 'axios';
// NOU 1: Importăm memoria telefonului
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Creăm o instanță de Axios configurată cu adresa noastră de bază
// Aici folosim funcția .create() ca să construim "Instanța" (un obiect de configurare personalizat). 
// Tot ce punem între acolade se va aplica automat oricărei cereri pe care o vom face în viitor.
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Setează rădăcina link-ului. Dacă mai târziu scriem apiClient.get('/clothes'),
  //  Axios va ști automat să lipească bucățile și va trimite cererea la http://.../api/clothes
  // Acestea sunt setările Globale (Implicite) pe care noi le-am definit pentru aplicație. Prin ele, îi spunem telefonului: 
  // "De obicei, în 99% din timp, când vorbești cu Python-ul, vei trimite și vei primi texte simple formatate ca JSON".
  
  // Asta ne ajută enorm, pentru că la ecranul de Home (unde doar luăm lista de haine) sau la viitorul ecran de Login, nu trebuie să mai scriem aceste
  // reguli de fiecare dată. Instanța Axios le aplică automat.

 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000, // Dacă serverul de Python nu răspunde în 10 secunde, anulăm cererea
});

// INTERCEPTORUL: Se asigură că token-ul e lipit pe fiecare cerere
// (Modificat radical): Am adăugat Axios Interceptor (Paznicul care lipește token-ul pe orice cerere).

// De fiecare dată când un ecran de-al tău spune "Axios, adu-mi vremea!" sau "Axios, trimite poza asta!", cererea nu 
// pleacă direct pe internet. Interceptorul o pune pe pauză, ia Token-ul tău de pe hard-disk, îl lipește pe plic 
// (ca un timbru de securitate sub numele Authorization: Bearer...) și abia apoi dă drumul plicului pe internet spre Python.
// Fără el, ar trebui să lipești tu timbrul manual pe fiecare plic din fiecare ecran.


// Lui nu îi pasă ce e pe ecran. El doar se uită în hard-disk, ia acel token, și îl trimite la serverul Python ca să 
// dovedească că ești logat, altfel Python ar refuza cererile cu eroare 401 Unauthorized.

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // Ce e Authorization: Bearer? Este standardul HTTP pentru securitate. Când serverul Python (care a emis token-ul)
        // vede acest cuvânt "Bearer"
        // lipit de token, el îl ia, îl decodează cu parola lui secretă (SECRET_KEY), și zice: "Aaa, e Ioana! Și token-ul
        // încă e valabil. Las-o să șteargă haina!".
      }
    } catch (error) {
      console.error("Eroare la citirea token-ului:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient; // Face acest obiect configurat vizibil și utilizabil pentru alte fișiere din proiectul tău (cum ar fi HomeScreen.js).