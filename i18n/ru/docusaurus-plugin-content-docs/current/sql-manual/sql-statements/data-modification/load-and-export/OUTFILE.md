---
{
    "title": "OUTFILE",
    "language": "ru",
    "description": "Команда SELECT INTO OUTFILE используется для экспорта результатов запроса в файлы. В настоящее время поддерживается экспорт в удалённые хранилища, такие как HDFS, S3, BOS,"
}
---

## Описание {#description}

Команда `SELECT INTO OUTFILE` используется для экспорта результатов запроса в файлы. В настоящее время поддерживается экспорт в удалённые хранилища, такие как HDFS, S3, BOS, COS (Tencent Cloud), через процесс Broker, по протоколу S3 или протоколу HDFS.

## Синтаксис: {#syntax}

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## Обязательные параметры {#required-parameters}

**1. `<query_stmt>`**   

Запрос должен быть корректным SQL-запросом. См. [документацию по запросам](../../data-query/SELECT.md).

**2. `<file_path>`**

Путь для хранения файлов и префикс имени файла. Указывает путь для хранения файлов и префикс их имён. Например, `hdfs://path/to/my_file_`.  
Итоговое имя файла будет состоять из `my_file_`, порядкового номера файла и расширения формата файла. Нумерация файлов начинается с 0, а их количество зависит от разбиения результата на файлы. Например:  
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

Можно также опустить префикс имени файла и указать только каталог, например `hdfs://path/to/`

## Необязательные параметры {#optional-parameters}

**1. `<format_as>`**

   Указывает формат экспорта. В настоящее время поддерживаются следующие форматы:
   - `CSV` (по умолчанию)
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   Примечание: PARQUET, CSV_WITH_NAMES, CSV_WITH_NAMES_AND_TYPES и ORC поддерживаются начиная с версии 1.2.

**2. `<properties>`**  

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  

В настоящее время поддерживается экспорт через процесс Broker или по протоколу S3/HDFS.

**Свойства экспортируемого файла**
- `column_separator`: разделитель столбцов, используется только для форматов CSV. Начиная с версии 1.2 поддерживаются многобайтовые разделители, например: "\\x01", "abc".
- `line_delimiter`: разделитель строк, используется только для форматов CSV. Начиная с версии 1.2 поддерживаются многобайтовые разделители, например: "\\x01", "abc".
- `max_file_size`: ограничение размера отдельного файла. Если результат превышает это значение, он разбивается на несколько файлов. Диапазон значений `max_file_size`: [5MB, 2GB], значение по умолчанию: `1GB`. (При экспорте в формат ORC фактический размер файлов после разбиения будет кратен 64MB. Например, если указано `max_file_size = 5MB`, разбиение фактически выполняется по 64 MB; если указано `max_file_size = 65MB`, разбиение фактически выполняется по 128 MB.)
- `delete_existing_files`: значение по умолчанию: `false`. Если задано `true`, сначала удаляются все файлы в каталоге, указанном в `file_path`, затем данные экспортируются в этот каталог. Например: "file_path" = "/user/tmp" удалит все файлы и каталоги в "/user/"; "file_path" = "/user/tmp/" удалит все файлы и каталоги в "/user/tmp/".
- `file_suffix`: указывает расширение экспортируемого файла. Если этот параметр не задан, используется расширение по умолчанию для выбранного формата файла.
- `compress_type`: при экспорте в формат Parquet / ORC можно указать метод сжатия файла Parquet / ORC. Для формата Parquet доступны методы сжатия SNAPPY, GZIP, BROTLI, ZSTD, LZ4 и PLAIN, значение по умолчанию: SNAPPY. Для формата ORC доступны методы сжатия PLAIN, SNAPPY, ZLIB и ZSTD, значение по умолчанию: ZLIB. Этот параметр поддерживается начиная с версии 2.1.5. (PLAIN означает отсутствие сжатия.) Начиная с версии 3.1.1 можно указывать алгоритмы сжатия для формата CSV. В настоящее время поддерживаются "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd".

