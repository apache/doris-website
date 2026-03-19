---
{
  "title": "AI_EXTRACT",
  "description": "特定のラベルに対応する情報をテキストから抽出するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

テキストから特定のラベルに対応する情報を抽出するために使用されます。

## Syntax

```sql
AI_EXTRACT([<resource_name>], <text>, <labels>)
```
## パラメータ

|    Parameter      | デスクリプション                                  |
| ----------------- | -------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、オプション                        |
| `<text>`          | 情報を抽出するテキスト                             |
| `<labels>`        | 抽出するラベルの配列                              |

## 戻り値

抽出されたすべてのラベルとそれに対応する値を含む文字列を返します。

入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する場合があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_EXTRACT('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.', 
                  ['product_name', 'architecture', 'key_feature']) AS Result;
```
```text
+---------------------------------------------------------------------------------------+
| Result                                                                                |
+---------------------------------------------------------------------------------------+
| product_name="Apache Doris", architecture="MPP-based", key_feature="high query speed" |
+---------------------------------------------------------------------------------------+
```
```sql
SELECT AI_EXTRACT('resource_name', 'Apache Doris began in 2008 as an internal project named Palo.',
                  ['original name', 'founding time']) AS Result;
```
```text
+----------------------------------------+
| Result                                 |
+----------------------------------------+
| original name=Palo, founding time=2008 |
+----------------------------------------+
```
