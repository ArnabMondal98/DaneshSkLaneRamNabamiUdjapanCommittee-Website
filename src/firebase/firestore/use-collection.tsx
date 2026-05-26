'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track previous query to prevent duplicate subscriptions
  const prevQueryRef = useRef<Query<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // If no query, clear data and stop loading
    if (!query) {
      if (isMountedRef.current) {
        setData(null);
        setLoading(false);
      }
      return;
    }

    // Check if query actually changed (prevent duplicate subscriptions)
    if (prevQueryRef.current === query) {
      return;
    }

    prevQueryRef.current = query;

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
      query,
      (snapshot: QuerySnapshot<T>) => {
        if (!isMountedRef.current) return;

        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(items);
        setLoading(false);
        setError(null);
      },
      async (serverError: FirestoreError) => {
        if (!isMountedRef.current) return;

        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._query?.path?.toString() || 'unknown/collection',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(serverError);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup on unmount or query change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      unsubscribeRef.current = null;
      prevQueryRef.current = null;
    };
  }, [query]);

  return { data, loading, error };
}
