---
{
    "title": "AWS MSK",
    "language": "ru",
    "description": "Импорт данных из AWS MSK в Doris в реальном времени с помощью Routine Load. Поддерживаются аутентификация IAM, AK/SK, Assume Role и другие способы предоставления учётных данных.",
    "keywords": [
        "AWS MSK",
        "Routine Load",
        "Импорт из Kafka",
        "Аутентификация IAM",
        "Assume Role",
        "Импорт данных в Doris",
        "SASL_SSL",
        "OAUTHBEARER"
    ]
}
---

> Эта функция поддерживается начиная с Doris 4.1.0.

<!-- Knowledge type: Operation guide + Configuration parameters -->
<!-- Applicable scenarios: Import data from AWS MSK into Doris / IAM authentication configuration / Public network access troubleshooting -->

Amazon Managed Streaming for Apache Kafka (AWS MSK) — полностью управляемый сервис Apache Kafka от AWS. Doris поддерживает импорт данных из AWS MSK в реальном времени через Routine Load с использованием механизма аутентификации IAM для AWS MSK. Поддерживаются форматы CSV и JSON и семантика Exactly-Once, которая гарантирует отсутствие потерь и дублирования данных. Дополнительные сведения см. в документации по Routine Load.

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

Прежде чем использовать Routine Load для импорта данных из AWS MSK, убедитесь, что выполнены следующие условия:

1. Кластер AWS MSK создан, и аутентификация IAM включена.
2. Настроены необходимые разрешения AWS IAM для доступа к кластеру MSK.
3. Кластер Doris имеет доступ к Bootstrap Servers AWS MSK.

## Параметры аутентификации {#authentication-parameters}

<!-- Knowledge type: Configuration parameters -->

В следующей таблице перечислены параметры аутентификации, которые необходимо настроить для импорта данных из AWS MSK:

| Параметр | Описание | Пример |
| :--- | :--- | :--- |
| `aws.region` | Регион AWS | `"us-east-1"` |
| `aws.access_key` | AWS Access Key ID | - |
| `aws.secret_key` | AWS Secret Access Key | - |
| `aws.role_arn` | Роль для получения учётных данных доступа между аккаунтами | `"arn:aws:iam::123456789012:role/MyRole"` |
| `aws.profile_name` | Имя профиля AWS, настроенного в `~/.aws/credentials` | - |
| `aws.credentials_provider` | Стандартный провайдер учётных данных AWS SDK. Поддерживает различные типы провайдеров | `"INSTANCE_PROFILE"` |
| `aws.external_id` | Используется как «идентификатор контекста вызова» для AssumeRole | - |
| `property.security.protocol` | Из-за ограничений аутентификации IAM требуется фиксированное значение `SASL_SSL` | `"SASL_SSL"` |
| `property.sasl.mechanism` | Из-за ограничений библиотеки librdkafka требуется фиксированное значение `OAUTHBEARER` | `"OAUTHBEARER"` |

### Допустимые значения `aws.credentials_provider` {#available-values-for-awscredentials_provider}

| Значение | Описание |
| :--- | :--- |
| `DEFAULT` | Использовать цепочку провайдеров по умолчанию |
| `ENV` | Читать учётные данные из переменных окружения |
| `INSTANCE_PROFILE` | Использовать учётные данные EC2 Instance Profile |

## Примеры настройки аутентификации {#authentication-configuration-examples}

<!-- Knowledge type: Operation steps -->

Doris поддерживает следующие способы аутентификации IAM. Выберите подходящий для вашего сценария развёртывания:

| Способ аутентификации | Сценарий применения |
| :--- | :--- |
| Прямое использование AK/SK | У вас уже есть долгосрочные Access Key/Secret Key |
| IAM Role (Assume Role) | Доступ между аккаунтами или предпочтительное использование временных учётных данных |
| Указание источника учётных данных через `aws.credentials_provider` | Вы не хотите явно указывать AK/SK, например при использовании EC2 Instance Profile |

### Способ 1: прямое использование Access Key и Secret Key (AK/SK) {#method-1-use-access-key-and-secret-key-aksk-directly}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.access_key" = "<your-ak>",
    "aws.secret_key" = "<your-sk>",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### Способ 2: режим IAM Role (Assume Role) {#method-2-iam-role-assume-role-mode}

Если задан параметр `aws.role_arn`, параметр `aws.credentials_provider` определяет провайдер исходных учётных данных для вызова STS AssumeRole.

#### Пример 2.1: EC2 Instance Profile как источник учётных данных для STS {#example-21-ec2-instance-profile-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

#### Пример 2.2: чтение AK/SK из переменных окружения как исходных учётных данных для STS {#example-22-read-aksk-from-environment-variables-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "ENV",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

#### Пример 2.3: цепочка провайдеров по умолчанию как источник учётных данных для STS {#example-23-use-the-default-provider-chain-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "DEFAULT",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### Способ 3: указание источника учётных данных через `aws.credentials_provider` {#method-3-specify-the-credential-source-through-awscredentials_provider}

Этот способ подходит для сценариев, в которых AK/SK не указываются явно, например при использовании EC2 Instance Profile.

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

