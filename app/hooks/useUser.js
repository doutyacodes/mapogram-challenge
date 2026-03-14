'use client';

import { useEffect, useState } from 'react';

export const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not authenticated');

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.log('Not logged in');
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  return user;
};
