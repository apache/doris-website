---
{
    "title": "UUID_NUMERIC",
    "language": "ru",
    "description": "Возвращает uuid типа LARGEINT"
}
---

## Описание {#description}

Возвращает uuid типа LARGEINT

## Синтаксис {#syntax}

```sql
UUID_NUMERIC()
```

## Возвращаемое значение {#return-value}

Возвращает uuid типа LARGEINT. Обратите внимание, что LARGEINT представляет собой Int128, поэтому uuid_numeric() может возвращать отрицательные значения

## Пример {#example}

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
