---
{
    "title": "DROP STREAM",
    "language": "ru",
    "description": "Удаляет Table Stream."
}
---

## Описание {#description}

Удаляет Table Stream. Удаление Stream не затрагивает базовую таблицу и её журнал изменений.

## Синтаксис {#syntax}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## Обязательные параметры {#required-parameters}

**1. `<stream_name>`**
> Stream, который нужно удалить.

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**
> База данных, к которой относится Stream; по умолчанию используется текущая база данных.

**2. `IF EXISTS`**
> Не сообщать об ошибке, если Stream не существует.

**3. `FORCE`**
> Удалить напрямую, минуя корзину. Stream, базовая таблица которого была удалена, необходимо удалять с `FORCE`; в режиме разделения вычислений и хранения `FORCE` обязателен.

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту SQL-команду, должен иметь как минимум следующие права:

| Право | Объект | Примечания |
| :-------- | :----- | :---- |
| DROP_PRIV | Stream | |

## Примечания по использованию {#usage-notes}

- Выполнение `DROP TABLE` для Stream завершается ошибкой с подсказкой использовать `DROP STREAM`.
- В режиме разделения вычислений и хранения отсутствие `FORCE` приводит к ошибке `Cloud Table Stream only supports DROP STREAM ... FORCE`.
- Смещения чтения удаляются вместе со Stream; Stream, созданный заново с тем же именем, начинает чтение данных с момента своего создания.

## Примеры {#examples}

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
