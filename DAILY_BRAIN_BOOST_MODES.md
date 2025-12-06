# Daily Brain Boost - Three Mode System

## Overview
Daily Brain Boost is a 15-minute AI tutoring session with three distinct learning modes. The AI automatically adapts based on the user's age and Malaysian education level (KSSR or KSSM).

---

## 🎯 Age-Based Syllabus Detection

### How It Works
1. **Database Retrieval**: User's age is pulled from the `users` table
2. **Automatic Assignment**: System determines appropriate syllabus based on age
3. **Visual Display**: Syllabus badge shows on screen during session
4. **AI Context**: AI receives specific instructions for that syllabus level

### Syllabus Rules

| User Age | Syllabus Assigned | Content Allowed | Redirect Behavior |
|----------|-------------------|-----------------|-------------------|
| **≤ 12** | KSSR only | Primary School (Year 1-6) | Redirects KSSM questions to KSSR topics |
| **13-17** | KSSM only | Secondary School (Form 1-5) | Redirects KSSR questions to KSSM topics |
| **> 17** | Both KSSR & KSSM | All levels | Can teach both (for teachers/parents) |

### Code Implementation
```typescript
const getSyllabusInfo = () => {
  const userAge = user?.age || 0;
  
  if (userAge <= 12) {
    return { syllabus: 'KSSR', level: 'Primary School' };
  } else if (userAge >= 13 && userAge <= 17) {
    return { syllabus: 'KSSM', level: 'Secondary School' };
  } else {
    return { syllabus: 'KSSR & KSSM', level: 'All Levels' };
  }
};
```

---

## ⏱️ Time Management

### Total Session: 15 Minutes
- **Learning Mode:** 3 minutes
- **Teaching Mode:** 7 minutes
- **Quiz Mode:** 5 minutes
- Automatic transitions between modes
- Manual skip option (except in quiz mode)
- Session end notification at 15 minutes

### Timer Display
- **Total Time**: Shows remaining time for entire session
- **Mode Time**: Shows remaining time for current mode
- Updates every second
- Visual warnings when time is running low

---

## 📚 Mode 1: Learning Mode (3 minutes)

### Purpose
AI has a friendly conversation about the student's school day to discover what they learned, how they felt, and identify any confusion. This is primarily **discovery and exploration** with light, brief interesting additions.

### AI Behavior
- **Warm & Friendly**: Starts with "How was school today?"
- **Genuinely Curious**: Asks what they learned
- **Active Listener**: Pays attention to their responses
- **Adds Brief Interest**: Drops in quick fun facts (1 sentence) when topics come up
- **Light Touch**: Keeps it conversational, not heavy teaching
- **Discovery Focus**: Main goal is to understand their day and identify gaps
- **Syllabus-Aware**: Only discusses KSSR or KSSM topics based on age
- **Natural Flow**: Like chatting with a friend about school

### Conversation Flow
1. **Opening**: "How was school today?"
2. **Discover**: "What subjects did you have?" / "What did you learn?"
3. **Listen**: Student explains what they learned
4. **Brief Interest**: Add ONE quick fun fact or interesting point
5. **Explore Feelings**: "How did you find that?"
6. **Identify Confusion**: "Was anything tricky or confusing?"
7. **Continue**: Move naturally to next subject

### Key Differences Between Modes
- **Learning Mode**: Light discovery conversation + brief fun facts → Identifies what they learned and any confusion
- **Teaching Mode**: Deep, comprehensive teaching on WEAK subjects → Explains difficult concepts thoroughly  
- **Quiz Mode**: Rapid testing → Assesses knowledge through questions

