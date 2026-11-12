---
{
    "title": "MaxCompute Catalog",
    "language": "ru",
    "description": "Apache Doris MaxCompute Catalog поддерживает федеративные запросы к данным Alibaba Cloud MaxCompute, обеспечивая интеграцию данных и обратную запись для аналитики по разным источникам без миграции данных."
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) — корпоративное облачное хранилище данных на платформе Alibaba Cloud, предоставляемое по модели SaaS (программное обеспечение как услуга). Через открытый SDK для работы с хранилищем, предоставляемый MaxCompute, Doris может получать сведения о таблицах MaxCompute, выполнять запросы и записывать данные.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| ---- | ---- |
| Интеграция данных | Чтение данных MaxCompute и запись во внутренние таблицы Doris. |
| Обратная запись данных | Запись данных в таблицы MaxCompute с помощью команды INSERT. (Поддерживается с версии 4.1.0) |

## Примечания по использованию {#usage-notes}

1. Начиная с версии 2.1.7, MaxCompute Catalog реализован на основе [Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1). В более ранних версиях использовался Tunnel API.

2. При использовании Open Storage SDK действуют определённые ограничения. См. раздел `Usage Limitations` в этом [документе](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1).

3. В версиях Doris до 3.1.3 проект MaxCompute соответствует базе данных Doris. В версии 3.1.3 можно включить иерархию схем MaxCompute с помощью параметра `mc.enable.namespace.schema`.

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

    Эти свойства определяют способ аутентификации Doris в MaxCompute при выполнении запросов и записи данных.

    > Примечание о версиях: `mc.auth.type`, `mc.ram_role_arn` и `mc.ecs_ram_role` поддерживаются с версии **4.0.4**.

    | Имя свойства | Значение по умолчанию | Описание | Обязательность | Поддерживаемые версии Doris |
    | --- | --- | --- | --- | --- |
    | `mc.auth.type` | `ak_sk` | Тип аутентификации. Поддерживаемые значения: `ak_sk`, `ram_role_arn` и `ecs_ram_role`. | Нет | 4.0.4 и новее |
    | `mc.access_key` | Нет | AccessKey Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ak_sk` (по умолчанию) или `ram_role_arn`. | |
    | `mc.secret_key` | Нет | SecretKey Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ak_sk` (по умолчанию) или `ram_role_arn`. | |
    | `mc.ram_role_arn` | Нет | ARN роли RAM в Alibaba Cloud. | Обязательно, если `mc.auth.type` имеет значение `ram_role_arn`. | 4.0.4 и новее |
    | `mc.ecs_ram_role` | Нет | Имя роли ECS RAM в Alibaba Cloud, назначенной экземпляру. | Обязательно, если `mc.auth.type` имеет значение `ecs_ram_role`. | 4.0.4 и новее |

    Поддерживаемые значения `mc.auth.type`:

    | Значение | Описание |
    | --- | --- |
    | `ak_sk` | Непосредственное использование AccessKey и SecretKey Alibaba Cloud. |
    | `ram_role_arn` | Использование `mc.access_key` и `mc.secret_key` в качестве исходных учётных данных для вызова STS `AssumeRole` с последующим доступом к MaxCompute по полученным временным учётным данным. |
    | `ecs_ram_role` | Получение временных учётных данных из службы метаданных ECS. Убедитесь, что узлы Doris FE и BE, обращающиеся к MaxCompute, могут использовать роль, указанную в `mc.ecs_ram_role`. |

    Правила проверки:

    1. Если `mc.auth.type` не задан, Doris использует `ak_sk`.
    2. Если `mc.auth.type` имеет значение `ram_role_arn`, необходимо настроить `mc.access_key`, `mc.secret_key` и `mc.ram_role_arn`.
    3. Если `mc.auth.type` имеет значение `ecs_ram_role`, необходимо настроить `mc.ecs_ram_role`.
    4. При использовании `mc.access_key` и `mc.secret_key` их необходимо задавать вместе.

    Примеры SQL для разных типов аутентификации см. в разделе [Базовый пример](#basic-example).

* `{McRequiredProperties}`

    | Имя свойства | Описание | Поддерживаемые версии Doris |
    | --- | --- | --- |
    | `mc.default.project` | Имя проекта MaxCompute, к которому требуется доступ. Создавать проекты и управлять ими можно в [списке проектов MaxCompute](https://maxcompute.console.aliyun.com/cn-beijing/project-list). | |
    | `mc.region` | Регион, в котором активирован MaxCompute. Соответствующий регион можно определить по Endpoint. | До 2.1.7 (не включая) |
    | `mc.endpoint` | Регион, в котором активирован MaxCompute. Сведения о настройке см. ниже в разделе «Как получить Endpoint и квоту». | 2.1.7 и новее |

* `{McOptionalProperties}`

    | Имя свойства | Значение по умолчанию | Описание | Поддерживаемые версии Doris |
    | --- | --- | --- | --- |
    | `mc.tunnel_endpoint` | Нет | См. раздел «Собственный адрес службы» в приложении. | До 2.1.7 (не включая) |
    | `mc.odps_endpoint` | Нет | См. раздел «Собственный адрес службы» в приложении. | До 2.1.7 (не включая) |
    | `mc.quota` | `pay-as-you-go` | Имя квоты. Сведения о настройке см. ниже в разделе «Как получить Endpoint и квоту». | 2.1.7 и новее |
    | `mc.split_strategy` | `byte_size` | Задаёт способ разбиения на Split. Можно выбрать разбиение по размеру в байтах `byte_size` или по количеству строк `row_count`. | 2.1.7 и новее |
    | `mc.split_byte_size` | `268435456` | Размер файла, считываемого каждым Split, в байтах. По умолчанию 256 МБ. Действует только при `"mc.split_strategy" = "byte_size"`. | 2.1.7 и новее |
    | `mc.split_row_count` | `1048576` | Количество строк, считываемых каждым Split. Действует только при `"mc.split_strategy" = "row_count"`. | 2.1.7 и новее |
    | `mc.split_cross_partition` | `false` | Могут ли создаваемые Split охватывать несколько партиций. | 2.1.8 и новее |
    | `mc.connect_timeout` | `10s` | Тайм-аут подключения к MaxCompute. | 2.1.8 и новее |
    | `mc.read_timeout` | `120s` | Тайм-аут чтения из MaxCompute. | 2.1.8 и новее |
    | `mc.retry_count` | `4` | Количество повторных попыток после истечения тайм-аута. | 2.1.8 и новее |
    | `mc.datetime_predicate_push_down` | `true` | Разрешать ли передачу предикатов в источник для типов `timestamp/timestamp_ntz`. При синхронизации этих двух типов Doris теряет точность (9 -> 6). Поэтому, если точность исходных данных превышает 6 знаков, передача предикатов в источник может привести к неточным результатам. | 2.1.9/3.0.5 и новее |
    | `mc.account_format` | `name` | Системы учётных записей международного и китайского сайтов Alibaba Cloud различаются. Если при использовании международного сайта возникает ошибка вида `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`, можно установить для этого параметра значение `id`. | 3.0.9/3.1.1 и новее |
    | `mc.enable.namespace.schema` | `false` | Включать ли поддержку иерархии схем MaxCompute. См.: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 и новее |
    | `mc.max_field_size_bytes` | `8388608` (8 МБ) | Максимально допустимый размер одного поля в байтах в сеансе записи. Если записываемые данные содержат большие строковые или двоичные поля, запись может завершиться ошибкой при превышении этого значения. Значение можно увеличить в соответствии с фактическими данными. | 4.1.0 и новее |
    | `test_connection` | `false` | Проверять ли доступность соединения при создании Catalog. Если задано значение `true`, Doris проверяет доступность AK/SK, Endpoint и `mc.project`; если включено свойство `mc.enable.namespace.schema`, список схем также должен быть доступен. Операция `CREATE CATALOG` немедленно завершается ошибкой, если проверка не пройдена. | 4.1.4 и новее |

    > Начиная с версии 4.1.4, свойства `mc.connect_timeout`, `mc.read_timeout` и `mc.retry_count` действительно применяются к базовому REST-клиенту. В более ранних версиях эти три свойства можно было задать, но они не влияли на его работу.

    - `mc.max_field_size_bytes`

        По умолчанию MaxCompute допускает не более 8 МБ на поле. Если записываемые данные содержат большие строковые или двоичные поля, запись может завершиться ошибкой.

        Чтобы изменить это ограничение, сначала выполните следующую команду в редакторе SQL консоли MaxCompute:

        `setproject odps.sql.cfile2.field.maxsize=262144;`

        Эта команда изменяет максимальный размер одного поля. Единица измерения — КБ, максимальное значение — 262144.

        Затем задайте для `mc.max_field_size_bytes` соответствующее значение в байтах в свойствах Doris Catalog (оно не должно превышать значение, установленное в MaxCompute).

* `{CommonProperties}`

    Раздел CommonProperties предназначен для общих свойств. См. раздел «Общие свойства» в [обзоре Catalog](../catalog-overview.md).

## Кеш метаданных {#meta-cache}

Для повышения производительности доступа к внешним источникам данных Apache Doris кеширует метаданные MaxCompute. Метаданные включают схемы таблиц и списки партиций.

:::tip
В версиях до Doris 4.1.x кеширование метаданных в основном управляется глобально через параметры конфигурации FE. Подробнее см. в разделе [Кеш метаданных](../meta-cache.md).
Начиная с Doris 4.1.x, внешний кеш метаданных MaxCompute Catalog настраивается с помощью унифицированных ключей `meta.cache.*`. Ниже описаны элементы кеша для текущей версии; в Doris 4.1.x и 4.2.x используется другой набор элементов, описанный в версии 4.x этой страницы.
:::

### Настройка свойств кеша {#meta-cache-unified-model}

Для каждого элемента кеша используется единый формат ключа настройки: `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`. Для MaxCompute значение `<engine>` — `max_compute`.

| Свойство | Пример | Значение |
|---|---|---|
| `enable` | `true/false` | Включать ли этот элемент кеша. |
| `ttl-second` | `600`, `0`, `-1` | `0` отключает элемент (применяется немедленно и позволяет видеть актуальные данные); `-1` означает отсутствие срока действия; другие положительные целые числа задают TTL в секундах с момента доступа. |
| `capacity` | `10000` | Максимальное количество записей в кеше. `0` отключает элемент. |
| `max-weight` | `1GB` | Поддерживается с Doris 4.1.4. Необязательное ограничение оценочного объёма памяти, занимаемого элементом. Значение должно быть положительным; `0` не допускается. Поддерживается только элементами, отмеченными ниже. |

**Условия работы:** элемент действует, если `enable=true`, `ttl-second != 0` и `capacity > 0`. Ограничение памяти на уровне FE, Catalog или отдельного элемента дополнительно регулирует добавление записей с учётом оценочного потребления памяти; см. [Управление памятью внешнего кеша метаданных](../external-meta-cache-memory-management).

### Модули кеша {#meta-cache-unified-modules}

MaxCompute Catalog включает следующий элемент кеша с поддержкой `max-weight`:

| Элемент (`<entry>`) | Префикс ключа свойства | `ENTRY_NAME` | Кешируемое содержимое и влияние | Значения по умолчанию: включение / TTL / ёмкость |
|---|---|---|---|---|
| `partition` | `meta.cache.max_compute.partition.` | `max-compute-partition` | Списки партиций таблицы. Влияет на отсечение и перечисление партиций; при отключении новые партиции видны сразу. | `true` / 600 с / 10000 |

Схемы столбцов таблиц MaxCompute кешируются общим механизмом `default` (`meta.cache.default.schema.*`).

### Соответствие и преобразование устаревших параметров {#meta-cache-mapping}

| Устаревший ключ свойства | Унифицированный ключ | Описание |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` | Срок действия кеша схем таблиц |

### Рекомендации {#meta-cache-best-practices}

* **Доступ к актуальным данным в реальном времени**: чтобы каждый запрос видел актуальные партиции таблиц MaxCompute, установите TTL кеша партиций в `0`.
  ```sql
  -- Disable the partition listing cache to detect the latest partitions of MaxCompute tables
  ALTER CATALOG mc_ctl SET PROPERTIES ("meta.cache.max_compute.partition.ttl-second" = "0");
  ```
* **Примечание**: после успешного изменения свойств Catalog затронутые кеши метаданных сбрасываются и при следующем обращении создаются заново с новой конфигурацией. Изменение `meta.cache.max-weight` или `schema.cache.ttl-second` сбрасывает все кеши Catalog; изменение `meta.cache.<engine>.<entry>.*` сбрасывает кеши соответствующего механизма. Уже выполняющиеся запросы не затрагиваются.

### Наблюдаемость {#meta-cache-unified-observability}

Метрики кеша доступны в системной таблице `information_schema.catalog_meta_cache_statistics`. В столбце `ENTRY_NAME` отображаются имена, перечисленные в таблице выше, а строка механизма `default` соответствует общему кешу схем таблиц:

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'mc_ctl'
ORDER BY engine_name, entry_name;
```

См. документацию по этой системной таблице: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### Поддерживаемые версии MaxCompute {#supported-maxcompute-versions}

Поддерживается только версия MaxCompute для публичного облака. По вопросам поддержки версии для частного облака обратитесь за помощью в сообщество Doris.

### Поддерживаемые таблицы MaxCompute {#supported-maxcompute-tables}

* Поддерживается чтение партиционированных таблиц, кластеризованных таблиц и материализованных представлений.

* Не поддерживается чтение внешних таблиц MaxCompute, логических представлений и Delta Tables.

## Сопоставление иерархий {#hierarchy-mapping}

- Если `mc.enable.namespace.schema` имеет значение `false`

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | N/A |
  | База данных | Проект |
  | Таблица | Таблица |

- Если `mc.enable.namespace.schema` имеет значение `true`

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Проект |
  | База данных | Схема |
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
| timestamp_ntz | datetime(6) | Точность `timestamp_ntz` в MaxCompute составляет 9, а максимальная точность DATETIME в Doris — только 6, поэтому лишние разряды отсекаются при чтении данных. |
| timestamp | datetime(6) | Поддерживается с версии 2.1.9/3.0.5. Точность `timestamp` в MaxCompute составляет 9, а максимальная точность DATETIME в Doris — только 6, поэтому лишние разряды отсекаются при чтении данных. |
| array | array | |
| map | map | |
| struct | struct | |
| другие | UNSUPPORTED | |

## Базовый пример {#basic-example}

Аутентификация по умолчанию с помощью `ak_sk`:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

`ram_role_arn` — аутентификация (4.0.4+):

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

`ecs_ram_role` — аутентификация (4.0.4+):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ecs_ram_role',
    'mc.ecs_ram_role' = '<your_ecs_ram_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

Если используется версия до 2.1.7 (не включая), выполните следующий оператор (рекомендуется обновиться до версии 2.1.8 или новее):

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

С поддержкой схем:

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

## Выполнение запросов {#query-operations}

### Простой запрос {#basic-query}

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

- Оптимизация запросов с LIMIT (с версии 4.1.0)

    Этот параметр применим только в сценариях, где часто используется `LIMIT 1` для проверки наличия данных.

    Если при запросе к таблицам MaxCompute используются только предикаты равенства по столбцам партиционирования (`=` или `IN`) и предложение `LIMIT`, можно включить переменную сеанса `enable_mc_limit_split_optimization` для оптимизации стратегии формирования Split.

    При включении этой настройки система использует стратегию `row_offset`, чтобы прочитать только необходимое количество строк, вместо формирования Split для всех данных. Это позволяет сократить количество Split с множества до одного и значительно уменьшить задержку выполнения запроса.

    Оптимизация применяется к запросам вида:

    ```sql
    SELECT * FROM mc_tbl WHERE pt = 'value' LIMIT 100;
    SELECT * FROM mc_tbl WHERE pt IN ('v1', 'v2') LIMIT 100;
    ```

    Для включения:

    ```sql
    SET enable_mc_limit_split_optimization = true;
    ```

    > По умолчанию этот параметр отключён. Оптимизация не действует, если запрос содержит фильтры по столбцам, не участвующим в партиционировании, предикаты, отличные от равенства (например, `>`, `<`, `!=`), или не содержит предложения `LIMIT`.

## Операции записи {#write-operations}

Начиная с версии 4.1.0, Doris поддерживает запись в таблицы MaxCompute. С помощью стандартных операторов INSERT можно через Doris записывать данные из других источников непосредственно в таблицы MaxCompute.

:::note
- Это экспериментальная возможность, поддерживаемая с версии 4.1.0.
- Поддерживается запись как в партиционированные, так и в непартиционированные таблицы.
- Не поддерживается запись в кластеризованные таблицы, транзакционные таблицы, Delta Tables и внешние таблицы.
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

INSERT OVERWRITE полностью заменяет существующие данные таблицы новыми.

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### CTAS {#ctas}

Можно создать таблицу MaxCompute и записать в неё данные с помощью оператора `CTAS`:

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```

## Управление базами данных и таблицами {#database-and-table-management}

Начиная с версии 4.1.0, Doris поддерживает создание и удаление баз данных и таблиц MaxCompute.

:::note
- Это экспериментальная возможность, поддерживаемая с версии 4.1.0.
- Поддерживается создание и удаление партиционированных и непартиционированных таблиц.
- Не поддерживается создание кластеризованных таблиц, транзакционных таблиц, Delta Tables и внешних таблиц.
:::

При создании или удалении баз данных и таблиц Doris вызывает соответствующий API MaxCompute. После завершения операции требуется некоторое время, прежде чем изменения метаданных на стороне MaxCompute станут полностью видны последующим операциям.

Эта возможность доступна только в том случае, если свойство `mc.enable.namespace.schema` имеет значение `true`.

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
При удалении базы данных MaxCompute также удаляются все содержащиеся в ней таблицы.
:::

### Создание и удаление таблиц {#creating-and-dropping-tables}

* **Создание**

  Doris поддерживает создание партиционированных и непартиционированных таблиц в MaxCompute.

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

  Удалить таблицу MaxCompute можно с помощью оператора `DROP TABLE`. В настоящее время при удалении таблицы также удаляются её данные, включая данные партиций.

  Пример:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```

## Часто задаваемые вопросы {#faq}

### Как получить Endpoint и квоту (для Doris 2.1.7 и новее) {#how-to-obtain-endpoint-and-quota-applicable-for-doris-217-and-later}

1. При использовании выделенных групп ресурсов для службы передачи данных

    Чтобы предоставить необходимые разрешения, см. раздел «2. Авторизация» в главе «Использование выделенных групп ресурсов службы данных» этого [документа](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts). В списке «Управление квотами» найдите и скопируйте соответствующее значение `QuotaName` и задайте `"mc.quota" = "QuotaName"`. В этом случае для доступа к MaxCompute можно использовать VPC или публичную сеть, однако в VPC пропускная способность гарантирована, а ресурсы пропускной способности публичной сети ограничены.

2. При использовании оплаты по мере использования

    См. раздел «Использование Open Storage (оплата по мере использования)» в этом [документе](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1), чтобы включить Open Storage (Storage API) и предоставить разрешения пользователю, которому принадлежат AK и SK. В этом случае `mc.quota` имеет значение по умолчанию `pay-as-you-go`, и дополнительно задавать его не требуется. При оплате по мере использования доступ к MaxCompute возможен только через VPC; доступ через публичную сеть недоступен. Доступ к MaxCompute через публичную сеть могут использовать только пользователи с предоплатой.

3. Настройте `mc.endpoint` в соответствии с «Таблицей Endpoint по регионам» в [документации Alibaba Cloud по Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)

    Пользователям, обращающимся через VPC, необходимо настроить `mc.endpoint` по столбцу «Endpoint сети VPC» в таблице «Endpoint по регионам (подключение через сеть Alibaba Cloud VPC)». Пользователи, обращающиеся через публичную сеть, могут выбрать значение из столбца «Endpoint классической сети» в таблице «Endpoint по регионам (подключение через классическую сеть Alibaba Cloud)» или из столбца «Endpoint внешней сети» в таблице «Endpoint по регионам (подключение через внешнюю сеть)» для настройки `mc.endpoint`.

### Собственный адрес службы (для версий до Doris 2.1.7) {#custom-service-address-applicable-for-versions-before-doris-217}

В версиях до Doris 2.1.7 для взаимодействия с MaxCompute используется Tunnel SDK, поэтому требуются следующие два свойства Endpoint:

* `mc.odps_endpoint`: Endpoint MaxCompute, используемый для получения метаданных MaxCompute (сведений о базах данных и таблицах).

* `mc.tunnel_endpoint`: Endpoint Tunnel, используемый для чтения данных MaxCompute.

По умолчанию MaxCompute Catalog формирует адреса Endpoint на основе `mc.region` и `mc.public_access`.

Формат формируемых адресов:

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| --- | --- | --- |
| `false` | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true` | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

Пользователи также могут отдельно задать `mc.odps_endpoint` и `mc.tunnel_endpoint`, чтобы настроить собственные адреса служб. Это подходит для сред с частным развёртыванием MaxCompute.

Сведения о настройке Endpoint MaxCompute и Endpoint Tunnel см. в разделе [Endpoint для разных регионов и способов сетевого подключения](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints).

### Управление использованием ресурсов {#resource-usage-control}

Пользователи могут регулировать [количество параллельных запросов на уровне таблицы](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2), изменяя две переменные сеанса `parallel_pipeline_task_num` и `num_scanner_threads`, чтобы управлять потреблением ресурсов службы передачи данных. Соответствующее количество параллельных запросов равно `max(parallel_pipeline_task_num * be num * num_scanner_threads)`.

Примечания:

1. Этот способ позволяет управлять количеством параллельных обращений только к одной таблице в рамках одного запроса и не позволяет управлять использованием ресурсов несколькими операторами SQL.

2. Уменьшение количества параллельных обращений увеличивает время выполнения запроса.

### Рекомендации по записи {#write-best-practices}

- По возможности рекомендуется записывать данные в явно указанные партиции, например `INSERT INTO mc_tbl PARTITION(ds='20250201')`. Если партиция не указана, из-за ограничений MaxCompute Storage API данные каждой партиции должны записываться последовательно. Поэтому в плане выполнения данные сортируются по столбцам партиционирования, что при большом объёме данных может потребовать значительных ресурсов памяти и привести к ошибке записи.

- При записи без указания партиции не задавайте `SET enable_strict_consistency_dml = false`. Эта настройка принудительно удаляет узел сортировки, из-за чего данные партиций записываются с нарушением порядка, что в итоге приводит к ошибке MaxCompute.

- Не добавляйте предложение `LIMIT`. При добавлении предложения `LIMIT` Doris использует для записи только один поток, чтобы гарантировать заданное количество записываемых строк. Это можно использовать для тестирования на небольших объёмах, но при большом значении `LIMIT` производительность записи будет низкой.

### Ошибка записи: `Data invalid: ODPS-0020041:StringOutOfMaxLength` {#write-error-data-invalid-odps-0020041stringoutofmaxlength}

См. описание `mc.max_field_size_bytes`.
