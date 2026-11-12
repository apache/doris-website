---
{
    "title": "Обзор | Управление памятью",
    "language": "ru",
    "description": "Управление памятью — один из важнейших компонентов Doris. Во время работы Doris,",
    "sidebar_label": "Обзор"
}
---

# Обзор {#overview}

Управление памятью является одним из важнейших компонентов Doris. Во время работы Doris как загрузка данных, так и выполнение запросов требуют большого количества операций с памятью. Качество управления памятью напрямую влияет на стабильность и производительность Doris.

Apache Doris, база данных OLAP на основе архитектуры MPP, после загрузки данных с диска в память выполняет потоковую обработку и вычисления с передачей данных между операторами, а промежуточные результаты вычислений хранит в памяти. Такой подход сокращает количество операций дискового I/O и позволяет полностью использовать возможности параллельных вычислений на нескольких машинах и нескольких ядрах, обеспечивая значительный выигрыш в производительности.

При сложных вычислениях и масштабных операциях, требующих огромных объёмов памяти, эффективное выделение памяти, сбор статистики и контроль её использования играют ключевую роль в стабильности системы. Более быстрое выделение памяти повышает производительность запросов, а механизмы выделения, отслеживания и ограничения памяти помогают избежать локального чрезмерного потребления памяти, своевременно и точно реагировать на её нехватку и по возможности предотвращать OOM и сбои запросов. Эти механизмы значительно повышают стабильность системы. Кроме того, более точная статистика использования памяти служит основой для выгрузки промежуточных данных больших запросов на диск.

## Структура памяти Doris BE {#doris-be-memory-structure}

![Структура памяти Doris BE](/images/memory-structure.png)

```
Server physical memory: The physical memory used by all processes on the server, MemTotal seen by `cat /proc/meminfo` or `free -h`.
    |
    |---> Linux Kernel Memory And Other Process Memory: Memory used by the Linux kernel and other processes.
    |
    |---> Doris BE Process Memory: The memory used by the Doris BE process. The upper limit is the server physical memory minus the memory used by the Linux kernel and other processes, or the memory size configured by the Cgroup.
            |
            |---> Untracked: Memory that is not tracked and managed, including RPC, JVM, some metadata, etc. JVM is used when accessing external tables or using Java UDF.
            |
            |---> tracked: Memory that is tracked and managed, allowing real-time viewing, automatic memory recycling, and size control through parameters.
                    |
                    |---> jemalloc: The cache and metadata managed by jemalloc support parameter control and are automatically recycled when memory is insufficient.
                    |
                    |---> global: Doris globally shared memory, mainly including cache and metadata.
                    |       |
                    |       |---> doris cache: Doris manages its own cache, which supports controlling capacity and elimination time through parameters separately, and automatically reclaims when memory is insufficient.
                    |       |
                    |       |---> doris metadata: metadata of data stored on BE, including a series of memory data structures such as data schema and their caches.
                    |
                    |---> Task: The memory used by the tasks executed on Doris, which is expected to be released after the task is completed, including query, load, compaction, etc.
                    |       |
                    |       |---> query: Memory used during the query. A query is split into multiple fragments and executed separately, connected by data shuffle.
                    |       |       |
                    |       |       |---> Fragment: A fragment is split into multiple operators and executed in the form of a pipeline.
                    |       |       |       |
                    |       |       |       |---> operator: includes memory data structures such as data block, hash table, arena, exchange sink buffer, etc.
                    |       |
                    |       |---> load: Memory used during data load. Data load includes two stages: fragment reading and channel writing data.
                    |       |       |
                    |       |       |---> fragment: Same as query fragment execution, stream load usually only has scan operator.
                    |       |       |
                    |       |       |---> channel: The tablet channel writes data to a temporary data structure called memtable, and then the delta writer compresses the data and writes it to the file.
```

---

## Просмотр использования памяти {#memory-view}

Doris BE использует Memory Tracker для учёта использования памяти процессом. Эти сведения можно просматривать на веб-странице; при возникновении ошибок, связанных с памятью, они также записываются в журналы BE для анализа использования памяти и устранения неполадок.

### Статистика использования памяти в реальном времени {#real-time-memory-statistics}

Статистику использования памяти в реальном времени можно просматривать на веб-странице Doris BE `http://{be_host}:{be_web_server_port}/mem_tracker`. На ней отображаются текущий и пиковый объёмы памяти, отслеживаемые Memory Tracker типа `type=overview`, включая Query/Load/Compaction/Global и другие. Значение `be_web_server_port` по умолчанию равно 8040.

![Изображение](/images/memory-used-by-subsystem.png)

Memory Tracker делятся на несколько типов. Подробные сведения о Memory Tracker типа type=overview, за исключением `process resident memory`, `process virtual memory` и `sum of all trackers`, можно просмотреть по адресу `http://{be_host}:{be_web_server_port}/mem_tracker?type=Lable`.

Memory Tracker имеет следующие свойства:

1. Метка: имя Memory Tracker.
2. Текущее потребление (байты): текущий объём памяти в B.
3. Текущее потребление (нормализованное): текущий объём памяти в формате .G.M.K.
4. Пиковое потребление (байты): пиковый объём памяти с момента запуска процесса BE в B. Значение сбрасывается после перезапуска BE.
5. Пиковое потребление (нормализованное): пиковый объём памяти с момента запуска процесса BE в формате .G.M.K. Значение сбрасывается после перезапуска BE.
6. Родительская метка: указывает связь между родительским и дочерним Memory Tracker. Память, учитываемая дочерним Memory Tracker, является подмножеством памяти родительского Memory Tracker. Память, учитываемая разными Memory Tracker с одним родителем, может пересекаться.

