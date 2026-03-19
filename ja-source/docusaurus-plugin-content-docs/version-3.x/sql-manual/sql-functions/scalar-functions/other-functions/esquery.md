---
{
  "title": "ESQUERY",
  "description": "ESQUERY(<field>, <querydsl>) 関数を使用して、SQLで表現できないクエリをElasticsearchにプッシュダウンしてフィルタリングを行います。",
  "language": "ja"
}
---
## 概要

SQLでは表現できないクエリをElasticsearchにプッシュダウンしてフィルタリングするには、`ESQUERY(<field>, <query_dsl>)`関数を使用します。最初のパラメータ`<field>`はインデックスの関連付けに使用され、2番目のパラメータ`<query_dsl>`は基本的なElasticsearch Query DSLを表すJSON式です。JSONは波括弧`{}`で囲む必要があり、ルートキーを1つだけ含む必要があります（例：`match_phrase`、`geo_shape`、`bool`）。

## 構文

```sql
ESQUERY(<field>, <query_dsl>)
```
## パラメータ

| パラメータ   | 説明                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `<field>`    | クエリ対象のフィールド。インデックスの関連付けに使用されます。                                         |
| `<query_dsl>` | Elasticsearch Query DSLを表すJSON式。`{}`で囲む必要があり、厳密に1つのルートキー（例：`match_phrase`、`geo_shape`、`bool`）を含む必要があります。 |

## 戻り値

ドキュメントが提供されたElasticsearch query DSLにマッチするかどうかを示すboolean値を返します。

## 例

```sql
-- match_phrase SQL:
SELECT * FROM es_table 
WHERE ESQUERY(k4, '{
    "match_phrase": {
       "k4": "doris on es"
    }
}');
```
```sql
-- geo_shape SQL:
SELECT * FROM es_table 
WHERE ESQUERY(k4, '{
  "geo_shape": {
     "location": {
        "shape": {
           "type": "envelope",
           "coordinates": [
              [13, 53],
              [14, 52]
           ]
        },
        "relation": "within"
     }
  }
}');
```
