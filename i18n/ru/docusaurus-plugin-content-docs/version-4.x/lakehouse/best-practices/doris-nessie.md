---
{
    "title": "Интеграция с Nessie",
    "language": "ru",
    "description": "Эта статья поможет вам интегрировать Apache Doris с Nessie для эффективного выполнения запросов к данным Iceberg и управления ими. Мы шаг за шагом рассмотрим весь процесс: от подготовки окружения до выполнения запросов."
}
---

[Nessie](https://projectnessie.org/) — транзакционный каталог с открытым исходным кодом для озёр данных, предоставляющий возможности управления версиями данных по аналогии с Git. Он реализует спецификацию Iceberg REST Catalog и поддерживает ветвление, создание тегов и обращение к историческим состояниям данных (time travel) для нескольких форматов таблиц, включая Apache Iceberg.

Эта статья поможет вам интегрировать Apache Doris с Nessie для эффективного выполнения запросов к данным Iceberg и управления ими. Мы шаг за шагом рассмотрим весь процесс: от подготовки окружения до выполнения запросов.

**Из этого документа вы узнаете:**

* **Подготовка окружения AWS**: как создать и настроить бакеты S3 в AWS, а также подготовить необходимые роли и политики IAM для Nessie, чтобы Nessie мог обращаться к S3 и передавать учётные данные доступа Doris.

* **Развёртывание и настройка Nessie**: как развернуть службу Nessie с помощью Docker Compose и настроить Warehouse, чтобы предоставить Doris конечные точки доступа к метаданным.

* **Подключение Doris к Nessie**: как использовать Doris для чтения и записи данных Iceberg через Nessie.

## 1. Подготовка окружения AWS {#1-aws-environment-preparation}

Прежде чем начать, необходимо подготовить бакеты S3 и соответствующие роли IAM в AWS. Они станут основой для управления данными через Nessie и доступа к данным из Doris.

### 1.1 Создание бакета S3 {#11-create-s3-storage-bucket}

Сначала создадим бакет S3 с именем `nessie-doris-demo` для хранения данных таблиц Iceberg, которые будут созданы далее.

```bash
# Create S3 storage bucket
aws s3 mb s3://nessie-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep nessie-doris-demo
```

### 1.2 Создание роли IAM для доступа к объектному хранилищу (необязательно) {#12-create-iam-role-for-object-storage-access-optional}

Если вы планируете использовать режим Credential Vending, необходимо создать роль IAM, которую Nessie будет использовать через механизм STS AssumeRole. Такой подход соответствует лучшим практикам безопасности: принципу минимальных привилегий и разделению обязанностей.

1. Создайте файл политики доверия

    Создайте файл `nessie-trust-policy.json`:

    ```bash
    cat > nessie-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USER"
            },
            "Action": "sts:AssumeRole"
        }
        ]
    }
    EOF
    ```

    > Примечание: замените YOUR\_ACCOUNT\_ID на фактический идентификатор вашего аккаунта AWS, который можно получить командой `aws sts get-caller-identity --query Account --output text`. Замените YOUR\_USER на фактическое имя пользователя IAM.

2. Создайте роль IAM

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```

3. Прикрепите политику разрешений на доступ к S3

    Создайте файл `nessie-s3-policy.json`:

    ```bash
    cat > nessie-s3-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListBucketMultipartUploads",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::nessie-doris-demo",
                "arn:aws:s3:::nessie-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    Прикрепите политику к роли:

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```

4. Предоставьте пользователю разрешение AssumeRole

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-nessie-role \
        --policy-document file://user-assume-policy.json
    ```

5. Проверьте результаты создания

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```

## 2. Развёртывание Nessie и настройка Warehouse {#2-nessie-deployment-and-warehouse-configuration}

После подготовки окружения перейдём к развёртыванию службы Nessie и настройке Warehouse.

### 2.1 Развёртывание Nessie с помощью Docker Compose (режим Credential Vending) {#21-deploy-nessie-using-docker-compose-credential-vending-mode}

Этот способ развёртывания **рекомендуется в первую очередь**: использование временных учётных данных повышает безопасность.

Создайте файл `.env` для хранения учётных данных AWS:

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

Создайте файл `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie
        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse
        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.auth-type=APPLICATION_GLOBAL
        -Dnessie.catalog.service.s3.default-options.server-iam.enabled=true
        -Dnessie.catalog.service.s3.default-options.server-iam.assume-role=arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role
        -Dnessie.catalog.service.s3.default-options.server-iam.role-session-name=nessie-doris
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}

