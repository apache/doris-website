---
title: Инструменты отладки FE/BE
language: ru
description: "Основные инструменты отладки FE/BE в Apache Doris: мониторинг JVM, анализ памяти и методы отладки BE."
keywords:
    - Apache Doris
    - отладка FE
    - отладка BE
    - jmap
    - jstat
    - jstack
    - Jemalloc
    - TCMalloc
    - Heap Profile
    - ASAN
    - LSAN
    - perf
    - FlameGraph
    - утечка памяти
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

# Инструменты отладки FE/BE {#febe-debug-tools}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

При разработке и эксплуатации Apache Doris часто возникает необходимость отлаживать процессы FE и BE. В этом документе описаны основные инструменты для мониторинга JVM, анализа памяти кучи, построения флейм-графов CPU и проверки корректности работы с памятью.

> Примечание: исполняемый файл BE `doris_be`, упоминаемый в этом документе, в более ранних версиях назывался `palo_be`.

## Краткий справочник инструментов {#tool-quick-reference}

| Категория | Инструмент | Применимый процесс | Основное назначение |
|------|------|---------|---------|
| Мониторинг JVM | `jmap` / `jstat` / `jstack` | FE | Анализ памяти объектов, GC и стеков потоков |
| Heap Profile | Jemalloc + `jeprof` | BE | Запись выделений памяти в куче в реальном времени или периодически |
| Heap Profile | TCMalloc + `pprof` | BE (более ранние версии) | Выборочное профилирование памяти кучи и удалённый анализ |
| Корректность работы с памятью | LSAN / ASAN | BE | Обнаружение утечек памяти и недопустимых обращений |
| Анализ CPU | `pprof` / `perf + FlameGraph` | BE | Анализ потребления CPU на уровне функций и построение флейм-графов |

## Отладка FE {#fe-debugging}

FE представляет собой процесс Java, поэтому для его отладки можно использовать команды из JDK.

### 1. Просмотр подробных сведений о текущем использовании памяти {#1-show-current-memory-usage-details}

```bash
jmap -histo:live pid > 1.jmp
```

Замените `pid` идентификатором процесса FE. Эта команда выводит отсортированный список объёмов памяти, занимаемых живыми объектами. Общий объём использования памяти указан в конце файла.

Пример вывода:

```text
 num     #instances         #bytes  class name
----------------------------------------------
   1:         33528       10822024  [B
   2:         80106        8662200  [C
   3:           143        4688112  [Ljava.util.concurrent.ForkJoinTask;
   4:         80563        1933512  java.lang.String
   5:         15295        1714968  java.lang.Class
   6:         45546        1457472  java.util.concurrent.ConcurrentHashMap$Node
   7:         15483        1057416  [Ljava.lang.Object;
```

> Примечание: передача параметра `:live` запускает FullGC, поэтому используйте его с осторожностью в рабочей среде.

### 2. Проверка использования памяти JVM {#2-inspect-jvm-memory-usage}

```bash
jstat -gcutil pid 1000 1000
```

Замените `pid` идентификатором процесса FE. Эта команда проверяет использование памяти в каждой области JVM раз в секунду.

Пример вывода:

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

Следите за процентом заполнения поколения Old (O). При слишком высоком значении возможны OOM или FullGC.

### 3. Вывод стеков потоков FE {#3-print-fe-thread-stacks}

```bash
jstack -l pid > 1.js
```

Замените `pid` идентификатором процесса FE. Параметр `-l` также включает проверку на взаимные блокировки. С помощью этой команды можно исследовать блокировки потоков FE, взаимные блокировки, функции с высокой нагрузкой и подобные проблемы.

## Отладка памяти BE {#be-memory-debugging}

При отладке памяти BE основное внимание уделяется двум категориям проблем:

1. **Обоснованность использования памяти**: чрезмерное потребление может указывать на утечку памяти или её неправильное использование.
2. **Корректность обращений к памяти**: наличие обращений за границы выделенной области, обращений к неинициализированной памяти и других подобных ошибок.

