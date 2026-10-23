---
{
    "title": "VARIANT_TYPE",
    "language": "ru",
    "description": "Функция VARIANTTYPE возвращает фактический тип значения VARIANT."
}
---

## Назначение {#function}

Функция `VARIANT_TYPE` возвращает фактический тип значения `VARIANT`.  
Эта функция обычно используется для отладки или анализа структуры данных `VARIANT`, помогая определять типы и обрабатывать данные.

## Синтаксис {#syntax}

```sql
VARIANT_TYPE(variant_value)
```

## Параметры {#parameters}

- `variant_value`: значение типа `VARIANT`.

## Возвращаемое значение {#return-value}

- Возвращает строку, представляющую фактический тип значения `VARIANT`.
    - Строка имеет структуру `{"key":"value"}`.
    - Ключ указывает путь к подполю, а значение указывает тип.

## Примечания {#notes}

1. Используется для определения фактического типа данных, хранящихся в столбце `VARIANT`.  
2. Для каждой строки таблицы считываются подполя, чтобы определить их тип. На практике используйте `LIMIT` для ограничения количества строк, чтобы избежать медленного выполнения.

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

INSERT INTO variant_table VALUES(1, '{"a": 10, "b": 1.2, "c" : "ddddd"}'), (2, NULL);

SELECT VARIANT_TYPE(v) FROM variant_table;
+-------------------------------------------+
| VARIANT_TYPE(v)                           |
+-------------------------------------------+
| {"a":"tinyint","b":"double","c":"string"} |
| NULL                                      |
+-------------------------------------------+
```
