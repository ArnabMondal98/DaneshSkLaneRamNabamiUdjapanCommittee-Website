'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track previous docRef to prevent duplicate subscriptions
  const prevDocRefRef = useRef<DocumentReference<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // If no docRef, clear data and stop loading
    if (!docRef) {
      if (isMountedRef.current) {
        setData(null);
        setLoading(false);
      }
      return;
    }

    // Check if docRef actually changed (prevent duplicate subscriptions)
    if (prevDocRefRef.current === docRef) {
      return;
    }

    prevDocRefRef.current = docRef;

    // Cleanup previous subscription if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Set loading state
    if (isMountedRef.current) {
      setLoading(true);
    }

    // Create new subscription
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        if (!isMountedRef.current) return;

        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
        setError(null);
      },
      async (serverError: FirestoreError) => {
        if (!isMountedRef.current) return;

        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(serverError);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup on unmount or docRef change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      unsubscribeRef.current = null;
      prevDocRefRef.current = null;
    };
  }, [docRef]);

  return { data, loading, error };
}
