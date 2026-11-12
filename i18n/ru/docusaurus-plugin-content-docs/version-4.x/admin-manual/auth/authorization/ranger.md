---
{
    "title": "Авторизация Ranger-Doris",
    "language": "ru",
    "description": "Передайте управление правами Apache Doris в Apache Ranger: установка плагина, политики на уровне Catalog, баз данных, таблиц, столбцов и строк, маскирование данных, интеграция с Kerberos и распространённые проблемы.",
    "keywords": [
        "Apache Doris Ranger",
        "Doris Ranger authorization",
        "Ranger plugin installation",
        "ranger-doris-plugin",
        "ranger-doris-security.xml",
        "Doris permission management",
        "Doris column permissions",
        "Row Level Filter",
        "data masking",
        "Ranger Kerberos",
        "access_controller_type",
        "ranger-doris"
    ]
}
---

<!-- Knowledge type: configuration guide / permission management -->
<!-- Applicable scenario: use Apache Ranger to manage Apache Doris database, table, column, row-level, and masking permissions in one place -->

Apache Ranger — это платформа безопасности для мониторинга, включения сервисов и управления безопасным доступом к данным на платформе Hadoop. После включения Ranger в Apache Doris управление правами переносится из внутренних операторов `GRANT` Doris в централизованную конфигурацию Ranger. Это позволяет использовать общую систему прав для Hive, HDFS и других компонентов.

В этом документе описано, как установить и настроить плагин Ranger для Doris, а также как определить в Ranger глобальные политики, политики на уровне Catalog, баз данных, таблиц, столбцов и строк и политики маскирования данных.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Единое управление правами | Ranger уже используется для управления Hive/HDFS, и вы хотите применять тот же набор политик доступа в Doris |
| Детальная настройка прав | Вам нужна детальная настройка прав доступа к столбцам и строкам, а также маскирование конфиденциальных полей |
| Среда с Kerberos | В Ranger Admin включён Kerberos, и Doris должен получать политики с использованием учётных данных Kerberos |
| Замена внутренней авторизации | Вы хотите отказаться от внутренних операторов `GRANT/REVOKE` Doris и передать централизованное управление правами в Ranger |

## Предварительные требования {#prerequisites}

- Сервис Apache Ranger Admin развёрнут (рекомендуется версия 2.x или выше) и доступен по HTTP/HTTPS.
- Кластер Apache Doris развёрнут, и узлы FE/BE имеют доступ к сервису Ranger Admin.
- У вас есть учётная запись администратора Ranger WebUI для создания определений сервисов и политик.
- Для фильтрации строк и маскирования данных требуется Doris **2.1.3** или выше; для настройки прав на Compute Group и Storage Vault требуется Doris **3.0.6** или выше.

## Общий порядок настройки {#configuration-flow-overview}

1. Установите плагин Doris на сервер Ranger (загрузите Jar и определение сервиса в формате JSON).
2. Создайте сервис Doris в Ranger WebUI и укажите параметры подключения.
3. На стороне Doris FE настройте `access_controller_type=ranger-doris` и разместите файл `ranger-doris-security.xml`.
4. (Необязательно) Если в Ranger Admin включён Kerberos, объедините настройки в `krb5.conf` и добавьте параметры UGI в конфигурацию.
5. Перезапустите кластер Doris, настройте политики для пользователей в Ranger и проверьте их работу в Doris.

## Установка и настройка плагина Doris Ranger {#install-and-configure-the-doris-ranger-plugin}

### Установка плагина {#install-the-plugin}

1. Скачайте следующие файлы:

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/dev/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

    :::caution Примечание
    Необходимо скачать `ranger-doris-plugin-3.0.0-SNAPSHOT.jar` для соответствующей ветки, иначе плагин не будет работать.
    :::

2. Поместите скачанные файлы в каталог `ranger-plugins/doris` сервиса Ranger, например:

    ```text
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
    ```

3. Перезапустите сервис Ranger.