### Example Conversation (KSSR - Age 10) - Light Discovery
```
AI: "Hi Sarah! Welcome to Learning Mode. So, how was school today? 
     Tell me all about it!"

Student: "It was okay. We had Math and Science."

AI: "Nice! Which subject did you enjoy more today?"

Student: "Science. We learned about plants and photosynthesis."

AI: "Photosynthesis! Cool topic. Malaysian rainforests are full of 
     plants doing that right now! What did your teacher teach you?"

Student: "That plants need sunlight, water and carbon dioxide."

AI: "That's right! How did you find that lesson - easy or a bit tricky?"

Student: "It was okay, but I'm not sure I get all of it."

AI: "No worries, we can work on that later. What about Math class?"

Student: "We did fractions like 1/2 and 1/4."

AI: "Ah fractions - super useful for calculating duit raya money! 
     Did you find fractions easy or confusing?"

Student: "A bit confusing."

AI: "Got it. We'll definitely cover that in our teaching session. 
     Was there anything else interesting today?"
```

### Example Conversation (KSSM - Age 15) - Light Discovery
```
AI: "Hi Ahmad! Welcome to Learning Mode. How was school today? 
     Tell me all about it!"

Student: "It was tiring. We had double period Chemistry."

AI: "Double Chemistry - that's a lot! What topic did you cover today?"

Student: "Chemical bonding - ionic and covalent bonds."

AI: "Ah, bonding! You see those in daily life - salt and water 
     are perfect examples. What did your teacher explain?"

Student: "Ionic is when electrons transfer, covalent is sharing."

AI: "Good! You've got the basics. How did you find the lesson - 
     clear or a bit confusing?"

Student: "A bit confusing, especially covalent bonds."

AI: "I hear you - bonding can be tricky. We'll definitely go through 
     that properly in Teaching Mode since Chemistry is one of your 
     weak subjects. Anything else from today?"

Student: "We also had Maths - Add Maths was okay."

AI: "Nice! Was Add Maths easier than Chemistry for you today?"
```

### Conversation Techniques

**Keep It Light:**
- Brief fun facts (1 sentence max)
- Quick connections to daily life
- Acknowledge but don't deep-dive

**Examples of Light Additions:**
| Student Says | AI Adds (Brief) |
|--------------|-----------------|
| "Photosynthesis" | "Cool! Malaysian rainforests do that all day!" |
| "Fractions" | "Ah, super useful for calculating duit raya!" |
| "Chemical bonds" | "You see those in salt and water every day!" |
| "Sejarah" | "That's why we celebrate Merdeka on August 31st!" |
| "Newton's Laws" | "That's physics when you push a shopping trolley!" |

### Types of Questions Asked

**Opening Questions:**
- "How was school today?"
- "What kind of day did you have?"
- "Tell me about your school day!"

**Subject Discovery:**
- "What did you learn in [subject]?"
- "What topic did your teacher cover?"
- "Can you tell me about [subject] class?"

**Understanding Check + Teaching:**
- "What did you understand about it?" → [Student answers] → [AI teaches more]
- "Can you explain it?" → [Listen] → [Add interesting facts]

**Difficulty Identification:**
- "Was anything confusing?"
- "What part was tricky?"
- "Need me to explain anything?"

### Engagement Techniques

**React Naturally:**
- "That's interesting!"
- "I see..."
- "Great job!"
- "Tell me more!"
- "Wow, that sounds fun!"
- "I understand..."

**Build Rapport:**
- Remember what they said earlier in the conversation
- Connect different subjects they mention
- Show empathy ("That sounds challenging!")
- Celebrate their successes ("You did great!")

**Stay Focused:**
- If they mention off-syllabus topics, acknowledge but redirect:
  - "That's interesting, but that's more for [other level]. Let's talk about what you learned in your [current level] class today."
- Keep bringing conversation back to school day and learning

**Natural Flow:**
- Don't feel forced to ask all 7 questions in order
- Follow the student's lead
- If they're excited about a topic, explore it deeper
- If they're struggling, be supportive and gentle

### Learning Mode Goals

By the end of 5 minutes, the AI should have discovered:

**DISCOVERED:**
1. ✅ What subjects they studied today
2. ✅ What topics were covered in class
3. ✅ How they felt about the lessons
4. ✅ What they found interesting
5. ✅ **What they found challenging/confusing** (Critical for Teaching Mode)
6. ✅ Their general understanding level

**ADDED (Light):**
1. ✅ A few brief fun facts (not deep teaching)
2. ✅ Quick connections to daily Malaysian life
3. ✅ Acknowledgment and encouragement

**Key Principle:** Learning Mode is about **discovery and identification**. The heavy teaching happens in Teaching Mode which focuses on weak subjects.

All identified confusion and weak areas flow into **Teaching Mode** for deep, comprehensive instruction.

### Transition
After 3 minutes OR manual skip → **Teaching Mode**

*Note: Any difficulties or confusion mentioned in Learning Mode will be addressed in Teaching Mode.*

---

## 🎯 Mode 2: Teaching Mode (7 minutes)

### Purpose
AI provides **deep, comprehensive teaching** on the student's WEAK SUBJECTS and addresses any confusion identified in Learning Mode. This is where real instruction happens.

### AI Behavior
- **Focuses on Weak Subjects**: Addresses subjects from user profile (e.g., Mathematics, Chemistry)
- **Deep Teaching**: Provides comprehensive, in-depth explanations (not just surface level)
- **Multiple Techniques**: Uses various teaching methods to ensure understanding
- **Malaysian Context**: Rich local examples (RM, food, daily life, Malaysian culture)
- **Patient & Thorough**: Takes time to explain deeply, checks understanding frequently
- **Re-teaches**: If student doesn't understand, explains differently
- **Age-Appropriate**: Matches KSSR or KSSM curriculum level
- **Encouraging**: "That's a tricky topic - let me help you master it!"

### Teaching Approach

**1. Identify the Need**
- Start with weak subject from profile
- Ask what they're struggling with
- Address confusion from Learning Mode

**2. Teach In-Depth**
Use multiple techniques:
- **Real-World Examples**: Malaysian money, food, nature
- **Analogies**: Compare to familiar concepts
- **Step-by-Step**: Break complex topics into simple steps
- **Visual Descriptions**: Paint a picture with words
- **Memory Tricks**: Mnemonics and patterns
- **Why Explanations**: Explain reasoning, not just facts

**3. Check Understanding**
- "Does this make sense?"
- "Can you explain it back to me?"
- "Let me know if anything is unclear"

**4. Practice**
- Provide example problems
- Walk through solutions together
- Give them a try

**5. Move Forward**
- Once understood, move to next concept
- Connect topics together

### Example Deep Teaching (KSSR - Age 10, Weak in Fractions)
```
AI: "Now let's move to Teaching Mode. I know Mathematics, especially 
    fractions, is one of your weak subjects. Let me help you understand 
    fractions really well.
    
    Imagine you have RM20 duit raya. If you spend 1/2 of it, how much 
    do you spend? You divide RM20 by 2, which gives you RM10. So 1/2 
    means 'divide by 2'.
    
    Now if you spend 1/4, you divide RM20 by 4, which is RM5. See the 
    pattern? The number on the BOTTOM (denominator) tells you how many 
    pieces to divide into.
    
    Here's the key: The BIGGER the bottom number, the SMALLER each piece! 
    Think of cutting a kuih - if you cut it into 4 pieces, each piece is 
    smaller than if you cut it into just 2 pieces, right?
    
    So 1/4 is actually SMALLER than 1/2, even though 4 is bigger than 2!
    
    Does this make sense?"

Student: "I think so..."

AI: "Let me give you a practice question. If you have RM30 and you spend 
    1/3 of it, how much do you spend? Remember: divide by the bottom number."

Student: "RM10?"

AI: "Perfect! Yes! RM30 divided by 3 = RM10. You've got it! Now you understand 
    how fractions work. Great job!"
```

