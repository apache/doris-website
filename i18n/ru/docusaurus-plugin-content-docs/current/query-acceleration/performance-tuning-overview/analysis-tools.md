---
{
    "title": "Инструменты анализа медленных SQL-запросов: Explain и Profile",
    "language": "ru",
    "description": "Как анализировать узкие места производительности медленных SQL-запросов в Doris? В этой статье рассказывается, как с помощью Explain, Profile и системных инструментов быстро находить проблемы на уровнях плана и выполнения.",
    "keywords": ["анализ производительности Doris", "Doris Explain", "Doris Profile", "анализ медленных SQL-запросов", "Merged Profile", "Execution Profile", "PipelineTask"]
}
---

<!-- Knowledge type: concept + tool usage guide -->
<!-- Applicable scenario: After a slow SQL has been located, further analysis is needed to determine whether the bottleneck lies in the plan layer, execution layer, or system layer -->

После выявления медленного SQL-запроса инструменты анализа производительности помогают определить, где именно находится узкое место. Предыдущий раздел, [Диагностические инструменты](diagnostic-tools.md), помогает специалистам бизнес-подразделений и служб эксплуатации находить конкретные медленные SQL-запросы. В этой главе рассказывается, как анализировать узкие места производительности таких запросов.

**Что проверить перед началом**: прежде чем приступать к анализу, убедитесь, что выполнены следующие условия:

- Конкретный медленный SQL-запрос уже найден с помощью диагностических инструментов.
- У вас есть доступ к Doris FE и права на выполнение `EXPLAIN`.
- Вы можете получить Profile этого SQL-запроса (сбор Profile включён).
- У вас есть доступ к узлам BE для просмотра системных метрик производительности (CPU/память/IO/сеть).

### Два этапа выполнения SQL и три типа узких мест {#two-stages-of-sql-execution-and-three-types-of-bottlenecks}

Выполнение SQL-запроса делится на два этапа:

1. **Этап формирования плана**: отвечает за создание плана выполнения.
2. **Этап выполнения плана**: отвечает за выполнение конкретного плана.

Проблемы на любом из этих этапов могут приводить к узким местам производительности:

- **Неудачный план**: даже самый эффективный механизм выполнения не обеспечит хорошую производительность.
- **Неподходящий способ выполнения**: даже при корректном плане могут возникать узкие места.
- **Недостатки инфраструктуры или ошибки конфигурации**: производительность механизма выполнения тесно связана с оборудованием и архитектурой системы.

### Соответствие инструментов типам узких мест {#mapping-between-tools-and-bottleneck-types}

| Тип узкого места     | Рекомендуемый инструмент анализа | Основное назначение                                            |
| ------------------- | ------------------------- | ------------------------------------------------------- |
| Узкое место на уровне плана | Doris Explain           | Просмотр плана выполнения SQL и поиск проблем при формировании плана |
| Узкое место на уровне выполнения | Doris Profile      | Просмотр подробной информации о работе каждого оператора во время выполнения |
| Узкое место на уровне системы | top/free/perf/sar и др. | Наблюдение за текущим состоянием CPU/памяти/IO/сети системы |

В следующих разделах рассматриваются эти три типа инструментов.

## Doris Explain: анализ узких мест на уровне плана {#doris-explain-analyzing-plan-layer-bottlenecks}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When a slow SQL is suspected to be caused by a suboptimal plan, and the execution plan details need to be examined -->

### Определение одним предложением {#one-sentence-definition}

План выполнения описывает конкретный способ и порядок выполнения SQL-запроса. Например, для SQL-запроса, соединяющего две таблицы, план выполнения показывает способы доступа к обеим таблицам, способ соединения и порядок соединения.

### Назначение {#purpose}

Инструмент Doris Explain позволяет удобно просматривать подробную информацию о плане выполнения SQL. Анализируя вывод Explain, можно быстро находить узкие места на уровне плана и настраивать план с учётом конкретной ситуации.

### Сравнение типов Explain {#comparison-of-explain-types}

Doris предоставляет варианты Explain с разной степенью детализации для различных сценариев анализа:

