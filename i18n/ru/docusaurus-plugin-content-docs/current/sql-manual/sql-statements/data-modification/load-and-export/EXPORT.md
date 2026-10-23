---
{
    "title": "EXPORT | Загрузка и экспорт",
    "language": "ru",
    "description": "Команда EXPORT используется для экспорта данных из указанной таблицы в файлы по указанному пути.",
    "sidebar_label": "EXPORT"
}
---

# EXPORT {#export}

## Описание {#description}

Команда `EXPORT` используется для экспорта данных из указанной таблицы в файлы по указанному пути. В настоящее время поддерживается экспорт в удалённые хранилища, такие как HDFS, S3, BOS, COS (Tencent Cloud), через процессы Broker, по протоколу S3 или по протоколу HDFS.

`EXPORT` выполняется асинхронно. Эта команда отправляет в Doris задание `EXPORT JOB` и возвращает управление сразу после его успешной отправки. После выполнения команды можно проверить ход экспорта с помощью команды [SHOW EXPORT](./SHOW-EXPORT).

## Синтаксис: {#syntax}

  ```sql
  EXPORT TABLE <table_name>
  [ PARTITION ( <partation_name> [ , ... ] ) ]
  [ <where_clause> ]
  TO <export_path>
  [ <properties> ]
  WITH <target_storage>
  [ <broker_properties> ];
  ```

## Обязательные параметры {#required-parameters}

**1. `<table_name>`**

  Имя экспортируемой таблицы. Поддерживается экспорт данных из локальных таблиц Doris, представлений и внешних таблиц Catalog.

**2. `<export_path>`**

  Путь к файлам экспорта. Можно указать каталог или путь к каталогу с префиксом имени файла, например `hdfs://path/to/my_file_`

## Необязательные параметры {#optional-parameters}

**1. `<where_clause>`**

  Позволяет задать условия фильтрации экспортируемых данных.

**2. `<partation_name>`**

  Позволяет экспортировать только определённые разделы указанной таблицы. Применяется только к локальным таблицам Doris.

**3. `<properties>`**

  Используется для настройки параметров экспорта.

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  Можно указать следующие параметры:
  - `label`: необязательный параметр, задающий метку задания Export. Если он не указан, система создаёт случайную метку.

  - `column_separator`: задаёт разделитель столбцов при экспорте. Значение по умолчанию: `\t`. Поддерживаются многобайтовые разделители. Этот параметр используется только для файлов формата CSV.

  - `line_delimiter`: задаёт разделитель строк при экспорте. Значение по умолчанию: `\n`. Поддерживаются многобайтовые разделители. Этот параметр используется только для файлов формата CSV.

  - `columns`: задаёт столбцы экспортируемой таблицы.

  - `format`: задаёт формат файлов для задания экспорта. Поддерживаются parquet, orc, csv, csv_with_names, csv_with_names_and_types. По умолчанию используется формат CSV.

  - `enable_int96_timestamps`: определяет, используются ли временные метки INT96 при экспорте в Parquet. Явная настройка в EXPORT поддерживается начиная с версии 4.1.5. Значение по умолчанию: `false`, при котором используются логические временные метки INT64. Установите значение `true` для средств чтения, которым требуется INT96. Допускаются только значения `true` и `false`.

  - `max_file_size`: ограничивает размер отдельного файла в задании экспорта. Если результат превышает это значение, он разбивается на несколько файлов. Диапазон значений `max_file_size`: [5MB, 2GB], значение по умолчанию: 1GB. (При экспорте в формат orc фактический размер файлов после разбиения будет кратен 64MB. Например, при max_file_size = 5MB разбиение фактически выполняется при достижении 64MB, а при max_file_size = 65MB при достижении 128MB.)

  - `parallelism`: степень параллелизма задания экспорта. Значение по умолчанию: `1`. Задание экспорта запускает потоки в количестве, заданном параметром `parallelism`, для выполнения операторов `select into outfile`. (Если Parallelism превышает количество Tablet в таблице, система автоматически устанавливает Parallelism равным количеству Tablet, то есть каждый оператор `select into outfile` отвечает за один Tablet.)

  - `delete_existing_files`: значение по умолчанию: `false`. Если установлено значение `true`, сначала удаляются все файлы в каталоге, заданном параметром `export_path`, а затем в этот каталог экспортируются данные. Например, при "export_path" = "/user/tmp" удаляются все файлы и каталоги в "/user/", а при "file_path" = "/user/tmp/" удаляются все файлы и каталоги в "/user/tmp/".

  - `with_bom`: значение по умолчанию: `false`. Если установлено значение `true`, экспортируемый файл будет иметь кодировку UTF8 с BOM. Применяется только к форматам файлов семейства csv.

  - `data_consistency`: может принимать значения `none` / `partition`. Значение по умолчанию: `partition`. Определяет уровень разбиения экспортируемой таблицы: `none` соответствует уровню Tablet, а `partition` уровню разделов.

  - `timeout`: время ожидания завершения задания экспорта. Значение по умолчанию: 2 часа. Единица измерения: секунды.

  - `compress_type`: (поддерживается начиная с версии 2.1.5) при экспорте в файлы формата Parquet / ORC позволяет указать способ сжатия этих файлов. Для формата Parquet поддерживаются способы сжатия SNAPPY, GZIP, BROTLI, ZSTD, LZ4 и PLAIN; значение по умолчанию: SNAPPY. Для формата ORC поддерживаются способы сжатия PLAIN, SNAPPY, ZLIB и ZSTD; значение по умолчанию: ZLIB. Этот параметр поддерживается начиная с версии 2.1.5. (PLAIN означает отсутствие сжатия.) Начиная с версии 3.1.1 можно указывать алгоритмы сжатия для формата CSV. В настоящее время поддерживаются "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd".

  :::caution Примечание  
  Для использования параметра delete_existing_files необходимо также добавить настройку `enable_delete_existing_files = true` в fe.conf и перезапустить fe. После этого delete_existing_files вступит в силу. delete_existing_files = true выполняет опасную операцию, поэтому рекомендуется использовать эту настройку только в тестовых средах.  
  :::  

