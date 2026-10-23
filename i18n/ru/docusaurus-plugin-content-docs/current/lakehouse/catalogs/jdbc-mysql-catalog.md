---
{
    "title": "JDBC Catalog для MySQL",
    "language": "ru",
    "description": "JDBC Catalog в Doris поддерживает подключение к базам данных MySQL через стандартный интерфейс JDBC."
}
---

JDBC Catalog в Doris поддерживает подключение к базам данных MySQL через стандартный интерфейс JDBC. В этом документе описано, как настроить подключения к базам данных MySQL.

Обзор JDBC Catalog приведён в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных MySQL необходимы:

* MySQL версии 5.7, 8.0 или выше.

* Драйвер JDBC для MySQL, который можно скачать из [репозитория Maven](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j). Рекомендуется использовать MySQL Connector/J версии 8.0.31 или выше.

* Сетевое соединение между каждым узлом FE и BE Doris и сервером MySQL. Порт по умолчанию: 3306.

## Подключение к MySQL {#connecting-to-mysql}

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:mysql://host:3306',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

Параметр `jdbc_url` определяет сведения о подключении и параметры, передаваемые драйверу MySQL JDBC. Поддерживаемые параметры URL приведены в [руководстве разработчика MySQL](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html).

### Безопасность подключения {#connection-security}

Если пользователь настроил TLS с общедоверенным сертификатом, установленным на источнике данных, TLS между кластером и источником данных можно включить, добавив параметры к строке подключения JDBC, заданной в свойстве `jdbc_url`.

Например, в `MySQL Connector/J 8.0` для защиты соединения с помощью TLS используется параметр `sslMode`. По умолчанию он имеет значение PREFERRED, при котором соединение защищается, если TLS включён на сервере. Можно также задать значение REQUIRED: тогда подключение завершится ошибкой, если соединение TLS не будет установлено.

Для настройки добавьте параметр sslMode в `jdbc_url`:

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

Дополнительные сведения о параметрах настройки TLS приведены в [документации по безопасности MySQL JDBC](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode).

## Сопоставление иерархий {#hierarchical-mapping}

При сопоставлении с MySQL база данных в Doris соответствует базе данных в MySQL. Таблицы в базе данных Doris соответствуют таблицам в этой базе данных MySQL. Сопоставление выглядит следующим образом:

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | Сервер MySQL |
| База данных | База данных     |
| Таблица    | Таблица        |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип MySQL                           | Тип Doris                 | Примечание                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Doris не поддерживает беззнаковые типы данных, поэтому они сопоставляются с соответствующим типом данных большей разрядности в Doris.             |
| unsigned mediumint                   | int                        | То же, что выше.                                                                            |
| unsigned int                         | bigint                     | То же, что выше.                                                                            |
| unsigned bigint                      | largeint                   | То же, что выше.                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Если точность превышает максимальную точность, поддерживаемую Doris, используется String. Учтите, что при сопоставлении этого типа со String поддерживаются только запросы, а запись в MySQL невозможна. |
| date                                 | date                       |                                                                                |
| timestamp(S) | TIMESTAMPTZ(S) | Начиная с 4.1.5, этот тип всегда сопоставляется с `TIMESTAMPTZ(S)`. Свойство `enable.mapping.timestamp_tz` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `DATETIME`. Точность ограничена 6, поэтому более высокая точность теряется. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Doris не поддерживает тип year, поэтому он сопоставляется с типом smallint.                                       |
| time                                 | string                     | Doris не поддерживает тип time, поэтому он сопоставляется с типом string.                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | Для лучшего баланса между производительностью чтения и вычислений Doris сопоставляет тип json с типом string.                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Doris не поддерживает тип bit, поэтому bit(1) сопоставляется с boolean, а в остальных случаях со string.                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | VARBINARY | Начиная с 4.1.5, этот тип всегда сопоставляется с `VARBINARY`. Свойство `enable.mapping.varbinary` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `STRING`. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| прочие                                | UNSUPPORTED                |                                                                                |

## Приложение {#appendix}

### Проблемы с часовыми поясами {#time-zone-issues}

