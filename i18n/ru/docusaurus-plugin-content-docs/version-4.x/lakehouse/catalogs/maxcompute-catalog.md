---
{
    "title": "MaxCompute Catalog",
    "language": "ru",
    "description": "MaxCompute Catalog в Apache Doris поддерживает федеративные запросы к данным Alibaba Cloud MaxCompute, обеспечивая интеграцию и обратную запись данных для аналитики по нескольким источникам без переноса данных."
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) — корпоративное облачное хранилище данных SaaS (Software as a Service) в Alibaba Cloud. С помощью открытого SDK для работы с хранилищем, предоставляемого MaxCompute, Doris может получать сведения о таблицах MaxCompute, выполнять запросы и записывать данные.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| ---- | ---- |
| Интеграция данных | Чтение данных MaxCompute и запись во внутренние таблицы Doris. |
| Обратная запись данных | Запись данных в таблицы MaxCompute с помощью команды INSERT. (Поддерживается начиная с версии 4.1.0.) |

## Примечания по использованию {#usage-notes}

1. Начиная с версии 2.1.7, MaxCompute Catalog разработан на основе [Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1). В более ранних версиях он был разработан на основе Tunnel API.

2. При использовании Open Storage SDK действуют определённые ограничения. См. раздел `Usage Limitations` в этом [документе](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1).

3. В версиях Doris до 3.1.3 проект MaxCompute соответствует базе данных Doris. В версии 3.1.3 можно добавить уровень схем MaxCompute с помощью параметра `mc.enable.namespace.schema`.

## Настройка Catalog {#configuring-catalog}

