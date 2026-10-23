---
{
    "title": "Интеграция с Apache Polaris",
    "language": "ru",
    "description": "По мере развития технологий озёр данных эффективное и безопасное управление огромными объёмами данных в объектном хранилище (например, AWS S3) при одновременном "
}
---

По мере развития технологий озёр данных эффективное и безопасное управление огромными объёмами данных в объектном хранилище (например, AWS S3) с предоставлением единой точки доступа для вышестоящих аналитических движков (например, Apache Doris) становится ключевой задачей современной архитектуры данных. Apache Polaris, открытый стандартизированный сервис REST Catalog для Iceberg, предлагает идеальное решение этой задачи. Он не только обеспечивает централизованное управление метаданными, но и значительно повышает безопасность озёр данных и упрощает управление ими благодаря детальной настройке прав доступа и гибким механизмам управления учётными данными.

В этой статье подробно описано, как интегрировать Apache Doris с Polaris для эффективного выполнения запросов к данным Iceberg в S3 и управления ими. Мы шаг за шагом пройдём весь процесс: от подготовки окружения до выполнения итоговых запросов.

**Из этого документа вы быстро узнаете:**

* **Подготовка окружения AWS**: как создать и настроить бакеты S3 в AWS, а также подготовить необходимые роли и политики IAM для Polaris и Doris, чтобы Polaris мог самостоятельно обращаться к S3 и выдавать Doris учётные данные для доступа.

* **Развёртывание и настройка Polaris**: как скачать и запустить сервис Polaris на сервере, создать в Polaris Iceberg Catalog, Namespace и соответствующие Principal/Role, а также настроить права, чтобы предоставить Doris защищённые конечные точки доступа к метаданным.

* **Подключение Doris к Polaris**: как Doris получает от Polaris токены доступа к метаданным через OAuth2, а также как работают два основных способа доступа к базовому хранилищу:

  1. Временные AK/SK, выданные Polaris (механизм Credential Vending)
  2. Прямой доступ Doris к S3 с использованием статических AK/SK

> Требуется Doris версии 3.1+

## 1. Подготовка окружения AWS {#1-aws-environment-preparation}

Перед началом работы необходимо подготовить бакеты S3 и соответствующие роли IAM в AWS. Это основа для управления данными через Polaris и доступа к ним из Doris.

### 1.1 Создание бакета S3 {#11-create-s3-storage-bucket}

Сначала создадим бакет S3 с именем `polaris-doris-demo` для хранения данных таблиц Iceberg, которые мы создадим позже.

```bash
# Create S3 storage bucket
aws s3 mb s3://polaris-doris-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep polaris-doris-demo
```

### 1.2 Создание роли IAM для доступа к объектному хранилищу {#12-create-iam-role-for-object-storage-access}

Для безопасного управления учётными данными необходимо создать роль IAM, которую Polaris будет принимать через механизм STS AssumeRole. Такой подход соответствует рекомендациям по безопасности: принципу минимальных привилегий и разделению обязанностей.

1. Создайте файл политики доверия

    Создайте файл `polaris-trust-policy.json`:

    ```bash
    cat > polaris-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
            "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
            "StringEquals": {
                "sts:ExternalId": "polaris-doris-demo"
            }
            }
        }
        ]
    }
    EOF
    ```

    > Примечание: замените YOUR_ACCOUNT_ID на фактический идентификатор вашей учётной записи AWS. Его можно получить командой `aws sts get-caller-identity --query Account --output text`.

