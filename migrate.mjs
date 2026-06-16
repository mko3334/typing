import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "game-86071",
  appId: "1:1442050997:web:3a85e135aff35c66e51ffc",
  storageBucket: "game-86071.firebasestorage.app",
  apiKey: "AIzaSyCRJ9rTd3Ss3QxczGc1R0rwUJXccGSLMco",
  authDomain: "game-86071.firebaseapp.com",
  messagingSenderId: "1442050997",
  measurementId: "G-BMVNBNSFFE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration of global_players...");
  const collRef = collection(db, 'global_players');
  const snap = await getDocs(collRef);
  
  let migratedCount = 0;
  
  for (const document of snap.docs) {
    const data = document.data();
    const oldId = document.id;
    
    // もしドキュメントIDが 'player_' で始まっていなければ名前を使っているとみなす
    if (!oldId.startsWith('player_')) {
      // ローカルのplayerIdか、無ければ新規生成
      const newId = data.id || ('player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
      
      console.log(`Migrating: ${oldId} -> ${newId}`);
      
      // 新しいIDで保存
      await setDoc(doc(db, 'global_players', newId), data);
      
      // 古いID（名前）のドキュメントを削除
      await deleteDoc(doc(db, 'global_players', oldId));
      
      migratedCount++;
    }
  }
  
  console.log(`Migration complete. Migrated ${migratedCount} documents.`);
  process.exit(0);
}

migrate().catch(console.error);
