---
{
    "title": "Настройка аутентификации",
    "language": "ru",
    "description": "Подробное описание двух способов настройки учётных данных на уровне кластера с разделением хранения и вычислений (переменные окружения и Secret), а также полные инструкции для трёх сценариев настройки паролей, включая настройку аутентификации Kerberos.",
    "keywords": ["Doris", "Storage-Compute Separation", "Kubernetes", "Username and Password", "Secret", "Kerberos", "Authentication", "Node_priv"]
}
---

## Что вы узнаете в этой главе {#what-you-will-learn-in-this-chapter}

- Какой механизм аутентификации требуется Doris Operator для управления узлами кластера
- Как настроить учётные данные для управления через переменные окружения или Secret
- Как правильно настроить имена пользователей и пароли на трёх этапах: до развёртывания, во время развёртывания и после него
- Как настроить аутентификацию Kerberos для кластера с разделением хранения и вычислений

## Принципы настройки и выбор сценария {#configuration-principles-and-scenario-selection}

### Зачем нужно настраивать учётные данные для управления {#why-management-credentials-need-to-be-configured}

Для управления узлами Doris необходимо подключиться к работающему узлу FE по протоколу MySQL, используя имя пользователя и пароль. В Doris реализован [механизм управления привилегиями, подобный RBAC](../../../admin-manual/auth/authentication-and-authorization), а для управления узлами пользователю требуется привилегия [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions).

По умолчанию Doris Operator использует пользователя root со всеми привилегиями и без пароля для развёртывания и управления кластером, настроенным с помощью ресурса DorisDisaggregatedCluster. После установки пароля для пользователя root необходимо явно указать в ресурсе DorisDisaggregatedCluster имя и пароль пользователя с привилегией Node_priv, чтобы Doris Operator мог автоматически управлять кластером.

### Сравнение трёх сценариев настройки пароля {#comparison-of-the-three-password-configuration-scenarios}

В зависимости от этапа работы с кластером и требований к управлению доступны три сценария настройки. Выберите подходящий сценарий с помощью таблицы ниже:

| Сценарий | Когда использовать | Сложность выполнения | Требуется программное шифрование |
|------|---------|-----------|-----------------|
| Сценарий 1: Установка начального пароля root во время развёртывания | Первичное развёртывание кластера | Средняя | Да (двухэтапное шифрование SHA-1) |
| Сценарий 2: Автоматическое создание пользователя для управления, отличного от root, во время развёртывания (рекомендуется) | Первичное развёртывание кластера | Низкая | Нет |
| Сценарий 3: Установка пароля root после развёртывания | Кластер уже работает | Высокая | Нет |

### Общие принципы настройки {#general-configuration-principles}

Независимо от выбранного сценария настройки паролей учитывайте следующее:

- **Пароли существующих пользователей не изменяются автоматически**: Operator никогда и ни при каких обстоятельствах не изменяет автоматически пароли уже существующих пользователей, таких как root и admin. Их необходимо задавать или изменять самостоятельно.
- **Не рекомендуется использовать admin для управления кластером**: Пользователь admin обычно используется как пользователь с максимальными привилегиями для операций чтения и записи в базу данных, а не для эксплуатации и обслуживания кластера. У пользователя admin отсутствуют некоторые привилегии, необходимые для отдельных функций Operator.
- **Для управления следует выделять отдельных пользователей, отличных от root**: Рекомендуется использовать таких пользователей только для управления кластером. Это позволит избежать ситуаций, когда изменение пароля не удаётся синхронизировать с Operator или пользователь теряет привилегии, что приводит к сбоям эксплуатации и обслуживания.

### Два способа передачи учётных данных {#two-credential-delivery-methods}

Ресурс DorisDisaggregatedCluster поддерживает следующие два способа настройки учётных данных. В каждом сценарии можно выбрать любой из них:

| Способ настройки | Используемое поле | Механизм работы |
|---------|---------|---------|
| Переменные окружения | `.spec.adminUser` | Operator автоматически преобразует имя пользователя и пароль в переменные окружения контейнера, которые считывает вспомогательная служба внутри контейнера |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator монтирует Basic Authentication Secret в виде файла в заданное место внутри контейнера, где его разбирает вспомогательная служба |

