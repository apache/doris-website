---
{
    "title": "ARRAY_JOIN",
    "language": "ja",
    "description": "配列の要素を文字列に変換し、指定した区切り文字で連結します。"
}
---

## array_join

<version since="2.0.0">

</version>

## 機能

配列の要素を文字列に連結します。各要素を文字列に変換してから、指定した区切り文字で連結します。

## 構文

```sql
array_join(ARRAY<T> arr, STRING separator [, STRING null_replacement])
```

### パラメータ

- `arr`：ARRAY<T> 型。連結する配列
- `separator`：STRING 型。必須パラメータ。配列の要素間に挿入する区切り文字
- `null_replacement`：STRING 型。省略可能なパラメータ。配列内の null 値を置き換える文字列。このパラメータを指定しない場合、null 値はスキップされます

**T に使用できる型:**
- 数値型: TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型: CHAR、VARCHAR、STRING
- 日付・時刻型: DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型: BOOLEAN
- IP 型: IPV4、IPV6
- UUID: UUID。要素は標準形式のテキストに変換されます。

### 戻り値

戻り値の型: STRING

戻り値:
- 配列の要素を区切り文字で連結した文字列を返します。
- 入力配列が NULL の場合は NULL を返します。

使用上の注意:
- 配列の各要素を文字列に変換し、指定した区切り文字で連結します。
- 配列内の NULL 要素については、次のように処理します。
  - `null_replacement` を指定した場合は、その文字列に置き換えます。
  - `null_replacement` を省略した場合は、スキップします。
- 空の配列の場合は空文字列を返します。

**クエリ例:**

区切り文字を指定して配列を連結する例:
```sql
SELECT array_join([1, 2, 3, 4, 5], ',');
+--------------------------------------+
| array_join([1, 2, 3, 4, 5], ',')    |
+--------------------------------------+
| 1,2,3,4,5                           |
+--------------------------------------+
```

空白を区切り文字として文字列の配列を連結する例:
```sql
SELECT array_join(['hello', 'world', 'doris'], ' ');
+--------------------------------------------------+
| array_join(['hello', 'world', 'doris'], ' ')    |
+--------------------------------------------------+
| hello world doris                                |
+--------------------------------------------------+
```

NULL 要素を含む配列を連結する例 (NULL 要素はスキップされます):
```sql
SELECT array_join([1, null, 3, null, 5], '-');
+--------------------------------------------+
| array_join([1, null, 3, null, 5], '-')    |
+--------------------------------------------+
| 1-3-5                                      |
+--------------------------------------------+
```

null_replacement パラメータで NULL 要素を置き換える例:
```sql
SELECT array_join([1, null, 3, null, 5], '-', 'NULL');
+--------------------------------------------------+
| array_join([1, null, 3, null, 5], '-', 'NULL')  |
+--------------------------------------------------+
| 1-NULL-3-NULL-5                                 |
+--------------------------------------------------+
```

浮動小数点数の配列を連結する例:
```sql
SELECT array_join([1.1, 2.2, 3.3], ' | ');
+------------------------------------------+
| array_join([1.1, 2.2, 3.3], ' | ')      |
+------------------------------------------+
| 1.1 | 2.2 | 3.3                         |
+------------------------------------------+
```

日付の配列を連結する例:
```sql
SELECT array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ');
+-----------------------------------------------------------------------------------------+
| array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ') |
+-----------------------------------------------------------------------------------------+
| 2023-01-01 00:00:00 to 2023-06-15 00:00:00 to 2023-12-31 00:00:00                       |
+-----------------------------------------------------------------------------------------+
```

IP アドレスの配列を連結する例:
```sql
SELECT array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ');
+----------------------------------------------------------------------------------+
| array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ') |
+----------------------------------------------------------------------------------+
| 192.168.1.1 -> 192.168.1.2 -> 192.168.1.3                                       |
+----------------------------------------------------------------------------------+
```

空の配列では空文字列を返す例:
```sql
SELECT array_join([], ',');
+----------------------+
| array_join([], ',')  |
+----------------------+
|                      |
+----------------------+
```

入力配列が NULL の場合に NULL を返す例:
```sql
SELECT array_join(NULL, ',');
+----------------------+
| array_join(NULL, ',') |
+----------------------+
| NULL                 |
+----------------------+
```

複合型を渡した場合のエラー:
```sql
SELECT array_join([{'name':'Alice','age':20}, {'name':'Bob','age':30}], '; ');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<MAP<TEXT,TEXT>> to target type=ARRAY<VARCHAR(65533)>
```

引数の数が正しくない場合のエラー:
```sql
SELECT array_join([1,2,3], ',', 'extra', 'too_many');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_join' which has 4 arity. Candidate functions are: [array_join(Expression, Expression, Expression), array_join(Expression, Expression)]
```

配列以外の型を渡した場合のエラー:
```sql
SELECT array_join('not_an_array', ',');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_join(VARCHAR(12), VARCHAR(1))
```

### キーワード

ARRAY, JOIN, ARRAY_JOIN