**4. `<target_storage>`**  
    Тип хранилища. Возможные значения: BROKER, S3, HDFS.  

**5. `<broker_properties>`**  
    В зависимости от типа хранилища, указанного в `<target_storage>`, необходимо задать соответствующие свойства.  

- **BROKER**  
  Данные можно записывать в удалённое хранилище через процессы Broker. Здесь необходимо указать параметры подключения, которые будет использовать Broker.  

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  

  **Свойства Broker:**  
  - `username`: имя пользователя
  - `password`: пароль
  - `hadoop.security.authentication`: указывает kerberos в качестве способа аутентификации
  - `kerberos_principal`: указывает principal kerberos
  - `kerberos_keytab`: указывает путь к файлу keytab kerberos. Путь должен быть абсолютным и указывать на файл на сервере, где работает процесс Broker. Файл должен быть доступен процессу Broker  

- **HDFS**  

  Данные можно записывать непосредственно в удалённую HDFS.

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  

  **Свойства HDFS:**  
  - `fs.defaultFS`: адрес и порт namenode
  - `hadoop.username`: имя пользователя HDFS
  - `dfs.nameservices`: имя службы имён, соответствующее hdfs-site.xml
  - `dfs.ha.namenodes.[nameservice ID]`: список идентификаторов namenode, соответствующий hdfs-site.xml
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: rpc-адрес Name node. Количество адресов должно соответствовать количеству namenode, а значения должны соответствовать hdfs-site.xml   

  **Для кластеров Hadoop с включённой аутентификацией kerberos необходимо дополнительно задать следующие атрибуты PROPERTIES:**
  - `dfs.namenode.kerberos.principal`: имя principal службы namenode HDFS
  - `hadoop.security.authentication`: задаёт kerberos в качестве способа аутентификации
  - `hadoop.kerberos.principal`: задаёт principal Kerberos, используемый при подключении Doris к HDFS
  - `hadoop.kerberos.keytab`: задаёт локальный путь к файлу keytab  