При доступе к данным через JDBC Catalog компонент JNI узла BE использует часовой пояс JVM. По умолчанию JVM использует часовой пояс машины, на которой развёрнут BE, что влияет на преобразование часовых поясов при чтении данных через JDBC. Чтобы обеспечить согласованность часовых поясов, рекомендуется в файле `be.conf` задать в `JAVA_OPTS` часовой пояс JVM, совпадающий со значением переменной сеанса Doris `time_zone`.

При чтении данных типа timestamp из MySQL добавьте в URL JDBC параметры `connectionTimeZone=LOCAL` и `forceConnectionTimeZoneToSession=true`. Эти параметры применимы к MySQL Connector/J версии 8 и выше. Они обеспечивают чтение времени в часовом поясе JVM узла Doris BE, а не в часовом поясе сервера MySQL.

## Распространённые проблемы {#common-issues}

### Устранение ошибок подключения {#connection-exception-troubleshooting}

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * Причины:

      * Проблемы с сетью:

          * Нестабильное сетевое соединение или его разрыв.

          * Высокая задержка сети между клиентом и сервером.

      * Настройки сервера MySQL

          * На сервере MySQL могут быть настроены параметры тайм-аута соединения, например `wait_timeout` или `interactive_timeout`, из-за которых соединение закрывается по истечении времени ожидания.

      * Настройки межсетевого экрана

          * Правила межсетевого экрана могут блокировать обмен данными между клиентом и сервером.

      * Настройки пула соединений

          * Настройка `connection_pool_max_life_time` в пуле соединений может приводить к закрытию или пересозданию соединения либо к несвоевременному поддержанию его активности.

      * Проблемы с ресурсами сервера

          * Серверу MySQL может не хватать ресурсов для обработки запросов на новые соединения.

      * Настройки клиента

          * Неверная настройка драйвера JDBC на клиенте, например параметр `autoReconnect` не задан или задан неправильно.

  * Решение

      * Проверьте сетевое соединение:

          * Обеспечьте стабильное сетевое соединение между клиентом и сервером без высоких задержек.

      * Проверьте настройки сервера MySQL:

          * Проверьте и скорректируйте параметры `wait_timeout` и `interactive_timeout` сервера MySQL, убедившись, что заданы разумные значения.

      * Проверьте настройки межсетевого экрана:

          * Убедитесь, что правила межсетевого экрана разрешают обмен данными между клиентом и сервером.

      * Скорректируйте настройки пула соединений:

          * Проверьте и скорректируйте параметр `connection_pool_max_life_time` пула соединений: он должен быть меньше значений параметров MySQL `wait_timeout` и `interactive_timeout` и больше максимального времени выполнения SQL.

      * Следите за ресурсами сервера:

          * Следите за использованием ресурсов сервера MySQL, чтобы их хватало для обработки запросов на соединение.

      * Скорректируйте настройки клиента:

          * Убедитесь, что параметры драйвера JDBC заданы правильно, например `autoReconnect=true`, чтобы соединение автоматически восстанавливалось после разрыва.

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * Причина: соединение было принудительно закрыто MySQL либо MySQL аварийно завершил работу

  * Решение: проверьте, есть ли в MySQL механизм принудительного закрытия соединений и не привёл ли большой запрос к аварийному завершению MySQL

### Другие проблемы {#other-issues}

1. Некорректное отображение эмодзи при чтении из MySQL и записи в MySQL

   Когда Doris выполняет запросы к MySQL, кодировка utf8 по умолчанию в MySQL соответствует utf8mb3 и не позволяет представлять эмодзи, для которых требуется 4-байтовая кодировка. Необходимо изменить кодировку MySQL на utf8mb4 для поддержки 4-байтовой кодировки.

   Можно изменить глобальные настройки

   ```text
   Modify the my.ini file in the mysql directory (for Linux systems, it is the my.cnf file in the etc directory)
   [client]
   default-character-set=utf8mb4

   [mysql]
   Set mysql default character set
   default-character-set=utf8mb4

   [mysqld]
   Set mysql character set server
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   init_connect='SET NAMES utf8mb4

   Modify the type of the corresponding table and column
   ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER TABLE table_name CHARSET=utf8mb4;
   SET NAMES utf8mb4
   ```