### Doris Debug Tools {#doris-debug-tools}

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) предоставляет готовый набор инструментов для построения флейм-графов CPU и анализа памяти. Страница загрузки: [Выпуски](https://github.com/morningman/doris-debug-tools/releases).

> Примечание: это неофициальный инструмент, предназначенный только для отладки при разработке.

### Heap Profile в Jemalloc {#jemalloc-heap-profile}

> Примечание: начиная с версии 1.2.2, Apache Doris использует Jemalloc в качестве аллокатора памяти по умолчанию.

Принципы работы Heap Profile описаны в статье [Объяснение принципов профилирования кучи](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/). Обратите внимание: Heap Profile учитывает виртуальную память.

Jemalloc поддерживает создание Heap Dump как в реальном времени, так и периодически. Полученный Heap Profile затем анализируется с помощью инструмента `jeprof`.

#### 1. Heap Dump в реальном времени (для анализа используемой памяти) {#1-real-time-heap-dump-for-analyzing-live-memory}

Порядок действий:

1. Измените `JEMALLOC_CONF` в `be.conf`:

    - Замените `prof:false` на `prof:true`
    - Замените `prof_active:false` на `prof_active:true`

2. Перезапустите Doris BE.

3. Вызовите HTTP-интерфейс на машине BE, чтобы создать файл Heap Profile:

    ```bash
    curl http://be_host:be_webport/jeheap/dump
    ```

Особенности версий:

| Версия Doris | Поведение |
|-----------|------|
| 2.1.8 / 3.0.4 и новее | `prof` в `JEMALLOC_CONF` по умолчанию имеет значение `true`; изменения не требуются |
| До 2.1.8 / 3.0.4 | В `JEMALLOC_CONF` нет параметра `prof_active`; достаточно заменить `prof:false` на `prof:true` |

Основные параметры:

| Параметр | Описание | Значение по умолчанию |
|--------|------|--------|
| `jeprofile_dir` | Каталог для сохранения Heap Profile | `${DORIS_HOME}/log` |
| `lg_prof_sample` | Интервал выборки (`2^N` байт) | `19` (то есть 512KB) |

Уменьшение `lg_prof_sample` позволяет Heap Profile точнее отражать фактическое использование памяти, но увеличивает накладные расходы. При выборке по умолчанию учитывается лишь около 10% памяти, а влияние на производительность обычно составляет менее 10%.

> Рекомендация по производительности: при тестировании производительности оставляйте `prof:false`, чтобы избежать накладных расходов на Heap Dump.

#### 2. Периодический Heap Dump (для длительного наблюдения за памятью) {#2-periodic-heap-dump-for-long-term-memory-observation}

Замените `prof:false` на `prof:true` в параметре `JEMALLOC_CONF` файла `be.conf`. По умолчанию файлы Heap Profile сохраняются в `${DORIS_HOME}/log`, а их имена начинаются с префикса `JEMALLOC_PROF_PRFIX` (по умолчанию `jemalloc_heap_profile_`).

> Примечание: в версиях Doris до 2.1.6 значение `JEMALLOC_PROF_PRFIX` пустое, поэтому для него нужно задать любое значение в качестве имени файла профиля.

Условия создания дампа:

| Условие | Параметр | Описание |
|---------|------|------|
| Суммарный объём выделенной памяти достигает порога | `lg_prof_interval=34` | Дамп создаётся на каждые 16GB (`2^34 B`) суммарно выделенной памяти; до версии 2.1.6 значение по умолчанию было `32` |
| Использование памяти достигает нового максимума | `prof_gdump=true` | После изменения перезапустите BE |
| Завершение программы и обнаружение утечек | `prof_leak=true`, `prof_final=true` | После изменения перезапустите BE |
| Запись накопленного значения (прироста) | `prof_accum=true` | Для отображения накопленного значения используйте `jeprof --alloc_space` |

#### 3. Анализ Heap Profile с помощью jeprof {#3-parse-heap-profile-with-jeprof}

Для анализа сохранённого Heap Profile используйте `be/bin/jeprof`. Если процесс занимает большой объём памяти, анализ может занять несколько минут.

Если исполняемый файл `jeprof` отсутствует в каталоге `be/bin`, можно упаковать и загрузить на сервер `jeprof` из каталога `doris/tools`.

> Примечания:
> - Требуется `addr2line` версии 2.35.2 или новее. Подробнее см. QA-1 ниже.
> - По возможности создавайте Heap Dump и выполняйте анализ с помощью `jeprof` на той же машине, где работает Doris BE. Подробнее см. QA-2 ниже.

**(1) Анализ одного файла Heap Profile**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

Вставьте текстовый вывод терминала на [сайт для визуализации dot](http://www.webgraphviz.com/), чтобы построить граф связей выделения памяти.

Если сервер позволяет передавать файлы, можно сразу создать PDF:

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

После установки [graphviz](http://www.graphviz.org/) инструмент `pprof` сможет выводить данные в более удобных для просмотра форматах, например SVG и PDF.

**(2) Анализ различий между двумя файлами Heap Profile**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

Сравнивая Heap Profile, полученные в более ранний и более поздний моменты времени, можно определить, где за этот промежуток была дополнительно выделена память.

#### 4. Часто задаваемые вопросы (QA) {#4-frequently-asked-questions-qa}

**QA-1: При запуске `jeprof` возникает множество ошибок `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx`**

Причина: начиная с GCC 11 по умолчанию используется DWARF-v5, для которого требуется Binutils 2.35.2 или новее. В Doris LDB-toolchain используется GCC 11. См. [Изменения в GCC 11](https://gcc.gnu.org/gcc-11/changes.html).

Решение: обновите `addr2line` до версии 2.35.2.

```bash
# Download the addr2line source code
wget https://ftp.gnu.org/gnu/binutils/binutils-2.35.tar.bz2

# Install dependencies (if needed)
yum install make gcc gcc-c++ binutils

# Compile & install addr2line
tar -xvf binutils-2.35.tar.bz2
cd binutils-2.35
./configure --prefix=/usr/local
make
make install

# Verify
addr2line -h

# Replace addr2line
chmod +x addr2line
mv /usr/bin/addr2line /usr/bin/addr2line.bak
mv /bin/addr2line /bin/addr2line.bak
cp addr2line /bin/addr2line
cp addr2line /usr/bin/addr2line
hash -r
```

> Примечание: не используйте `addr2line 2.3.9`. Эта версия может быть несовместимой и вызывать непрерывный рост потребления памяти.

**QA-2: При запуске `jeprof` выдаётся ошибка `addr2line: DWARF error: invalid or unhandled FORM value: 0x25`, а в стеке вместо имён функций отображаются адреса памяти**

Причина: обычно это происходит, когда Heap Dump и `jeprof` запускаются на разных серверах, из-за чего `jeprof` не может разобрать таблицу символов.

Решения:

- По возможности создавайте Heap Dump и выполняйте анализ с помощью `jeprof` на одной машине.
- Либо проверьте версию ядра Linux на машине, где работает Doris BE, скачайте `be/bin/doris_be` и файл Heap Profile на машину с той же версией ядра и запустите `jeprof` там.

**QA-3: Даже после анализа на той же машине, где работает Doris BE, в стеке по-прежнему отображаются адреса памяти**

Для ручного анализа Heap Profile используйте приведённый ниже скрипт. Измените следующие переменные:

- `heap`: имя файла Heap Profile.
- `bin`: имя исполняемого файла `be/bin/doris_be`.
- `llvm_symbolizer`: путь к анализатору таблицы символов llvm, желательно той же версии, которая использовалась при компиляции исполняемого файла `be/bin/doris_be`.

```bash
#!/bin/bash
## @brief
## @author zhoufei
## @email  gavineaglechou@gmail.com
## @date   2024-02-24-Sat

# 1. jeprof --dot ${bin} ${heap} > heap.dot to generate calling profile
# 2. find base addr and symbol
# 3. get addr to symble table with llvm-symbolizer
# 4. replace the addr with symbol

# heap file name
heap=jeheap_dump.1708694081.3443.945778264.heap
# binary name
bin=doris_be_aws.3.0.5
# path to llvm symbolizer
llvm_symbolizer=$HOME/opt/ldb-toolchain-16/bin/llvm-symbolizer
# output file name
out=out.dot
vaddr_baddr_symbol=vaddr_baddr_symbol.txt
program_name=doris_be

jeprof --dot ${bin} ${heap} > ${out}

baseaddr=$(grep ${program_name} ${heap} | head -n 1 | awk -F'-' '{print $1}')
echo "$baseaddr: ${baseaddr}"

function find_symbol() {
  local addr="$1"
  "${llvm_symbolizer}" --inlining --obj=${bin} ${addr} | head -n 1 | awk -F'(' '{print $1}'
}

if [ -f ${vaddr_baddr_symbol} ]; then
  cat ${vaddr_baddr_symbol} | while read vaddr baddr; do
    symbol=$(find_symbol ${baddr})
    echo "${vaddr} ${baddr} ${symbol}"
    sed -ri.orig "s/${vaddr}/${symbol}/g" ${out}
  done
else # recalculate the addr and
  grep -oP '0x(\d|[a-f])+' ${out} | xargs -I {} python -c "print('{}', '0x{:x}'.format({} - 0x${baseaddr}))" \
    | while read vaddr baddr; do
    symbol=$(find_symbol ${baddr})
    echo "${vaddr} ${baddr} ${symbol}"
    sed -ri.orig "s/${vaddr}/${symbol}/g" ${out}
  done | tee ${vaddr_baddr_symbol}
fi

# vim: et tw=80 ts=2 sw=2 cc=80:
```

**QA-4: Ни один из описанных выше способов не помогает**

- Попробуйте перекомпилировать исполняемый файл `be/bin/doris_be` на машине, где работает Doris BE, чтобы компиляция, выполнение и анализ с помощью `jeprof` происходили на одной машине.
- Если это не помогло, попробуйте собрать BE с TCMalloc командой `USE_JEMALLOC=OFF ./build.sh --be`, а затем проанализируйте память по инструкциям из раздела о Heap Profile в TCMalloc ниже.

### Heap Profile в TCMalloc {#tcmalloc-heap-profile}

> Примечание: Apache Doris 1.2.1 и более ранние версии используют TCMalloc; начиная с 1.2.2 по умолчанию используется Jemalloc. Чтобы вернуться к TCMalloc, выполните сборку командой `USE_JEMALLOC=OFF sh build.sh --be`.

При использовании TCMalloc большие выделения памяти приводят к выводу стека в `be.out` в следующем виде:

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

Это означает, что BE попытался выделить `1396277248 bytes` памяти по этому стеку вызовов. Используйте `addr2line`, чтобы восстановить читаемый стек:

```bash
addr2line -e lib/doris_be 0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

Пример вывода:

```text
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

Когда множество небольших выделений накапливается и увеличивает общее потребление памяти, определить источник проблемы по одной строке журнала невозможно. В этом случае включите функцию [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) в TCMalloc, задав переменную окружения `HEAPPROFILE` перед запуском BE:

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> Примечание: `HEAPPROFILE` должен содержать абсолютный путь, а указанный каталог должен уже существовать.

Проанализируйте результат с помощью `pprof`:

```bash
pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30
```

Пример вывода:

```text
Using local file lib/doris_be.
Using local file /tmp/doris_be.hprof.0012.heap.
Total: 668.6 MB
   610.6  91.3%  91.3%    610.6  91.3% doris::SystemAllocator::allocate_via_malloc (inline)
    18.1   2.7%  94.0%     18.1   2.7% _objalloc_alloc
     5.6   0.8%  94.9%     63.4   9.5% doris::RowBatch::RowBatch
     5.1   0.8%  95.6%      7.1   1.1% butil::ResourcePool::add_block (inline)
     3.7   0.5%  96.2%      3.7   0.5% butil::iobuf::create_block (inline)
     3.4   0.5%  96.7%      3.4   0.5% butil::FlatMap::init
     3.2   0.5%  97.2%      5.2   0.8% butil::ObjectPool::add_block (inline)
     2.6   0.4%  97.6%      2.6   0.4% __gnu_cxx::new_allocator::allocate (inline)
     2.0   0.3%  97.9%      2.0   0.3% butil::ObjectPool::add_block_group (inline)
     2.0   0.3%  98.2%      2.0   0.3% butil::ResourcePool::add_block_group (inline)
     1.7   0.3%  98.4%      1.7   0.3% doris::SegmentReader::_load_index
```

Значение столбцов:

| Столбец | Значение |
|----|------|
| Столбец 1 | Память, выделенная непосредственно функцией (MB) |
| Столбец 2 | Процентная доля для столбца 1 |
| Столбец 3 | Накопленное значение столбца 2 |
| Столбец 4 | Общий объём памяти, используемой функцией и всеми вызываемыми ею функциями (MB) |
| Столбец 5 | Процентная доля для столбца 4 |

Создайте граф вызовов в формате SVG:

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

> Рекомендация по производительности: включение этой возможности влияет на производительность программы. Используйте её с осторожностью на рабочих экземплярах.

#### Удалённый сервер pprof {#pprof-remote-server}

`HEAP PROFILE` позволяет получить полную информацию об использовании памяти, но имеет следующие ограничения:

1. Требуется перезапуск BE.
2. Профилирование должно оставаться включённым, что постоянно влияет на производительность процесса.

Поэтому в Doris BE встроена поддержка [отладки через удалённый сервер](https://gperftools.github.io/gperftools/pprof_remote_servers.html) GPerftools, которая позволяет динамически собирать сведения о приросте памяти без перезапуска BE:

```bash
pprof --text --seconds=60 http://be_host:be_webport/pprof/heap
```

Пример вывода:

```text
Total: 1296.4 MB
   484.9  37.4%  37.4%    484.9  37.4% doris::StorageByteBuffer::create
   272.2  21.0%  58.4%    273.3  21.1% doris::RowBlock::init
   157.5  12.1%  70.5%    157.5  12.1% doris::RowBatch::RowBatch
    90.7   7.0%  77.5%     90.7   7.0% doris::SystemAllocator::allocate_via_malloc
    66.6   5.1%  82.7%     66.6   5.1% doris::IntegerColumnReader::init
    47.9   3.7%  86.4%     47.9   3.7% __gnu_cxx::new_allocator::allocate
    20.8   1.6%  88.0%     35.4   2.7% doris::SegmentReader::_load_index
    12.7   1.0%  89.0%     12.7   1.0% doris::DecimalColumnReader::init
    12.7   1.0%  89.9%     12.7   1.0% doris::LargeIntColumnReader::init
    12.7   1.0%  90.9%     12.7   1.0% doris::StringColumnDirectReader::init
    12.3   0.9%  91.9%     12.3   0.9% std::__cxx11::basic_string::_M_mutate
    10.4   0.8%  92.7%     10.4   0.8% doris::VectorizedRowBatch::VectorizedRowBatch
    10.0   0.8%  93.4%     10.0   0.8% doris::PlainTextLineReader::PlainTextLineReader
```

Эта команда собирает статистику только во время своего выполнения, поэтому её влияние на производительность процесса меньше, чем у полного `HEAP PROFILE`.

### LSAN (обнаружение утечек памяти) {#lsan-memory-leak-detection}

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) встроен в GCC. Чтобы им воспользоваться, достаточно включить его при компиляции. Doris BE уже интегрирует этот инструмент. Команда сборки:

```bash
BUILD_TYPE=LSAN ./build.sh
```

При обнаружении утечки памяти её стек выводится в `be.out`. Например, добавьте следующий код с утечкой в функцию `open` класса `StorageEngine`:

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

Вывод `be.out`:

```text
=================================================================
==24732==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 1024 byte(s) in 1 object(s) allocated from:
    #0 0xd10586 in operator new (unsigned long) ../../../../gcc-7.3.0/libsanitizer/lsan/lsan_interceptors.cc:164
    #1 0xe333a2 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:104
    #2 0xd3cc96 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #3 0x7f573b5eebd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)

SUMMARY: LeakSanitizer: 1024 byte(s) leaked in 1 allocation(s).
```

> Рекомендация по производительности: включение LSAN влияет на производительность программы. Используйте его с осторожностью на рабочих экземплярах.

> Примечание: при включении LSAN TCMalloc автоматически отключается.

### ASAN (проверка корректности адресов) {#asan-address-legality-detection}

[ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer) также встроен в GCC и используется для обнаружения обращений за границы выделенной памяти, обращений по недопустимым адресам и подобных ошибок. Команда сборки:

```bash
BUILD_TYPE=ASAN ./build.sh
```

Когда ASAN обнаруживает недопустимое обращение к памяти, он немедленно завершает программу и выводит стек в `be.out`. Например, добавьте следующий код с недопустимым обращением в функцию `open` класса `StorageEngine`:

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

Вывод `be.out`:

```text
=================================================================
==23284==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x61900008bf80 at pc 0x00000129f56a bp 0x7fff546eed90 sp 0x7fff546eed88
WRITE of size 1 at 0x61900008bf80 thread T0
    #0 0x129f569 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:106
    #1 0xe2c1e3 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #2 0x7fa5580fbbd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)
    #3 0xd30794  (/home/ssd0/zc/palo/doris/core/output3/be/lib/doris_be+0xd30794)

0x61900008bf80 is located 0 bytes to the right of 1024-byte region [0x61900008bb80,0x61900008bf80)
allocated by thread T0 here:
    #0 0xdeb040 in operator new[](unsigned long) ../../../../gcc-7.3.0/libsanitizer/asan/asan_new_delete.cc:82
    #1 0x129f50d in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:104
    #2 0xe2c1e3 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #3 0x7fa5580fbbd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)

SUMMARY: AddressSanitizer: heap-buffer-overflow /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:106 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**)
```

Из вывода можно узнать адрес недопустимого обращения `0x61900008bf80`, выделенную область `[0x61900008bb80,0x61900008bf80)` и стек её выделения.

> Рекомендация по производительности: включение ASAN влияет на производительность программы. Используйте его с осторожностью на рабочих экземплярах.

> Примечание: при включении ASAN TCMalloc автоматически отключается.

Если стек, выведенный в `be.out`, не содержит имён функций, используйте скрипт [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) для ручного разбора:

```bash
cat be.out | python asan_symbolize.py | c++filt
```

## Отладка использования CPU в BE {#be-cpu-debugging}

Если значение CPU Idle длительное время остаётся низким, CPU становится основным ограничением производительности. Doris BE предоставляет несколько способов анализа использования CPU.

### Сравнение инструментов анализа CPU {#comparison-of-cpu-analysis-tools}

| Инструмент | Требуется вход на физическую машину | Метод сбора данных | Результат |
|------|----------------|---------|------|
| Doris Debug Tools | Нет (готовый набор инструментов) | Удалённое получение данных | Флейм-граф |
| `pprof` + GPerf REST | Нет | Сбор данных в течение заданного времени | SVG/PDF |
| `perf` + FlameGraph | Да | Сбор данных по событиям | Флейм-граф |

### Doris Debug Tools (анализ CPU) {#doris-debug-tools-cpu-analysis}

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) предоставляет готовый набор инструментов для построения флейм-графов CPU и анализа памяти. Страница загрузки: [Выпуски](https://github.com/morningman/doris-debug-tools/releases).

> Примечание: это неофициальный инструмент, предназначенный только для отладки при разработке.

### pprof (удалённый сбор данных через REST) {#pprof-remote-rest-sampling}

[pprof](https://github.com/google/pprof) происходит из gperftools и позволяет преобразовывать вывод gperftools в удобные для чтения форматы, такие как PDF, SVG и Text. Doris BE совместим с интерфейсом GPerf REST:

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

Эта команда создаёт граф потребления CPU процессом BE за 60 секунд:

![Профиль CPU Pprof](/images/cpu-pprof-demo.png)

### perf + FlameGraph {#perf--flamegraph}

Это более универсальный подход к анализу CPU. В отличие от `pprof`, он требует входа на анализируемую физическую машину; при этом `pprof` выполняет только сбор данных в течение заданного времени, а `perf` может собирать стеки по различным событиям.

Ссылки на инструменты:

| Инструмент | Ссылка |
|------|------|
| `perf` | [Главная страница perf](https://perf.wiki.kernel.org/index.php/Main_Page), [примеры использования](http://www.brendangregg.com/perf.html) |
| FlameGraph | [Репозиторий на GitHub](https://github.com/brendangregg/FlameGraph) |

Порядок действий:

1. Соберите данные об использовании CPU процессом BE за 60 секунд:

    ```bash
    perf record -g -p be_pid -- sleep 60
    ```

2. Просмотрите собранный отчёт:

    ```bash
    perf report
    ```

    Пример результата анализа:

    ![Отчёт Perf](/images/perf-report-demo.png)

3. Используйте FlameGraph для построения флейм-графа:

    ```bash
    perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
    ```

    Пример результата:

    ![Флейм-граф CPU](/images/cpu-flame-demo.svg)

## Устранение неполадок {#troubleshooting}

| Симптом | Возможная причина | Действие |
|------|---------|---------|
| `addr2line: Dwarf Error` | DWARF-v5 несовместим со старыми версиями binutils | Обновите `addr2line` до 2.35.2+. Подробнее см. QA-1 |
| В выводе `jeprof` отображаются только адреса памяти | Heap Dump и анализ выполняются на разных машинах либо таблица символов не соответствует исполняемому файлу | Выполняйте анализ на той же машине или используйте одинаковые версии ядра. Подробнее см. QA-2/QA-3 |
| Частые FullGC; заполнение поколения Old близко к 100% | Недостаточный размер кучи JVM процесса FE либо утечка крупных объектов | Проведите анализ с помощью `jmap -histo:live` и `jstat -gcutil` |
| Производительность снижается после запуска BE | Heap Profile / ASAN / LSAN включены по ошибке | Отключите соответствующие параметры; используйте их только для отладки |