4. Скачайте [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json).

    :::caution Примечание
    Необходимо скачать `ranger-servicedef-doris.json` для соответствующей ветки, иначе плагин не будет работать.
    :::

5. Выполните следующую команду, чтобы загрузить файл определения сервиса в Ranger и зарегистрировать определение плагина Apache Doris:

    ```shell
    curl -u user:password -X POST \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        http://172.21.0.32:6080/service/plugins/definitions \
        -d@ranger-servicedef-doris.json
    ```

    Здесь:

    - Имя пользователя и пароль — это учётные данные для входа в Ranger WebUI.
    - Адрес и порт сервиса можно найти в параметре `ranger.service.http.port` файла конфигурации `ranger-admin-site.xml`.

    При успешном выполнении команда возвращает определение сервиса в формате JSON, например:

    ```json
    {
      "id": 207,
      "guid": "d3ff9e41-f9dd-4217-bb5f-3fa9996454b6",
      "isEnabled": true,
      "createdBy": "Admin",
      "updatedBy": "Admin",
      "createTime": 1705817398112,
      "updateTime": 1705817398112,
      "version": 1,
      "name": "doris",
      "displayName": "Apache Doris",
      "implClass": "org.apache.ranger.services.doris.RangerServiceDoris",
      "label": "Doris",
      "description": "Apache Doris",
      "options": {
        "enableDenyAndExceptionsInPolicies": "true"
      },
      ...
    }
    ```

    Чтобы создать определение заново, удалите его следующей командой и загрузите повторно (где `207` — это значение `id`, возвращённое при создании определения):

    ```shell
    curl -v -u user:password -X DELETE \
        http://172.21.0.32:6080/service/plugins/definitions/207
    ```

    Перед удалением необходимо удалить сервис Doris, ранее созданный в Ranger WebUI. Чтобы получить `id`, можно также вывести список зарегистрированных определений сервисов следующей командой:

    ```shell
    curl -v -u user:password -X GET \
        http://172.21.0.32:6080/service/plugins/definitions/
    ```

### Настройка плагина {#configure-the-plugin}

После установки откройте Ranger WebUI. На странице управления сервисами появится плагин Apache Doris:

![ranger](/images/ranger/ranger1.png)

Нажмите кнопку `+` рядом с плагином, чтобы добавить сервис Doris:

![ranger2](/images/ranger/ranger2.png)

Параметры раздела свойств конфигурации описаны ниже:

| Параметр | Описание |
| --- | --- |
| `Service Name` | Имя сервиса. Doris получает политики по этому имени, поэтому оно должно совпадать со значением `ranger.plugin.doris.service.name` в файле `ranger-doris-security.xml`. Рекомендуется `doris`. При несовпадении Doris не сможет получать политики, что приведёт к сбою аутентификации |
| `Username` / `Password` | Имя пользователя и пароль кластера Doris. Рекомендуется использовать пользователя с правами администратора |
| `jdbc.driver_class` | Драйвер JDBC для подключения к Doris, например `com.mysql.cj.jdbc.Driver` |
| `jdbc.url` | URL подключения JDBC к кластеру Doris, например `jdbc:mysql://172.21.0.101:9030?useSSL=false` |
| `resource.lookup.timeout.value.in.ms` | Дополнительный параметр: время ожидания получения метаданных. Рекомендуется `10000` (то есть 10 секунд) |

Для проверки подключения нажмите `Test Connection`.

:::info Примечание
Если Doris уже запущен и в файле `fe.conf` уже настроен параметр `access_controller_type=ranger-doris`, нажатие `Test Connection` вернёт `fail`. Это происходит потому, что сервис аутентификации Ranger ещё не создан и Doris не может получить политики. Такое поведение ожидаемо; продолжайте создание сервиса.
:::

Затем нажмите `Add`, чтобы добавить сервис. Созданный сервис появится под плагином Apache Doris на странице управления сервисами. Нажмите на сервис, чтобы приступить к настройке политик Ranger.

