---
{
    "title": "REGEXP_COUNT",
    "language": "ru",
    "description": "Функция подсчитывает количество символов в строке, соответствующих заданному шаблону регулярного выражения."
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
Функция подсчитывает количество символов в строке, соответствующих заданному шаблону регулярного выражения. На вход подаются заданная пользователем строка и шаблон регулярного выражения. Возвращается общее количество совпадающих символов; если совпадений нет, возвращается 0.

Параметр 'str' имеет тип 'string' и содержит строку, которую пользователь хочет сопоставить с регулярным выражением.

Параметр 'pattern' имеет тип 'string' и содержит регулярное выражение, которое будет использоваться для сопоставления со строкой;

При сопоставлении наборов символов следует использовать стандартные классы символов Utf-8. Это позволяет функциям корректно распознавать и обрабатывать различные символы из разных языков.

Поддерживаемые классы символов: https://github.com/google/re2/wiki/Syntax

## Синтаксис {#syntax}

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<str>` | Параметр имеет тип 'string' и содержит строку, сопоставляемую с регулярным выражением. |
| `<pattern>` | Параметр имеет тип 'string' и содержит регулярное выражение, используемое для поиска совпадений в строке. |
## Возвращаемое значение {#return-value}

- Возвращает количество совпадений с регулярным выражением 'pattern' в строке 'str'; тип результата 'int'. Если совпадающих символов нет, возвращает 0;
Если pattern имеет значение NULL, str имеет значение NULL или оба имеют значение NULL, возвращает NULL;
Если pattern содержит недопустимое регулярное выражение, возникает ошибка;

## Примеры {#examples}

Результат сопоставления строки с выражением, содержащим экранированные символы.

```sql
SELECT regexp_count('a.b:c;d', '[\\\\.:;]');
```

```text
+--------------------------------------+
| regexp_count('a.b:c;d', '[\\\\.:;]') |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```

Результат сопоставления строки с регулярным выражением для обычного символа ':'.

```sql
SELECT regexp_count('a.b:c;d', ':');
```

```text
+------------------------------+
| regexp_count('a.b:c;d', ':') |
+------------------------------+
|                            1 |
+------------------------------+
```
Результат сопоставления строки с регулярным выражением, содержащим две квадратные скобки.

```sql
SELECT regexp_count('Hello, World!', '[[:punct:]]');
```

```text
+----------------------------------------------+
| regexp_count('Hello, World!', '[[:punct:]]') |
+----------------------------------------------+
|                                            2 |
+----------------------------------------------+
```


Случай, когда pattern имеет значение NULL

```sql
SELECT regexp_count("abc",NULL);
```
```text
+------------------------+
| regexp_count("abc",NULL) |
+------------------------+
|                   NULL |
+------------------------+
```


Случай, когда str имеет значение NULL

```sql
SELECT regexp_count(NULL,"abc");
```
```text
+------------------------+
| regexp_count(NULL,"abc") |
+------------------------+
|                   NULL |
+------------------------+
```

Оба параметра имеют значение NULL


```sql
SELECT regexp_count(NULL,NULL);
```
```text
+------------------------+
| regexp_count(NULL,NULL) |
+------------------------+
|                   NULL |
+------------------------+
```

Результат сопоставления значений после их вставки в таблицу и последующего чтения из сохранённых строк.

```sql

CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, pattern) as count_result FROM test_table_for_regexp_count ORDER BY id;

```

```text
+------+--------------+
| id   | count_result |
+------+--------------+
|    1 |            2 |
|    2 |            1 |
|    3 |            3 |
|    4 |            3 |
|    5 |            1 |
|    6 |            3 |
|    7 |            2 |
|    8 |            1 |
|    9 |            3 |
|   10 |            2 |
+------+--------------+

```
Результат сопоставления значений после их вставки в таблицу и последующего чтения из сохранённых строк, когда регулярное выражение задано константой.

```sql
CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, 'e') as count_e FROM test_table_for_regexp_count WHERE text_data IS NOT NULL ORDER BY id;
```

```text
+------+---------+
| id   | count_e |
+------+---------+
|    1 |       1 |
|    2 |       1 |
|    3 |       0 |
|    4 |       0 |
|    5 |       1 |
|    6 |       0 |
|    7 |       3 |
|    8 |       0 |
|    9 |       0 |
|   10 |       1 |
+------+---------+
```

Подсчёт совпадений с регулярным выражением для эмодзи

```sql
SELECT regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕');
```

```text
+----------------------------------------------------+
| regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕')                             |
+----------------------------------------------------+
|                                                  3 |
+----------------------------------------------------+
```

Если 'pattern' содержит недопустимое регулярное выражение, возникает ошибка

```sql

SELECT regexp_count('Hello, World!', '[[:punct:');
```

```text

ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: [[:punct:
Error: missing ]: [[:punct:
```
