---
{
    "title": "Аутентификация и авторизация в AWS",
    "language": "ru",
    "description": "Описывает четыре способа аутентификации для доступа Doris к AWS S3: IAM User, Assumed Role, EKS IRSA/Pod Identity и Bucket Policy, с полными политиками IAM и примерами SQL.",
    "keywords": [
        "Аутентификация Doris в AWS",
        "Авторизация Doris в S3",
        "AWS IAM User",
        "AWS Assumed Role",
        "AWS sts AssumeRole",
        "EKS IRSA",
        "EKS Pod Identity",
        "S3 Bucket Policy",
        "AWSCredentialsProviderChain",
        "access_key secret_key",
        "role_arn external_id",
        "Аутентификация S3 Load",
        "Аутентификация TVF S3",
        "Авторизация External Catalog в S3",
        "Storage Vault S3"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters / Architecture decision -->
<!-- Applicable scenario: Configure Doris to access AWS S3 / Cross-account S3 access / Doris credential management in EKS -->

Doris поддерживает несколько способов интеграции с AWS для аутентификации и авторизации. Эти способы применимы к S3 Load, TVF, External Catalog, Storage Vault, Export, Repository, Resource и любым другим функциям, которым требуется доступ к ресурсам AWS S3. В этом документе описано, как настроить учётные данные безопасности AWS и использовать их для доступа к ресурсам сервисов AWS из Doris.

## Сценарии применения {#applicable-scenarios}

Doris поддерживает следующие четыре способа аутентификации и авторизации в AWS. Выберите подходящий способ с учётом среды развёртывания и требований безопасности:

| Способ аутентификации               | Сценарий применения                                                                                          | Преимущества                                                                | Недостатки                                                       |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| IAM User (AK/SK)                    | Локальные развёртывания с контролируемой безопасностью или совместимые с S3 объектные хранилища вне AWS (Load/Export/Storage Vault и т. д.) | Простая настройка. Работает с любым объектным хранилищем, совместимым с протоколом AWS S3 | Риск утечки ключей. Ключи необходимо менять вручную                  |
| Assumed Role (IAM Role)             | Сценарии с высокими требованиями к безопасности, когда Doris развёрнут на AWS EC2 и ему нужен доступ к S3 из другой учётной записи                 | Высокий уровень безопасности. Учётные данные AWS меняются автоматически. Разрешения управляются централизованно | Относительно сложная настройка политик доверия и разрешений         |
| EKS IAM Role (IRSA / Pod Identity)  | Doris развёрнут в кластере Amazon EKS                                                                       | Учётные данные автоматически предоставляются через Kubernetes ServiceAccount | Требуется знание интеграции EKS / IAM                     |
| Bucket Policy                       | Сценарии Load/Export/Storage Vault на AWS EC2 с небольшим числом бакетов                                | Соблюдается принцип минимальных привилегий. Doris автоматически обнаруживает учётные данные AWS | Разрешения распределены по отдельным бакетам, что затрудняет централизованное управление |

## Предварительные требования {#prerequisites}

- Doris FE/BE развёрнуты и работают нормально
- У вас есть целевая учётная запись AWS и бакет S3, к которому требуется доступ
- У вас есть права на настройку IAM в этой учётной записи (создание User / Role, изменение политик)
- Для Assumed Role или Bucket Policy компоненты Doris FE/BE должны быть развёрнуты на AWS EC2 (или в кластере EKS)

---

## Аутентификация и авторизация с помощью IAM User {#iam-user-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: On-premise deployment / S3-protocol compatible object stores -->

Doris поддерживает доступ к внешним источникам данных с использованием `access_key` и `secret_key` пользователя AWS IAM User. Дополнительные сведения см. в официальной документации AWS [Пользователи IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html).

### Шаг 1: создание IAM User и настройка политики {#step-1-create-an-iam-user-and-configure-a-policy}

1. Войдите в консоль AWS, откройте сервис IAM и нажмите `Create user`.

    ![](/images/integrations/create_iam_user.png)

2. Введите имя IAM User. В разделе `Set permissions` выберите непосредственное присоединение политики.

    ![](/images/integrations/iam_user_attach_policy1.png)

3. В редакторе политик введите соответствующую политику доступа к ресурсам AWS. Ниже приведены типовые шаблоны политик чтения и записи для доступа к бакету S3.

    ![](/images/integrations/iam_user_attach_policy2.png)

    **Примечание:**

    - **Замените имя бакета и путь префикса своими значениями**
    - **Не добавляйте лишние разделители "/"**

    **Шаблон политики чтения** для бакета S3. Используйте его для функций Doris, которым достаточно чтения объектов и получения их списка в бакете, например S3 Load, TVF и External Catalog:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                  "s3:GetObject",
                  "s3:GetObjectVersion",
                ],
                "Resource": "arn:aws:s3:::<your-bucket>/your-prefix/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "s3:GetBucketLocation"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>"
            }    
        ]
    }
    ```

    **Шаблон политики записи** для бакета S3. Используйте его для функций Doris, которым требуется чтение и запись объектов, а также получение их списка в бакете, например Export, Storage Vault, Resource и Repository:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                  "s3:PutObject",
                  "s3:GetObject",
                  "s3:GetObjectVersion",
                  "s3:DeleteObject",
                  "s3:DeleteObjectVersion",
                  "s3:AbortMultipartUpload",      
                  "s3:ListMultipartUploadParts"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>/<your-prefix>/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                    "s3:GetBucketVersioning",
                    "s3:GetLifecycleConfiguration"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>"
            }    
        ]
    }
    ```

