import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Animated as RNAnimated } from 'react-native';
import {
  Camera as CameraIcon,
  MessageSquare,
  Grid3X3,
  Zap,
  X,
  Check,
  History,
  Image as ImageIcon,
  Send,
  Sparkles,
  Paperclip,
  Phone,
  ArrowLeft,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { aiService } from '../../services/aiService';
import { languageService } from '../../services/languageService';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Subject } from '../../components/SubjectSlider';
import CameraSubjectOverlay from '../../components/CameraSubjectOverlay';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Component to render formatted text with bold and underline
const FormattedText = ({ text, style }: { text: string; style?: any }) => {
  const parts = text.split(/(\*\*.*?\*\*|_.*?_)/g);
  
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={[style, { 
              fontWeight: '700', 
              color: '#000000',
              fontFamily: 'Inter-Bold',
            }]}>
              {part.slice(2, -2)}
            </Text>
          );
        } else if (part.startsWith('_') && part.endsWith('_')) {
          return (
            <Text key={index} style={[style, { 
              textDecorationLine: 'underline', 
              color: '#FF8C00',
              fontWeight: '600',
            }]}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

export default function SolverScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const pageFadeAnim = useRef(new RNAnimated.Value(0)).current;

  // Page fade-in animation on mount (faster for better UX)
  useEffect(() => {
    RNAnimated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Reduced from 300ms for faster load
      useNativeDriver: true,
    }).start();
  }, []);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    loadingContainer: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    loadingText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    permissionContainer: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    permissionTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    permissionText: {
      color: isDark ? '#999999' : '#666666',
    },
    historyTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    historyQuestion: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    historyTime: {
      color: isDark ? '#999999' : '#666666',
    },
    chatContainer: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    },
    chatInterface: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    chatHeader: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    chatUsername: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    chatStatus: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    backButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    backIcon: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    messageText: {
      color: '#000000',
    },
    userMessageText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    aiMessageText: {
      color: '#000000',
    },
    chatInput: {
      backgroundColor: 'transparent',
      color: '#000000',
      borderColor: 'transparent',
    },
    quickQuestionBubble: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    quickQuestionBubbleText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };
  
  // State management
  const [activeTab, setActiveTab] = useState<'image' | 'chat'>('image');
  const [activeSubject, setActiveSubject] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    image?: string;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ms' | 'mixed'>('en');
  const [showPresetMessages, setShowPresetMessages] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messageSound, setMessageSound] = useState<Audio.Sound | null>(null);

  // NEW: Selected subject state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [pendingSubjectSwitch, setPendingSubjectSwitch] = useState<{
    detectedSubject: string;
    userMessage: string;
  } | null>(null);

  // Subject selection options
  const subjectOptions = [
    { key: 'mathematics', name: 'Mathematics', icon: '📐', malayName: 'Matematik' },
    { key: 'science', name: 'Science', icon: '🔬', malayName: 'Sains' },
    { key: 'english', name: 'English', icon: '📘', malayName: 'Bahasa Inggeris' },
    { key: 'bahasa_melayu', name: 'Bahasa Melayu', icon: '📖', malayName: 'Bahasa Melayu' },
    { key: 'sejarah', name: 'Sejarah', icon: '📜', malayName: 'Sejarah' },
  ];

  // Subject detection keywords
  const subjectKeywords = {
    mathematics: [
      // English terms
      'math', 'mathematics', 'algebra', 'geometry', 'calculus', 'equation', 'solve', 'calculate',
      'number', 'fraction', 'decimal', 'percentage', 'angle', 'triangle', 'circle', 'graph',
      'formula', 'theorem', 'pythagoras', 'trigonometry', 'statistics', 'probability',
      'addition', 'subtraction', 'multiplication', 'division', 'plus', 'minus', 'times', 'divide',
      'square', 'cube', 'root', 'power', 'exponent', 'logarithm', 'derivative', 'integral',
      'polynomial', 'quadratic', 'linear', 'function', 'variable', 'constant', 'coefficient',
      'radius', 'diameter', 'circumference', 'area', 'perimeter', 'volume', 'surface area',
      'parallel', 'perpendicular', 'intersect', 'congruent', 'similar', 'ratio', 'proportion',
      'mean', 'median', 'mode', 'range', 'standard deviation', 'variance', 'correlation',
      'permutation', 'combination', 'factorial', 'sequence', 'series', 'arithmetic', 'geometric',
      'explain', 'how to', 'what is', 'show me', 'calculate', 'find', 'determine', 'prove',
      
      // Malay terms
      'matematik', 'nombor', 'pecahan', 'peratusan', 'sudut', 'segi tiga', 'bulatan', 'graf',
      'tambah', 'tolak', 'darab', 'bahagi', 'tambah', 'tolak', 'kali', 'bahagi',
      'kuasa dua', 'kuasa tiga', 'punca', 'kuasa', 'eksponen', 'logaritma', 'terbitan', 'kamiran',
      'polinomial', 'kuadratik', 'linear', 'fungsi', 'pembolehubah', 'pemalar', 'pekali',
      'jejari', 'diameter', 'lilitan', 'luas', 'perimeter', 'isipadu', 'luas permukaan',
      'selari', 'serenjang', 'bersilang', 'kongruen', 'serupa', 'nisbah', 'kadaran',
      'min', 'median', 'mod', 'julat', 'sisihan piawai', 'varians', 'korelasi',
      'pilih atur', 'gabungan', 'faktorial', 'jujukan', 'siri', 'aritmetik', 'geometri',
      'terangkan', 'bagaimana', 'apakah', 'tunjukkan', 'kira', 'cari', 'tentukan', 'buktikan'
    ],
    science: [
      // English terms
      'science', 'sejarah', 'chemistry', 'biology', 'experiment', 'atom', 'molecule', 'cell',
      'force', 'energy', 'reaction', 'element', 'compound', 'organism', 'evolution', 'gravity',
      'blood', 'heart', 'brain', 'lung', 'liver', 'kidney', 'muscle', 'bone', 'nerve',
      'digestive', 'respiratory', 'circulatory', 'nervous', 'endocrine', 'reproductive',
      'photosynthesis', 'respiration', 'metabolism', 'ecosystem', 'habitat', 'species',
      'plant', 'animal', 'bacteria', 'virus', 'fungus', 'protist', 'monera',
      'chlorophyll', 'glucose', 'oxygen', 'carbon dioxide', 'water', 'mineral', 'vitamin',
      'protein', 'carbohydrate', 'fat', 'enzyme', 'hormone', 'antibody', 'immunity',
      'explain', 'describe', 'how', 'why', 'what', 'about', 'concerning',
      'structure', 'function', 'process', 'mechanism', 'characteristics', 'properties', 'type',
      'organ', 'tissue', 'cell', 'membrane', 'cytoplasm', 'nucleus', 'mitochondria',
      'system', 'body', 'human', 'living', 'life', 'nature', 'environment',
      'temperature', 'pressure', 'density', 'mass', 'volume', 'weight', 'speed', 'velocity',
      'acceleration', 'momentum', 'friction', 'magnetism', 'electricity', 'light', 'sound',
      'wave', 'frequency', 'amplitude', 'wavelength', 'reflection', 'refraction', 'diffraction',
      'acid', 'base', 'ph', 'solution', 'mixture', 'pure substance', 'matter', 'particle',
      'electron', 'proton', 'neutron', 'ion', 'bond', 'covalent', 'ionic', 'metallic',
      'periodic table', 'atomic number', 'atomic mass', 'isotope', 'radioactive', 'decay',
      'genetics', 'dna', 'rna', 'gene', 'chromosome', 'inheritance', 'mutation', 'evolution',
      'natural selection', 'adaptation', 'biodiversity', 'food chain', 'food web', 'energy flow',
      'climate', 'weather', 'atmosphere', 'hydrosphere', 'lithosphere', 'biosphere',
      'earth', 'sun', 'moon', 'planet', 'solar system', 'galaxy', 'universe', 'space',
      'rock', 'mineral', 'soil', 'erosion', 'weathering', 'deposition', 'sediment',
      'fossil', 'geological time', 'era', 'period', 'epoch', 'extinction', 'paleontology',
      
      // Malay terms
      'sains', 'fizik', 'kimia', 'biologi', 'eksperimen', 'atom', 'molekul', 'sel', 'tenaga',
      'sistem', 'darah', 'jantung', 'otak', 'paru-paru', 'hati', 'buah pinggang', 'otot', 'tulang', 'saraf',
      'pencernaan', 'pernafasan', 'peredaran', 'sistem saraf', 'endokrin', 'pembiakan',
      'fotosintesis', 'respirasi', 'metabolisme', 'ekosistem', 'habitat', 'spesies',
      'tumbuhan', 'haiwan', 'bakteria', 'virus', 'fungi', 'protista', 'monera',
      'klorofil', 'glukosa', 'oksigen', 'karbon dioksida', 'air', 'mineral', 'vitamin',
      'protein', 'karbohidrat', 'lemak', 'enzim', 'hormon', 'antibodi', 'imuniti',
      'terangkan', 'jelaskan', 'bagaimana', 'mengapa', 'apakah', 'berkenaan', 'tentang',
      'struktur', 'fungsi', 'proses', 'mekanisme', 'ciri-ciri', 'sifat', 'jenis',
      'organ', 'tisu', 'sel', 'membran', 'sitoplasma', 'nukleus', 'mitokondria',
      'badan', 'manusia', 'hidup', 'kehidupan', 'alam', 'persekitaran',
      'suhu', 'tekanan', 'ketumpatan', 'jisim', 'isipadu', 'berat', 'kelajuan', 'halaju',
      'pecutan', 'momentum', 'geseran', 'magnetisme', 'elektrik', 'cahaya', 'bunyi',
      'gelombang', 'frekuensi', 'amplitud', 'panjang gelombang', 'pantulan', 'pembiasan', 'pembelauan',
      'asid', 'bes', 'ph', 'larutan', 'campuran', 'bahan tulen', 'jirim', 'zarah',
      'elektron', 'proton', 'neutron', 'ion', 'ikatan', 'kovalen', 'ionik', 'logam',
      'jadual berkala', 'nombor atom', 'jisim atom', 'isotop', 'radioaktif', 'pereputan',
      'genetik', 'dna', 'rna', 'gen', 'kromosom', 'warisan', 'mutasi', 'evolusi',
      'pemilihan semula jadi', 'adaptasi', 'kepelbagaian biologi', 'rantai makanan', 'web makanan', 'aliran tenaga',
      'iklim', 'cuaca', 'atmosfera', 'hidrosfera', 'litosfera', 'biosfera',
      'bumi', 'matahari', 'bulan', 'planet', 'sistem suria', 'galaksi', 'alam semesta', 'angkasa',
      'batu', 'mineral', 'tanah', 'hakisan', 'luluhawa', 'pemendapan', 'sedimen',
      'fosil', 'masa geologi', 'era', 'tempoh', 'epok', 'kepupusan', 'paleontologi'
    ],
    english: [
      // English terms
      'english', 'grammar', 'vocabulary', 'essay', 'writing', 'reading', 'comprehension',
      'literature', 'poem', 'story', 'novel', 'paragraph', 'sentence', 'verb', 'noun',
      'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection',
      'subject', 'predicate', 'object', 'clause', 'phrase', 'tense', 'voice', 'mood',
      'singular', 'plural', 'possessive', 'comparative', 'superlative', 'infinitive',
      'gerund', 'participle', 'auxiliary', 'modal', 'transitive', 'intransitive',
      'active', 'passive', 'direct', 'indirect', 'speech', 'reported', 'quotation',
      'punctuation', 'comma', 'period', 'question mark', 'exclamation', 'colon', 'semicolon',
      'apostrophe', 'quotation marks', 'parentheses', 'brackets', 'hyphen', 'dash',
      'capitalization', 'spelling', 'pronunciation', 'accent', 'stress', 'syllable',
      'rhyme', 'rhythm', 'meter', 'stanza', 'verse', 'prose', 'fiction', 'non-fiction',
      'character', 'plot', 'setting', 'theme', 'conflict', 'resolution', 'climax',
      'narrator', 'point of view', 'first person', 'third person', 'omniscient',
      'dialogue', 'monologue', 'soliloquy', 'aside', 'stage directions',
      'metaphor', 'simile', 'personification', 'hyperbole', 'irony', 'symbolism',
      'alliteration', 'assonance', 'consonance', 'onomatopoeia', 'repetition',
      'summary', 'paraphrase', 'analysis', 'critique', 'review', 'commentary',
      'persuasive', 'argumentative', 'descriptive', 'narrative', 'expository',
      'thesis', 'topic sentence', 'supporting details', 'conclusion', 'introduction',
      'transition', 'coherence', 'unity', 'emphasis', 'variety', 'clarity',
      'formal', 'informal', 'academic', 'colloquial', 'slang', 'jargon',
      'synonym', 'antonym', 'homonym', 'homophone', 'homograph', 'etymology',
      'prefix', 'suffix', 'root word', 'compound word', 'contraction', 'abbreviation',
      'idiom', 'proverb', 'cliché', 'euphemism', 'oxymoron', 'paradox',
      'explain', 'describe', 'analyze', 'compare', 'contrast', 'evaluate', 'interpret',
      'summarize', 'paraphrase', 'quote', 'cite', 'reference', 'bibliography',
      
      // Malay terms
      'bahasa inggeris', 'tatabahasa', 'kosa kata', 'karangan', 'bacaan', 'pemahaman',
      'kata sifat', 'kata keterangan', 'kata ganti', 'kata sendi', 'kata hubung', 'kata seru',
      'subjek', 'predikat', 'objek', 'klausa', 'frasa', 'kala', 'suara', 'mod',
      'tunggal', 'jamak', 'milik', 'perbandingan', 'superlatif', 'infinitif',
      'gerund', 'partisipel', 'bantu', 'modal', 'transitif', 'intransitif',
      'aktif', 'pasif', 'langsung', 'tidak langsung', 'ucapan', 'dilaporkan', 'petikan',
      'tanda baca', 'koma', 'noktah', 'tanda tanya', 'tanda seru', 'titik bertindih', 'titik koma',
      'apostrof', 'tanda petik', 'kurungan', 'kurungan siku', 'tanda sempang', 'tanda sempang panjang',
      'huruf besar', 'ejaan', 'sebutan', 'aksen', 'tekanan', 'suku kata',
      'rima', 'irama', 'meter', 'rangkap', 'bait', 'prosa', 'fiksyen', 'bukan fiksyen',
      'watak', 'plot', 'latar', 'tema', 'konflik', 'penyelesaian', 'klimaks',
      'pencerita', 'sudut pandangan', 'orang pertama', 'orang ketiga', 'maha tahu',
      'dialog', 'monolog', 'solilokui', 'sampingan', 'arahan pentas',
      'metafora', 'perumpamaan', 'personifikasi', 'hiperbola', 'ironi', 'simbolisme',
      'aliterasi', 'asonansi', 'konsonansi', 'onomatopeia', 'pengulangan',
      'ringkasan', 'parafrasa', 'analisis', 'kritik', 'ulasan', 'komentar',
      'persuasi', 'argumentatif', 'deskriptif', 'naratif', 'ekspositori',
      'tesis', 'ayat topik', 'butiran sokongan', 'kesimpulan', 'pengenalan',
      'peralihan', 'koheren', 'perpaduan', 'penekanan', 'kepelbagaian', 'kejelasan',
      'formal', 'tidak formal', 'akademik', 'kolokial', 'slanga', 'jargon',
      'sinonim', 'antonim', 'homonim', 'homofon', 'homograf', 'etimologi',
      'awalan', 'akhiran', 'kata akar', 'kata majmuk', 'singkatan', 'kependekan',
      'idiom', 'peribahasa', 'klise', 'eufemisme', 'oksimoron', 'paradoks',
      'terangkan', 'huraikan', 'analisis', 'bandingkan', 'bezakan', 'nilai', 'tafsirkan',
      'ringkaskan', 'parafrasa', 'petik', 'rujuk', 'rujukan', 'bibliografi'
    ],
    bahasa_melayu: [
      // English terms
      'malay', 'bahasa melayu', 'malaysian language', 'national language',
      'malay grammar', 'malay literature', 'malay poetry', 'malay writing',
      'malay culture', 'malay tradition', 'malay customs', 'malay heritage',
      'malay history', 'malay civilization', 'malay society', 'malay identity',
      
      // Malay terms
      'bahasa melayu', 'tatabahasa', 'kosa kata', 'karangan', 'bacaan', 'pemahaman',
      'sastera', 'puisi', 'cerita', 'novel', 'perenggan', 'ayat', 'kata kerja', 'kata nama',
      'melayu', 'malaysia', 'kebangsaan', 'kata sifat', 'kata keterangan', 'kata ganti',
      'kata sendi', 'kata hubung', 'kata seru', 'kata bantu', 'kata pemeri',
      'subjek', 'predikat', 'objek', 'pelengkap', 'keterangan', 'klausa', 'frasa',
      'ayat aktif', 'ayat pasif', 'ayat tanya', 'ayat perintah', 'ayat seruan',
      'ayat majmuk', 'ayat tunggal', 'ayat kompleks', 'ayat majmuk gabungan',
      'tanda baca', 'koma', 'noktah', 'tanda tanya', 'tanda seru', 'tanda petik',
      'huruf besar', 'huruf kecil', 'ejaan', 'sebutan', 'intonasi', 'aksen',
      'rima', 'irama', 'sajak', 'pantun', 'syair', 'gurindam', 'seloka',
      'peribahasa', 'simpulan bahasa', 'bidalan', 'kata-kata hikmat',
      'cerita rakyat', 'dongeng', 'legenda', 'mitos', 'epik', 'hikayat',
      'novel', 'cerpen', 'drama', 'teater', 'skrip', 'dialog', 'monolog',
      'watak', 'plot', 'latar', 'tema', 'konflik', 'klimaks', 'penyelesaian',
      'pencerita', 'sudut pandangan', 'orang pertama', 'orang ketiga',
      'metafora', 'perumpamaan', 'personifikasi', 'hiperbola', 'ironi',
      'aliterasi', 'asonansi', 'pengulangan', 'kontras', 'perbandingan',
      'ringkasan', 'sinopsis', 'analisis', 'kritik', 'ulasan', 'komentar',
      'karangan', 'esei', 'laporan', 'surat', 'memorandum', 'minit mesyuarat',
      'terangkan', 'huraikan', 'jelaskan', 'analisis', 'bandingkan', 'bezakan',
      'nilai', 'tafsirkan', 'ringkaskan', 'parafrasa', 'petik', 'rujuk'
    ],
    sejarah: [
      // English terms
      'history', 'historical', 'ancient', 'war', 'battle', 'kingdom', 'empire',
      'independence', 'colonization', 'revolution', 'timeline', 'century', 'era', 'period',
      'civilization', 'culture', 'society', 'government', 'politics', 'economy',
      'trade', 'commerce', 'agriculture', 'industry', 'technology', 'innovation',
      'exploration', 'discovery', 'conquest', 'invasion', 'migration', 'settlement',
      'treaty', 'agreement', 'alliance', 'conflict', 'peace', 'diplomacy',
      'monarchy', 'democracy', 'republic', 'dictatorship', 'federation', 'confederation',
      'constitution', 'law', 'rights', 'freedom', 'justice', 'equality',
      'religion', 'belief', 'faith', 'worship', 'ritual', 'ceremony', 'tradition',
      'art', 'architecture', 'literature', 'music', 'dance', 'theater', 'sculpture',
      'education', 'learning', 'knowledge', 'wisdom', 'philosophy', 'science',
      'medicine', 'healing', 'health', 'disease', 'epidemic', 'pandemic',
      'transportation', 'communication', 'navigation', 'sailing', 'flying',
      'invention', 'discovery', 'research', 'experiment', 'observation',
      'document', 'record', 'archive', 'manuscript', 'inscription', 'artifact',
      'archaeology', 'excavation', 'ruins', 'monument', 'memorial', 'museum',
      'biography', 'autobiography', 'memoir', 'chronicle', 'annals', 'journal',
      'primary source', 'secondary source', 'evidence', 'proof', 'testimony',
      'interpretation', 'analysis', 'evaluation', 'criticism', 'perspective',
      'cause', 'effect', 'consequence', 'result', 'outcome', 'impact',
      'significance', 'importance', 'relevance', 'influence', 'legacy',
      'heritage', 'tradition', 'custom', 'practice', 'institution',
      'explain', 'describe', 'analyze', 'compare', 'contrast', 'evaluate',
      'summarize', 'synthesize', 'interpret', 'critique', 'assess',
      
      // Malay terms
      'sejarah', 'sejarah malaysia', 'kerajaan', 'empayar', 'kemerdekaan', 'penjajahan',
      'tamadun', 'budaya', 'masyarakat', 'kerajaan', 'politik', 'ekonomi',
      'perdagangan', 'perniagaan', 'pertanian', 'perindustrian', 'teknologi', 'inovasi',
      'penjelajahan', 'penemuan', 'penaklukan', 'pencerobohan', 'migrasi', 'penempatan',
      'perjanjian', 'persetujuan', 'perikatan', 'konflik', 'keamanan', 'diplomasi',
      'monarki', 'demokrasi', 'republik', 'diktator', 'persekutuan', 'konfederasi',
      'perlembagaan', 'undang-undang', 'hak', 'kebebasan', 'keadilan', 'kesaksamaan',
      'agama', 'kepercayaan', 'iman', 'ibadat', 'ritual', 'upacara', 'tradisi',
      'seni', 'seni bina', 'kesusasteraan', 'muzik', 'tarian', 'teater', 'arca',
      'pendidikan', 'pembelajaran', 'pengetahuan', 'kebijaksanaan', 'falsafah', 'sains',
      'perubatan', 'penyembuhan', 'kesihatan', 'penyakit', 'wabak', 'pandemik',
      'pengangkutan', 'komunikasi', 'navigasi', 'pelayaran', 'penerbangan',
      'ciptaan', 'penemuan', 'penyelidikan', 'eksperimen', 'pemerhatian',
      'dokumen', 'rekod', 'arkib', 'manuskrip', 'tulisan', 'artifak',
      'arkeologi', 'ekskavasi', 'runtuhan', 'monumen', 'peringatan', 'muzium',
      'biografi', 'autobiografi', 'memoir', 'kronik', 'annal', 'jurnal',
      'sumber utama', 'sumber sekunder', 'bukti', 'pembuktian', 'kesaksian',
      'tafsiran', 'analisis', 'penilaian', 'kritikan', 'perspektif',
      'sebab', 'kesan', 'akibat', 'hasil', 'hasil', 'impak',
      'kepentingan', 'relevan', 'pengaruh', 'warisan',
      'warisan', 'tradisi', 'adat', 'amalan', 'institusi',
      'terangkan', 'huraikan', 'analisis', 'bandingkan', 'bezakan', 'nilai',
      'ringkaskan', 'sintesis', 'tafsirkan', 'kritik', 'nilai'
    ]
  };

  // Test function to debug subject detection
  const testSubjectDetection = (message: string) => {
    const result = detectSubject(message);
    console.log(`Testing: "${message}" -> Detected: ${result}`);
    return result;
  };

  // Helper function to detect subject from user message
  const detectSubject = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    const subjectScores: { [key: string]: number } = {};
    
    // Initialize scores
    Object.keys(subjectKeywords).forEach(subject => {
      subjectScores[subject] = 0;
    });
    
    // Count keyword matches with weighted scoring
    Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          // Give higher weight to longer, more specific keywords
          const weight = keyword.length > 3 ? 2 : 1;
          subjectScores[subject] += weight;
        }
      });
    });
    
    // Find subject with highest score
    const maxScore = Math.max(...Object.values(subjectScores));
    const totalScore = Object.values(subjectScores).reduce((sum, score) => sum + score, 0);
    
    if (maxScore > 0) {
      const detectedSubject = Object.entries(subjectScores).find(([_, score]) => score === maxScore)?.[0];
      
      // Only return detection if confidence is high enough
      // Require at least 2 points and the detected subject should have significantly higher score
      const confidence = maxScore / Math.max(totalScore, 1);
      const isConfident = maxScore >= 2 && confidence > 0.4;
      
      // Debug logging
      console.log('Subject Detection Debug:', {
        message: lowerMessage,
        scores: subjectScores,
        detected: detectedSubject,
        maxScore,
        totalScore,
        confidence,
        isConfident
      });
      
      return isConfident ? (detectedSubject ?? null) : null;
    }
    
    return null;
  };

  // Animation values
  const tabSwitchValue = useSharedValue(0);
  const chatSlideValue = useSharedValue(0);
  const chatRef = useRef<ScrollView>(null);

  // Test subject detection on component mount
  useEffect(() => {
    // Set onboarding to false to enable proper chat responses
    aiService.setOnboardingComplete();
    
    // Test the specific example that was causing issues
    testSubjectDetection('terangkan berkenaan sistem darah');
    testSubjectDetection('what is photosynthesis');
    testSubjectDetection('bagaimana jantung berfungsi');
    testSubjectDetection('sejarah malaysia');
    
    // Test bilingual examples
    testSubjectDetection('how to solve quadratic equation');
    testSubjectDetection('bagaimana nak kira luas segi tiga');
    testSubjectDetection('explain the human digestive system');
    testSubjectDetection('terangkan sistem pencernaan manusia');
    testSubjectDetection('what is the past tense of go');
    testSubjectDetection('apakah kata kerja lampau untuk pergi');
    testSubjectDetection('explain malay grammar rules');
    testSubjectDetection('terangkan tatabahasa bahasa melayu');
    testSubjectDetection('what happened during world war 2');
    testSubjectDetection('apakah yang berlaku semasa perang dunia kedua');
    
    // Test mixed language examples
    testSubjectDetection('bagaimana nak calculate the area of circle');
    testSubjectDetection('what is the function of jantung in our body');
    testSubjectDetection('explain the difference between active and passive voice in bahasa melayu');
    testSubjectDetection('terangkan sejarah kemerdekaan malaysia');
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Small delay to ensure the message is rendered before scrolling
      setTimeout(() => {
        chatRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Load message sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        // Create a simple beep sound programmatically since we don't have a sound file
        const { sound } = await Audio.Sound.createAsync({
          uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
        });
        setMessageSound(sound);
      } catch (error) {
        console.log('Error loading sound:', error);
      }
    };
    loadSound();

    return () => {
      if (messageSound) {
        messageSound.unloadAsync();
      }
    };
  }, []);

  // Animated keyboard value
  const keyboardAnim = useRef(new RNAnimated.Value(0)).current;

  // Keyboard event listeners with smooth animations
  useEffect(() => {
    const keyboardWillShowListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', (e: any) => {
          setKeyboardHeight(e.endCoordinates.height);
          RNAnimated.timing(keyboardAnim, {
            toValue: e.endCoordinates.height,
            duration: e.duration || 250,
            useNativeDriver: false,
          }).start();
        })
      : null;
    
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e: any) => {
      if (Platform.OS !== 'ios') {
        setKeyboardHeight(e.endCoordinates.height);
        RNAnimated.timing(keyboardAnim, {
          toValue: e.endCoordinates.height,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });
    
    const keyboardWillHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', (e: any) => {
          setKeyboardHeight(0);
          RNAnimated.timing(keyboardAnim, {
            toValue: 0,
            duration: e.duration || 250,
            useNativeDriver: false,
          }).start();
        })
      : null;
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS !== 'ios') {
        setKeyboardHeight(0);
        RNAnimated.timing(keyboardAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      keyboardWillShowListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const subjects: Subject[] = [
    { key: 'math', name: 'Matematik', color: '#1D4ED8', icon: '➗' },
    { key: 'science', name: 'Sains', color: '#10B981', icon: '🔬' },
    { key: 'bm', name: 'Bahasa Melayu', color: '#F59E0B', icon: '📝' },
    { key: 'bi', name: 'English', color: '#7C3AED', icon: '📘' },
    { key: 'sej', name: 'Sejarah', color: '#EF4444', icon: '🏺' },
    { key: 'geo', name: 'Geografi', color: '#0EA5E9', icon: '🧭' },
  ];

  const getCurrentSubjectColor = () => subjects[activeSubject].color;
  
  const handleSubjectCapture = (subject: Subject) => {
    console.log('Capturing for subject:', subject.name);
    // Call the existing handleCapture function
    if (camera.current && !isCapturing) {
      handleCapture();
    }
  };

  const handleOpenPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to prevent null URL errors
        aspect: [4, 3],
        quality: 0.5, // Reduced quality for faster processing
        base64: false, // Skip base64 encoding for instant navigation
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Navigate INSTANTLY to homework-helper - no waiting for base64 encoding
        router.push({
          pathname: '/homework-helper',
          params: {
            imageUri: imageUri, // Use file URI for instant display
            originalImageUri: imageUri, // Same for processing
          },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleToggleTorch = () => {
    setTorchEnabled(!torchEnabled);
  };

  const handleTabSwitch = (tab: 'image' | 'chat') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      tabSwitchValue.value = withSpring(1);
      chatSlideValue.value = withTiming(1, { duration: 300 });
    } else {
      tabSwitchValue.value = withSpring(0);
      chatSlideValue.value = withTiming(0, { duration: 300 });
    }
  };

  const processMessageWithSubject = async (messageText: string, subjectKey: string) => {
    setIsTyping(true);

    try {
      console.log('Processing message:', messageText);
      
      // Enhanced language detection and correction
      const { detection, correctedText, corrections } = languageService.detectLanguageAndCorrect(messageText);
      
      console.log('Language detection result:', detection);
      
      // Update current language based on detection
      if (detection.suggestedResponse !== currentLanguage) {
        setCurrentLanguage(detection.suggestedResponse);
      }

      // Create teacher-like KSSR-aligned prompt
      const teacherPrompt = `You are Cikgu SPMind (Teacher SPMind), a warm, friendly, and encouraging Malaysian teacher. You're chatting with a primary or secondary school student.

IMPORTANT GUIDELINES:
1. **Teaching Style**: Be like a caring teacher, not an AI. Use "Cikgu" (Teacher) voice - friendly, patient, encouraging.
2. **Malaysian Context**: Align ALL explanations with Malaysian KSSR (Primary) and KSSM/SPM (Secondary) curriculum. Use local examples (RM, Malaysian cities, local context).
3. **Language**: Respond in ${detection.suggestedResponse === 'ms' ? 'Bahasa Melayu' : detection.suggestedResponse === 'mixed' ? 'both English and Bahasa Melayu (code-switching naturally)' : 'English'}, matching student's language naturally.
4. **Formatting**: Use **bold** for key concepts and _underline_ for important terms. Make it visually engaging!
5. **Tone**: Encouraging and supportive. Use phrases like "Bagus!", "Great question!", "Let's explore this together!", "You're doing well!"
6. **Explanations**: 
   - Start with encouragement
   - Break down complex ideas simply
   - Use real Malaysian examples
   - End with a check-in question like "Faham tak?" or "Does this make sense?"
7. **NO AI-speak**: Don't say "As an AI" or "I'm programmed to". Talk like a real teacher!

Student's question: ${correctedText}

Respond as Cikgu SPMind - warm, helpful, and naturally Malaysian!`;
      
      console.log('Teacher prompt created');

      const response = await aiService.sendMessage(
        [{ role: 'user' as const, content: teacherPrompt }],
        detection.suggestedResponse,
        false
      );

      console.log('AI Service response:', response);

      const aiMessage: { id: string; text: string; isUser: boolean; timestamp: Date } = {
        id: (Date.now() + 1).toString(),
        text: response.message || '',
        isUser: false,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      
      // Play message sound
      if (messageSound) {
        try {
          await messageSound.replayAsync();
        } catch (error) {
          console.log('Error playing sound:', error);
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: { id: string; text: string; isUser: boolean; timestamp: Date } = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, cikgu ada masalah sebentar. Cuba lagi ya! 😊 / Sorry, teacher had a small issue. Try again! 😊',
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? chatInput).trim();
    if (!text) return;

    // Set onboarding to false to enable proper chat responses
    aiService.setOnboardingComplete();

    // Enhanced language detection and correction
    const { detection, correctedText, corrections } = languageService.detectLanguageAndCorrect(text);
    
    // Update current language based on detection
    if (detection.suggestedResponse !== currentLanguage) {
      setCurrentLanguage(detection.suggestedResponse);
    }

    // Process directly without subject detection/switching
    const userMessage = {
      id: Date.now().toString(),
      text: correctedText,
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setShowPresetMessages(false);

    await processMessageWithSubject(text, '');
  };

  const handleSubjectSelection = (subject: { key: string; name: string; icon: string; malayName: string }) => {
    setSelectedSubject(subject.key);
    setShowPresetMessages(false); // Hide subject selection options
    
    // Add a confirmation message
    const confirmationMessage = {
      id: Date.now().toString(),
      text: `Great! I'm ready to help you with **${subject.name}** / **${subject.malayName}**. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, confirmationMessage]);
  };

  const handleChangeSubject = () => {
    setSelectedSubject(null);
    setShowPresetMessages(true);
    setChatInput('');
    setPendingSubjectSwitch(null);
  };

  const handleSubjectSwitchConfirm = (switchToDetected: boolean) => {
    if (pendingSubjectSwitch) {
      if (switchToDetected) {
        // Switch to detected subject
        setSelectedSubject(pendingSubjectSwitch.detectedSubject);
        
        // Add confirmation message
        const detectedSubjectInfo = subjectOptions.find(s => s.key === pendingSubjectSwitch.detectedSubject);
        const confirmationMessage = {
          id: Date.now().toString(),
          text: `Switched to **${detectedSubjectInfo?.name}** / **${detectedSubjectInfo?.malayName}**. Now processing your question...`,
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, confirmationMessage]);
        
        // Process the original message with new subject
        setTimeout(() => {
          processMessageWithSubject(pendingSubjectSwitch.userMessage, pendingSubjectSwitch.detectedSubject);
        }, 1000);
      } else {
        // Stay with current subject
        const currentSubjectInfo = subjectOptions.find(s => s.key === selectedSubject);
        const stayMessage = {
          id: Date.now().toString(),
          text: `Continuing with **${currentSubjectInfo?.name}** / **${currentSubjectInfo?.malayName}**. Processing your question...`,
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, stayMessage]);
        
        // Process the original message with current subject
        setTimeout(() => {
          processMessageWithSubject(pendingSubjectSwitch.userMessage, selectedSubject!);
        }, 1000);
      }
      
      setPendingSubjectSwitch(null);
    }
  };

  const handleQuickAsk = (question: string) => {
    // Send immediately without requiring typing
    handleSendMessage(question);
    setShowPresetMessages(false); // Hide preset messages when quick question is used
  };

  const handleCallHome = () => {
    router.push('/(tabs)');
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to prevent null URL errors
        aspect: [4, 3],
        quality: 0.5, // Reduced quality for faster processing
        base64: false, // Skip base64 encoding for instant navigation
      });

      if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        
        // Validate URI before proceeding
        if (!imageUri || imageUri.trim() === '') {
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          return;
        }
        
        // Navigate INSTANTLY to homework-helper - no AI processing delay
        router.push({
          pathname: '/homework-helper',
          params: {
            imageUri: imageUri,
            originalImageUri: imageUri, // Same for processing
          },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Navigate to crop screen with selected image
        router.push({
          pathname: '/crop-question',
          params: {
            imageUri: result.assets[0].uri,
          },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCapture = async () => {
    if (!camera.current || isCapturing) return;

    setIsCapturing(true);
    try {
      // Capture with high quality for better results
      const photo = await camera.current.takePictureAsync({
        quality: 1, // High quality for best results
        base64: false, // Skip base64 encoding for instant capture
        skipProcessing: false, // Normal processing for quality
      });

      // Validate photo URI before proceeding
      if (!photo || !photo.uri || photo.uri.trim() === '') {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }

      // Navigate to crop screen first for smooth workflow
      router.push({
        pathname: '/crop-question',
        params: {
          imageUri: photo.uri,
        },
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubjectChange = (subject: Subject) => {
    const index = subjects.findIndex(s => s.key === subject.key);
    if (index !== -1) {
      setActiveSubject(index);
    }
    console.log('Subject changed to:', subject.name);
  };

  const tabSwitchStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: interpolate(tabSwitchValue.value, [0, 1], [0, 38], Extrapolation.CLAMP) }],
    };
  });

  const chatContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: interpolate(chatSlideValue.value, [0, 1], [width, 0], Extrapolation.CLAMP) }],
    };
  });

  if (!permission) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.loadingContainer]}>
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, dynamicStyles.permissionContainer]}>
        <CameraIcon size={64} color={isDark ? "#666666" : "#999999"} />
        <Text style={[styles.permissionTitle, dynamicStyles.permissionTitle]}>Camera Permission Required</Text>
        <Text style={[styles.permissionText, dynamicStyles.permissionText]}>
          Please grant camera permission to use the question detection feature.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <RNAnimated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      {/* Header with Black Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Switch moved to profile picture place */}
          <View style={styles.headerLeft}>
            <View style={styles.premiumTabSwitch}>
              <Animated.View style={[styles.tabSwitchSlider, tabSwitchStyle]} />
              <TouchableOpacity
                style={[styles.premiumTabButton, activeTab === 'image' && styles.activePremiumTab]}
                onPress={() => handleTabSwitch('image')}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../../assets/images/cameratake.png')} 
                  style={[
                    styles.cameraButtonIcon,
                    { opacity: activeTab === 'image' ? 1 : 0.6 }
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.premiumTabButton, activeTab === 'chat' && styles.activePremiumTab]}
                onPress={() => handleTabSwitch('chat')}
                activeOpacity={0.7}
              >
                <MessageSquare size={16} color={activeTab === 'chat' ? '#FFFFFF' : '#FFB366'} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Logo in center */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerLogo}>Ask Me!</Text>
          </View>
          
          {/* History button moved to top right */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(!showHistory)}
              activeOpacity={0.7}
            >
              <History size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Camera View */}
      <CameraView
        ref={camera}
        style={styles.camera}
        facing="back"
        enableTorch={torchEnabled}
        mode="picture"
      />

      {/* Top Controls - now empty, switch and history moved to header */}
      <View style={styles.topControls}>
        {/* Empty - controls moved to header */}
      </View>

      {/* Camera Subject Overlay */}
      {activeTab === 'image' && (
        <CameraSubjectOverlay
          subjects={subjects}
          onSubjectChange={handleSubjectChange}
          onCapture={handleSubjectCapture}
          onOpenPhoto={handleOpenPhoto}
          onToggleTorch={handleToggleTorch}
          torchEnabled={torchEnabled}
          hideSubjects={false}
        />
      )}

      {/* Subject Header for Chat Mode */}
      {activeTab === 'chat' && (
        <></>
      )}

      {/* Chat Container (for chat tab) */}
      {activeTab === 'chat' && (
        <Animated.View style={[styles.chatInterface, dynamicStyles.chatInterface, chatContainerStyle]}>
          <LinearGradient
            colors={['#FFEBEE', '#FFCDD2', '#FFE0E6', '#FFFFFF']}
            style={styles.chatGradientBackground}
          >
            {/* Chat Header removed */}

            <KeyboardAvoidingView 
              style={[styles.chatKeyboardAvoid, { paddingTop: 60 }]} 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >

            {/* Subject Selection Options - Show when no subject is selected */}
            {false && (
              <View />
            )}

            {/* Current Subject Header - Show when subject is selected */}
            {false && (
              <View />
            )}

            {/* Chat Messages */}
            <ScrollView 
              ref={chatRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
            >
              {/* SPMind Welcome Interface */}
              {chatMessages.length === 0 && (
                <View style={styles.ciciWelcomeContainer}>
                  <TouchableOpacity 
                    onPress={() => router.push({
                      pathname: '/tutor',
                      params: { source: 'search' }
                    })}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={require('../../assets/images/hi.png')} 
                      style={styles.hiImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <Text style={styles.ciciGreeting}>Hi I'm Cikgu SPMind</Text>
                  <Text style={styles.ciciQuote}>Your friendly Malaysian teacher. Ask me anything!</Text>
                  
                  <View style={styles.presetButtonsContainer}>
                    <View style={styles.presetButtonsRow}>
                      <TouchableOpacity 
                        style={styles.presetButton}
                        onPress={() => handleSendMessage('Bila tarikh merdeka?')}
                      >
                        <Text style={styles.presetButtonText}>Bila tarikh merdeka?</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.presetButton}
                        onPress={() => handleSendMessage('Apa formula newton?')}
                      >
                        <Text style={styles.presetButtonText}>Apa formula newton?</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.presetButtonsRow}>
                      <TouchableOpacity 
                        style={[styles.presetButton, styles.presetButtonWide]}
                        onPress={() => handleSendMessage('What is the formula of energy?')}
                      >
                        <Text style={styles.presetButtonText}>What is the formula of energy?</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.presetButton, styles.presetButtonSmall]}
                        onPress={() => handleSendMessage('Fotosintesis tu apa')}
                      >
                        <Text style={styles.presetButtonText}>Fotosintesis tu apa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {chatMessages.map((message, index) => (
                <Animatable.View
                  key={message.id}
                  animation={message.isUser ? "fadeInRight" : "fadeInLeft"}
                  duration={300}
                  delay={index * 100}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                    index === 0 && styles.firstMessage
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.aiBubble
                    ]}
                  >
                    {message.image && message.image.trim() !== '' && (
                      <Image 
                        source={{ uri: message.image }} 
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    )}
                    <FormattedText
                      text={message.text}
                      style={[
                        styles.messageText,
                        dynamicStyles.messageText,
                        message.isUser ? styles.userMessageText : styles.aiMessageText,
                        (message as any).isSystemMessage && styles.systemMessageText
                      ]}
                    />
                    
                    {/* Quick Reply Buttons for Subject Switching */}
                    {(message as any).isSystemMessage && pendingSubjectSwitch && (
                      <View style={styles.quickReplyContainer}>
                        <TouchableOpacity 
                          style={[styles.quickReplyButton, styles.switchButton]}
                          onPress={() => handleSubjectSwitchConfirm(true)}
                        >
                          <Text style={styles.quickReplyButtonText}>
                            Switch to {subjectOptions.find(s => s.key === pendingSubjectSwitch.detectedSubject)?.name}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.quickReplyButton, styles.stayButton]}
                          onPress={() => handleSubjectSwitchConfirm(false)}
                        >
                          <Text style={styles.quickReplyButtonText}>
                            Stay with {subjectOptions.find(s => s.key === selectedSubject)?.name}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Animatable.View>
              ))}
              {isTyping && (
                <Animatable.View 
                  animation="fadeIn" 
                  duration={300}
                  style={[styles.messageContainer, styles.aiMessage]}
                >
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <Text style={[styles.messageText, dynamicStyles.messageText, styles.aiMessageText]}>
                      Cikgu SPMind is typing...
                    </Text>
                  </View>
                </Animatable.View>
              )}
            </ScrollView>

            {/* White Background Overlay when keyboard is open */}
            <RNAnimated.View style={[
              styles.keyboardBackgroundOverlay,
              { 
                height: keyboardAnim.interpolate({
                  inputRange: [0, 300],
                  outputRange: [0, 300],
                  extrapolate: 'clamp',
                }),
                opacity: keyboardAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              }
            ]} />

            {/* Chat Input */}
            <RNAnimated.View style={[
              styles.chatInputContainer,
              { 
                bottom: keyboardAnim,
              }
            ]}>
              <TouchableOpacity style={styles.attachButton} onPress={handleImageUpload}>
                <Paperclip size={20} color="#999999" />
              </TouchableOpacity>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.chatInput, 
                    dynamicStyles.chatInput,
                  ]}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder={"Type your message..."}
                  placeholderTextColor={isDark ? "#999999" : "#666666"}
                  multiline
                  maxLength={500}
                  editable={true}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  (!chatInput.trim()) && styles.sendButtonDisabled
                ]}
                onPress={() => handleSendMessage()}
                disabled={!chatInput.trim()}
              >
                <Send size={20} color={chatInput.trim() ? '#FFFFFF' : '#999999'} />
              </TouchableOpacity>
            </RNAnimated.View>
          </KeyboardAvoidingView>
          </LinearGradient>
        </Animated.View>
      )}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 100,
    backgroundColor: '#000000',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 200,
    pointerEvents: 'box-none',
  },
  headerLeft: {
    width: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  headerCenter: {
    flex: 1,
    zIndex: 201,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingLeft: 40,
  },
  headerLogo: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  permissionText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  permissionButton: {
    backgroundColor: '#00FF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  topControls: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  premiumTabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    borderRadius: 20,
    padding: 2,
    position: 'relative',
    width: 80,
    height: 32,
    shadowColor: '#CC7700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 14,
    zIndex: 300,
    pointerEvents: 'auto',
    borderWidth: 0,
    borderBottomWidth: 3,
    borderBottomColor: '#E6850E',
  },
  tabSwitchSlider: {
    position: 'absolute',
    width: 38,
    top: 2,
    bottom: 2,
    backgroundColor: '#FFB84D',
    borderRadius: 18,
    zIndex: -1,
    shadowColor: '#CC7700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E6850E',
  },
  premiumTabButton: {
    width: 38,
    height: 28,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 301,
    pointerEvents: 'auto',
  },
  cameraButtonIcon: {
    width: 18,
    height: 18,
  },
  activePremiumTab: {
    backgroundColor: 'transparent',
  },
  historyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CC7700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 300,
    pointerEvents: 'auto',
    borderBottomWidth: 2,
    borderBottomColor: '#E6850E',
  },
  subjectTabsContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
  },
  subjectTabsContent: {
    paddingHorizontal: 10,
  },
  subjectTab: {
    width: 120,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSubjectTab: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: 'rgba(0, 255, 0, 0.5)',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  subjectIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  subjectTabText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activeSubjectTabText: {
    color: '#00FF00',
    fontWeight: 'bold',
  },

  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchActiveButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  floatingHistory: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 280,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 16,
    zIndex: 200,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyQuestion: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historySubject: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  historyTime: {
    color: '#999999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  chatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },
  chatPlaceholder: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
  chatInterface: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
    paddingTop: 0, // main header provides the top spacing
  },
  chatKeyboardAvoid: {
    flex: 1,
  },
  chatGradientBackground: {
    flex: 1,
  },
  ciciWelcomeContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  hiImage: {
    width: 300,
    height: 300,
    marginBottom: 10,
    marginTop: 0,
  },
  ciciGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 0,
    fontFamily: 'Inter-Bold',
  },
  ciciQuote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 0,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  presetButtonsContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 0,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  presetButtonWide: {
    flex: 2,
  },
  presetButtonSmall: {
    flex: 0.8,
  },
  presetButtonText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 22,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatUsername: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  chatStatus: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  chatHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  chatHeaderSpacer: {
    width: 32,
  },
  closeChatButton: {
    padding: 8,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessagesContent: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  firstMessage: {
    marginTop: 0,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    color: '#333333',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#1a1a1a',
    fontWeight: '400',
    lineHeight: 24,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  keyboardBackgroundOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
  chatInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 1000,
  },
  quickQuestionsContainer: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    zIndex: 200,
    maxWidth: width * 0.7,
    alignItems: 'flex-end',
  },
  subjectSelectionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 200,
    maxHeight: height * 0.6,
  },
  subjectSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subjectOptionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  subjectOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subjectOptionText: {
    flex: 1,
  },
  subjectOptionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectOptionMalay: {
    fontSize: 12,
    opacity: 0.8,
  },
  currentSubjectHeader: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 200,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentSubjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentSubjectIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  currentSubjectText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  changeSubjectButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.4)',
  },
  changeSubjectButtonText: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: '600',
  },
  systemMessageText: {
    color: '#FFA500',
    fontWeight: '600',
  },
  quickReplyContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickReplyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    borderColor: 'rgba(0, 255, 0, 0.4)',
  },
  stayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickReplyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  quickQuestionBubble: {
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    marginBottom: 8,
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickQuestionBubbleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'left',
  },
  quickQuestionsRow: {
    paddingRight: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickQuestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  quickQuestionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  attachButton: {
    padding: 6,
    marginRight: 6,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
  },
  chatInput: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 0,
    textAlignVertical: 'center',
  },
  chatInputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00CC00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
});