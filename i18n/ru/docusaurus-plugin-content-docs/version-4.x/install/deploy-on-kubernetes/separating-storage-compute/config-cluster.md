---
{
    "title": "Настройка аутентификации",
    "language": "ru",
    "description": "Подробное описание двух способов настройки на уровне кластера с разделением хранения и вычислений (переменные окружения и Secret), а также всех этапов настройки паролей для трёх сценариев, включая настройку аутентификации Kerberos.",
    "keywords": ["Doris", "Storage-Compute Separation", "Kubernetes", "Username and Password", "Secret", "Kerberos", "Authentication", "Node_priv"]
}
---

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как работает аутентификация, необходимая Doris Operator для управления узлами кластера
- Как настроить учётные данные для управления с помощью переменных окружения или Secret
- Как настроить имена пользователей и пароли на трёх этапах: до развёртывания, во время развёртывания и после него
- Как настроить аутентификацию Kerberos для кластера с разделением хранения и вычислений

## Принципы настройки и выбор сценария {#configuration-principles-and-scenario-selection}

### Зачем нужны учётные данные для управления {#why-management-credentials-need-to-be-configured}

Для управления узлами Doris необходимо подключаться к работающему узлу FE по протоколу MySQL, используя имя пользователя и пароль. В Doris реализован [механизм управления привилегиями, аналогичный RBAC](../../../admin-manual/auth/authentication-and-authorization), а для управления узлами пользователю необходима привилегия [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions).

По умолчанию Doris Operator развёртывает кластер, заданный ресурсом DorisDisaggregatedCluster, и управляет им от имени пользователя root, который обладает всеми привилегиями и не имеет пароля. После установки пароля для root необходимо явно указать в ресурсе DorisDisaggregatedCluster имя и пароль пользователя с привилегией Node_priv, чтобы Doris Operator мог автоматически управлять кластером.

:::caution Учётные данные для управления после установки пароля root
После установки пароля root предоставьте Operator и скриптам запуска узлов действительные учётные данные для управления, предпочтительно через `spec.authSecret`. Если узлы BE регистрируются через FE SQL, отсутствие учётных данных или их несоответствие может помешать узлам присоединиться к кластеру. Secret должен находиться в том же пространстве имён, что и `DorisDisaggregatedCluster`, и содержать поля `username` и `password`, соответствующие действительной учётной записи для управления в Doris. Обновление Secret не меняет пароль существующей учётной записи базы данных; при изменении пароля в базе данных необходимо также обновить Secret.

Если у root уже есть пароль, администратор должен заранее создать отдельную учётную запись для управления и предоставить ей необходимые привилегии. Не рассчитывайте, что скрипты запуска создадут её автоматически.
:::

### Сравнение трёх сценариев настройки пароля {#comparison-of-the-three-password-configuration-scenarios}

Выберите сценарий в зависимости от этапа работы кластера и требований к управлению:

| Сценарий | Когда использовать | Сложность выполнения | Требуется шифрование с помощью кода |
|------|---------|-----------|-----------------|
| Сценарий 1: установка начального пароля root во время развёртывания | Первое развёртывание кластера | Средняя | Да (двухэтапное шифрование SHA-1) |
| Сценарий 2: автоматическое создание пользователя для управления, отличного от root, во время развёртывания (рекомендуется) | Первое развёртывание кластера | Низкая | Нет |
| Сценарий 3: установка пароля root после развёртывания | Кластер уже работает | Высокая | Нет |

### Общие принципы настройки {#general-configuration-principles}

Независимо от выбранного сценария учитывайте следующее:

- **Пароли существующих пользователей не изменяются автоматически**: Operator ни при каких обстоятельствах не меняет автоматически пароли уже существующих пользователей, таких как root и admin. Их нужно устанавливать или изменять самостоятельно.
- **Использовать пользователя admin для управления не рекомендуется**: admin обычно используют как пользователя с наивысшими привилегиями для чтения и записи в базу данных, а не для обслуживания кластера. У admin нет отдельных привилегий, необходимых некоторым функциям Operator.
- **Пользователь для управления, отличный от root, должен быть выделенным**: рекомендуется использовать его только для управления кластером. Иначе изменение пароля, которое не удалось синхронизировать с Operator, или утрата привилегий может нарушить работу по обслуживанию кластера.