## Включение Ranger на стороне Doris {#enable-ranger-on-the-doris-side}

### Изменение конфигурации Doris {#change-the-doris-configuration}

1. В файле `fe/conf/fe.conf` установите Ranger в качестве способа аутентификации:

    ```text
    access_controller_type=ranger-doris
    ```

2. Создайте файл `ranger-doris-security.xml` в каталоге `conf` каждого узла FE со следующим содержимым:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
        <property>
            <name>ranger.plugin.doris.policy.cache.dir</name>
            <value>/path/to/ranger/cache/</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.pollIntervalMs</name>
            <value>30000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.connection.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.read.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.url</name>
            <value>http://172.21.0.32:6080</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.source.impl</name>
            <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
        </property>
        <property>
            <name>ranger.plugin.doris.service.name</name>
            <value>doris</value>
        </property>
    </configuration>
    ```

    Основные параметры конфигурации, которые необходимо изменить:

    | Параметр конфигурации | Описание |
    | --- | --- |
    | `ranger.plugin.doris.policy.cache.dir` | Каталог для файлов кеша прав, полученных с сервера Ranger. **Этот каталог необходимо создать вручную**; он должен существовать |
    | `ranger.plugin.doris.policy.rest.url` | Адрес сервиса Ranger Admin. Укажите фактический адрес |
    | `ranger.plugin.doris.service.name` | Должно совпадать с именем сервиса, созданного в Ranger WebUI. По умолчанию — `doris` |
    | `ranger.plugin.doris.policy.pollIntervalMs` | Интервал опроса для получения политик, в миллисекундах |

3. Запустите кластер.

### Настройка при включённом Kerberos на сервере Ranger {#configuration-when-ranger-server-has-kerberos-enabled}

<!-- Knowledge type: configuration parameters -->
<!-- Applicable scenario: Ranger Admin has Kerberos enabled / cross-realm authentication -->

Если в самом сервисе Ranger Admin включена аутентификация Kerberos, клиент Ranger в Doris должен проходить аутентификацию в Ranger Admin с использованием учётных данных Kerberos при получении политик. Иначе получить политики не удастся и аутентификация не будет работать. Необходимо выполнить два дополнительных шага настройки, описанных ниже.

#### 1. Объедините настройки krb5.conf {#1-merge-krb5conf}

При входе через Kerberos клиент Doris Ranger использует модуль JVM `Krb5LoginModule`, который считывает адрес KDC из файла **`/etc/krb5.conf` на каждом узле FE/BE**. Если в вашей среде одновременно используются несколько областей Kerberos (например, область кластера HDFS отличается от области кластера, в котором работает Ranger Admin), необходимо **объединить** сведения о KDC всех областей в один файл `/etc/krb5.conf` и разместить его на всех узлах FE и BE.

Пример объединённого файла `krb5.conf`:

```ini
[libdefaults]
    default_realm = HADOOP.EXAMPLE.COM
    dns_lookup_realm = true
    dns_lookup_kdc = true

[realms]
    # Realm of the HDFS / Hive cluster
    HADOOP.EXAMPLE.COM = {
        kdc = hadoop-kdc.example.com:88
        admin_server = hadoop-kdc.example.com
    }
    # Realm of the cluster where Ranger Admin runs (merge it in if it differs from the one above)
    RANGER.EXAMPLE.COM = {
        kdc = ranger-kdc.example.com:88
        admin_server = ranger-kdc.example.com
    }

[domain_realm]
    hadoop-kdc.example.com = HADOOP.EXAMPLE.COM
    ranger-admin.example.com = RANGER.EXAMPLE.COM
