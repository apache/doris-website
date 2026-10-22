---
{
    "title": "Часто задаваемые вопросы о BI",
    "language": "ru",
    "description": "Обычно это связано с истечением времени ожидания при получении данных из источника в Power BI. При указании сервера и базы данных источника данных откройте дополнительные параметры,"
}
---

## Power BI {#power-bi}

### Q1. При получении данных через JDBC в Desktop Power BI возникает ошибка: "Timeout expired. The timeout period elapsed prior to completion of the operation or the server is not responding". {#q1-an-error-occurs-when-you-use-jdbc-to-pull-data-into--desktop-power-bi-timeout-expired-the-timeout-period-elapsed-prior-to-completion-of-the-operation-or-the-server-is-not-responding}

Обычно это связано с истечением времени ожидания при получении данных из источника в Power BI. При указании сервера и базы данных источника данных откройте дополнительные параметры и увеличьте время ожидания.

### Q2. При подключении к Power BI через JDBC в версии 2.1.x возникает ошибка: "An error happened while reading data from the provider: the given key was not present in the dictionary". {#q2-when-the-21x-version-uses-jdbc-to-connect-to-power-bi-an-error-occurs-an-error-happened-while-reading-data-from-the-provider-the-given-key-was-not-present-in-the-dictionary}

Сначала выполните в базе данных команду "show collation". Обычно отображается только utf8mb4_900_bin с набором символов utf8mb4. Основная причина этой ошибки заключается в том, что при подключении к Power BI требуется найти ID 33. Чтобы в таблице появились строки с ID 33, необходимо обновиться до версии 2.1.5 или более поздней.

### Q3. При подключении к Doris возникает ошибка: "Reading data from the provider times error index and count must refer to the location within the string". {#q3-connection-doris-times-error-reading-data-from-the-provider-times-error-index-and-count-must-refer-to-the-location-within-the-string}

Проблема возникает из-за того, что при подключении загружаются глобальные параметры, а имена столбцов SQL совпадают с их значениями.

```
SELECT
@@max_allowed_packet  as max_allowed_packet, @@character_set_client ,@@character_set_connection ,
@@license,@@sql_mode ,@@lower_case_table_names , @@autocommit ;
```

Можно отключить новый оптимизатор в текущей версии или обновиться до версии 2.0.7 либо 2.1.6 или более поздней.

### Q4. При подключении через JDBC в версии 2.1.x появляется сообщение об ошибке: "Character set 'utf8mb3' is not supported by.net.Framework". {#q4-jdbc-connection-version-21x-error-message-character-set-utf8mb3-is-not-supported-bynetframework}

Эта проблема часто встречается в версии 2.1.x. Если она возникает, необходимо обновить драйвер JDBC до версии 8.0.32.

## Tableau {#tableau}

### Q1. В версии 2.0.x Tableau сообщает, что не может подключиться к источнику данных, с кодом ошибки 37CE01A3. {#q1-version-20x-reports-that-tableau-cannot-connect-to-the-data-source-with-error-code-37ce01a3}

Отключите новый оптимизатор в текущей версии или обновитесь до версии 2.0.7 или более поздней.

### Q2. Ошибка подключения по SSL: protocol version mismatch Failed to connect to the MySQL server {#q2-ssl-connection-error-version-mismatch-failed-to-connect-to-the-mysql-server}

Эта ошибка возникает, когда в Doris включена аутентификация SSL, но при подключении не используется SSL. Необходимо отключить параметр enable_ssl в fe.conf.

### Q3. Ошибка подключения: Unsupported command(COM_STMT_PREPARED) {#q3-connection-error-unsupported-commandcom_stmt_prepared}

Установлена неподходящая версия драйвера MySQL. Установите драйвер подключения MySQL 5.1.x.
