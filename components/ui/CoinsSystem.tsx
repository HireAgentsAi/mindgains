import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { analyticsService } from '../../utils/analyticsService';

const { width } = Dimensions.get('window');

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  duration?: string;
  effect: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Cosmetic {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  type: 'mascot_outfit' | 'theme' | 'celebration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned?: boolean;
}

const POWER_UPS: PowerUp[] = [
  {
    id: 'double_xp',
    name: 'Double XP',
    description: 'Earn 2x XP for the next 3 quizzes',
    icon: '⚡',
    cost: 50,
    duration: '3 quizzes',
    effect: '2x XP multiplier',
    rarity: 'common',
  },
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day',
    icon: '🧊',
    cost: 75,
    duration: '24 hours',
    effect: 'Streak protection',
    rarity: 'common',
  },
  {
    id: 'time_extender',
    name: 'Time Extender',
    description: 'Get +30 seconds for each question',
    icon: '⏰',
    cost: 40,
    duration: '1 quiz',
    effect: '+30s per question',
    rarity: 'common',
  },
  {
    id: 'hint_master',
    name: 'Hint Master',
    description: 'Unlock hints for all questions',
    icon: '💡',
    cost: 60,
    duration: '1 quiz',
    effect: 'Show hints',
    rarity: 'rare',
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Get extra coins from achievements',
    icon: '🍀',
    cost: 100,
    duration: '24 hours',
    effect: '2x coin rewards',
    rarity: 'rare',
  },
  {
    id: 'mega_boost',
    name: 'Mega Boost',
    description: 'Triple XP + Double coins + Hints',
    icon: '🚀',
    cost: 200,
    duration: '1 quiz',
    effect: 'Ultimate power combo',
    rarity: 'legendary',
  },
];

const COSMETICS: Cosmetic[] = [
  {
    id: 'royal_crown',
    name: 'Royal Crown',
    description: 'Crown fit for a learning champion',
    icon: '👑',
    cost: 150,
    type: 'mascot_outfit',
    rarity: 'epic',
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    description: 'Channel your inner knowledge wizard',
    icon: '🧙‍♂️',
    cost: 120,
    type: 'mascot_outfit',
    rarity: 'rare',
  },
  {
    id: 'space_helmet',
    name: 'Space Helmet',
    description: 'Explore the universe of knowledge',
    icon: '👨‍🚀',
    cost: 180,
    type: 'mascot_outfit',
    rarity: 'epic',
  },
  {
    id: 'rainbow_theme',
    name: 'Rainbow Theme',
    description: 'Colorful theme with rainbow effects',
    icon: '🌈',
    cost: 100,
    type: 'theme',
    rarity: 'rare',
  },
  {
    id: 'gold_celebration',
    name: 'Gold Rain',
    description: 'Golden coins rain on achievements',
    icon: '💰',
    cost: 250,
    type: 'celebration',
    rarity: 'legendary',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'Spectacular fireworks on level up',
    icon: '🎆',
    cost: 200,
    type: 'celebration',
    rarity: 'epic',
  },
];

interface CoinsSystemProps {
  coins: number;
  onCoinsChange: (newCoins: number) => void;
  userLevel: number;
}

