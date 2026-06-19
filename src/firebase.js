import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs, deleteDoc } from 'firebase/firestore';
import {
  addLocalTypingReport,
  deleteLocalTypingReport,
  getLocalTypingReports,
  isLocalTypingReportId,
  mergeTypingReports,
  updateLocalTypingReport,
} from './utils/typingReportStorage';

const firebaseConfig = {
  projectId: "game-86071",
  appId: "1:1442050997:web:f552405c41e8e991e51ffc",
  storageBucket: "game-86071.firebasestorage.app",
  apiKey: "AIzaSyCRJ9rTd3Ss3QxczGc1R0rwUJXccGSLMco",
  authDomain: "game-86071.firebaseapp.com",
  messagingSenderId: "1442050997",
  measurementId: "G-RLYCHPSV8M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// クラウド（Firestore）にデータを保存・更新する関数
// accountId: 8桁のアカウントコード等
// data: { playerName, globalPoints, games: { kidsTyping: { ... } } }
export const saveCloudData = async (accountId, data) => {
  if (!accountId) return;
  try {
    const userRef = doc(db, 'users', accountId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving cloud data:", error);
  }
};

// クラウドからデータを取得する関数
export const loadCloudData = async (accountId) => {
  if (!accountId) return null;
  try {
    const userRef = doc(db, 'users', accountId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error loading cloud data:", error);
    return null;
  }
};

// デバイス間の一括移行（マスターコード）のための関数
export const saveDeviceTransfer = async (masterCode, playerIds) => {
  if (!masterCode) return;
  try {
    const docRef = doc(db, 'deviceTransfers', masterCode);
    await setDoc(docRef, { playerIds, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error saving device transfer:", error);
  }
};

export const loadDeviceTransfer = async (masterCode) => {
  if (!masterCode) return null;
  try {
    const docRef = doc(db, 'deviceTransfers', masterCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().playerIds || [];
    }
    return null;
  } catch (error) {
    console.error("Error loading device transfer:", error);
    return null;
  }
};

// --- 全データの一括バックアップ（マスターセーブ） ---
export const saveFullBackup = async (masterCode, fullData) => {
  if (!masterCode) return false;
  try {
    const docRef = doc(db, 'deviceBackups', masterCode);
    await setDoc(docRef, { 
      data: fullData, 
      createdAt: new Date().toISOString() 
    });
    return true;
  } catch (error) {
    console.error("Error saving full backup:", error);
    return false;
  }
};

export const loadFullBackup = async (masterCode) => {
  if (!masterCode) return null;
  try {
    const docRef = doc(db, 'deviceBackups', masterCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data || null;
    }
    return null;
  } catch (error) {
    console.error("Error loading full backup:", error);
    return null;
  }
};

export const saveCloudPlayer = async (playerId, playerData) => {
  if (!playerId) return false;
  try {
    const docRef = doc(db, 'global_players', playerId);
    
    // Firestore は undefined を許容しないため、JSON経由で削除する
    const cleanData = JSON.parse(JSON.stringify(playerData));
    
    await setDoc(docRef, {
      ...cleanData,
      isCloudSync: true,
      lastUpdatedAt: new Date().toISOString()
    }, { merge: true });

    // 同時に共通の shared_profiles コレクションにも保存する
    const profileRef = doc(db, 'shared_profiles', playerId);
    const profileData = {
      currentIcon: cleanData.currentIcon || null,
      currentTitle: cleanData.currentTitle || 'rookie',
      unlockedIcons: cleanData.collection ? Object.keys(cleanData.collection) : ['default'],
      unlockedTitles: cleanData.achievements || ['rookie'],
      lastUpdatedAt: new Date().toISOString()
    };
    if (cleanData.name) {
      profileData.name = cleanData.name;
    }
    await setDoc(profileRef, profileData, { merge: true });

    return true;
  } catch (error) {
    return false;
  }
};

export const setPlayerArchived = async (playerId, isArchived) => {
  if (!playerId) return false;
  try {
    const docRef = doc(db, 'global_players', playerId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    await setDoc(
      docRef,
      {
        isArchived: isArchived === true,
        lastUpdatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error('Error setting player archived:', error);
    return false;
  }
};

// 単一プレイヤーのデータをクラウドからロードする関数
export const loadSingleCloudPlayer = async (playerId) => {
  if (!playerId) return null;
  try {
    const docRef = doc(db, 'global_players', playerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error loading single cloud player:", error);
    return null;
  }
};

export const deleteCloudPlayer = async (playerId) => {
  if (!playerId) return false;
  try {
    const docRef = doc(db, 'global_players', playerId);
    await deleteDoc(docRef);
    const profileRef = doc(db, 'shared_profiles', playerId);
    await deleteDoc(profileRef);
    return true;
  } catch (error) {
    console.error("Error deleting cloud player:", error);
    return false;
  }
};

export const loadAllCloudPlayers = async () => {
  try {
    const collRef = collection(db, 'global_players');
    const snapshot = await getDocs(collRef);
    const playersMap = {};
    snapshot.forEach(doc => {
      playersMap[doc.id] = doc.data();
    });
    return playersMap;
  } catch (error) {
    console.error("Error loading all cloud players:", error);
    return null;
  }
};

export const listenToAllCloudPlayers = (onUpdate) => {
  try {
    const collRef = collection(db, 'global_players');
    return onSnapshot(collRef, (snapshot) => {
      const playersMap = {};
      snapshot.forEach(doc => {
        playersMap[doc.id] = doc.data();
      });
      onUpdate(playersMap);
    }, (error) => {
      console.error("Error listening to cloud players:", error);
    });
  } catch (error) {
    console.error("Error setting up cloud listener:", error);
    return () => {};
  }
};

// --- 複数ゲーム間で共有する共通プロフィール（名前、アイコン、称号）の保存・読込 ---
export const saveSharedProfile = async (playerId, profileData) => {
  if (!playerId) return false;
  try {
    const docRef = doc(db, 'shared_profiles', playerId);
    const cleanData = JSON.parse(JSON.stringify(profileData));
    await setDoc(docRef, {
      ...cleanData,
      lastUpdatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving shared profile:", error);
    return false;
  }
};

export const loadSharedProfile = async (playerId) => {
  if (!playerId) return null;
  try {
    const docRef = doc(db, 'shared_profiles', playerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error loading shared profile:", error);
    return null;
  }
};

// --- ワードリクエストの保存・取得・削除 ---
export const addWordRequest = async (requestData) => {
  try {
    const newDocRef = doc(collection(db, 'word_requests'));
    await setDoc(newDocRef, {
      ...requestData,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error adding word request:", error);
    return false;
  }
};

export const getWordRequests = async () => {
  try {
    const collRef = collection(db, 'word_requests');
    const snapshot = await getDocs(collRef);
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    // 作成日時でソート（古い順）
    requests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return requests;
  } catch (error) {
    console.error("Error getting word requests:", error);
    return [];
  }
};

export const deleteWordRequest = async (requestId) => {
  if (!requestId) return false;
  try {
    const docRef = doc(db, 'word_requests', requestId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting word request:", error);
    return false;
  }
};

// --- 採用されたワードの保存・取得・削除 ---
export const addAdoptedWord = async (wordData) => {
  try {
    const newDocRef = doc(collection(db, 'adopted_words'));
    await setDoc(newDocRef, {
      ...wordData,
      adoptedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error adding adopted word:", error);
    return false;
  }
};

export const getAdoptedWords = async () => {
  try {
    const collRef = collection(db, 'adopted_words');
    const snapshot = await getDocs(collRef);
    const words = [];
    snapshot.forEach(doc => {
      words.push({ id: doc.id, ...doc.data() });
    });
    return words;
  } catch (error) {
    console.error("Error getting adopted words:", error);
    return [];
  }
};

export const deleteAdoptedWord = async (wordId) => {
  if (!wordId) return false;
  try {
    const docRef = doc(db, 'adopted_words', wordId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting adopted word:", error);
    return false;
  }
};

// 特定のプレイヤー宛てにプレゼントを登録する関数
export const sendGiftToCloudPlayer = async (playerId, giftData) => {
  if (!playerId) return false;
  try {
    const docRef = doc(db, 'global_players', playerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      const pendingGifts = Array.isArray(cloudData.pendingGifts) ? cloudData.pendingGifts : [];
      
      const newGift = {
        id: 'gift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...giftData,
        createdAt: new Date().toISOString()
      };
      
      pendingGifts.push(newGift);
      
      // JSONクリーンアップ（undefined対策）
      const cleanGifts = JSON.parse(JSON.stringify(pendingGifts));
      
      await setDoc(docRef, {
        ...cloudData,
        pendingGifts: cleanGifts,
        lastUpdatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending gift to cloud player:", error);
    return false;
  }
};

// --- タイピング問題報告 ---
export const submitTypingReport = async (reportData) => {
  const createdAt = new Date().toISOString();
  const entry = {
    ...reportData,
    status: 'open',
    createdAt,
  };

  try {
    const newDocRef = doc(collection(db, 'typing_reports'));
    await setDoc(newDocRef, entry);
    await addLocalTypingReport({ id: newDocRef.id, ...entry });
    return newDocRef.id;
  } catch (error) {
    console.error('Error submitting typing report:', error);
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await addLocalTypingReport({ id: localId, ...entry, savedLocally: true });
    return localId;
  }
};

export const getTypingReports = async () => {
  let cloudReports = [];
  let cloudError = null;

  try {
    const collRef = collection(db, 'typing_reports');
    const snapshot = await getDocs(collRef);
    snapshot.forEach((docSnap) => {
      cloudReports.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (error) {
    cloudError = error;
    console.error('Error getting typing reports:', error);
  }

  const localReports = await getLocalTypingReports();
  const reports = mergeTypingReports(cloudReports, localReports);

  return {
    reports,
    cloudError,
    hasCloudAccess: !cloudError,
  };
};

export const updateTypingReport = async (reportId, data) => {
  if (!reportId) return false;

  if (isLocalTypingReportId(reportId)) {
    return updateLocalTypingReport(reportId, data);
  }

  try {
    const docRef = doc(db, 'typing_reports', reportId);
    await setDoc(docRef, data, { merge: true });
    await updateLocalTypingReport(reportId, data);
    return true;
  } catch (error) {
    console.error('Error updating typing report:', error);
    return updateLocalTypingReport(reportId, data);
  }
};

export const deleteTypingReport = async (reportId) => {
  if (!reportId) return false;

  if (isLocalTypingReportId(reportId)) {
    return deleteLocalTypingReport(reportId);
  }

  try {
    const docRef = doc(db, 'typing_reports', reportId);
    await deleteDoc(docRef);
    await deleteLocalTypingReport(reportId);
    return true;
  } catch (error) {
    console.error('Error deleting typing report:', error);
    return deleteLocalTypingReport(reportId);
  }
};

// --- ワード修正（管理者が保存した訂正） ---
export const saveWordCorrection = async (correctionData) => {
  try {
    const newDocRef = doc(collection(db, 'word_corrections'));
    await setDoc(newDocRef, {
      ...correctionData,
      updatedAt: new Date().toISOString(),
    });
    return newDocRef.id;
  } catch (error) {
    console.error('Error saving word correction:', error);
    return null;
  }
};

export const getWordCorrections = async () => {
  try {
    const collRef = collection(db, 'word_corrections');
    const snapshot = await getDocs(collRef);
    const corrections = [];
    snapshot.forEach((docSnap) => {
      corrections.push({ id: docSnap.id, ...docSnap.data() });
    });
    return corrections;
  } catch (error) {
    console.error('Error getting word corrections:', error);
    return [];
  }
};

export const deleteWordCorrection = async (correctionId) => {
  if (!correctionId) return false;
  try {
    const docRef = doc(db, 'word_corrections', correctionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting word correction:', error);
    return false;
  }
};

export const cancelGiftFromCloudPlayer = async (playerId, giftId) => {
  if (!playerId || !giftId) return false;
  try {
    const docRef = doc(db, 'global_players', playerId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const cloudData = docSnap.data();
    const pendingGifts = Array.isArray(cloudData.pendingGifts)
      ? cloudData.pendingGifts.filter((g) => g.id !== giftId)
      : [];
    await setDoc(
      docRef,
      {
        ...cloudData,
        pendingGifts,
        lastUpdatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error('Error canceling gift:', error);
    return false;
  }
};

export { db };
