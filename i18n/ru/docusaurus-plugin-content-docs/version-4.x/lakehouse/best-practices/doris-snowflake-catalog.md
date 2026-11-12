---
{
    "title": "Интеграция со Snowflake Catalog",
    "language": "ru",
    "description": "В этом документе описано, как подключить Apache Doris к Snowflake Horizon Catalog и Snowflake Open Catalog через Iceberg REST Catalog API."
}
---

Apache Doris может подключаться к сервисам Snowflake Catalog через Iceberg REST Catalog API. Эта интеграция позволяет Doris выполнять запросы к таблицам Iceberg, управляемым Snowflake, а также создавать таблицы Iceberg и записывать в них данные при использовании внутренних каталогов Snowflake Open Catalog.

В этом документе рассматриваются два сервиса каталогов Snowflake:

- **Snowflake Horizon Catalog**: используется для доступа к таблицам Iceberg, управляемым Snowflake, в существующей учётной записи Snowflake.
- **Snowflake Open Catalog**: управляемый сервис Apache Polaris / Iceberg REST Catalog от Snowflake, используемый для управления каталогами, пространствами имён и таблицами Iceberg.

## Выбор Snowflake Catalog {#choosing-a-snowflake-catalog}

| Параметр | Snowflake Horizon Catalog | Snowflake Open Catalog |
| --- | --- | --- |
| Основной сценарий использования | Запросы к таблицам Iceberg, управляемым Snowflake | Управление таблицами Iceberg в Snowflake Open Catalog |
| Параметр Doris `warehouse` | Имя базы данных Snowflake | Имя каталога Open Catalog |
| Учётные данные | Snowflake Programmatic Access Token (PAT) | Служебное подключение `<client_id>:<client_secret>` |
| Область действия OAuth | `session:role:<ROLE_NAME>` | `PRINCIPAL_ROLE:<ROLE_NAME>` |
| Создание таблиц из Doris | Не рекомендуется | Поддерживается во внутренних каталогах |
| Запись из Doris | Вставка данных в существующие таблицы Iceberg, управляемые Snowflake | Вставка данных в таблицы во внутренних каталогах |

Используйте Horizon Catalog, если ваши таблицы управляются Snowflake. Используйте внутренние каталоги Open Catalog, если хотите создавать таблицы Iceberg и управлять ими из Doris через Snowflake Open Catalog.

> Примечание: при подключении к Horizon Catalog установите для `iceberg.rest.view-enabled` значение `false`. (Начиная с Doris 4.0.6/4.1.1)

### Модель доступа к хранилищу {#storage-access-model}

Horizon Catalog используется для таблиц Iceberg, управляемых Snowflake. Доступом к их хранилищу также управляет Snowflake. Doris получает метаданные таблиц через REST Catalog API, а Snowflake возвращает временные учётные данные для объектного хранилища, если для `iceberg.rest.vended-credentials-enabled` установлено значение `true`. Поэтому для Horizon Catalog не требуется настраивать роль AWS IAM или учётные данные S3 в Catalog Doris.

Внутренние каталоги Open Catalog используют расположение в объектном хранилище, настроенное для каталога. Если это расположение находится в AWS S3, Open Catalog требуется роль IAM, которую он сможет принимать для чтения и записи метаданных Iceberg и файлов данных. В политике доверия роли IAM доверенный субъект — это субъект AWS, которому разрешён вызов `sts:AssumeRole`. Для Snowflake Open Catalog используйте в качестве доверенного субъекта ARN пользователя IAM, указанный в сведениях о хранилище каталога, и настройте External ID с той же страницы. External ID разрешает принятие роли только в рамках этой интеграции с Open Catalog и помогает предотвратить атаки типа confused deputy.

## Подключение к Snowflake Horizon Catalog {#connect-to-snowflake-horizon-catalog}

### Настройка среды Snowflake {#snowflake-environment-setup}

Snowflake Horizon Catalog предоставляет доступ к таблицам Iceberg, управляемым Snowflake, через Iceberg REST Catalog API.

Конечные точки REST:

```text
REST endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

Создайте таблицу Iceberg, управляемую Snowflake:

```sql
CREATE OR REPLACE ICEBERG TABLE <database_name>.<schema_name>.<table_name> (
  ID BIGINT,
  NAME STRING
)
CATALOG = 'SNOWFLAKE'
EXTERNAL_VOLUME = 'SNOWFLAKE_MANAGED';
```

`SNOWFLAKE_MANAGED` — зарезервированное значение Snowflake. Оно не обозначает внешний том, созданный пользователем, и для этого значения не требуется предоставлять Doris доступ к внешнему тому.

Предоставьте привилегии роли Snowflake, используемой Doris:

```sql
GRANT USAGE ON DATABASE <database_name> TO ROLE <role_name>;
GRANT USAGE ON SCHEMA <database_name>.<schema_name> TO ROLE <role_name>;
GRANT SELECT ON TABLE <database_name>.<schema_name>.<table_name> TO ROLE <role_name>;
```

Если Doris требуется записывать данные в таблицу, предоставьте привилегии на запись:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE <database_name>.<schema_name>.<table_name>
TO ROLE <role_name>;
```

