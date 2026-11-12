---
{
    "title": "ALTER CATALOG",
    "language": "ru",
    "description": "Этот оператор используется для настройки свойств указанного Catalog."
}
---

## Описание {#description}

Этот оператор используется для настройки свойств указанного Catalog.


## Синтаксис {#syntax}
1) Переименование Catalog

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) Изменение / добавление свойств Catalog

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]);  
    ```

3) Изменение комментария к Catalog

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## Обязательные параметры {#required-parameters}

**1. `<catalog_name>`**

Имя Catalog, который требуется изменить

**2. `<new_catalog_name>`**

Новое имя Catalog после изменения

**3. `'<key>' = '<value>'`**

Ключ и значение свойства Catalog, которое требуется изменить / добавить

**4. `<new catalog comment>`**

Изменённый комментарий к Catalog


## Требования к правам доступа {#access-control-requirements}
| Привилегия | Объект  | Примечания                                |
|:-----------|:--------|:------------------------------------------|
| ALTER_PRIV | Catalog | Требуется привилегия ALTER_PRIV для Catalog |

## Примечания по использованию {#usage-notes}

1) Переименование Catalog
- Встроенный Catalog `internal` нельзя переименовать
- Переименовать Catalog может только пользователь, имеющий как минимум привилегию Alter
- После переименования Catalog используйте команды REVOKE и GRANT для изменения соответствующих прав доступа пользователей

2) Изменение / добавление свойств Catalog

- Свойство `type` нельзя изменить.
- Свойства встроенного Catalog `internal` нельзя изменить.
- Значения указанных ключей обновляются. Если ключ отсутствует в свойствах Catalog, он будет добавлен.

3) Изменение комментария к Catalog

- Встроенный Catalog `internal` нельзя изменить

## Пример {#example}

1. Переименование Catalog ctlg_hive в hive

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```

2. Изменение свойства `hive.metastore.uris` для Catalog hive

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```

3. Изменение комментария к Catalog hive
      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```
