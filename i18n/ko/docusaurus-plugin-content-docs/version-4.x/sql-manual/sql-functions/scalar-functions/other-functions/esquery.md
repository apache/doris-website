---
{
    "title": "ESQUERY",
    "language": "ko",
    "description": "ESQUERY(<field>, <querydsl>) 함수를 사용하여 SQL로 표현할 수 없는 쿼리를 Elasticsearch로 푸시다운해 필터링합니다."
}
---

## 설명 {#description}

`ESQUERY(<field>, <query_dsl>)` 함수를 사용하여 SQL로 표현할 수 없는 쿼리를 Elasticsearch로 푸시다운해 필터링합니다. 첫 번째 매개변수인 `<field>`는 인덱스를 연결하는 데 사용되며, 두 번째 매개변수인 `<query_dsl>`은 기본 Elasticsearch Query DSL을 나타내는 JSON 표현식입니다. JSON은 중괄호 `{}`로 감싸야 하며, 루트 키를 정확히 하나만 포함해야 합니다(예: `match_phrase`, `geo_shape`, `bool`).

## 구문 {#syntax}

```sql
ESQUERY(<field>, <query_dsl>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `<field>`    | 쿼리할 필드로, 인덱스를 연결하는 데 사용됩니다.                                         |
| `<query_dsl>` | Elasticsearch Query DSL을 나타내는 JSON 표현식입니다. 반드시 `{}`로 감싸야 하며, 루트 키를 정확히 하나만 포함해야 합니다(예: `match_phrase`, `geo_shape`, `bool`). |

## 반환 값 {#return-value}

문서가 주어진 Elasticsearch 쿼리 DSL과 일치하는지 여부를 나타내는 불리언 값을 반환합니다.

## 예제 {#examples}

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
