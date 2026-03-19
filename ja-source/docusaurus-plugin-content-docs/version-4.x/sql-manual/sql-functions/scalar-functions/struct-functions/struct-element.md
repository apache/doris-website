---
{
  "title": "STRUCT_ELEMENT",
  "description": "struct データカラム内の特定のフィールドを返します。この関数は、フィールドの位置（インデックス）またはフィールド名を通じて struct 内のフィールドにアクセスすることをサポートします。",
  "language": "ja"
}
---
## 説明

構造体データ列内の特定のフィールドを返します。この関数は、フィールド位置（インデックス）またはフィールド名を通じて構造体内のフィールドにアクセスすることをサポートします。

## 構文

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```
## パラメータ

- `<struct>`: 入力する構造体カラム
- `<field_location_or_name>`: フィールド位置（1から開始）またはフィールド名、定数のみサポート

## Return Value

戻り値の型: 構造体でサポートされるフィールド値の型

戻り値の意味:
- 指定されたフィールド値を返す
- 入力構造体がnullの場合、nullを返す
- 指定されたフィールドが存在しない場合、エラーが報告される

## Usage

- フィールド位置（インデックス）によるアクセスをサポート、インデックスは1から開始
- フィールド名によるアクセスをサポート、フィールド名は正確に一致する必要がある
- 2番目のパラメータは定数である必要がある（カラムは使用不可）
- この関数はAlwaysNullableとしてマークされており、戻り値はnullになる可能性がある

## Examples

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
複雑な型を含む構造体へのアクセス：

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
Input構造体がNULLの場合、エラーを報告します：

```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
