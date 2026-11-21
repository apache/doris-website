---
{
    "title": "Конфигурация BE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "В этом документе в основном описываются соответствующие элементы конфигурации BE."
}
---

# Конфигурация BE {#be-configuration}

В этом документе в основном описываются соответствующие элементы конфигурации BE.

Файл конфигурации BE `be.conf` обычно хранится в каталоге `conf/` пути развертывания BE. Начиная с версии 0.14 будет введен еще один файл конфигурации `be_custom.conf`. Этот файл используется для записи элементов конфигурации, которые пользователь динамически изменяет и сохраняет во время работы.

После запуска процесса BE он сначала считывает элементы конфигурации из `be.conf`, а затем из `be_custom.conf`. Элементы конфигурации в `be_custom.conf` переопределяют одноименные элементы в `be.conf`.

Расположение файла `be_custom.conf` можно настроить в `be.conf` с помощью элемента конфигурации `custom_config_dir`.

## Просмотр элементов конфигурации {#view-configuration-items}

Элементы конфигурации BE можно просмотреть двумя способами:

1. Веб-страница BE

    Текущие элементы конфигурации можно просмотреть, открыв веб-страницу BE:

    `http://be_host:be_webserver_port/varz`

2. Просмотр с помощью команды

   Элементы конфигурации BE можно просмотреть в клиенте MySQL следующей командой; конкретный синтаксис см. в [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG):

    `SHOW BACKEND CONFIG;`

    Значения столбцов результата:

    1. BackendId: идентификатор backend.
    2. Host: IP-адрес backend.
    3. Key: имя элемента конфигурации.
    4. Value: значение текущего элемента конфигурации.
    5. Type: тип значения элемента конфигурации, например целое число или строка.
    6. IsMutable: возможность динамической настройки. Если значение равно true, элемент конфигурации можно изменять во время работы. Если false, его можно задать только в `be.conf`; он вступит в силу после перезапуска BE.

## Настройка элементов конфигурации {#set-configuration-items}

Элементы конфигурации BE можно настроить двумя способами:

1. Статическая настройка

   Добавьте и задайте элементы конфигурации в файле `conf/be.conf`. Элементы из `be.conf` считываются при запуске BE. Для отсутствующих в `be.conf` элементов используются значения по умолчанию.

2. Динамическая настройка

   После запуска BE элементы конфигурации можно динамически задать следующими командами.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   В версии 0.13 и более ранних версиях изменения, внесенные таким способом, становятся недействительными после перезапуска процесса BE. В версии 0.14 и более поздних версиях измененную конфигурацию можно сохранить следующей командой. Измененные элементы конфигурации сохраняются в файле `be_custom.conf`.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## Примеры {#examples}

1. Статическое изменение `max_base_compaction_threads`

   Добавьте в файл `be.conf`:

   ```max_base_compaction_threads=5```

   Затем перезапустите процесс BE, чтобы конфигурация вступила в силу.

2. Динамическое изменение `streaming_load_max_mb`

   После запуска BE динамически задайте `streaming_load_max_mb` следующей командой:

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   Следующее возвращаемое значение означает, что настройка выполнена успешно.

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   После перезапуска BE конфигурация станет недействительной. Чтобы сохранить изменение, используйте команду:

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## Конфигурации {#configurations}

### Сервисы {#services}

#### `deploy_mode` {#deploy_mode}

* Тип: string
* Описание: режим работы BE. `cloud` означает режим с разделением хранения и вычислений.
* Значение по умолчанию: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* Тип: string
* Описание: поддерживается начиная с версии 4.1.5. Максимальное число образцов многомерных метрик bvar, экспортируемых через `/brpc_metrics`. Значение `0` отключает экспорт этих образцов. После изменения требуется перезапуск BE.
* Значение по умолчанию: 5000

#### `be_port` {#be_port}

* Тип: int32
* Описание: порт thrift-сервера BE, используемый для приема запросов от FE.
* Значение по умолчанию: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* Тип: int32
* Описание: порт службы heartbeat (thrift) на BE, используемый для приема heartbeat от FE.
* Значение по умолчанию: 9050

#### `webserver_port` {#webserver_port}

* Тип: int32
* Описание: порт HTTP-сервера BE.
* Значение по умолчанию: 8040

#### `brpc_port` {#brpc_port}

* Тип: int32
* Описание: порт BRPC на BE, используемый для связи между BE.
* Значение по умолчанию: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* Тип: int32
* Описание: порт сервера Arrow Flight SQL на BE, используемый для связи между Arrow Flight Client и BE.
* Значение по умолчанию: -1

#### `enable_https` {#enable_https}

* Тип: bool
* Описание: поддержка HTTPS. При значении true настройте `ssl_certificate_path` и `ssl_private_key_path` в be.conf.
* Значение по умолчанию: false

#### `priority_networks` {#priority_networks}

* Описание: стратегия выбора для серверов с несколькими IP-адресами. Важно, чтобы этому списку соответствовал не более чем один IP. Это разделенный точками с запятой список в нотации CIDR, например 10.10.10.0/24. Если ни один IP не соответствует правилу, выбирается случайный IP.
* Значение по умолчанию: пусто

#### `storage_root_path` {#storage_root_path}

* Тип: string

* Описание: корневой путь данных; несколько путей разделяются символом `;`. Для каждого пути можно указать носитель хранения HDD или SSD. В конце каждого пути можно добавить ограничение емкости, отделив его символом `,`. Если пользователь не использует смесь дисков SSD и HDD, параметры из примеров 1 и 2 ниже настраивать не требуется: достаточно указать каталог хранения; также не нужно изменять конфигурацию носителя хранения FE по умолчанию.

  пример 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1. `/home/disk1/doris.HDD` означает, что носитель хранения — HDD;
    - 2. `/home/disk2/doris.SSD` означает, что носитель хранения — SSD;
    - 3. `/home/disk2/doris` означает, что по умолчанию используется HDD.

  пример 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1. `/home/disk1/doris,medium:hdd` означает, что носитель хранения — HDD;
    - 2. `/home/disk2/doris,medium:ssd` означает, что носитель хранения — SSD.

* Значение по умолчанию: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* Тип: int32
* Описание: число потоков, выполняющих службу heartbeat на BE. По умолчанию — 1; изменять не рекомендуется.
* Значение по умолчанию: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* Тип: bool
* Описание: при запуске BE проверяются все пути в конфигурации ``storage_root_path``.

    - `ignore_broken_disk=true`

  Если путь не существует или файлы по этому пути невозможно читать или записывать (неисправный диск), путь игнорируется. Если есть другие доступные пути, запуск не прерывается.

    - `ignore_broken_disk=false`

  Если путь не существует или файлы по этому пути невозможно читать или записывать (неисправный диск), запуск прерывается с ошибкой, и процесс завершается.

* Значение по умолчанию: false

#### `mem_limit` {#mem_limit}

* Тип: string
* Описание: ограничение доли максимальной памяти сервера, используемой процессом BE. Параметр предотвращает чрезмерное потребление памяти машины процессом BE. Значение должно быть больше 0. Если процент превышает 100%, используется 100%.
* Значение по умолчанию: 90%

#### `cluster_id` {#cluster_id}

* Тип: int32
* Описание: идентификатор кластера, которому принадлежит BE.
    - Обычно FE передает это значение BE через heartbeat, поэтому настраивать его не требуется. Если подтверждено, что BE принадлежит определенному кластеру Doris, его можно задать. Файл cluster_id в каталоге данных необходимо изменить так, чтобы его значение совпадало с этим параметром.
* Значение по умолчанию: -1

#### `custom_config_dir` {#custom_config_dir}

