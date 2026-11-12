---
{
    "title": "Hive Metastore",
    "language": "ru",
    "description": "В этом документе описаны все поддерживаемые параметры подключения к службам Hive MetaStore и доступа к ним с помощью оператора CREATE CATALOG."
}
---

В этом документе описаны все поддерживаемые параметры подключения к службам Hive MetaStore и доступа к ним с помощью оператора `CREATE CATALOG`.

## Поддерживаемые типы Catalog {#supported-catalog-types}

| Тип Catalog | Идентификатор типа (type) | Описание                      |
| ------------ | ---------------------- | -------------------------------- |
| Hive         | hms                    | Catalog для подключения к Hive Metastore |
| Iceberg      | iceberg                | Catalog для формата таблиц Iceberg |
| Paimon       | paimon                 | Catalog для формата таблиц Apache Paimon |

## Обзор общих параметров {#common-parameters-overview}

Следующие параметры являются общими для разных типов Catalog.

| Имя параметра                     | Прежнее имя                       | Обязательный | По умолчанию | Описание                                                                                                                                                                              |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris                |                                   | Да      | Отсутствует    | URI-адрес Hive Metastore. Поддерживается несколько URI, разделённых запятыми. Пример: 'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication    | Нет       | simple  | Способ аутентификации в Metastore: поддерживаются simple (по умолчанию) и kerberos. В версиях 3.0 и более ранних способ аутентификации определялся свойством hadoop.security.authentication. Начиная с версии 3.1, способ аутентификации в Hive Metastore можно задавать отдельно. Пример: 'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | Нет       | Пусто   | principal сервера Hive. Поддерживается подстановочный символ _HOST. Пример: 'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM'                                                               |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | Нет       | Пусто   | principal Kerberos, используемый Doris для подключения к службе Hive MetaStore.                                                                                                                  |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | Нет       | Пусто   | Путь к файлу keytab Kerberos                                                                                                                                                               |
| hive.metastore.username            | hadoop.username                   | Нет       | hadoop  | Имя пользователя Hive Metastore, используемое в режиме без Kerberos                                                                                                                                      |
| hive.conf.resources                |                                   | Нет       | Пусто   | Относительный путь к файлу конфигурации hive-site.xml                                                                                                                             |
| hive.metastore.client.socket.timeout                |                                   | Нет    | Значение по умолчанию задаётся параметром `hive_metastore_client_timeout_second` в конфигурации FE и составляет 10 секунд. | Этот параметр поддерживается начиная с версии 4.0.3. Время ожидания при доступе к метаданным через соединение Hive Metastore Client. При большом объёме метаданных (например, при большом количестве разделов) это значение можно увеличить. |

> Примечание:
>
> Для версий до 3.1.0 используйте прежние имена параметров.

### Обязательные параметры {#required-parameters}

* `hive.metastore.uris`: необходимо указать URI-адрес Hive Metastore.

### Необязательные параметры {#optional-parameters}

* `hive.metastore.authentication.type`: способ аутентификации. По умолчанию используется `simple`, также доступен `kerberos`.

* `hive.metastore.service.principal`: principal Kerberos службы Hive MetaStore. Необходимо указать при использовании аутентификации Kerberos.

* `hive.metastore.client.principal`: principal Kerberos, используемый Doris для подключения к службе Hive MetaStore. Необходимо указать при использовании аутентификации Kerberos.

* `hive.metastore.client.keytab`: путь к файлу keytab Kerberos. Необходимо указать при использовании аутентификации Kerberos.

* `hive.metastore.username`: имя пользователя для подключения к службе Hive MetaStore. Используется в режиме без Kerberos. Значение по умолчанию: `hadoop`.

* `hive.conf.resources`: путь к файлу конфигурации hive-site.xml. Используется, когда настройки подключения к службе Hive Metastore необходимо читать из файлов конфигурации.

### Способы аутентификации {#authentication-methods}

#### Простая аутентификация {#simple-authentication}

* `simple`: режим без Kerberos, при котором подключение к службе Hive Metastore выполняется напрямую.

#### Аутентификация Kerberos {#kerberos-authentication}

Чтобы использовать аутентификацию Kerberos для подключения к службе Hive Metastore, настройте следующие параметры:

* `hive.metastore.authentication.type`: установите значение `kerberos`.

* `hive.metastore.service.principal`: principal Kerberos службы Hive MetaStore.

* `hive.metastore.client.principal`: principal Kerberos, используемый Doris для подключения к службе Hive MetaStore.

* `hive.metastore.client.keytab`: путь к файлу keytab Kerberos.

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```

При использовании службы Hive MetaStore с включённой аутентификацией Kerberos убедитесь, что один и тот же файл keytab присутствует на всех узлах FE, пользователь, от имени которого запущен процесс Doris, имеет право читать этот файл, а файл конфигурации krb5 настроен правильно.

Информацию о распространённых проблемах настройки Kerberos и рекомендуемых подходах см. в разделе [Kerberos](../best-practices/kerberos.md).

### Параметры файла конфигурации {#configuration-file-parameters}

#### `hive.conf.resources` {#hiveconfresources}

Если настройки подключения к службе Hive Metastore необходимо читать из файлов конфигурации, можно задать путь к файлу конфигурации с помощью параметра `hive.conf.resources`.

> Примечание: параметр `hive.conf.resources` поддерживает только относительные пути. Не используйте абсолютные пути. По умолчанию путь задаётся относительно каталога `${DORIS_HOME}/plugins/hadoop_conf/`. Другие каталоги можно указать, изменив hadoop_config_dir в fe.conf.

Пример: `'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Параметры для отдельных типов Catalog {#catalog-type-specific-data}

