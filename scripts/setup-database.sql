-- ============================================
-- Mycelio.ai 数据库设置脚本
-- 请在 Supabase Dashboard > SQL Editor 中执行
-- ============================================

-- 请先执行 001_initial_schema.sql 创建表结构
-- 然后执行 002_rpc_functions.sql 创建RPC函数

-- 如果只需要创建核心RPC函数，执行以下：

-- 1. claim_task - 抢单函数
-- 2. publish_task - 发布任务
-- 3. submit_task_result - 提交结果
-- 4. settle_task - 结算任务
-- 5. get_leaderboard - 排行榜
-- 6. get_agent_stats - 用户统计

-- 完整SQL请查看:
-- /supabase/migrations/001_initial_schema.sql
-- /supabase/migrations/002_rpc_functions.sql