```

:::caution Примечание
После изменения или добавления файла `/etc/krb5.conf` необходимо перезапустить все узлы FE и BE, чтобы конфигурация вступила в силу.
:::

#### 2. Настройте Kerberos UGI в ranger-hive-security.xml (или ranger-doris-security.xml) {#2-configure-kerberos-ugi-in-ranger-hive-securityxml-or-ranger-doris-securityxml}

В каталоге `fe/conf/` каждого узла FE найдите (или создайте) файл `ranger-hive-security.xml` (при использовании аутентификации Hive Ranger) или `ranger-doris-security.xml` (при использовании аутентификации Doris Ranger) и добавьте следующие 4 параметра конфигурации внутрь `<configuration>`:

```xml
<!-- Enable UGI Kerberos login -->
<property>
    <name>ranger.plugin.hive.ugi.initialize</name>
    <value>true</value>
</property>
<!-- Login method: keytab -->
<property>
    <name>ranger.plugin.hive.ugi.login.type</name>
    <value>keytab</value>
</property>
<!-- Principal in the keytab file -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.principal</name>
    <value>hive/hostname@RANGER.EXAMPLE.COM</value>
</property>
<!-- Path to the keytab file (must be deployed to every FE node) -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.file</name>
    <value>/etc/security/keytabs/hive.keytab</value>