**Свойства Broker**  _(необходимо добавить префикс `broker.`)_  
- `broker.name: broker`: имя
- `broker.hadoop.security.authentication`: указывает метод аутентификации kerberos
- `broker.kerberos_principal`: указывает principal kerberos
- `broker.kerberos_keytab`: указывает путь к файлу keytab kerberos. Это должен быть абсолютный путь к файлу на сервере, где запущен процесс Broker. Файл должен быть доступен процессу Broker

**Свойства HDFS**
- `fs.defaultFS`: адрес и порт namenode
- `hadoop.username`: имя пользователя hdfs
- `dfs.nameservices`: имя службы имён, соответствующее hdfs-site.xml
- `dfs.ha.namenodes.[nameservice ID]`: список идентификаторов namenode, соответствующий hdfs-site.xml
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: rpc-адрес namenode. Количество адресов должно соответствовать количеству namenode, а значения должны совпадать с hdfs-site.xml
- `dfs.client.failover.proxy.provider.[nameservice ID]`: класс Java, с помощью которого клиент HDFS подключается к активному namenode, обычно "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"

**Для кластеров Hadoop с включённой аутентификацией kerberos необходимо задать дополнительные атрибуты PROPERTIES:**
- `dfs.namenode.kerberos.principal`: имя principal службы namenode HDFS
- `hadoop.security.authentication`: задаёт метод аутентификации kerberos
- `hadoop.kerberos.principal`: задаёт principal Kerberos, используемый при подключении Doris к HDFS
- `hadoop.kerberos.keytab`: задаёт локальный путь к файлу keytab

Для протокола S3 непосредственно укажите его настройки:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: (необязательно) значение по умолчанию: `false`. S3 SDK по умолчанию использует Virtual-hosted Style. Однако в некоторых системах объектного хранения доступ в стиле Virtual-hosted Style может быть отключён или не поддерживаться. В этом случае можно добавить параметр `use_path_style`, чтобы принудительно использовать доступ в стиле Path Style.

> Примечание: для использования параметра `delete_existing_files` необходимо также добавить настройку `enable_delete_existing_files = true` в `fe.conf` и перезапустить fe, после чего delete_existing_files начнёт действовать. delete_existing_files = true является опасной операцией, поэтому рекомендуется использовать её только в тестовых средах.

## Возвращаемое значение {#return-value}

Оператор Outfile возвращает результат со следующими столбцами:

| Имя столбца | Тип      | Описание                                        |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | Итоговое количество созданных файлов            |
| TotalRows   | int      | Количество строк в наборе результатов           |
| FileSize    | int      | Общий размер экспортированных файлов. Единица измерения: байты. |
| URL         | string   | Префикс пути к экспортированным файлам. Если файлов несколько, они последовательно нумеруются с помощью суффиксов `_0`,`_1`. |

## Управление правами доступа {#permission-control}

Пользователи, выполняющие эту SQL-команду, должны иметь как минимум следующие права:

| Право       | Объект       | Описание                       |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | База данных  | Требуются права на чтение базы данных и таблицы. |

Начиная с версии 4.1.5 при экспорте в Parquet параметр `enable_int96_timestamps` по умолчанию имеет значение `false`, и используются логические временные метки `INT64`. Явно задайте значение `true`, если средству чтения требуется INT96. Свойство принимает только значения `true` или `false`. О семантике дат и часовых поясов см. [Parquet](../../../../lakehouse/file-formats/parquet.md).

## Примечания {#notes}

### Соответствие типов данных {#data-type-mapping}

- Все типы файлов поддерживают экспорт базовых типов данных. Экспорт сложных типов данных (ARRAY/MAP/STRUCT) в настоящее время поддерживается только в форматах `csv`, `orc`, `csv_with_names` и `csv_with_names_and_types`. Вложенные сложные типы не поддерживаются.

- Форматы файлов Parquet и ORC имеют собственные типы данных. Функция экспорта Doris автоматически преобразует типы данных Doris в соответствующие типы данных форматов Parquet/ORC. Ниже приведены таблицы соответствия типов данных Apache Doris и форматов файлов Parquet/ORC:

1. **Таблица соответствия типов данных Doris и формата файлов ORC:**
   | Тип Doris               | Тип Orc   |
   |-------------------------|-----------|
   | boolean                 | boolean   |
   | tinyint                 | tinyint   |
   | smallint                | smallint  |
   | int                     | int       |
   | bigint                  | bigint    |
   | largeInt                | string    |
   | date                    | string    |
   | datev2                  | date      |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | timestamptz | timestamp with local time zone (ORC TIMESTAMP_INSTANT; сохраняет семантику момента времени начиная с версии 4.1.5) |
   | varbinary | binary |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | uuid                    | binary    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Таблица соответствия типов данных Doris и формата файлов Parquet:**

   При экспорте в формат файлов Parquet Doris сначала преобразует данные в памяти из формата Doris в формат Arrow, после чего Arrow записывает их в формат файлов Parquet. Соответствие типов данных Doris и Arrow:
   | Тип Doris               | Тип Arrow  |
   |-------------------------|------------|
   | boolean                 | boolean    |
   | tinyint                 | int8       |
   | smallint                | int16      |
   | int                     | int32      |
   | bigint                  | int64      |
   | largeInt                | utf8       |
   | date                    | utf8       |
   | datev2                  | utf8       |
   | datetime                | utf8       |
   | datetimev2              | utf8       |
   | float                   | float32    |
   | double                  | float64    |
   | char / varchar / string | utf8       |
   | uuid                    | fixed_size_binary(16) |
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

CSV записывает значения UUID в каноническом текстовом представлении в нижнем регистре. Parquet записывает `FIXED_LEN_BYTE_ARRAY(16)` с логической аннотацией UUID, а ORC записывает `BINARY` со специфичным для Doris атрибутом `doris.logical_type=uuid`, в том числе для вложенных элементов UUID в ARRAY, MAP или STRUCT. Если свойство ORC `schema` задано явно, объявляйте столбцы UUID как `binary`; другой тип, например `string`, будет отклонён.

### Объём экспортируемых данных и эффективность экспорта {#export-data-volume-and-export-efficiency}

   Эта функция фактически выполняет SQL-запрос. Итоговый результат выводится в одном потоке. Поэтому общее время экспорта включает время выполнения запроса и время записи итогового набора результатов. Если запрос обрабатывает большой объём данных, необходимо задать переменную сеанса `query_timeout`, чтобы соответствующим образом увеличить время ожидания выполнения запроса.

### Управление экспортированными файлами {#exported-file-management}

   Doris не управляет экспортированными файлами. Пользователи должны самостоятельно обрабатывать как успешно экспортированные файлы, так и файлы, оставшиеся после неудачного экспорта.

### Экспорт в локальные файлы {#export-to-local-files}
   Для экспорта в локальные файлы сначала необходимо задать `enable_outfile_to_local=true` в `fe.conf`  
   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   Экспорт в локальные файлы подходит только для пользователей с частным развёртыванием и не предназначен для пользователей публичного облака. При этом предполагается, что пользователи полностью контролируют узлы кластера. Doris не проверяет корректность указанного пользователем пути экспорта. Если у пользователя, от имени которого запущен процесс Doris, нет прав на запись по этому пути или путь не существует, будет выдана ошибка. Кроме того, из соображений безопасности экспорт завершится ошибкой, если по указанному пути уже существует файл с таким же именем.

   Doris не управляет файлами, экспортированными локально, и не проверяет свободное место на диске и другие подобные условия. Пользователи должны самостоятельно управлять этими файлами, в том числе удалять их при необходимости.

### Гарантия полноты результата {#result-integrity-guarantee}

   Эта команда выполняется синхронно, поэтому во время её выполнения соединение может быть разорвано. В таком случае невозможно определить, завершился ли экспорт штатно и полны ли экспортированные данные. Для этого можно использовать параметр `success_file_name`, чтобы после успешного завершения задачи в каталоге создавался файл, подтверждающий успех. По этому файлу пользователи могут определить, завершился ли экспорт штатно.

