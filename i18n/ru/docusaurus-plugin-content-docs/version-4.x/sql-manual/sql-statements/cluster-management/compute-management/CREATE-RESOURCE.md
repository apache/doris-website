---
{
    "title": "CREATE RESOURCE",
    "language": "ru",
    "description": "Эта инструкция используется для создания ресурса. Создавать ресурсы могут только пользователи root или admin. В настоящее время поддерживаются внешние ресурсы Spark, ODBC и S3."
}
---

## Описание {#description}

Эта инструкция используется для создания ресурса. Создавать ресурсы могут только пользователи root или admin. В настоящее время поддерживаются внешние ресурсы Spark, ODBC и S3.
В будущем в Doris могут быть добавлены и другие внешние ресурсы, например Spark/GPU для выполнения запросов, HDFS/S3 для внешнего хранения, MapReduce для ETL и т. д.

## Синтаксис {#syntax}

```sql
CREATE [EXTERNAL] RESOURCE "<resource_name>"
PROPERTIES (
   `<property>`
    [ , ... ]
);
```

## Параметры {#parameters}

1.`<property>`

`<property>` задаётся в формате `<key>` = `<value>`. Для `<key>` доступны следующие значения:

| Параметр | Описание | Обязательный |
| -- | -- | -- |
| `<type>` | Тип ресурса. Поддерживаются: spark/odbc_catalog/s3/jdbc/hdfs/hms/es. | Да |

Параметры PROPERTIES зависят от `<type>`. Подробности приведены в примерах.


## Примеры {#examples}

**1. Создание ресурса Spark с именем spark0 в кластерном режиме yarn.**

   ```sql
   CREATE EXTERNAL RESOURCE "spark0"
   PROPERTIES
   (
     "type" = "spark",
     "spark.master" = "yarn",
     "spark.submit.deployMode" = "cluster",
     "spark.jars" = "xxx.jar,yyy.jar",
     "spark.files" = "/tmp/aaa,/tmp/bbb",
     "spark.executor.memory" = "1g",
     "spark.yarn.queue" = "queue0",
     "spark.hadoop.yarn.resourcemanager.address" = "127.0.0.1:9999",
     "spark.hadoop.fs.defaultFS" = "hdfs://127.0.0.1:10000",
     "working_dir" = "hdfs://127.0.0.1:10000/tmp/doris",
     "broker" = "broker0",
     "broker.username" = "user0",
     "broker.password" = "password0"
   );
   ```

