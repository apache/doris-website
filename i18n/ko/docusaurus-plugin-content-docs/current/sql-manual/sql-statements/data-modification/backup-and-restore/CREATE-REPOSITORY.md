---
{
    "title": "CREATE REPOSITORY",
    "language": "ko",
    "description": "이 문은 저장소를 생성하는 데 사용됩니다. 저장소는 백업 또는 복원에 사용됩니다."
}
---

## 설명 {#description}

이 문은 저장소를 생성하는 데 사용됩니다. 저장소는 백업 또는 복원에 사용됩니다.

## 구문 {#syntax}

```sql
CREATE [READ ONLY] REPOSITORY <repo_name>
    WITH [ S3 | HDFS ]
    ON LOCATION <repo_location>
    PROPERTIES (
              -- S3 or HDFS storage property
              <storage_property>
              [ , ... ]
    )
```

## 필수 매개변수 {#required-parameters}
**<repo_name>**
> 저장소의 고유한 이름입니다.

**<repo_location>**
> 저장소의 저장 경로입니다.

**<storage_property>**
> 저장소의 속성입니다. 저장 매체로 S3 또는 HDFS 중 무엇을 선택했는지에 따라 해당 매개변수를 지정해야 합니다.

**<storage_property>** 선택적 매개변수는 다음과 같으며, 실제 환경에 따라 매개변수를 추가할 수 있습니다.

| 매개변수               | 설명                            |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 서비스 엔드포인트                    |
| **s3.access_key**       | S3 액세스 키                          |
| **s3.secret_key**       | S3 비밀 키                          |
| **s3.region**           | S3 리전                              |
| **use_path_style**      | S3에 경로 기반 접근 방식을 사용할지 여부(MinIO에 적용) |
| **fs.defaultFS**        | Hadoop 기본 파일 시스템 URI        |
| **hadoop.username**     | Hadoop 사용자 이름                       |

**참고:&#x20;**

Doris는 AWS S3 저장소를 생성할 때 `AWS Assume Role`도 지원합니다. 자세한 내용은 [AWS 통합](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)을 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한               | 객체                         | 참고                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | 전체 클러스터 관리 권한 | root 또는 슈퍼유저만 저장소를 생성할 수 있습니다  |


## 사용 시 참고 사항 {#usage-notes}
- 읽기 전용 저장소에서는 복원 작업만 수행할 수 있습니다. 읽기 전용이 아닌 저장소에서는 백업과 복원 작업을 모두 수행할 수 있습니다.
- 속성(PROPERTIES)은 예제와 같이 S3 또는 HDFS 중 무엇을 사용하는지에 따라 달라집니다.
- S3를 사용하는 경우 ON LOCATION 뒤에는 S3 Bucket Name을 지정해야 합니다.
- 데이터 마이그레이션을 수행할 때는 대상 클러스터에서 원본 클러스터가 백업한 데이터 스냅샷을 볼 수 있도록 원본 클러스터와 대상 클러스터에 동일한 저장소를 생성해야 합니다.
- 모든 사용자는 [SHOW REPOSITORIES](./SHOW-REPOSITORIES) 명령을 사용하여 생성된 저장소를 확인할 수 있습니다.


## 예제 {#examples}

s3_repo라는 이름의 저장소를 생성합니다.

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://s3-repo"
PROPERTIES
(
    "s3.endpoint" = "http://s3-REGION.amazonaws.com",
    "s3.region" = "s3-REGION",
    "s3.access_key" = "AWS_ACCESS_KEY",
    "s3.secret_key"="AWS_SECRET_KEY"
);
```
**참고:&#x20;**

Doris는 AWS S3 저장소를 생성할 때 `AWS Assume Role`도 지원합니다. 자세한 내용은 [AWS 통합](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)을 참조하세요.

hdfs_repo라는 이름의 저장소를 생성합니다.

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
PROPERTIES
(
    "fs.defaultFS"="hdfs://hadoop-name-node:54310",
    "hadoop.username"="user"
);
```

S3 프로토콜을 통해 minio 스토리지에 직접 연결하는 minio_repo라는 이름의 저장소를 생성합니다.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "http://minio.com",
    "s3.access_key" = "MINIO_USER",
    "s3.secret_key"="MINIO_PASSWORD",
    "s3.region" = "REGION",
    "use_path_style" = "true"
);
```

임시 보안 자격 증명을 사용하여 minio_repo라는 이름의 저장소를 생성합니다.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
( 
    "s3.endpoint" = "AWS_ENDPOINT",
    "s3.access_key" = "AWS_TEMP_ACCESS_KEY",
    "s3.secret_key" = "AWS_TEMP_SECRET_KEY",
    "s3.session_token" = "AWS_TEMP_TOKEN",
    "s3.region" = "AWS_REGION"
)
```

Tencent COS를 사용하여 저장소를 생성합니다.

```sql
CREATE REPOSITORY `cos_repo`
WITH S3
ON LOCATION "s3://backet1/"
PROPERTIES
(
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing"
);
```
