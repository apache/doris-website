---
{
    "title": "UNNEST",
    "language": "ja"
}
---

## 説明
`unnest` は、ARRAY、COLLECTION、MAP 型の式を複数の行に展開するテーブル生成関数です。SELECT リストと FROM 句で使用でき、WITH ORDINALITY を指定すると、展開した各行に連番を追加できます。`explode` 系の関数と同様に、`unnest` は複数の引数や MAP、BITMAP などの型をサポートします。また、FROM/LATERAL および JOIN で使用する場合は、LEFT JOIN による外部結合の動作もサポートします。

## 構文
```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- LATERAL can be added before the FROM clause: LATERAL UNNEST(...), where LATERAL is an optional keyword
```

## パラメータ
- <expr>: ARRAY、MAP、BITMAP、または式のリストを指定できます（複数の引数を指定する場合は ARRAY 型のみサポートされます）。

## 戻り値
- ARRAY 型の引数を単独で指定した場合: 要素の型を持つ単一列の複数行を返します（各要素につき一行）。要素が NULL の場合は NULL を出力します。
- ARRAY 型の引数を複数指定した場合: 各位置で展開された要素を複数の列（または STRUCT）にまとめます。展開後の行数は最長の入力に合わせ、短い列には NULL を補います。
- MAP 型の引数を指定した場合: キー列と値列（STRUCT）を返します。NULL のキーや値は NULL のままです。
- BITMAP 型の引数を指定した場合: 各要素を整数値として返します。
- WITH ORDINALITY: 0 から始まる連番の列を出力に追加します（先頭の列、またはエイリアスで指定した列として追加されます）。
- 空の配列または NULL:
  - 独立したテーブルを生成する場合（SELECT リストまたは FROM ... UNNEST）、引数が NULL または空の配列であれば、行は生成されません（0 行）。
  - FROM/LATERAL と LEFT JOIN を組み合わせて使用する場合（つまり、外部結合の行を生成する場合）、親行の展開結果がすべてフィルタリングされるか、結果がないときは、左側のテーブルの行を保持するために、UNNEST の出力列を NULL とした行を挿入します。

## 使用上の注意
1. 引数の型は ARRAY、MAP、BITMAP のいずれかである必要があります。それ以外の型ではエラーが発生します。
2. 複数の引数を展開するときは、位置によって要素を対応付けます。要素が不足する列には NULL を補います。
3. AS とエイリアスを使って、展開後の列名を明示的に指定できます。列名を指定しない場合は、システムがデフォルトの列名を生成します。
4. JOIN で使用する場合:
   - INNER / CROSS JOIN: 展開結果に基づいて直積またはマッチングを行います。
   - LEFT JOIN LATERAL: 外部結合の動作を実現します。マッチする行がない場合、または展開結果がすべて ON 句やフィルタ条件で除外された場合は、左側のテーブルの行を保持するために、NULL 値を持つ行を生成します。
5. WITH ORDINALITY は、展開された行に 0 から始まる連番を追加します。
6. UNNEST(...) を SELECT リストで直接使用すると、単一行の入力にテーブル生成関数を適用し、その式を複数の出力行に展開することと同じです。

## 例
準備:
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
1. SELECT リストで使用する場合（単一の式を複数の行に展開）:
```sql
SELECT unnest([1,2,3]);
```
出力例:
```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. FROM / LATERAL で展開し、列名を指定する場合:
```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
出力例:
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
3. WITH ORDINALITY を使用する場合:
```sql
SELECT i.id, t.tag, t.ord
FROM items i, unnest(i.tags) WITH ORDINALITY AS t(ord, tag)
ORDER BY i.id, t.ord;
```
出力例:
```sql
+------+-------------+------+
| id   | tag         | ord  |
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
4. INNER JOIN で一致する行を残す場合:
```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
出力例:
```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOIN で左側のテーブルの行を残す場合（一致しないときは UNNEST の列が NULL）:
```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
出力例:
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
6. 複数の ARRAY 型引数 / MAP / BITMAP を使用する場合:
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
7. SELECT リストで使用する場合
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
