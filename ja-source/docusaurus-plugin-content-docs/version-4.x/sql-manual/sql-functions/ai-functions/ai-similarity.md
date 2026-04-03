---
{
  "title": "AI_SIMILARITY",
  "description": "2つのテキスト間のセマンティックな類似度を判定します。",
  "language": "ja"
}
---
## 説明

2つのテキスト間の意味的類似性を判定します。

## 構文

```sql
AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```
## パラメータ

| Parameter         | デスクリプション                |
|-------------------|---------------------------|
| `<resource_name>` | 指定されたリソース名 |
| `<text_1>`        | テキスト                      |
| `<text_2>`        | テキスト                      |

## Return Value

0から10までの浮動小数点数を返します。0は類似性なし、10は強い類似性を意味します。

入力がNULLの場合、NULLを返します。

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
顧客センチメントによってコメントをランク付けしたい場合は、以下を使用できます：

```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```
クエリの結果は次のようになります：

```text
+-------------------------------------------------+-------+
| comment                                         | score |
+-------------------------------------------------+-------+
| It arrived broken and I am really disappointed. |   7.5 |
| Delivery was very slow and frustrating.         |   6.5 |
| Not bad, but the packaging could be better.     |   3.5 |
| It is fine, nothing special to mention.         |     3 |
| Absolutely fantastic, highly recommend it.      |     1 |
+-------------------------------------------------+-------+
```
