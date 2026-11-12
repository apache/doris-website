---
{
    "title": "Преобразование в JSON и из JSON",
    "language": "ru",
    "description": "Тип JSON в Doris использует двоичное кодирование для хранения данных вместо текстового представления, что повышает эффективность обработки и хранения."
}
---

Тип JSON в Doris использует двоичное кодирование для хранения данных вместо текстового представления, что повышает эффективность обработки и хранения. Между типами JSON и внутренними типами Doris существует взаимно однозначное соответствие.

## Преобразование в JSON {#cast-to-json}

### Из String {#from-string}

При преобразовании строки в JSON её содержимое должно соответствовать допустимому синтаксису JSON, определённому в [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159). Парсер проверяет строку и преобразует её в соответствующий двоичный формат JSON.

#### Правила разбора строк {#string-parsing-rules}

- Если строка содержит допустимую структуру JSON (объект, массив, число, логическое значение или null), она будет разобрана как значение соответствующего типа JSON:
  ```sql
  mysql> SELECT CAST('[1,2,3,4]' AS JSON); -- Output: [1,2,3,4] (parsed as JSON array)
  +---------------------------+
  | CAST('[1,2,3,4]' AS JSON) |
  +---------------------------+
  | [1,2,3,4]                 |
  +---------------------------+
  ```

- Чтобы создать строковое значение JSON (то есть интерпретировать саму строку как строковое значение JSON, без разбора её содержимого), используйте функцию `TO_JSON`:
  ```sql
  mysql> SELECT TO_JSON('[1,2,3,4]'); -- Output: "[1,2,3,4]" (a JSON string with quotes)
  +----------------------+
  | TO_JSON('[1,2,3,4]') |
  +----------------------+
  | "[1,2,3,4]"          |
  +----------------------+
  ```

#### Правила разбора чисел {#numeric-parsing-rules}

При разборе числовых значений из строки JSON:

- Если число содержит десятичную точку, оно будет преобразовано в тип Double в JSON:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key');
  +------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key')   |
  +------------------------------------------------------+
  | double                                               |
  +------------------------------------------------------+
  ```

- Если число целое, оно будет сохранено в наименьшем целочисленном типе, вмещающем это значение:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key');
  +---------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key')   |
  +---------------------------------------------------------+
  | int                                                     |
  +---------------------------------------------------------+
  ```

  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key');
  +-------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key')   |
  +-------------------------------------------------------------+
  | bigint                                                      |
  +-------------------------------------------------------------+
  ```

- Если целое число выходит за пределы диапазона Int128, оно будет сохранено как double, что может привести к потере точности:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key');
  +--------------------------------------------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key')   |
  +--------------------------------------------------------------------------------------------------+
  | double                                                                                           |
  +--------------------------------------------------------------------------------------------------+
  ```

#### Обработка ошибок {#error-handling}

При разборе строки в JSON:
- В строгом режиме (по умолчанию) недопустимый синтаксис JSON вызывает ошибку
- В нестрогом режиме при недопустимом синтаксисе JSON возвращается NULL

```sql
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
+-----------------------------+
| CAST('{"invalid JSON' AS JSON) |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> SET enable_strict_cast = true;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Failed to parse json string: {"invalid JSON, ...
```

### Из других типов Doris {#from-other-doris-types}

Следующие типы Doris можно напрямую преобразовать в JSON без потери точности:

| Тип Doris | Тип JSON |
|------------|-----------|
| BOOLEAN | Bool |
| TINYINT | Int8 |
| SMALLINT | Int16 |
| INT | Int32 |
| BIGINT | Int64 |
| LARGEINT | Int128 |
| FLOAT | Float |
| DOUBLE | Double |
| DECIMAL | Decimal |
| STRING | String |
| ARRAY | Array |
| STRUCT | Object |

#### Примеры {#examples}

```sql
-- Integer array to JSON
mysql> SELECT CAST(ARRAY(123,456,789) AS JSON);
+----------------------------------+
| CAST(ARRAY(123,456,789) AS JSON) |
+----------------------------------+
| [123,456,789]                    |
+----------------------------------+

-- Decimal array to JSON (preserves precision)
mysql> SELECT CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON);
+--------------------------------------------------------------------------+
| CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON)  |
+--------------------------------------------------------------------------+
| [12345678.123456780000000000,0.000000010000000000,12.000000000000000001] |
+--------------------------------------------------------------------------+
```

#### Типы без прямой поддержки {#types-not-directly-supported}

Типы, не указанные в таблице выше, нельзя напрямую преобразовать в JSON:

```sql
mysql> SELECT CAST(MAKEDATE(2021, 1) AS JSON);
ERROR 1105 (HY000): CAST AS JSONB can only be performed between JSONB, String, Number, Boolean, Array, Struct types. Got Date to JSONB
```

Решение: сначала выполните преобразование в совместимый тип, затем в JSON:

```sql
mysql> SELECT CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON);
+---------------------------------------------------+
| CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON)   |
+---------------------------------------------------+
| 20210101                                          |
+---------------------------------------------------+
```

## Преобразование из JSON {#cast-from-json}

:::caution Изменение поведения
До версии 4.0 Doris предъявлял менее строгие требования к поведению CAST при работе с JSON и некорректно обрабатывал переполнение.

Начиная с версии 4.0, переполнение при выполнении CAST для JSON вызывает ошибку в строгом режиме или возвращает null в нестрогом режиме.
:::

### В Boolean {#to-boolean}

