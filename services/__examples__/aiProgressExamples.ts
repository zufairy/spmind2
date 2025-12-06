// Example usage of AI Progress Service functions
import {
  logAISession,
  getUserProgress,
  updateUserProgress,
  getLastAISession,
  getUserAISessions,
  getUserProgressSummary,
  LogAISessionParams,
  UpdateUserProgressParams,
} from '../aiProgressService';

// Example: Log an AI session
export async function exampleLogAISession() {
  const params: LogAISessionParams = {
    user_id: 'user-uuid-here',
    session_id: 'session-uuid-here', // optional
    subject: 'Mathematics',
    topic: 'Algebra',
    question: 'What is the quadratic formula?',
    ai_answer: 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a',
    question_type: 'homework',
    difficulty_level: 'medium',
    syllabus_alignment: 'KSSM',
    grade_level: 'Form 4',
    language_used: 'english',
    response_time_ms: 1500,
    user_rating: 5,
    is_helpful: true,
    tags: ['algebra', 'formula', 'quadratic'],
  };

  const result = await logAISession(params);
  
  if (result.success) {
    console.log('AI session logged:', result.data);
  } else {
    console.error('Error logging AI session:', result.error);
  }
}

// Example: Get user progress for a specific topic
export async function exampleGetUserProgress() {
  const result = await getUserProgress('user-uuid-here', 'Mathematics', 'Algebra');
  
  if (result.success) {
    if (result.data) {
      console.log('User progress found:', result.data);
    } else {
      console.log('No progress found for this topic');
    }
  } else {
    console.error('Error fetching user progress:', result.error);
  }
}

// Example: Update user progress
export async function exampleUpdateUserProgress() {
  const params: UpdateUserProgressParams = {
    user_id: 'user-uuid-here',
    subject: 'Mathematics',
    topic: 'Algebra',
    last_score: 85,
    mastery_level: 'intermediate',
    last_session_id: 'session-uuid-here', // optional
  };

  const result = await updateUserProgress(params);
  
  if (result.success) {
    console.log('User progress updated:', result.data);
  } else {
    console.error('Error updating user progress:', result.error);
  }
}

// Example: Get last AI session
export async function exampleGetLastAISession() {
  const result = await getLastAISession('user-uuid-here');
  
  if (result.success) {
    if (result.data) {
      console.log('Last AI session:', result.data);
    } else {
      console.log('No AI sessions found');
    }
  } else {
    console.error('Error fetching last AI session:', result.error);
  }
}

// Example: Get user's AI sessions with filtering
export async function exampleGetUserAISessions() {
  const result = await getUserAISessions('user-uuid-here', {
    subject: 'Mathematics',
    question_type: 'homework',
    limit: 10,
    offset: 0,
  });
  
  if (result.success) {
    console.log('User AI sessions:', result.data);
  } else {
    console.error('Error fetching user AI sessions:', result.error);
  }
}

// Example: Get user progress summary
export async function exampleGetUserProgressSummary() {
  const result = await getUserProgressSummary('user-uuid-here');
  
  if (result.success) {
    console.log('User progress summary:', result.data);
  } else {
    console.error('Error fetching user progress summary:', result.error);
  }
}

// Example: Complete workflow - AI interaction with progress tracking
export async function exampleCompleteAIWorkflow() {
  const userId = 'user-uuid-here';
  const sessionId = 'session-uuid-here';
  
  // 1. Log the AI session
  const logResult = await logAISession({
    user_id: userId,
    session_id: sessionId,
    subject: 'Science',
    topic: 'Photosynthesis',
    question: 'How does photosynthesis work?',
    ai_answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy...',
    question_type: 'explanation',
    difficulty_level: 'medium',
    syllabus_alignment: 'KSSM',
    grade_level: 'Form 3',
    language_used: 'english',
    response_time_ms: 2000,
    user_rating: 4,
    is_helpful: true,
    tags: ['biology', 'photosynthesis', 'plants'],
  });

  if (!logResult.success) {
    console.error('Failed to log AI session:', logResult.error);
    return;
  }

  // 2. Update user progress based on the interaction
  const progressResult = await updateUserProgress({
    user_id: userId,
    subject: 'Science',
    topic: 'Photosynthesis',
    last_score: 90, // Assume user got 90% on related quiz
    mastery_level: 'intermediate',
    last_session_id: sessionId,
  });

  if (progressResult.success) {
    console.log('AI workflow completed successfully');
    console.log('Logged session:', logResult.data);
    console.log('Updated progress:', progressResult.data);
  } else {
    console.error('Failed to update user progress:', progressResult.error);
  }
}
