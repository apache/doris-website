---
{
    "title": "Руководство по анализу Query Profile: поиск узких мест при выполнении медленных запросов в Doris",
    "sidebar_label": "Анализ Query Profile",
    "language": "ru",
    "description": "Как собирать, просматривать и интерпретировать подробные сведения о выполнении запросов с помощью Apache Doris Query Profile. В статье рассматриваются архитектура, настройка параметров, способы получения Profile и методы поиска узких мест.",
    "keywords": ["Doris Query Profile", "анализ производительности запросов", "поиск медленных запросов", "интерпретация Profile", "MergedProfile", "DetailProfile", "enable_profile", "profile_level"]
}
---

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenario: Apache Doris users troubleshooting slow queries, analyzing execution plans, and locating operator bottlenecks -->

Query Profile — это диагностический инструмент Apache Doris для просмотра подробных сведений о выполнении запросов. Он записывает ключевые метрики каждого оператора, такие как время выполнения, количество строк и использование памяти, помогая быстро находить узкие места медленных запросов.

Прежде чем читать статью, убедитесь в следующем:

- Кластер Apache Doris развёрнут, и у вас есть права на изменение файла конфигурации FE `fe.conf`.
- Вы подключены к Doris через клиент MySQL и можете выполнять такие команды, как `show query profile`.
- Вы знакомы с основными понятиями плана запроса (Fragment, PlanNode).

Статья состоит из трёх основных частей:

| Раздел | Содержание |
| --- | --- |
| Общая архитектура | Как данные Profile собираются с BE и сохраняются на FE |
| Настройка параметров | Как настроить систему, чтобы отфильтровать ненужную информацию и сосредоточиться на важных деталях запроса |
| Методика интерпретации | Как быстро найти операторы, влияющие на производительность запроса |

## Общая архитектура Query Profile {#overall-architecture-of-query-profile}

<!-- Knowledge type: Architectural principles -->
<!-- Applicable scenario: Understanding the Profile collection process and troubleshooting reporting failures -->

![Общая архитектура Query Profile](/images/next/query-acceleration/profile-arch.jpg)

Основу Query Profile составляют два компонента: `ProfileManager` на FE и `AsyncReportThreadPool` на BE.

### Процесс сбора {#collection-process}

| Шаг | Участник | Действие |
| --- | --- | --- |
| 1 | FE | Пользователь отправляет запрос, и FE регистрирует структуру данных Profile в `ProfileManager` |
| 2 | BE | После завершения запроса BE регистрирует собственный Profile как задачу асинхронной отправки |
| 3 | BE | `AsyncReportThreadPool` инициирует RPC на уровне запроса, чтобы отправить данные Profile на FE |
| 4 | FE | Фоновый поток обрабатывает данные Profile, сохраняет и вытесняет их согласно политике, а подходящие Profile сжимает и записывает в хранилище |
| 5 | Пользователь | Пользователь просматривает Profile через веб-интерфейс или HTTP-запрос с помощью curl |
| 6 | FE | `ProfileManager` находит Profile в памяти или внешнем хранилище и возвращает его в текстовом виде |

Во всём этом процессе наибольшее влияние на работу Profile оказывают **асинхронная отправка на шаге 2** и **сохранение Profile на шаге 4**.

### Тайм-аут асинхронной отправки {#asynchronous-reporting-timeout}

При высокой нагрузке на кластер асинхронная отправка может завершаться по тайм-ауту. Чтобы FE не потреблял слишком много памяти, `ProfileManager` после некоторого ожидания отбрасывает Profile, для которого истекло время ожидания.

- Способ настройки: измените `profile_async_collect_expire_time_secs` в `fe.conf`, чтобы задать время ожидания.
- Рекомендация: если тайм-ауты возникают часто, сначала проверьте использование ресурсов машин. При необходимости отключите Profile на глобальном уровне, чтобы снизить риск.

### Преимущества сохранения Profile на диск {#benefits-of-profile-persistence}

После того как `ProfileManager` сохраняет данные Profile на диск, система обеспечивает следующее:

1. Данные Profile больше не занимают большой объём памяти FE.
2. Ранее созданные Profile остаются доступными после перезапуска FE.

Первый пункт позволяет FE хранить тысячи полных Profile. Второй упрощает сравнение производительности кластера до и после обновления и помогает проверить, повысилась ли производительность запросов Doris после перехода на новую версию.

## Настройка Profile {#configuring-profile}

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Enabling/disabling Profile, controlling collection granularity and storage -->

### Краткий справочник параметров {#parameter-quick-reference}

