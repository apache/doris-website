---
{
  "title": "BOOL_AND",
  "language": "ja",
  "description": "式の全ての非NULL値に対して論理AND集約を実行します。"
}
---
## 説明

式のすべての非NULL値に対して論理AND集約を実行します。

## エイリアス

- BOOLAND_AGG

## 構文

```text
BOOL_AND(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 論理ANDで集約される式。BOOLEAN型および0/非0ルール（0はFALSE、非0はTRUE）でbooleanに変換可能な数値型をサポートします。 |

## 戻り値

戻り値はBOOLEANです。すべての非NULL値がTRUEの場合のみTRUEを返し、そうでなければFALSEを返します。

式のすべての値がNULLまたは式が空の場合、関数はNULLを返します。

## 例

setup :

```sql
CREATE TABLE IF NOT EXISTS test_boolean_agg (
     id INT,
     c1 BOOLEAN,
     c2 BOOLEAN,
     c3 BOOLEAN,
     c4 BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO test_boolean_agg (id, c1, c2, c3, c4) values 
(1, true, true, true, false),
(2, true, false, false, false),
(3, true, true, false, false),
(4, true, false, false, false);
```
### 集約関数:

```sql
SELECT booland_agg(c1), booland_agg(c2), booland_agg(c3), booland_agg(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| booland_agg(c1) | booland_agg(c2) | booland_agg(c3) | booland_agg(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               1 |               0 |               0 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```
bool_andは数値型のパラメータも受け取ることができ、数値が0でない場合は`TRUE`に変換されます

```sql
CREATE TABLE test_numeric_and_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_and_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```
```sql
SELECT
    BOOL_AND(c_int) AS bool_and_int,
    BOOL_AND(c_float) AS bool_and_float,
    BOOL_AND(c_decimal) AS bool_and_decimal,
    BOOL_AND(c_bool) AS bool_and_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_and_int | bool_and_float | bool_and_decimal | bool_and_bool |
+--------------+----------------+------------------+---------------+
|            0 |              1 |                0 |          NULL |
+--------------+----------------+------------------+---------------+
```
### Window function:
以下の例では、条件（id > 2）に基づいて行をパーティション化し、2つのグループに分割して、ウィンドウ集約の結果を表示します：

```sql
SELECT * FROM test_boolean_agg;
```
```text
+------+------+------+------+------+
| id   | c1   | c2   | c3   | c4   |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
```sql
SELECT
    id,
    BOOLAND_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLAND_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLAND_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLAND_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    0 |    0 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    0 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
### エラー例:

```sql
SELECT BOOL_AND('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_and requires a boolean or numeric argument
```