| Тип Explain         | Содержимое вывода                       | Сценарий применения                  |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Explain Verbose      | Итоговый физический план                  | Просмотр фактического физического плана, передаваемого BE |
| Explain All Plan     | Логические планы на каждом этапе          | Отслеживание преобразований логических планов |
| Explain Memo Plan    | План процесса оптимизации на основе стоимости | Анализ решений оптимизатора CBO |
| Explain Shape Plan   | Форма плана                           | Быстрый просмотр каркаса и структуры плана |

Подробные сведения об использовании каждого типа Explain и интерпретации его вывода приведены в документации по Explain для планов выполнения.

### Типичные узкие места на уровне плана {#typical-plan-layer-bottlenecks}

Анализ вывода Explain позволяет быстро находить следующие распространённые узкие места на уровне плана:

- **Фильтр не протолкнут к базовой таблице**: данные не фильтруются заранее, поэтому в вычислениях участвует слишком большой объём данных.
- **Условие соединения не распространено на другую сторону**: при внутреннем соединении двух таблиц по равенству условие фильтрации одной стороны не распространяется на другую, поэтому данные другой таблицы не фильтруются заранее.

Примеры настройки на уровне плана с помощью Doris Explain приведены в главе [Настройка плана](../tuning/tuning-plan/optimizing-table-schema.md).

## Doris Profile: анализ узких мест на уровне выполнения {#doris-profile-analyzing-execution-layer-bottlenecks}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: The plan has no obvious issues, but the SQL executes slowly, and the runtime time consumption of each operator needs to be examined -->

### Определение одним предложением {#one-sentence-definition-1}

Profile — это запись подробных данных о затратах времени и метриках каждого оператора во время фактического выполнения SQL-запроса, которая используется для поиска узких мест производительности на уровне выполнения.

### Отличие от Explain {#difference-from-explain}

Explain описывает **планирование** выполнения SQL (например, соединение t1 и t2 запланировано как Hash Join, где t1 находится на стороне build, а t2 — на стороне probe). Profile описывает **фактический процесс** выполнения SQL (например, сколько времени занимают build и probe).

### Структура файла Profile {#profile-file-structure}

Файл Profile содержит следующие основные части:

1. **Основная информация о запросе**: ID, время, база данных и т. д.
2. **SQL-запрос и план выполнения**.
3. **Затраты времени на FE**: Plan Time, Schedule Time и т. д.
4. **Затраты времени на выполнение каждого оператора BE**: Merged Profile и Execution Profile.

Подробная информация о выполнении содержится главным образом в последней части. Следующие разделы посвящены информации о выполнении, которую предоставляет Profile.

### Merged Profile {#merged-profile}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Quickly view the aggregated performance metrics of an operator across all concurrent instances -->

Merged Profile предоставляет основные метрики каждого оператора, агрегированные по всем параллельным экземплярам, что позволяет быстро находить узкие места. В Doris каждый оператор выполняется параллельно с заданной пользователем степенью параллелизма, а Merged Profile вычисляет значения Max, Avg и Min для каждой метрики.

**Пример** (на примере EXCHANGE_OPERATOR):

```sql
EXCHANGE_OPERATOR  (id=4):
    -  BlocksProduced:  sum  0,  avg  0,  max  0,  min  0
    -  CloseTime:  avg  34.133us,  max  38.287us,  min  29.979us
    -  ExecTime:  avg  700.357us,  max  706.351us,  min  694.364us
    -  InitTime:  avg  648.104us,  max  648.604us,  min  647.605us
    -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
    -  PeakMemoryUsage:  sum  0.00  ,  avg  0.00  ,  max  0.00  ,  min  0.00  
    -  OpenTime:  avg  4.541us,  max  5.943us,  min  3.139us
    -  ProjectionTime:  avg  0ns,  max  0ns,  min  0ns
    -  RowsProduced:  sum  0,  avg  0,  max  0,  min  0
    -  WaitForDependencyTime:  avg  0ns,  max  0ns,  min  0ns
    -  WaitForData0:  avg  9.434ms,  max  9.476ms,  min  9.391ms
```

**Описание основных метрик**:

