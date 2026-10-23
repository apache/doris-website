---
{
    "title": "LDAP",
    "language": "ru",
    "description": "Настройка единой аутентификации и авторизации по группам в Apache Doris через интеграцию с LDAP/LDAPS: способы входа, сопоставление прав доступа и решение распространённых проблем.",
    "keywords": [
        "Doris LDAP",
        "Doris LDAPS",
        "аутентификация LDAP",
        "авторизация по группам LDAP",
        "единая аутентификация",
        "настройка ldap.conf",
        "ldap_default_roles",
        "ldap_allow_empty_pass",
        "MysqlClearPasswordPlugin",
        "ldap_admin_password",
        "ldap_use_ssl",
        "SSLHandshakeException",
        "PKIX path building failed",
        "плагин передачи пароля открытым текстом",
        "плагин передачи открытым текстом",
        "вход с пустым паролем"
    ]
}
---

Apache Doris поддерживает интеграцию со сторонними службами LDAP. Это позволяет использовать существующую корпоративную систему учётных записей напрямую как источник данных об идентификации и правах доступа для Doris, избавляя от необходимости отдельно поддерживать пользователей и пароли. Интеграция с LDAP предоставляет две основные возможности:

- **Вход с аутентификацией**: использование пароля LDAP вместо пароля Doris для проверки подлинности пользователя.
- **Авторизация по группам**: сопоставление `group` в LDAP с `role` в Doris для единого управления правами доступа.
- **Назначение ролей по умолчанию**: предоставление настроенных ролей Doris всем пользователям, прошедшим аутентификацию через LDAP, без необходимости объединять их в одну группу LDAP.

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Integrating enterprise unified identity / centralized privilege management -->

## Сценарии применения {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Единая корпоративная аутентификация | В организации уже есть система учётных записей LDAP/AD, и пользователи Doris должны использовать её напрямую без повторного создания учётных записей в Doris |
| Централизованное управление правами доступа | Управление участниками ролей через группы LDAP; изменение состава групп LDAP позволяет массово изменять права доступа в Doris |
| Базовые права доступа для пользователей LDAP | Предоставление одинаковых ролей Doris всем пользователям, прошедшим аутентификацию через LDAP, с помощью конфигурации, с сохранением авторизации по группам LDAP |
| Временный доступ | Пользователи, существующие только в LDAP, могут входить в Doris как временные пользователи с правами доступа, определяемыми группами LDAP |
| Зашифрованный канал | Требуется шифрование соединения между Doris FE и сервером LDAP (LDAPS) |

## Предварительные условия {#prerequisites}

- Развёрнута доступная служба LDAP/AD, и известны следующие данные:
    - `host` и порт службы LDAP (`389` для соединения открытым текстом, `636` для LDAPS)
    - `dn` и пароль учётной записи администратора
    - `basedn` для пользователей и групп
    - Фильтр пользователей (`ldap_user_filter`)
- У вас есть доступ на чтение и запись к файлам конфигурации FE кластера Doris и возможность перезапустить FE.
- У вас есть учётная запись `root` или `admin` для установки пароля администратора LDAP.
- Для включения LDAPS требуется Doris версии **4.0.5** или выше.

## Основные понятия LDAP {#ldap-basic-concepts}

В LDAP данные организованы в виде дерева. Ниже приведён типичный пример дерева каталога LDAP:

```text
- dc=example,dc=com
    - ou = ou1
        - cn = group1
        - cn = user1
    - ou = ou2
        - cn = group2
            - cn = user2
    - cn = user3
```

### Пояснение терминов {#term-explanations}

