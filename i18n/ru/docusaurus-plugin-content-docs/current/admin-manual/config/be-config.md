---
{
    "title": "Конфигурация BE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "В этом документе описаны параметры конфигурации BE."
}
---

# Конфигурация BE {#be-configuration}

В этом документе описаны параметры конфигурации BE.

Файл конфигурации BE `be.conf` обычно хранится в каталоге `conf/` по пути развёртывания BE. В версии 0.14 появится дополнительный файл конфигурации `be_custom.conf`. Он предназначен для хранения параметров, которые пользователь динамически изменяет и сохраняет во время работы.

После запуска процесс BE сначала считывает параметры из `be.conf`, а затем из `be_custom.conf`. Параметры из `be_custom.conf` переопределяют одноимённые параметры из `be.conf`.

Расположение файла `be_custom.conf` можно задать в `be.conf` с помощью параметра `custom_config_dir`.

## Просмотр параметров конфигурации {#view-configuration-items}

Просмотреть параметры конфигурации BE можно двумя способами:

1. Веб-страница BE

    Текущие параметры конфигурации доступны на веб-странице BE:

    `http://be_host:be_webserver_port/varz`

2. Просмотр с помощью команды

   Параметры конфигурации BE можно просмотреть в клиенте MySQL с помощью следующей команды. Подробное описание синтаксиса см. в разделе [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG):

    `SHOW BACKEND CONFIG;`

    Столбцы результата имеют следующие значения:

    1. BackendId: идентификатор backend.
    2. Host: IP-адрес backend.
    3. Key: имя параметра конфигурации.
    4. Value: текущее значение параметра конфигурации.
    5. Type: тип значения параметра конфигурации, например целое число или строка.
    6. IsMutable: можно ли изменять параметр динамически. Если true, параметр можно изменять во время работы. Если false, параметр можно задать только в be.conf, и он вступит в силу после перезапуска BE.

## Настройка параметров конфигурации {#set-configuration-items}

Задать параметры конфигурации BE можно двумя способами:

1. Статическая настройка

   Добавьте параметры и задайте их значения в файле `conf/be.conf`. Параметры из `be.conf` считываются при запуске BE. Для параметров, отсутствующих в `be.conf`, используются значения по умолчанию.

2. Динамическая настройка

   После запуска BE параметры можно динамически изменять с помощью следующих команд.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   В версии 0.13 и более ранних версиях изменения, внесённые таким способом, теряются после перезапуска процесса BE. Начиная с версии 0.14 изменённую конфигурацию можно сохранить с помощью следующей команды. Изменённые параметры сохраняются в файле `be_custom.conf`.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## Примеры {#examples}

1. Статическое изменение `max_base_compaction_threads`

   Добавьте в файл `be.conf` следующую строку:

   ```max_base_compaction_threads=5```

   Затем перезапустите процесс BE, чтобы конфигурация вступила в силу.

2. Динамическое изменение `streaming_load_max_mb`

   После запуска BE динамически задайте параметр `streaming_load_max_mb` следующей командой:

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   Следующий ответ означает, что настройка выполнена успешно.

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   После перезапуска BE изменение будет потеряно. Чтобы сохранить изменённое значение, используйте следующую команду:

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## Параметры конфигурации {#configurations}

### Службы {#services}

#### `deploy_mode` {#deploy_mode}

* Тип: string
* Описание: Режим работы BE. Значение `cloud` обозначает режим с разделением хранения и вычислений.
* Значение по умолчанию: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* Тип: string
* Описание: Поддерживается начиная с версии 4.1.5. Максимальное количество образцов многомерных метрик bvar, экспортируемых через `/brpc_metrics`. Установите `0`, чтобы отключить экспорт этих образцов. Изменения требуют перезапуска BE.
* Значение по умолчанию: 5000

#### `be_port` {#be_port}

* Тип: int32
* Описание: Порт сервера thrift на BE для приёма запросов от FE.
* Значение по умолчанию: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* Тип: int32
* Описание: Порт службы heartbeat (thrift) на BE для приёма heartbeat от FE.
* Значение по умолчанию: 9050

#### `webserver_port` {#webserver_port}

* Тип: int32
* Описание: Порт службы HTTP-сервера на BE.
* Значение по умолчанию: 8040

#### `brpc_port` {#brpc_port}

* Тип: int32
* Описание: Порт BRPC на BE для обмена данными между BE.
* Значение по умолчанию: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* Тип: int32
* Описание: Порт сервера Arrow Flight SQL на BE для обмена данными между Arrow Flight Client и BE.
* Значение по умолчанию: -1

#### `enable_https` {#enable_https}

* Тип: bool
* Описание: Включает поддержку HTTPS. Если поддержка включена, настройте `ssl_certificate_path` и `ssl_private_key_path` в be.conf.
* Значение по умолчанию: false

#### `priority_networks` {#priority_networks}

* Описание: Задаёт стратегию выбора IP-адреса для серверов с несколькими IP-адресами. Этому списку должен соответствовать не более чем один IP-адрес. Список задаётся в нотации CIDR с разделителем «точка с запятой», например 10.10.10.0/24. Если ни один IP-адрес не соответствует правилу, адрес выбирается случайным образом.
* Значение по умолчанию: пусто

#### `storage_root_path` {#storage_root_path}

* Тип: string

* Описание: Корневые пути хранения данных, разделённые символом ';'. Для каждого корневого пути можно указать тип носителя: HDD или SSD. В конце каждого пути можно добавить ограничение ёмкости, отделив его символом ','. Если пользователь не использует одновременно диски SSD и HDD, применять способы настройки из примера 1 и примера 2 ниже не требуется: достаточно указать каталог хранения. Менять настройку типа носителя по умолчанию в FE также не требуется.

  Пример 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD означает, что тип носителя — HDD;
    - 2./home/disk2/doris.SSD означает, что тип носителя — SSD;
    - 3./home/disk2/doris означает, что по умолчанию используется тип носителя HDD.

  Пример 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd означает, что тип носителя — HDD;
    - 2./home/disk2/doris,medium:ssd означает, что тип носителя — SSD.

* Значение по умолчанию: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* Тип: int32
* Описание: Количество потоков, выполняющих службу heartbeat на BE. По умолчанию 1; изменять значение не рекомендуется.
* Значение по умолчанию: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* Тип: bool
* Описание: При запуске BE проверяются все пути, заданные в ``storage_root_path``.

    -  `ignore_broken_disk=true`

  Если путь не существует или файлы по этому пути невозможно читать либо записывать из-за неисправности диска, путь игнорируется. Если доступны другие пути, запуск продолжается.

    -  `ignore_broken_disk=false`

  Если путь не существует или файлы по этому пути невозможно читать либо записывать из-за неисправности диска, система прерывает запуск и завершает работу.

* Значение по умолчанию: false

#### `mem_limit` {#mem_limit}

* Тип: string
* Описание: Ограничивает долю максимального объёма памяти сервера, которую может использовать процесс BE. Параметр предотвращает чрезмерное потребление памяти сервера процессом BE. Значение должно быть больше 0. Если указано более 100%, используется значение 100%.
* Значение по умолчанию: 90%

#### `cluster_id` {#cluster_id}

* Тип: int32
* Описание: Задаёт идентификатор кластера, к которому принадлежит BE.
    - Обычно FE передаёт это значение в BE через heartbeat, поэтому задавать его не требуется. Параметр можно задать, если точно известно, что BE принадлежит определённому кластеру Doris. Необходимо также изменить файл cluster_id в каталоге данных, чтобы его значение совпадало со значением этого параметра.
* Значение по умолчанию: -1

#### `custom_config_dir` {#custom_config_dir}

* Описание: Задаёт расположение файла `be_custom.conf`. По умолчанию он находится в каталоге `conf/`.
    - В некоторых средах развёртывания каталог `conf/` может перезаписываться при обновлении системы. При этом изменённые пользователем параметры также будут перезаписаны. Чтобы избежать этого, файл `be_custom.conf` можно хранить в другом указанном каталоге.
