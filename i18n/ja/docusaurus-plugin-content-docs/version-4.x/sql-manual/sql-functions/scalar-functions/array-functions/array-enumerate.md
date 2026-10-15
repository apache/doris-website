---
{
    "title": "ARRAY_ENUMERATE",
    "language": "ja",
    "description": "配列の各要素について、1 から始まる位置インデックスを返します。"
}
---

## array_enumerate

<version since="2.0.0">

</version>

## 説明

配列の各要素について、1 から始まる位置インデックスを返します。この関数は、配列の各要素に対応する位置番号を生成します。

## 構文

```sql
array_enumerate(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。位置インデックスを生成する対象の配列です。列名または定数値を指定できます。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- 複合型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：ARRAY<BIGINT>

戻り値の意味：
- 入力配列と同じ長さの新しい配列を返します。各位置には、対応する要素の位置インデックス（1 から開始）が入ります
- NULL：入力配列が NULL の場合

使用上の注意：
- 配列の各要素に対して、1 から順に増加する位置インデックスを生成します
- 空の配列は空の配列を返し、NULL の配列は NULL を返します
- 配列内の要素が null の場合も、その要素に対応する位置インデックスを生成します

### 使用例

**クエリ例：**

配列の位置インデックスを生成する場合：
```sql
SELECT array_enumerate([1, 2, 1, 4, 5]);
+----------------------------------+
| array_enumerate([1, 2, 1, 4, 5]) |
+----------------------------------+
| [1, 2, 3, 4, 5]                  |
+----------------------------------+
```

空の配列は空の配列を返します：
```sql
SELECT array_enumerate([]);
+----------------------+
| array_enumerate([])  |
+----------------------+
| []                   |
+----------------------+
```

null 値を含む配列でも、null 要素の位置インデックスを生成します：
```sql
SELECT array_enumerate([1, null, 3, null, 5]);
+--------------------------------------------+
| array_enumerate([1, null, 3, null, 5])     |
+--------------------------------------------+
| [1, 2, 3, 4, 5]                            |
+--------------------------------------------+
```

複合型の例：

ネストした配列型：
```sql
SELECT array_enumerate([[1,2],[3,4],[5,6]]);
+----------------------------------------+
| array_enumerate([[1,2],[3,4],[5,6]])   |
+----------------------------------------+
| [1, 2, 3]                              |
+----------------------------------------+
```

MAP 型：
```sql
SELECT array_enumerate([{'k':1},{'k':2},{'k':3}]);
+----------------------------------------------+
| array_enumerate([{'k':1},{'k':2},{'k':3}])   |
+----------------------------------------------+
| [1, 2, 3]                                    |
+----------------------------------------------+
```

STRUCT 型：
```sql
SELECT array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
+----------------------------------------------------------------------------------------+
| array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30))) |
+----------------------------------------------------------------------------------------+
| [1, 2]                                                                                  |
+----------------------------------------------------------------------------------------+
```

引数の数が正しくない場合のエラー：
```sql
SELECT array_enumerate([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate' which has 2 arity. Candidate functions are: [array_enumerate(Expression)]
```

配列型以外を渡した場合のエラー：
```sql
SELECT array_enumerate('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate(VARCHAR(12))
```

### キーワード

ARRAY, ENUMERATE, ARRAY_ENUMERATE
