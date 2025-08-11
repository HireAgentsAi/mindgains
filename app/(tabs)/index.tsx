import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../utils/supabaseService';

const { width } = Dimensions.get('window');

interface UserStats {
  total_xp: number;
  current_level: number;
  streak_days: number;
  missions_completed: number;
}

interface LeaderboardEntry {
  id: string;
  full_name: string;
  total_xp: number;
  current_level: number;
}

interface QuizStats {
  totalQuizzes: number;
  accuracy: number;
}

export default function HomePage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats>({ totalQuizzes: 0, accuracy: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('user_id, total_xp, current_level')
        .order('total_xp', { ascending: false })
        .limit(5);

      if (stats) {
        const userIds = stats.map(stat => stat.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const leaderboardData = stats.map(stat => {
          const profile = profiles?.find(p => p.id === stat.user_id);
          return {
            id: stat.user_id,
            full_name: profile?.full_name || 'Anonymous',
            total_xp: stat.total_xp,
            current_level: stat.current_level,
          };
        });

        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchQuizStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: attempts } = await supabase
        .from('daily_quiz_attempts')
        .select('correct_answers, total_questions')
        .eq('user_id', user.id);

      if (attempts && attempts.length > 0) {
        const totalQuizzes = attempts.length;
        const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct_answers, 0);
        const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        setQuizStats({ totalQuizzes, accuracy });
      }
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
    }
  };

  const loadData = async () => {
    await Promise.all([
      fetchUserStats(),
      fetchLeaderboard(),
      fetchQuizStats(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your MindGains...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Namaste, MindGainer!</Text>
          <Text style={styles.subtitle}>Ready to flex your brain today?</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome5 name="trophy" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>{userStats?.total_xp || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome5 name="fire" size={24} color="#E74C3C" />
          <Text style={styles.statValue}>{userStats?.streak_days || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome5 name="medal" size={24} color="#F39C12" />
          <Text style={styles.statValue}>{userStats?.current_level || 1}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>
          <FontAwesome5 name="bolt" size={16} color="#FF6B35" />
          <Text> Quick Actions</Text>
        </Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF6B35' }]}
            onPress={() => router.push('/quiz/daily')}
          >
            <FontAwesome5 name="calendar-day" size={24} color="white" />
            <Text style={styles.actionText}>Daily Quiz</Text>
            <Text style={styles.actionSubtext}>Earn 100 XP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#8E44AD' }]}
            onPress={() => router.push('/quiz/subject')}
          >
            <FontAwesome5 name="brain" size={24} color="white" />
            <Text style={styles.actionText}>Subject Quiz</Text>
            <Text style={styles.actionSubtext}>Test Knowledge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#27AE60' }]}
            onPress={() => router.push('/(tabs)/learn')}
          >
            <FontAwesome5 name="book-open" size={24} color="white" />
            <Text style={styles.actionText}>Learn</Text>
            <Text style={styles.actionSubtext}>New Missions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#E67E22' }]}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <FontAwesome5 name="crown" size={24} color="white" />
            <Text style={styles.actionText}>Leaderboard</Text>
            <Text style={styles.actionSubtext}>See Rankings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>
          <FontAwesome5 name="chart-line" size={16} color="#FF6B35" />
          <Text> Your Progress</Text>
        </Text>
        <View style={styles.progressCard}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Missions Completed</Text>
            <Text style={styles.progressValue}>{userStats?.missions_completed || 0}</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Quiz Accuracy</Text>
            <Text style={styles.progressValue}>{quizStats.accuracy}%</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Total Quizzes</Text>
            <Text style={styles.progressValue}>{quizStats.totalQuizzes}</Text>
          </View>
        </View>
      </View>

      {leaderboard.length > 0 && (
        <View style={styles.leaderboardPreview}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="trophy" size={16} color="#FF6B35" />
            <Text> Top Performers</Text>
          </Text>
          {leaderboard.slice(0, 3).map((user, index) => (
            <View key={user.id} style={styles.leaderboardItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userXP}>{user.total_xp} XP</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>L{user.current_level}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <Text style={styles.viewAllText}>View Full Leaderboard</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.motivationCard}>
        <LinearGradient colors={['#8E44AD', '#3498DB']} style={styles.motivationGradient}>
          <FontAwesome5 name="rocket" size={32} color="white" />
          <Text style={styles.motivationTitle}>Keep Going, Champion!</Text>
          <Text style={styles.motivationText}>
            Every question you answer makes you smarter. India needs brilliant minds like yours!
          </Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  actionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  progressLabel: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  leaderboardPreview: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  userXP: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewAllButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  motivationCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  motivationGradient: {
    padding: 25,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});