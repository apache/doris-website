---
{
    "title": "ARRAY_APPLY",
    "language": "ru",
    "description": "Фильтрует элементы массива с помощью указанного оператора сравнения и возвращает новый массив, содержащий элементы, которые удовлетворяют условию."
}
---

## array_apply {#array_apply}

<version since="1.2.3">


</version>

## Описание {#description}

Фильтрует элементы массива с помощью указанного оператора сравнения и возвращает новый массив, содержащий элементы, которые удовлетворяют условию. Это упрощённая функция фильтрации массивов, которая использует предопределённые операторы вместо лямбда-выражений.

## Синтаксис {#syntax}

```sql
array_apply(arr, op, val)
```

### Параметры {#parameters}

- `arr`：тип ARRAY\<T>, массив для фильтрации
- `op`：тип STRING, оператор условия фильтрации; должен быть константой. Поддерживаемые операторы: `=`, `!=`, `>`, `>=`, `<`, `<=`
- `val`：тип T, значение условия фильтрации; должно быть константой

**Поддерживаемые типы T:**
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Типы даты и времени: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- Логический тип: BOOLEAN

### Возвращаемое значение {#return-value}

Тип возвращаемого значения: ARRAY\<T>

Возможные результаты:
- Новый массив, содержащий все элементы, которые удовлетворяют условию фильтрации
- NULL: если входной массив имеет значение NULL или значение условия равно NULL
- Пустой массив: если ни один элемент не удовлетворяет условию

Примечания по использованию:
- Оператор и значение условия должны быть константами, а не именами столбцов или выражениями
- Набор поддерживаемых типов ограничен: в основном это числовые типы, типы даты и времени и логический тип
- Для пустого массива возвращается пустой массив, для массива со значением NULL возвращается NULL
- Элементы массива со значением null отфильтровываются и не участвуют в операциях сравнения

### Примеры {#examples}

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**Примеры запросов:**

Отбор элементов double_array, которые больше 2:
```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```

Отбор элементов int_array, которые не равны 3:
```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```

Отбор элементов date_array, которые больше или равны указанной дате:
```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```

Для пустого массива возвращается пустой массив:
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```

Для массива со значением NULL возвращается NULL: если входной массив имеет значение NULL, функция возвращает NULL без ошибки.
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```

В массиве, содержащем значения null, элементы null отфильтровываются:
```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```

### Примеры ошибок {#exception-examples}

Неподдерживаемый оператор:
```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```

Неподдерживаемый строковый тип:
```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```

Неподдерживаемый сложный тип:
```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```

Оператор не является константой:
```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```

Значение условия не является константой:
```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```

Неверное количество параметров:
```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```

Передача значения типа, отличного от массива:
```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Ключевые слова {#keywords}

ARRAY, APPLY, ARRAY_APPLY