* Значение по умолчанию: пусто

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* Описание: Интервал очистки корзины составляет 24 часа. При нехватке места на диске срок хранения файлов в корзине может не соответствовать этому параметру.
* Значение по умолчанию: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* Описание: Тайм-аут подключения к ES по HTTP.
* Значение по умолчанию: 5000 (мс)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* Описание: Время поддержания активности scroll в ES.
* Значение по умолчанию: 5 (мин)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* Тип: int32
* Описание: Тайм-аут установления соединения с внешней таблицей, например таблицей ODBC.
* Значение по умолчанию: 5 секунд

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* Описание: Интервал между отправками отчётов profile.
* Значение по умолчанию: 5 секунд

#### `brpc_max_body_size` {#brpc_max_body_size}

* Описание: Эта настройка в основном используется для изменения параметра `max_body_size` в brpc.

  - Иногда запрос завершается с ошибкой, а в журнале BE появляется сообщение `body_size is too large`. Это может произойти для SQL вида «multi distinct + no group by + более 1T данных». Ошибка означает, что размер пакета brpc превышает заданное значение. Увеличение значения параметра позволяет избежать этой ошибки.

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* Описание: Эта настройка в основном используется для изменения параметра `socket_max_unwritten_bytes` в brpc.
  - Иногда запрос завершается с ошибкой, а в журнале BE появляется сообщение `The server is overcrowded`. Это означает, что на стороне отправителя накопилось слишком много сообщений для буферизации. Такое возможно, когда SQL требует передачи большого значения bitmap. Увеличение значения параметра позволяет избежать этой ошибки.

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* Тип: bool
* Описание: Определяет, следует ли при размере данных Tuple/Block более 1.8G сериализовать запрос protoBuf, помещать данные Tuple/Block во вложение контроллера и отправлять их через HTTP brpc. Это позволяет избежать ошибки при превышении размера запроса protoBuf в 2G: Bad request, error_text=[E1003]Fail to compress request. В предыдущей версии данные Tuple/Block после помещения во вложение передавались через стандартный протокол baidu_std brpc, но вложения размером более 2G обрезались. При отправке через HTTP brpc ограничение в 2G отсутствует.
* Значение по умолчанию: true

#### `brpc_num_threads` {#brpc_num_threads}

* Описание: Эта настройка в основном используется для изменения количества bthreads в brpc. Значение по умолчанию — 256.
  - Для повышения производительности QPS можно установить большее значение. Подробнее см. `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md`.
* Значение по умолчанию: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* Описание: Тайм-аут thrift по умолчанию.
* Значение по умолчанию: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* Тип: int64
* Описание: Задаёт интервал повторных попыток для клиента thrift в BE, чтобы избежать лавинообразной нагрузки на сервер thrift в FE. Единица измерения — мс.
* Значение по умолчанию: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* Описание: Тайм-аут подключения клиента thrift по умолчанию.
* Значение по умолчанию: 3 (с)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* Тип: string
* Описание: Указывает модель обслуживания, используемую службой Thrift в FE. Параметр имеет тип string и не чувствителен к регистру. Его значение должно соответствовать параметру thrift_server_type в FE. В настоящее время доступны два значения: `THREADED` и `THREAD_POOL`.

    - Если параметр равен `THREADED`, используется модель с неблокирующим вводом-выводом.

    - Если параметр равен `THREAD_POOL`, используется модель с блокирующим вводом-выводом.

#### `thrift_max_message_size` {#thrift_max_message_size}

По умолчанию: 100MB

Максимальный размер принимаемого сообщения сервера thrift в байтах. Если размер сообщения, отправленного клиентом, превышает это ограничение, сервер Thrift отклоняет запрос и закрывает соединение. В результате клиент получает ошибку: "connection has been closed by peer." В этом случае можно попробовать увеличить значение параметра.

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* Описание: Тайм-аут RPC для фиксации txn.
* Значение по умолчанию: 60,000 (мс)

#### `txn_map_shard_size` {#txn_map_shard_size}

* Описание: Количество сегментов txn_map_lock. Значение задаётся как 2^n, где n=0,1,2,3,4. Это позволяет повысить производительность управления txn.
* Значение по умолчанию: 128

#### `txn_shard_size` {#txn_shard_size}

* Описание: Количество шардов txn_lock. Значение задаётся как 2^n, где n=0,1,2,3,4. Это позволяет повысить производительность фиксации и публикации txn.
* Значение по умолчанию: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* Описание: Интервал очистки Rowset с истёкшим сроком хранения.
* Значение по умолчанию: 30 (с)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* Описание: Максимальный размер кеша клиентов для каждого хоста. В BE есть несколько кешей клиентов, но сейчас для них используется общая настройка размера. При необходимости для разных клиентских кешей можно использовать отдельные настройки.
* Значение по умолчанию: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* Тип: int32
* Описание: Мягкое ограничение максимальной длины значения типа String.
* Значение по умолчанию: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* Тип: int64
* Описание: При использовании внешней таблицы ODBC, если столбец исходной таблицы ODBC имеет тип HLL, CHAR или VARCHAR и длина его значения превышает этот порог, запрос завершается с ошибкой 'column value length longer than buffer length'. Значение параметра можно увеличить.
* Значение по умолчанию: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* Тип: int64
* Описание: При использовании внешней таблицы ODBC, если столбец исходной таблицы ODBC имеет тип, отличный от HLL, CHAR или VARCHAR, и длина его значения превышает этот порог, запрос завершается с ошибкой 'column value length longer than buffer length'. Значение параметра можно увеличить.
* Значение по умолчанию: 100

### Запросы {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* Тип: bool
* Описание: Разрешает средствам чтения внешних таблиц пропускать отсутствующие файлы. Поддерживает динамическую настройку. Начиная с версии 4.1.5 этот параметр не допускает отсутствия файлов данных или файлов удаления в зафиксированных снимках Iceberg: запрос завершается с ошибкой, даже если установлено `true`, чтобы избежать незаметного возврата неполного снимка.
* Значение по умолчанию: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* Тип: int64
* Описание: Поддерживается начиная с версии 4.1.5. Максимальный размер сериализованных метаданных footer файла в байтах для нативного средства чтения Parquet V2. Должен быть больше `0`. При превышении возвращается ошибка `Parquet v2 footer size ... exceeds metadata limit ...`. Поддерживает динамическую настройку. Для корректных файлов с большим footer увеличивайте значение в пределах доступного объёма памяти.
* Значение по умолчанию: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* Описание: Максимальное количество асинхронных задач, которые можно обрабатывать на одном узле.
* Значение по умолчанию: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* Описание: Количество потоков для выполнения асинхронных задач. По умолчанию минимальное количество потоков — 16.
* Значение по умолчанию: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* Описание: Потоки создаются динамически по мере поступления асинхронных задач. Максимальное количество создаваемых потоков — 512.
* Значение по умолчанию: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* Описание: Максимальное количество строк данных, возвращаемых каждым потоком сканирования за одно выполнение.
* Значение по умолчанию: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* Описание: Объём строк в байтах, считываемых за одно выполнение фрагмента.
    - Примечание: если таблица содержит слишком много столбцов и выполнение `select *` зависает, можно изменить этот параметр.
* Значение по умолчанию: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* Тип: int32
* Описание: Длина очереди пула потоков Scanner. В задачах сканирования Doris каждый Scanner передаётся в пул как потоковая задача и ожидает выполнения. Если количество переданных задач превышает длину очереди пула, передача последующих задач блокируется до появления свободного места в очереди.
* Значение по умолчанию: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* Тип: int32
* Описание: Количество потоков в пуле Scanner. В задачах сканирования Doris каждый Scanner передаётся в пул как потоковая задача для последующего выполнения. Этот параметр определяет размер пула потоков Scanner.
* Значение по умолчанию: зависит от количества ядер CPU. Равно `max(48, 2 * num_of_cpu_cores)`.

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* Тип: int32
* Описание: Максимальное количество потоков в пуле Remote scanner. Пул Remote scanner используется для задач сканирования всех внешних источников данных.
* По умолчанию: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* Тип: int32
* Описание: Размер очереди Buffer узла ExchangeNode в байтах. Когда объём данных, отправленных стороной Sender, превышает размер Buffer в ExchangeNode, дальнейшая отправка блокируется, пока в Buffer не освободится место для записи.
* Значение по умолчанию: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* Тип: int32
* Описание: Максимальный объём данных, считываемых каждым OlapScanner.
* Значение по умолчанию: 1024

