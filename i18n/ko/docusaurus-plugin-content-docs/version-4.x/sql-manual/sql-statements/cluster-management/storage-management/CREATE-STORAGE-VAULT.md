---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "이 명령은 스토리지 볼트를 생성하는 데 사용됩니다. 이 문서에서는 Doris에서 자체 관리형 스토리지 볼트를 생성하는 구문을 설명합니다."
}
---

## 설명 {#description}

이 명령은 스토리지 볼트를 생성하는 데 사용됩니다. 이 문서에서는 Doris에서 자체 관리형 스토리지 볼트를 생성하는 구문을 설명합니다.


## 구문 {#syntax}

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```


## 필수 매개변수 {#required-parameters}

| 매개변수     | 설명                     |
|-------|-----------------------|
| `<vault_name>` | 스토리지 볼트의 이름입니다. 새로 생성할 스토리지 볼트의 고유 식별자입니다. |

## 선택적 매개변수 {#optional-parameters}
| 매개변수   | 설명                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | 지정한 스토리지 볼트가 이미 존재하면 생성 작업을 실행하지 않고 오류도 발생시키지 않습니다. 이를 통해 동일한 스토리지 볼트가 중복으로 생성되는 것을 방지합니다. |
| `<properties>`    | 스토리지 볼트의 특정 속성을 설정하거나 업데이트하는 데 사용하는 키-값 쌍의 집합입니다. 각 속성은 키(<key>)와 값(<value>)으로 구성되며, 등호(=)로 구분합니다. 여러 키-값 쌍은 쉼표(,)로 구분합니다. |

:::note
`type` 속성에는 `"S3"` 또는 `"hdfs"` 두 가지 값만 지정할 수 있으며, 대소문자를 구분하지 않습니다. Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, Huawei Cloud OBS, Baidu Cloud BOS, MinIO, Azure Blob Storage, Google Cloud Storage 등 모든 객체 스토리지 백엔드는 `"type" = "S3"`를 사용합니다. Doris가 S3 호환 API를 통해 이러한 백엔드에 접근하기 때문입니다. 실제 사용할 클라우드는 별도의 `provider` 속성(`COS`, `OSS`, `S3`, `OBS`, `BOS`, `AZURE` 또는 `GCP`)으로 선택합니다. `s3.access_key` / `s3.secret_key` 속성 이름도 같은 명명 규칙을 따르며 AWS S3에만 해당하는 것은 아닙니다.
:::

### S3 볼트 {#s3-vault}

| 매개변수              | 필수 여부 | 설명                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | 필수   | 객체 스토리지의 엔드포인트입니다. Azure Blob Storage의 엔드포인트는 blob.core.windows.net으로 고정되어 있습니다. |
| `s3.region`      | 필수   | 스토리지 버킷의 리전입니다. (GCP 또는 AZURE를 사용하는 경우에는 필수가 아닙니다.) |
| `s3.root.path`   | 필수   | 데이터를 저장할 경로입니다. |
| `s3.bucket`      | 필수   | 객체 스토리지 계정의 버킷입니다. (Azure에서는 StorageAccount에 해당합니다.) |
| `s3.access_key`  | 필수   | 객체 스토리지 계정의 액세스 키입니다. (Azure에서는 AccountName에 해당합니다.) |
| `s3.secret_key`  | 필수   | 객체 스토리지 계정의 비밀 키입니다. (Azure에서는 AccountKey에 해당합니다.) |
| `provider`       | 필수   | 객체 스토리지 서비스를 제공하는 클라우드 공급자입니다. 지원되는 값은 `COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP`입니다. |
| `use_path_style` | 선택   | `path-style URL`(프라이빗 배포 환경용) 또는 `virtual-hosted-style URL`(퍼블릭 클라우드 환경에 권장)을 사용합니다. 기본값은 true(path-style)입니다.                                                                                   |

**참고:&#x20;**

1. `s3.endpoint`에 `http://` 또는 `https://` 접두사를 지정하지 않으면 기본적으로 `http`를 사용합니다. 접두사를 명시적으로 지정하면 해당 접두사가 적용됩니다.

2. Doris는 S3 볼트에서 `AWS Assume Role`도 지원합니다(현재는 AWS S3만 지원). 자세한 내용은 [AWS 통합](../../../../lakehouse/storages/s3.md)을 참조하세요.

### HDFS 볼트 {#hdfs-vault}

| 매개변수                               | 필수 여부 | 설명                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |필수| 사용할 기본 파일 시스템을 지정하는 Hadoop 설정 속성입니다.                             |
| `path_prefix`                    |선택| 데이터를 저장할 접두 경로입니다. 지정하지 않으면 사용자 계정의 기본 경로를 사용합니다.                   |
| `hadoop.username`                |선택| 파일 시스템에 접근할 사용자를 지정하는 Hadoop 설정 속성입니다. 지정하지 않으면 Hadoop 프로세스를 시작한 사용자를 사용합니다. |
| `hadoop.security.authentication` |선택| Hadoop의 인증 방식입니다. Kerberos를 사용하려면 kerberos를 지정하면 됩니다.      |
| `hadoop.kerberos.principal`      |선택| Kerberos principal의 경로입니다.      |
| `hadoop.kerberos.keytab`         |선택| Kerberos keytab의 경로입니다.     |

