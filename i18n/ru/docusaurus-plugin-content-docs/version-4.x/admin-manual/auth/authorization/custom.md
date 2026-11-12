---
{
    "title": "Собственный плагин авторизации",
    "language": "ru",
    "description": "Напишите сторонний плагин авторизации для Apache Doris, реализовав SPI AccessControllerFactory и CatalogAccessController, зарегистрируйте его через файл службы или внешний jar-файл плагина и подключите с помощью конфигурации access_controller.",
    "keywords": [
        "собственная авторизация Apache Doris",
        "контроллер доступа Doris",
        "AccessControllerFactory",
        "CatalogAccessController",
        "сторонний плагин авторизации",
        "access_controller_type",
        "access_controller.class",
        "SPI авторизации Doris",
        "внешний модуль авторизации"
    ]
}
---

<!-- Knowledge type: Extension guide / Architecture decision -->
<!-- Applicable scenario: integrate Apache Doris privilege checks with an external authorization system -->

Помимо [встроенной модели авторизации](./internal) и интеграции с [Apache Ranger](./ranger), Apache Doris предоставляет интерфейс поставщика сервисов (SPI), позволяющий подключить собственную систему авторизации. После регистрации собственного контроллера доступа Doris передаёт проверки привилегий вашему коду вместо встроенного механизма `GRANT`/`REVOKE`. Это позволяет использовать для авторизации в Doris внешнее хранилище политик, например OpenFGA, OPA или внутренний сервис управления правами доступа.

В этом документе описаны интерфейсы, которые необходимо реализовать, механизм обнаружения и загрузки контроллера в Doris, конфигурация для его выбора и каркас реализации, с которого можно начать. Интеграция с Ranger служит эталонной реализацией: её код полезно изучать параллельно с этой страницей.

:::note
Эта страница описывает контракт `AccessControllerFactory` / `CatalogAccessController` в Doris 4.x. В разрабатываемой версии используется новый SPI авторизации и другая структура пакетов; не используйте примеры из неё с 4.x. Компилируйте плагины для той же версии Doris, которую развёртываете.
:::

## Сценарии применения {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Централизованное хранилище политик | Решения о доступе уже принимаются во внешней системе (OpenFGA, OPA, собственном сервисе), и вы хотите, чтобы Doris обращался к ней, а не поддерживал отдельную копию правил |
| Доступ на основе отношений | Вам нужны детальные правила или правила на основе отношений (в стиле Zanzibar / ReBAC), которые нельзя напрямую выразить во встроенной модели RBAC |
| Общая авторизация для нескольких движков | Несколько движков запросов используют единый источник политик, и Doris должен соблюдать те же решения о доступе |
| Собственное маскирование или фильтрация строк | Вы хотите управлять маскированием столбцов или фильтрами на уровне строк с помощью собственных определений политик |

## Интерфейс поставщика сервисов {#the-service-provider-interface}

Собственный модуль авторизации реализует два Java-интерфейса из пакета `org.apache.doris.mysql.privilege`:

- `AccessControllerFactory` создаёт экземпляр контроллера и задаёт ему постоянный идентификатор.
- `CatalogAccessController` принимает отдельные проверки привилегий.

Необходимо реализовать оба интерфейса, зарегистрировать фабрику и указать её идентификатор в конфигурации.

### CatalogAccessController {#catalogaccesscontroller}

`CatalogAccessController` отвечает за принятие каждого решения о доступе. Doris вызывает отдельный метод для каждого уровня объектов. Возвращаемое значение типа `boolean`, равное `true`, означает, что операция разрешена; `false` означает отказ.

```java
public interface CatalogAccessController {
    // Global
    boolean checkGlobalPriv(UserIdentity currentUser, PrivPredicate wanted);

    // Catalog
    boolean checkCtlPriv(UserIdentity currentUser, String ctl, PrivPredicate wanted);

    // Database
    boolean checkDbPriv(UserIdentity currentUser, String ctl, String db, PrivPredicate wanted);

    // Table
    boolean checkTblPriv(UserIdentity currentUser, String ctl, String db, String tbl, PrivPredicate wanted);

    // Column (throws when access is denied instead of returning a boolean)
    void checkColsPriv(UserIdentity currentUser, String ctl, String db, String tbl,
            Set<String> cols, PrivPredicate wanted) throws AuthorizationException;

    // Resource
    boolean checkResourcePriv(UserIdentity currentUser, String resourceName, PrivPredicate wanted);

    // Workload Group
    boolean checkWorkloadGroupPriv(UserIdentity currentUser, String workloadGroupName, PrivPredicate wanted);

    // Cloud (compute cluster / stage, addressed by ResourceTypeEnum)
    boolean checkCloudPriv(UserIdentity currentUser, String cloudName, PrivPredicate wanted, ResourceTypeEnum type);

    // Storage Vault
    boolean checkStorageVaultPriv(UserIdentity currentUser, String storageVaultName, PrivPredicate wanted);

    // Column data masking (return an empty Optional for no masking)
    Optional<DataMaskPolicy> evalDataMaskPolicy(UserIdentity currentUser, String ctl, String db, String tbl,
            String col);

    // Row-level filtering (return an empty list for no filtering)
    List<? extends RowFilterPolicy> evalRowFilterPolicies(UserIdentity currentUser, String ctl, String db, String tbl);
}
```

