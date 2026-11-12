---
{
    "title": "ARRAY_EXCEPT",
    "language": "ru",
    "description": "Возвращает элементы, которые присутствуют в первом массиве, но отсутствуют во втором массиве,"
}
---

## array_except {#array_except}

<version since="2.0.0">

</version>

## Описание {#description}

Возвращает элементы, которые присутствуют в первом массиве, но отсутствуют во втором массиве, формируя новый массив без дубликатов с сохранением исходного порядка.

## Синтаксис {#syntax}

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### Параметры {#parameters}

- `arr1`: тип ARRAY<T>, первый массив.
- `arr2`: тип ARRAY<T>, второй массив.

**Поддерживаемые типы T:**
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Строковые типы: CHAR, VARCHAR, STRING
- Типы даты и времени: DATE, DATETIME, DATEV2, DATETIMEV2
- Логический тип: BOOLEAN
- Типы IP-адресов: IPV4, IPV6

### Возвращаемое значение {#return-value}

Тип возвращаемого значения: ARRAY<T>

Значение результата:
- Возвращает новый массив, содержащий все уникальные элементы, которые присутствуют в arr1, но отсутствуют в arr2, в том же порядке, что и в arr1.
- NULL: если хотя бы один из входных массивов равен NULL.

Примечания по использованию:
- Поддерживаются только массивы базовых типов; сложные типы (ARRAY, MAP, STRUCT) не поддерживаются.
- При обработке пустого массива с любым другим массивом результатом будет пустой массив.
- Сравнение элементов выполняется по правилам совместимости типов. Если типы несовместимы, выполняется попытка преобразования; при неудаче возвращается null.
- Обработка значений null в массивах: элементы null участвуют в операциях наравне с обычными элементами, а null и null считаются одинаковыми

### Примеры {#examples}

```sql
CREATE TABLE array_except_test (
    id INT,
    arr1 ARRAY<INT>,
    arr2 ARRAY<INT>,
    str_arr1 ARRAY<STRING>,
    str_arr2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_except_test VALUES
(1, [1, 2, 3, 4, 5], [2, 4]),
(2, [10, 20, 30], [30, 40]),
(3, [], [1, 2]),
(4, NULL, [1, 2]),
(5, [1, null, 2, null, 3], [null, 2]),
(6, [1, 2, 3], NULL),
(7, [1, 2, 3], []),
(8, [], []),
(9, [1, 2, 2, 3, 3, 3, 4, 5, 5], [2, 3, 5]),
(10, [1], [1]);
```

**Примеры запросов:**

Простой пример разности массивов целых чисел:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

Частичное совпадение элементов:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

Пустой массив и произвольный массив:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

Массив равен NULL: если хотя бы один из входных массивов равен NULL, функция возвращает NULL без возникновения ошибки.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Массив, содержащий значения null:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

Второй массив равен NULL: если хотя бы один из входных массивов равен NULL, функция возвращает NULL без возникновения ошибки.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

Второй массив пуст:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

Оба массива пусты:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

Пример удаления дубликатов:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

Все элементы исключены:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

Разность строковых массивов:
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### Примеры ошибок {#exception-examples}

Неверное количество параметров:
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

Несовместимые типы:
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

Передача значения, не являющегося массивом:
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

Сложные типы не поддерживаются:
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### Ключевые слова {#keywords}

ARRAY, EXCEPT, ARRAY_EXCEPT
