---
{
    "title": "CONNECTION_ID",
    "language": "ru",
    "description": "Возвращает номер подключения текущего SQL-клиента."
}
---

## Описание {#description}

Возвращает номер подключения текущего SQL-клиента.

## Синтаксис {#syntax}

```sql
CONNECTION_ID()
```

## Возвращаемое значение {#return-value}

Номер подключения текущего SQL-клиента.

## Примеры {#examples}

```sql
select connection_id();
```

```text
+-----------------+
| connection_id() |
+-----------------+
|             549 |
+-----------------+
```