* Описание: расположение файла `be_custom.conf`. По умолчанию используется каталог `conf/`.
    - В некоторых средах развертывания каталог `conf/` может быть перезаписан при обновлении системы. Из-за этого измененные пользователем элементы конфигурации будут потеряны. В таком случае `be_custom.conf` можно хранить в другом указанном каталоге, чтобы предотвратить перезапись файла.
* Значение по умолчанию: пусто

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* Описание: интервал очистки корзины составляет 24 часа. При нехватке места на диске срок хранения файлов в trash может не соответствовать этому параметру.
* Значение по умолчанию: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* Описание: время ожидания подключения к ES по HTTP.
* Значение по умолчанию: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* Описание: время удержания ES scroll keep-alive.
* Значение по умолчанию: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* Тип: int32
* Описание: время ожидания установления соединения с внешней таблицей, например таблицей ODBC.
* Значение по умолчанию: 5 секунд

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* Описание: интервал между отчетами профиля.
* Значение по умолчанию: 5 секунд

#### `brpc_max_body_size` {#brpc_max_body_size}

* Описание: этот параметр изменяет параметр brpc `max_body_size`.

  - Иногда запрос завершается ошибкой, а в журнале BE появляется `body_size is too large`. Это может произойти, когда режим SQL — "multi distinct + no group by + more than 1T of data". Ошибка означает, что размер пакета brpc превышает настроенное значение. Ее можно устранить, увеличив этот параметр.

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* Описание: этот параметр изменяет параметр brpc `socket_max_unwritten_bytes`.
  - Иногда запрос завершается ошибкой, а в журнале BE появляется `The server is overcrowded`. Это означает, что на стороне отправителя буферизовано слишком много сообщений; такое возможно, когда SQL должен передать большое значение bitmap. Ошибку можно устранить, увеличив параметр.

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* Тип: bool
* Описание: определяет, следует ли при длине данных Tuple/Block более 1.8G сериализовать запрос protoBuf, поместить данные Tuple/Block во вложение controller и передать их через HTTP brpc. Это предотвращает ошибки при превышении длиной запроса protoBuf значения 2G: `Bad request, error_text=[E1003]Fail to compress request`. В предыдущих версиях после помещения данных Tuple/Block во вложение они передавались через brpc baidu_std по умолчанию, но вложение размером более 2G обрезалось. Для передачи через HTTP brpc ограничения 2G нет.
* Значение по умолчанию: true

#### `brpc_num_threads` {#brpc_num_threads}

* Описание: этот параметр изменяет число bthread для brpc. Значение по умолчанию — 256.
  - Для повышения производительности QPS можно задать большее значение. Дополнительную информацию см. в `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md`.
* Значение по умолчанию: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* Описание: время ожидания thrift по умолчанию.
* Значение по умолчанию: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* Тип: int64
* Описание: интервал повторных попыток клиента thrift в BE, предотвращающий лавинообразную нагрузку на thrift-сервер FE; единица измерения — ms.
* Значение по умолчанию: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* Описание: время ожидания подключения клиента thrift по умолчанию.
* Значение по умолчанию: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* Тип: string
* Описание: модель службы, используемая thrift-службой FE. Тип — string, регистр не учитывается. Параметр должен совпадать с `thrift_server_type` в FE. Доступны два значения: `THREADED` и `THREAD_POOL`.

    - При значении `THREADED` используется неблокирующая модель I/O.

    - При значении `THREAD_POOL` используется блокирующая модель I/O.

#### `thrift_max_message_size` {#thrift_max_message_size}

По умолчанию: 100MB

Максимальный размер (в байтах) получаемого сообщения thrift-сервера. Если размер сообщения клиента превышает этот предел, thrift-сервер отклоняет запрос и закрывает соединение. В результате клиент получает ошибку: "connection has been closed by peer." В этом случае можно увеличить параметр.

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* Описание: время ожидания RPC отправки txn.
* Значение по умолчанию: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* Описание: размер фрагмента txn_map_lock; значение равно 2^n, где n=0,1,2,3,4. Это улучшение повышает производительность управления txn.
* Значение по умолчанию: 128

#### `txn_shard_size` {#txn_shard_size}

* Описание: размер сегмента txn_lock; значение равно 2^n, где n=0,1,2,3,4. Эта функция повышает производительность отправки и публикации txn.
* Значение по умолчанию: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* Описание: интервал очистки просроченного Rowset.
* Значение по умолчанию: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* Описание: максимальное число кэшей клиентов на хост. В BE есть несколько кэшей клиентов, но сейчас используется одна и та же настройка размера. При необходимости задайте разные размеры для разных кэшей клиентов.
* Значение по умолчанию: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* Тип: int32
* Описание: мягкий предел максимальной длины типа String.
* Значение по умолчанию: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* Тип: int64
* Описание: при использовании внешней таблицы ODBC, если тип столбца исходной таблицы ODBC — HLL, CHAR или VARCHAR и длина значения превышает этот предел, запрос завершается ошибкой 'column value length longer than buffer length'. Значение можно увеличить.
* Значение по умолчанию: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* Тип: int64
* Описание: при использовании внешней таблицы ODBC, если тип столбца исходной таблицы ODBC не является HLL, CHAR или VARCHAR и длина значения превышает этот предел, запрос завершается ошибкой 'column value length longer than buffer length'. Значение можно увеличить.
* Значение по умолчанию: 100

### Запросы {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* Тип: bool
* Описание: могут ли средства чтения внешних таблиц пропускать отсутствующие файлы. Поддерживает динамическую настройку. Начиная с версии 4.1.5 этот параметр не разрешает пропускать отсутствующие файлы данных или удаления в зафиксированных снимках Iceberg: запрос завершается ошибкой даже при значении `true`, чтобы не возвращать незаметно неполный снимок.
* Значение по умолчанию: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* Тип: int64
* Описание: поддерживается начиная с версии 4.1.5. Максимальный размер сериализованных метаданных футера файла в байтах для собственного средства чтения Parquet V2. Должен быть больше `0`. При превышении возвращается `Parquet v2 footer size ... exceeds metadata limit ...`. Поддерживает динамическую настройку. Для корректных файлов с большими футерами значение можно увеличить в пределах доступного бюджета памяти.
* Значение по умолчанию: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* Описание: верхний предел асинхронной работы, обрабатываемой на одном узле.
* Значение по умолчанию: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* Описание: число потоков для выполнения асинхронной работы. По умолчанию минимальное число потоков — 16.
* Значение по умолчанию: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* Описание: потоки для последующей асинхронной работы создаются динамически; максимум — 512 потоков.
* Значение по умолчанию: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* Описание: максимальное число строк данных, возвращаемых каждым потоком сканирования за одно выполнение.
* Значение по умолчанию: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* Описание: число байтов строк фрагмента за одно чтение и выполнение.
    - Примечание: если в таблице слишком много столбцов и `select *` зависает, этот параметр можно изменить.
* Значение по умолчанию: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* Тип: int32
* Описание: длина очереди пула потоков Scanner. В задачах сканирования Doris каждый Scanner передается в пул потоков как задача потока и ожидает планирования. После превышения длины очереди последующие задачи блокируются, пока в очереди не появится свободное место.
* Значение по умолчанию: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* Тип: int32
* Описание: число потоков пула Scanner. В задачах сканирования Doris каждый Scanner передается в пул потоков как задача потока для планирования. Этот параметр определяет размер пула Scanner.
* Значение по умолчанию: зависит от числа ядер CPU. Равно `max(48, 2 * num_of_cpu_cores)`.

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* Тип: int32
* Описание: максимальное число потоков пула Remote scanner. Пул Remote scanner используется для задач сканирования всех внешних источников данных.
* По умолчанию: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* Тип: int32
* Описание: размер очереди Buffer узла ExchangeNode в байтах. После того как объем данных, отправленных стороной Sender, превысит размер Buffer ExchangeNode, последующие данные будут блокироваться до освобождения места в Buffer.
* Значение по умолчанию: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* Тип: int32
* Описание: максимальный объем данных, считываемых каждым OlapScanner.
* Значение по умолчанию: 1024