### Example Deep Teaching (KSSM - Age 15, Weak in Chemistry)
```
AI: "Let's switch to Teaching Mode. Chemistry is one of your weak subjects, 
    and I heard you found chemical bonding confusing today. Let me explain 
    the difference between ionic and covalent bonds clearly.
    
    Think of it like this: Ionic bonds are like GIVING or DONATING. One atom 
    completely gives its electron to another atom. It's like you giving your 
    friend your phone - they now own it completely.
    
    Covalent bonds are like SHARING. Both atoms share electrons together. 
    Neither atom gives up the electron. It's like you and your friend sharing 
    one phone - you both use it together.
    
    Here's a real example: In your nasi lemak, the table salt (NaCl) is an 
    ionic bond. The sodium atom GAVE one electron to chlorine completely. 
    
    The water in your drink (H2O) is a covalent bond. The hydrogen and oxygen 
    atoms SHARE electrons - nobody gave theirs away completely.
    
    Memory trick: Think 'ionic = I own it' (transfer), 'covalent = we share it'.
    
    Does that make the difference clearer?"

Student: "Yes! That's much clearer now!"

AI: "Great! Let me give you a question: Is carbon dioxide (CO2) ionic or 
    covalent?"

Student: "Covalent?"

AI: "Exactly right! Carbon and oxygen share electrons. You're getting this! 
    The key is: metals + non-metals = ionic (transfer). Non-metals + non-metals 
    = covalent (share). Does that help?"
```

### Teaching Techniques in Detail

**1. Real-World Malaysian Examples**
| Topic | Example |
|-------|---------|
| **Fractions** | "RM20 × 1/2 = RM10. Perfect for calculating duit raya!" |
| **Chemistry** | "Table salt in your nasi lemak is NaCl - an ionic bond!" |
| **Physics** | "Pushing a shopping trolley at pasar is Newton's F = ma!" |
| **Photosynthesis** | "Malaysian rainforest trees produce oxygen for thousands!" |
| **Percentages** | "20% discount on RM50 means you save RM10!" |

**2. Simple Analogies**
- Ionic vs Covalent: "Giving your phone vs sharing a phone"
- Fractions: "Cutting a kuih into pieces"
- Atoms: "Like tiny LEGO blocks building everything"
- Gravity: "Like a magnet pulling everything down"

**3. Memory Tricks**
- "Ionic = I own it (transfer), Covalent = We share it"
- "Please Excuse My Dear Aunt Sally (PEMDAS/Order of operations)"
- "King Henry Died By Drinking Chocolate Milk (metric conversions)"

**4. Step-by-Step Breakdown**
```
Complex topic → Step 1 → Step 2 → Step 3 → Complete understanding
Always build progressively, checking at each step
```

**5. Why Explanations**
- Don't just say "this is how it works"
- Explain WHY it works that way
- Connect to bigger picture
- Make them understand the logic

**6. Practice & Application**
- Give example problem
- Walk through solution together
- Let them try one
- Provide gentle correction if needed

### What's Pulled From Database
- `weak_subjects` array - Primary focus for teaching
- `strong_subjects` array (for context and encouragement)
- `age` (for appropriate difficulty and examples)
- `academic_goals` (for motivation and relevance)

### Teaching Mode Goals

By the end of 5 minutes, the student should:
1. ✅ Understand at least 1-2 difficult concepts from weak subjects
2. ✅ Have clear explanations with Malaysian examples
3. ✅ Know memory tricks or patterns to remember
4. ✅ Feel more confident about their weak subject
5. ✅ Be ready to test their understanding in Quiz Mode

**Key Principle:** Teaching Mode is where REAL LEARNING happens through deep, patient, comprehensive instruction.

### Transition
After 7 minutes OR manual skip → **Quiz Mode**

*Teaching Mode prepares student for Quiz Mode by ensuring they understand concepts before being tested.*

---

## 🏆 Mode 3: Quiz Mode (5 minutes)

### Purpose
AI rapidly quizzes the user on their weak subjects in a continuous cycle until the 5-minute timer runs out.

### Quiz Cycle (Repeats Continuously)