Создайте Programmatic Access Token (PAT) для служебного пользователя:

```sql
ALTER USER IF EXISTS <service_user>
ADD PAT <pat_name>
  DAYS_TO_EXPIRY = 7
  ROLE_RESTRICTION = '<role_name>'
  COMMENT = 'Horizon Iceberg REST access for Doris';
```

Проверить PAT можно с помощью конечной точки выдачи токенов:

```bash
curl -i --fail -X POST \
  "https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=session:role:<role_name>" \
  --data-urlencode "client_secret=<PAT_token>"
```

### Создание Catalog в Doris {#create-a-doris-catalog}

Создайте Iceberg REST Catalog в Doris:

```sql
CREATE CATALOG snowflake_horizon PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<snowflake_database_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<PAT_token>',
    'iceberg.rest.oauth2.server-uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'session:role:<role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true',
    'iceberg.rest.view-enabled' = 'false',
    'iceberg.rest.connection-timeout-ms' = '30000',
    'iceberg.rest.socket-timeout-ms' = '120000'
);
```

Пояснения к параметрам:

- `warehouse`: имя базы данных Snowflake, а не вычислительного хранилища Snowflake.
- `iceberg.rest.oauth2.credential`: токен PAT Snowflake.
- `iceberg.rest.oauth2.scope`: `session:role:<role_name>`.
- `iceberg.rest.vended-credentials-enabled`: позволяет Snowflake возвращать временные учётные данные для объектного хранилища.
- `client.region`: регион используемого объектного хранилища.
- `iceberg.rest.view-enabled`: установите значение `false` при подключении к Horizon Catalog.

### Доступ к таблицам Horizon {#access-horizon-tables}

После создания Catalog выполняйте из Doris запросы к таблицам Iceberg, управляемым Snowflake:

```sql
SHOW DATABASES FROM snowflake_horizon;
SHOW TABLES FROM snowflake_horizon.<schema_name>;

SELECT COUNT(*)
FROM snowflake_horizon.<schema_name>.<table_name>;
```

Пример результата:

```text
mysql> SHOW DATABASES FROM snowflake_horizon;
+--------------------+
| Database           |
+--------------------+
| PUBLIC             |
| information_schema |
| mysql              |
+--------------------+

mysql> SHOW TABLES FROM snowflake_horizon.PUBLIC;
+------------------+
| Tables_in_PUBLIC |
+------------------+
| DORIS_HORIZON_T  |
+------------------+

mysql> SELECT * FROM snowflake_horizon.PUBLIC.DORIS_HORIZON_T;
+------+-------+
| id   | name  |
+------+-------+
|    1 | alice |
|    2 | bob   |
+------+-------+
```

Для записи в существующую таблицу Iceberg, управляемую Snowflake:

```sql
INSERT INTO snowflake_horizon.<schema_name>.<table_name>
VALUES (1, 'doris_insert');
```

## Подключение к Snowflake Open Catalog {#connect-to-snowflake-open-catalog}

Snowflake Open Catalog — управляемый сервис Apache Polaris / Iceberg REST Catalog от Snowflake. Чтобы использовать Open Catalog с Doris, сначала настройте доступ к объектному хранилищу, затем создайте каталог Open Catalog, пространство имён, роль каталога и служебное подключение.

Конечные точки REST:

