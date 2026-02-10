---
{
    "title": "ALTER STORAGE POLICY",
    "language": "zh-CN",
    "description": "```sql ALTER STORAGE POLICY hastestpolicytoalter PROPERTIES(\"cooldowndatetime\" = \"2023-06-08 00:00:00\");"
}
---

## 描述

该语句用于修改一个已有的冷热分层迁移策略。仅 root 或 admin 用户可以修改资源。
语法：
```sql
ALTER STORAGE POLICY  'policy_name'
PROPERTIES ("key"="value", ...);
```

## 示例

1. 修改名为 cooldown_datetime 冷热分层数据迁移时间点：

  ```sql
  ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
  ```
2. 修改名为 cooldown_ttl 的冷热分层数据迁移倒计时

  ```sql
  ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
  ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
  ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
  ```
## 关键词

```sql
ALTER, STORAGE, POLICY
```

## 最佳实践