</property>
```

Назначение каждого параметра конфигурации:

| Параметр конфигурации | Описание |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Определяет, нужно ли инициализировать вход UGI через Kerberos при загрузке плагина |
| `ranger.plugin.hive.ugi.login.type` | Способ входа. Фиксированное значение — `keytab` |
| `ranger.plugin.hive.ugi.keytab.principal` | Principal, который действительно присутствует в файле keytab, например `hive/your-host@YOUR-REALM.COM`. Проверить его можно командой `klist -kt /path/to/hive.keytab` |
| `ranger.plugin.hive.ugi.keytab.file` | Абсолютный путь к файлу keytab. Убедитесь, что пользователь, от имени которого запущен процесс Doris FE, имеет право на чтение этого файла (рекомендуется `chmod 400`) |

:::tip Примечание
- При использовании **аутентификации Doris Ranger** (`ranger-doris-security.xml`) замените `hive` в приведённой выше конфигурации на `doris`, например `ranger.plugin.doris.ugi.initialize`.
- После завершения настройки необходимо **перезапустить FE**, чтобы изменения вступили в силу.
:::

:::warning Известное ограничение: перезапись глобального UGI при использовании нескольких Catalog
Встроенный в Doris плагин Ranger в настоящее время использует Hadoop `UserGroupInformation` (UGI) для входа через Kerberos. Поскольку процесс JVM обычно использует единое глобальное состояние пользователя, выполнившего вход, при настройке в Doris **нескольких Catalog с Ranger и включённым Kerberos** (с разными principal) состояния UGI перезаписывают друг друга.

**Как это проявляется**:

1. После инициализации Catalog A и входа с использованием `keytab_A` глобальный UGI соответствует `Principal_A`.
2. Затем инициализируется Catalog B и выполняется вход с использованием `keytab_B`, после чего глобальный UGI перезаписывается значением `Principal_B`.
3. Когда фоновый поток плагина Ranger для Catalog A получает политики доступа из Ranger Admin, он ошибочно использует билет `Principal_B`, что приводит к сбоям аутентификации и ошибкам получения политик.

**Текущая рекомендация**: для всех источников данных Kerberos с включённым Ranger в одном кластере Doris **планируйте конфигурацию совместно и используйте один и тот же principal Kerberos и один и тот же файл keytab**, чтобы избежать сбоев аутентификации из-за взаимной перезаписи.
:::

## Примеры настройки прав {#permission-examples}

<!-- Knowledge type: procedural steps -->
<!-- Applicable scenario: configure permissions at various levels for Doris users in Ranger -->

Чтобы предоставить права пользователю Doris, выполните следующие шаги:

1. Создайте `user1` в Doris.
2. В Doris сначала создайте от имени пользователя `admin` объект Catalog: `hive`.
3. Создайте `user1` в Ranger. В настоящее время Ranger не может автоматически синхронизировать пользователей из Doris, а Doris не может синхронизировать пользователей из Ranger, поэтому пользователей необходимо создавать вручную. **Достаточно использовать то же имя, что и в Doris**. Инструкции по созданию пользователя в Ranger приведены в официальной документации Ranger: создайте пользователя в разделе `Settings -> Users`.

Области действия прав, которые Ranger позволяет настроить для Doris, перечислены в следующей таблице:

| Область действия прав | Эквивалентный оператор GRANT в Doris | Способ выбора |
| --- | --- | --- |
| Глобальные права | `grant select_priv on *.*.* to user1` | Выберите `global` в раскрывающемся списке на том же уровне, что и Catalog; поле ввода принимает только `*` |
| Права на Catalog | `grant select_priv on hive.*.* to user1` | Выберите нужный Catalog в раскрывающемся списке Catalog |
| Права на базу данных | `grant select_priv on hive.tpch.* to user1` | Укажите Catalog и базу данных |
| Права на таблицу | `grant select_priv on hive.tpch.user to user1` | Укажите Catalog, базу данных и таблицу |
| Права на столбцы | `grant select_priv(name,age) on hive.tpch.user to user1` | Выберите столбцы в дополнение к настройкам прав на таблицу |
| Права на ресурс | `grant usage_priv on resource 'resource1' to user1` | Выберите `resource` в раскрывающемся списке на том же уровне, что и Catalog |
| Права на Workload Group | `grant usage_priv on workload group 'group1' to user1` | Выберите `workload group` в раскрывающемся списке на том же уровне, что и Catalog |
| Права на Compute Group (3.0.6+) | `grant usage_priv on compute group 'group1' to user1` | Выберите `compute group` в раскрывающемся списке на том же уровне, что и Catalog |
| Права на Storage Vault (3.0.6+) | `grant usage_priv on storage vault 'vault1' to user1` | Выберите `storage vault` в раскрывающемся списке на том же уровне, что и Catalog |

Ниже приведены примеры настройки Ranger для каждой области действия прав.

### Глобальные права {#global-permission}

Эквивалент внутреннего оператора авторизации Doris `grant select_priv on *.*.* to user1`:

- Параметр `global` доступен в раскрывающемся списке на том же уровне, что и Catalog.
- Поле ввода принимает только `*`.

![Глобальные права](/images/ranger/global.png)

### Права на Catalog {#catalog-permission}

Эквивалент внутреннего оператора авторизации Doris `grant select_priv on hive.*.* to user1`:

![Catalog](/images/ranger/catalog.png)

### Права на базу данных {#database-permission}

Эквивалент внутреннего оператора авторизации Doris `grant select_priv on hive.tpch.* to user1`:

![База данных](/images/ranger/database.png)

### Права на таблицу {#table-permission}

> Здесь под таблицей понимаются таблицы, представления и асинхронные материализованные представления.

Эквивалент внутреннего оператора авторизации Doris `grant select_priv on hive.tpch.user to user1`:

![Таблица](/images/ranger/table.png)

### Права на столбцы {#column-permission}

Эквивалент внутреннего оператора авторизации Doris `grant select_priv(name,age) on hive.tpch.user to user1`:

![Столбец](/images/ranger/column.png)

### Права на ресурс {#resource-permission}

Эквивалент внутреннего оператора авторизации Doris `grant usage_priv on resource 'resource1' to user1`:

- Параметр `resource` доступен в раскрывающемся списке на том же уровне, что и Catalog.

![Ресурс](/images/ranger/resource.png)

### Права на Workload Group {#workload-group-permission}

Эквивалент внутреннего оператора авторизации Doris `grant usage_priv on workload group 'group1' to user1`:

- Параметр `workload group` доступен в раскрывающемся списке на том же уровне, что и Catalog.

![group1](/images/ranger/group1.png)

### Права на Compute Group {#compute-group-permission}

> Поддерживается начиная с версии 3.0.6.

Эквивалент внутреннего оператора авторизации Doris `grant usage_priv on compute group 'group1' to user1`:

- Параметр `compute group` доступен в раскрывающемся списке на том же уровне, что и Catalog.

![Compute Group](/images/ranger/compute-group.png)

### Права на Storage Vault {#storage-vault-permission}

> Поддерживается начиная с версии 3.0.6.

Эквивалент внутреннего оператора авторизации Doris `grant usage_priv on storage vault 'vault1' to user1`:

- Параметр `storage vault` доступен в раскрывающемся списке на том же уровне, что и Catalog.

![Storage Vault](/images/ranger/storage-vault.png)

## Пример настройки прав на строки {#row-permission-example}

> Поддерживается начиная с версии 2.1.3.

1. Следуя разделу [Примеры настройки прав](#permission-examples), предоставьте `user1` право `select` на таблицу `internal.db1.user`.
2. Добавьте политику Row Level Filter в Ranger:

    ![Пример политики фильтрации строк](/images/ranger/ranger-row-policy.jpeg)

3. Войдите в Doris как `user1`. Выполните `select * from internal.db1.user`. Будут видны только строки, удовлетворяющие условиям `id > 3` и `age = 2`.

## Пример маскирования данных {#data-masking-example}

> Поддерживается начиная с версии 2.1.3.

1. Следуя разделу [Примеры настройки прав](#permission-examples), предоставьте `user1` право `select` на таблицу `internal.db1.user`.
2. Добавьте политику Masking в Ranger:

    ![Пример маскирования данных](/images/ranger/ranger-data-mask.png)

3. Войдите в Doris как `user1`. Выполните `select * from internal.db1.user`. Значение поля `phone` будет замаскировано в соответствии с указанным правилом.

## Распространённые проблемы {#common-issues}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: Ranger authentication failures / policy pull exceptions / log inspection -->

### Вопрос: доступ через Ranger не работает. Как просмотреть журналы? {#q-ranger-access-fails-how-can-i-view-the-logs}

Создайте файл `log4j.properties` в каталоге `conf` каждого FE со следующим содержимым:

```text
log4j.rootLogger = warn,stdout,D

