---
{
  "title": "ARRAY_JOIN",
  "language": "ja",
  "description": "配列の要素を文字列に結合します。この関数は配列内のすべての要素を文字列に変換し、それらを次で連結します"
}
---
## array_join

<version since="2.0.0">

</version>

## 説明

配列の要素を文字列に結合します。この関数は配列内のすべての要素を文字列に変換し、指定された区切り文字で連結します。

## 構文

```sql
array_join(ARRAY<T> arr, STRING separator [, STRING null_replacement])
```
### パラメータ

- `arr`：ARRAY<T>型、結合する配列
- `separator`：STRING型、必須パラメータ、配列要素を区切るために使用するセパレータ
- `null_replacement`：STRING型、オプションパラメータ、配列内のnull値を置き換える文字列。このパラメータが提供されない場合、null値はスキップされます

**Tでサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日時型: DATE, DATETIME, DATEV2, DATETIMEV2
- 真偽値型: BOOLEAN
- IP型: IPV4, IPV6

### 戻り値

戻り値の型: STRING

戻り値の意味:
- セパレータで結合された配列のすべての要素を含む文字列を返します
- NULL: 入力配列がNULLの場合

使用上の注意:
- この関数は配列内の各要素を文字列に変換し、指定されたセパレータで結合します
- 配列要素内のnull値について:
  - `null_replacement`パラメータが提供される場合、null要素はその文字列で置き換えられます
  - `null_replacement`パラメータが提供されない場合、null要素はスキップされます
- 空の配列は空文字列を返します

**クエリ例:**

セパレータを使用して配列を結合:

```sql
SELECT array_join([1, 2, 3, 4, 5], ',');
+--------------------------------------+
| array_join([1, 2, 3, 4, 5], ',')    |
+--------------------------------------+
| 1,2,3,4,5                           |
+--------------------------------------+
```
文字列配列をスペース区切りで結合する:

```sql
SELECT array_join(['hello', 'world', 'doris'], ' ');
+--------------------------------------------------+
| array_join(['hello', 'world', 'doris'], ' ')    |
+--------------------------------------------------+
| hello world doris                                |
+--------------------------------------------------+
```
null値を含む配列を結合します（null値はスキップされます）：

```sql
SELECT array_join([1, null, 3, null, 5], '-');
+--------------------------------------------+
| array_join([1, null, 3, null, 5], '-')    |
+--------------------------------------------+
| 1-3-5                                      |
+--------------------------------------------+
```
null_replacement パラメータを使用して null 値を置換します：

```sql
SELECT array_join([1, null, 3, null, 5], '-', 'NULL');
+--------------------------------------------------+
| array_join([1, null, 3, null, 5], '-', 'NULL')  |
+--------------------------------------------------+
| 1-NULL-3-NULL-5                                 |
+--------------------------------------------------+
```
float配列を結合する:

```sql
SELECT array_join([1.1, 2.2, 3.3], ' | ');
+------------------------------------------+
| array_join([1.1, 2.2, 3.3], ' | ')      |
+------------------------------------------+
| 1.1 | 2.2 | 3.3                         |
+------------------------------------------+
```
日付配列を結合する:

```sql
SELECT array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ');
+-----------------------------------------------------------------------------------------+
| array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ') |
+-----------------------------------------------------------------------------------------+
| 2023-01-01 00:00:00 to 2023-06-15 00:00:00 to 2023-12-31 00:00:00                       |
+-----------------------------------------------------------------------------------------+
```
IP アドレス配列を結合:

```sql
SELECT array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ');
+----------------------------------------------------------------------------------+
| array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ') |
+----------------------------------------------------------------------------------+
| 192.168.1.1 -> 192.168.1.2 -> 192.168.1.3                                       |
+----------------------------------------------------------------------------------+
```
空の配列は空の文字列を返します：

```sql
SELECT array_join([], ',');
+----------------------+
| array_join([], ',')  |
+----------------------+
|                      |
+----------------------+
```
NULL配列はNULLを返します：

```sql
SELECT array_join(NULL, ',');
+----------------------+
| array_join(NULL, ',') |
+----------------------+
| NULL                 |
+----------------------+
```
複合型を渡す際のエラー:

```sql
SELECT array_join([{'name':'Alice','age':20}, {'name':'Bob','age':30}], '; ');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<MAP<TEXT,TEXT>> to target type=ARRAY<VARCHAR(65533)>
```
パラメータ数が間違っているエラー:

```sql
SELECT array_join([1,2,3], ',', 'extra', 'too_many');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_join' which has 4 arity. Candidate functions are: [array_join(Expression, Expression, Expression), array_join(Expression, Expression)]
```
非配列型を渡すときのエラー:

```sql
SELECT array_join('not_an_array', ',');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_join(VARCHAR(12), VARCHAR(1))
```
### キーワード

ARRAY、JOIN、ARRAY_JOIN
