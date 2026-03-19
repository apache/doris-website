---
{
  "title": "UNNEST",
  "language": "ja"
}
---
## 説明
`unnest`は、配列/コレクション/マップ型の式を複数行に展開する（テーブル生成関数）。SELECT リストと FROM 句で使用でき、WITH ORDINALITY をサポートして各展開行に連番を追加する。`explode` シリーズの関数と同様に、`unnest` は複数のパラメータ、Map や Bitmap などの型をサポートし、FROM/LATERAL や JOIN シナリオにおいて LEFT（外部）セマンティクスもサポートする。

## 構文

```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- LATERAL can be added before the FROM clause: LATERAL UNNEST(...), where LATERAL is an optional keyword
```
## パラメータ
- <expr>: ARRAY、MAP、BITMAP、または式のリスト（複数パラメータの場合はARRAY型のみサポート）を指定可能。

## 戻り値
- 単一のARRAYパラメータ：要素型の複数行を持つ単一列を返す（要素ごとに1行）。要素がNULLの場合、NULLが出力される。
- 複数のARRAYパラメータ：位置によって各回展開された要素を複数列（またはStruct）に結合する。展開の長さは最も長い入力によって決定され、短い列はNULLでパディングされる。
- MAPパラメータ：2列（Struct）（key、value）を返す；NULLキー/値はNULLのまま。
- BITMAPパラメータ：要素ごとに整数値を返す。
- WITH ORDINALITY：1から始まるシーケンス番号列を出力に追加する（最後の列として、またはエイリアスで指定された位置に）。
- 空配列またはNULL：
  - 独立したテーブルを生成する場合（SELECTリストまたはFROM ... UNNEST）、パラメータがNULLまたは空配列の場合、行は生成されない（0行）。
  - FROM/LATERALとLEFT JOINの組み合わせで使用される場合（つまり、外部行セマンティクスを生成）、親行の展開された行がすべてフィルタリングされるか出力がない場合、親行のために行が挿入され、UNNEST出力列はNULLに設定される（左テーブル行を保持するため）。

## 使用上の注意
1. パラメータ型はARRAY / MAP / BITMAPである必要があり、そうでない場合はエラーが発生する。
2. 複数パラメータを展開する場合、位置によってペアリングが行われ、不足する列はNULLでパディングされる。
3. ASでエイリアスを使用して展開列名を明示的に指定できる；列名が指定されない場合、システムはデフォルトの列名を生成する。
4. JOINシナリオにおいて：
   - INNER / CROSS JOIN：展開結果に基づいてデカルト積またはマッチングを実行する。
   - LEFT JOIN LATERAL：外部行セマンティクスを実装する — マッチがないか、すべての展開結果がON/フィルタ条件によってフィルタリングされた場合、NULL値を持つ行が生成される（左テーブル行を保持するため）。
5. WITH ORDINALITYは展開された行にシーケンス番号（1から開始）を追加する。
6. UNNEST(...)がSELECTリストで直接使用される場合、単一行ソースにテーブル生成関数を適用することと同等であり、式を複数行の出力に展開する。

## 例
準備：

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
1. SELECT リスト内で使用（単一の式が複数の行に展開される）：

```sql
SELECT unnest([1,2,3]);
```
出力（例）:

```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. 指定された列名を持つFROM / LATERALでの展開:

```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
出力 (例):

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
出力（例）：

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
4. 一致する行を保持するためのINNER JOIN:

```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
出力（例）：

```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOINを使用して左テーブルの行を保持する（マッチしない場合、UNNESTカラムはNULLになる）：

```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
出力 (例):

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
6. 複数のARRAYパラメータ / Map / Bitmap:

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
7. SELECT リスト内で

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