### Два способа передачи учётных данных {#two-credential-delivery-methods}

Ресурс DorisDisaggregatedCluster поддерживает два способа настройки учётных данных. В каждом сценарии можно выбрать любой из них:

| Способ настройки | Используемое поле | Механизм работы |
|---------|---------|---------|
| Переменные окружения | `.spec.adminUser` | Operator автоматически преобразует имя пользователя и пароль в переменные окружения контейнера, которые считывает вспомогательная служба внутри контейнера |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator монтирует Basic Authentication Secret как файл в заданном расположении внутри контейнера, где его считывает вспомогательная служба |

## Сценарий 1: установка начального пароля пользователя root во время развёртывания {#scenario-1-initialize-the-root-user-password-during-deployment}

При первом развёртывании кластера можно использовать root для управления и заранее установить начальный пароль. Doris позволяет указать зашифрованный пароль root в `fe.conf`. При первом развёртывании Doris этот пароль будет установлен, после чего Doris Operator сможет автоматически управлять узлами кластера.

Порядок настройки:

1. Сгенерировать зашифрованный пароль root
2. Указать зашифрованный пароль в `fe.conf`
3. Указать учётные данные для управления в DorisDisaggregatedCluster, выбрав переменные окружения или Secret

### Шаг 1: сгенерируйте зашифрованный пароль root {#step-1-generate-the-encrypted-root-password}

