//app\providers\identity-provider.jsx
'use client';

import { useIdentityStore } from '@/stores/activeIdentityStore';
import { useEffect } from 'react';

export default function IdentityProvider({ children }) {
  const loadInitialIdentity = useIdentityStore(state => state.loadInitialIdentity);

  useEffect(() => {
    loadInitialIdentity();
  }, [loadInitialIdentity]);

  return children;
}