| Термин | Полное название | Описание |
| --- | --- | --- |
| `dc` | Domain Component | Доменное имя организации, используемое в качестве корневого узла дерева |
| `dn` | Distinguished Name | Уникальное имя. Например, `dn` пользователя user1 — `cn=user1,ou=ou1,dc=example,dc=com`, а `dn` пользователя user2 — `cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | Часть `dn`. Четыре `rdn` пользователя user1: `cn=user1`, `ou=ou1`, `dc=example` и `dc=com` |
| `ou` | Organization Unit | Подразделение организации. Объект `user` может находиться внутри `ou` или непосредственно в домене example.com |
| `cn` | Common Name | Имя |
| `group` | - | Группа, соответствующая роли Doris |
| `user` | - | Пользователь, эквивалентный пользователю Doris |
| `objectClass` | - | Тип данных. Позволяет определить, является ли узел объектом `group` или `user`. Для `group` обязательны атрибуты `cn` и `member` (список `user`); для `user` обязательны `cn`, `password`, `uid` и другие атрибуты |

## Обзор процесса интеграции {#integration-process-overview}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: First-time LDAP integration -->

1. **Настройте Doris FE**: измените способ аутентификации в `fe.conf` и укажите параметры подключения к службе LDAP в `ldap.conf`.
2. **Установите пароль администратора LDAP**: войдите в Doris и задайте `ldap_admin_password` с помощью SQL.
3. **Настройте клиент**: включите плагин передачи пароля открытым текстом в клиенте MySQL или JDBC для отправки пароля LDAP.
4. **(Необязательно) Включите LDAPS**: зашифруйте канал между FE и LDAP.
5. **(Необязательно) Настройте авторизацию по группам**: создайте в Doris роли `role` с теми же именами, что и группы LDAP, и предоставьте им права доступа.
6. **(Необязательно) Настройте роли по умолчанию**: предоставьте базовые роли Doris всем пользователям, прошедшим аутентификацию через LDAP, с помощью `ldap_default_roles`.

## Шаг 1: настройка Doris FE {#step-1-configure-doris-fe}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: LDAP integration configuration on the FE side -->

### 1.1 Изменение способа аутентификации {#11-switch-the-authentication-method}

Задайте способ аутентификации в `fe/conf/fe.conf`:

```text
authentication_type=ldap
```

### 1.2 Настройка параметров подключения к LDAP {#12-configure-ldap-connection-information}

Укажите параметры подключения к службе LDAP в `fe/conf/ldap.conf`:

```text
ldap_authentication_enabled = true
ldap_host = ladp-host
ldap_port = 389
ldap_admin_name = uid=admin,o=emr
ldap_user_basedn = ou=people,o=emr
ldap_user_filter = (&(uid={login}))
ldap_group_basedn = ou=group,o=emr
ldap_default_roles = ldap_readonly,ldap_query_user
```

Параметры конфигурации описаны ниже:

| Параметр конфигурации | Описание |
| --- | --- |
| `ldap_authentication_enabled` | Включает аутентификацию LDAP. Должен иметь значение `true` |
| `ldap_host` | Адрес сервера LDAP |
| `ldap_port` | Порт службы LDAP. По умолчанию — `389` для LDAP без шифрования и `636` для LDAPS |
| `ldap_admin_name` | `dn` администратора LDAP. Doris использует эту учётную запись для запроса сведений о пользователях и группах |
| `ldap_user_basedn` | Базовый `dn` для поиска пользователей |
| `ldap_user_filter` | Фильтр сопоставления пользователей. Вместо `{login}` подставляется имя пользователя, выполняющего вход |
| `ldap_group_basedn` | Базовый `dn` для поиска групп, используемый при авторизации по группам |
| `ldap_default_roles` | Необязательный параметр. Роли Doris, разделённые запятыми, которые предоставляются каждому пользователю, прошедшему аутентификацию через LDAP. Эти роли добавляются к ролям, полученным через группы LDAP (поддерживается начиная с версий 4.0.7 и 4.1.3) |
| `ldap_allow_empty_pass` | Необязательный параметр. Определяет, могут ли пользователи, существующие в LDAP, входить с пустым паролем. По умолчанию — `false`: Doris сразу отклоняет вход с пустым паролем. Изменение требует перезапуска FE. См. [Вход с пустым паролем](#empty-password-login) (поддерживается начиная с версии 4.1.5) |

:::tip
Чтобы включить LDAPS (зашифрованное соединение с сервером LDAP), см. раздел [LDAPS (зашифрованное соединение)](#ldaps-encrypted-connection) ниже.
:::

### 1.3 Установка пароля администратора LDAP {#13-set-the-ldap-administrator-password}

После запуска FE войдите в Doris с учётной записью `root` или `admin` и задайте пароль администратора LDAP:

```sql
set ldap_admin_password = password('<ldap_admin_password>');
```

Это пароль учётной записи, указанной в `ldap_admin_name`. Doris использует его для запросов к службе LDAP.

## Шаг 2: подключение клиента {#step-2-client-connection}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Enabling the cleartext password plugin on the client -->

Для аутентификации LDAP клиент должен отправлять пароль открытым текстом, поэтому необходимо включить плагин аутентификации с передачей пароля открытым текстом.

### 2.1 Клиент MySQL {#21-mysql-client}

Включить плагин аутентификации с передачей пароля открытым текстом можно одним из следующих способов:

- **Способ 1**: установить переменную окружения (постоянно)

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **Способ 2**: добавить параметр при входе (однократно)

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

### 2.2 Клиент JDBC {#22-jdbc-client}

По умолчанию JDBC требует, чтобы плагин передачи пароля открытым текстом использовался поверх SSL. Формат URL подключения JDBC зависит от того, включён ли SSL:

#### Сценарий A: SSL в Doris не включён {#scenario-a-ssl-is-not-enabled-in-doris}

Для обхода ограничения, требующего SSL, необходим собственный плагин аутентификации:

1. Создайте собственный класс плагина, который наследует `MysqlClearPasswordPlugin` и переопределяет метод `requiresConfidentiality()`:

    ```java
    public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
        @Override
        public boolean requiresConfidentiality() {
            return false;
        }
    }
    ```

2. Укажите собственный плагин в URL подключения JDBC (замените `xxx` фактическим именем пакета):

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
    ```

    Ниже описаны три свойства, которые необходимо настроить:

    | Свойство | Описание |
    | --- | --- |
    | `authenticationPlugins` | Регистрирует собственный плагин аутентификации с передачей пароля открытым текстом |
    | `defaultAuthenticationPlugin` | Назначает собственный плагин плагином аутентификации по умолчанию |
    | `disabledAuthenticationPlugins` | Отключает исходный плагин аутентификации с передачей пароля открытым текстом, который требует SSL |

