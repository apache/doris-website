---
{
    "title": "Рекомендации по использованию Kerberos",
    "language": "ru",
    "description": "Когда пользователи выполняют в Doris федеративные аналитические запросы к нескольким источникам данных,"
}
---

Когда пользователи выполняют в Doris федеративные аналитические запросы к нескольким источникам данных, разные кластеры могут использовать разные учётные данные для аутентификации Kerberos.

Рассмотрим пример крупной компании по управлению фондами. Её внутренняя платформа данных разделена на несколько функциональных кластеров, которые обслуживают разные технические или бизнес-команды. Для каждого кластера настроены независимые Realm Kerberos для аутентификации и контроля доступа:

- Производственный кластер используется для ежедневного расчёта стоимости чистых активов и оценки рисков. Данные строго изолированы, доступ к ним разрешён только авторизованным службам (Realm: PROD.FUND.COM).
- Аналитический кластер используется для исследования стратегий и тестирования моделей на исторических данных. Doris выполняет разовые запросы к этому кластеру через TVF (Realm: ANALYSIS.FUND.COM).
- Кластер озера данных интегрирован с Iceberg Catalog для архивирования и анализа больших объёмов исторических рыночных данных, журналов и других данных (Realm: LAKE.FUND.COM).

Поскольку между этими кластерами не настроены междоменные доверительные отношения и они не могут совместно использовать данные аутентификации, для единого доступа к этим разнородным источникам данных требуется одновременная поддержка аутентификации и управления контекстом нескольких экземпляров Kerberos.

**В этом документе описаны настройка и доступ к источникам данных в средах с несколькими Kerberos.**

> Эта возможность поддерживается начиная с версии 3.1+

## Настройка аутентификации кластеров с несколькими Kerberos {#multi-kerberos-cluster-authentication-configuration}

### krb5.conf {#krb5conf}

`krb5.conf` содержит конфигурацию Kerberos, адреса KDC, некоторые **значения по умолчанию** для служб Kerberos и сведения о сопоставлении имён хостов с Realm.

При использовании krb5.conf убедитесь, что файл размещён на каждом узле. Путь по умолчанию: `/etc/krb5.conf`.

### realms {#realms}

Содержит сведения о KDC и сетях Kerberos для множества клиентов, например EXAMPLE.COM.

При настройке нескольких кластеров необходимо задать несколько Realm в одном файле `krb5.conf`. Для KDC и `admin_server` также можно указать доменные имена.

```
[realms]
EMR-IP.EXAMPLE = {
    kdc = 172.21.16.8:88
    admin_server = 172.21.16.8
}
EMR-HOST.EXAMPLE = {
    kdc = emr_hostname
    admin_server = emr_hostname
}
```

### domain_realm {#domain_realm}

Задаёт сопоставление доменов с Realm для узлов, на которых работают службы Kerberos.

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```

Например, для principal `emr1/domain_name@realm.com` при поиске KDC используется `domain_name`, чтобы определить соответствующий Realm. Если соответствие не найдено, найти KDC для этого Realm не удастся.

Обычно в файлах Doris `log/be.out` или `log/fe.out` встречаются два типа ошибок, связанных с `domain_realm`:

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```

### keytab и principal {#keytab-and-principal}

В средах с несколькими кластерами Kerberos для файлов keytab обычно используются разные пути, например: `/path/to/serverA.keytab`, `/path/to/serverB.keytab`. При обращении к разным кластерам необходимо использовать соответствующий файл keytab.

Если в кластере HDFS включена аутентификация Kerberos, в файле конфигурации обычно присутствует свойство `hadoop.security.auth_to_local` в `core-site.xml`. Оно используется для сопоставления principal Kerberos с короткими локальными именами пользователей, при этом Hadoop использует синтаксические правила Kerberos.

Если это свойство не задано, может возникнуть исключение `NoMatchingRule("No rules applied to`. См. код:

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

Параметр `hadoop.security.auth_to_local` содержит набор правил сопоставления, которые последовательно, сверху вниз, проверяют соответствие principal правилам RULE. Когда найдено подходящее правило, возвращается имя пользователя, а правила без совпадений игнорируются. Формат конфигурации:

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```

Для сопоставления principal, используемых разными службами Kerberos в средах с несколькими кластерами, рекомендуется следующая конфигурация:

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```

Приведённую выше конфигурацию можно использовать, чтобы добавить или заменить свойство `hadoop.security.auth_to_local` в `core-site.xml`. Поместите `core-site.xml` в `fe/conf` и `be/conf`, чтобы настройки применялись в среде Doris.

