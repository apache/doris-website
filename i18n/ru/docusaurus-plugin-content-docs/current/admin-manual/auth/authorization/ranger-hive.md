---
{
    "title": "Авторизация Ranger-Hive",
    "description": "Настройка авторизации Ranger-Hive для Hive Catalog в Doris, включая Kerberos, политики, фильтрацию строк и маскирование.",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog authorization",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "row filter",
        "data masking",
        "Doris Hive Catalog Ranger authorization",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml not found",
        "Ranger Hive policy download failure",
        "Doris Current Ranger Hive"
    ]
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris позволяет назначить отдельному Hive Catalog контроллер доступа Ranger-Hive. После этого Doris использует уже настроенные в Apache Ranger политики Hive для авторизации доступа к базам данных, таблицам и столбцам в этом Catalog. Также поддерживаются фильтры Ranger на уровне строк, маскирование данных и аудит.

Используйте этот режим, если ваша организация уже управляет разрешениями Hive в Ranger и хочет, чтобы запросы Doris к тем же данным выполнялись с учётом этих политик.

Ranger-Hive контролирует только те Hive Catalog, для которых настроен этот контроллер доступа. Он не заменяет авторизацию на уровне кластера Doris и не применяет политики Ranger для нижележащих HDFS, S3 и других систем хранения.

## Сценарии использования {#use-cases}

