---
{
  "title": "AI_SUMMARIZE",
  "description": "テキストの簡潔な要約を生成するために使用されます。",
  "language": "ja"
}
---
## 説明

テキストの簡潔な要約を生成するために使用されます。

## 構文

```sql
AI_SUMMARIZE([<resource_name>], <text>)
```
## パラメータ

|    Parameter      | デスクリプション                |
| ----------------- | ------------------------- |
| `<resource_name>` | 指定されたリソース名|
| `<text>`          | 要約対象のテキスト  |

## Return Value

テキストの簡潔な要約を返します。

入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## Examples

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SUMMARIZE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.') AS Result;
```
```text
+-------------------------------------------------------------------+
| Result                                                            |
+-------------------------------------------------------------------+
| Apache Doris is a high-speed, MPP-based real-time data warehouse. |
+-------------------------------------------------------------------+
```
```sql
SELECT AI_SUMMARIZE('resourse_name','Doris supports high-concurrency, real-time analytics and is widely used in business intelligence scenarios.') AS Result;
```
```text
+------------------------------------------------------------------------------------------------+
| Result                                                                                         |
+------------------------------------------------------------------------------------------------+
| Doris is a high-concurrency, real-time analytics tool commonly used for business intelligence. |
+------------------------------------------------------------------------------------------------+
```
