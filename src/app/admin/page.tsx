"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Wand2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  UserPlus, 
  Search, 
  Zap, 
  Briefcase, 
  Calendar, 
  Newspaper, 
  Image as ImageIcon, 
  Upload,
  LayoutDashboard,
  RefreshCw,
  Video,
  Database,
  CheckCircle2,
  Users,
  List,
  FileText
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  where, 
  getDocs, 
  setDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';
import { enhanceContent } from '@/ai/flows/admin-content-enhancer';
import { adminContentTranslator } from '@/ai/flows/admin-content-translator';

// --- Media Upload Component (Upload + URL Paste Fallback) ---
const MediaUploader = ({ path, onUploadComplete, label, accept = "image/*", multiple = false }: any) => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const app = useFirebaseApp();
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    const urls: string[] = [];

    try {
      const storage = getStorage(app);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `${path}/${Date.now()}_${safeName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const url = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(Math.round(pct));
            },
            (error) => {
              console.error("Upload failed", error);
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        urls.push(url);
      }

      onUploadComplete(multiple ? urls : urls[0]);
      toast({ title: `${urls.length} file(s) uploaded successfully` });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ 
        variant: "destructive", 
        title: "Upload failed", 
        description: err?.code === 'storage/unauthorized' 
          ? "Firebase Storage not configured. Use 'Paste URL' tab instead." 
          : (err?.message || "Try paste URL option below.")
      });
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input so same file can be re-selected after error
      if (e.target) e.target.value = '';
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      toast({ variant: "destructive", title: "Enter a URL first" });
      return;
    }
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u);
    onUploadComplete(multiple ? urls : urls[0]);
    toast({ title: `${urls.length} URL(s) added` });
    setUrlInput('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">{label}</Label>
      
      {/* Mode Toggle */}
      <div className="flex gap-1 bg-background/30 p-1 rounded border border-white/5">
        <button 
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 rounded transition-all ${mode === 'upload' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}
        >
          Upload File
        </button>
        <button 
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 rounded transition-all ${mode === 'url' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}
        >
          Paste URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="relative">
          <Input 
            type="file" 
            accept={accept} 
            multiple={multiple} 
            onChange={handleUpload}
            disabled={uploading}
            className="cursor-pointer bg-background/50 border-dashed border-white/20" 
          />
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-md">
              <span className="text-[10px] font-bold mb-1">{progress}%</span>
              <Progress value={progress} className="w-1/2 h-1" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {multiple ? (
            <Textarea
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Paste URLs (one per line)&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              className="bg-background/50 border-white/10 min-h-[80px] text-xs font-mono"
            />
          ) : (
            <Input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/file.jpg"
              className="bg-background/50 border-white/10 text-xs"
            />
          )}
          <Button 
            type="button"
            onClick={handleUrlAdd}
            size="sm"
            className="w-full bg-accent hover:bg-accent/90 text-[9px] font-black uppercase tracking-widest"
          >
            <Plus className="w-3 h-3 mr-1" /> Add URL{multiple ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
};

export default function AdminPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; collection: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Shared AI Editor State
  const [editorContent, setEditorContent] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);

  // ============================================
  // WORKS MANAGER STATE
  // ============================================
  const [workEditingId, setWorkEditingId] = useState<string | null>(null);
  const [workForm, setWorkForm] = useState({
    title_bn: '', title_en: '', description_bn: '', description_en: '',
    location_bn: '', location_en: '', thumbnail: '', status: 'active' as 'active' | 'completed',
    featured: false, date: '', video: '', galleryImages: [] as string[], galleryVideos: [] as string[]
  });
  const [workSubmitting, setWorkSubmitting] = useState(false);
  const [workSeeding, setWorkSeeding] = useState(false);

  const worksQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'works'), orderBy('createdAt', 'desc')) : null, 
    [db]
  );
  const { data: worksItems, loading: worksLoading } = useCollection(worksQuery);

  // ============================================
  // EVENTS MANAGER STATE
  // ============================================
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title_bn: '', title_en: '', description_bn: '', description_en: '',
    date: '', time: '', location_bn: '', location_en: '', image: '',
    gallery: [] as string[], isUpcoming: true
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const eventsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'events'), orderBy('date', 'desc')) : null,
    [db]
  );
  const { data: eventsItems, loading: eventsLoading } = useCollection(eventsQuery);

  // ============================================
  // NEWS MANAGER STATE
  // ============================================
  const [newsEditingId, setNewsEditingId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    headline_bn: '', headline_en: '', summary_bn: '', summary_en: '',
    category_bn: '', category_en: '', thumbnail: '', facebookLink: '', isPublished: true
  });
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsSeeding, setNewsSeeding] = useState(false);

  const newsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'news'), orderBy('createdAt', 'desc')) : null,
    [db]
  );
  const { data: newsItems, loading: newsLoading } = useCollection(newsQuery);

  // ============================================
  // MEMBERS MANAGER STATE
  // ============================================
  const [memberEditingId, setMemberEditingId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '', designation: '', phone: '', photo: '', memberYear: ''
  });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  const membersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'members'), orderBy('name', 'asc')) : null,
    [db]
  );
  const { data: membersItems, loading: membersLoading } = useCollection(membersQuery);

  // ============================================
  // AGENDA MANAGER STATE
  // ============================================
  const [agendaEditingId, setAgendaEditingId] = useState<string | null>(null);
  const [agendaForm, setAgendaForm] = useState({
    title_bn: '', title_en: '', description_bn: '', description_en: '',
    image: '', date: '', time: '', gallery: [] as string[], videos: [] as string[]
  });
  const [agendaSubmitting, setAgendaSubmitting] = useState(false);

  const agendaQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'agenda'), orderBy('createdAt', 'desc')) : null,
    [db]
  );
  const { data: agendaItems, loading: agendaLoading } = useCollection(agendaQuery);

  // ============================================
  // GALLERY MANAGER STATE
  // ============================================
  const [galleryForm, setGalleryForm] = useState({
    title: '', mediaType: 'image' as 'image' | 'video', image: '', video: ''
  });
  const [gallerySubmitting, setGallerySubmitting] = useState(false);

  const galleryQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'gallery'), orderBy('createdAt', 'desc')) : null,
    [db]
  );
  const { data: galleryItems, loading: galleryLoading } = useCollection(galleryQuery);

  // ============================================
  // HOMEPAGE SETTINGS STATE
  // ============================================
  const [homepageSubmitting, setHomepageSubmitting] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);

  const homepageSettingsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'settings'), where('type', '==', 'homepage'), limit(1)) : null,
    [db]
  );
  const { data: homepageSettings } = useCollection(homepageSettingsQuery);
  const currentHomepageSettings = homepageSettings?.[0];

  // ============================================
  // WORKS CRUD OPERATIONS
  // ============================================
  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setWorkSubmitting(true);
    const data = { 
      ...workForm, 
      updatedAt: serverTimestamp(),
      thumbnail: workForm.thumbnail || '/placeholders/work-placeholder.jpg',
      video: workForm.video || '/placeholders/work-video.mp4'
    };
    try {
      if (workEditingId) {
        await updateDoc(doc(db, 'works', workEditingId), data);
        toast({ title: "Work Updated" });
      } else {
        await addDoc(collection(db, 'works'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Work Created" });
      }
      resetWorkForm();
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setWorkSubmitting(false); 
    }
  };

  const resetWorkForm = () => {
    setWorkEditingId(null);
    setWorkForm({ 
      title_bn: '', title_en: '', description_bn: '', description_en: '', 
      location_bn: '', location_en: '', thumbnail: '', status: 'active', 
      featured: false, date: '', video: '', galleryImages: [], galleryVideos: []
    });
  };

  const handleDeleteWork = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'works', id));
      toast({ title: "Work Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  // ============================================
  // SEED OFFICIAL WORKS (5 records with auto Bengali translation)
  // ============================================
  const seedOfficialWorks = async () => {
    if (!db) return;
    setWorkSeeding(true);

    const officialWorks = [
      {
        title_en: "Community Playground Cleared Successfully",
        title_bn: "কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার করা হয়েছে",
        description_en: "Community playground cleared successfully in Danesh Sheikh Lane, 41 No Ward of Dakshin Howrah. The area was cleared using heavy machinery to provide children and youth a safe open space.",
        description_bn: "দক্ষিণ হাওড়ার ৪১ নং ওয়ার্ডের দানেশ শেখ লেনে কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার করা হয়েছে। শিশু ও যুবকদের নিরাপদ খোলা জায়গা দেওয়ার জন্য ভারী যন্ত্রপাতি ব্যবহার করে এলাকাটি পরিষ্কার করা হয়েছে।",
        featured: true,
        date: "2026-05-15"
      },
      {
        title_en: "Underground Drainage Repair Completed at Ward No.39",
        title_bn: "৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ সম্পন্ন",
        description_en: "Underground drainage repair work was successfully completed on 19 May 2026 at Godown Gate area under Ward No.39, Dakshin Howrah to improve drainage flow and reduce local waterlogging.",
        description_bn: "দক্ষিণ হাওড়ার ৩৯ নং ওয়ার্ডের গোডাউন গেট এলাকায় আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ ২০২৬ সালের ১৯ মে সফলভাবে সম্পন্ন হয়েছে, যা নিকাশী প্রবাহ উন্নত করতে এবং স্থানীয় জলাবদ্ধতা কমাতে সাহায্য করবে।",
        featured: true,
        date: "2026-05-19"
      },
      {
        title_en: "Development Work Completed at Lalkuti Tetultala Ward No.41",
        title_bn: "৪১ নং ওয়ার্ডের লালকুঠি তেঁতুলতলায় উন্নয়নমূলক কাজ সম্পন্ন",
        description_en: "Development work at Lalkuti Tetultala under Ward No.41, Howrah was completed successfully on 22 May 2026 for local infrastructure improvement, enhancing the quality of life for residents.",
        description_bn: "হাওড়ার ৪১ নং ওয়ার্ডের অধীনে লালকুঠি তেঁতুলতলায় উন্নয়নমূলক কাজ ২০২৬ সালের ২২ মে স্থানীয় পরিকাঠামো উন্নয়নের জন্য সফলভাবে সম্পন্ন হয়েছে, যা বাসিন্দাদের জীবনযাত্রার মান উন্নত করবে।",
        featured: true,
        date: "2026-05-22"
      },
      {
        title_en: "Garbage Clearance at 42 No Bus Stand, Danesh Sheikh Lane",
        title_bn: "দানেশ শেখ লেনের ৪২ নং বাস স্ট্যান্ডে আবর্জনা পরিষ্কার",
        description_en: "Garbage clearance work completed at 42 No Bus Stand, Danesh Sheikh Lane of 41 No Ward, Dakshin Howrah. This initiative helped keep public spaces clean and hygienic.",
        description_bn: "দক্ষিণ হাওড়ার ৪১ নং ওয়ার্ডের দানেশ শেখ লেনের ৪২ নং বাস স্ট্যান্ডে আবর্জনা পরিষ্কারের কাজ সম্পন্ন হয়েছে। এই উদ্যোগ জনসাধারণের জায়গা পরিষ্কার ও স্বাস্থ্যসম্মত রাখতে সাহায্য করেছে।",
        featured: true,
        date: "2026-05-24"
      },
      {
        title_en: "Free Health Checkup Camp at Danesh Sheikh Lane",
        title_bn: "দানেশ শেখ লেনে বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির",
        description_en: "A free health checkup camp was organized near 42 No Bus Stand, Danesh Sheikh Lane, 41 No Ward, Dakshin Howrah. The camp provided free medical consultations and blood pressure checks.",
        description_bn: "দক্ষিণ হাওড়ার ৪১ নং ওয়ার্ডের দানেশ শেখ লেনের ৪২ নং বাস স্ট্যান্ডের কাছে একটি বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবিরের আয়োজন করা হয়েছিল। শিবিরে বিনামূল্যে চিকিৎসা পরামর্শ ও রক্তচাপ পরীক্ষার ব্যবস্থা ছিল।",
        featured: true,
        date: "2026-05-25"
      }
    ];

    let added = 0;
    let updated = 0;

    try {
      for (const work of officialWorks) {
        // Check by title_en (unique identifier)
        const q = query(collection(db, 'works'), where('title_en', '==', work.title_en));
        const snap = await getDocs(q);

        const docData = {
          ...work,
          thumbnail: '/placeholders/work-placeholder.jpg',
          video: '/placeholders/work-video.mp4',
          galleryImages: [] as string[],
          galleryVideos: [] as string[],
          status: 'active' as const,
          location_bn: 'দানেশ শেখ লেন, ৪১ নং ওয়ার্ড',
          location_en: 'Danesh Sheikh Lane, Ward 41',
          updatedAt: serverTimestamp()
        };

        if (snap.empty) {
          await addDoc(collection(db, 'works'), {
            ...docData,
            createdAt: serverTimestamp()
          });
          added++;
        } else {
          // Update existing — preserve any uploaded media if already set
          const existing = snap.docs[0].data();
          await updateDoc(doc(db, 'works', snap.docs[0].id), {
            ...docData,
            // Preserve existing media if admin already uploaded
            thumbnail: existing.thumbnail && !existing.thumbnail.includes('/placeholders/') ? existing.thumbnail : docData.thumbnail,
            video: existing.video && !existing.video.includes('/placeholders/') ? existing.video : docData.video,
            galleryImages: existing.galleryImages?.length ? existing.galleryImages : (existing.gallery || []),
            galleryVideos: existing.galleryVideos?.length ? existing.galleryVideos : (existing.videos || [])
          });
          updated++;
        }
      }

      toast({ 
        title: "Official Works Seeded Successfully", 
        description: `${added} added, ${updated} updated. No data deleted.` 
      });
    } catch (err: any) {
      console.error('Work seed error:', err);
      toast({ 
        variant: "destructive", 
        title: "Seed Failed", 
        description: err?.message || "Check Firestore permissions" 
      });
    } finally {
      setWorkSeeding(false);
    }
  };

  // ============================================
  // EVENTS CRUD OPERATIONS
  // ============================================
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setEventSubmitting(true);
    const data = { 
      ...eventForm, 
      updatedAt: serverTimestamp(),
      image: eventForm.image || 'https://picsum.photos/seed/event/800/600'
    };
    try {
      if (eventEditingId) {
        await updateDoc(doc(db, 'events', eventEditingId), data);
        toast({ title: "Event Updated" });
      } else {
        await addDoc(collection(db, 'events'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Event Created" });
      }
      resetEventForm();
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setEventSubmitting(false); 
    }
  };

  const resetEventForm = () => {
    setEventEditingId(null);
    setEventForm({ 
      title_bn: '', title_en: '', description_bn: '', description_en: '',
      date: '', time: '', location_bn: '', location_en: '', image: '',
      gallery: [], isUpcoming: true
    });
  };

  const handleDeleteEvent = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      toast({ title: "Event Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  // ============================================
  // NEWS CRUD OPERATIONS
  // ============================================
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setNewsSubmitting(true);
    
    try {
      // Check for duplicate headline_bn
      const q = query(collection(db, 'news'), where('headline_bn', '==', newsForm.headline_bn));
      const snap = await getDocs(q);
      
      const data = { 
        ...newsForm, 
        updatedAt: serverTimestamp(),
        thumbnail: newsForm.thumbnail || '/placeholders/news-placeholder.jpg'
      };

      if (!snap.empty && !newsEditingId) {
        // Update existing document instead of creating duplicate
        const existingDoc = snap.docs[0];
        await updateDoc(doc(db, 'news', existingDoc.id), data);
        toast({ title: "News Updated (duplicate prevented)" });
      } else if (newsEditingId) {
        await updateDoc(doc(db, 'news', newsEditingId), data);
        toast({ title: "News Updated" });
      } else {
        await addDoc(collection(db, 'news'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "News Created" });
      }
      resetNewsForm();
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setNewsSubmitting(false); 
    }
  };

  const resetNewsForm = () => {
    setNewsEditingId(null);
    setNewsForm({ 
      headline_bn: '', headline_en: '', summary_bn: '', summary_en: '',
      category_bn: '', category_en: '', thumbnail: '', facebookLink: '', isPublished: true
    });
  };

  const handleDeleteNews = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      toast({ title: "News Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  // ============================================
  // SEED OFFICIAL NEWS (6 records with auto English translation)
  // ============================================
  const seedOfficialNews = async () => {
    if (!db) return;
    setNewsSeeding(true);

    const officialNews = [
      {
        category_bn: "স্থানীয় বিষয়",
        category_en: "Local Affairs",
        headline_bn: "সরকারী জমিতে জবর দখল নিয়ে পুনর্বাসন দাবি: আলোচনায় বরুন কুমার বারিকদার",
        headline_en: "Rehabilitation Demand for Illegal Occupation of Government Land: Discussion with Barun Kumar Barikdar",
        summary_bn: "সরকারী জমিতে দীর্ঘদিন ধরে বসবাস ও ব্যবসা পরিচালনা করা বহু মানুষের পুনর্বাসনের দাবি এবং জমি খালি করার বিষয়ে স্থানীয় মানুষের অবস্থান নিয়ে আলোচনা করছেন ভারতীয় নৌসেনার প্রাক্তন অফিসার ও দক্ষিণ হাওড়ার বিজেপি কার্যকর্তা বরুন কুমার বারিকদার।",
        summary_en: "Former Indian Navy officer and South Howrah BJP activist Barun Kumar Barikdar discusses the rehabilitation demand of many people who have been living and running businesses on government land for a long time, and the local community's stance on vacating the land.",
        facebookLink: "https://www.facebook.com/reel/2192872864861681"
      },
      {
        category_bn: "যানবাহন ও অবকাঠামো",
        category_en: "Transport & Infrastructure",
        headline_bn: "আন্দুল রোডে প্রতিদিনের যানজট নিয়ে আলোচনা",
        headline_en: "Discussion on Daily Traffic Congestion at Andul Road",
        summary_bn: "আন্দুল রোডের দীর্ঘদিনের যানজট সমস্যা, বিশেষ করে রাতের পরিস্থিতি এবং সম্ভাব্য সমাধান নিয়ে আলোচনা করছেন দক্ষিণ হাওড়ার বিজেপি কার্যকর্তা বরুন কুমার বারিকদার।",
        summary_en: "South Howrah BJP activist Barun Kumar Barikdar discusses the long-standing traffic congestion problem at Andul Road, especially the night situation and possible solutions.",
        facebookLink: "https://www.facebook.com/reel/1694595391694365"
      },
      {
        category_bn: "রাজনীতি",
        category_en: "Politics",
        headline_bn: "স্থানীয় অভিযোগ প্রসঙ্গে মতামত: আলোচনায় বরুন কুমার বারিকদার",
        headline_en: "Opinion on Local Complaints: Discussion with Barun Kumar Barikdar",
        summary_bn: "দক্ষিণ হাওড়ার রাজনৈতিক ও স্থানীয় অভিযোগ সম্পর্কিত বিষয় নিয়ে আলোচনা এবং মতামত প্রদান করছেন বরুন কুমার বারিকাদার।",
        summary_en: "Barun Kumar Barikdar discusses and shares opinions on political and local complaint-related issues in South Howrah.",
        facebookLink: "https://www.facebook.com/reel/1335076775227284"
      },
      {
        category_bn: "আন্তর্জাতিক ও রাজনীতি",
        category_en: "International & Politics",
        headline_bn: "বাংলাদেশ পরিস্থিতি ও আঞ্চলিক প্রভাব নিয়ে আলোচনা",
        headline_en: "Discussion on Bangladesh Situation and Regional Impact",
        summary_bn: "বাংলাদেশের বর্তমান পরিস্থিতি এবং তার সম্ভাব্য প্রভাব নিয়ে আলোচনা করছেন ভারতীয় নৌবাহিনীর প্রাক্তন অফিসার বরুন কুমার বারিকদার।",
        summary_en: "Former Indian Navy officer Barun Kumar Barikdar discusses the current situation in Bangladesh and its possible impact.",
        facebookLink: "https://www.facebook.com/reel/1390247666477241"
      },
      {
        category_bn: "সমাজ ও নিরাপত্তা",
        category_en: "Society & Security",
        headline_bn: "দক্ষিণ হাওড়ায় সমাজবিরোধীদের বিরুদ্ধে বার্তা",
        headline_en: "Message Against Anti-Social Elements in South Howrah",
        summary_bn: "দক্ষিণ হাওড়ায় সমাজবিরোধী কার্যকলাপ নিয়ে বক্তব্য ও সামাজিক নিরাপত্তা প্রসঙ্গে আলোচনা।",
        summary_en: "Statement on anti-social activities in South Howrah and discussion on social security.",
        facebookLink: "https://www.facebook.com/reel/4243602825857428"
      },
      {
        category_bn: "প্রতিরক্ষা ও আন্তর্জাতিক",
        category_en: "Defence & International",
        headline_bn: "ভারতীয় নৌবাহিনী ও আন্তর্জাতিক পরিস্থিতি নিয়ে আলোচনা",
        headline_en: "Discussion on Indian Navy and International Situation",
        summary_bn: "ভারতীয় নৌবাহিনীর সক্ষমতা, আন্তর্জাতিক পরিস্থিতি এবং সাম্প্রতিক ভূরাজনৈতিক বিষয় নিয়ে আলোচনা করছেন ভারতীয় নৌবাহিনীর প্রাক্তন অফিসার বরুন কুমার বারিকদার।",
        summary_en: "Former Indian Navy officer Barun Kumar Barikdar discusses the capabilities of the Indian Navy, international situations, and recent geopolitical issues.",
        facebookLink: "https://www.facebook.com/reel/847139061167251"
      }
    ];

    let added = 0;
    let updated = 0;

    try {
      for (const news of officialNews) {
        // Check for existing news by headline_bn (unique identifier)
        const q = query(collection(db, 'news'), where('headline_bn', '==', news.headline_bn));
        const snap = await getDocs(q);
        
        const docData = {
          ...news,
          thumbnail: '/placeholders/news-placeholder.jpg',
          isPublished: true,
          updatedAt: serverTimestamp()
        };

        if (snap.empty) {
          // Create new
          await addDoc(collection(db, 'news'), {
            ...docData,
            createdAt: serverTimestamp()
          });
          added++;
        } else {
          // Update existing (preserve createdAt)
          const existingDoc = snap.docs[0];
          await updateDoc(doc(db, 'news', existingDoc.id), docData);
          updated++;
        }
      }

      toast({ 
        title: "Official News Seeded Successfully", 
        description: `${added} added, ${updated} updated. No data deleted.` 
      });
    } catch (err: any) {
      console.error('News seed error:', err);
      toast({ 
        variant: "destructive", 
        title: "Seed Failed", 
        description: err?.message || "Check Firestore permissions" 
      });
    } finally {
      setNewsSeeding(false);
    }
  };

  // ============================================
  // MEMBERS CRUD OPERATIONS
  // ============================================
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    if (!memberForm.name || !memberForm.designation || !memberForm.phone) {
      toast({ variant: "destructive", title: "Required fields missing" });
      return;
    }

    setMemberSubmitting(true);
    const data = { 
      ...memberForm, 
      photo: memberForm.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberForm.name)}&size=200&background=random`,
      createdAt: memberEditingId ? undefined : serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    try {
      if (memberEditingId) {
        await updateDoc(doc(db, 'members', memberEditingId), data);
        toast({ title: "Member Updated" });
      } else {
        await addDoc(collection(db, 'members'), data);
        toast({ title: "Member Added" });
      }
      resetMemberForm();
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setMemberSubmitting(false); 
    }
  };

  const resetMemberForm = () => {
    setMemberEditingId(null);
    setMemberForm({ name: '', designation: '', phone: '', photo: '', memberYear: '' });
  };

  const handleDeleteMember = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      toast({ title: "Member Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  const handleBulkImport = async () => {
    if (!db || !bulkImportText.trim()) return;
    
    setBulkImporting(true);
    const lines = bulkImportText.split('\n').filter(l => l.trim());
    const batch = writeBatch(db);
    let count = 0;

    try {
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const [name, designation, phone, memberYear = ''] = parts;
          const ref = doc(collection(db, 'members'));
          batch.set(ref, {
            name,
            designation,
            phone,
            memberYear,
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          count++;
        }
      }
      
      await batch.commit();
      toast({ title: `${count} members imported successfully` });
      setBulkImportText('');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Import Error" });
    } finally {
      setBulkImporting(false);
    }
  };

  // ============================================
  // AGENDA CRUD OPERATIONS
  // ============================================
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setAgendaSubmitting(true);
    const data = { 
      ...agendaForm, 
      image: agendaForm.image || 'https://picsum.photos/seed/agenda/800/600',
      createdAt: agendaEditingId ? undefined : serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      if (agendaEditingId) {
        await updateDoc(doc(db, 'agenda', agendaEditingId), data);
        toast({ title: "Agenda Updated" });
      } else {
        await addDoc(collection(db, 'agenda'), data);
        toast({ title: "Agenda Created" });
      }
      resetAgendaForm();
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setAgendaSubmitting(false); 
    }
  };

  const resetAgendaForm = () => {
    setAgendaEditingId(null);
    setAgendaForm({ title_bn: '', title_en: '', description_bn: '', description_en: '', image: '', date: '', time: '', gallery: [], videos: [] });
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'agenda', id));
      toast({ title: "Agenda Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  // ============================================
  // GALLERY OPERATIONS
  // ============================================
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setGallerySubmitting(true);
    const data = { 
      ...galleryForm,
      sourceCollection: 'custom',
      sourceId: null,
      createdAt: serverTimestamp()
    };
    try {
      await addDoc(collection(db, 'gallery'), data);
      toast({ title: "Gallery Item Added" });
      setGalleryForm({ title: '', mediaType: 'image', image: '', video: '' });
    } catch (err) { 
      console.error(err);
      toast({ variant: "destructive", title: "Save Error" }); 
    } finally { 
      setGallerySubmitting(false); 
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast({ title: "Gallery Item Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  const syncGalleryFromCollections = async () => {
    if (!db) return;
    setGallerySubmitting(true);
    
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Sync from works (supports both old & new schema)
      if (worksItems) {
        for (const work of worksItems) {
          const workThumbnail = work.thumbnail || work.image;
          if (workThumbnail && !workThumbnail.includes('/placeholders/')) {
            const ref = doc(collection(db, 'gallery'));
            batch.set(ref, {
              title: work.title_bn || work.title_en,
              mediaType: 'image',
              image: workThumbnail,
              video: '',
              sourceCollection: 'works',
              sourceId: work.id,
              createdAt: serverTimestamp()
            });
            count++;
          }
          if (work.video && !work.video.includes('/placeholders/')) {
            const ref = doc(collection(db, 'gallery'));
            batch.set(ref, {
              title: work.title_bn || work.title_en,
              mediaType: 'video',
              image: '',
              video: work.video,
              sourceCollection: 'works',
              sourceId: work.id,
              createdAt: serverTimestamp()
            });
            count++;
          }
          const workGalleryImages = work.galleryImages || work.gallery || [];
          if (workGalleryImages.length > 0) {
            for (const img of workGalleryImages) {
              const ref = doc(collection(db, 'gallery'));
              batch.set(ref, {
                title: work.title_bn || work.title_en,
                mediaType: 'image',
                image: img,
                video: '',
                sourceCollection: 'works',
                sourceId: work.id,
                createdAt: serverTimestamp()
              });
              count++;
            }
          }
          const workGalleryVideos = work.galleryVideos || work.videos || [];
          if (workGalleryVideos.length > 0) {
            for (const vid of workGalleryVideos) {
              const ref = doc(collection(db, 'gallery'));
              batch.set(ref, {
                title: work.title_bn || work.title_en,
                mediaType: 'video',
                image: '',
                video: vid,
                sourceCollection: 'works',
                sourceId: work.id,
                createdAt: serverTimestamp()
              });
              count++;
            }
          }
        }
      }

      // Sync from events
      if (eventsItems) {
        for (const event of eventsItems) {
          if (event.image) {
            const ref = doc(collection(db, 'gallery'));
            batch.set(ref, {
              title: event.title_bn || event.title_en,
              mediaType: 'image',
              image: event.image,
              video: '',
              sourceCollection: 'events',
              sourceId: event.id,
              createdAt: serverTimestamp()
            });
            count++;
          }
          if (event.gallery && event.gallery.length > 0) {
            for (const img of event.gallery) {
              const ref = doc(collection(db, 'gallery'));
              batch.set(ref, {
                title: event.title_bn || event.title_en,
                mediaType: 'image',
                image: img,
                video: '',
                sourceCollection: 'events',
                sourceId: event.id,
                createdAt: serverTimestamp()
              });
              count++;
            }
          }
        }
      }

      // Sync from news
      if (newsItems) {
        for (const news of newsItems) {
          if (news.thumbnail) {
            const ref = doc(collection(db, 'gallery'));
            batch.set(ref, {
              title: news.headline_bn || news.headline_en,
              mediaType: 'image',
              image: news.thumbnail,
              video: '',
              sourceCollection: 'news',
              sourceId: news.id,
              createdAt: serverTimestamp()
            });
            count++;
          }
        }
      }

      await batch.commit();
      toast({ title: `${count} media items synced to gallery` });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Error" });
    } finally {
      setGallerySubmitting(false);
    }
  };

  // ============================================
  // HOMEPAGE SETTINGS OPERATIONS
  // ============================================
  const saveHomepageBackground = async (url: string) => {
    if (!db) return;
    setHomepageSubmitting(true);
    try {
      if (currentHomepageSettings?.id) {
        await updateDoc(doc(db, 'settings', currentHomepageSettings.id), {
          backgroundImage: url,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'settings'), {
          type: 'homepage',
          backgroundImage: url,
          logo: currentHomepageSettings?.logo || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast({ title: "Background Updated" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Update Error" });
    } finally {
      setHomepageSubmitting(false);
    }
  };

  const saveHomepageLogo = async (url: string) => {
    if (!db) return;
    setHomepageSubmitting(true);
    try {
      if (currentHomepageSettings?.id) {
        await updateDoc(doc(db, 'settings', currentHomepageSettings.id), {
          logo: url,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'settings'), {
          type: 'homepage',
          logo: url,
          backgroundImage: currentHomepageSettings?.backgroundImage || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast({ title: "Logo Updated" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Update Error" });
    } finally {
      setHomepageSubmitting(false);
    }
  };

  const deleteHomepageBackground = async () => {
    if (!db || !currentHomepageSettings?.id) return;
    setHomepageSubmitting(true);
    try {
      await updateDoc(doc(db, 'settings', currentHomepageSettings.id), {
        backgroundImage: '',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Background Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    } finally {
      setHomepageSubmitting(false);
    }
  };

  const deleteHomepageLogo = async () => {
    if (!db || !currentHomepageSettings?.id) return;
    setHomepageSubmitting(true);
    try {
      await updateDoc(doc(db, 'settings', currentHomepageSettings.id), {
        logo: '',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Logo Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Error" });
    } finally {
      setHomepageSubmitting(false);
    }
  };

  // ============================================
  // SEED ALL DATA OPERATION
  // ============================================
  const seedAllData = async () => {
    if (!db) return;
    setSeedingAll(true);

    const officialMembers = [
      { name: "BIPLAB MONDOL", phone: "8910157653", designation: "Chairman", recognition: "Founder" },
      { name: "RITU SINGH", phone: "7890577505", designation: "Advisor", recognition: "" },
      { name: "KALLOL MUKHERJEE", phone: "9051421633", designation: "Advisor", recognition: "" },
      { name: "BARUN KUMAR BARIKDAR", phone: "9431185548", designation: "President", recognition: "" },
      { name: "SAMIR GHOSH", phone: "9674554899", designation: "Vice President", recognition: "" },
      { name: "DEBIKA NAYEK", phone: "9903361132", designation: "Vice President", recognition: "" },
      { name: "ADITYA SAMANTA", phone: "9330223598", designation: "Vice President", recognition: "" },
      { name: "JAYANTA DHARA", phone: "9007309960", designation: "Vice President", recognition: "" },
      { name: "MONOJ DUTTA ROY", phone: "9231987011", designation: "General Secretary", recognition: "" },
      { name: "SUKHENDU GOSWAMI", phone: "9831225851", designation: "General Secretary", recognition: "" },
      { name: "BISWAJIT SADHUKHAN", phone: "8282827471", designation: "General Secretary", recognition: "" },
      { name: "ADITI CHAKRABORTY", phone: "8100529995", designation: "General Secretary", recognition: "" },
      { name: "BHUSAN PRASAD", phone: "7278739738", designation: "Joint Secretary", recognition: "" },
      { name: "PROSENJIT SANTRA", phone: "8910909172", designation: "Joint Secretary", recognition: "" },
      { name: "SAIKAT RAM", phone: "9836441620", designation: "Auditor", recognition: "" },
      { name: "TRIDIP ROY CHOWDHURY", phone: "9051495160", designation: "Patron", recognition: "" },
      { name: "SHANTIPRIYO MANDAL", phone: "9230603990", designation: "Patron", recognition: "" },
      { name: "SHYAMA DEY", phone: "7687869353", designation: "Cultural Secretary", recognition: "" },
      { name: "VOLA RUIDAS", phone: "7278816907", designation: "Cultural Secretary", recognition: "" },
      { name: "AVIJIT MUKHERJEE", phone: "9830482414", designation: "Cultural Secretary", recognition: "" },
      { name: "SUPRABHAT JANA (BACHHU)", phone: "9330548542", designation: "Cultural Secretary", recognition: "" },
      { name: "NARU GOPAL SINGHA", phone: "9038699728", designation: "Cultural Secretary", recognition: "" },
      { name: "KHOKON RUIDAS", phone: "9674692654", designation: "Cultural Secretary", recognition: "" },
      { name: "GANESH MAZUMDAR", phone: "8420683242", designation: "Cultural Secretary", recognition: "" },
      { name: "SANJAY SHAW", phone: "7439374335", designation: "Cultural Secretary", recognition: "" },
      { name: "SUDIPTA JANA", phone: "6290534309", designation: "Cultural Secretary", recognition: "" },
      { name: "PANKAJ GUPTA", phone: "9830081551", designation: "Cultural Secretary", recognition: "" },
      { name: "PRASANTA JANA", phone: "9836216955", designation: "Cultural Secretary", recognition: "" },
      { name: "CHOTU BHUIYA", phone: "8420909673", designation: "Cultural Secretary", recognition: "" },
      { name: "DEBU NAYEK", phone: "7003130317", designation: "Cultural Secretary", recognition: "" },
      { name: "SARASWATI CHOWDHURY", phone: "6290882210", designation: "Cultural Secretary", recognition: "" }
    ];

    const officialWorks = [
      {
        title_bn: "দানেশ শেখ লেন ৪১ নং ওয়ার্ডে কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার",
        title_en: "Community Playground Cleared Successfully at Danesh Shekh Lane, 41 no Ward",
        description_bn: "দানেশ শেখ লেন, দক্ষিণ হাওড়ার ৪১ নং ওয়ার্ডে কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার করা হয়েছে।",
        description_en: "Community playground cleared successfully at Danesh Sheikh Lane, 41 No Ward of Dakshin Howrah.",
        location_bn: "দানেশ শেখ লেন, ৪১ নং ওয়ার্ড",
        location_en: "Danesh Sheikh Lane, Ward 41",
        image: "/assets/garbage1.jpeg",
        video: "",
        gallery: ["/assets/garbage1.jpeg", "/assets/garbage2.jpeg"],
        status: "completed",
        featured: true,
        date: "2026-05-15"
      },
      {
        title_bn: "৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামত সম্পন্ন",
        title_en: "Underground Drainage Repair Completed at Ward No.39",
        description_bn: "দক্ষিণ হাওড়ার ৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ সফলভাবে সম্পন্ন হয়েছে।",
        description_en: "Underground drainage repair work was successfully completed at Ward No.39, Dakshin Howrah.",
        location_bn: "৩৯ নং ওয়ার্ড",
        location_en: "Ward 39",
        image: "https://picsum.photos/seed/drainage39/800/600",
        video: "",
        gallery: [],
        status: "completed",
        featured: true,
        date: "2026-05-19"
      },
      {
        title_bn: "লালকুঠি তেঁতুলতলায় ৪১ নং ওয়ার্ডে উন্নয়নমূলক কাজ সম্পন্ন",
        title_en: "Development Work Completed at Lalkuti Tetultala Ward No.41",
        description_bn: "লালকুঠি তেঁতুলতলায় উন্নয়নমূলক কাজ সফলভাবে সম্পন্ন হয়েছে।",
        description_en: "Development work completed successfully at Lalkuti Tetultala.",
        location_bn: "লালকুঠি তেঁতুলতলা, ৪১ নং ওয়ার্ড",
        location_en: "Lalkuti Tetultala, Ward 41",
        image: "https://picsum.photos/seed/lalkuti41/800/600",
        video: "/assets/work-video.mp4",
        gallery: [],
        status: "completed",
        featured: true,
        date: "2026-05-22"
      },
      {
        title_bn: "৪২ নম্বর বাস স্ট্যান্ড ৪১ নং ওয়ার্ড এলাকায় আবর্জনা পরিষ্কার",
        title_en: "Garbage Clearance at 42 No Bus Stand, 41 no Ward",
        description_bn: "৪২ নম্বর বাস স্ট্যান্ড এলাকায় আবর্জনা পরিষ্কার কাজ সম্পন্ন হয়েছে।",
        description_en: "Garbage clearance work completed at 42 No Bus Stand area.",
        location_bn: "৪২ নম্বর বাস স্ট্যান্ড, ৪১ নং ওয়ার্ড",
        location_en: "42 No Bus Stand, Ward 41",
        image: "/assets/garbage2.jpeg",
        video: "",
        gallery: ["/assets/garbage1.jpeg", "/assets/garbage2.jpeg"],
        status: "completed",
        featured: true,
        date: "2026-05-24"
      },
      {
        title_bn: "দানেশ শেখ লেন ৪১ নং ওয়ার্ডে বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির",
        title_en: "Free Health Checkup Camp at Danesh Shekh Lane, 41 no Ward",
        description_bn: "দানেশ শেখ লেন এলাকায় বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির আয়োজন করা হয়েছে।",
        description_en: "A free health checkup camp was organized at Danesh Sheikh Lane area.",
        location_bn: "দানেশ শেখ লেন, ৪১ নং ওয়ার্ড",
        location_en: "Danesh Sheikh Lane, Ward 41",
        image: "https://picsum.photos/seed/health41/800/600",
        video: "",
        gallery: [],
        status: "completed",
        featured: true,
        date: "2026-05-25"
      }
    ];

    const agendaData = {
      title_bn: "বিজয় উৎসব",
      title_en: "Victory Celebration",
      description_bn: "পশ্চিমবঙ্গ প্রথম সনাতনী সরকার সেই উপলক্ষে রাম নবমী উদযাপন কমিটি একটি বিজয় উৎসবের আয়োজন করেছে। দানেশ শেখ লেন দিনান্তে আসর মাঠে। আপনাকে এবং আপনাদের সবাইকে স্বাগতম।",
      description_en: "West Bengal's first Sanatani government celebration. Ram Nabami Committee organizes victory celebration at Danesh Sheikh Lane evening ground.",
      image: "/assets/homepage-background.jpg",
      date: "2026-05-27",
      time: "বিকেল ৫টা"
    };

    const officialNews = [
      {
        headline_bn: "দানেশ শেখ লেনে কমিউনিটি খেলার মাঠ পরিষ্কার সম্পন্ন",
        headline_en: "Community Playground Cleaning Completed at Danesh Sheikh Lane",
        summary_bn: "রাম নবমী উদযাপন কমিটির উদ্যোগে দানেশ শেখ লেনে কমিউনিটি খেলার মাঠ পরিষ্কারের কাজ সফলভাবে সম্পন্ন হয়েছে।",
        summary_en: "Community playground cleaning work at Danesh Sheikh Lane successfully completed.",
        category_bn: "উন্নয়ন",
        category_en: "Development",
        thumbnail: "/assets/garbage1.jpeg",
        facebookLink: "",
        isPublished: true
      },
      {
        headline_bn: "৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামত",
        headline_en: "Underground Drainage Repair at Ward 39",
        summary_bn: "দক্ষিণ হাওড়ার ৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ এগিয়ে চলেছে।",
        summary_en: "Underground drainage repair work at Ward 39, South Howrah is progressing.",
        category_bn: "পরিকাঠামো",
        category_en: "Infrastructure",
        thumbnail: "https://picsum.photos/seed/drain39news/800/600",
        facebookLink: "",
        isPublished: true
      },
      {
        headline_bn: "লালকুঠি তেঁতুলতলায় উন্নয়ন প্রকল্প",
        headline_en: "Development Project at Lalkuti Tetultala",
        summary_bn: "লালকুঠি তেঁতুলতলায় নতুন উন্নয়ন প্রকল্প শুরু হয়েছে যা এলাকার সার্বিক উন্নতিতে সহায়ক হবে।",
        summary_en: "A new development project has started at Lalkuti Tetultala.",
        category_bn: "উন্নয়ন",
        category_en: "Development",
        thumbnail: "https://picsum.photos/seed/lalkutinews/800/600",
        facebookLink: "",
        isPublished: true
      },
      {
        headline_bn: "বিজয় উৎসব আয়োজনের ঘোষণা",
        headline_en: "Announcement of Victory Celebration",
        summary_bn: "পশ্চিমবঙ্গের প্রথম সনাতনী সরকার উপলক্ষে রাম নবমী উদযাপন কমিটি বিজয় উৎসবের আয়োজন করছে।",
        summary_en: "Ram Nabami Committee organizing victory celebration on occasion of West Bengal's first Sanatani government.",
        category_bn: "অনুষ্ঠান",
        category_en: "Events",
        thumbnail: "/assets/homepage-background.jpg",
        facebookLink: "",
        isPublished: true
      },
      {
        headline_bn: "বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির সফল",
        headline_en: "Free Health Checkup Camp Successful",
        summary_bn: "দানেশ শেখ লেনে আয়োজিত বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির ব্যাপক সাড়া পেয়েছে।",
        summary_en: "Free health checkup camp at Danesh Sheikh Lane received overwhelming response.",
        category_bn: "স্বাস্থ্য",
        category_en: "Health",
        thumbnail: "https://picsum.photos/seed/healthcamp/800/600",
        facebookLink: "",
        isPublished: true
      },
      {
        headline_bn: "কমিটির সদস্যদের সাথে মাসিক সভা",
        headline_en: "Monthly Meeting with Committee Members",
        summary_bn: "রাম নবমী উদযাপন কমিটির সকল সদস্যদের সাথে মাসিক সভা অনুষ্ঠিত হয়েছে।",
        summary_en: "Monthly meeting held with all members of Ram Nabami Committee.",
        category_bn: "সাধারণ",
        category_en: "General",
        thumbnail: "https://picsum.photos/seed/meeting/800/600",
        facebookLink: "",
        isPublished: true
      }
    ];

    const officialEvents = [
      {
        title_bn: "বিজয় উৎসব ২০২৬",
        title_en: "Victory Celebration 2026",
        description_bn: "পশ্চিমবঙ্গ প্রথম সনাতনী সরকার উপলক্ষে বিজয় উৎসব। দানেশ শেখ লেন আসর মাঠে।",
        description_en: "Victory celebration for West Bengal's first Sanatani government. At Danesh Sheikh Lane ground.",
        date: "2026-05-27",
        time: "17:00",
        location_bn: "দানেশ শেখ লেন আসর মাঠ",
        location_en: "Danesh Sheikh Lane Ground",
        image: "/assets/homepage-background.jpg",
        gallery: [],
        isUpcoming: true
      },
      {
        title_bn: "রাম নবমী উদযাপন ২০২৬",
        title_en: "Ram Nabami Celebration 2026",
        description_bn: "বার্ষিক রাম নবমী উদযাপন অনুষ্ঠান। সকল ভক্তদের আমন্ত্রণ।",
        description_en: "Annual Ram Nabami celebration ceremony. All devotees are invited.",
        date: "2026-04-17",
        time: "06:00",
        location_bn: "দানেশ শেখ লেন",
        location_en: "Danesh Sheikh Lane",
        image: "https://picsum.photos/seed/ramnabami2026/800/600",
        gallery: [],
        isUpcoming: true
      },
      {
        title_bn: "কমিউনিটি মিটিং জুন ২০২৬",
        title_en: "Community Meeting June 2026",
        description_bn: "মাসিক কমিউনিটি মিটিং। সকল সদস্যদের উপস্থিতি প্রার্থনীয়।",
        description_en: "Monthly community meeting. All members are requested to attend.",
        date: "2026-06-15",
        time: "18:00",
        location_bn: "কমিউনিটি হল, দানেশ শেখ লেন",
        location_en: "Community Hall, Danesh Sheikh Lane",
        image: "https://picsum.photos/seed/meeting2026/800/600",
        gallery: [],
        isUpcoming: true
      }
    ];

    let stats = { members: 0, works: 0, events: 0, news: 0, agenda: 0 };

    try {
      // Seed Members
      for (const member of officialMembers) {
        const q = query(collection(db, 'members'), where('name', '==', member.name));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'members'), {
            ...member,
            memberYear: "2026",
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=random&color=fff&bold=true`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          stats.members++;
        }
      }

      // Seed Works
      for (const work of officialWorks) {
        const q = query(collection(db, 'works'), where('title_bn', '==', work.title_bn));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'works'), {
            ...work,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          stats.works++;
        }
      }

      // Seed Events
      for (const event of officialEvents) {
        const q = query(collection(db, 'events'), where('title_bn', '==', event.title_bn));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'events'), {
            ...event,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          stats.events++;
        }
      }

      // Seed News
      for (const news of officialNews) {
        const q = query(collection(db, 'news'), where('headline_bn', '==', news.headline_bn));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'news'), {
            ...news,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          stats.news++;
        }
      }

      // Seed Agenda
      const agendaQ = query(collection(db, 'agenda'), where('title_bn', '==', agendaData.title_bn));
      const agendaSnap = await getDocs(agendaQ);
      if (agendaSnap.empty) {
        await addDoc(collection(db, 'agenda'), {
          ...agendaData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        stats.agenda++;
      }

      toast({ 
        title: "Seeding Complete!", 
        description: `Added: ${stats.members} members, ${stats.works} works, ${stats.events} events, ${stats.news} news, ${stats.agenda} agenda` 
      });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Seeding Error", description: err.message });
    } finally {
      setSeedingAll(false);
    }
  };

  // ============================================
  // AI FUNCTIONS
  // ============================================
  async function handleEnhance() {
    if (!editorContent) return;
    setEditorLoading(true);
    try {
      const result = await enhanceContent({ content: editorContent });
      setEditorContent(result.enhancedContent);
      toast({ title: "Content Enhanced" });
    } catch (err) { 
      toast({ variant: "destructive", title: "AI Error" }); 
    } finally { 
      setEditorLoading(false); 
    }
  }

  async function handleTranslate(target: 'en' | 'bn') {
    if (!editorContent) return;
    setEditorLoading(true);
    try {
      const result = await adminContentTranslator({ textToTranslate: editorContent, targetLanguage: target });
      setEditorContent(result.translatedText);
      toast({ title: "Translated" });
    } catch (err) { 
      toast({ variant: "destructive", title: "AI Error" }); 
    } finally { 
      setEditorLoading(false); 
    }
  }

  if (!isMounted) return null;

  return (
    <main className="min-h-screen pt-24 bg-[#0F0F0F]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <LayoutDashboard className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-headline font-bold text-white uppercase tracking-tight">Media & Content</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">Control Panel</p>
             </div>
          </div>
        </header>

        <Tabs defaultValue="homepage" className="space-y-8">
          <TabsList className="bg-card/30 border border-white/5 p-1.5 rounded-2xl backdrop-blur-xl overflow-x-auto flex-nowrap">
            <TabsTrigger value="homepage" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Homepage</TabsTrigger>
            <TabsTrigger value="works" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Works</TabsTrigger>
            <TabsTrigger value="events" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Events</TabsTrigger>
            <TabsTrigger value="news" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">News</TabsTrigger>
            <TabsTrigger value="members" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Members</TabsTrigger>
            <TabsTrigger value="gallery" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Gallery</TabsTrigger>
            <TabsTrigger value="agenda" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Agenda</TabsTrigger>
            <TabsTrigger value="seed" className="px-6 data-[state=active]:bg-accent data-[state=active]:text-white">Seed Data</TabsTrigger>
            <TabsTrigger value="ai" className="px-6 data-[state=active]:bg-accent data-[state=active]:text-white">AI Tools</TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* WORKS MANAGER */}
          {/* ============================================ */}
          <TabsContent value="works" className="space-y-8">
            {/* SEED OFFICIAL WORKS BUTTON */}
            <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30 shadow-2xl">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-tight">Seed Official Works</h3>
                    <p className="text-white/60 text-xs mt-1">Insert/update 5 official works (Bengali + English) with placeholder media. Duplicates by title_en will update — preserves any uploaded media. Never deletes.</p>
                  </div>
                </div>
                <Button 
                  onClick={seedOfficialWorks}
                  disabled={workSeeding}
                  className="bg-accent hover:bg-accent/90 font-black uppercase tracking-widest text-[10px] h-12 px-6 shrink-0"
                  data-testid="seed-official-works-btn"
                >
                  {workSeeding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  {workSeeding ? 'Seeding...' : 'SEED OFFICIAL WORKS'}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-white/5 h-fit lg:sticky lg:top-24 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <Briefcase className="w-5 h-5" />
                    {workEditingId ? 'Edit Work' : 'Add Work'}
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveWork}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">BN Title *</Label>
                          <Input value={workForm.title_bn} onChange={e => setWorkForm({...workForm, title_bn: e.target.value})} required className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">EN Title</Label>
                          <Input value={workForm.title_en} onChange={e => setWorkForm({...workForm, title_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Description (BN) *</Label>
                       <Textarea value={workForm.description_bn} onChange={e => setWorkForm({...workForm, description_bn: e.target.value})} required className="bg-background bn-font min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Description (EN)</Label>
                       <Textarea value={workForm.description_en} onChange={e => setWorkForm({...workForm, description_en: e.target.value})} className="bg-background min-h-[80px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <MediaUploader 
                          path="works/covers" 
                          label="Cover Image (Thumbnail)" 
                          onUploadComplete={(url: string) => setWorkForm({...workForm, thumbnail: url})} 
                        />
                       <MediaUploader 
                          path="works/videos" 
                          label="Promo Video (single)" 
                          accept="video/*"
                          onUploadComplete={(url: string) => setWorkForm({...workForm, video: url})} 
                        />
                    </div>
                    {workForm.thumbnail && (
                      <div className="relative aspect-video border border-white/10 rounded overflow-hidden">
                        <Image src={workForm.thumbnail} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => setWorkForm({...workForm, thumbnail: ''})}
                          className="absolute top-2 right-2 bg-red-500 p-1 rounded">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <Badge className="absolute bottom-2 left-2 bg-black/70 text-white border-none text-[8px]">Cover</Badge>
                      </div>
                    )}
                    {workForm.video && (
                      <div className="relative aspect-video border border-white/10 rounded overflow-hidden bg-black">
                        <video src={workForm.video} controls className="w-full h-full" />
                        <button type="button" onClick={() => setWorkForm({...workForm, video: ''})}
                          className="absolute top-2 right-2 bg-red-500 p-1 rounded z-10">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <Badge className="absolute bottom-2 left-2 bg-black/70 text-white border-none text-[8px] z-10">Promo Video</Badge>
                      </div>
                    )}
                    <MediaUploader 
                        path="works/gallery-images" 
                        label="Add Multiple Gallery Images" 
                        multiple={true}
                        onUploadComplete={(urls: string[]) => setWorkForm({...workForm, galleryImages: [...workForm.galleryImages, ...urls]})} 
                    />
                    {workForm.galleryImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 pt-2">
                        {workForm.galleryImages.map((url, i) => (
                          <div key={i} className="relative aspect-square border border-white/10 rounded overflow-hidden">
                            <Image src={url} alt="" fill className="object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setWorkForm({...workForm, galleryImages: workForm.galleryImages.filter((_, idx) => idx !== i)})}
                              className="absolute top-0 right-0 bg-red-500 p-0.5"
                            >
                              <X className="w-2 h-2 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <MediaUploader 
                        path="works/gallery-videos" 
                        label="Add Multiple Gallery Videos" 
                        accept="video/*"
                        multiple={true}
                        onUploadComplete={(urls: string[]) => setWorkForm({...workForm, galleryVideos: [...(workForm.galleryVideos || []), ...urls]})} 
                    />
                    {workForm.galleryVideos && workForm.galleryVideos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {workForm.galleryVideos.map((url, i) => (
                          <div key={i} className="relative aspect-video border border-white/10 rounded overflow-hidden bg-black">
                            <video src={url} controls className="w-full h-full" />
                            <button 
                              type="button" 
                              onClick={() => setWorkForm({...workForm, galleryVideos: workForm.galleryVideos.filter((_, idx) => idx !== i)})}
                              className="absolute top-1 right-1 bg-red-500 p-1 rounded z-10"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <div className="flex items-center gap-2">
                          <Switch 
                            checked={workForm.featured} 
                            onCheckedChange={v => setWorkForm({...workForm, featured: v})} 
                          />
                          <Label className="text-[10px] uppercase font-bold tracking-widest">Featured</Label>
                       </div>
                       <select 
                          value={workForm.status} 
                          onChange={(e) => setWorkForm({...workForm, status: e.target.value as 'active' | 'completed'})}
                          className="bg-background border border-white/10 rounded h-8 text-[10px] uppercase font-bold px-2 text-white"
                       >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                       </select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={workSubmitting}>
                      {workSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {workEditingId ? 'UPDATE' : 'SAVE'}
                    </Button>
                    {workEditingId && <Button variant="ghost" onClick={resetWorkForm} size="icon"><X className="w-4 h-4" /></Button>}
                  </CardFooter>
                </form>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {worksLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : worksItems?.map(item => (
                  <Card key={item.id} className="bg-card/50 border-white/5 p-4 flex gap-6 group">
                    <div className="relative w-32 h-20 shrink-0">
                      <Image src={item.thumbnail || item.image || 'https://picsum.photos/seed/work/400/300'} alt="" fill className="object-cover rounded-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary border-none text-[8px]">{item.status}</Badge>
                        {item.featured && <CheckCircle2 className="w-3 h-3 text-accent" />}
                      </div>
                      <h3 className="font-bold text-white bn-font text-sm">{item.title_bn}</h3>
                      <div className="flex gap-4 mt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest" onClick={() => {
                          setWorkEditingId(item.id);
                          setWorkForm({ 
                            title_bn: item.title_bn || '', title_en: item.title_en || '',
                            description_bn: item.description_bn || '', description_en: item.description_en || '',
                            location_bn: item.location_bn || '', location_en: item.location_en || '',
                            thumbnail: item.thumbnail || item.image || '', 
                            video: item.video || '',
                            status: item.status || 'active', featured: item.featured || false,
                            date: item.date || '', 
                            galleryImages: item.galleryImages || item.gallery || [], 
                            galleryVideos: item.galleryVideos || item.videos || []
                          });
                        }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest text-destructive" 
                          onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'works' })}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* EVENTS MANAGER */}
          {/* ============================================ */}
          <TabsContent value="events" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-white/5 h-fit lg:sticky lg:top-24 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <Calendar className="w-5 h-5" />
                    {eventEditingId ? 'Edit Event' : 'Add Event'}
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveEvent}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">BN Title *</Label>
                          <Input value={eventForm.title_bn} onChange={e => setEventForm({...eventForm, title_bn: e.target.value})} required className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">EN Title</Label>
                          <Input value={eventForm.title_en} onChange={e => setEventForm({...eventForm, title_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Description (BN) *</Label>
                       <Textarea value={eventForm.description_bn} onChange={e => setEventForm({...eventForm, description_bn: e.target.value})} required className="bg-background bn-font min-h-[80px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Date *</Label>
                          <Input type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required className="bg-background" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Time</Label>
                          <Input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Location (BN)</Label>
                          <Input value={eventForm.location_bn} onChange={e => setEventForm({...eventForm, location_bn: e.target.value})} className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Location (EN)</Label>
                          <Input value={eventForm.location_en} onChange={e => setEventForm({...eventForm, location_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <MediaUploader 
                       path="events/covers" 
                       label="Event Image" 
                       onUploadComplete={(url: string) => setEventForm({...eventForm, image: url})} 
                     />
                    <MediaUploader 
                        path="events/gallery" 
                        label="Add to Gallery" 
                        multiple={true}
                        onUploadComplete={(urls: string[]) => setEventForm({...eventForm, gallery: [...eventForm.gallery, ...urls]})} 
                    />
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                       <Switch 
                         checked={eventForm.isUpcoming} 
                         onCheckedChange={v => setEventForm({...eventForm, isUpcoming: v})} 
                       />
                       <Label className="text-[10px] uppercase font-bold tracking-widest">Upcoming Event</Label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={eventSubmitting}>
                      {eventSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {eventEditingId ? 'UPDATE' : 'SAVE'}
                    </Button>
                    {eventEditingId && <Button variant="ghost" onClick={resetEventForm} size="icon"><X className="w-4 h-4" /></Button>}
                  </CardFooter>
                </form>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {eventsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : eventsItems?.map(item => (
                  <Card key={item.id} className="bg-card/50 border-white/5 p-4 flex gap-6 group">
                    <div className="relative w-32 h-20 shrink-0">
                      <Image src={item.image || 'https://picsum.photos/seed/event/400/300'} alt="" fill className="object-cover rounded-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary border-none text-[8px]">{item.isUpcoming ? 'Upcoming' : 'Past'}</Badge>
                        <span className="text-[9px] text-white/60">{item.date}</span>
                      </div>
                      <h3 className="font-bold text-white bn-font text-sm">{item.title_bn}</h3>
                      <div className="flex gap-4 mt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest" onClick={() => {
                          setEventEditingId(item.id);
                          setEventForm({ 
                            title_bn: item.title_bn || '', title_en: item.title_en || '',
                            description_bn: item.description_bn || '', description_en: item.description_en || '',
                            date: item.date || '', time: item.time || '',
                            location_bn: item.location_bn || '', location_en: item.location_en || '',
                            image: item.image || '', gallery: item.gallery || [],
                            isUpcoming: item.isUpcoming ?? true
                          });
                        }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest text-destructive" 
                          onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'events' })}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* NEWS MANAGER */}
          {/* ============================================ */}
          <TabsContent value="news" className="space-y-8">
            {/* SEED OFFICIAL NEWS BUTTON */}
            <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30 shadow-2xl">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-tight">Seed Official News</h3>
                    <p className="text-white/60 text-xs mt-1">Insert/update 6 official news records (Bengali + English) with Facebook reel links. Duplicates by headline_bn will update, never delete.</p>
                  </div>
                </div>
                <Button 
                  onClick={seedOfficialNews}
                  disabled={newsSeeding}
                  className="bg-accent hover:bg-accent/90 font-black uppercase tracking-widest text-[10px] h-12 px-6 shrink-0"
                  data-testid="seed-official-news-btn"
                >
                  {newsSeeding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  {newsSeeding ? 'Seeding...' : 'SEED OFFICIAL NEWS'}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-white/5 h-fit lg:sticky lg:top-24 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <Newspaper className="w-5 h-5" />
                    {newsEditingId ? 'Edit News' : 'Add News'}
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Duplicate headlines will update existing news
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSaveNews}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Headline (BN) *</Label>
                          <Input value={newsForm.headline_bn} onChange={e => setNewsForm({...newsForm, headline_bn: e.target.value})} required className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Headline (EN)</Label>
                          <Input value={newsForm.headline_en} onChange={e => setNewsForm({...newsForm, headline_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Summary (BN) *</Label>
                       <Textarea value={newsForm.summary_bn} onChange={e => setNewsForm({...newsForm, summary_bn: e.target.value})} required className="bg-background bn-font min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Summary (EN)</Label>
                       <Textarea value={newsForm.summary_en} onChange={e => setNewsForm({...newsForm, summary_en: e.target.value})} className="bg-background min-h-[80px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Category (BN)</Label>
                          <Input value={newsForm.category_bn} onChange={e => setNewsForm({...newsForm, category_bn: e.target.value})} className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Category (EN)</Label>
                          <Input value={newsForm.category_en} onChange={e => setNewsForm({...newsForm, category_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Facebook Link</Label>
                       <Input value={newsForm.facebookLink} onChange={e => setNewsForm({...newsForm, facebookLink: e.target.value})} className="bg-background" placeholder="https://facebook.com/..." />
                    </div>
                    <MediaUploader 
                       path="news/thumbnails" 
                       label="Thumbnail Image" 
                       onUploadComplete={(url: string) => setNewsForm({...newsForm, thumbnail: url})} 
                     />
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                       <Switch 
                         checked={newsForm.isPublished} 
                         onCheckedChange={v => setNewsForm({...newsForm, isPublished: v})} 
                       />
                       <Label className="text-[10px] uppercase font-bold tracking-widest">Published</Label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={newsSubmitting}>
                      {newsSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {newsEditingId ? 'UPDATE' : 'SAVE'}
                    </Button>
                    {newsEditingId && <Button variant="ghost" onClick={resetNewsForm} size="icon"><X className="w-4 h-4" /></Button>}
                  </CardFooter>
                </form>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {newsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : newsItems?.map(item => (
                  <Card key={item.id} className="bg-card/50 border-white/5 p-4 flex gap-6 group">
                    <div className="relative w-32 h-20 shrink-0">
                      <Image src={item.thumbnail || 'https://picsum.photos/seed/news/400/300'} alt="" fill className="object-cover rounded-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary border-none text-[8px]">{item.category_bn || item.category_en || 'General'}</Badge>
                        {item.isPublished && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                      </div>
                      <h3 className="font-bold text-white bn-font text-sm">{item.headline_bn}</h3>
                      <div className="flex gap-4 mt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest" onClick={() => {
                          setNewsEditingId(item.id);
                          setNewsForm({ 
                            headline_bn: item.headline_bn || '', headline_en: item.headline_en || '',
                            summary_bn: item.summary_bn || '', summary_en: item.summary_en || '',
                            category_bn: item.category_bn || '', category_en: item.category_en || '',
                            thumbnail: item.thumbnail || '', facebookLink: item.facebookLink || '',
                            isPublished: item.isPublished ?? true
                          });
                        }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest text-destructive" 
                          onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'news' })}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* MEMBERS MANAGER */}
          {/* ============================================ */}
          <TabsContent value="members" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <Card className="bg-card border-white/5 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                      <Users className="w-5 h-5" />
                      {memberEditingId ? 'Edit Member' : 'Add Member'}
                    </CardTitle>
                  </CardHeader>
                  <form onSubmit={handleSaveMember}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Name *</Label>
                         <Input value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} required className="bg-background bn-font" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Designation *</Label>
                         <Input value={memberForm.designation} onChange={e => setMemberForm({...memberForm, designation: e.target.value})} required className="bg-background" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Phone *</Label>
                         <Input value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} required className="bg-background" placeholder="+91" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Member Year</Label>
                         <Input value={memberForm.memberYear} onChange={e => setMemberForm({...memberForm, memberYear: e.target.value})} className="bg-background" placeholder="2026" />
                      </div>
                      <MediaUploader 
                         path="members/photos" 
                         label="Photo (optional)" 
                         onUploadComplete={(url: string) => setMemberForm({...memberForm, photo: url})} 
                       />
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={memberSubmitting}>
                        {memberSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {memberEditingId ? 'UPDATE' : 'SAVE'}
                      </Button>
                      {memberEditingId && <Button variant="ghost" onClick={resetMemberForm} size="icon"><X className="w-4 h-4" /></Button>}
                    </CardFooter>
                  </form>
                </Card>

                <Card className="bg-card border-white/5 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-accent flex items-center gap-2 uppercase tracking-tighter text-sm">
                      <Upload className="w-4 h-4" />
                      Bulk Import
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Format: Name, Designation, Phone, Year (one per line)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea 
                      value={bulkImportText} 
                      onChange={e => setBulkImportText(e.target.value)}
                      className="bg-background/50 border-white/10 min-h-[120px] font-mono text-xs"
                      placeholder="John Doe, President, +919876543210, 2026&#10;Jane Smith, Secretary, +919876543211, 2026"
                    />
                    <Button 
                      onClick={handleBulkImport} 
                      disabled={bulkImporting || !bulkImportText.trim()}
                      className="w-full bg-accent font-black uppercase tracking-widest text-[10px]"
                    >
                      {bulkImporting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Import Members
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {membersLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : membersItems?.map(item => (
                  <Card key={item.id} className="bg-card/50 border-white/5 p-4 flex gap-6 group">
                    <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-white/10">
                      <Image src={item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white bn-font text-sm">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-primary/20 text-primary border-none text-[8px]">{item.designation}</Badge>
                        {item.memberYear && <span className="text-[9px] text-white/40">Est. {item.memberYear}</span>}
                      </div>
                      <p className="text-[10px] text-white/60 mt-2">{item.phone}</p>
                      <div className="flex gap-4 mt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest" onClick={() => {
                          setMemberEditingId(item.id);
                          setMemberForm({ 
                            name: item.name || '', designation: item.designation || '',
                            phone: item.phone || '', photo: item.photo || '',
                            memberYear: item.memberYear || ''
                          });
                        }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest text-destructive" 
                          onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'members' })}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* GALLERY MANAGER */}
          {/* ============================================ */}
          <TabsContent value="gallery" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-white/5 h-fit lg:sticky lg:top-24 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <ImageIcon className="w-5 h-5" />
                    Add Media
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Gallery auto-syncs from works, events & news
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSaveGallery}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Title</Label>
                       <Input value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} required className="bg-background bn-font" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Media Type</Label>
                       <select 
                          value={galleryForm.mediaType} 
                          onChange={(e) => setGalleryForm({...galleryForm, mediaType: e.target.value as 'image' | 'video'})}
                          className="w-full bg-background border border-white/10 rounded h-10 text-sm px-3 text-white"
                       >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                       </select>
                    </div>
                    {galleryForm.mediaType === 'image' ? (
                      <MediaUploader 
                         path="gallery/images" 
                         label="Upload Image" 
                         onUploadComplete={(url: string) => setGalleryForm({...galleryForm, image: url})} 
                       />
                    ) : (
                      <MediaUploader 
                         path="gallery/videos" 
                         label="Upload Video" 
                         accept="video/*"
                         onUploadComplete={(url: string) => setGalleryForm({...galleryForm, video: url})} 
                       />
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={gallerySubmitting}>
                      {gallerySubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      ADD
                    </Button>
                  </CardFooter>
                </form>
                <CardFooter className="pt-0">
                  <Button 
                    onClick={syncGalleryFromCollections} 
                    disabled={gallerySubmitting}
                    variant="outline"
                    className="w-full border-white/10 font-black uppercase tracking-widest text-[10px]"
                  >
                    {gallerySubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sync From Collections
                  </Button>
                </CardFooter>
              </Card>

              <div className="lg:col-span-2">
                {galleryLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryItems?.map(item => (
                      <Card key={item.id} className="bg-card/50 border-white/5 overflow-hidden group relative">
                        <div className="relative aspect-square">
                          {item.mediaType === 'image' ? (
                            <Image src={item.image || 'https://picsum.photos/seed/gallery/400/400'} alt="" fill className="object-cover" />
                          ) : (
                            <video src={item.video} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'gallery' })}
                              className="text-[9px] font-bold uppercase tracking-widest"
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-white/80 bn-font truncate">{item.title}</p>
                          <p className="text-[8px] text-white/40 uppercase mt-1">{item.sourceCollection || 'Custom'}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* AGENDA MANAGER */}
          {/* ============================================ */}
          <TabsContent value="agenda" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-white/5 h-fit lg:sticky lg:top-24 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <List className="w-5 h-5" />
                    {agendaEditingId ? 'Edit Agenda' : 'Add Agenda'}
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleSaveAgenda}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">BN Title *</Label>
                          <Input value={agendaForm.title_bn} onChange={e => setAgendaForm({...agendaForm, title_bn: e.target.value})} required className="bg-background bn-font" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">EN Title</Label>
                          <Input value={agendaForm.title_en} onChange={e => setAgendaForm({...agendaForm, title_en: e.target.value})} className="bg-background" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Description (BN) *</Label>
                       <Textarea value={agendaForm.description_bn} onChange={e => setAgendaForm({...agendaForm, description_bn: e.target.value})} required className="bg-background bn-font min-h-[120px]" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Description (EN)</Label>
                       <Textarea value={agendaForm.description_en} onChange={e => setAgendaForm({...agendaForm, description_en: e.target.value})} className="bg-background min-h-[120px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Date</Label>
                         <Input type="date" value={agendaForm.date} onChange={e => setAgendaForm({...agendaForm, date: e.target.value})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Time</Label>
                         <Input value={agendaForm.time} onChange={e => setAgendaForm({...agendaForm, time: e.target.value})} className="bg-background bn-font" placeholder="বিকেল ৫টা / 5:00 PM" />
                      </div>
                    </div>
                    <MediaUploader 
                       path="agenda/images" 
                       label="Cover Image (single)" 
                       onUploadComplete={(url: string) => setAgendaForm({...agendaForm, image: url})} 
                     />
                    {agendaForm.image && (
                      <div className="relative aspect-video border border-white/10 rounded overflow-hidden">
                        <Image src={agendaForm.image} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => setAgendaForm({...agendaForm, image: ''})}
                          className="absolute top-2 right-2 bg-red-500 p-1 rounded">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    )}
                    <MediaUploader 
                       path="agenda/gallery" 
                       label="Add Multiple Images" 
                       multiple={true}
                       onUploadComplete={(urls: string[]) => setAgendaForm({...agendaForm, gallery: [...(agendaForm.gallery || []), ...urls]})} 
                     />
                    {agendaForm.gallery && agendaForm.gallery.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {agendaForm.gallery.map((url, i) => (
                          <div key={i} className="relative aspect-square border border-white/10 rounded overflow-hidden">
                            <Image src={url} alt="" fill className="object-cover" />
                            <button type="button" 
                              onClick={() => setAgendaForm({...agendaForm, gallery: agendaForm.gallery.filter((_, idx) => idx !== i)})}
                              className="absolute top-0 right-0 bg-red-500 p-0.5">
                              <X className="w-2 h-2 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <MediaUploader 
                       path="agenda/videos" 
                       label="Add Videos" 
                       accept="video/*"
                       multiple={true}
                       onUploadComplete={(urls: string[]) => setAgendaForm({...agendaForm, videos: [...(agendaForm.videos || []), ...urls]})} 
                     />
                    {agendaForm.videos && agendaForm.videos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {agendaForm.videos.map((url, i) => (
                          <div key={i} className="relative aspect-video border border-white/10 rounded overflow-hidden bg-black">
                            <video src={url} controls className="w-full h-full" />
                            <button type="button" 
                              onClick={() => setAgendaForm({...agendaForm, videos: agendaForm.videos.filter((_, idx) => idx !== i)})}
                              className="absolute top-1 right-1 bg-red-500 p-1 rounded z-10">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary font-black uppercase tracking-widest text-[10px]" disabled={agendaSubmitting}>
                      {agendaSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {agendaEditingId ? 'UPDATE' : 'SAVE'}
                    </Button>
                    {agendaEditingId && <Button variant="ghost" onClick={resetAgendaForm} size="icon"><X className="w-4 h-4" /></Button>}
                  </CardFooter>
                </form>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {agendaLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : agendaItems?.map(item => (
                  <Card key={item.id} className="bg-card/50 border-white/5 p-6 group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-white bn-font text-lg">{item.title_bn}</h3>
                      {item.date && <Badge className="bg-primary/20 text-primary border-none text-[8px]">{item.date}</Badge>}
                    </div>
                    <p className="text-sm text-white/70 bn-font mb-4">{item.description_bn}</p>
                    <div className="flex gap-4">
                      <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest" onClick={() => {
                        setAgendaEditingId(item.id);
                        setAgendaForm({ 
                          title_bn: item.title_bn || '', title_en: item.title_en || '',
                          description_bn: item.description_bn || '', description_en: item.description_en || '',
                          image: item.image || '', date: item.date || '', time: item.time || '',
                          gallery: item.gallery || [], videos: item.videos || []
                        });
                      }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-widest text-destructive" 
                        onClick={() => setDeleteDialog({ open: true, id: item.id, collection: 'agenda' })}>Delete</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* HOMEPAGE SETTINGS MANAGER */}
          {/* ============================================ */}
          <TabsContent value="homepage" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Background Image Card */}
              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <ImageIcon className="w-5 h-5" />
                    Homepage Background
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Upload, replace or delete the homepage hero background image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentHomepageSettings?.backgroundImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                      <Image 
                        src={currentHomepageSettings.backgroundImage} 
                        alt="Background" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                      <p className="text-white/40 text-xs uppercase tracking-widest">No background set</p>
                    </div>
                  )}
                  <MediaUploader 
                    path="homepage/background" 
                    label={currentHomepageSettings?.backgroundImage ? "Replace Background" : "Upload Background"}
                    onUploadComplete={(url: string) => saveHomepageBackground(url)} 
                  />
                </CardContent>
                {currentHomepageSettings?.backgroundImage && (
                  <CardFooter>
                    <Button 
                      variant="destructive" 
                      onClick={deleteHomepageBackground}
                      disabled={homepageSubmitting}
                      className="w-full font-black uppercase tracking-widest text-[10px]"
                    >
                      {homepageSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete Background
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Logo Card */}
              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter">
                    <ImageIcon className="w-5 h-5" />
                    Committee Logo
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Upload, replace or delete the committee logo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentHomepageSettings?.logo ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                      <Image 
                        src={currentHomepageSettings.logo} 
                        alt="Logo" 
                        fill 
                        className="object-contain p-4"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                      <p className="text-white/40 text-xs uppercase tracking-widest">No logo set</p>
                    </div>
                  )}
                  <MediaUploader 
                    path="homepage/logo" 
                    label={currentHomepageSettings?.logo ? "Replace Logo" : "Upload Logo"}
                    onUploadComplete={(url: string) => saveHomepageLogo(url)} 
                  />
                </CardContent>
                {currentHomepageSettings?.logo && (
                  <CardFooter>
                    <Button 
                      variant="destructive" 
                      onClick={deleteHomepageLogo}
                      disabled={homepageSubmitting}
                      className="w-full font-black uppercase tracking-widest text-[10px]"
                    >
                      {homepageSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete Logo
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* SEED DATA */}
          {/* ============================================ */}
          <TabsContent value="seed" className="space-y-8">
            <Card className="bg-card border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2 uppercase tracking-tighter">
                  <Database className="w-5 h-5" />
                  Seed Official Data
                </CardTitle>
                <CardDescription>
                  One-click seed: 31 Members, 5 Works, 3 Events, 6 News, 1 Agenda. Duplicates are skipped automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">31</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1">Members</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Briefcase className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">5</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1">Works</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">3</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1">Events</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Newspaper className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">6</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1">News</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <List className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">1</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1">Agenda</p>
                  </div>
                </div>
                
                <Button 
                  onClick={seedAllData} 
                  disabled={seedingAll}
                  className="w-full h-14 bg-accent hover:bg-accent/90 font-black uppercase tracking-widest text-xs"
                >
                  {seedingAll ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Database className="w-5 h-5 mr-2" />}
                  {seedingAll ? 'Seeding...' : 'Seed All Official Data'}
                </Button>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-xs">
                    ⚠️ Safe Seeding: Existing items with same name/title will be skipped. No data will be overwritten or deleted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* AI TOOLS */}
          {/* ============================================ */}
          <TabsContent value="ai">
            <Card className="bg-card border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2 uppercase tracking-tighter"><Wand2 className="w-5 h-5" /> Content Engine</CardTitle>
                <CardDescription>Use AI to enhance or translate your site content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea 
                   className="min-h-[300px] bg-background/50 border-white/10 bn-font p-6 text-xl text-white" 
                   placeholder="Type your content..."
                   value={editorContent} 
                   onChange={e => setEditorContent(e.target.value)} 
                />
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary" onClick={handleEnhance} disabled={editorLoading} className="h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                    {editorLoading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Improve
                  </Button>
                  <Button variant="outline" onClick={() => handleTranslate('en')} disabled={editorLoading} className="h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                    to English
                  </Button>
                  <Button variant="outline" onClick={() => handleTranslate('bn')} disabled={editorLoading} className="h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                    to Bengali
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (!deleteDialog) return;
                const { id, collection: col } = deleteDialog;
                switch (col) {
                  case 'works': handleDeleteWork(id); break;
                  case 'events': handleDeleteEvent(id); break;
                  case 'news': handleDeleteNews(id); break;
                  case 'members': handleDeleteMember(id); break;
                  case 'gallery': handleDeleteGallery(id); break;
                  case 'agenda': handleDeleteAgenda(id); break;
                }
                setDeleteDialog(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
