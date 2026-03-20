---
{
  "title": "AI_MASK",
  "description": "指定されたラベルに関連するテキスト内の機密情報をマスクするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

指定されたラベルに関連するテキスト内の機密情報をマスクするために使用されます。

## Syntax

```sql
AI_MASK([<resource_name>], <text>, <labels>)
```
## パラメータ

|    Parameter      | デスクリプション                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `<resource_name>` | 指定されたリソース名                                      |
| `<text>`          | 機密情報が含まれる可能性のあるテキスト                  |
| `<labels>`        | マスクするラベルの配列、例：`ARRAY('name', 'phone', 'email')` |

## Return Value

機密情報がマスクされたテキストを返します。マスクされた部分は "[MASKED]" に置き換えられます。

いずれかの入力が NULL の場合、NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は変わる可能性があります。

## Examples

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_MASK('Wccccat is a 20-year-old Doris community contributor.', ['name', 'age']) AS Result;
```
```text
+-----------------------------------------------------+
| Result                                              |
+-----------------------------------------------------+
| [MASKED] is a [MASKED] Doris community contributor. |
+-----------------------------------------------------+
```
```sql
SELECT AI_MASK('resource_name', 'My email is rarity@example.com and my phone is 123-456-7890',
                ['email', 'phone_num']) AS RESULT;
```
```text
+-----------------------------------------------+
| RESULT                                        |
+-----------------------------------------------+
| My email is [MASKED] and my phone is [MASKED] |
+-----------------------------------------------+
```
