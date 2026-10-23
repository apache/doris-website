---
title: Инструмент для тестирования производительности слоя хранения BE
language: ru
description: Инструмент Apache Doris для тестирования слоя хранения BE, чтения и записи сегментов и измерения производительности.
keywords:
    - Apache Doris
    - BE storage layer
    - Benchmark
    - Segment
    - Page
    - Dictionary encoding
    - google benchmark
    - CustomBenchmark
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

# Инструмент для тестирования производительности слоя хранения BE {#be-storage-layer-benchmark-tool}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Storage layer benchmarking -->

## Назначение {#purpose}

`benchmark_tool` тестирует производительность слоя хранения BE в Apache Doris (например, `segment` и `page`). Он создаёт заданные объекты из входных данных и выполняет тесты производительности с помощью [google benchmark](https://github.com/google/benchmark).

## Сборка {#compilation}

1. Убедитесь, что у вас настроено окружение, позволяющее собрать сам Doris. Подробнее см. в разделе [Сборка и развёртывание](/community/source-install/compilation-with-docker).
2. Запустите `run-be-ut.sh` в репозитории Doris.
3. Собранный исполняемый файл находится по пути `./be/ut_build_ASAN/test/tools/benchmark_tool`.

## Использование {#usage}

### Общие параметры {#common-parameters}

| Параметр | Назначение | По умолчанию |
|------|------|--------|
| `--operation` | Тип теста. Подробности см. в сценариях ниже. | Нет (обязательный параметр) |
| `--column_type` | Типы столбцов в схеме таблицы сегмента. Поддерживаются `int`, `char`, `varchar`, `string`. | `int,varchar` |
| `--rows_number` | Количество строк данных. | `10000` |
| `--iterations` | Количество итераций теста. При значении `0` benchmark выбирает их число автоматически. | `10` |
| `--input_file` | Путь к файлу данных при импорте из файла. | Нет |

Принятые ограничения длины типов:

| Тип | Длина |
|------|------|
| `char` | `8` |
| `varchar` | Максимальное значение |
| `string` | Максимальное значение |

Правила генерации случайного набора данных:

| Тип | Правило |
|------|------|
| `int` | Случайное значение в диапазоне `[1, 1000000]` |
| `char` | Случайная длина в диапазоне `[1, 8]`, набор символов: прописные и строчные латинские буквы |
| `varchar` | Случайная длина в диапазоне `[1, 128]`, набор символов: прописные и строчные латинские буквы |
| `string` | Случайная длина в диапазоне `[1, 100000]`, набор символов: прописные и строчные латинские буквы |

### Обзор сценариев тестирования {#test-scenarios-at-a-glance}

| Сценарий | Команда |
|------|------|
| Тест чтения сегмента со случайным набором данных | `./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0` |
| Тест записи сегмента со случайным набором данных | `./benchmark_tool --operation=SegmentWrite` |
| Тест чтения сегмента с набором данных, импортированным из файла | `./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat` |
| Тест записи сегмента с набором данных, импортированным из файла | `./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat` |
| Тест словарного кодирования страницы со случайным набором данных | `./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0` |
| Тест словарного декодирования страницы со случайным набором данных | `./benchmark_tool --operation=BinaryDictPageDecode` |

### Тест чтения сегмента со случайно сгенерированным набором данных {#segment-read-test-with-a-randomly-generated-dataset}

Сначала записывает файл `segment`, используя набор данных, а затем измеряет время полного сканирования `segment`.

```bash
./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0
```

### Тест записи сегмента со случайно сгенерированным набором данных {#segment-write-test-with-a-randomly-generated-dataset}

Измеряет время добавления набора данных в `segment` и записи на диск.

```bash
./benchmark_tool --operation=SegmentWrite
```

### Тест чтения сегмента с набором данных, импортированным из файла {#segment-read-test-with-a-dataset-imported-from-a-file}

```bash
./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat
```

`input_file` задаёт файл с импортируемым набором данных. Первая строка файла определяет схему таблицы, а каждая последующая строка соответствует одной строке данных со столбцами, разделёнными `,`:

```text
int,char,varchar
123,hello,world
321,good,bye
```

Здесь также поддерживаются типы `int`, `char`, `varchar` и `string`. Обратите внимание: длина данных типа `char` не должна превышать `8`.

### Тест записи сегмента с набором данных, импортированным из файла {#segment-write-test-with-a-dataset-imported-from-a-file}

```bash
./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat
```

### Тест словарного кодирования страницы со случайно сгенерированным набором данных {#page-dictionary-encoding-test-with-a-randomly-generated-dataset}

```bash
./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0
```

Генерирует случайные значения `varchar` с длиной в диапазоне `[1, 8]` и измеряет время кодирования.

### Тест словарного декодирования страницы со случайно сгенерированным набором данных {#page-dictionary-decoding-test-with-a-randomly-generated-dataset}

```bash
./benchmark_tool --operation=BinaryDictPageDecode
```

Генерирует случайные значения `varchar` с длиной в диапазоне `[1, 8]`, кодирует их и измеряет время декодирования.

## Пользовательские тесты {#custom-tests}

Вы можете тестировать производительность собственных функций. Реализация находится в `/be/test/tools/benchmark_tool.cpp`.

### 1. Напишите тестовую функцию {#1-write-the-test-function}

```cpp
void custom_run_plus() {
    int p = 100000;
    int q = 0;
    while (p--) {
        q++;
        if (UNLIKELY(q == 1024)) q = 0;
    }
}
void custom_run_mod() {
    int p = 100000;
    int q = 0;
    while (p--) {
        q++;
        if (q %= 1024) q = 0;
    }
}
```

### 2. Зарегистрируйте CustomBenchmark {#2-register-custombenchmark}

```cpp
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_plus", 0,
                        custom_init, custom_run_plus));
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_mod", 0,
                        custom_init, custom_run_mod));
```

Здесь `init` выполняет инициализацию перед каждым раундом тестирования (её время не учитывается при измерении). Если требуется инициализировать объекты, реализуйте это в классе, производном от `CustomBenchmark`.

### 3. Пример вывода при запуске {#3-example-run-output}

```text
2021-08-30T10:29:35+08:00
Running ./benchmark_tool
Run on (96 X 3100.75 MHz CPU s)
CPU Caches:
  L1 Data 32 KiB (x48)
  L1 Instruction 32 KiB (x48)
  L2 Unified 1024 KiB (x48)
  L3 Unified 33792 KiB (x2)
Load Average: 0.55, 0.53, 0.39
----------------------------------------------------------
Benchmark                Time             CPU   Iterations
----------------------------------------------------------
custom_run_plus      0.812 ms        0.812 ms          861
custom_run_mod        1.30 ms         1.30 ms          539
```

## Часто задаваемые вопросы {#faq}

**Вопрос: Не удаётся найти исполняемый файл `benchmark_tool`?**

Сначала запустите `run-be-ut.sh`, чтобы полностью собрать модульные тесты BE. Исполняемый файл будет создан по пути `./be/ut_build_ASAN/test/tools/benchmark_tool`.

**Вопрос: Результат пользовательского теста не соответствует ожиданиям?**

Убедитесь, что `custom_init` не содержит логику тестируемой функции, а тело каждой функции `custom_run_*` достаточно велико, чтобы оптимизатор не исключил её из кода.
