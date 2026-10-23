---
{
    "title": "Пользовательский плагин авторизации",
    "language": "ru",
    "description": "Реализуйте, упакуйте и настройте пользовательский источник авторизации с помощью SPI авторизации разрабатываемой версии.",
    "keywords": [
        "Doris authorization",
        "AuthorizationPlugin",
        "AuthorizationPluginFactory"
    ]
}
---

В разрабатываемой версии доступны `org.apache.doris.authorization.spi.AuthorizationPlugin` и `AuthorizationPluginFactory` для проверки прав доступа внешними системами, маскирования столбцов и фильтрации строк.

:::note
Этот интерфейс относится к разрабатываемой версии. В Doris 4.x используются `CatalogAccessController` / `AccessControllerFactory`; см. [руководство для версии 4.x](https://doris.apache.org/docs/4.x/admin-manual/auth/authorization/custom). Дескрипторы служб и структура каталогов в этих версиях различаются.
:::

## Предварительные требования {#prerequisites}

Выполняйте компиляцию с исходным кодом и JDK, соответствующими развёрнутому FE, используя `fe-authorization-api` и `fe-authorization-spi` как зависимости с областью действия provided. Не включайте классы API Doris в JAR плагина. Для развёртывания необходимы права на запись в каталог плагинов каждого FE и перезапуск FE. Для проверки используйте учётную запись с соответствующими правами администрирования каталога.

## Минимальная реализация фабрики {#minimal-factory}

Эта полная реализация фабрики создаёт плагин, который по умолчанию запрещает любые операции, требующие прав доступа, и позволяет проверить обнаружение плагина. Рабочий плагин политик должен переопределять `checkAction` или `checkPrivilege`, чтобы обращаться к своему источнику политик. Плагин, реализующий только `name()`, не может обслуживать запросы приложений.

```java
package com.example.doris.authz;

import java.util.Map;
import org.apache.doris.authorization.spi.AuthorizationContext;
import org.apache.doris.authorization.spi.AuthorizationPlugin;
import org.apache.doris.authorization.spi.AuthorizationPluginFactory;

public final class MyAuthorizationPluginFactory implements AuthorizationPluginFactory {
    @Override
    public String name() { return "my-authz"; }

    @Override
    public AuthorizationPlugin create(Map<String, String> properties,
            AuthorizationContext context) {
        return new AuthorizationPlugin() {
            @Override
            public String name() { return "my-authz"; }
        };
    }
}
```

Добавьте имя класса фабрики в следующий дескриптор службы внутри JAR:

```text
META-INF/services/org.apache.doris.authorization.spi.AuthorizationPluginFactory
```

```text
com.example.doris.authz.MyAuthorizationPluginFactory
```

## Семантика интерфейса {#interface-semantics}

- `checkPrivilege(subject, resource, requirement, context)` разрешает доступ при завершении без исключения и запрещает его, выбрасывая `AccessDeniedException`. Реализация по умолчанию вызывает `checkAction` для действий, указанных в требовании, с семантикой ALL/ANY. Нереализованные проверки запрещают доступ.
- `getRowFilters` возвращает `List<RowFilterSpec>`; `getDataMasks` возвращает `Map<String, DataMaskSpec>`, где ключами служат имена столбцов. Пустые коллекции означают отсутствие политики, а не предоставление доступа. Никогда не возвращайте NULL. Если политики невозможно загрузить, выбросьте исключение, чтобы выполнение оператора завершилось ошибкой.
- Для каждого ресурса решение принимает один источник авторизации: источники, привязанные к каталогу, управляют доступом к объектам внутри каталога; источник уровня экземпляра управляет доступом к объектам экземпляра и выдачей прав на уровне каталога. Плагин самостоятельно определяет, освобождают ли глобальные права от его проверок, и может обращаться к `AuthorizationContext.grantedByGlobalScopeAuthority`. Движок не выполняет предварительную проверку прав для каждого вызова плагина.
- Движок по-прежнему предусматривает освобождение от проверок при skipAuth и при skip_catalog_priv_check для соответствующего каталога с внешним управлением доступом. Учётные записи с точными именами root@'%' и admin@'%' также освобождаются от фильтрации строк и маскирования.
- Экземпляры используются повторно; при замене настроенного экземпляра вызывается `close()`. Плагин отвечает за кэширование и обновление политик, управление параллельным доступом и освобождение ресурсов.

## Упаковка и развёртывание {#packaging-and-deployment}

Объявите `Doris-Authorization-Plugin-Api-Version` в файле MANIFEST внутри JAR, указав версию из `META-INF/doris/authorization-plugin-api-version.properties`, который находится в SPI JAR развёрнутого FE. Текущая основная версия: `1`. Например:

```text
Doris-Authorization-Plugin-Api-Version: 1.0
```

Отсутствие объявления или несовпадение основной версии приводит к отказу в загрузке плагина. Установите каждый плагин в отдельный подкаталог каталога, заданного параметром `authorization_plugins_dir`; по умолчанию это `${DORIS_HOME}/plugins/authorization`:

```text
plugins/authorization/my-authz/my-authz.jar
plugins/authorization/my-authz/lib/policy-client.jar
```

Выполните развёртывание на каждом FE и перезапустите его. Для зависимостей используется изолированный загрузчик классов с порядком загрузки child-first; `org.apache.doris.authorization.*` всегда загружается из FE.

## Настройка и проверка {#configuration-and-validation}

Для внутреннего каталога задайте `access_controller_type = my-authz` в `fe.conf`. Свойства считываются из файла, указанного в `authorization_config_file_path`; по умолчанию путь равен `${DORIS_HOME}/conf/authorization.conf`. Значение по умолчанию `default` выбирает встроенную авторизацию.

Для внешнего каталога сначала подготовьте доступный HMS и замените приведённые в примере адреса и учётные данные:

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

`access_controller.class` задаёт имя фабрики или имя класса фабрики. Doris удаляет префикс `access_controller.properties.` перед передачей конфигурации фабрике. Перед изменением конфигурации внутреннего каталога проверьте на тестовом каталоге разрешённые и запрещённые запросы, а также поведение при недоступности политик, права на столбцы, маскирование и фильтры строк. Если фабрика не найдена, проверьте журналы запуска FE, дескриптор службы, объявление версии API и структуру каталогов плагина.

## Переход с прежнего интерфейса {#migrating-from-the-legacy-interface}

Прежние контроллеры продолжают работать через адаптер, но объявлены устаревшими. Перегрузки `hasGlobal` удалены, а политики обработки данных теперь используют `DataMaskSpec` / `RowFilterSpec`; прежние реализации с политиками необходимо перекомпилировать. Соблюдайте жизненный цикл нового SPI вместо копирования прежнего подхода Ranger на основе singleton. Полная реализация находится в `fe/fe-core/src/test/java/org/apache/doris/authorizationexample/`; сведения об упаковке приведены в `fe/fe-authorization/fe-authorization-spi/README.md` в дереве исходного кода.
