---
{
    "title": "Интеграция с Lakekeeper",
    "language": "ru"
}
---

[Lakekeeper](https://lakekeeper.io/) — это реализация Apache Iceberg REST Catalog с открытым исходным кодом, написанная на Rust. Она предоставляет легковесный, высокопроизводительный сервис управления метаданными с поддержкой различных систем хранения, включая AWS S3, Alibaba Cloud OSS и MinIO.

В этой статье мы рассмотрим интеграцию Apache Doris с Lakekeeper для эффективного выполнения запросов к данным Iceberg и управления ими. Мы пошагово пройдем весь процесс от подготовки среды до выполнения запросов.

**Из этого документа вы узнаете:**

* **Подготовка среды AWS**: как создать и настроить бакеты S3 в AWS, а также подготовить необходимые роли и политики IAM для Lakekeeper, чтобы он мог обращаться к S3 и передавать Doris учетные данные для доступа.

* **Развертывание и настройка Lakekeeper**: как развернуть сервис Lakekeeper с помощью Docker Compose и создать в Lakekeeper Project и Warehouse, чтобы предоставить Doris конечные точки доступа к метаданным.

* **Подключение Doris к Lakekeeper**: как использовать Doris для чтения и записи данных Iceberg через Lakekeeper.

## 1. Подготовка среды AWS {#1-aws-environment-preparation}

Прежде чем начать, необходимо подготовить бакеты S3 и соответствующие роли IAM в AWS. Они обеспечат основу для управления данными через Lakekeeper и доступа к ним из Doris.

### 1.1 Создание бакета S3 {#11-create-s3-storage-bucket}

Сначала создадим бакет S3 с именем `lakekeeper-doris-demo` для хранения данных таблиц Iceberg, которые мы создадим позже.

```bash
# Create S3 storage bucket
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep lakekeeper-doris-demo
```

### 1.2 Создание роли IAM для доступа к объектному хранилищу {#12-create-iam-role-for-object-storage-access}

Для безопасного управления учетными данными необходимо создать роль IAM, которую Lakekeeper будет использовать через механизм STS AssumeRole. Такой подход соответствует рекомендациям по безопасности: принципу минимальных привилегий и разделению обязанностей.

1. Создайте файл политики доверия

    Создайте файл `lakekeeper-trust-policy.json`:

    ```bash
    cat > lakekeeper-trust-policy.json << 'EOF'
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

    > Примечание: замените YOUR\_ACCOUNT\_ID фактическим идентификатором аккаунта AWS, который можно получить с помощью `aws sts get-caller-identity --query Account --output text`. Замените YOUR\_USER фактическим именем пользователя IAM.

2. Создайте роль IAM

    ```bash
    aws iam create-role \
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```

3. Прикрепите политику разрешений на доступ к S3

    Создайте файл `lakekeeper-s3-policy.json`:

    ```bash
    cat > lakekeeper-s3-policy.json << 'EOF'
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
                "arn:aws:s3:::lakekeeper-doris-demo",
                "arn:aws:s3:::lakekeeper-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    Прикрепите политику к роли:

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```

4. Предоставьте пользователю разрешение AssumeRole

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-lakekeeper-role \
        --policy-document file://user-assume-policy.json
    ```

5. Проверьте результаты создания

    ```bash
    aws iam get-role --role-name lakekeeper-sts-role
    aws iam list-role-policies --role-name lakekeeper-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role \
        --role-session-name lakekeeper-test
    ```

## 2. Развертывание Lakekeeper и создание Warehouse {#2-lakekeeper-deployment-and-warehouse-creation}

После подготовки среды приступим к развертыванию сервиса Lakekeeper и настройке Warehouse.

### 2.1 Развертывание Lakekeeper с помощью Docker Compose {#21-deploy-lakekeeper-using-docker-compose}

Создайте файл `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -p 5432 -d postgres"]
      interval: 2s
      timeout: 10s
      retries: 10

  migrate:
    image: quay.io/lakekeeper/catalog:latest-main
    restart: "no"
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - RUST_LOG=info
    command: ["migrate"]
    depends_on:
      db:
        condition: service_healthy

  lakekeeper:
    image: quay.io/lakekeeper/catalog:latest-main
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - LAKEKEEPER__BASE_URI=http://YOUR_HOST_IP:8181
      - LAKEKEEPER__ENABLE_DEFAULT_PROJECT=true
      - RUST_LOG=info
    command: ["serve"]
    ports:
      - "8181:8181"
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy

volumes:
  pgdata:
```

**Основные параметры конфигурации:**

| Параметр | Описание |
| --------- | ----------- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | Используется для шифрования секретов, хранящихся в Postgres, при использовании стандартного хранилища секретов на базе Postgres. Следует задать достаточно длинную случайную строку. |
| `LAKEKEEPER__BASE_URI` | Базовый URI сервиса Lakekeeper. Замените `YOUR_HOST_IP` фактическим IP-адресом хоста. |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | При значении `true` включает использование Project по умолчанию. |

Запустите Lakekeeper:

```bash
docker compose up -d
```

После запуска будут доступны следующие конечные точки:

* Swagger UI: `http://YOUR_HOST_IP:8181/swagger-ui/`
* Веб-интерфейс: `http://YOUR_HOST_IP:8181/ui`

### 2.2 Создание Project и Warehouse {#22-create-project-and-warehouse}

1. Создайте Project

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```

    Проверьте результат:

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```

    Сохраните значение `project-id` из ответа: на следующих шагах оно будет использоваться как `PROJECT_ID`.

2. Создайте Warehouse (режим Credential Vending)

    Если необходимо использовать режим Credential Vending, создайте файл конфигурации Warehouse `create-warehouse-vc.json`:

    ```bash
    cat > create-warehouse-vc.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-vc-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse-vc",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": true,
        "flavor": "aws",
        "assume-role-arn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    * `sts-enabled`: установите значение `true`, чтобы включить Credential Vending.
    * `assume-role-arn`: ARN роли IAM, от имени которой Lakekeeper будет обращаться к S3.

    Создайте Warehouse:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```

3. Создайте Warehouse (режим статических учетных данных)

    Создайте файл конфигурации Warehouse `create-warehouse-static.json`:

    ```bash
    cat > create-warehouse-static.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": false,
        "flavor": "aws"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    Создайте Warehouse:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```

4. Проверьте создание Warehouse

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```

5. Создайте Namespace

    Сохраните значение `warehouse-id` из ответа на предыдущем шаге: оно будет использоваться для создания Namespace:

    ```bash
    curl -sS -X POST \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      "http://localhost:8181/catalog/v1/$WAREHOUSE_ID/namespaces" \
      -d '{
        "namespace": ["demo"],
        "properties": {}
      }'
    ```

    Так в Warehouse создается Namespace (база данных) с именем `demo`.

На этом настройка на стороне Lakekeeper завершена.

## 3. Подключение Doris к Lakekeeper {#3-doris-connection-to-lakekeeper}

Теперь создадим в Doris Iceberg Catalog, который подключается к только что настроенному сервису Lakekeeper.

### Способ 1: временные учетные данные для доступа к хранилищу (Credential Vending) {#method-1-temporary-storage-credentials-credential-vending}

Это **наиболее рекомендуемый** подход. Когда Doris требуется читать или записывать файлы данных в S3, он запрашивает у Lakekeeper временные учетные данные для доступа к S3 с минимальными привилегиями.

```sql
CREATE CATALOG lakekeeper_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-vc-warehouse',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### Способ 2: статические учетные данные для доступа к хранилищу (AK/SK) {#method-2-static-storage-credentials-aksk}

При таком подходе Doris обращается к объектному хранилищу напрямую, используя статические AK/SK, явно заданные в конфигурации. Этот способ прост в настройке и подходит для быстрого тестирования, но обеспечивает более низкий уровень безопасности.

```sql
CREATE CATALOG lakekeeper_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-warehouse',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 4. Проверка подключения в Doris {#4-verify-connection-in-doris}

Независимо от выбранного способа создания Catalog, сквозное подключение можно проверить с помощью следующего SQL.

```sql
-- Switch to the Catalog and Namespace configured in Lakekeeper
USE lakekeeper_static.demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Lakekeeper');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+------------+
-- | id   | name       |
-- +------+------------+
-- | 1    | Doris      |
-- | 2    | Lakekeeper |
-- +------+------------+
```

Если все приведенные выше операции выполнены успешно, поздравляем! Вы настроили полный конвейер озера данных: Doris -> Lakekeeper -> S3.

Дополнительную информацию об управлении таблицами Iceberg с помощью Doris см. по адресу:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
