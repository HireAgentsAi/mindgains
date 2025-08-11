/*
  # Complete Subscription and Usage System

  1. New Tables
    - `subscription_plans` - Available subscription plans
    - `user_subscriptions` - User subscription status
    - `usage_tracking` - Track daily quiz attempts and AI generations
    - `payment_transactions` - Payment history

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data
    - Service role policies for admin management

  3. Usage Limits
    - Free users: 3 quizzes per day
    - Premium users: Unlimited quizzes
    - AI generation tracking for cost management
*/

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL DEFAULT 0, -- in paise (₹299 = 29900 paise)
  price_yearly integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  daily_quiz_limit integer DEFAULT -1, -- -1 means unlimited
  ai_generation_limit integer DEFAULT -1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage plans"
  ON subscription_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User Subscriptions (enhanced)
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS daily_quiz_limit integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS ai_generation_limit integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false;

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  daily_quizzes_taken integer DEFAULT 0,
  ai_generations_used integer DEFAULT 0,
  total_questions_generated integer DEFAULT 0,
  cost_incurred decimal(10,2) DEFAULT 0.00, -- in rupees
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON usage_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id),
  amount integer NOT NULL, -- in paise
  currency text DEFAULT 'INR',
  payment_method text DEFAULT 'razorpay',
  transaction_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_gateway_response jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, daily_quiz_limit, ai_generation_limit) VALUES
('Free', 'Perfect for getting started', 0, 0, '["3 daily quizzes", "Basic progress tracking", "Community access"]'::jsonb, 3, 5),
('Premium Monthly', 'Unlimited learning for serious aspirants', 29900, 0, '["Unlimited daily quizzes", "AI-powered question generation", "Detailed analytics", "Priority support", "Offline mode"]'::jsonb, -1, -1),
('Premium Yearly', 'Best value for dedicated exam preparation', 0, 299900, '["Unlimited daily quizzes", "AI-powered question generation", "Detailed analytics", "Priority support", "Offline mode", "2 months free"]'::jsonb, -1, -1),
('Lifetime', 'One-time investment for lifelong learning', 0, 999900, '["Everything in Premium", "Lifetime access", "Future feature access", "VIP support", "Exclusive content"]'::jsonb, -1, -1)
ON CONFLICT DO NOTHING;