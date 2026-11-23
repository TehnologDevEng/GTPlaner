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
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SyncDiagnosticsResult } from '@/types';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const FIREBASE_META = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Startup Firestore connection check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: the client is offline.');
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

// Live end-to-end sync diagnostic probe (writes, reads from server, and cleans up)
export async function runSyncDiagnostic(userId: string): Promise<SyncDiagnosticsResult> {
  const start = performance.now();
  const probePath = `users/${userId}/settings/sync_probe`;
  const probeRef = doc(db, 'users', userId, 'settings', 'sync_probe');
  const marker = new Date().toISOString().slice(0, 19);

  try {
    await setDoc(probeRef, {
      ownerId: userId,
      lastRolloverDate: marker,
      updatedAt: serverTimestamp(),
    });
    const serverSnap = await getDocFromServer(probeRef);
    const verified = serverSnap.exists() && serverSnap.data()?.lastRolloverDate === marker;
    await deleteDoc(probeRef).catch(() => {});

    const latencyMs = Math.max(1, Math.round(performance.now() - start));
    return {
      ok: verified,
      latencyMs,
      databaseId: FIREBASE_META.databaseId,
      projectId: FIREBASE_META.projectId,
      checkedAt: new Date().toISOString(),
      error: verified ? undefined : 'Сервер не вернул подтверждение записи.',
    };
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.WRITE, probePath);
    const latencyMs = Math.max(1, Math.round(performance.now() - start));
    return {
      ok: false,
      latencyMs,
      databaseId: FIREBASE_META.databaseId,
      projectId: FIREBASE_META.projectId,
      checkedAt: new Date().toISOString(),
      error: info.error,
    };
  }
}

export const isInsideIframe = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
};

export const getFirebaseConsoleUrl = (): string => {
  return `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
};

export const getAuthErrorMessage = (error: unknown): {
  title: string;
  message: string;
  code?: string;
  isIframe?: boolean;
  domain?: string;
  consoleUrl?: string;
} => {
  const isIframe = isInsideIframe();
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const rawMessage = err?.message || String(error);
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  console.warn('Firebase Auth Diagnostic:', { code, rawMessage, isIframe, hostname: domain });

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Всплывающее окно заблокировано',
      message: isIframe
        ? 'Окно предпросмотра (iframe) блокирует всплывающие окна авторизации Google. Откройте приложение в отдельной вкладке — там вход работает без ограничений.'
        : 'Ваш браузер заблокировал всплывающее окно Google. Разрешите всплывающие окна для этого сайта в настройках браузера и попробуйте снова.',
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
    return {
      title: 'Домен не авторизован в Firebase',
      message: `Домен "${domain}" не добавлен в список доверенных доменов Firebase Auth. Чтобы авторизация Google заработала на ${domain}, добавьте его в список Authorized domains в консоли Firebase.`,
      code,
      domain,
      consoleUrl: getFirebaseConsoleUrl(),
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

  return {
    title: 'Не удалось войти через Google',
    message: isIframe
      ? 'В окне предпросмотра (iframe) браузер может блокировать сторонние cookie и окна авторизации. Откройте приложение в отдельной вкладке.'
      : rawMessage || 'Произошла ошибка при авторизации.',
    code: code || undefined,
    isIframe,
  };
};

export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const loginWithGoogleRedirect = async (): Promise<void> => {
  await signInWithRedirect(auth, googleProvider);
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
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
};
export type { User };