### Компакция {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* Тип: bool
* Описание: отключение автоматических задач compaction.
  - Обычно этот параметр следует отключать. В среде отладки или тестирования его можно включить, если задачи compaction нужно выполнять вручную.
* Значение по умолчанию: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* Тип: bool
* Описание: включение вертикальной compaction.
* Значение по умолчанию: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* Тип: int32
* Описание: число столбцов в каждой группе при вертикальной compaction.
* Значение по умолчанию: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* Тип: int32
* Описание: максимальный объем памяти row_source_buffer при вертикальной compaction; единица измерения — MB.
* Значение по умолчанию: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* Тип: int32
* Описание: максимальный размер выходного файла сегмента при вертикальной compaction; единица измерения — байты.
* Значение по умолчанию: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* Тип: bool
* Описание: включение compaction упорядоченных данных.
* Значение по умолчанию: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* Тип: int32
* Описание: минимальный размер входного rowset при compaction упорядоченных данных; единица измерения — байты.
* Значение по умолчанию: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* Тип: int32
* Описание: максимальное число потоков в пуле потоков base compaction; -1 означает один поток на диск.
* Значение по умолчанию: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* Описание: минимальный интервал (мс) создания задач compaction.
* Значение по умолчанию: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* Описание: одно из условий запуска BaseCompaction: число файлов Cumulative должно достичь этого предела. После достижения предела запускается BaseCompaction.
* Значение по умолчанию: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* Описание: одно из условий запуска BaseCompaction: размер файла Cumulative достигает указанной доли размера файла Base.
* Значение по умолчанию: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* Тип: int64
* Описание: верхний предел числа "permits", удерживаемых всеми задачами compaction. Параметр ограничивает потребление памяти compaction.
* Значение по умолчанию: 10000
* Динамическое изменение: да

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* Тип: int64
* Описание: если общий размер выходного rowset cumulative compaction на диске превышает этот размер, rowset используется для base compaction. Единица измерения — байты.
  - Обычно значение задают не более 2G, чтобы cumulative compaction не выполнялась слишком долго и не вызывала накопление версий.
* Значение по умолчанию: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* Тип: double
* Описание: если общий размер выходного rowset cumulative compaction на диске превышает указанную долю rowset базовой версии, rowset используется для base compaction.
  - Обычно рекомендуется задавать значение не выше 0.1 и не ниже 0.02.
* Значение по умолчанию: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* Тип: int64
* Описание: если общий размер выходного rowset cumulative compaction на диске меньше этого размера, rowset не проходит base compaction и остается в процессе cumulative compaction. Единица измерения — байты.
  - Обычно значение задают в пределах 512m. Слишком большое значение приводит к слишком малому размеру ранней базовой версии и отсутствию base compaction.
* Значение по умолчанию: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* Тип: int64
* Описание: при слиянии cumulative compaction, если общий размер выбранных rowset превышает это значение, они разделяются и объединяются по политике уровней. При меньшем размере выполняется прямое слияние. Единица измерения — байты.
  - Обычно значение задают в пределах 128m. Слишком большое значение увеличивает write amplification cumulative compaction.
* Значение по умолчанию: 64

#### `default_rowset_type` {#default_rowset_type}

* Тип: string
* Описание: формат хранения, выбираемый BE по умолчанию. Допустимые параметры: "**ALPHA**", "**BETA**". Параметр используется следующим образом:
  - если `storage_format` таблицы задан как Default, этот параметр выбирает формат хранения BE;
  - выбирает формат хранения при выполнении Compaction на BE.
* Значение по умолчанию: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* Описание: стратегия cumulative compaction: минимальное число инкрементальных файлов.
* Значение по умолчанию: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* Описание: стратегия cumulative compaction: максимальное число инкрементальных файлов.
* Значение по умолчанию: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* Тип: int32
* Описание: порог журналирования трассировочной информации base compaction, в секундах.
* Значение по умолчанию: 10

Base compaction — длительная фоновая задача. Этот параметр задает порог журналирования трассировочной информации. Пример информации в журнале:

```
W0610 11:26:33.804431 56452 storage_engine.cpp:552] execute base compaction cost 0.00319222
BaseCompaction:546859:
  - filtered_rows: 0
   - input_row_num: 10
   - input_rowsets_count: 10
   - input_rowsets_data_size: 2.17 KB
   - input_segments_num: 10
   - merge_rowsets_latency: 100000.510ms
   - merged_rows: 0
   - output_row_num: 10
   - output_rowset_data_size: 224.00 B
   - output_segments_num: 1
0610 11:23:03.727535 (+     0us) storage_engine.cpp:554] start to perform base compaction
0610 11:23:03.728961 (+  1426us) storage_engine.cpp:560] found best tablet 546859
0610 11:23:03.728963 (+     2us) base_compaction.cpp:40] got base compaction lock
0610 11:23:03.729029 (+    66us) base_compaction.cpp:44] rowsets picked
0610 11:24:51.784439 (+108055410us) compaction.cpp:46] got concurrency lock and start to do compaction
0610 11:24:51.784818 (+   379us) compaction.cpp:74] prepare finished
0610 11:26:33.359265 (+101574447us) compaction.cpp:87] merge rowsets finished
0610 11:26:33.484481 (+125216us) compaction.cpp:102] output rowset built
0610 11:26:33.484482 (+     1us) compaction.cpp:106] check correctness finished
0610 11:26:33.513197 (+ 28715us) compaction.cpp:110] modify rowsets finished
0610 11:26:33.513300 (+   103us) base_compaction.cpp:49] compaction finished
0610 11:26:33.513441 (+   141us) base_compaction.cpp:56] unused rowsets have been moved to GC queue
```

#### `cumulative_compaction_trace_threshold` {#cumulative_compaction_trace_threshold}

* Тип: int32
* Описание: порог журналирования трассировочной информации cumulative compaction, в секундах.
  - Аналогично `base_compaction_trace_threshold`.
* Значение по умолчанию: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* Тип: int32
* Описание: число задач compaction, одновременно выполняемых для диска (HDD).
* Значение по умолчанию: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* Тип: int32
* Описание: число задач compaction, одновременно выполняемых для быстрого диска (SSD).
* Значение по умолчанию: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* Тип: int32
* Описание: сколько раундов cumulative compaction выполняется на каждый раунд base compaction при создании задач compaction.
* Значение по умолчанию: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* Тип: int32
* Описание: максимальное число потоков в пуле cumulative compaction; -1 означает один поток на диск.
* Значение по умолчанию: -1

#### `enable_segcompaction` {#enable_segcompaction}

* Тип: bool
* Описание: использовать segment compaction во время загрузки, чтобы избежать ошибки -238.
* Значение по умолчанию: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* Тип: int32
* Описание: segment compaction запускается, когда число сегментов превышает этот порог. Параметр также ограничивает максимальное число исходных сегментов в одной задаче segment compaction.
* Значение по умолчанию: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* Тип: int32
* Описание: максимальное допустимое число строк в одном исходном сегменте; более крупные сегменты пропускаются.
* Значение по умолчанию: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* Тип: int64
* Описание: максимальный допустимый размер файла одного исходного сегмента; более крупные сегменты пропускаются.
* Значение по умолчанию: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* Тип: int32
* Описание: максимальное общее число строк в одной задаче segcompaction.
* Значение по умолчанию: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* Тип: int64
* Описание: максимальный общий размер файлов в одной задаче segcompaction.
* Значение по умолчанию: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* Тип: int32
* Описание: размер глобального пула потоков segcompaction.
* Значение по умолчанию: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* Тип: bool
* Описание: отключает трассировочный журнал compaction.
  - При значении true `cumulative_compaction_trace_threshold` и `base_compaction_trace_threshold` не действуют, а журнал отключен.