### compaction {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* Тип: bool
* Описание: Отключает автоматические задачи compaction.
  - Обычно этот параметр следует оставлять выключенным. Включите его, если хотите вручную управлять задачами compaction в среде отладки или тестирования.
* Значение по умолчанию: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* Тип: bool
* Описание: Включает vertical compaction.
* Значение по умолчанию: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* Тип: int32
* Описание: Количество столбцов в каждой группе при vertical compaction.
* Значение по умолчанию: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* Тип: int32
* Описание: Максимальное потребление памяти row_source_buffer при vertical compaction. Единица измерения — MB.
* Значение по умолчанию: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* Тип: int32
* Описание: Максимальный размер выходного файла сегмента при vertical compaction. Единица измерения — мегабайты.
* Значение по умолчанию: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* Тип: bool
* Описание: Включает ordered data compaction.
* Значение по умолчанию: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* Тип: int32
* Описание: Минимальный размер сегмента входного rowset при ordered data compaction. Единица измерения — мегабайты.
* Значение по умолчанию: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* Тип: int32
* Описание: Максимальное количество потоков в пуле base compaction. Значение -1 означает один поток на диск.
* Значение по умолчанию: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* Описание: Минимальный интервал создания задач compaction в мс.
* Значение по умолчанию: 10 (мс)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* Описание: Одно из условий запуска BaseCompaction: порог количества файлов Cumulative. При достижении этого порога запускается BaseCompaction.
* Значение по умолчанию: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* Описание: Одно из условий запуска BaseCompaction: размер файлов Cumulative достигает заданной доли размера файла Base.
* Значение по умолчанию: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* Тип: int64
* Описание: Верхний предел количества «permits», удерживаемых всеми задачами compaction. Параметр позволяет ограничить потребление памяти при compaction.
* Значение по умолчанию: 10000
* Динамическое изменение: да

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* Тип: int64
* Описание: Если общий размер выходного rowset cumulative compaction на диске превышает заданное значение, этот rowset используется для base compaction. Единица измерения — мегабайты.
  - Обычно задаётся значение меньше 2G, чтобы cumulative compaction не занимала слишком много времени и не приводила к накоплению версий.
* Значение по умолчанию: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* Тип: double
* Описание: Если общий размер выходного rowset cumulative compaction на диске превышает заданную долю размера rowset базовой версии, этот rowset используется для base compaction.
  - Обычно рекомендуется задавать значение не выше 0.1 и не ниже 0.02.
* Значение по умолчанию: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* Тип: int64
* Описание: Если общий размер выходного rowset cumulative compaction на диске меньше заданного значения, rowset не участвует в base compaction и остаётся в процессе cumulative compaction. Единица измерения — мегабайты.
  - Обычно значение не превышает 512m. При слишком большом значении начальная базовая версия может долго оставаться слишком маленькой для запуска base compaction.
* Значение по умолчанию: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* Тип: int64
* Описание: Если при cumulative compaction размер выбранных для слияния rowset на диске превышает заданное значение, они разделяются и объединяются согласно политике уровней. Если размер меньше заданного значения, слияние выполняется напрямую. Единица измерения — мегабайты.
  - Обычно значение не превышает 128m. Слишком большое значение усиливает write amplification при cumulative compaction.
* Значение по умолчанию: 64

#### `default_rowset_type` {#default_rowset_type}

* Тип: string
* Описание: Определяет формат хранения, который BE выбирает по умолчанию. Допустимые значения: "**ALPHA**", "**BETA**". Параметр выполняет две основные функции:
  - Если storage_format таблицы имеет значение Default, этот параметр определяет формат хранения BE.
  - Определяет формат хранения при выполнении Compaction в BE.
* Значение по умолчанию: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* Описание: Стратегия cumulative compaction: минимальное количество инкрементальных файлов.
* Значение по умолчанию: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* Описание: Стратегия cumulative compaction: максимальное количество инкрементальных файлов.
* Значение по умолчанию: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* Тип: int32
* Описание: Порог записи трассировочной информации base compaction в журнал, в секундах.
* Значение по умолчанию: 10

Base compaction — длительная фоновая задача. Этот параметр задаёт порог, при превышении которого записывается трассировочная информация. В файле журнала она выглядит следующим образом:

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
* Описание: Порог записи трассировочной информации cumulative compaction в журнал, в секундах.
  - Аналогичен `base_compaction_trace_threshold`.
* Значение по умолчанию: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* Тип: int32
* Описание: Количество задач compaction, параллельно выполняемых для одного диска HDD.
* Значение по умолчанию: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* Тип: int32
* Описание: Количество задач compaction, параллельно выполняемых для одного быстрого диска SSD.
* Значение по умолчанию: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* Тип: int32
* Описание: Количество раундов cumulative compaction на каждый раунд base compaction при создании задач compaction.
* Значение по умолчанию: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* Тип: int32
* Описание: Максимальное количество потоков в пуле cumulative compaction. Значение -1 означает один поток на диск.
* Значение по умолчанию: -1

#### `enable_segcompaction` {#enable_segcompaction}

* Тип: bool
* Описание: Включает segment compaction во время загрузки, чтобы избежать ошибки -238.
* Значение по умолчанию: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* Тип: int32
* Описание: Segment compaction запускается, когда количество сегментов превышает этот порог. Параметр также ограничивает максимальное количество исходных сегментов в одной задаче segment compaction.
* Значение по умолчанию: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* Тип: int32
* Описание: Максимально допустимое количество строк в одном исходном сегменте. Более крупные сегменты пропускаются.
* Значение по умолчанию: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* Тип: int64
* Описание: Максимально допустимый размер файла одного исходного сегмента. Более крупные сегменты пропускаются.
* Значение по умолчанию: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* Тип: int32
* Описание: Максимально допустимое общее количество строк в одной задаче segcompaction.
* Значение по умолчанию: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* Тип: int64
* Описание: Максимально допустимый общий размер файлов в одной задаче segcompaction.
* Значение по умолчанию: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* Тип: int32
* Описание: Размер глобального пула потоков segcompaction.
* Значение по умолчанию: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* Тип: bool
* Описание: Отключает журнал трассировки compaction.
  - Если установлено true, параметры `cumulative_compaction_trace_threshold` и `base_compaction_trace_threshold` не действуют, а ведение журнала отключено.
* Значение по умолчанию: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* Тип: int64
* Описание: Интервал выбора rowset для compaction в секундах.
* Значение по умолчанию: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* Описание: Минимальный интервал обновления информации о других репликах в секундах.
* Значение по умолчанию: 60 (с)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* Тип: int32
* Описание: Минимальный порог compaction score для запуска compaction холодных данных. Если compaction score холодных данных превышает этот порог, рассматривается возможность выполнения compaction. Изменение значения позволяет управлять частотой и интенсивностью compaction холодных данных в удалённом хранилище. Поддерживается начиная с версии 3.1.3.
* Значение по умолчанию: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* Тип: int32
* Описание: Количество потоков для compaction холодных данных. Параметр определяет степень параллелизма соответствующих задач. Увеличение значения позволяет одновременно выполнять больше задач compaction холодных данных, что может повысить пропускную способность, но также увеличивает потребление ресурсов.
* Значение по умолчанию: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* Тип: int32
* Описание: Интервал между проверками необходимости запуска compaction холодных данных в секундах. При меньшем интервале необходимость compaction проверяется чаще, что может ускорить очистку, но повышает потребление ресурсов.
* Значение по умолчанию: 1800 (секунд)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* Тип: bool
* Описание: Приостанавливает задачи compaction при высоком потреблении памяти процессом. Поддерживает динамическое изменение.
  - Если параметр включён, BE приостанавливает compaction при нехватке памяти, отдавая приоритет запросам и загрузкам.
  - Однако приостановка compaction затрудняет слияние tablet с высоким compaction score, усиливая накопление метаданных и потребление памяти, которые она должна была уменьшить. **Начиная с версии 4.0.8 значение по умолчанию изменено с `true` на `false`**, поэтому по умолчанию compaction больше не приостанавливается из-за высокого потребления памяти.
  - Установите `true`, чтобы вернуть прежнее поведение.
