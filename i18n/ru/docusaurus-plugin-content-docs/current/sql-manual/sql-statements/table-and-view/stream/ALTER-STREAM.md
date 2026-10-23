---
{
    "title": "ALTER STREAM",
    "language": "ru",
    "description": "Изменяет комментарий Table Stream."
}
---

## Описание {#description}

Изменяет комментарий Table Stream. Тип потребления (`type`) и свойство `show_initial_rows` объекта Table Stream нельзя изменить после его создания; для этого удалите Stream и создайте его заново.

## Синтаксис {#syntax}

```sql
ALTER STREAM [<db_name>.]<stream_name> { SET | MODIFY } COMMENT '<comment>'
```

## Обязательные параметры {#required-parameters}

**1. `<stream_name>`**
> Stream, который нужно изменить.

**2. `<comment>`**
> Новый комментарий. `SET COMMENT` и `MODIFY COMMENT` эквивалентны.

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**
> База данных, содержащая Stream; по умолчанию используется текущая база данных.

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия | Объект | Примечания |
| :-------- | :----- | :---- |
| ALTER_PRIV | Stream | |

## Примечания по использованию {#usage-notes}

Новый комментарий отображается в выводе `SHOW CREATE STREAM` и в столбце `STREAM_COMMENT` таблицы `information_schema.table_streams`.

## Примеры {#examples}

```sql
ALTER STREAM orders_stream SET COMMENT 'sync order changes to dwd';
ALTER STREAM orders_stream MODIFY COMMENT 'sync order changes to dwd, hourly';
```
