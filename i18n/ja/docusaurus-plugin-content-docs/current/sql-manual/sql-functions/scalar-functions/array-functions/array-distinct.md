---
{
    "title": "ARRAY_DISTINCT",
    "language": "ja",
    "description": "配列から重複する要素を取り除き、一意な要素からなる新しい配列を返します。要素の元の順序を維持します。"
}
---

## array_distinct

<version since="2.0.0">

</version>

## 説明

配列から重複する要素を取り除き、一意な要素からなる新しい配列を返します。要素の元の順序を維持し、各要素の最初の出現だけを残します。

## 構文

```sql
array_distinct(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY\<T> 型。重複を除去する配列です。列名または定数値を指定できます。

**T に指定できる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 真偽値型: BOOLEAN
- IP 型: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 戻り値

戻り値の型: ARRAY\<T>

戻り値の意味:
- 元の配列の一意な要素をすべて含む、重複除去後の配列
- 要素の元の順序を維持します
- NULL: 入力配列が NULL の場合

使用上の注意:
- 配列を左から右へ走査し、各要素の最初の出現を残して、それ以降の重複要素を取り除きます
- 空配列を入力すると空配列を返し、NULL 配列を入力すると NULL を返します
- 重複除去では元の配列における要素の相対的な順序を維持し、並べ替えは行いません
- 配列内の null 要素も重複除去の対象となり、複数ある場合は一つだけ残ります

### 使用例

**クエリ例:**

整数配列の重複除去: 元の配列 [1, 2, 3, 4, 5] には重複要素がないため、結果は元の配列と同じです。
```sql
SELECT array_distinct([1, 2, 3, 4, 5]);
+---------------------------------+
| array_distinct([1, 2, 3, 4, 5]) |
+---------------------------------+
| [1, 2, 3, 4, 5]                 |
+---------------------------------+
```

文字列配列の重複除去: 重複する文字列要素を取り除きます。元の配列 ['a', 'b', 'a', 'c', 'b', 'd'] では 'a' と 'b' がそれぞれ二度出現します。各要素の最初の出現を残すため、結果は ["a", "b", "c", "d"] になります。
```sql
SELECT array_distinct(['a', 'b', 'a', 'c', 'b', 'd']);
+------------------------------------------------+
| array_distinct(['a', 'b', 'a', 'c', 'b', 'd']) |
+------------------------------------------------+
| ["a", "b", "c", "d"]                           |
+------------------------------------------------+
```

null 値を含む配列: null 要素も重複除去の対象となり、複数ある場合は一つだけ残ります。元の配列 [1, null, 2, null, 3, null] では null が三度出現しますが、最初の null だけが残るため、結果は [1, null, 2, 3] になります。
```sql
SELECT array_distinct([1, null, 2, null, 3, null]);
+---------------------------------------------+
| array_distinct([1, null, 2, null, 3, null]) |
+---------------------------------------------+
| [1, null, 2, 3]                             |
+---------------------------------------------+
```

IP 型配列の重複除去: IPv4 アドレスの配列から重複を取り除きます。元の配列 ['192.168.1.1', '192.168.1.2', '192.168.1.1'] では '192.168.1.1' が二度出現しますが、最初の出現だけが残るため、結果は [192.168.1.1, 192.168.1.2] になります。
```sql
SELECT array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2"]                                                     |
+------------------------------------------------------------------------------------+
```

IPv6 型配列の重複除去: IPv6 アドレスの配列から重複を取り除きます。元の配列 ['2001:db8::1', '2001:db8::2', '2001:db8::1'] では '2001:db8::1' が二度出現しますが、最初の出現だけが残るため、結果は [2001:db8::1, 2001:db8::2] になります。
```sql
SELECT array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------+
| ["2001:db8::1", "2001:db8::2"]                                                     |
+------------------------------------------------------------------------------------+
```

空配列を入力すると空配列を返します。空配列には重複除去の対象となる要素がありません。
```sql
SELECT array_distinct([]);
+--------------------+
| array_distinct([]) |
+--------------------+
| []                 |
+--------------------+
```

NULL 配列を入力すると、エラーを発生させずに NULL を返します。
```sql
SELECT array_distinct(NULL);
+----------------------+
| array_distinct(NULL) |
+----------------------+
| NULL                 |
+----------------------+
```

要素が一つだけの配列は、重複要素がないため、元の配列をそのまま返します。
```sql
SELECT array_distinct([42]);
+----------------------+
| array_distinct([42]) |
+----------------------+
| [42]                 |
+----------------------+
```

複合型はサポートされません:

ネストした配列型はサポートされず、エラーが発生します。
```sql
SELECT array_distinct([[1,2,3], [4,5,6], [1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Array(Nullable(TINYINT)))))
```

Map 型はサポートされず、エラーが発生します。
```sql
SELECT array_distinct([{'a':1}, {'b':2}, {'a':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Map(Nullable(String), Nullable(TINYINT)))))
```

Struct 型はサポートされず、エラーが発生します。
```sql
SELECT array_distinct(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Alice','age',20)));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Struct(name:Nullable(String), age:Nullable(TINYINT)))))
```

引数の数が正しくない場合はエラーになります。array_distinct 関数は配列引数を一つだけ受け取るため、複数の引数を渡すとエラーが発生します。
```sql
SELECT array_distinct([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_distinct' which has 2 arity. Candidate functions are: [array_distinct(Expression)]
```

配列以外の型を渡すとエラーになります。array_distinct 関数は配列型の引数だけを受け取るため、文字列などを渡すとエラーが発生します。
```sql
SELECT array_distinct('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_distinct(VARCHAR(12))
```

### キーワード

ARRAY, DISTINCT, ARRAY_DISTINCT