* Значение по умолчанию: false (до версии 4.0.8 было true)

### Загрузка {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* Тип: int32
* Описание: Тайм-аут запроса клиента CDC в миллисекундах. Поддерживает динамическую настройку. В версии 4.1.5 значение по умолчанию увеличено с `60000` до `120000`, чтобы допускать более длительные запросы CDC.
* Значение по умолчанию: 120000 (60000 до версии 4.1.5)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* Тип: bool
* Описание: Добавлен в версии 4.1.4. Блокирует новые записи в таблицу, если слишком много её MemTables на этом BE ожидают сброса. Используется вместе с параметром FE `enable_adaptive_random_bucket_load`, чтобы предотвращать накопление MemTables и рост потребления памяти при загрузках с адаптивным случайным распределением по bucket.
* Значение по умолчанию: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* Тип: int32
* Описание: Добавлен в версии 4.1.4. Максимальное количество MemTables одной таблицы, которые могут ожидать сброса на этом BE. При превышении порога новые записи блокируются, пока количество не станет меньше порога. Действует только при `enable_table_memtable_flush_backpressure = true`.
* Значение по умолчанию: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* Тип: int32
* Описание: Добавлен в версии 4.1.4. Максимальное количество файлов Group Commit WAL для одной таблицы; `0` означает отсутствие ограничения. Если повторное воспроизведение WAL постоянно завершается с ошибкой и количество WAL превышает этот порог, загрузки Group Commit в режиме `async_mode` для этой таблицы отклоняются с ошибкой `EXCEEDED_LIMIT`, сообщение которой выглядит как `Too many group commit async WALs for table ...`. Ограничение предотвращает неограниченное накопление WAL и заполнение диска.
* Значение по умолчанию: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* Тип: bool
* Описание: Включает запись сведений о Stream Load. По умолчанию false.
* Значение по умолчанию: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* Описание: Используется для mini load. Файл данных mini load удаляется по истечении этого времени.
* Значение по умолчанию: 4 (ч)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* Описание: Количество потоков загрузки для обработки задач с приоритетом HIGH.
* Значение по умолчанию: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* Описание: Количество потоков загрузки для обработки задач с приоритетом NORMAL.
* Значение по умолчанию: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* Описание: Включает функцию загрузки данных через одну реплику.
* Значение по умолчанию: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* Описание: Журнал ошибок загрузки удаляется по истечении этого времени.
* Значение по умолчанию: 48 (ч)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* Описание: Журналы ошибок загрузки, размер которых превышает это значение, обрезаются.
* Значение по умолчанию: 209715200 (байт)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* Описание: Верхний предел памяти, занимаемой всеми потоками загрузки на одном узле, в процентах. По умолчанию 50%.
  - Значения по умолчанию заданы достаточно большими, чтобы не снижать производительность загрузки при обновлении Doris. При необходимости пользователь должен настроить их в соответствии со своими условиями.
* Значение по умолчанию: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* Описание: Мягкое ограничение задаётся как доля лимита памяти для загрузки на одном узле. Например, если лимит памяти для всех задач загрузки составляет 20GB, мягкое ограничение по умолчанию равно 50% этого значения, то есть 10GB. Когда потребление памяти при загрузке превышает мягкое ограничение, для сброса выбирается задача с наибольшим потреблением памяти, чтобы освободить память. Значение по умолчанию — 50%.
* Значение по умолчанию: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* Тип: int32
* Описание: Эта настройка в основном используется для изменения тайм-аута brpc между master-репликой и slave-репликой при загрузке через одну реплику.
* Значение по умолчанию: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* Тип: int32
* Описание: Ограничивает количество сегментов в новом rowset, создаваемом при загрузке. При превышении порога загрузка завершается с ошибкой -238. Слишком большое количество сегментов приводит к высокому потреблению памяти при compaction и может вызвать ошибки OOM.
* Значение по умолчанию: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* Тип: int32
* Описание: Количество потоков сброса на каждый путь хранения, выделяемых для задач загрузки с высоким приоритетом.
* Значение по умолчанию: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* Тип: int32
* Описание: Количество кешируемых потребителей данных, используемых Routine Load.
* Значение по умолчанию: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* Тип: int32
* Описание: Используется для загрузки одного потока в несколько таблиц. Если размер полученного пакета сообщений Kafka превышает этот порог, запрашиваются планы для всех связанных таблиц.
* Значение по умолчанию: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* Тип: int32
* Описание: Используется для загрузки одного потока в несколько таблиц. Если при получении пакета сообщений Kafka количество таблиц, ожидающих план, превышает этот порог, запрашиваются планы для всех связанных таблиц. Параметр позволяет избежать одновременного запроса и выполнения слишком большого количества планов. Обработка небольших пакетов для нескольких таблиц во время загрузки снижает нагрузку на отдельный RPC и улучшает обработку данных в реальном времени.
* Значение по умолчанию: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* Тип: int32
* Описание: Эта настройка в основном используется для изменения количества рабочих HTTP-потоков скачивания сегментов при загрузке через одну реплику. При увеличении параллелизма загрузки параметр можно изменить, чтобы Slave-реплика своевременно синхронизировала файлы данных с Master-реплики. При необходимости следует также увеличить `webserver_num_workers` для повышения производительности ввода-вывода.
* Значение по умолчанию: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* Тип: int32
* Описание: Если тайм-аут задачи загрузки меньше этого порога, Doris считает её задачей с высоким приоритетом. Такие задачи используют отдельный пул потоков сброса.
* По умолчанию: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* Тип: int32
* Описание: Минимальный тайм-аут каждого RPC в задаче загрузки.
* По умолчанию: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* Тип: bool
* Описание: Если используемая версия Kafka ниже 0.10.0.0, следует установить false.
* По умолчанию: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* Описание: Если используемая версия Kafka ниже 0.10.0.0 и kafka_api_version_request имеет значение false, используется резервная версия, заданная в kafka_broker_version_fallback. Допустимые значения: 0.9.0.x, 0.8.x.y.
* По умолчанию: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* Описание: Максимальное количество потребителей в группе потребителей данных. Используется для Routine Load.
* По умолчанию: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* Тип: int64
* Описание: Ограничивает максимальный объём данных CSV, допустимый в одной операции Stream Load.
  - Stream Load обычно подходит для загрузки объёма данных менее нескольких GB и не предназначен для слишком больших объёмов.
* Значение по умолчанию: 10240 (MB)
* Динамическое изменение: да

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* Тип: int64
* Описание: Ограничивает максимальный объём данных JSON, допустимый в одной операции Stream Load. Единица измерения — MB.
  - Некоторые форматы данных, например JSON, невозможно разделить на части. Doris должен прочитать все данные в память, прежде чем начать разбор. Поэтому этот параметр ограничивает максимальный объём данных, загружаемых одной операцией Stream Load.
