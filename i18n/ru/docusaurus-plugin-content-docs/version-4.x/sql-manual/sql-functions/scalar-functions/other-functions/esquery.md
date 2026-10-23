---
{
    "title": "ESQUERY",
    "language": "ru",
    "description": "Используйте функцию ESQUERY(<field>, <querydsl>), чтобы передавать в Elasticsearch для фильтрации запросы, которые нельзя выразить на SQL."
}
---

## Описание {#description}

Используйте функцию `ESQUERY(<field>, <query_dsl>)`, чтобы передавать в Elasticsearch для фильтрации запросы, которые нельзя выразить на SQL. Первый параметр, `<field>`, используется для связывания индексов, а второй параметр, `<query_dsl>`, представляет собой JSON-выражение базового Elasticsearch Query DSL. JSON должен быть заключён в фигурные скобки `{}` и содержать ровно один корневой ключ (например, `match_phrase`, `geo_shape`, `bool`).

## Синтаксис {#syntax}

```sql
ESQUERY(<field>, <query_dsl>)
```

## Параметры {#parameters}

| Параметр   | Описание                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `<field>`    | Поле, по которому выполняется запрос; используется для связывания индексов.                                         |
| `<query_dsl>` | JSON-выражение, представляющее Elasticsearch Query DSL. Оно должно быть заключено в `{}` и содержать ровно один корневой ключ (например, `match_phrase`, `geo_shape`, `bool`). |

## Возвращаемое значение {#return-value}

Возвращает булево значение, указывающее, соответствует ли документ заданному запросу на языке Elasticsearch Query DSL.

## Примеры {#examples}

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
