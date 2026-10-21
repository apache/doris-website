---
{
    "title": "JDBC Catalog для SQL Server",
    "language": "ru",
    "description": "Doris JDBC Catalog поддерживает подключение к базам данных SQL Server через стандартный интерфейс JDBC."
}
---

Doris JDBC Catalog поддерживает подключение к базам данных SQL Server через стандартный интерфейс JDBC. В этом документе описывается настройка подключения к базе данных SQL Server.

Общая информация о JDBC Catalog приведена в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных SQL Server необходимы:

* SQL Server 2012 или более поздней версии либо Azure SQL Database.

* Драйвер JDBC для базы данных SQL Server. Последнюю или определённую версию можно скачать из [Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc). Рекомендуется использовать SQL Server JDBC Driver версии 11.2.x или выше.

* Сетевое соединение между каждым узлом FE и BE в Doris и сервером SQL Server. Порт по умолчанию: 1433.

## Подключение к SQL Server {#connecting-to-sql-server}

```sql
CREATE CATALOG sqlserver_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwddd',
    'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false',
    'driver_url' = 'mssql-jdbc-11.2.3.jre8.jar',
    'driver_class' = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
)
```

`jdbc_url` задаёт сведения о подключении и параметры, передаваемые драйверу JDBC для SQL Server. Параметры, поддерживаемые в URL, описаны в [документации SQL Server JDBC Driver](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16).

### Безопасность подключения {#connection-security}

Драйвер JDBC и коннектор автоматически используют шифрование Transport Layer Security (TLS) и проверку сертификатов. Для этого на сервере базы данных SQL Server необходимо настроить соответствующие сертификаты TLS.

Если необходимая настройка не выполнена, можно отключить шифрование с помощью свойства encrypt в строке подключения:

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```

В разделе TLS [документации SQL Server JDBC Driver](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16) подробно описаны другие параметры, такие как `trustServerCertificate`, `hostNameInCertificate`, `trustStore` и `trustStorePassword`.

## Иерархическое сопоставление {#hierarchical-mapping}

При сопоставлении с SQLServer база данных в Doris соответствует схеме в указанной базе данных SQL Server (параметр `<databaseName>` в `jdbc_url`). Таблицы в базе данных Doris соответствуют таблицам в схеме SQLServer. Соответствие выглядит следующим образом:

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | База данных   |
| База данных | Схема     |
| Таблица    | Таблица      |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип SQL Server                        | Тип Doris    | Комментарий                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | Тип tinyint в SQLServer является беззнаковым, поэтому он сопоставляется с типом smallint в Doris |
| smallint                               | smallint      |                                                  |
| int                                    | int           |                                                  |
| bigint                                 | bigint        |                                                  |
| real                                   | float         |                                                  |
| float                                  | double        |                                                  |
| money                                  | decimal(19,4) |                                                  |
| smallmoney                             | decimal(10,4) |                                                  |
| decimal(P, S)/numeric(P, S)            | decimal(P, S) |                                                  |
| date                                   | date          |                                                  |
| datetime/datetime2/smalldatetime       | datetime(S)   |                                                  |
| char/varchar/text/nchar/nvarchar/ntext | string        |                                                  |
| time | string | |
| datetimeoffset | TIMESTAMPTZ(S) | Начиная с версии 4.1.5 этот тип сохраняет семантику абсолютного момента времени, а точность ограничена 6. |
| timestamp                              | string        | Отображается шестнадцатеричное представление двоичных данных без какого-либо смыслового значения |
| image/binary/varbinary | VARBINARY | Начиная с версии 4.1.5 этот тип всегда сопоставляется с `VARBINARY`. Свойство `enable.mapping.varbinary` сохранено для совместимости; значение `false` больше не восстанавливает сопоставление с `STRING`. В более ранних версиях это свойство позволяет выбрать прежний вариант сопоставления. |
| прочие                                  | UNSUPPORTED   |                                                  |

## Распространённые проблемы {#common-issues}

1. Ошибка проверки сертификата при подключении к SQL Server

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```

   При создании Catalog можно добавить `encrypt=false` в конец строки подключения JDBC, например: `"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. Ошибка TLS при подключении к SQL Server

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   Причина в несовпадении версий протокола TLS, используемых SQL Server и клиентом JDBC. Сервер SQL Server, к которому выполняется подключение, поддерживает только TLS 1.0, а в среде JAVA, где работает клиент JDBC, TLS 1.0 по умолчанию отключён.

   Для решения проблемы:

   1. Включите TLS 1.2 в SQL Server. См.: [Поддержка TLS 1.2 в SQL Server](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

   2. Включите TLS 1.0 в JDK.

   ```shell
   vim ${JAVA_HOME}/lib/security/java.security
   # Find this section
   jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
   include jdk.disabled.namedCurves

   # Remove TLSv1, TLSv1.1, change it to the following
   jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, anon, NULL, \
   include jdk.disabled.namedCurves
   ```
