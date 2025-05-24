# Firebase API Reference

## Overview

Firebase is Google's comprehensive app development platform that provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users, store data, and more.

## Core Services for Learnim

### 1. Firebase Authentication
### 2. Cloud Firestore (Database)
### 3. Firebase Storage (File Storage)
### 4. Firebase Admin SDK (Backend)

---

## Firebase Authentication

### Installation

```bash
npm install firebase
```

### Initialization (Frontend)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
```

### Google Sign-In (Popup)

```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Get Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    return { user, token };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
```

### Google Sign-In (Redirect)

```javascript
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

// Initiate redirect
const signInWithGoogleRedirect = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  await signInWithRedirect(auth, provider);
};

// Handle redirect result (call on app initialization)
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      return { user, token };
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
  }
};
```

### Authentication State Management

```typescript
import { onAuthStateChanged, User } from 'firebase/auth';

// Listen for authentication state changes
const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    // User is signed in
    console.log('User signed in:', user.uid);
  } else {
    // User is signed out
    console.log('User signed out');
  }
});

// Clean up listener
// unsubscribe();
```

### Sign Out

```javascript
import { signOut } from 'firebase/auth';

const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

---

## Cloud Firestore

### Initialization

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Document Operations

#### Create/Set Document

```typescript
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

// Set document with specific ID
const createVideo = async (videoData: any) => {
  try {
    await setDoc(doc(db, 'videos', videoData.id), {
      ...videoData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating video:', error);
  }
};

// Add document with auto-generated ID
const addVideo = async (videoData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'videos'), {
      ...videoData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding video:', error);
  }
};
```

#### Read Documents

```typescript
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Get single document
const getVideo = async (videoId: string) => {
  try {
    const docRef = doc(db, 'videos', videoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting video:', error);
  }
};

// Get user's videos
const getUserVideos = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return videos;
  } catch (error) {
    console.error('Error getting user videos:', error);
  }
};
```

#### Update Document

```typescript
import { doc, updateDoc } from 'firebase/firestore';

const updateVideoStatus = async (videoId: string, status: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      status: status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating video:', error);
  }
};
```

#### Delete Document

```typescript
import { doc, deleteDoc } from 'firebase/firestore';

const deleteVideo = async (videoId: string) => {
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (error) {
    console.error('Error deleting video:', error);
  }
};
```

### Real-time Listeners

```typescript
import { doc, onSnapshot } from 'firebase/firestore';

// Listen to document changes
const listenToVideo = (videoId: string, callback: (data: any) => void) => {
  const unsubscribe = onSnapshot(doc(db, 'videos', videoId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
  
  return unsubscribe; // Call this to stop listening
};

// Listen to collection changes
const listenToUserVideos = (userId: string, callback: (videos: any[]) => void) => {
  const q = query(
    collection(db, 'videos'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(videos);
  });
  
  return unsubscribe;
};
```

---

## Firebase Storage

### Initialization

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

### Upload Files

```typescript
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Simple upload
const uploadVideo = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

// Resumable upload with progress tracking
const uploadVideoWithProgress = (
  file: File, 
  path: string, 
  onProgress: (progress: number) => void
) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
```

### Download Files

```typescript
import { ref, getDownloadURL } from 'firebase/storage';

const getVideoURL = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};
```

### Delete Files

```typescript
import { ref, deleteObject } from 'firebase/storage';

const deleteVideo = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};
```

---

## Firebase Admin SDK (Backend)

### Installation

```bash
pip install firebase-admin
```

### Initialization (Python)

```python
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage

# Initialize with service account
cred = credentials.Certificate('path/to/serviceAccountKey.json')

# Or initialize with environment variables
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
    "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": os.environ.get("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
    "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
})

firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-project.appspot.com'
})

# Get services
db = firestore.client()
bucket = storage.bucket()
```

### Token Verification

```python
from firebase_admin import auth

def verify_token(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        return decoded_token
    except Exception as e:
        print(f'Error verifying token: {e}')
        return None

# FastAPI middleware example
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_current_user(token: str = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Firestore Operations (Admin)

```python
from firebase_admin import firestore
from datetime import datetime

db = firestore.client()

# Create document
def create_video_record(video_data):
    try:
        doc_ref = db.collection('videos').document()
        video_data.update({
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        })
        doc_ref.set(video_data)
        return doc_ref.id
    except Exception as e:
        print(f'Error creating video record: {e}')
        return None

# Get user videos
def get_user_videos(user_id):
    try:
        videos_ref = db.collection('videos')
        query = videos_ref.where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING)
        docs = query.stream()
        
        videos = []
        for doc in docs:
            video_data = doc.to_dict()
            video_data['id'] = doc.id
            videos.append(video_data)
        
        return videos
    except Exception as e:
        print(f'Error getting user videos: {e}')
        return []

# Update document
def update_video_status(video_id, status):
    try:
        doc_ref = db.collection('videos').document(video_id)
        doc_ref.update({
            'status': status,
            'updatedAt': datetime.utcnow()
        })
        return True
    except Exception as e:
        print(f'Error updating video status: {e}')
        return False
```

### Storage Operations (Admin)

```python
from firebase_admin import storage
import os

bucket = storage.bucket()

# Upload file
def upload_video_to_storage(local_file_path, storage_path):
    try:
        blob = bucket.blob(storage_path)
        blob.upload_from_filename(local_file_path)
        
        # Make the blob publicly readable (optional)
        blob.make_public()
        
        return blob.public_url
    except Exception as e:
        print(f'Error uploading to storage: {e}')
        return None

# Generate signed URL
def generate_signed_url(storage_path, expiration_minutes=60):
    try:
        blob = bucket.blob(storage_path)
        url = blob.generate_signed_url(
            expiration=datetime.utcnow() + timedelta(minutes=expiration_minutes),
            method='GET'
        )
        return url
    except Exception as e:
        print(f'Error generating signed URL: {e}')
        return None

# Delete file
def delete_video_from_storage(storage_path):
    try:
        blob = bucket.blob(storage_path)
        blob.delete()
        return True
    except Exception as e:
        print(f'Error deleting from storage: {e}')
        return False
```

---

## Data Models for Learnim

### Video Document Schema

```typescript
interface VideoDocument {
  id: string;
  userId: string;
  topic: string;
  status: 'pending' | 'generating' | 'rendering' | 'completed' | 'failed';
  manimScript?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    model: string;
    renderTime?: number;
    fileSize?: number;
  };
}
```

### User Document Schema

```typescript
interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  videoCount: number;
  subscription?: {
    plan: 'free' | 'pro';
    videosRemaining?: number;
  };
}
```

---

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own videos
    match /videos/{videoId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own videos
    match /videos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)

```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

---

## Best Practices

1. **Always validate user authentication before database operations**
2. **Use security rules to enforce data access policies**
3. **Implement proper error handling and logging**
4. **Use transactions for atomic operations**
5. **Optimize queries with proper indexing**
6. **Implement offline support where appropriate**
7. **Monitor usage and costs**
8. **Use Cloud Functions for server-side logic when needed** 