| Сценарий | Поддерживается | Описание |
| --- | --- | --- |
| Использование существующих политик Ranger Hive для данных Hive, запрашиваемых через Doris | Да | Настройте контроллер доступа Ranger-Hive для соответствующего Hive Catalog |
| Централизованное управление разрешениями всего кластера Doris через Ranger | Нет | Используйте Ranger-Doris |
| Авторизация доступа к нижележащему хранилищу HDFS или S3 | Нет | Настройте контроль доступа и изоляцию учётных данных в системе хранения |
| Настройка авторизации Ranger для Catalog, не относящегося к Hive/HMS | Нет | Ranger-Hive применяется только к Catalog Hive/HMS |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris и Ranger-Hive {#ranger-doris-and-ranger-hive}

Ranger-Doris и Ranger-Hive предназначены для разных задач:

| Характеристика | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| Основное назначение | Централизованное управление разрешениями кластера Doris в Ranger | Применение существующих политик Ranger Hive к отдельному Hive Catalog |
| Включение | Параметр FE `access_controller_type=ranger-doris` | Свойство Catalog `access_controller.class` |
| Тип сервиса Ranger | Doris; требуются плагин Doris для Ranger и определение сервиса | Hive; используется встроенное в Ranger определение сервиса Hive |
| Иерархия ресурсов | Глобальные ресурсы Doris, Catalog, базы данных, таблицы, столбцы и другие ресурсы | Базы данных, таблицы и столбцы Hive |
| Область действия | Контроллер доступа по умолчанию для кластера Doris | Только внешний Catalog, в котором указан этот контроллер |
| Совместное использование политик | Политики Doris не преобразуются в политики Hive | Политики Hive не считывают политики Ranger-Doris |

Оба варианта можно использовать в одном кластере Doris. Например, Ranger-Doris может быть контроллером доступа по умолчанию, а `hive_ctl` может использовать Ranger-Hive. Когда для Hive Catalog включён Ranger-Hive, запросы направляются следующим образом. Под «контроллером доступа по умолчанию» понимается встроенная авторизация Doris или Ranger-Doris.

### Границы авторизации {#authorization-boundaries}

| Область разрешений | Контроллер | Примечания |
| --- | --- | --- |
| Глобальная | Контроллер доступа по умолчанию | В Ranger-Hive нет глобального ресурса Doris |
| Catalog | Контроллер доступа по умолчанию | В Ranger Hive нет ресурса Catalog Doris |
| База данных | Ranger-Hive для текущего Catalog | Ресурсом Ranger является имя базы данных Hive |
| Таблица / представление | Ranger-Hive для текущего Catalog | Ресурсом Ranger являются имена базы данных и таблицы Hive |
| Столбец | Ranger-Hive для текущего Catalog | Каждый столбец, к которому обращается запрос, проверяется отдельно |
| Фильтр на уровне строк | Ranger-Hive для текущего Catalog | Doris получает выражение фильтра из Ranger; политики не применяются к `root` или `admin` |
| Маскирование данных | Ranger-Hive для текущего Catalog | Doris получает правило маскирования столбца из Ranger; политики не применяются к `root` или `admin` |
| Ресурс, Storage Vault, Compute Group | Контроллер доступа по умолчанию | Эти ресурсы не входят в модель Ranger-Hive |
| HDFS, S3 и другие хранилища | Не проверяются Ranger-Hive | Doris по-прежнему читает данные с учётными данными хранилища, настроенными для Catalog |

:::warning
Если контроллер доступа по умолчанию предоставляет соответствующее глобальное разрешение, итоговая проверка доступа к базе данных, таблице или столбцу проходит успешно, даже если Ranger-Hive запрещает доступ к ресурсу. Проверяйте запрещающие политики с обычным пользователем, у которого нет ни `ADMIN_PRIV`, ни глобального разрешения `SELECT_PRIV`; не используйте `root` или `admin`.
:::

## Предварительные требования {#prerequisites}

- Ranger Admin развёрнут и доступен с каждого FE Doris.
- В Ranger существует сервис Hive. В этом руководстве в качестве имени сервиса используется `hive_prod`.
- У вас есть разрешение на создание пользователей Doris и Catalog. Ranger выполняет авторизацию; он не создаёт пользователей Doris и не проверяет их пароли.
- Для Hive Catalog уже настроены сеть, аутентификация и разрешения, необходимые для доступа к Hive Metastore и нижележащему хранилищу.
- Каждый FE может читать файлы конфигурации Ranger. Если настроен локальный кэш политик, пользователь, от имени которого запущен процесс FE, может создать его каталог или записывать в него данные.

## Обзор настройки {#configuration-overview}

В следующей процедуре используются сервис Hive `hive_prod` в Ranger WebUI, Catalog Doris `hive_ctl` и пользователь `alice`:

1. Проверьте или создайте сервис Hive `hive_prod` в Ranger WebUI.
2. Разместите `ranger-hive-security.xml` и `ranger-hive-audit.xml` на каждом FE, создайте каталог кэша политик и перезапустите все FE.
3. Создайте пользователя Doris `alice` и Hive Catalog `hive_ctl` с включённым Ranger-Hive.
4. Создайте политику доступа для `alice` в сервисе Ranger `hive_prod`.
5. Войдите в Doris как `alice` и проверьте как разрешённый, так и запрещённый доступ.

Если Ranger Admin использует Kerberos или HTTPS, сначала выполните базовую настройку, а затем примените соответствующие настройки безопасности, описанные далее в этом руководстве.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Настройка сервиса Ranger и FE {#configure-the-ranger-service-and-fes}

### Проверка сервиса Ranger Hive {#confirm-the-ranger-hive-service}

На странице управления сервисами в Ranger WebUI проверьте или создайте сервис Hive:

| Поле Ranger WebUI | Пример | Описание |
| --- | --- | --- |
| Тип сервиса | `Hive` | Используйте определение сервиса Hive из Ranger; плагин Doris для Ranger не требуется |
| Имя сервиса | `hive_prod` | Экземпляр сервиса Ranger, в котором хранятся политики Hive |

Если HiveServer2 уже использует `hive_prod`, Doris может читать те же политики. Не создавайте отдельный сервис только для Doris.

### Подготовка файлов конфигурации на всех FE {#prepare-the-configuration-files-on-all-fes}

Разместите следующие файлы в каталоге `fe/conf/` каждого FE:

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

Размещайте `ranger-hive-security.xml` и `ranger-hive-audit.xml` вместе. Сохраните файл аудита и явно отключите аудит, даже если он не нужен, чтобы Ranger 2.7 не переходил к устаревшему резервному механизму настройки аудита. `ranger-policymgr-ssl.xml` нужен только в том случае, если Ranger Admin использует HTTPS с пользовательским хранилищем доверенных сертификатов или клиентским сертификатом.

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

| Свойство | Обязательно | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | Да | Нет | Его `<value>` должно точно совпадать с именем сервиса Hive в Ranger WebUI, например `hive_prod` |
| `ranger.plugin.hive.policy.source.impl` | Нет | REST-клиент Ranger Admin | Реализация, используемая для получения политик |
| `ranger.plugin.hive.policy.rest.url` | Да | Нет | Корневой URL Ranger Admin без пути к API политик |
| `ranger.plugin.hive.policy.cache.dir` | Обязательно для описанной в этом руководстве настройки в рабочей среде | Локальный кэш отсутствует | В шаблоне указан пример пути; заранее создайте каталог и предоставьте пользователю процесса FE права на запись |
| `ranger.plugin.hive.policy.pollIntervalMs` | Нет | `30000` миллисекунд | Интервал опроса политик |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | Нет | `120000` миллисекунд | Тайм-аут подключения к Ranger Admin; в шаблоне он переопределён на `60000` миллисекунд |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | Нет | `30000` миллисекунд | Тайм-аут чтения ответа Ranger Admin; в шаблоне он переопределён на `60000` миллисекунд |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | Обязательно при пользовательской настройке доверия для HTTPS | Пустое значение | Абсолютный путь к `ranger-policymgr-ssl.xml` |

#### Создание каталога кэша политик {#create-the-policy-cache-directory}

Используйте отдельные пути `policy.cache.dir` для Ranger-Doris и Ranger-Hive, например `/var/lib/doris/ranger/doris_prod/policy-cache` и `/var/lib/doris/ranger/hive_prod/policy-cache`. Catalog, использующие один и тот же сервис Ranger Hive, читают общую конфигурацию плагина Hive и общий кэш.

В примере используется `/var/lib/doris/ranger/hive_prod/policy-cache`. Выполните следующие команды на каждом FE от имени `root` или добавьте `sudo`:

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

В командах предполагается, что FE запущен от имени пользователя и группы `doris:doris`. Замените их фактическими пользователем и группой процесса. Проверьте доступ на запись с помощью `sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache`; если `sudo` недоступен, выполните аналогичную проверку от имени пользователя процесса FE.

#### Настройка ranger-hive-audit.xml {#configure-ranger-hive-auditxml}

В этом руководстве аудит Ranger по умолчанию отключён. Даже если аудит отключён, сохраните следующий файл `fe/conf/ranger-hive-audit.xml` на каждом FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` отключает вывод записей аудита авторизации Ranger. Для аудита в рабочей среде возьмите за основу шаблон аудита Hive для вашей версии Ranger, настройте централизованное хранилище, например Solr, HDFS или Kafka, и задайте свойству значение `true`. Log4j не рекомендуется использовать для хранения аудита в рабочей среде, поскольку к записям аудита применяется общая политика ротации журналов FE, что затрудняет независимое управление сроком их хранения и общим размером.

#### Перезапуск FE {#restart-the-fes}

После настройки XML-файлов и каталога кэша перезапустите каждый FE перед созданием Catalog. Конфигурация Ranger загружается при инициализации контроллера доступа, и все FE должны использовать одинаковые файлы и пути.

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

Ranger-Hive не управляет разрешениями Doris на уровне Catalog. При значении по умолчанию `skip_catalog_priv_check=false` контроллер доступа по умолчанию также должен разрешать пользователю видеть и использовать только что созданный `hive_ctl`. Если контроллером по умолчанию служит встроенная авторизация Doris, выполните:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Это разрешение обеспечивает только прохождение проверки Doris на уровне Catalog. Доступ к базам данных, таблицам и столбцам внутри `hive_ctl` по-прежнему проверяется его контроллером доступа Ranger-Hive.

В версии Current вместо этого можно задать `skip_catalog_priv_check=true` в `fe.conf`, чтобы пропускать проверки `SHOW` и `SELECT` на уровне внешних Catalog с пользовательским контроллером доступа. Этот параметр не отключает проверки Ranger-Hive для баз данных, таблиц и столбцов, а также проверки на уровне Catalog для таких операций, как `CREATE`, `LOAD` или `ALTER`.

Следующие имена легко перепутать:

| Расположение | Пример | Значение |
| --- | --- | --- |
| Свойство Catalog `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Полное имя класса фабрики контроллера доступа Ranger-Hive. Current и 4.x также принимают короткий идентификатор `ranger-hive`. Не указывайте здесь имя сервиса Ranger |
| Свойство Catalog `access_controller.properties.ranger.service.name` | `hive` | Префикс конфигурации плагина Ranger и тип сервиса. Doris удаляет `access_controller.properties.` и передаёт `ranger.service.name=hive` в Ranger |
| `ranger.plugin.hive.service.name` в `fe/conf/ranger-hive-security.xml` | `hive_prod` | Его `<value>` содержит имя сервиса Hive, в котором хранятся политики в Ranger WebUI |

:::caution
Не задавайте свойству Catalog значение `'access_controller.properties.ranger.service.name'='hive_prod'`. В описанной стандартной конфигурации оно должно быть `hive`. Укажите фактическое имя сервиса из Ranger WebUI в `ranger.plugin.hive.service.name` внутри `ranger-hive-security.xml`, например `<value>hive_prod</value>`.
:::

Настройте подключение к Hive Metastore, HDFS или объектному хранилищу по документации [Hive Catalog](../../../lakehouse/catalogs/hive-catalog). Если Ranger Admin или HMS/HDFS использует Kerberos, см. раздел о Kerberos ниже; эти подключения используют разные principal, keytab-файлы и расположения конфигурации.

При создании Catalog FE создаёт экземпляр контроллера доступа, чтобы проверить его конфигурацию. Остальные FE инициализируют свой действующий контроллер по мере необходимости, когда впервые выполняют авторизацию запроса к этому Catalog.

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

Войдите в Doris как `alice` и выполните:

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

Ожидаемое поведение:

- `alice` видит `sales` и может выполнять запросы к `orders`.
- Запрос к таблице, доступ к которой не разрешён, например `hive_ctl.sales.customers`, возвращает ошибку доступа.
- Если включён централизованный аудит Ranger, его хранилище содержит как разрешённые, так и отклонённые запросы.

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## Поведение авторизации {#authorization-behavior}

### Сопоставление разрешений {#permission-mapping}

В следующей таблице показано базовое сопоставление в `RangerHiveAccessController` для Current и 4.x. Сейчас сопоставления одинаковы; в 4.x дополнительно удаляется префикс пространства имён кластера из имён пользователей, ролей и баз данных. Наличие сопоставления не означает, что каждый оператор SQL выполняет именно эту проверку. Поддержка операторов также зависит от пути авторизации, реализованного в соответствующей версии Doris.

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

- После аутентификации пользователя Doris отправляет текущее имя пользователя Doris в запросе к Ranger. Имя пользователя Ranger должно точно совпадать с именем пользователя Doris.
- Для Catalog с Ranger-Hive разрешения на уровне базы данных, таблицы и столбца определяет только Ranger-Hive; разрешения на объекты Doris в этих областях не учитываются при принятии решения. Глобальное разрешение Doris по-прежнему может обеспечить успешное завершение проверки на раннем этапе, а разрешения Catalog остаются в ведении контроллера доступа по умолчанию.
- Doris отправляет имена ролей, которые в данный момент назначены пользователю Doris, в контексте запроса. Поле политики Ranger `Roles` может сопоставляться с этими именами. Это только условие политики Ranger; оно не приводит к учёту внутренних разрешений Doris на объекты при принятии решения Ranger-Hive.
- Doris и Ranger не синхронизируют роли. Имена ролей в запросе Doris должны совпадать с именами ролей, указанными в Ranger, только если политики настроены на основе ролей. Политики Ranger на основе пользователей или групп обычно проще сопровождать.
- Ranger UserSync не создаёт пользователей для входа в Doris. Даже если в Ranger есть `alice`, создайте `alice` в Doris или настройте аутентификацию пользователя через LDAP либо другой настроенный провайдер.
- Часть учётной записи Doris, задающая хост, используется для сопоставления при входе и для IP-адреса клиента в аудите, но не входит в имя пользователя Ranger. Например, пользователь Doris `'alice'@'10.%'` соответствует пользователю Ranger `alice`.

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## Фильтрация строк и маскирование данных {#row-filtering-and-data-masking}

### Фильтр на уровне строк {#row-level-filter}

Создайте политику фильтрации на уровне строк в `hive_prod`:

| Поле | Пример |
| --- | --- |
| База данных | `sales` |
| Таблица | `orders` |
| Пользователь | `alice` |
| Фильтр на уровне строк | `region = 'CN'` |

Политика доступа также должна предоставлять `alice` разрешение `select` для `sales.orders`. Фильтр строк лишь добавляет выражение фильтрации; он не заменяет базовую авторизацию доступа.

Выполните:

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

Результат содержит только строки, для которых выполняется условие `region = 'CN'`.

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

Также предоставьте `alice` разрешение `select` для столбца. При запросе `phone` Doris заменяет `{col}` в выражении Ranger фактическим именем столбца и применяет выражение маскирования.

:::caution
Выражения фильтрации строк и маскирования разбирает SQL-движок Doris. Выражение, написанное для HiveServer2, необходимо переписать, если оно использует UDF Hive или синтаксис, который Doris не поддерживает.
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## Если Ranger Admin использует Kerberos {#when-ranger-admin-uses-kerberos}

В этом разделе описана настройка клиента Ranger-Hive в FE для аутентификации в Ranger Admin по HTTP/SPNEGO. Аутентификация Kerberos в Ranger Admin отличается от аутентификации сервисов Hive/HMS через Kerberos. Они могут использовать одну область Kerberos, но у каждого подключения есть собственные сервисный principal, клиентский principal, keytab-файл и расположение конфигурации.

| Подключение | Пример учётной записи сервера | Пример клиентской учётной записи Doris | Назначение и настройка |
| --- | --- | --- | --- |
| FE к Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | Загрузка политик; настройки сервера находятся в Ranger Admin, а настройки клиента в `fe/conf/ranger-hive-security.xml` |
| FE к HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | Чтение метаданных; настраивается свойствами Hive Catalog `hive.metastore.*` |
| FE/BE к HDFS | Сервисные principal NameNode/DataNode | `doris/hive-client.example.com@EXAMPLE.COM` | Чтение данных; настраивается свойствами Hive Catalog `hdfs.authentication.*` |

:::caution Требование к версии
Для Doris 4.x требуется версия **4.0.2 или новее**. Doris 4.0.0 и 4.0.1 включают Ranger 2.4, в котором отсутствует используемый здесь вход UGI плагина Ranger с keytab-файлом. В Doris 4.0.2 Ranger обновлён до 2.7. Версия Ranger в Current поддерживает эту возможность.
:::

### 1. Проверка учётных записей Kerberos для Ranger Admin и FE {#1-confirm-the-ranger-admin-and-fe-kerberos-identities}

Сначала проверьте конфигурацию сервера Ranger Admin. Apache Ranger обычно загружает `core-site.xml` и `ranger-admin-site.xml` из каталога `WEB-INF/classes/conf/` развёрнутого веб-приложения. Пути могут различаться в зависимости от дистрибутива, поэтому ориентируйтесь на аргументы запуска Ranger Admin или структуру установки.

| Файл | Свойство | Значение |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Аутентификация Hadoop, используемая фильтром SPNEGO в Ranger Admin; для защищённой загрузки плагином укажите `kerberos` |
| `ranger-admin-site.xml` | `ranger.service.host` | Имя хоста сервиса Ranger Admin и значение, подставляемое вместо `_HOST` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | Сервисный principal HTTP/SPNEGO, например `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Путь к серверному keytab-файлу SPNEGO, который читает Ranger Admin |

`ranger.authentication.method` управляет входом в Ranger WebUI и само по себе не подтверждает, что защищённая конечная точка загрузки для плагинов использует SPNEGO. Проверьте действующий `ranger-admin-site.xml` и журналы запуска Ranger Admin.

На сервере Ranger Admin выполните `klist -kt <actual ranger.spnego.kerberos.keytab path>` и убедитесь, что keytab-файл содержит HTTP principal после подстановки `_HOST`, например `HTTP/ranger-admin.example.com@EXAMPLE.COM`. Имя хоста в `ranger.plugin.hive.policy.rest.url` должно соответствовать этому principal.

Ranger не создаёт клиентский principal или keytab-файл FE. Администратор Kerberos должен создать учётную запись, например `doris/ranger-client.example.com@EXAMPLE.COM`, экспортировать её в `/etc/security/keytabs/doris-ranger.keytab`, разместить этот файл на каждом FE и предоставить пользователю процесса FE доступ на чтение. Не передавайте FE HTTP principal Ranger Admin или серверный keytab-файл SPNEGO.

В этом разделе используются следующие значения:

| Элемент | Пример |
| --- | --- |
| Имя сервиса Ranger Hive | `hive_prod` |
| URL Ranger Admin | `http://ranger-admin.example.com:6080` |
| Область Kerberos | `EXAMPLE.COM` |
| Сервисный HTTP principal Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| Principal FE для загрузки политик | `doris/ranger-client.example.com@EXAMPLE.COM` |
| Клиентский keytab-файл FE | `/etc/security/keytabs/doris-ranger.keytab` |

HTTP principal является серверной учётной записью Ranger Admin. Не указывайте его в свойстве FE `ugi.keytab.principal`; это свойство должно содержать клиентскую учётную запись FE.

### 2. Инициализация Hadoop UGI в режиме Kerberos {#2-initialize-hadoop-ugi-in-kerberos-mode}

Недостаточно добавить только свойства `ugi.*` в `ranger-hive-security.xml`. Ranger вызывает `UserGroupInformation.loginUserFromKeytab()`, а вход с keytab-файлом создаёт учётные данные Kerberos только тогда, когда для глобальной аутентификации Hadoop задано значение `kerberos`.

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

`start_fe.sh` добавляет каталог FE `conf` в Java classpath, поэтому рекомендуется использовать `fe/conf/core-site.xml`. Чтобы вместо этого использовать общий каталог конфигурации Hadoop, задайте в `fe.conf`:

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

В этом случае `/etc/hadoop/conf/core-site.xml` должен существовать и быть доступен для чтения пользователю процесса FE до перезапуска всех FE.

### 3. Настройка krb5.conf и HTTP SPN Ranger Admin {#3-configure-krb5conf-and-the-ranger-admin-http-spn}

Настройте область Kerberos, KDC и сопоставление `domain_realm` для имени хоста из URL Ranger Admin в `/etc/krb5.conf` на каждом FE:

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

Имя хоста в `ranger.plugin.hive.policy.rest.url` должно соответствовать SPN в keytab-файле HTTP/SPNEGO Ranger Admin. Для хоста URL `ranger-admin.example.com` серверный keytab-файл должен содержать:

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

Не смешивайте короткое имя хоста, FQDN, CNAME, VIP и IP-адрес. Если в URL используется короткое имя хоста, например `http://ranger-admin:6080`, добавьте точное сопоставление в дополнение к сопоставлению домена:

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

Установите клиентские инструменты Kerberos, предоставляющие команды `kinit`, `klist`, `kdestroy` и `kvno`. Выполните следующие команды от имени пользователя процесса FE. Они используют отдельный кэш билетов и не удаляют существующие учётные данные. Сначала замените principal, keytab-файл и имя хоста:

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

`klist -kt` должна показать клиентский principal FE. Успешное выполнение `kinit` обычно не сопровождается выводом. Успешное выполнение `kvno`, после которого `klist` показывает и `krbtgt/...`, и HTTP-билет Ranger Admin, подтверждает корректность клиентского keytab-файла, сопоставления областей Kerberos и HTTP SPN. Последняя команда `kdestroy` удаляет только временный кэш, используемый для этой проверки.

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

Свойства для Kerberos:

| Свойство | Описание |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Выполнять вход Hadoop UGI при инициализации плагина Ranger-Hive |
| `ranger.plugin.hive.ugi.login.type` | Для входа с keytab-файлом задайте `keytab` |
| `ranger.plugin.hive.ugi.keytab.principal` | Клиентский principal, используемый FE для загрузки политик Ranger; он должен присутствовать в keytab-файле |
| `ranger.plugin.hive.ugi.keytab.file` | Абсолютный путь к клиентскому keytab-файлу; он должен быть одинаковым на всех FE и доступным для чтения пользователю процесса FE |

`ranger.plugin.hive.policy.rest.secure=true` не определяет выбор пути загрузки через Kerberos. Клиент Ranger проверяет, работает ли Hadoop UGI в защищённом режиме и есть ли у вошедшего пользователя учётные данные Kerberos. Используйте `secureMode` в журнале FE, чтобы подтвердить выбранный режим.

### 5. Разрешение сервисной учётной записи FE загружать политики hive_prod {#5-allow-the-fe-service-identity-to-download-hive_prod-policies}

На этом шаге предоставляется разрешение **сервисной учётной записи, которую FE использует для загрузки политик**. Это не пользователь запросов Doris `alice`, и это разрешение не предоставляет данной учётной записи доступ к данным Hive.

После включения Kerberos в Ranger Admin загрузка политик проходит две проверки:

1. Ranger Admin аутентифицирует principal из keytab-файла FE через SPNEGO.
2. Ranger Admin проверяет, разрешено ли аутентифицированному идентификатору входа загружать данные для `hive_prod`.

Преобразование учётной записи в этом примере:

| Этап | Пример | Назначение |
| --- | --- | --- |
| Principal в keytab-файле FE | `doris/ranger-client.example.com@EXAMPLE.COM` | Аутентификация SPNEGO |
| Идентификатор входа Ranger Admin | `doris` | Учётная запись после преобразования principal по правилам `auth_to_local` |
| Рекомендуемая настройка сервиса Hive | `policy.download.auth.users=doris` | Разрешить этой учётной записи FE загружать данные политик и ролей |

Для обычной сервисной учётной записи FE используйте свойство сервиса Hive `policy.download.auth.users`, чтобы предоставить доступ к загрузке с минимальными привилегиями. Отредактируйте сервис Hive `hive_prod` в Ranger WebUI и убедитесь, что его конфигурация содержит:

```text
policy.download.auth.users=doris
```

Здесь `doris` — идентификатор входа в аутентифицированном сеансе Ranger Admin, а не пользователь запросов Doris. Фильтр SPNEGO Ranger Admin применяет `hadoop.security.auth_to_local` из своего `core-site.xml`; используйте `doris` только в том случае, если это правило преобразует principal из примера в `doris`. Проверьте фактический идентификатор входа в журналах аутентификации Ranger Admin, не предполагая, что это полный principal или определённое короткое имя.

Apache Ranger 2.7 разделяет значение `policy.download.auth.users` по запятым и сравнивает каждый элемент с идентификатором входа на точное совпадение без учёта регистра. Для нескольких учётных записей используйте список через запятую без пробелов, например `doris,hive`. Администраторы Ranger и пользователи, перечисленные в `policy.grantrevoke.auth.users`, также могут пройти авторизацию загрузки, но FE нужен только доступ к загрузке, и ему не следует предоставлять для этой цели более широкие права на выдачу и отзыв разрешений.

### 6. Перезапуск FE и проверка защищённой загрузки политик {#6-restart-the-fes-and-verify-secure-policy-download}

Перезапустите все FE и сначала найдите в журнале FE сообщение следующего вида:

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

Затем вызовите защищённую конечную точку политик от имени пользователя процесса FE с тем же keytab-файлом. Перед выполнением убедитесь, что `curl --version` сообщает о поддержке GSS-API, Kerberos или SPNEGO:

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

Критерием успешной сквозной проверки является ответ HTTP 200 с полным JSON политик. Успешное выполнение `kinit`, `kvno` или значение `secureMode=true` подтверждают только часть пути и не заменяют результат загрузки.

После загрузки политик каталог кэша из примера должен содержать:

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Если Ranger Admin, HMS и HDFS используют Kerberos {#7-when-ranger-admin-hms-and-hdfs-all-use-kerberos}

Если Hive Metastore и HDFS также используют Kerberos, используйте следующее определение Catalog **вместо** оператора `CREATE CATALOG hive_ctl` из раздела быстрого старта. Не создавайте один и тот же Catalog дважды. Здесь `doris-ranger.keytab` предназначен только для загрузки политик на FE, а `doris-hive.keytab` — для доступа к HMS и HDFS:

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

У этих двух клиентских учётных записей разные назначения:

- `doris-ranger.keytab` позволяет FE загружать политики из Ranger Admin через SPNEGO; его нужно размещать только на FE.
- `doris-hive.keytab` используется для доступа к HMS и HDFS. Разместите клиентский keytab-файл HMS на каждом FE. Разместите клиентский keytab-файл HDFS по одному и тому же абсолютному пути с доступом на чтение на каждом FE и BE, обращающемся к HDFS. HMS и HDFS могут использовать разные клиентские учётные записи, если соответствующие свойства настроены отдельно.

Получите серверный principal HMS из конфигурации Kerberos Hive Metastore. Пример `hive/hms.example.com@EXAMPLE.COM` не является HTTP principal Ranger Admin. Подключения могут использовать одну область Kerberos, но их principal и keytab-файлы не взаимозаменяемы.

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

В следующем примере используются сертификат CA Ranger Admin `/tmp/ranger-admin-ca.pem` и пользователь и группа процесса FE `doris:doris`. Подготовьте хранилище доверенных сертификатов и провайдер учётных данных JCEKS на каждом FE. Для команд требуются JDK `keytool` и Hadoop `hadoop credential`:

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

`keytool` запрашивает пароль хранилища доверенных сертификатов, а `hadoop credential` — значение `sslTrustStore`. Введите один и тот же пароль в обоих случаях. Замените временный путь CA путём, используемым для управления сертификатами в вашей среде, и убедитесь, что пользователь процесса FE может читать оба файла.

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

Клиент Ranger читает пароль хранилища доверенных сертификатов по фиксированному псевдониму `sslTrustStore`. Для взаимного TLS дополнительно требуются `xasecure.policymgr.clientssl.keystore` и псевдоним `sslKeyStore` в JCEKS. Не размещайте пароли хранилищ доверенных сертификатов или ключей в XML в открытом виде.

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## Несколько Catalog и ограничения во время выполнения {#multiple-catalogs-and-runtime-constraints}

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

Ресурсы Ranger Hive не содержат уровня Catalog, поэтому одинаковые имена баз данных, таблиц и столбцов соответствуют одной и той же политике. Используйте общий сервис только тогда, когда оба Metastore намеренно используют общие имена ресурсов и границы авторизации.

### Разные экземпляры сервиса Ranger Hive {#different-ranger-hive-service-instances}

Стандартному префиксу `hive` соответствует один файл `ranger-hive-security.xml`, поэтому все Catalog с Ranger-Hive в одном FE читают одно и то же свойство `ranger.plugin.hive.service.name`. Текущий интерфейс Catalog не позволяет каждому Catalog выбирать отдельное имя сервиса Ranger Hive. Не указывайте имя сервиса WebUI, например `hive_prod_a`, в свойстве Catalog `ranger.service.name`; в этом случае Ranger будет искать `ranger-hive_prod_a-security.xml` и `ranger.plugin.hive_prod_a.*`, что выходит за рамки описанной здесь стандартной конфигурации Hive. Чтобы изолировать независимые сервисы Ranger Hive, используйте отдельные кластеры Doris или настройте Catalog на совместное использование одного сервиса политик Ranger Hive.

### Ограничения во время выполнения и рекомендации {#runtime-constraints-and-best-practices}

- Используйте Ranger-Hive только для Catalog Hive/HMS; это не универсальный контроллер Ranger для всех внешних Catalog.
- Политики Ranger-Hive и Ranger-Doris не синхронизируются. Храните их файлы конфигурации и каталоги кэша политик раздельно.
- Провайдеры аудита Ranger являются общими для всего процесса FE. Первый инициализированный плагин Ranger определяет, включён ли аудит и куда направляются записи. При совместном включении Ranger-Doris и Ranger-Hive задайте в обоих XML-файлах аудита одинаковое состояние включения и одно централизованное место назначения, чтобы результат не зависел от порядка инициализации.
- Состояние входа Hadoop UGI является глобальным в пределах JVM FE. При совместном использовании Ranger-Doris и Ranger-Hive или нескольких Catalog Ranger с включённым Kerberos используйте один и тот же клиентский principal и keytab-файл Ranger. Последующий вход с другой учётной записью может заменить учётную запись входа процесса и нарушить стабильную загрузку политик.
- Ranger-Hive не проверяет политики Ranger для HDFS, S3 или объектных хранилищ. Для доступа к хранилищу по-прежнему используются учётные данные, настроенные для Catalog Doris.
- Ресурсы Ranger Hive не содержат уровня Catalog Doris. Проверьте возможные конфликты одноимённых баз данных и таблиц в разных Metastore.
- Doris и Ranger не синхронизируют пользователей или роли. Определите единые правила именования и проверяйте как разрешённые, так и отклонённые запросы с обычными учётными записями.
- Если первая загрузка политик завершается ошибкой, плагин может использовать локальный кэш. Следите за актуальностью кэша и аудитом Ranger, чтобы использование устаревших политик не осталось незамеченным.
- Каждый FE, инициализирующий контроллер доступа, загружает и кэширует политики независимо. Поддерживайте одинаковые файлы конфигурации, keytab-файлы, хранилища доверенных сертификатов и права доступа к каталогам на всех FE.
- Изменения политик применяются не мгновенно. Максимальная задержка обычно близка к `policy.pollIntervalMs` плюс задержки Ranger Admin и сети.

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## Устранение неполадок {#troubleshooting}

Используйте таблицу симптомов, чтобы определить первую проверку, затем перейдите к соответствующему разделу с описанием причины и полной процедуры:

| Симптом | Первая проверка |
| --- | --- |
| При создании Catalog не удаётся найти контроллер доступа | Убедитесь, что `access_controller.class` содержит полное имя класса фабрики или `ranger-hive` |
| В журнале сообщается, что `ranger-hive-security.xml` не найден | Убедитесь, что префикс Catalog строго задан как `hive`, а файл существует в `fe/conf/` на каждом FE |
| XML-файл безопасности не действует при отключённом аудите | Разместите `ranger-hive-audit.xml` и явно отключите аудит |
| Ranger Admin доступен, но политики не загружаются | Проверьте имя сервиса, REST URL, сетевой доступ, каталог кэша и состояние политик |
| После включения Kerberos загрузка политик завершается ошибкой | Проверьте защищённый режим UGI, HTTP SPN, разрешение на загрузку, статус HTTP и кэш политик |
| Ranger разрешает доступ пользователю, но Catalog не виден | Проверьте разрешение на уровне Catalog в контроллере доступа по умолчанию |
| Запрещающая политика Ranger не действует | Проверьте глобальные разрешения и не выполняйте проверку от имени `root` или `admin` |
| Политика работает в HiveServer2, но не в Doris | Проверьте имя сервиса, имена пользователей и ролей, а также совместимость выражений |
| Пользователь может напрямую читать HDFS или S3 | Ranger-Hive не обеспечивает контроль доступа к нижележащему хранилищу |

### При создании Catalog сообщается, что контроллер доступа не найден {#catalog-creation-reports-that-the-access-controller-cannot-be-found}

Используйте актуальное имя класса фабрики:

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current и 4.x также поддерживают короткий идентификатор:

```sql
'access_controller.class' = 'ranger-hive'
```

Не используйте `hive`, `hive_prod` или старое имя класса `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory`. Убедитесь, что все FE работают на одной версии Doris, и найдите в журнале FE `Access Controller Plugin Factory`.

### В журнале сообщается, что ranger-hive-security.xml не найден {#the-log-says-ranger-hive-securityxml-cannot-be-found}

Часто путают два параметра:

- Свойство Catalog `'access_controller.properties.ranger.service.name' = 'hive'` выбирает плагин Ranger Hive и должно сохранять значение `hive`. Doris использует его, чтобы найти `ranger-hive-security.xml` и прочитать настройки `ranger.plugin.hive.*`.
- `ranger.plugin.hive.service.name` внутри `ranger-hive-security.xml` задаёт фактическое имя сервиса Hive в Ranger WebUI, например `hive_prod`.

Если в Catalog ошибочно указано `hive_prod`, Ranger ищет `ranger-hive_prod-security.xml`. Убедитесь, что `ranger-hive-security.xml` существует в `fe/conf/` на каждом FE, и перезапустите все FE после исправления.

### Почему ranger-hive-audit.xml необходим при отключённом аудите {#why-ranger-hive-auditxml-is-required-when-audit-is-disabled}

Когда Ranger 2.7 не может найти `ranger-hive-audit.xml`, он переходит к устаревшему резервному механизму, который ищет `hive-site.xml`, `hbase-site.xml` или `hdfs-site.xml`, а затем пытается загрузить `xasecure-audit.xml` из того же каталога. Если этот файл отсутствует, загружаемый позже `ranger-hive-security.xml` тоже может не подействовать. Всегда размещайте `ranger-hive-security.xml` и `ranger-hive-audit.xml` вместе; задайте `xasecure.audit.is.enabled=false`, если аудит не нужен. `core-site.xml` не входит в этот устаревший список поиска файлов аудита и не является непосредственной причиной проблемы.

### Ranger Admin доступен, но политики не загружаются {#ranger-admin-is-reachable-but-no-policy-is-downloaded}

Проверьте по порядку:

1. `ranger.plugin.hive.service.name` точно совпадает с именем сервиса WebUI `hive_prod`.
2. `ranger.plugin.hive.policy.rest.url` является корневым URL Ranger Admin.
3. Сеть, DNS и хранилище доверенных сертификатов HTTPS на FE обеспечивают доступ к Ranger Admin.
4. Каталог кэша существует и доступен для записи пользователю процесса FE.
5. Сервис Ranger включён, а его политики сохранены.

Если Ranger Admin использует Kerberos, перейдите к следующему пункту устранения неполадок.

### После включения Kerberos в Ranger Admin загрузка политик завершается ошибкой {#policy-download-fails-after-ranger-admin-enables-kerberos}

Проверьте путь загрузки по порядку:

1. **Подтвердите режим Kerberos.** Журнал FE должен содержать `secureMode=true` и `(auth:KERBEROS)`. Если в нём указано `secureMode=false` или `(auth:SIMPLE)`, проверьте `hadoop.security.authentication=kerberos` в `core-site.xml`, поместите файл в `fe/conf/` или в каталог, добавленный в classpath через `HADOOP_CONF_DIR`, и перезапустите каждый FE. Не полагайтесь только на каталог по умолчанию `hadoop_config_dir` в `plugins/hadoop_conf/`; этот каталог предназначен прежде всего для подключений Catalog/Hadoop, и его видимость при инициализации глобального UGI плагином Ranger не гарантируется. Для 4.x используйте 4.0.2 или новее и убедитесь, что `ranger.plugin.hive.forceNonKerberos=true` не задано случайно.
2. **Подтвердите наличие сервисного HTTP-билета.** От имени пользователя процесса FE выполните проверки `kinit` и `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` из основной процедуры настройки Kerberos. При ошибках `Server not found in Kerberos database`, `No service creds` или запросе неправильного `krbtgt/<REALM>` сопоставьте имя хоста в URL, HTTP SPN Ranger Admin, DNS и правила в `/etc/krb5.conf`. В URL и SPN должно использоваться в точности одно и то же имя хоста.
3. **Подтвердите разрешение на загрузку.** После аутентификации SPNEGO найдите фактический идентификатор входа в журналах Ranger Admin. Для используемой здесь обычной учётной записи FE укажите этот идентификатор в свойстве сервиса `hive_prod` `policy.download.auth.users`. Apache Ranger 2.7 также разрешает загрузку администраторам Ranger и учётным записям из `policy.grantrevoke.auth.users`, но не предоставляйте более широкие права на выдачу и отзыв разрешений только ради загрузок FE. Если WebUI не отображает `policy.download.auth.users`, проверьте или обновите это свойство через конфигурацию установки плагина Ranger в вашем дистрибутиве либо через REST API сервиса Ranger. При обновлении через REST сохраняйте все существующие настройки сервиса.
4. **Проверьте статус защищённой конечной точки.** Повторите команду `curl --negotiate` из шага 6 настройки Kerberos и сохраните тело ответа. В стандартном Apache Ranger 2.7 статус HTTP 401 означает ошибку аутентификации SPNEGO; 403 означает, что идентификатор входа аутентифицирован, но не является администратором и отсутствует в обоих списках авторизованных пользователей; 404 обычно означает, что имя сервиса в XML не совпадает с именем в Ranger WebUI; только 200 с полным JSON политик подтверждает успех. Дистрибутивы поставщиков могут иначе обрабатывать статусы, поэтому также проверьте журналы Ranger Admin. Успешное выполнение `kinit` доказывает только получение клиентского TGT.
5. **Проверьте кэш политик.** Успешная загрузка создаёт оба файла: `hive_hive_prod.json` и `hive_hive_prod_roles.json`. Если существует только небольшой файл ролей, основная политика всё ещё не загружена. Проверьте ответ `getServicePoliciesIfUpdated` и сообщения журнала FE, например `policy engine initialization failed` или ошибки записи кэша.

### Ranger разрешает доступ пользователю, но SHOW CATALOGS не показывает Catalog {#ranger-allows-the-user-but-show-catalogs-does-not-show-the-catalog}

Проверка на уровне Catalog находится в ведении контроллера доступа по умолчанию. При использовании встроенной авторизации Doris предоставьте разрешение для Catalog:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

В Current также можно рассмотреть `skip_catalog_priv_check=true`, который влияет только на проверки `SHOW` и `SELECT` на уровне внешних Catalog с пользовательскими контроллерами доступа.

### Запрещающая политика Ranger не действует {#a-ranger-deny-policy-does-not-take-effect}

Проверьте, есть ли у пользователя глобальное разрешение Doris. Соответствующее глобальное разрешение от контроллера доступа по умолчанию может обеспечить успешную итоговую проверку, даже если Ranger-Hive не разрешил доступ к базе данных, таблице или столбцу. Проверяйте с обычным пользователем, у которого нет ни `ADMIN_PRIV`, ни глобального разрешения `SELECT_PRIV`.

### Политика работает в HiveServer2, но не в Doris {#a-policy-works-in-hiveserver2-but-not-in-doris}

Убедитесь, что Doris и HiveServer2 читают один и тот же сервис Ranger Hive, а выражения политик используют синтаксис SQL, поддерживаемый Doris. Также убедитесь, что имя пользователя и имена ролей в запросе Doris точно совпадают с указанными в политике Ranger.

### Предотвращает ли Ranger-Hive прямой доступ к HDFS или S3? {#does-ranger-hive-prevent-direct-hdfs-or-s3-access}

Нет. Ranger-Hive выполняет авторизацию запросов к базам данных, таблицам и столбцам Hive только на уровне SQL Doris. Доступ к HDFS, S3 и другим хранилищам использует настройки аутентификации хранилища в Catalog и требует отдельного контроля доступа на стороне хранилища и изоляции учётных данных.

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## Контрольный список для рабочей среды {#production-checklist}

- В Ranger WebUI выбран тип сервиса Hive, а его имя точно совпадает со значением в XML.
- На каждом FE есть корректные для разбора `ranger-hive-security.xml` и `ranger-hive-audit.xml`; если аудит не нужен, он явно отключён в XML-файле аудита.
- Ranger-Doris и Ranger-Hive используют отдельные каталоги кэша политик, доступные для записи пользователю процесса FE.
- Свойство Catalog `access_controller.class` содержит полное имя класса фабрики Ranger-Hive или поддерживаемый идентификатор `ranger-hive`, а префикс конфигурации имеет значение `hive`.
- Имя обычного пользователя Doris совпадает с именем пользователя Ranger. Если роли Doris участвуют в политиках Ranger, указанные в политиках имена ролей совпадают.
- Проверены разрешённый доступ, запрещённый доступ, разрешения на столбцы, фильтрация строк и маскирование данных.
- Разрешение на уровне Catalog предоставляется контроллером доступа по умолчанию, а у тестовых пользователей нет глобального разрешения, позволяющего обходить предусмотренные проверки Ranger-Hive.
- При использовании Kerberos или HTTPS в Ranger Admin все FE используют согласованные keytab-файлы, хранилища доверенных сертификатов, `krb5.conf` и абсолютные пути.
- Одноимённые базы данных и таблицы в разных Catalog проверены, чтобы предотвратить непреднамеренное расширение области действия политик.
- При включённом аудите настроенное место назначения содержит записи о разрешениях и отказах Doris; для просмотра аудита в Ranger WebUI также требуется соответствующее централизованное хранилище, например Solr.
