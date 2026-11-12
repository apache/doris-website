---
{
    "title": "Интеграция с Alibaba Cloud DLF Rest Catalog",
    "language": "ru",
    "description": "В этой статье описана интеграция Apache Doris с Alibaba Cloud DLF (Data Lake Formation) Rest Catalog для беспрепятственного доступа к данным таблиц Iceberg и их анализа, включая инструкции по созданию Catalog, выполнению запросов и инкрементальному чтению."
}
---

Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf) — ключевой компонент облачной архитектуры озера данных, который помогает пользователям быстро создавать облачные решения на основе озера данных. DLF обеспечивает единое управление метаданными озера данных, контроль прав доступа корпоративного уровня и тесную интеграцию с различными вычислительными движками, устраняя изолированность данных и помогая получать ценную для бизнеса информацию.

- Единые метаданные и хранилище

    Вычислительные движки для работы с большими данными используют общие метаданные и хранилище озера данных, обеспечивая беспрепятственный обмен данными между продуктами для работы с озером данных.

- Единое управление правами доступа

    Вычислительные движки для работы с большими данными используют единые настройки прав доступа к таблицам озера данных: достаточно настроить их один раз, и они будут действовать везде.

- Оптимизация хранения

    Предоставляет стратегии оптимизации, включая объединение небольших файлов, удаление снимков с истекшим сроком действия, реорганизацию разделов и удаление устаревших файлов, чтобы повысить эффективность хранения.

- Всесторонняя поддержка облачной экосистемы

    Глубокая интеграция с продуктами Alibaba Cloud, в том числе с движками потоковой и пакетной обработки, обеспечивает готовую к использованию функциональность и удобство работы.

Doris поддерживает интеграцию с DLF Iceberg Rest Catalog начиная с версии 4.1.0, обеспечивая беспрепятственное подключение к DLF для доступа к данным таблиц Iceberg и их анализа. В этой статье показано, как подключить Apache Doris к DLF и получить доступ к данным таблиц Iceberg.

:::tip
Эта функция поддерживается начиная с версии Doris 4.1.0.
:::

## Руководство по использованию {#usage-guide}

### 01 Включение сервиса DLF {#01-enable-dlf-service}

Чтобы включить сервис DLF и создать соответствующие Catalog, базу данных и таблицу, обратитесь к официальной документации DLF.

### 02 Доступ к DLF с помощью EMR Spark SQL {#02-access-dlf-using-emr-spark-sql}

- Подключение

    ```shell
    spark-sql --master yarn \
        --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
        --conf spark.sql.catalog.iceberg=org.apache.iceberg.spark.SparkCatalog \
        --conf spark.sql.catalog.iceberg.catalog-impl=org.apache.iceberg.rest.RESTCatalog \
        --conf spark.sql.catalog.iceberg.uri=http://<region>-vpc.dlf.aliyuncs.com/iceberg \
        --conf spark.sql.catalog.iceberg.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.iceberg.credential=<ak>:<sk>
    ```

    > Подставьте соответствующие значения для `<region>`, `warehouse`, `<ak>` и `<sk>`.

- Запись данных

    ```sql
    USE iceberg.<your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    ) USING iceberg;

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

### 03 Подключение к DLF с помощью Doris {#03-connect-to-dlf-using-doris}

- Создание Iceberg Catalog

    ```sql
    CREATE CATALOG ice PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://<region>-vpc.dlf.aliyuncs.com/iceberg',
        'warehouse' = '<your-catalog-name>',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 'DlfNext',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>',
        'iceberg.rest.signing-region' = '<region>',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        'io-impl' = 'org.apache.iceberg.rest.DlfFileIO',
        'fs.oss.support' = 'true'
    );
    ```

    - Doris использует временные учётные данные, возвращаемые DLF, для доступа к объектному хранилищу OSS, поэтому дополнительные учётные данные OSS не требуются.
    - Доступ к DLF возможен только в пределах одной VPC. Убедитесь, что указан правильный URI.
    - Для DLF Iceberg REST Catalog необходимо включить подпись SigV4 и указать специальное имя сервиса для подписи DLF — `DlfNext`.

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