| Название метрики           | Значение метрики                                              |
| --------------------- | ----------------------------------------------------------- |
| BlocksProduced        | Количество созданных блоков данных                              |
| CloseTime             | Время, затраченное оператором на фазе close               |
| ExecTime              | Общее время выполнения оператора на всех фазах      |
| InitTime              | Время, затраченное оператором на фазе Init                |
| MemoryUsage           | Использование памяти оператором во время выполнения     |
| OpenTime              | Время, затраченное оператором на фазе Open                |
| ProjectionTime        | Время, затраченное оператором на проекцию                    |
| RowsProduced          | Количество строк, возвращённых оператором                     |
| WaitForDependencyTime | Время ожидания оператором собственных зависимостей выполнения   |

`WaitForDependencyTime` зависит от оператора. Например, у EXCHANGE_OPERATOR выше зависимостью является вышестоящий оператор, отправляющий данные через RPC, поэтому эта метрика фактически измеряет время ожидания отправки данных вышестоящим оператором.

### Execution Profile {#execution-profile}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Locate fine-grained performance issues in a specific concurrent instance, or view operator-specialized metrics -->

Execution Profile показывает подробные метрики конкретного параллельного экземпляра. По сравнению с Merged Profile он более детализирован и включает метрики, специфичные для оператора.

**Пример** (на примере EXCHANGE_OPERATOR с id=4):

```sql
EXCHANGE_OPERATOR  (id=4):(ExecTime:  706.351us)
      -  BlocksProduced:  0
      -  CloseTime:  38.287us
      -  DataArrivalWaitTime:  0ns
      -  DecompressBytes:  0.00  
      -  DecompressTime:  0ns
      -  DeserializeRowBatchTimer:  0ns
      -  ExecTime:  706.351us
      -  FirstBatchArrivalWaitTime:  0ns
      -  InitTime:  647.605us
      -  LocalBytesReceived:  0.00  
      -  MemoryUsage:  
      -  PeakMemoryUsage:  0.00  
      -  OpenTime:  5.943us
      -  ProjectionTime:  0ns
      -  RemoteBytesReceived:  0.00  
      -  RowsProduced:  0
      -  SendersBlockedTotalTimer(*):  0ns
      -  WaitForDependencyTime:  0ns
      -  WaitForData0:  9.476ms
```

Например, `LocalBytesReceived` — метрика, специфичная для EXCHANGE_OPERATOR, которой нет у других операторов, поэтому она не включена в Merged Profile.

### Время выполнения PipelineTask {#pipelinetask-execution-time}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Analyze the time distribution of a single PipelineTask, distinguishing actual execution, waiting for a Worker, and waiting for dependencies -->

В Doris PipelineTask состоит из нескольких операторов. При анализе времени выполнения PipelineTask обратите внимание на следующие три составляющие:

| Составляющая              | Описание                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| ExecuteTime             | Фактическое время выполнения PipelineTask, приблизительно равное сумме ExecTime всех операторов задачи |
| WaitWorkerTime          | Время ожидания задачей исполняющего Worker, которое в основном определяется нагрузкой на кластер       |
| Время ожидания зависимостей выполнения | Сумма времени ожидания зависимостей всех операторов (задача может выполняться только после того, как удовлетворены все зависимости) |

**Упрощённый пример**:

```sql
PipelineTask  (index=1):(ExecTime:  4.773ms)
  -  ExecuteTime:  1.656ms
      -  CloseTime:  90.402us
      -  GetBlockTime:  11.235us
      -  OpenTime:  1.448ms
      -  PrepareTime:  1.555ms
      -  SinkTime:  14.228us
  -  WaitWorkerTime:  63.868us
    DATA_STREAM_SINK_OPERATOR  (id=8,dst_id=8):(ExecTime:  1.688ms)
      -  WaitForDependencyTime:  0ns
          -  WaitForBroadcastBuffer:  0ns
          -  WaitForRpcBufferQueue:  0ns
    AGGREGATION_OPERATOR  (id=7  ,  nereids_id=648):(ExecTime:  398.12us)
      -  WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time:  10.495ms
```

