---
{
    "title": "COMMIT",
    "language": "zh-CN",
    "description": "提交一个显式事务。与 BEGIN 成对使用。"
}
---

## 描述

提交一个显式事务。与 [BEGIN](./BEGIN) 成对使用。

## 语法

```sql
COMMIT
```

## 注意事项

- 如果没有开启显式事务，执行该命令不生效

## 示例

以下示例创建了一个名为 test 的表，开启事务，写入两行数据后，提交事务。然后执行查询。

```sql
CREATE TABLE `test` (
  `ID` int NOT NULL,
  `NAME` varchar(100) NULL,
  `SCORE` int NULL
) ENGINE=OLAP
DUPLICATE KEY(`ID`)
DISTRIBUTED BY HASH(`ID`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

BEGIN;
INSERT INTO test VALUES(1, 'Alice', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
COMMIT;
SELECT * FROM test;
```