volumes:
  pgdata:
```

**Основные параметры настройки Credential Vending:**

| Параметр | Описание |
| --------- | ----------- |
| `nessie.version.store.type` | Тип хранилища версий; для хранения в PostgreSQL используется JDBC2. |
| `nessie.catalog.default-warehouse` | Имя Warehouse по умолчанию. |
| `nessie.catalog.warehouses.<name>.location` | Расположение в S3 для хранения данных таблиц Iceberg. |
| `server-iam.enabled` | Установите значение `true`, чтобы включить Credential Vending. |
| `server-iam.assume-role` | ARN роли IAM, которую Nessie будет принимать для доступа к S3. |
| `server-iam.role-session-name` | Имя сеанса принятой роли. |
| `auth-type` | Установите значение `APPLICATION_GLOBAL`, чтобы использовать учётные данные уровня приложения. |

Запустите Nessie:

```bash
docker compose up -d
```

После запуска API Nessie будет доступен по адресу `http://YOUR_HOST_IP:19120`.

### 2.2 Развёртывание Nessie с помощью Docker Compose (режим статических учётных данных) {#22-deploy-nessie-using-docker-compose-static-credentials-mode}

Если Credential Vending вам не нужен, для быстрого тестирования можно использовать режим статических учётных данных:

Создайте файл `.env` для хранения учётных данных AWS:

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

Создайте файл `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie

        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse

        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.access-key=urn:nessie-secret:quarkus:my-secrets-default
        -Dmy-secrets-default.name=${AWS_ACCESS_KEY_ID}
        -Dmy-secrets-default.secret=${AWS_SECRET_ACCESS_KEY}

    env_file:
      - .env

volumes:
  pgdata:
```

**Основные параметры настройки:**

| Параметр | Описание |
| --------- | ----------- |
| `nessie.version.store.type` | Тип хранилища версий; для хранения в PostgreSQL используется JDBC2. |
| `nessie.catalog.default-warehouse` | Имя Warehouse по умолчанию. |
| `nessie.catalog.warehouses.<name>.location` | Расположение в S3 для хранения данных таблиц Iceberg. |
| `nessie.catalog.service.s3.default-options.region` | Регион AWS, в котором расположен бакет S3. |

## 3. Подключение Doris к Nessie {#3-doris-connection-to-nessie}

Теперь создадим в Doris объект Iceberg Catalog, подключённый к службе Nessie.

### Способ 1: временные учётные данные для доступа к хранилищу (Credential Vending) {#method-1-temporary-storage-credentials-credential-vending}

Этот способ **рекомендуется в первую очередь**. Для чтения и записи файлов данных в S3 Doris запрашивает у Nessie временные учётные данные доступа к S3 с минимальными привилегиями.

```sql
CREATE CATALOG nessie_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

> Примечание: URI Nessie REST Catalog имеет формат `http://HOST:PORT/iceberg/{branch}`, где `main` — имя ветки по умолчанию.

### Способ 2: статические учётные данные для доступа к хранилищу (AK/SK) {#method-2-static-storage-credentials-aksk}

При таком подходе Doris обращается к объектному хранилищу напрямую, используя статические AK/SK, явно заданные в конфигурации. Этот способ прост в настройке и подходит для быстрого тестирования, но обеспечивает более низкий уровень безопасности.

```sql
CREATE CATALOG nessie_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 4. Проверка подключения в Doris {#4-verify-connection-in-doris}

Независимо от выбранного способа создания Catalog, вы можете проверить работоспособность всей цепочки подключения с помощью следующих команд SQL.

```sql
-- Switch to the Catalog
USE nessie_vc;

-- Create a namespace (database)
CREATE DATABASE demo;
USE demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'alice'), (2, 'bob');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+-------+
-- | id   | name  |
-- +------+-------+
-- | 1    | alice |
-- | 2    | bob   |
-- +------+-------+
```

Если все перечисленные операции выполнены успешно, поздравляем! Вы настроили полную цепочку работы с озером данных: Doris -> Nessie -> S3.

Подробнее об управлении таблицами Iceberg с помощью Doris см. по ссылке:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
