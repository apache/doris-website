---
{
    "title": "CURRENT_CATALOG",
    "language": "ru",
    "description": "Возвращает Catalog текущего соединения SQL-клиента."
}
---

## Описание {#description}

Возвращает Catalog текущего соединения SQL-клиента.

## Синтаксис {#syntax}

```sql
CURRENT_CATALOG()
```

## Возвращаемое значение {#return-value}

Имя Catalog текущего соединения SQL-клиента.

## Примеры {#examples}

```sql
select current_catalog();
```

```text
+-------------------+
| current_catalog() |
+-------------------+
| internal          |
+-------------------+
```