* Значение по умолчанию: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* Тип: int64
* Описание: интервал (в секундах) выбора rowset для compaction.
* Значение по умолчанию: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* Описание: минимальный интервал (с) обновления информации о peer-репликах.
* Значение по умолчанию: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* Тип: int32
* Описание: минимальный порог compaction score для холодных данных перед запуском compaction. Когда score холодных данных превышает этот порог, compaction рассматривается к запуску. Настройка значения позволяет управлять частотой и агрессивностью compaction холодных данных в удаленном хранилище. Поддерживается начиная с версии 3.1.3.
* Значение по умолчанию: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* Тип: int32
* Описание: число потоков для compaction холодных данных. Параметр управляет степенью параллелизма задач compaction холодных данных. Увеличение значения позволяет одновременно выполнять больше задач, что может повысить пропускную способность, но также увеличивает потребление ресурсов.
* Значение по умолчанию: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* Тип: int32
* Описание: интервал в секундах между запусками compaction холодных данных. Меньший интервал означает более частую проверку и потенциально более быструю очистку, но повышает потребление ресурсов.
* Значение по умолчанию: 1800 (seconds)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* Тип: bool
* Описание: приостанавливать ли задачи compaction при высоком потреблении памяти процесса. Поддерживает динамическое изменение.
  - При включении BE при нехватке памяти приостанавливает compaction, отдавая приоритет запросам и загрузкам.
  - Однако приостановка compaction усложняет слияние tablet с высоким compaction score и усиливает накопление метаданных и памяти, которое должна была устранить compaction. **Начиная с версии 4.0.8 значение по умолчанию изменено с `true` на `false`**, поэтому по умолчанию compaction больше не приостанавливается из-за высокого потребления памяти.
  - Чтобы сохранить прежнее поведение, задайте `true`.
* Значение по умолчанию: false (до 4.0.8 было true)

