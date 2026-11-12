---
{
    "title": "ARRAY_AVG",
    "language": "ru",
    "description": "Вычисляет среднее значение всех числовых элементов массива. Функция пропускает значения NULL и нечисловые элементы массива,"
}
---

## array_avg {#array_avg}

<version since="2.0.0">

</version>

## Описание {#description}

Вычисляет среднее значение всех числовых элементов массива. Функция пропускает значения NULL и нечисловые элементы массива, вычисляя среднее только для допустимых числовых элементов.

## Синтаксис {#syntax}

```sql
array_avg(ARRAY<T> arr)
```

### Параметры {#parameters}

- `arr`：тип ARRAY<T>, массив, для которого вычисляется среднее значение. Поддерживаются имена столбцов и константные значения.

**Поддерживаемые типы T:**
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Строковые типы: CHAR, VARCHAR, STRING (будет выполнена попытка преобразования в числовой тип)
- Логический тип: BOOLEAN (будет выполнена попытка преобразования в числовой тип)

### Возвращаемое значение {#return-value}

Тип возвращаемого значения: выбирается автоматически в зависимости от типа входных данных

Значение результата:
- Возвращает среднее значение всех допустимых числовых элементов массива
- NULL: если массив пуст или все элементы равны NULL либо не могут быть преобразованы в числовой тип

Примечания по использованию:
- Если массив содержит элементы других типов (например, строки), функция попытается преобразовать их в тип DOUBLE. Элементы, которые не удалось преобразовать, пропускаются и не учитываются при вычислении среднего значения
- Функция попытается преобразовать все элементы в совместимые числовые типы для вычисления среднего значения. Тип возвращаемого среднего значения выбирается автоматически в зависимости от типа входных данных:
  - Для входных данных типа DOUBLE или FLOAT возвращается DOUBLE
  - Для входных данных целочисленных типов возвращается DOUBLE
  - Для входных данных типа DECIMAL возвращается DECIMAL с сохранением исходной точности и масштаба
- Для пустых массивов возвращается NULL, для массивов с одним элементом возвращается значение этого элемента
- Если массив равен NULL, возвращается ошибка преобразования типов
- Вычисление среднего значения для вложенных массивов, MAP, STRUCT и других сложных типов не поддерживается; вызов функции приведёт к ошибке
- Элементы массива со значением NULL не учитываются при вычислении среднего значения

### Примеры {#examples}

```sql
CREATE TABLE array_avg_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    mixed_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_avg_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['1', '2', '3', '4', '5']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['10', '20', '30']),
(3, [], [], []),
(4, NULL, NULL, NULL),
(5, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['1', null, '3', null, '5']);
```

**Примеры запросов:**

Вычисление среднего значения для double_array:
```sql
SELECT array_avg(double_array) FROM array_avg_test WHERE id = 1;
+-------------------------+
| array_avg(double_array) |
+-------------------------+
|                     3.3 |
+-------------------------+
```

Вычисление среднего значения для массива с элементами разных типов; строки преобразуются в числовые значения:
```sql
SELECT array_avg(mixed_array) FROM array_avg_test WHERE id = 1;
+------------------------+
| array_avg(mixed_array) |
+------------------------+
|                      3 |
+------------------------+
```

Для пустого массива возвращается NULL:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 3;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

Для массива, равного NULL, возвращается NULL:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 4;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

Массив со значениями NULL; элементы со значением NULL не учитываются при вычислении:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 5;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                    3 |
+----------------------+
```

Примеры со сложными типами:

Вложенные массивы не поддерживаются; возникает ошибка:
```sql
SELECT array_avg([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([[1, 2, 3]]) does not support type: ARRAY<TINYINT>
```

Типы MAP не поддерживаются; возникает ошибка:
```sql
SELECT array_avg([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([map('k', 1), map('k', 2)]) does not support type: MAP<VARCHAR(1),TINYINT>
```

Ошибка при неверном количестве параметров:
```sql
SELECT array_avg([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_avg' which has 2 arity. Candidate functions are: [array_avg(Expression)]
```

Ошибка при передаче значения, не являющегося массивом:
```sql
SELECT array_avg('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_avg(VARCHAR(12))
```

Если массив равен NULL, возвращается ошибка преобразования типов
```
mysql> SELECT array_avg(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Ключевые слова {#keywords}

ARRAY, AVG, ARRAY_AVG
