---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "ru",
    "description": "Эта команда позволяет изменить существующее задание Routine Load. Изменять можно только задания в состоянии PAUSED."
}
---

## Описание {#description}

Эта команда позволяет изменить существующее задание Routine Load. Изменять можно только задания в состоянии PAUSED.

## Синтаксис {#syntax}

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[<job_properties>]
FROM [<data_source>]
[<data_source_properties>]
```

## Обязательные параметры {#required-parameters}

**1. `[<db>.]<job_name>`**

> Задаёт имя задания, которое нужно изменить. Идентификатор должен начинаться с буквы и не может содержать пробелы или специальные символы, если только вся строка идентификатора не заключена в обратные кавычки.
>
> В качестве идентификатора нельзя использовать зарезервированные ключевые слова. Подробнее см. требования к идентификаторам и список зарезервированных ключевых слов.

## Необязательные параметры {#optional-parameters}

**1. `<job_properties>`**

> Задаёт параметры задания, которые нужно изменить. В настоящее время поддерживаются следующие параметры:
> 
> - desired_concurrent_number
> - max_error_number
> - max_batch_interval
> - max_batch_rows
> - max_batch_size
> - jsonpaths
> - json_root
> - strip_outer_array
> - strict_mode
> - timezone
> - num_as_string
> - fuzzy_parse
> - partial_columns
> - max_filter_ratio

**2. `<data_source_properties>`**

> Свойства источника данных. В настоящее время поддерживаются:
> 
> - `<kafka_partitions>`
> - `<kafka_offsets>`
> - `<kafka_broker_list>`
> - `<kafka_topic>`
> - Пользовательские свойства, например `<property.group.id>`

**3. `<data_source>`**

> Тип источника данных. В настоящее время поддерживается:
> 
> - KAFKA

## Требования к правам доступа {#access-control-requirements}

Пользователи, выполняющие эту команду SQL, должны иметь как минимум следующие привилегии:

| Привилегия | Объект | Примечания |
| :-------- | :----- | :---- |
| LOAD_PRIV | Таблица | Для выполнения ALTER ROUTINE LOAD требуется привилегия LOAD для таблицы |

## Примечания {#notes}

- `kafka_partitions` и `kafka_offsets` используются для изменения смещений чтения разделов kafka. Изменять смещения можно только для разделов, из которых уже выполняется чтение. Добавлять новые разделы нельзя.

## Примеры {#examples}

- Изменить значение `desired_concurrent_number` на 1

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "1"
    );
    ```

- Изменить значение `desired_concurrent_number` на 10, смещения разделов и идентификатор группы

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "10"
    )
    FROM kafka
    (
        "kafka_partitions" = "0, 1, 2",
        "kafka_offsets" = "100, 200, 100",
        "property.group.id" = "new_group"
    );
    ```
