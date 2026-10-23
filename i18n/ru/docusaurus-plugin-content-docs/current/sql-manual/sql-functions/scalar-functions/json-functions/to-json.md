---
{
    "title": "TO_JSON",
    "language": "ru",
    "description": "Преобразует внутренние типы данных Doris в тип JSONB. Эта функция позволяет преобразовывать совместимые типы данных Doris в представление JSON без "
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Описание {#description}

Преобразует внутренние типы данных Doris в тип JSONB. Эта функция позволяет преобразовывать совместимые типы данных Doris в представление JSON без потери точности.

## Синтаксис {#syntax}

```sql
TO_JSON(value)
```

## Параметры {#parameters}

**value** — значение для преобразования в тип JSONB.

Следующие типы напрямую соответствуют типам JSONB и могут быть преобразованы непосредственно:
- Числовые типы: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Логический тип: BOOLEAN
- Строковые типы: STRING, VARCHAR, CHAR
- Сложные типы: ARRAY, STRUCT

Кроме того, функция поддерживает преобразование следующих типов:
- Типы даты и времени: DATETIME, TIMESTAMP_NS, DATE, TIME
- Типы IP: IPV4, IPV6
- Сложные типы: MAP

Значения DATETIME, TIMESTAMP_NS, DATE, TIME, IPV4 и IPV6 преобразуются в строки JSONB, поскольку в JSONB нет соответствующих встроенных типов.
Для типа MAP результат преобразования имеет тип JSONB Object. Ключи Map должны иметь тип STRING, поскольку стандарт JSON требует, чтобы ключи Object были строками.

## Возвращаемое значение {#return-value}

Возвращает значение типа JSONB.

Если входное значение `value` равно SQL NULL, функция возвращает SQL NULL (а не значение JSON null). Значения NULL внутри массивов или структур преобразуются в значения JSON null.

## Примеры {#examples}

### Простые скалярные значения {#basic-scalar-values}

```sql
SELECT to_json(1), to_json(3.14), to_json("12345");
```

```text
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+
```

### Типы даты и времени {#date-types}

```sql
SELECT 
     to_json(cast('2020-01-01' as date)) , 
     to_json(cast('2020-01-01 12:00:00' as datetime)),
     to_json(cast('2020-01-01 12:00:00.123' as datetime(3))),
     to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))),
     to_json(cast('8:23:45' as time));
```

```text
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| to_json(cast('2020-01-01' as date)) | to_json(cast('2020-01-01 12:00:00' as datetime)) | to_json(cast('2020-01-01 12:00:00.123' as datetime(3))) | to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))) | to_json(cast('8:23:45' as time)) |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| "2020-01-01"                        | "2020-01-01 12:00:00"                            | "2020-01-01 12:00:00.123"                               | "2020-01-01 12:00:00.123456"                               | "08:23:45"                       |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
```

### Типы IP {#ip-types}

```sql
SELECT 
     to_json(cast('192.168.0.1' as ipv4)) , 
     to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6));
```

```text
+--------------------------------------+------------------------------------------------------------------+
| to_json(cast('192.168.0.1' as ipv4)) | to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6)) |
+--------------------------------------+------------------------------------------------------------------+
| "192.168.0.1"                        | "2001:db8:85a3::8a2e:370:7334"                                   |
+--------------------------------------+------------------------------------------------------------------+
```

### Преобразование массивов {#array-conversion}

```sql
SELECT to_json(array(array(1,2,3),array(4,5,6)));
```

```text
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+
```

```sql
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### Доступ к элементам массива в полученном JSON {#accessing-array-elements-in-resulting-json}

```sql
SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
```

```text
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+
```

### Преобразование структур {#struct-conversion}

```sql
SELECT to_json(struct(123,array(4,5,6),"789"));
```

```text
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+
```

### Доступ к свойствам объекта в полученном JSON {#accessing-object-properties-in-resulting-json}

```sql
SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
```

```text
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

### Преобразование MAP {#map-conversion}

```sql
SELECT to_json(map("1",2,"abc",3));  
```

```text
+-----------------------------+
| to_json(map("1",2,"abc",3)) |
+-----------------------------+
| {"1":2,"abc":3}             |
+-----------------------------+
```

```sql
SELECT to_json(map(1,2));  
```

```text
to_json only support map with string-like key type
```

### Обработка значений NULL {#handling-null-values}

```sql
-- SQL NULL as input returns SQL NULL
SELECT to_json(null);
```

```text
+---------------+
| to_json(null) |
+---------------+
| NULL          |
+---------------+
```

```sql
-- NULL values within arrays become JSON null values
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### Неподдерживаемые типы Doris {#unsupported-doris-types}

```sql
SELECT to_json(makedate(2025,5));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```

```sql
-- Convert to string first and then apply to_json
SELECT to_json(cast(makedate(2025,5) as string));
```

```text
+-------------------------------------------+
| to_json(cast(makedate(2025,5) as string)) |
+-------------------------------------------+
| "2025-01-05"                              |
+-------------------------------------------+
```

## Примечания {#notes}

1. Некоторые типы не имеют прямого соответствия в JSON (например, DATE). Значения этих типов нужно сначала преобразовать в STRING, а затем использовать `TO_JSON`.

2. При преобразовании внутренних типов Doris в JSONB с помощью `TO_JSON` точность не теряется, в отличие от преобразования через текстовое представление.

3. По умолчанию размер объектов JSONB в Doris ограничен 1,048,576 байт (1 MB). Это ограничение можно изменить с помощью параметра конфигурации BE `string_type_length_soft_limit_bytes`, увеличив его до 2,147,483,643 байт (приблизительно 2 GB).

4. Длина ключей в объектах JSON в Doris не может превышать 255 байт.
