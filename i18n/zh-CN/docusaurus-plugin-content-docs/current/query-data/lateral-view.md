---
{
    "title": "列转行 (Lateral View)",
    "language": "zh-CN",
    "description": "Doris LATERAL VIEW 配合 EXPLODE 等生成器函数，将一行展开为多行，实现 SQL 列转行查询。",
    "keywords": [
        "Doris LATERAL VIEW",
        "列转行",
        "EXPLODE",
        "行转列",
        "数组展开",
        "lateral view explode",
        "SQL 一行变多行"
    ]
}
---

<!-- 知识类型: 语法参考 -->
<!-- 适用场景: 数组/集合类型展开查询、列转行 -->

`LATERAL VIEW` 是 Doris 提供的列转行语法。它与生成器函数（例如 `EXPLODE`）结合使用，能够将一行中的集合类型字段展开成多行，并把展开结果作为一张虚拟表与原始行进行连接。

## 适用场景

当一行数据中包含数组、列表等可枚举的集合，而你希望在 SQL 查询中把集合中的每个元素拆成独立行进行分析时，可以使用 `LATERAL VIEW`。典型场景包括：

- 将一行中的数组字段展开，与原始其他列一起逐元素输出。
- 对集合中的每个元素分别执行聚合、过滤或与其他表关联。
- 把生成器函数（如 `EXPLODE`、`EXPLODE_SPLIT` 等）的输出作为虚拟表参与查询。

## 语法

```sql
LATERAL VIEW generator_function ( expression [, ...] ) table_identifier AS column_identifier [, ...]
```

## 参数说明

| 参数 | 说明 |
| --- | --- |
| `generator_function` | 生成器函数，例如 `EXPLODE`、`EXPLODE_SPLIT` 等。 |
| `table_identifier` | `generator_function` 输出的虚拟表别名。 |
| `column_identifier` | 列别名，用于命名输出行；列别名的数量必须与生成器函数返回的列数一致。 |

## 使用示例

下面通过一个示例演示如何使用 `LATERAL VIEW` 完成列转行查询。

### 1. 准备数据

创建一张 `person` 表并写入若干测试数据：

```sql
CREATE TABLE `person` (
  `id` int(11) NULL,
  `name` text NULL,
  `age` int(11) NULL,
  `class` int(11) NULL,
  `address` text NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"in_memory" = "false",
"storage_format" = "V2",
"disable_auto_compaction" = "false"
);

INSERT INTO person VALUES
    (100, 'John', 30, 1, 'Street 1'),
    (200, 'Mary', NULL, 1, 'Street 2'),
    (300, 'Mike', 80, 3, 'Street 3'),
    (400, 'Dan', 50, 4, 'Street 4');
```

### 2. 执行 LATERAL VIEW 查询

使用 `LATERAL VIEW` 配合 `EXPLODE` 函数，将数组 `ARRAY(30, 60)` 中的每个元素与 `person` 表的每一行做笛卡尔展开：

```sql
SELECT * FROM person
LATERAL VIEW EXPLODE(ARRAY(30, 60)) tableName AS c_age;
```

### 3. 查看结果

查询结果会包含 `person` 表中每一行与 `EXPLODE` 生成的每一行的组合：

```sql
+------+------+------+-------+----------+-------+
| id   | name | age  | class | address  | c_age |
+------+------+------+-------+----------+-------+
|  100 | John |   30 |     1 | Street 1 |    30 |
|  100 | John |   30 |     1 | Street 1 |    60 |
|  200 | Mary | NULL |     1 | Street 2 |    30 |
|  200 | Mary | NULL |     1 | Street 2 |    60 |
|  300 | Mike |   80 |     3 | Street 3 |    30 |
|  300 | Mike |   80 |     3 | Street 3 |    60 |
|  400 | Dan  |   50 |     4 | Street 4 |    30 |
|  400 | Dan  |   50 |     4 | Street 4 |    60 |
+------+------+------+-------+----------+-------+
8 rows in set (0.12 sec)
```