* Значение по умолчанию: 100
* Динамическое изменение: да

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* Описание: При загрузке данных поток опроса постоянно отправляет данные соответствующему BE из узла sink координатора Coordinator. Этот поток проверяет наличие данных для отправки каждые `olap_table_sink_send_interval_microseconds` микросекунд.
* Значение по умолчанию: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* Описание: При загрузке данных в таблицу с включённым автоматическим секционированием интервал `olap_table_sink_send_interval_microseconds` слишком велик. В этом случае фактический интервал умножается на этот коэффициент.
* Значение по умолчанию: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* Тип: bool
* Описание: Включает перенаправление Stream Load через BE для Group Commit в режиме с разделением вычислений и хранения. Добавлен в версии 4.0.8 ветки Doris 4.0 и в версии 4.1.4 ветки 4.1. Поддерживает динамическое изменение.
  - Эта возможность решает проблему, при которой балансировщик случайным образом распределяет запросы Group Commit для одной таблицы между разными BE, препятствуя эффективному объединению в пакеты: после включения BE перенаправляет запросы на один целевой BE.
  - **Начиная с версии 4.0.8 доступ к конечной точке BE `/api/{db}/{table}/_stream_load_forward` управляется этим параметром: при значении `false` запросы возвращают `403 Forbidden` с сообщением `Stream load forward is disabled`; при значении `true` запросы также должны проходить аутентификацию и требуют глобальной привилегии `LOAD`.**
  - В развёртываниях, использующих это перенаправление, необходимо установить `true` как на FE, так и на BE (см. одноимённый параметр FE в разделе [Конфигурация FE](./fe-config)).
* Значение по умолчанию: false

### Потоки {#thread}

#### `delete_worker_count` {#delete_worker_count}

* Описание: Количество потоков, выполняющих задачи удаления данных.
* Значение по умолчанию: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* Описание: Количество потоков для очистки транзакций.
* Значение по умолчанию: 1

#### `clone_worker_count` {#clone_worker_count}

* Описание: Количество потоков для выполнения задач клонирования.
* Значение по умолчанию: 3

#### `be_service_threads` {#be_service_threads}

* Тип: int32
* Описание: Количество потоков выполнения службы сервера thrift на BE. Определяет количество потоков, доступных для выполнения запросов FE.
* Значение по умолчанию: 64

#### `download_worker_count` {#download_worker_count}

* Описание: Количество потоков скачивания.
* Значение по умолчанию: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* Описание: Количество потоков для удаления tablet.
* Значение по умолчанию: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* Описание: Количество потоков сброса таблицы в памяти для каждого хранилища.
* Значение по умолчанию: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* Описание: Количество потоков публикации версий.
* Значение по умолчанию: 8

#### `upload_worker_count` {#upload_worker_count}

* Описание: Максимальное количество потоков для отправки файлов.
* Значение по умолчанию: 1

#### `webserver_num_workers` {#webserver_num_workers}

* Описание: Количество рабочих потоков веб-сервера по умолчанию.
* Значение по умолчанию: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* Тип: int32
* Описание: Количество потоков в пуле SendBatch. В задачах отправки данных NodeChannels операция SendBatch каждого NodeChannel передаётся в пул как потоковая задача для последующего выполнения. Параметр определяет размер пула потоков SendBatch.
* Значение по умолчанию: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* Тип: int32
* Описание: Длина очереди пула потоков SendBatch. В задачах отправки данных NodeChannels операция SendBatch каждого NodeChannel передаётся в пул как потоковая задача и ожидает выполнения. Если количество переданных задач превышает длину очереди пула, передача последующих задач блокируется до появления свободного места в очереди.
* Значение по умолчанию: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* Описание: Количество потоков создания снимков.
* Значение по умолчанию: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* Описание: Количество потоков освобождения снимков.
* Значение по умолчанию: 5

### Память {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* Тип: bool
* Описание: Включает использование huge pages в Linux.
* Значение по умолчанию: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* Описание: Максимальное количество пакетов в кеше внешнего сканирования. Кеш вмещает max_memory_cache_batch_count * batch_size строк. Значение по умолчанию — 20, а значение batch_size по умолчанию — 1024, поэтому кешируется 20 * 1024 строк.
* Значение по умолчанию: 20

#### `memory_max_alignment` {#memory_max_alignment}

* Описание: Максимальное выравнивание памяти.
* Значение по умолчанию: 16

#### `mmap_buffers` {#mmap_buffers}

* Описание: Включает использование mmap для выделения памяти.
* Значение по умолчанию: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* Описание: Интервал между итерациями обновления memtable flush mgr в миллисекундах.
* Значение по умолчанию: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* Тип: int32
* Описание: Если количество строк на странице меньше этого значения, zonemap не создаётся, чтобы уменьшить увеличение объёма данных.
* Значение по умолчанию: 20

#### `memory_mode` {#memory_mode}

* Тип: string
* Описание: Управляет GC в tcmalloc. В режиме performance Doris освобождает память кеша tcmalloc, когда потребление >= 90% * mem_limit; в остальных режимах Doris освобождает её, когда потребление >= 50% * mem_limit.
* Значение по умолчанию: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* Тип: int64
* Описание: Максимальная нижняя граница системного показателя `/proc/meminfo/MemAvailable`, в байтах. По умолчанию 1.6G; фактическая нижняя граница=min(1.6G, MemTotal * 10%). Это позволяет избежать избыточного резервирования памяти на серверах с объёмом памяти более 16G. Увеличение максимума резервирует больше памяти для Full GC на серверах с объёмом памяти более 16G. Уменьшение максимума позволяет использовать как можно больше памяти.
* Значение по умолчанию: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* Описание: Максимальный объём памяти, допустимый для одной задачи изменения схемы.
* Значение по умолчанию: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* Тип: int32
* Описание: Минимальный объём для вызова TCMalloc Hook при consume/release в MemTracker. Объёмы меньше этого значения накапливаются, чтобы избежать частых вызовов consume/release в MemTracker. Уменьшение значения повышает частоту consume/release. Увеличение значения снижает точность статистики MemTracker. Теоретически отклонение статистики MemTracker от фактического значения = ( mem_tracker_consume_min_size_bytes * количество потоков BE, в которых используется MemTracker).
* Значение по умолчанию: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* Описание: Минимальный размер буфера чтения.
* Значение по умолчанию: 1024 (байт)

#### `write_buffer_size` {#write_buffer_size}

* Описание: Размер буфера перед сбросом.
  - Загружаемые данные сначала записываются в блок памяти на BE и сбрасываются на диск только при достижении порога. Размер по умолчанию — 200MB. Слишком низкий порог может привести к появлению большого количества мелких файлов на BE. Для уменьшения количества файлов порог можно увеличить. Однако слишком высокий порог может вызывать тайм-ауты RPC.
* Значение по умолчанию: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* Тип: int32
* Описание: Размер кеша, используемого при чтении файлов из HDFS или объектного хранилища.
  - Увеличение значения может сократить количество вызовов чтения удалённых данных, но повышает расход памяти.
* Значение по умолчанию: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* Тип: string
* Описание: Тип кеширования файлов. `whole_file_cache`: скачивается весь файл сегмента; `sub_file_cache`: файл сегмента делится на несколько файлов по размеру. При значении "" кеширование отключено. Задайте этот параметр, если требуется кеширование.
* Значение по умолчанию: ""

#### `path_gc_check` {#path_gc_check}

* Тип：bool
* Описание: Включает проверку потока сканирования данных для сборки мусора.
* По умолчанию：true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* Описание: Интервал проверки потока сканирования данных для сборки мусора.
* По умолчанию：86400 (с)

#### `path_gc_check_step` {#path_gc_check_step}

* По умолчанию：1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* По умолчанию：10 (мс)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* Описание: Период запуска потока GC контекстов. Примечание: единица измерения — минуты, значение по умолчанию — 5 минут.
* По умолчанию：5

### Хранение {#storage}

#### `enable_kuromoji_analyzer` {#enable_kuromoji_analyzer}

* Тип: bool
* Описание: Включает анализатор kuromoji для японского языка в инвертированном индексе. Поддерживается начиная с Doris 5.0.0.
* Значение по умолчанию: false

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* Тип: bool
* Описание: Поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При значении `true` инвертированные индексы по вложенным путям VARIANT не сохраняют Norms независимо от свойства индекса `norms`. Это уменьшает объём индексов для множества вложенных путей, однако такие индексы больше не поддерживают вычисления BM25 `score()`, для которых требуются Norms. По умолчанию Norms сохраняются. См. [Оценка релевантности](../../table-design/index/inverted-index/scoring.md).
* Значение по умолчанию: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* Тип: int32
* Описание: Задаёт количество строк данных в одном RowBlock.
* Значение по умолчанию: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* Тип: bool
* Описание: Отключает использование page cache для кеширования индексов. Параметр действует только для формата хранения BETA. Обычно рекомендуется false.
* Значение по умолчанию: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* Описание: Интервал проверки состояния диска.
* Значение по умолчанию: 5 (с)

