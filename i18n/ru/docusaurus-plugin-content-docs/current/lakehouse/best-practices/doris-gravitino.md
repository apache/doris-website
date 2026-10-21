---
{
    "title": "Интеграция с Apache Gravitino",
    "language": "ru",
    "description": "По мере стремительного развития технологий озёр данных создание единой, безопасной,"
}
---

Стремительное развитие технологий озёр данных сделало построение единой, безопасной и эффективной архитектуры lakehouse одной из ключевых задач цифровой трансформации предприятий. Apache Gravitino, платформа унифицированного управления метаданными нового поколения, предлагает комплексное решение для управления данными в мультиоблачных средах с несколькими вычислительными движками. Она поддерживает централизованное управление различными источниками данных и вычислительными движками, а также обеспечивает безопасность и контролируемость доступа к данным с помощью механизмов выдачи учётных данных.

В этой статье подробно рассматривается интеграция Apache Doris с Apache Gravitino для построения современной архитектуры lakehouse на основе Iceberg REST Catalog. Унифицированное управление метаданными и динамическая выдача учётных данных в Gravitino позволяют эффективно и безопасно обращаться к данным Iceberg в S3.

**Из этого документа вы узнаете:**

* **Подготовка среды AWS**: как создать бакеты S3 и роли IAM в AWS, настроить безопасную систему управления учётными данными для Gravitino и организовать динамическую выдачу временных учётных данных.

* **Развёртывание и настройка Gravitino**: как быстро развернуть службы Gravitino, настроить Iceberg REST Catalog и включить функцию vended-credentials.

* **Подключение Doris к Gravitino**: подробное объяснение того, как Doris получает доступ к данным Iceberg через REST API Gravitino.

## Практическое руководство {#hands-on-guide}

### 1. Подготовка среды AWS {#1-aws-environment-preparation}

Прежде чем начать, необходимо подготовить в AWS всю необходимую инфраструктуру, включая бакеты S3 и тщательно спроектированную систему ролей IAM. Это основа безопасной и надёжной архитектуры lakehouse.

### 1.1 Создание бакета S3 {#11-create-s3-bucket}

Сначала создайте отдельный бакет S3 для хранения данных Iceberg:

```bash
# Create S3 bucket
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep gravitino-iceberg-demo
```

### 1.2 Проектирование архитектуры ролей IAM {#12-design-iam-role-architecture}

Для безопасного управления учётными данными необходимо создать роль IAM, которую Gravitino будет использовать через механизм STS AssumeRole. Такая схема соответствует рекомендациям по безопасности: принципу минимальных привилегий и разделению обязанностей.

**Создание роли для доступа к данным**

1. Создание файла политики доверия

   Создайте файл `gravitino-trust-policy.json`:

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": [
                       "arn:aws:iam::YOUR_ACCOUNT_ID:root"
                   ]
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

2. Создание роли IAM

   Чтобы упростить пример, мы будем использовать готовые политики, управляемые AWS. В производственной среде следует настраивать права доступа более детально.

   ```bash
   # Create IAM role
   aws iam create-role \
       --role-name gravitino-iceberg-access \
       --assume-role-policy-document file://gravitino-trust-policy.json \
       --description "Gravitino Iceberg data access role"

   # Attach S3 full access permissions (for testing, use fine-grained permissions in production)
   aws iam attach-role-policy \
       --role-name gravitino-iceberg-access \
       --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

3. Проверка конфигурации IAM

    Убедитесь, что роль настроена правильно:

    ```bash
    # Test role assumption functionality
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```

    Пример успешного ответа:

    ```json
    {
        "Credentials": {
            "AccessKeyId": "ASIA***************",
            "SecretAccessKey": "***************************",
            "SessionToken": "IQoJb3JpZ2luX2VjEOj...",
            "Expiration": "2025-07-23T08:33:30+00:00"
        }
    }
    ```

## 2. Развёртывание и настройка Gravitino {#2-gravitino-deployment-and-configuration}

### 2.1 Скачивание и установка Gravitino {#21-download-and-install-gravitino}

Для быстрой подготовки среды воспользуемся готовой сборкой Gravitino:

```bash
# Create working directory
mkdir gravitino-deployment && cd gravitino-deployment

# Download Gravitino main program
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-0.9.1-bin.tar.gz

# Download Iceberg REST server component
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-iceberg-rest-server-0.9.1-bin.tar.gz

# Extract and install
tar -xzf gravitino-0.9.1-bin.tar.gz
cd gravitino-0.9.1-bin
tar -xzf ../gravitino-iceberg-rest-server-0.9.1-bin.tar.gz --strip-components=1
```

### 2.2 Установка необходимых зависимостей {#22-install-required-dependencies}

Для поддержки AWS S3 и управления учётными данными необходимо установить дополнительные JAR-пакеты:

```bash
# Create necessary directory structure
mkdir -p catalogs/lakehouse-iceberg/libs
mkdir -p iceberg-rest-server/libs
mkdir -p logs
mkdir -p /tmp/gravitino

# Download Iceberg AWS bundle
wget https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-aws-bundle/1.6.1/iceberg-aws-bundle-1.6.1.jar \
  -P catalogs/lakehouse-iceberg/libs/

# Download Gravitino AWS support package (core for vended-credentials functionality)
wget https://repo1.maven.org/maven2/org/apache/gravitino/gravitino-aws/0.9.1/gravitino-aws-0.9.1.jar \
  -P iceberg-rest-server/libs/

