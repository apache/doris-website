---
{
    "title": "数据访问控制",
    "language": "zh-CN",
    "description": "通过行权限、列权限和数据脱敏，在 Apache Doris 中对敏感数据实现精细化访问控制，按用户或角色限制可见的行、列与字段内容。",
    "keywords": [
        "数据访问控制",
        "行权限",
        "Row Policy",
        "列权限",
        "Column Permission",
        "数据脱敏",
        "Data Masking",
        "敏感数据保护",
        "Select_priv",
        "Apache Ranger",
        "细粒度权限",
        "RBAC"
    ]
}
---

<!-- 知识类型: 功能介绍 / 操作步骤 -->
<!-- 适用场景: 敏感数据保护 / 数据合规 / 细粒度权限管控 -->

Apache Doris 提供 **行权限（Row Policy）**、**列权限（Column Permission）** 和 **数据脱敏（Data Masking）** 三种机制，帮助管理员从行、列、字段三个维度对敏感数据实施精细化访问控制。本文介绍这些机制的工作原理、使用限制与典型示例。

## 适用场景

| 场景 | 推荐机制 | 说明 |
|------|----------|------|
| 不同用户只能看到表中**部分行**（如按地区、租户、部门隔离） | 行权限 | 自动为查询追加过滤谓词 |
| 不同用户只能访问表中**部分列**（如隐藏工资、手机号列） | 列权限 | 仅授予指定列的 `Select_priv` |
| 敏感字段需**部分隐藏或替换**（如身份证、银行卡号显示为 `***`） | 数据脱敏 | 通过 Apache Ranger 配置 Masking 策略 |

## 前置条件

- 当前用户拥有授权目标对象的管理权限（如 `GRANT` 权限）。
- 数据脱敏依赖 Apache Ranger，需提前完成 Ranger 集成（参考 [Apache Ranger 鉴权](./ranger)）。
- 三种机制对默认用户 `root` 和 `admin` 均不生效。

## 行权限

<!-- 知识类型: 功能介绍 -->
<!-- 适用场景: 多租户隔离 / 行级数据过滤 -->

使用 Doris 中的行级策略，您可以对敏感数据进行精细访问控制。您可以根据在表级别定义的安全策略，来决定哪些用户或角色可以访问表中数据的特定记录。

### 工作机制

相当于为配置了 Row Policy 的用户在查询时自动加上 Row Policy 中设置的谓词。

### 使用限制

- 不能为默认用户 `root` 和 `admin` 设置 Row Policy。

### 相关命令

- 查看行权限策略：[SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- 创建行权限策略：[CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)

### 行权限示例

1. 限制 `test` 用户仅能查询 `table1` 表中 `c1='a'` 的数据：

    ```sql
    CREATE ROW POLICY test_row_policy_1 ON test.table1 
    AS RESTRICTIVE TO test USING (c1 = 'a');
    ```

## 列权限

<!-- 知识类型: 功能介绍 -->
<!-- 适用场景: 列级数据隔离 / 敏感字段隐藏 -->

使用 Doris 中的列权限，您可以对表进行精细访问控制。您可以只授予一个表中特定列的权限，来决定哪些用户或角色可以访问表的特定列。

目前列权限仅支持 `Select_priv`。

### 相关命令

- 授权：[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- 回收权限：[REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)

### 列权限示例

1. 授权 `user1` 查询 `tbl` 表中的 `col1`、`col2` 两列：

    ```sql
    GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
    ```

## 数据脱敏

<!-- 知识类型: 功能介绍 -->
<!-- 适用场景: 敏感字段保护 / 数据合规 -->

数据脱敏是一种保护敏感数据的方法，它通过对原始数据进行修改、替换或隐藏，使得脱敏后的数据在保持一定格式和特性的同时，不再包含敏感信息。

例如，管理员可以选择将信用卡号、身份证号等敏感字段的部分或全部数字替换为星号 `*` 或其他字符，或者将真实姓名替换为假名。

从 2.1.2 版本开始，支持通过 Apache Ranger 的 Data Masking 来为某些列设置脱敏策略，目前仅支持通过 [Apache Ranger](./ranger) 来设置。

> 为 `admin`/`root` 用户设置数据脱敏不会生效。

## 常见问题

### Q: 为 `root` 或 `admin` 用户配置了 Row Policy / 数据脱敏，但未生效？

三种机制对默认超级用户 `root` 和 `admin` 均不生效，请使用其他业务用户进行验证。

### Q: 列权限授权后查询仍报权限不足？

当前列权限仅支持 `Select_priv`，请确认授权语句使用了该权限项，且授权对象为目标 Catalog / 数据库 / 表。

### Q: 数据脱敏策略未生效？

数据脱敏必须通过 Apache Ranger 配置，且需 Doris 版本不低于 2.1.2。请确认 Ranger 集成已完成、策略已生效，且当前用户不是 `root`/`admin`。
