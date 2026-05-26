"use client";

import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { LiveCounters } from '@/components/LiveCounters';
import { NewsSection } from '@/components/NewsSection';
import { MemberDirectory } from '@/components/MemberDirectory';
import { WorksSection } from '@/components/WorksSection';
import { useLanguage } from '@/lib/i18n-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Loader2, ImageIcon, PlayCircle, Mail, Phone, MapPinned, Users, UserPlus, PhoneCall, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import React from 'react';

export default function Home() {
  const { t, language } = useLanguage();
  const db = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('isUpcoming', '==', true),
      orderBy('date', 'asc'),
      limit(10)
    );
  }, [db]);

  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);

  const galleryQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(12));
  }, [db]);
  const { data: galleryItems } = useCollection(galleryQuery);

  // Members Query for Top 8
  const membersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'members'), limit(50)); // Fetch enough to sort
  }, [db]);
  const { data: allMembers, loading: membersLoading } = useCollection(membersQuery);

  // Sorting logic for members
  const sortedMembers = React.useMemo(() => {
    if (!allMembers) return [];
    
    const rolePriority: Record<string, number> = {
      'Chairman': 1,
      'President': 2,
      'Vice President': 3,
      'General Secretary': 4
    };

    return [...allMembers]
      .sort((a, b) => {
        const p1 = rolePriority[a.designation] || 99;
        const p2 = rolePriority[b.designation] || 99;
        return p1 - p2;
      })
      .slice(0, 8);
  }, [allMembers]);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-foreground selection:bg-primary selection:text-white">
      <Navbar />
      <Hero />
      <LiveCounters />

      {/* COMMITTEE MEMBERS PREVIEW SECTION */}
      <section id="committee-preview" className="py-32 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase leading-none">
                {language === 'bn' ? 'কমিটির সদস্যবৃন্দ' : 'Committee Members'}
              </h2>
              <div className="w-24 h-2 bg-primary" />
              <p className="text-muted-foreground bn-font text-lg">
                {language === 'bn' 
                  ? 'আমাদের রাম নবমী উদযাপন কমিটির সদস্যদের সাথে পরিচিত হোন' 
                  : 'Meet our Ram Nabami Ujapan Committee members'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/members">
                <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 hover:bg-white/5">
                  <Users className="w-4 h-4 mr-2" /> View All Members
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 hover:bg-white/5">
                  <UserPlus className="w-4 h-4 mr-2" /> Join Committee
                </Button>
              </Link>
              <Button onClick={scrollToContact} className="bg-primary text-white font-black uppercase text-[10px] tracking-widest h-12 px-6">
                <PhoneCall className="w-4 h-4 mr-2" /> Contact Committee
              </Button>
            </div>
          </div>

          {membersLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="relative">
              <Carousel 
                opts={{ loop: true, align: 'start' }}
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {sortedMembers.map((member) => (
                    <CarouselItem key={member.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <Card className="bg-card/40 border-white/5 p-6 flex flex-col items-center text-center group hover:border-primary/40 transition-all duration-500 h-full">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white/5 group-hover:border-primary/40 transition-all mb-6">
                          <AvatarImage src={member.photo} className="object-cover" />
                          <AvatarFallback className="bg-white/5 text-primary font-black uppercase text-2xl">
                            {member.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-white bn-font text-lg mb-1">{member.name}</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black tracking-widest rounded-none mb-4">
                          {member.designation}
                        </Badge>
                        <div className="mt-auto pt-4 border-t border-white/5 w-full">
                          <p className="text-[10px] font-mono text-white/40 tracking-widest mb-2 uppercase">Contact</p>
                          <p className="text-sm font-bold text-white/80">{member.phone}</p>
                        </div>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end gap-3 mt-8">
                  <CarouselPrevious className="static translate-y-0 h-12 w-12 border-white/10 hover:bg-primary rounded-none" />
                  <CarouselNext className="static translate-y-0 h-12 w-12 border-white/10 hover:bg-primary rounded-none" />
                </div>
              </Carousel>
            </div>
          )}
        </div>
      </section>
      
      {/* EVENTS SECTION */}
      <section id="events" className="py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-7xl font-headline font-black text-white uppercase leading-none">{t('events_title')}</h2>
              <div className="w-24 h-2 bg-primary" />
            </div>
            <p className="text-muted-foreground max-w-sm text-right uppercase tracking-[0.2em] text-[10px] font-black opacity-60">Join our upcoming community celebrations and public meetings</p>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : events && events.length > 0 ? (
            <div className="relative">
              <Carousel 
                opts={{ loop: true, align: 'start' }}
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {events.map((event) => (
                    <CarouselItem key={event.id} className="pl-4 md:basis-1/1 lg:basis-1/1">
                      <div className="group relative overflow-hidden bg-card border border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[450px]">
                        <div className="relative w-full md:w-[45%] aspect-video md:aspect-auto overflow-hidden">
                          <Image 
                            src={event.imageUrl || 'https://picsum.photos/seed/event/1200/800'} 
                            alt=""
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                          <div className="absolute top-8 left-8">
                            <Badge className="bg-primary text-white border-none uppercase text-[10px] tracking-[0.3em] font-black px-4 py-2 rounded-none shadow-xl">UPCOMING EVENT</Badge>
                          </div>
                        </div>
                        <div className="p-12 md:p-16 flex-1 flex flex-col justify-center space-y-8 bg-card/40 backdrop-blur-xl">
                          <h3 className="text-4xl md:text-5xl font-headline font-black text-white bn-font leading-tight">
                            {language === 'bn' ? event.title_bn : (event.title_en || event.title_bn)}
                          </h3>
                          <div className="flex flex-wrap gap-8 text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-3"><Calendar className="w-4 h-4 text-primary" /> {event.date}</span>
                            <span className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> {language === 'bn' ? event.location_bn : (event.location_en || event.location_bn)}</span>
                          </div>
                          <p className="text-lg text-muted-foreground bn-font leading-relaxed max-w-2xl">
                            {language === 'bn' ? event.description_bn : (event.description_en || event.description_bn)}
                          </p>
                          <div className="pt-4 flex flex-wrap gap-4">
                            <Button 
                              onClick={() => {
                                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.3em] rounded-none h-14 px-10 shadow-2xl transition-transform hover:scale-105"
                            >
                               JOIN EVENT DETAILS
                            </Button>
                            {event.video && (
                               <Button 
                                 variant="outline" 
                                 onClick={() => window.open(event.video, '_blank')}
                                 className="border-white/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-none h-14 px-10 hover:bg-white/5"
                               >
                                  <PlayCircle className="w-5 h-5 mr-2" /> WATCH PROMO
                               </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end gap-3 mt-8">
                  <CarouselPrevious className="static translate-y-0 h-14 w-14 border-white/10 hover:bg-primary rounded-none" />
                  <CarouselNext className="static translate-y-0 h-14 w-14 border-white/10 hover:bg-primary rounded-none" />
                </div>
              </Carousel>
            </div>
          ) : (
            <div className="p-32 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <p className="text-muted-foreground bn-font text-xl opacity-60">বর্তমানে কোনো আসন্ন অনুষ্ঠান নেই।</p>
            </div>
          )}
        </div>
      </section>

      <WorksSection />
      <NewsSection />
      
      {/* GALLERY SECTION */}
      <section id="gallery" className="py-32 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
             <div className="space-y-4">
                <h2 className="text-4xl md:text-7xl font-headline font-black text-white uppercase leading-none">{t('nav_gallery')}</h2>
                <div className="w-24 h-2 bg-primary mx-auto md:mx-0" />
             </div>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] max-w-xs">Aggregated media from all committee activities and public projects</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0.5">
          {galleryItems && galleryItems.length > 0 ? galleryItems.map((item, i) => (
            <div key={item.id} className="aspect-square bg-neutral-900 group relative overflow-hidden cursor-pointer">
               {item.mediaType === 'video' && item.video ? (
                  <video 
                    src={item.video}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
               ) : (
                  <Image 
                    src={item.image || `https://picsum.photos/seed/dsl-gal-${i}/800/800`}
                    alt={item.title || ""}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                  />
               )}
               <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <div className="bg-primary text-white p-3 shadow-2xl">
                     <ImageIcon className="w-5 h-5" />
                  </div>
               </div>
            </div>
          )) : (
            [1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} className="aspect-square bg-neutral-900 border border-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>

      <MemberDirectory />

      {/* AGENDA SECTION */}
      <section id="agenda" className="py-32 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-20">
             <div className="max-w-3xl space-y-8 text-left">
                <Badge className="bg-white/20 text-white border-none px-4 py-1.5 uppercase text-[10px] font-black tracking-widest rounded-none">COMMUNITY VOICE</Badge>
                <h2 className="text-5xl md:text-8xl font-headline font-black uppercase leading-[0.9] tracking-tighter">Your Voice, <br /> Our Agenda</h2>
                <p className="text-xl md:text-2xl font-body opacity-90 leading-relaxed max-w-2xl">Every resident of Danesh Shekh Lane deserves a committee that listens. Our agenda is set by the people, for the people. Share your concerns and ideas for our neighborhood.</p>
             </div>
             <div className="flex flex-col gap-6 w-full lg:w-auto">
                <button 
                  onClick={scrollToContact}
                  className="px-12 py-6 bg-white text-primary font-black uppercase tracking-[0.3em] hover:bg-neutral-100 transition-all shadow-2xl hover:scale-105 active:scale-95 text-xs"
                >
                  Submit Agenda
                </button>
                <button 
                  onClick={scrollToContact}
                  className="px-12 py-6 border-2 border-white/30 text-white font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-xs"
                >
                  Join Community Meet
                </button>
             </div>
           </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12 text-left">
              <div>
                <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase mb-4">Get In Touch</h2>
                <div className="w-20 h-1.5 bg-primary" />
              </div>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPinned className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">Office Address</h4>
                    <p className="text-muted-foreground bn-font">Danesh Sheikh Lane, Howrah - 711109, WB</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">Helpline</h4>
                    <p className="text-muted-foreground">+91 89101 57653</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">Email</h4>
                    <p className="text-muted-foreground">contact@dslrnu.org</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card/30 border border-white/5 p-10 backdrop-blur-xl">
               <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Name</label>
                       <input className="w-full bg-white/5 border border-white/10 h-12 px-4 text-white focus:border-primary outline-none" placeholder="Enter name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Phone</label>
                       <input className="w-full bg-white/5 border border-white/10 h-12 px-4 text-white focus:border-primary outline-none" placeholder="+91" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Message</label>
                     <textarea className="w-full bg-white/5 border border-white/10 min-h-[120px] p-4 text-white focus:border-primary outline-none" placeholder="How can we help?" />
                  </div>
                  <button className="w-full h-14 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-primary/90 transition-all shadow-xl">
                    Send Community Query
                  </button>
               </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-16">
          <div className="text-center space-y-4">
             <h3 className="font-headline font-black text-4xl text-primary uppercase leading-none tracking-tighter">{t('hero_title')}</h3>
             <p className="text-xs font-black text-white/40 uppercase tracking-[0.8em]">{t('hero_subtitle')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12 border-y border-white/5 py-12 w-full max-w-4xl">
            {['Facebook', 'YouTube', 'WhatsApp', 'Instagram'].map(social => (
               <a key={social} href="#" className="text-[11px] font-black uppercase tracking-[0.4em] hover:text-primary transition-all text-white/60 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                  {social}
               </a>
            ))}
          </div>
          <div className="text-center space-y-4 max-w-2xl">
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-body tracking-[0.05em] uppercase">
              {t('footer_text')}
            </p>
            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest flex items-center justify-center gap-2">
               <span>ESTABLISHED IN SERVICE</span>
               <span className="w-1 h-1 rounded-full bg-white/20" />
               <span>HOWRAH, WEST BENGAL</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