# Distribute JAR packages to various directories
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar iceberg-rest-server/libs/
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar libs/
cp iceberg-rest-server/libs/gravitino-aws-0.9.1.jar libs/
```

### 2.3 Настройка службы Gravitino {#23-configure-gravitino-service}

1. Настройка основной службы

    Создайте или отредактируйте файл `conf/gravitino.conf`:

    ```properties
    # Gravitino server basic configuration
    gravitino.server.webserver.host = 0.0.0.0
    gravitino.server.webserver.httpPort = 8090

    # Metadata store configuration (PostgreSQL/MySQL recommended for production)
    gravitino.entity.store = relational
    gravitino.entity.store.relational = JDBCBackend
    gravitino.entity.store.relational.jdbcUrl = jdbc:h2:file:/tmp/gravitino/gravitino.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.entity.store.relational.jdbcDriver = org.h2.Driver
    gravitino.entity.store.relational.jdbcUser = gravitino
    gravitino.entity.store.relational.jdbcPassword = gravitino

    # Enable Iceberg REST service
    gravitino.auxService.names = iceberg-rest

    # Iceberg REST service detailed configuration
    gravitino.iceberg-rest.classpath = iceberg-rest-server/libs, iceberg-rest-server/conf
    gravitino.iceberg-rest.host = 0.0.0.0
    gravitino.iceberg-rest.httpPort = 9001

    # Iceberg catalog backend configuration
    gravitino.iceberg-rest.catalog-backend = jdbc
    gravitino.iceberg-rest.uri = jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.iceberg-rest.jdbc-driver = org.h2.Driver
    gravitino.iceberg-rest.jdbc-user = iceberg
    gravitino.iceberg-rest.jdbc-password = iceberg123
    gravitino.iceberg-rest.jdbc-initialize = true
    gravitino.iceberg-rest.warehouse = s3://gravitino-iceberg-demo/warehouse
    gravitino.iceberg-rest.io-impl = org.apache.iceberg.aws.s3.S3FileIO
    gravitino.iceberg-rest.s3-region = us-west-2

    # Enable Vended-Credentials functionality
    # Note: Gravitino uses these AK/SK to call STS AssumeRole and obtain temporary credentials for distribution to clients
    gravitino.iceberg-rest.credential-providers = s3-token
    gravitino.iceberg-rest.s3-access-key-id = YOUR_AWS_ACCESS_KEY_ID
    gravitino.iceberg-rest.s3-secret-access-key = YOUR_AWS_SECRET_ACCESS_KEY
    gravitino.iceberg-rest.s3-role-arn = arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access
    gravitino.iceberg-rest.s3-region = us-west-2
    gravitino.iceberg-rest.s3-token-expire-in-secs = 3600
    ```

2. Запуск службы

    ```bash
    # Start Gravitino service
    ./bin/gravitino.sh start

    # Check service status
    ./bin/gravitino.sh status

    # View logs
    tail -f logs/gravitino-server.log
    ```

3. Проверка состояния службы

    ```bash
    # Verify main service
    curl -v http://localhost:8090/api/version

    # Verify Iceberg REST service
    curl -v http://localhost:9001/iceberg/v1/config
    ```

### 2.4 Создание структуры метаданных Gravitino {#24-create-gravitino-metadata-structure}

Создайте необходимые структуры метаданных через REST API:

```bash
# Create MetaLake
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lakehouse",
    "comment": "Gravitino lakehouse for Doris integration",
    "properties": {}
  }' http://localhost:8090/api/metalakes

# Create Iceberg Catalog
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iceberg_catalog",
    "type": "RELATIONAL",
    "provider": "lakehouse-iceberg",
    "comment": "Iceberg catalog with S3 storage and vended credentials",
    "properties": {
      "catalog-backend": "jdbc",
      "uri": "jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL",
      "jdbc-user": "iceberg",
      "jdbc-password": "iceberg123",
      "jdbc-driver": "org.h2.Driver",
      "jdbc-initialize": "true",
      "warehouse": "s3://gravitino-iceberg-demo/warehouse",
      "io-impl": "org.apache.iceberg.aws.s3.S3FileIO",
      "s3-region": "us-west-2"
    }
  }' http://localhost:8090/api/metalakes/lakehouse/catalogs
```

## 3. Подключение Doris к Gravitino {#3-doris-connection-to-gravitino}

### 3.1 Использование выдаваемых учётных данных {#31-using-vended-credentials}

Gravitino будет динамически создавать временные учётные данные и передавать их Doris:

```sql
-- Create dynamic credential mode Catalog
CREATE CATALOG gravitino_vending PROPERTIES (
    'type' = 'iceberg',
    'warehouse' = 'warehouse',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 3.2 Проверка подключения и операций с данными {#32-verify-connection-and-data-operations}

```sql
-- Verify connection
SHOW DATABASES FROM gravitino_vending;

-- Switch to vended credentials catalog
SWITCH gravitino_vending;

-- Create database and table
CREATE DATABASE demo;
USE gravitino_vending.demo;

CREATE TABLE gravitino_table (
    id INT,
    name STRING
)
PROPERTIES (
    'write-format' = 'parquet'
);

-- Insert test data
INSERT INTO gravitino_table VALUES (1, 'Doris'), (2, 'Gravitino');

-- Query verification
SELECT * FROM gravitino_table;
```

## Итоги {#summary}

Следуя этому руководству, вы сможете построить современную архитектуру lakehouse на основе Gravitino и Doris. Такая архитектура обеспечивает высокую производительность и доступность, а передовые механизмы безопасности позволяют защитить доступ к данным и соблюдать нормативные требования. По мере роста объёмов данных и изменения бизнес-требований её можно гибко масштабировать для решения различных задач корпоративного уровня.