### Синтаксис {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McAuthProperties},
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McAuthProperties}`

    Эти свойства определяют способ аутентификации Doris в MaxCompute для операций запроса и записи.

    > Примечание о версиях: `mc.auth.type`, `mc.ram_role_arn` и `mc.ecs_ram_role` поддерживаются начиная с **4.0.4**.

    | Имя свойства | Значение по умолчанию | Описание | Обязательность | Поддерживаемые версии Doris |
    | --- | --- | --- | --- | --- |
    | `mc.auth.type` | `ak_sk` | Тип аутентификации. Поддерживаемые значения: `ak_sk`, `ram_role_arn` и `ecs_ram_role`. | Нет | 4.0.4 и более поздние |
    | `mc.access_key` | Нет | AccessKey Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ak_sk` (по умолчанию) или `ram_role_arn`. | |
    | `mc.secret_key` | Нет | SecretKey Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ak_sk` (по умолчанию) или `ram_role_arn`. | |
    | `mc.ram_role_arn` | Нет | ARN роли RAM в Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ram_role_arn`. | 4.0.4 и более поздние |
    | `mc.ecs_ram_role` | Нет | Имя роли ECS RAM в Alibaba Cloud, привязанной к экземпляру. | Обязательно, если `mc.auth.type` имеет значение `ecs_ram_role`. | 4.0.4 и более поздние |

    Поддерживаемые значения `mc.auth.type`:

    | Значение | Описание |
    | --- | --- |
    | `ak_sk` | Использовать AccessKey и SecretKey Alibaba Cloud напрямую. |
    | `ram_role_arn` | Использовать `mc.access_key` и `mc.secret_key` в качестве исходных учётных данных для вызова STS `AssumeRole`, затем обращаться к MaxCompute с полученными временными учётными данными. |
    | `ecs_ram_role` | Получать временные учётные данные из службы метаданных ECS. Убедитесь, что узлы Doris FE и BE, обращающиеся к MaxCompute, могут использовать роль, указанную в `mc.ecs_ram_role`. |

    Правила проверки:

    1. Если `mc.auth.type` не указан, Doris использует `ak_sk`.
    2. Если `mc.auth.type` имеет значение `ram_role_arn`, необходимо настроить `mc.access_key`, `mc.secret_key` и `mc.ram_role_arn`.
    3. Если `mc.auth.type` имеет значение `ecs_ram_role`, необходимо настроить `mc.ecs_ram_role`.
    4. При использовании `mc.access_key` и `mc.secret_key` их необходимо задавать вместе.

    Примеры SQL для разных типов аутентификации см. в разделе [Базовый пример](#basic-example).

* `{McRequiredProperties}`

    | Имя свойства | Описание | Поддерживаемые версии Doris |
    | --- | --- | --- |
    | `mc.default.project` | Имя проекта MaxCompute, к которому требуется доступ. Создавать проекты и управлять ими можно в [списке проектов MaxCompute](https://maxcompute.console.aliyun.com/cn-beijing/project-list). | |
    | `mc.region` | Регион, в котором активирован MaxCompute. Соответствующий регион можно определить по Endpoint. | До 2.1.7, не включая эту версию |
    | `mc.endpoint` | Регион, в котором активирован MaxCompute. Инструкции по настройке см. ниже в разделе «Как получить Endpoint и квоту». | 2.1.7 и более поздние |

* `{McOptionalProperties}`

    | Имя свойства | Значение по умолчанию | Описание | Поддерживаемые версии Doris |
    | --- | --- | --- | --- |
    | `mc.tunnel_endpoint` | Нет | См. раздел «Пользовательский адрес сервиса» в приложении. | До 2.1.7, не включая эту версию |
    | `mc.odps_endpoint` | Нет | См. раздел «Пользовательский адрес сервиса» в приложении. | До 2.1.7, не включая эту версию |
    | `mc.quota` | `pay-as-you-go` | Имя квоты. Инструкции по настройке см. ниже в разделе «Как получить Endpoint и квоту». | 2.1.7 и более поздние |
    | `mc.split_strategy` | `byte_size` | Задаёт способ разбиения на Split. Можно выбрать разбиение по размеру в байтах `byte_size` или по количеству строк `row_count`. | 2.1.7 и более поздние |
    | `mc.split_byte_size` | `268435456` | Размер файла, считываемого каждым Split, в байтах. Значение по умолчанию — 256 МБ. Действует только при `"mc.split_strategy" = "byte_size"`. | 2.1.7 и более поздние |
    | `mc.split_row_count` | `1048576` | Количество строк, считываемых каждым Split. Действует только при `"mc.split_strategy" = "row_count"`. | 2.1.7 и более поздние |
    | `mc.split_cross_partition` | `false` | Могут ли создаваемые Split охватывать несколько разделов. | 2.1.8 и более поздние |
    | `mc.connect_timeout` | `10s` | Время ожидания подключения к MaxCompute. | 2.1.8 и более поздние |
    | `mc.read_timeout` | `120s` | Время ожидания чтения из MaxCompute. | 2.1.8 и более поздние |
    | `mc.retry_count` | `4` | Количество повторных попыток после истечения времени ожидания. | 2.1.8 и более поздние |
    | `mc.datetime_predicate_push_down` | `true` | Разрешать ли проталкивание предикатов для типов `timestamp/timestamp_ntz`. При синхронизации этих двух типов Doris теряет точность (9 -> 6). Поэтому, если точность исходных данных превышает 6 знаков, проталкивание предикатов может привести к неточным результатам. | 2.1.9/3.0.5 и более поздние |
    | `mc.account_format` | `name` | Системы учётных записей международного и китайского сайтов Alibaba Cloud различаются. Если вы используете международный сайт и сталкиваетесь с ошибками вида `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`, можно установить для этого параметра значение `id`. | 3.0.9/3.1.1 и более поздние |
    | `mc.enable.namespace.schema` | `false` | Поддерживать ли уровень Schema в MaxCompute. См.: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 и более поздние |
    | `mc.max_field_size_bytes` | `8388608` (8 МБ) | Максимально допустимое количество байтов для одного поля в сеансе записи. Если записываемые данные содержат большие строковые или двоичные поля, запись может завершиться ошибкой при превышении этого значения. Значение можно увеличить с учётом фактических данных. | 4.1.0 и более поздние |
    | `test_connection` | `false` | Проверять ли возможность подключения при создании Catalog. При значении `true` Doris проверяет доступ с заданными AK/SK, Endpoint и `mc.project`; если включён `mc.enable.namespace.schema`, также должен быть доступен список схем. `CREATE CATALOG` немедленно завершается ошибкой, если проверка не пройдена. | 4.1.4 и более поздние |

    > Начиная с версии 4.1.4, `mc.connect_timeout`, `mc.read_timeout` и `mc.retry_count` фактически применяются к базовому REST-клиенту. В более ранних версиях эти три свойства можно было задать, но они не оказывали влияния.

    - `mc.max_field_size_bytes`

        По умолчанию MaxCompute допускает не более 8 МБ на поле. Если записываемые данные содержат большие строковые или двоичные поля, запись может завершиться ошибкой.

        Чтобы изменить это ограничение, сначала выполните следующую команду в SQL-редакторе консоли MaxCompute:

        `setproject odps.sql.cfile2.field.maxsize=262144;`

        Эта команда изменяет максимальный размер одного поля. Единица измерения — КБ, максимальное значение — 262144.

        Затем задайте для `mc.max_field_size_bytes` соответствующее значение в байтах в свойствах Catalog в Doris (это значение не должно превышать настройку MaxCompute).

* `{CommonProperties}`

    Раздел CommonProperties предназначен для задания общих свойств. См. раздел «Общие свойства» в [обзоре Catalog](../catalog-overview.md).

## Кэш метаданных {#meta-cache}

Чтобы ускорить доступ к внешним источникам данных, Apache Doris кэширует метаданные MaxCompute. К метаданным относятся структура таблиц (Schema) и списки разделов.

:::tip
В версиях до Doris 4.1.x кэширование метаданных в основном управляется глобально с помощью параметров конфигурации FE. Подробнее см. в разделе [Кэш метаданных](../meta-cache.md).
Начиная с Doris 4.1.x, внешний кэш метаданных MaxCompute Catalog настраивается с помощью унифицированных ключей `meta.cache.*`.
:::

### Настройка свойств кэша (4.1.x+) {#meta-cache-unified-model}

Для элементов кэша MaxCompute используется формат ключей конфигурации `meta.cache.maxcompute.<entry>.{enable,ttl-second,capacity}`. В настоящее время кэши MaxCompute ограничиваются по количеству записей и не поддерживают `max-weight` на уровне отдельного кэша; см. [Управление памятью внешнего кэша метаданных](../external-meta-cache-memory-management).

| Свойство | Пример | Значение |
|---|---|---|
| `enable` | `true/false` | Включать ли этот модуль кэша. |
| `ttl-second` | `600`, `0`, `-1` | `0` отключает кэш (вступает в силу немедленно и позволяет увидеть актуальные данные); `-1` означает неограниченный срок хранения; другие положительные целые числа задают TTL в секундах, отсчитываемый с момента доступа. |
| `capacity` | `10000` | Максимальное количество записей в кэше. `0` отключает кэш. |

**Условия работы:** Кэш модуля действует только при `enable=true`, `ttl-second != 0` и `capacity > 0`.

### Модули кэша {#meta-cache-unified-modules}

MaxCompute Catalog включает следующие модули кэша:

| Модуль (`<entry>`) | Префикс ключей свойств | Кэшируемое содержимое и влияние |
|---|---|---|
| `schema` | `meta.cache.maxcompute.schema.` | Кэширует структуру таблиц. Влияет на видимость сведений о столбцах таблиц. Если отключён, актуальная Schema загружается при каждом запросе. |
| `partition_values` | `meta.cache.maxcompute.partition_values.` | Кэширует списки значений разделов. Влияет на отсечение и перечисление разделов. Если отключён, новые внешние разделы видны в реальном времени. |

### Сопоставление и преобразование устаревших параметров {#meta-cache-mapping}

В версии 4.1.x и более поздних рекомендуется использовать унифицированные ключи. Ниже приведено соответствие между устаревшими свойствами Catalog и унифицированными ключами 4.1.x+:

| Ключ устаревшего свойства | Унифицированный ключ 4.1.x+ | Описание |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.maxcompute.schema.ttl-second` | Срок действия кэша структуры таблиц |

### Рекомендации {#meta-cache-best-practices}

* **Доступ к актуальным данным в реальном времени**: Чтобы каждый запрос учитывал последние изменения разделов или схем таблиц MaxCompute, можно задать для `ttl-second` в `schema` или `partition_values` значение `0`.
  ```sql
  -- Disable partition value cache to detect the latest partitions in MaxCompute tables
  ALTER CATALOG mc_ctl SET PROPERTIES ("meta.cache.maxcompute.partition_values.ttl-second" = "0");
  ```
* **Примечание**: Начиная с Doris 4.1.4, успешное изменение свойств Catalog сбрасывает контекст выполнения Catalog и очищает инициализированные записи во всех движках кэша метаданных, к которым обращается этот Catalog. При следующем обращении Doris создаёт их заново с новым контекстом и конфигурацией; выполняющиеся запросы не затрагиваются.

### Наблюдаемость {#meta-cache-unified-observability}

Метрики кэша можно просматривать в системной таблице `information_schema.catalog_meta_cache_statistics`:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'mc_ctl' AND engine_name = 'maxcompute'
ORDER BY entry_name;
```

См. документацию по этой системной таблице: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### Поддерживаемые версии MaxCompute {#supported-maxcompute-versions}

Поддерживается только версия MaxCompute для публичного облака. По вопросам поддержки версии для частного облака обратитесь за помощью к сообществу Doris.

### Поддерживаемые таблицы MaxCompute {#supported-maxcompute-tables}

* Поддерживается чтение секционированных таблиц, кластеризованных таблиц и материализованных представлений.

* Чтение внешних таблиц MaxCompute, логических представлений и Delta Tables не поддерживается.

## Сопоставление уровней иерархии {#hierarchy-mapping}

- Если `mc.enable.namespace.schema` имеет значение `false`

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Неприменимо |
  | База данных | Проект |
  | Таблица | Таблица |

- Если `mc.enable.namespace.schema` имеет значение `true`

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Проект |
  | База данных | Schema |
  | Таблица | Таблица |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип MaxCompute | Тип Doris | Примечание |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| boolean | boolean | |
| tiny | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| int | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | 1 <= P <= 38, 0 <= S <= 18 |
| char(N) | char(N) | |
| varchar(N) | varchar(N) | |
| string | string | |
| date | date | |
| datetime | datetime(3) | Фиксированное сопоставление с точностью 3. Часовой пояс можно задать с помощью `SET [GLOBAL] time_zone = 'Asia/Shanghai'`. |
| timestamp_ntz | datetime(6) | Точность `timestamp_ntz` в MaxCompute равна 9, а максимальная точность DATETIME в Doris — только 6, поэтому при чтении данных лишняя часть отбрасывается. |
| timestamp | datetime(6) | Поддерживается начиная с 2.1.9/3.0.5. Точность `timestamp` в MaxCompute равна 9, а максимальная точность DATETIME в Doris — только 6, поэтому при чтении данных лишняя часть отбрасывается. |
| array | array | |
| map | map | |
| struct | struct | |
| other | UNSUPPORTED | |

## Базовый пример {#basic-example}

Аутентификация `ak_sk`, используемая по умолчанию:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

Аутентификация `ram_role_arn` (4.0.4+):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ram_role_arn',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.ram_role_arn' = 'acs:ram::<your_account_id>:role/<your_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

Аутентификация `ecs_ram_role` (4.0.4+):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ecs_ram_role',
    'mc.ecs_ram_role' = '<your_ecs_ram_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

Если используется версия ранее 2.1.7, выполните следующий оператор (рекомендуется обновиться до 2.1.8 или более поздней версии):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```

С поддержкой Schema:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```

## Операции запроса {#query-operations}

### Базовый запрос {#basic-query}

```sql
-- 1. Switch to Catalog, use database and query
SWITCH mc_ctl;
USE mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. Use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. Use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

### Оптимизация запросов {#query-optimization}

- Оптимизация запросов с LIMIT (начиная с 4.1.0)

    Этот параметр применим только к сценариям, в которых `LIMIT 1` часто используется для проверки наличия данных.

    Если запрос к таблице MaxCompute содержит только предикаты равенства для столбцов разделов (`=` или `IN`) и предложение `LIMIT`, можно включить переменную сеанса `enable_mc_limit_split_optimization`, чтобы оптимизировать стратегию создания Split.

    При включении система использует стратегию `row_offset` и считывает только необходимое количество строк, вместо того чтобы создавать Split для всех данных. Это позволяет сократить количество Split до одного и значительно уменьшить задержку выполнения запроса.

    Эта оптимизация применяется к запросам вида:

    ```sql
    SELECT * FROM mc_tbl WHERE pt = 'value' LIMIT 100;
    SELECT * FROM mc_tbl WHERE pt IN ('v1', 'v2') LIMIT 100;
    ```

    Для включения:

    ```sql
    SET enable_mc_limit_split_optimization = true;
    ```

    > По умолчанию этот параметр отключён. Оптимизация не действует, если запрос содержит фильтры по столбцам, не входящим в ключ раздела, предикаты, отличные от равенства (например, `>`, `<`, `!=`), или не содержит предложения `LIMIT`.

## Операции записи {#write-operations}

Начиная с версии 4.1.0, Doris поддерживает запись в таблицы MaxCompute. С помощью стандартных операторов INSERT можно записывать данные из других источников непосредственно в таблицы MaxCompute через Doris.

:::note
- Это экспериментальная функция, поддерживаемая начиная с версии 4.1.0.
- Поддерживается запись как в секционированные, так и в несекционированные таблицы.
- Запись в кластеризованные таблицы, транзакционные таблицы, Delta Tables и внешние таблицы не поддерживается.
:::

### INSERT INTO {#insert-into}

Операция INSERT добавляет данные в целевую таблицу.

Пример:

```sql
INSERT INTO mc_tbl values (val1, val2, val3, val4);
INSERT INTO mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO mc_tbl(col1, col2) values (val1, val2);
INSERT INTO mc_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");

-- Write to specified partition (you can specify only some partition columns, with remaining partitions written dynamically)
INSERT INTO mc_tbl PARTITION(ds='20250201') SELECT id, name FROM source_tbl;
INSERT INTO mc_tbl PARTITION(ds='20250101', region='bj') VALUES (1, 'v1'), (2, 'v2');
```

### INSERT OVERWRITE {#insert-overwrite}

INSERT OVERWRITE полностью заменяет существующие данные в таблице новыми.

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### CTAS {#ctas}

С помощью оператора `CTAS` можно создать таблицу MaxCompute и записать в неё данные:

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```

## Управление базами данных и таблицами {#database-and-table-management}

Начиная с версии 4.1.0, Doris поддерживает создание и удаление баз данных и таблиц MaxCompute.

:::note
- Это экспериментальная функция, поддерживаемая начиная с версии 4.1.0.
- Поддерживается создание и удаление секционированных и несекционированных таблиц.
- Создание кластеризованных таблиц, транзакционных таблиц, Delta Tables и внешних таблиц не поддерживается.
:::

При создании или удалении баз данных и таблиц Doris вызывает соответствующий API MaxCompute. После завершения операции требуется небольшое время, прежде чем изменения метаданных на стороне MaxCompute станут полностью видны последующим операциям.

Эта функция доступна только в том случае, если свойство `mc.enable.namespace.schema` имеет значение `true`.

### Создание и удаление баз данных {#creating-and-dropping-databases}

Можно переключиться на соответствующий Catalog с помощью оператора `SWITCH` и выполнить оператор `CREATE DATABASE`:

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```

Также можно создать базу данных, указав полное имя:

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```

Удаление базы данных:

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```

:::caution
При удалении базы данных MaxCompute также удаляются все входящие в неё таблицы.
:::

### Создание и удаление таблиц {#creating-and-dropping-tables}

* **Создание**

  Doris поддерживает создание секционированных и несекционированных таблиц в MaxCompute.

  Пример:

  ```sql
  CREATE TABLE mc_schema.mc_tbl1 (
      bool_col BOOLEAN,
      int_col INT,
      bigint_col BIGINT,
      float_col FLOAT,
      double_col DOUBLE,
      decimal_col DECIMAL(18,6),
      string_col STRING,
      varchar_col VARCHAR(200),
      char_col CHAR(50),
      date_col DATE,
      datetime_col DATETIME,
      arr_col ARRAY<STRING>,
      map_col MAP<STRING, STRING>,
      struct_col STRUCT<f1:STRING, f2:INT>
  );

  CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
  )
  PARTITION BY (ds, region)();
  ```

* **Удаление**

  Таблицу MaxCompute можно удалить с помощью оператора `DROP TABLE`. В настоящее время при удалении таблицы также удаляются её данные, включая данные разделов.

  Пример:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```

## Часто задаваемые вопросы {#faq}

### Как получить Endpoint и квоту (для Doris 2.1.7 и более поздних версий) {#how-to-obtain-endpoint-and-quota-applicable-for-doris-217-and-later}

1. Если используются выделенные группы ресурсов сервиса передачи данных

    Чтобы предоставить необходимые разрешения, см. раздел «2. Авторизация» главы «Использование выделенных групп ресурсов сервиса данных» в этом [документе](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts). В списке «Управление квотами» найдите и скопируйте соответствующее значение `QuotaName`, затем укажите `"mc.quota" = "QuotaName"`. В этом случае для доступа к MaxCompute можно использовать как VPC, так и публичную сеть, однако VPC обеспечивает гарантированную пропускную способность, а ресурсы пропускной способности публичной сети ограничены.

2. Если используется оплата по мере использования

    Чтобы включить Open Storage (Storage API) и предоставить разрешения пользователю, которому принадлежат AK и SK, см. раздел «Использование Open Storage (оплата по мере использования)» в этом [документе](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1). В этом случае `mc.quota` имеет значение по умолчанию `pay-as-you-go`, и отдельно указывать его не требуется. При оплате по мере использования доступ к MaxCompute возможен только через VPC; доступ через публичную сеть недоступен. Обращаться к MaxCompute через публичную сеть могут только пользователи с предоплатой.

3. Настройте `mc.endpoint` в соответствии со «Справочной таблицей Endpoint по регионам» в [документации Alibaba Cloud по Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)

    При доступе через VPC необходимо настроить `mc.endpoint` по столбцу «Endpoint сети VPC» таблицы «Справочная таблица Endpoint по регионам (подключение через сеть Alibaba Cloud VPC)». При доступе через публичную сеть для настройки можно выбрать значение из столбца «Endpoint классической сети» таблицы «Справочная таблица Endpoint по регионам (подключение через классическую сеть Alibaba Cloud)» или из столбца «Endpoint внешней сети» таблицы «Справочная таблица Endpoint по регионам (подключение через внешнюю сеть)» и указать его в `mc.endpoint`.

### Пользовательский адрес сервиса (для версий до Doris 2.1.7) {#custom-service-address-applicable-for-versions-before-doris-217}

В версиях до Doris 2.1.7 для взаимодействия с MaxCompute используется Tunnel SDK, поэтому требуются следующие два свойства Endpoint:

* `mc.odps_endpoint`: Endpoint MaxCompute, используемый для получения метаданных MaxCompute (сведений о базах данных и таблицах).

* `mc.tunnel_endpoint`: Endpoint Tunnel, используемый для чтения данных MaxCompute.

По умолчанию MaxCompute Catalog формирует адреса Endpoint на основе `mc.region` и `mc.public_access`.

Формат формируемых адресов:

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| --- | --- | --- |
| `false` | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true` | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

Также можно отдельно задать `mc.odps_endpoint` и `mc.tunnel_endpoint`, чтобы использовать собственные адреса сервиса. Это подходит для частных развёртываний MaxCompute.

Инструкции по настройке Endpoint MaxCompute и Endpoint Tunnel см. в разделе [Endpoint для разных регионов и способов сетевого подключения](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints).

### Контроль использования ресурсов {#resource-usage-control}

Чтобы контролировать потребление ресурсов сервиса передачи данных, можно регулировать [параллелизм запросов на уровне таблицы](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2) с помощью двух переменных сеанса: `parallel_pipeline_task_num` и `num_scanner_threads`. Соответствующий параллелизм равен `max(parallel_pipeline_task_num * be num * num_scanner_threads)`.

Примечание:

1. Этот способ позволяет контролировать количество одновременных обращений только к одной таблице в рамках одного запроса и не позволяет управлять использованием ресурсов несколькими операторами SQL.

2. Уменьшение параллелизма увеличивает время выполнения запроса.

### Рекомендации по записи {#write-best-practices}

- По возможности рекомендуется записывать данные в явно указанные разделы, например `INSERT INTO mc_tbl PARTITION(ds='20250201')`. Если раздел не указан, из-за ограничений MaxCompute Storage API данные каждого раздела необходимо записывать последовательно. Поэтому план выполнения включает сортировку данных по столбцам разделов, которая при большом объёме данных может потреблять значительные ресурсы памяти и приводить к ошибке записи.

- При записи без указания раздела не задавайте `SET enable_strict_consistency_dml = false`. Эта настройка принудительно удаляет узел сортировки, из-за чего данные разделов записываются в произвольном порядке, что в итоге приводит к ошибке MaxCompute.

- Не добавляйте предложение `LIMIT`. При добавлении `LIMIT` Doris использует для записи только один поток, чтобы гарантировать заданное количество записей. Это подходит для небольших тестов, но при большом значении `LIMIT` производительность записи будет низкой.

### Ошибка записи: `Data invalid: ODPS-0020041:StringOutOfMaxLength` {#write-error-data-invalid-odps-0020041stringoutofmaxlength}

См. описание `mc.max_field_size_bytes`.