Следующие параметры дополняют общие параметры и зависят от типа Catalog.

### Hive Catalog {#hive-catalog}

| Имя параметра      | Прежнее имя | Обязательный | По умолчанию | Описание                                                          |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                |             | Да      | Отсутствует    | Тип Catalog. Для Hive Catalog всегда имеет значение hms                         |
| hive.metastore.type |             | Нет       | 'hms'   | Тип Catalog метаданных. Для Hive Metastore всегда имеет значение hms. При использовании HiveMetaStore необходимо указать hms |

#### Примеры {#examples}

1. Создание Hive Catalog со службой метаданных Hive Metastore без аутентификации и хранилищем S3.

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```

2. Создание Hive Catalog со службой метаданных Hive Metastore с включённой аутентификацией Kerberos и хранилищем S3.

   ```sql
    CREATE CATALOG hive_hms_on_oss_kerberos_new_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
       'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
       'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
       'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
       'hive.metastore.authentication.type'='kerberos',
       'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                          DEFAULT',
       'oss.access_key' = 'OSS_ACCESS_KEY',
       'oss.secret_key' = 'OSS_SECRET_KEY',
       'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
   );
   ```

### Iceberg Catalog {#iceberg-catalog}

| Имя параметра       | Прежнее имя | Обязательный | По умолчанию | Описание                                                          |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                 |             | Да      | Отсутствует    | Тип Catalog. Для Iceberg всегда имеет значение iceberg                          |
| iceberg.catalog.type |             | Нет       | Отсутствует    | Тип Catalog метаданных. Для Hive Metastore всегда имеет значение hms. При использовании HiveMetaStore необходимо указать hms |
| warehouse            |             | Нет       | Отсутствует    | Путь к хранилищу Iceberg                                               |

#### Примеры {#examples-1}

1. Создание Iceberg Catalog со службой метаданных Hive Metastore и хранилищем S3.

    ```sql
     CREATE CATALOG iceberg_hms_s3_test_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```

2. Создание Iceberg Catalog со службой метаданных Hive Metastore с включённой аутентификацией Kerberos в среде с несколькими областями Kerberos и хранилищем S3.

    ```sql
    CREATE CATALOG IF NOT EXISTS iceberg_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 'oss://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```

### Paimon Catalog {#paimon-catalog}

| Имя параметра      | Прежнее имя | Обязательный | По умолчанию    | Описание                                                         |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type                |             | Да      | Отсутствует       | Тип Catalog. Для Paimon всегда имеет значение paimon                           |
| paimon.catalog.type |             | Нет       | filesystem | При использовании HiveMetaStore необходимо указать hms. Значение по умолчанию filesystem означает хранение метаданных в файловой системе |
| warehouse           |             | Да      | Отсутствует       | Путь к хранилищу Paimon                                               |

#### Примеры {#examples-2}

1. Создание Paimon Catalog со службой метаданных Hive Metastore и хранилищем S3.

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_s3_test_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/paimon_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```

2. Создание Paimon Catalog со службой метаданных Hive Metastore с включённой аутентификацией Kerberos в среде с несколькими областями Kerberos и хранилищем S3.

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```
## Требования к портам для доступа к HMS {#hms-access-port-requirements}

Для доступа к HMS в Doris должны быть открыты как минимум следующие порты:

| Служба        | Назначение порта          | Порт по умолчанию | Протокол |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (доступ к метаданным) | 9083         | TCP      |

Примечания:
- Порты можно изменить в `hive-site.xml`. Всегда ориентируйтесь на фактическую конфигурацию.
- Если включена аутентификация Kerberos, обеспечьте сетевое соединение между Doris и Kerberos KDC. По умолчанию KDC прослушивает TCP-порт 88, если в конфигурации KDC не указан другой порт.

## Часто задаваемые вопросы (FAQ) {#frequently-asked-questions-faq}

- Вопрос 1: Обязателен ли файл hive-site.xml?

    Нет, он используется только тогда, когда из него необходимо читать настройки.

- Вопрос 2: Должен ли файл keytab присутствовать на каждом узле?

    Да, все узлы FE должны иметь доступ к указанному пути.

- Вопрос 3: Что нужно учитывать при использовании функции обратной записи, то есть при создании баз данных и таблиц Hive/Iceberg в Doris?

    Поскольку создание таблиц включает операции с метаданными на стороне хранилища, то есть обращение к системе хранения, на сервере службы Hive MetaStore необходимо настроить соответствующие параметры хранилища, например параметры доступа к S3, OSS и другим службам хранения. При использовании объектного хранилища в качестве базовой системы хранения убедитесь, что бакет, в который выполняется запись, соответствует настроенному Region.