| Параметр | Область действия | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `enable_profile` | Сеанс/Глобально | `false` | Создавать ли Profile |
| `profile_level` | Сеанс/Глобально | `2` | Уровень детализации Profile (от 1 до 3, действует в 4.0+) |
| `auto_profile_threshold_ms` | Глобально | `-1` | Создавать Profile только для запросов, время выполнения которых превышает порог (действует в 3.0+) |
| `max_query_profile_num` | `fe.conf` | `500` | Максимальное количество Profile, хранящихся в памяти FE |
| `max_spilled_profile_num` | `fe.conf` | `500` | Максимальное количество Profile, хранящихся на диске |
| `spilled_profile_storage_path` | `fe.conf` | `log/profile` | Локальный каталог для хранения Profile |
| `spilled_profile_storage_limit_bytes` | `fe.conf` | `1 GB` | Ограничение общего объёма хранения Profile на диске |

Примеры архивных Profile и ChangedSessionVariables ниже содержат данные, собранные ранее. Указанное в них значение `profile_level` по умолчанию, равное `1`, соответствует версии, в которой эти данные были собраны, а не текущему значению по умолчанию.

Начиная с 4.1.5, запросы, перенаправленные на Master FE, сохраняют значение `profile_level` из сеанса. Допустимые значения приведены в [справочнике переменных сеанса](../sql-manual/basic-element/session-variables.md#profile_level).

### Включение Profile {#enabling-profile}

#### enable_profile {#enable_profile}

- Назначение: управляет созданием Profile.
- Команда: `set enable_profile=true;`
- Описание: значение по умолчанию — `false`. Если функция отключена, команда `show query profile` не возвращает новые записи.

```sql
mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.00 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.01 sec)

mysql> set enable_profile=false;
--------------
set enable_profile=false
--------------

Query OK, 0 rows affected (0.00 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.00 sec)
```

#### profile_level {#profile_level}

- Назначение: управляет уровнем детализации Profile.
- Команда: `set profile_level=2;`
- Описание: значение по умолчанию — `2`. **Этот параметр действует в версии 4.0 и более поздних. Не используйте его в версиях до 4.0, где он имеет другую семантику.**

| Уровень | Поведение | Влияние на производительность |
| --- | --- | --- |
| 1 | BE отправляет только упрощённый Profile, которого достаточно для агрегации в MergedProfile на FE | Минимальное |
| 2 (по умолчанию) | Выводятся более подробные счётчики, подходящие для углублённого анализа | Небольшое |
| 3 | Максимальная детализация. Сбор некоторых счётчиков может влиять на производительность запроса | Более существенное |

Пример: при `profile_level=1` счётчики `EXCHANGE_OPERATOR` выглядят следующим образом:

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: ef33b72e30b84b68-82ad027edbee5910
     - BlocksProduced: 1
     - CloseTime: 4.243us
     - ExecTime: 30.834us
     - InitTime: 20.902us
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.93us
     - ProjectionTime: 0ns
     - RowsProduced: 10
     - WaitForDependencyTime: 0ns
       - WaitForData0: 635.324us
```

При `profile_level=2` доступны более подробные счётчики:

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: 514023de1b7b41a3-9e59e43c591103a2
     - BlocksProduced: 1
     - CloseTime: 3.523us
     - CreateMergerTime: 0ns
     - DataArrivalWaitTime: 0ns
     - DecompressBytes: 0.00 
     - DecompressTime: 0ns
     - DeserializeRowBatchTimer: 0ns
     - ExecTime: 28.439us
     - FilterTime: 287ns
     - FirstBatchArrivalWaitTime: 0ns
     - GetDataFromRecvrTime: 3.482us
     - InitTime: 18.258us
     - LocalBytesReceived: 36.00 KB
     - MaxFindRecvrTime(NS): 0
     - MaxWaitForWorkerTime: 0
     - MaxWaitToProcessTime: 0
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.44us
     - ProjectionTime: 0ns
     - RemoteBytesReceived: 0.00 
     - RowsProduced: 10
     - SendersBlockedTotalTimer(*): 0ns
     - WaitForDependencyTime: 0ns
       - WaitForData0: 596.708us
```

#### auto_profile_threshold_ms {#auto_profile_threshold_ms}

- Назначение: создавать Profile только для запросов, время выполнения которых превышает порог, чтобы Profile коротких запросов не затмевали данные медленных запросов.
- Команда: `set global auto_profile_threshold_ms=1000;`
- Описание: значение по умолчанию — `-1`, то есть Profile создаются для всех запросов. Этот параметр действует в версии 3.0 и более поздних.

Зачем нужен этот параметр? Включение Profile на глобальном уровне создаёт большой объём данных, расходует ресурсы CPU, памяти и диска FE и влияет на короткие запросы, чувствительные к задержкам. Поэтому FE периодически очищает данные Profile. Этот параметр помогает сохранить Profile медленных запросов, чтобы они не терялись среди остальных.

Пример: предположим, что Profile включён на глобальном уровне, поэтому Profile создаётся для каждого запроса.

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| d59b04f636e49c0-bf6b6b3011c40f67  | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 3ms   | EOF        | root | internal        | tpcds      | select 1      |
| f2ccb78011aa4526-9919ee76af1e57d7 | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| a8464728ebf5481d-864e3016ad22f045 | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
| 912b09ea8f634c47-89e65d4fe354a94b | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| e6e6f0a3a31640bc-ad5994de0334ae8d | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| b28da27b4cc847a7-82e239320d6facc5 | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| fec3cdcd4664408c-a38508ce3a2bbe32 | QUERY     | 2025-02-26 18:24:48 | 2025-02-26 18:24:48 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
7 rows in set (0.00 sec)
```

Чтобы прекратить создание Profile для таких коротких запросов, выполните следующие действия:

```sql
mysql> clean all profile;
--------------
clean all profile
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> set global auto_profile_threshold_ms=1000;
--------------
set global auto_profile_threshold_ms=1000
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.05 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

Empty set (0.00 sec)
```

### Настройка хранения Profile {#configuring-profile-storage}

Doris поддерживает сохранение Profile на локальный диск FE, что позволяет хранить больше записей. Для управления этим используются следующие параметры в `fe.conf`:

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `max_query_profile_num` | `500` | Максимальное количество Profile, хранящихся в памяти FE. При превышении лимита первыми вытесняются самые старые |
| `max_spilled_profile_num` | `500` | Максимальное количество Profile, хранящихся на диске. При превышении лимита первыми удаляются самые старые |
| `spilled_profile_storage_path` | `log/profile` | Локальный каталог для хранения Profile |
| `spilled_profile_storage_limit_bytes` | `1 GB` | Ограничение общего объёма хранения Profile на диске |

## Получение Profile {#retrieving-profiles}

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Viewing historical Profiles, downloading Profiles remotely -->

| Способ | Сценарий применения | Точка доступа |
| --- | --- | --- |
| Веб-интерфейс FE | Повседневная диагностика, наглядный просмотр | Страница QueryProfile по адресу `ip:http_port` |
| Командная строка | Ограничения безопасности, пакетное скачивание | `show query profile` + curl |
| Чтение файлов непосредственно с диска | Быстрый доступ к сохранённым Profile | ZIP-файлы в каталоге `log/profile` |

### Получение через веб-интерфейс FE {#retrieving-via-the-fe-web-ui}

- Назначение: просмотр Profile всех запросов на FE через браузер.
- Действия: откройте адрес FE `ip:http_port`, введите имя пользователя и пароль для перехода на страницу QueryProfile, затем нажмите на идентификатор Profile, чтобы просмотреть подробности.
- Описание:

    - Данные Profile существуют только на том FE, который выполняет SQL, и **не синхронизируются между несколькими FE**. Для получения Profile нужно подключиться к FE, который выполнил SQL.
    - Все задачи загрузки в конечном счёте выполняются на FE Master, поэтому их Profile нужно получать с FE Master.

![Страница Query Profile в веб-интерфейсе FE](/images/profile/profile-image-1.png)

### Получение через командную строку {#retrieving-via-the-command-line}

В некоторых ситуациях, например при ограничениях безопасности, веб-интерфейс FE недоступен. В таких случаях Profile можно получить через командную строку.

**Шаг 1: выполните `show query profile`, чтобы получить метаданные последних 20 Profile.**

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| c7f48291d62147f4-92b1a511f6fe3395 | QUERY     | 2025-02-26 19:35:15 | 2025-02-26 19:35:15 | 5ms   | EOF        | root | internal        | tpch       | select 20     |
| 9c6cd24d2f354c6f-9652c097cae00b05 | QUERY     | 2025-02-26 19:35:12 | 2025-02-26 19:35:12 | 4ms   | EOF        | root | internal        | tpch       | select 19     |
| b908f7b484084492-9c4dc48762c9cb89 | QUERY     | 2025-02-26 19:35:09 | 2025-02-26 19:35:09 | 5ms   | EOF        | root | internal        | tpch       | select 18     |
| ef411c0eb00541dc-ba5a39677be3e117 | QUERY     | 2025-02-26 19:35:06 | 2025-02-26 19:35:06 | 5ms   | EOF        | root | internal        | tpch       | select 17     |
| c89deefa85974da7-ad53cb3d6f4cad75 | QUERY     | 2025-02-26 19:35:03 | 2025-02-26 19:35:03 | 5ms   | EOF        | root | internal        | tpch       | select 16     |
| dd97a36d2a1f4cbc-b23f13b975cd2dde | QUERY     | 2025-02-26 19:34:59 | 2025-02-26 19:34:59 | 6ms   | EOF        | root | internal        | tpch       | select 15     |
| af75095f7a7c4d9f-9422d04d0604f904 | QUERY     | 2025-02-26 19:34:56 | 2025-02-26 19:34:56 | 8ms   | EOF        | root | internal        | tpch       | select 14     |
| 2764a7aaf2cf446d-922b4c5b5f853788 | QUERY     | 2025-02-26 19:34:54 | 2025-02-26 19:34:54 | 10ms  | EOF        | root | internal        | tpch       | select 13     |
| bf15d7d96b9c4f6b-8e6fe4c40b077ae8 | QUERY     | 2025-02-26 19:34:53 | 2025-02-26 19:34:53 | 9ms   | EOF        | root | internal        | tpch       | select 12     |
| ebf2221627b0435e-9bafebbe46d7315d | QUERY     | 2025-02-26 19:34:51 | 2025-02-26 19:34:51 | 7ms   | EOF        | root | internal        | tpch       | select 11     |
| 3309a4c57f61471c-9c863f6bb72a146b | QUERY     | 2025-02-26 19:34:50 | 2025-02-26 19:34:50 | 10ms  | EOF        | root | internal        | tpch       | select 10     |
| cb764ed358f34312-a7c56cbf7f521761 | QUERY     | 2025-02-26 19:34:48 | 2025-02-26 19:34:48 | 10ms  | EOF        | root | internal        | tpch       | select 9      |
| 38878f3344b649ff-a69f1c8cd0dc1960 | QUERY     | 2025-02-26 19:34:46 | 2025-02-26 19:34:46 | 9ms   | EOF        | root | internal        | tpch       | select 8      |
| 1182dc4c8105407c-b77c50a993cc0cb1 | QUERY     | 2025-02-26 19:34:42 | 2025-02-26 19:34:42 | 14ms  | EOF        | root | internal        | tpch       | select 7      |
| 8596d808d2814e8d-aefbac7d30a599d1 | QUERY     | 2025-02-26 19:34:40 | 2025-02-26 19:34:40 | 31ms  | EOF        | root | internal        | tpch       | select 6      |
| 325a66e868844aa4-90fae17f3a98d3e6 | QUERY     | 2025-02-26 19:34:38 | 2025-02-26 19:34:38 | 40ms  | EOF        | root | internal        | tpch       | select 5      |
| e30d1166a2674393-997246e064a7674c | QUERY     | 2025-02-26 19:34:36 | 2025-02-26 19:34:36 | 19ms  | EOF        | root | internal        | tpch       | select 4      |
| 4dfb91db8b448db-a4eab023bc119cea  | QUERY     | 2025-02-26 19:34:33 | 2025-02-26 19:34:33 | 14ms  | EOF        | root | internal        | tpch       | select 3      |
| 1453559772434cda-b64c2eae47ce6424 | QUERY     | 2025-02-26 19:34:31 | 2025-02-26 19:34:31 | 10ms  | EOF        | root | internal        | tpch       | select 2      |
| cbf8bf829740488c-b6da653e391b13c6 | QUERY     | 2025-02-26 19:34:30 | 2025-02-26 19:34:30 | 20ms  | EOF        | root | internal        | tpch       | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
20 rows in set (0.00 sec)
```

**Шаг 2: обратитесь к HTTP API с помощью curl, чтобы получить конкретный Profile.** Например, для получения Profile с идентификатором `f7efdc4c092d4b14-95e0f7f7783974d3`:

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```

Результат совпадает с тем, что отображается в веб-интерфейсе:

```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
Summary:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task Type: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default Catalog: internal
   - Default Db: tpch
```

### Получение файлов Profile непосредственно с диска {#retrieving-profile-files-directly-from-disk}

Начиная с 3.0 поддерживается сохранение Profile на диск; каталог по умолчанию — `log/profile`. Для быстрого просмотра можно извлечь нужный файл с помощью `unzip` и получить данные в текстовом формате.

Примечания:

1. В Doris FE предусмотрен механизм защиты каталога `log/profile`. **Не оставляйте извлечённые файлы в этом каталоге**, иначе они будут удалены.
2. Текст Profile немного отличается от представления в веб-интерфейсе: `Summary` сохраняется как метаданные JSON, а остальная часть совпадает с веб-интерфейсом.

```bash
[hezhiqiang@VM-10-2-centos log]$ unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
Archive:  profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
  inflating: 33bf38e988ea4945-b585d2f74d1da3fd.profile
[hezhiqiang@VM-10-2-centos log]$ head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
{"summaryProfile":{"counterTotalTime":{"value":0,"type":5,"level":1},"localTimePercent":0.0,"infoStrings":{"Distributed Plan":"N/A","Task Type":"QUERY","User":"root","Default Catalog":"internal","Total":"9sec745ms","Default Db":"tpch","Profile ID":"33bf38e988ea4945-b585d2f74d1da3fd","Task State":"OK","Sql Statement":"SELECT      c.c_name,      COUNT(o.o_orderkey) AS total_orders,      SUM(o.o_totalprice) AS total_spent FROM      customer c JOIN      orders o ON c.c_custkey = o.o_custkey GROUP BY      c.c_name limit 20","Start Time":"2025-02-28 20:18:31","End Time":"2025-02-28 20:18:41"}, ...}
Changed Session Variables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000
fetch_splits_max_wait_time_ms | 4000         | 1000
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1
auto_profile_threshold_ms     | 1            | -1
```

## Структура Profile {#profile-structure}

<!-- Knowledge type: Data structure description -->
<!-- Applicable scenario: Understanding the meaning of each part of a Profile and choosing the right section to read -->

Содержимое Profile делится на следующие пять частей:

| Часть | Назначение | Когда использовать |
| --- | --- | --- |
| Summary | Метаданные Profile с ключевыми полями для поиска | Поиск Profile, проверка основной информации о запросе |
| ExecutionSummary | Сводка процесса выполнения, включая время каждого этапа Planner | Диагностика затрат времени на компиляцию и планирование SQL |
| ChangedSessionVariables | Переменные сеанса, изменённые при выполнении этого запроса | Диагностика проблем производительности, вызванных некорректными настройками |
| MergedProfile | Агрегированный результат DetailProfile | Быстрое изучение структуры запроса, поиск операторов с узкими местами и сравнение распределения данных для выявления перекоса |
| DetailProfile | Подробные сведения о выполнении каждого Fragment и PipelineTask каждого Pipeline на всех BE | Углублённый анализ после обнаружения узкого места |

### 1. Summary {#1-summary}

`SummaryProfile` — это метаданные Profile с ключевыми полями для поиска, такими как `Profile ID` и `Total`.

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```

### 2. ExecutionSummary {#2-executionsummary}

Сводка процесса выполнения. Поля, связанные с Plan, отражают время работы Planner.

### 3. ChangedSessionVariables {#3-changedsessionvariables}

Содержит переменные сеанса, изменённые при выполнении этого запроса.

```text
ChangedSessionVariables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000       
fetch_splits_max_wait_time_ms | 4000         | 1000        
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1           
auto_profile_threshold_ms     | 1            | -1          
```

Таблица выше показывает, что перед выполнением запроса были изменены 5 переменных сеанса.

### 4. MergedProfile {#4-mergedprofile}

`MergedProfile` — это агрегированный результат `DetailProfile`. Он используется для трёх основных задач:

- **Быстрое изучение структуры плана запроса и Pipeline**

    План запроса Doris имеет иерархическую структуру: Query, Fragment и PlanNode. На уровне выполнения задачи планируются для Pipeline, каждый из которых состоит из группы операторов. MergedProfile наглядно показывает это преобразование.

- **Быстрый поиск операторов, ограничивающих производительность**

    При диагностике проблем производительности обычно требуется найти конкретный оператор, ставший узким местом. Сначала по `DependencyWaitTime` найдите в MergedProfile оператор с наибольшим временем выполнения, затем изучите его данные в DetailProfile, чтобы точнее определить причину.

- **Сравнение распределения данных для выявления перекоса**

    MergedProfile подробно записывает, как данные передаются между операторами. Сравнивая `InputRows` и `RowsProduced`, можно определить, не распределены ли данные между разными Backend неравномерно. Неравномерное распределение данных часто замедляет запросы или приводит к их сбою.

### 5. DetailProfile {#5-detailprofile}

Подробная информация о выполнении. `DetailProfile` записывает сведения о выполнении каждой задачи `PipelineTask` для каждого Fragment и Pipeline запроса на всех Backend. После выявления узкого места с помощью MergedProfile обычно обращаются к DetailProfile для углублённого анализа.

## Пример интерпретации Profile {#profile-interpretation-example}

<!-- Knowledge type: Hands-on example -->
<!-- Applicable scenario: First time interpreting a Profile, understanding the relationship between Pipelines and Operators -->

На примере типичного запроса с Aggregation, Join и Scan рассмотрим, как интерпретировать Profile. Запрос выполняет JOIN таблиц `customer` и `orders` из набора данных TPCH, а затем агрегирует результаты:

```sql
SELECT c.c_name,
       Count(o.o_orderkey) AS total_orders,
       Sum(o.o_totalprice) AS total_spent
FROM   customer c
       JOIN orders o
         ON c.c_custkey = o.o_custkey
GROUP  BY c.c_name
LIMIT  20 
```

Чтобы Profile не получился слишком объёмным, ограничьте параллелизм запроса:

```sql
set parallel_pipeline_task_num=2;
```

После выполнения запроса и получения Profile через веб-интерфейс сначала обратите внимание на MergedProfile. Ниже оставлены только ключевые поля, чтобы было проще рассмотреть общую структуру. Значения остальных полей описаны в соответствующей документации.

```text
MergedProfile:
     Fragments:
       Fragment 0:
         Pipeline 0(instance_num=1):
           RESULT_SINK_OPERATOR(id=0):
             CommonCounters:
                - ExecTime: avg 176.545us, max 176.545us, min 176.545us
                - InputRows: sum 20, avg 20, max 20, min 20
                - WaitForDependency[RESULT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=8):
             CommonCounters:
                - ExecTime: avg 84.559us, max 84.559us, min 84.559us
                - RowsProduced: sum 20, avg 20, max 20, min 20
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 1:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=8):
             CommonCounters:
                - ExecTime: avg 31.515us, max 33.405us, min 29.626us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - BlocksProduced: sum 2, avg 1, max 1, min 1
           SORT_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 980ns, max 1.199us, min 762ns
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           SORT_SINK_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 49.414us, max 54.802us, min 44.27us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 34.521us, max 36.402us, min 32.640us
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 2(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 109.89us, max 118.582us, min 99.596us
                - InputRows: sum 40, avg 20, max 22, min 18
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=5):
             CommonCounters:
                - ExecTime: avg 29.741us, max 34.521us, min 24.962us
                - RowsProduced: sum 40, avg 20, max 22, min 18
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 2:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=5):
             CommonCounters:
                - ExecTime: avg 71.148us, max 73.242us, min 69.54us
                - InputRows: sum 40, avg 20, max 20, min 20
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 350.431us, max 393.100us, min 307.762us
                - RowsProduced: sum 40, avg 20, max 20, min 20
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec30ms, max 11sec450ms, min 10sec610ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 442.308ms, max 449.109ms, min 435.506ms
                - InputRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - MemoryUsage: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - MemoryUsagePeak: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 1.03 MB, avg 526.28 KB, max 526.28 KB, min 526.28 KB
                - MemoryUsageSerializeKeyArena: sum 1.02 MB, avg 524.00 KB, max 524.00 KB, min 524.00 KB
           HASH_JOIN_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 9sec169ms, max 9sec582ms, min 8sec756ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
             CustomCounters:
                - ProbeRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
           OLAP_SCAN_OPERATOR(nereids_id=397. table_name=orders(orders))(id=2):
             CommonCounters:
                - ExecTime: avg 396.233ms, max 410.306ms, min 382.160ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
         Pipeline 2(instance_num=2):
           HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
                - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
           EXCHANGE_OPERATOR(id=1):
             CommonCounters:
                - ExecTime: avg 10.131ms, max 20.243ms, min 19.26us
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 47.582ms, max 47.582ms, min 47.582ms
       Fragment 3:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=1):
             CommonCounters:
                - ExecTime: avg 3.269ms, max 3.281ms, min 3.258ms
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForLocalExchangeBuffer0: avg 142.859ms, max 285.713ms, min 6.733us
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           OLAP_SCAN_OPERATOR(nereids_id=403. table_name=customer(customer))(id=0):
             CommonCounters:
                - ExecTime: avg 77.435ms, max 78.752ms, min 76.118ms
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 49.690ms, max 50.522ms, min 48.858ms
```

Выше показан упрощённый MergedProfile. План запроса Doris имеет три уровня: Query, Fragment и PlanNode. Движок выполнения на Backend добавляет ещё два уровня: Pipeline и Operator. На следующей схеме сначала показано, как приведённый запрос разделяется на три уровня с точки зрения плана запроса.

### Query, Fragment и PlanNode {#query-fragment-and-plannode}

![Пример трёхуровневой структуры плана запроса](/images/next/query-acceleration/profile-fragment.jpg)

Стрелки на схеме показывают направление потока данных. План всего Query разделён на 4 Fragment (четыре блока в левой части схемы) и несколько PlanNode (Fragment и входящие в него PlanNode расположены на одной горизонтальной линии). Назначение каждого PlanNode описано ниже:

| PlanNode | Назначение |
| --- | --- |
| `SCAN_NODE` x2 | Чтение таблиц `customer` и `orders` соответственно |
| `DATA_STREAM_SINK` / `EXCHANGE` | Передача данных между разными Fragment |
| `HASH_JOIN` | Выполнение соединения данных, прочитанных SCAN |
| `AGGREGATION` (первый этап) / `AGGREGATION(MERGE)` (второй этап) | Двухэтапная агрегация |
| `TOP-N` | Ограничение количества строк результата |
| `RESULT_SINK` | Возврат итогового результата на FE |

### Pipeline и операторы {#pipelines-and-operators}

Как этот план запроса преобразуется в Pipeline и операторы в движке выполнения? Рассмотрим Fragment 1 и Fragment 2, содержащие AGGREGATION и HASH_JOIN.

![Преобразование PlanNode в Pipeline и операторы](/images/next/query-acceleration/profile-fragment-2.jpg)

Во время выполнения движок Doris разделяет некоторые PlanNode на один или несколько операторов.

**Пример 1: DATA_STREAM_SINK**

`DATA_STREAM_SINK` преобразуется в `DATA_STREAM_SINK_OPERATOR`. Через этот оператор Fragment передаёт данные наружу. У него нет собственного OperatorId, только OperatorId получателя. Например, `dest_id=5` означает, что этот оператор отправляет данные оператору `EXCHANGE_OPERATOR` с `id=5`.

**Пример 2: HASH_JOIN**

HASH_JOIN с PlanNodeId, равным 3, разделяется на два оператора: `HASH_JOIN_SINK_OPERATOR` и `HASH_JOIN_OPERATOR`. У обоих Operator Id равен 3 и совпадает с PlanNodeId. AGGREGATION первого этапа и AGGREGATION(MERGE) второго этапа также разделяются каждый на пару операторов SINK и SOURCE.

**Связи Pipeline и зависимости с блокировкой**

После разделения PlanNode на операторы движок выполнения соединяет часть этих операторов в Pipeline. Каждый из Fragment 1 и Fragment 2 содержит 3 Pipeline.

| Тип блокировки | Источник | Пример |
| --- | --- | --- |
| Зависимость по логике вычислений | Порядок вычислений между операторами | Сторона Probe в HashJoin должна дождаться, пока сторона Build завершит построение хеш-таблицы |
| Зависимость от физической среды | Системные факторы, такие как сеть и буферизация | EXCHANGE_OPERATOR должен дождаться передачи данных по сети от DATA_STREAM_SINK_OPERATOR |

Поток данных между операторами внутри одного Pipeline **не блокируется**. Между операторами из разных Pipeline **существуют зависимости с блокировкой**. Объединение неблокирующих операторов в Pipeline для планирования и выполнения позволяет эффективнее использовать ресурсы и повысить долю попаданий в кеш.

### CommonCounters и CustomCounters {#commoncounters-and-customcounters}

`CommonCounters` — это счётчики, обязательные для каждого оператора. Сейчас в Doris к ним относятся:

| Счётчик | Применимые операторы | Значение |
| --- | --- | --- |
| `ExecTime` | Все | Время выполнения текущего оператора **без учёта вышестоящих операторов** |
| `RowsProduced` | Операторы, не относящиеся к Sink | Количество строк, выданных оператором-источником |
| `InputRows` | Операторы Sink | Количество входных строк, полученных текущим оператором |
| `MemoryUsage` & `MemoryUsagePeak` | Все | Текущий и пиковый объём памяти, используемой оператором |
| `WaitForDependency` | Все | Время ожидания завершения зависимостей |

`CustomCounters` — это счётчики, специфичные для каждого оператора. Подробное описание CustomCounter каждого оператора приведено в документе «Обзор Profile операторов Doris».

### Интерпретация HashJoin {#interpreting-hashjoin}

Разобравшись с основными понятиями выполнения запросов в Doris, вернёмся к предыдущему запросу и восстановим подробности выполнения Join по MergedProfile.

![Подробности выполнения HashJoin в Pipeline](/images/next/query-acceleration/profile-join.jpg)

Перед выполнением SQL параллелизм Pipeline запроса был установлен равным 2. Поэтому, хотя на схеме показан только один набор связанных Pipeline 1 и Pipeline 2, при фактическом выполнении им соответствуют 4 задачи Pipeline: по две задачи для каждого Pipeline.

```text
Pipeline 0(instance_num=2)
```

Значение `instance_num` в скобках после каждого Pipeline равно общему количеству PipelineTask этого Pipeline на всех BE. В используемом здесь кластере только 1 BE, поэтому `instance_num = 1 * parallel_pipeline_task_num = 2`.

**Сторона Build: построение HashTable**

Две задачи PipelineTask из Pipeline 2 суммарно обработали 15M строк данных для построения HashTable. Среднее время построения HashTable составило 445.146 мс. Pipeline 1 может начать выполнение только после того, как Pipeline 2 завершит построение HashTable. Время ожидания отражено в `WaitForDependency`, где `avg` составляет 949.860 мс. Однако среднее время построения HashTable — всего 445.146 мс. Откуда берётся разница?

```text
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
```

Причина в том, что в данном случае FE выбрал тип JOIN `BROADCAST_JOIN`. При таком типе соединения только одна из двух задач PipelineTask, выполняющих операцию JOIN Build, действительно строит хеш-таблицу. В MergedProfile оператора `HASH_JOIN_SINK_OPERATOR` видно следующее:

- Среднее время выполнения составляет 445.146 мс, но самая медленная задача PipelineTask занимает 890.258 мс, а самая быстрая — всего 34.635 мкс.
- Значение `min` для `InputRows` равно 0. Это означает, что все данные обработала одна задача PipelineTask, а другая ничего не делала.

Этим объясняется время ожидания в следующей строке:

```text
- WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```

**Сторона Probe: сканирование и соединение**

Теперь рассмотрим `HASH_JOIN_OPERATOR`. После ожидания, которое в среднем длится 949.860 мс, он начинает выполнять сторону Probe операции JOIN. Два экземпляра `OLAP_SCAN_OPERATOR` с `id=2` считывают из хранилища 150M строк. После обработки этих 150M строк в `HASH_JOIN_OPERATOR` не остаётся ни одной строки: все они передаются выше, в `AGGREGATION_SINK_OPERATOR`. Этот оператор строит хеш-таблицу для этих 150M строк и продолжает вычисление агрегатов.

### Интерпретация агрегации {#interpreting-aggregation}

В этом запросе используются операции агрегации `Count(o.o_orderkey) AS total_orders, Sum(o.o_totalprice) AS total_spent` и `GROUP BY c.c_name`.

![Подробности выполнения двухэтапной агрегации](/images/next/query-acceleration/profile-agg.jpg)

Для этого запроса Doris использует двухэтапную Aggregation.

**Первый этап агрегации**

- Выполняется парой операторов AGGREGATION с `id=4`.
- На вход `AGGREGATION_SINK_OPERATOR(id=4)` поступает суммарно 150M строк. Он строит хеш-таблицу по столбцу `GROUP BY` и обновляет `AggregationData` для каждого результата агрегации.
- После завершения первого этапа `AggregationData` передаётся на второй этап через EXCHANGE. Поскольку разные задачи PipelineTask могут обрабатывать одинаковые значения столбца GROUP BY, этап EXCHANGE выполняет HASH-разбиение по столбцу `name`, чтобы отправить строки с одинаковым именем одному и тому же оператору второго этапа.
- На выходе `AGGREGATION_OPERATOR(id=4)` получается суммарно 40 строк. Это означает, что хеш-таблица, построенная на первом этапе, содержит 40 строк.

**Второй этап агрегации**

- `AGGREGATION_SINK_OPERATOR(id=6)` десериализует результат первого этапа обратно в `AggregationData`, а затем выполняет операцию Merge.
- Оператор `AGGREGATION_OPERATOR(id=6)` передаёт результат далее в TOP-N. Поскольку запрос содержит `LIMIT 20`, оператор TOP-N завершает работу досрочно, собрав 20 строк.

**Основное узкое место**

В целом больше всего времени в этом запросе занимает `HASH_JOIN_OPERATOR(id=3)`. Обнаружив его, можно перейти к более подробным счётчикам `HASH_JOIN_OPERATOR(id=3)` в DetailProfile. Значение каждого счётчика описано в отдельной документации соответствующего оператора.

## Устранение неполадок и частые вопросы {#troubleshooting-and-faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common issues encountered when using Profile in daily work -->

### `show query profile` возвращает пустой результат? {#show-query-profile-returns-empty}

- Проверьте, установлено ли для `enable_profile` значение `true`: `show variables like 'enable_profile';`.
- Проверьте `auto_profile_threshold_ms`. При большом значении этого параметра Profile для коротких запросов не создаются.
- Убедитесь, что вы подключены к тому же FE, который выполнил SQL. Для задач загрузки требуется подключение к FE Master.

### При отправке Profile часто возникает тайм-аут? {#profile-reporting-times-out-frequently}

- Симптом: в журнале FE появляются сообщения о тайм-ауте асинхронного сбора Profile.
- Решение:

    1. Проверьте использование CPU, памяти и сетевых ресурсов машин.
    2. Увеличьте `profile_async_collect_expire_time_secs` в `fe.conf`.
    3. В крайних случаях отключите Profile на глобальном уровне и собирайте Profile только для медленных запросов (задайте `auto_profile_threshold_ms`).

### Profile занимает слишком много памяти FE? {#profile-takes-up-too-much-fe-memory}

- Уменьшите `max_query_profile_num`, чтобы ограничить количество Profile в памяти.
- Включите сохранение на диск (включено по умолчанию), чтобы выгружать ранее собранные Profile на диск.
- Используйте `auto_profile_threshold_ms`, чтобы отфильтровать короткие запросы.

### Извлечённый файл Profile исчез? {#the-extracted-profile-file-is-gone}

- Причина: в FE предусмотрен механизм защитной очистки каталога `log/profile`.
- Решение: помещайте извлечённые файлы в каталог, **отличный от** `log/profile`.

### Как проверить наличие перекоса данных? {#how-to-confirm-whether-data-skew-exists}

- В MergedProfile сравните значения `min`, `avg` и `max` для `InputRows`/`RowsProduced` одного и того же оператора.
- Если `max` значительно больше `avg` либо `min` равен 0 при очень большом `max`, это обычно указывает на перекос данных.

## Глоссарий {#glossary}

<!-- Knowledge type: Glossary -->
<!-- Applicable scenario: Term alignment -->

| Термин | Краткое определение |
| --- | --- |
| Query Profile | Диагностическая структура, записывающая подробные сведения о выполнении отдельного запроса |
| Fragment | Единица выполнения плана запроса, которую можно отправить на BE для выполнения |
| PlanNode | Узел логического оператора в плане запроса |
| Pipeline | Конвейер выполнения, состоящий из нескольких неблокирующих операторов |
| Operator | Минимальная единица выполнения в движке, полученная при разделении PlanNode |
| MergedProfile | Profile, агрегированный по BE и PipelineTask |
| DetailProfile | Подробный Profile каждой задачи PipelineTask на каждом BE |
| `WaitForDependency` | Время ожидания оператором завершения его зависимостей, часто используемое для поиска узких мест |
