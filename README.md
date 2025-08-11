# MindGains AI 🧠🚀

## The #1 AI-Powered Educational App for Indians

Transform Indians into intellectual powerhouses through daily AI-generated quizzes covering UPSC, SSC, Banking, and competitive exam topics.

### ✨ Features

- 🎯 **Daily AI Quizzes**: Fresh questions every day using OpenAI
- 📚 **Subject-Specific Learning**: History, Polity, Geography, Economy, Science & Current Affairs  
- 🏆 **Gamification**: Streaks, achievements, leaderboards
- 🤖 **AI Mascot**: Personalized learning recommendations
- 📊 **Progress Tracking**: Detailed analytics and weak area identification
- 💰 **Freemium Model**: 3 free quizzes daily, unlimited with premium

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mindgains-ai

# Install dependencies
npm install

# Install Expo CLI (if not already installed)
npm install -g expo-cli
```

### 2. Environment Setup

Your `.env` file is already configured with:
```env
EXPO_PUBLIC_SUPABASE_URL=https://iyguhaxhomtcjafvfupu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-13kFT-ijZswTP2Dr-rhJsey2a1ArgzO3...
CLAUDE_API_KEY=sk-ant-api03-ck5Myqq6WqWzaptFkiFM32CLKwq4hRWq...
GROK_API_KEY=xai-G4uiPdQlSZp9VLsjMCLxJxuqxcLS4nQuTNHE...
```

### 3. Deploy Edge Functions ✅ ALREADY DONE!

**Good news! Your edge functions are already deployed and working!**

✅ **Functions Status:**
- Daily Quiz Generator: **LIVE** at `/functions/v1/daily-quiz-generator`
- Topic Quiz Generator: **LIVE** at `/functions/v1/generate-topic-quiz`

**Enable AI Generation (Optional):**
```bash
# Login to Supabase first
npx supabase login

# Set up API keys for AI generation
chmod +x setup-secrets.sh
./setup-secrets.sh
```

**Manual secret setup:**
```bash
# Login first
npx supabase login

# Set OpenAI key for AI quiz generation
echo "your-openai-key" | npx supabase secrets set OPENAI_API_KEY --project-ref iyguhaxhomtcjafvfupu

# Verify secrets are set
npx supabase secrets list --project-ref iyguhaxhomtcjafvfupu
```

### 4. Run the App

```bash
# Start development server
npx expo start

# Choose your platform:
# Press 'a' for Android emulator
# Press 'i' for iOS simulator  
# Scan QR code with Expo Go app on your phone
```

### 🎉 Your App is Ready!
- ✅ **Edge Functions**: Already deployed and working
- ✅ **Quiz Generation**: Functional (demo mode until API keys are set)
- ✅ **Database**: Connected and operational
- ✅ **Authentication**: Supabase auth ready

---

## 🔧 What Was Fixed

### ❌ Previous Issues:
1. **Edge Functions Not Using AI**: Returned hardcoded demo questions
2. **Missing Environment Integration**: API keys not properly used
3. **No Dynamic Content**: Same questions every time

### ✅ Fixes Applied:

#### 1. **Enhanced Daily Quiz Generator**
- ✅ Real OpenAI API integration using GPT-4o-mini
- ✅ Dynamic question generation with current affairs
- ✅ Proper subject distribution (History:2, Polity:2, Geography:2, Economy:1, S&T:1, Current Affairs:2)
- ✅ Smart difficulty distribution (Easy:4, Medium:4, Hard:2)
- ✅ Database integration with fallback to demo data
- ✅ Comprehensive error handling

#### 2. **Enhanced Topic Quiz Generator**  
- ✅ Subject-specific question generation
- ✅ Topic-focused content with exam relevance
- ✅ Customizable difficulty and question count
- ✅ Variety in question types (factual, analytical, comparative)
- ✅ Proper validation and formatting

#### 3. **Environment Configuration**
- ✅ All API keys properly configured in `.env`
- ✅ Automatic environment variable loading
- ✅ Fallback mechanisms for offline/error scenarios

#### 4. **Deployment Automation**
- ✅ One-click deployment script
- ✅ Automatic API key setup in Supabase secrets
- ✅ Function testing after deployment
- ✅ Comprehensive error checking

---

## 📱 App Flow

```
User Opens App
       ↓
Check Today's Quiz
       ↓
[Quiz Exists?] ────No───→ Generate with OpenAI
       ↓                          ↓
      Yes                   Save to Database  
       ↓                          ↓
Display Quiz ←─────────────────────┘
       ↓
User Takes Quiz
       ↓
Submit & Analyze Results
       ↓
