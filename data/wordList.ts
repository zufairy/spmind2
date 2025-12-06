// Common English words for Word Bomb game validation
// Option 1: Use the hardcoded list below (works offline, fast)
// Option 2: Import a comprehensive wordlist file (see loadWordlistFromFile function)

// For large wordlists, load from file instead of hardcoding
// Instructions:
// 1. Download a wordlist (e.g., https://github.com/dwyl/english-words or https://github.com/first20hours/google-10000-english)
// 2. Place it in assets/wordlist.txt (one word per line)
// 3. Use the loadWordlistFromFile() function below

export const COMMON_WORDS = new Set([
  // Common 3-letter words
  'and', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
  'its', 'let', 'put', 'say', 'she', 'too', 'use', 'yes', 'yet', 'age',
  'any', 'ask', 'ate', 'bad', 'bag', 'bat', 'bed', 'big', 'bit', 'box',
  'car', 'cat', 'cup', 'cut', 'dog', 'eat', 'end', 'far', 'fat', 'few',
  'fly', 'fun', 'got', 'gun', 'hat', 'hit', 'hot', 'ice', 'job', 'joy',
  'key', 'kid', 'lay', 'leg', 'lie', 'lot', 'low', 'map', 'may', 'mom',
  'old', 'own', 'pay', 'pen', 'pet', 'ran', 'red', 'run', 'sad', 'sat',
  'sea', 'set', 'sit', 'six', 'sky', 'son', 'sun', 'ten', 'tie', 'top',
  'toy', 'try', 'war', 'win', 'won', 'add', 'air', 'art', 'bee', 'bus',
  
  // Common 4-letter words
  'about', 'after', 'again', 'also', 'another', 'back', 'because', 'been', 'before', 'being',
  'best', 'between', 'book', 'both', 'call', 'came', 'case', 'children', 'city', 'come',
  'could', 'down', 'each', 'even', 'eyes', 'face', 'fact', 'feel', 'find', 'first',
  'food', 'form', 'found', 'from', 'gave', 'give', 'good', 'great', 'group', 'grow',
  'hand', 'have', 'head', 'help', 'here', 'high', 'home', 'house', 'into', 'just',
  'keep', 'kind', 'know', 'land', 'large', 'last', 'late', 'leave', 'left', 'life',
  'line', 'list', 'little', 'live', 'long', 'look', 'made', 'make', 'many', 'mean',
  'might', 'more', 'most', 'move', 'much', 'must', 'name', 'near', 'need', 'never',
  'next', 'night', 'number', 'often', 'once', 'only', 'open', 'other', 'over', 'own',
  'part', 'people', 'place', 'play', 'point', 'put', 'read', 'right', 'room', 'said',
  'same', 'school', 'seem', 'should', 'show', 'side', 'small', 'some', 'something', 'stand',
  'start', 'state', 'still', 'story', 'such', 'take', 'tell', 'than', 'that', 'their',
  'them', 'then', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'though',
  'three', 'through', 'time', 'together', 'took', 'turn', 'under', 'until', 'upon', 'very',
  'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where', 'which', 'while',
  'white', 'will', 'with', 'word', 'work', 'world', 'would', 'write', 'year', 'your',
  
  // Additional common words
  'able', 'above', 'across', 'actual', 'along', 'always', 'among', 'answer', 'appear', 'area',
  'around', 'asked', 'became', 'become', 'began', 'begin', 'behind', 'below', 'better', 'black',
  'body', 'bring', 'built', 'business', 'called', 'cannot', 'change', 'clear', 'close', 'common',
  'company', 'complete', 'consider', 'continue', 'course', 'create', 'decided', 'deep', 'develop',
  'different', 'doing', 'door', 'during', 'early', 'earth', 'easy', 'enough', 'entire', 'every',
  'everything', 'example', 'family', 'father', 'figure', 'final', 'fire', 'five', 'follow', 'force',
  'four', 'free', 'friend', 'full', 'game', 'general', 'girl', 'given', 'glass', 'going',
  'government', 'green', 'half', 'happy', 'hard', 'having', 'hear', 'heart', 'held', 'however',
  'human', 'idea', 'important', 'include', 'increase', 'inside', 'interest', 'issue', 'keep', 'knew',
  'known', 'later', 'lead', 'learn', 'least', 'less', 'letter', 'level', 'light', 'likely',
  'living', 'local', 'love', 'main', 'making', 'matter', 'maybe', 'member', 'mind', 'minute',
  'miss', 'moment', 'money', 'month', 'morning', 'mother', 'national', 'nature', 'nothing', 'notice',
  'office', 'order', 'original', 'outside', 'paper', 'particular', 'party', 'pass', 'past', 'pattern',
  'person', 'picture', 'plan', 'plant', 'position', 'possible', 'power', 'present', 'president', 'pretty',
  'problem', 'process', 'produce', 'program', 'provide', 'public', 'question', 'quite', 'rather', 'reach',
  'ready', 'real', 'really', 'reason', 'receive', 'remain', 'remember', 'report', 'result', 'return',
  'road', 'rule', 'science', 'second', 'section', 'seen', 'sense', 'serve', 'service', 'several',
  'short', 'simple', 'since', 'single', 'social', 'society', 'sound', 'space', 'speak', 'special',
  'stop', 'street', 'strong', 'student', 'study', 'support', 'sure', 'system', 'table', 'taken',
  'talk', 'teach', 'teacher', 'team', 'terms', 'test', 'thank', 'thought', 'today', 'told',
  'tonight', 'total', 'toward', 'town', 'trade', 'travel', 'true', 'type', 'understand', 'unit',
  'united', 'university', 'unless', 'usually', 'value', 'various', 'view', 'voice', 'walk', 'wall',
  'week', 'west', 'whatever', 'whole', 'whose', 'wife', 'window', 'within', 'without', 'woman',
  'wonder', 'words', 'young',
  
  // Words with common letter combinations
  'asia', 'asian', 'ask', 'basket', 'based', 'class', 'classic', 'ease', 'easier', 'easily',
  'eastern', 'fast', 'faster', 'last', 'master', 'past', 'please', 'plastic', 'reason', 'season',
  'taste', 'waste', 'disaster', 'measure', 'pleasure', 'treasure', 'basic', 'basically', 'basis',
  'castle', 'casual', 'fantasy', 'glass', 'grass', 'massive', 'master', 'passage', 'passenger',
  'passing', 'passive', 'phase', 'phrase', 'phrase', 'release', 'taste', 'texas', 'understand',
  
  // Action words
  'action', 'active', 'activity', 'adopt', 'advance', 'advice', 'advise', 'affect', 'afford', 'afraid',
  'agree', 'ahead', 'allow', 'almost', 'alone', 'amount', 'analyze', 'ancient', 'announce', 'annual',
  'apply', 'approach', 'argue', 'arise', 'arrange', 'arrive', 'article', 'artist', 'assume', 'attack',
  'attempt', 'attend', 'attention', 'attitude', 'attract', 'author', 'avoid', 'aware', 'basis', 'battle',
  'bear', 'beat', 'beautiful', 'beauty', 'believe', 'benefit', 'beyond', 'birth', 'blood', 'blow',
  'blue', 'board', 'boat', 'border', 'born', 'bother', 'bottle', 'bottom', 'brain', 'branch',
  'break', 'breast', 'breath', 'bridge', 'brief', 'bright', 'broad', 'broken', 'brother', 'brown',
  'budget', 'building', 'burn', 'campaign', 'cancer', 'candidate', 'capital', 'captain', 'capture', 'career',
  'careful', 'carefully', 'carry', 'catch', 'cause', 'cell', 'center', 'central', 'century', 'certain',
  'certainly', 'chair', 'challenge', 'chance', 'character', 'charge', 'cheap', 'check', 'chemical', 'chest',
  'chief', 'child', 'choice', 'choose', 'church', 'circle', 'citizen', 'civil', 'claim', 'climb',
  'clock', 'cloth', 'clothes', 'cloud', 'club', 'coach', 'coast', 'cold', 'collect', 'collection',
  'college', 'color', 'column', 'combination', 'combine', 'comfortable', 'command', 'comment', 'commercial', 'commission',
  'commit', 'committee', 'communicate', 'community', 'compare', 'comparison', 'competition', 'complain', 'complaint', 'complex',
  'computer', 'concentrate', 'concentration', 'concept', 'concern', 'concerned', 'conclude', 'conclusion', 'condition', 'conduct',
  'conference', 'confidence', 'confirm', 'conflict', 'congress', 'connect', 'connection', 'conscious', 'consequence', 'conservative',
  
  // More common words
  'consume', 'consumer', 'contact', 'contain', 'contemporary', 'content', 'contest', 'context', 'contract', 'contrast',
  'contribute', 'contribution', 'control', 'conversation', 'convert', 'convince', 'cook', 'cool', 'corner', 'corporate',
  'correct', 'cost', 'could', 'council', 'count', 'counter', 'country', 'county', 'couple', 'courage',
  'court', 'cousin', 'cover', 'coverage', 'crack', 'craft', 'crash', 'crazy', 'cream', 'credit',
  'crew', 'crime', 'criminal', 'crisis', 'criteria', 'critic', 'critical', 'criticism', 'criticize', 'crop',
  'cross', 'crowd', 'crucial', 'cultural', 'culture', 'curious', 'current', 'currently', 'curve', 'custom',
  'customer', 'dance', 'danger', 'dangerous', 'dark', 'data', 'date', 'daughter', 'dead', 'deal',
  'dealer', 'dear', 'death', 'debate', 'debt', 'decade', 'decide', 'decision', 'deck', 'declare',
  'decline', 'decrease', 'defeat', 'defend', 'defense', 'defendant', 'define', 'definitely', 'definition', 'degree',
  'delay', 'deliver', 'delivery', 'demand', 'democratic', 'demonstrate', 'demonstration', 'deny', 'department', 'depend',
  'dependent', 'depending', 'depict', 'depression', 'depth', 'deputy', 'derive', 'describe', 'description', 'desert',
  'deserve', 'design', 'designer', 'desire', 'desk', 'desperate', 'despite', 'destroy', 'destruction', 'detail',
  'detailed', 'detect', 'determine', 'device', 'devote', 'dialogue', 'diamond', 'diet', 'differ', 'difference',
  'differently', 'difficult', 'difficulty', 'digital', 'dimension', 'dining', 'dinner', 'direct', 'direction', 'directly',
  'director', 'dirt', 'dirty', 'disability', 'disagree', 'disappear', 'disaster', 'discipline', 'discourse', 'discover',
  'discovery', 'discrimination', 'discuss', 'discussion', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance',
  'distant', 'distinct', 'distinction', 'distinguish', 'distribute', 'distribution', 'district', 'diverse', 'diversity', 'divide',
  'division', 'divorce', 'doctor', 'document', 'dollar', 'domestic', 'dominant', 'dominate', 'double', 'doubt',
  'dozen', 'draft', 'drag', 'drama', 'dramatic', 'dramatically', 'draw', 'drawing', 'dream', 'dress',
  'drink', 'drive', 'driver', 'drop', 'drug', 'drunk', 'dual', 'duck', 'dump', 'duty',
  
  // More common everyday words
  'able', 'about', 'above', 'accept', 'account', 'across', 'add', 'address', 'admit', 'adult',
  'affect', 'after', 'again', 'against', 'agency', 'agent', 'agree', 'ahead', 'allow', 'almost',
  'alone', 'along', 'already', 'also', 'although', 'always', 'among', 'amount', 'analysis', 'animal',
  'another', 'answer', 'anybody', 'anyone', 'anything', 'anyway', 'apartment', 'appear', 'apple', 'apply',
  'area', 'argue', 'arm', 'army', 'around', 'arrive', 'article', 'artist', 'ask', 'asleep',
  'assume', 'attack', 'attempt', 'attend', 'attention', 'attorney', 'audience', 'author', 'available', 'average',
  'avoid', 'away', 'baby', 'back', 'bad', 'bag', 'ball', 'bank', 'bar', 'base',
  'baseball', 'basketball', 'bath', 'bathroom', 'battle', 'beach', 'bear', 'beat', 'beautiful', 'became',
  'because', 'become', 'bed', 'bedroom', 'beer', 'before', 'began', 'begin', 'behavior', 'behind',
  'being', 'believe', 'bell', 'below', 'bench', 'benefit', 'beside', 'best', 'better', 'between',
  'beyond', 'big', 'bike', 'bill', 'billion', 'bird', 'birth', 'birthday', 'bit', 'bite',
  'black', 'block', 'blood', 'blue', 'board', 'boat', 'body', 'bomb', 'bone', 'book',
  'born', 'boss', 'both', 'bother', 'bottle', 'bottom', 'bowl', 'box', 'boy', 'boyfriend',
  'brain', 'branch', 'bread', 'break', 'breakfast', 'breath', 'bridge', 'brief', 'bright', 'bring',
  'brother', 'brown', 'brush', 'budget', 'build', 'building', 'burn', 'business', 'busy', 'butter',
  'button', 'buy', 'bye', 'cake', 'call', 'camera', 'camp', 'campaign', 'can', 'cancer',
  'candy', 'cap', 'capital', 'captain', 'car', 'card', 'care', 'career', 'careful', 'carry',
  'case', 'cash', 'cat', 'catch', 'cause', 'ceiling', 'celebrate', 'cell', 'center', 'central',
  'century', 'certain', 'certainly', 'chain', 'chair', 'challenge', 'chance', 'change', 'chapter', 'character',
  'charge', 'chase', 'cheap', 'check', 'cheese', 'chest', 'chicken', 'chief', 'child', 'choice',
  'choose', 'church', 'cigarette', 'circle', 'citizen', 'city', 'civil', 'claim', 'class', 'classic',
  'classroom', 'clean', 'clear', 'clearly', 'client', 'climb', 'clock', 'close', 'closely', 'closet',
  'clothes', 'cloud', 'club', 'coach', 'coast', 'coat', 'code', 'coffee', 'cold', 'collect',
  'college', 'color', 'come', 'comedy', 'comfort', 'comfortable', 'command', 'comment', 'commercial', 'commit',
  'common', 'communicate', 'community', 'company', 'compare', 'competition', 'complain', 'complete', 'completely', 'computer',
  'concern', 'concerned', 'condition', 'conference', 'confidence', 'confirm', 'conflict', 'congress', 'connect', 'consider',
  'consumer', 'contact', 'contain', 'continue', 'contract', 'control', 'conversation', 'cook', 'cookie', 'cool',
  'copy', 'corner', 'correct', 'cost', 'couch', 'could', 'council', 'count', 'country', 'county',
  'couple', 'courage', 'course', 'court', 'cousin', 'cover', 'cow', 'crack', 'crazy', 'cream',
  'create', 'credit', 'crew', 'crime', 'criminal', 'crisis', 'critical', 'cross', 'crowd', 'crown',
  'cry', 'cultural', 'culture', 'cup', 'current', 'curtain', 'curve', 'customer', 'cut', 'cute',
  'dad', 'daily', 'damage', 'dance', 'danger', 'dangerous', 'dare', 'dark', 'data', 'date',
  'daughter', 'day', 'dead', 'deal', 'dear', 'death', 'debate', 'debt', 'decade', 'decide',
  'decision', 'deep', 'deeply', 'deer', 'defeat', 'defend', 'defense', 'define', 'definitely', 'degree',
  'delay', 'deliver', 'demand', 'democracy', 'democratic', 'demonstrate', 'deny', 'department', 'depend', 'depression',
  'describe', 'desert', 'deserve', 'design', 'designer', 'desire', 'desk', 'despite', 'destroy', 'detail',
  'determine', 'develop', 'device', 'devil', 'die', 'diet', 'difference', 'different', 'differently', 'difficult',
  'difficulty', 'dig', 'dinner', 'direct', 'direction', 'directly', 'director', 'dirt', 'dirty', 'disappear',
  'discover', 'discovery', 'discuss', 'discussion', 'disease', 'dish', 'disk', 'display', 'distance', 'distribute',
  'district', 'divide', 'division', 'divorce', 'doctor', 'document', 'does', 'dog', 'doing', 'doll',
  'dollar', 'domestic', 'done', 'door', 'double', 'doubt', 'down', 'downtown', 'dozen', 'draft',
  'drag', 'drama', 'dramatic', 'draw', 'drawing', 'dream', 'dress', 'drew', 'drink', 'drive',
  'driver', 'drop', 'drove', 'drug', 'dry', 'due', 'during', 'dust', 'duty', 'each',
  'ear', 'early', 'earn', 'earth', 'ease', 'easily', 'east', 'eastern', 'easy', 'eat',
  'economic', 'economy', 'edge', 'education', 'educational', 'effect', 'effective', 'effectively', 'effort', 'egg',
  'eight', 'either', 'elderly', 'elect', 'election', 'electric', 'electronic', 'element', 'elementary', 'elevator',
  'eliminate', 'else', 'elsewhere', 'email', 'emerge', 'emergency', 'emotion', 'emotional', 'emphasis', 'emphasize',
  'employ', 'employee', 'employer', 'employment', 'empty', 'enable', 'encounter', 'encourage', 'end', 'enemy',
  'energy', 'engage', 'engine', 'engineer', 'engineering', 'enhance', 'enjoy', 'enormous', 'enough', 'ensure',
  'enter', 'entire', 'entirely', 'entrance', 'entry', 'environment', 'environmental', 'equal', 'equally', 'equipment',
  'era', 'error', 'escape', 'especially', 'essay', 'essential', 'essentially', 'establish', 'estate', 'estimate',
  'etc', 'ethics', 'ethnic', 'even', 'evening', 'event', 'eventually', 'ever', 'every', 'everybody',
  'everyday', 'everyone', 'everything', 'everywhere', 'evidence', 'evil', 'exact', 'exactly', 'exam', 'examination',
  'examine', 'example', 'excellent', 'except', 'exception', 'exchange', 'excited', 'exciting', 'executive', 'exercise',
  'exhibit', 'exhibition', 'exist', 'existence', 'existing', 'exit', 'expand', 'expansion', 'expect', 'expectation',
  'expense', 'expensive', 'experience', 'experienced', 'experiment', 'expert', 'explain', 'explanation', 'explore', 'explosion',
  'expose', 'express', 'expression', 'extend', 'extension', 'extensive', 'extent', 'extra', 'extraordinary', 'extreme',
  'extremely', 'eye', 'fabric', 'face', 'facility', 'fact', 'factor', 'factory', 'faculty', 'fade',
  'fail', 'failure', 'fair', 'fairly', 'faith', 'fall', 'false', 'familiar', 'family', 'famous',
  'fan', 'fancy', 'fantastic', 'fantasy', 'far', 'farm', 'farmer', 'fashion', 'fast', 'faster',
  'fat', 'fate', 'father', 'fault', 'favor', 'favorite', 'fear', 'feature', 'federal', 'fee',
  'feed', 'feel', 'feeling', 'fellow', 'female', 'fence', 'few', 'fewer', 'fiber', 'fiction',
  'field', 'fifteen', 'fifth', 'fifty', 'fight', 'fighter', 'fighting', 'figure', 'file', 'fill',
  'film', 'final', 'finally', 'finance', 'financial', 'find', 'finding', 'fine', 'finger', 'finish',
  'fire', 'firm', 'firmly', 'first', 'fish', 'fishing', 'fit', 'fitness', 'five', 'fix',
  'flag', 'flame', 'flat', 'flavor', 'flesh', 'flight', 'float', 'floor', 'flow', 'flower',
  'fly', 'flying', 'focus', 'folk', 'follow', 'following', 'food', 'foot', 'football', 'for',
  'force', 'foreign', 'forest', 'forever', 'forget', 'form', 'formal', 'formation', 'former', 'formula',
  'forth', 'fortune', 'forty', 'forward', 'found', 'foundation', 'founder', 'four', 'fourth', 'frame',
  'framework', 'free', 'freedom', 'freeze', 'French', 'frequency', 'frequent', 'frequently', 'fresh', 'friend',
  'friendly', 'friendship', 'from', 'front', 'fruit', 'frustration', 'fuel', 'full', 'fully', 'fun',
  'function', 'functional', 'fund', 'fundamental', 'funding', 'funny', 'furniture', 'furthermore', 'future', 'gain',
  'galaxy', 'gallery', 'game', 'gang', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'gas',
  'gate', 'gather', 'gave', 'gay', 'gaze', 'gear', 'gene', 'general', 'generally', 'generate',
  'generation', 'genetic', 'gentleman', 'gently', 'German', 'gesture', 'get', 'ghost', 'giant', 'gift',
  'gifted', 'girl', 'girlfriend', 'give', 'given', 'glad', 'glance', 'glass', 'global', 'glove',
  'goal', 'god', 'gold', 'golden', 'golf', 'gone', 'gonna', 'good', 'government', 'governor',
  'grab', 'grace', 'grade', 'gradually', 'graduate', 'graduation', 'grain', 'grand', 'grandfather', 'grandmother',
  'grant', 'grass', 'grateful', 'grave', 'gray', 'great', 'greatest', 'green', 'greet', 'grew',
  'grocery', 'ground', 'group', 'grow', 'growing', 'growth', 'guarantee', 'guard', 'guess', 'guest',
  'guidance', 'guide', 'guilty', 'guitar', 'gun', 'guy', 'habit', 'hair', 'half', 'hall',
  'hand', 'handful', 'handle', 'hang', 'happen', 'happening', 'happy', 'hard', 'hardly', 'harm',
  'hat', 'hate', 'have', 'having', 'head', 'headline', 'headquarters', 'heal', 'health', 'healthy',
  'hear', 'hearing', 'heart', 'heat', 'heaven', 'heavily', 'heavy', 'heel', 'height', 'held',
  'helicopter', 'hell', 'hello', 'help', 'helpful', 'her', 'here', 'heritage', 'hero', 'herself',
  'hey', 'hide', 'high', 'highlight', 'highly', 'highway', 'hill', 'him', 'himself', 'hip',
  'hire', 'his', 'historian', 'historic', 'historical', 'history', 'hit', 'hold', 'hole', 'holiday',
  'holy', 'home', 'homeless', 'honest', 'honey', 'honor', 'hope', 'horizon', 'horror', 'horse',
  'hospital', 'host', 'hot', 'hotel', 'hour', 'house', 'household', 'housing', 'how', 'however',
  'huge', 'human', 'humor', 'hundred', 'hungry', 'hunt', 'hunter', 'hunting', 'hurt', 'husband',
  
  // Additional common words (I-Z)
  'ice', 'idea', 'ideal', 'identify', 'identity', 'ignore', 'ill', 'illegal', 'illness', 'illustrate',
  'image', 'imagination', 'imagine', 'immediate', 'immediately', 'immigrant', 'immigration', 'impact', 'implement', 'implication',
  'imply', 'importance', 'important', 'impose', 'impossible', 'impress', 'impression', 'impressive', 'improve', 'improvement',
  'incident', 'include', 'including', 'income', 'incorporate', 'increase', 'increased', 'increasing', 'increasingly', 'incredible',
  'indeed', 'independence', 'independent', 'index', 'Indian', 'indicate', 'indication', 'individual', 'industrial', 'industry',
  'infant', 'infection', 'inflation', 'influence', 'inform', 'information', 'ingredient', 'initial', 'initially', 'initiative',
  'injury', 'inner', 'innocent', 'innovation', 'innovative', 'input', 'inquiry', 'inside', 'insight', 'insist',
  'inspire', 'install', 'instance', 'instant', 'instead', 'institution', 'institutional', 'instruction', 'instructor', 'instrument',
  'insurance', 'intellectual', 'intelligence', 'intelligent', 'intend', 'intense', 'intensity', 'intention', 'interaction', 'interested',
  'interesting', 'internal', 'international', 'Internet', 'interpret', 'interpretation', 'interrupt', 'interval', 'intervention', 'interview',
  'intimate', 'introduce', 'introduction', 'invade', 'invasion', 'invest', 'investigate', 'investigation', 'investigator', 'investment',
  'investor', 'invite', 'involve', 'involved', 'involvement', 'iron', 'island', 'isolate', 'isolated', 'isolation',
  'Israeli', 'issue', 'Italian', 'item', 'its', 'itself', 'jacket', 'jail', 'Japanese', 'jet',
  'Jew', 'Jewish', 'job', 'join', 'joint', 'joke', 'journal', 'journalist', 'journey', 'joy',
  'judge', 'judgment', 'juice', 'jump', 'junior', 'jury', 'just', 'justice', 'justify', 'keep',
  'key', 'kick', 'kid', 'kill', 'killer', 'killing', 'kind', 'king', 'kingdom', 'kiss',
  'kitchen', 'knee', 'knife', 'knock', 'know', 'knowledge', 'lab', 'label', 'labor', 'laboratory',
  'lack', 'lady', 'lake', 'land', 'landscape', 'lane', 'language', 'lap', 'large', 'largely',
  'last', 'late', 'later', 'Latin', 'latter', 'laugh', 'laughter', 'launch', 'law', 'lawn',
  'lawsuit', 'lawyer', 'lay', 'layer', 'lead', 'leader', 'leadership', 'leading', 'leaf', 'league',
  'lean', 'learn', 'learning', 'least', 'leather', 'leave', 'left', 'leg', 'legacy', 'legal',
  'legend', 'legislation', 'legislative', 'legislator', 'legislature', 'legitimate', 'lemon', 'length', 'less', 'lesson',
  'let', 'letter', 'level', 'liberal', 'library', 'license', 'lick', 'lid', 'lie', 'life',
  'lifestyle', 'lifetime', 'lift', 'light', 'like', 'likely', 'limit', 'limitation', 'limited', 'line',
  'link', 'lip', 'liquid', 'list', 'listen', 'literally', 'literary', 'literature', 'little', 'live',
  'living', 'load', 'loan', 'local', 'locate', 'located', 'location', 'lock', 'long', 'long-term',
  'look', 'loose', 'lose', 'losing', 'loss', 'lost', 'lot', 'lots', 'loud', 'love',
  'lovely', 'lover', 'low', 'lower', 'luck', 'lucky', 'lunch', 'lung', 'machine', 'mad',
  'magazine', 'magic', 'mail', 'main', 'mainly', 'maintain', 'maintenance', 'major', 'majority', 'make',
  'maker', 'makeup', 'male', 'mall', 'man', 'manage', 'management', 'manager', 'manner', 'manufacturer',
  'manufacturing', 'many', 'map', 'margin', 'mark', 'marker', 'market', 'marketing', 'marriage', 'married',
  'marry', 'mask', 'mass', 'massive', 'master', 'match', 'mate', 'material', 'math', 'matter',
  'maximum', 'may', 'maybe', 'mayor', 'meal', 'mean', 'meaning', 'meanwhile', 'measure', 'measurement',
  'meat', 'mechanism', 'media', 'medical', 'medication', 'medicine', 'medium', 'meet', 'meeting', 'member',
  'membership', 'memory', 'mental', 'mention', 'menu', 'mere', 'merely', 'mess', 'message', 'metal',
  'meter', 'method', 'Mexican', 'middle', 'might', 'military', 'milk', 'mill', 'million', 'mind',
  'mine', 'minister', 'minor', 'minority', 'minute', 'miracle', 'mirror', 'miss', 'missile', 'mission',
  'mistake', 'mix', 'mixed', 'mixture', 'mode', 'model', 'moderate', 'modern', 'modest', 'mom',
  'moment', 'money', 'monitor', 'month', 'mood', 'moon', 'moral', 'more', 'moreover', 'morning',
  'mortgage', 'most', 'mostly', 'mother', 'motion', 'motivation', 'motor', 'mount', 'mountain', 'mouse',
  'mouth', 'move', 'movement', 'movie', 'much', 'multiple', 'murder', 'muscle', 'museum', 'music',
  'musical', 'musician', 'Muslim', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naked', 'name',
  'narrative', 'narrow', 'nation', 'native', 'natural', 'naturally', 'nature', 'near', 'nearby', 'nearly',
  'necessarily', 'necessary', 'neck', 'need', 'negative', 'negotiate', 'negotiation', 'neighbor', 'neighborhood', 'neither',
  'nerve', 'nervous', 'nest', 'net', 'network', 'never', 'nevertheless', 'new', 'newly', 'news',
  'newspaper', 'next', 'nice', 'night', 'nine', 'nineteen', 'ninety', 'nobody', 'nod', 'noise',
  'nomination', 'none', 'nonetheless', 'nor', 'norm', 'normal', 'normally', 'north', 'northern', 'nose',
  'not', 'note', 'notebook', 'nothing', 'notice', 'notion', 'novel', 'now', 'nowhere', 'nuclear',
  'number', 'numerous', 'nurse', 'nut', 'object', 'objective', 'obligation', 'observation', 'observe', 'observer',
  'obtain', 'obvious', 'obviously', 'occasion', 'occasionally', 'occupation', 'occupy', 'occur', 'ocean', 'odd',
  'odds', 'off', 'offense', 'offensive', 'offer', 'officer', 'official', 'often', 'oil', 'okay',
  'old', 'Olympic', 'once', 'one', 'ongoing', 'onion', 'online', 'only', 'onto', 'open',
  'opening', 'operate', 'operating', 'operation', 'operator', 'opinion', 'opponent', 'opportunity', 'oppose', 'opposing',
  'opposite', 'opposition', 'option', 'orange', 'order', 'ordinary', 'organic', 'organization', 'organizational', 'organize',
  'orientation', 'origin', 'otherwise', 'ought', 'ounce', 'our', 'ourselves', 'out', 'outcome', 'outdoor',
  'outer', 'outline', 'output', 'outside', 'oven', 'over', 'overall', 'overcome', 'overlook', 'owe',
  'own', 'owner', 'pace', 'pack', 'package', 'page', 'pain', 'painful', 'paint', 'painter',
  'painting', 'pair', 'pale', 'Palestinian', 'palm', 'pan', 'panel', 'pant', 'pants', 'par',
  'parade', 'parent', 'park', 'parking', 'part', 'participant', 'participate', 'participation', 'particular', 'particularly',
  'partly', 'partner', 'partnership', 'party', 'passage', 'passenger', 'passion', 'past', 'patch', 'path',
  'patient', 'patrol', 'pause', 'pay', 'payment', 'peace', 'peaceful', 'peak', 'peer', 'penalty',
  'people', 'pepper', 'per', 'perceive', 'percent', 'percentage', 'perception', 'perfect', 'perfectly', 'perform',
  'performance', 'perhaps', 'period', 'permanent', 'permission', 'permit', 'person', 'personal', 'personality', 'personally',
  'personnel', 'perspective', 'persuade', 'pet', 'phase', 'phenomenon', 'philosophy', 'phone', 'photo', 'photograph',
  'photographer', 'phrase', 'physical', 'physically', 'physician', 'piano', 'pick', 'picture', 'pie', 'piece',
  'pile', 'pill', 'pilot', 'pine', 'pink', 'pipe', 'pitch', 'pizza', 'place', 'plan',
  'plane', 'planet', 'planning', 'plant', 'plastic', 'plate', 'platform', 'player', 'playing', 'plaza',
  'plea', 'plead', 'pleasant', 'please', 'pleased', 'pleasure', 'plenty', 'plot', 'plus', 'pocket',
  'poem', 'poet', 'poetry', 'point', 'pole', 'police', 'policy', 'political', 'politically', 'politician',
  'politics', 'poll', 'pollution', 'pool', 'poor', 'pop', 'popular', 'population', 'porch', 'port',
  'portion', 'portrait', 'portray', 'pose', 'positive', 'possess', 'possibility', 'possibly', 'post', 'pot',
  'potato', 'potential', 'potentially', 'pound', 'pour', 'poverty', 'powder', 'poverty', 'powerful', 'practical',
  'practice', 'pray', 'prayer', 'precede', 'predict', 'prefer', 'preference', 'pregnancy', 'pregnant', 'preparation',
  'prepare', 'prescription', 'presence', 'present', 'presentation', 'preserve', 'president', 'presidential', 'press', 'pressure',
  'pretend', 'pretty', 'prevent', 'previous', 'previously', 'price', 'pride', 'priest', 'primarily', 'primary',
  'prime', 'principal', 'principle', 'print', 'prior', 'priority', 'prison', 'prisoner', 'privacy', 'private',
  'probably', 'probe', 'procedure', 'proceed', 'producer', 'product', 'production', 'profession', 'professional', 'professor',
  'profile', 'profit', 'progress', 'project', 'prominent', 'promise', 'promote', 'prompt', 'proof', 'proper',
  'properly', 'property', 'proportion', 'proposal', 'propose', 'proposed', 'prosecutor', 'prospect', 'protect', 'protection',
  'protein', 'protest', 'proud', 'prove', 'proven', 'provider', 'province', 'provision', 'psychological', 'psychologist',
  'psychology', 'pub', 'publication', 'publicity', 'publicly', 'publish', 'publisher', 'pull', 'pump', 'punish',
  'punishment', 'purchase', 'pure', 'purely', 'purple', 'purpose', 'pursue', 'push', 'quality', 'quarter',
  'quarterback', 'queen', 'quest', 'quick', 'quickly', 'quiet', 'quietly', 'quit', 'quite', 'quote',
  'rabbit', 'race', 'racial', 'radical', 'radio', 'rail', 'railroad', 'rain', 'raise', 'range',
  'rank', 'rapid', 'rapidly', 'rare', 'rarely', 'rate', 'rather', 'rating', 'ratio', 'raw',
  'reach', 'react', 'reaction', 'reader', 'reading', 'real', 'realistic', 'reality', 'realize', 'really',
  'rear', 'reasonable', 'recall', 'receive', 'recent', 'recently', 'reception', 'recipe', 'recipient', 'recognize',
  'recommend', 'recommendation', 'record', 'recording', 'recover', 'recovery', 'recruit', 'reduce', 'reduction', 'refer',
  'reference', 'reflect', 'reflection', 'reform', 'refugee', 'refuse', 'regard', 'regarding', 'regardless', 'regime',
  'regional', 'register', 'regular', 'regularly', 'regulate', 'regulation', 'reinforce', 'reject', 'relate', 'related',
  'relating', 'relation', 'relationship', 'relative', 'relatively', 'relax', 'relevant', 'relief', 'religion', 'religious',
  'rely', 'remaining', 'remarkable', 'remind', 'remote', 'removal', 'remove', 'repeat', 'repeatedly', 'replace',
  'reply', 'reporter', 'represent', 'representation', 'representative', 'Republican', 'reputation', 'request', 'require', 'requirement',
  'research', 'researcher', 'resemble', 'reservation', 'reserve', 'resident', 'resist', 'resistance', 'resolution', 'resolve',
  'resort', 'resource', 'respect', 'respond', 'respondent', 'response', 'responsibility', 'responsible', 'rest', 'restaurant',
  'restore', 'restrict', 'restriction', 'resulting', 'retain', 'retire', 'retirement', 'retreat', 'reveal', 'revenue',
  'reverse', 'review', 'revolution', 'revolutionary', 'reward', 'rhetoric', 'rhythm', 'rice', 'rich', 'rid',
  'ride', 'rifle', 'ring', 'rip', 'rise', 'rising', 'risk', 'ritual', 'rival', 'river',
  'rock', 'rocket', 'rod', 'role', 'roll', 'romantic', 'roof', 'rookie', 'root', 'rope',
  'rose', 'rough', 'roughly', 'round', 'route', 'routine', 'row', 'rub', 'rubber', 'ruin',
  'running', 'rural', 'rush', 'Russian', 'sack', 'sacred', 'sacrifice', 'safe', 'safety', 'sake',
  'salad', 'salary', 'sale', 'sales', 'salt', 'salvation', 'sand', 'sandwich', 'satellite', 'satisfaction',
  'satisfy', 'sauce', 'save', 'saving', 'savings', 'say', 'scale', 'scandal', 'scared', 'scenario',
  'scene', 'schedule', 'scheme', 'scholar', 'scholarship', 'scientific', 'scientist', 'scope', 'score', 'scream',
  'screen', 'script', 'scrutiny', 'sculpture', 'seal', 'search', 'seat', 'secondary', 'secret', 'secretary',
  'section', 'sector', 'secure', 'security', 'seek', 'seeking', 'seemingly', 'segment', 'seize', 'select',
  'selection', 'self', 'sell', 'senate', 'senator', 'senior', 'sentence', 'separate', 'sequence', 'series',
  'serious', 'seriously', 'servant', 'session', 'setting', 'settle', 'settlement', 'seven', 'seventeen', 'seventh',
  'seventy', 'severe', 'sexual', 'shade', 'shadow', 'shaft', 'shake', 'shall', 'shape', 'shaped',
  'sharp', 'shatter', 'shed', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shelter', 'shift',
  'shine', 'ship', 'shirt', 'shock', 'shoe', 'shoot', 'shooting', 'shop', 'shopping', 'shore',
  'short', 'shortly', 'shot', 'should', 'shoulder', 'shout', 'shower', 'shrug', 'shut', 'shy',
  'sick', 'sickness', 'sight', 'sign', 'signal', 'signature', 'significance', 'significant', 'significantly', 'silence',
  'silent', 'silver', 'similar', 'similarly', 'sing', 'singer', 'singing', 'sink', 'sir', 'sister',
  'site', 'situation', 'size', 'ski', 'skill', 'skin', 'skip', 'slave', 'sleep', 'slice',
  'slide', 'slight', 'slightly', 'slip', 'slow', 'slowly', 'smell', 'smile', 'smoke', 'smooth',
  'snap', 'snow', 'soap', 'soccer', 'so-called', 'soccer', 'sock', 'soft', 'software', 'soil',
  'solar', 'soldier', 'sole', 'solely', 'solid', 'solution', 'solve', 'somebody', 'somehow', 'someone',
  'somewhat', 'somewhere', 'song', 'soon', 'sophisticated', 'sorry', 'sort', 'soul', 'southern', 'Soviet',
  'spare', 'spark', 'spatial', 'spawn', 'specialist', 'species', 'specific', 'specifically', 'spectacular', 'spectrum',
  'speech', 'speed', 'spell', 'spelling', 'sponsor', 'sport', 'spot', 'spouse', 'spray', 'spread',
  'spring', 'square', 'squeeze', 'stability', 'stable', 'stack', 'stadium', 'staff', 'stage', 'stair',
  'stake', 'stamp', 'stand', 'standard', 'standing', 'star', 'stare', 'starting', 'starvation', 'statement',
  'station', 'statistics', 'statue', 'status', 'stay', 'steady', 'steal', 'steam', 'steel', 'steep',
  'steer', 'stem', 'step', 'stick', 'stiff', 'stimulus', 'stir', 'stock', 'stomach', 'stone',
  'storage', 'store', 'storm', 'strain', 'strand', 'strange', 'stranger', 'strategic', 'strategy', 'stream',
  'stress', 'stretch', 'strike', 'striking', 'string', 'strip', 'stroke', 'structure', 'struggle', 'studio',
  'stuff', 'stupid', 'style', 'subject', 'submit', 'subsequent', 'substance', 'substantial', 'substantially', 'substitute',
  'subtle', 'suburb', 'succeed', 'success', 'successful', 'successfully', 'sudden', 'suddenly', 'suffer', 'sufficient',
  'sugar', 'suggest', 'suggestion', 'suicide', 'suit', 'summer', 'summit', 'sum', 'super', 'superior',
  'supervise', 'supervisor', 'supplement', 'supply', 'supposed', 'supposedly', 'supreme', 'surely', 'surface', 'surgery',
  'surprise', 'surprised', 'surprising', 'surprisingly', 'surround', 'surrounding', 'survey', 'survival', 'survive', 'survivor',
  'suspect', 'suspend', 'sustain', 'swallow', 'swear', 'sweep', 'sweet', 'swim', 'swing', 'switch',
  'symbol', 'symptom', 'syndrome', 'synthesis', 'syrup', 'systematic', 'tail', 'take', 'taking', 'tale',
  'talent', 'talented', 'tank', 'tap', 'tape', 'target', 'task', 'teen', 'teenage', 'teenager',
  'telephone', 'telescope', 'television', 'temple', 'temporary', 'temptation', 'tenant', 'tend', 'tendency', 'tennis',
  'tension', 'tent', 'term', 'terminal', 'terrible', 'territory', 'terror', 'terrorism', 'terrorist', 'testing',
  'text', 'textbook', 'texture', 'than', 'thank', 'thanks', 'that', 'theater', 'their', 'them',
  'theme', 'themselves', 'theology', 'theoretical', 'theorist', 'therapy', 'thereafter', 'thereby', 'therefore', 'these',
  'thick', 'thickness', 'thief', 'thin', 'thinking', 'third', 'thirteen', 'thirty', 'this', 'thorn',
  'thorough', 'thoroughly', 'though', 'thought', 'thousand', 'thread', 'threat', 'threaten', 'threshold', 'throat',
  'throne', 'throughout', 'throw', 'thumb', 'thus', 'ticket', 'tide', 'tiger', 'tight', 'tightly',
  'till', 'timber', 'timing', 'tiny', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toe',
  'together', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'topic', 'toss', 'total',
  'totally', 'touch', 'touchdown', 'tough', 'tour', 'tourist', 'tournament', 'tower', 'track', 'traction',
  'trading', 'tradition', 'traditional', 'traditionally', 'traffic', 'tragedy', 'trail', 'train', 'trainer', 'training',
  'transfer', 'transform', 'transformation', 'transition', 'translate', 'translation', 'transmission', 'transmit', 'transparency', 'transparent',
  'transport', 'transportation', 'trap', 'trash', 'trauma', 'traveler', 'tray', 'treasure', 'treasury', 'treat',
  'treatment', 'treaty', 'tree', 'tremendous', 'trend', 'trial', 'triangle', 'tribal', 'tribe', 'tribunal',
  'trick', 'trigger', 'trillion', 'trim', 'triumph', 'troop', 'tropical', 'trouble', 'truck', 'truly',
  'trunk', 'trust', 'truth', 'tube', 'tuck', 'Tuesday', 'tuition', 'tumor', 'tune', 'tunnel',
  'turkey', 'twelve', 'twentieth', 'twenty', 'twice', 'twin', 'twist', 'typically', 'ugly', 'ultimate',
  'ultimately', 'unable', 'uncle', 'undergo', 'underlying', 'undoubtedly', 'unemployment', 'unexpected', 'unfortunately', 'unhappy',
  'uniform', 'union', 'universal', 'unlike', 'unlikely', 'unprecedented', 'unusual', 'upcoming', 'update', 'upgrade',
  'upper', 'upset', 'urban', 'urge', 'used', 'useful', 'user', 'usual', 'utility', 'vacation',
  'valley', 'valuable', 'vast', 'vegetable', 'vegetation', 'vehicle', 'venture', 'venue', 'verbal', 'verdict',
  'version', 'versus', 'vessel', 'veteran', 'via', 'victim', 'victory', 'video', 'view', 'viewer',
  'viewing', 'village', 'violate', 'violation', 'violence', 'violent', 'virtually', 'virtue', 'virus', 'visible',
  'vision', 'visitor', 'visual', 'vital', 'vivid', 'vocabulary', 'vocal', 'volume', 'volunteer', 'vote',
  'voter', 'vs', 'vulnerable', 'wage', 'wagon', 'waist', 'waiting', 'wake', 'walking', 'wander',
  'wanna', 'warm', 'warn', 'warning', 'warrant', 'warrior', 'washing', 'waste', 'watch', 'wave',
  'weak', 'wealth', 'wealthy', 'weapon', 'wear', 'weather', 'web', 'wedding', 'weed', 'weigh',
  'weight', 'welcome', 'welfare', 'western', 'wet', 'whale', 'whatever', 'wheat', 'wheel', 'when',
  'whenever', 'whereas', 'wherever', 'whether', 'whilst', 'whisper', 'whistle', 'whoever', 'wholly', 'whom',
  'wide', 'widely', 'widespread', 'width', 'wild', 'wilderness', 'wildlife', 'willing', 'willingness', 'wind',
  'wipe', 'wire', 'wisdom', 'wise', 'wish', 'withdraw', 'withdrawal', 'witness', 'wolf', 'wooden',
  'woods', 'worker', 'working', 'workout', 'workplace', 'workshop', 'worldwide', 'worm', 'worried', 'worry',
  'worth', 'worthwhile', 'worthy', 'would', 'wound', 'wrap', 'wrist', 'writer', 'writing', 'written',
  'wrong', 'yacht', 'yard', 'yeah', 'yell', 'yellow', 'yesterday', 'yield', 'you', 'young',
  'youngster', 'yours', 'yourself', 'yourselves', 'youth', 'youthful', 'zone', 'zoo',
  
  // Common 3-letter words that might be missing
  'ace', 'act', 'ado', 'aft', 'ago', 'aid', 'ail', 'aim', 'ale', 'ant',
  'ape', 'apt', 'arc', 'ark', 'ash', 'ate', 'awe', 'aye', 'ban', 'bar',
  'bay', 'bet', 'bid', 'bin', 'bow', 'bud', 'bug', 'bun', 'cab', 'cam',
  'can', 'cap', 'cue', 'dam', 'den', 'dew', 'die', 'dim', 'din', 'dip',
  'dot', 'dry', 'dub', 'dud', 'due', 'dug', 'dye', 'ear', 'ebb', 'ego',
  'elf', 'elk', 'elm', 'emu', 'era', 'eve', 'ewe', 'eye', 'fad', 'fan',
  'fed', 'fee', 'fen', 'fib', 'fig', 'fin', 'fir', 'fit', 'fix', 'flu',
  'foe', 'fog', 'for', 'fox', 'fry', 'fur', 'gag', 'gap', 'gas', 'gel',
  'gem', 'gin', 'gnu', 'god', 'gum', 'gut', 'gym', 'had', 'hag', 'ham',
  'has', 'hay', 'hen', 'her', 'hew', 'hex', 'hey', 'hid', 'hoe', 'hop',
  'hue', 'hug', 'hum', 'hut', 'ice', 'icy', 'ill', 'imp', 'ink', 'inn',
  'ion', 'irk', 'ire', 'its', 'ivy', 'jab', 'jag', 'jam', 'jar', 'jaw',
  'jet', 'jig', 'jog', 'jot', 'jug', 'keg', 'kin', 'kit', 'lab', 'lac',
  'lad', 'lag', 'lap', 'law', 'lax', 'lea', 'led', 'leg', 'let', 'lid',
  'lit', 'log', 'lop', 'low', 'lug', 'mad', 'mat', 'max', 'men', 'met',
  'mid', 'mix', 'mob', 'mod', 'mop', 'mow', 'mud', 'mug', 'nab', 'nag',
  'nap', 'net', 'new', 'nib', 'nit', 'nix', 'nod', 'nor', 'not', 'now',
  'nub', 'nun', 'nut', 'oak', 'oar', 'oat', 'odd', 'ode', 'off', 'oft',
  'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our', 'out', 'owe', 'owl',
  'own', 'pad', 'pal', 'pan', 'paw', 'pea', 'peg', 'per', 'pet', 'pie',
  'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pry', 'pub', 'pug',
  'pun', 'pup', 'rag', 'ram', 'rap', 'rat', 'raw', 'ray', 'red', 'rib',
  'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'rot', 'row', 'rub', 'rug',
  'rum', 'rut', 'rye', 'sac', 'sad', 'sag', 'sap', 'sat', 'saw', 'sax',
  'say', 'sea', 'sec', 'see', 'sew', 'sex', 'shy', 'sic', 'sim', 'sin',
  'sip', 'sir', 'sis', 'sit', 'ski', 'sky', 'sly', 'sob', 'sod', 'son',
  'sop', 'sot', 'sow', 'soy', 'spa', 'spy', 'sub', 'sue', 'sum', 'sun',
  'sup', 'tab', 'tad', 'tag', 'tan', 'tap', 'tar', 'tat', 'tax', 'tea',
  'ted', 'tee', 'ten', 'the', 'thy', 'tic', 'tie', 'tin', 'tip', 'toe',
  'tom', 'ton', 'too', 'tor', 'tot', 'tow', 'toy', 'try', 'tub', 'tug',
  'two', 'urn', 'use', 'van', 'vat', 'vet', 'vex', 'via', 'vie', 'vim',
  'vow', 'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee',
  'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'won', 'woo', 'wow',
  'yak', 'yam', 'yap', 'yaw', 'yea', 'yep', 'yes', 'yet', 'yew', 'yin',
  'you', 'yum', 'zap', 'zen', 'zip', 'zit', 'zoo'
]);

