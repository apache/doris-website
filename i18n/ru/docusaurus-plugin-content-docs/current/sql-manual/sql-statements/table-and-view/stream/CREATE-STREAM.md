---
{
    "title": "CREATE STREAM",
    "language": "ru",
    "description": "Создаёт Table Stream на внутренней таблице с включённым changelog для инкрементальной обработки изменений таблицы."
}
---

## Описание {#description}

Создаёт Table Stream на внутренней таблице с включённым changelog. Table Stream хранит смещение обработки для каждой партиции базовой таблицы; `SELECT ... FROM <stream>` читает изменения с момента последней обработки, а `INSERT INTO ... SELECT ... FROM <stream>` обрабатывает их и продвигает смещения. Описание этой возможности см. в разделе [Основы Table Stream](../../../../data-operate/incremental/table-stream).

Эта возможность доступна начиная с версии 5.0.0 и является экспериментальной. Для её использования в конфигурации FE должны быть заданы `enable_feature_changelog = true` и `enable_table_stream = true`.

## Синтаксис {#syntax}

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## Обязательные параметры {#required-parameters}

**1. `<stream_name>`**
> Идентификатор (имя) Stream. Он должен быть уникальным в пределах своей базы данных и не должен совпадать с именем таблицы или представления. Правила именования идентификатора такие же, как для имён таблиц.

**2. `<table_name>`**
> Базовая таблица. Это должна быть внутренняя таблица с включённым [changelog](../../../../data-operate/incremental/changelog) (`"changelog.enable" = "true"`); она может находиться в другой базе данных, чем Stream.

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**
> База данных Stream или базовой таблицы; по умолчанию используется текущая база данных.

**2. `IF NOT EXISTS`**
> Не выдавать ошибку, если Stream с таким именем уже существует.

**3. `<comment>`**
> Комментарий к Stream; позднее его можно изменить с помощью `ALTER STREAM ... SET COMMENT`.

**4. `PROPERTIES`**

| Свойство | Значения / по умолчанию | Описание |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />по умолчанию `min_delta` | Тип обработки изменений. `append_only` выдаёт только вставленные строки; `min_delta` выдаёт итоговое изменение для каждого ключа между двумя операциями обработки; `detail` выдаёт каждое изменение построчно. Для `min_delta` и `detail` базовая таблица должна быть таблицей Unique Key Merge-on-Write с включённым `changelog.need_historical_value`; для таблиц Duplicate Key `min_delta` обрабатывается как `append_only` |
| `show_initial_rows` | `true` / `false`<br />по умолчанию `false` | Выдавать ли данные, уже существующие на момент создания Stream, в виде изменений. При значении `true` первое чтение возвращает все текущие данные базовой таблицы (тип изменения `APPEND`), а после их обработки Stream переходит в инкрементальный режим |

После создания нельзя изменить ни одно из этих свойств.

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Право | Объект | Примечания |
| :-------- | :----- | :---- |
| CREATE_PRIV | База данных Stream | |
| SELECT_PRIV | Базовая таблица | |

## Примечания по использованию {#usage-notes}

- Если для базовой таблицы не включён changelog, оператор завершается с ошибкой `Base Olap table ... need to enable changelog for table stream`.
- Если `type` имеет значение `min_delta` (или не указан) и базовая таблица не соответствует требованиям, оператор завершается с ошибкой `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true`.
- Недопустимое значение `type` приводит к ошибке `not supported type: <value>`.
- `CREATE OR REPLACE STREAM` пока не поддерживается.
- Столбцы Stream соответствуют текущим видимым столбцам базовой таблицы и автоматически синхронизируются после выполнения `ADD COLUMN` / `DROP COLUMN` для базовой таблицы.

## Примеры {#examples}

1. Создание Stream с типом по умолчанию (`min_delta`) для таблицы `orders`, обрабатывающего только изменения, появившиеся после его создания:

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. Создание Stream типа `append_only` с выдачей существующих данных базовой таблицы в качестве начальных изменений:

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. Создание Stream в базе данных `etl` с базовой таблицей в базе данных `ods`:

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```