Doris поддерживает установку зашифрованного пароля root через [файл конфигурации FE](../../../admin-manual/config/fe-config#initial_root_password). Для этого используется двухэтапное шифрование SHA-1. Ниже приведены примеры кода.

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

### Шаг 2: укажите зашифрованный пароль в fe.conf {#step-2-configure-the-encrypted-password-in-feconf}

Укажите пароль, зашифрованный на предыдущем шаге, в `fe.conf` в соответствии с требованиями к файлу конфигурации. Следуя инструкциям в [разделе о настройке параметров запуска FE](config-fe#custom-startup-configuration), передайте файл конфигурации в кластер Kubernetes как `ConfigMap`.

### Шаг 3: укажите учётные данные для управления в DorisDisaggregatedCluster {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster}

После задания начального пароля root в файле конфигурации пароль начинает действовать сразу при запуске первого узла Doris FE. Для добавления последующих узлов Doris Operator будет использовать имя пользователя root и его пароль. Поэтому укажите их в развёртываемом ресурсе DorisDisaggregatedCluster, чтобы Doris Operator мог управлять узлами кластера.

Выберите один из двух способов настройки.

#### Способ A: настройка через переменные окружения {#method-a-environment-variable-configuration}

Укажите имя пользователя root и пароль в полях `.spec.adminUser.name` и `.spec.adminUser.password` ресурса DorisDisaggregatedCluster. Doris Operator автоматически преобразует эти значения в переменные окружения контейнера, а вспомогательная служба внутри контейнера использует их для добавления узлов в кластер. Формат настройки:

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

Здесь `${password}` — незашифрованный пароль root.

#### Способ B: настройка через Secret {#method-b-secret-configuration}

Doris Operator поддерживает [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) для задания имени пользователя и пароля, используемых при управлении узлами. Doris Operator автоматически монтирует Secret как файл в заданном расположении внутри контейнера. Вспомогательная служба считывает из файла имя пользователя и пароль и использует их для автоматического добавления узлов в кластер. Поле stringData объекта Basic Authentication Secret содержит только два поля: username и password.

**Шаг 1: создайте и разверните Secret**

Настройте Basic Authentication Secret в следующем формате:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: root
  password: "${password}"
```

Здесь `${password}` — незашифрованный пароль, установленный для root.

Разверните Secret в кластере Kubernetes следующей командой:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором нужно развернуть ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: укажите Secret в DorisDisaggregatedCluster**

В развёртываемом ресурсе DorisDisaggregatedCluster укажите Secret следующим образом:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` — имя Secret, содержащего имя пользователя root и его пароль.

## Сценарий 2: автоматическое создание пользователя для управления, отличного от root, во время развёртывания (рекомендуется) {#scenario-2-automatically-create-a-non-root-management-user-during-deployment-recommended}

При первом развёртывании кластера можно поручить Operator автоматически создать отдельного пользователя для управления, отличного от root. Если начальный пароль root не задан, имя такого пользователя и пароль для входа можно указать через переменные окружения или Secret. Вспомогательная служба контейнера Doris автоматически создаст пользователя в Doris, установит пароль и предоставит привилегию Node_priv. Затем Doris Operator будет использовать созданные имя пользователя и пароль для управления узлами кластера.

Выберите один из двух способов настройки.

### Способ A: настройка через переменные окружения {#method-a-environment-variable-configuration-1}

Настройте развёртываемый ресурс DorisDisaggregatedCluster следующим образом:

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя с привилегиями для управления |
| `${DB_ADMIN_PASSWD}` | Пароль нового пользователя |

### Способ B: настройка через Secret {#method-b-secret-configuration-1}

**Шаг 1: создайте и разверните Secret**

Настройте Basic Authentication Secret в следующем формате:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: ${DB_ADMIN_USER}
  password: "${DB_ADMIN_PASSWD}"
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя |
| `${DB_ADMIN_PASSWD}` | Пароль, устанавливаемый для нового пользователя |

Разверните Secret в кластере Kubernetes следующей командой:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: укажите Secret в DorisDisaggregatedCluster**

Укажите используемый Secret в ресурсе DorisDisaggregatedCluster:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` — имя развёрнутого Basic Authentication Secret.

:::tip Совет
После развёртывания установите пароль root. Doris Operator перейдёт на использование нового пользователя и его пароля для управления узлами кластера. Не удаляйте созданного пользователя.
:::

## Сценарий 3: установка пароля пользователя root после развёртывания кластера {#scenario-3-set-the-root-user-password-after-the-cluster-is-deployed}

Если после развёртывания кластера Doris у пользователя root нет пароля, необходимо настроить пользователя с привилегией [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions), чтобы Doris Operator мог автоматически управлять узлами кластера. Использовать для этого root не рекомендуется. Создайте нового пользователя и предоставьте ему привилегию Node_priv, следуя [разделу о создании пользователей и предоставлении привилегий](../../../sql-manual/sql-statements/account-management/CREATE-USER). Затем укажите имя и пароль нового пользователя для управления через переменные окружения или Secret в ресурсе DorisDisaggregatedCluster.

Порядок настройки:

1. Создать пользователя через протокол MySQL для последующего предоставления привилегии Node_priv
2. Предоставить новому пользователю привилегию Node_priv
3. Указать учётные данные для управления в DorisDisaggregatedCluster, выбрав переменные окружения или Secret

### Шаг 1: создайте пользователя для последующего предоставления привилегии Node_priv {#step-1-create-a-user-with-the-node_priv-privilege}

Подключитесь к базе данных по протоколу MySQL и создайте пользователя с паролем следующей командой:

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя создаваемого пользователя |
| `${DB_ADMIN_PASSWD}` | Устанавливаемый пароль |

### Шаг 2: предоставьте новому пользователю привилегию Node_priv {#step-2-grant-the-node_priv-privilege-to-the-new-user}

Подключитесь к базе данных по протоколу MySQL и выполните следующую команду, чтобы предоставить новому пользователю привилегию Node_priv:

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

Здесь `${DB_ADMIN_USER}` — имя созданного пользователя.

Подробности о создании пользователей, установке паролей и предоставлении привилегий см. в официальной документации по [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER).

### Шаг 3: укажите учётные данные для управления в DorisDisaggregatedCluster {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster-1}

Выберите один из двух способов настройки.

#### Способ A: настройка через переменные окружения {#method-a-environment-variable-configuration-2}

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
| `${DB_ADMIN_PASSWD}` | Пароль, установленный для созданного пользователя |

#### Способ B: настройка через Secret {#method-b-secret-configuration-2}

**Шаг 1: создайте и разверните Secret**

Создайте Basic Authentication Secret в следующем формате:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: ${DB_ADMIN_USER}
  password: "${DB_ADMIN_PASSWD}"
```

| Параметр | Описание |
|------|------|
| `${DB_ADMIN_USER}` | Имя созданного пользователя |
| `${DB_ADMIN_PASSWD}` | Пароль, установленный для созданного пользователя |

Разверните Secret в кластере Kubernetes следующей командой:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут ресурс DorisDisaggregatedCluster |
| `${secretFileName}` | Имя файла развёртываемого Secret |

**Шаг 2: укажите Secret в DorisDisaggregatedCluster**

Укажите используемый Secret в ресурсе DorisDisaggregatedCluster:

```yaml
spec:
    authSecret: ${secretName}
```

Здесь `${secretName}` — имя развёрнутого Basic Authentication Secret.

:::tip Совет
Изменение ссылки `spec.authSecret` или поля `spec.adminUser` в CR меняет шаблоны соответствующих Pod и может запустить последовательное обновление. Изменение только пароля в базе данных или содержимого Secret с тем же именем само по себе не означает последовательного перезапуска. Скрипты запуска BE, регистрирующихся через FE SQL, считывают Secret в переменные при запуске и не перечитывают его при повторных попытках регистрации. Исправив учётные данные и убедившись, что с ними можно войти в FE, пересоздайте по одному те Pod BE, которые всё ещё не могут зарегистрироваться из-за старых учётных данных. Выполните `SHOW BACKENDS`, чтобы убедиться, что каждый узел присоединился к кластеру и значение его поля `Alive` равно `true`. Порядок устранения неполадок см. в разделе [Проблемы с authSecret](../doris-operator/status-and-troubleshooting.md#authsecret-problems).
:::

## Монтирование файлов аутентификации Kerberos {#mounting-kerberos-authentication-files}

В этом разделе описано, как смонтировать файлы аутентификации Kerberos для кластера Doris с разделением хранения и вычислений в среде Kubernetes. После настройки файл конфигурации `krb5.conf` и файл ключей `keytab`, необходимые для аутентификации Kerberos, будут смонтированы в контейнер Doris. Эти файлы смогут использовать функции, такие как [Hive Catalog](../../../lakehouse/catalogs/hive-catalog), чтобы Doris подключался к Hive или другим внешним источникам данных с включённой аутентификацией Kerberos.

:::caution Примечание
Речь идёт не о доступе к кластеру Doris через Kerberos. После монтирования Doris сможет использовать эти файлы Kerberos для доступа к другим внешним источникам данных, например HDFS.
:::

### Предварительные требования {#prerequisites}

- Doris Operator версии 25.5.1 или новее
- Кластер Doris с разделением хранения и вычислений версии 2.1.10 или 3.0.6 либо более поздней версии соответствующей ветки

### Необходимые файлы {#required-files}

| Файл | Описание |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Файл конфигурации Kerberos |
| [Файл keytab](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | Файл с принципалом Kerberos и ключами шифрования |

### Шаг 1: создайте ConfigMap для хранения krb5.conf {#step-1-create-a-configmap-to-store-krb5conf}

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут `DorisDisaggregatedCluster` |
| `${name}` | Имя ConfigMap |

### Шаг 2: создайте Secret для хранения файла keytab {#step-2-create-a-secret-to-store-the-keytab-file}

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут `DorisDisaggregatedCluster` |
| `${name}` | Имя Secret |
| `${xxx.keytab}` | Имя файла keytab |

:::tip Совет
Если нужно смонтировать несколько файлов `keytab`, обратитесь к [документации kubectl по созданию Secret](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/), чтобы поместить их в один Secret.
:::

### Шаг 3: настройте Kerberos в DorisDisaggregatedCluster {#step-3-configure-kerberos-information-in-dorisdisaggregatedcluster}

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
| `${keytabPath}` | Путь монтирования файла keytab внутри контейнера |

### Шаг 4: используйте аутентификацию Kerberos в Hive Catalog {#step-4-use-kerberos-authentication-in-hive-catalog}

После настройки Kerberos при создании Hive Catalog можно включить аутентификацию Kerberos. Подробности см. в [документации по настройке Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#configuring-catalog).
