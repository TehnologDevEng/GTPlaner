import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const isInsideIframe = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
};

export const getAuthErrorMessage = (error: unknown): { title: string; message: string; code?: string; isIframe?: boolean } => {
  const isIframe = isInsideIframe();
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const rawMessage = err?.message || String(error);

  console.warn('Firebase Auth Diagnostic:', { code, rawMessage, isIframe, hostname: window.location.hostname });

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Всплывающее окно заблокировано',
      message: isIframe
        ? 'Окно предпросмотра (iframe) блокирует всплывающие окна авторизации Google. Откройте приложение в отдельной вкладке — там вход работает без ограничений.'
        : 'Ваш браузер заблокировал всплывающее окно Google. Разрешите всплывающие окна или воспользуйтесь режимом прямого перехода (Redirect).',
      code,
      isIframe,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      title: 'Окно закрыто',
      message: 'Окно авторизации Google было закрыто до подтверждения входа.',
      code,
    };
  }

  if (code === 'auth/unauthorized-domain') {
    const domain = window.location.hostname;
    return {
      title: 'Домен не авторизован в Firebase',
      message: `Домен "${domain}" не добавлен в список доверенных доменов Firebase Auth. Откройте приложение по основному адресу или добавьте ${domain} в Firebase Console → Authentication → Settings → Authorized domains.`,
      code,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Провайдер Google отключен',
      message: 'Вход через Google не активирован в консоли Firebase Authentication. Включите Google в разделе Authentication → Sign-in method.',
      code,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      title: 'Ошибка сети',
      message: 'Не удалось связаться с серверами Google. Проверьте интернет-соединение или настройки VPN/блокировщиков рекламы.',
      code,
    };
  }

  // Generic fallback with helpful guidance
  return {
    title: 'Не удалось войти через Google',
    message: isIframe
      ? `В окне предпросмотра (iframe) браузер может блокировать сторонние cookie и окна авторизации. Откройте приложение в отдельной вкладке.`
      : (rawMessage || 'Произошла ошибка при авторизации.'),
    code: code || undefined,
    isIframe,
  };
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Google Sign-In Popup error:', error);
    throw error;
  }
};

export const loginWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: unknown) {
    console.error('Google Sign-In Redirect error:', error);
    throw error;
  }
};

export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Redirect result error:', error);
    return null;
  }
};

export const loginWithCredentialToken = async (idToken: string): Promise<User> => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
};

export const logout = async () => {
  return await firebaseSignOut(auth);
};

export { 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch, 
  serverTimestamp 
};
export type { User };