2. Исключение при чтении данных MySQL типа DATE/DATETIME

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   По умолчанию JDBC выбрасывает исключение при недопустимом значении DATE/DATETIME. Это поведение можно настроить с помощью параметра URL `zeroDateTimeBehavior`. Доступные значения: `exception`, `convertToNull`, `round`. Они соответственно означают: выбросить исключение; преобразовать в значение `NULL`; преобразовать в `"0001-01-01 00:00:00"`

   При создании Catalog добавьте `zeroDateTimeBehavior=convertToNull` в конец строки подключения JDBC, заданной в `jdbc_url`, например: `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`. В этом случае JDBC преобразует 0000-00-00 или 0000-00-00 00:00:00 в null, после чего Doris будет обрабатывать все столбцы типа Date/DateTime текущего Catalog как допускающие NULL, что позволит корректно читать данные.

3. Ошибка загрузки класса при чтении MySQL Catalog или другого JDBC Catalog, например `failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`

   Это происходит из-за неверного значения `driver_class`, указанного при создании Catalog. Необходимо указать правильное значение. Например, в приведённом выше сообщении ошибка связана с регистром символов. Следует указать `'driver_class' = 'com.mysql.cj.jdbc.Driver'`

4. Ошибка связи при чтении из MySQL

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  Проверьте журнал be.out узла BE. Если в нём есть следующие сообщения:

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  Добавьте `useSSL=false` в `jdbc_url`, например: `'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`.

* При запросе большого объёма данных из MySQL запрос может то выполняться успешно, то завершаться следующей ошибкой. При её возникновении все соединения с MySQL разрываются, и подключиться к серверу MySQL невозможно. Через некоторое время MySQL возвращается к нормальной работе, однако прежние соединения уже потеряны:

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  Такая ситуация может возникать из-за исчерпания памяти или ресурсов CPU сервера MySQL, из-за чего служба MySQL становится недоступной. Попробуйте увеличить объём памяти или выделить больше ресурсов CPU серверу MySQL.

* Если при выполнении запроса к MySQL результаты отличаются от результатов в базе данных MySQL

  Сначала проверьте, есть ли в полях запроса значения, различающиеся регистром. Например, если есть два значения `"aaa"` и `"AAA"` в поле `c_1` таблицы, а при инициализации базы данных MySQL не была явно включена чувствительность к регистру, то MySQL по умолчанию не различает регистр символов. Doris строго учитывает регистр, поэтому возникает следующая ситуация:

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```

  В этом случае выберите подходящий вариант в зависимости от требований:

  * Добавьте ключевое слово "BINARY" в запросы MySQL, чтобы принудительно учитывать регистр: `select count(c_1) from table where BINARY c_1 = "aaa";`

  * Либо укажите при создании таблицы в MySQL: `CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * Либо при инициализации базы данных MySQL задайте правила сравнения строк с учётом регистра:

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```

* Если запрос к MySQL надолго зависает и не возвращает результаты либо надолго зависает, а в fe.warn.log появляется большое количество записей о блокировках записи.

  Попробуйте добавить socketTimeout в URL, например: `jdbc:mysql://host:port/database?socketTimeout=30000`, чтобы клиент JDBC не ожидал бесконечно после закрытия соединения со стороны MySQL.

* Если при использовании MySQL Catalog объём памяти JVM или количество потоков FE постоянно растёт и не уменьшается, а одновременно может появляться ошибка Forward to master connection timed out

  Выведите стек потоков FE командой `jstack fe_pid > fe.js`. Если в нём много потоков `mysql-cj-abandoned-connection-cleanup`, это указывает на проблему с драйвером MySQL JDBC.

  Выполните следующие действия:

  * Обновите драйвер MySQL JDBC до версии 8.0.31 или выше

  * Добавьте параметр `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` в `JAVA_OPTS` файлов конфигурации FE и BE, чтобы отключить функцию очистки соединений драйвера MySQL JDBC, и перезапустите кластер

	Примечание: если используется Doris версии 2.0.13 и выше или 2.1.5 и выше, добавлять этот параметр не требуется, поскольку Doris уже по умолчанию отключает функцию очистки соединений драйвера MySQL JDBC. Достаточно заменить версию драйвера MySQL JDBC. Однако для завершения потоков, оставшихся из-за утечки, необходимо перезапустить кластер Doris.
