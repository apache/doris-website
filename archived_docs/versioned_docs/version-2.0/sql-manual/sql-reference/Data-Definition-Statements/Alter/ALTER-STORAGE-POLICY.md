---
{
"title": "ALTER-POLICY",
"language": "en"
}
---

## ALTER-POLICY

### Name

ALTER STORAGE POLICY

### Description

This statement is used to modify an existing cold and hot separation migration strategy. Only root or admin users can modify resources.

```sql
ALTER STORAGE POLICY  'policy_name'
PROPERTIES ("key"="value", ...);
```

### Example

1. Modify the name to coolown_datetime Cold and hot separation data migration time point:
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. Modify the name to coolown_countdown of hot and cold separation data migration of ttl
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
