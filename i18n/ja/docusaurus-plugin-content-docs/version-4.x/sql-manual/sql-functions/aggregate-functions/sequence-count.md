---
{
    "title": "SEQUENCE_COUNT",
    "language": "ja",
    "description": "パターンに一致するイベント系列の数を数えます。重複しないイベント系列を検索します。"
}
---

## 説明

パターンに一致するイベント系列の数を数えます。重複しないイベント系列を検索し、現在の系列が一致した後から次の系列の検索を開始します。

**警告:**

同じ秒に発生したイベントの系列内での順序は未定義であり、結果に影響する場合があります。

## 構文

```sql
SEQUENCE_COUNT(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>]);
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<pattern>` | パターン文字列です。以下の**パターン構文**を参照してください。サポートされる型は String です。 |
| `<timestamp>` | 時刻データを含む列です。サポートされる型は Date、DateTime です。 |
| `<cond_n>` | イベント系列を記述する条件です。サポートされる型は Bool です。条件引数は最大 32 個指定できます。この関数は、これらの条件で記述されたイベントだけを考慮します。系列に条件で記述されていないデータが含まれている場合、そのデータはスキップします。 |

**パターン構文**

- `(?N)` — 位置 N の条件引数に一致します。条件には `[1, 32]` の範囲で番号を付けます。たとえば、`(?1)` は `cond_1` パラメータに渡された引数に一致します。

- `.*` — 任意の数のイベントに一致します。このパターン要素を数えるための条件引数は不要です。

- `(?t operator value)` — 二つのイベントの間隔を秒単位で指定します。

- `t` は二つの時刻の差を秒単位で表します。たとえば、パターン `(?1)(?t>1800)(?2)` は 1800 秒より長く離れて発生したイベントに一致します。パターン `(?1)(?t>10000)(?2)` は 10000 秒より長く離れて発生したイベントに一致します。これらのイベントの間には、任意の数のイベントが存在できます。使用できる演算子は `>=`、`>`、`<`、`<=`、`==` です。


## 戻り値

一致した、重複しないイベント系列の数を返します。
グループ内に有効なデータがない場合は 0 を返します。

## 例

**一致する例**

```sql
-- Create sample table
CREATE TABLE sequence_count_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test1(uid, date, number) values 
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 

-- Query example
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 3) as c1,
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_count_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    2 |    2 |
+------+------+------+
```

**一致しない例**

```sql
-- Create sample table
CREATE TABLE sequence_count_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- Query example
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c1,
    SEQUENCE_COUNT('(?1)(?2).*', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_count_test2;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    0 |    0 |    0 |
+------+------+------+
```

**特別な例**

```sql
-- Create sample table
CREATE TABLE sequence_count_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- Query example
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5) FROM sequence_count_test3;
```

```text
+----------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

これは単純な例です。関数は number 5 が number 1 に続くイベント系列を見つけます。その間にある number 7、3、4 はイベントとして条件に記述されていないため、スキップします。この例のイベント系列を検索する際にこれらの値も考慮するには、それらの値に対する条件を指定する必要があります。

次に、以下のクエリを実行します。

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 4) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

この結果は分かりにくいかもしれません。この場合、number 4 のイベントが 1 と 5 の間に発生しているため、関数はパターンに一致するイベント系列を見つけられません。一方、同じ状況で number 6 の条件を指定すると、パターンに一致する系列が数えられます。

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 6) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
