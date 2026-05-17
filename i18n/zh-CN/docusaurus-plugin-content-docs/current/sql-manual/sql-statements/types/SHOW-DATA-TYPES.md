---
{
    "title": "SHOW DATA TYPES",
    "language": "zh-CN",
    "description": "该语句用于查看 DORIS 支持的所有数据类型。"
}
---

## 描述

该语句用于查看 DORIS 支持的所有数据类型。

## 语法

```sql
SHOW DATA TYPES;
```

## 返回值

| 列名       | 说明   |
|----------|------|
| TypeName | 类型名称 |
| Size     | 字节大小 |

## 权限控制

执行此 SQL 命令的用户不需要具有特定的权限

## 示例

- 查看 Doris 支持的所有数据类型

   ```sql
   SHOW DATA TYPES;
   ```
   ```text
   +----------------+------+
   | TypeName       | Size |
   +----------------+------+
   | AGG_STATE      | 16   |
   | ARRAY          | 32   |
   | BIGINT         | 8    |
   | BITMAP         | 16   |
   | BOOLEAN        | 1    |
   | CHAR           | 16   |
   | DATE           | 16   |
   | DATETIME       | 16   |
   | DATETIMEV2     | 8    |
   | DATEV2         | 4    |
   | DECIMAL128     | 16   |
   | DECIMAL32      | 4    |
   | DECIMAL64      | 8    |
   | DECIMALV2      | 16   |
   | DOUBLE         | 8    |
   | FLOAT          | 4    |
   | HLL            | 16   |
   | INT            | 4    |
   | IPV4           | 4    |
   | IPV6           | 16   |
   | JSON           | 16   |
   | LARGEINT       | 16   |
   | MAP            | 24   |
   | QUANTILE_STATE | 16   |
   | SMALLINT       | 2    |
   | STRING         | 16   |
   | TINYINT        | 1    |
   | VARCHAR        | 16   |
   +----------------+------+
   ```
