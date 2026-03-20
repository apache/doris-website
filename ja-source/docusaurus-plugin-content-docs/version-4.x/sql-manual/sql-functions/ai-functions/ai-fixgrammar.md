---
{
  "title": "AI_FIXGRAMMAR",
  "description": "テキスト内の文法エラーを修正するために使用されます。",
  "language": "ja"
}
---
## 説明

テキストの文法エラーを修正するために使用されます。

## 構文

```sql
AI_FIXGRAMMAR([<resource_name>], <text>)
```
## パラメータ

|    Parameter      | デスクリプション                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、省略可能       |
| `<text>`          | 文法修正を行うテキスト            |

## Return Value

文法修正後のテキスト文字列を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## Examples

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_FIXGRAMMAR('Apache Doris a great system DB') AS Result;
```
```text
+------------------------------------------+
| Result                                   |
+------------------------------------------+
| Apache Doris is a great database system. |
+------------------------------------------+
```
```sql
SELECT AI_FIXGRAMMAR('resource_name', 'I am like to using Doris') AS Result;
```
```text
+--------------------+
| Result             |
+--------------------+
| I like using Doris |
+--------------------+
```
