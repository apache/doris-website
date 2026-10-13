---
{
    "title": "NAMED_STRUCT",
    "language": "ja",
    "description": "指定したフィールド名と値から STRUCT を作成して返します。この関数は偶数個のパラメータを受け取ります。"
}
---

## 説明

指定したフィールド名と値から STRUCT を作成して返します。この関数は偶数個のパラメータを受け取り、奇数番目にフィールド名、偶数番目にフィールド値を指定します。

## 構文

```sql
NAMED_STRUCT( <field_name> , <field_value> [ , <field_name> , <field_value> ... ] )
```

## パラメータ

- `<field_name>`: 奇数番目に指定するフィールド名。定数文字列である必要があります
- `<field_value>`: 偶数番目に指定するフィールド値。列または定数を指定できます

**サポートされる要素の型:**
- 数値型: TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型: CHAR、VARCHAR、STRING
- 日付・時刻型: DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型: BOOLEAN
- IP 型: IPV4、IPV6
- 複合型: ARRAY、MAP、STRUCT

## 戻り値

戻り値の型: STRUCT<T>

戻り値の意味:
- 指定したすべてのフィールド名と値のペアを含む STRUCT を返します
- すべてのフィールドに NULL 値を指定できます

## 使い方

- この関数は、フィールド名と値のペアを一つの STRUCT にまとめます。奇数番目にはフィールド名を指定します（定数文字列で、重複は大文字と小文字を区別せず判定されます）。偶数番目にはフィールド値を指定します（列または定数）。
- パラメータの数は 1 より大きい、ゼロ以外の偶数である必要があります
- すべてのフィールドは NULL 許容として扱われます

**クエリ例:**

基本的な使い方:
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing');
+-------------------------------------------------------------+
| named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing') |
+-------------------------------------------------------------+
| {"name":"Alice", "age":25, "city":"Beijing"}                |
+-------------------------------------------------------------+
```

NULL 値を含む場合:
```sql
select named_struct('id', 1, 'name', null, 'score', 95.5);
+----------------------------------------------------+
| named_struct('id', 1, 'name', null, 'score', 95.5) |
+----------------------------------------------------+
| {"id":1, "name":null, "score":95.5}                |
+----------------------------------------------------+
```

複合型を含む場合:
```sql
select named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2));
+-----------------------------------------------------------------------------------------------+
| named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2)) |
+-----------------------------------------------------------------------------------------------+
| {"array":[1, 2, 3], "map":{"key":"value"}, "struct":{"f1":1, "f2":2}}                         |
+-----------------------------------------------------------------------------------------------+
```

IP アドレスを含む名前付き STRUCT の作成:
```sql
select named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6));
+----------------------------------------------------------------------------------------+
| named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6)) |
+----------------------------------------------------------------------------------------+
| {"ipv4":"192.168.1.1", "ipv6":"2001:db8::1"}                                           |
+----------------------------------------------------------------------------------------+
```

エラーの例

パラメータが 2 個未満の場合:
```sql
select named_Struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)

select named_struct('name');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)
```

パラメータの数が奇数の場合:
```sql
select named_struct('name', 'Alice', 'age');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct can't be odd parameters, need even parameters named_struct('name', 'Alice', 'age')
```

フィールド名が重複する場合（大文字と小文字は区別されません）:
```sql
select named_struct('name', 'Alice', 'name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name

select named_struct('name', 'Alice', 'Name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name
```
