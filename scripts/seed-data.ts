import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

// Firebase config - will use from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder-project-id.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder-project-id.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'placeholder-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'placeholder-app-id',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Official Members Data
const officialMembers = [
  { name: "BIPLAB MONDOL", phone: "8910157653", designation: "Chairman", memberYear: "2026" },
  { name: "RITU SINGH", phone: "7890577505", designation: "Advisor", memberYear: "2026" },
  { name: "KALLOL MUKHERJEE", phone: "9051421633", designation: "Advisor", memberYear: "2026" },
  { name: "BARUN KUMAR BARIKDAR", phone: "9431185548", designation: "President", memberYear: "2026" },
  { name: "SAMIR GHOSH", phone: "9674554899", designation: "Vice President", memberYear: "2026" },
  { name: "DEBIKA NAYEK", phone: "9903361132", designation: "Vice President", memberYear: "2026" },
  { name: "ADITYA SAMANTA", phone: "9330223598", designation: "Vice President", memberYear: "2026" },
  { name: "JAYANTA DHARA", phone: "9007309960", designation: "Vice President", memberYear: "2026" },
  { name: "MONOJ DUTTA ROY", phone: "9231987011", designation: "General Secretary", memberYear: "2026" },
  { name: "SUKHENDU GOSWAMI", phone: "9831225851", designation: "General Secretary", memberYear: "2026" },
  { name: "BISWAJIT SADHUKHAN", phone: "8282827471", designation: "General Secretary", memberYear: "2026" },
  { name: "ADITI CHAKRABORTY", phone: "8100529995", designation: "General Secretary", memberYear: "2026" },
  { name: "BHUSAN PRASAD", phone: "7278739738", designation: "Joint Secretary", memberYear: "2026" },
  { name: "PROSENJIT SANTRA", phone: "8910909172", designation: "Joint Secretary", memberYear: "2026" },
  { name: "SAIKAT RAM", phone: "9836441620", designation: "Auditor", memberYear: "2026" },
  { name: "TRIDIP ROY CHOWDHURY", phone: "9051495160", designation: "Patron", memberYear: "2026" },
  { name: "SHANTIPRIYO MANDAL", phone: "9230603990", designation: "Patron", memberYear: "2026" },
  { name: "SHYAMA DEY", phone: "7687869353", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "VOLA RUIDAS", phone: "7278816907", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "AVIJIT MUKHERJEE", phone: "9830482414", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "SUPRABHAT JANA (BACHHU)", phone: "9330548542", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "NARU GOPAL SINGHA", phone: "9038699728", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "KHOKON RUIDAS", phone: "9674692654", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "GANESH MAZUMDAR", phone: "8420683242", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "SANJAY SHAW", phone: "7439374335", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "SUDIPTA JANA", phone: "6290534309", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "PANKAJ GUPTA", phone: "9830081551", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "PRASANTA JANA", phone: "9836216955", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "CHOTU BHUIYA", phone: "8420909673", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "DEBU NAYEK", phone: "7003130317", designation: "Cultural Secretary", memberYear: "2026" },
  { name: "SARASWATI CHOWDHURY", phone: "6290882210", designation: "Cultural Secretary", memberYear: "2026" }
];

