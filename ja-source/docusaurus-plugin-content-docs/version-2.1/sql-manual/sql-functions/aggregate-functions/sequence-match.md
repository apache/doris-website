---
{
  "title": "SEQUENCE_MATCH",
  "language": "ja",
  "description": "シーケンスがパターンにマッチするイベントチェーンを含んでいるかどうかをチェックします。"
}
---
## 説明

シーケンスがパターンにマッチするイベントチェーンを含むかどうかを確認します。

**警告！**

同じ秒で発生するイベントは、シーケンス内で未定義の順序で配置される可能性があり、結果に影響を与える場合があります。


## 構文

```sql
SEQUENCE_MATCH(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<pattern>` | パターン文字列。下記の**パターン構文**を参照してください。 |
| `<timestamp>` | 時間データを含むと見なされる列。一般的なデータ型は`Date`および`DateTime`です。サポートされているUIntデータ型のいずれかも使用できます。 |
| `<cond_n>` | イベントの連鎖を記述する条件。データ型：`UInt8`。最大32個の条件引数を渡すことができます。この関数はこれらの条件で記述されたイベントのみを考慮します。シーケンスに条件で記述されていないデータが含まれている場合、この関数はそれらをスキップします。 |

**パターン構文**

- `(?N)` — 位置Nの条件引数にマッチします。条件は`[1, 32]`の範囲で番号が付けられます。例えば、`(?1)`は`cond1`パラメータに渡された引数にマッチします。

- `.*` — 任意の数のイベントにマッチします。このパターン要素にマッチするのに条件引数は必要ありません。

- `(?t operator value)` — 2つのイベント間に設けるべき時間を秒単位で設定します。

- `t`を2つの時間の秒単位での差として定義します。例えば、パターン`(?1)(?t>1800)(?2)`は互いに1800秒以上離れて発生するイベントにマッチします。パターン`(?1)(?t>10000)(?2)`は互いに10000秒以上離れて発生するイベントにマッチします。これらのイベントの間には任意の数の任意のイベントが存在できます。`>=`、`>`、`<`、`<=`、`==`演算子を使用できます。

## 戻り値

1：パターンがマッチした場合。

0：パターンがマッチしなかった場合。

## 例

**マッチ例**

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
**特殊な例**

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
これは非常にシンプルな例です。この関数は、数値5が数値1に続くイベントチェーンを見つけました。その間にある数値7、3、4はスキップされました。これは、その数値がイベントとして記述されていないためです。例で示されたイベントチェーンを検索する際にこの数値を考慮したい場合は、そのための条件を作成する必要があります。

それでは、このクエリを実行してください：

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
結果はやや混乱を招くものです。この場合、番号4のイベントが1と5の間で発生したため、関数はパターンに一致するイベントチェーンを見つけることができませんでした。同じケースで番号6の条件をチェックした場合、シーケンスはパターンに一致するでしょう。

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
