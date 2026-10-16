---
{
    "title": "SEQUENCE_MATCH",
    "language": "ja",
    "description": "系列にパターンに一致するイベントの連なりが含まれるかを確認します。"
}
---

## 説明

系列にパターンに一致するイベントの連なりが含まれるかを確認します。

**警告！** 

同じ秒に発生したイベントの系列内での順序は未定義であり、結果に影響する場合があります。


## 構文

```sql
SEQUENCE_MATCH(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<pattern>` | パターン文字列です。以下の**パターン構文**を参照してください。サポートされる型は String です。 |
| `<timestamp>` | 時刻データを含む列です。サポートされる型は Date、DateTime です。 |
| `<cond_n>` | イベントの連なりを記述する条件です。サポートされる型は Bool です。条件引数は最大 32 個指定できます。この関数は、これらの条件で記述されたイベントだけを考慮します。系列に条件で記述されていないデータが含まれている場合、そのデータはスキップします。 |

**パターン構文**

- `(?N)` — 位置 N の条件引数に一致します。条件には `[1, 32]` の範囲で番号を付けます。たとえば、`(?1)` は `cond1` パラメータに渡された引数に一致します。

- `.*` — 任意の数のイベントに一致します。このパターン要素に一致させるための条件引数は不要です。

- `(?t operator value)` — 二つのイベントの間隔を秒単位で指定します。

- `t` は二つの時刻の差を秒単位で表します。たとえば、パターン `(?1)(?t>1800)(?2)` は 1800 秒より長く離れて発生したイベントに一致します。パターン `(?1)(?t>10000)(?2)` は 10000 秒より長く離れて発生したイベントに一致します。これらのイベントの間には、任意の数のイベントが存在できます。使用できる演算子は `>=`、`>`、`<`、`<=`、`==` です。

## 戻り値

パターンに一致する場合は 1 を返します。

パターンに一致しない場合は 0 を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例

**一致する例**

```sql
CREATE TABLE sequence_match_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test1(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 


SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 3) as c1,
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_match_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    1 |    1 |
+------+------+------+
```

**一致しない例**

```sql
CREATE TABLE sequence_match_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c1,
sequence_match('(?1)(?2).*', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_match_test2;
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
CREATE TABLE sequence_match_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5)
FROM sequence_match_test3;
```

```text
+----------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

これは単純な例です。関数は number が 1 のイベントの後に number が 5 のイベントが続く連なりを見つけました。間にある number が 7、3、4 のイベントは、条件でイベントとして記述されていないためスキップしました。この例のイベントの連なりを検索するときにこれらの値も考慮するには、その値に対する条件を指定する必要があります。

次に、以下のクエリを実行します。

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 4)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

この結果は少し分かりにくいかもしれません。この場合、number が 4 のイベントが 1 と 5 の間に発生しているため、関数はパターンに一致するイベントの連なりを見つけられませんでした。同じ状況で number が 6 の条件を指定すると、系列はパターンに一致します。

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 6)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
