---
{
    "title": "ARRAY_CONCAT",
    "language": "ru",
    "description": "Объединяет все входные массивы в один массив. Функция принимает один или несколько массивов в качестве параметров и соединяет их в новый массив в "
}
---

## array_concat {#array_concat}

<version since="2.0.0">


</version>

## Описание {#description}

Объединяет все входные массивы в один массив. Функция принимает один или несколько массивов в качестве параметров и соединяет их в новый массив в порядке следования параметров.

## Синтаксис {#syntax}

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### Параметры {#parameters}

- `arr1, arr2, ...`：массивы типа ARRAY\<T>, которые нужно объединить. Поддерживаются имена столбцов и константные значения.

**Поддерживаемые типы T:**
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Строковые типы: CHAR, VARCHAR, STRING
- Типы даты и времени: DATE, DATETIME, DATEV2, DATETIMEV2
- Логический тип: BOOLEAN
- Типы IP: IPV4, IPV6
- Сложные типы данных: ARRAY, MAP, STRUCT

### Возвращаемое значение {#return-value}

Тип возвращаемого значения: ARRAY\<T>

Значение результата:
- Новый массив, содержащий все элементы входных массивов с сохранением исходного порядка
- NULL: если хотя бы один входной массив равен NULL

Особенности использования:
- Пустые массивы игнорируются и не добавляют элементов
- Если передан только один массив и он пуст, возвращается пустой массив; если передан только один массив и он равен NULL, возвращается NULL
- При объединении сложных типов (вложенных массивов, MAP, STRUCT) их структуры должны полностью совпадать, иначе возникает ошибка
- Если элементы массива содержат значения null, эти элементы сохраняются в результате объединения

### Примеры {#examples}

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```

**Примеры запросов:**

Объединение нескольких литералов массивов:
```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```

Объединение строковых массивов:
```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```

Объединение пустых массивов:
```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```

Объединение массивов со значением NULL:
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

Объединение массивов, содержащих элементы null: элементы null сохраняются в результате объединения.
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```

Пример совместимости типов: при объединении int_array1 и string_array1 целочисленные элементы преобразуются в строки, при этом сохраняются все элементы.
```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| ["1", "2", "3", "a", "b"]            |
+-----------------------------------------+
```

Примеры со сложными типами:

Объединение вложенных массивов возможно при совпадении структур.
```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```

Если структуры вложенных массивов не совпадают, возникает ошибка.
```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```

Объединение массивов с элементами типа Map возможно при совпадении структур.
```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```

Объединение массивов с элементами типа Struct возможно при совпадении структур.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```

Если структуры элементов типа struct не совпадают, возникает ошибка.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```

Неверное количество параметров приводит к ошибке.
```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```

Передача значения, не являющегося массивом, приводит к ошибке.
```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```

### Примечания {#notes}

Убедитесь, что типы элементов всех входных массивов совместимы. Особенно это касается вложенных сложных типов: их структуры должны совпадать, чтобы избежать ошибок преобразования типов во время выполнения.

### Ключевые слова {#keywords}

ARRAY, CONCAT, ARRAY_CONCAT
