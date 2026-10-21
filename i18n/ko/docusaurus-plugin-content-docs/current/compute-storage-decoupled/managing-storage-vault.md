---
{
    "title": "Storage Vault 관리: 생성, 구성 및 접근 제어",
    "sidebar_label": "Storage Vault 관리",
    "language": "ko",
    "description": "컴퓨팅-스토리지 분리 모드에서 Storage Vault를 생성, 조회, 수정하고, 테이블이나 데이터베이스의 저장 위치를 지정하며, 사용자 접근 권한을 관리하는 방법을 설명합니다.",
    "keywords": ["Storage Vault", "컴퓨팅-스토리지 분리", "객체 스토리지", "HDFS", "S3", "스토리지 관리", "Doris"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage configuration and management for compute-storage decoupled clusters -->

Storage Vault는 Doris가 컴퓨팅-스토리지 분리 모드에서 사용하는 원격 공유 스토리지 추상화입니다. 하나 이상의 Storage Vault를 구성하고 테이블마다 서로 다른 Storage Vault에 데이터를 저장하여 스토리지를 유연하게 관리할 수 있습니다.

## Storage Vault 생성 {#create-a-storage-vault}

<!-- Knowledge type: Operational steps -->

**구문**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value", ...)
```

`<vault_name>`은 사용자가 정의하는 Storage Vault의 이름으로, 이후 작업에서 고유 식별자로 사용됩니다.

### HDFS Storage Vault 생성 {#create-an-hdfs-storage-vault}

<!-- Applicable scenarios: Using HDFS as shared storage -->

HDFS 기반 Storage Vault를 생성하기 전에 모든 노드(FE, BE 노드 및 Meta Service 포함)가 대상 HDFS에 접근할 수 있는지 확인해야 합니다. 이를 위해 Kerberos 인증 설정과 연결 확인을 완료해야 합니다. 각 노드에서 Hadoop Client를 사용하여 테스트할 수 있습니다.

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type"                          = "hdfs",                      -- required
    "fs.defaultFS"                  = "hdfs://127.0.0.1:8020",     -- required
    "path_prefix"                   = "big/data",                  -- optional, typically filled with the business name
    "hadoop.username"               = "user",                      -- optional
    "hadoop.security.authentication" = "kerberos",                 -- optional
    "hadoop.kerberos.principal"     = "hadoop/127.0.0.1@XXX",     -- optional
    "hadoop.kerberos.keytab"        = "/etc/emr.keytab"            -- optional
);
```

### S3 Storage Vault 생성 {#create-an-s3-storage-vault}

<!-- Applicable scenarios: Using object storage (OSS/S3/COS, etc.) as shared storage -->

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type"           = "S3",                                -- required
    "s3.endpoint"    = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.region"      = "cn-beijing",                        -- required
    "s3.bucket"      = "bucket",                            -- required
    "s3.root.path"   = "big/data/prefix",                   -- required
    "s3.access_key"  = "ak",                                -- required
    "s3.secret_key"  = "sk",                                -- required
    "provider"       = "OSS",                               -- required
    "use_path_style" = "false"                              -- optional
);
```

:::caution 필수 권한
객체 스토리지 경로에는 다음 접근 권한이 있어야 합니다: `head`, `get`, `list`, `put`, `multipartUpload`, `delete`.
:::

다른 클라우드 제공업체의 예제와 매개변수 설명은 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)를 참조하세요.

## Storage Vault 조회 {#view-storage-vaults}

<!-- Knowledge type: Operational steps -->

**구문**

```sql
SHOW STORAGE VAULTS
```

결과에는 4개의 열이 포함됩니다:

| 열 | 설명 |
|--------|-------------|
| Storage Vault 이름 | 사용자가 정의한 Vault 식별자 |
| Storage Vault ID | 시스템에서 할당한 고유 ID |
| 속성 | Vault의 구성 속성 |
| IsDefault | 기본 Storage Vault인지 여부 |

## 기본 Storage Vault 설정 {#set-the-default-storage-vault}

<!-- Knowledge type: Operational steps -->

**구문**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

설정 후 테이블을 생성할 때 Storage Vault를 명시적으로 지정하지 않으면 이 기본 Vault가 자동으로 사용됩니다.

## 테이블 생성 시 Storage Vault 지정 {#specify-a-storage-vault-when-creating-a-table}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Binding a storage location to a specific table -->

`storage_vault_name`을 `PROPERTIES` 절에 지정하여 `CREATE TABLE`을 실행합니다. 그러면 테이블 데이터가 해당 Storage Vault에 저장됩니다.

:::warning 참고
테이블이 성공적으로 생성되면 해당 테이블의 `storage_vault`는 **수정할 수 없습니다**. 생성 후 Storage Vault 변경은 지원되지 않습니다.
:::

**예제**

```sql
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey int(11)      NOT NULL COMMENT "",
    s_name    varchar(26)  NOT NULL COMMENT "",
    s_address varchar(26)  NOT NULL COMMENT "",
    s_city    varchar(11)  NOT NULL COMMENT "",
    s_nation  varchar(16)  NOT NULL COMMENT "",
    s_region  varchar(13)  NOT NULL COMMENT "",
    s_phone   varchar(16)  NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
    "replication_num"    = "1",
    "storage_vault_name" = "hdfs_demo_vault"
);
```

## 데이터베이스 생성 시 Storage Vault 지정 {#specify-a-storage-vault-when-creating-a-database}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Setting a default storage location for a database -->

`storage_vault_name`을 `PROPERTIES` 절에 지정하여 `CREATE DATABASE`를 실행합니다. 해당 데이터베이스에서 새 테이블을 생성할 때 Storage Vault를 개별적으로 지정하지 않으면 데이터베이스의 Storage Vault 설정을 상속합니다.

**예제**

```sql
CREATE DATABASE IF NOT EXISTS `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

데이터베이스의 `storage_vault_name`은 [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md)를 통해 변경할 수 있습니다. **변경 사항은 새로 생성하는 테이블에만 적용되며 기존 테이블에는 영향을 주지 않습니다.**

:::info 버전 참고 사항 및 우선순위 규칙

- 데이터베이스 생성 시 Storage Vault를 지정하는 기능은 **버전 3.0.5**부터 지원됩니다.
- 테이블 생성 시 Storage Vault 선택 우선순위는 높은 순서대로 **테이블** > **데이터베이스** > **기본 Storage Vault**입니다.
- Storage Vault의 `VAULT_NAME`을 수정하면 데이터베이스 수준에서 설정한 Vault가 유효하지 않게 되어 오류가 발생할 수 있습니다. 이 경우 데이터베이스에 유효한 `storage_vault_name`을 다시 설정해야 합니다.

:::

## Storage Vault 수정 {#modify-a-storage-vault}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Updating storage credentials or renaming a Vault -->

`ALTER STORAGE VAULT`는 Storage Vault의 수정 가능한 속성을 업데이트합니다.

### 수정 가능한 속성 {#modifiable-properties}

**S3 Storage Vault**에서 수정할 수 있는 속성:

| 속성 | 설명 |
|----------|-------------|
| `VAULT_NAME` | Vault 이름(이름 변경) |
| `s3.access_key` | 액세스 키 ID |
| `s3.secret_key` | 액세스 키 시크릿 |
| `use_path_style` | path-style 접근 사용 여부 |

**HDFS Storage Vault**에서 수정할 수 **없는** 속성:

| 속성 | 이유 |
|----------|--------|
| `path_prefix` | 수정하면 기존 데이터 경로에 불일치가 발생함 |
| `fs.defaultFS` | 수정하면 이미 기록된 데이터에 접근할 수 없게 됨 |

자세한 속성 설명은 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)를 참조하세요.

### 예제 {#examples}

S3 Storage Vault 수정:

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type"           = "S3",
    "VAULT_NAME"     = "new_s3_vault",
    "s3.access_key"  = "new_ak",
    "s3.secret_key"  = "new_sk"
);
```

