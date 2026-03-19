---
{
  "title": "SEQUENCE_COUNT",
  "language": "ja",
  "description": "パターンにマッチしたイベントチェーンの数をカウントします。この関数は重複しないイベントチェーンを検索します。"
}
---
## 説明

パターンにマッチしたイベントチェーンの数をカウントします。この関数は重複しないイベントチェーンを検索します。現在のチェーンがマッチした後、次のチェーンの検索を開始します。

**警告！**

同じ秒に発生したイベントは、未定義の順序でシーケンスに配置される可能性があり、結果に影響を与えます。

## 構文

```sql
SEQUENCE_COUNT(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>]);
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<pattern>` | パターン文字列。下記の**パターン構文**を参照してください。 |
| `<timestamp>` | 時間データを含むと見なされる列。一般的なデータ型は`Date`と`DateTime`です。サポートされているUIntデータ型のいずれかも使用できます。 |
| `<cond_n>` | イベントチェーンを記述する条件。データ型：`UInt8`。最大32個の条件引数を渡すことができます。この関数は、これらの条件で記述されたイベントのみを考慮します。シーケンスに条件で記述されていないデータが含まれている場合、関数はそれらをスキップします。 |

**パターン構文**

- `(?N)` — 位置Nの条件引数にマッチします。条件は`[1, 32]`の範囲で番号が付けられます。例えば、`(?1)`は`cond_1`パラメータに渡された引数にマッチします。

- `.*` — 任意の数のイベントにマッチします。パターンのこの要素をカウントするために条件引数は必要ありません。

- `(?t operator value)` — 2つのイベント間を分離すべき秒単位の時間を設定します。

- `t`を2つの時刻間の秒単位の差として定義します。例えば、パターン`(?1)(?t>1800)(?2)`は1800秒以上離れて発生するイベントにマッチします。パターン`(?1)(?t>10000)(?2)`は10000秒以上離れて発生するイベントにマッチします。これらのイベント間には任意の数の任意のイベントが存在できます。`>=`、`>`、`<`、`<=`、`==`演算子を使用できます。


## 戻り値

マッチした重複しないイベントチェーンの数。

## 例

**マッチングの例**

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
これは非常にシンプルな例です。この関数は、数字5が数字1に続くイベントチェーンを見つけました。それらの間にある数字7、3、4はスキップされました。なぜなら、これらの数字はイベントとして記述されていないからです。例に示されたイベントチェーンを検索する際にこれらの数字を考慮したい場合は、それらに対する条件を作成する必要があります。

では、このクエリを実行してください：

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
結果は少し混乱を招きます。この場合、数値4のイベントが1と5の間に発生したため、関数はパターンに一致するイベントチェーンを見つけることができませんでした。同じケースで数値6の条件をチェックした場合、シーケンスはパターンをカウントします。

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
