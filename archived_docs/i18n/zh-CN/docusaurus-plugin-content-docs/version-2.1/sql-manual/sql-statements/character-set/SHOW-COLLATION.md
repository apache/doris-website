---
{
    "title": "SHOW COLLATION",
    "language": "zh-CN",
    "description": "在 Doris 中，SHOW COLLATION 命令用于显示数据库中可用的字符集校对。校对是一组决定数据如何排序和比较的规则。这些规则会影响字符数据的存储和检索。"
}
---

## 描述

在 Doris 中，`SHOW COLLATION` 命令用于显示数据库中可用的字符集校对。校对是一组决定数据如何排序和比较的规则。这些规则会影响字符数据的存储和检索。

## 语法

```sql
SHOW COLLATION
```

## 返回值

| 列名 | 说明 |
| -- | -- |
| Collation | 校对名称 |
| Charset | 字符集 |
| Id | 校对的 ID |
| Default | 是否是该字符集的默认校对 |
| Compiled | 是否已编译 |
| Sortlen | 排序长度 |



## 注意事项

在 Doris 中，虽然兼容 MySQL 的设置 collation 的命令。但是实际并不会生效。执行时，永远会使用 utf8mb4_0900_bin 作为比较规则。

## 示例

```sql
SHOW COLLATION;
```

```text
+--------------------+---------+------+---------+----------+---------+
| Collation          | Charset | Id   | Default | Compiled | Sortlen |
+--------------------+---------+------+---------+----------+---------+
| utf8mb4_0900_bin   | utf8mb4 |  309 | Yes     | Yes      |       1 |
| utf8mb3_general_ci | utf8mb3 |   33 | Yes     | Yes      |       1 |
+--------------------+---------+------+---------+----------+---------+
```


