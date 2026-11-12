---
{
    "title": "SWITCH CATALOG",
    "language": "ru",
    "description": "Этот оператор позволяет переключиться на другой Catalog."
}
---

## Описание {#description}

Этот оператор позволяет переключиться на другой Catalog.

## Синтаксис {#syntax}

```sql
SWITCH <catalog_name>
```

## Обязательные параметры {#required-parameters}

**1. `<catalog_name>`**
> Имя Catalog, на который требуется переключиться.

## Требования к управлению доступом {#access-control-requirements}

| Привилегия | Объект     | Примечания                             |
|------------|------------|----------------------------------------|
| SELECT_PRIV  | Catalog    | Для переключения требуется привилегия SELECT_PRIV на целевой Catalog. |

## Примеры {#examples}

1. Переключение на Catalog `hive`

   ```sql
   SWITCH hive;
   ```