HDFS Storage Vault 수정:

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type"             = "hdfs",
    "VAULT_NAME"       = "new_hdfs_vault",
    "hadoop.username"  = "hdfs"
);
```

## Storage Vault 삭제 {#delete-a-storage-vault}

현재 Storage Vault 삭제는 지원되지 않습니다.

## Storage Vault 접근 제어 {#storage-vault-access-control}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage access control in multi-user environments -->

관리자는 지정된 MySQL 사용자 또는 역할에 Storage Vault 사용 권한을 부여하여, 테이블 생성 시 Vault를 참조하거나 Vault 정보를 조회할 수 있는 사용자를 제어할 수 있습니다.

Storage Vault에 대한 `USAGE_PRIV` 권한이 있는 사용자 또는 역할은 다음 작업을 수행할 수 있습니다:

- `SHOW STORAGE VAULTS`를 통해 Storage Vault 정보 조회
- 테이블 생성 시 `PROPERTIES`에 Storage Vault 지정

### 권한 부여 {#grant-permissions}

**구문**

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

**예제**

```sql
GRANT USAGE_PRIV ON STORAGE VAULT my_storage_vault TO USER user1;
```

### 권한 회수 {#revoke-permissions}

**구문**

```sql
REVOKE
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

**예제**

```sql
REVOKE USAGE_PRIV ON STORAGE VAULT my_storage_vault FROM USER user1;
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine operations and troubleshooting -->

### Q1: 특정 Storage Vault를 참조하는 테이블은 어떻게 확인하나요? {#q1-how-do-i-find-out-which-tables-reference-a-specific-storage-vault}

**1단계**: `SHOW STORAGE VAULTS`를 실행하여 대상 Storage Vault의 `storage_vault_id`를 확인합니다.

**2단계**: 다음 SQL을 실행하여 해당 Vault를 참조하는 테이블을 쿼리합니다. `PROPERTY_VALUE=3`을 실제 `storage_vault_id` 값으로 바꾸세요:

```sql
SELECT *
FROM information_schema.table_properties
WHERE PROPERTY_NAME = "storage_vault_id"
  AND PROPERTY_VALUE = 3;
```

쿼리 결과 예시:

```
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

### Q2: 테이블을 생성한 후 Storage Vault를 변경할 수 있나요? {#q2-can-i-change-the-storage-vault-after-a-table-is-created}

변경할 수 없습니다. 테이블이 성공적으로 생성되면 해당 테이블의 `storage_vault` 속성은 수정할 수 없습니다. 다른 Storage Vault를 사용하려면 테이블을 다시 생성하고 데이터를 다시 적재해야 합니다.

### Q3: Storage Vault의 이름을 변경하면 기존에 해당 Vault를 참조하던 데이터베이스에 영향이 있나요? {#q3-after-renaming-a-storage-vault-are-databases-that-previously-referenced-that-vault-affected}

네. Storage Vault의 `VAULT_NAME`을 수정하면 데이터베이스 수준의 `storage_vault_name` 설정이 유효하지 않게 되어 해당 데이터베이스에서 새 테이블을 생성할 때 오류가 발생할 수 있습니다. [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md)를 사용하여 데이터베이스에 유효한 `storage_vault_name`을 다시 지정해야 합니다.