#### `max_free_io_buffers` {#max_free_io_buffers}

* Описание: Максимальное количество буферов, резервируемых IoMgr для каждого размера буфера ввода-вывода. Размеры буферов варьируются от 1024B до 8MB, суммарный объём составляет примерно до 2GB.
* Значение по умолчанию: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* Описание: Максимальный интервал очистки мусора на диске.
* Значение по умолчанию: 3600 (с)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* Тип: int32
* Описание: Допустимая доля повреждённых дисков для движка хранения в процентах. Если доля повреждённых дисков превышает этот порог, BE автоматически завершает работу.
* Значение по умолчанию: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* Описание: Минимальный интервал между очистками мусора на диске.
* Значение по умолчанию: 180 (с)

#### `pprof_profile_dir` {#pprof_profile_dir}

* Описание: Каталог сохранения профилей pprof.
* Значение по умолчанию: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* Описание: Каталог хранения файлов, скачанных SmallFileMgr.
* Значение по умолчанию: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* Описание: Каталог функций UDF.
* Значение по умолчанию: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* Описание: Минимальный объём свободного места в каталоге данных в байтах.
* Значение по умолчанию: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* Описание: Параметры storage_flood_stage_usage_percent и storage_flood_stage_left_capacity_bytes ограничивают максимальное использование ёмкости каталога данных.
* Значение по умолчанию: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* Описание: Количество потоков клонирования.
* Значение по умолчанию: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* Описание: Размер кеша страниц хранения.
* Значение по умолчанию: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* Описание: Количество шардов StoragePageCache. Значение должно быть степенью двойки. Для уменьшения конкуренции за блокировки рекомендуется значение, близкое к количеству ядер BE.
* Значение по умолчанию: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* Тип: int32
* Описание: Доля кеша страниц индексов в общем кеше страниц хранения, в процентах. Диапазон значений: [0, 100].
* Значение по умолчанию: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* Тип: int32
* Описание: Максимальное количество записей в кеше сегментов, где ключом служит идентификатор rowset. Значение -1 используется для обратной совместимости и соответствует fd_number * 2/5.
* Значение по умолчанию: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* Тип: bool
* Описание: Включает строгую проверку несовместимого старого формата.
* Значение по умолчанию: true
* Динамическое изменение: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* Описание: Включает sync в движке хранения для сохранения данных на диск.
* Значение по умолчанию: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* Описание: Максимальное время хранения неподтверждённых данных движком хранения.
* Значение по умолчанию: 1800 (с)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* Тип: boolean
* Описание: Определяет, следует ли удалять устаревший объединённый rowset, если он не может образовать согласованный путь версий.
  - Путь версий устаревших объединённых rowset удаляется через полчаса. В нештатных ситуациях удаление этих версий может привести к невозможности построить согласованный путь для запроса. При значении false выполняется строгая проверка: программа сообщает об ошибке и завершает работу. При значении true программа продолжает работать, игнорируя ошибку. Обычно это не влияет на запросы; ошибка -230 возникает только тогда, когда FE запрашивает объединённую версию.
* Значение по умолчанию: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* Описание: Количество рабочих потоков BE для создания tablet.
* Значение по умолчанию: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* Описание: Количество рабочих потоков для вычисления контрольной суммы tablet.
* Значение по умолчанию: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* Тип: int
* Описание: Ограничивает количество версий одного tablet. Предотвращает накопление большого количества версий из-за слишком частой загрузки или несвоевременной compaction. При превышении ограничения задача загрузки отклоняется.
* Значение по умолчанию: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* Описание: Количество сегментов tablet_map_lock. Значение задаётся как 2^n, где n=0,1,2,3,4. Используется для повышения эффективности управления tablet.
* Значение по умолчанию: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* Описание: Интервал опроса потока TabletMeta Checkpoint.
* Значение по умолчанию: 600 (с)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* Описание: Минимальное количество Rowsets для сохранения TabletMeta Checkpoints.
* Значение по умолчанию: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* Тип: int64
* Описание: Управляет сроком хранения объединённых версий rowset перед очисткой. Если разность между текущим временем now() и временем создания самого нового rowset в пути версий превышает tablet_rowset_stale_sweep_time_sec, текущий путь очищается, а объединённые rowset удаляются. Единица измерения — секунды.
  - При слишком частой записи FE может не успеть запросить объединённую версию, что приводит к ошибке запроса -230. Увеличение значения позволяет избежать этой проблемы.
* Значение по умолчанию: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* Описание: Интервал обновления кеша состояния tablet.
    - Тайм-аут RPC для отправки Batch (1024 строки) при загрузке. По умолчанию 60 секунд. Поскольку этот RPC может включать запись нескольких пакетов в память, их запись может привести к тайм-ауту RPC. Значение можно изменить, чтобы уменьшить количество ошибок тайм-аута, например send batch fail. Кроме того, при увеличении write_buffer_size необходимо увеличить и этот параметр.
* Значение по умолчанию: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* Тип: bool
* Описание: Позволяет игнорировать ошибку brpc '[E1011]The server is overcrowded' при записи данных.
* Значение по умолчанию: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* Описание: Время жизни TabletsChannel. Если за это время канал не получает данных, он удаляется.
* Значение по умолчанию: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* Описание: Количество потоков, выполняющих изменения схемы.
* Значение по умолчанию: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* Описание: Количество потоков, выполняющих изменения индекса.
* Значение по умолчанию: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* Тип: bool
* Описание: Определяет, следует ли игнорировать ошибки и продолжать запуск BE при сбое загрузки tablet.
* Значение по умолчанию: false

При запуске BE для каждого каталога данных создаётся отдельный поток, загружающий метаданные заголовков tablet. По умолчанию, если из какого-либо каталога данных не удаётся загрузить tablet, запуск прерывается. При этом в журнале ` be The following error message is seen in the INFO ` появляется следующее сообщение:

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

Оно указывает, сколько tablet не удалось загрузить из каталога данных. В журнале также содержатся подробные сведения об этих tablet. Для выяснения причины ошибки требуется вмешательство администратора. После устранения причины обычно доступны два способа восстановления:
  - Если информацию о tablet восстановить невозможно, но другие реплики исправны, повреждённый tablet можно удалить с помощью инструмента `meta_tool`.
  - Установите `ignore_load_tablet_failure` в true: BE проигнорирует неисправные tablet и запустится в обычном режиме.

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* Описание: Интервал отправки агентом отчётов о состоянии дисков в FE.
* Значение по умолчанию: 60 (с)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* Описание: Время отмены буфера результатов.
* Значение по умолчанию: 300 (с)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* Описание: Интервал очистки файлов снимков.
* Значение по умолчанию:172800 (48 часов)

### Журналы {#log}

#### `sys_log_dir` {#sys_log_dir}

* Тип: string
* Описание: Каталог хранения журналов BE.
* Значение по умолчанию: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* Описание: Уровень журналирования: INFO < WARNING < ERROR < FATAL.
* Значение по умолчанию: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* Описание: Размер ротации журнала: новый файл создаётся при достижении 1G.
* Значение по умолчанию: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* Описание: Количество сохраняемых файлов журнала.
* Значение по умолчанию: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* Описание: Уровень детализации журнала, управляющий выводом записей через VLOG в коде.
* Значение по умолчанию: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* Описание: Модули для вывода журнала. Например, значение olap включает вывод только для модуля olap.
* Значение по умолчанию: пусто

#### `aws_log_level` {#aws_log_level}

* Тип: int32
* Описание: Уровень журналирования AWS SDK:
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

* Описание: Стратегия сброса журнала. По умолчанию записи сохраняются в памяти.
* Значение по умолчанию: пусто

