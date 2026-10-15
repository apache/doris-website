---
{
    "title": "STRUCT_ELEMENT",
    "language": "ja",
    "description": "STRUCT 型の列から指定したフィールドを返します。フィールド位置（インデックス）またはフィールド名でアクセスできます。"
}
---

:::caution
この関数は他のデータベースやクエリエンジンにないため、`STRUCT_ELEMENT` はバージョン 4.1.3 以降で削除されました。代わりに [`ELEMENT_AT`](../variant-functions/element-at.md) 関数、または同等の添字構文 `s[k]` / `s['field_name']` やドット構文 `s.field_name` を使用してください。
:::

## 説明

STRUCT 型の列から指定したフィールドを返します。フィールド位置（インデックス）またはフィールド名でアクセスできます。

## 構文

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```

## パラメータ

- `<struct>`: 入力する STRUCT 型の列
- `<field_location_or_name>`: フィールド位置（1 から開始）またはフィールド名。定数のみをサポートします

## 戻り値

戻り値の型: STRUCT がサポートするフィールド値の型

戻り値の意味:
- 指定したフィールドの値を返します
- 入力の STRUCT が null の場合は null を返します
- 指定したフィールドが存在しない場合はエラーになります

## 使い方

- フィールド位置（インデックス）でアクセスできます。インデックスは 1 から始まります
- フィールド名でアクセスできます。名前の比較では**大文字と小文字を区別しません**
- 二番目のパラメータは定数である必要があります（列は指定できません）
- この関数は AlwaysNullable として扱われ、戻り値が null になる場合があります
- バージョン 4.1.3 以降、`STRUCT_ELEMENT` は削除されています。代わりに `ELEMENT_AT(<struct>, ...)`、添字演算子 `<struct>[<index>]` / `<struct>['<field_name>']`、またはドット演算子 `<struct_col>.<field_name>` を使用してください。いずれも STRUCT のフィールドにアクセスする同等の方法です。

## 例

**クエリ例:**

位置によるアクセス:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1);
+--------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1) |
+--------------------------------------------------------------------------------+
| Alice                                                                          |
+--------------------------------------------------------------------------------+
```

フィールド名によるアクセス:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age');
+------------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age') |
+------------------------------------------------------------------------------------+
|                                                                                 25 |
+------------------------------------------------------------------------------------+
```

添字演算子によるアクセス（上記の呼び出しと同等）:
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')[1] as by_index,
       named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')['age'] as by_name;
+----------+---------+
| by_index | by_name |
+----------+---------+
| Alice    |      25 |
+----------+---------+
```

複合型を含む STRUCT へのアクセス:
```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```

null のフィールド値へのアクセス:
```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```

エラーの例

存在しないフィールド名へのアクセス:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```

範囲外のインデックスへのアクセス:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```

二番目のパラメータが定数でない場合:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = element_at over a struct only allows a constant int or string second parameter: element_at(named_struct('name', 'Alice', 'age', 25), inv)
```

入力の STRUCT が NULL の場合はエラーになります:
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
