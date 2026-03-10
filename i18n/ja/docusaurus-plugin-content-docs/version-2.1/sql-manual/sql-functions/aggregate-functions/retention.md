---
{
  "title": "リテンション",
  "language": "ja",
  "description": "保持関数は、特定の条件が満たされたかどうかを示すUInt8型の1から32個の引数の条件セットを引数として取ります"
}
---
## 説明

`retention`関数は、イベントに対して特定の条件が満たされたかどうかを示す`UInt8`型の1から32個の引数からなる条件セットを引数として受け取ります。任意の条件を引数として指定できます。

最初の条件を除き、条件はペアで適用されます：2番目の結果は1番目と2番目が真の場合に真となり、3番目の結果は1番目と3番目が真の場合に真となる、といった具合です。

簡単に言うと、戻り値配列の最初の桁は`event_1`が真か偽かを示し、2番目の桁は`event_1`と`event_2`の真偽を表し、3番目の桁は`event_1`が真か偽かと`event_3`が真か偽かを表す、といった具合です。`event_1`が偽の場合、ゼロで満たされた配列を返します。

## 構文

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<event_n>` | `n`番目のイベント条件。`UInt8`型で値は1または0。 |

## 戻り値

最大長32の1と0の配列。最終的な出力配列の長さは入力パラメータの長さと一致します。

- 1: 条件が満たされている。
- 0: 条件が満たされていない。

## 例

```sql
-- Create sample table
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id', 
    `date` datetime COMMENT 'date time' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT into retention_test values 
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');

-- Calculate user retention
SELECT 
    uid,     
    RETENTION(date = '2022-10-12') AS r,
    RETENTION(date = '2022-10-12', date = '2022-10-13') AS r2,
    RETENTION(date = '2022-10-12', date = '2022-10-13', date = '2022-10-14') AS r3 
FROM retention_test 
GROUP BY uid 
ORDER BY uid ASC;
```
```text
+------+------+--------+-----------+
| uid  | r    | r2     | r3        |
+------+------+--------+-----------+
|    0 | [1]  | [1, 1] | [1, 1, 1] |
|    1 | [1]  | [1, 1] | [1, 1, 0] |
|    2 | [1]  | [1, 0] | [1, 0, 0] |
+------+------+--------+-----------+
```
