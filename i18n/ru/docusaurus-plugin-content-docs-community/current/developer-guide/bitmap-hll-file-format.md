---
title: Спецификация двоичного формата Bitmap и HLL
language: ru
description: Спецификация двоичного формата Bitmap и HLL в Apache Doris, значения флагов и примеры сериализации на C++ / Java.
keywords:
    - формат Apache Doris Bitmap
    - сериализация HLL
    - Roaring Bitmap
    - Roaring64Map
    - Roaring64NavigableMap
    - HyperLogLog
    - сериализация BitmapValue
    - спецификация двоичного формата
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

<!-- Knowledge type: Data format specification -->
<!-- Applicable scenarios: Kernel development / data parsing / cross-language serialization -->

# Формат данных Bitmap и HLL {#bitmap-and-hll-data-format}

Этот документ предназначен для разработчиков, которым необходимо разобраться в двоичном формате Bitmap / HLL в Apache Doris или реализовать его разбор. В нём описаны побайтовая структура и значения флагов для каждого типа, а также указаны точки входа сериализации / десериализации в C++ и Java.

## Содержание {#contents}

- [Формат Bitmap](#bitmap-format): пять типов флагов и их побайтовая структура
- [Формат HLL](#hll-format): четыре типа флагов и их побайтовая структура
- [Точки входа сериализации / десериализации](#serialization--deserialization-entry-points): расположение реализаций на C++ и Java

---

## Формат Bitmap {#bitmap-format}

### Обзор {#overview}

Doris хранит Bitmap с помощью Roaring Bitmap. На стороне BE используется CRoaring.

- Формат сериализации `Roaring` совместим между C++, Java, Go и другими языками.
- Результат сериализации `Roaring64Map` в C++ **несовместим** с `Roaring64NavigableMap` в Java.

Всего в Doris существует пять типов Bitmap. Каждый тип обозначается однобайтовым полем `flag`. Общая структура байтов:

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Значения флагов {#flag-values}

| Флаг | Имя | Структура данных | Описание типа |
|------|------|-------------|------------------|
| 0 | `EMPTY` | Данных нет. Весь результат сериализации занимает один байт. | Пустой Bitmap |
| 1 | `SINGLE32` | 4 байта, представляющие одно 32-разрядное беззнаковое целое число. | Bitmap содержит одно 32-разрядное целочисленное значение. |
| 2 | `BITMAP32` | Результат сериализации `roaring::Roaring`. | 32-разрядный Bitmap. В Java ему соответствует `org.roaringbitmap.RoaringBitmap`, а в C++ соответствует `roaring::Roaring`. Для десериализации можно напрямую использовать эти типы. |
| 3 | `SINGLE64` | 8 байт, представляющих одно 64-разрядное беззнаковое целое число. | Bitmap содержит одно 64-разрядное целочисленное значение. |
| 4 | `BITMAP64` | Закодированное с переменной длиной от 1 до 8 байт значение `uint64`, представляющее размер Bitmap, за которым следуют повторяющиеся записи `[4-byte high bits + 32-bit Roaring Bitmap serialization data]`. | 64-разрядный Bitmap. В Java ему соответствует `org.roaringbitmap.RoaringBitmap`, а в C++ соответствует `Roaring64Map` из Doris. Структура данных совпадает со структурой в библиотеке Roaring, но методы сериализации / десериализации различаются. |
| 5 | `SET` | 1 байт, содержащий количество значений, за которым следуют все значения (по 8 байт на значение). | Если Bitmap содержит от 1 до 32 значений, для хранения фактически используется hashset. |

---

## Формат HLL {#hll-format}

### Обзор {#overview-1}

Формат сериализации HLL реализован в Doris. Как и у Bitmap, двоичная структура HLL состоит из однобайтового поля `flag` и следующих за ним многобайтовых данных:

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Значения флагов {#flag-values-1}

| Флаг | Имя | Структура данных | Описание типа |
|------|------|-------------|------------------|
| 0 | `HLL_DATA_EMPTY` | Данных нет. Весь результат сериализации занимает один байт. | Пустой HLL |
| 1 | `HLL_DATA_EXPLICIT` | 1 байт для количества явно сохранённых блоков данных, за которым следуют сами блоки. Каждый блок данных состоит из поля длины размером 8 байт и данных. | Явно хранит все уникальные значения. |
| 2 | `HLL_DATA_SPARSE` | 4 байта для количества регистров, за которыми следуют сами регистры. Каждый регистр состоит из индекса размером 2 байта и значения размером 1 байт. | Разреженное хранение. Сохраняются только ненулевые значения. |
| 3 | `HLL_DATA_FULL` | Непрерывный блок данных значений размером `16 * 1024` байт. | Означает, что все `16 * 1024` регистров содержат значения. |

---

## Точки входа сериализации / десериализации {#serialization--deserialization-entry-points}

<!-- Knowledge type: Code index -->

| Тип | Язык | Файл | Метод |
|------|----------|------|--------|
| Bitmap | C++ | `be/src/util/bitmap_value.h` | `BitmapValue::write()` / `BitmapValue::deserialize()` |
| Bitmap | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/BitmapValue.java` | `serialize()` / `deserialize()` |
| HLL | C++ | `be/src/olap/hll.h` | `serialize()` / `deserialize()` |
| HLL | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/hll.java` | `serialize()` / `deserialize()` |

---

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

**Вопрос: Почему 64-разрядный Bitmap, записанный на стороне C++, нельзя десериализовать с помощью `Roaring64NavigableMap` из Java?**

Ответ: Формат сериализации `Roaring64Map` в реализации Doris на C++ несовместим с `Roaring64NavigableMap` из Java. При обмене 64-разрядными Bitmap между языками используйте формат, определённый самим Doris Bitmap (`BITMAP64`, флаг = 4), и разбирайте его согласно приведённой выше побайтовой структуре.

**Вопрос: Как определить, является ли фрагмент двоичных данных Bitmap 32-разрядным или 64-разрядным?**

Ответ: Прочитайте первый байт как флаг: `0/1/2` указывает на 32-разрядную семантику (пустой Bitmap / единственное значение / Roaring32), `3/4` указывает на 64-разрядную семантику, а `5` указывает на hashset (с 64-разрядными значениями).

**Вопрос: Почему общее количество регистров HLL равно `16 * 1024`?**

Ответ: В реализации HLL в Doris используется фиксированное число регистров, равное 16384 (точность `2^14`). `HLL_DATA_FULL` представляет собой плотное представление, в котором все регистры содержат значения.
