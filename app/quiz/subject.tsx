import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { ChevronLeft, Target, Clock, CircleCheck as CheckCircle, X, ArrowRight, Trophy, Star, Brain, BookOpen } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface SubjectQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exam_relevance?: string;
  subject: string;
  subtopic?: string;
}

export default function SubjectQuizScreen() {
  const params = useLocalSearchParams();
  const { subject, topicId, topicName, subjectName } = params;
  
  const [questions, setQuestions] = useState<SubjectQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const optionScale = useSharedValue(1);

  useEffect(() => {
    loadSubjectQuestions();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [subject, topicId]);

  useEffect(() => {
    if (questions.length > 0) {
      cardOpacity.value = withTiming(1, { duration: 800 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [questions]);

  const loadSubjectQuestions = async () => {
    try {
      console.log('Loading subject questions for:', { subject, topicId, topicName, subjectName })
      
      let subjectQuestions: SubjectQuestion[] = [];
      
      if (topicId) {
        console.log('Loading questions for specific topic:', topicId)
        // Load questions for specific topic
        const topicQuestions = await SupabaseService.getTopicQuestions(topicId as string);
        
        // Convert to SubjectQuestion format and randomly select 15
        subjectQuestions = topicQuestions
          .map(q => ({
            id: q.id,
            question: q.question,
            options: q.options as string[],
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points,
            exam_relevance: q.exam_relevance,
            subject: subjectName as string || 'General',
            subtopic: topicName as string
          }))
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);
      } else if (subject) {
        console.log('Loading questions for entire subject:', subject)
        
        // Try to generate questions using AI first
        const aiResult = await SupabaseService.generateTopicQuiz(
          subject as string,
          subject as string,
          'mixed',
          15
        );
        
        if (aiResult.success && aiResult.questions) {
          console.log('AI generated questions successfully:', aiResult.questions.length)
          subjectQuestions = aiResult.questions.map((q: any) => ({
            id: q.id || `ai_${Date.now()}_${Math.random()}`,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points,
            exam_relevance: q.exam_relevance,
            subject: subject as string,
            subtopic: 'AI Generated'
          }));
        } else {
          console.log('AI generation failed, using demo questions')
          // Use demo questions as fallback
          subjectQuestions = generateDemoQuestions(subject as string || 'General');
        }
      } else {
        console.log('No questions found, generating demo questions')
        // Generate demo questions as fallback
        subjectQuestions = generateDemoQuestions(subject as string || 'General');
      }
      
      if (subjectQuestions.length === 0) {
        // Generate demo questions if no questions found
        subjectQuestions = generateDemoQuestions(subject as string || 'General');
      }
      
      console.log('Final questions count:', subjectQuestions.length)
      setQuestions(subjectQuestions);
      setUserAnswers(new Array(subjectQuestions.length).fill(-1));
    } catch (error) {
      console.error('Error loading subject questions:', error);
      Alert.alert('Error', 'Failed to load quiz questions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoQuestions = (subjectName: string): SubjectQuestion[] => {
    const allDemoQuestions = {
      'History': [
        {
          id: 'hist1',
          question: 'Who founded the Mauryan Empire?',
          options: ['Chandragupta Maurya', 'Ashoka', 'Bindusara', 'Kautilya'],
          correct_answer: 0,
          explanation: 'Chandragupta Maurya founded the Mauryan Empire in 321 BCE with the help of Kautilya.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'History',
          subtopic: 'Ancient India'
        },
        {
          id: 'hist2',
          question: 'Which Mughal emperor built the Taj Mahal?',
          options: ['Akbar', 'Shah Jahan', 'Aurangzeb', 'Jahangir'],
          correct_answer: 1,
          explanation: 'Shah Jahan built the Taj Mahal in memory of his wife Mumtaz Mahal.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'History',
          subtopic: 'Medieval India'
        },
        {
          id: 'hist3',
          question: 'The Battle of Panipat (1526) was fought between?',
          options: ['Babur and Ibrahim Lodi', 'Akbar and Hemu', 'Ahmad Shah Abdali and Marathas', 'Prithviraj and Ghori'],
          correct_answer: 0,
          explanation: 'The First Battle of Panipat (1526) was fought between Babur and Ibrahim Lodi, establishing Mughal rule.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Medieval India'
        },
        {
          id: 'hist4',
          question: 'Who was known as the "Iron Man of India"?',
          options: ['Jawaharlal Nehru', 'Sardar Vallabhbhai Patel', 'Subhas Chandra Bose', 'Bhagat Singh'],
          correct_answer: 1,
          explanation: 'Sardar Vallabhbhai Patel was known as the "Iron Man of India" for his role in uniting the princely states.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'History',
          subtopic: 'Modern India'
        },
        {
          id: 'hist5',
          question: 'The Quit India Movement was launched in which year?',
          options: ['1940', '1942', '1944', '1946'],
          correct_answer: 1,
          explanation: 'The Quit India Movement was launched by Mahatma Gandhi on 8 August 1942.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Freedom Struggle'
        },
        {
          id: 'hist6',
          question: 'Which Harappan site is known as the "Manchester of Harappan Civilization"?',
          options: ['Harappa', 'Mohenjodaro', 'Dholavira', 'Lothal'],
          correct_answer: 3,
          explanation: 'Lothal is known as the "Manchester of Harappan Civilization" due to its bead-making industry.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'History',
          subtopic: 'Ancient India'
        },
        {
          id: 'hist7',
          question: 'The Sepoy Mutiny of 1857 started from which place?',
          options: ['Meerut', 'Delhi', 'Kanpur', 'Lucknow'],
          correct_answer: 0,
          explanation: 'The Sepoy Mutiny of 1857 started from Meerut on 10 May 1857.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Modern India'
        },
        {
          id: 'hist8',
          question: 'Who was the last Mughal emperor?',
          options: ['Aurangzeb', 'Bahadur Shah II', 'Shah Alam II', 'Akbar Shah II'],
          correct_answer: 1,
          explanation: 'Bahadur Shah II (Bahadur Shah Zafar) was the last Mughal emperor, exiled after 1857.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Medieval India'
        },
        {
          id: 'hist9',
          question: 'The Indus Valley Civilization belonged to which age?',
          options: ['Paleolithic Age', 'Neolithic Age', 'Bronze Age', 'Iron Age'],
          correct_answer: 2,
          explanation: 'The Indus Valley Civilization belonged to the Bronze Age (3300-1300 BCE).',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Ancient India'
        },
        {
          id: 'hist10',
          question: 'Which ruler is associated with the "Doctrine of Lapse"?',
          options: ['Lord Wellesley', 'Lord Dalhousie', 'Lord Cornwallis', 'Lord Hastings'],
          correct_answer: 1,
          explanation: 'Lord Dalhousie introduced the Doctrine of Lapse policy to annex Indian princely states.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'History',
          subtopic: 'British Rule'
        },
        {
          id: 'hist11',
          question: 'The Chola dynasty reached its peak under which ruler?',
          options: ['Rajaraja Chola I', 'Rajendra Chola I', 'Kulottunga Chola I', 'Parantaka Chola I'],
          correct_answer: 1,
          explanation: 'Rajendra Chola I expanded the Chola empire to its greatest extent, including Southeast Asia.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'History',
          subtopic: 'Ancient India'
        },
        {
          id: 'hist12',
          question: 'Who founded the Asiatic Society of Bengal?',
          options: ['William Jones', 'Max Muller', 'James Prinsep', 'Alexander Cunningham'],
          correct_answer: 0,
          explanation: 'Sir William Jones founded the Asiatic Society of Bengal in 1784 for Oriental research.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'British Rule'
        },
        {
          id: 'hist13',
          question: 'The Kalinga War was fought by which Mauryan emperor?',
          options: ['Chandragupta Maurya', 'Bindusara', 'Ashoka', 'Dasharatha'],
          correct_answer: 2,
          explanation: 'The Kalinga War was fought by Ashoka around 261 BCE, leading to his conversion to Buddhism.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'History',
          subtopic: 'Ancient India'
        },
        {
          id: 'hist14',
          question: 'Which movement was started by Mahatma Gandhi in 1930?',
          options: ['Non-Cooperation Movement', 'Civil Disobedience Movement', 'Quit India Movement', 'Khilafat Movement'],
          correct_answer: 1,
          explanation: 'The Civil Disobedience Movement was started by Gandhi in 1930 with the Salt March.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'History',
          subtopic: 'Freedom Struggle'
        },
        {
          id: 'hist15',
          question: 'The Gupta period is known as the Golden Age of which aspect?',
          options: ['Trade and Commerce', 'Art and Literature', 'Military Conquests', 'Religious Reforms'],
          correct_answer: 1,
          explanation: 'The Gupta period (4th-6th century CE) is known as the Golden Age of Art and Literature.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'History',
          subtopic: 'Ancient India'
        }
      ],
      'Polity': [
        {
          id: 'pol1',
          question: 'Which article is known as the "Heart and Soul" of the Constitution?',
          options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
          correct_answer: 3,
          explanation: 'Article 32 (Right to Constitutional Remedies) was called the "Heart and Soul" by Dr. Ambedkar.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Fundamental Rights'
        },
        {
          id: 'pol2',
          question: 'How many fundamental rights are guaranteed by the Indian Constitution?',
          options: ['Six', 'Seven', 'Eight', 'Nine'],
          correct_answer: 0,
          explanation: 'The Indian Constitution guarantees six fundamental rights after the 44th Amendment removed the right to property.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Polity',
          subtopic: 'Fundamental Rights'
        },
        {
          id: 'pol3',
          question: 'Which part of the Constitution deals with Directive Principles?',
          options: ['Part III', 'Part IV', 'Part V', 'Part VI'],
          correct_answer: 1,
          explanation: 'Part IV of the Constitution (Articles 36-51) deals with Directive Principles of State Policy.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'DPSP'
        },
        {
          id: 'pol4',
          question: 'The President of India is elected by?',
          options: ['Direct election by people', 'Electoral College', 'Parliament', 'Supreme Court'],
          correct_answer: 1,
          explanation: 'The President is elected by an Electoral College consisting of elected members of both houses of Parliament and state assemblies.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Executive'
        },
        {
          id: 'pol5',
          question: 'Which amendment is known as the "Mini Constitution"?',
          options: ['42nd Amendment', '44th Amendment', '73rd Amendment', '74th Amendment'],
          correct_answer: 0,
          explanation: 'The 42nd Amendment (1976) is called the "Mini Constitution" due to extensive changes made.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Polity',
          subtopic: 'Constitutional Amendments'
        },
        {
          id: 'pol6',
          question: 'The concept of "Basic Structure" was established in which case?',
          options: ['Golaknath Case', 'Kesavananda Bharati Case', 'Minerva Mills Case', 'Maneka Gandhi Case'],
          correct_answer: 1,
          explanation: 'The Basic Structure doctrine was established in Kesavananda Bharati vs State of Kerala (1973).',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Polity',
          subtopic: 'Judiciary'
        },
        {
          id: 'pol7',
          question: 'How many schedules are there in the Indian Constitution?',
          options: ['10', '11', '12', '13'],
          correct_answer: 2,
          explanation: 'The Indian Constitution has 12 schedules, with the 12th schedule added by the 73rd Amendment.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Constitutional Structure'
        },
        {
          id: 'pol8',
          question: 'The Rajya Sabha can have a maximum of how many members?',
          options: ['238', '245', '250', '255'],
          correct_answer: 2,
          explanation: 'The Rajya Sabha can have a maximum of 250 members (238 elected + 12 nominated).',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Parliament'
        },
        {
          id: 'pol9',
          question: 'Which article deals with the abolition of untouchability?',
          options: ['Article 15', 'Article 16', 'Article 17', 'Article 18'],
          correct_answer: 2,
          explanation: 'Article 17 abolishes untouchability and forbids its practice in any form.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Polity',
          subtopic: 'Fundamental Rights'
        },
        {
          id: 'pol10',
          question: 'The Finance Commission is constituted every how many years?',
          options: ['3 years', '4 years', '5 years', '6 years'],
          correct_answer: 2,
          explanation: 'The Finance Commission is constituted every 5 years to recommend distribution of taxes between Centre and States.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Constitutional Bodies'
        },
        {
          id: 'pol11',
          question: 'Which writ is issued against illegal detention?',
          options: ['Mandamus', 'Prohibition', 'Habeas Corpus', 'Certiorari'],
          correct_answer: 2,
          explanation: 'Habeas Corpus is issued against illegal detention, meaning "produce the body".',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Polity',
          subtopic: 'Judiciary'
        },
        {
          id: 'pol12',
          question: 'The idea of Concurrent List is borrowed from which country?',
          options: ['USA', 'UK', 'Australia', 'Canada'],
          correct_answer: 2,
          explanation: 'The idea of Concurrent List is borrowed from Australia\'s federal system.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Polity',
          subtopic: 'Federalism'
        },
        {
          id: 'pol13',
          question: 'Who appoints the Chief Justice of India?',
          options: ['Prime Minister', 'President', 'Parliament', 'Supreme Court Collegium'],
          correct_answer: 1,
          explanation: 'The Chief Justice of India is appointed by the President in consultation with the Supreme Court Collegium.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Polity',
          subtopic: 'Judiciary'
        },
        {
          id: 'pol14',
          question: 'The National Emergency can be declared under which article?',
          options: ['Article 352', 'Article 356', 'Article 360', 'Article 365'],
          correct_answer: 0,
          explanation: 'National Emergency can be declared under Article 352 in case of war, external aggression, or armed rebellion.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Polity',
          subtopic: 'Emergency Provisions'
        },
        {
          id: 'pol15',
          question: 'Which constitutional body conducts elections in India?',
          options: ['Parliament', 'Supreme Court', 'Election Commission', 'President'],
          correct_answer: 2,
          explanation: 'The Election Commission of India is the constitutional body responsible for conducting elections.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Polity',
          subtopic: 'Constitutional Bodies'
        }
      ],
      'Geography': [
        {
          id: 'geo1',
          question: 'Which is the longest river in India?',
          options: ['Yamuna', 'Ganga', 'Godavari', 'Narmada'],
          correct_answer: 1,
          explanation: 'The Ganga is the longest river in India, flowing for about 2,525 km.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo2',
          question: 'Which mountain range separates India from China?',
          options: ['Himalayas', 'Karakoram', 'Aravalli', 'Western Ghats'],
          correct_answer: 0,
          explanation: 'The Himalayas form the natural boundary between India and China.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo3',
          question: 'Which state has the longest coastline in India?',
          options: ['Tamil Nadu', 'Gujarat', 'Andhra Pradesh', 'Maharashtra'],
          correct_answer: 1,
          explanation: 'Gujarat has the longest coastline in India, stretching about 1,600 km.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo4',
          question: 'The Tropic of Cancer passes through how many Indian states?',
          options: ['6', '7', '8', '9'],
          correct_answer: 2,
          explanation: 'The Tropic of Cancer passes through 8 Indian states including Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo5',
          question: 'Which is the largest freshwater lake in India?',
          options: ['Dal Lake', 'Wular Lake', 'Chilika Lake', 'Pulicat Lake'],
          correct_answer: 1,
          explanation: 'Wular Lake in Jammu & Kashmir is the largest freshwater lake in India.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo6',
          question: 'The Western Ghats are also known as?',
          options: ['Sahyadri', 'Nilgiris', 'Cardamom Hills', 'Anamalai Hills'],
          correct_answer: 0,
          explanation: 'The Western Ghats are also known as Sahyadri, running parallel to the western coast.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo7',
          question: 'Which river is known as the "Sorrow of Bengal"?',
          options: ['Ganga', 'Brahmaputra', 'Damodar', 'Hooghly'],
          correct_answer: 2,
          explanation: 'The Damodar River was known as the "Sorrow of Bengal" due to frequent floods.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo8',
          question: 'Which plateau is rich in mineral resources?',
          options: ['Deccan Plateau', 'Malwa Plateau', 'Chota Nagpur Plateau', 'Meghalaya Plateau'],
          correct_answer: 2,
          explanation: 'Chota Nagpur Plateau is rich in mineral resources like coal, iron ore, and mica.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Economic Geography'
        },
        {
          id: 'geo9',
          question: 'The Sundarbans delta is formed by which rivers?',
          options: ['Ganga and Yamuna', 'Ganga and Brahmaputra', 'Brahmaputra and Meghna', 'Ganga and Meghna'],
          correct_answer: 1,
          explanation: 'The Sundarbans delta is formed by the Ganga and Brahmaputra rivers.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo10',
          question: 'Which pass connects Kashmir with Ladakh?',
          options: ['Khyber Pass', 'Zoji La', 'Nathu La', 'Rohtang Pass'],
          correct_answer: 1,
          explanation: 'Zoji La pass connects Kashmir valley with Ladakh region.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo11',
          question: 'Which soil is most suitable for cotton cultivation?',
          options: ['Alluvial Soil', 'Black Soil', 'Red Soil', 'Laterite Soil'],
          correct_answer: 1,
          explanation: 'Black soil (regur soil) is most suitable for cotton cultivation due to its moisture retention capacity.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Geography',
          subtopic: 'Economic Geography'
        },
        {
          id: 'geo12',
          question: 'The monsoon winds in India are primarily?',
          options: ['Trade winds', 'Westerlies', 'Seasonal winds', 'Local winds'],
          correct_answer: 2,
          explanation: 'Monsoon winds are seasonal winds that reverse direction with seasons.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Climate'
        },
        {
          id: 'geo13',
          question: 'Which state is the largest producer of rice in India?',
          options: ['Punjab', 'Haryana', 'West Bengal', 'Uttar Pradesh'],
          correct_answer: 2,
          explanation: 'West Bengal is the largest producer of rice in India.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Economic Geography'
        },
        {
          id: 'geo14',
          question: 'The Deccan Plateau is composed mainly of?',
          options: ['Sedimentary rocks', 'Igneous rocks', 'Metamorphic rocks', 'Volcanic rocks'],
          correct_answer: 1,
          explanation: 'The Deccan Plateau is mainly composed of igneous rocks, particularly basalt.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Geography',
          subtopic: 'Physical Geography'
        },
        {
          id: 'geo15',
          question: 'Which city receives the highest rainfall in India?',
          options: ['Cherrapunji', 'Mawsynram', 'Mumbai', 'Thiruvananthapuram'],
          correct_answer: 1,
          explanation: 'Mawsynram in Meghalaya receives the highest rainfall in India.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Geography',
          subtopic: 'Climate'
        }
      ],
      'Economy': [
        {
          id: 'eco1',
          question: 'Who is known as the "Father of Indian Economics"?',
          options: ['Dadabhai Naoroji', 'R.C. Dutt', 'M.G. Ranade', 'Gopal Krishna Gokhale'],
          correct_answer: 0,
          explanation: 'Dadabhai Naoroji is known as the "Father of Indian Economics" for his economic theories.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Economy',
          subtopic: 'Economic History'
        },
        {
          id: 'eco2',
          question: 'The Reserve Bank of India was established in which year?',
          options: ['1934', '1935', '1947', '1950'],
          correct_answer: 1,
          explanation: 'The Reserve Bank of India was established on 1 April 1935.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Economy',
          subtopic: 'Banking'
        },
        {
          id: 'eco3',
          question: 'What is the current repo rate set by RBI (2024)?',
          options: ['6.25%', '6.50%', '6.75%', '7.00%'],
          correct_answer: 1,
          explanation: 'The current repo rate is 6.50% as maintained by RBI.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Monetary Policy'
        },
        {
          id: 'eco4',
          question: 'Which Five Year Plan focused on "Growth with Social Justice"?',
          options: ['Eighth Plan', 'Ninth Plan', 'Tenth Plan', 'Eleventh Plan'],
          correct_answer: 1,
          explanation: 'The Ninth Five Year Plan (1997-2002) focused on "Growth with Social Justice and Equity".',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Economy',
          subtopic: 'Planning'
        },
        {
          id: 'eco5',
          question: 'NITI Aayog replaced which institution?',
          options: ['Finance Commission', 'Planning Commission', 'Economic Advisory Council', 'National Development Council'],
          correct_answer: 1,
          explanation: 'NITI Aayog replaced the Planning Commission in 2015.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Economic Policy'
        },
        {
          id: 'eco6',
          question: 'Which sector contributes the most to India\'s GDP?',
          options: ['Agriculture', 'Industry', 'Services', 'Manufacturing'],
          correct_answer: 2,
          explanation: 'The services sector contributes the most to India\'s GDP (around 55%).',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Economic Structure'
        },
        {
          id: 'eco7',
          question: 'The Goods and Services Tax (GST) was implemented in which year?',
          options: ['2016', '2017', '2018', '2019'],
          correct_answer: 1,
          explanation: 'GST was implemented on 1 July 2017, replacing multiple indirect taxes.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Taxation'
        },
        {
          id: 'eco8',
          question: 'Which organization regulates the securities market in India?',
          options: ['RBI', 'SEBI', 'IRDA', 'NABARD'],
          correct_answer: 1,
          explanation: 'SEBI (Securities and Exchange Board of India) regulates the securities market.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Economy',
          subtopic: 'Financial Markets'
        },
        {
          id: 'eco9',
          question: 'The term "Hindu Rate of Growth" refers to?',
          options: ['2-3% GDP growth', '3-4% GDP growth', '4-5% GDP growth', '5-6% GDP growth'],
          correct_answer: 1,
          explanation: 'The "Hindu Rate of Growth" refers to the 3-4% GDP growth rate India experienced from 1950s-1980s.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Economy',
          subtopic: 'Economic Growth'
        },
        {
          id: 'eco10',
          question: 'Which bank is known as the "Banker\'s Bank"?',
          options: ['State Bank of India', 'Reserve Bank of India', 'Punjab National Bank', 'Bank of India'],
          correct_answer: 1,
          explanation: 'RBI is known as the "Banker\'s Bank" as it regulates and supervises other banks.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Banking'
        },
        {
          id: 'eco11',
          question: 'The Green Revolution in India was primarily associated with?',
          options: ['Cotton', 'Sugarcane', 'Wheat and Rice', 'Jute'],
          correct_answer: 2,
          explanation: 'The Green Revolution was primarily associated with wheat and rice production increase.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Economy',
          subtopic: 'Agriculture'
        },
        {
          id: 'eco12',
          question: 'Which committee recommended the establishment of Regional Rural Banks?',
          options: ['Narasimham Committee', 'Kelkar Committee', 'Narasimham Committee', 'Working Group on RRBs'],
          correct_answer: 3,
          explanation: 'The Working Group on Regional Rural Banks recommended their establishment in 1975.',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Economy',
          subtopic: 'Banking'
        },
        {
          id: 'eco13',
          question: 'The Mahatma Gandhi National Rural Employment Guarantee Act provides employment for how many days?',
          options: ['90 days', '100 days', '120 days', '150 days'],
          correct_answer: 1,
          explanation: 'MGNREGA provides guaranteed employment for 100 days per year to rural households.',
          difficulty: 'easy' as const,
          points: 10,
          subject: 'Economy',
          subtopic: 'Rural Development'
        },
        {
          id: 'eco14',
          question: 'Which organization publishes the Economic Survey?',
          options: ['RBI', 'Ministry of Finance', 'NITI Aayog', 'Ministry of Statistics'],
          correct_answer: 1,
          explanation: 'The Economic Survey is published annually by the Ministry of Finance.',
          difficulty: 'medium' as const,
          points: 15,
          subject: 'Economy',
          subtopic: 'Economic Policy'
        },
        {
          id: 'eco15',
          question: 'The concept of "Inclusive Growth" was emphasized in which Five Year Plan?',
          options: ['Tenth Plan', 'Eleventh Plan', 'Twelfth Plan', 'No specific plan'],
          correct_answer: 1,
          explanation: 'The Eleventh Five Year Plan (2007-2012) emphasized "Inclusive Growth".',
          difficulty: 'hard' as const,
          points: 20,
          subject: 'Economy',
          subtopic: 'Planning'
        }
      ]
    };
    
    const subjectQuestions = allDemoQuestions[subjectName as keyof typeof allDemoQuestions] || allDemoQuestions['History'];
    
    // Return all 15 questions for the subject
    return subjectQuestions;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    
    // Update user answers array
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
    
    optionScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + currentQuestion.points);
    }
    
    setShowExplanation(true);
    
    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(isCorrect ? 1.3 : 0.9, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] !== -1 ? userAnswers[currentQuestionIndex + 1] : null);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    try {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const correctCount = userAnswers.filter((answer, index) => 
        answer === questions[index].correct_answer
      ).length;
      const percentage = Math.round((correctCount / questions.length) * 100);
      
      const quizResults = {
        subject: subject as string || subjectName as string,
        topic_id: topicId as string,
        questions_attempted: questions.length,
        questions_correct: correctCount,
        score_percentage: percentage,
        total_points: score,
        time_spent: timeSpent,
        detailed_results: questions.map((q, index) => ({
          question: q.question,
          user_answer: userAnswers[index],
          correct_answer: q.correct_answer,
          is_correct: userAnswers[index] === q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          subject: q.subject,
          subtopic: q.subtopic
        }))
      };
      
      // Update user progress if topic-specific
      if (topicId) {
        await SupabaseService.updateTopicProgress(quizResults);
      }
      
      setResults(quizResults);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error completing quiz:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const optionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: optionScale.value }],
  }));

  if (isLoading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <MascotAvatar size={80} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>
            Loading {topicName || subject} quiz...
          </Text>
          <Text style={styles.loadingSubtext}>Preparing 15 exam-focused questions</Text>
        </View>
      </LinearGradient>
    );
  }

  if (questions.length === 0) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <Text style={styles.errorSubtext}>Questions are being generated. Please try again later.</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

  if (isCompleted && results) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
          theme.colors.background.tertiary,
        ]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <MascotAvatar size={100} animated={true} glowing={true} mood="celebrating" />
              
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.resultsBadge}
              >
                <Trophy size={32} color={theme.colors.text.primary} />
                <Text style={styles.resultsTitle}>Quiz Complete!</Text>
              </LinearGradient>
              
              <Text style={styles.resultsScore}>{results.score_percentage}%</Text>
              <Text style={styles.resultsSubtext}>
                {results.questions_correct} out of {results.questions_attempted} correct
              </Text>
              <Text style={styles.topicTitle}>
                {topicName || subject} • {subjectName || 'Indian Subjects'}
              </Text>
            </View>

            <View style={styles.resultsStats}>
              <View style={styles.resultStat}>
                <CheckCircle size={24} color={theme.colors.accent.green} />
                <Text style={styles.resultStatValue}>{results.questions_correct}</Text>
                <Text style={styles.resultStatLabel}>Correct</Text>
              </View>
              
              <View style={styles.resultStat}>
                <X size={24} color={theme.colors.accent.pink} />
                <Text style={styles.resultStatValue}>{results.questions_attempted - results.questions_correct}</Text>
                <Text style={styles.resultStatLabel}>Incorrect</Text>
              </View>
              
              <View style={styles.resultStat}>
                <Clock size={24} color={theme.colors.accent.blue} />
                <Text style={styles.resultStatValue}>{Math.round(results.time_spent / 60)}m</Text>
                <Text style={styles.resultStatLabel}>Time</Text>
              </View>
              
              <View style={styles.resultStat}>
                <Star size={24} color={theme.colors.accent.yellow} />
                <Text style={styles.resultStatValue}>{results.total_points}</Text>
                <Text style={styles.resultStatLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <GradientButton
                title="Try Another Topic"
                onPress={() => router.back()}
                size="large"
                fullWidth
                icon={<Brain size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                style={styles.actionButton}
              />
              
              <GradientButton
                title="Back to Subjects"
                onPress={() => router.replace('/(tabs)/learn')}
                size="large"
                fullWidth
                icon={<BookOpen size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <LinearGradient
      colors={[
        theme.colors.background.primary,
        theme.colors.background.secondary,
        theme.colors.background.tertiary,
      ]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.backButtonGradient}
          >
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Animated.View style={mascotAnimatedStyle}>
            <MascotAvatar
              size={60}
              animated={true}
              glowing={true}
              mood="focused"
            />
          </Animated.View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicName || subject}</Text>
            <Text style={styles.headerSubtitle}>
              {subjectName || 'Indian Subjects'} Quiz
            </Text>
          </View>
        </View>
        
        <View style={styles.timerContainer}>
          <Clock size={16} color={theme.colors.accent.blue} />
          <Text style={styles.timerText}>
            {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        
        <View style={styles.questionMeta}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Star size={12} color={theme.colors.accent.yellow} />
            <Text style={styles.pointsText}>{currentQuestion.points} pts</Text>
          </View>
          {currentQuestion.subtopic && (
            <View style={styles.subtopicBadge}>
              <Text style={styles.subtopicText}>{currentQuestion.subtopic}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Question Content */}
      <Animated.View style={[styles.contentContainer, cardAnimatedStyle]}>
        <LinearGradient
          colors={[
            theme.colors.background.card,
            theme.colors.background.secondary,
          ]}
          style={styles.contentCard}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <Animated.View key={index} style={optionAnimatedStyle}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        selectedAnswer === index && styles.selectedOption,
                        showExplanation && index === currentQuestion.correct_answer && styles.correctOption,
                        showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && styles.incorrectOption,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionNumber}>
                          <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                        {showExplanation && index === currentQuestion.correct_answer && (
                          <CheckCircle size={20} color={theme.colors.accent.green} />
                        )}
                        {showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                          <X size={20} color={theme.colors.accent.pink} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {showExplanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <Brain size={20} color={theme.colors.accent.purple} />
                    <Text style={styles.explanationTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                  
                  {currentQuestion.exam_relevance && (
                    <View style={styles.examRelevanceContainer}>
                      <Target size={16} color={theme.colors.accent.green} />
                      <Text style={styles.examRelevanceText}>{currentQuestion.exam_relevance}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!showExplanation ? (
          <GradientButton
            title="Submit Answer"
            onPress={handleSubmitAnswer}
            size="large"
            fullWidth
            disabled={selectedAnswer === null}
            colors={[theme.colors.accent.blue, theme.colors.accent.purple]}
          />
        ) : (
          <GradientButton
            title={currentQuestionIndex < questions.length - 1 ? "Next Question" : "Complete Quiz"}
            onPress={handleNextQuestion}
            size="large"
            fullWidth
            icon={<ArrowRight size={20} color={theme.colors.text.primary} />}
            colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  timerText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.blue,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.yellow,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  difficultyBadge: {
    backgroundColor: theme.colors.accent.blue + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.blue,
    textTransform: 'uppercase',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  pointsText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  subtopicBadge: {
    backgroundColor: theme.colors.accent.purple + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  subtopicText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  contentCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  questionContainer: {
    gap: theme.spacing.lg,
  },
  questionText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: theme.colors.accent.purple + '10',
  },
  correctOption: {
    borderColor: theme.colors.accent.green,
    backgroundColor: theme.colors.accent.green + '10',
  },
  incorrectOption: {
    borderColor: theme.colors.accent.pink,
    backgroundColor: theme.colors.accent.pink + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  explanationContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  examRelevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.green + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  examRelevanceText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  resultsContainer: {
    padding: theme.spacing.lg,
    paddingTop: 80,
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  resultsTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultsScore: {
    fontSize: 48,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
  },
  resultsSubtext: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    textAlign: 'center',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  resultStat: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultStatValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  actionButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});