4. После создания IAM User создайте для него пару ключей доступа: `access_key` и `secret_key`.

    ![](/images/integrations/iam_user_create_ak_sk.png)

### Шаг 2: использование ключа доступа в SQL Doris {#step-2-use-the-access-key-in-doris-sql}

После выполнения шага 1 у вас есть `access_key` и `secret_key`. С этой парой ключей можно использовать все функции Doris. Следующие примеры SQL демонстрируют типичные варианты использования. Основные поля:

```sql
"s3.access_key" = "<your-access-key>",
"s3.secret_key" = "<your-secret-key>"
```

**S3 Load**

```sql
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key" = "<your-secrety-key>"
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```

**External Catalog**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      'type' = 'iceberg',
      'iceberg.catalog.type' = 'hadoop',
      'warehouse' = 's3://your_bucket/dir/key',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  );
```

**Storage Vault**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
)
```

**Repository**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

**Resource**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

Вы можете указывать `access_key` и `secret_key` разных IAM User в разных частях бизнес-логики, чтобы детально управлять доступом к внешним данным.

---

## Аутентификация и авторизация с помощью Assumed Role {#assumed-role-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Cross-account S3 access / Automatic credential rotation -->

Assumed Role обеспечивает аутентификацию и авторизацию доступа к внешним источникам данных путём принятия роли AWS IAM Role. Дополнительные сведения см. в официальной документации AWS [Переключение на роль IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html). На следующей схеме показан общий порядок настройки Assumed Role:

![](/images/integrations/assumed_role_flow.png)

### Определения терминов {#term-definitions}

| Термин                          | Значение                                                                                                       |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------ |
| Исходная учётная запись                | Учётная запись AWS, которая инициирует Assume Role (в этом примере это учётная запись, которой принадлежат машины EC2 с Doris FE/BE) |
| Целевая учётная запись                | Учётная запись AWS, которой принадлежит целевой бакет S3                                                                |
| `ec2_role`                    | Роль, созданная в исходной учётной записи; её необходимо привязать к каждой машине EC2 с Doris FE/BE       |
| `bucket_role`                 | Роль, созданная в целевой учётной записи; ей необходимо предоставить разрешения на целевой бакет        |

**Примечание:**

1. **Исходная и целевая учётные записи могут быть одной и той же учётной записью AWS.**
2. **Убедитесь, что к каждой машине EC2 с Doris FE/BE привязана роль `ec2_role`, особенно при горизонтальном масштабировании.**

Ниже представлена демонстрация настройки:

<a href="https://www.bilibili.com/video/BV1U3uezjEPW/?vd_source=20479f0462e74fcf98f1df731639610f">
  <img src="/images/iam-role-doris-demo.png" alt="AWS IAM Role" />
</a>

### Шаг 1: подготовка {#step-1-preparation}

1. В исходной учётной записи создайте `ec2_role` и привяжите её к каждой машине EC2 с Doris FE/BE.
2. В целевой учётной записи создайте `bucket_role` и соответствующий бакет S3.

