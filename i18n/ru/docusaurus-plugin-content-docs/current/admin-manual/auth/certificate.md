---
{
    "title": "Защищённая передача данных MySQL",
    "language": "ru",
    "description": "Руководство по настройке зашифрованных соединений SSL/TLS в Apache Doris: защищённая передача данных для клиента MySQL, односторонняя и взаимная аутентификация mTLS, создание сертификатов и подробное описание настроек."
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data transport encryption / Client identity authentication / Security compliance -->

В этом документе описано, как включить шифрование SSL/TLS для обмена данными между Apache Doris и клиентами MySQL. Рассматриваются быстрое включение шифрования, способы подключения клиентов, взаимная аутентификация mTLS, настройка собственных сертификатов и создание сертификатов.

## Сценарии применения {#applicable-scenarios}

| Сценарий | Рекомендуемый подход |
|------|----------|
| Шифрование передаваемых данных для обычных бизнес-задач | Включить одностороннюю аутентификацию (по умолчанию) |
| Соблюдение нормативных требований, например в финансовом секторе, государственных организациях и на предприятиях | Включить взаимную аутентификацию mTLS |
| Использование сертификатов, выданных внутренним корпоративным CA | Настроить собственные сертификаты |
| Быстрая проверка только в средах PoC или разработки | Использовать встроенные сертификаты Doris по умолчанию |

## Предварительные требования {#prerequisites}

- Кластер Apache Doris развёрнут и работает нормально
- Версия клиента MySQL >= 5.7.11 (в более ранних версиях клиента используется другой синтаксис параметров SSL)
- Поддерживаемые на данный момент версии протокола TLS: TLS 1.2 и TLS 1.3
- У вас есть права на изменение `conf/fe.conf` на узлах FE и на перезапуск FE

## Общий порядок действий {#process-overview}

1. Включите SSL в конфигурации FE (при повышенных требованиях к безопасности также включите mTLS)
2. Перезапустите FE, чтобы применить конфигурацию
3. Установите зашифрованное соединение с помощью клиента MySQL, указав параметр `--ssl-mode`
4. (Необязательно) Замените сертификаты по умолчанию собственными сертификатами

## Сравнение режимов аутентификации SSL {#ssl-authentication-mode-comparison}

<!-- Knowledge type: Architecture selection decision -->

Doris предоставляет два режима аутентификации SSL. Выберите режим в соответствии с требованиями безопасности:

| Режим аутентификации | Описание | Сценарий применения |
|----------|------|----------|
| Односторонняя аутентификация (по умолчанию) | Проверяется только сертификат сервера | Стандартные требования безопасности |
| Взаимная аутентификация (mTLS) | Проверяются сертификаты сервера и клиента | Повышенные требования безопасности |

## Быстрый старт: включение зашифрованного соединения SSL {#quick-start-enable-ssl-encrypted-connection}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: First-time SSL enablement / Quick verification with default certificates -->

Doris поставляется с файлами ключей и сертификатов по умолчанию, поэтому SSL можно включить без создания дополнительных сертификатов. Весь процесс состоит всего из двух шагов:

### Шаг 1: включите SSL на FE {#step-1-enable-ssl-on-fe}

Добавьте следующую настройку в конфигурационный файл FE `conf/fe.conf` и перезапустите FE:

```properties
enable_ssl = true
```

### Шаг 2: подключитесь с помощью клиента MySQL {#step-2-connect-using-the-mysql-client}

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

## Режимы SSL-соединения клиента {#client-ssl-connection-modes}

<!-- Knowledge type: Configuration parameters -->

Клиент MySQL управляет подключением с помощью параметра `--ssl-mode`. Доступны следующие режимы:

| Режим SSL | Описание | Пример команды |
|----------|------|----------|
| PREFERRED (по умолчанию) | Сначала пытается установить SSL-соединение, а при неудаче переходит к нешифрованному соединению | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | Отключает SSL и использует нешифрованное соединение | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | Требует использования SSL-соединения | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |
| VERIFY_CA | Требует использования SSL и проверяет CA сертификата сервера (используется в сценариях mTLS) | См. раздел [Настройка взаимной аутентификации (mTLS)](#configure-mutual-authentication-mtls) |

:::note Примечание
Параметр `--ssl-mode` появился в MySQL 5.7.11. Для клиентов MySQL более ранних версий см. [официальную документацию MySQL](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html).
:::

## Настройка взаимной аутентификации (mTLS) {#configure-mutual-authentication-mtls}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: High security requirements / Strong client identity verification -->

При использовании mTLS сервер проверяет подлинность клиента, а клиент проверяет сертификат сервера. Этот режим подходит для сценариев со строгими требованиями к проверке подлинности подключающейся стороны.

### Шаг 1: включите mTLS {#step-1-enable-mtls}

Добавьте следующие настройки в конфигурационный файл FE `conf/fe.conf` и перезапустите FE:

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### Шаг 2: подключитесь с клиента, используя сертификаты {#step-2-connect-from-the-client-using-certificates}

При подключении с использованием mTLS клиент должен указать сертификат CA, сертификат клиента и закрытый ключ:

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

### Сертификаты клиента по умолчанию {#default-client-certificates}

Doris предоставляет файлы сертификатов клиента по умолчанию в каталоге `Doris/conf/mysql_ssl_default_certificate/client_certificate/`:

| Имя файла | Описание |
|--------|------|
| `ca.pem` | Сертификат CA |
| `client-cert.pem` | Сертификат клиента |
| `client-key.pem` | Закрытый ключ клиента |

## Подробное описание настройки сертификатов {#certificate-configuration-details}

<!-- Knowledge type: Configuration parameters -->

Чтобы включить SSL в Doris, необходимо настроить ключ и сертификат CA, а также ключ и сертификат сервера. Для включения взаимной аутентификации необходимо дополнительно настроить ключ и сертификат клиента.

### Сертификаты по умолчанию {#default-certificates}

Doris поставляется с файлами сертификатов по умолчанию, которые можно использовать сразу:

| Тип сертификата | Путь по умолчанию | Пароль по умолчанию |
|----------|----------|----------|
| Сертификат CA | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Сертификат сервера | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Сертификат клиента | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### Собственные сертификаты {#custom-certificates}

Чтобы использовать собственные сертификаты, добавьте следующие настройки в конфигурационный файл FE `conf/fe.conf`.

**Настройка сертификата CA**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**Настройка сертификата сервера**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

:::tip Совет
Другие форматы сертификатов можно указать, изменив параметр `ssl_trust_store_type` в `conf/fe.conf`. Значение по умолчанию: `PKCS12`.
:::

## Создание собственных сертификатов {#generate-custom-certificates}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Use enterprise CA / Replace default certificates with self-signed certificates -->

Если вам нужны собственные сертификаты, их можно создать с помощью OpenSSL. Полный набор команд приведён в [официальной документации MySQL: создание сертификатов SSL](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html).

### Шаг 1: создайте ключи и сертификаты для CA, сервера и клиента {#step-1-generate-keys-and-certificates-for-ca-server-and-client}

```shell
# Generate the CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
    -key ca-key.pem -out ca.pem

# Generate the server-side certificate and sign it with the CA above
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate the client-side certificate and sign it with the CA above
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### Шаг 2: проверьте сертификаты {#step-2-verify-the-certificates}

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### Шаг 3: упакуйте в формат PKCS#12 {#step-3-package-as-pkcs12-format}

Объедините ключ и сертификат CA, а также ключ и сертификат сервера в отдельные файлы формата PKCS#12 (P12), чтобы Doris мог их использовать:

```shell
# Package the CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package the server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info Дополнительная информация
Подробнее о создании самоподписанных сертификатов с помощью OpenSSL см. в [официальной документации IBM](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl).
:::

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: SSL connection failure / Certificate configuration errors -->

### Вопрос: клиент сообщает, что параметр `--ssl-mode` не распознан. {#q-the-client-reports-that-the---ssl-mode-parameter-is-not-recognized}

Версия клиента MySQL ниже 5.7.11. Обновите клиент MySQL или найдите соответствующие параметры подключения в документации MySQL Connector/J.

### Вопрос: после включения `enable_ssl=true` клиент по-прежнему устанавливает нешифрованное соединение. {#q-after-enabling-enable_ssltrue-the-client-still-connects-with-a-plain-connection}

По умолчанию клиент использует режим `PREFERRED`, который не требует обязательного использования SSL. Укажите на клиенте `--ssl-mode=REQUIRED` или `VERIFY_CA`.

### Вопрос: не удаётся подключиться в режиме mTLS. {#q-connection-fails-in-mtls-mode}

Не указан сертификат клиента, сертификат CA или закрытый ключ либо неверно задан путь. Убедитесь, что `--ssl-ca`, `--ssl-cert` и `--ssl-key` указывают на правильные файлы сертификатов.

### Вопрос: не удаётся загрузить собственный сертификат. {#q-custom-certificate-fails-to-load}

Формат сертификата не соответствует `ssl_trust_store_type` или указан неверный пароль. Проверьте, имеет ли сертификат формат PKCS12, либо явно задайте `ssl_trust_store_type` и проверьте пароль.