Параметры Spark:
   - spark.master: обязательный параметр; в настоящее время поддерживаются yarn и spark://host:port.
   - spark.submit.deployMode: режим развёртывания программы Spark; обязательный параметр, поддерживаются cluster и client.
   - spark.hadoop.yarn.resourcemanager.address: обязателен, если master имеет значение yarn.
   - spark.hadoop.fs.defaultFS: обязателен, если master имеет значение yarn.
   - Остальные параметры необязательны; см. [документацию](http://spark.apache.org/docs/latest/configuration.html)

   

   При использовании Spark для ETL необходимо указать Working_dir и broker. Описание параметров:

   - working_dir: каталог, используемый ETL. Обязателен, если spark используется как ресурс ETL. Например: hdfs://host:port/tmp/doris.
   - broker: имя broker. Обязателен, если spark используется как ресурс ETL. Необходимо заранее выполнить настройку с помощью команды `ALTER SYSTEM ADD BROKER`.
   - broker.property_key: данные аутентификации, которые необходимо указать для broker при чтении промежуточного файла, созданного ETL.

**2. Создание ресурса ODBC**

   ```sql
   CREATE EXTERNAL RESOURCE `oracle_odbc`
   PROPERTIES (
   "type" = "odbc_catalog",
   "host" = "192.168.0.1",
   "port" = "8086",
   "user" = "test",
   "password" = "test",
   "database" = "test",
   "odbc_type" = "oracle",
   "driver" = "Oracle 19 ODBC driver"
   );
   ```

   Параметры ODBC:
   - hosts: IP-адрес внешней базы данных
   - driver: имя драйвера внешней таблицы ODBC, которое должно совпадать с именем Driver в be/conf/odbcinst.ini.
   - odbc_type: тип внешней базы данных; в настоящее время поддерживаются oracle, mysql, postgresql
   - user: имя пользователя внешней базы данных
   - password: пароль соответствующего пользователя
   - charset: кодировка соединения
   - Также поддерживаются пользовательские параметры для каждого драйвера ODBC; см. описание соответствующего драйвера ODBC

**3. Создание ресурса S3**

   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- the followings are optional
      "s3.connection.maximum" = "50",
      "s3.connection.request.timeout" = "3000",
      "s3.connection.timeout" = "1000"
   );
   ```

   Если ресурс S3 используется для [разделения холодных и горячих данных](../../../../table-design/tiered-storage/overview), необходимо добавить дополнительные обязательные поля.
   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- required by cooldown
      "s3.root.path" = "/path/to/root",
      "s3.bucket" = "test-bucket"
   );
   ```

   Параметры S3:
   - Обязательные параметры
       - `s3.endpoint`: конечная точка s3
       - `s3.region`: регион s3
       - `s3.root.path`: корневой каталог s3
       - `s3.access_key`: ключ доступа s3
       - `s3.secret_key`: секретный ключ s3
       - `s3.bucket`：бакет s3
   - Необязательные параметры
       - `s3.connection.maximum`: максимальное количество подключений s3, по умолчанию 50
       - `s3.connection.request.timeout`: время ожидания запроса s3 в миллисекундах, по умолчанию 3000
       - `s3.connection.timeout`: время ожидания подключения s3 в миллисекундах, по умолчанию 1000

    Doris also supported `AWS Assume Role` for creating S3 Resource , please refer to [AWS integration](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

**4. Создание ресурса JDBC**

   ```sql
   CREATE RESOURCE mysql_resource PROPERTIES (
      "type"="jdbc",
      "user"="root",
      "password"="123456",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
      "driver_url" = "https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.25/mysql-connector-java-8.0.25.jar",
   "driver_class" = "com.mysql.cj.jdbc.Driver"
   );
   ```

   Параметры JDBC:
   - user：имя пользователя для подключения к базе данных
   - password：пароль для подключения к базе данных
   - jdbc_url: идентификатор для подключения к указанной базе данных
   - driver_url: URL пакета драйвера JDBC
   - driver_class: класс драйвера JDBC

**5. Создание ресурса HDFS**

   ```sql
   CREATE RESOURCE hdfs_resource PROPERTIES (
      "type"="hdfs",
      "hadoop.username"="user",
      "dfs.nameservices" = "my_ha",
      "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
      "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
      "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
      "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
   );
   ```

   Параметры HDFS:
   - fs.defaultFS: адрес и порт namenode
   - hadoop.username: имя пользователя hdfs
   - dfs.nameservices: если в hadoop включён HA, укажите службу имён файловой системы. См. hdfs-site.xml
   - dfs.ha.namenodes.[nameservice ID]：уникальные идентификаторы каждого NameNode в службе имён. См. hdfs-site.xml
   - dfs.namenode.rpc-address.[nameservice ID].[name node ID]`：полный RPC-адрес, на котором каждый NameNode ожидает подключения. См. hdfs-site.xml
   - dfs.client.failover.proxy.provider.[nameservice ID]：класс Java, который клиенты HDFS используют для обращения к активному NameNode; обычно это org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider

**6. Создание ресурса HMS**

   Ресурс HMS используется для создания [Catalog hms](../../../../lakehouse/catalogs/hive-catalog.mdx)
   ```sql
   CREATE RESOURCE hms_resource PROPERTIES (
      'type'='hms',
      'hive.metastore.uris' = 'thrift://127.0.0.1:7004',
      'dfs.nameservices'='HANN',
      'dfs.ha.namenodes.HANN'='nn1,nn2',
      'dfs.namenode.rpc-address.HANN.nn1'='nn1_host:rpc_port',
      'dfs.namenode.rpc-address.HANN.nn2'='nn2_host:rpc_port',
      'dfs.client.failover.proxy.provider.HANN'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
   );
   ```

   Параметры HMS:
   - hive.metastore.uris: адрес сервера hive metastore
   Необязательные параметры:
   - dfs.*: если данные hive находятся в hdfs, добавьте параметры ресурса HDFS или скопируйте hive-site.xml в fe/conf.
   - s3.*: если данные hive находятся в s3, добавьте параметры ресурса S3. При использовании [Aliyun Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf) скопируйте hive-site.xml в fe/conf.

**7. Создание ресурса ES**

   ```sql
   CREATE RESOURCE es_resource PROPERTIES (
      "type"="es",
      "hosts"="http://127.0.0.1:29200",
      "nodes_discovery"="false",
      "enable_keyword_sniff"="true"
   );
   ```

   Параметры ES:
   - hosts: адрес подключения к ES; можно указать один или несколько узлов. Также поддерживается балансировка нагрузки
   - user: имя пользователя ES
   - password: пароль пользователя
   - enable_docvalue_scan: использовать ли столбцовое хранилище ES/Lucene для получения значения поля запроса; по умолчанию true
   - enable_keyword_sniff: определять ли тип токенизации строк text.fields в ES и выполнять запрос по keyword (по умолчанию true; при false сопоставление выполняется с содержимым после токенизации)
   - nodes_discovery: включать ли обнаружение узлов ES; по умолчанию true. При сетевой изоляции установите этот параметр в false. Подключение выполняется только к указанному узлу
   - http_ssl_enabled: включён ли в кластере ES доступ по https; текущая реализация FE/BE доверяет всем сертификатам