2. Создайте роль IAM

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```

3. Прикрепите политику разрешений для доступа к S3

    ```bash
    aws iam attach-role-policy \
        --role-name polaris-doris-demo \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. Проверьте результаты создания

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```

### 1.3 Привязка роли IAM к экземпляру EC2 (необязательно) {#13-bind-iam-role-to-ec2-instance-optional}

> Если вы пропустите этот шаг, перед запуском Polaris необходимо задать AWS_ACCESS_KEY_ID и AWS_SECRET_ACCESS_KEY

Если сервис Polaris будет работать на экземпляре EC2, рекомендуется привязать роль IAM к этому экземпляру EC2 вместо использования ключей доступа. Это позволяет избежать жёсткого задания учётных данных в коде и повышает безопасность.

1. Создайте политику доверия для роли экземпляра EC2

    Сначала создайте файл политики доверия, которая разрешает сервису EC2 принимать эту роль:

    ```json
    cat > ec2-trust-policy.json << 'EOF'
    {
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
        }
    ]
    }
    EOF
    ```

2. Создайте роль экземпляра EC2

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```

3. Прикрепите политику разрешений для доступа к S3

    ```bash
    # Attach AmazonS3FullAccess managed policy
    aws iam attach-role-policy \
        --role-name polaris-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. Создайте профиль экземпляра

    ```bash
    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile

    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile \
        --role-name polaris-ec2-role
    ```

5. Привяжите профиль экземпляра к экземпляру EC2

    ```bash
    # If it's a newly created EC2 instance, specify during launch
    aws ec2 run-instances \
        --image-id ami-xxxxxxxxx \
        --instance-type t3.medium \
        --iam-instance-profile Name=polaris-ec2-instance-profile \
        --other-parameters...

    # If it's an existing EC2 instance, associate instance profile
    aws ec2 associate-iam-instance-profile \
        --instance-id i-xxxxxxxxx \
        --iam-instance-profile Name=polaris-ec2-instance-profile
    ```

## 2. Развёртывание Polaris и создание Catalog {#2-polaris-deployment-and-catalog-creation}

Завершив подготовку окружения, перейдём к развёртыванию сервиса Polaris и настройке Catalog.

> В этом документе используется способ быстрого запуска из исходного кода. Другие варианты развёртывания описаны здесь: https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/

### 2.1 Клонирование исходного кода и запуск Polaris {#21-clone-source-code-and-start-polaris}

1. Клонируйте репозиторий Polaris и переключитесь на нужную версию

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```

2. Задайте учётные данные AWS (необязательно)

    Если вы запускаете Polaris вне EC2 или к EC2 не привязана подходящая роль IAM, необходимо через переменные окружения передать Polaris ключи AK/SK с правом принимать роль `polaris-doris-demo`.

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```

3. Соберите и запустите Polaris

    Убедитесь, что установлены Java 21+ и Docker 27+.

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```

* `POLARIS` обозначает realm
* `root` является значением `CLIENT_ID`
* `secret` является значением `CLIENT_SECRET`
* Если учётные данные не заданы, используются предустановленные учётные данные `POLARIS,root,s3cr3t`

Эта команда запустит сервис Polaris, который по умолчанию прослушивает порт `8181`.

### 2.2 Создание Catalog и Namespace в Polaris {#22-create-catalog-and-namespace-in-polaris}

1. **Экспортируйте учётные данные ROOT**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```

2. Создайте Catalog (с указанием хранилища S3)

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```

    * `--storage-type s3`: указывает S3 в качестве базового хранилища.
    * `--default-base-location`: корневой путь по умолчанию для данных таблиц Iceberg.
    * `--role-arn`: роль IAM, которую сервис Polaris принимает для доступа к S3.
    * `--external-id`: внешний идентификатор, используемый при принятии роли. Он должен соответствовать настройке в политике доверия роли IAM.

3. Создайте Namespace

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```

В результате создаётся база данных (Namespace) с именем `doris_demo` в `doris_catalog`.

### 2.3 Настройка ролей безопасности и прав доступа в Polaris {#23-polaris-security-role-and-permission-configuration}

Чтобы Doris мог подключаться от имени пользователя, отличного от `root`, необходимо создать нового пользователя и роль, а затем предоставить необходимые права.

1. Создайте Principal Role и Catalog Role

    ```bash
    # Create a Principal Role for aggregating permissions
    ./polaris principal-roles create doris_pr_role

    # Create a Catalog Role under doris_catalog
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```

2. Предоставьте права роли Catalog Role

    ```bash
    # Grant doris_catalog_role permission to manage content within this Catalog
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```

3. Свяжите Principal Role и Catalog Role

    ```bash
    # Assign doris_catalog_role to doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```