Эта задача содержит два оператора (DATA_STREAM_SINK_OPERATOR и AGGREGATION_OPERATOR). У DATA_STREAM_SINK_OPERATOR две зависимости (WaitForBroadcastBuffer и WaitForRpcBufferQueue), а у AGGREGATION_OPERATOR — одна зависимость (AGGREGATION_OPERATOR_DEPENDENCY). Время этой задачи распределяется следующим образом:

| Тип затрат времени              | Значение      | Описание                                                       |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| Общее время выполнения   | 1.656 ms   | Приблизительно равно сумме ExecTime двух операторов   |
| Время ожидания Worker | 63.868 us | Текущая нагрузка на кластер невысока, и Worker выполняет задачу сразу после её готовности |
| Время ожидания зависимостей выполнения | 10.495 ms | Равно сумме времени ожидания всех зависимостей          |

Примеры настройки на уровне выполнения с помощью Profile приведены в главе [Настройка выполнения](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md).

## Системные инструменты анализа производительности {#system-level-performance-tools}

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When the performance bottleneck is suspected to be at the system layer (CPU/memory/IO/network), to assist in locating issues during execution -->

Системные инструменты помогают находить узкие места производительности во время выполнения SQL, наблюдая за текущим состоянием системных ресурсов.

| Системный ресурс | Распространённые инструменты Linux  | Основное назначение                                  |
| --------------- | ------------------- | --------------------------------------------- |
| CPU             | top, perf, sar      | Наблюдение за использованием CPU и наиболее затратными функциями           |
| Память          | top, free, sar      | Наблюдение за использованием памяти и активностью swap        |
| Дисковый IO         | iostat, sar         | Наблюдение за скоростью чтения/записи на диск и временем ожидания    |
| Сеть         | sar, netstat        | Наблюдение за сетевым трафиком и состоянием соединений |

## Часто задаваемые вопросы {#frequently-asked-questions}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions encountered when using analysis tools -->

### Вопрос 1: Что использовать сначала: Explain, Profile или системные инструменты? {#q1-among-explain-profile-and-system-tools-which-should-you-use-first}

Проводите анализ в порядке убывания приоритета: сначала изучите **Explain**, чтобы исключить проблемы с планом; убедившись, что план рационален, изучите **Profile**, чтобы найти медленный оператор; если собственные затраты времени оператора приемлемы, но выполнение в целом остаётся медленным, переходите к **системным инструментам**.

### Вопрос 2: Что выбрать: Merged Profile или Execution Profile? {#q2-should-you-choose-merged-profile-or-execution-profile}

Сначала изучите **Merged Profile**, чтобы быстро выявить различия в затратах времени между операторами. Если вы подозреваете аномалию в конкретном параллельном экземпляре или вам нужны метрики, специфичные для оператора, переходите к **Execution Profile**.

### Вопрос 3: PipelineTask в целом выполняется медленно, но ExecuteTime невелик. В чём причина? {#q3-the-pipelinetask-is-slow-overall-but-executetime-is-not-high-what-is-the-reason}

Обычно причина в **большом WaitWorkerTime** (высокая нагрузка на кластер) или **долгом ожидании зависимостей** (вышестоящий оператор не успевает выдавать данные). По имени зависимости нужно найти узкое место в вышестоящем операторе.

### Вопрос 4: WaitForDependencyTime равен 0, а WaitForData0 очень велик? {#q4-waitfordependencytime-is-0-but-waitfordata0-is-very-high}

`WaitForData0` — конкретная зависимость EXCHANGE_OPERATOR, связанная с ожиданием данных от вышестоящего оператора по RPC. Большое значение этой метрики обычно означает, что вышестоящий оператор медленно выдаёт данные, и его работу следует изучить подробнее.

## Итоги {#summary}

<!-- Knowledge type: summary -->

Инструменты анализа производительности необходимы для быстрого поиска узких мест производительности.

- **Doris Explain**: находит узкие места на уровне плана.
- **Doris Profile**: находит узкие места на уровне выполнения (Merged Profile + Execution Profile + время PipelineTask).
- **Системные инструменты**: помогают находить узкие места на уровнях оборудования и операционной системы.

Грамотное сочетание этих трёх типов инструментов позволяет находить и устранять узкие места производительности медленных SQL-запросов в Doris на всех уровнях.