// Official Works Data
const officialWorks = [
  {
    title_bn: "দানেশ শেখ লেন ৪১ নং ওয়ার্ডে কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার",
    title_en: "Community Playground Cleared Successfully at Danesh Shekh Lane, 41 no Ward",
    description_bn: "দানেশ শেখ লেন, দক্ষিণ হাওড়ার ৪১ নং ওয়ার্ডে কমিউনিটি খেলার মাঠ সফলভাবে পরিষ্কার করা হয়েছে। শিশু ও যুবকদের নিরাপদ খোলা জায়গা দেওয়ার জন্য ভারী যন্ত্র ব্যবহার করা হয়েছে।",
    description_en: "Community playground cleared successfully at Danesh Sheikh Lane, 41 No Ward of Dakshin Howrah. The area was cleared using heavy machinery to provide children and youth a safe open space.",
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
    description_bn: "দক্ষিণ হাওড়ার ৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ সফলভাবে সম্পন্ন হয়েছে। এই কাজ এলাকার জল নিকাশী ব্যবস্থা উন্নত করেছে।",
    description_en: "Underground drainage repair work was successfully completed at Ward No.39, Dakshin Howrah. This work has improved the water drainage system of the area.",
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
    description_bn: "লালকুঠি তেঁতুলতলায় উন্নয়নমূলক কাজ সফলভাবে সম্পন্ন হয়েছে। এলাকার পরিচ্ছন্নতা এবং পরিকাঠামো উন্নত করার জন্য এই প্রকল্প হাতে নেওয়া হয়েছিল।",
    description_en: "Development work completed successfully at Lalkuti Tetultala. This project was undertaken to improve cleanliness and infrastructure of the area.",
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
    description_bn: "৪২ নম্বর বাস স্ট্যান্ড এলাকায় আবর্জনা পরিষ্কার কাজ সম্পন্ন হয়েছে। এলাকাকে পরিচ্ছন্ন এবং স্বাস্থ্যকর রাখার জন্য নিয়মিত পরিচ্ছন্নতা অভিযান চালানো হচ্ছে।",
    description_en: "Garbage clearance work completed at 42 No Bus Stand area. Regular cleanliness drives are being conducted to keep the area clean and healthy.",
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
    description_bn: "দানেশ শেখ লেন এলাকায় বিনামূল্যে স্বাস্থ্য পরীক্ষা শিবির আয়োজন করা হয়েছে। স্থানীয় বাসিন্দাদের স্বাস্থ্য সেবা প্রদানের জন্য এই শিবির আয়োজন করা হয়।",
    description_en: "A free health checkup camp was organized at Danesh Sheikh Lane area. This camp was organized to provide healthcare services to local residents.",
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

// Agenda Data
const agendaData = {
  title_bn: "বিজয় উৎসব",
  title_en: "Victory Celebration",
  description_bn: "পশ্চিমবঙ্গ প্রথম সনাতনী সরকার সেই উপলক্ষে রাম নবমী উদযাপন কমিটি একটি বিজয় উৎসবের আয়োজন করেছে। দানেশ শেখ লেন দিনান্তে আসর মাঠে। আপনাকে এবং আপনাদের সবাইকে স্বাগতম।",
  description_en: "West Bengal's first Sanatani government, on that occasion Ram Nabami Celebration Committee has organized a victory celebration. At Danesh Sheikh Lane evening gathering ground. You and all of you are welcome.",
  image: "/assets/homepage-background.jpg",
  date: "2026-05-27"
};

// News Data
const newsData = [
  {
    headline_bn: "দানেশ শেখ লেনে কমিউনিটি খেলার মাঠ পরিষ্কার সম্পন্ন",
    headline_en: "Community Playground Cleaning Completed at Danesh Sheikh Lane",
    summary_bn: "রাম নবমী উদযাপন কমিটির উদ্যোগে দানেশ শেখ লেনে কমিউনিটি খেলার মাঠ পরিষ্কারের কাজ সফলভাবে সম্পন্ন হয়েছে।",
    summary_en: "Under the initiative of Ram Nabami Celebration Committee, community playground cleaning work at Danesh Sheikh Lane has been successfully completed.",
    category_bn: "উন্নয়ন",
    category_en: "Development",
    thumbnail: "/assets/garbage1.jpeg",
    facebookLink: "",
    isPublished: true
  },
  {
    headline_bn: "৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামত",
    headline_en: "Underground Drainage Repair at Ward 39",
    summary_bn: "দক্ষিণ হাওড়ার ৩৯ নং ওয়ার্ডে আন্ডারগ্রাউন্ড ড্রেনেজ মেরামতের কাজ দ্রুত গতিতে এগিয়ে চলেছে।",
    summary_en: "Underground drainage repair work at Ward 39, South Howrah is progressing rapidly.",
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
    summary_en: "A new development project has started at Lalkuti Tetultala which will help in overall improvement of the area.",
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
    summary_en: "Ram Nabami Celebration Committee is organizing a victory celebration on the occasion of West Bengal's first Sanatani government.",
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
    summary_en: "Free health checkup camp organized at Danesh Sheikh Lane received overwhelming response.",
    category_bn: "স্বাস্থ্য",
    category_en: "Health",
    thumbnail: "https://picsum.photos/seed/healthcamp/800/600",
    facebookLink: "",
    isPublished: true
  },
  {
    headline_bn: "কমিটির সদস্যদের সাথে সাক্ষাৎ",
    headline_en: "Meeting with Committee Members",
    summary_bn: "রাম নবমী উদযাপন কমিটির সকল সদস্যদের সাথে মাসিক সভা অনুষ্ঠিত হয়েছে যেখানে আগামী কার্যক্রম নিয়ে আলোচনা করা হয়।",
    summary_en: "Monthly meeting was held with all members of Ram Nabami Celebration Committee where upcoming activities were discussed.",
    category_bn: "সাধারণ",
    category_en: "General",
    thumbnail: "https://picsum.photos/seed/meeting/800/600",
    facebookLink: "",
    isPublished: true
  }
];

async function seedMembers() {
  console.log('🔄 Seeding Members...');
  let added = 0;
  let skipped = 0;

  for (const member of officialMembers) {
    try {
      // Check for duplicate by name
      const q = query(collection(db, 'members'), where('name', '==', member.name));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'members'), {
          ...member,
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=random&color=fff&bold=true`,
          recognition: member.designation === 'Chairman' ? 'Founder' : '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        added++;
        console.log(`✅ Added: ${member.name}`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${member.name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${member.name}:`, error);
    }
  }

  console.log(`\n✅ Members Seeding Complete: ${added} added, ${skipped} skipped\n`);
}

async function seedWorks() {
  console.log('🔄 Seeding Works...');
  let added = 0;
  let skipped = 0;

  for (const work of officialWorks) {
    try {
      // Check for duplicate by title_bn
      const q = query(collection(db, 'works'), where('title_bn', '==', work.title_bn));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'works'), {
          ...work,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        added++;
        console.log(`✅ Added: ${work.title_en}`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${work.title_en}`);
      }
    } catch (error) {
      console.error(`❌ Error adding work:`, error);
    }
  }

  console.log(`\n✅ Works Seeding Complete: ${added} added, ${skipped} skipped\n`);
}

async function seedAgenda() {
  console.log('🔄 Seeding Agenda...');
  
  try {
    // Check if agenda exists
    const q = query(collection(db, 'agenda'), where('title_bn', '==', agendaData.title_bn));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, 'agenda'), {
        ...agendaData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Agenda Added: ${agendaData.title_bn}`);
    } else {
      console.log(`⏭️  Agenda already exists`);
    }
  } catch (error) {
    console.error(`❌ Error adding agenda:`, error);
  }
  
  console.log(`\n✅ Agenda Seeding Complete\n`);
}

async function seedNews() {
  console.log('🔄 Seeding News...');
  let added = 0;
  let skipped = 0;

  for (const news of newsData) {
    try {
      // Check for duplicate by headline_bn
      const q = query(collection(db, 'news'), where('headline_bn', '==', news.headline_bn));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'news'), {
          ...news,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        added++;
        console.log(`✅ Added: ${news.headline_en}`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${news.headline_en}`);
      }
    } catch (error) {
      console.error(`❌ Error adding news:`, error);
    }
  }

  console.log(`\n✅ News Seeding Complete: ${added} added, ${skipped} skipped\n`);
}

async function main() {
  console.log('🚀 Starting Data Seeding Process...\n');
  
  await seedMembers();
  await seedWorks();
  await seedAgenda();
  await seedNews();
  
  console.log('✅ All Data Seeding Complete!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
