---
{
    "title": "ST_POLYGON",
    "language": "ru",
    "description": "Преобразует строку в формате WKT (Well-Known Text) в геометрический объект Polygon, хранящийся в памяти."
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

Преобразует строку в формате WKT (Well-Known Text) в геометрический объект Polygon, хранящийся в памяти.

## Псевдонимы {#alias}

- st_polygonfromtext
- st_polyfromtext

## Синтаксис {#syntax}

```sql
ST_POLYGON( <wkt>)
```

## Параметры {#parameters}

| Параметр   | Описание                 |
|------|--------------------|
| `<wkt>` | Текст WKT для многоугольника, созданного функцией POLYGON |

## Возвращаемое значение {#return-value}

Возвращает геометрический объект типа Polygon, который хранится в памяти во внутреннем формате пространственных данных Doris и может напрямую передаваться в качестве параметра другим пространственным функциям (например, ST_AREA, ST_CONTAINS и т. д.) для выполнения вычислений.

- Возвращает NULL, если входная строка WKT некорректна (например, содержит незамкнутое кольцо или синтаксическую ошибку).
- Возвращает NULL, если входное значение <wkt> равно NULL или является пустой строкой.

## Пример {#example}

Простой многоугольник
```sql
SELECT ST_AsText(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+------------------------------------------------------------------+
| st_astext(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                          |
+------------------------------------------------------------------+
```

Самопересекающийся многоугольник (недопустимый)

```sql
mysql> select st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))');
+---------------------------------------------------+
| st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))') |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+
```

Некорректный WKT (незамкнутое кольцо)

```sql
mysql> SELECT ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))");
+--------------------------------------------------+
| ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))") |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```

Некорректный WKT (синтаксическая ошибка)

```sql

mysql> SELECT ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)");
+-----------------------------------------------------+
| ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)") |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+
```

Входное значение NULL

```sql
mysql> SELECT ST_Polygon(NULL);
+------------------+
| ST_Polygon(NULL) |
+------------------+
| NULL             |
+------------------+
```
