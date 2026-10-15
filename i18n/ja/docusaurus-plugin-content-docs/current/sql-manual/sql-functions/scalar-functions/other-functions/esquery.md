---
{
    "title": "ESQUERY",
    "language": "ja",
    "description": "ESQUERY(<field>, <querydsl>) 関数を使用すると、SQL では表現できない検索条件を Elasticsearch にプッシュダウンして絞り込めます。"
}
---

## 説明

`ESQUERY(<field>, <query_dsl>)` 関数を使用すると、SQL では表現できない検索条件を Elasticsearch にプッシュダウンして絞り込めます。最初のパラメータ `<field>` はインデックスの関連付けに使用します。二番目の `<query_dsl>` は基本的な Elasticsearch Query DSL を表す JSON 式です。JSON は波括弧 `{}` で囲み、ルートキーを一つだけ含める必要があります（例: `match_phrase`、`geo_shape`、`bool`）。

## 構文

```sql
ESQUERY(<field>, <query_dsl>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<field>` | 検索対象のフィールド。インデックスの関連付けに使用します。 |
| `<query_dsl>` | Elasticsearch Query DSL を表す JSON 式です。`{}` で囲み、ルートキーを一つだけ含める必要があります（例: `match_phrase`、`geo_shape`、`bool`）。 |

## 戻り値

ドキュメントが指定した Elasticsearch Query DSL に一致するかを示す真偽値を返します。

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