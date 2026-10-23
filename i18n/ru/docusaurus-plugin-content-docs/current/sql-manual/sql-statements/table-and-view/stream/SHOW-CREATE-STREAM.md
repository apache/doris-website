---
{
    "title": "SHOW CREATE STREAM",
    "language": "ru",
    "description": "Показывает оператор CREATE для Table Stream."
}
---

## Описание {#description}

Показывает оператор CREATE для Table Stream, включая базовую таблицу, комментарий и свойства.

## Синтаксис {#syntax}

```sql
SHOW CREATE STREAM [<db_name>.]<stream_name>
```

## Обязательные параметры {#required-parameters}

**1. `<stream_name>`**
> Имя Stream.

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**
> База данных, к которой относится Stream; по умолчанию используется текущая база данных.

## Возвращаемое значение {#return-value}

| Столбец | Описание |
|---|---|
| `Stream` | Имя Stream |
| `Create Stream` | Оператор CREATE |

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия | Объект | Примечания |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | |

## Примечания по использованию {#usage-notes}

При выполнении этого оператора для обычной таблицы возникает ошибка с подсказкой использовать `SHOW CREATE TABLE`. Если базовая таблица удалена, в `ON TABLE` отображается `UNKNOWN`.

## Примеры {#examples}

```sql
SHOW CREATE STREAM orders_stream\G
```

```text
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```
