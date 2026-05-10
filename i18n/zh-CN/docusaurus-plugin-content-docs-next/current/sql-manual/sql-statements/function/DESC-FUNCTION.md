---
{
    "title": "DESC FUNCTION",
    "language": "zh-CN",
    "description": "利用 desc function tablevaluedfunction 获取对应表值函数的 Schema 信息。"
}
---

## 描述

利用 `desc function table_valued_function` 获取对应表值函数的 Schema 信息。

## 语法

```sql
DESC FUNCTION <table_valued_function>
```

## 必选参数

1. `<table_valued_function>`: 表值函数的名字，如 CATALOGS。支持的表值函数列表，请参阅“[表值函数](../../../sql-manual/sql-functions/table-valued-functions/s3/)”章节

## 示例

查询表值函数 CATALOGS 的信息：

```sql
DESC FUNCTION catalogs();
```

结果如下：

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```