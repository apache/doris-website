---
{
  "title": "AI_FILTER",
  "description": "指定された条件に基づいてテキストをフィルタリングします。",
  "language": "ja"
}
---
## 説明

指定された条件に基づいてテキストをフィルタリングします。

## 構文

```sql
AI_FILTER([<resource_name>], <text>)
```
## パラメータ

| Parameter         | デスクリプション                       |
|-------------------|-----------------------------------|
| `<resource_name>` | 指定されたリソース名、省略可能 |
| `<text>`          | 評価対象の情報   |

## Return Value

boolean値を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力が固定されない場合があります。

## Example

配送会社が受け取ったコメントを表す以下のTableがあるとします：

```sql
CREATE TABLE user_comments (
    id      INT,
    comment VARCHAR(500)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```
ポジティブなコメントをクエリしたい場合は、以下を使用できます：

```sql
SELECT id, comment FROM user_comments
WHERE AI_FILTER('resource_name', CONCAT('This is a positive comment: ', comment));
```
結果は次のようになります：

```text
+------+--------------------------------------------+
| id   | comment                                    |
+------+--------------------------------------------+
|    1 | Absolutely fantastic, highly recommend it. |
|    3 | This product is amazing and I love it.     |
+------+--------------------------------------------+
```
