---
{
  "title": "ESQUERY",
  "description": "ESQUERY(<field>, <querydsl>) 関数を使用して、SQLで表現できないクエリをElasticsearchにプッシュダウンしてフィルタリングを行います。",
  "language": "ja"
}
---
## 説明

SQL では表現できないクエリを Elasticsearch にプッシュダウンしてフィルタリングを行うには、`ESQUERY(<field>, <query_dsl>)` 関数を使用します。最初のパラメータ `<field>` はインデックスの関連付けに使用され、2番目のパラメータ `<query_dsl>` は基本的な Elasticsearch Query DSL を表現する JSON 式です。JSON は波括弧 `{}` で囲む必要があり、ちょうど1つのルートキー（例：`match_phrase`、`geo_shape`、`bool`）を含む必要があります。

## 構文

```sql
ESQUERY(<field>, <query_dsl>)
```
## パラメータ

| Parameter   | デスクリプション                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `<field>`    | クエリ対象のフィールド。インデックスの関連付けに使用されます。                                         |
| `<query_dsl>` | Elasticsearch Query DSLを表すJSON式。`{}`で囲まれ、正確に1つのルートキー（例：`match_phrase`、`geo_shape`、`bool`）を含む必要があります。 |

## Return Value

提供されたElasticsearch query DSLにドキュメントが一致するかどうかを示すboolean値を返します。

## Examples

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
