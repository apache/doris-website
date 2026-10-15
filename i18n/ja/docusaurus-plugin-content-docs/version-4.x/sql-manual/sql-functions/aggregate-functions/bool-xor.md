---
{
    "title": "BOOL_XOR",
    "language": "ja",
    "description": "式の NULL でないすべての値に対して論理 XOR 集約を行います。"
}
---

## 説明

式の NULL でないすべての値に対して論理 XOR 集約を行います。

## 別名

- BOOLXOR_AGG

## 構文

```text
BOOL_XOR(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 論理 XOR で集約する式。BOOLEAN 型、および 0/non-0 の規則（0 は FALSE、non-0 は TRUE）で真偽値に変換できる数値型をサポートします。 |

## 戻り値

戻り値の型は BOOLEAN です。TRUE を返すのは、TRUE が NULL でないすべての値の中に一つだけある場合です。それ以外の場合は FALSE を返します。

式のすべての値が NULL の場合、または式に値がない場合は NULL を返します。

## 例

テーブルを準備します:
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

### 集約関数

```sql
SELECT BOOLXOR_AGG(c1), BOOLXOR_AGG(c2), BOOLXOR_AGG(c3), BOOLXOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| BOOLXOR_AGG(c1) | BOOLXOR_AGG(c2) | BOOLXOR_AGG(c3) | BOOLXOR_AGG(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               0 |               0 |               1 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

BOOL_XOR は数値型も受け付けます。ゼロ以外の値は TRUE として扱われます:
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
    BOOL_XOR(c_int) AS bool_xor_int,
    BOOL_XOR(c_float) AS bool_xor_float,
    BOOL_XOR(c_decimal) AS bool_xor_decimal,
    BOOL_XOR(c_bool) AS bool_xor_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_xor_int | bool_xor_float | bool_xor_decimal | bool_xor_bool |
+--------------+----------------+------------------+---------------+
|            0 |              0 |                1 |          NULL |
+--------------+----------------+------------------+---------------+
```

### ウィンドウ関数
次の例では、条件 (id > 2) に基づいて行を
二つのグループに分割し、ウィンドウ集約の結果を表示します:
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
    BOOLXOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLXOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLXOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLXOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    0 |    1 |    1 |    0 |
|    2 |    0 |    1 |    1 |    0 |
|    3 |    0 |    1 |    0 |    0 |
|    4 |    0 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### エラーの例:
```sql
SELECT BOOL_XOR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_xor requires a boolean or numeric argument
```