export default function CoinsSystem({ coins, onCoinsChange, userLevel }: CoinsSystemProps) {
  const [showShop, setShowShop] = useState(false);
  const [activeTab, setActiveTab] = useState<'powerups' | 'cosmetics'>('powerups');
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>(['wizard_hat']);
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);

  // Animations
  const coinScale = useSharedValue(1);
  const shopOpacity = useSharedValue(0);

  const animateCoins = () => {
    coinScale.value = withSequence(
      withSpring(1.2, { duration: 200 }),
      withSpring(1, { duration: 200 })
    );
  };

  const purchaseItem = (item: PowerUp | Cosmetic, type: 'powerup' | 'cosmetic') => {
    if (coins < item.cost) {
      // Show insufficient coins message
      return;
    }

    // Deduct coins
    onCoinsChange(coins - item.cost);
    animateCoins();

    if (type === 'powerup') {
      // Activate power-up
      setActivePowerUps(prev => [...prev, item.id]);
      
      // Remove power-up after duration (mock implementation)
      if (item.id !== 'streak_freeze') { // Streak freeze is permanent until used
        setTimeout(() => {
          setActivePowerUps(prev => prev.filter(id => id !== item.id));
        }, 5000); // 5 seconds for demo
      }
    } else {
      // Add cosmetic to owned items
      setOwnedCosmetics(prev => [...prev, item.id]);
    }

    analyticsService.trackEvent('item_purchased', {
      item_id: item.id,
      item_type: type,
      cost: item.cost,
      coins_remaining: coins - item.cost,
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#888888';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#888888';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return ['#666666', '#888888'];
      case 'rare': return ['#2563eb', '#3b82f6'];
      case 'epic': return ['#7c3aed', '#8b5cf6'];
      case 'legendary': return ['#d97706', '#f59e0b'];
      default: return ['#666666', '#888888'];
    }
  };

  const coinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: coinScale.value }],
    };
  });

  const renderShopItem = (item: PowerUp | Cosmetic, type: 'powerup' | 'cosmetic') => {
    const isOwned = type === 'cosmetic' && ownedCosmetics.includes(item.id);
    const isActive = type === 'powerup' && activePowerUps.includes(item.id);
    const canAfford = coins >= item.cost;
    const isUnlocked = userLevel >= (item.cost / 50); // Simple unlock logic

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.shopItem,
          isOwned && styles.ownedItem,
          isActive && styles.activeItem,
          !isUnlocked && styles.lockedItem,
        ]}
        disabled={isOwned || !isUnlocked}
        onPress={() => purchaseItem(item, type)}
      >
        <LinearGradient
          colors={getRarityGradient(item.rarity)}
          style={styles.itemGradient}
        >
          <View style={styles.itemIcon}>
            <Text style={styles.itemIconText}>{item.icon}</Text>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            
            {type === 'powerup' && (item as PowerUp).duration && (
              <Text style={styles.itemDuration}>
                Duration: {(item as PowerUp).duration}
              </Text>
            )}

            <View style={styles.itemFooter}>
              <View style={styles.rarityBadge}>
                <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>

              {!isUnlocked ? (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockText}>🔒 L{Math.ceil(item.cost / 50)}</Text>
                </View>
              ) : isOwned ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedText}>✅ OWNED</Text>
                </View>
              ) : isActive ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>⚡ ACTIVE</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    !canAfford && styles.buyButtonDisabled,
                  ]}
                  disabled={!canAfford}
                >
                  <Text style={[
                    styles.buyButtonText,
                    !canAfford && styles.buyButtonTextDisabled,
                  ]}>
                    💎 {item.cost}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Coins Display */}
      <TouchableOpacity
        style={styles.coinsContainer}
        onPress={() => setShowShop(true)}
      >
        <Animated.View style={[styles.coinsDisplay, coinAnimatedStyle]}>
          <Text style={styles.coinsIcon}>💎</Text>
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
          <Text style={styles.plusIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Active Power-ups Indicator */}
      {activePowerUps.length > 0 && (
        <View style={styles.activePowerUpsContainer}>
          {activePowerUps.slice(0, 3).map(powerUpId => {
            const powerUp = POWER_UPS.find(p => p.id === powerUpId);
            return powerUp ? (
              <View key={powerUpId} style={styles.activePowerUp}>
                <Text style={styles.activePowerUpIcon}>{powerUp.icon}</Text>
              </View>
            ) : null;
          })}
        </View>
      )}

      {/* Shop Modal */}
      <Modal
        visible={showShop}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShop(false)}
      >
        <View style={styles.shopContainer}>
          {/* Shop Header */}
          <View style={styles.shopHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowShop(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.shopTitle}>
              <Text style={styles.shopTitleText}>🛍️ MindGains Shop</Text>
              <View style={styles.coinsInShop}>
                <Text style={styles.coinsIcon}>💎</Text>
                <Text style={styles.coinsInShopText}>{coins.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Shop Tabs */}
          <View style={styles.shopTabs}>
            <TouchableOpacity
              style={[styles.shopTab, activeTab === 'powerups' && styles.activeShopTab]}
              onPress={() => setActiveTab('powerups')}
            >
              <Text style={[styles.shopTabText, activeTab === 'powerups' && styles.activeShopTabText]}>
                ⚡ Power-ups
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.shopTab, activeTab === 'cosmetics' && styles.activeShopTab]}
              onPress={() => setActiveTab('cosmetics')}
            >
              <Text style={[styles.shopTabText, activeTab === 'cosmetics' && styles.activeShopTabText]}>
                👑 Cosmetics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Shop Content */}
          <ScrollView style={styles.shopContent}>
            {activeTab === 'powerups' ? (
              <View style={styles.itemsGrid}>
                {POWER_UPS.map(powerUp => renderShopItem(powerUp, 'powerup'))}
              </View>
            ) : (
              <View style={styles.itemsGrid}>
                {COSMETICS.map(cosmetic => renderShopItem(cosmetic, 'cosmetic'))}
              </View>
            )}
          </ScrollView>

          {/* Earn More Coins Button */}
          <View style={styles.earnMoreContainer}>
            <TouchableOpacity style={styles.earnMoreButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.earnMoreGradient}
              >
                <Text style={styles.earnMoreText}>💰 Earn More Coins</Text>
                <Text style={styles.earnMoreSubtext}>Complete achievements & daily quizzes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  coinsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  coinsIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  plusIcon: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  activePowerUpsContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
    flexDirection: 'row',
    zIndex: 999,
  },
  activePowerUp: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  activePowerUpIcon: {
    fontSize: 12,
  },
  shopContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: 'white',
  },
  shopTitle: {
    flex: 1,
    alignItems: 'center',
  },
  shopTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  coinsInShop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  coinsInShopText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  shopTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  shopTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeShopTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  shopTabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeShopTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  shopContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemsGrid: {
    gap: 16,
  },
  shopItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ownedItem: {
    opacity: 0.7,
  },
  activeItem: {
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  lockedItem: {
    opacity: 0.5,
  },
  itemGradient: {
    padding: 16,
  },
  itemIcon: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  itemIconText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
  itemDuration: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lockBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lockText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  ownedBadge: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ownedText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  buyButtonTextDisabled: {
    color: '#666',
  },
  earnMoreContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  earnMoreButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  earnMoreGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  earnMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  earnMoreSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});