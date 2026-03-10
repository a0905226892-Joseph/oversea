-- ==========================================
-- 企业出海与投资评估系统 - 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ==========================================

-- 1. 用户资料表（继承 Supabase Auth）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'standard' | 'premium'
  subscription_expires_at TIMESTAMPTZ,
  deepseek_api_key TEXT,      -- 加密存储的 DeepSeek API Key
  api_key_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 使用次数记录表
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('calculate', 'ai_analysis')),
  company_name TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
);

-- 3. 评估记录表（保存历史）
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  funding_stage TEXT,
  input_data JSONB,         -- 108项指标输入值
  results JSONB,            -- 计算结果
  ai_analysis JSONB,        -- AI深度分析结果
  deep_info JSONB,          -- 企业深度信息
  evaluation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 付款码管理表
CREATE TABLE IF NOT EXISTS public.payment_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('standard', 'premium')),
  duration_months INTEGER NOT NULL DEFAULT 12,
  price_cny DECIMAL(10,2),            -- 价格（人民币）
  remark TEXT,                         -- 管理员备注
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 行级安全策略 (Row Level Security)
-- ==========================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_codes ENABLE ROW LEVEL SECURITY;

-- profiles 策略：用户只能查看/修改自己的资料
CREATE POLICY "用户可查看自己的资料" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可更新自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "系统可插入新用户资料" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- usage_records 策略：用户只能查看自己的记录
CREATE POLICY "用户可查看自己的使用记录" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "系统可插入使用记录" ON public.usage_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- evaluations 策略：用户只能操作自己的评估
CREATE POLICY "用户可查看自己的评估记录" ON public.evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建评估记录" ON public.evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的评估记录" ON public.evaluations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的评估记录" ON public.evaluations
  FOR DELETE USING (auth.uid() = user_id);

-- payment_codes 策略：管理员可管理，用户可查看未使用的码（兑换时）
CREATE POLICY "管理员可管理付款码" ON public.payment_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "用户可验证付款码" ON public.payment_codes
  FOR SELECT USING (is_used = FALSE);

-- ==========================================
-- 触发器：新用户注册自动创建 profile
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器到 auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 触发器：更新 profiles.updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- 查询函数：统计本年度使用次数
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_yearly_usage(p_user_id UUID, p_year INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usage_records
  WHERE user_id = p_user_id AND year = p_year;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ==========================================
-- 初始化：设置管理员（执行后替换邮箱）
-- 注意：先注册账号后再执行此语句
-- ==========================================
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'admin@yourdomain.com';
