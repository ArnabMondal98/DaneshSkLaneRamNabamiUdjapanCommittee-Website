"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Menu, X, Languages, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const db = useFirestore();

  const settingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'settings'), where('type', '==', 'homepage'), limit(1));
  }, [db]);

  const { data: settings } = useCollection(settingsQuery);
  const logo = settings?.[0]?.logo || '/assets/logo.jpg';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'bn' : 'en');

  const navItems = [
    { label: t('nav_home'), href: '/' },
    { label: t('nav_works'), href: '/#works' },
    { label: t('nav_news'), href: '/#news' },
    { label: t('nav_members'), href: '/#members' },
    { label: t('nav_events'), href: '/#events' },
    { label: t('nav_gallery'), href: '/#gallery' },
    { label: t('nav_agenda'), href: '/#agenda' },
    { label: t('nav_contact'), href: '/#contact' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
      scrolled ? "bg-[#0F0F0F]/90 backdrop-blur-2xl border-b border-white/5 py-3 shadow-2xl" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {logo && (
            <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-all">
              <Image 
                src={logo} 
                alt="Committee Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-headline font-black text-lg md:text-xl leading-none text-primary uppercase tracking-tight group-hover:text-white transition-colors">
              {t('hero_title')}
            </span>
            <span className="text-[10px] md:text-[11px] font-bold text-white/60 uppercase tracking-[0.3em] mt-1 group-hover:text-primary transition-colors">
              {t('hero_subtitle')}
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-primary hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest"
            >
              <Languages className="w-4 h-4" />
              {t('language_switch')}
            </Button>
            <Link href="/admin">
               <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-[0.2em] h-9 px-5">
                 <ShieldCheck className="w-3.5 h-3.5 mr-2" /> {t('nav_admin')}
               </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-primary p-2">
            <Languages className="w-5 h-5" />
          </Button>
          <button className="text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0F0F0F] border-b border-white/10 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-500 shadow-2xl backdrop-blur-3xl">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-headline font-bold uppercase tracking-wider text-white hover:text-primary transition-colors flex items-center justify-between"
            >
              {item.label}
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
             <Button variant="secondary" onClick={toggleLanguage} className="w-full h-12 uppercase text-[10px] font-black tracking-widest rounded-xl">
               {t('language_switch')}
             </Button>
             <Link href="/admin" onClick={() => setIsOpen(false)}>
               <Button className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20">
                 {t('nav_admin')}
               </Button>
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
