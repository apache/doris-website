---
{
    "title": "Авторизация Ranger-Hive",
    "description": "Настройка авторизации Ranger-Hive для Hive Catalog в Doris, включая Kerberos, политики, фильтрацию строк и маскирование.",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Авторизация Hive Catalog",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "фильтр строк",
        "маскирование данных",
        "Авторизация Doris Hive Catalog через Ranger",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml не найден",
        "Ошибка загрузки политик Ranger Hive",
        "Doris 4.x Ranger Hive"
    ]
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris позволяет назначить Ranger-Hive Access Controller отдельному Hive Catalog. После этого Doris использует политики Hive, уже управляемые в Apache Ranger, для авторизации доступа к базам данных, таблицам и столбцам этого Catalog. Также поддерживаются фильтры Ranger на уровне строк, маскирование данных и аудит.

Используйте этот режим, если ваша организация уже управляет разрешениями Hive в Ranger и хочет применять те же политики к запросам Doris к этим данным.

Ranger-Hive контролирует только те Hive Catalog, для которых настроен этот Access Controller. Он не заменяет авторизацию на уровне кластера Doris и не применяет политики Ranger для базовых систем хранения HDFS, S3 или других хранилищ.

## Сценарии использования {#use-cases}

| Сценарий | Поддерживается | Описание |
| --- | --- | --- |
| Использование существующих политик Ranger Hive для данных Hive, запрашиваемых через Doris | Да | Настройте Ranger-Hive Access Controller для соответствующего Hive Catalog |
| Централизованное управление разрешениями всего кластера Doris через Ranger | Нет | Используйте Ranger-Doris |
| Авторизация доступа к базовому хранилищу HDFS или S3 | Нет | Настройте контроль доступа и изоляцию учётных данных в системе хранения |
| Настройка авторизации Ranger для Catalog, не использующего Hive/HMS | Нет | Ranger-Hive применяется только к Hive/HMS Catalog |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris и Ranger-Hive {#ranger-doris-and-ranger-hive}

Ranger-Doris и Ranger-Hive решают разные задачи:

| Параметр | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| Основное назначение | Централизованное управление разрешениями кластера Doris в Ranger | Применение существующих политик Ranger Hive к определённому Hive Catalog |
| Включение | Параметр FE `access_controller_type=ranger-doris` | Свойство Catalog `access_controller.class` |
| Тип сервиса Ranger | Doris; требуются плагин Doris Ranger и определение сервиса | Hive; используется встроенное определение сервиса Hive в Ranger |
| Иерархия ресурсов | Ресурсы Doris: Global, Catalog, Database, Table, Column и другие | Ресурсы Hive: Database, Table и Column |
| Область действия | Access Controller по умолчанию для кластера Doris | Только внешний Catalog, в котором объявлен этот контроллер |
| Совместное использование политик | Политики Doris не преобразуются в политики Hive | Политики Hive не считывают политики Ranger-Doris |

Оба решения можно использовать в одном кластере Doris. Например, Ranger-Doris может быть Access Controller по умолчанию, а `hive_ctl` может использовать Ranger-Hive. Если для Hive Catalog включён Ranger-Hive, запросы направляются на проверку следующим образом. Под «Access Controller по умолчанию» может подразумеваться встроенная авторизация Doris или Ranger-Doris.

### Границы авторизации {#authorization-boundaries}

| Область разрешений | Контроллер | Примечания |
| --- | --- | --- |
| Global | Access Controller по умолчанию | В Ranger-Hive нет ресурса Doris Global |
| Catalog | Access Controller по умолчанию | В Ranger Hive нет ресурса Doris Catalog |
| База данных | Ranger-Hive текущего Catalog | Ресурс Ranger задаётся именем базы данных Hive |
| Таблица / представление | Ranger-Hive текущего Catalog | Ресурс Ranger задаётся именами базы данных и таблицы Hive |
| Столбец | Ranger-Hive текущего Catalog | Каждый столбец, на который ссылается запрос, проверяется отдельно |
| Фильтрация на уровне строк | Ranger-Hive текущего Catalog | Doris получает выражение фильтра из Ranger; политики не применяются к `root` и `admin` |
| Маскирование данных | Ranger-Hive текущего Catalog | Doris получает правило маскирования столбца из Ranger; политики не применяются к `root` и `admin` |
| Resource, Storage Vault, Compute Group | Access Controller по умолчанию | Эти ресурсы не входят в модель Ranger-Hive |
| HDFS, S3 и другие хранилища | Не проверяются Ranger-Hive | Doris по-прежнему считывает данные с учётными данными хранилища, настроенными для Catalog |

:::warning
Если Access Controller по умолчанию предоставляет соответствующее разрешение Global, итоговая проверка доступа к базе данных, таблице или столбцу проходит успешно, даже если Ranger-Hive запрещает доступ к ресурсу. Проверяйте запрещающие политики под обычным пользователем, у которого нет ни `ADMIN_PRIV`, ни разрешения Global `SELECT_PRIV`; не используйте `root` или `admin`.
:::

## Предварительные требования {#prerequisites}

- Ranger Admin развёрнут и доступен с каждого FE Doris.
- В Ranger существует сервис Hive. В этом руководстве в качестве имени сервиса используется `hive_prod`.
- У вас есть разрешение на создание пользователей и Catalog в Doris. Ranger выполняет авторизацию; он не создаёт пользователей Doris и не проверяет их пароли при аутентификации.
- Для Hive Catalog уже настроены сетевые подключения, аутентификация и разрешения, необходимые для доступа к Hive Metastore и базовому хранилищу.
- Каждый FE может читать файлы конфигурации Ranger. Если настроен локальный кеш политик, пользователь процесса FE может создавать его каталог или записывать в него данные.

## Обзор настройки {#configuration-overview}

В следующей процедуре используются сервис Hive `hive_prod` в Ranger WebUI, Catalog Doris `hive_ctl` и пользователь `alice`:

1. Проверьте наличие сервиса Hive `hive_prod` в Ranger WebUI или создайте его.
2. Разместите `ranger-hive-security.xml` и `ranger-hive-audit.xml` на каждом FE, создайте каталог кеша политик и перезапустите все FE.
3. Создайте пользователя Doris `alice` и Hive Catalog `hive_ctl` с включённым Ranger-Hive.
4. Создайте политику доступа для `alice` в сервисе Ranger `hive_prod`.
5. Войдите в Doris под пользователем `alice` и проверьте как разрешённый, так и запрещённый доступ.

Если Ranger Admin использует Kerberos или HTTPS, сначала выполните базовую настройку, а затем примените соответствующие настройки безопасности, описанные далее в этом руководстве.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Настройка сервиса Ranger и FE {#configure-the-ranger-service-and-fes}

### Проверка сервиса Ranger Hive {#confirm-the-ranger-hive-service}

На странице управления сервисами в Ranger WebUI проверьте наличие сервиса Hive или создайте его:

| Поле Ranger WebUI | Пример | Описание |
| --- | --- | --- |
| Тип сервиса | `Hive` | Используйте определение сервиса Hive в Ranger; плагин Doris Ranger не требуется |
| Имя сервиса | `hive_prod` | Экземпляр сервиса Ranger, в котором хранятся политики Hive |

Если HiveServer2 уже использует `hive_prod`, Doris может считывать те же политики. Не создавайте отдельный сервис только для Doris.

### Подготовка файлов конфигурации на всех FE {#prepare-the-configuration-files-on-all-fes}

Разместите следующие файлы в каталоге `fe/conf/` каждого FE:

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

Размещайте `ranger-hive-security.xml` и `ranger-hive-audit.xml` вместе. Сохраните файл аудита и явно отключите аудит, даже если он не нужен, чтобы Ranger 2.7 не переходил к устаревшему резервному механизму настройки аудита. `ranger-policymgr-ssl.xml` нужен только в том случае, если Ranger Admin использует HTTPS с пользовательским truststore или клиентским сертификатом.

#### Настройка ranger-hive-security.xml {#configure-ranger-hive-securityxml}

Сохраните следующие шаблоны в `fe/conf/` на каждом FE и замените имя сервиса, адрес и пути.

Пример `ranger-hive-security.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- The Hive Service Name in Ranger WebUI -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <!-- Set an absolute ranger-policymgr-ssl.xml path for HTTPS; otherwise leave empty -->
    <property>
        <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
        <value></value>
    </property>
</configuration>
```

Свойства в `ranger-hive-security.xml`:

| Свойство | Обязательно | По умолчанию | Описание |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | Да | Нет | Его `<value>` должно точно совпадать с именем сервиса Hive в Ranger WebUI, например `hive_prod` |
| `ranger.plugin.hive.policy.source.impl` | Нет | REST-клиент Ranger Admin | Реализация, используемая для получения политик |
| `ranger.plugin.hive.policy.rest.url` | Да | Нет | Корневой URL Ranger Admin без пути к API политик |
| `ranger.plugin.hive.policy.cache.dir` | Обязательно для описанной в этом руководстве настройки рабочей среды | Локальный кеш отсутствует | В шаблоне указан пример пути; заранее создайте каталог и предоставьте пользователю процесса FE доступ на запись |
| `ranger.plugin.hive.policy.pollIntervalMs` | Нет | `30000` миллисекунд | Интервал опроса политик |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | Нет | `120000` миллисекунд | Тайм-аут подключения к Ranger Admin; в шаблоне он переопределён на `60000` миллисекунд |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | Нет | `30000` миллисекунд | Тайм-аут чтения ответа Ranger Admin; в шаблоне он переопределён на `60000` миллисекунд |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | Обязательно для пользовательской настройки доверия HTTPS | Пусто | Абсолютный путь к `ranger-policymgr-ssl.xml` |

#### Создание каталога кеша политик {#create-the-policy-cache-directory}

Используйте отдельные пути `policy.cache.dir` для Ranger-Doris и Ranger-Hive, например `/var/lib/doris/ranger/doris_prod/policy-cache` и `/var/lib/doris/ranger/hive_prod/policy-cache`. Catalog, использующие один и тот же сервис Ranger Hive, считывают общую конфигурацию плагина Hive и общий кеш.

В примере используется `/var/lib/doris/ranger/hive_prod/policy-cache`. Выполните следующие команды на каждом FE от имени `root` или добавьте `sudo`:

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

В командах предполагается, что FE работает от имени пользователя и группы `doris:doris`. Замените их фактическими пользователем и группой процесса. Проверьте доступ на запись с помощью `sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache`; если `sudo` недоступен, выполните аналогичную проверку от имени пользователя процесса FE.

#### Настройка ranger-hive-audit.xml {#configure-ranger-hive-auditxml}

В этом руководстве аудит Ranger по умолчанию отключён. Даже при отключённом аудите сохраните следующий файл `fe/conf/ranger-hive-audit.xml` на каждом FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` отключает вывод записей аудита авторизации Ranger. Для аудита в рабочей среде возьмите за основу шаблон аудита Hive для вашей версии Ranger, настройте централизованную систему хранения, например Solr, HDFS или Kafka, и задайте свойству значение `true`. Log4j не рекомендуется в качестве места назначения аудита в рабочей среде, поскольку к записям аудита применяется общая политика ротации журналов FE, из-за чего сложно независимо управлять сроком их хранения и общим размером.

#### Перезапуск FE {#restart-the-fes}

После настройки XML-файлов и каталога кеша перезапустите каждый FE перед созданием Catalog. Конфигурация Ranger загружается при инициализации Access Controller, и все FE должны использовать одинаковые файлы и пути.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Creating a Hive Catalog with Ranger-Hive Enabled -->

## Создание пользователя и Hive Catalog {#create-the-user-and-hive-catalog}

### Создание пользователя Doris {#create-the-doris-user}

Создайте пользователя для входа в Doris с тем же именем, что и у пользователя Ranger:

```sql
CREATE USER 'alice' IDENTIFIED BY 'R8!mQ2#vL7@k';
```

### Создание Hive Catalog с Ranger-Hive {#create-a-hive-catalog-with-ranger-hive}

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger-Hive не управляет разрешениями на уровне Catalog Doris. При включённых стандартных проверках привилегий Catalog Access Controller по умолчанию также должен разрешать пользователю видеть и использовать только что созданный `hive_ctl`. Если контроллером по умолчанию служит встроенная авторизация Doris, выполните:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Это разрешение обеспечивает только прохождение проверки Doris на уровне Catalog. Доступ к базам данных, таблицам и столбцам внутри `hive_ctl` по-прежнему проверяется его Ranger-Hive Access Controller.

Следующие имена легко перепутать:

| Расположение | Пример | Значение |
| --- | --- | --- |
| Свойство Catalog `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Полное имя класса фабрики Ranger-Hive Access Controller. Current и 4.x также принимают короткий идентификатор `ranger-hive`. Не указывайте здесь имя сервиса Ranger |
| Свойство Catalog `access_controller.properties.ranger.service.name` | `hive` | Префикс конфигурации плагина Ranger и тип сервиса. Doris удаляет `access_controller.properties.` и передаёт в Ranger `ranger.service.name=hive` |
| `ranger.plugin.hive.service.name` в `fe/conf/ranger-hive-security.xml` | `hive_prod` | Его `<value>` содержит имя сервиса Hive, в котором хранятся политики в Ranger WebUI |

:::caution
Не задавайте свойству Catalog значение `'access_controller.properties.ranger.service.name'='hive_prod'`. В этой стандартной конфигурации оно должно быть `hive`. Фактическое имя сервиса из Ranger WebUI укажите в `ranger.plugin.hive.service.name` внутри `ranger-hive-security.xml`, например `<value>hive_prod</value>`.
:::

Настройте подключение к Hive Metastore, HDFS или объектному хранилищу по документации [Hive Catalog](../../../lakehouse/catalogs/hive-catalog). Если Ranger Admin или HMS/HDFS использует Kerberos, см. раздел о Kerberos ниже; для этих подключений используются разные principal, keytab и расположения конфигурации.

При создании Catalog FE создаёт экземпляр Access Controller для проверки его конфигурации. Другие FE инициализируют свой активный контроллер по мере необходимости, когда впервые выполняют авторизацию запроса к этому Catalog.

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Creating and Verifying a Ranger Hive Access Policy -->

## Настройка и проверка политик Ranger {#configure-and-verify-ranger-policies}

### Создание политики доступа Ranger {#create-a-ranger-access-policy}

Откройте сервис Hive `hive_prod` в Ranger WebUI и создайте политику доступа:

| Поле | Пример |
| --- | --- |
| Имя политики | `alice_read_sales_orders` |
| База данных | `sales` |
| Таблица | `orders` |
| Столбец | `*` |
| Выбор пользователя | `alice` |
| Разрешения | `select` |

Сохраните политику и подождите один интервал опроса, который в этом примере составляет примерно 30 секунд.

### Проверка авторизации {#verify-authorization}

Войдите в Doris под пользователем `alice` и выполните:

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

Ожидаемое поведение:

- `alice` видит `sales` и может выполнять запросы к `orders`.
- Запрос к таблице, доступ к которой не разрешён, например `hive_ctl.sales.customers`, возвращает ошибку разрешений.
- Если включён централизованный аудит Ranger, его система хранения содержит как разрешённые, так и отклонённые запросы.

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## Поведение авторизации {#authorization-behavior}

### Сопоставление разрешений {#permission-mapping}

В следующей таблице показано базовое сопоставление в `RangerHiveAccessController` для 4.x. В 4.x Doris также удаляет префикс Cluster Namespace из имён пользователей, ролей и баз данных перед отправкой запроса в Ranger. Наличие сопоставления не означает, что каждый оператор SQL выполняет именно эту проверку. Поддержка операторов также зависит от механизма авторизации, реализованного в соответствующей версии Doris.

| Предикат разрешения Doris | Тип доступа Ranger |
| --- | --- |
| `SHOW` | `ANY_ACCESS`, то есть любой разрешённый доступ к ресурсу |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| Другие предикаты без сопоставления | `none` |

Ресурсы Ranger-Hive содержат только `database`, `table` и `column`; имя Catalog Doris в них отсутствует. Если два Catalog Doris используют `hive_prod` и оба содержат `sales.orders`, одна и та же политика Ranger соответствует этому ресурсу в обоих Catalog.

### Сопоставление пользователей и ролей {#user-and-role-matching}

- После аутентификации пользователя Doris отправляет текущее имя пользователя Doris в запросе Ranger. В версиях 4.x, сохраняющих Cluster Namespace в имени сеанса, Doris сначала удаляет этот префикс. Имя пользователя Ranger должно совпадать с полученным именем.
- Для Catalog с Ranger-Hive разрешения на базы данных, таблицы и столбцы определяет только Ranger-Hive; разрешения Doris на объекты этих уровней не учитываются при принятии решения. Разрешение Doris Global по-прежнему может обеспечить успешное завершение проверки на раннем этапе, а разрешения на Catalog остаются в ведении Access Controller по умолчанию.
- Doris отправляет имена ролей, которыми в данный момент обладает пользователь Doris, в контексте запроса. В 4.x Doris сначала удаляет префикс Cluster Namespace из этих имён ролей. Поле политики Ranger `Roles` может сопоставляться с полученными именами. Это лишь условие политики Ranger; оно не приводит к учёту внутренних разрешений Doris на объекты при принятии решения Ranger-Hive.
- Doris и Ranger не синхронизируют роли. Имена ролей в запросе Doris должны совпадать с именами ролей, указанными в Ranger, только если политики используют роли. Политики Ranger на основе пользователей или групп обычно проще сопровождать.
- Ranger UserSync не создаёт пользователей для входа в Doris. Даже если в Ranger есть `alice`, создайте `alice` в Doris или настройте аутентификацию пользователя через LDAP либо другого настроенного провайдера.
- Часть записи пользователя Doris, задающая хост, используется для сопоставления при входе и определения IP клиента в аудите, но не входит в имя пользователя Ranger. Например, пользователю Doris `'alice'@'10.%'` соответствует пользователь Ranger `alice`.

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## Фильтрация строк и маскирование данных {#row-filtering-and-data-masking}

### Фильтрация на уровне строк {#row-level-filter}

Создайте политику фильтрации на уровне строк в `hive_prod`:

| Поле | Пример |
| --- | --- |
| База данных | `sales` |
| Таблица | `orders` |
| Пользователь | `alice` |
| Фильтр на уровне строк | `region = 'CN'` |

Политика доступа также должна предоставлять пользователю `alice` разрешение `select` на `sales.orders`. Фильтр строк лишь добавляет выражение фильтрации; он не заменяет базовую авторизацию доступа.

Выполните:

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

Результат содержит только строки, для которых выполняется `region = 'CN'`.

### Маскирование данных {#data-masking}

Создайте политику маскирования в `hive_prod`:

| Поле | Пример |
| --- | --- |
| База данных | `sales` |
| Таблица | `customers` |
| Столбец | `phone` |
| Пользователь | `alice` |
| Вариант маскирования | Встроенный тип Ranger или пользовательский вариант |
| Пользовательское выражение | `concat(substr({col}, 1, 3), '****')` |

Также предоставьте пользователю `alice` разрешение `select` на этот столбец. При запросе `phone` Doris заменяет `{col}` в выражении Ranger фактическим именем столбца и применяет выражение маскирования.

:::caution
Выражения фильтрации строк и маскирования разбирает SQL-движок Doris. Выражение, написанное для HiveServer2, необходимо переписать, если оно использует Hive UDF или синтаксис, который Doris не поддерживает.
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## Если Ranger Admin использует Kerberos {#when-ranger-admin-uses-kerberos}

В этом разделе описана настройка клиента Ranger-Hive в FE для аутентификации в Ranger Admin по HTTP/SPNEGO. Аутентификация Kerberos в Ranger Admin и аутентификация Kerberos в Hive/HMS относятся к разным сервисам. Они могут использовать один realm, но каждое подключение имеет собственные principal сервиса, principal клиента, keytab и расположение конфигурации.

| Подключение | Пример идентификатора сервера | Пример идентификатора клиента Doris | Назначение и настройка |
| --- | --- | --- | --- |
| FE к Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | Загрузка политик; настройки сервера находятся в Ranger Admin, а настройки клиента в `fe/conf/ranger-hive-security.xml` |
| FE к HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | Чтение метаданных; настраивается свойствами Hive Catalog `hive.metastore.*` |
| FE/BE к HDFS | Principal сервисов NameNode/DataNode | `doris/hive-client.example.com@EXAMPLE.COM` | Чтение данных; настраивается свойствами Hive Catalog `hdfs.authentication.*` |

:::caution Требования к версии
Для Doris 4.x требуется **4.0.2 или более поздняя версия**. Doris 4.0.0 и 4.0.1 включают Ranger 2.4, в котором отсутствует используемый здесь вход через keytab с помощью UGI плагина Ranger. В Doris 4.0.2 Ranger обновлён до 2.7. Версия Ranger в Current включает эту возможность.
:::

### 1. Проверка идентификаторов Kerberos для Ranger Admin и FE {#1-confirm-the-ranger-admin-and-fe-kerberos-identities}

Сначала проверьте конфигурацию сервера Ranger Admin. Apache Ranger обычно загружает `core-site.xml` и `ranger-admin-site.xml` из каталога `WEB-INF/classes/conf/` развёрнутого веб-приложения. Пути могут отличаться в зависимости от дистрибутива, поэтому ориентируйтесь на аргументы запуска Ranger Admin или структуру его установки.

| Файл | Свойство | Значение |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Аутентификация Hadoop, используемая фильтром SPNEGO в Ranger Admin; для защищённой загрузки плагином укажите `kerberos` |
| `ranger-admin-site.xml` | `ranger.service.host` | Имя хоста сервиса Ranger Admin и значение, подставляемое вместо `_HOST` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | Principal сервиса HTTP/SPNEGO, например `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Путь к серверному keytab SPNEGO, считываемому Ranger Admin |

`ranger.authentication.method` управляет входом в Ranger WebUI и сам по себе не подтверждает, что защищённая конечная точка загрузки для плагинов использует SPNEGO. Проверьте действующий `ranger-admin-site.xml` и журналы запуска Ranger Admin.

На сервере Ranger Admin выполните `klist -kt <actual ranger.spnego.kerberos.keytab path>` и убедитесь, что keytab содержит HTTP principal после подстановки `_HOST`, например `HTTP/ranger-admin.example.com@EXAMPLE.COM`. Имя хоста в `ranger.plugin.hive.policy.rest.url` должно соответствовать этому principal.

Ranger не создаёт principal или keytab клиента FE. Администратор Kerberos должен создать идентификатор, например `doris/ranger-client.example.com@EXAMPLE.COM`, экспортировать его в `/etc/security/keytabs/doris-ranger.keytab`, разместить этот файл на каждом FE и предоставить пользователю процесса FE доступ на чтение. Не передавайте FE HTTP principal Ranger Admin или серверный keytab SPNEGO.

В этом разделе используются:

| Параметр | Пример |
| --- | --- |
| Имя сервиса Ranger Hive | `hive_prod` |
| URL Ranger Admin | `http://ranger-admin.example.com:6080` |
| Realm Kerberos | `EXAMPLE.COM` |
| Principal HTTP-сервиса Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| Principal FE для загрузки политик | `doris/ranger-client.example.com@EXAMPLE.COM` |
| Keytab клиента FE | `/etc/security/keytabs/doris-ranger.keytab` |

HTTP principal является идентификатором сервера Ranger Admin. Не указывайте его в `ugi.keytab.principal` на FE; это свойство должно содержать идентификатор клиента FE.

### 2. Инициализация Hadoop UGI в режиме Kerberos {#2-initialize-hadoop-ugi-in-kerberos-mode}

Добавить только свойства `ugi.*` в `ranger-hive-security.xml` недостаточно. Ranger вызывает `UserGroupInformation.loginUserFromKeytab()`, а вход через keytab создаёт учётные данные Kerberos только тогда, когда для глобальной аутентификации Hadoop задано значение `kerberos`.

Создайте `core-site.xml` в `fe/conf/` на каждом FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

`start_fe.sh` добавляет каталог FE `conf` в Java classpath, поэтому рекомендуется использовать `fe/conf/core-site.xml`. Чтобы вместо этого использовать общий каталог конфигурации Hadoop, задайте в `fe.conf` следующее:

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

В этом случае `/etc/hadoop/conf/core-site.xml` должен существовать и быть доступен для чтения пользователю процесса FE до перезапуска всех FE.

### 3. Настройка krb5.conf и HTTP SPN Ranger Admin {#3-configure-krb5conf-and-the-ranger-admin-http-spn}

Настройте realm, KDC и сопоставление `domain_realm` для имени хоста из URL Ranger Admin в `/etc/krb5.conf` на каждом FE:

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    EXAMPLE.COM = {
        kdc = kdc.example.com:88
        admin_server = kdc.example.com
    }

[domain_realm]
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

Имя хоста в `ranger.plugin.hive.policy.rest.url` должно соответствовать SPN в keytab HTTP/SPNEGO Ranger Admin. Для хоста URL `ranger-admin.example.com` серверный keytab должен содержать:

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

Не смешивайте короткое имя хоста, FQDN, CNAME, VIP и IP. Если в URL используется короткое имя хоста, например `http://ranger-admin:6080`, добавьте точное сопоставление в дополнение к сопоставлению домена:

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

Установите клиентские инструменты Kerberos, предоставляющие команды `kinit`, `klist`, `kdestroy` и `kvno`. Выполните следующие команды от имени пользователя процесса FE. Они используют отдельный кеш билетов и не удаляют существующие учётные данные. Сначала замените principal, keytab и имя хоста:

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_test_$$
kdestroy 2>/dev/null || true
klist -kt /etc/security/keytabs/doris-ranger.keytab
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM
kvno HTTP/ranger-admin.example.com@EXAMPLE.COM
klist
kdestroy
```

`klist -kt` должен выводить principal клиента FE. Успешный `kinit` обычно не выводит сообщений. Успешный `kvno` и последующий вывод `klist`, содержащий как `krbtgt/...`, так и HTTP-билет Ranger Admin, подтверждают корректность клиентского keytab, сопоставления realm и HTTP SPN. Завершающий `kdestroy` удаляет только временный кеш, использованный для этой проверки.

### 4. Полная настройка ranger-hive-security.xml {#4-configure-the-complete-ranger-hive-securityxml}

Настройте доступ к политикам и вход UGI вместе в `fe/conf/ranger-hive-security.xml` на каждом FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <!-- The hostname must match the Ranger Admin HTTP SPN -->
    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.initialize</name>
        <value>true</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.login.type</name>
        <value>keytab</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.principal</name>
        <value>doris/ranger-client.example.com@EXAMPLE.COM</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.file</name>
        <value>/etc/security/keytabs/doris-ranger.keytab</value>
    </property>
</configuration>
```

Свойства, относящиеся к Kerberos:

| Свойство | Описание |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Выполняет вход Hadoop UGI при инициализации плагина Ranger-Hive |
| `ranger.plugin.hive.ugi.login.type` | Задайте `keytab` для входа через keytab |
| `ranger.plugin.hive.ugi.keytab.principal` | Principal клиента, используемый FE для загрузки политик Ranger; он должен присутствовать в keytab |
| `ranger.plugin.hive.ugi.keytab.file` | Абсолютный путь к клиентскому keytab, одинаковый на каждом FE и доступный для чтения пользователю процесса FE |

`ranger.plugin.hive.policy.rest.secure=true` не определяет выбор механизма загрузки через Kerberos. Клиент Ranger проверяет, работает ли Hadoop UGI в защищённом режиме и есть ли у вошедшего пользователя учётные данные Kerberos. Используйте `secureMode` в журнале FE, чтобы подтвердить выбранный режим.

### 5. Разрешение служебной учётной записи FE загружать политики hive_prod {#5-allow-the-fe-service-identity-to-download-hive_prod-policies}

Этот шаг предоставляет разрешение **служебной учётной записи, которую FE использует для загрузки политик**. Это не пользователь запросов Doris `alice`, и данный шаг не предоставляет этой учётной записи доступ к данным Hive.

После включения Kerberos в Ranger Admin загрузка политик проходит две проверки:

1. Ranger Admin аутентифицирует principal из keytab FE через SPNEGO.
2. Ranger Admin проверяет, разрешено ли аутентифицированному идентификатору входа загружать данные для `hive_prod`.

Преобразование идентификатора в этом примере:

| Этап | Пример | Назначение |
| --- | --- | --- |
| Principal в keytab FE | `doris/ranger-client.example.com@EXAMPLE.COM` | Аутентификация SPNEGO |
| Идентификатор входа в Ranger Admin | `doris` | Учётная запись после преобразования principal с помощью `auth_to_local` |
| Рекомендуемая настройка сервиса Hive | `policy.download.auth.users=doris` | Разрешает этой учётной записи FE загружать данные политик и ролей |

Для обычной служебной учётной записи FE используйте свойство сервиса Hive `policy.download.auth.users`, чтобы предоставить минимально необходимые права на загрузку. Откройте настройки сервиса Hive `hive_prod` в Ranger WebUI и убедитесь, что они содержат:

```text
policy.download.auth.users=doris
```

Здесь `doris` является идентификатором входа в аутентифицированном сеансе Ranger Admin, а не пользователем запросов Doris. Фильтр SPNEGO в Ranger Admin применяет `hadoop.security.auth_to_local` из своего `core-site.xml`; используйте `doris` только в том случае, если это правило преобразует principal из примера в `doris`. Проверьте фактический идентификатор входа в журналах аутентификации Ranger Admin, не предполагая, что используется полный principal или фиксированное короткое имя.

Apache Ranger 2.7 разделяет `policy.download.auth.users` по запятым и сравнивает каждую запись с идентификатором входа на точное совпадение без учёта регистра. Для нескольких учётных записей используйте список через запятую без пробелов, например `doris,hive`. Администраторы Ranger и пользователи, указанные в `policy.grantrevoke.auth.users`, также могут пройти авторизацию загрузки, но FE нужен только доступ на загрузку, поэтому не следует предоставлять ему более широкие права выдачи и отзыва разрешений для этой цели.

### 6. Перезапуск FE и проверка защищённой загрузки политик {#6-restart-the-fes-and-verify-secure-policy-download}

Перезапустите все FE и сначала найдите в журнале FE сообщение следующего вида:

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

Затем вызовите защищённую конечную точку политик от имени пользователя процесса FE с тем же keytab. Перед выполнением убедитесь, что `curl --version` сообщает о поддержке GSS-API, Kerberos или SPNEGO:

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

HTTP 200 с полным JSON-ответом политик является критерием успешного прохождения всей цепочки. Успешный `kinit`, `kvno` или `secureMode=true` подтверждает только часть этой цепочки и не заменяет результат загрузки.

После загрузки политик каталог кеша из примера должен содержать:

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Если Ranger Admin, HMS и HDFS используют Kerberos {#7-when-ranger-admin-hms-and-hdfs-all-use-kerberos}

Если Hive Metastore и HDFS также используют Kerberos, примените следующее определение Catalog **вместо** оператора `CREATE CATALOG hive_ctl` из примера быстрого старта. Не создавайте один и тот же Catalog дважды. Здесь `doris-ranger.keytab` используется только для загрузки политик FE, а `doris-hive.keytab` служит для доступа к HMS и HDFS:

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'hive.metastore.authentication.type' = 'kerberos',
    'hive.metastore.client.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hive.metastore.client.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'hive.metastore.service.principal' = 'hive/hms.example.com@EXAMPLE.COM',
    'hdfs.authentication.type' = 'kerberos',
    'hdfs.authentication.kerberos.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hdfs.authentication.kerberos.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'fs.defaultFS' = 'hdfs://nameservice1',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

У этих клиентских идентификаторов разные назначения:

- `doris-ranger.keytab` позволяет FE загружать политики из Ranger Admin через SPNEGO, и его нужно размещать только на FE.
- `doris-hive.keytab` используется для доступа к HMS и HDFS. Разместите клиентский keytab HMS на каждом FE. Разместите клиентский keytab HDFS по одному и тому же абсолютному пути, доступному для чтения, на каждом FE и BE, обращающемся к HDFS. HMS и HDFS могут использовать разные клиентские идентификаторы, если соответствующие свойства заданы отдельно.

Получите principal сервера HMS из конфигурации Kerberos Hive Metastore. Приведённый в примере `hive/hms.example.com@EXAMPLE.COM` не является HTTP principal Ranger Admin. Подключения могут использовать один realm, но их principal и keytab не взаимозаменяемы.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Ranger Admin over HTTPS / Custom CA / Mutual TLS -->

## Если Ranger Admin использует HTTPS {#when-ranger-admin-uses-https}

В `fe/conf/ranger-hive-security.xml` на каждом FE измените URL Ranger Admin на HTTPS и укажите в `ranger.plugin.hive.policy.rest.ssl.config.file` путь к файлу конфигурации SSL:

```xml
<property>
    <name>ranger.plugin.hive.policy.rest.url</name>
    <value>https://ranger-admin.example.com:6182</value>
</property>
<property>
    <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
    <value>/opt/apache-doris/fe/conf/ranger-policymgr-ssl.xml</value>
</property>
```

В следующем примере используются сертификат CA Ranger Admin `/tmp/ranger-admin-ca.pem` и пользователь с группой процесса FE `doris:doris`. Подготовьте truststore и провайдер учётных данных JCEKS на каждом FE. Для команд требуются `keytool` из JDK и `hadoop credential` из Hadoop:

```shell
sudo install -d -o doris -g doris -m 700 /etc/security/ranger
sudo -u doris keytool -importcert -noprompt \
    -alias ranger-admin-ca \
    -file /tmp/ranger-admin-ca.pem \
    -storetype JKS \
    -keystore /etc/security/ranger/ranger-truststore.jks
sudo -u doris hadoop credential create sslTrustStore \
    -provider jceks://file/etc/security/ranger/ranger-ssl.jceks
sudo chmod 600 /etc/security/ranger/ranger-truststore.jks \
    /etc/security/ranger/ranger-ssl.jceks
```

`keytool` запрашивает пароль truststore, а `hadoop credential` запрашивает значение `sslTrustStore`. Введите одинаковый пароль в обоих случаях. Замените временный путь к CA путём из вашей системы управления сертификатами и убедитесь, что пользователь процесса FE может читать оба файла.

Пример `ranger-policymgr-ssl.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.policymgr.clientssl.truststore</name>
        <value>/etc/security/ranger/ranger-truststore.jks</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.type</name>
        <value>JKS</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.credential.file</name>
        <value>jceks://file/etc/security/ranger/ranger-ssl.jceks</value>
    </property>
</configuration>
```

Клиент Ranger считывает пароль truststore из фиксированного псевдонима `sslTrustStore`. Для взаимной аутентификации TLS дополнительно требуются `xasecure.policymgr.clientssl.keystore` и псевдоним `sslKeyStore` в JCEKS. Не размещайте пароли truststore или keystore в XML в открытом виде.

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## Несколько Catalog и ограничения во время работы {#multiple-catalogs-and-runtime-constraints}

### Использование одного сервиса политик Hive для нескольких Catalog {#reuse-one-hive-policy-service-across-catalogs}

Несколько Catalog, соответствующих `hive_prod`, могут использовать одну конфигурацию контроллера:

```sql
CREATE CATALOG hive_prod_a PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-a.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);

CREATE CATALOG hive_prod_b PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-b.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

В ресурсах Ranger Hive нет измерения Catalog, поэтому одинаковые имена баз данных, таблиц и столбцов соответствуют одной и той же политике. Используйте общий сервис только тогда, когда оба Metastore намеренно используют общие имена ресурсов и границы авторизации.

### Разные экземпляры сервиса Ranger Hive {#different-ranger-hive-service-instances}

Стандартному префиксу `hive` соответствует один файл `ranger-hive-security.xml`, поэтому все Ranger-Hive Catalog в одном FE считывают одно и то же значение `ranger.plugin.hive.service.name`. Текущий интерфейс Catalog не позволяет каждому Catalog выбирать отдельное имя сервиса Ranger Hive. Не указывайте имя сервиса из WebUI, например `hive_prod_a`, в свойстве Catalog `ranger.service.name`; в этом случае Ranger будет искать `ranger-hive_prod_a-security.xml` и `ranger.plugin.hive_prod_a.*`, что выходит за рамки описанной здесь стандартной конфигурации Hive. Для изоляции независимых сервисов Ranger Hive используйте отдельные кластеры Doris либо настройте Catalog на совместное использование одного сервиса политик Ranger Hive.

### Ограничения во время работы и рекомендации {#runtime-constraints-and-best-practices}

- Используйте Ranger-Hive только для Hive/HMS Catalog; это не универсальный контроллер Ranger для любого внешнего Catalog.
- Политики Ranger-Hive и Ranger-Doris не синхронизируются. Храните их файлы конфигурации и каталоги кеша политик раздельно.
- Провайдеры аудита Ranger являются общими для всего процесса FE. Первый инициализированный плагин Ranger определяет, включён ли аудит и куда направляются его записи. При совместном использовании Ranger-Doris и Ranger-Hive задайте в обоих XML-файлах аудита одинаковое состояние включения и одно централизованное место назначения, чтобы результат не зависел от порядка инициализации.
- Состояние входа Hadoop UGI является глобальным в JVM процесса FE. При совместном использовании Ranger-Doris и Ranger-Hive либо нескольких Ranger Catalog с Kerberos используйте один и тот же principal и keytab клиента Ranger. Последующий вход с другим идентификатором может заменить учётную запись входа процесса и нарушить стабильность загрузки политик.
- Ranger-Hive не проверяет политики Ranger для HDFS, S3 или объектных хранилищ. Для доступа к хранилищу по-прежнему используются учётные данные, настроенные для Catalog Doris.
- Ресурсы Ranger Hive не включают измерение Catalog Doris. Оцените возможные конфликты для одноимённых баз данных и таблиц в разных Metastore.
- Doris и Ranger не синхронизируют пользователей или роли. Определите единые правила именования и проверяйте как разрешённые, так и отклонённые запросы с обычными учётными записями.
- Если первая загрузка политик завершается ошибкой, плагин может использовать локальный кеш. Отслеживайте актуальность кеша и аудит Ranger, чтобы использование устаревших политик не осталось незамеченным.
- Каждый FE, инициализирующий Access Controller, самостоятельно загружает и кеширует политики. Поддерживайте согласованность файлов конфигурации, keytab, truststore и прав доступа к каталогам на всех FE.
- Изменения политик применяются не мгновенно. Максимальная задержка обычно близка к `policy.pollIntervalMs` с добавлением задержек Ranger Admin и сети.

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## Устранение неполадок {#troubleshooting}

Используйте таблицу симптомов, чтобы определить первую проверку, а затем перейдите к соответствующему разделу с описанием причины и полной процедуры:

| Симптом | Первая проверка |
| --- | --- |
| При создании Catalog не удаётся найти Access Controller | Убедитесь, что в `access_controller.class` указано полное имя класса фабрики или `ranger-hive` |
| Журнал сообщает, что `ranger-hive-security.xml` не найден | Убедитесь, что для префикса Catalog задано фиксированное значение `hive` и файл существует в `fe/conf/` на каждом FE |
| XML-конфигурация безопасности не действует при отключённом аудите | Разместите `ranger-hive-audit.xml` и явно отключите аудит |
| Ranger Admin доступен, но политики не загружаются | Проверьте имя сервиса, REST URL, сетевой доступ, каталог кеша и состояние политик |
| Загрузка политик завершается ошибкой после включения Kerberos | Проверьте защищённый режим UGI, HTTP SPN, авторизацию загрузки, статус HTTP и кеш политик |
| Ranger разрешает доступ пользователю, но Catalog не виден | Проверьте разрешение на уровне Catalog в Access Controller по умолчанию |
| Запрещающая политика Ranger не действует | Проверьте разрешения Global и не выполняйте проверку от имени `root` или `admin` |
| Политика работает в HiveServer2, но не в Doris | Проверьте имя сервиса, имена пользователей и ролей, а также совместимость выражений |
| Пользователь может напрямую читать HDFS или S3 | Ranger-Hive не обеспечивает контроль доступа к базовому хранилищу |

### При создании Catalog сообщается, что Access Controller не найден {#catalog-creation-reports-that-the-access-controller-cannot-be-found}

Используйте актуальное имя класса фабрики:

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current и 4.x также поддерживают короткий идентификатор:

```sql
'access_controller.class' = 'ranger-hive'
```

Не используйте `hive`, `hive_prod` или старое имя класса `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory`. Убедитесь, что все FE работают на одной версии Doris, и найдите в журнале FE `Access Controller Plugin Factory`.

### Журнал сообщает, что ranger-hive-security.xml не найден {#the-log-says-ranger-hive-securityxml-cannot-be-found}

Часто путают следующие две настройки:

- Свойство Catalog `'access_controller.properties.ranger.service.name' = 'hive'` выбирает плагин Ranger Hive и должно сохранять значение `hive`. Doris использует его для поиска `ranger-hive-security.xml` и чтения настроек `ranger.plugin.hive.*`.
- `ranger.plugin.hive.service.name` внутри `ranger-hive-security.xml` задаёт фактическое имя сервиса Hive в Ranger WebUI, например `hive_prod`.

Если в Catalog ошибочно указано `hive_prod`, Ranger ищет `ranger-hive_prod-security.xml`. Убедитесь, что `ranger-hive-security.xml` существует в `fe/conf/` на каждом FE, и перезапустите все FE после исправления.

### Почему ranger-hive-audit.xml требуется при отключённом аудите {#why-ranger-hive-auditxml-is-required-when-audit-is-disabled}

Если Ranger 2.7 не может найти `ranger-hive-audit.xml`, он переходит к устаревшему резервному механизму, который ищет `hive-site.xml`, `hbase-site.xml` или `hdfs-site.xml`, а затем пытается загрузить `xasecure-audit.xml` из того же каталога. Если этот файл отсутствует, последующая конфигурация `ranger-hive-security.xml` также может не примениться. Всегда размещайте `ranger-hive-security.xml` и `ranger-hive-audit.xml` вместе; задавайте `xasecure.audit.is.enabled=false`, если аудит не нужен. `core-site.xml` не входит в этот устаревший список поиска файлов аудита и не является непосредственной причиной срабатывания этого механизма.

### Ranger Admin доступен, но политики не загружаются {#ranger-admin-is-reachable-but-no-policy-is-downloaded}

Проверьте по порядку:

1. `ranger.plugin.hive.service.name` точно совпадает с именем сервиса в WebUI `hive_prod`.
2. `ranger.plugin.hive.policy.rest.url` является корневым URL Ranger Admin.
3. Сетевое подключение, DNS и доступ к Ranger Admin по HTTPS с использованием truststore на FE работают.
4. Каталог кеша существует и доступен для записи пользователю процесса FE.
5. Сервис Ranger включён, а его политики сохранены.

Если Ranger Admin использует Kerberos, перейдите к следующему пункту устранения неполадок.

### Загрузка политик завершается ошибкой после включения Kerberos в Ranger Admin {#policy-download-fails-after-ranger-admin-enables-kerberos}

Проверьте цепочку загрузки по порядку:

1. **Проверьте режим Kerberos.** Журнал FE должен содержать `secureMode=true` и `(auth:KERBEROS)`. Если в нём указано `secureMode=false` или `(auth:SIMPLE)`, проверьте `hadoop.security.authentication=kerberos` в `core-site.xml`, разместите файл в `fe/conf/` либо в каталоге, добавленном в classpath через `HADOOP_CONF_DIR`, и перезапустите каждый FE. Не полагайтесь только на стандартный `hadoop_config_dir` в `plugins/hadoop_conf/`; этот каталог предназначен главным образом для подключений Catalog/Hadoop, и его доступность при инициализации глобального UGI плагином Ranger не гарантируется. Для 4.x используйте 4.0.2 или более позднюю версию и убедитесь, что `ranger.plugin.hive.forceNonKerberos=true` не задано случайно.
2. **Проверьте билет HTTP-сервиса.** От имени пользователя процесса FE выполните проверки `kinit` и `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` из основной процедуры настройки Kerberos. При ошибках `Server not found in Kerberos database`, `No service creds` или запросе неверного `krbtgt/<REALM>` сравните имя хоста в URL, HTTP SPN Ranger Admin, DNS и сопоставления в `/etc/krb5.conf`. URL и SPN должны использовать в точности одно и то же имя хоста.
3. **Проверьте авторизацию загрузки.** После аутентификации SPNEGO найдите фактический идентификатор входа в журналах Ranger Admin. Для обычной учётной записи FE из этого примера укажите этот идентификатор в настройках сервиса `hive_prod`, в параметре `policy.download.auth.users`. Apache Ranger 2.7 также разрешает загрузку администраторам Ranger и учётным записям из `policy.grantrevoke.auth.users`, но не предоставляйте более широкие права выдачи и отзыва разрешений только ради загрузок FE. Если WebUI не показывает `policy.download.auth.users`, проверьте или обновите его через конфигурацию установки плагина Ranger в вашем дистрибутиве либо через Ranger Service REST API. При обновлении через REST сохраняйте все существующие настройки сервиса.
4. **Проверьте статус защищённой конечной точки.** Повторите команду `curl --negotiate` из шага 6 настройки Kerberos и сохраните тело ответа. В стандартном Apache Ranger 2.7 HTTP 401 означает сбой аутентификации SPNEGO; 403 означает, что идентификатор входа аутентифицирован, но не является администратором и отсутствует в обоих списках авторизованных пользователей; 404 обычно означает, что имя сервиса в XML не совпадает с именем в Ranger WebUI; только 200 с полным JSON политик подтверждает успех. Дистрибутивы поставщиков могут иначе обрабатывать статусы, поэтому также проверьте журналы Ranger Admin. Успешный `kinit` подтверждает только получение клиентского TGT.
5. **Проверьте кеш политик.** Успешная загрузка создаёт оба файла: `hive_hive_prod.json` и `hive_hive_prod_roles.json`. Если существует только небольшой файл ролей, основная политика по-прежнему не загружена. Проверьте ответ `getServicePoliciesIfUpdated` и сообщения журнала FE, например `policy engine initialization failed`, или ошибки записи кеша.

### Ranger разрешает доступ пользователю, но SHOW CATALOGS не показывает Catalog {#ranger-allows-the-user-but-show-catalogs-does-not-show-the-catalog}

Проверка на уровне Catalog выполняется Access Controller по умолчанию. При использовании встроенной авторизации Doris предоставьте разрешение на Catalog:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

### Запрещающая политика Ranger не действует {#a-ranger-deny-policy-does-not-take-effect}

Проверьте, есть ли у пользователя разрешение Doris Global. Соответствующее разрешение Global от Access Controller по умолчанию может обеспечить успешное прохождение итоговой проверки, даже если Ranger-Hive не разрешил доступ к базе данных, таблице или столбцу. Выполняйте проверку под обычным пользователем, у которого нет ни `ADMIN_PRIV`, ни разрешения Global `SELECT_PRIV`.

### Политика работает в HiveServer2, но не в Doris {#a-policy-works-in-hiveserver2-but-not-in-doris}

Убедитесь, что Doris и HiveServer2 считывают одно и то же имя сервиса Ranger Hive, а выражения политик используют синтаксис SQL, поддерживаемый Doris. Также убедитесь, что имя пользователя и имена ролей в запросе Doris точно совпадают с указанными в политике Ranger.

### Предотвращает ли Ranger-Hive прямой доступ к HDFS или S3? {#does-ranger-hive-prevent-direct-hdfs-or-s3-access}

Нет. Ranger-Hive выполняет авторизацию запросов к базам данных, таблицам и столбцам Hive только на уровне SQL в Doris. Доступ к HDFS, S3 и другим хранилищам использует настройки аутентификации хранилища из Catalog и требует отдельного контроля доступа на стороне хранилища и изоляции учётных данных.

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## Контрольный список для рабочей среды {#production-checklist}

- В Ranger WebUI используется тип сервиса Hive, а его имя в точности совпадает со значением в XML.
- На каждом FE есть корректно разбираемые `ranger-hive-security.xml` и `ranger-hive-audit.xml`; если аудит не нужен, он явно отключён в XML-файле аудита.
- Ranger-Doris и Ranger-Hive используют отдельные каталоги кеша политик, доступные для записи пользователю процесса FE.
- Свойство Catalog `access_controller.class` использует полное имя класса фабрики Ranger-Hive или поддерживаемый идентификатор `ranger-hive`, а значение префикса конфигурации равно `hive`.
- Обычный пользователь Doris соответствует имени пользователя Ranger. Если роли Doris участвуют в политиках Ranger, имена используемых ролей совпадают.
- Разрешённый доступ, запрещённый доступ, разрешения на столбцы, фильтрация строк и маскирование данных проверены по отдельности.
- Разрешение на уровне Catalog предоставляется Access Controller по умолчанию, а у тестовых пользователей нет разрешения Global, которое позволяет обойти предусмотренные проверки Ranger-Hive.
- При использовании Kerberos или HTTPS в Ranger Admin все FE используют согласованные keytab, truststore, `krb5.conf` и абсолютные пути.
- Одноимённые базы данных и таблицы в разных Catalog проверены, чтобы предотвратить непреднамеренное расширение области действия политик.
- Если аудит включён, настроенное место назначения содержит записи о разрешениях и отказах Doris; для просмотра аудита в Ranger WebUI также требуется соответствующая централизованная система хранения, например Solr.
