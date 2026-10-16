---
{
    "title": "STRUCT | STRUCT 関数",
    "language": "ja",
    "description": "指定した値から STRUCT を作成して返します。一つ以上のパラメータを受け取り、すべての入力要素を含む STRUCT を返します。",
    "sidebar_label": "STRUCT"
}
---

# STRUCT

## 説明

指定した値から STRUCT を作成して返します。一つ以上のパラメータを受け取り、すべての入力要素を含む STRUCT を返します。

## 構文

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## パラメータ

- `<expr1>, <expr2>, ...`: STRUCT の作成に使用する入力値。一つ以上のパラメータを指定できます

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
- すべての入力要素を含む STRUCT を返します。フィールド名はデフォルトで col1、col2、col3、... の形式になります
- すべてのフィールドに NULL 値を指定できます

## 使い方

- この関数は、すべての入力要素を一つの STRUCT にまとめます
- 少なくとも一つのパラメータが必要です
- すべてのフィールドは NULL 許容として扱われます

## 例

**クエリ例:**

基本的な使い方: NULL フィールドを含む複数の型から STRUCT を作成する
```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
+--------------------------------------+--------------------------------------+----------------------------------------+
| struct(1, 'a', "abc")                | struct(null, 1, null)                | struct(cast('2023-03-16' as datetime)) |
+--------------------------------------+--------------------------------------+----------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}         |
+--------------------------------------+--------------------------------------+----------------------------------------+
```

複合型を含む STRUCT の作成:
```sql
select struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2));
+----------------------------------------------------------------------------------+
| struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2))          |
+----------------------------------------------------------------------------------+
| {"col1":[1, 2, 3], "col2":{"name":"Alice", "age":"20"}, "col3":{"f1":1, "f2":2}} |
+----------------------------------------------------------------------------------+
```

IP アドレスを含む STRUCT の作成:
```sql
select struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6));
+------------------------------------------------------------------+
| struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6)) |
+------------------------------------------------------------------+
| {"col1":"192.168.1.1", "col2":"2001:db8::1"}                     |
+------------------------------------------------------------------+
```

エラーの例

サポートされない型ではエラーになります:
JSON/VARIANT 型を含む STRUCT の作成
```sql 
select struct(v) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type

select struct(cast(1 as jsonb)) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type
```

空の STRUCT を作成するとエラーになります。Hive と同様に、少なくとも一つのパラメータが必要です:
```sql
select struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = struct requires at least one argument, like: struct(1)
```

