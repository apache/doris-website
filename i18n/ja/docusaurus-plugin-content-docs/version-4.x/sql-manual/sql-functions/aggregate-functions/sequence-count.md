---
{
  "title": "SEQUENCE_COUNT",
  "description": "パターンにマッチしたイベントチェーンの数をカウントします。この関数は重複しないイベントチェーンを検索します。",
  "language": "ja"
}
---
## デスクリプション

パターンにマッチしたイベントチェーンの数をカウントします。この関数は重複しないイベントチェーンを検索します。現在のチェーンがマッチした後、次のチェーンの検索を開始します。

**WARNING!** 

同じ秒に発生するイベントは、未定義の順序でシーケンスに配置される可能性があり、結果に影響を与えます。

## Syntax

```sql
SEQUENCE_COUNT(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>]);
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<pattern>` | パターン文字列、以下の**Pattern syntax**を参照してください。String型をサポートします。 |
| `<timestamp>` | 時間データを含むとみなされる列。Date、DateTime型をサポートします。 |
| `<cond_n>` | イベントのチェーンを記述する条件。Bool型をサポートします。最大32個の条件引数を渡すことができます。この関数は、これらの条件で記述されたイベントのみを考慮します。シーケンスに条件で記述されていないデータが含まれている場合、関数はそれらをスキップします。 |

**Pattern syntax**

- `(?N)` — 位置Nの条件引数にマッチします。条件は`[1, 32]`の範囲で番号付けされます。例えば、`(?1)`は`cond_1`パラメータに渡される引数にマッチします。

- `.*` — 任意の数のイベントにマッチします。パターンのこの要素をカウントするために条件引数は必要ありません。

- `(?t operator value)` — 2つのイベント間を分離すべき時間を秒単位で設定します。

- `t`は2つの時間の差を秒単位で定義します。例えば、パターン`(?1)(?t>1800)(?2)`は1800秒以上離れて発生するイベントにマッチします。パターン`(?1)(?t>10000)(?2)`は10000秒以上離れて発生するイベントにマッチします。これらのイベントの間には任意の数の任意のイベントが存在することができます。`>=`、`>`、`<`、`<=`、`==`演算子を使用できます。


## Return Value

マッチした重複しないイベントチェーンの数。
グループに有効なデータがない場合、0を返します。

## Examples

**Matching examples**

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
**非一致の例**

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
これは非常にシンプルな例です。この関数は、数値5が数値1に続くイベントチェーンを見つけました。間にある数値7、3、4はスキップされました。これらの数値がイベントとして記述されていないためです。例で示されたイベントチェーンを検索する際にこの数値を考慮したい場合は、それに対する条件を作成する必要があります。

次のクエリを実行してください：

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
結果はやや混乱を招くものです。この場合、数字4のイベントが1と5の間で発生したため、関数はパターンにマッチするイベントチェーンを見つけることができませんでした。同じケースで数字6の条件をチェックした場合、シーケンスはパターンをカウントするでしょう。

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