:::tip
Примеры можно найти в [этом репозитории кода](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test). Запуск `build-auth-plugin.sh` создаёт jar-файл описанного выше плагина, который затем можно поместить в соответствующий каталог на стороне клиента.
:::

#### Сценарий B: SSL в Doris включён {#scenario-b-ssl-is-enabled-in-doris}

После добавления `enable_ssl=true` в `fe.conf` в URL подключения JDBC можно напрямую использовать штатный плагин MySQL для передачи пароля открытым текстом:

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
```

## Вход с аутентификацией {#authentication-login}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Understanding user authentication priority -->

При входе с аутентификацией LDAP для проверки пароля используется служба LDAP, дополняющая собственный механизм аутентификации Doris. Пароль проверяется в следующем порядке:

1. Сначала Doris проверяет пароль пользователя через LDAP.
2. Если пользователя нет в LDAP, Doris переходит к локальной проверке пароля.
3. Если пароль LDAP верен, но соответствующей учётной записи в Doris нет, для входа создаётся временный пользователь.

### Поведение при входе {#login-behavior-overview}

После включения LDAP поведение при входе зависит от наличия пользователя в LDAP и Doris:

| Пользователь LDAP | Пользователь Doris | Используемый пароль | Результат входа | Учётная запись при входе |
| --------- | ---------- | -------------- | ------------ | -------------- |
| Существует | Существует | Пароль LDAP | Успешно | Пользователь Doris |
| Существует | Существует | Пароль Doris | Ошибка | - |
| Не существует | Существует | Пароль Doris | Успешно | Пользователь Doris |
| Существует | Не существует | Пароль LDAP | Успешно | Временный пользователь LDAP |
| Существует | Любой вариант | Пустой пароль | По умолчанию — ошибка (`ldap_allow_empty_pass = false`) | - |

:::info О временных пользователях

- Временная учётная запись действует только в рамках текущего соединения и автоматически удаляется после его закрытия.
- Doris не создаёт постоянные метаданные пользователя для временной учётной записи.
- Права доступа временного пользователя определяются авторизацией по группам LDAP и параметром `ldap_default_roles` (см. разделы «Авторизация по группам» и «Роли по умолчанию для пользователей LDAP» ниже).
- Если у временного пользователя нет соответствующих прав доступа через группы или настроенных ролей по умолчанию, ему по умолчанию предоставляется право `select_priv` на `information_schema`.

:::

### Вход с пустым паролем {#empty-password-login}

:::info Поддерживается начиная с версии 4.1.5
:::

По умолчанию (`ldap_allow_empty_pass = false`), если пользователь, существующий в LDAP, пытается войти с пустым паролем, Doris сразу отклоняет вход с ошибкой отказа в доступе и не пытается выполнить привязку к серверу LDAP с этим паролем. FE записывает в `Rejected LDAP login with empty password, user=jack` подобное предупреждение в журнал `fe.log`.

Причина такого поведения по умолчанию заключается в том, что протокол LDAP трактует запрос привязки, содержащий `dn`, но пустой пароль, как *привязку без аутентификации*. Некоторые серверы каталогов, например Active Directory, принимают такую привязку и сообщают об успехе. Если бы Doris передавал пустой пароль без изменений, любой, кто знает действительное имя пользователя LDAP, мог бы войти в Doris без пароля. В версиях до 4.1.5 Doris всегда передавал пустой пароль серверу LDAP, поэтому успех такого входа полностью зависел от конфигурации сервера LDAP.

Если необходимо сохранить прежнее поведение, задайте следующий параметр в `fe/conf/ldap.conf` и перезапустите FE:

```text
ldap_allow_empty_pass = true
```

После этого Doris перестаёт самостоятельно проверять, пуст ли пароль, и передаёт запрос привязки серверу LDAP. Успех входа в этом случае зависит от того, принимает ли сервер LDAP привязки без аутентификации.

:::caution

- Включение `ldap_allow_empty_pass` возвращает описанную выше угрозу безопасности. В производственных средах сохраняйте значение по умолчанию `false`.
- `ldap_allow_empty_pass` нельзя изменить без перезапуска с помощью `ADMIN SET FRONTEND CONFIG`. Для изменения требуется перезапуск FE.
- Этот параметр влияет только на пользователей, существующих в LDAP. Для пользователей, существующих только в Doris, по-прежнему проверяется локальный пароль Doris.

:::

### Примеры входа {#login-examples}

В следующих примерах предполагается, что аутентификация LDAP включена, настроен параметр `ldap_user_filter = (&(uid={login}))`, а на стороне клиента установлена переменная `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`.

**Сценарий 1: учётная запись существует и в Doris, и в LDAP**

- Учётная запись Doris: `jack@'172.10.1.10'`, пароль: `123456`
- Атрибуты пользователя LDAP: `uid: jack`, пароль: `abcdef`

Вход с паролем LDAP завершается успешно:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

Вход с паролем Doris завершается ошибкой (после включения LDAP пользователи LDAP должны использовать пароль LDAP):

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**Сценарий 2: пользователь существует только в LDAP**

- Атрибуты пользователя LDAP: `uid: jack`, пароль: `abcdef`

При входе с паролем LDAP Doris автоматически создаёт временного пользователя `jack@'%'` и выполняет вход. Временный пользователь получает роли групп LDAP и настроенные роли по умолчанию, если они доступны. Если подходящих ролей нет, ему предоставляется базовое право `DatabasePrivs`: `Select_priv`. После закрытия соединения временный пользователь автоматически удаляется:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**Сценарий 3: учётная запись существует только в Doris**

- Учётная запись Doris: `jack@'172.10.1.10'`, пароль: `123456`

Пользователя нет в LDAP, поэтому выполняется переход к локальной аутентификации Doris. Вход с паролем Doris завершается успешно:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**Сценарий 4: пользователь LDAP входит с пустым паролем**

- Атрибуты пользователя LDAP: `uid: jack`, пароль: `abcdef`

Вход без ввода пароля. При значении по умолчанию `ldap_allow_empty_pass = false` Doris сразу отклоняет вход (см. [Вход с пустым паролем](#empty-password-login)):

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack
```