Перед реализацией стоит учесть несколько моментов:

- Аргумент `wanted` имеет тип `PrivPredicate`, который объединяет конкретные привилегии, необходимые для операции (например, `SELECT`, `LOAD`, `ADMIN`). Сопоставьте его с понятиями, которые поддерживает ваше хранилище политик.
- `checkColsPriv` отличается от остальных методов. Он не возвращает логическое значение, а выбрасывает `AuthorizationException` при отказе в доступе, поэтому нормальное завершение метода означает, что доступ к столбцам разрешён.
- Интерфейс предоставляет перегрузки с реализацией по умолчанию (`default`) для методов `checkCtlPriv`, `checkDbPriv`, `checkTblPriv` и `checkColsPriv`, которые принимают первым параметром `boolean hasGlobal`. Методы, возвращающие логическое значение, сначала вызывают проверку на соответствующем уровне, а затем объединяют её результат с `hasGlobal`; сам вызов проверки не пропускается. Перегрузка для столбцов вызывает проверку на соответствующем уровне и подавляет `AuthorizationException`, если `hasGlobal` имеет истинное значение. Обычно достаточно реализовать показанные здесь методы, оставив реализациям по умолчанию обработку разрешения доступа на основании глобальных прав.
- `evalDataMaskPolicy` и `evalRowFilterPolicies` предназначены для маскирования и фильтрации строк. Если ваша система ими не управляет, возвращайте `Optional.empty()` и пустой список. Именно так работает встроенный контроллер.

### AccessControllerFactory {#accesscontrollerfactory}

`AccessControllerFactory` — это точка входа, которую обнаруживает Doris. Она задаёт имя поставщика и создаёт контроллер на основе карты свойств.

```java
public interface AccessControllerFactory {
    // Identifier used in configuration, for example "ranger-doris".
    // Defaults to the simple class name if you do not override it.
    default String factoryIdentifier() {
        return this.getClass().getSimpleName();
    }

    CatalogAccessController createAccessController(Map<String, String> prop);
}
```

Карта `prop` содержит конфигурацию, передаваемую вашему контроллеру: адрес сервиса, учётные данные, идентификатор хранилища и другие параметры. Её источник зависит от того, используется ли контроллер для внутреннего или внешнего Catalog, как описано ниже в разделе [Конфигурация](#configuration).

## Регистрация плагина {#registering-the-plugin}

Doris обнаруживает фабрики двумя способами, оба реализованы в `AccessControllerManager`.

**Файл службы в classpath.** Добавьте полное имя класса вашей фабрики в файл Java `ServiceLoader`:

```
fe/fe-core/src/main/resources/META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory
```

Указывайте по одному имени класса на строку. Фабрики Ranger уже перечислены в этом файле. При таком подходе плагин компилируется в составе FE, поэтому он подходит для реализации, включённой в дерево исходного кода Doris.

**Внешний каталог плагинов.** При запуске Doris также загружает фабрики из внешнего каталога плагинов. Это позволяет поставлять контроллер в виде отдельного jar-файла и подключать его без пересборки FE. Включите в jar-файл собственную запись `META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory` и поместите JAR непосредственно в `authorization_plugins_dir` (по умолчанию `${DORIS_HOME}/plugins/authorization`). Загрузчик ищет JAR-файлы в корне этого каталога, а не в отдельных подкаталогах для каждого плагина. Включите необходимые зависимости в этот JAR, разверните его на каждом FE и перезапустите все FE. Этот вариант удобнее, если ваш контроллер использует SDK, который вы предпочли бы не добавлять в сборку FE.

## Конфигурация {#configuration}

Способ выбора контроллера зависит от того, каким Catalog он управляет.

### Внутренний Catalog {#internal-catalog}

Задайте контроллер для внутреннего Catalog с помощью параметра конфигурации FE `access_controller_type` (в `fe.conf`). Значение по умолчанию — `default`, при котором используется встроенный модуль авторизации. Значение `ranger-doris` выбирает контроллер Ranger. Чтобы использовать собственный контроллер для авторизации во внутреннем Catalog, укажите идентификатор вашей фабрики:

```
access_controller_type = your-controller-id
```

Свойства контроллера внутреннего Catalog считываются из файла, указанного в `authorization_config_file_path` (по умолчанию `conf/authorization.conf`; файл должен находиться внутри `DORIS_HOME`). Содержимое файла передаётся вашей фабрике в виде карты `prop`.

### Внешний Catalog {#external-catalog}

Внешний Catalog задаёт собственный модуль авторизации через свойства Catalog, поэтому разные Catalog могут использовать разные контроллеры. При создании или изменении Catalog задайте два свойства:

- `access_controller.class` — идентификатор фабрики или имя её класса.
- `access_controller.properties.*` — конфигурация контроллера. Doris удаляет префикс `access_controller.properties.` и передаёт оставшуюся часть в виде карты `prop`.

Например:

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "your-controller-id",
    "access_controller.properties.api_url" = "http://127.0.0.1:8080",
    "access_controller.properties.store_id" = "01H...",
    "access_controller.properties.token" = "..."
);
```

В этом примере контроллер получает `{"api_url": "...", "store_id": "...", "token": "..."}` в методе `createAccessController`.

## Минимальный каркас реализации {#a-minimal-skeleton}

Это схема реализации, а не самостоятельный файл исходного кода Java: поместите каждый публичный класс в отдельный файл, импортируйте используемые типы Doris и Java, реализуйте все пропущенные методы и предоставьте реализацию `MyPolicyClient`. Используйте исходный код соответствующего релиза как зависимость при компиляции.

Следующий каркас реализует оба интерфейса, оставляя заглушку на месте вызова внешнего сервиса политик. Для маскирования и фильтрации строк возвращаются пустые результаты. Это подходящее поведение по умолчанию, если ваша система проверяет отношения или роли, а не маскирует поля.

```java
package com.example.doris.authz;

