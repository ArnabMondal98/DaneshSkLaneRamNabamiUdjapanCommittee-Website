
"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n-context';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

function Counter({ value, label, isCountdown = false }: { value: number, label: string, isCountdown?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center p-8 border-r border-white/5 last:border-r-0 group hover:bg-primary/5 transition-all duration-500">
      <div className="text-4xl md:text-6xl font-headline font-black text-white mb-2 tracking-tighter">
        {displayValue}{!isCountdown && '+'}
      </div>
      <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
        {label}
      </div>
    </div>
  );
}

export function LiveCounters() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [counts, setCounts] = useState({
    members: 0,
    events: 0,
    works: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!db) return;

      try {
        const [membersSnap, eventsSnap, worksSnap] = await Promise.all([
          getCountFromServer(collection(db, 'members')),
          getCountFromServer(collection(db, 'events')),
          getCountFromServer(collection(db, 'works'))
        ]);

        setCounts({
          members: membersSnap.data().count,
          events: eventsSnap.data().count,
          works: worksSnap.data().count
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [db]);

  return (
    <section className="relative z-20 -mt-20 max-w-7xl mx-auto px-6">
      <div className="bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl grid grid-cols-2 lg:grid-cols-4">
        <Counter value={counts.members} label={t('counter_members')} />
        <Counter value={counts.events} label={t('counter_events')} />
        <Counter value={counts.works} label={t('counter_works')} />
        <Counter value={12} label={t('counter_countdown')} isCountdown />
      </div>
    </section>
  );
}
