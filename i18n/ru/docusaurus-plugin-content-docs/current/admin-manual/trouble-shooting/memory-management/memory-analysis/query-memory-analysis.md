---
{
    "title": "Анализ использования памяти запросами",
    "language": "ru",
    "description": "Обычно анализ использования памяти запросом начинают с Query Profile."
}
---

Обычно анализ использования памяти запросом начинают с Query Profile. Если сумма объёмов памяти всех операторов, учтённых в Query Profile, значительно меньше объёма, учтённого Query Memory Tracker, это означает, что статистика памяти операторов в Query Profile существенно отличается от фактического потребления. В таком случае для дальнейшего анализа часто требуется Heap Profile. Если запрос отменён из-за превышения лимита памяти и не может завершиться, Query Profile содержит неполные данные, что мешает точному анализу. В таких случаях обычно сразу используют Heap Profile для анализа использования памяти запросом.

## Просмотр использования памяти запросами {#query-memory-view}

Если где-либо вы видите большое значение потребления памяти в Memory Tracker с `Label=query, Type=overview`, это означает, что запросы используют много памяти.

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

Если вы уже знаете, какой запрос нужно проанализировать, пропустите этот раздел и переходите к анализу ниже. В противном случае воспользуйтесь следующим способом, чтобы найти запрос, потребляющий много памяти.

Сначала определите QueryID запроса, потребляющего много памяти. На веб-странице BE `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` можно увидеть такие запросы в реальном времени, отсортировав их по `Current Consumption`. QueryID указан в `label`.

При ошибке, связанной с превышением лимита памяти процесса или недостатком доступной памяти, в нижней части `Memory Tracker Summary` в журнале `be.INFO` приводятся Memory Tracker для 10 задач (запросов, загрузок, компакций и т. д.) с наибольшим потреблением памяти. Формат записи: `MemTrackerLimiter Label=Query#Id=xxx, Type=query`. Обычно QueryID запроса, потребляющего много памяти, можно найти среди этих 10 задач.

Статистику использования памяти ранее выполненными запросами можно посмотреть в поле `peakMemoryBytes` каждого запроса в `fe/log/fe.audit.log`. Также можно найти записи `Deregister query/load memory tracker, queryId` в `be/log/be.INFO`, чтобы увидеть пиковое потребление памяти каждым запросом на отдельном BE.

## Анализ использования памяти запросами с помощью Query Profile {#use-query-profile-to-analyze-query-memory-usage}

Найдите информацию о запросе, включая SQL, в `fe/log/fe.audit.log` по QueryID, получите план запроса с помощью `explain SQL`, а затем получите профиль запроса, выполнив SQL после `set enable_profile=true`. Подробное описание Query Profile приведено в документе [Query Profile](../../../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile-analyzing-execution-layer-bottlenecks). Здесь рассматриваются только сведения о памяти в Query Profile и то, как с их помощью найти операторы и структуры данных, потребляющие много памяти.

1. Найдите операторы или структуры данных, потребляющие много памяти

Query Profile состоит из двух частей:

- `MergedProfile`

MergedProfile представляет собой агрегированный результат всех профилей экземпляров запроса. Он показывает sum, avg, max и min использования памяти каждым оператором в каждом Pipeline каждого Fragment по всем экземплярам, включая пиковое потребление памяти оператором `PeakMemoryUsage` и пиковое потребление памяти основными структурами данных, такими как `HashTable` и `Arena`. По этим данным можно найти операторы и структуры данных, потребляющие много памяти.

```
MergedProfile  
          Fragments:
              Fragment  0:
                  Pipeline  :  0(instance_num=1):
                      RESULT_SINK_OPERATOR  (id=0):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                          EXCHANGE_OPERATOR  (id=20):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  1.16  KB,  avg  1.16  KB,  max  1.16  KB,  min  1.16  KB
              Fragment  1:
                  Pipeline  :  1(instance_num=12):
                      AGGREGATION_SINK_OPERATOR  (id=18  ,  nereids_id=1532):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                -  HashTable:  sum  96.00  B,  avg  8.00  B,  max  24.00  B,  min  0.00  
                                -  PeakMemoryUsage:  sum  1.58  MB,  avg  134.67  KB,  max  404.02  KB,  min  0.00  
                                -  SerializeKeyArena:  sum  1.58  MB,  avg  134.67  KB,  max  404.00  KB,  min  0.00  
                          EXCHANGE_OPERATOR  (id=17):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  2.25  KB,  avg  192.00  B,  max  768.00  B,  min  0.00
```

