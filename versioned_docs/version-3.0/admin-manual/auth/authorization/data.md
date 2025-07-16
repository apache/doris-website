---
{
"title": "Data Access Control",
"language": "en"
}
---

## Row Permissions

With row-level policies in Doris, you can achieve fine-grained access control over sensitive data. You can decide which users or roles can access specific records in a table based on security policies defined at the table level.

### Mechanism

Equivalent to automatically adding the predicate set in the Row Policy for users configured with Row Policy when querying.

### Limitations

Row Policy cannot be set for default users root and admin.

### Related Commands
- View Row Permission Policies [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY.md)
- Create Row Permission Policy [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md)

### Row Permission Example
1. Restrict the test user to only query data in table1 where c1='a'

```sql
CREATE ROW POLICY test_row_policy_1 ON test.table1 
AS RESTRICTIVE TO test USING (c1 = 'a');
```

## Column Permissions
With column permissions in Doris, you can achieve fine-grained access control over tables. You can grant permissions to specific columns in a table to decide which users or roles can access specific columns in a table.

Currently, column permissions only support Select_priv.

### Related Commands
- Grant: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)

### Column Permission Example

1. Grant user1 the permission to query columns col1 and col2 in table tbl.

```sql
GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
```

## Data Masking
Data masking is a method to protect sensitive data by modifying, replacing, or hiding the original data, making the masked data no longer contain sensitive information while maintaining certain formats and characteristics.

For example, administrators can choose to replace part or all of the digits of sensitive fields such as credit card numbers or ID numbers with asterisks * or other characters, or replace real names with pseudonyms.

Starting from version 2.1.2, data masking is supported through Apache Ranger's Data Masking to set masking policies for certain columns, currently only through [Apache Ranger](./ranger.md).

> Data Masking settings for admin/root users will not take effect.