---
{
    "title": "Интеграция с Alibaba Cloud DLF Rest Catalog",
    "language": "ru",
    "description": "В этой статье описана интеграция Apache Doris с Alibaba Cloud DLF (Data Lake Formation) Rest Catalog для беспрепятственного доступа к данным таблиц Paimon и их анализа. Приведены инструкции по созданию Catalog, выполнению запросов к данным и инкрементальному чтению."
}
---

Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf) — ключевой компонент облачной архитектуры озера данных, который помогает пользователям быстро создавать решения для облачных озёр данных. DLF обеспечивает единое управление метаданными озера данных, контроль прав доступа корпоративного уровня и бесшовную интеграцию с различными вычислительными движками, устраняя разрозненность данных и позволяя получать ценную для бизнеса информацию.

- Единые метаданные и хранилище

    Вычислительные движки для обработки больших данных используют общий набор метаданных и единое хранилище озера данных, обеспечивая беспрепятственный обмен данными между продуктами для работы с озером данных.

- Единое управление правами доступа

    Вычислительные движки для обработки больших данных используют общие настройки прав доступа к таблицам озера данных, поэтому достаточно настроить права один раз, чтобы они действовали во всех движках.

- Оптимизация хранения

    Для повышения эффективности хранения доступны различные стратегии оптимизации: объединение небольших файлов, удаление снимков с истёкшим сроком хранения, реорганизация разделов и удаление устаревших файлов.

- Широкая поддержка облачной экосистемы

    Глубокая интеграция с продуктами Alibaba Cloud, включая движки потоковой и пакетной обработки, обеспечивает готовую к использованию функциональность и удобство работы.

DLF поддерживает Paimon Rest Catalog начиная с версии 2.5. Doris поддерживает интеграцию с DLF 2.5+ Paimon Rest Catalog начиная с версии 3.0.3/3.1.0, обеспечивая бесшовное подключение к DLF для доступа к данным таблиц Paimon и их анализа. В этой статье показано, как подключить Apache Doris к DLF 2.5+ и получить доступ к данным таблиц Paimon.

:::tip
Эта функция поддерживается начиная с версии Doris 3.0.3/3.1.0.
:::

## Руководство по использованию {#usage-guide}

### 01 Включение сервиса DLF {#01-enable-dlf-service}

Следуя официальной документации DLF, включите сервис DLF и создайте соответствующие Catalog, базу данных и таблицу.

### 02 Доступ к DLF через EMR Spark SQL {#02-access-dlf-using-emr-spark-sql}

- Подключение

    ```sql
    spark-sql --master yarn \
        --conf spark.driver.memory=5g \
        --conf spark.sql.defaultCatalog=paimon \
        --conf spark.sql.catalog.paimon=org.apache.paimon.spark.SparkCatalog \
        --conf spark.sql.catalog.paimon.metastore=rest \
        --conf spark.sql.extensions=org.apache.paimon.spark.extensions.PaimonSparkSessionExtensions \
        --conf spark.sql.catalog.paimon.uri=http://<region>-vpc.dlf.aliyuncs.com \
        --conf spark.sql.catalog.paimon.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.paimon.token.provider=dlf \
        --conf spark.sql.catalog.paimon.dlf.token-loader=ecs
    ```

    > Замените соответствующие адреса `warehouse` и `uri`.

- Запись данных

    ```sql
    USE <your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    );

    INSERT INTO users_samples VALUES
    (1, '25-34', 'M', true),
    (2, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (3, '25-34', 'M', true),
    (4, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (5, '25-34', 'M', true),
    (6, '18-24', 'F', false);
    ```

    Если возникнет следующая ошибка, попробуйте удалить `paimon-jindo-x.y.z.jar` из `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3`, затем перезапустите сервис Spark и повторите попытку.

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 Подключение к DLF через Doris {#03-connect-to-dlf-using-doris}

- Создание Paimon Catalog

    ```sql
    CREATE CATALOG paimon_dlf_test PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'rest',
        'uri' = 'http://<region>-vpc.dlf.aliyuncs.com',
        'warehouse' = '<your-catalog-name>',
        'paimon.rest.token.provider' = 'dlf',
        'paimon.rest.dlf.access-key-id' = '<ak>',
        'paimon.rest.dlf.access-key-secret' = '<sk>'
    );
    ```

    - Doris использует временные учётные данные, возвращаемые DLF, для доступа к объектному хранилищу OSS, поэтому дополнительные учётные данные OSS не требуются.
    - Доступ к DLF возможен только из той же VPC. Убедитесь, что указан правильный адрес URI.

- Запрос данных

    ```sql
    SELECT * FROM users_samples ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       1 | 25-34     | M                 |    1 |
    |       2 | 18-24     | F                 |    0 |
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    |       5 | 25-34     | M                 |    1 |
    |       6 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```

- Запрос системных таблиц

    ```sql
    SELECT snapshot_id, commit_time, total_record_count FROM users_samples$snapshots;
    +-------------+-------------------------+--------------------+
    | snapshot_id | commit_time             | total_record_count |
    +-------------+-------------------------+--------------------+
    |           1 | 2025-08-09 05:56:02.906 |                  2 |
    |           2 | 2025-08-13 03:41:32.732 |                  4 |
    |           3 | 2025-08-13 03:41:35.218 |                  6 |
    +-------------+-------------------------+--------------------+
    ```

- Инкрементальное чтение

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
    
