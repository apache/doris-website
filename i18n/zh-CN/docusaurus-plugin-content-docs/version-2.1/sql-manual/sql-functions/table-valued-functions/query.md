---
{
    "title": "QUERY",
    "language": "zh-CN",
    "description": "query 表函数（table-valued-function,tvf），可用于将查询语句直接透传到某个 catalog 进行数据查询"
}
---

## 描述

query 表函数（table-valued-function,tvf），可用于将查询语句直接透传到某个 catalog 进行数据查询

Doris 2.1.3 版本开始支持，当前仅支持透传查询 jdbc catalog。
需要先在 Doris 中创建对应的 catalog。

## 语法

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```

## 必填参数
query 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对

| 字段           | 描述                         |
|--------------|----------------------------|
| `catalog`    | catalog 名称，需要按照 catalog 的名称填写 |
| `query`      | 需要执行的查询语句                  |


## 举例

可以配合`desc function`使用

```sql
desc function query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | int  | Yes  | true  | NULL    |       |
| name  | text | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

透传查询 jdbc catalog 数据源中的表

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
```
```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
```
```text
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

透传关联查询 jdbc catalog 数据源中的表

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
```
```
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