После привязки машины EC2 к `ec2_role` вы можете посмотреть `role_arn` в консоли, как показано ниже:

![](/images/integrations/ec2_instance.png)

### Шаг 2: добавление политики разрешений к IAM Role исходной учётной записи {#step-2-add-a-permission-policy-to-the-source-account-iam-role}

Добавьте встроенную политику, разрешающую `sts:AssumeRole`, к роли исходной учётной записи, привязанной к экземпляру EC2:

1. Войдите в [консоль AWS IAM](https://us-east-1.console.aws.amazon.com/iamv2/home#/home) и выберите `Access management > Roles` на левой панели навигации.
2. Найдите роль, связанную с экземпляром EC2, и нажмите на её имя.
3. На странице сведений о роли в разделе `Permissions` нажмите `Add permissions` и выберите `Create inline policy`.
4. На этапе `Specify permissions` перейдите на вкладку JSON, введите следующую политику, затем нажмите `Review policy`, чтобы сохранить её.

![](/images/integrations/source_role_permission.png)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["sts:AssumeRole"],
            "Resource": "*"
        }
    ]
}
```

### Шаг 3: настройка политики доверия и политики разрешений для IAM Role целевой учётной записи {#step-3-configure-the-trust-policy-and-permission-policy-on-the-target-account-iam-role}

#### 3.1 Настройка политики доверия {#31-configure-the-trust-policy}

1. Войдите в [консоль AWS IAM](https://us-east-1.console.aws.amazon.com/iamv2/home#/home), выберите `Access management > Roles` на левой панели навигации, найдите `Assumed Target Role` (то есть `bucket_role`) и нажмите на имя роли, чтобы открыть страницу сведений.
2. Перейдите на вкладку `Trust relationships` и нажмите `Edit trust policy`. На странице редактирования введите следующий JSON, замените `<ec2_iam_role_arn>` на ARN роли, связанной с экземпляром EC2, затем нажмите `Update policy`.

![](/images/integrations/target_role_trust_policy.png)

**Примечание:** Поле `ExternalId` в `Condition` необязательно. Оно используется для различения случаев, когда несколько исходных пользователей принимают одну и ту же роль. Если `ExternalId` задан, передайте это значение и в соответствующем операторе SQL Doris. Подробнее о `ExternalId` см. в [официальной документации AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html).

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "<ec2_iam_role_arn>"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "1001"
                }
            }
        }
    ]
}
```

#### 3.2 Настройка политики разрешений {#32-configure-the-permission-policy}

На странице сведений о роли в разделе `Permissions` нажмите `Add permissions` и выберите `Create inline policy`. На этапе `Specify permissions` перейдите на вкладку JSON, введите приведённую ниже политику и нажмите `Review policy`, чтобы сохранить её.

![](/images/integrations/target_role_permission2.png)

**Примечание:**

- **Замените имя бакета и путь префикса своими значениями**
- **Не добавляйте лишние разделители "/"**

**Шаблон политики чтения** для бакета S3. Используйте его для функций Doris, которым достаточно чтения объектов и получения их списка в бакете, например S3 Load, TVF и External Catalog:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

**Шаблон политики записи** для бакета S3. Используйте его для функций Doris, которым требуется чтение из бакета и запись в него, например Export, Storage Vault, Resource и Repository:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>"
        }
    ]
}
```

### Шаг 4: использование `role_arn` и `external_id` в SQL Doris {#step-4-use-role_arn-and-external_id-in-doris-sql}

После выполнения предыдущих шагов у вас есть `role_arn` целевой учётной записи и, при необходимости, `external_id`. В SQL Doris ключевыми являются следующие два поля:

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- Optional parameter
```

**S3 Load**

```sql
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
```

**External Catalog**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  );
```

**Storage Vault**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- Optional parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```

**Repository**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

**Resource**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

---

## Аутентификация и авторизация с помощью IAM Role в кластерах EKS {#iam-role-authentication-and-authorization-in-eks-clusters}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Doris deployed on Amazon EKS / Kubernetes -->

Для Apache Doris, работающего в кластере Amazon EKS, Amazon EKS предоставляет два основных способа назначения разрешений AWS Identity and Access Management (IAM):

1. **IAM Roles for Service Accounts (IRSA)**
2. **EKS Pod Identity**