// Alternative: Load wordlist from JSON file
// If you want to use a large wordlist, create a JSON file like this:
// assets/wordlist.json: ["word1", "word2", "word3", ...]
let EXTERNAL_WORDS: Set<string> | null = null;

export function loadWordlistFromJSON(wordlist: string[]): void {
  EXTERNAL_WORDS = new Set(wordlist.map(w => w.toLowerCase().trim()));
  console.log(`✅ Loaded ${EXTERNAL_WORDS.size} words from external wordlist`);
}

// Function to check if a word is valid
export function isValidWord(word: string): boolean {
  const normalizedWord = word.toLowerCase().trim();
  
  // Check minimum length
  if (normalizedWord.length < 3) {
    return false;
  }
  
  // Check external wordlist first (if loaded), otherwise use built-in
  if (EXTERNAL_WORDS) {
    return EXTERNAL_WORDS.has(normalizedWord);
  }
  
  // Fall back to built-in dictionary
  return COMMON_WORDS.has(normalizedWord);
}

// Function to check if a word contains the required letters
export function wordContainsLetters(word: string, letters: string): boolean {
  const normalizedWord = word.toLowerCase();
  const normalizedLetters = letters.toLowerCase();
  
  return normalizedWord.includes(normalizedLetters);
}

// Function to validate a word submission
export function validateWordSubmission(
  word: string,
  requiredLetters: string,
  usedWords: string[]
): { valid: boolean; message: string } {
  const normalizedWord = word.toLowerCase().trim();
  
  // Check minimum length
  if (normalizedWord.length < 3) {
    return { valid: false, message: 'Word must be at least 3 letters long' };
  }
  
  // Check if word contains required letters
  if (!wordContainsLetters(normalizedWord, requiredLetters)) {
    return { valid: false, message: `Word must contain "${requiredLetters}"` };
  }
  
  // Check if word already used
  if (usedWords.includes(normalizedWord)) {
    return { valid: false, message: 'Word already used in this game' };
  }
  
  // Check if word is valid in dictionary
  if (!isValidWord(normalizedWord)) {
    return { valid: false, message: 'Not a valid word. Try another!' };
  }
  
  return { valid: true, message: 'Word accepted!' };
}