public class MyAccessControllerFactory implements AccessControllerFactory {
    @Override
    public String factoryIdentifier() {
        return "my-authz";
    }

    @Override
    public CatalogAccessController createAccessController(Map<String, String> prop) {
        return new MyAccessController(prop);
    }
}

public class MyAccessController implements CatalogAccessController {
    private final MyPolicyClient client;

    public MyAccessController(Map<String, String> prop) {
        this.client = new MyPolicyClient(prop.get("api_url"), prop.get("token"));
    }

    @Override
    public boolean checkGlobalPriv(UserIdentity currentUser, PrivPredicate wanted) {
        return client.isAllowed(currentUser, "global", null, wanted);
    }

    @Override
    public boolean checkTblPriv(UserIdentity currentUser, String ctl, String db, String tbl, PrivPredicate wanted) {
        return client.isAllowed(currentUser, "table", ctl + "." + db + "." + tbl, wanted);
    }

    // checkCtlPriv, checkDbPriv, checkResourcePriv, checkWorkloadGroupPriv,
    // checkCloudPriv, checkStorageVaultPriv: same shape as above.

    @Override
    public void checkColsPriv(UserIdentity currentUser, String ctl, String db, String tbl,
            Set<String> cols, PrivPredicate wanted) throws AuthorizationException {
        for (String col : cols) {
            if (!client.isAllowed(currentUser, "column", ctl + "." + db + "." + tbl + "." + col, wanted)) {
                throw new AuthorizationException("Access denied on column " + col);
            }
        }
    }

    @Override
    public Optional<DataMaskPolicy> evalDataMaskPolicy(UserIdentity currentUser, String ctl, String db, String tbl,
            String col) {
        return Optional.empty();
    }

    @Override
    public List<? extends RowFilterPolicy> evalRowFilterPolicies(UserIdentity currentUser, String ctl, String db,
            String tbl) {
        return Collections.emptyList();
    }
}
```

## Эталонная реализация: Ranger {#reference-implementation-ranger}

Интеграция с Ranger служит готовым примером для изучения. `RangerDorisAccessControllerFactory` использует идентификатор `ranger-doris`, а `RangerDorisAccessController` реализует каждый метод проверки: создаёт ресурс для целевого объекта, сопоставляет каждую привилегию Doris с типом доступа Ranger и запрашивает у плагина Ranger, разрешён ли доступ. Он также реализует маскирование и фильтрацию строк на основе политик Ranger. Если вы сопоставляете проверки Doris с внешним движком политик, эту структуру можно использовать напрямую.

## Жизненный цикл и проверка {#lifecycle-and-verification}

Повторно используйте фоновые ресурсы только тогда, когда свойства контроллеров и области действия политик совместимы; не используйте один изменяемый контроллер для нескольких Catalog с разными учётными данными или сервисами политик. Если фабрика предоставляет общий экземпляр, обеспечьте безопасный параллельный доступ к нему. Фабрика Ranger намеренно использует такой подход: каждый контроллер запускает собственный механизм обновления политик Ranger, поэтому `RangerDorisAccessControllerFactory` возвращает единый общий контроллер для всех Catalog (см. [apache/doris#65570](https://github.com/apache/doris/pull/65570)). Фабрика, возвращающая новый контроллер для каждого Catalog, приводила бы к утечке одного потока обновления на каждый Catalog. Принимайте такое же решение, если ваш контроллер содержит ресурсы, которые должны существовать в единственном экземпляре на процесс FE.


После установки JAR сначала настройте тестовый внешний Catalog. Убедитесь, что пользователь с разрешённым доступом может выполнить запрос к таблице, а пользователь, которому доступ запрещён, получает ошибку доступа. Прежде чем выбирать плагин для внутреннего Catalog, проверьте отказ в доступе к столбцам, поведение при недоступности сервисов политик, маскирование и фильтры строк. Отсутствие фабрик или дескрипторов служб не позволяет создать выбранный контроллер; проверьте журнал запуска FE и пути развёртывания. Продолжайте использовать встроенный контроллер, пока плагин не пройдёт проверку.
