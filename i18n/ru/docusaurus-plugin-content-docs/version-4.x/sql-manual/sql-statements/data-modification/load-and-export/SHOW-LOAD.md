---
{
    "title": "SHOW LOAD",
    "language": "ru",
    "description": "Этот оператор отображает состояние выполнения указанного задания загрузки."
}
---

## Описание {#description}

Этот оператор отображает состояние выполнения указанного задания загрузки.

## Синтаксис {#syntax}

```sql
SHOW LOAD
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" | LIKE "<label_matcher>"]]
   [ STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " } ]
]
[ORDER BY { <col_name> | <expr> | <position> }]
[LIMIT <limit>[OFFSET <offset>]];
```

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**

> Если `db_name` не указан, используется текущая база данных по умолчанию.

**2. `<label_matcher>`**

> При использовании `LABEL LIKE = "<label_matcher>"` выбираются задания загрузки, метки которых содержат `label_matcher`.

**3. `<your_label>`**

> При использовании `LABEL = "<your_label>"` выбираются задания с точным совпадением указанной метки.

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> Указание `PENDING` означает выбор заданий со статусом `STATE = "PENDING"`. То же правило применяется к другим ключевым словам статусов.

**5. `<col_name>`**

> Указывает имя столбца в наборе результатов, по которому выполняется сортировка.

**6. `<expr>`**

> Задаёт выражение для сортировки.

**7. `<position>`**

> Задаёт сортировку по позиции столбца в списке `SELECT` (начиная с 1).

**8. `<limit>`**

> Если указан `LIMIT`, отображается `limit` записей, соответствующих условиям. В противном случае отображаются все записи.

**9. `<offset>`**

> Указывает, что результаты запроса следует отображать начиная со смещения `offset`. По умолчанию смещение равно 0.

## Требования к правам доступа {#access-control-requirements}

Пользователи, выполняющие эту команду SQL, должны иметь как минимум следующие права:

| Привилегия | Объект | Примечания |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | База данных | Необходимы права на загрузку данных в таблицы базы данных. |

## Возвращаемое значение {#return-value}

Возвращает подробные сведения о состоянии указанного задания загрузки.

## Примеры {#examples}

1. Показать все задания загрузки в базе данных по умолчанию.

    ```sql
    SHOW LOAD;
    ```

2. Показать задания загрузки в указанной базе данных, метки которых содержат строку "2014_01_02", и вывести 10 самых старых заданий.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

3. Показать задания загрузки в указанной базе данных с меткой "load_example_db_20140102" и отсортировать их по `LoadStartTime` в порядке убывания.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```

4. Показать задания загрузки в указанной базе данных с меткой "load_example_db_20140102" и состоянием "loading", отсортировав их по `LoadStartTime` в порядке убывания.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```

5. Показать задания загрузки в указанной базе данных, отсортировать их по `LoadStartTime` в порядке убывания и вывести 10 результатов запроса, начиная со смещения 5.

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```

6. Команда для проверки состояния загрузки при импорте небольшими пакетами.

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