- **S3**  

  Данные можно записывать непосредственно в удалённое объектное хранилище S3.

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```  

  **Свойства S3:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: (необязательный) значение по умолчанию: `false`. S3 SDK по умолчанию использует Virtual-hosted Style. Однако в некоторых системах объектного хранения доступ в стиле Virtual-hosted Style может быть отключён или не поддерживаться. В таком случае можно добавить параметр `use_path_style`, чтобы принудительно использовать доступ в стиле Path Style.

## Возвращаемые значения {#return-values}

| Имя столбца         | Тип    | Описание                                                             |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | Уникальный идентификатор задания экспорта.                           |
| label               | string | Метка задания экспорта.                                              |
| dbId                | long   | Идентификатор базы данных.                                           |
| tableId             | long   | Идентификатор таблицы.                                               |
| state               | string | Текущее состояние задания.                                           |
| path                | string | Путь к файлам экспорта.                                              |
| partitions          | string | Список имён экспортируемых разделов; имена разделяются запятыми.      |
| progress            | int    | Текущий ход выполнения задания экспорта (в процентах).               |
| createTimeMs        | string | Время создания задания в миллисекундах, представленное в формате даты и времени. |
| exportStartTimeMs   | string | Время начала задания экспорта в миллисекундах, представленное в формате даты и времени. |
| exportFinishTimeMs  | string | Время завершения задания экспорта в миллисекундах, представленное в формате даты и времени. |
| failMsg             | string | Сообщение об ошибке при сбое задания экспорта.                        |


## Управление доступом {#access-control}

Пользователи, выполняющие эту команду SQL, должны иметь как минимум следующие права:

| Право       | Объект       | Описание                              |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | База данных  | Требуется право чтения базы данных и таблицы. |


## Примечания {#notes}

### Параллельное выполнение {#concurrent-execution}

В задании Export можно задать параметр `parallelism` для параллельного экспорта данных. Параметр `parallelism` фактически определяет количество потоков, выполняющих задание EXPORT. Если установлено `"data_consistency" = "none"`, каждый поток отвечает за экспорт части Tablet таблицы.

В основе выполнения задания Export лежат операторы `SELECT INTO OUTFILE`. Каждый поток, заданный параметром `parallelism`, выполняет независимые операторы `SELECT INTO OUTFILE`.

Задание Export разбивается на несколько операторов `SELECT INTO OUTFILE` следующим образом: все Tablet таблицы равномерно распределяются между параллельными потоками. Например:
- num(tablets) = 40, parallelism = 3: эти 3 потока отвечают за 14, 13, 13 Tablet соответственно.
- num(tablets) = 2, parallelism = 3: Doris автоматически устанавливает parallelism в 2, и каждый поток отвечает за один Tablet.

Если количество Tablet, за которые отвечает поток, превышает значение `maximum_tablets_of_outfile_in_export` (по умолчанию 10; его можно изменить, добавив параметр `maximum_tablets_of_outfile_in_export` в fe.conf), работа этого потока разбивается на несколько операторов `SELECT INTO OUTFILE`. Например:
- Поток отвечает за 14 Tablet, а `maximum_tablets_of_outfile_in_export = 10`. Тогда этот поток выполняет два оператора `SELECT INTO OUTFILE`. Первый оператор `SELECT INTO OUTFILE` экспортирует 10 Tablet, второй оператор `SELECT INTO OUTFILE` экспортирует 4 Tablet. Эти два оператора `SELECT INTO OUTFILE` выполняются потоком последовательно.

Если объём экспортируемых данных очень велик, можно увеличить параметр `parallelism`, чтобы повысить степень параллелизма экспорта. Если свободных ядер процессора мало и увеличить `parallelism` нельзя, а экспортируемая таблица содержит много Tablet, можно увеличить `maximum_tablets_of_outfile_in_export`, чтобы каждый оператор `SELECT INTO OUTFILE` отвечал за большее количество Tablet. Это также может ускорить экспорт.

Для экспорта таблицы на уровне разделов можно задать свойство Export `"data_consistency" = "partition"`. В этом случае работа параллельных потоков заданий Export разбивается на несколько операторов Outfile на уровне разделов. Разные операторы Outfile экспортируют разные разделы, при этом данные, экспортируемые одним оператором Outfile, должны принадлежать одному разделу. Например, после установки `"data_consistency" = "partition"`:

- num(partition) = 40, parallelism = 3: эти 3 потока отвечают за 14, 13, 13 разделов соответственно.
- num(partition) = 2, parallelism = 3: Doris автоматически устанавливает Parallelism в 2, и каждый поток отвечает за один раздел.


### Ограничения памяти {#memory-limits}

Обычно план запроса задания Export содержит только два этапа `scan-export` и не включает вычислений, требующих большого объёма памяти. Поэтому, как правило, достаточно ограничения памяти по умолчанию 2GB.

Однако в некоторых случаях, например когда план запроса требует сканирования слишком большого количества Tablet на одном BE или когда у Tablet слишком много версий данных, памяти может оказаться недостаточно. Чтобы увеличить ограничение использования памяти, можно изменить переменную сеанса `exec_mem_limit`.

### Дополнительные замечания {#other-matters}

- Не рекомендуется экспортировать большие объёмы данных за один раз. Рекомендуемый максимальный объём данных для одного задания Export составляет десятки GB. Слишком большой объём экспорта приводит к появлению большего количества ненужных файлов и увеличивает затраты на повторные попытки. Если объём данных таблицы слишком велик, рекомендуется экспортировать её по разделам.

- Если задание Export завершается с ошибкой, уже созданные файлы не удаляются. Пользователям необходимо удалить их вручную.

- Задания Export сканируют данные и занимают ресурсы ввода-вывода, что может увеличить время выполнения запросов в системе.

- В настоящее время при экспорте выполняются только простые проверки согласованности версий Tablet. Во время выполнения Export рекомендуется не загружать данные в таблицу.

- Одно задание Export позволяет экспортировать не более 2000 разделов. Чтобы изменить это ограничение, можно добавить параметр `maximum_number_of_export_partitions` в `fe.conf` и перезапустить FE.


## Примеры {#examples}

### Экспорт данных в локальную файловую систему {#export-data-to-local}
> Для экспорта данных в локальную файловую систему необходимо добавить `enable_outfile_to_local=true` в `fe.conf` и перезапустить FE.

- Экспорт всех данных таблицы Test в локальное хранилище. По умолчанию экспортируются файлы формата CSV
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Экспорт столбцов k1,k2 таблицы Test в локальное хранилище с указанием метки. По умолчанию используется формат файлов CSV
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Экспорт строк таблицы Test, удовлетворяющих условию `k1 < 50`, в локальное хранилище. По умолчанию экспортируются файлы формата CSV, а в качестве разделителя столбцов используется `,`
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Экспорт разделов p1,p2 таблицы Test в локальное хранилище. По умолчанию экспортируются файлы формата csv
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```

