---
{
    "title": "routine_load_job",
    "language": "ru",
    "description": "Используется для просмотра сведений о заданиях Routine Load."
}
---

## Обзор {#overview}

Используется для просмотра сведений о заданиях Routine Load.

## База данных и таблица {#database-and-table}

`information_schema.routine_load_jobs`

## Сведения о таблице {#table-information}

| Имя столбца              | Тип     | Описание                                                                                                                                             | Пример |
| :----------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ |
| JOB_ID                   | text    | Идентификатор задания, сгенерированный Doris.                                                                                                            | `12025` |
| JOB_NAME                 | text    | Имя задания Routine Load.                                                                                                                               | `example_routine_load` |
| CREATE_TIME              | text    | Время создания задания.                                                                                                                                 | `2024-01-15 08:12:42` |
| PAUSE_TIME               | text    | Время последней приостановки задания. Если задание не приостанавливалось, значение равно `NULL`.                                                         | `NULL` |
| END_TIME                 | text    | Время завершения задания. Если задание не завершено, значение равно `NULL`.                                                                               | `NULL` |
| DB_NAME                  | text    | Имя базы данных задания.                                                                                                                                | `default_cluster:testdb` |
| TABLE_NAME               | text    | Имя целевой таблицы задания. Для заданий импорта в несколько таблиц это значение равно `multi-table`.                                                    | `test_routineload_tbl` |
| STATE                    | text    | Состояние выполнения задания. Возможные значения: `NEED_SCHEDULE`, `RUNNING`, `PAUSED`, `STOPPED` и `CANCELLED`.                                           | `RUNNING` |
| CURRENT_TASK_NUM         | text    | Количество подзадач, которые в данный момент планируются или выполняются.                                                                                 | `1` |
| JOB_PROPERTIES           | text    | Настройки свойств задания, включая размер пакета, степень параллелизма, формат импорта, сопоставление столбцов и допустимый уровень ошибок.                | `{"max_batch_rows":"200000","format":"csv","columnToColumnExpr":"user_id,name,age","max_filter_ratio":"1.0"}` |
| DATA_SOURCE_PROPERTIES   | text    | Настройки свойств источника данных. Для Kafka включают топик, список брокеров и текущие разделы Kafka.                                                    | `{"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}` |
| CUSTOM_PROPERTIES        | text    | Пользовательские свойства, заданные при создании задания. Для Kafka обычно включают смещения, идентификатор группы и параметры клиента Kafka, переданные с префиксом `property.`. Начиная с версии 4.0.8, значения конфиденциальных свойств отображаются как `******` | `{"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}` |
| STATISTIC                | text    | Статистика выполнения задания. Часто используемые поля: `receivedBytes`, `loadedRows`, `errorRows`, `committedTaskNum`, `abortedTaskNum`, `loadRowsRate` и `taskExecuteTimeMs`. | `{"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}` |
| PROGRESS                 | text    | Ход выполнения задания. Для Kafka показывает смещение, до которого прочитаны данные в каждом разделе.                                                    | `{"0":"2"}` |
| LAG                      | text    | Сведения об отставании задания. Для Kafka показывает отставание потребления для каждого раздела.                                                         | `{"0":0}` |
| REASON_OF_STATE_CHANGED  | text    | Причина изменения состояния задания. Обычно поле пустое для заданий, выполняющихся штатно. При нештатной приостановке или отмене задания в нём указывается конкретная причина. | `The number of failed task exceeded max_error_number` |
| ERROR_LOG_URLS           | text    | URL журналов ошибок для просмотра отфильтрованных данных, не прошедших проверку качества. Если журналов ошибок нет, поле пустое.                           | `http://fe_host:8030/api/_load_error_log?file=error.log` |
| USER_NAME                | text    | Пользователь, создавший задание или выполнявший операции с ним.                                                                                            | `root` |
| CURRENT_ABORT_TASK_NUM   | int     | Текущее количество подзадач, завершившихся с ошибкой.                                                                                                      | `0` |
| IS_ABNORMAL_PAUSE        | boolean | Указывает, было ли задание нештатно приостановлено системой, а не вручную пользователем. `true` означает нештатную приостановку системой, а `false` означает отсутствие нештатной приостановки. | `false` |
| COMPUTE_GROUP            | text    | Вычислительная группа, в которой выполняется задание. | `default_compute_group` |
| FIRST_ERROR_MSG          | text    | Первое сообщение об ошибке, возникшей при выполнении задания. Помогает найти первопричину. Если ошибок нет, поле пустое. | `too many filtered rows` |

## Источник и полнота данных {#data-source-and-completeness}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Multi-FE cluster troubleshooting / Empty error messages -->

`FIRST_ERROR_MSG` и `ERROR_LOG_URLS` представляют собой временные поля, значения которых хранятся только в памяти ведущего FE во время выполнения. Ведомые FE не заполняют их при воспроизведении метаданных.

:::caution Изменение поведения (4.0.8)

Начиная с версии 4.0.8, сканирование `information_schema.routine_load_jobs` направляется на ведущий FE, поэтому запрос с любого FE возвращает полные значения `FIRST_ERROR_MSG` и `ERROR_LOG_URLS`.

До версии 4.0.8 данные таблицы предоставлял тот FE, который получил запрос. Поэтому на FE, не являющемся ведущим, эти два столбца возвращались пустыми, что не соответствовало результатам `SHOW ROUTINE LOAD` (эта команда перенаправляется на ведущий FE).

Маршрутизацией управляет переменная сеанса `enable_schema_scan_from_master_fe`, значение которой по умолчанию равно `true`.

:::

## Поиск заданий с нарушениями в работе {#query-abnormal-jobs}

Если задание нештатно приостановлено, содержит подзадачи, завершившиеся с ошибкой, либо находится в состоянии `RUNNING`, но не имеет выполняющихся подзадач при сохраняющемся отставании потребления Kafka, необходимо выяснить причину. Для поиска таких заданий можно использовать следующий SQL-запрос:

```sql
SELECT DB_NAME, JOB_NAME
FROM information_schema.routine_load_jobs
WHERE IS_ABNORMAL_PAUSE = TRUE
   OR (
        STATE = 'RUNNING'
        AND (
             CURRENT_ABORT_TASK_NUM > 0
             OR (
                  CAST(CURRENT_TASK_NUM AS INT) = 0
                  AND `LAG` REGEXP ':[[:space:]]*[1-9][0-9]*'
             )
        )
   );
```

Найдя задание с нарушениями в работе, переключитесь на соответствующую базу данных и используйте `SHOW ROUTINE LOAD` для просмотра подробных сведений о задании:

```sql
USE `db_name`;
SHOW ROUTINE LOAD FOR `job_name`;
```

`LAG` содержит сведения об отставании потребления Kafka для каждого раздела. Выражение `LAG REGEXP ':[[:space:]]*[1-9][0-9]*'` находит задания, у которых хотя бы в одном разделе отставание больше 0.
