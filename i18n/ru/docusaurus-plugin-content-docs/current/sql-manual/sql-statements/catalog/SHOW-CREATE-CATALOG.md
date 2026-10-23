---
{
    "title": "SHOW CREATE CATALOG",
    "language": "ru",
    "description": "Этот оператор выводит команду создания Catalog в Doris."
}
---

## Описание {#description}

Этот оператор выводит команду создания Catalog в Doris.

## Синтаксис {#syntax}

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## Обязательные параметры {#required-parameters}

**1. `<catalog_name>`**

Имя Catalog, команду создания которого требуется просмотреть.

## Требования к управлению доступом {#access-control-requirements}
| Привилегия                                                                                   | Объект  | Примечания                                |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | Требуется одна из перечисленных привилегий. |


## Пример {#example}

1. Просмотр команды создания Catalog с именем oracle в Doris

```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```sql
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```
