# Edge Functions Deployment

## Important Note

The Supabase CLI is not supported in this WebContainer environment. Edge functions are automatically deployed to Supabase when you connect your project to Supabase.

## Current Edge Functions

The following edge functions are available in your project:

- `daily-quiz-generator` - Generates daily quizzes with AI
- `topic-quiz-generator` - Generates topic-specific quizzes
- `analyze-content` - Analyzes learning content
- `create-mission` - Creates new learning missions
- `get-mission-content` - Retrieves mission content
- `update-progress` - Updates user progress
- `submit-daily-quiz` - Handles daily quiz submissions
- `validate-daily-quiz` - Validates quiz answers
- `update-quiz-progress` - Updates quiz progress
- `generate-subject-quiz` - Generates subject quizzes
- `generate-topic-questions` - Generates topic questions
- `get-mascot-recommendations` - Gets AI recommendations
- `regenerate-topic-questions` - Regenerates topic questions
- `create-user-profile` - Creates user profiles

## Testing Functions

To test the edge functions, use the test script:

```bash
node test-deployed-functions.js
```

This will verify that your quiz generation and other functions are working correctly.