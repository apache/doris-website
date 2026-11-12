---
{
    "title": "数据访问控制",
    "language": "zh-CN",
    "description": "使用 Doris 中的行级策略，您可以对敏感数据进行精细访问控制。您可以根据在表级别定义的安全策略，来决定哪些用户或角色可以访问表中数据的特定记录。"
}
---

## 行权限

使用 Doris 中的行级策略，您可以对敏感数据进行精细访问控制。您可以根据在表级别定义的安全策略，来决定哪些用户或角色可以访问表中数据的特定记录。

### 机制

相当于为配置了 Row Policy 的用户在查询时自动加上  Row Policy 中设置的谓词

### 限制

不能为默认用户 root 和 admin 设置 Row Policy

### 相关命令
- 查看行权限策略 [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- 创建行权限策略 [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)
### 行权限示例
1. 限制 test 用户仅能查询 table1 表中 c1='a' 的数据

```sql
CREATE ROW POLICY test_row_policy_1 ON test.table1 
AS RESTRICTIVE TO test USING (c1 = 'a');
```
## 列权限
使用 Doris 中的列权限，您可以对表进行精细访问控制。您可以只授予一个表中特定列的权限，来决定哪些用户或角色可以访问表的特定列

目前列权限仅支持 Select_priv

### 相关命令
- 授权：[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- 回收权限： [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)

### 列权限示例

1. 授权 user1 查询 tbl 表的列：col1，col2.
```sql
GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
```

## 数据脱敏
数据脱敏是一种保护敏感数据的方法，它通过对原始数据进行修改、替换或隐藏，使得脱敏后的数据在保持一定格式和特性的同时，不再包含敏感信息。

例如，管理员可以选择将信用卡号、身份证号等敏感字段的部分或全部数字替换为星号 * 或其他字符，或者将真实姓名替换为假名。

从 2.1.2 版本开始，支持通过 Apache Ranger 的 Data Masking 来为某些列设置脱敏策略，目前仅支持通过 [Apache Ranger](./ranger)来设置

> 为 admin/root 用户设置数据脱敏不会生效