- Экспорт всех данных таблицы Test в локальное хранилище в файлы других форматов
```sql
-- parquet
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

-- orc
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

-- csv(csv_with_names) , Use 'AA' as the column separator and 'zz' as the row separator
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

-- csv(csv_with_names_and_types) 
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```

- Настройка свойства `max_file_sizes`  
   Если размер экспортируемого файла превышает 5MB, данные разбиваются на несколько файлов размером не более 5MB каждый.

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```

- Настройка свойства `parallelism`
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

- Настройка свойства `delete_existing_files`  
    При экспорте Export сначала удаляет все файлы и каталоги из каталога `/home/user/`, а затем экспортирует данные в этот каталог.

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```

### Экспорт в S3 {#export-to-s3}

- Экспорт всех данных таблицы s3_test в S3 с использованием непечатаемого символа `\x07` в качестве разделителя столбцов или строк. Для экспорта данных в minio необходимо также указать `use_path_style`=`true`.

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH S3 (
  "s3.endpoint" = "xxxxx",
  "s3.region" = "xxxxx",
  "s3.access_key" = "xxxxx",
  "s3.secret_key"="xxxx"
  
)
```

### Экспорт в HDFS {#export-to-hdfs}

- Экспорт всех данных таблицы Test в HDFS в формате Parquet. Ограничение размера отдельного файла задания экспорта составляет 512MB. Все существующие файлы в указанном каталоге сохраняются.

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c/" 
PROPERTIES(
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "false"
)
with HDFS (
"fs.defaultFS"="hdfs://hdfs_host:port",
"hadoop.username" = "hadoop"
);
```

### Экспорт через узел Broker {#export-through-broker-node}
Сначала необходимо запустить процесс Broker и добавить этот Broker в FE.
- Экспорт всех данных таблицы Test в HDFS
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- Экспорт разделов p1,p2 таблицы testTbl в HDFS с использованием "," в качестве разделителя столбцов и с указанием метки

```sql
EXPORT TABLE testTbl PARTITION (p1,p2) TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "label" = "mylabel",
  "column_separator"=","
) 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- Экспорт всех данных таблицы testTbl в HDFS с использованием непечатаемого символа `\x07` в качестве разделителя столбцов или строк.

```sql
EXPORT TABLE testTbl TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) 
WITH BROKER "broker_name" 
(
  "username"="xxx", 
  "password"="yyy"
)
```
