---
{
    "title": "Часто задаваемые вопросы о Data Lakehouse",
    "language": "ru",
    "description": "Часто задаваемые вопросы и руководство по устранению неполадок в Apache Doris Data Lakehouse: проблемы с сертификатами, аутентификация Kerberos, JDBC Catalog, Hive Catalog, HDFS, DLF Catalog и инструменты диагностики."
}
---

## Проблемы с сертификатами {#certificate-issues}

1. При выполнении запроса возникает ошибка `curl 77: Problem with the SSL CA cert.`. Это означает, что системный сертификат устарел и его необходимо обновить локально.
    - Последний сертификат CA можно скачать с `https://curl.se/docs/caextract.html`.
    - Поместите скачанный `cacert-xxx.pem` в каталог `/etc/ssl/certs/`, например: `sudo cp cacert-xxx.pem /etc/ssl/certs/ca-certificates.crt`.

2. При выполнении запроса возникает ошибка: `ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations: CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`.

    ```
    yum install -y ca-certificates
    ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
    ```

## Kerberos {#kerberos}

1. При подключении к Hive Metastore с аутентификацией Kerberos возникает ошибка `GSS initiate failed`.

    Обычно это связано с неверными данными аутентификации Kerberos. Для устранения проблемы выполните следующие действия:

    1. В версиях до 1.2.1 в библиотеке libhdfs3, от которой зависит Doris, не была включена поддержка gsasl. Обновитесь до версии 1.2.2 или более поздней.
    2. Убедитесь, что для каждого компонента заданы правильные keytab и principal, а файл keytab существует на всех узлах FE и BE.

        1. `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`: используются для доступа к Hadoop HDFS; укажите соответствующие значения для HDFS.
        2. `hive.metastore.kerberos.principal`: используется для Hive Metastore.

    3. Попробуйте заменить IP-адрес в principal доменным именем (не используйте подстановку `_HOST` по умолчанию).
    4. Убедитесь, что файл `/etc/krb5.conf` существует на всех узлах FE и BE.

2. При подключении к базе данных Hive через Hive Catalog возникает ошибка: `RemoteException: SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`.

    Если ошибка возникает при выполнении запроса, а `show databases` и `show tables` работают без проблем, выполните следующие два действия:
    - Поместите `core-site.xml` и `hdfs-site.xml` в каталоги `fe/conf` и `be/conf`.
    - Выполните команду Kerberos `kinit` на узле BE, перезапустите BE, затем повторите запрос.

3. Если при запросе к таблице, для которой настроен Kerberos, возникает ошибка `GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)`, проблему обычно решает перезапуск узлов FE и BE.

    - Перед перезапуском всех узлов добавьте `-Djavax.security.auth.useSubjectCredsOnly=false` в параметр JAVA_OPTS в `"${DORIS_HOME}/be/conf/be.conf"`, чтобы получать сведения об учётных данных JAAS через базовый механизм, а не через приложение.
    - Решения распространённых ошибок JAAS приведены в разделе [Устранение неполадок JAAS](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html).
    
