---
{
    "title": "UUID_NUMERIC",
    "language": "ru",
    "description": "Возвращает uuid типа LARGEINT"
}
---

## Описание {#description}

Возвращает uuid типа LARGEINT

Эта функция по-прежнему возвращает LARGEINT; встроенный [тип UUID](../../../basic-element/sql-data-types/uuid.md) не меняет это поведение. Используйте [UUID_V4](../uuid-functions/uuid-v4.md) или [UUID_V7](../uuid-functions/uuid-v7.md), если требуется значение встроенного типа UUID.

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
