---
{
    "title": "SHOW TABLET",
    "language": "ru",
    "description": "Просмотр сведений о tablet: поиск отдельного tablet по идентификатору или вывод размещения реплик, версий и размера данных для всех tablet в таблице или партиции.",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "сведения о tablet в Doris",
        "размещение реплик",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "диагностика проблем с tablet"
    ]
}
---

## Описание {#description}

`SHOW TABLET` позволяет просматривать сведения о tablet (доступно только администраторам) и имеет две формы:

- `SHOW TABLET <tablet_id>`: по идентификатору tablet определяет базу данных, таблицу, партицию и индекс, к которым он относится.
- `SHOW TABLETS FROM <table_name>`: выводит размещение реплик, версии, размер данных и состояние компактизации для всех tablet в таблице или в указанных партициях.

Обе формы часто используют вместе: с помощью первой находят tablet, а с помощью второй просматривают остальные реплики в той же партиции.

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info Примечание

Оба оператора поддерживают только таблицы во внутреннем Catalog. Внешние Catalog не поддерживаются.

:::

## Синтаксис {#syntax}

```sql
-- Inspect a single tablet by its id
SHOW TABLET <tablet_id>

-- List every tablet of a table
SHOW TABLETS FROM <table_name>
    [ PARTITIONS ( <partition_name> [, ... ] ) ]
    [ WHERE <where_condition> ]
    [ ORDER BY <column_name> [ ASC | DESC ] [, ... ] ]
    [ LIMIT [ <offset>, ] <row_count> ]
```

## Параметры {#parameters}

### SHOW TABLET {#show-tablet}

**1. `<tablet_id>`**

> Обязательный параметр. ID tablet, сведения о котором нужно получить.

### SHOW TABLETS FROM {#show-tablets-from}

**1. `<table_name>`**

> Обязательный параметр. Имя таблицы. Поддерживается форма `db_name.table_name`.

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> Необязательный параметр. Ограничивает результат указанными партициями. Если параметр не задан, просматриваются все партиции таблицы.

**3. `WHERE <where_condition>`**

> Необязательный параметр. Условие фильтрации. Поддерживаются только сравнения на равенство по следующим трём полям, объединённые с помощью `AND`:
>
> | Поле | Тип | Описание |
> | --- | --- | --- |
> | `Version` | Integer | Фильтрует по версии реплики |
> | `BackendId` | Integer | Фильтрует по ID узла BE, на котором размещена реплика |
> | `State` | String | Фильтрует по состоянию реплики: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
>
> Использование других полей, сравнений, отличных от равенства, или `OR` приводит к ошибке:
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> Необязательный параметр. Сортирует результат по одному из его столбцов. Столбец сортировки должен входить в список столбцов в разделе «Возвращаемое значение» ниже.
>
> Если указан `ORDER BY`, Doris собирает сведения обо всех tablet перед сортировкой, поэтому результат представляет собой **глобально упорядоченный** Top-N.

**5. `LIMIT [ <offset>, ] <row_count>`**

> Необязательный параметр. Ограничивает число возвращаемых строк. Рекомендуется для таблиц с большим количеством tablet.
>
> `LIMIT` и `OFFSET` применяются после сортировки. Если `ORDER BY` не указан, сканирование останавливается, как только собрано достаточно строк: при наличии `LIMIT` возвращаются первые строки в порядке сканирования; без `LIMIT` весь результат упорядочивается по `(TabletId, ReplicaId)`.

:::caution Изменение поведения (4.1.4)

- До 4.1.4 оператор `ORDER BY` мог сортировать только те строки, до которых сканирование дошло в первую очередь, поэтому результат не был истинным глобальным Top-N. Начиная с 4.1.4 сведения обо всех tablet собираются перед сортировкой.
- До 4.1.4 параметр `OFFSET`, заданный отдельно (без положительного `LIMIT`), игнорировался, а значение `OFFSET`, превышающее общее число строк, приводило к очистке всего результата. Начиная с 4.1.4 параметр `OFFSET` учитывается всегда.

:::

## Возвращаемое значение {#return-value}

### SHOW TABLET {#show-tablet-1}

| Столбец        | Тип данных | Примечание                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | Имя базы данных, содержащей tablet.                     |
| TableName     | String   | Имя таблицы, содержащей tablet.                        |
| PartitionName | String   | Имя партиции, содержащей tablet.                    |
| IndexName     | String   | Имя индекса, содержащего tablet.                        |
| DbId          | Int      | ID базы данных.                                                |
| TableId       | Int      | ID таблицы.                                                   |
| PartitionId   | Int      | ID партиции.                                               |
| IndexId       | Int      | ID индекса.                                                   |
| IsSync        | Boolean  | Синхронизирован ли tablet со своими репликами.                       |
| Order         | Int      | Порядковый номер tablet в индексе.                              |
| QueryHits     | Int      | Число запросов к этому tablet.                               |
| WindowAccessCount | Int  | Число обращений к этому tablet в пределах скользящего окна статистики. |
| LastAccessTime| Int      | Временная метка последнего обращения к этому tablet в миллисекундах. `0`, если обращений не было. |
| DetailCmd     | String   | Команда для получения более подробных сведений о tablet.         |