## Авторизация по группам {#group-authorization}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Mapping LDAP groups to Doris roles -->

Авторизация по группам LDAP сопоставляет `group` в LDAP с `role` в Doris, обеспечивая централизованное управление правами доступа. Основной механизм работает следующим образом:

- Если `dn` пользователя LDAP указан в атрибуте `member` узла группы LDAP, Doris считает пользователя участником этой группы.
- При входе пользователя Doris автоматически предоставляет ему права доступа ролей `role`, соответствующих группам LDAP, в которые он входит.
- Если настроен параметр `ldap_default_roles`, Doris также предоставляет пользователю указанные роли по умолчанию.
- После выхода пользователя Doris автоматически отзывает эти права доступа `role`.

:::caution Предварительные условия
Перед использованием авторизации по группам LDAP необходимо создать в Doris роль `role` с тем же именем, что и у `group` в LDAP, и предоставить права доступа этой `role`.
:::

### Правила объединения прав доступа {#privilege-merge-rules}

Итоговые права доступа вошедшего пользователя зависят от его наличия в LDAP и Doris:

| Пользователь LDAP | Пользователь Doris | Итоговые права доступа |
| --------- | ---------- | ---------------- |
| Существует | Существует | Права доступа групп LDAP + настроенные роли по умолчанию + права доступа пользователя Doris |
| Не существует | Существует | Права доступа пользователя Doris |
| Существует | Не существует | Права доступа групп LDAP + настроенные роли по умолчанию |

