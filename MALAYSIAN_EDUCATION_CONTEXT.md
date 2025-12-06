# Malaysian Education Context for Genius App

## Overview
The Genius App is designed specifically for Malaysian students aged 7-17, following the national education curriculum.

## Malaysian Education Syllabuses

### KSSR - Kurikulum Standard Sekolah Rendah (Primary School Standard Curriculum)
- **Target Age**: 7-12 years old (Year 1-6)
- **Key Subjects**:
  - Bahasa Melayu
  - English
  - Mathematics (Matematik)
  - Science (Sains)
  - Islamic/Moral Education
  - Arts & Physical Education
  - Design & Technology
  - Music

### KSSM - Kurikulum Standard Sekolah Menengah (Secondary School Standard Curriculum)
- **Target Age**: 13-17 years old (Form 1-5)
- **Core Subjects**:
  - Bahasa Melayu
  - English
  - Mathematics (Matematik)
  - Science (Sains)
  - History (Sejarah)
  - Islamic/Moral Education
- **Elective Subjects**:
  - Additional Mathematics
  - Physics, Chemistry, Biology
  - Economics, Business Studies
  - Geography
  - Various technical and vocational subjects

## Daily Brain Boost Implementation

### Age-Based Syllabus System 🎯

The AI **automatically detects the user's age from the database** and determines the appropriate syllabus:

| Age Range | Syllabus | Description | Content Restrictions |
|-----------|----------|-------------|---------------------|
| **≤ 12 years** | **KSSR only** | Primary School (Tahun 1-6) | Only teaches KSSR content. Will redirect if asked about KSSM topics. |
| **13-17 years** | **KSSM only** | Secondary School (Tingkatan 1-5) | Only teaches KSSM content. Will redirect if asked about KSSR topics. |
| **> 17 years** | **Both KSSR & KSSM** | Teachers, Parents, Adult Learners | Can access both curricula to help younger students. |

#### How It Works:
1. **Database Pull**: User's age is retrieved from the `users` table
2. **Automatic Detection**: System calculates appropriate syllabus based on age
3. **AI Context**: AI is instructed to ONLY teach content from the assigned syllabus
4. **Visual Indicator**: Syllabus badge shows current level on screen
5. **Smart Redirects**: If user asks about wrong syllabus, AI politely redirects

### AI Context & Behavior
The AI tutor in Daily Brain Boost has been programmed to:

1. **Curriculum Awareness**
   - Automatically recognizes user's age and appropriate syllabus
   - KSSR topics for primary students (≤12)
   - KSSM topics for secondary students (13-17)
   - Both syllabi for adults (>17)
   - Strictly stays within assigned curriculum boundaries

2. **Cultural Sensitivity**
   - Use Malaysian context in examples
   - Reference local culture and environment
   - Understand bilingual nature (English/Malay)

3. **Age-Appropriate Content**
   - Content dynamically adjusted based on actual user age
   - Difficulty level matches school year/form
   - Encouraging and supportive tone

### Three Learning Modes

#### 📚 Learning Mode (3 minutes) - Discovery & Light Conversation
The AI has a **friendly conversation** about the student's school day to discover what they learned:
- Opens warmly: "How was school today?"
- Discovers what subjects they studied and topics covered
- Adds brief fun facts (1 sentence) when topics come up
- Pattern: Ask → Listen → Brief comment → Explore feelings → Identify confusion
- **Main goal:** Discover what they learned and what confused them
- Light and conversational (not heavy teaching)
- Identifies areas needing help (flows into Teaching Mode)

**Brief Examples:**
- Student mentions "photosynthesis" → AI: "Cool! Malaysian rainforests do that all day!"
- Student says "fractions" → AI: "Ah, super useful for duit raya calculations!"
- Student learned "chemical bonds" → AI: "You see those in salt and water every day!"

**Key Difference:** Learning Mode is light discovery. Teaching Mode is deep instruction on weak subjects.

