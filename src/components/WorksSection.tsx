"use client";

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Share2, ImageIcon, ArrowRight, Loader2, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useToast } from '@/hooks/use-toast';

// Card with auto-playing preview video
function WorkCard({ work, language, onShare }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const title = language === 'bn' ? work.title_bn : (work.title_en || work.title_bn);
  const description = language === 'bn' ? work.description_bn : (work.description_en || work.description_bn);
  const location = language === 'bn' ? work.location_bn : (work.location_en || work.location_bn);

  // Support both new (thumbnail/galleryImages) and old (image/gallery) schema
  const thumbnail = work.thumbnail || work.image || 'https://picsum.photos/seed/work/800/600';
  const promoVideo = work.video;
  const galleryImages = work.galleryImages || work.gallery || [];

  const handleMouseEnter = () => {
    if (promoVideo && videoRef.current) {
      setShowVideo(true);
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
          setShowVideo(false);
        }
      }, 10000);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setShowVideo(false);
    }
  };

  return (
    <Card className="bg-card/50 border-white/5 overflow-hidden group hover:border-primary/40 transition-all duration-500 rounded-none h-full flex flex-col shadow-2xl" data-testid={`work-card-${work.id}`}>
      <div 
        className="relative aspect-video overflow-hidden bg-black"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image 
          src={thumbnail} 
          alt={title}
          fill
          className={`object-cover transition-all duration-700 ${showVideo ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
        />
        {promoVideo && (
          <video
            ref={videoRef}
            src={promoVideo}
            muted
            playsInline
            loop={false}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge className="bg-black/50 backdrop-blur-md text-white border-none text-[8px] font-bold uppercase tracking-widest">
            {work.date || 'RECENT'}
          </Badge>
          {work.featured && (
            <Badge className="bg-primary text-white border-none text-[8px] font-bold uppercase tracking-widest gap-1">
              <Star className="w-2.5 h-2.5 fill-white" /> Featured
            </Badge>
          )}
        </div>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => onShare(title)} data-testid={`work-share-${work.id}`}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-8 space-y-4 flex-1 flex flex-col">
        <h3 className="text-xl font-headline font-bold text-white leading-tight group-hover:text-primary transition-colors bn-font line-clamp-2 min-h-[3.2em]" data-testid={`work-title-${work.id}`}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground bn-font line-clamp-3 flex-1 opacity-70">
          {description}
        </p>
        {location && (
          <div className="flex items-center gap-2 text-[10px] text-primary/80 uppercase font-bold tracking-widest">
            <MapPin className="w-3 h-3" /> {location}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (galleryImages.length > 0) {
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="rounded-none border-white/10 hover:bg-primary/10 gap-2 text-[9px] font-black uppercase tracking-widest"
            data-testid={`work-view-details-${work.id}`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> VIEW DETAILS
          </Button>
          <Button 
            onClick={() => onShare(title)}
            className="rounded-none bg-primary hover:bg-primary/90 text-[9px] font-black uppercase tracking-widest group"
          >
            SHARE <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function WorksSection() {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const { toast } = useToast();

  const worksQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Fetch all active works, sort & feature-first in client (Firestore composite index avoided)
    return query(
      collection(db, 'works'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db]);

  const { data: works, loading } = useCollection(worksQuery);

  // Sort: Featured first, then by createdAt (already sorted)
  const sortedWorks = useMemo(() => {
    if (!works) return [];
    return [...works].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [works]);

  const handleShare = async (title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied!" });
    }
  };

  if (loading) return (
    <div className="py-24 flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <section id="works" className="py-24 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase leading-none">
              {t('work_title')}
            </h2>
            <div className="w-24 h-1.5 bg-primary" />
          </div>
          <p className="text-muted-foreground max-w-md text-right hidden md:block uppercase tracking-widest text-[10px] font-bold opacity-60">
            Real-time updates on our community initiatives
          </p>
        </div>

        {sortedWorks.length > 0 ? (
          <div className="relative">
            <Carousel 
              opts={{ loop: true, align: 'start' }}
              plugins={[Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]}
              className="w-full"
            >
              <CarouselContent className="-ml-6">
                {sortedWorks.map((work) => (
                  <CarouselItem key={work.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                    <WorkCard work={work} language={language} onShare={handleShare} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end gap-2 mt-8">
                 <CarouselPrevious className="static translate-y-0 h-10 w-10 border-white/10 hover:bg-primary" data-testid="works-prev" />
                 <CarouselNext className="static translate-y-0 h-10 w-10 border-white/10 hover:bg-primary" data-testid="works-next" />
              </div>
            </Carousel>
          </div>
        ) : (
          <div className="p-20 text-center border border-dashed border-white/10 bg-white/[0.02]">
            <p className="text-muted-foreground bn-font opacity-60 text-lg">
              {language === 'bn' ? 'বর্তমানে কোনো কাজের আপডেট নেই' : 'No work updates available'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
