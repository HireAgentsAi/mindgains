# MindGains AI - Complete Setup Guide

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo`)
- Supabase CLI (optional for local development)
- Android Studio or Expo Go app on your Android device

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Your `.env` file is already configured with:
- ✅ Supabase URL and Anon Key
- ✅ OpenAI API Key
- ✅ Additional AI service keys

### 4. Supabase Setup

#### Deploy Edge Functions
```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref iyguhaxhomtcjafvfupu

# Deploy edge functions
npx supabase functions deploy daily-quiz-generator
npx supabase functions deploy generate-topic-quiz
npx supabase functions deploy submit-daily-quiz
npx supabase functions deploy create-mission
npx supabase functions deploy update-progress
```

#### Set Edge Function Secrets
```bash
# Set OpenAI API key for edge functions
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

### 5. Run the App

#### For Development
```bash
# Start Expo development server
npx expo start

# Press 'a' to open on Android emulator
# Or scan QR code with Expo Go app
```

#### For Android Build
```bash
# Create development build
npx expo run:android

# Create production APK
npx eas build --platform android --profile production
```

## 📱 App Features

### Core Features Working:
1. **Daily Quiz**: AI-generated daily quizzes with 10 questions
2. **Topic Quizzes**: Subject-specific quizzes with 15 questions
3. **User Progress**: Track performance and learning patterns
4. **Mascot AI**: Personalized recommendations
5. **Achievements**: Gamification system
6. **Subscription**: Free tier (3 quizzes/day) and Premium

### Quiz Generation Flow:
1. User opens app → Checks for today's quiz
2. If no quiz exists → Edge function generates using OpenAI
3. Questions saved to database → Displayed to user
4. User submits → Progress tracked and analyzed

## 🔧 Troubleshooting

### Issue: Quizzes Not Generating
**Solution**: 
1. Check Supabase logs: `npx supabase functions logs daily-quiz-generator`
2. Verify OpenAI API key is set in edge function secrets
3. Check if database has proper permissions

### Issue: App Shows Demo Data
**Solution**: This is expected behavior when Supabase is not reachable. The app has built-in demo mode.

### Issue: Edge Functions Timeout
**Solution**: 
1. Increase timeout in function config
2. Use GPT-3.5-turbo instead of GPT-4 for faster response
3. Implement caching for frequently requested topics

## 🎯 Making It #1 Educational App

### 1. Content Strategy
- **Daily Fresh Content**: AI generates new questions daily
- **Exam-Focused**: Questions tailored for UPSC, SSC, Banking
- **Progressive Difficulty**: Adapts to user performance
- **Current Affairs**: Updated weekly with latest events

### 2. User Engagement
- **Daily Streaks**: Reward consistent usage
- **Leaderboards**: Regional and national rankings
- **Social Sharing**: Share achievements and scores
- **Push Notifications**: Daily reminders at optimal times

### 3. Monetization
- **Freemium Model**: 3 free quizzes daily
- **Premium Plans**: 
  - ₹99/month - Unlimited quizzes
  - ₹999/year - All features + priority support
- **In-App Purchases**: Extra lives, hints, explanations

### 4. Marketing Strategy
- **ASO**: Optimize for "UPSC quiz", "GK quiz", "daily quiz"
- **Content Marketing**: Blog about exam tips and current affairs
- **Influencer Partnerships**: Collaborate with education YouTubers
- **Referral Program**: Users earn premium days for referrals

### 5. Technical Optimizations
- **Offline Mode**: Cache questions for offline access
- **Performance**: Lazy loading and code splitting
- **Analytics**: Track user behavior with Mixpanel/Amplitude
- **A/B Testing**: Optimize UI/UX for engagement

## 📊 Success Metrics

Track these KPIs:
1. **DAU/MAU**: Daily/Monthly Active Users
2. **Retention**: D1, D7, D30 retention rates
3. **Engagement**: Questions attempted per session
4. **Conversion**: Free to paid conversion rate
5. **LTV**: Lifetime value per user

## 🚨 Important Notes

1. **API Keys Security**: Never commit `.env` file to git
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Cost Management**: Monitor OpenAI API usage
4. **Data Privacy**: Comply with Indian data protection laws
5. **Regular Updates**: Keep content fresh and relevant

## 🎉 Next Steps

1. **Launch Beta**: Test with 100 users
2. **Gather Feedback**: Iterate based on user input
3. **Scale Infrastructure**: Prepare for 1M+ users
4. **Expand Content**: Add more subjects and languages
5. **Build Community**: Create study groups and forums

---

**Support**: For issues, check logs and Supabase dashboard
**Documentation**: See `/docs` folder for detailed API docs