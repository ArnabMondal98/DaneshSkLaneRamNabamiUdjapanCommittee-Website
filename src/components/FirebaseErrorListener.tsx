'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In production, you might want a more subtle UI, but for development
      // this surfaces the rich context required to fix security rules.
      toast({
        variant: 'destructive',
        title: 'Security Rules Permission Denied',
        description: `Path: ${error.context.path} | Operation: ${error.context.operation}`,
      });
      
      // We also throw it to surface it in the Next.js error overlay during dev
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
