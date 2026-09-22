import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { Complaint, UserProfile, UserRole } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

// Initialize Firebase app and services
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId for custom provisioned databases
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Standard Firestore Error Handler mandated by Firebase Integration Skill
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
): never {
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
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline. Verify network connection and configuration.');
    }
    return false;
  }
}

// Google Sign-In with Popup
export async function signInWithGooglePopup(preferredRole: UserRole = 'citizen'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const userProfile: UserProfile = {
      id: fbUser.uid,
      full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Citizen',
      email: fbUser.email || '',
      role: preferredRole,
      phone_number: fbUser.phoneNumber || undefined,
      avatar_url: fbUser.photoURL || undefined,
      assigned_ward: preferredRole === 'authority' ? 'Ward 112 - Domlur' : undefined,
      department: preferredRole === 'authority' ? 'Public Works & Urban Roads (PWD)' : undefined,
      created_at: new Date().toISOString(),
    };

    // Check if user already exists in Firestore to preserve existing role
    try {
      const existingDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (existingDoc.exists()) {
        const data = existingDoc.data();
        if (data.role) userProfile.role = data.role as UserRole;
        if (data.department) userProfile.department = data.department;
        if (data.assigned_ward) userProfile.assigned_ward = data.assigned_ward;
      }
    } catch {
      // Continue with new profile
    }

    // Persist profile to Firestore
    await saveUserProfileToFirestore(userProfile);

    return userProfile;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Sign out from Firebase
export async function firebaseLogout(): Promise<void> {
  await firebaseSignOut(auth);
}

// Persist User Profile
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    await setDoc(
      doc(db, 'users', profile.id),
      {
        uid: profile.id,
        email: profile.email,
        displayName: profile.full_name,
        photoURL: profile.avatar_url || null,
        role: profile.role,
        phoneNumber: profile.phone_number || null,
        department: profile.department || null,
        assignedWard: profile.assigned_ward || null,
        updatedAt: new Date().toISOString(),
        createdAt: profile.created_at || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch User Profile
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: data.uid,
      full_name: data.displayName || data.email,
      email: data.email,
      role: data.role as UserRole,
      phone_number: data.phoneNumber || undefined,
      avatar_url: data.photoURL || undefined,
      assigned_ward: data.assignedWard || undefined,
      department: data.department || undefined,
      created_at: data.createdAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Save Complaint to Firestore
export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  const path = `complaints/${complaint.id}`;
  try {
    await setDoc(
      doc(db, 'complaints', complaint.id),
      {
        id: complaint.id,
        description: complaint.description,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        location_text: complaint.location_text || '',
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        user_id: complaint.user_id || auth.currentUser?.uid || 'anonymous',
        user_name: complaint.user_name || 'Citizen',
        user_email: complaint.user_email || '',
        ward_id: complaint.ward_id || 'ward-112',
        assigned_to_department: complaint.assigned_to_department || 'Roads & Infrastructure',
        image_url: complaint.image_url || null,
        created_at: complaint.created_at || new Date().toISOString(),
        updated_at: complaint.updated_at || new Date().toISOString(),
        resolution_notes: complaint.resolution_notes || null,
        sla_hours: complaint.sla_hours || 48,
        escalation_level: complaint.escalation_level || 0,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-time listener for public / user complaints
export function subscribeToComplaints(
  onUpdate: (complaints: Partial<Complaint>[]) => void,
  userId?: string
): Unsubscribe {
  const path = 'complaints';
  try {
    const q = userId
      ? query(collection(db, path), where('user_id', '==', userId))
      : collection(db, path);

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Partial<Complaint>[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.id,
            description: d.description,
            category: d.category,
            priority: d.priority,
            status: d.status,
            location_text: d.location_text,
            latitude: d.latitude,
            longitude: d.longitude,
            user_id: d.user_id,
            user_name: d.user_name,
            user_email: d.user_email,
            ward_id: d.ward_id,
            assigned_to_department: d.assigned_to_department,
            image_url: d.image_url,
            created_at: d.created_at,
            updated_at: d.updated_at,
            resolution_notes: d.resolution_notes,
            sla_hours: d.sla_hours,
            escalation_level: d.escalation_level,
          });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// User Bookmarked Complaints
export async function bookmarkComplaintInFirestore(
  userId: string,
  complaint: { id: string; title: string; category: string }
): Promise<void> {
  const path = `users/${userId}/savedComplaints/${complaint.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'savedComplaints', complaint.id), {
      id: complaint.id,
      complaintId: complaint.id,
      title: complaint.title,
      category: complaint.category,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