- `Execution  Profile`

`Execution Profile` содержит результаты для каждого отдельного профиля экземпляра запроса. Обычно, определив по `MergedProfile` оператор и структуру данных, которые используют много памяти, можно проанализировать причины такого потребления на основе плана запроса, полученного с помощью `explain SQL`. Если требуется проанализировать потребление памяти запросом на определённом узле BE или в определённом экземпляре, можно уточнить эти данные с помощью `Execution Profile`.

```
Execution  Profile  36ca4f8b97834449-acae910fbee8c670:(ExecTime:  48sec201ms)
    Fragments:
        Fragment  0:
            Fragment  Level  Profile:    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):(ExecTime:  48sec111ms)
            Pipeline  :1    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):
                PipelineTask  (index=80):(ExecTime:  6sec267ms)
                DATA_STREAM_SINK_OPERATOR  (id=17,dst_id=17):(ExecTime:  1.634ms)
                -  MemoryUsage:  
                    -  PeakMemoryUsage:  1.50  KB
                STREAMING_AGGREGATION_OPERATOR  (id=16  ,  nereids_id=1526):(ExecTime:  41.269ms)
                    -  MemoryUsage:  
                        -  HashTable:  168.00  B
                        -  PeakMemoryUsage:  404.16  KB
                        -  SerializeKeyArena:  404.00  KB
                HASH_JOIN_OPERATOR  (id=15  ,  nereids_id=1520):(ExecTime:  6sec150ms)
                        -  MemoryUsage:  
                            -  PeakMemoryUsage:  3.22  KB
                            -  ProbeKeyArena:  3.22  KB
                    LOCAL_EXCHANGE_OPERATOR  (PASSTHROUGH)  (id=-12):(ExecTime:  67.950ms)
                            -  MemoryUsage:  
                                -  PeakMemoryUsage:  1.41  MB
```

2. `HASH_JOIN_SINK_OPERATOR` потребляет слишком много памяти

```
HASH_JOIN_SINK_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  1min14sec)
    -  JoinType:  INNER_JOIN
    -  BroadcastJoin:  true
    -  BuildRows:  600.030257M  (600030257)
    -  InputRows:  600.030256M  (600030256)
    -  MemoryUsage:  
        -  BuildBlocks:  15.65  GB
        -  BuildKeyArena:  0.00  
        -  HashTable:  6.24  GB
        -  PeakMemoryUsage:  21.89 GB
```

Как видно, на этапе Hash Join Build основную часть памяти занимают `BuildBlocks` и `HashTable`. Обычно чрезмерное потребление памяти приходится на этап Hash Join Build. Сначала проверьте, насколько обоснован порядок, выбранный Join Reorder. Как правило, для Hash Join Build следует использовать небольшие таблицы, а для Hash Join Probe — большие. Это позволяет минимизировать общее потребление памяти при Hash Join и обычно повышает производительность.

Чтобы проверить корректность порядка Join Reorder, найдите профиль `HASH_JOIN_OPERATOR` с id=12. Видно, что значение `ProbeRows` составляет всего 196240 строк. Поэтому для корректного порядка Join Reorder в этом Hash Join левую и правую таблицы следует поменять местами. Командой `set disable_join_reorder=true` можно отключить Join Reorder, вручную задать порядок левой и правой таблиц и затем проверить запрос. Подробнее см. документацию по Join Reorder в оптимизаторе запросов.

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

## Анализ использования памяти запросами с помощью Heap Profile {#use-heap-profile-to-analyze-query-memory-usage}

Если приведённый выше Query Profile не позволяет точно определить, где расходуется память, а кластер можно без затруднений перезапустить и воспроизвести проблему, воспользуйтесь документом [Анализ памяти с помощью Heap Profile](./heap-profile-memory-analysis.md) для анализа использования памяти запросом.

Снимите дамп Heap Profile перед выполнением запроса, а затем ещё один во время его выполнения. Сравнив изменения потребления памяти между двумя Heap Profile с помощью `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2`, вы получите долю памяти, используемую каждой функцией в коде во время выполнения запроса. Сопоставьте результаты с кодом, чтобы определить, где расходуется память. Поскольку потребление памяти во время выполнения запроса постоянно меняется, может потребоваться несколько раз снять дамп Heap Profile во время выполнения запроса, а затем сравнить и проанализировать результаты.