Оба способа требуют правильной настройки IAM Role, её политики доверия и политики IAM в кластере EKS. Подробные инструкции по настройке см. в официальной документации AWS [Предоставление разрешений AWS Identity and Access Management рабочим нагрузкам в кластерах Amazon Elastic Kubernetes Service](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam).

После завершения настройки на стороне EKS компоненты Doris FE/BE автоматически получают учётные данные через `AWSCredentialsProviderChain`. Явно указывать `access_key` / `secret_key` или `role_arn` в SQL не требуется.

---

## Аутентификация и авторизация с помощью Bucket Policy {#bucket-policy-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Restrict S3 access to a specific account / Load, Export, TVF -->

Если машинам с Doris назначена IAM Role, в сценариях Load, Export, TVF и аналогичных также можно использовать Amazon S3 Bucket Policy для защиты доступа к объектам в S3. Этот способ ограничивает доступ к бакету: обращаться к нему может только учётная запись, которой принадлежит машина EC2.

### Шаг 1: установка Bucket Policy для целевого бакета {#step-1-set-a-bucket-policy-on-the-target-bucket}

Замените `arn:aws:iam::111122223333:root` в приведённой ниже политике на ARN учётной записи или роли, привязанной к машине EC2:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

### Шаг 2: прямой доступ к S3 из SQL Doris (без AK/SK или ARN) {#step-2-access-s3-directly-in-doris-sql-no-aksk-or-arn-required}

После установки Bucket Policy указывать `access_key`, `secret_key` или `role_arn` в SQL не требуется. Компоненты Doris FE/BE автоматически получают учётные данные через `AWSCredentialsProviderChain`:

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

Дополнительные сведения: [Примеры Bucket Policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html)

---

## Рекомендации по выбору способа авторизации {#best-practices-for-authorization-methods}

| Способ авторизации        | Сценарий применения                                                                                  | Преимущества                                                                | Недостатки                                                       |
| :-------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| Авторизация AK/SK         | Локальные развёртывания с контролируемой безопасностью или Load/Export/Storage Vault в объектных хранилищах S3 вне AWS | Простая настройка. Работает с любым объектным хранилищем, совместимым с протоколом AWS S3 | Риск утечки ключей. Ключи необходимо менять вручную                  |
| Авторизация IAM Role      | Сценарии Load/Export/Storage Vault в публичном облаке AWS S3 с повышенными требованиями к безопасности             | Высокий уровень безопасности. Учётные данные AWS меняются автоматически. Разрешения управляются централизованно | Сложный процесс настройки Bucket Policy/Trust                   |
| Авторизация Bucket Policy | Сценарии Load/Export/Storage Vault в публичном облаке AWS S3 с небольшим числом бакетов                | Умеренная сложность настройки. Соблюдается принцип минимальных привилегий. Учётные данные AWS обнаруживаются автоматически | Разрешения распределены по политикам отдельных бакетов         |

---

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: AWS authorization debugging / Enabling SDK logs -->

### Вопрос: как включить журналы AWS SDK уровня DEBUG для BE и Recycler? {#q-how-do-i-enable-aws-sdk-debug-level-logs-for-be-and-recycler}

В `be.conf` и `doris_cloud.conf` задайте `aws_log_level=5` и перезапустите процесс, чтобы изменение вступило в силу.

Описание параметра `aws_log_level`:

| Параметр        | Описание                |
| :---------- | :------------------------- |
| Тип        | int32                      |
| Описание | Уровень журналирования AWS SDK          |
| Значение по умолчанию     | 2 (Error)                  |

Допустимые значения:

```text
Off   = 0
Fatal = 1
Error = 2
Warn  = 3
Info  = 4
Debug = 5
Trace = 6
```

### Вопрос: почему после включения журналов AWS SDK уровня DEBUG в be.log / recycler.log появляется сообщение `OpenSSL SSL_connect: Connection reset by peer`? {#q-after-enabling-aws-sdk-debug-logs-belog--recyclerlog-reports-openssl-ssl_connect-connection-reset-by-peer}

Пример ошибки:

```text
OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443
```

Проверьте конфигурацию сети AWS VPC и настройки портов межсетевого экрана на наличие проблем, препятствующих доступу к сервису STS в соответствующем регионе. Проверить доступность можно следующей командой:

```shell
telnet sts.<region>.amazonaws.com 443
```