```
1. ASK QUESTION ❓
      ↓
2. USER ANSWERS 💬
      ↓
3. EVALUATE (Right ✓ or Wrong ✗)
      ↓
4. EXPLAIN WHY 📚
      ↓
5. NEXT QUESTION ➡️
      ↓
   (Repeat until timer = 0:00)
```

### AI Behavior
- **Continuous Flow**: Ask → Answer → Feedback → Explain → Next Question (repeat)
- **One Question at a Time**: Clear, focused questions
- **Immediate Evaluation**: Tells if RIGHT ✓ or WRONG ✗
- **Always Explains**: Gives reasoning for every answer
- **Quick Pace**: 8-12 questions in 5 minutes (aim for ~30-40 seconds per question)
- **Varied Types**: Multiple choice, true/false, calculations, fill-in-blanks
- **Progressive Difficulty**: Starts easier, gradually increases
- **Syllabus-Based**: Questions strictly from KSSR or KSSM
- **Encouraging**: Positive feedback even when wrong
- **No Manual Skip**: Must complete or wait for timer

### Question Types

**Multiple Choice**
```
"What is the capital of Malaysia?
A) Kuala Lumpur
B) Penang  
C) Johor Bahru"
```

**True/False**
```
"True or false: Plants make their own food through photosynthesis."
```

**Fill in the Blank**
```
"Complete this equation: 5 × ___ = 25"
```

**Calculations**
```
"Calculate: RM15.50 + RM8.30 = ?"
```

**Short Answer**
```
"What is the formula for the area of a circle?"
```

### Example Quiz Session (KSSR - Age 10, Math)

```
AI: "Great! Now for Quiz Mode. I'll test you on Mathematics 
    from your KSSR syllabus. Ready? Let's go!

    Question 1: If you have RM10 and spend RM3.50, how much 
    do you have left?"

Student: "RM6.50"

AI: "Correct! ✓ You subtracted RM3.50 from RM10 perfectly. 
    That's RM10 - RM3.50 = RM6.50. Great job!
    
    Question 2: True or false - A triangle has 4 sides."

Student: "False"

AI: "Yes! ✓ That's right! A triangle has 3 sides, not 4. 
    A shape with 4 sides is called a quadrilateral.
    
    Question 3: What is 7 × 8?"

Student: "54"

AI: "Not quite. ✗ The correct answer is 56 because 7 × 8 = 56. 
    Here's a tip: 7 × 8 is close to 8 × 8 = 64, just minus 8!
    
    Question 4: Complete this: 1/2 + 1/2 = ___"

Student: "1"

AI: "Excellent! ✓ When you add two halves, you get one whole! 
    1/2 + 1/2 = 1. Perfect!
    
    Question 5: If a pencil costs RM1.20 and an eraser costs 
    RM0.80, what's the total?"

[Quiz continues until timer runs out...]
```

### Example Quiz Session (KSSM - Age 15, Chemistry)

```
AI: "Excellent! Now for Quiz Mode. I'll quiz you on Chemistry 
    from your KSSM Form 4 syllabus. Are you ready?

    Question 1: What is the chemical formula for water?"

Student: "H2O"

AI: "Perfect! ✓ H2O means 2 hydrogen atoms bonded to 1 oxygen atom. 
    You nailed it!
    
    Question 2: True or false - Ionic bonds involve sharing electrons."

Student: "True"

AI: "Not quite. ✗ That's actually false. Ionic bonds involve 
    TRANSFERRING electrons, not sharing. Covalent bonds involve 
    sharing electrons. Remember: ionic = transfer, covalent = share.
    
    Question 3: What type of reaction is this? 
    CH₄ + 2O₂ → CO₂ + 2H₂O"

Student: "Combustion"

AI: "Correct! ✓ This is combustion because methane (CH₄) is burning 
    in oxygen to produce carbon dioxide and water. Well done!
    
    Question 4: Calculate the relative molecular mass of NaCl 
    (Na = 23, Cl = 35.5)"

Student: "58.5"

AI: "Excellent! ✓ You added 23 + 35.5 = 58.5 correctly. That's 
    the Mr of sodium chloride (table salt)!
    
    Question 5: What pH value indicates a neutral solution?
    A) pH 1  B) pH 7  C) pH 14"

[Quiz continues until timer runs out...]
```

