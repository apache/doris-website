---
{
    "title": "UNNEST",
    "language": "en-US"
}
---

## Description
`unnest` expands array/collection/map type expressions into multiple rows (a table-generating function). It can be used in the SELECT list and FROM clause, and supports WITH ORDINALITY to append a sequence number to each expanded row. Similar to the `explode` series of functions, `unnest` supports multiple parameters, types such as Map and Bitmap, and also supports LEFT (outer) semantics in FROM/LATERAL and JOIN scenarios.

## Syntax
```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- LATERAL can be added before the FROM clause: LATERAL UNNEST(...), where LATERAL is an optional keyword
```

## Parameters
- <expr>: Can be ARRAY, MAP, BITMAP, or a list of expressions (only ARRAY type is supported for multiple parameters).

## Return Values
- Single ARRAY parameter: Returns a single column with multiple rows of the element type (one row per element). If an element is NULL, NULL is output.
- Multiple ARRAY parameters: Combines the elements expanded each time into multiple columns (or as a Struct) by position. The expansion length is determined by the longest input, and shorter columns are padded with NULL.
- MAP parameter: Returns two columns (Struct) (key, value); NULL keys/values remain NULL.
- BITMAP parameter: Returns integer values by element.
- WITH ORDINALITY: Appends a sequence number column starting from 1 to the output (as the last column or specified by an alias).
- Empty array or NULL:
  - When generating an independent table (SELECT list or FROM ... UNNEST), if the parameter is NULL or an empty array, no rows are generated (0 rows).
  - When used in combination with FROM/LATERAL and LEFT JOIN (i.e., generating outer row semantics), if all expanded rows of a parent row are filtered or have no output, a row is inserted for the parent row, with the UNNEST output columns set to NULL (to retain the left table row).

## Usage Notes
1. The parameter type must be ARRAY / MAP / BITMAP; otherwise, an error is thrown.
2. When expanding multiple parameters, pairing is done by position; insufficient columns are padded with NULL.
3. An alias can be used with AS to explicitly specify expanded column names; if no column names are specified, the system generates default column names.
4. In JOIN scenarios:
   - INNER / CROSS JOIN: Performs Cartesian product or matching based on the expanded results.
   - LEFT JOIN LATERAL: Implements outer row semantics — if there are no matches or all expanded results are filtered by ON/filter conditions, a row with NULL values is generated (to retain the left table row).
5. WITH ORDINALITY adds a sequence number (starting from 1) to the expanded rows.
6. When UNNEST(...) is used directly in the SELECT list, it is equivalent to applying the table-generating function to a single-row source, expanding the expression into multiple rows of output.

## Examples
Preparation:
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
1. Used in the SELECT list (single expression expanded into multiple rows):
```sql
SELECT unnest([1,2,3]);
```
Output (example):
```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. Expansion in FROM / LATERAL with specified column names:
```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
Output (example):
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
Output (example):
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
4. INNER JOIN to retain matching rows:
```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
Output (example):
```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOIN to retain left table rows (UNNEST columns are NULL when no match):
```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
Output (example):
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
6. Multiple ARRAY parameters / Map / Bitmap:
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
7. In the SELECT list
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
