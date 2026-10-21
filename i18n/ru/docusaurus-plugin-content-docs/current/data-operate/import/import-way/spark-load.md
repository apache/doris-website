---
{
    "title": "Spark Load",
    "language": "ru",
    "description": "Spark Load использует внешние ресурсы Spark для предварительной обработки загружаемых данных, повышая производительность загрузки больших объёмов данных в Doris и экономя вычислительные ресурсы кластера Doris. Этот механизм применяется главным образом для первоначальной миграции и массовой загрузки данных в Doris."
}
---

# Spark Load {#spark-load}

Spark Load использует внешние ресурсы Spark для предварительной обработки загружаемых данных, повышая производительность загрузки больших объёмов данных в Doris и экономя вычислительные ресурсы кластера Doris. Этот механизм применяется главным образом для первоначальной миграции и массовой загрузки данных в Doris.

Spark Load использует ресурсы кластера Spark для сортировки загружаемых данных, а Doris BE записывает файлы напрямую. Это значительно сокращает потребление ресурсов кластера Doris и позволяет эффективно снизить нагрузку на него при миграции огромных объёмов исторических данных.

Задания загрузки необходимо создавать и запускать через клиент Spark Load. Состояние выполнения задания выводится в консоль. Результаты загрузки также можно просмотреть с помощью SHOW LOAD.

:::caution Примечание