### Feedback Patterns

**When Correct ✓**
- "Correct! / Yes! / Perfect! / Excellent! / That's right!"
- Brief explanation why it's correct
- One additional learning point
- Immediately ask next question

**When Wrong ✗**
- "Not quite. / That's incorrect. / Close, but..."
- State the correct answer clearly
- Explain WHY it's correct
- Provide a helpful tip or memory trick
- Immediately ask next question

### Quiz Strategy

**Pacing**
- Aim for 10-15 questions in 5 minutes
- ~20-30 seconds per question cycle
- Keep feedback SHORT (1-2 sentences)
- Move quickly to next question

**Difficulty Progression**
1. Start with easier questions (build confidence)
2. Gradually increase difficulty
3. Mix easy and hard throughout
4. End with moderate difficulty (leave on positive note)

**Question Variety**
- Mix different types (MC, T/F, calculations, short answer)
- Cover different sub-topics within the weak subject
- Use Malaysian context in word problems
- Keep questions age-appropriate

### Quiz Features
- ✅ Continuous question flow until timer ends
- ✅ Immediate right/wrong feedback
- ✅ Educational explanations for all answers
- ✅ Varied question types
- ✅ Progressive difficulty
- ✅ Malaysian context in examples
- ✅ Encouraging tone throughout
- ✅ Adapts to KSSR/KSSM level
- ✅ Focuses on weak subjects from profile
- ✅ Tracks approximately 8-12 questions per session

### Quiz Mode Summary

**Goal:** Test knowledge on weak subjects continuously until timer ends

**Key Metrics:**
- 10-15 questions per 5-minute session
- ~20-30 seconds per question cycle
- Mix of 5 question types
- Progressive difficulty
- 100% feedback rate (every answer gets explanation)

**Success Indicators:**
- Student stays engaged throughout
- Understands why answers are right/wrong
- Learns from mistakes
- Builds confidence with encouragement
- Covers multiple sub-topics within weak subject

### Transition
After 5 minutes → **Session Complete!**

The AI congratulates the student and provides encouragement to continue tomorrow.

---

## 🔄 Mode Transitions

### Automatic Transitions
- Triggered when mode timer reaches 0
- Shows transition modal with new mode info
- Plays audio announcement of new mode
- Resets mode timer to 5 minutes

### Transition Modal
```
┌─────────────────────────────┐
│   [Mode Icon in Color]      │
│                             │
│   🎯 Teaching Mode          │
│                             │
│   Let's review your         │
│   weak areas                │
└─────────────────────────────┘
```

### Manual Skip
- "Next Mode ▶" button available
- Only in Learning and Teaching modes
- Not available in Quiz mode
- Immediate transition to next mode

---

## 🎨 Visual Indicators

### Syllabus Badge
```
┌─────────────────────────────┐
│      📚 Syllabus            │
│         KSSR                │
│      Age 10 years           │
└─────────────────────────────┘
```