### SHOW TABLETS FROM {#show-tablets-from-1}

Каждая строка соответствует одной реплике, поэтому один и тот же `TabletId` встречается по одному разу на каждую реплику.

| Столбец | Тип данных | Примечание |
|---|---|---|
| TabletId | Int | ID tablet |
| ReplicaId | Int | ID реплики |
| BackendId | Int | ID узла BE, на котором размещена реплика |
| SchemaHash | Int | Хеш схемы реплики |
| Version | Int | Текущая видимая версия реплики |
| LstSuccessVersion | Int | Последняя успешно загруженная версия |
| LstFailedVersion | Int | Последняя версия с ошибкой. `-1` означает, что версий с ошибками нет |
| LstFailedTime | String | Время последней ошибки версии. `\N`, если ошибок не было |
| LocalDataSize | Int | Размер локальных данных реплики в байтах. В режиме с разделением вычислений и хранения обычно равен `0`, см. раздел «Семантика размера данных в режиме разделения вычислений и хранения» ниже |
| RemoteDataSize | Int | Размер удалённо хранимых данных реплики в байтах |
| RowCount | Int | Число строк в реплике |
| State | String | Состояние реплики: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
| LstConsistencyCheckTime | String | Время последней проверки согласованности. `\N`, если проверка никогда не выполнялась |
| CheckVersion | Int | Версия последней проверки согласованности. `-1` означает, что проверка никогда не выполнялась |
| VisibleVersionCount | Int | Число видимых версий реплики |
| VersionCount | Int | Общее число версий реплики. Позволяет оценить, не отстаёт ли компактизация |
| QueryHits | Int | Число запросов к этой реплике |
| WindowAccessCount | Int | Число обращений к этому tablet в пределах скользящего окна статистики |
| LastAccessTime | Int | Временная метка последнего обращения к этому tablet в миллисекундах. `0`, если обращений не было |
| PathHash | Int | Хеш каталога данных, в котором размещена реплика |
| Path | String | Корневой каталог данных BE, в котором размещена реплика. Пустое значение, если определить каталог не удалось |
| MetaUrl | String | HTTP-адрес для просмотра метаданных реплики в формате `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | HTTP-адрес для просмотра состояния компактизации реплики в формате `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | ID реплики Cooldown. `-1`, если многоуровневое хранение не включено |
| CooldownMetaId | String | ID метаданных Cooldown. Пустое значение, если многоуровневое хранение не включено |
| PrimaryBackendId | Int | ID основного узла BE для этого tablet. **Возвращается только в режиме с разделением вычислений и хранения** |

### Семантика размера данных в режиме разделения вычислений и хранения {#data-size-semantics-in-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution Изменение поведения (4.0.8)

Начиная с версии 4.0.8 размер данных реплики в режиме с разделением вычислений и хранения всегда отражает **удалённое** хранение: объём данных, который в статистике реплики не отмечен как удалённый, учитывается в `RemoteDataSize`, а соответствующее значение `LocalDataSize` выводится как `0`. Поэтому в кластере с разделением вычислений и хранения значение `LocalDataSize` обычно равно `0`, а фактический размер данных указан в `RemoteDataSize`.

До 4.0.8 этот объём данных учитывался в `LocalDataSize`, из-за чего `SHOW TABLETS`, [`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions) и [`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) противоречили друг другу в отношении локального и удалённого хранения. Изменение затрагивает только отображение размера данных; оно не меняет ни место хранения данных, ни их объём.

:::

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия  | Объект   | Примечания                                                                                    |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | Global   | Для обоих операторов требуется глобальная привилегия `ADMIN`. В противном случае возникает ошибка `Access denied`. |

## Примеры {#examples}

### Просмотр отдельного tablet по идентификатору {#inspect-a-single-tablet-by-its-id}

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | WindowAccessCount | LastAccessTime | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | 0                 | 0              | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
```

Оператор `SHOW PROC`, указанный в столбце `DetailCmd`, позволяет подробнее просмотреть реплики этого tablet.

### Вывод всех tablet таблицы {#list-every-tablet-of-a-table}

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### Ограничение результата указанными партициями {#restrict-the-result-to-specific-partitions}

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### Фильтрация по состоянию реплики и узлу размещения {#filter-by-replica-state-and-hosting-node}

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### Поиск tablet с отставанием компактизации {#find-tablets-where-compaction-is-lagging}

Сортировка по числу версий в порядке убывания позволяет выявить tablet с наибольшей нагрузкой на компактизацию:

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

Столбец `CompactionStatus` в результате содержит HTTP-адрес; откройте его в браузере, чтобы просмотреть подробное состояние компактизации этой реплики.

### Поиск неравномерного распределения данных {#find-data-skew}

Сортировка по размеру данных в порядке убывания позволяет быстро выявить tablet, которые заметно крупнее остальных:

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
