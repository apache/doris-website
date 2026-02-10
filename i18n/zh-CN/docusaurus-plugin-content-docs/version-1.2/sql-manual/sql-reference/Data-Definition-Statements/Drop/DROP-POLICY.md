---
{
    "title": "DROP-POLICY",
    "language": "zh-CN"
}
---

## DROP-POLICY

### Name

DROP POLICY

## 描述

删除安全策略

#### 行安全策略

语法：

1. 删除行安全策略
```sql
DROP ROW POLICY test_row_policy_1 on table1 [FOR user];
```

2. 删除存储策略
```sql
DROP STORAGE POLICY policy_name1
```

## 举例

1. 删除 table1 的 test_row_policy_1

   ```sql
   DROP ROW POLICY test_row_policy_1 on table1
   ```

2. 删除 table1 作用于 test 的 test_row_policy_1 行安全策略

   ```sql
   DROP ROW POLICY test_row_policy_1 on table1 for test
   ```

3. 删除名字为policy_name1的存储策略
```sql
DROP STORAGE POLICY policy_name1
```

### Keywords

    DROP, POLICY

### Best Practice