```text
REST endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

### Подготовка среды AWS {#aws-environment-preparation}

Open Catalog хранит метаданные Iceberg и файлы данных в расположении объектного хранилища, указанном в каталоге. Если вы используете AWS S3, подготовьте бакет S3 и роль IAM перед созданием каталога Open Catalog.

#### Создание бакета S3 {#create-an-s3-bucket}

Создайте бакет для данных таблиц Iceberg:

```bash
aws s3 mb s3://<bucket_name> --region <region>
aws s3 ls | grep <bucket_name>
```

Каталог Open Catalog будет использовать путь в этом бакете в качестве базового расположения по умолчанию, например:

```text
s3://<bucket_name>/<catalog_prefix>/
```

#### Создание политики IAM для доступа к S3 {#create-an-iam-policy-for-s3-access}

Создайте политику IAM, разрешающую Open Catalog доступ к расположению каталога. Сохраните следующее содержимое в файле `snowflake-open-catalog-s3-policy.json`:

```bash
cat > snowflake-open-catalog-s3-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "<catalog_prefix>",
            "<catalog_prefix>/*"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>/<catalog_prefix>/*"
    }
  ]
}
EOF
```

#### Создание роли IAM {#create-an-iam-role}

Сначала создайте временную политику доверия. После создания каталога Open Catalog обновите политику доверия, указав ARN пользователя IAM и External ID, предоставленные Snowflake Open Catalog.

Создайте файл `snowflake-open-catalog-trust-policy.json`:

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<aws_account_id>:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

Создайте роль IAM и прикрепите политику S3:

```bash
aws iam create-role \
    --role-name <open_catalog_role_name> \
    --assume-role-policy-document file://snowflake-open-catalog-trust-policy.json \
    --description "IAM role for Snowflake Open Catalog to access S3"

aws iam put-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-name snowflake-open-catalog-s3-access \
    --policy-document file://snowflake-open-catalog-s3-policy.json
```

Убедитесь, что роль IAM и встроенная политика созданы:

```bash
aws iam get-role --role-name <open_catalog_role_name>
aws iam list-role-policies --role-name <open_catalog_role_name>
```

Запишите ARN роли. Он понадобится при создании каталога Open Catalog:

```text
arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

### Настройка среды Open Catalog {#open-catalog-environment-setup}

Создайте каталог Open Catalog. Используйте **внутренний каталог**, если Doris требуется создавать таблицы Iceberg и записывать в них данные.

![Создание каталога Snowflake Open Catalog](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog.png)

Типичные настройки каталога:

```text
name: <catalog_name>
type: INTERNAL
storage provider: S3
default base location: s3://<bucket_name>/<catalog_prefix>/
S3 role ARN: arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

После создания каталога Open Catalog откройте страницу сведений о каталоге и скопируйте следующие значения из сведений о хранилище:

- ARN пользователя IAM
- External ID

Затем обновите отношения доверия роли IAM, указав точные значения из Snowflake Open Catalog:

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<open_catalog_iam_user_arn>"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<external_id>"
        }
      }
    }
  ]
}
EOF

aws iam update-assume-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-document file://snowflake-open-catalog-trust-policy.json
```

Не публикуйте ARN пользователя IAM, External ID или реальный ARN роли в общедоступных документах или на снимках экрана.

Создайте пространство имён, например `public`.

> Место для изображения: создание пространства имён в Snowflake Open Catalog.

Создайте роль каталога и предоставьте необходимые привилегии.

![Создание роли каталога в Snowflake Open Catalog](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog-role.png)

Для быстрого начала работы можно предоставить привилегию `CATALOG_MANAGE_CONTENT`. В рабочей среде используйте минимальные привилегии, необходимые для вашей нагрузки.

Создайте служебное подключение для Doris.

![Создание служебного подключения Snowflake Open Catalog](/images/integrations/lakehouse/snowflake/open-catalog-service-connection.png)

Типичные настройки служебного подключения:

```text
name: doris_connection
query engine: doris
principal role: <principal_role_name>
```

После создания служебного подключения скопируйте учётные данные клиента. Значение, используемое Doris, имеет формат `<client_id>:<client_secret>`.

![Копирование учётных данных служебного подключения Snowflake Open Catalog](/images/integrations/lakehouse/snowflake/open-catalog-service-credentials.png)

Не сохраняйте реальные секреты клиентов в общедоступных файлах или на снимках экрана.

### Создание Catalog в Doris {#create-a-doris-catalog-1}

Создайте Iceberg REST Catalog в Doris:

```sql
CREATE CATALOG snowflake_open_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<open_catalog_catalog_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
    'iceberg.rest.oauth2.server-uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true'
);
```

Пояснения к параметрам:

- `warehouse`: имя каталога Open Catalog.
- `iceberg.rest.oauth2.credential`: учётные данные служебного подключения в формате `<client_id>:<client_secret>`.
- `iceberg.rest.oauth2.scope`: `PRINCIPAL_ROLE:<principal_role_name>`.
- `iceberg.rest.vended-credentials-enabled`: установите значение `true`, чтобы Doris мог использовать учётные данные, выдаваемые Open Catalog.
- `client.region`: регион объектного хранилища.

### Доступ к таблицам Open Catalog и управление ими {#access-and-manage-open-catalog-tables}

Получите доступ к пространству имён Open Catalog:

```sql
SHOW DATABASES FROM snowflake_open_catalog;
SHOW TABLES FROM snowflake_open_catalog.public;
```

Создайте таблицу Iceberg через Doris:

```sql
CREATE TABLE snowflake_open_catalog.public.doris_open_catalog_t (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format' = 'parquet'
);
```

Вставьте данные и выполните запрос:

```sql
INSERT INTO snowflake_open_catalog.public.doris_open_catalog_t
VALUES (1, 'open_catalog_insert');

SELECT *
FROM snowflake_open_catalog.public.doris_open_catalog_t
ORDER BY id;
```

## Итоги {#summary}

Через Iceberg REST Catalog API Apache Doris может подключаться к сервисам Snowflake Catalog и анализировать данные Iceberg, управляемые Snowflake.

- Используйте Snowflake Horizon Catalog для запросов к таблицам Iceberg, управляемым Snowflake. При создании Catalog в Doris задайте `iceberg.rest.view-enabled = false`.
- Используйте внутренние каталоги Snowflake Open Catalog, если хотите создавать таблицы Iceberg, управляемые Snowflake Open Catalog, записывать в них данные и выполнять к ним запросы из Doris.