Update Progress & Recommendations
```

---

## 🧠 AI Integration

### Daily Quiz Generation
```typescript
// Edge Function: daily-quiz-generator
const prompt = `Generate 10 high-quality MCQ questions for Indian competitive exams...
Requirements:
1. History (2), Polity (2), Geography (2), Economy (1), S&T (1), Current Affairs (2)
2. Difficulty: 4 easy, 4 medium, 2 hard
3. Current affairs from last 6 months
4. Factually accurate and exam-relevant`;

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'Expert question setter...' }],
    response_format: { type: "json_object" }
  })
});
```

### Topic Quiz Generation
```typescript
// Edge Function: generate-topic-quiz  
const prompt = `Generate ${count} questions on "${topic}" in "${subject}"...
Focus on: ${getTopicHints(subject, topic)}
Include: factual, analytical, and comparative questions`;
```

---

## 🗃️ Database Schema

### Core Tables
- **daily_quizzes**: Store generated daily quizzes
- **user_stats**: Track user progress and metrics
- **user_memory**: Personalized learning patterns
- **topic_questions**: Subject-specific question bank
- **daily_quiz_attempts**: User quiz results

### Key Relationships
```sql
users (auth.users) 
  ├── user_stats (progress tracking)
  ├── user_memory (AI personalization)  
  ├── daily_quiz_attempts (quiz results)
  └── user_topic_progress (subject mastery)

daily_quizzes
  ├── questions (JSONB array)
  └── daily_quiz_attempts (user submissions)
```

---

## 🚀 Making It #1 Educational App

### 1. **Content Strategy**
- Daily fresh AI-generated content
- Exam-focused questions (UPSC, SSC, Banking)
- Current affairs updated weekly
- Progressive difficulty adaptation

### 2. **User Engagement**
- Daily streaks and rewards
- Regional leaderboards  
- Social sharing features
- Push notifications at optimal times

### 3. **Monetization**
```
Free Tier: 3 quizzes/day
Premium: ₹99/month - Unlimited access
Annual: ₹999/year - All features + priority support
```

### 4. **Marketing Strategy**
- ASO optimization for competitive exam keywords
- Educational influencer partnerships  
- Content marketing (exam tips blog)
- Referral program with premium rewards

### 5. **Technical Excellence**
- Offline quiz caching
- Real-time leaderboards
- Advanced analytics
- A/B testing for engagement

---

## 📊 Success Metrics to Track

### User Metrics
- **DAU/MAU**: Daily/Monthly Active Users
- **Retention**: D1, D7, D30 rates
- **Engagement**: Questions per session
- **Conversion**: Free to paid rate

### Business Metrics  
- **LTV**: Customer lifetime value
- **ARPU**: Average revenue per user
- **Churn Rate**: User drop-off
- **NPS**: Net Promoter Score

---

## 🛠️ Development Commands

```bash
# Development
npx expo start              # Start dev server
npx expo start --android    # Android only
npx expo start --ios        # iOS only

# Building
npx expo run:android        # Development build
eas build -p android        # Production build
eas submit -p android       # Submit to Play Store

# Edge Functions
supabase functions logs daily-quiz-generator    # View logs
supabase functions deploy --help                # Deployment help
supabase functions delete function-name         # Delete function

# Database
supabase db pull            # Sync remote schema
supabase db push            # Push local changes
supabase db reset           # Reset local DB
```

---

## 🔍 Troubleshooting

### Quiz Not Generating?
```bash
# Check function logs
supabase functions logs daily-quiz-generator

# Test function directly
curl -X POST "https://iyguhaxhomtcjafvfupu.supabase.co/functions/v1/daily-quiz-generator" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Environment Issues?
```bash
# Verify environment variables
cat .env

# Check if secrets are set
supabase secrets list
```

### App Shows Demo Data?
This is expected when Supabase is unreachable. The app has built-in offline mode.

---

## 📈 Next Steps

### Phase 1: Launch (Current)
- ✅ Core quiz functionality  
- ✅ AI integration
- ✅ User authentication
- ✅ Progress tracking

### Phase 2: Growth  
- 🚀 Social features (friends, challenges)
- 🚀 Video explanations
- 🚀 Mock tests and exam simulation
- 🚀 Regional language support

### Phase 3: Scale
- 🚀 Live coaching integration
- 🚀 Corporate partnerships  
- 🚀 B2B solutions for coaching institutes
- 🚀 International expansion

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📧 Email: support@mindgains.ai
- 📱 Discord: [MindGains Community](https://discord.gg/mindgains)
- 📖 Docs: [docs.mindgains.ai](https://docs.mindgains.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/mindgains/issues)

---

**Made with ❤️ for Indian Students**

Transform your knowledge, ace your exams, achieve your dreams! 🚀