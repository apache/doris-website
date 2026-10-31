---
{
    "title": "DROP-POLICY",
    "language": "en"
}
---

## Name

DROP POLICY

## Description

drop policy for row or storage

### ROW POLICY

Grammar：

1. Drop row policy
```sql
DROP ROW POLICY test_row_policy_1 on table1 [FOR user| ROLE role];
```

2. Drop storage policy
```sql
DROP STORAGE POLICY policy_name1
```

## Example

1. Drop the row policy for table1 named test_row_policy_1

   ```sql
   DROP ROW POLICY test_row_policy_1 on table1
   ```

2. Drop the row policy for table1 using by user test

   ```sql
   DROP ROW POLICY test_row_policy_1 on table1 for test
   ```
   
3. Drop the row policy for table1 using by role1

   ```sql
   DROP ROW POLICY test_row_policy_1 on table1 for role role1
   ```

4. Drop the storage policy named policy_name1
```sql
DROP STORAGE POLICY policy_name1
```

## Keywords

    DROP, POLICY

## Best Practice

