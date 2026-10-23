---
{
    "title": "VARIANT_TYPE",
    "language": "ru",
    "description": "VARIANT_TYPE возвращает имя типа значения VARIANT, например object, array, string, bigint или double, помогая при отладке и анализе данных VARIANT."
}
---

## Функция {#function}

Функция `VARIANT_TYPE` возвращает имя типа значения `VARIANT`.
Обычно она используется для отладки или анализа структуры данных `VARIANT`, помогая определять типы и обрабатывать данные. На этой странице описано её поведение в Doris 5.0.0 и более поздних версиях.

## Синтаксис {#syntax}

```sql
VARIANT_TYPE(variant_value)
```

## Параметры {#parameters}

- `variant_value`: значение типа `VARIANT`. Чтобы получить тип вложенного значения, передайте путь, например `VARIANT_TYPE(v['a'])`.

## Возвращаемое значение {#return-value}

Возвращает значение типа `STRING` с именем типа самого значения. Для объекта или массива возвращает `object` или `array`; типы элементов не перечисляются.

| Результат | Значение |
| --- | --- |
| `object`, `array` | Объект или массив JSON |
| `string` | Строка |
| `bool` | `true` или `false` |
| `tinyint`, `smallint`, `int`, `bigint` | Целое число; указывается наименьший тип, способный его вместить |
| `decimal` | Десятичное число, включая целое число, слишком большое для `BIGINT`, и значение `LARGEINT` длиной до 38 цифр |
| `float`, `double` | Число с плавающей точкой |
| `date` | Дата |
| `timestamp` | Метка времени с часовым поясом |
| `timestamp_ntz` | Метка времени без часового пояса, например значение `DATETIME` или `TIMESTAMP_NS` |
| `null` | Значение VARIANT `null` (JSON `null`) |
| `binary`, `time`, `uuid` | Значения, которые не создаются ни при разборе JSON, ни с помощью CAST в Doris; они могут поступать из данных VARIANT, записанных другими системами, например из файлов Parquet |

Если на вход подан SQL `NULL`, возвращается SQL `NULL`.

## Примечания {#notes}

1. Используйте эту функцию, чтобы определить фактический тип значений в столбце `VARIANT`. Для значений, прочитанных из таблицы, результат отражает сохранённое значение; например, значение `DATE` в корне хранится как строка. См. [Что сохраняется в хранилище](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps).
2. Результат — это тип значения, а не тип хранения пути: целое число, прочитанное по пути типа `BIGINT`, может иметь тип `tinyint`. Чтобы увидеть тип хранения каждого подстолбца в таблице, используйте `SET describe_extend_variant_column = true;` и `DESC`.
3. Функция читает каждую строку, поэтому на практике используйте `LIMIT`, чтобы ограничить количество строк.

## Пример {#example}

```SQL
CREATE TABLE variant_table(
    k INT,
    v VARIANT NULL
)
DUPLICATE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO variant_table VALUES
    (1, PARSE_TO_VARIANT('{"a": 10, "b": 1.2, "c": "ddddd"}')),
    (2, PARSE_TO_VARIANT('[1, 2]')),
    (3, NULL);

SELECT k,
       VARIANT_TYPE(v)      AS root_type,
       VARIANT_TYPE(v['a']) AS a_type,
       VARIANT_TYPE(v['b']) AS b_type,
       VARIANT_TYPE(v['c']) AS c_type
FROM variant_table
ORDER BY k;
```

```text
+------+-----------+---------+--------+--------+
| k    | root_type | a_type  | b_type | c_type |
+------+-----------+---------+--------+--------+
|    1 | object    | tinyint | double | string |
|    2 | array     | NULL    | NULL   | NULL   |
|    3 | NULL      | NULL    | NULL   | NULL   |
+------+-----------+---------+--------+--------+
```
