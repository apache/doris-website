---
{
    "title": "backend_tablets",
    "language": "ru",
    "description": "Просмотр информации о Tablet на узлах Backend (добавлено в Doris 3.0.7)."
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

## Обзор {#overview}

Просмотр информации о Tablet на узлах Backend (добавлено в Doris 3.0.7).

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца        | Тип          | Описание                                      |
| ------------------ | ------------ | --------------------------------------------- |
| BE_ID              | bigint       | Идентификатор узла Backend                    |
| TABLET_ID          | bigint       | Идентификатор Tablet                          |
| REPLICA_ID         | bigint       | Идентификатор реплики                         |
| PARTITION_ID       | bigint       | Идентификатор раздела                         |
| TABLET_PATH        | varchar(256) | Путь к Tablet                                 |
| TABLET_LOCAL_SIZE  | bigint       | Размер Tablet в локальном хранилище            |
| TABLET_REMOTE_SIZE | bigint       | Размер Tablet в удалённом хранилище            |
| VERSION_COUNT      | bigint       | Количество версий                             |
| SEGMENT_COUNT      | bigint       | Размер сегмента                               |
| NUM_COLUMNS        | bigint       | Количество столбцов                           |
| ROW_SIZE           | bigint       | Размер строки                                 |
| COMPACTION_SCORE   | int          | Оценка компактации                            |
| COMPRESS_KIND      | varchar(256) | Тип сжатия                                    |
| IS_USED            | bool         | Открыт ли каталог данных Tablet               |
| IS_ALTER_FAILED    | bool         | Завершилась ли операция alter с ошибкой        |
| CREATE_TIME        | datetime     | Время создания Tablet                         |
| UPDATE_TIME        | datetime     | Время последней записи в Tablet               |
| IS_OVERLAP         | bool         | Перекрываются ли Tablet                       |

## Семантика размера данных в режиме разделения вычислений и хранения {#data-size-semantics-in-compute-storage-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

Данные этой таблицы поступают непосредственно от BE. Значения `TABLET_LOCAL_SIZE` и `TABLET_REMOTE_SIZE` определяются фактическим местом хранения rowset: rowset, хранящиеся в удалённом хранилище, учитываются в `TABLET_REMOTE_SIZE`. В режиме разделения вычислений и хранения данные находятся в удалённом хранилище, поэтому их размер отображается в `TABLET_REMOTE_SIZE`.

Начиная с версии 4.0.8, [`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET) и [`information_schema.partitions`](./partitions) согласованы с этой таблицей: в режиме разделения вычислений и хранения размер данных везде отображается как размер в удалённом хранилище. До версии 4.0.8 данные из этих трёх источников могли противоречить друг другу.