### Правила сопоставления имён групп {#group-name-mapping-rules}

Doris извлекает первый `Rdn` из `dn` группы LDAP в качестве имени группы и сопоставляет его с `role` с таким же именем в Doris.

Например, пусть `dn` пользователя — `uid=jack,ou=aidp,dc=domain,dc=com`, а сведения о группе выглядят так:

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

Первый `Rdn` в `dn` группы — `cn=doris_rd`, поэтому имя группы — `doris_rd`. Оно соответствует роли `role` с именем `doris_rd` в Doris.

### Пример авторизации по группам {#group-authorization-example}

Предположим, пользователь jack входит в группы LDAP `doris_rd`, `doris_qa` и `doris_pm`, а в Doris есть роли `role` с такими же именами: `doris_rd`, `doris_qa` и `doris_pm`. После входа jack, помимо существующих прав доступа своей учётной записи Doris, получает права доступа этих трёх `role`.

:::note Примечание

- То, к какой `group` относится `user`, не зависит от организационной структуры дерева LDAP. В примере выше `user2` не обязательно входит в `group2`.
- Чтобы `user2` входил в `group2`, необходимо явно добавить `user2` в атрибут `member` группы `group2`.

:::

## Роли по умолчанию для пользователей LDAP {#default-roles-for-ldap-users}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Granting baseline Doris privileges to all LDAP-authenticated users -->

:::info Поддерживается начиная с версий 4.0.7 и 4.1.3
:::

`ldap_default_roles` используется для предоставления базовых ролей Doris всем пользователям, прошедшим аутентификацию через LDAP. Этот параметр полезен, когда все пользователи LDAP должны иметь одинаковые базовые права доступа, но поддерживать отдельную группу LDAP, содержащую всех пользователей LDAP, неудобно.

`ldap_default_roles` не заменяет авторизацию по группам LDAP. При входе пользователя LDAP Doris объединяет все следующие права доступа:

- Роли Doris, сопоставленные с группами LDAP пользователя.
- Роли Doris, указанные в `ldap_default_roles`.
- Существующие права доступа пользователя Doris, если эта учётная запись также существует в Doris.
- Встроенную роль `ldapDefaultRole`, предоставляющую право `select_priv` на `information_schema`.

:::caution Предварительные условия
Роли, перечисленные в `ldap_default_roles`, должны уже существовать в Doris. Если указанная роль не существует, Doris игнорирует её и записывает предупреждение в журнал.
:::

### Настройка ролей по умолчанию {#configure-default-roles}

Создайте роли и предоставьте им права доступа:

```sql
CREATE ROLE ldap_readonly;
CREATE ROLE ldap_query_user;

GRANT SELECT_PRIV ON internal.example_db.* TO ROLE 'ldap_readonly';
GRANT SELECT_PRIV ON internal.example_db.example_table TO ROLE 'ldap_query_user';
```

Укажите роли в `fe/conf/ldap.conf`:

```text
ldap_default_roles = ldap_readonly,ldap_query_user
```

Значение также можно обновить без перезапуска:

```sql
ADMIN SET FRONTEND CONFIG ("ldap_default_roles" = "ldap_readonly,ldap_query_user");
```

После обновления `ldap_default_roles` без перезапуска Doris автоматически обновляет кеш пользователей LDAP, чтобы при последующих входах через LDAP применялись новые роли по умолчанию.

## LDAPS (зашифрованное соединение) {#ldaps-encrypted-connection}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Encrypting the channel between FE and the LDAP server -->

:::info Поддерживается начиная с версии 4.0.5
:::

По умолчанию Doris взаимодействует с сервером LDAP по протоколу LDAP без шифрования. Начиная с версии 4.0.5 Doris поддерживает LDAPS (LDAP поверх SSL/TLS) для шифрования соединения между Doris FE и сервером LDAP.

### Включение LDAPS {#enable-ldaps}

В `fe/conf/ldap.conf` измените порт на порт LDAPS (обычно `636`) и включите SSL:

```text
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

Если параметр `ldap_use_ssl` имеет значение `true`, Doris подключается к серверу LDAP по протоколу `ldaps://`.

### Настройка доверия к сертификатам {#configure-certificate-trust}

При использовании LDAPS JVM процесса Doris FE должна доверять SSL-сертификату сервера LDAP:

- Если сертификат сервера LDAP выдан общеизвестным публичным CA, дополнительная настройка не требуется.
- Если используется собственный или самоподписанный CA, сертификат CA необходимо импортировать в Java trustStore и настроить JVM на использование этого trustStore.

Добавьте параметры trustStore в `JAVA_OPTS` в файле `fe/conf/fe.conf`. Пример:

