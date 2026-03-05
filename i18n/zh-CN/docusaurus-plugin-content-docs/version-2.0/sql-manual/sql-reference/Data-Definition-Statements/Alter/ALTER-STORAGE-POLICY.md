---
{
"title": "ALTER-POLICY",
"language": "zh-CN"
}
---

## ALTER-POLICY

### Name

ALTER STORAGE POLICY

## 描述

该语句用于修改一个已有的冷热分层迁移策略。仅 root 或 admin 用户可以修改资源。
语法：
```sql
ALTER STORAGE POLICY  'policy_name'
PROPERTIES ("key"="value", ...);
```

## 举例

1. 修改名为 cooldown_datetime冷热分层数据迁移时间点：
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. 修改名为 cooldown_ttl的冷热分层数据迁移倒计时
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
### Keywords

```sql
ALTER, STORAGE, POLICY
```

### Best Practice