Дополнительные сведения о Memory Tracker приведены в разделе [Memory Tracker](./memory-feature/memory-tracker.md).

### Историческая статистика использования памяти {#historical-memory-statistics}

Историческую статистику использования памяти можно просматривать на странице Bvar в Doris BE `http://{be_host}:{brpc_port}/vars/*memory_*`. На странице статистики использования памяти в реальном времени `http://{be_host}:{be_web_server_port}/mem_tracker` найдите страницу Bvar по метке Memory Tracker, чтобы увидеть, как меняется объём памяти, отслеживаемый соответствующим Memory Tracker. Значение `brpc_port` по умолчанию равно 8060.

![Историческая статистика использования памяти: Bvar Memory](/images/bvar-memory.png)

При ошибке, вызванной превышением лимита памяти процесса или нехваткой доступной памяти, в журнале `Memory Tracker Summary` можно найти сводку. Она записывается в `be/log/be.INFO` и содержит все Memory Tracker типов `Type=overview` и `Type=global`, помогая проанализировать состояние памяти на момент ошибки. Подробности приведены в разделе [Анализ журналов памяти](./memory-analysis/memory-log-analysis.md)

---

## Анализ использования памяти {#memory-analysis}

Соответствие Memory Tracker типа `type=overview` отдельным категориям памяти в разделе `tracked` приведённой выше структуры:

```
Doris BE Process Memory
    |
    |---> tracked: corresponds to `MemTrackerLimiter Label=sum of all trackers, Type=overview`, which is all the memory counted by the Memory Tracker, that is, the sum of the Current Consumption of other Memory Trackers with `type=overview` except `Label=process resident memory` and `Label=process virtual memory`.
            |
            |---> jemalloc
            |       |
            |       |---> jemalloc cache: corresponds to `MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview`. The Jemalloc cache includes two parts: Dirty Page and Thread Cache.
            |       |
            |       |---> jemalloc metadata: Corresponding to `MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview`, Metadata of Jemalloc.
            |
            |---> global: corresponds to `MemTrackerLimiter Label=global, Type=overview`, including global Memory Trackers with the same life cycle and process such as Cache, metadata, and decompression. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` displays all Memory Trackers of `type=global`.
            |
            |---> task
            |       |
            |       |---> query: corresponds to `MemTrackerLimiter Label=query, Type=overview`, which is the sum of Current Consumption of all Query Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` displays all Memory Trackers of `type=query`.
            |       |
            |       |---> load: corresponds to `MemTrackerLimiter Label=load, Type=overview`, the sum of Current Consumption of all Load Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=load` displays all Memory Trackers of `type=load`.
            |       |
            |       |---> reserved: corresponds to `MemTrackerLimiter Label=reserved_memory, Type=overview`. The reserved memory is used when query the Hash Table and other memory-intensive behaviors. Before query the Hash Table, the memory of the Hash Table to be constructed will be reserved from the Memory Tracker to ensure that subsequent memory requests can be met.
            |       |
            |       |---> compaction: corresponds to `MemTrackerLimiter Label=compaction, Type=overview`, the sum of Current Consumption of all Compaction Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=compaction` displays all Memory Trackers of `type=compaction`.
            |       |
            |       |---> schema_change: corresponds to `MemTrackerLimiter Label=schema_change, Type=overview`, the sum of Current Consumption of all Schema Change Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=schema_change` displays all Memory Trackers of `type=schema_change`.

            |       |
            |       |---> other: corresponds to `MemTrackerLimiter Label=other, Type=overview`, the total memory of other tasks except the above, such as EngineAlterTabletTask, EngineCloneTask, CloudEngineCalcDeleteBitmapTask, SnapshotManager, etc. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=other` displays all Memory Trackers of `type=other`.
    |
    |---> Doris BE process physical memory, corresponding to `MemTrackerLimiter Label=process resident memory, Type=overview`, Current Consumption is taken from VmRSS in `/proc/self/status`, Peak Consumption is taken from VmHWM in `/proc/self/status`.
    |
    |---> Doris BE process virtual memory, corresponding to `MemTrackerLimiter Label=process virtual memory, Type=overview`, Current Consumption is taken from VmSize in `/proc/self/status`, and Peak Consumption is taken from VmPeak in `/proc/self/status`.
```

Методы анализа отдельных категорий памяти в приведённой выше структуре:

1. [Анализ использования памяти Jemalloc](./memory-analysis/jemalloc-memory-analysis.md)

2. [Анализ использования глобальной памяти](./memory-analysis/global-memory-analysis.md)

3. [Анализ использования памяти запросами](./memory-analysis/query-memory-analysis.md)

4. [Анализ использования памяти при загрузке данных](./memory-analysis/load-memory-analysis.md)

---

## Часто задаваемые вопросы о проблемах с памятью {#memory-problem-faq}

Рекомендации по анализу распространённых проблем с памятью приведены в разделе [Часто задаваемые вопросы о проблемах с памятью](./memory-issue-faq.md).

---

## Стратегия управления памятью {#memory-control-strategy}

В разделе [Стратегия управления памятью](./memory-feature/memory-control-strategy.md) описаны механизмы выделения, мониторинга и освобождения памяти, обеспечивающие эффективное и контролируемое использование памяти процессом Doris BE.