#### 🎯 Teaching Mode (7 minutes) - Deep Instruction
The AI provides **comprehensive, in-depth teaching** on weak subjects:
- Focuses specifically on weak subjects from profile
- Provides deep explanations with multiple techniques
- Uses rich Malaysian examples (RM, food, daily life)
- Teaches with analogies, memory tricks, step-by-step breakdowns
- Patient and thorough - takes time to ensure understanding
- Addresses confusion identified in Learning Mode

#### 🏆 Quiz Mode (5 minutes) - Continuous Testing Cycle
The AI quizzes the student in a rapid-fire cycle that repeats until time runs out:
- **Pattern:** Ask Question → Answer → Right/Wrong → Explain Why → Next Question → Repeat
- Aims for 8-12 questions in 5 minutes
- Varied question types: multiple choice, true/false, calculations, fill-in-blanks
- Immediate right ✓ or wrong ✗ feedback
- Always explains the reasoning
- Uses KSSR/KSSM curriculum only
- Focuses on weak subjects
- Progressive difficulty (starts easier, gets harder)
- Quick pace with short feedback (1-2 sentences)
- Encouraging even when wrong

## Examples of Malaysian Context

### Mathematics
- Word problems using Malaysian currency (Ringgit Malaysia)
- Examples with local contexts (pasar, sekolah, etc.)
- Measurement units commonly used in Malaysia

### Science
- Local flora and fauna examples
- Malaysian climate and geography
- Local environmental issues

### Languages
- Bahasa Melayu grammar and literature
- English with Malaysian context
- Bilingual support throughout

### History
- Malaysian history (KSSM requirement)
- Local historical events and figures
- National heritage and culture

## Examples of Age-Based Learning

### Example 1: Primary Student (Age 10)
**User Profile:**
- Age: 10 years old
- Assigned Syllabus: **KSSR only**
- Expected Level: Year 4

**Scenario:**
```
Student: "Can you teach me about chemical equations?"
AI: "That topic is for secondary school (KSSM). Let's focus on your KSSR content instead! 
     How about we talk about states of matter or simple mixtures that you're learning in Year 4?"
```

### Example 2: Secondary Student (Age 15)
**User Profile:**
- Age: 15 years old
- Assigned Syllabus: **KSSM only**
- Expected Level: Form 3

**Scenario:**
```
Student: "What did I learn about Pythagorean Theorem today?"
AI: "Great! The Pythagorean Theorem is in your Form 3 KSSM syllabus. 
     Can you tell me what you remember about a² + b² = c²?"
```

### Example 3: Adult User (Age 25)
**User Profile:**
- Age: 25 years old
- Assigned Syllabus: **Both KSSR & KSSM**
- Role: Teacher/Parent

**Scenario:**
```
User: "How do I explain fractions to my Year 3 student?"
AI: "Perfect! For KSSR Year 3, start with simple fractions like 1/2 and 1/4 using visual aids. 
     You can use examples like pizza slices or kuih - very relatable for Malaysian kids!"
```

## AI Guidelines Summary

The AI follows these principles:
✅ **Automatically detect age** from database and assign appropriate syllabus
✅ Only discuss curriculum topics matching user's age group
✅ Use Malaysian educational context
✅ Keep content age-appropriate based on actual user age
✅ Be culturally sensitive
✅ Provide concise, focused responses (2-3 sentences)
✅ **Strictly enforce syllabus boundaries** - redirect off-level topics
✅ Calculate appropriate school year/form based on age

## Benefits

1. **Age-Intelligent**: Automatically detects user age and assigns correct syllabus
2. **Curriculum-Aligned**: Content precisely matches what students learn in school
3. **Culturally Relevant**: Examples and context are locally meaningful
4. **Level-Appropriate**: Content matches exact school year/form level
5. **Exam-Focused**: Helps with actual school assessments (UPSR, PT3, SPM)
6. **Bilingual Support**: English and Bahasa Melayu options
7. **Smart Boundaries**: Prevents teaching content above or below student's level
8. **Adult Learning**: Teachers and parents (>17) can access both syllabi to help students

## Future Enhancements

Potential improvements:
- Specific year/form level detection
- Subject-specific KSSR/KSSM standards
- Integration with Malaysian exam formats (UPSR, PT3, SPM)
- State-specific content variations
- Local language support (Chinese, Tamil schools)