### Прочее {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* Тип: bool
* Описание: Добавлен в версии 4.1.4. Включает проверку входных буферов Arrow перед преобразованием данных Arrow во внутренние столбцы Doris. Проверка предотвращает аварийное завершение BE из-за некорректных данных Arrow, но требует небольших дополнительных затрат.
* Значение по умолчанию: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* Описание: Интервал отправки агентом отчётов о таблице OLAP в FE.
* Значение по умолчанию: 60 (с)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* Описание: Интервал отправки агентом сигнатуры задачи в FE.
* Значение по умолчанию: 10 (с)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* Описание: Период обновления счётчиков скорости и счётчиков выборки.
* Значение по умолчанию: 500 (мс)

#### `enable_metric_calculator` {#enable_metric_calculator}

* Описание: При значении true запускается вычислитель метрик для сбора показателей BE; при значении false он не запускается.
* Значение по умолчанию: true

#### `enable_system_metrics` {#enable_system_metrics}

* Описание: Позволяет включать и отключать системные метрики.
* Значение по умолчанию: true

#### `enable_token_check` {#enable_token_check}

* Описание: Используется для совместимости с будущими версиями. Впоследствии будет удалён.
* Значение по умолчанию: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* Описание: Максимальное количество txn для каждого txn_partition_map в диспетчере транзакций. Ограничение защищает диспетчер от хранения слишком большого количества txn.
* Значение по умолчанию: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* Описание: Ограничение максимальной скорости скачивания.
* Значение по умолчанию: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* Описание: Ограничение времени скачивания.
* Значение по умолчанию: 300 (с)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* Описание: Минимальная скорость скачивания.
* Значение по умолчанию: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* Описание: Включает пакетное скачивание файлов. Рекомендуется включать при использовании binlog.
* Значение по умолчанию: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* Описание: Частота повышения приоритета оставшихся задач в BlockingPriorityQueue.
* Значение по умолчанию: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* Описание: Каталоги по умолчанию для размещения драйверов JDBC.
* Значение по умолчанию: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* Описание: Включает использование simdjson для разбора JSON при Stream Load.
* Значение по умолчанию: true

#### `user_files_secure_path` {#user_files_secure_path}

* Описание: Каталог хранения файлов, запрашиваемых табличными функциями `local`.
* Значение по умолчанию: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* Описание: Размер пакета для отправки данных потоковым клиентом brpc.
* Значение по умолчанию: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* Описание: При облачном развёртывании BE могут часто добавляться в кластер и удаляться из него. Если на завершающем работу BE выполняется фрагмент запроса, запрос пользователя завершится с ошибкой. Можно использовать stop_be.sh --grace: тогда BE будет ожидать завершения всех выполняющихся запросов, чтобы избежать их сбоя. Если время ожидания превысит ограничение, BE немедленно завершит работу. В течение этого периода FE не отправляет новые запросы в BE и ожидает завершения всех выполняющихся запросов.
* Значение по умолчанию: 120

#### `enable_java_support` {#enable_java_support}

* Описание: Включает использование java-jni в BE. При включении разрешаются взаимные вызовы между c++ и java. В настоящее время поддерживаются hudi, java-udf, jdbc, max-compute, paimon, preload, avro.
* Значение по умолчанию: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Каталог `WAL` для Group Commit.
* По умолчанию: каталог с именем `wal` создаётся в каждом каталоге, указанном в `storage_root_path`. Примеры настройки:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### Режим с разделением вычислений и хранения {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* По умолчанию: ""

* Описание: Режим работы BE. Значение `cloud` обозначает режим с разделением хранения и вычислений.

#### `meta_service_endpoint` {#meta_service_endpoint}

По умолчанию: ""

* Описание: Конечные точки meta service задаются в формате 'host1:port,host2:port'. Обычно FE передаёт это значение в BE через heartbeat, поэтому задавать его не требуется.

#### `enable_file_cache` {#enable_file_cache}

По умолчанию: true (включён по умолчанию начиная с версии 4.1.5; ранее false; в режиме с разделением вычислений и хранения всегда включён).

* Описание: Включает использование файлового кеша. Изменения требуют перезапуска BE. Переменная сеанса `enable_file_cache` также должна быть включена. В версии 4.1.5 значения по умолчанию как для параметра BE, так и для переменной сеанса изменены на `true`; отдельно проверьте явно заданные настройки и сохранённые глобальные переменные.

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* Тип: bool
* Описание: Поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. Оценивает ограничение частоты RPC от BE к Meta Service на уровне хоста, не задерживая запросы. Не зависит от `enable_ms_rpc_host_level_rate_limit`: оценка выполняется, даже если тот параметр равен `false`; когда оба параметра равны `true`, приоритет имеет dry-run. Чтобы применять ограничение частоты, включите `enable_ms_rpc_host_level_rate_limit` и отключите этот параметр.
* Значение по умолчанию: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* Тип: bool
* Описание: Поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. Оценивает адаптивное ограничение частоты на уровне таблицы, запускаемое ответами Meta Service `MS_BUSY`, не задерживая запросы. Не зависит от `enable_ms_backpressure_handling`; когда оба параметра равны `true`, приоритет имеет dry-run. Чтобы применять ограничение частоты на уровне таблицы, включите `enable_ms_backpressure_handling` и отключите этот параметр.
* Значение по умолчанию: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* Тип: int32
* Описание: Поддерживается начиная с версии 4.2.0. Поддерживает динамическую настройку. Количество последовательных ошибок соединения или RPC для адреса peer, при котором срабатывает его circuit breaker. Эффективное минимальное значение — `1`. Это состояние на уровне адреса совместно используется операциями peer read для разных tablet, чтобы избежать повторных подключений к недоступному узлу.
* Значение по умолчанию: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* Тип: int32
* Описание: Поддерживается начиная с версии 4.2.0. Поддерживает динамическую настройку. Время в секундах, в течение которого сработавший circuit breaker отклоняет чтения по этому адресу peer. Отрицательные значения трактуются как `0`. По истечении этого времени разрешается одна проверка восстановления.
* Значение по умолчанию: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* Тип: int64
* Описание: Максимальный размер сериализованного Delete Bitmap V2, сохраняемого непосредственно в FDB в режиме с разделением вычислений и хранения, в байтах. Поддерживает динамическую настройку. Значения, превышающие неотрицательный порог, сохраняются в файле объектного хранилища; отрицательное значение отключает такой перенос по размеру. В версии 4.1.5 значение по умолчанию увеличено с `1024` до `89000`, чтобы оставить место для дополнительных полей сообщения в блоке размером 90000 байт.
* Значение по умолчанию: 89000 (1024 до версии 4.1.5)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* Тип: bool
* Описание: Поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При замене агрегированных исторических Delete Bitmaps в режиме с разделением вычислений и хранения удаляет записи конечной версии по ключу. Установите `false`, чтобы использовать удаление по диапазону. Параметр меняет только способ удаления записей существующим механизмом очистки и не включает дополнительную задачу очистки.
* Значение по умолчанию: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* Тип: bool
* Описание: Поддерживается начиная с версии 4.1.5. Поддерживает динамическую настройку. При очистке исторических Delete Bitmaps внутри агрегированного диапазона в режиме с разделением вычислений и хранения удаляет записи по ключу от начальной версии включительно до конечной версии, не включая её. Установите `false`, чтобы использовать удаление по диапазону. Существующие переключатели и условия очистки продолжают действовать.
* Значение по умолчанию: true

#### `file_cache_path` {#file_cache_path}