### Загрузка {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* Тип: int32
* Описание: время ожидания запроса клиента CDC в миллисекундах. Поддерживает динамическую настройку. В версии 4.1.5 значение по умолчанию увеличено с `60000` до `120000`, чтобы допустить более медленные запросы CDC.
* Значение по умолчанию: 120000 (до 4.1.5 — 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* Тип: bool
* Описание: добавлено в версии 4.1.4. Блокировать ли новые записи в таблицу, когда слишком много ее MemTable на этом BE ожидает сброса. Используется вместе с конфигурацией FE `enable_adaptive_random_bucket_load`, чтобы предотвратить накопление MemTable и рост памяти при адаптивной загрузке со случайным распределением по bucket.
* Значение по умолчанию: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* Тип: int32
* Описание: добавлено в версии 4.1.4. Максимальное число MemTable одной таблицы, ожидающих сброса на этом BE. После превышения предела новые записи блокируются, пока число не станет меньше предела. Действует только при `enable_table_memtable_flush_backpressure = true`.
* Значение по умолчанию: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* Тип: int32
* Описание: добавлено в версии 4.1.4. Максимальное число файлов Group Commit WAL для одной таблицы; `0` означает отсутствие ограничения. Если воспроизведение WAL продолжает завершаться ошибкой и WAL накапливаются сверх предела, загрузки Group Commit этой таблицы в `async_mode` отклоняются с ошибкой `EXCEEDED_LIMIT`, сообщение имеет вид `Too many group commit async WALs for table ...`. Предел предотвращает бесконечный рост WAL и заполнение диска.
* Значение по умолчанию: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* Тип: bool
* Описание: включение записи операций Stream Load; по умолчанию отключено.
* Значение по умолчанию: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* Описание: используется для mini load. Файл данных mini load удаляется по истечении этого времени.
* Значение по умолчанию: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* Описание: число потоков импорта для обработки задач с приоритетом HIGH.
* Значение по умолчанию: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* Описание: число потоков импорта для обработки задач с приоритетом NORMAL.
* Значение по умолчанию: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* Описание: включение загрузки данных с одной копией.
* Значение по умолчанию: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* Описание: журнал ошибок загрузки удаляется по истечении этого времени.
* Значение по умолчанию: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* Описание: журналы ошибок загрузки, размер которых превышает это значение, усекаются.
* Значение по умолчанию: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* Описание: доля верхнего предела памяти, занимаемая всеми потоками импорта на одном узле; по умолчанию 50%.
  - Эти значения по умолчанию заданы большими, чтобы обновление Doris не влияло на производительность загрузки. При необходимости пользователь должен правильно настроить параметры.
* Значение по умолчанию: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* Описание: мягкий предел — доля ограничения памяти загрузки одного узла. Например, если ограничение памяти для всех задач загрузки равно 20GB, мягкий предел по умолчанию составляет 50% этого значения, то есть 10GB. Когда потребление памяти загрузкой превышает мягкий предел, выбирается задание с наибольшим потреблением памяти для сброса и освобождения памяти; по умолчанию — 50%.
* Значение по умолчанию: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* Тип: int32
* Описание: параметр изменяет тайм-аут brpc между master- и slave-репликами для загрузки с одной копией.
* Значение по умолчанию: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* Тип: int32
* Описание: ограничивает число сегментов в новом rowset при импорте. При превышении порога импорт завершается ошибкой -238. Слишком большое число сегментов приводит к высокому потреблению памяти compaction и ошибкам OOM.
* Значение по умолчанию: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* Тип: int32
* Описание: число потоков flush на каждый путь хранения, выделяемых для задачи импорта с высоким приоритетом.
* Значение по умолчанию: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* Тип: int32
* Описание: число кэшей для consumer данных, используемых Routine Load.
* Значение по умолчанию: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* Тип: int32
* Описание: для загрузки из одного потока в несколько таблиц. Если после получения пакета сообщений из Kafka размер пакета превышает этот порог, запрашиваются планы для всех связанных таблиц.
* Значение по умолчанию: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* Тип: int32
* Описание: используется при загрузке из одного потока в несколько таблиц. Если число таблиц, ожидающих план, превышает этот порог, запрашиваются планы для всех связанных таблиц. Параметр предотвращает одновременный запрос и выполнение слишком большого числа планов. Обработка нескольких таблиц небольшими пакетами во время загрузки снижает нагрузку на один RPC и улучшает обработку данных в реальном времени.
* Значение по умолчанию: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* Тип: int32
* Описание: параметр изменяет число HTTP рабочих потоков для загрузки сегментов при загрузке с одной копией. При увеличении параллелизма загрузки его можно увеличить, чтобы slave-реплика своевременно синхронизировала файлы данных с master-репликой. При необходимости также следует увеличить `webserver_num_workers` для повышения производительности I/O.
* Значение по умолчанию: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* Тип: int32
* Описание: если время ожидания задачи импорта меньше этого порога, Doris считает задачу высокоприоритетной. Высокоприоритетные задачи используют отдельный пул потоков flush.
* По умолчанию: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* Тип: int32
* Описание: минимальное время ожидания каждого RPC в задании загрузки.
* По умолчанию: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* Тип: bool
* Описание: если используемая версия Kafka ниже 0.10.0.0, это значение следует задать как false.
* По умолчанию: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* Описание: если используемая версия Kafka ниже 0.10.0.0 и `kafka_api_version_request` задан как false, используется значение резервной версии `kafka_broker_version_fallback`. Допустимые значения: 0.9.0.x, 0.8.x.y.
* По умолчанию: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* Описание: максимальное число consumer в группе потребителей данных, используется для Routine Load.
* По умолчанию: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* Тип: int64
* Описание: ограничивает максимальный размер тела запроса для одного Stream Load. JSON-загрузки без `read_json_by_line=true` также ограничиваются `streaming_load_json_max_mb`.
  - Stream Load обычно подходит для загрузки данных объемом менее нескольких GB и не предназначен для слишком больших данных.
* Значение по умолчанию: 102400 (MB)
* Динамическое изменение: да

Это значение по умолчанию в исходном коде; фактическое значение зависит от конфигурации развертывания. Пользователь с правом ADMIN_PRIV может выполнить `SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';`, чтобы проверить фактическое значение на каждом BE. Параметр можно изменить динамически без перезапуска BE. В управляемых облачных службах используйте предоставленный службой механизм конфигурации или обратитесь к администратору для подтверждения и изменения значения.

**История версий:**

- В серии 3.x значение по умолчанию `streaming_load_max_mb` увеличено с 10240 MB (10 GB) до 102400 MB (100 GB), начиная с Doris 3.0.2. В Doris 3.0.0 и 3.0.1 используется значение по умолчанию 10 GB.
- В серии 2.1 такое же изменение действует начиная с 2.1.7.
- Doris 4.x и dev сохраняют значение по умолчанию 100 GB. Фактическое значение зависит от конфигурации развертывания.

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* Тип: int64
* Описание: ограничивает максимальный объем JSON-данных в одном Stream Load. Единица измерения — MB.
  - Некоторые форматы, например JSON, нельзя разделить. Doris должен прочитать все данные в память до начала разбора. Поэтому этот параметр ограничивает максимальный объем данных одной загрузки Stream Load.
* Значение по умолчанию: 100
* Динамическое изменение: да

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* Описание: во время загрузки данных поток опроса постоянно отправляет данные с узла sink Coordinator соответствующему BE. Поток проверяет наличие данных для отправки каждые `olap_table_sink_send_interval_microseconds` микросекунд.
* Значение по умолчанию: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* Описание: если данные загружаются в таблицу с включенным автоматическим партиционированием, интервал `olap_table_sink_send_interval_microseconds` слишком велик. В этом случае фактический интервал умножается на этот коэффициент.
* Значение по умолчанию: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* Тип: bool
* Описание: включение пересылки Stream Load BE для Group Commit в режиме разделения вычислений и хранения. Добавлено в серии Doris 4.0 начиная с версии 4.0.8 и в серии 4.1 начиная с версии 4.1.4. Поддерживает динамическое изменение.
  - Возможность устраняет проблему, при которой балансировщик случайно распределяет запросы Group Commit одной таблицы между разными BE, не позволяя эффективно формировать пакеты: после включения BE пересылает запрос на один целевой BE.
  - **Начиная с версии 4.0.8 конечная точка BE `/api/{db}/{table}/_stream_load_forward` управляется этой конфигурацией: при `false` запросы возвращают `403 Forbidden` с сообщением `Stream load forward is disabled`; при `true` запросы должны пройти аутентификацию и требовать глобальную привилегию `LOAD`.**
  - В развертываниях, использующих эту пересылку, параметр должен иметь значение `true` и на FE, и на BE (см. одноименную конфигурацию FE в [Конфигурации FE](./fe-config)).
* Значение по умолчанию: false

### Потоки {#thread}

#### `delete_worker_count` {#delete_worker_count}

* Описание: число потоков, выполняющих задачи удаления данных.
* Значение по умолчанию: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* Описание: число потоков для очистки транзакций.
* Значение по умолчанию: 1

#### `clone_worker_count` {#clone_worker_count}

* Описание: число потоков для выполнения задач клонирования.
* Значение по умолчанию: 3

#### `be_service_threads` {#be_service_threads}

* Тип: int32
* Описание: число потоков выполнения службы thrift-сервера BE; оно определяет число потоков, которые могут выполнять запросы FE.
* Значение по умолчанию: 64

#### `download_worker_count` {#download_worker_count}

* Описание: число потоков загрузки.
* Значение по умолчанию: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* Описание: число потоков для удаления tablet.
* Значение по умолчанию: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* Описание: число потоков для сброса таблицы памяти на каждый store.
* Значение по умолчанию: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* Описание: число потоков публикации версии.
* Значение по умолчанию: 8

#### `upload_worker_count` {#upload_worker_count}

* Описание: максимальное число потоков загрузки файлов.
* Значение по умолчанию: 1

#### `webserver_num_workers` {#webserver_num_workers}

* Описание: число рабочих потоков webserver по умолчанию.
* Значение по умолчанию: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* Тип: int32
* Описание: число потоков пула SendBatch. В задачах отправки данных NodeChannel операция SendBatch каждого NodeChannel передается в пул как задача потока для планирования. Параметр определяет размер пула SendBatch.
* Значение по умолчанию: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* Тип: int32
* Описание: длина очереди пула SendBatch. В задачах отправки данных NodeChannel операция SendBatch каждого NodeChannel передается в пул как задача потока и ожидает планирования. После превышения длины очереди последующие задачи блокируются до появления свободного места.
* Значение по умолчанию: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* Описание: число потоков создания снимков.
* Значение по умолчанию: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* Описание: число потоков освобождения снимков.
* Значение по умолчанию: 5

### Память {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* Тип: bool
* Описание: использование огромных страниц памяти Linux.
* Значение по умолчанию: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* Описание: максимальное число пакетов кэша внешнего сканирования. Кэш содержит `max_memory_cache_batch_count * batch_size` строк; по умолчанию это 20, а значение `batch_size` по умолчанию — 1024, то есть кэшируются 20 * 1024 строк.
* Значение по умолчанию: 20

#### `memory_max_alignment` {#memory_max_alignment}

* Описание: максимальное выравнивание памяти.
* Значение по умолчанию: 16

#### `mmap_buffers` {#mmap_buffers}

* Описание: использование mmap для выделения памяти.
* Значение по умолчанию: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* Описание: интервал в миллисекундах между итерациями обновления memtable flush mgr.
* Значение по умолчанию: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* Тип: int32
* Описание: если число строк на странице меньше этого значения, zonemap не создается, чтобы уменьшить раздувание данных.
* Значение по умолчанию: 20

#### `memory_mode` {#memory_mode}

* Тип: string
* Описание: управляет сборкой мусора tcmalloc. В режиме performance Doris освобождает память кэша tcmalloc при использовании >= 90% * mem_limit; в противном случае Doris освобождает ее при использовании >= 50% * mem_limit.
* Значение по умолчанию: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* Тип: int64
* Описание: максимальная нижняя отметка системного `/proc/meminfo/MemAvailable`, единица измерения — байт; по умолчанию 1.6G. Фактическая нижняя отметка равна min(1.6G, MemTotal * 10%), чтобы не расходовать слишком много памяти на машинах с объемом более 16G. Увеличение max на машинах с более чем 16G памяти резервирует больше буферов памяти для Full GC. Уменьшение max позволяет использовать как можно больше памяти.
* Значение по умолчанию: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* Описание: максимальный объем памяти для одной задачи изменения схемы.
* Значение по умолчанию: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* Тип: int32
* Описание: минимальная длина TCMalloc Hook при consume/release MemTracker. Размер consume меньше этого значения продолжает накапливаться, чтобы избежать частых вызовов consume/release MemTracker. Уменьшение значения повышает частоту вызовов; увеличение делает статистику MemTracker менее точной. Теоретически разница между значением MemTracker и фактическим значением равна `(mem_tracker_consume_min_size_bytes * число потоков BE, в которых находится MemTracker)`.
* Значение по умолчанию: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* Описание: минимальный размер буфера чтения.
* Значение по умолчанию: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* Описание: размер буфера перед сбросом.
  - Импортированные данные сначала записываются в блок памяти на BE и только после достижения порога записываются на диск. Размер по умолчанию — 200MB. Слишком малый порог может привести к появлению большого числа небольших файлов на BE. Увеличение порога уменьшает число файлов, но слишком большой порог может вызвать тайм-ауты RPC.
* Значение по умолчанию: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* Тип: int32
* Описание: размер кэша при чтении файлов из HDFS или объектного хранилища.
  - Увеличение значения уменьшает число вызовов чтения удаленных данных, но повышает потребление памяти.
* Значение по умолчанию: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* Тип: string
* Описание: тип файла кэша. `whole_file_cache`: загрузка всего файла сегмента; `sub_file_cache`: файл сегмента разделяется на несколько файлов по размеру. Если задано "", кэш не используется; задайте этот параметр, когда кэширование необходимо.
* Значение по умолчанию: ""

#### `path_gc_check` {#path_gc_check}

* Тип: bool
* Описание: включение проверки потока сканирования данных для очистки.
* По умолчанию: true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* Описание: интервал проверки потока сканирования данных для очистки.
* По умолчанию: 86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* По умолчанию: 1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* По умолчанию: 10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* Описание: цикл планирования потока context gc. Единица измерения — минуты; значение по умолчанию — 5 минут.
* По умолчанию: 5

### Хранилище {#storage}

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* Тип: bool
* Описание: поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При `true` инвертированные индексы путей VARIANT не содержат Norms независимо от свойства индекса `norms`. Это уменьшает объем хранения индексов для нескольких путей, но такие индексы больше не поддерживают вычисления BM25 `score()`, требующие Norms. По умолчанию Norms сохраняются. См. [Оценка релевантности](../../table-design/index/inverted-index/scoring.md).
* Значение по умолчанию: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* Тип: int32
* Описание: число строк данных в одном RowBlock.
* Значение по умолчанию: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* Тип: bool
* Описание: отключение page cache для кэширования индексов. Конфигурация действует только для формата хранения BETA; обычно рекомендуется значение false.
* Значение по умолчанию: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* Описание: интервал проверки состояния диска.
* Значение по умолчанию: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* Описание: для каждого размера буфера I/O максимальное число буферов, резервируемых IoMgr: от буферов 1024B до 8MB, всего примерно до 2GB буферов.
* Значение по умолчанию: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* Описание: максимальный интервал очистки мусора на диске.
* Значение по умолчанию: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* Тип: int32
* Описание: процент поврежденных дисков, допустимый для подсистемы хранения. После превышения этого соотношения BE автоматически завершает работу.
* Значение по умолчанию: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* Описание: минимальный интервал очистки мусора на диске.
* Значение по умолчанию: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* Описание: каталог сохранения профилей pprof.
* Значение по умолчанию: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* Описание: каталог для файлов, загруженных SmallFileMgr.
* Значение по умолчанию: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* Описание: каталог функций UDF.
* Значение по умолчанию: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* Описание: минимальное число байтов, которое должно оставаться в каталоге данных.
* Значение по умолчанию: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* Описание: конфигурации storage_flood_stage_usage_percent и storage_flood_stage_left_capacity_bytes ограничивают максимальное использование емкости каталога данных.
* Значение по умолчанию: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* Описание: число потоков для клонирования.
* Значение по умолчанию: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* Описание: размер кэша страниц хранения.
* Значение по умолчанию: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* Описание: размер сегмента StoragePageCache; значение должно быть степенью двойки. Для уменьшения конкуренции блокировок рекомендуется выбрать значение, близкое к числу ядер BE.
* Значение по умолчанию: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* Тип: int32
* Описание: доля кэша страниц индексов в общем кэше страниц хранения; диапазон значений [0, 100].
* Значение по умолчанию: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* Тип: int32
* Описание: максимальное число записей кэша сегментов (ключ — идентификатор rowset). -1 обеспечивает обратную совместимость и означает fd_number * 2/5.
* Значение по умолчанию: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* Тип: bool
* Описание: строгая проверка несовместимого старого формата.
* Значение по умолчанию: true
* Динамическое изменение: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* Описание: открывает ли подсистема хранения синхронизацию и сохраняет ли ее на диске.
* Значение по умолчанию: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* Описание: максимальная длительность хранения подсистемой хранения непроверенных данных.
* Значение по умолчанию: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* Тип: boolean
* Описание: определяет, удалять ли устаревший объединенный rowset, если он не может сформировать согласованный путь версий.
  - Версия пути объединенного просроченного rowset удаляется через полчаса. В нестандартных ситуациях удаление этих версий может привести к невозможности построить согласованный путь запроса. При false проверка программы строгая: программа сообщает ошибку и завершается. При true программа продолжает работу и игнорирует ошибку. Обычно игнорирование не влияет на запросы; только когда объединенная версия отправлена FE, появляется ошибка -230.
* Значение по умолчанию: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* Описание: число рабочих потоков BE для создания tablet.
* Значение по умолчанию: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* Описание: число рабочих потоков для вычисления контрольной суммы tablet.
* Значение по умолчанию: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* Тип: int
* Описание: ограничивает число версий одного tablet. Предотвращает накопление большого числа версий из-за слишком частого импорта или несвоевременной compaction. При превышении лимита задача импорта отклоняется.
* Значение по умолчанию: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* Описание: размер фрагмента tablet_map_lock; значение равно 2^n, где n=0,1,2,3,4. Это улучшает управление tablet.
* Значение по умолчанию: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* Описание: интервал опроса потока TabletMeta Checkpoint.
* Значение по умолчанию: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* Описание: минимальное число Rowset для хранения контрольных точек TabletMeta.
* Значение по умолчанию: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* Тип: int64
* Описание: управляет сроком очистки версии объединенного rowset. Если текущее время now() минус время создания самого нового rowset в пути версий больше tablet_rowset_stale_sweep_time_sec, текущий путь очищается, а объединенные rowset удаляются; единица измерения — секунда.
  - При слишком частой записи FE может не найти объединенную версию, что приводит к ошибке запроса -230. Увеличение параметра предотвращает проблему.
* Значение по умолчанию: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* Описание: интервал обновления кэша состояния tablet.
    - Тайм-аут RPC для отправки Batch (1024 строки) во время импорта. По умолчанию — 60 секунд. RPC может включать запись нескольких блоков памяти, поэтому тайм-аут может быть вызван записью пакетов. Его можно увеличить, чтобы уменьшить ошибки тайм-аута, например send batch fail. При увеличении `write_buffer_size` этот параметр также нужно увеличить.
* Значение по умолчанию: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* Тип: bool
* Описание: игнорировать ошибку brpc `[E1011]The server is overcrowded` при записи данных.
* Значение по умолчанию: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* Описание: срок жизни TabletsChannel. Если за это время канал не получает данных, он удаляется.
* Значение по умолчанию: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* Описание: число потоков для изменения схемы.
* Значение по умолчанию: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* Описание: число потоков для изменения индекса.
* Значение по умолчанию: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* Тип: bool
* Описание: определяет, игнорировать ли ошибки и продолжать запуск BE при сбое загрузки tablet.
* Значение по умолчанию: false

При запуске BE для каждого каталога данных запускается отдельный поток, загружающий метаинформацию заголовка tablet. При конфигурации по умолчанию, если в каталоге данных не удается загрузить tablet, процесс запуска завершается. В журнале `be.INFO` появляется следующее сообщение:

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

Оно показывает число tablet, которые не удалось загрузить в каталоге данных. В журнале также содержится подробная информация о неисправных tablet. Требуется вручную выяснить причину ошибки. Обычно доступны два способа восстановления:
  - если информацию о tablet нельзя восстановить, а другие копии исправны, удалите неисправный tablet с помощью `meta_tool`;
  - задайте `ignore_load_tablet_failure` равным true, и BE проигнорирует неисправные tablet и запустится нормально.

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* Описание: интервал, с которым агент сообщает FE состояние диска.
* Значение по умолчанию: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* Описание: время отмены буфера результата.
* Значение по умолчанию: 300 (s)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* Описание: интервал очистки файлов снимков.
* Значение по умолчанию:172800 (48 часов)

### Журналирование {#log}

#### `sys_log_dir` {#sys_log_dir}

* Тип: string
* Описание: каталог хранения данных журнала BE.
* Значение по умолчанию: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* Описание: уровень журнала: INFO < WARNING < ERROR < FATAL.
* Значение по умолчанию: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* Описание: размер разделения журнала; каждые 1G создается новый файл журнала.
* Значение по умолчанию: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* Описание: число сохраняемых файлов журнала.
* Значение по умолчанию: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* Описание: уровень отображения журнала, управляющий выводом журналов с префиксом VLOG в коде.
* Значение по умолчанию: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* Описание: модуль печати журнала; при указании olap выводятся только журналы модуля olap.
* Значение по умолчанию: пусто

#### `aws_log_level` {#aws_log_level}

* Тип: int32
* Описание: уровень журнала AWS SDK.
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* Значение по умолчанию: 3

#### `log_buffer_level` {#log_buffer_level}

* Описание: стратегия сброса журналов; по умолчанию журналы хранятся в памяти.
* Значение по умолчанию: пусто

### Прочее {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* Тип: bool
* Описание: добавлено в версии 4.1.4. Проверять ли буферы входных данных Arrow перед преобразованием Arrow в внутренние столбцы Doris. Включение предотвращает сбой BE из-за некорректных данных Arrow ценой небольших дополнительных накладных расходов на проверку.
* Значение по умолчанию: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* Описание: интервал, с которым агент сообщает FE о таблице olap.
* Значение по умолчанию: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* Описание: интервал, с которым агент сообщает FE подпись задачи.
* Значение по умолчанию: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* Описание: период обновления счетчиков скорости и выборки.
* Значение по умолчанию: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* Описание: при true калькулятор метрик запускается для сбора показателей BE; при false он не запускается.
* Значение по умолчанию: true

#### `enable_system_metrics` {#enable_system_metrics}

* Описание: управление включением и отключением системных показателей.
* Значение по умолчанию: true

#### `enable_token_check` {#enable_token_check}

* Описание: используется для прямой совместимости; позднее будет удален.
* Значение по умолчанию: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* Описание: максимальное число txn для каждого txn_partition_map в менеджере txn; это самозащита от хранения слишком большого числа txn в менеджере.
* Значение по умолчанию: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* Описание: максимальная скорость загрузки.
* Значение по умолчанию: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* Описание: ограничение времени загрузки.
* Значение по умолчанию: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* Описание: минимальная скорость загрузки.
* Значение по умолчанию: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* Описание: загрузка файлов пакетами; рекомендуется включать при включенном binlog.
* Значение по умолчанию: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* Описание: частота повышения приоритета оставшихся задач в BlockingPriorityQueue.
* Значение по умолчанию: 512

#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* Описание: каталог по умолчанию для JDBC-драйверов.
* Значение по умолчанию: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* Описание: использовать ли simdjson для разбора JSON во время Stream Load.
* Значение по умолчанию: true

#### `user_files_secure_path` {#user_files_secure_path}

* Описание: каталог хранения файлов, запрашиваемых табличными функциями `local`.
* Значение по умолчанию: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* Описание: размер пакета при отправке данных потоковым клиентом brpc.
* Значение по умолчанию: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* Описание: в облачном сценарии развертывания BE часто добавляется в кластер и удаляется из него. Запрос пользователя завершится ошибкой, если фрагмент выполняется на BE, который выключается. Пользователь может выполнить `stop_be.sh --grace`; тогда BE дождется завершения всех выполняющихся запросов, чтобы избежать ошибки, но при превышении предела ожидания BE завершится немедленно. В этот период FE не отправляет новые запросы на BE и ждет завершения выполняющихся запросов.
* Значение по умолчанию: 120

#### `enable_java_support` {#enable_java_support}

* Описание: включение использования java-jni в BE. После включения разрешены взаимные вызовы между C++ и Java. Сейчас поддерживаются hudi, java-udf, jdbc, max-compute, paimon, preload, avro.
* Значение по умолчанию: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Каталог `WAL` Group Commit.
* По умолчанию: в каждом каталоге `storage_root_path` создается каталог `wal`. Пример конфигурации:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### Режим разделения вычислений и хранения {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* По умолчанию: ""

* Описание: режим работы BE. `cloud` означает режим с разделением хранения и вычислений.

#### `meta_service_endpoint` {#meta_service_endpoint}

По умолчанию: ""

* Описание: конечные точки meta service задаются в формате 'host1:port,host2:port'. Обычно это значение передается FE в BE через heartbeat, поэтому настраивать его не нужно.

#### `enable_file_cache` {#enable_file_cache}

По умолчанию: true (включено по умолчанию начиная с версии 4.1.5; ранее было false; в режиме разделения вычислений и хранения всегда включено).
* Описание: использование файлового кэша. Изменения требуют перезапуска BE. Переменная сеанса `enable_file_cache` также должна быть включена. В версии 4.1.5 значения по умолчанию конфигурации BE и переменной сеанса изменены на `true`; существующие явные настройки и сохраненные глобальные переменные следует проверять отдельно.

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* Тип: bool
* Описание: поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. Оценивает ограничение скорости на уровне хоста для RPC BE—Meta Service без ожидания. Не зависит от `enable_ms_rpc_host_level_rate_limit`: оценка выполняется даже при `false`; если оба параметра равны `true`, приоритет имеет dry-run. Чтобы реально применять ограничение, включите `enable_ms_rpc_host_level_rate_limit` и отключите этот параметр.
* Значение по умолчанию: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* Тип: bool
* Описание: поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. Оценивает адаптивное ограничение скорости на уровне таблицы, запускаемое ответами Meta Service `MS_BUSY`, без ожидания. Не зависит от `enable_ms_backpressure_handling`; если оба значения `true`, приоритет имеет dry-run. Чтобы применять ограничение на уровне таблицы, включите `enable_ms_backpressure_handling` и отключите этот параметр.
* Значение по умолчанию: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* Тип: int32
* Описание: поддерживается начиная с версии 4.2.0. Поддерживает динамическую настройку. Число последовательных сбоев соединения или RPC для адреса peer, после которого открывается circuit breaker. Фактический минимум равен `1`. Состояние на уровне адреса совместно используется чтением peer для разных tablet, чтобы не подключаться повторно к недоступному узлу.
* Значение по умолчанию: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* Тип: int32
* Описание: поддерживается начиная с версии 4.2.0. Время в секундах, в течение которого открытый circuit breaker peer отклоняет чтения с этого адреса. Отрицательные значения считаются `0`. После этого периода разрешается одна проба восстановления.
* Значение по умолчанию: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* Тип: int64
* Описание: максимальный сериализованный размер в байтах Delete Bitmap V2, хранимого непосредственно в FDB в режиме разделения вычислений и хранения. Поддерживает динамическую настройку. Значения выше неотрицательного порога сохраняются в файле объектного хранилища; отрицательное значение отключает перенос по размеру. В версии 4.1.5 значение по умолчанию увеличено с `1024` до `89000`, чтобы оставить место для дополнительных полей сообщения в блоке размером 90000 байт.
* Значение по умолчанию: 89000 (до 4.1.5 — 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* Тип: bool
* Описание: поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При замене агрегированных исторических Delete Bitmap в режиме разделения вычислений и хранения записи конечной версии удаляются по ключу. Значение `false` включает удаление диапазонами. Параметр меняет только способ удаления в существующей очистке и не включает дополнительную задачу очистки.
* Значение по умолчанию: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* Тип: bool
* Описание: поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При очистке исторических Delete Bitmap в агрегированном диапазоне в режиме разделения вычислений и хранения записи удаляются по ключу от начальной версии (включительно) до конечной (исключительно). Значение `false` включает удаление диапазонами. Существующие переключатели очистки и предварительные условия сохраняются.
* Значение по умолчанию: true

#### `file_cache_path` {#file_cache_path}

По умолчанию: [{"path":"${DORIS_HOME}/file_cache"}]
* Описание: пути дисков и другие параметры файлового кэша, представленные в виде массива с одной записью для каждого диска. `path` задает путь диска, а `total_size` ограничивает размер кэша; -1 или 0 используют все дисковое пространство.
* Формат: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* Тип: bool
* Описание: добавлено в версии 4.1.4. Асинхронная запись файлового кэша. При включении запись удаленных данных обратно в файловый кэш передается фоновому пулу потоков вместо блокировки пути чтения, что снижает задержку холодного чтения.
* Значение по умолчанию: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* Тип: int32
* Описание: добавлено в версии 4.1.4. Число потоков записи на каждый диск кэша при асинхронной записи файлового кэша. Действует только при `enable_async_file_cache_write = true`.
* Значение по умолчанию: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Максимальный общий размер данных в байтах, ожидающих асинхронной записи в файловый кэш. Запросы обратной записи сверх лимита отбрасываются: это не влияет на корректность запроса, но данные не кэшируются. `-1` означает отсутствие ограничения.
* Значение по умолчанию: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* Тип: bool
* Описание: добавлено в версии 4.1.4. Одновременно записывать данные в локальный файловый кэш при записи в объектное хранилище, чтобы только что записанные данные можно было сразу читать из кэша.
* Значение по умолчанию: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* Тип: bool
* Описание: добавлено в версии 4.1.4. Записывать в файловый кэш только файлы индексов. При включении индексы в первую очередь сохраняются в кэше при ограниченном пространстве.
* Значение по умолчанию: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* Тип: bool
* Описание: главный переключатель чтения из кэша peer. При включении после промаха локального File Cache сначала предпринимается попытка прочитать блок из File Cache другого BE (в той же или другой вычислительной группе), а к объектному хранилищу обращаются только если блок отсутствует у всех BE. Чтение peer в одной и разных группах управляется этим переключателем совместно; отключить межгрупповое чтение отдельно нельзя. Межгрупповое чтение peer поддерживается начиная с версии 4.2.0; в этой версии также удален параметр `cache_read_from_peer_expired_seconds`. См. [Чтение кэша peer](../../compute-storage-decoupled/file-cache/file-cache-peer-read).
* Значение по умолчанию: false (при необходимости включите явно)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* Тип: bool
* Описание: добавлено в версии 4.2.0. Должно ли чтение peer конкурировать с чтением объектного хранилища, при этом выигрывает первый результат. При отключении чтение последовательное: кандидаты peer проверяются по одному, а объектное хранилище читается только после их неудачи.
* Значение по умолчанию: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Фора чтения peer в гонке, в миллисекундах. Если peer отвечает за это время, чтение объектного хранилища не отправляется; `0` запускает оба чтения одновременно.
* Значение по умолчанию: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Максимальное число одновременных гонок peer—объектное хранилище на одном BE. Промахи сверх этого предела обрабатываются последовательным чтением.
* Значение по умолчанию: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* Тип: string
* Описание: добавлено в версии 4.2.0. Задается на BE, инициирующем чтение. Идентификатор вычислительной группы, отвечающей за межгрупповое заполнение (`compute_group_id` в столбце `Tag` команды `SHOW BACKENDS`, а не имя вычислительной группы). Если выбранный кандидат peer принадлежит этой группе, запрос просит его получить блок из объектного хранилища и записать его в собственный File Cache, если блок отсутствует. Пустое значение означает, что заполнение не используется.
* Значение по умолчанию: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* Тип: bool
* Описание: добавлено в версии 4.2.0. Задается на BE, обслуживающем кэш. Принимать ли запросы чтения peer с флагом заполнения. При отключении блоки, отсутствующие локально, считаются ненайденными, и запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Максимальное ожидание одного заполнения на стороне обслуживания, в миллисекундах. При тайм-ауте запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Максимальное число одновременных заполнений на стороне обслуживания. Запросы сверх лимита отклоняются, и запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Кандидат peer удаляется из списка после такого числа последовательных сбоев RPC.
* Значение по умолчанию: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Число последовательных чтений, при которых все кандидаты peer не находят данные, после чего tablet переходит в режим охлаждения; в этот период чтения направляются непосредственно в объектное хранилище.
* Значение по умолчанию: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* Тип: int64
* Описание: добавлено в версии 4.2.0. Длительность охлаждения чтения peer, в секундах.
* Значение по умолчанию: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* Тип: int64
* Описание: добавлено в версии 4.2.0. Срок действия записи кандидата peer в секундах, отсчитываемый от последнего использования. Просроченные записи удаляются из памяти и повторно запрашиваются у FE при следующем промахе.
* Значение по умолчанию: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* Тип: int64
* Описание: добавлено в версии 4.2.0. Интервал фоновой задачи очистки просроченных кандидатов peer, в секундах.
* Значение по умолчанию: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Максимальное время ожидания запроса чтения peer в очереди обработки на стороне обслуживания, в миллисекундах. Запросы, ожидающие дольше, отклоняются, чтобы запрашивающий BE быстро обратился к объектному хранилищу.
* Значение по умолчанию: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Размер пула потоков для обработки запросов чтения peer на стороне обслуживания; пул изолирован от пулов тяжелых RPC, например загрузок. `-1` означает `max(64, 2 × CPU cores)`. Динамическое изменение не поддерживается.
* Значение по умолчанию: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Длина очереди пула потоков чтения peer на стороне обслуживания. `-1` означает `max(4096, 128 × CPU cores)`. Динамическое изменение не поддерживается.
* Значение по умолчанию: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* Тип: int32
* Описание: добавлено в версии 4.2.0. Минимальное и максимальное число потоков пула, выполняющего чтение объектного хранилища на стороне запроса во время гонки peer—объектное хранилище. Динамическое изменение не поддерживается.
* Значение по умолчанию: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Ограничение QPS запросов GET / PUT к объектному хранилищу, вычисляемое на ядро CPU. Отрицательное значение отключает этот режим и возвращает старую конфигурацию абсолютного числа токенов; `0` означает отсутствие ограничения QPS.
* Значение по умолчанию: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Жесткий верхний предел QPS GET / PUT, вычисляемый по числу ядер CPU. Значение меньше или равно `0` означает отсутствие верхнего предела.
* Значение по умолчанию: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Ограничение пропускной способности GET / PUT объектного хранилища, вычисляемое на ядро CPU (байт в секунду на ядро). Значение меньше или равно `0` означает отсутствие ограничения.
* Значение по умолчанию: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Жесткий верхний предел пропускной способности GET / PUT, вычисляемый по числу ядер CPU, в байтах в секунду. Значение меньше или равно `0` означает отсутствие верхнего предела.
* Значение по умолчанию: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* Тип: int32
* Описание: добавлено в версии 4.1.4. Число ядер CPU, используемое для вычисления приведенных ограничений скорости. Значение меньше или равно `0` означает автоматическое определение числа ядер машины.
* Значение по умолчанию: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* Тип: int64
* Описание: добавлено в версии 4.1.4. Минимальный интервал между записями журнала, выводимыми при срабатывании ограничения скорости объектного хранилища, в миллисекундах.
* Значение по умолчанию: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* Тип: int32
* Описание: добавлено в версии 4.1.4. число сегментов памяти файлового кэша для уменьшения конкуренции блокировок при параллельном доступе.
* Значение по умолчанию: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* Тип: int
* Описание: ограничивает число версий одного tablet в политике time-series compaction. Предотвращает накопление большого числа версий из-за слишком частой загрузки или несвоевременной compaction. При превышении лимита задача загрузки отклоняется.
* Значение по умолчанию: 20000
