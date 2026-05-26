"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Share2, Facebook, ExternalLink, Loader2, Play } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

// Facebook Reel/Video Embed with thumbnail fallback
function FacebookEmbed({ facebookLink, thumbnail, alt }: { facebookLink: string; thumbnail: string; alt: string }) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Auto-fallback after 4s if iframe doesn't load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setEmbedFailed(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [loaded]);

  if (embedFailed || !facebookLink) {
    return (
      <>
        <Image
          src={thumbnail || '/placeholders/news-placeholder.jpg'}
          alt={alt}
          fill
          className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
        />
        {facebookLink && (
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] z-10 hover:bg-background/50 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </a>
        )}
      </>
    );
  }

  return (
    <iframe
      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookLink)}&show_text=false&autoplay=false`}
      className="w-full h-full"
      scrolling="no"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      onLoad={() => setLoaded(true)}
      onError={() => setEmbedFailed(true)}
    />
  );
}

export function NewsSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const newsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'news'), 
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: newsItems, loading } = useCollection(newsQuery);

  const uniqueNewsItems = React.useMemo(() => {
    if (!newsItems) return [];
    const seenHeadlines = new Set();
    return newsItems.filter((item) => {
      const headline = (language === 'bn' 
        ? (item.headline_bn || item.headline) 
        : (item.headline_en || item.headline || item.headline_bn)
      )?.trim().toLowerCase() || '';
      
      if (seenHeadlines.has(headline)) {
        return false;
      }
      seenHeadlines.add(headline);
      return true;
    });
  }, [newsItems, language]);

  const handleShare = async (title: string, text: string, url?: string) => {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: shareUrl,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: language === 'bn' ? "লিঙ্ক কপি হয়েছে!" : "Link copied!",
        description: language === 'bn' ? "শেয়ার লিঙ্ক আপনার ক্লিপবোর্ডে কপি করা হয়েছে।" : "Share link has been copied to your clipboard.",
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !isMounted) return 'RECENT';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'RECENT';
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section id="news" className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase">{t('news_title')}</h2>
            <div className="w-24 h-1.5 bg-primary" />
          </div>
          <button 
            onClick={() => window.location.hash = 'news'}
            className="flex items-center gap-4 text-primary font-bold uppercase tracking-[0.2em] text-sm group"
          >
            {language === 'bn' ? 'সব আপডেট দেখুন' : 'View All Updates'} <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {uniqueNewsItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {uniqueNewsItems.map((item) => {
              const displayHeadline = language === 'bn' 
                ? (item.headline_bn || item.headline) 
                : (item.headline_en || item.headline || item.headline_bn);
              
              const displaySummary = language === 'bn' 
                ? (item.summary_bn || item.summary) 
                : (item.summary_en || item.summary || item.summary_bn);
              
              const displayCategory = language === 'bn' 
                ? (item.category_bn || item.category || 'সাধারণ') 
                : (item.category_en || item.category_bn || item.category || 'General');

              return (
                <Card key={item.id} className="group flex flex-col bg-card/40 border-white/5 hover:border-primary/40 transition-all duration-500 rounded-none overflow-hidden h-full shadow-2xl backdrop-blur-sm" data-testid={`news-card-${item.id}`}>
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden flex items-center justify-center border-b border-white/5">
                    {item.facebookLink && item.facebookLink.includes('facebook.com') ? (
                      <FacebookEmbed 
                        facebookLink={item.facebookLink} 
                        thumbnail={item.thumbnail || '/placeholders/news-placeholder.jpg'}
                        alt={displayHeadline || ''}
                      />
                    ) : (
                      <Image 
                        src={item.thumbnail || '/placeholders/news-placeholder.jpg'} 
                        alt={displayHeadline || ''} 
                        fill 
                        className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" 
                      />
                    )}

                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-primary/90 text-white border-none font-bold uppercase tracking-widest text-[9px] rounded-none px-2.5 py-1" data-testid={`news-category-${item.id}`}>
                        {displayCategory}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-headline font-bold text-white leading-[1.3] group-hover:text-primary transition-colors bn-font mb-4 line-clamp-2 min-h-[3.2em]">
                      {displayHeadline}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 bn-font flex-1 mb-8 opacity-80">
                      {displaySummary}
                    </p>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {item.facebookLink ? (
                          <a 
                            href={item.facebookLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-[3]"
                          >
                            <button className="w-full h-12 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-[#1877F2]/20">
                              <Facebook className="w-4 h-4" /> {language === 'bn' ? 'ফেসবুকে দেখুন' : 'WATCH ON FACEBOOK'}
                            </button>
                          </a>
                        ) : (
                          <div className="flex-[3] h-12 border border-white/5 bg-white/5 flex items-center justify-center text-[8px] text-muted-foreground uppercase tracking-widest">
                            {language === 'bn' ? 'কোনো ভিডিও নেই' : 'No Video Source'}
                          </div>
                        )}
                        <button 
                          onClick={() => handleShare(displayHeadline || '', displaySummary || '', item.facebookLink)}
                          className="flex-1 flex items-center justify-center h-12 border border-white/10 hover:bg-white/5 text-white transition-colors"
                          title="Share Update"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button onClick={() => { if (item.facebookLink) { window.open(item.facebookLink, '_blank'); } else { handleShare(displayHeadline || '', displaySummary || ''); } }} className="w-full flex items-center justify-between h-12 px-5 border border-white/10 group-hover:border-primary/50 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
                        <span>{language === 'bn' ? 'সম্পূর্ণ রিপোর্ট পড়ুন' : 'READ FULL REPORT'}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-40 border border-dashed border-white/10 glass-panel">
            <p className="text-muted-foreground font-bold text-lg bn-font">
              {language === 'bn' ? 'কোনো সংবাদ এখনো প্রকাশিত হয়নি' : 'No news published yet'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}