---
{
    "title": "Lateral View",
    "language": "ru",
    "description": "LATERAL VIEW в Doris используется с генерирующими функциями, такими как EXPLODE, для разворачивания одной строки в несколько строк, позволяя выполнять SQL-запросы с преобразованием столбцов в строки.",
    "keywords": [
        "Doris LATERAL VIEW",
        "преобразование столбцов в строки",
        "EXPLODE",
        "преобразование строк в столбцы",
        "разворачивание массивов",
        "lateral view explode",
        "SQL преобразование одной строки в несколько строк"
    ]
}
---

<!-- Knowledge type: Syntax reference -->
<!-- Applicable scenario: Array/collection type expansion queries, column to row -->

`LATERAL VIEW` — это синтаксическая конструкция Doris для преобразования столбцов в строки. В сочетании с генерирующими функциями (например, `EXPLODE`) она разворачивает поле типа коллекции из одной строки в несколько строк и соединяет результат разворачивания, рассматриваемый как виртуальная таблица, с исходной строкой.

## Сценарии использования {#applicable-scenarios}

Если строка данных содержит перебираемую коллекцию, например массив или список, и вы хотите выделить каждый элемент коллекции в отдельную строку для анализа в SQL-запросе, можно использовать `LATERAL VIEW`. Типичные сценарии:

- Разворачивание поля-массива в строке с выводом каждого элемента вместе с остальными исходными столбцами.
- Агрегация, фильтрация или соединение с другими таблицами отдельно для каждого элемента коллекции.
- Использование результата генерирующей функции (например, `EXPLODE`, `EXPLODE_SPLIT`) в качестве виртуальной таблицы в запросе.

## Синтаксис {#syntax}

```sql
LATERAL VIEW generator_function ( expression [, ...] ) table_identifier AS column_identifier [, ...]
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `generator_function` | Генерирующая функция, например `EXPLODE` или `EXPLODE_SPLIT`. |
| `table_identifier` | Псевдоним виртуальной таблицы, создаваемой функцией `generator_function`. |
| `column_identifier` | Псевдоним столбца, используемый для именования столбца в выходных строках. Количество псевдонимов столбцов должно совпадать с количеством столбцов, возвращаемых генерирующей функцией. |

## Пример использования {#usage-example}

В следующем примере показано, как использовать `LATERAL VIEW` для выполнения запроса с преобразованием столбцов в строки.

### 1. Подготовка данных {#1-prepare-the-data}

Создайте таблицу `person` и вставьте несколько строк тестовых данных:

```sql
CREATE TABLE `person` (
  `id` int(11) NULL,
  `name` text NULL,
  `age` int(11) NULL,
  `class` int(11) NULL,
  `address` text NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"in_memory" = "false",
"storage_format" = "V2",
"disable_auto_compaction" = "false"
);

INSERT INTO person VALUES
    (100, 'John', 30, 1, 'Street 1'),
    (200, 'Mary', NULL, 1, 'Street 2'),
    (300, 'Mike', 80, 3, 'Street 3'),
    (400, 'Dan', 50, 4, 'Street 4');
```

### 2. Выполнение запроса с LATERAL VIEW {#2-run-the-lateral-view-query}

Используйте `LATERAL VIEW` вместе с функцией `EXPLODE`, чтобы получить декартово произведение элементов массива `ARRAY(30, 60)` и строк таблицы `person`:

```sql
SELECT * FROM person
LATERAL VIEW EXPLODE(ARRAY(30, 60)) tableName AS c_age;
```

### 3. Просмотр результата {#3-view-the-result}

Результат запроса содержит сочетания каждой строки таблицы `person` с каждой строкой, сгенерированной функцией `EXPLODE`:

```sql
+------+------+------+-------+----------+-------+
| id   | name | age  | class | address  | c_age |
+------+------+------+-------+----------+-------+
|  100 | John |   30 |     1 | Street 1 |    30 |
|  100 | John |   30 |     1 | Street 1 |    60 |
|  200 | Mary | NULL |     1 | Street 2 |    30 |
|  200 | Mary | NULL |     1 | Street 2 |    60 |
|  300 | Mike |   80 |     3 | Street 3 |    30 |
|  300 | Mike |   80 |     3 | Street 3 |    60 |
|  400 | Dan  |   50 |     4 | Street 4 |    30 |
|  400 | Dan  |   50 |     4 | Street 4 |    60 |
+------+------+------+-------+----------+-------+
8 rows in set (0.12 sec)
```
