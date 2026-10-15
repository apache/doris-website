---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "ja",
    "description": "配列の先頭に要素を追加します。追加した要素と元の配列のすべての要素を含む新しい配列を返します。"
}
---

## array_pushfront

<version since="2.0.0">

</version>

## 説明

配列の先頭に要素を追加します。追加した要素と元の配列のすべての要素を含む新しい配列を返します。

## 構文

```sql
array_pushfront(ARRAY<T> arr, T element)
```

### パラメータ

- `arr`：ARRAY<T> 型。要素を追加する配列
- `element`：T 型。配列の先頭に追加する要素

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- 複合型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：ARRAY<T>

戻り値の意味：
- 追加した要素と元の配列のすべての要素を含む新しい配列を返します
- 入力配列が NULL の場合は NULL を返します

使用上の注意：
- 指定した要素を配列の先頭に追加します
- 空の配列にも要素を追加できます。新しい要素の型は配列の要素型と互換性がある必要があります
- 配列内の NULL 要素も通常どおり処理されます

**クエリ例：**

文字列配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront(['banana', 'cherry', 'date'], 'apple');
+--------------------------------------------------------+
| array_pushfront(['banana', 'cherry', 'date'], 'apple') |
+--------------------------------------------------------+
| ["apple", "banana", "cherry", "date"]                  |
+--------------------------------------------------------+
```

NULL 値を含む配列の先頭に NULL 要素を追加する例：
```sql
SELECT array_pushfront([1, null, 3], null);
+-------------------------------------+
| array_pushfront([1, null, 3], null) |
+-------------------------------------+
| [null, 1, null, 3]                  |
+-------------------------------------+
```

空の配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront([], 42);
+--------------------------+
| array_pushfront([], 42)  |
+--------------------------+
| [42]                     |
+--------------------------+
```

配列が NULL の場合は NULL を返します：
```sql
SELECT array_pushfront(NULL, 1);
+---------------------------+
| array_pushfront(NULL, 1)  |
+---------------------------+
| NULL                      |
+---------------------------+
```

浮動小数点数の配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront([2.2, 3.3, 4.4], 1.1);
+------------------------------------------+
| array_pushfront([2.2, 3.3, 4.4], 1.1)   |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```

IP アドレスの配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```

ネストした配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront([[3,4], [5,6]], [1,2]);
+------------------------------------------+
| array_pushfront([[3,4], [5,6]], [1,2])  |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```

MAP 型の要素を持つ配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront([{'b':2}, {'c':3}], {'a':1});
+----------------------------------------------+
| array_pushfront([{'b':2}, {'c':3}], {'a':1}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```

STRUCT 型の要素を持つ配列の先頭に要素を追加する例：
```sql
SELECT array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

引数の数が正しくない場合のエラー：
```sql
SELECT array_pushfront([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushfront' which has 1 arity. Candidate functions are: [array_pushfront(Expression, Expression)]
```

配列以外の型を渡した場合のエラー：
```sql
SELECT array_pushfront('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushfront(VARCHAR(12), TINYINT)
```

### キーワード

ARRAY, PUSHFRONT, ARRAY_PUSHFRONT