Эта функция является экспериментальной и пока доступна только в ветке master.
Текущая версия поддерживает только кластер с совмещёнными хранением и вычислениями.
Если при использовании возникнут проблемы, сообщите о них через список рассылки, [GitHub Issue](https://github.com/apache/doris/issues) или другие каналы.

:::

## Сценарии использования {#use-cases}

- Исходные данные находятся в системе хранения, доступной Spark, например HDFS.
- Объём данных составляет от десятков GB до TB.

:::caution Примечание
Для модели с первичным ключом в настоящее время поддерживаются только таблицы в режиме merge-on-read.
:::

## Принципы работы {#basic-principles}

### Основной процесс {#basic-process}

Выполнение задания Spark Load состоит из следующих 7 основных этапов:

1. Вы создаёте файл конфигурации, в котором указываете исходные файлы или таблицы для чтения и сведения о целевой таблице.
2. Клиент Spark Load создаёт задание загрузки через FE и начинает транзакцию. FE возвращает клиенту метаданные целевой таблицы.
3. Клиент Spark Load отправляет задачу ETL в кластер Spark для выполнения.
4. Кластер Spark выполняет ETL для предварительной обработки загружаемых данных, включая построение глобального словаря (тип Bitmap), разбиение на разделы, сортировку, агрегацию и другие операции.
5. После завершения задачи ETL клиент Spark Load передаёт FE путь к данным каждого предварительно обработанного шарда и назначает соответствующим BE выполнение задачи Push.
6. BE считывает данные и преобразует их во внутренний формат хранения Doris.
7. FE планирует активацию версии для завершения задания загрузки.

### Глобальный словарь {#global-dictionary}

#### Сценарии применения {#applicable-scenarios}

В настоящее время столбец Bitmap в Doris реализован с помощью библиотеки Roaringbitmap. Roaringbitmap принимает на вход только целочисленные данные, поэтому для предварительных вычислений со столбцом Bitmap во время загрузки необходимо преобразовать тип входных данных в целочисленный.

В существующем процессе загрузки Doris структура глобального словаря реализована на основе таблиц Hive, в которых хранится соответствие между исходными и закодированными значениями.

#### Процесс построения {#construction-process}

1. Считайте данные из исходного источника и создайте временную таблицу Hive, обозначаемую как hive_table.
2. Извлеките из hive_table уникальные значения столбцов, для которых требуется дедупликация, и создайте новую таблицу Hive, обозначаемую как distinct_value_table.
3. Создайте новую таблицу глобального словаря, обозначаемую как dict_table, с одним столбцом для исходных значений и одним столбцом для закодированных значений.
4. Выполните Left Join между distinct_value_table и dict_table, чтобы определить множество новых уникальных значений, затем закодируйте это множество с помощью оконной функции. На этом этапе для исходных значений дедуплицированных столбцов появляется дополнительный столбец с закодированными значениями. В завершение запишите данные этих двух столбцов обратно в dict_table.
5. Соедините dict_table с hive_table, чтобы заменить исходные значения в hive_table целочисленными кодами.
6. hive_table считывается на следующем этапе предварительной обработки данных, а после вычислений данные загружаются в Doris.
   Предварительная обработка данных (DPP)
   Основной процесс
7. Считайте данные из источника. Источником могут быть файлы HDFS или таблицы Hive.
8. Выполните сопоставление полей, вычислите выражения и сформируйте для считанных данных поле бакета bucket_id на основе информации о разделах.
9. Постройте RollupTree на основе метаданных Rollup таблицы Doris.
10. Обойдите RollupTree и выполните иерархическую агрегацию. Rollup следующего уровня можно вычислить на основе Rollup предыдущего уровня.
11. После завершения каждого вычисления агрегации распределите данные по бакетам согласно bucket_id и запишите их в HDFS.
12. Затем Broker получает файлы из HDFS и загружает их в Doris BE.

#### Hive Bitmap UDF {#hive-bitmap-udf}

Spark поддерживает прямую загрузку в Doris данных Bitmap, созданных в Hive. Подробнее см. в документе hive-bitmap-udf.

## Быстрый старт {#quick-start}

- Чтение данных из файла

  - Схема целевой таблицы

    ```sql
    CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
      c_int int(11) NULL,
      c_char char(15) NULL,
      c_varchar varchar(100) NULL,
      c_bool boolean NULL,
      c_tinyint tinyint(4) NULL,
      c_smallint smallint(6) NULL,
      c_bigint bigint(20) NULL,
      c_largeint largeint(40) NULL,
      c_float float NULL,
      c_double double NULL,
      c_decimal decimal(6, 3) NULL,
      c_decimalv3 decimal(6, 3) NULL,
      c_date date NULL,
      c_datev2 date NULL,
      c_datetime datetime NULL,
      c_datetimev2 datetime NULL
    )
    DISTRIBUTED BY HASH(c_int) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    )
    ```

  - Создание файла конфигурации

    ```json
    {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-file",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
          "type": "file",
          "paths": ["hdfs://hadoop:8020/data/data.txt"],
          "format": "csv",
          "fieldSep": ",", "columns":"c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.memory": "2G",
            "spark.executor.cores": 1,
            "spark.num.executor": 4
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
    }
    ```

  - Запуск задания Spark Load

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

  - Просмотр результата выполнения задания

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-file | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

- Чтение данных из таблицы Hive

    - Схема таблицы Hive

      ```hive
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int,
        c_char char,
        c_varchar varchar,
        c_bool boolean,
        c_tinyint tinyint,
        c_smallint smallint,
        c_bigint bigint,
        c_largeint largeint,
        c_float float,
        c_double double,
        c_decimal decimal(6, 3),
        c_decimalv3 decimal(6, 3),
        c_date date,
        c_datev2 date,
        c_datetime datetime,
        c_datetimev2 datetime
      )
      STORED AS TEXTFILE
      ```

    - Схема целевой таблицы

      ```sql
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int(11) NULL,
        c_char char(15) NULL,
        c_varchar varchar(100) NULL,
        c_bool boolean NULL,
        c_tinyint tinyint(4) NULL,
        c_smallint smallint(6) NULL,
        c_bigint bigint(20) NULL,
        c_largeint largeint(40) NULL,
        c_float float NULL,
        c_double double NULL,
        c_decimal decimal(6, 3) NULL,
        c_decimalv3 decimal(6, 3) NULL,
        c_date date NULL,
        c_datev2 date NULL,
        c_datetime datetime NULL,
        c_datetimev2 datetime NULL
      )
      DISTRIBUTED BY HASH(c_int) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - Создание файла конфигурации

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-hive",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "tbl_test_spark_load"
            }
          },
          "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```

    - Запуск задания Spark Load

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

    - Просмотр результата выполнения задания

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-hive | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

## Справочное руководство {#reference-manual}

### Клиент Spark Load {#spark-load-client}

#### Структура каталогов {#directory-structure}

```text
├── app
│   └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│   └── spark-load.sh
└── lib
```

- **app**: пакет приложения spark dpp
- **bin**: скрипт запуска spark load
- **lib**: пакеты прочих зависимостей

#### Параметры скрипта запуска {#startup-script-parameters}

- `--config`|`-c`: указывает путь к файлу конфигурации
- `--recovery`|`-r`: определяет, следует ли запускать клиент в режиме восстановления

### Отмена загрузки {#cancel-import}

Если состояние задания Spark Load отличается от `CANCELLED` и `FINISHED`, его можно отменить вручную.

Задание загрузки можно отменить, завершив процесс скрипта запуска Spark Load или выполнив команду `CANCEL LOAD` в Doris.

При отмене с помощью `CANCEL LOAD` необходимо указать `Label` отменяемого задания загрузки. Выполните `HELP CANCEL LOAD`, чтобы просмотреть синтаксис команды отмены загрузки.

### Параметры конфигурации {#configuration-parameters}

#### Общие настройки {#general-configuration}

| Имя параметра | Обязательный | По умолчанию | Описание                                                |
|-------------|------|-----|--------------------------------------------------------|
| feAddresses | Да  | -   | HTTP-адрес Doris FE, формат: fe_ip:http_port, [fe_ip:http_port] |
| label       | Да  | -   | Метка задания загрузки                                       |
| user        | Да  | -   | Имя пользователя Doris                                         |
| password    | Да  | -   | Пароль Doris                                         |
| database    | Да  | -   | Имя базы данных Doris                                    |
| workingDir  | Да  | -   | Рабочий путь Spark Load                                |

#### Настройки задания {#task-configuration}

| Имя параметра | Подпараметр -1 | Подпараметр -2 | Обязательный | По умолчанию | Описание                                       |
|-----------|-------|-------------------|------|-------|--------------------------------------------------|
| loadTasks |       |                   | Да  | -     | Задание загрузки                                  |
|           | Имя целевой таблицы |       | Да  | -     | Имя таблицы Doris, в которую загружаются данные           |
|           |       | type              | Да  | -     | Тип задания: file — чтение файла, hive — чтение таблицы Hive |
|           |       | paths             | Да  | -     | Массив путей к файлам; применяется только к заданиям чтения файлов (type=file) |
|           |       | format            | Да  | -     | Тип файла; поддерживаются csv, parquet, orc; применяется только к заданиям чтения файлов (type=file) |
|           |       | fieldSep          | Нет   | `\t`  | Разделитель столбцов; применяется только к заданиям чтения файлов (type=file), если тип файла — csv (format=csv) |
|           |       | lineDelim         | Нет   | `\n`  | Разделитель строк; применяется только к заданиям чтения файлов (type=file), если тип файла — csv (format=csv) |
|           |       | hiveMetastoreUris | Да  | -     | Адрес службы метаданных Hive                   |
|           |       | hiveDatabase      | Да  | -     | Имя базы данных Hive                               |
|           |       | hiveTable         | Да  | -     | Имя таблицы Hive                                  |
|           |       | columns           | Нет   | Столбцы целевой таблицы | Имена столбцов исходных данных; применяется только к заданиям чтения файлов (type=file) |
|           |       | columnMappings    | Нет   | -     | Сопоставления столбцов                                  |
|           |       | where             | Нет   | -     | Условие фильтрации                                 |
|           |       | targetPartitions  | Нет   | -     | Целевые разделы для загрузки                         |

#### Настройки параметров Spark {#spark-parameter-configuration}

| Имя параметра | Подпараметр -1 | Обязательный | По умолчанию | Описание                                     |
|--------|------------|------|--------|-------------------------------------------|
| spark  |            | Да  | -      | Задание загрузки                           |
|        | sparkHome  | Да  | -      | Путь развёртывания Spark                     |
|        | master     | Да  | -      | Spark Master; поддерживаемые типы: yarn, standalone, local |
|        | deployMode | Нет   | client | Режим развёртывания Spark; поддерживаемые типы: cluster, client |
|        | properties | Да  | -      | Свойства задания Spark                      |

#### Настройки параметров Hadoop {#hadoop-parameter-configuration}

| Имя параметра | Обязательный | По умолчанию | Описание                                 |
|--------- |---------| ------ | ----------------------------------------- |
| hadoop   | Да     | -      | Настройки Hadoop, включая настройки HDFS и Yarn |

#### Настройки параметров окружения {#environment-parameter-configuration}

| Имя параметра | Обязательный | По умолчанию | Описание |
| -------- |--------| ------ | -------- |
| env      | Нет     | -      | Переменные окружения |

## Примеры загрузки {#import-examples}

### Загрузка данных типа Bitmap {#import-bitmap-type-data}

- Загрузка с построением глобального словаря

    - Таблица Hive

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Таблица Doris

      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - Файл конфигурации

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-dict",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_t1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=bitmap_dict(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
            }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```


- Загрузка данных типа Hive Binary после обработки с помощью Bitmap UDF

    - Таблица Hive

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Таблица Doris
    
      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```
    
    - Файл конфигурации
    
      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-binary",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_tb1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=binary_bitmap(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```