### Mode Indicator (Color-Coded)
- **Learning Mode**: Blue (#4A90E2)
- **Teaching Mode**: Orange (#F59E0B)
- **Quiz Mode**: Green (#10B981)

### Timer Display
```
┌──────────────┬──────────────────────┐
│ Total Time   │  📚 Learning Mode   │
│   12:45      │      4:23           │
└──────────────┴──────────────────────┘
```

---

## 🤖 AI Instructions Summary

### System Prompt Template
```
You are a Malaysian education AI tutor helping [Name] with their 
Daily Brain Boost session.

STUDENT PROFILE:
- Age: [X] years old
- Syllabus: [KSSR/KSSM/Both]
- Level: [Primary/Secondary School]
- Weak subjects: [List]
- Strong subjects: [List]

[Age-specific guidance]

CURRENT MODE: [Learning/Teaching/Quiz Mode specific instructions]

CRITICAL RULES:
1. ONLY teach [KSSR/KSSM] content appropriate for age [X]
2. Use Malaysian educational context and examples
3. Keep content age-appropriate
4. Be encouraging and culturally sensitive
5. Provide concise responses (2-3 sentences maximum)
6. Redirect off-syllabus topics politely
7. Use real Malaysian school examples

Language: [English/Bahasa Melayu]
```

---

## 📊 Session Flow Diagram

```
Start Session (15:00)
        ↓
   Time Check Modal
   "Got 15 minutes?"
        ↓
    ┌───────────────────────┐
    │ 📚 LEARNING MODE      │ ← 3:00 minutes
    │ What did you learn?   │
    │ [Age-based KSSR/KSSM] │
    └───────────────────────┘
            ↓ (Auto/Manual)
    ┌───────────────────────┐
    │ 🎯 TEACHING MODE      │ ← 7:00 minutes
    │ Review weaknesses     │
    │ [Age-based KSSR/KSSM] │
    └───────────────────────┘
            ↓ (Auto only)
    ┌───────────────────────┐
    │ 🏆 QUIZ MODE          │ ← 5:00 minutes
    │ Test knowledge        │
    │ [Age-based KSSR/KSSM] │
    └───────────────────────┘
            ↓
    Session Complete!
    Summary & Congratulations
```

---

## 🌍 Bilingual Support

All prompts, UI elements, and AI responses support both:
- **English** (EN)
- **Bahasa Melayu** (MS)

Users can switch language at any time during the session.

---

## 🔐 Data Flow

1. **User opens Daily Brain Boost**
2. **System pulls from database:**
   - `age` → Determines KSSR/KSSM
   - `weak_subjects` → Teaching & Quiz focus
   - `strong_subjects` → Context & encouragement
   - `full_name` → Personalization
3. **AI receives context:**
   - Age and syllabus level
   - Current mode instructions
   - Student weaknesses/strengths
4. **Real-time interaction:**
   - Voice recording & transcription
   - AI streaming response
   - Text-to-speech playback
5. **Session management:**
   - Timer countdown
   - Mode transitions
   - Session completion

---

## ✅ Implementation Checklist

- [x] Age-based syllabus detection
- [x] Three distinct modes with different AI behavior
- [x] 15-minute total timer
- [x] 5-minute per-mode timer
- [x] Automatic mode transitions
- [x] Manual skip for Learning & Teaching modes
- [x] Visual syllabus indicator
- [x] Color-coded mode indicators
- [x] Transition animations & modals
- [x] Malaysian context in AI prompts
- [x] KSSR/KSSM boundary enforcement
- [x] Bilingual support (EN/MS)
- [x] Database integration for user data
- [x] Voice interaction (recording & playback)
- [x] Session end handling

---

## 🚀 Future Enhancements

1. **Progress Tracking**: Save quiz scores and learning progress
2. **Adaptive Difficulty**: Adjust based on quiz performance
3. **Subject Selection**: Let user choose focus subject
4. **Achievement Badges**: Reward consistent participation
5. **Parent Reports**: Summary of session for parents
6. **Offline Mode**: Cached syllabus content for offline use
7. **Multi-Language**: Add Chinese and Tamil support
8. **Custom Time**: Allow adjustable session lengths
9. **Group Sessions**: Multi-player learning sessions
10. **AI Personalization**: Learn from past sessions

---

## 📝 Notes

- Session cannot be paused (encourages focus)
- Quiz mode requires completion or time expiry
- All content is curriculum-aligned
- Age detection is automatic and invisible to user
- Syllabus switching is immediate if age changes in database
- Voice interaction is primary input method
- Text backup available if voice fails

