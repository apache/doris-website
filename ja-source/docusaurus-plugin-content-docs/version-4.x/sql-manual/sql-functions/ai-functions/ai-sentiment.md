---
{
  "title": "AI_SENTIMENT",
  "description": "テキストの感情を分析するために使用されます。",
  "language": "ja"
}
---
## 説明

テキストの感情分析を行うために使用されます。

## 構文

```sql
AI_SENTIMENT([<resource_name>], <text>)
```
## パラメータ

|    Parameter      | デスクリプション                |
| ----------------- | ------------------------- |
| `<resource_name>` | 指定されたリソース名|
| `<text>`          | センチメント分析を行うテキスト |

## Return Value

センチメント分析結果を返します。可能な値は以下の通りです：
- positive
- negative
- neutral
- mixed

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力が変動する場合があります。

## Examples

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DB system.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| positive |
+----------+
```
```sql
SELECT AI_SENTIMENT('resource_name', 'I hate sunny days.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| negative |
+----------+
```