### Параллельный экспорт {#concurrent-export}

   Задайте переменную сеанса `set enable_parallel_outfile = true;`, чтобы включить параллельный экспорт Outfile.

## Примеры {#examples}

- Экспорт простых результатов запроса в файл `hdfs://path/to/result.txt` через Broker. Укажите формат экспорта CSV. Используйте `my_broker` и задайте параметры аутентификации kerberos. Укажите разделитель столбцов `,` и разделитель строк `\n`.

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "100MB"
    );
    ```

   Если размер не превышает 100MB, итоговым файлом будет `result_0.csv`.
   Если размер превышает 100MB, могут быть созданы файлы `result_0.csv, result_1.csv, ...`.

- Экспорт простых результатов запроса в файл `hdfs://path/to/result.parquet`. Укажите формат экспорта PARQUET. Используйте `my_broker` и задайте параметры аутентификации kerberos.

    ```sql
    SELECT c1, c2, c3 FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab"
    );
    ```

- Экспорт результатов запроса с CTE в файл `hdfs://path/to/result.txt`. Формат экспорта по умолчанию: CSV. Используйте `my_broker` и задайте параметры высокой доступности HDFS. Используйте разделители строк и столбцов по умолчанию.

    ```sql
    WITH
    x1 AS
    (SELECT k1, k2 FROM tbl1),
    x2 AS
    (SELECT k3 FROM tbl2)
    SELEC k1 FROM x1 UNION SELECT k3 FROM x2
    INTO OUTFILE "hdfs://path/to/result_"
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

   Если размер не превышает 1GB, итоговым файлом будет `result_0.csv`.
   Если размер превышает 1GB, могут быть созданы файлы `result_0.csv, result_1.csv, ...`.

- Экспорт результатов запроса с UNION в файл `bos://bucket/result.txt`. Укажите формат экспорта PARQUET. Используйте `my_broker` и задайте параметры высокой доступности HDFS. Для формата PARQUET не требуется указывать разделитель столбцов.
   После завершения экспорта создайте файл-маркер.

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```

- Экспорт результатов запроса Select в файл `s3a://${bucket_name}/path/result.txt`. Укажите формат экспорта CSV.
   После завершения экспорта создайте файл-маркер.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

   Если размер не превышает 1GB, итоговым файлом будет `my_file_0.csv`.
   Если размер превышает 1GB, могут быть созданы файлы `my_file_0.csv, result_1.csv, ...`.
   Проверка в cos:

        1. Non-existing paths will be automatically created
        2. access.key/secret.key/endpoint need to be confirmed with cos colleagues. Especially the endpoint value, no need to fill in bucket_name.

- Экспорт в bos по протоколу S3 с включённым параллельным экспортом.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

   Итоговый префикс имён созданных файлов будет `my_file_{fragment_instance_id}_`.

- Экспорт в bos по протоколу S3 с включённой переменной сеанса параллельного экспорта.
   Примечание: поскольку запрос содержит узел сортировки верхнего уровня, для него нельзя использовать параллельный экспорт, даже если соответствующая переменная сеанса включена.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

- Экспорт простых результатов запроса в файл `hdfs://${host}:${fileSystem_port}/path/to/result.txt` через HDFS. Укажите формат экспорта CSV и имя пользователя work. Укажите разделитель столбцов `,` и разделитель строк `\n`.

    ```sql
    -- fileSystem_port default value is 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```

   Если в кластере Hadoop включена высокая доступность и используется аутентификация Kerberos, можно воспользоваться следующим SQL-запросом:

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```

   Если размер не превышает 100 MB, итоговым файлом будет `result_0.csv`.
   Если размер превышает 100 MB, могут быть созданы файлы `result_0.csv, result_1.csv, ...`.

- Экспорт результатов запроса Select в файл Tencent Cloud cos `cosn://${bucket_name}/path/result.txt`. Укажите формат экспорта CSV.
   После завершения экспорта создайте файл-маркер.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```