4. Для устранения ошибки `Unable to obtain password from user` при настройке Kerberos в Catalog:

    - Убедитесь, что используемый principal присутствует в выводе klist, выполнив `klist -kt your.keytab`.
    - Проверьте, не пропущены ли в конфигурации Catalog такие параметры, как `yarn.resourcemanager.principal`.
    - Если эти проверки не выявили проблем, причиной может быть то, что версия JDK, установленная системным менеджером пакетов, не поддерживает некоторые алгоритмы шифрования. Попробуйте установить JDK вручную и задать переменную окружения `JAVA_HOME`.
    - Kerberos обычно использует шифрование AES-256. Для Oracle JDK необходимо установить JCE. Некоторые дистрибутивы OpenJDK автоматически предоставляют JCE с неограниченной криптографической стойкостью, поэтому отдельная установка не требуется.
    - Версии JCE соответствуют версиям JDK; скачайте подходящий zip-пакет JCE и распакуйте его в каталог `$JAVA_HOME/jre/lib/security` в зависимости от версии JDK:
        - JDK6: [JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
        - JDK7: [JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
        - JDK8: [JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

5. Если при доступе к HDFS с KMS возникает ошибка `java.security.InvalidKeyException: Illegal key size`, обновите JDK до версии >= Java 8 u162 или установите соответствующие JCE Unlimited Strength Jurisdiction Policy Files.

6. Если при настройке Kerberos в Catalog возникает ошибка `SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`, поместите файл `core-site.xml` в каталог `"${DORIS_HOME}/be/conf"`.

    Если при доступе к HDFS возникает ошибка `No common protection layer between client and server`, убедитесь, что значения свойств `hadoop.rpc.protection` на клиенте и сервере совпадают.

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>

    <configuration>

        <property>
            <name>hadoop.security.authentication</name>
            <value>kerberos</value>
        </property>

    </configuration>
    ```

7. Если при использовании Broker Load с настроенным Kerberos возникает ошибка `Cannot locate default realm.`:

    Добавьте параметр конфигурации `-Djava.security.krb5.conf=/your-path` в `JAVA_OPTS` в скрипте `start_broker.sh` для Broker Load.

8. При использовании конфигурации Kerberos в Catalog нельзя одновременно использовать свойство `hadoop.username`.

9. Доступ к Kerberos с JDK 17

    При запуске Doris с JDK 17 и обращении к сервисам Kerberos могут возникать проблемы из-за использования устаревших алгоритмов шифрования. Необходимо добавить свойство `allow_weak_crypto=true` в `krb5.conf` или обновить алгоритм шифрования в Kerberos.

    Подробнее см.: <https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos>

## JDBC Catalog {#jdbc-catalog}

1. Ошибка при подключении к SQLServer через JDBC Catalog: `unable to find valid certification path to requested target`

    Добавьте параметр `trustServerCertificate=true` в `jdbc_url`.

2. При подключении к базе данных MySQL через JDBC Catalog китайские иероглифы отображаются некорректно или условия запросов с китайскими иероглифами работают неправильно

    Добавьте `useUnicode=true&characterEncoding=utf-8` в `jdbc_url`.

    > Примечание: начиная с версии 1.2.3 эти параметры добавляются автоматически при подключении к базе данных MySQL через JDBC Catalog.

3. Ошибка при подключении к базе данных MySQL через JDBC Catalog: `Establishing SSL connection without server's identity verification is not recommended`

    Добавьте `useSSL=true` в `jdbc_url`.

4. При синхронизации данных MySQL с Doris через JDBC Catalog возникает ошибка синхронизации дат. Проверьте, соответствует ли версия MySQL пакету драйвера MySQL. Например, для MySQL 8 и более поздних версий требуется драйвер `com.mysql.cj.jdbc.Driver`.

5. Если отдельное поле слишком велико, при выполнении запроса на стороне BE возникает ошибка нехватки памяти Java (OOM).

    Когда JDBC Scanner читает данные через JDBC, переменная сеанса `batch_size` определяет количество строк, обрабатываемых в JVM за один пакет. Если отдельное поле слишком велико, значение `field_size * batch_size` (приблизительное, с учётом статической памяти JVM и накладных расходов на копирование данных) может превысить лимит памяти JVM, что приведёт к OOM.

    Способы решения:

    - Уменьшите значение `batch_size`, выполнив `set batch_size = 512;`. Значение по умолчанию: 4064.
    - Увеличьте память JVM для BE, изменив параметр `-Xmx` в `JAVA_OPTS`. Например: `-Xmx8g`.

## Hive Catalog {#hive-catalog}

1. При обращении к таблице Iceberg или Hive через Hive Catalog возникает ошибка: `failed to get schema` или `Storage schema reading not supported`

    Попробуйте следующие способы:

    - Поместите jar-пакет среды выполнения `iceberg` в каталог `lib/` Hive.

    - Задайте в `hive-site.xml`:

        ```
        metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
        ```

        После настройки необходимо перезапустить Hive Metastore.

    - Добавьте `"get_schema_from_table" = "true"` в свойства Catalog.

        Этот параметр поддерживается начиная с версий 2.1.10 и 3.0.6.

2. Ошибка при подключении к Hive Catalog: `Caused by: java.lang.NullPointerException`

    Если в fe.log содержится следующая трассировка стека:

    ```
    Caused by: java.lang.NullPointerException
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.getFilteredObjects(AuthorizationMetaStoreFilterHook.java:78) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.filterDatabases(AuthorizationMetaStoreFilterHook.java:55) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1548) ~[doris-fe.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1542) ~[doris-fe.jar:3.1.3]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_181]
    ```

    Для устранения проблемы попробуйте добавить `"metastore.filter.hook" = "org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl"` в оператор `CREATE CATALOG`.

3. Если после создания Hive Catalog команда `show tables` работает корректно, но при выполнении запроса возникает `java.net.UnknownHostException: xxxxx`

    Добавьте следующее в PROPERTIES для Catalog:

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```

4. У таблиц в формате ORC в Hive 1.x схема базового файла ORC может содержать системные имена столбцов, такие как `_col0`, `_col1`, `_col2` и т. д. В этом случае задайте для `hive.version` значение 1.x.x в конфигурации Catalog, чтобы сопоставить их с именами столбцов таблицы Hive.

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```

5. Если при запросе данных таблицы через Catalog возникают ошибки Hive Metastore, такие как `Invalid method name`, задайте параметр `hive.version`.

6. Если при запросе к таблице в формате ORC FE сообщает об ошибке `Could not obtain block` или `Caused by: java.lang.NoSuchFieldError: types`, это может быть связано с тем, что по умолчанию FE обращается к HDFS для получения сведений о файлах и их разбиения на части. В некоторых случаях FE не может получить доступ к HDFS. Проблему можно решить, добавив параметр `"hive.exec.orc.split.strategy" = "BI"`. Другие варианты: HYBRID (по умолчанию) и ETL.

7. В Hive значения полей партиционирования таблицы Hudi доступны, а в Doris нет. Сейчас Doris и Hive используют разные способы выполнения запросов к Hudi. Для Doris необходимо добавить поля партиционирования в структуру файла avsc таблицы Hudi. В противном случае Doris будет выполнять запрос с пустым partition_val (даже если задано `hoodie.datasource.hive_sync.partition_fields=partition_val`).

    ```
    {
        "type": "record",
        "name": "record",
        "fields": [{
            "name": "partition_val",
            "type": [
                "null",
                "string"
                ],
            "doc": "Preset partition field, empty string when not partitioned",
            "default": null
            },
            {
            "name": "name",
            "type": "string",
            "doc": "Name"
            },
            {
            "name": "create_time",
            "type": "string",
            "doc": "Creation time"
            }
        ]
    }
    ```

8. Если при запросе к внешней таблице Hive возникает ошибка `java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found`, найдите `hadoop-lzo-*.jar` в окружении Hadoop, поместите его в каталог `"${DORIS_HOME}/fe/lib/"` и перезапустите FE. Начиная с версии 2.0.2 этот файл можно помещать в каталог `custom_lib/` FE (если его нет, создайте вручную), чтобы избежать потери файла при обновлении кластера из-за замены каталога `lib`.

9. Если при создании таблицы Hive указан serde `org.apache.hadoop.hive.contrib.serde2.MultiDelimitserDe`, а при обращении к таблице возникает ошибка `storage schema reading not supported`, добавьте следующую конфигурацию в файл `hive-site.xml` и перезапустите сервис HMS:

    ```xml
    <property>
        <name>metastore.storage.schema.reader.impl</name>
        <value>org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader</value>
    </property>
    ```

10. Ошибка: `java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty`. Полное сообщение об ошибке в журнале FE выглядит следующим образом:

    ```
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path exception. path=s3://bucket/part-*, err: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.hadoop.fs.s3a.AWSClientIOException: listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: javax.net.ssl.SSLException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.lang.RuntimeException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    ```

    Попробуйте обновить сертификат CA на узле FE с помощью `update-ca-trust` (CentOS/RockyLinux), затем перезапустите процесс FE.

11. Ошибка BE: `java.lang.InternalError`. Если в `be.INFO` появляется ошибка, похожая на следующую:

    ```
    W20240506 15:19:57.553396 266457 jni-util.cpp:259] java.lang.InternalError
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.init(Native Method)
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.<init>(ZlibDecompressor.java:114)
            at org.apache.hadoop.io.compress.GzipCodec$GzipZlibDecompressor.<init>(GzipCodec.java:229)
            at org.apache.hadoop.io.compress.GzipCodec.createDecompressor(GzipCodec.java:188)
            at org.apache.hadoop.io.compress.CodecPool.getDecompressor(CodecPool.java:183)
            at org.apache.parquet.hadoop.CodecFactory$HeapBytesDecompressor.<init>(CodecFactory.java:99)
            at org.apache.parquet.hadoop.CodecFactory.createDecompressor(CodecFactory.java:223)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:212)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:43)
    ```

    Причина в конфликте встроенной в Doris библиотеки `libz.a` с системной `libz.so`. Для устранения проблемы сначала выполните `export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH`, затем перезапустите процесс BE.

12. При вставке данных в Hive возникает ошибка `HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]`.

    После вставки данных необходимо обновить соответствующую статистику, а для этой операции требуется привилегия ALTER. Поэтому предоставьте этому пользователю привилегию ALTER в Ranger.

13. При запросе к файлам ORC возникает ошибка вида
    `Orc row reader nextBatch failed. reason = Can't open /usr/share/zoneinfo/+08:00`.

    Сначала проверьте настройку `time_zone` текущего сеанса. Рекомендуется использовать название часового пояса, привязанное к региону, например `Asia/Shanghai`.

    Если часовой пояс сеанса уже установлен в `Asia/Shanghai`, но запрос по-прежнему завершается ошибкой, значит, файл ORC был создан с часовым поясом `+08:00`. Этот часовой пояс необходим при разборе нижнего колонтитула ORC во время выполнения запроса. В таком случае можно попробовать создать в каталоге `/usr/share/zoneinfo/` символическую ссылку, указывающую с `+08:00` на эквивалентный часовой пояс.

14. При запросе к таблице Hive, использующей JSON SerDe (например, `org.openx.data.jsonserde.JsonSerDe`), возникает ошибка: `failed to get schema` или `Storage schema reading not supported`

    Когда таблица Hive хранит данные в формате JSON (для ROW FORMAT SERDE задано `org.openx.data.jsonserde.JsonSerDe`), Hive Metastore может не получить информацию о схеме таблицы стандартным способом. В результате при запросе из Doris возникает следующая ошибка:

    ```
    errCode = 2, detailMessage = failed to get schema for table xxx in db xxx.
    reason: org.apache.hadoop.hive.metastore.api.MetaException:
    java.lang.UnsupportedOperationException: Storage schema reading not supported
    ```

    Чтобы решить проблему, добавьте `"get_schema_from_table" = "true"` в свойства Catalog. Этот параметр указывает Doris получать схему непосредственно из метаданных таблицы Hive, а не через Schema Reader базового хранилища.

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://x.x.x.x:9083',
        'get_schema_from_table' = 'true'
    );
    ```

    Этот параметр поддерживается начиная с версий 2.1.10 и 3.0.6.

15. При запросах к таблицам Hive Catalog планирование выполняется крайне медленно, возникает ошибка `nereids cost too much time`, а каждое обращение к HMS стабильно занимает много времени (например, около 10 секунд).

    **Анализ первопричины:**

    Обычно проблема не связана с медленным выполнением самого HMS RPC. Чаще всего причина заключается в **неверной конфигурации DNS на узле Doris FE**.
    На этапе инициализации Hive Metastore Client выполняется разрешение имён хостов. Если настроенный DNS-сервер недоступен или не отвечает, при каждом установлении нового клиентского соединения с HMS приходится ждать истечения тайм-аута разрешения DNS (обычно 10 секунд). Это существенно замедляет получение метаданных.

    **Характерные признаки:**

    - **Сетевое соединение работает:** порт HMS доступен, но обращение к метаданным в Doris остаётся крайне медленным.
    - **Постоянная задержка:** задержка стабильно достигает фиксированного порога тайм-аута (например, 10 секунд).
    - **Обходные решения не помогают:** увеличение тайм-аута клиента HMS в свойствах Catalog лишь скрывает ошибку, но не устраняет фиксированную задержку в 10 секунд при каждом подключении.

    **Порядок диагностики:**

    Выполните следующие команды на узле Doris FE, чтобы проверить DNS и разрешение имён хостов:

    ```bash
    # Check current DNS server configuration
    cat /etc/resolv.conf
    # Test if the DNS server is reachable and measure resolution latency
    ping <nameserver_ip>
    dig @<nameserver_ip> example.com
    dig @<nameserver_ip> -x <hms_ip>
    ```

    **Способы решения (выберите один):**
    1. **Исправьте конфигурацию DNS (рекомендуется):** исправьте записи `nameserver` в `/etc/resolv.conf` на узле Doris FE, чтобы служба DNS была доступна и отвечала быстро. Если DNS не требуется в вашей локальной сети, попробуйте закомментировать неработающие серверы имён.
    2. **Настройте статическое сопоставление имён хостов:** добавьте сопоставления IP-адресов и имён хостов узлов HMS в `/etc/hosts` на узле FE.
    3. **Приведите свойства Catalog к рекомендуемому виду:** при создании Catalog настоятельно рекомендуется указывать в свойстве `hive.metastore.uris` имя хоста, которое успешно разрешается, вместо IP-адреса.

16. Запросы к таблицам Hive Catalog иногда надолго зависают или сразу завершаются ошибкой тайм-аута оптимизатора `nereids cost too much time`, но последующие запросы сразу же работают нормально.

    **Описание проблемы:**

    Обычно это происходит после того, как Catalog некоторое время не использовался. Если при вызове HMS RPC повторно используется устаревшее соединение из пула, запрос зависает до истечения Socket Timeout (по умолчанию 10 с). Из-за внутреннего механизма повторных попыток Hive Client суммарное время ожидания может достигать 20-30 секунд при нескольких повторных попытках. Это сильно замедляет этап планирования запроса и часто вызывает ошибку тайм-аута оптимизатора Doris FE `nereids cost too much time`. После удаления и повторного создания соединения производительность возвращается к норме.

    **Анализ первопричины:**

    Doris поддерживает пул клиентов для каждого HMS Catalog, чтобы повторно использовать соединения. В сложных сетевых окружениях (например, между VPC, через межсетевые экраны или шлюзы NAT) сетевые устройства часто удаляют неактивные TCP-соединения без уведомления после истечения `idle timeout`. Поскольку эти устройства обычно не отправляют пакеты FIN/RST для уведомления конечных узлов, Doris по-прежнему считает соединение действительным. При повторном использовании такого «зомби-соединения» необходимо дождаться полного истечения Socket Timeout, прежде чем будет обнаружен сбой и запущена повторная попытка.

    **Порядок диагностики:**

    - Проверьте, есть ли между Doris FE и HMS межсетевые экраны, шлюзы NAT или балансировщики нагрузки.
    - Используйте инструмент диагностики **Pulse (hms-tools)**. Если инструмент показывает быстрое установление сетевого соединения, но после длительного простоя при выполнении RPC наблюдаются стабильные задержки, кратные 10 с, это подтверждает удаление неактивных соединений без уведомления.

    **Решение:**

    В свойствах Catalog задайте время жизни соединения немного меньше тайм-аута простоя сетевого устройства. Рекомендуется использовать встроенное свойство Hive для времени жизни сокета:

    ```sql
    CREATE CATALOG hive_catalog PROPERTIES (
        "type" = "hms",
        "hive.metastore.uris" = "thrift://<hms_host>:<port>",
        -- Set a value shorter than your network's idle timeout (e.g., 300s)
        "hive.metastore.client.socket.lifetime" = "300s"
    );
    ```

    Если параметр задан, HMS Client проверяет возраст соединения перед отправкой RPC. Если он превышает `lifetime`, клиент заранее переподключается, что позволяет избежать длительных зависаний и тайм-аутов оптимизатора из-за устаревших соединений.

## HDFS {#hdfs}

1. Если при обращении к HDFS 3.x возникает ошибка `java.lang.VerifyError: xxx`, учтите, что в версиях до 1.2.1 Doris зависит от Hadoop версии 2.8. Необходимо обновить Hadoop до 2.10.2 или обновить Doris до версии новее 1.2.2.

2. Использование Hedged Read для ускорения медленного чтения из HDFS. В некоторых случаях высокая нагрузка на HDFS увеличивает время чтения реплик данных в конкретной HDFS, что снижает общую эффективность запросов. HDFS Client предоставляет функцию Hedged Read. Если запрос на чтение не возвращает результат в течение заданного времени, эта функция запускает ещё один поток для чтения тех же данных. Используется результат, полученный первым.

    Примечание: эта функция может увеличить нагрузку на кластер HDFS, поэтому используйте её осмотрительно.

    Включить эту функцию можно следующим образом:

    ```sql
    CREATE CATALOG regression PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = '500'
    );
    ```

    `dfs.client.hedged.read.threadpool.size` задаёт количество потоков для Hedged Read, совместно используемых одним HDFS Client. Обычно узлы BE совместно используют один HDFS Client для кластера HDFS.
    
    `dfs.client.hedged.read.threshold.millis` задаёт порог времени чтения в миллисекундах. Если запрос на чтение не возвращает результат до достижения этого порога, запускается Hedged Read.
    
    После включения функции соответствующие параметры можно увидеть в Query Profile:
    
    `TotalHedgedRead`: количество запусков Hedged Read.
    
    `HedgedReadWins`: количество успешных Hedged Read (случаев, когда дополнительный запрос был запущен и вернул результат быстрее исходного).
    
    Обратите внимание: эти значения накапливаются для одного HDFS Client, а не для отдельного запроса. Один HDFS Client может повторно использоваться несколькими запросами.

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    В скриптах запуска FE и BE переменная окружения `HADOOP_CONF_DIR` добавляется в CLASSPATH. Если `HADOOP_CONF_DIR` задана неверно, например указывает на несуществующий или неправильный путь, может загрузиться не тот файл `xxx-site.xml`, что приведёт к чтению неверной информации.

    Проверьте правильность настройки `HADOOP_CONF_DIR` или удалите эту переменную окружения.

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    Возможные способы решения:
    - Проверьте состояние файла с помощью `hdfs fsck file -files -blocks -locations`.
    - Проверьте доступность DataNodes с помощью `telnet`.

        В журнале ошибок может появиться следующее сообщение:
        
        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```
        
        Сначала можно проверить доступность `10.70.150.122:50010` из кластера Doris.
        
        Кроме того, в некоторых случаях кластер HDFS использует две сети с внутренними и внешними IP-адресами. В таком случае для связи нужны доменные имена, а в свойства Catalog необходимо добавить: `"dfs.client.use.datanode.hostname" = "true"`.
        
        Также проверьте, установлено ли для этого параметра значение true в файле `hdfs-site.xml`, размещённом в `fe/conf` и `be/conf`.

    - Проверьте журналы DataNode.

        Если возникает следующая ошибка:

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```

        это означает, что в HDFS включено шифрование передачи данных, а на клиенте оно не включено, что и вызывает ошибку.

        Используйте любой из следующих способов решения:
        - Скопируйте `hdfs-site.xml` и `core-site.xml` в `fe/conf` и `be/conf`. (Рекомендуется)
        - В `hdfs-site.xml` найдите соответствующий параметр конфигурации `dfs.data.transfer.protection` и задайте его в Catalog.

5. При запросе к таблице Hive Catalog возникает ошибка: `RPC response has a length of xxx exceeds maximum data length`

    Например:

    ```
    RPC response has a length of 1213486160 exceeds maximum data length
    ```

    Значение `1213486160` в шестнадцатеричной системе равно `0x48545450`, что соответствует строке ASCII `"HTTP"`. Это означает, что Doris FE попытался подключиться к порту RPC HDFS NameNode, но получил HTTP-ответ.

    Причина в том, что порт HDFS NameNode в Catalog или в `hdfs-site.xml` настроен неверно: вместо порта RPC указан порт HTTP. HDFS NameNode обычно предоставляет два типа портов:

    - **Порт RPC** (по умолчанию: `8020` или `9000`): используется для взаимодействия с клиентами HDFS (именно этот порт нужен Doris).
    - **Порт HTTP** (по умолчанию: `9870` или `50070`): используется для веб-интерфейса NameNode.

    Проверьте настройку порта HDFS NameNode в свойствах Catalog или в `hdfs-site.xml` в каталогах `fe/conf` и `be/conf`. Убедитесь, что указан порт RPC (`dfs.namenode.rpc-address`), а не порт HTTP (`dfs.namenode.http-address`).

## DLF Catalog {#dlf-catalog}

1. Если при использовании DLF Catalog во время чтения данных JindoFS на BE возникает ошибка `Invalid address`, добавьте в `/etc/hosts` сопоставление доменного имени из журналов с IP-адресом.

2. Если нет разрешения на чтение данных, укажите пользователя с необходимыми разрешениями с помощью свойства `hadoop.username`.

3. Метаданные в DLF Catalog должны соответствовать метаданным DLF. При управлении метаданными через DLF новые импортированные партиции Hive могут не синхронизироваться с DLF, что приводит к расхождениям между метаданными DLF и Hive. Чтобы решить проблему, убедитесь, что DLF полностью синхронизирует метаданные Hive.

## Другие проблемы {#other-issues}

1. После сопоставления типа Binary с типом Doris результаты запроса содержат нечитаемые символы

    В Doris нет встроенной поддержки типа Binary, поэтому типы Binary из различных озёр данных и баз данных обычно сопоставляются с типом String. Тип String может отображать только печатные символы. Если необходимо запросить содержимое данных Binary, используйте функцию `TO_BASE64()`, чтобы преобразовать их в кодировку Base64 перед дальнейшей обработкой.

2. Анализ файлов Parquet

    При запросах к файлам Parquet иногда требуется проверить их метаданные, чтобы выявить проблему или проанализировать производительность. Это связано с возможными различиями в формате файлов Parquet, созданных разными системами, например в количестве RowGroups, значениях индексов и т. д. Для более удобного анализа файлов Parquet доступен следующий инструмент:

    1. Скачайте и распакуйте [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz).
    2. Скачайте файл Parquet для анализа на локальный компьютер; предположим, что он находится по пути `/path/to/file.parquet`.
    3. Используйте следующую команду для анализа метаданных файла Parquet:

        `./parquet-tools meta /path/to/file.parquet`

    4. Дополнительные возможности описаны в [документации Apache Parquet Cli](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli).

## Инструменты диагностики {#diagnostic-tools}

### Pulse {#pulse}

[Pulse](https://github.com/CalvinKirs/Pulse) представляет собой легковесный набор инструментов проверки соединений для диагностики инфраструктурных зависимостей в средах озёр данных. Он включает специализированные инструменты, которые помогают быстро выявлять проблемы окружения при доступе к внешним таблицам.

Pulse состоит из следующих основных наборов инструментов:

1.  **Инструмент диагностики HMS (`hms-tools`)**:
    *   Разработан специально для устранения неполадок Hive Metastore (HMS).
    *   Поддерживает проверки работоспособности, тесты ping, получение метаданных объектов и диагностику конфигурации.
    *   **Оценка производительности**: режим `bench` позволяет измерить распределение времени отклика и задержки HMS, чтобы определить, находится ли узкое место на уровне метаданных.

2.  **Инструмент диагностики Kerberos (`kerberos-tools`)**:
    *   Используется для проверки конфигураций `krb5.conf` в окружениях с аутентификацией Kerberos.
    *   Поддерживает проверку доступности KDC, просмотр файлов keytab и тестирование входа в систему, чтобы убедиться, что уровень безопасности не блокирует соединение.

3.  **Инструменты диагностики объектных хранилищ (`s3-tools`, `gcs-tools`, `azure-blob-cpp`)**:
    *   Инструменты диагностики основных облачных хранилищ (AWS S3, Google GCS, Azure Blob Storage).
    *   Используются для устранения распространённых проблем доступа к внешним таблицам, таких как "Access Denied" или "Bucket Not Found".
    *   Поддерживают проверку источников учётных данных и идентификаторов STS, а также тестирование операций на уровне бакета.

**Примеры команд (для HMS):**

```bash
# Test basic HMS connectivity and latency details using hms-tools
java -jar hms-tools.jar ping --uris thrift://<hms_host>:<port> --count 3 --verbose

# Benchmark actual metadata RPC response distribution using hms-tools
java -jar hms-tools.jar bench --uris thrift://<hms_host>:<port> --rpc get_all_databases --iterations 10
```

Если доступ к метаданным замедляется или не удаётся установить соединение с внешней таблицей, для диагностики рекомендуется использовать соответствующий инструмент Pulse в зависимости от типа проблемы (например, ошибка аутентификации, медленное получение метаданных или недоступность хранилища). Если этап `connect` проходит очень быстро, но в процессе инициализации в целом наблюдаются значительные и стабильные задержки, обратитесь к приведённым выше ответам на частые вопросы и проверьте настройки DNS и разрешения имён хостов на узле FE.
