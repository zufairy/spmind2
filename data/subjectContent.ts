export interface SubjectContent {
  dailyBrainBoost: {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    activities: string[];
    tips: string[];
  };
  memoryStretch: {
    title: string;
    subtitle: string;
    description: string;
    difficulty: string;
    estimatedTime: string;
  };
  jomTanya: {
    title: string;
    subtitle: string;
    description: string;
    quickQuestions: string[];
    exampleQuestions: string[];
  };
}

export const subjectContentData: { [subject: string]: SubjectContent } = {
  english: {
    dailyBrainBoost: {
      title: "Daily Brain Boost",
      subtitle: "English Language Mastery",
      description: "Enhance your English skills with daily exercises, vocabulary building, and grammar practice tailored for Malaysian students.",
      image: "1.jpg",
      activities: [
        "Vocabulary Builder - Learn 5 new words daily",
        "Grammar Challenge - Practice tenses and sentence structure",
        "Reading Comprehension - Improve understanding skills",
        "Writing Practice - Express ideas clearly in English",
        "Speaking Exercise - Build confidence in conversation"
      ],
      tips: [
        "Read English newspapers daily",
        "Watch English movies with subtitles",
        "Practice speaking with friends",
        "Keep a vocabulary journal",
        "Use English in daily conversations"
      ]
    },
    memoryStretch: {
      title: "Memory Stretch",
      subtitle: "English Quiz Challenge",
      description: "Test your English knowledge with questions covering grammar, vocabulary, comprehension, and writing skills.",
      difficulty: "Beginner to Advanced",
      estimatedTime: "5-10 minutes"
    },
    jomTanya: {
      title: "Jom Tanya",
      subtitle: "Ask Anything About English",
      description: "Get instant help with English homework, grammar questions, vocabulary, and writing tips from our AI tutor.",
      quickQuestions: [
        "What's the difference between 'affect' and 'effect'?",
        "How do I write a good essay introduction?",
        "Can you explain present perfect tense?",
        "What are some synonyms for 'beautiful'?",
        "How do I improve my English pronunciation?"
      ],
      exampleQuestions: [
        "Help me understand this English passage",
        "Check my grammar in this sentence",
        "Explain this English idiom",
        "How do I write a formal letter?",
        "What's the meaning of this word?"
      ]
    }
  },
  bahasa: {
    dailyBrainBoost: {
      title: "Daily Brain Boost",
      subtitle: "Bahasa Malaysia Excellence",
      description: "Strengthen your Bahasa Malaysia skills with daily exercises, vocabulary expansion, and grammar mastery.",
      image: "1.jpg",
      activities: [
        "Kosa Kata Baru - Pelajari 5 perkataan baru setiap hari",
        "Tatabahasa - Latihan imbuhan dan ayat",
        "Pemahaman Membaca - Tingkatkan kemahiran membaca",
        "Latihan Menulis - Ungkapkan idea dengan jelas",
        "Latihan Bertutur - Bina keyakinan dalam perbualan"
      ],
      tips: [
        "Baca surat khabar Bahasa Malaysia setiap hari",
        "Tonton drama Malaysia dengan sari kata",
        "Berlatih bercakap dengan keluarga",
        "Simpan jurnal perkataan baru",
        "Gunakan Bahasa Malaysia dalam perbualan harian"
      ]
    },
    memoryStretch: {
      title: "Memory Stretch",
      subtitle: "Kuiz Bahasa Malaysia",
      description: "Uji pengetahuan Bahasa Malaysia anda dengan soalan yang meliputi tatabahasa, kosa kata, dan pemahaman.",
      difficulty: "Pemula hingga Lanjutan",
      estimatedTime: "5-10 minit"
    },
    jomTanya: {
      title: "Jom Tanya",
      subtitle: "Tanya Apa Sahaja Tentang Bahasa Malaysia",
      description: "Dapatkan bantuan segera dengan kerja rumah Bahasa Malaysia, soalan tatabahasa, dan tips menulis dari tutor AI kami.",
      quickQuestions: [
        "Apakah perbezaan antara 'imbuhan' dan 'kata imbuhan'?",
        "Bagaimana cara menulis pendahuluan karangan yang baik?",
        "Boleh terangkan tentang kata adjektif?",
        "Apakah beberapa sinonim untuk 'cantik'?",
        "Bagaimana cara memperbaiki sebutan Bahasa Malaysia?"
      ],
      exampleQuestions: [
        "Tolong bantu saya faham petikan Bahasa Malaysia ini",
        "Semak tatabahasa dalam ayat ini",
        "Terangkan peribahasa Bahasa Malaysia ini",
        "Bagaimana cara menulis surat rasmi?",
        "Apakah maksud perkataan ini?"
      ]
    }
  },
  maths: {
    dailyBrainBoost: {
      title: "Daily Brain Boost",
      subtitle: "Mathematics Mastery",
      description: "Sharpen your mathematical skills with daily problem-solving, concept reinforcement, and calculation practice.",
      image: "1.jpg",
      activities: [
        "Number Crunching - Practice basic arithmetic daily",
        "Problem Solving - Solve word problems step by step",
        "Formula Practice - Master important mathematical formulas",
        "Geometry Explorer - Learn shapes and measurements",
        "Algebra Adventure - Understand variables and equations"
      ],
      tips: [
        "Practice mental math daily",
        "Solve at least 5 problems every day",
        "Understand the concept, not just the answer",
        "Use visual aids and diagrams",
        "Review previous lessons regularly"
      ]
    },
    memoryStretch: {
      title: "Memory Stretch",
      subtitle: "Math Quiz Challenge",
      description: "Test your mathematical knowledge with questions covering arithmetic, algebra, geometry, and problem-solving.",
      difficulty: "Basic to Advanced",
      estimatedTime: "5-15 minutes"
    },
    jomTanya: {
      title: "Jom Tanya",
      subtitle: "Ask Anything About Mathematics",
      description: "Get instant help with math problems, formulas, concepts, and step-by-step solutions from our AI tutor.",
      quickQuestions: [
        "How do I solve this algebra equation?",
        "What's the formula for area of a circle?",
        "Can you explain fractions step by step?",
        "How do I find the percentage?",
        "What's the difference between mean and median?"
      ],
      exampleQuestions: [
        "Help me solve this math problem",
        "Explain this mathematical concept",
        "Show me the step-by-step solution",
        "What formula should I use here?",
        "How do I check my answer?"
      ]
    }
  },
  science: {
    dailyBrainBoost: {
      title: "Daily Brain Boost",
      subtitle: "Science Discovery",
      description: "Explore the wonders of science with daily experiments, concept learning, and scientific thinking practice.",
      image: "1.jpg",
      activities: [
        "Science Facts - Learn amazing scientific facts daily",
        "Experiment Time - Try simple home experiments",
        "Concept Builder - Understand scientific principles",
        "Nature Explorer - Observe and learn from nature",
        "Science Quiz - Test your scientific knowledge"
      ],
      tips: [
        "Observe the world around you scientifically",
        "Ask 'why' and 'how' questions",
        "Try simple experiments at home",
        "Read science articles and books",
        "Connect science to daily life"
      ]
    },
    memoryStretch: {
      title: "Memory Stretch",
      subtitle: "Science Quiz Challenge",
      description: "Test your scientific knowledge with questions covering biology, chemistry, physics, and earth sciences.",
      difficulty: "Elementary to High School",
      estimatedTime: "5-15 minutes"
    },
    jomTanya: {
      title: "Jom Tanya",
      subtitle: "Ask Anything About Science",
      description: "Get instant help with science homework, experiments, concepts, and explanations from our AI tutor.",
      quickQuestions: [
        "How does photosynthesis work?",
        "What's the difference between elements and compounds?",
        "Can you explain the water cycle?",
        "How do magnets work?",
        "What causes day and night?"
      ],
      exampleQuestions: [
        "Help me understand this science concept",
        "Explain this experiment step by step",
        "What's the scientific method?",
        "How do I write a science report?",
        "What are the properties of this material?"
      ]
    }
  },
  sejarah: {
    dailyBrainBoost: {
      title: "Daily Brain Boost",
      subtitle: "Sejarah Malaysia",
      description: "Discover Malaysia's rich history with daily lessons, historical facts, and cultural understanding.",
      image: "1.jpg",
      activities: [
        "Fakta Sejarah - Pelajari fakta sejarah Malaysia setiap hari",
        "Peta Minda - Buat peta minda untuk topik sejarah",
        "Kronologi - Fahami urutan peristiwa sejarah",
        "Tokoh Sejarah - Kenali tokoh-tokoh penting Malaysia",
        "Budaya Malaysia - Pelajari tentang budaya dan tradisi"
      ],
      tips: [
        "Baca buku sejarah Malaysia",
        "Lawati muzium dan tempat bersejarah",
        "Tonton dokumentari sejarah",
        "Buat nota ringkas untuk setiap topik",
        "Bincang dengan keluarga tentang sejarah"
      ]
    },
    memoryStretch: {
      title: "Memory Stretch",
      subtitle: "Kuiz Sejarah Malaysia",
      description: "Uji pengetahuan sejarah Malaysia anda dengan soalan yang meliputi tokoh, peristiwa, dan tarikh penting.",
      difficulty: "Tingkatan 1 hingga Tingkatan 5",
      estimatedTime: "5-10 minit"
    },
    jomTanya: {
      title: "Jom Tanya",
      subtitle: "Tanya Apa Sahaja Tentang Sejarah",
      description: "Dapatkan bantuan segera dengan kerja rumah sejarah, soalan tentang tokoh, dan penjelasan peristiwa dari tutor AI kami.",
      quickQuestions: [
        "Siapakah Bapa Kemerdekaan Malaysia?",
        "Bilakah tarikh kemerdekaan Malaysia?",
        "Apakah peristiwa penting pada 13 Mei 1969?",
        "Siapakah tokoh yang mengetuai perjuangan kemerdekaan?",
        "Apakah kepentingan Perjanjian Pangkor 1874?"
      ],
      exampleQuestions: [
        "Tolong terangkan tentang peristiwa ini",
        "Siapakah tokoh sejarah ini?",
        "Apakah kepentingan tarikh ini?",
        "Bagaimana peristiwa ini mempengaruhi Malaysia?",
        "Apakah sebab-sebab peristiwa ini berlaku?"
      ]
    }
  }
};

export const getSubjectContent = (subject: string): SubjectContent => {
  return subjectContentData[subject] || subjectContentData.english;
};

export const getSubjectDisplayName = (subject: string, language: 'en' | 'ms' = 'en'): string => {
  const displayNames: { [key: string]: { en: string; ms: string } } = {
    english: { en: "English", ms: "Bahasa Inggeris" },
    bahasa: { en: "Bahasa Malaysia", ms: "Bahasa Malaysia" },
    maths: { en: "Mathematics", ms: "Matematik" },
    science: { en: "Science", ms: "Sains" },
    sejarah: { en: "History", ms: "Sejarah" }
  };
  return displayNames[subject]?.[language] || subject;
};