Типы Bool, Number и String в JSON можно преобразовать в BOOLEAN:

```sql
-- From JSON Bool
mysql> SELECT CAST(CAST('true' AS JSON) AS BOOLEAN);
+---------------------------------------+
| CAST(CAST('true' AS JSON) AS BOOLEAN) |
+---------------------------------------+
|                                     1 |
+---------------------------------------+

-- From JSON Number
mysql> SELECT CAST(CAST('123' AS JSON) AS BOOLEAN);
+--------------------------------------+
| CAST(CAST('123' AS JSON) AS BOOLEAN) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+

-- From JSON String (must contain valid boolean representation)
mysql> SELECT CAST(TO_JSON('true') AS BOOLEAN);
+----------------------------------+
| CAST(TO_JSON('true') AS BOOLEAN) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

### В числовые типы {#to-numeric-types}

Типы Bool, Number и String в JSON можно преобразовать в числовые типы (TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL):

```sql
-- From JSON Number to INT
mysql> SELECT CAST(CAST('123' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('123' AS JSON) AS INT) |
+----------------------------------+
|                              123 |
+----------------------------------+

-- From JSON Bool to numeric types
mysql> SELECT CAST(CAST('true' AS JSON) AS INT), CAST(CAST('false' AS JSON) AS DOUBLE);
+-----------------------------------+--------------------------------------+
| CAST(CAST('true' AS JSON) AS INT) | CAST(CAST('false' AS JSON) AS DOUBLE) |
+-----------------------------------+--------------------------------------+
|                                 1 |                                    0 |
+-----------------------------------+--------------------------------------+
```

При преобразовании в типы с меньшим диапазоном значений действуют правила обработки числового переполнения:

```sql
-- In strict mode, overflow causes error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
ERROR 1105 (HY000): Cannot cast from jsonb value type 12312312312312311 to doris type INT

-- In non-strict mode, overflow returns NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
+-----------------------------------------+
| CAST(TO_JSON(12312312312312311) AS INT) |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

### В String {#to-string}

Любой тип JSON можно преобразовать в STRING. Результатом будет текстовое представление JSON:

```sql
mysql> SELECT CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING);
+----------------------------------------------------------+
| CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING) |
+----------------------------------------------------------+
| {"key1":"value1","key2":123}                             |
+----------------------------------------------------------+

mysql> SELECT CAST(CAST('true' AS JSON) AS STRING);
+--------------------------------------+
| CAST(CAST('true' AS JSON) AS STRING) |
+--------------------------------------+
| true                                 |
+--------------------------------------+
```

### В Array {#to-array}

Типы Array и String в JSON можно преобразовать в типы ARRAY в Doris:

```sql
mysql> SELECT CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>);
+-------------------------------------------+
| CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>) |
+-------------------------------------------+
| [1, 2, 3]                                 |
+-------------------------------------------+

-- Type conversion within array elements
mysql> SELECT CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>);
+-------------------------------------------------+
| CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>) |
+-------------------------------------------------+
| [1, 2, 3]                                       |
+-------------------------------------------------+

-- Convert string to array
mysql> SELECT CAST(TO_JSON("['123','456']") AS ARRAY<INT>);
+----------------------------------------------+
| CAST(TO_JSON("['123','456']") AS ARRAY<INT>) |
+----------------------------------------------+
| [123, 456]                                   |
+----------------------------------------------+
```

Элементы массивов преобразуются по отдельности в соответствии со стандартными правилами преобразования типов:

```sql
-- In non-strict mode, invalid elements become NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
+---------------------------------------------------+
| CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>) |
+---------------------------------------------------+
| [10, 20, null]                                    |
+---------------------------------------------------+

-- In strict mode, invalid elements cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
ERROR 1105 (HY000): Cannot cast from jsonb value type 200 to doris type TINYINT
```

### В Struct {#to-struct}

Типы Object и String в JSON можно преобразовать в типы STRUCT в Doris:

```sql
mysql> SELECT CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>);
+------------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>) |
+------------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                   |
+------------------------------------------------------------------------------+

mysql> SELECT CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>);
+----------------------------------------------------------------------------+
| CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>) |
+----------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                 |
+----------------------------------------------------------------------------+
```

Поля структуры преобразуются по отдельности в соответствии с указанными типами:

```sql
mysql> SELECT CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>);
+--------------------------------------------------------------------------------------------------------------------------+
| CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>) |
+--------------------------------------------------------------------------------------------------------------------------+
| {"key1":[123.45, 678.9], "key2":[12312313]}                                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
```

Количество и имена полей в JSON должны совпадать с определением структуры:

```sql
-- In non-strict mode, mismatched fields return NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
+-------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>) |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

-- In strict mode, mismatched fields cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
ERROR 1105 (HY000): jsonb_value field size 2 is not equal to struct size 1
```

### Обработка null в JSON {#json-null-handling}

Значение null в JSON отличается от SQL NULL:

- Если поле JSON содержит значение null, при его преобразовании в любой тип Doris получается SQL NULL:

```sql
mysql> SELECT CAST(CAST('null' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('null' AS JSON) AS INT) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

## Сводка преобразований типов {#type-conversion-summary}

| Тип JSON | Можно преобразовать в |
|-----------|---------------|
| Bool | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| Null | (Всегда преобразуется в SQL NULL) |
| Number | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| String | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING, ARRAY, STRUCT |
| Array | STRING, ARRAY |
| Object | STRING, STRUCT |

### Ключевые слова {#keywords}
JSON, JSONB, CAST, преобразование, to_json