```text
# JDK 17 example
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

Полная последовательность импорта самоподписанного сертификата CA:

1. Получите файл сертификата CA (например, `ca.crt`).
2. Используйте `keytool` для его импорта в Java trustStore:

    ```shell
    keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
    ```

3. Укажите путь к trustStore в `JAVA_OPTS`, как описано выше.
4. Перезапустите Doris FE, чтобы изменения вступили в силу.

## Управление кешем {#cache-management}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Forcing a refresh after LDAP information changes -->

Чтобы избежать частых обращений к службе LDAP, Doris кеширует сведения LDAP в памяти.

| Параметр конфигурации | Описание | Значение по умолчанию |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | Срок хранения сведений о пользователях LDAP в кеше (в секундах) | 43200 (12 часов) |

В следующих случаях может потребоваться обновить кеш вручную, чтобы изменения вступили в силу немедленно:

- В службе LDAP изменены сведения о пользователях или группах.
- В Doris изменены права доступа `Role`, соответствующих группам пользователей LDAP.

Обновление `ldap_default_roles` без перезапуска автоматически обновляет кеш пользователей LDAP. Если изменён только этот параметр, выполнять `refresh ldap` не требуется.

Обновить кеш можно с помощью инструкции `refresh ldap`. Подробнее см. [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP).

## Известные ограничения {#known-limitations}

- Функция LDAP в Doris поддерживает только проверку пароля с передачей открытым текстом на участке от клиента до FE. Это означает, что при входе пользователя пароль передаётся открытым текстом между `client` и `fe`. Шифрование SSL/TLS между клиентом и Doris FE необходимо настроить отдельно (см. [Подключение клиента](#step-2-client-connection)).
- На участке от FE до сервера LDAP по умолчанию используется передача открытым текстом (`ldap_use_ssl = false`). Чтобы зашифровать этот канал, задайте `ldap_use_ssl = true` для включения LDAPS (см. [LDAPS (зашифрованное соединение)](#ldaps-encrypted-connection)).

## Часто задаваемые вопросы {#frequently-asked-questions}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Login failure / empty-password login rejected / missing roles / LDAPS handshake failure -->

### Вопрос: как посмотреть, какие роли есть у пользователя LDAP в Doris? {#q-how-do-i-view-which-roles-an-ldap-user-has-in-doris}

Войдите в Doris под пользователем LDAP и выполните `show grants;`, чтобы просмотреть все роли текущего пользователя. Среди них `ldapDefaultRole` — роль по умолчанию, которая есть у каждого пользователя LDAP.

`ldapDefaultRole` — встроенная временная роль, предоставляющая право `select_priv` на `information_schema`. Она отличается от ролей, указанных в `ldap_default_roles`.

### Вопрос: у пользователя LDAP в Doris меньше ролей, чем ожидалось. Как найти причину? {#q-an-ldap-user-has-fewer-roles-in-doris-than-expected-how-do-i-troubleshoot}

Последовательно проверьте следующее:

1. Выполните `show roles;`, чтобы убедиться, что ожидаемая роль существует в Doris. Если её нет, создайте её с помощью `CREATE ROLE role_name;`.
2. Убедитесь, что ожидаемая `group` находится в организационной структуре, соответствующей `ldap_group_basedn`.
3. Убедитесь, что ожидаемая `group` содержит атрибут `member`.
4. Убедитесь, что атрибут `member` ожидаемой `group` содержит `dn` текущего пользователя.
5. Если отсутствующая роль указана в `ldap_default_roles`, проверьте правильность написания её имени и наличие этой роли в Doris.

### Вопрос: раньше пользователь LDAP мог войти с пустым паролем, но после обновления вход завершается ошибкой. Почему? {#q-an-ldap-user-could-log-in-with-an-empty-password-before-but-the-login-fails-after-upgrading-why}

Начиная с версии 4.1.5 Doris по умолчанию отклоняет вход с пустым паролем для пользователей, существующих в LDAP (`ldap_allow_empty_pass = false`), поскольку некоторые серверы LDAP считают привязку с пустым паролем успешной привязкой без аутентификации. Такие попытки фиксируются в `fe.log` сообщением `Rejected LDAP login with empty password`.

Попросите пользователя войти с паролем LDAP. Если необходимо сохранить прежнее поведение, задайте `ldap_allow_empty_pass = true` в `fe/conf/ldap.conf` и перезапустите FE. Это не рекомендуется для производственных сред. Подробнее см. [Вход с пустым паролем](#empty-password-login).

### Вопрос: не удаётся установить соединение LDAPS. Как найти причину? {#q-ldaps-connection-fails-how-do-i-troubleshoot}

Последовательно проверьте следующее:

1. Убедитесь, что `ldap_use_ssl = true` задан в `fe/conf/ldap.conf`.
2. Убедитесь, что в `ldap_port` указан правильный порт LDAPS (обычно `636`).
3. Проверьте, доверяет ли JVM SSL-сертификату сервера LDAP. Проверьте `fe.log` на наличие ошибок согласования SSL, таких как `SSLHandshakeException` или `PKIX path building failed`.
4. Если используется самоподписанный CA, убедитесь, что сертификат CA импортирован в trustStore, а путь к trustStore в `JAVA_OPTS` указан правильно.
