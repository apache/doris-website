---
{
    "title": "BITMAP_EMPTY",
    "language": "ru",
    "description": "Создаёт пустой BITMAP. В основном используется для подстановки значений по умолчанию при вставке или загрузке через Stream Load. Например:"
}
---

## Описание {#description}

Создаёт пустой BITMAP. В основном используется для подстановки значений по умолчанию при вставке или загрузке через Stream Load. Например:

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```

## Синтаксис {#syntax}

```sql
BITMAP_EMPTY()
```

## Возвращаемое значение {#return-value}

Возвращает пустой массив без элементов

## Примеры {#examples}

```sql
select bitmap_to_string(bitmap_empty());
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_count(bitmap_empty());
```

```text
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