По умолчанию: [{"path":"${DORIS_HOME}/file_cache"}]
* Описание: Пути на дисках и другие параметры файлового кеша в виде массива с отдельной записью для каждого диска. Параметр `path` задаёт путь на диске, а `total_size` ограничивает размер кеша; при -1 или 0 используется всё дисковое пространство.
* Формат: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* Тип: bool
* Описание: Добавлен в версии 4.1.4. Включает асинхронную запись в файловый кеш. При включении запись удалённых данных в файловый кеш передаётся фоновому пулу потоков и не блокирует чтение, что снижает задержку холодного чтения.
* Значение по умолчанию: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* Тип: int32
* Описание: Добавлен в версии 4.1.4. Количество потоков записи на каждый диск кеша при асинхронной записи в файловый кеш. Действует только при `enable_async_file_cache_write = true`.
* Значение по умолчанию: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* Тип: int64
* Описание: Добавлен в версии 4.1.4. Максимальный общий объём данных, ожидающих асинхронной записи в файловый кеш, в байтах. Запросы записи сверх этого ограничения отбрасываются: это не влияет на корректность запросов, но данные не попадают в кеш. Значение `-1` означает отсутствие ограничения.
* Значение по умолчанию: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* Тип: bool
* Описание: Добавлен в версии 4.1.4. Включает одновременную запись данных в локальный файловый кеш при записи в объектное хранилище, чтобы только что записанные данные можно было читать непосредственно из кеша.
* Значение по умолчанию: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* Тип: bool
* Описание: Добавлен в версии 4.1.4. Ограничивает запись в файловый кеш только файлами индексов. При включении индексы получают приоритет при размещении в кеше, если его объём ограничен.
* Значение по умолчанию: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* Тип: bool
* Описание: Основной переключатель peer cache read. При включении, если блок отсутствует в локальном File Cache, сначала выполняется попытка прочитать его из File Cache другого BE в той же или другой compute group. Объектное хранилище используется только в том случае, если блока нет ни на одном BE. Этот переключатель совместно управляет чтениями внутри группы и между группами; отдельно отключить чтения между группами нельзя. Peer read между группами поддерживается начиная с версии 4.2.0, в которой также удалён параметр `cache_read_from_peer_expired_seconds`. См. [Чтение кеша с других BE](../../compute-storage-decoupled/file-cache/file-cache-peer-read).
* Значение по умолчанию: false (при необходимости включите явно)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* Тип: bool
* Описание: Добавлен в версии 4.2.0. Включает конкурентное чтение с peer и из объектного хранилища с использованием первого полученного результата. При отключении чтения выполняются последовательно: кандидаты peer проверяются по очереди, а обращение к объектному хранилищу происходит только после неудачи всех попыток.
* Значение по умолчанию: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Время в миллисекундах, предоставляемое peer read до запуска конкурирующего чтения. Если peer отвечает за это время, запрос к объектному хранилищу не отправляется; `0` запускает оба чтения одновременно.
* Значение по умолчанию: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Максимальное количество одновременных конкурентных чтений с peer и из объектного хранилища на одном BE. При превышении ограничения промахи кеша обрабатываются последовательным чтением.
* Значение по умолчанию: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* Тип: string
* Описание: Добавлен в версии 4.2.0. Задаётся на BE, инициирующем чтение. Идентификатор compute group, отвечающей за заполнение кеша между группами: значение `compute_group_id` в столбце `Tag` команды `SHOW BACKENDS`, а не имя compute group. Если выбранный кандидат peer принадлежит этой compute group и не содержит нужного блока, запрос предписывает ему получить блок из объектного хранилища и записать в собственный File Cache. Пустое значение означает, что заполнение не используется.
* Значение по умолчанию: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* Тип: bool
* Описание: Добавлен в версии 4.2.0. Задаётся на BE, обслуживающем кеш. Разрешает принимать запросы peer read с флагом заполнения. При отключении для блоков, отсутствующих в локальном кеше, возвращается ответ «не найдено», и запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Максимальное время ожидания одного заполнения на обслуживающей стороне в миллисекундах. При тайм-ауте запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Максимальное количество одновременных заполнений на обслуживающей стороне. Запросы заполнения сверх ограничения отклоняются, и запрашивающий BE обращается к объектному хранилищу.
* Значение по умолчанию: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Количество последовательных ошибок RPC, после которого кандидат peer удаляется из списка кандидатов.
* Значение по умолчанию: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Количество последовательных чтений, при которых нужный блок отсутствовал у всех кандидатов peer, после которого tablet переходит в период ожидания. В течение этого периода чтения направляются сразу в объектное хранилище.
* Значение по умолчанию: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* Тип: int64
* Описание: Добавлен в версии 4.2.0. Длительность периода ожидания для peer read в секундах.
* Значение по умолчанию: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* Тип: int64
* Описание: Добавлен в версии 4.2.0. Срок действия записей кандидатов peer в секундах с момента последнего использования. Записи с истёкшим сроком удаляются из памяти и повторно запрашиваются у FE при следующем промахе кеша.
* Значение по умолчанию: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* Тип: int64
* Описание: Добавлен в версии 4.2.0. Интервал фоновой задачи, удаляющей записи кандидатов peer с истёкшим сроком действия, в секундах.
* Значение по умолчанию: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Максимальное время ожидания запроса peer read в очереди обработки на обслуживающей стороне в миллисекундах. Запросы, ожидающие дольше, отклоняются, чтобы запрашивающий BE мог быстро обратиться к объектному хранилищу.
* Значение по умолчанию: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Размер пула потоков, обрабатывающего запросы peer read на обслуживающей стороне. Пул изолирован от пула потоков тяжёлых RPC, например загрузок. Значение `-1` означает `max(64, 2 × CPU cores)`. Не поддерживает динамическое изменение.
* Значение по умолчанию: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* Тип: int32
* Описание: Добавлен в версии 4.2.0. Длина очереди пула потоков peer read на обслуживающей стороне. Значение `-1` означает `max(4096, 128 × CPU cores)`. Не поддерживает динамическое изменение.
* Значение по умолчанию: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* Тип: int32
* Описание: Добавлены в версии 4.2.0. Минимальное / максимальное количество потоков в пуле, выполняющем чтение из объектного хранилища на запрашивающей стороне при конкурентном чтении с peer и из объектного хранилища. Не поддерживают динамическое изменение.
* Значение по умолчанию: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* Тип: int64
* Описание: Добавлены в версии 4.1.4. Ограничение QPS для запросов GET / PUT к объектному хранилищу в расчёте на ядро CPU. Отрицательное значение отключает этот режим и возвращает прежнюю настройку абсолютного количества токенов; `0` означает отсутствие ограничения QPS.
* Значение по умолчанию: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* Тип: int64
* Описание: Добавлены в версии 4.1.4. Жёсткий верхний предел QPS для GET / PUT, вычисленного по количеству ядер CPU. Значение, меньшее или равное `0`, означает отсутствие верхнего предела.
* Значение по умолчанию: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* Тип: int64
* Описание: Добавлены в версии 4.1.4. Ограничение пропускной способности GET / PUT объектного хранилища в расчёте на ядро CPU, в байтах в секунду на ядро. Значение, меньшее или равное `0`, означает отсутствие ограничения пропускной способности.
* Значение по умолчанию: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* Тип: int64
* Описание: Добавлены в версии 4.1.4. Жёсткий верхний предел пропускной способности GET / PUT, вычисленной по количеству ядер CPU, в байтах в секунду. Значение, меньшее или равное `0`, означает отсутствие верхнего предела.
* Значение по умолчанию: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* Тип: int32
* Описание: Добавлен в версии 4.1.4. Количество ядер CPU, используемое для вычисления приведённых выше ограничений. Значение, меньшее или равное `0`, включает автоматическое определение количества ядер сервера.
* Значение по умолчанию: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* Тип: int64
* Описание: Добавлен в версии 4.1.4. Минимальный интервал между записями в журнал при срабатывании ограничения частоты обращений к объектному хранилищу, в миллисекундах.
* Значение по умолчанию: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* Тип: int32
* Описание: Добавлен в версии 4.1.4. Количество шардов хранилища файлового кеша в памяти. Используется для уменьшения конкуренции за блокировки при параллельном доступе.
* Значение по умолчанию: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* Тип: int
* Описание: Ограничивает количество версий одного tablet при использовании политики time-series compaction. Предотвращает накопление большого количества версий из-за слишком частой загрузки или несвоевременной compaction. При превышении ограничения задача загрузки отклоняется.
* Значение по умолчанию: 20000
