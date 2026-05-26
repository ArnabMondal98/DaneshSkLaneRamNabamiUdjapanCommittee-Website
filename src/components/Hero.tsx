"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-2 md:gap-3">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hrs', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds },
      ].map((unit) => (
        <div key={unit.label} className="flex flex-col items-center bg-primary/20 backdrop-blur-sm border border-primary/30 rounded px-2 py-1 min-w-[45px]">
          <span className="text-sm font-black text-white leading-none">{unit.value}</span>
          <span className="text-[7px] uppercase font-bold text-white/70 mt-0.5">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Hero() {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const [heroBackground, setHeroBackground] = useState('/assets/homepage-background.jpg');
  const [logo, setLogo] = useState('/assets/logo.jpg');

  // Fetch homepage settings from Firestore
  const homepageSettingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'settings'), where('type', '==', 'homepage'), limit(1));
  }, [db]);

  const { data: settings } = useCollection(homepageSettingsQuery);

  useEffect(() => {
    if (settings && settings[0]) {
      if (settings[0].backgroundImage) setHeroBackground(settings[0].backgroundImage);
      if (settings[0].logo) setLogo(settings[0].logo);
    }
  }, [settings]);

  const featuredEventQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('isUpcoming', '==', true),
      orderBy('date', 'asc'),
      limit(1)
    );
  }, [db]);

  const { data: featuredEvents } = useCollection(featuredEventQuery);
  const featuredEvent = featuredEvents?.[0];

  return (
    <div className="relative w-full">
      <section className="relative min-h-[85vh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#1E1E1E]">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBackground}
            alt="Hero Background"
            fill
            className="object-cover opacity-60 animate-zoom-in"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center">
          <div className="space-y-6 animate-fade-in">
            {logo && (
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <Image
                    src={logo}
                    alt="Committee Logo"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            )}
            <span className="text-sm md:text-base font-bold text-primary uppercase tracking-[0.4em] block">
              Danesh Sheikh Lane
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-headline font-black text-white leading-tight uppercase tracking-tight max-w-4xl mx-auto">
              Ram Nabami <br className="hidden md:block" /> Ujapan Committee
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-white/80 font-body tracking-widest uppercase font-medium">
              Community Development, Public Service & Social Activities
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <Link href="#works">
                <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-none transition-transform hover:scale-105">
                  {t('nav_works')}
                </Button>
              </Link>
              <Link href="#news">
                <Button variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-none transition-transform hover:scale-105">
                  {t('nav_news')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featuredEvent && (
        <div className="relative z-20 -mt-16 max-w-6xl mx-auto px-6 animate-fade-in [animation-delay:400ms]">
          <div className="bg-[#1E1E1E] border border-white/10 shadow-2xl overflow-hidden glass-morphism">
            <div className="flex flex-col lg:flex-row items-stretch">
              <div className="bg-primary p-6 flex flex-col justify-center items-center text-center lg:w-48 shrink-0">
                <Badge className="bg-white/20 text-white mb-2 uppercase text-[8px] font-black tracking-widest border-none">LIVE BANNER</Badge>
                <span className="text-white font-black text-xl leading-none">
                  {new Date(featuredEvent.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="space-y-2 flex-1 text-left">
                  <h3 className="text-lg md:text-xl font-headline font-bold text-white bn-font">
                    {language === 'bn' ? featuredEvent.title_bn : (featuredEvent.title_en || featuredEvent.title_bn)}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-primary" /> {featuredEvent.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-primary" /> {featuredEvent.time}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> {language === 'bn' ? featuredEvent.location_bn : (featuredEvent.location_en || featuredEvent.location_bn)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                  <CountdownTimer targetDate={featuredEvent.date} />
                  <Link href="#events">
                    <Button size="sm" variant="ghost" className="text-[9px] font-black uppercase text-primary tracking-widest p-0 h-auto hover:bg-transparent hover:text-white group">
                      READ MORE <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}