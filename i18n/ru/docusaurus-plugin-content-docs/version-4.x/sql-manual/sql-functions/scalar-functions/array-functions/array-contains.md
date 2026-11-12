---
{
    "title": "ARRAY_CONTAINS",
    "language": "ru",
    "description": "<version since=\"1.2.0\">"
}
---

## array_contains {#array_contains}

<version since="1.2.0">


</version>

## Описание {#description}

Проверяет, содержит ли массив указанное значение. Возвращает true, если значение найдено, и false в противном случае. Если массив равен NULL, возвращает NULL.

## Синтаксис {#syntax}

```sql
array_contains(ARRAY<T> arr, T value)
```

### Параметры {#parameters}

- `arr`：тип ARRAY<T>, массив для проверки. Поддерживаются имена столбцов или константные значения.
- `value`：тип T, искомое значение. Тип должен быть совместим с типом элементов массива.

**Поддерживаемые типы T:**
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Строковые типы: CHAR, VARCHAR, STRING
- Типы даты и времени: DATE, DATETIME, DATEV2, DATETIMEV2
- Логический тип: BOOLEAN
- Типы IP: IPV4, IPV6

### Возвращаемое значение {#return-value}

Тип возвращаемого значения: BOOLEAN

Значение результата:
- true: если массив содержит указанное значение
- false: если массив не содержит указанного значения
- NULL: если входной массив равен NULL

Правила возврата значений:

1. Поведение в граничных случаях:
   - Возвращает false, если входной массив пуст
   - Возвращает NULL, если входной массив равен NULL
   - Возвращает false, если тип элементов массива не соответствует типу искомого значения
   - Значения null в элементах массива обрабатываются обычным образом: в массивах можно искать элементы null

2. Поведение в исключительных случаях:
   - Возвращает ошибку неподдерживаемого типа, если элементы массива имеют неподдерживаемые типы

3. Случаи возврата NULL:
   - Если входной массив равен NULL

**Правила совместимости типов:**
1. **Совместимость числовых типов**:
   - Целочисленные типы можно сравнивать между собой (TINYINT, SMALLINT, INT, BIGINT, LARGEINT)
   - Типы с плавающей точкой можно сравнивать между собой (FLOAT, DOUBLE)
   - Десятичные типы можно сравнивать между собой (DECIMAL32, DECIMAL64, DECIMAL128I, DECIMALV2, DECIMAL256)
   - Целые числа и числа с плавающей точкой можно сравнивать между собой
2. **Совместимость строковых типов**:
   - Типы CHAR, VARCHAR, STRING можно сравнивать между собой
3. **Совместимость типов даты и времени**:
   - DATE и DATEV2 можно сравнивать между собой
   - DATETIME и DATETIMEV2 можно сравнивать между собой

### Примеры {#examples}

**Пример создания таблицы**
```sql
CREATE TABLE array_contains_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO array_contains_test VALUES
(1, [1000, 2000, 3000], ['apple', 'banana', 'cherry']),
(2, [], []),
(3, NULL, NULL),
(4, [1000, null, 3000], ['apple', null, 'cherry']);
```

**Примеры запросов:**

Проверка наличия определённого целочисленного значения в массиве: в этом примере возвращается false, поскольку значение 5 отсутствует в int_array.
```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```

Проверка наличия определённой строки в строковом массиве: в этом примере возвращается true, поскольку 'banana' присутствует в string_array.
```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```

В данном случае массив пуст. В этом примере возвращается false, поскольку пустой массив не содержит значений.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```

В данном случае массив равен NULL. В этом примере возвращается NULL.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Проверка наличия null в массиве
В этом примере параметр value_expr равен null, а массив не содержит элементов null, поэтому возвращается false.
```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```

Проверка наличия null в массиве
В этом примере параметр value_expr равен null, а массив содержит значения SQL null, поэтому возвращается true.
```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```

Если тип искомого значения несовместим с типом элементов массива, возвращается false.
```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```

Если искомое значение нельзя привести к типу элементов массива, возвращается ошибка
```sql
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```

Неподдерживаемые сложные типы вызывают ошибку. В этом примере массив имеет тип вложенного массива, поэтому возвращается ошибка неподдерживаемого типа.
```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```

### Примечания {#notes}

Производительность: при работе с большими массивами для ускорения запросов можно использовать инвертированные индексы, если производительность особенно важна. При этом следует учитывать следующие ограничения:

1. При создании инвертированного индекса для массива допускается только индекс без токенизации
2. Тип элементов T массива должен поддерживать создание инвертированных индексов
3. Если параметр T в условии запроса равен NULL, индекс нельзя использовать для ускорения
4. Ускорение за счёт индекса применяется только тогда, когда функция используется в качестве предиката фильтрации

```sql
-- Table creation example
CREATE TABLE `test_array_index` (
    `apply_date` date NULL COMMENT '',
    `id` varchar(60) NOT NULL COMMENT '',
    `inventors` array<text> NULL COMMENT '' -- Add non-tokenized inverted index to array column when creating table
  ) ENGINE=OLAP
  DUPLICATE KEY(`apply_date`, `id`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false"
  );
-- Query example
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```

### Ключевые слова {#keywords}

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS
