export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
  subject: string;
  level: 'KSSR' | 'KSSM';
  grade: number;
}

export const quizQuestions: { [subject: string]: Question[] } = {
  english: [
    {
      id: 1,
      question: "What is the plural form of 'child'?",
      options: ["childs", "children", "childes", "child"],
      correctAnswer: 1,
      timeLimit: 30,
      points: 100,
      subject: "english",
      level: "KSSR",
      grade: 3
    },
    {
      id: 2,
      question: "Which word is a verb?",
      options: ["beautiful", "quickly", "running", "happy"],
      correctAnswer: 2,
      timeLimit: 25,
      points: 100,
      subject: "english",
      level: "KSSR",
      grade: 4
    },
    {
      id: 3,
      question: "What is the past tense of 'go'?",
      options: ["goed", "went", "gone", "going"],
      correctAnswer: 1,
      timeLimit: 30,
      points: 100,
      subject: "english",
      level: "KSSR",
      grade: 5
    }
  ],
  bahasa: [
    {
      id: 1,
      question: "Apakah kata ganti nama diri pertama?",
      options: ["saya", "awak", "dia", "kita"],
      correctAnswer: 0,
      timeLimit: 30,
      points: 100,
      subject: "bahasa",
      level: "KSSR",
      grade: 2
    },
    {
      id: 2,
      question: "Pilih ayat yang betul:",
      options: ["Saya pergi ke sekolah", "Saya pergi ke sekolah.", "saya pergi ke sekolah", "Saya pergi ke sekolah!"],
      correctAnswer: 1,
      timeLimit: 25,
      points: 100,
      subject: "bahasa",
      level: "KSSR",
      grade: 3
    },
    {
      id: 3,
      question: "Apakah imbuhan yang betul untuk 'makan'?",
      options: ["memakan", "dimakan", "termakan", "semua betul"],
      correctAnswer: 3,
      timeLimit: 30,
      points: 100,
      subject: "bahasa",
      level: "KSSR",
      grade: 4
    }
  ],
  maths: [
    {
      id: 1,
      question: "What is 15 + 27?",
      options: ["40", "41", "42", "43"],
      correctAnswer: 2,
      timeLimit: 30,
      points: 100,
      subject: "maths",
      level: "KSSR",
      grade: 2
    },
    {
      id: 2,
      question: "What is 8 × 7?",
      options: ["54", "56", "58", "60"],
      correctAnswer: 1,
      timeLimit: 25,
      points: 100,
      subject: "maths",
      level: "KSSR",
      grade: 3
    },
    {
      id: 3,
      question: "What is 144 ÷ 12?",
      options: ["10", "11", "12", "13"],
      correctAnswer: 2,
      timeLimit: 30,
      points: 100,
      subject: "maths",
      level: "KSSR",
      grade: 4
    },
    {
      id: 4,
      question: "What is the area of a rectangle with length 8cm and width 5cm?",
      options: ["13cm²", "26cm²", "40cm²", "45cm²"],
      correctAnswer: 2,
      timeLimit: 35,
      points: 100,
      subject: "maths",
      level: "KSSM",
      grade: 7
    },
    {
      id: 5,
      question: "Solve for x: 2x + 5 = 13",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"],
      correctAnswer: 1,
      timeLimit: 40,
      points: 100,
      subject: "maths",
      level: "KSSM",
      grade: 8
    }
  ],
  science: [
    {
      id: 1,
      question: "Which part of the plant makes food?",
      options: ["Root", "Stem", "Leaf", "Flower"],
      correctAnswer: 2,
      timeLimit: 30,
      points: 100,
      subject: "science",
      level: "KSSR",
      grade: 3
    },
    {
      id: 2,
      question: "What is the process by which plants make their own food?",
      options: ["Respiration", "Photosynthesis", "Digestion", "Circulation"],
      correctAnswer: 1,
      timeLimit: 25,
      points: 100,
      subject: "science",
      level: "KSSR",
      grade: 4
    },
    {
      id: 3,
      question: "Which gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correctAnswer: 2,
      timeLimit: 30,
      points: 100,
      subject: "science",
      level: "KSSR",
      grade: 5
    },
    {
      id: 4,
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "NaCl", "O2"],
      correctAnswer: 0,
      timeLimit: 25,
      points: 100,
      subject: "science",
      level: "KSSM",
      grade: 7
    },
    {
      id: 5,
      question: "Which organelle is known as the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
      correctAnswer: 1,
      timeLimit: 30,
      points: 100,
      subject: "science",
      level: "KSSM",
      grade: 8
    }
  ],
  sejarah: [
    {
      id: 1,
      question: "Siapakah Bapa Kemerdekaan Malaysia?",
      options: ["Tunku Abdul Rahman", "Mahathir Mohamad", "Abdul Razak Hussein", "Onn Jaafar"],
      correctAnswer: 0,
      timeLimit: 30,
      points: 100,
      subject: "sejarah",
      level: "KSSM",
      grade: 7
    },
    {
      id: 2,
      question: "Bilakah tarikh kemerdekaan Malaysia?",
      options: ["31 Ogos 1957", "16 September 1963", "31 Ogos 1963", "16 September 1957"],
      correctAnswer: 0,
      timeLimit: 35,
      points: 100,
      subject: "sejarah",
      level: "KSSM",
      grade: 8
    },
    {
      id: 3,
      question: "Apakah nama kerajaan Melayu yang terawal di Tanah Melayu?",
      options: ["Kedah Tua", "Langkasuka", "Gangga Negara", "Kedah Tua"],
      correctAnswer: 0,
      timeLimit: 30,
      points: 100,
      subject: "sejarah",
      level: "KSSM",
      grade: 9
    }
  ]
};

export const getQuestionsBySubject = (subject: string, count: number = 3): Question[] => {
  const subjectQuestions = quizQuestions[subject] || [];
  // Shuffle and return the requested number of questions
  const shuffled = [...subjectQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