## Правила выбора учётных данных {#credential-resolution-rules}

<!-- Knowledge type: Configuration priority -->

Если одновременно заданы несколько параметров учётных данных, они применяются в следующем порядке приоритета:

1. Если заданы и `aws.access_key`, и `aws.secret_key`, **в первую очередь используются AK/SK**.
2. Если AK/SK не заданы, но задан параметр `aws.role_arn`, **используется IAM Role**. В этом случае параметр `aws.credentials_provider` определяет источник учётных данных для STS.
3. Если не заданы ни AK/SK, ни `aws.role_arn`, **параметр `aws.credentials_provider` напрямую определяет провайдер, используемый клиентом AWS**.

## Устранение проблем с доступом через публичную сеть {#public-network-access-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Authentication failure when accessing AWS MSK from the public network -->

Если при импорте данных из AWS MSK через публичную сеть возникают проблемы с аутентификацией AWS, выполните следующие действия для диагностики:

### Шаг 1: убедитесь, что для кластера MSK включён публичный доступ {#step-1-ensure-that-the-msk-cluster-has-public-access-enabled}

В консоли AWS MSK выберите нужный кластер и в разделе **Свойства** проверьте **Настройки сети**, перейдя к пункту **Изменить публичный доступ**. Убедитесь, что публичный доступ включён.

### Шаг 2: убедитесь, что подсеть является публичной {#step-2-ensure-that-the-subnet-is-public}

Подсеть, связанная с кластером, должна быть публичной. В консоли AWS VPC убедитесь, что таблица маршрутизации подсети содержит запись `0.0.0.0/0 : igw-xxxx`.

### Шаг 3: используйте правильную публичную конечную точку Bootstrap {#step-3-use-the-correct-bootstrap-public-endpoint}

В консоли AWS MSK выберите нужный кластер, нажмите **Просмотреть информацию о клиенте** и убедитесь, что в свойстве `kafka_broker_list` при создании Routine Load указана **публичная конечная точка**, а не **приватная конечная точка**.

### Шаг 4: убедитесь, что для группы безопасности правильно настроены правила входящего и исходящего трафика {#step-4-ensure-that-the-security-group-is-configured-with-correct-inbound-and-outbound-rules}

Проверьте **правила входящего трафика** группы безопасности, настроенной для MSK: для **порта 9198** должен быть указан подходящий IP-адрес источника.

> Примечание: если для взаимодействия с брокером используется управление доступом IAM, необходимо открыть доступ через порт 9198.

### Справочная документация {#reference-documents}

Дополнительные сведения см. в соответствующей документации AWS:

- [Безопасный доступ к кластерам Amazon Managed Streaming for Apache Kafka (Amazon MSK) через интернет](https://docs.aws.amazon.com/msk/latest/developerguide/public-access.html)
- [Доступ из AWS за пределами VPC кластера](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [Предоставление VPC доступа к интернету с помощью интернет-шлюза](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Frequently asked questions -->

### Вопрос 1: почему параметры `property.security.protocol` и `property.sasl.mechanism` должны иметь фиксированные значения? {#q1-why-must-propertysecurityprotocol-and-propertysaslmechanism-be-fixed-values}

Из-за механизма аутентификации IAM в AWS MSK и ограничений используемой библиотеки librdkafka для этих двух параметров необходимо задать фиксированные значения `SASL_SSL` и `OAUTHBEARER` соответственно. Иначе согласование аутентификации IAM не сможет завершиться успешно.

### Вопрос 2: какие учётные данные используются, если одновременно заданы AK/SK и `aws.role_arn`? {#q2-when-aksk-and-awsrole_arn-are-configured-at-the-same-time-which-credential-is-used}

В первую очередь используются AK/SK. Подробнее см. в разделе [Правила выбора учётных данных](#credential-resolution-rules).

### Вопрос 3: аутентификация при доступе к MSK через публичную сеть постоянно завершается ошибкой. Как устранить проблему? {#q3-authentication-always-fails-when-accessing-msk-from-the-public-network-how-should-this-be-troubleshot}

Выполните четыре шага из раздела [Устранение проблем с доступом через публичную сеть](#public-network-access-troubleshooting) и проверьте каждый пункт: включён ли публичный доступ, является ли подсеть публичной, используется ли публичная конечная точка Bootstrap и разрешает ли группа безопасности доступ через порт 9198.

### Вопрос 4: как избежать настройки AK/SK при запуске Doris на EC2? {#q4-when-running-doris-on-ec2-how-can-aksk-configuration-be-avoided}

Вы можете назначить экземпляру EC2 роль IAM Role с разрешениями на доступ к MSK, а затем задать для `aws.credentials_provider` значение `INSTANCE_PROFILE`. См. [Способ 3](#method-3-specify-the-credential-source-through-awscredentials_provider).

### Вопрос 5: гарантирует ли Doris отсутствие потерь и дублирования данных при импорте из MSK через Routine Load? {#q5-does-doris-guarantee-no-data-loss-or-duplication-when-importing-data-from-msk-through-routine-load}

Да. Routine Load обеспечивает семантику Exactly-Once, которая гарантирует отсутствие потерь и дублирования данных.