Если эти настройки нужно применить отдельно для OUTFILE, EXPORT, Broker Load, Catalog (Hive, Iceberg, Hudi), TVF и других возможностей, их можно задать непосредственно в соответствующих свойствах:

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```

Для проверки корректности правил сопоставления обратите внимание, возникает ли при доступе к разным кластерам следующая ошибка:

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```

Её появление означает, что сопоставление не удалось.

## Рекомендации {#best-practices}

В этом разделе описано, как с помощью среды Docker из [официального репозитория Apache Doris](https://github.com/apache/doris/tree/master/docker/thirdparties) запустить в Docker службы Hive/HDFS с Kerberos и создать в Doris Hive Catalog с поддержкой Kerberos.

### Описание среды {#environment-description}

* Используются службы Kerberos, предоставляемые Doris (два набора HIVE, два набора KDC):

  * Каталог запуска Docker: `docker/thirdparties`

  * Шаблон krb5.conf:

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. Подготовка файлов keytab и прав доступа {#1-prepare-keytab-files-and-permissions}

Скопируйте файлы keytab в локальный каталог:

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```

Задайте права доступа к файлам, чтобы избежать ошибки аутентификации:

```bash
chmod 400 ~/doris-keytabs/*.keytab
```

### 2. Подготовка файла krb5.conf {#2-prepare-krb5conf-file}

1. Используйте шаблон файла `krb5.conf`, предоставляемый Doris

2. Если требуется одновременный доступ к нескольким кластерам HDFS с Kerberos, необходимо **объединить настройки krb5.conf**, соблюдая основные требования:

   * `[realms]`: укажите Realm и IP-адреса KDC для всех кластеров.

   * `[domain_realm]`: укажите сопоставления доменов или IP-адресов с Realm.

   * `[libdefaults]`: задайте единые алгоритмы шифрования (например, des3-cbc-sha1).

3. Пример:

    ```toml
    [libdefaults]
        default_realm = LABS.TERADATA.COM
        allow_weak_crypto = true
        dns_lookup_realm = true
        dns_lookup_kdc = true

    [realms]
        LABS.TERADATA.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }
        OTHERREALM.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }

    [domain_realm]
        presto-master.docker.cluster = LABS.TERADATA.COM
        hadoop-master-2 = OTHERREALM.COM
        .labs.teradata.com = LABS.TERADATA.COM
        .otherrealm.com = OTHERREALM.COM
    ```

4. Скопируйте `krb5.conf` в соответствующий каталог Docker:

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```

### 3. Запуск среды Docker с Kerberos {#3-start-docker-kerberos-environment}

1. Перейдите в каталог:

    ```bash
    cd docker/thirdparties
    ```

2. Запустите среду Kerberos:

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```

3. После запуска доступны следующие службы:

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. Получение IP-адреса контейнера {#4-get-container-ip}

Используйте команду для просмотра IP-адреса Docker:

```bash
docker inspect <container-name> | grep IPAddress
```

Или используйте 127.0.0.1 напрямую (при условии, что служба доступна через сеть хоста).

### 5. Создание Hive Catalog с поддержкой Kerberos {#5-create-kerberos-hive-catalog}

1. Hive Catalog1

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_one
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9583",
    "fs.defaultFS" = "hdfs://127.0.0.1:8520",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@LABS.TERADATA.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@LABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master@LABS.TERADATA.COM"
    );
    ```

2. Hive Catalog2

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_two
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9683",
    "fs.defaultFS" = "hdfs://127.0.0.1:8620",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@OTHERREALM.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/other-hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master-2@OTHERREALM.COM"
    );
    ```

На этом настройка доступа к кластерам с несколькими Kerberos завершена. Вы можете просматривать данные обоих кластеров Hive, используя разные учётные данные Kerberos.
## Инструмент проверки подключений {#connectivity-testing-tool}

Для проверки подключения к внешним зависимостям, таким как Kerberos,
можно использовать инструмент с открытым исходным кодом **Pulse**.

**Pulse представляет собой самостоятельный инструмент с открытым исходным кодом для проверки подключений.
Инструкции по использованию, сведения об установке и выпусках
приведены в документации проекта.**

- Документация: [Инструмент проверки подключения к Kerberos](https://github.com/CalvinKirs/Pulse/tree/main/kerberos-tools)
- Пакет выпуска: [Инструмент проверки подключения к Kerberos v1.0.0](https://github.com/CalvinKirs/Pulse/releases/tag/v1.0.0)
## Часто задаваемые вопросы {#faq}
1. javax.security.sasl.SaslException: No common protection layer between client and server
   - Причина: значение `hadoop.rpc.protection` на клиенте отличается от настройки кластера HDFS.
   - Решение: согласуйте значение `hadoop.rpc.protection` на клиенте и сервере HDFS.

2. No valid credentials provided (Mechanism level: Illegal key size)
   - Причина: по умолчанию Java не поддерживает ключи шифрования длиной более 128 бит.
   - Решение: установите Java Cryptography Extension (JCE) Unlimited Strength Policy; распакуйте JAR-файлы в `$JAVA_HOME/jre/lib/security` и перезапустите службы.

3. Encryption type AES256 CTS mode with HMAC SHA1-96 is not supported/enabled
   - Причина: в текущей среде Java отсутствует поддержка AES256, хотя Kerberos может использовать этот алгоритм.
   - Решение: обновите `/etc/krb5.conf`, указав в `[libdefaults]` поддерживаемый алгоритм шифрования, или установите расширение JCE для включения AES256 (как описано выше).

4. No valid credentials provided (Mechanism level: Failed to find any Kerberos tgt)
   - Причина: Kerberos не может найти действительный билет Ticket Granting Ticket (TGT). Если конфигурация ранее работала, срок действия билета истёк или KDC был перезапущен. При новой настройке файл `krb5.conf` или keytab некорректен либо повреждён.
   - Решение: проверьте `krb5.conf` и файл keytab, убедитесь, что билеты действительны, и попробуйте выполнить `kinit` для получения нового билета.

5. Failure unspecified at GSS-API level (Mechanism level: Checksum failed)
   - Причина: ошибка контрольной суммы GSS-API; при выполнении `kinit` использован неверный пароль; файл keytab недействителен или содержит устаревшую версию ключа, поэтому JVM переходит к входу по паролю.
   - Решение: используйте правильный пароль при выполнении `kinit` и убедитесь, что файл keytab актуален и действителен.

6. Receive timed out
   - Причина: обмен данными с KDC идёт по UDP при нестабильном соединении или передаче больших пакетов.
   - Решение: принудительно включите использование TCP для Kerberos, добавив в `/etc/krb5.conf`:
```shell
[libdefaults]
udp_preference_limit = 1
```

7. javax.security.auth.login.LoginException: Unable to obtain password from user
   - Причина: principal не соответствует файлу keytab либо приложение не может прочитать `krb5.conf` или файл keytab.
   - Решение:
      - Используйте `klist -kt <keytab_file>` и `kinit -kt <keytab_file> <principal>` для проверки файла keytab и principal.
      - Проверьте пути и права доступа к `krb5.conf` и файлу keytab, чтобы пользователь, от имени которого работает приложение, мог их читать.
      - Убедитесь, что в параметрах запуска JVM указаны правильные пути к файлам конфигурации.

8. Principal not found or Could not resolve Kerberos principal name
   - Причины:
      - Не удаётся разрешить имя хоста, указанное в principal.
      - Заполнитель `_HOST` подставляет имя хоста, неизвестное KDC.
      - DNS или `/etc/hosts` настроены неправильно.
   - Решение:
      - Проверьте правильность написания principal.
      - Убедитесь, что на всех задействованных узлах (Doris FE/BE и KDC) правильно заданы сопоставления имён хостов с IP-адресами.

9. Cannot find KDC for realm "XXX"
   - Причина: для указанного Realm не настроен KDC в `krb5.conf`.
   - Решение:
      - Проверьте имя Realm в разделе `[realms]`.
      - Убедитесь, что адрес `kdc` указан правильно.
      - Перезапустите BE и FE после изменения `/etc/krb5.conf`.

10. Request is a replay
   - Причина: KDC считает запрос аутентификации повторным. Типичные причины: расхождение времени между узлами или использование одного principal несколькими службами.
   - Решение:
      - Включите NTP на всех узлах для синхронизации времени.
      - Используйте уникальный principal для каждого экземпляра службы, например `service/_HOST@REALM`, чтобы избежать совместного использования.

11. Client not found in Kerberos database
   - Причина: principal клиента отсутствует в базе данных Kerberos.
   - Решение: создайте principal в KDC.

12. Message stream modified (41)
   - Причина: известная проблема некоторых ОС (например, CentOS 7) при определённых сочетаниях Kerberos и Java.
   - Решение: установите исправления поставщика или обновления безопасности.

13. Pre-authentication information was invalid (24)
   - Причины:
      - Некорректные данные предварительной аутентификации.
      - Расхождение времени между клиентом и KDC.
      - Настройки шифрования JDK не соответствуют настройкам KDC.
   - Решение:
      - Синхронизируйте время на всех узлах.
      - Согласуйте настройки шифрования.