## Сценарий 1: Установка начального пароля пользователя root во время развёртывания {#scenario-1-initialize-the-root-user-password-during-deployment}

При первичном развёртывании кластера может потребоваться использовать root для управления и заранее задать начальный пароль. Doris поддерживает настройку пароля пользователя root в зашифрованном виде в `fe.conf`. Этот пароль устанавливается при первом развёртывании Doris, что позволяет Doris Operator автоматически управлять узлами кластера.

Общий порядок настройки:

1. Сформируйте зашифрованный пароль root
2. Укажите зашифрованный пароль в `fe.conf`
3. Настройте учётные данные для управления в DorisDisaggregatedCluster (через переменные окружения или Secret)

### Шаг 1: Сформируйте зашифрованный пароль root {#step-1-generate-the-encrypted-root-password}

Doris поддерживает настройку пароля пользователя root в зашифрованном виде в [файле конфигурации FE](../../../admin-manual/config/fe-config#initial_root_password). Используется двухэтапное шифрование SHA-1. Ниже приведены примеры реализации.

**Реализация на Java:**

```java
import org.apache.commons.codec.digest.DigestUtils;

public static void main(String[] args) {
    // the original password
    String a = "123456";
    String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
    // output the 2 stage encrypted password.
    System.out.println("*" + b);
}
```

**Реализация на Golang:**

```go
import (
    "crypto/sha1"
    "encoding/hex"
    "fmt"
    "strings"
)

func main() {
    // original password
    plan := "123456"
    // the first stage encryption.
    h := sha1.New()
    h.Write([]byte(plan))
    eb := h.Sum(nil)

    // the two stage encryption.
    h.Reset()
    h.Write(eb)
    teb := h.Sum(nil)
    dst := hex.EncodeToString(teb)
    tes := strings.ToUpper(fmt.Sprintf("%s", dst))
    // output the 2 stage encrypted password.
    fmt.Println("*" + tes)
}
```

### Шаг 2: Укажите зашифрованный пароль в fe.conf {#step-2-configure-the-encrypted-password-in-feconf}

Добавьте зашифрованный пароль, полученный на предыдущем шаге, в `fe.conf` в соответствии с требованиями к файлу конфигурации. Следуя инструкциям в [разделе о настройке параметров запуска FE](config-fe#custom-startup-configuration), передайте файл конфигурации в кластер Kubernetes в виде `ConfigMap`.

### Шаг 3: Настройте учётные данные для управления в DorisDisaggregatedCluster {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster}

После задания начального пароля root в файле конфигурации этот пароль вступает в силу сразу при запуске первого узла Doris FE. При присоединении последующих узлов к кластеру Doris Operator использует имя пользователя root и его пароль для добавления узлов. Поэтому необходимо указать имя пользователя и пароль в развёртываемом ресурсе DorisDisaggregatedCluster, чтобы Doris Operator мог управлять узлами кластера.

Выберите один из следующих двух способов настройки.

#### Способ A: Настройка через переменные окружения {#method-a-environment-variable-configuration}

Укажите имя пользователя root и его пароль в полях `.spec.adminUser.name` и `.spec.adminUser.password` ресурса DorisDisaggregatedCluster. Doris Operator автоматически преобразует эти настройки в переменные окружения контейнера, а вспомогательная служба внутри контейнера использует их для добавления узлов в кластер. Формат настройки:

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

Здесь `${password}` обозначает незашифрованный пароль root.

#### Способ B: Настройка через Secret {#method-b-secret-configuration}

Doris Operator поддерживает использование [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) для указания имени пользователя и пароля, необходимых для управления узлами. Doris Operator автоматически монтирует Secret в виде файла в заданное место внутри контейнера. Вспомогательная служба контейнера извлекает имя пользователя и пароль из файла и использует их для автоматического добавления узлов в кластер. Поле stringData объекта Basic Authentication Secret содержит только два поля: username и password.

**Шаг 1: Создайте и разверните Secret**

Настройте используемый Basic Authentication Secret в следующем формате:

```yaml
stringData:
    username: root
    password: ${password}
```

Здесь `${password}` обозначает незашифрованный пароль, заданный для root.

Разверните Secret в кластере Kubernetes с помощью следующей команды:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором необходимо развернуть ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: Укажите ссылку на Secret в DorisDisaggregatedCluster**

В развёртываемом ресурсе DorisDisaggregatedCluster укажите используемый Secret. Формат настройки:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` обозначает имя Secret, содержащего имя пользователя root и его пароль.

## Сценарий 2: Автоматическое создание пользователя для управления, отличного от root, во время развёртывания (рекомендуется) {#scenario-2-automatically-create-a-non-root-management-user-during-deployment-recommended}

При первичном развёртывании кластера может потребоваться, чтобы Operator автоматически создал отдельного пользователя для управления, отличного от root. Если при первом развёртывании начальный пароль root не задан, можно указать пользователя, отличного от root, и пароль для входа через переменные окружения или Secret. Вспомогательная служба контейнера Doris автоматически создаёт этого пользователя в Doris, задаёт пароль и предоставляет привилегию Node_priv. Затем Doris Operator использует имя и пароль автоматически созданного пользователя для управления узлами кластера.

Выберите один из следующих двух способов настройки.

### Способ A: Настройка через переменные окружения {#method-a-environment-variable-configuration-1}

Настройте развёртываемый ресурс DorisDisaggregatedCluster в следующем формате:

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя с привилегиями управления |
| `${DB_ADMIN_PASSWD}` | Пароль нового пользователя |

### Способ B: Настройка через Secret {#method-b-secret-configuration-1}

**Шаг 1: Создайте и разверните Secret**

Настройте используемый Basic Authentication Secret в следующем формате:

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя |
| `${DB_ADMIN_PASSWD}` | Пароль, задаваемый для создаваемого пользователя |

Разверните Secret в кластере Kubernetes с помощью следующей команды:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёртывается ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: Укажите ссылку на Secret в DorisDisaggregatedCluster**

В ресурсе DorisDisaggregatedCluster укажите используемый Secret, как показано ниже:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` обозначает имя развёрнутого Basic Authentication Secret.

:::tip Совет
После развёртывания задайте пароль root. Doris Operator перейдёт на использование нового пользователя и пароля для управления узлами кластера. Не удаляйте созданного пользователя.
:::

## Сценарий 3: Установка пароля пользователя root после развёртывания кластера {#scenario-3-set-the-root-user-password-after-the-cluster-is-deployed}

Если после развёртывания кластера Doris пароль пользователя root не задан, необходимо настроить пользователя с привилегией [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions), чтобы Doris Operator мог автоматически управлять узлами кластера. Рекомендуется использовать пользователя, отличного от root. Чтобы создать нового пользователя и предоставить ему привилегию Node_priv, обратитесь к [разделу о создании пользователей и предоставлении привилегий](../../../sql-manual/sql-statements/account-management/CREATE-USER). После создания пользователя укажите имя и пароль нового пользователя для управления через переменные окружения или Secret и настройте их в ресурсе DorisDisaggregatedCluster.

Общий порядок настройки:

1. Создайте пользователя с привилегией Node_priv через протокол MySQL
2. Предоставьте новому пользователю привилегию Node_priv
3. Настройте учётные данные для управления в DorisDisaggregatedCluster (через переменные окружения или Secret)

### Шаг 1: Создайте пользователя с привилегией Node_priv {#step-1-create-a-user-with-the-node_priv-privilege}

После подключения к базе данных по протоколу MySQL создайте пользователя и задайте пароль с помощью следующей команды:

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя |
| `${DB_ADMIN_PASSWD}` | Задаваемый пароль |

### Шаг 2: Предоставьте новому пользователю привилегию Node_priv {#step-2-grant-the-node_priv-privilege-to-the-new-user}

После подключения к базе данных по протоколу MySQL выполните следующую команду, чтобы предоставить новому пользователю привилегию Node_priv:

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

Здесь `${DB_ADMIN_USER}` обозначает имя созданного пользователя.

Подробные сведения о создании пользователей, настройке паролей и предоставлении привилегий приведены в официальной документации [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER).

### Шаг 3: Настройте учётные данные для управления в DorisDisaggregatedCluster {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster-1}

Выберите один из следующих двух способов настройки.

#### Способ A: Настройка через переменные окружения {#method-a-environment-variable-configuration-2}

Укажите созданного пользователя и его пароль в ресурсе DorisDisaggregatedCluster в следующем формате:

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя созданного пользователя |
| `${DB_ADMIN_PASSWD}` | Пароль, заданный для созданного пользователя |

#### Способ B: Настройка через Secret {#method-b-secret-configuration-2}

**Шаг 1: Создайте и разверните Secret**

Создайте Basic Authentication Secret в следующем формате:

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя созданного пользователя |
| `${DB_ADMIN_PASSWD}` | Пароль, заданный для созданного пользователя |

Разверните Secret в кластере Kubernetes с помощью следующей команды:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёртывается ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: Укажите ссылку на Secret в DorisDisaggregatedCluster**

В ресурсе DorisDisaggregatedCluster укажите используемый Secret, как показано ниже:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` обозначает имя развёрнутого Basic Authentication Secret.

:::tip Совет
После развёртывания установка пароля root и настройка имени и пароля нового пользователя с привилегиями управления узлами вызовут один поочерёдный перезапуск существующих служб.
:::

## Монтирование файлов аутентификации Kerberos {#mounting-kerberos-authentication-files}

В этом разделе описано, как смонтировать файлы аутентификации Kerberos для кластера Doris с разделением хранения и вычислений в среде Kubernetes. После настройки файл конфигурации `krb5.conf` и файл ключей `keytab`, необходимые для аутентификации Kerberos, монтируются в контейнер Doris для использования такими функциями, как [Hive Catalog](../../../lakehouse/catalogs/hive-catalog). Это позволяет Doris подключаться к Hive и другим внешним источникам данных с включённой аутентификацией Kerberos.

:::caution Примечание
Здесь не рассматривается доступ к кластеру Doris через Kerberos. После монтирования Doris может использовать эти файлы Kerberos для доступа к другим внешним источникам данных (например, HDFS).
:::

### Предварительные требования {#prerequisites}

- Doris Operator версии 25.5.1 или новее
- Кластер Doris с разделением хранения и вычислений версии 2.1.10 или 3.0.6 либо более поздней версии

### Необходимые файлы {#required-files}

| Файл | Описание |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Файл конфигурации Kerberos |
| [Файл keytab](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | Файл, содержащий principal Kerberos и ключи шифрования |

### Шаг 1: Создайте ConfigMap для хранения krb5.conf {#step-1-create-a-configmap-to-store-krb5conf}

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут `DorisDisaggregatedCluster` |
| `${name}` | Имя ConfigMap |

### Шаг 2: Создайте Secret для хранения файла keytab {#step-2-create-a-secret-to-store-the-keytab-file}

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут `DorisDisaggregatedCluster` |
| `${name}` | Имя Secret |
| `${xxx.keytab}` | Имя файла keytab |

:::tip Совет
Если необходимо смонтировать несколько файлов `keytab`, обратитесь к [документации kubectl create secret](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/), чтобы поместить несколько файлов `keytab` в один Secret.
:::

### Шаг 3: Настройте параметры Kerberos в DorisDisaggregatedCluster {#step-3-configure-kerberos-information-in-dorisdisaggregatedcluster}

```yaml
spec:
    kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
```

| Параметр | Описание |
|------|------|
| `${krb5ConfigMapName}` | Имя ConfigMap, содержащего файл `krb5.conf` |
| `${keytabSecretName}` | Имя Secret, содержащего файл keytab |
| `${keytabPath}` | Путь, по которому файл keytab монтируется в контейнере |

### Шаг 4: Используйте аутентификацию Kerberos в Hive Catalog {#step-4-use-kerberos-authentication-in-hive-catalog}

После настройки Kerberos можно включить аутентификацию Kerberos при создании Hive Catalog. Подробные сведения о настройке приведены в [документации по настройке Hive Catalog](../../../lakehouse/catalogs/hive-catalog#配置-catalog).
