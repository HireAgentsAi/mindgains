# 🔑 Environment Variables - Setup Guide

## 📊 **Current Status Analysis**

### ✅ **Variables You Already Have** (in .env file):
```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VoYXhob210Y2phZnZmdXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjgzNTAsImV4cCI6MjA2OTgwNDM1MH0.rnit3edoub7Xq5rJHZmNDDwjgLTWC_Zc7LdF9xA8hMw
EXPO_PUBLIC_SUPABASE_URL=https://iyguhaxhomtcjafvfupu.supabase.co
OPENAI_API_KEY=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
CLAUDE_API_KEY=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
GROK_API_KEY=xai-G4uiPdQlSZp9VLsjMCLxJxuqxcLS4nQuTNHEUIxvSFU8q3Sn5p3V9Q7sSgz6oyN9V0YtahQ0slTEtGZU
```

---

## ❌ **Variables You NEED TO ADD to Supabase Dashboard**

### 🎯 **Go to: Supabase Dashboard → Project Settings → Edge Functions → Environment Variables**

Add these **5 missing variables**:

### **1. 🔥 CRITICAL - Supabase Service Key**
```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```
**Status:** ❌ **MISSING - CRITICAL** 
**Impact:** ALL functions will fail without this
**How to find:** Supabase Dashboard → Settings → API → service_role key (secret)

### **2. 🔥 CRITICAL - Supabase URL**
```bash
SUPABASE_URL=https://iyguhaxhomtcjafvfupu.supabase.co
```
**Status:** ❌ **MISSING - CRITICAL**
**Impact:** Database connections will fail

### **3. ⚠️ OPTIONAL - New Premium APIs**
```bash
GOOGLE_VISION_API_KEY=AIzaSyDLTojohr7zh_dHHrnlZPDREUd3Y-DhNqQ
YOUTUBE_API_KEY=AIzaSyClxo4xJ-kgG6Y3vWiR8vlIc_iReU0ulx8
PDF_CO_API_KEY=ragularvind84@gmail.com_Uo9PUnXKShIJKJQyws18GzoTAku7Fm5JnV5LaEGezxp4fpsui3i0Fx9OHYLHlqLI
```

---

## 🚨 **IMMEDIATE ACTION REQUIRED**

### **Step 1: Get Your Supabase Service Role Key**
1. Go to: https://supabase.com/dashboard/project/iyguhaxhomtcjafvfupu/settings/api
2. Copy the **`service_role`** key (NOT the anon key)
3. It should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 2: Add Environment Variables to Supabase**
1. Go to: https://supabase.com/dashboard/project/iyguhaxhomtcjafvfupu/functions
2. Click **"Environment variables"** tab
3. Add these 5 variables:

```bash
# CRITICAL - Required for ALL functions
SUPABASE_URL=https://iyguhaxhomtcjafvfupu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Premium Features - Optional but recommended
GOOGLE_VISION_API_KEY=AIzaSyDLTojohr7zh_dHHrnlZPDREUd3Y-DhNqQ
YOUTUBE_API_KEY=AIzaSyClxo4xJ-kgG6Y3vWiR8vlIc_iReU0ulx8
PDF_CO_API_KEY=ragularvind84@gmail.com_Uo9PUnXKShIJKJQyws18GzoTAku7Fm5JnV5LaEGezxp4fpsui3i0Fx9OHYLHlqLI
```

---

## 📊 **Functions That Use Each Variable**

### **SUPABASE_SERVICE_ROLE_KEY** (Used by 12 functions):
- create-user-profile
- submit-daily-quiz  
- validate-daily-quiz
- get-mission-content
- update-quiz-progress
- battle-operations
- regenerate-topic-questions
- update-progress
- generate-subject-quiz
- daily-quiz-generator
- get-mascot-recommendations
- create-mission
- generate-topic-questions
- india-challenge

### **GOOGLE_VISION_API_KEY** (Used by 1 function):
- process-image-ocr → Camera scanning feature

### **YOUTUBE_API_KEY** (Used by 1 function):
- process-youtube → YouTube video processing

### **PDF_CO_API_KEY** (Used by 1 function):
- process-pdf → PDF text extraction

---

## 🎯 **Priority Order**

### **🔥 CRITICAL (Add These First):**
1. `SUPABASE_SERVICE_ROLE_KEY` - **ALL core functions need this**
2. `SUPABASE_URL` - **Database connections need this**

### **🎁 PREMIUM (Add These for Full Features):**
3. `PDF_CO_API_KEY` - PDF processing (9979 credits available)
4. `YOUTUBE_API_KEY` - YouTube video processing  
5. `GOOGLE_VISION_API_KEY` - Camera OCR scanning

---

## ⚡ **Quick Setup Commands**

**After adding the service role key, test if core functions work:**

```bash
# Test daily quiz generation
curl -X POST "https://iyguhaxhomtcjafvfupu.supabase.co/functions/v1/daily-quiz-generator" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subject": "History", "difficulty": "medium"}'
```

---

## 🚨 **Current Impact**

**Without Service Role Key:**
- ❌ Daily quizzes won't generate
- ❌ Mission creation fails  
- ❌ Battle system broken
- ❌ India Challenge not working
- ❌ Progress tracking fails

**With Service Role Key Added:**
- ✅ ALL core features work
- ✅ App becomes fully functional
- ✅ Users can start using immediately

---

## 🎉 **After Setup**

Once you add the **Service Role Key**, your app will be **100% functional** with:
- ✅ Daily AI quizzes
- ✅ Mission creation system
- ✅ Real-time battles
- ✅ India Challenge tournaments  
- ✅ Complete progress tracking

The premium APIs are just bonus features on top of an already amazing app!