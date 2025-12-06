// Mood analyzer for AI responses
export type AvatarMood = 'happy' | 'thinking' | 'listening' | 'excited' | 'curious' | 'neutral' | 'surprised' | 'focused';

interface MoodKeywords {
  happy: string[];
  thinking: string[];
  listening: string[];
  excited: string[];
  curious: string[];
  surprised: string[];
  focused: string[];
}

const moodKeywords: MoodKeywords = {
  happy: [
    'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'brilliant', 'perfect',
    'awesome', 'super', 'outstanding', 'terrific', 'splendid', 'marvelous', 'delightful',
    'joy', 'happy', 'glad', 'pleased', 'thrilled', 'excited', 'cheerful', 'bright',
    'congratulations', 'well done', 'good job', 'keep it up', 'you got this',
    '😊', '😄', '😃', '😁', '😆', '😍', '🥰', '😋', '🤗', '👍', '👏', '🎉', '🎊', '✨'
  ],
  thinking: [
    'let me think', 'hmm', 'interesting', 'let me consider', 'that\'s a good question',
    'let me analyze', 'thinking', 'consider', 'reflect', 'ponder', 'contemplate',
    '🤔', '🧐', '🤨', '🤓', '💭', '💡'
  ],
  listening: [
    'tell me more', 'go on', 'i\'m listening', 'continue', 'what else', 'and then',
    'please explain', 'can you elaborate', 'i want to hear', 'share with me',
    '👂', '👂‍♂️', '👂‍♀️', '📝', '✍️'
  ],
  excited: [
    'wow', 'incredible', 'unbelievable', 'mind-blowing', 'spectacular', 'phenomenal',
    'extraordinary', 'remarkable', 'stunning', 'breathtaking', 'jaw-dropping',
    'omg', 'oh my god', 'holy', 'amazing discovery', 'breakthrough', 'revolutionary',
    'game-changing', 'next level', 'out of this world', 'mind-boggling',
    '🤯', '😱', '😲', '😵', '💥', '🚀', '🔥', '⚡', '💫', '🌟', '⭐', '💎'
  ],
  curious: [
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'tell me about',
    'i wonder', 'i\'m curious', 'that\'s interesting', 'can you explain',
    'i\'d like to know', 'what do you think', 'how does', 'why is', 'what makes',
    '🤔', '🧐', '🤨', '🤓', '👀', '🔍', '🔎', '❓', '❔'
  ],
  surprised: [
    'wow', 'oh', 'really', 'seriously', 'no way', 'unexpected', 'surprising',
    'shocking', 'astonishing', 'stunning', 'incredible', 'unbelievable',
    '😱', '😲', '😳', '😨', '😰', '😯', '😮', '😧', '😦'
  ],
  focused: [
    'let\'s focus', 'concentrate', 'pay attention', 'important', 'key point',
    'remember', 'note', 'essential', 'crucial', 'critical', 'vital',
    '🎯', '📌', '📍', '💡', '🔑', '⭐', '⚡'
  ]
};

export function analyzeMood(text: string): AvatarMood {
  const lowerText = text.toLowerCase();
  
  // Count keyword matches for each mood
  const moodScores: Record<AvatarMood, number> = {
    happy: 0,
    thinking: 0,
    listening: 0,
    excited: 0,
    curious: 0,
    neutral: 0,
    surprised: 0,
    focused: 0
  };

  // Check for mood keywords
  Object.entries(moodKeywords).forEach(([mood, keywords]) => {
    keywords.forEach((keyword: string) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        moodScores[mood as AvatarMood]++;
      }
    });
  });

  // Check for question marks (curious)
  const questionCount = (text.match(/\?/g) || []).length;
  moodScores.curious += questionCount;

  // Check for exclamation marks (excited)
  const exclamationCount = (text.match(/!/g) || []).length;
  moodScores.excited += exclamationCount;

  // Check for ellipsis (thinking)
  const ellipsisCount = (text.match(/\.{3,}/g) || []).length;
  moodScores.thinking += ellipsisCount;

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  
  emojis.forEach(emoji => {
    if (moodKeywords.happy.includes(emoji)) moodScores.happy++;
    if (moodKeywords.thinking.includes(emoji)) moodScores.thinking++;
    if (moodKeywords.listening.includes(emoji)) moodScores.listening++;
    if (moodKeywords.excited.includes(emoji)) moodScores.excited++;
    if (moodKeywords.curious.includes(emoji)) moodScores.curious++;
    if (moodKeywords.surprised.includes(emoji)) moodScores.surprised++;
    if (moodKeywords.focused.includes(emoji)) moodScores.focused++;
  });

  // Find the mood with the highest score
  let maxMood: AvatarMood = 'neutral';
  let maxScore = 0;

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxMood = mood as AvatarMood;
    }
  });

  // Special cases
  if (text.includes('let me think') || text.includes('hmm')) {
    return 'thinking';
  }

  if (text.includes('tell me more') || text.includes('go on')) {
    return 'listening';
  }

  if (text.includes('wow') || text.includes('incredible') || exclamationCount > 2) {
    return 'excited';
  }

  if (questionCount > 1) {
    return 'curious';
  }

  if (text.includes('wow') || text.includes('oh') || text.includes('really') || text.includes('seriously') || text.includes('no way') || text.includes('unexpected') || text.includes('surprising') || text.includes('shocking') || text.includes('astonishing') || text.includes('stunning') || text.includes('incredible') || text.includes('unbelievable') || text.includes('😱') || text.includes('😲') || text.includes('😳') || text.includes('😨') || text.includes('😰') || text.includes('😯') || text.includes('😮') || text.includes('😧') || text.includes('😦')) {
    return 'surprised';
  }

  if (text.includes('let\'s focus') || text.includes('concentrate') || text.includes('pay attention') || text.includes('important') || text.includes('key point') || text.includes('remember') || text.includes('note') || text.includes('essential') || text.includes('crucial') || text.includes('critical') || text.includes('vital') || text.includes('🎯') || text.includes('📌') || text.includes('📍') || text.includes('💡') || text.includes('🔑') || text.includes('⭐') || text.includes('⚡')) {
    return 'focused';
  }

  return maxMood;
}

// Get mood based on AI state
export function getMoodFromState(
  isTalking: boolean,
  isProcessing: boolean,
  aiResponse: string = ''
): AvatarMood {
  if (isTalking) {
    return 'excited';
  }
  
  if (isProcessing) {
    return 'thinking';
  }
  
  if (aiResponse) {
    return analyzeMood(aiResponse);
  }
  
  return 'neutral';
}
