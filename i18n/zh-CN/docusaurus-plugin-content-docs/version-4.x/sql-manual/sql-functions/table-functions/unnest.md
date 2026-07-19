---
{
    "title": "UNNEST",
    "language": "zh-CN"
}
---

## 描述
`unnest` 将数组/集合/映射类型表达式展开为多行（表生成函数）。支持在 SELECT 列表、FROM 中使用，并支持 WITH ORDINALITY 为每个展开行附加序号。与 `explode` 系列函数类似，但 `unnest` 支持多参数、Map 与 Bitmap 等类型，并在 FROM/LATERAL 与 JOIN 场景下支持 LEFT (outer) 语义。

## 语法
```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- 可在 FROM 子句前加 LATERAL： LATERAL UNNEST(...), LATERAL是个可选关键字
```

## 参数
- <expr>：可为 ARRAY、MAP、BITMAP，或为表达式列表（多个参数时，只支持ARRAY类型）。

## 返回值
- 单个 ARRAY 参数：返回元素类型的单列多行（每个元素一行）。元素为 NULL 时输出 NULL。
- 多个 ARRAY 参数：将每次展开的元素按位置组合为多列（或作为 Struct），展开长度由最长输入决定，短列用 NULL 补齐。
- MAP 参数：返回 (key, value) 两列（Struct）；NULL key/value 保持 NULL。
- BITMAP 参数：按元素返回整型。
- WITH ORDINALITY：在输出中附加一个从 1 开始的序号列（作为最后一列或由别名指定）。
- 空数组或 NULL：
  - 作为独立表生成（SELECT 列表或 FROM ... UNNEST）时，若参数为 NULL 或空数组，不产生行（0 行）。
  - 在 FROM/LATERAL 与 LEFT JOIN 联合使用时（即产生 outer 行语义），若某个父行的所有展开行被过滤或无输出，会为该父行插入一行，其中 UNNEST 输出列为 NULL（以保留左表行）。

## 使用说明
1. 参数类型必须是（ARRAY / MAP / BITMAP）；否则报错。
2. 多参数展开时，按位置配对；不足的列用 NULL 补齐。
3. 可用 AS 别名并显式指定展开列名；若不指定列名，系统会生成默认列名。
4. 在 JOIN 场景：
   - INNER / CROSS JOIN：按展开结果做笛卡尔或匹配。
   - LEFT JOIN LATERAL：实现 outer 行语义——若没有匹配或展开结果被 ON/过滤条件全部过滤，会产生一行 NULL（保持左表行）。
5. WITH ORDINALITY 为展开行增加序号（1 起）。
6. 在 SELECT 列表直接使用 `UNNEST(...)` 时，等价于对一个单行源应用表生成函数，会把该表达式展开为多行输出。

## 示例
准备：
```sql
CREATE TABLE items (
    id INT,
    name VARCHAR(50),
    tags ARRAY<VARCHAR(50)>, 
    price DECIMAL(10,2),
    category_ids ARRAY<INT>  
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO items (id, name, tags, price, category_ids) VALUES
        (1, 'Laptop', ['Electronics', 'Office', 'High-End', 'Laptop'], 5999.99, [1, 2, 3]),
        (2, 'Mechanical Keyboard', ['Electronics', 'Accessories'], 399.99, [1, 2]),
        (3, 'Basketball', ['Sports', 'Outdoor'], 199.99, [1,3]),
        (4, 'Badminton Racket', ['Sports', 'Equipment'], 299.99, [3]),
        (5, 'Shirt', ['Clothing', 'Office', 'Shirt'], 259.00, [4]);
```
1. 作为 SELECT 列表（单表达式展开为多行）：
```sql
SELECT unnest([1,2,3]);
```
输出（示例）：
```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. FROM / LATERAL 展开并指定列名：
```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
输出（示例）：
```sql
+------+-------------+
| id   | tag         |
+------+-------------+
|    1 | Electronics |
|    1 | High-End    |
|    1 | Laptop      |
|    1 | Office      |
|    2 | Accessories |
|    2 | Electronics |
|    3 | Outdoor     |
|    3 | Sports      |
|    4 | Equipment   |
|    4 | Sports      |
|    5 | Clothing    |
|    5 | Office      |
|    5 | Shirt       |
+------+-------------+
```
3. WITH ORDINALITY：
```sql
SELECT i.id, t.ord, t.tag
FROM items i, unnest(i.tags) WITH ORDINALITY AS t(tag, ord)
ORDER BY i.id, t.ord;
```
输出（示例）：
```sql
+------+-------------+------+
| id   | ord         | tag  |
+------+-------------+------+
|    1 | Electronics |    0 |
|    1 | High-End    |    2 |
|    1 | Laptop      |    3 |
|    1 | Office      |    1 |
|    2 | Accessories |    1 |
|    2 | Electronics |    0 |
|    3 | Outdoor     |    1 |
|    3 | Sports      |    0 |
|    4 | Equipment   |    1 |
|    4 | Sports      |    0 |
|    5 | Clothing    |    0 |
|    5 | Office      |    1 |
|    5 | Shirt       |    2 |
+------+-------------+------+
```
4. INNER JOIN 保留匹配行：
```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
输出（示例）：
```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOIN 保留左表行（无匹配时 UNNEST 列为 NULL）：
```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
输出（示例）：
```sql
+------+--------+---------------------+
| id   | tag    | name                |
+------+--------+---------------------+
|    1 | Laptop | Laptop              |
|    2 | NULL   | Mechanical Keyboard |
|    3 | NULL   | Basketball          |
|    4 | NULL   | Badminton Racket    |
|    5 | Shirt  | Shirt               |
+------+--------+---------------------+
```
6. 多ARRAY参数 / Map / Bitmap：
```sql
SELECT * FROM unnest([1,2], ['a','b']) AS t(c1, c2) ORDER BY 1;
+------+------+
| c1   | c2   |
+------+------+
|    1 | a    |
|    2 | b    |
+------+------+

SELECT * FROM unnest(bitmap_or(to_bitmap(23), to_bitmap(24))) AS t(col) ORDER BY 1;
+------+
| col  |
+------+
|   23 |
|   24 |
+------+

SELECT * FROM unnest({1:2, 3:4}) AS t(k, v) ORDER BY 1;
+------+------+
| k    | v    |
+------+------+
|    1 |    2 |
|    3 |    4 |
+------+------+
```
7. 在 SELECT 列表中
```sql
SELECT tags, category_ids, unnest(tags), unnest(category_ids) from items ORDER BY 1, 2;
+-------------------------------------------------+--------------+--------------+----------------------+
| tags                                            | category_ids | unnest(tags) | unnest(category_ids) |
+-------------------------------------------------+--------------+--------------+----------------------+
| ["Clothing", "Office", "Shirt"]                 | [4]          | Clothing     |                    4 |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Office       |                 NULL |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Shirt        |                 NULL |
| ["Electronics", "Accessories"]                  | [1, 2]       | Electronics  |                    1 |
| ["Electronics", "Accessories"]                  | [1, 2]       | Accessories  |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Electronics  |                    1 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Office       |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | High-End     |                    3 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Laptop       |                 NULL |
| ["Sports", "Equipment"]                         | [3]          | Sports       |                    3 |
| ["Sports", "Equipment"]                         | [3]          | Equipment    |                 NULL |
| ["Sports", "Outdoor"]                           | [1, 3]       | Sports       |                    1 |
| ["Sports", "Outdoor"]                           | [1, 3]       | Outdoor      |                    3 |
+-------------------------------------------------+--------------+--------------+----------------------+
```
