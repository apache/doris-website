---
{
  "title": "AI_CLASSIFY",
  "description": "指定されたラベルのセットにテキストを分類するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

指定されたラベルセットにテキストを分類するために使用されます。

## Syntax

```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```
## パラメータ

|    Parameter      | デスクリプション                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、省略可能                     |
| `<text>`          | 分類対象のテキスト                             |
| `<labels>`        | 分類ラベルの配列                              |

## Return Value

テキストに最も適合する単一のラベルを返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## Examples

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['useage', 'introduce']) AS Result;
```
```text
+-----------+
| Result    |
+-----------+
| introduce |
+-----------+
```
```sql
SELECT AI_CLASSIFY('resource_name', 'Apache Doris is developing rapidly.', ['science', 'sport']) AS Result;
```
```text
+---------+
| Result  |
+---------+
| science |
+---------+
```
