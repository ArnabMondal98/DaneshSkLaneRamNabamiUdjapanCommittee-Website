
"use client";

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n-context';
import { Input } from '@/components/ui/input';
import { Search, Phone, Eye, ChevronLeft, ChevronRight, Loader2, Filter, Award, MessageCircle, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const ITEMS_PER_PAGE = 10;

export function MemberDirectory() {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const membersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'members'), orderBy('name', 'asc'));
  }, [db]);

  const { data: members, loading } = useCollection(membersQuery);

  const designations = useMemo(() => {
    if (!members) return [];
    const unique = Array.from(new Set(members.map(m => m.designation)));
    return unique.sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter(m => {
      const nameMatch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = m.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || roleMatch;
      const matchesFilter = filterDesignation === 'all' || m.designation === filterDesignation;
      return matchesSearch && matchesFilter;
    });
  }, [members, searchTerm, filterDesignation]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section id="members" className="py-32 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8">
          <div className="text-left space-y-4">
            <h2 className="text-4xl md:text-6xl font-headline font-black text-white uppercase leading-none">{t('members_title')}</h2>
            <div className="w-20 h-2 bg-primary" />
            <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-black opacity-60">
              ESTABLISHED COMMITTEE MEMBERS • 2026
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                className="pl-12 h-14 bg-card/40 border-white/5 rounded-none focus:ring-primary shadow-2xl" 
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <Select value={filterDesignation} onValueChange={(val) => {
              setFilterDesignation(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-14 w-full sm:w-56 bg-card/40 border-white/5 rounded-none shadow-2xl">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="All Roles" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white rounded-none">
                <SelectItem value="all">All Roles</SelectItem>
                {designations.map(d => (
                  <SelectItem key={d} value={d} className="focus:bg-primary">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card/20 border border-white/5 shadow-2xl backdrop-blur-3xl">
          <Table>
            <TableHeader className="bg-card/50">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[100px]"></TableHead>
                <TableHead className="font-black text-white/40 tracking-[0.3em] text-[10px] uppercase h-16">MEMBER NAME</TableHead>
                <TableHead className="font-black text-white/40 tracking-[0.3em] text-[10px] uppercase h-16">DESIGNATION / HONOR</TableHead>
                <TableHead className="font-black text-white/40 tracking-[0.3em] text-[10px] uppercase h-16">CONTACT INFO</TableHead>
                <TableHead className="text-right font-black text-white/40 tracking-[0.3em] text-[10px] uppercase h-16 pr-12">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.length > 0 ? paginatedMembers.map((member) => (
                <TableRow key={member.id} className="border-white/5 hover:bg-primary/5 transition-all group h-24">
                  <TableCell className="pl-8">
                    <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-primary/40 transition-all">
                      <AvatarImage src={member.photo} className="object-cover" />
                      <AvatarFallback className="bg-white/5 text-primary font-black uppercase text-sm">
                        {member.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-bold text-white bn-font text-lg">
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      {member.memberYear && <span className="text-[8px] text-primary font-black tracking-[0.3em] uppercase mt-1">ESTD {member.memberYear}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge className="px-3 py-1 w-fit bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black tracking-widest rounded-none">
                        {member.designation}
                      </Badge>
                      {member.recognition && (
                        <span className="flex items-center gap-1.5 text-[10px] text-accent font-black uppercase tracking-widest">
                          <Award className="w-3.5 h-3.5" /> {member.recognition}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-white/60 tracking-wider">
                     <div className="flex flex-col">
                        <span>{member.phone}</span>
                        <span className="text-[8px] opacity-40 uppercase tracking-[0.2em]">Primary Contact</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                    <div className="flex justify-end gap-3">
                      <a href={`tel:${member.phone}`}>
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none bg-white/5 hover:bg-primary hover:text-white transition-all">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                      <a href={`https://wa.me/${member.phone}`} target="_blank" rel="noopener noreferrer">
                         <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none bg-white/5 hover:bg-green-600 hover:text-white transition-all">
                           <MessageCircle className="w-4 h-4" />
                         </Button>
                      </a>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none bg-white/5 hover:bg-white/10">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground bn-font opacity-40 text-xl">
                    {language === 'bn' ? 'কোনো সদস্য খুঁজে পাওয়া যায়নি' : 'No members match your criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-8 border-t border-white/5 flex items-center justify-between bg-card/30">
              <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.4em]">
                Displaying Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="h-12 px-6 border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white"
                  disabled={currentPage === 1}
                  onClick={() => {
                     setCurrentPage(p => p - 1);
                     document.getElementById('members')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 px-6 border-white/10 rounded-none font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                     setCurrentPage(p => p + 1);
                     document.getElementById('members')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
