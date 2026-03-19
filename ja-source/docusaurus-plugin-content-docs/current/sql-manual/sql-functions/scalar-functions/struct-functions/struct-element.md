---
{
  "title": "STRUCT_ELEMENT",
  "language": "ja",
  "description": "struct データカラム内の特定のフィールドを返します。この関数は、フィールド位置（インデックス）またはフィールド名を通じてstruct内のフィールドにアクセスすることをサポートします。"
}
---
## 説明

構造体データ列内の特定のフィールドを返します。この関数は、フィールド位置（インデックス）またはフィールド名を通じて構造体内のフィールドにアクセスすることをサポートします。

## 構文

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```
## パラメータ

- `<struct>`: 入力struct列
- `<field_location_or_name>`: フィールド位置（1から開始）またはフィールド名、定数のみサポート

## 戻り値

戻り値の型: structでサポートされるフィールド値の型

戻り値の意味:
- 指定されたフィールド値を返します
- 入力structがnullの場合、nullを返します
- 指定されたフィールドが存在しない場合、エラーが報告されます

## 使用方法

- フィールド位置（インデックス）によるアクセスをサポート、インデックスは1から開始
- フィールド名によるアクセスをサポート、フィールド名は正確に一致する必要があります
- 2番目のパラメータは定数である必要があります（列は使用できません）
- 関数はAlwaysNullableとしてマークされており、戻り値がnullになる可能性があります

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
複合型を含む構造体へのアクセス:

```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```
null フィールド値での結果へのアクセス:

```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```
エラー例

存在しないフィールド名へのアクセス:

```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```
境界外インデックスへのアクセス:

```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```
2番目のパラメータは定数ではありません：

```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct_element only allows constant int or string second parameter: struct_element(named_struct('name', 'Alice', 'age', 25), inv)
```
Input構造体がNULLです。エラーを報告します：

```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