4. Создайте новый Principal (пользователя) и привяжите роль

    ```bash
    # Create a new user (Principal) named doris_user
    ./polaris principals create doris_user
    # Example output: {"clientId": "6e155b128dc06c13", "clientSecret": "ce9fbb4cc91c43ff2955f2c6545239d7"}
    # Please note down this new client_id and client_secret pair, as Doris will use it for connection.

    # Bind doris_user to doris_pr_role
    ./polaris principal-roles grant \
    doris_pr_role \
    --principal doris_user
    ```

На этом настройка Polaris завершена. Мы создали пользователя с именем `doris_user`, который получает право управлять `doris_catalog` через `doris_pr_role`.

## 3. Подключение Doris к Polaris {#3-doris-connection-to-polaris}

Теперь создадим в Doris Iceberg Catalog, который подключается к только что настроенному сервису Polaris. Doris поддерживает различные гибкие сочетания способов аутентификации.

> **Примечание:** в этом примере для подключения к REST-сервису Polaris используются учётные данные OAuth2. Кроме того, Doris поддерживает параметр `iceberg.rest.oauth2.token`, позволяющий напрямую передать заранее полученный Bearer Token.

### Способ 1: OAuth2 + временные учётные данные для доступа к хранилищу (Credential Vending) {#method-1-oauth2--temporary-storage-credentials-credential-vending}

Этот способ **рекомендуется в первую очередь**. Doris использует учётные данные OAuth2 для аутентификации в Polaris и получения метаданных. Когда требуется прочитать или записать файлы данных в S3, Doris запрашивает у Polaris временные учётные данные для доступа к S3 с минимально необходимыми правами.

Используйте `clientId` и `clientSecret`, созданные для `doris_user`.

```sql
CREATE CATALOG polaris_vended PROPERTIES (
    'type' = 'iceberg',
    -- Catalog name in Polaris
    'warehouse' = 'doris_catalog',
    'iceberg.catalog.type' = 'rest',
    -- Polaris service address
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    -- Metadata authentication method
    'iceberg.rest.security.type' = 'oauth2',
    -- Replace with doris_user's client_id:client_secret
    'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### Способ 2: OAuth2 + статические учётные данные для доступа к хранилищу (AK/SK) {#method-2-oauth2--static-storage-credentials-aksk}

При этом подходе Doris по-прежнему использует OAuth2 для доступа к метаданным Polaris, но для обращения к данным в S3 применяет статические AK/SK, жёстко заданные в конфигурации Catalog в Doris. Этот способ прост в настройке и подходит для быстрого тестирования, однако обеспечивает меньшую безопасность.

```sql
CREATE CATALOG polaris_aksk PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    'iceberg.rest.warehouse' = 'doris_catalog',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '6e155b128dc06c13:ce9fbb4cc91c43ff2955f2c6545239d7',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_S3_ACCESS_KEY',
    's3.secret_key' = 'YOUR_S3_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
    's3.region' = 'us-west-2'
);
```

## 4. Проверка подключения в Doris {#4-verify-connection-in-doris}

Независимо от выбранного способа создания Catalog, вы можете проверить работу всей цепочки подключения с помощью следующего SQL.

```sql
-- Switch to the Catalog you created and the Namespace configured in Polaris
USE polaris_vended.doris_demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Polaris');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+---------+
-- | id   | name    |
-- +------+---------+
-- | 1    | Doris   |
-- | 2    | Polaris |
-- +------+---------+
```

Если все перечисленные операции выполнены успешно, поздравляем! Вы настроили полную цепочку работы с озером данных: Doris -> Polaris -> S3.

Подробнее об управлении таблицами Iceberg с помощью Doris:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