## 예제 {#examples}

### 1. HDFS 스토리지 볼트 생성. {#1-create-a-hdfs-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type" = "hdfs",                                     -- required
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
    "path_prefix" = "big/data",                          -- optional,  generally fill in according to the business name
    "hadoop.username" = "user"                           -- optional
    "hadoop.security.authentication" = "kerberos"        -- optional
    "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
    "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
);
```

### 2. OSS 스토리지 볼트 생성 {#2-create-oss-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS oss_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your OSS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your OSS secret key
    "s3.region" = "cn-beijing",                          -- required
    "s3.root.path" = "oss_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your OSS bucket name
    "provider" = "OSS",                                  -- required
    "use_path_style" = "false"                           -- optional,  OSS recommended to set false
);
```

### 3. COS 스토리지 볼트 생성 {#3-create-cos-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS cos_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "cos.ap-guangzhou.myqcloud.com",     -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your COS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your COS secret key
    "s3.region" = "ap-guangzhou",                        -- required
    "s3.root.path" = "cos_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your COS bucket name
    "provider" = "COS",                                  -- required
    "use_path_style" = "false"                           -- optional,  COS recommended to set false
);
```

### 4. OBS 스토리지 볼트 생성 {#4-create-obs-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS obs_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",  -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your OBS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your OBS secret key
    "s3.region" = "cn-north-4",                          -- required
    "s3.root.path" = "obs_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your OBS bucket name
    "provider" = "OBS",                                  -- required
    "use_path_style" = "false"                           -- optional,  OBS recommended to set false
);
```

### 5. BOS 스토리지 볼트 생성 {#5-create-bos-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS bos_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "s3.bj.bcebos.com",                  -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your BOS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your BOS secret key
    "s3.region" = "bj",                                  -- required
    "s3.root.path" = "bos_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your BOS bucket name
    "provider" = "BOS",                                  -- required
    "use_path_style" = "false"                           -- optional,  BOS recommended to set false
);
```

### 6. S3 스토리지 볼트 생성 {#6-create-s3-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",                                      -- required
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",       -- required
    "s3.access_key" = "xxxxxx",                         -- required,  Your S3 access key
    "s3.secret_key" = "xxxxxx",                         -- required,  Your S3 secret key
    "s3.region" = "us-east-1",                          -- required
    "s3.root.path" = "s3_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                             -- required,  Your S3 bucket name
    "provider" = "S3",                                  -- required
    "use_path_style" = "false"                          -- optional,  S3 recommended to set false
);
```

**참고:&#x20;**

Doris는 S3 볼트에서 `AWS Assume Role`도 지원합니다(현재는 AWS S3만 지원). 자세한 내용은 [AWS 통합](../../../../lakehouse/storages/s3.md)을 참조하세요.


### 7. MinIO 스토리지 볼트 생성 {#7-create-minio-storage-vault}

```sql
 CREATE STORAGE VAULT IF NOT EXISTS minio_demo_vault
 PROPERTIES (
     "type" = "S3",                                     -- required
     "s3.endpoint" = "127.0.0.1:9000",                  -- required
     "s3.access_key" = "xxxxxx",                        -- required,  Your minio access key
     "s3.secret_key" = "xxxxxx",                        -- required,  Your minio secret key
     "s3.region" = "us-east-1",                         -- required
     "s3.root.path" = "minio_demo_vault_prefix",        -- required
     "s3.bucket" = "xxxxxx",                            -- required,  Your minio bucket name
     "provider" = "S3",                                 -- required
     "use_path_style" = "true"                          -- required,  minio recommended to set false
 );
```

### 8. AZURE 스토리지 볼트 생성 {#8-create-azure-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS azure_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "blob.core.windows.net",             -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your Azure AccountName
    "s3.secret_key" = "xxxxxx",                          -- required,  Your Azure AccountKey
    "s3.region" = "us-east-1",                           -- required
    "s3.root.path" = "azure_demo_vault_prefix",          -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your Azure StorageAccount
    "provider" = "AZURE"                                 -- required
);
```

### 9. GCP 스토리지 볼트 생성 {#9-create-gcp-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS gcp_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "storage.googleapis.com",            -- required
    "s3.access_key" = "xxxxxx",                          -- required
    "s3.secret_key" = "xxxxxx",                          -- required
    "s3.region" = "us-east-1",                           -- required
    "s3.root.path" = "gcp_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required
    "provider" = "GCP"                                   -- required
);
```

**참고**

[s3.access_key는 GCP HMAC 키의 Access ID에 해당합니다](https://cloud.google.com/storage/docs/authentication/hmackeys)

[s3.secret_key는 GCP HMAC 키의 Secret에 해당합니다](https://cloud.google.com/storage/docs/authentication/hmackeys)

## 키워드 {#keywords}

    CREATE, STORAGE VAULT