log4j.appender.stdout = org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target = System.out
log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n

log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
log4j.appender.D.File = /path/to/fe/log/ranger.log
log4j.appender.D.Append = true
log4j.appender.D.Threshold = INFO
log4j.appender.D.layout = org.apache.log4j.PatternLayout
log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
```

Здесь:

- Укажите в `log4j.appender.D.File` фактический путь для хранения журналов плагина Ranger.
- При необходимости измените уровень журналирования `log4j.rootLogger` (например, на `debug` или `info`). Обратите внимание: уровень `debug` предназначен только для отладки и не должен использоваться в рабочей среде, иначе объём журналов станет очень большим, а производительность аутентификации снизится.

### Вопрос: политика Row Level Filter настроена, но при выполнении запроса пользователь получает ошибку доступа. Почему? {#q-a-row-level-filter-policy-is-configured-but-the-user-gets-a-permission-error-when-querying-why}

Политика Row Level Filter только ограничивает набор строк таблицы, доступных пользователю. **Пользователю также необходимо предоставить права через ACCESS POLICY**.

### Вопрос: после создания сервиса права по умолчанию есть только у пользователя `admin`, а у пользователя `root` их нет. Как это исправить? {#q-after-a-service-is-created-only-the-admin-user-has-permissions-by-default-and-the-root-user-does-not-how-do-i-fix-it}

Как показано на рисунке, при создании сервиса добавьте параметр `default.policy.users`. Чтобы предоставить полные права нескольким пользователям, разделите их имена символом `,`.

![Политика по умолчанию](/images/ranger/default-policy.png)

### Вопрос: продолжает ли работать внутренняя авторизация Doris после включения аутентификации Ranger? {#q-after-ranger-authentication-is-enabled-does-doris-internal-authorization-still-work}

Нет. Создавать и удалять роли также нельзя. Все права необходимо настраивать в Ranger.
