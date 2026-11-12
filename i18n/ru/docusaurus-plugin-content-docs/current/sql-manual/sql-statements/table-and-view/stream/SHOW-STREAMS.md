---
{
    "title": "SHOW STREAMS",
    "language": "ru",
    "description": "Выводит список Table Streams в базе данных."
}
---

## Описание {#description}

Выводит список Table Streams в текущей или указанной базе данных; отображаются только объекты Stream, на которые у пользователя есть привилегия SHOW. Тип, базовая таблица и состояние каждого объекта Stream доступны в [information_schema.table_streams](../../../../admin-manual/system-tables/information_schema/table_streams).

## Синтаксис {#syntax}

```sql
SHOW STREAMS [{FROM | IN} <db_name>] [LIKE '<pattern>' | WHERE <expr>]
```

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**
> Имя базы данных; по умолчанию используется текущая база данных.

**2. `LIKE '<pattern>'`**
> Сопоставляет имена объектов Stream с шаблоном; синтаксис такой же, как у `SHOW TABLES LIKE`.

**3. `WHERE <expr>`**
> Фильтрует по условию; синтаксис такой же, как у `SHOW TABLES WHERE`.

## Возвращаемое значение {#return-value}

| Столбец | Описание |
|---|---|
| `Tables_in_<db_name>` | Имя объекта Stream |

## Требования к управлению доступом {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум следующими привилегиями:

| Привилегия | Объект | Примечания |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | Отображаются только объекты Stream, на которые предоставлена эта привилегия |

## Примеры {#examples}

```sql
SHOW STREAMS;
```

```text
+----------------+
| Tables_in_demo |
+----------------+
| orders_stream  |
| events_stream  |
+----------------+
```

```sql
SHOW STREAMS FROM demo LIKE 'orders%';
```
