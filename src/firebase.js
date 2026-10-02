import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8",
  authDomain: "controle-de-aulas-c2973.firebaseapp.com",
  projectId: "controle-de-aulas-c2973",
  storageBucket: "controle-de-aulas-c2973.firebasestorage.app",
  messagingSenderId: "662572820697",
  appId: "1:662572820697:web:d385cbbeed6a73d3cb76c8"
};

export const app = initializeApp(firebaseConfig);

// Pouca internet: o que o aluno ja abriu fica guardado no aparelho.
// Na proxima vez aparece na hora (e sem internet), e atualiza quando o sinal voltar.
// Se o navegador nao permitir guardar (ex.: aba anonima), funciona como antes.
function criarBanco() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e) {
    console.warn("Cache offline indisponivel; usando o modo normal.", e);
    return getFirestore(app);
  }
}

export const db = criarBanco();
// Login e arquivos (auth/storage) ficam em firebaseProfessor.js: so as telas do professor usam,
// e assim o aluno nao baixa essa parte.
