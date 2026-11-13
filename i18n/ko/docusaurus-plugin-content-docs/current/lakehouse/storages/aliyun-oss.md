---
{
    "title": "Aliyun OSS",
    "language": "ko",
    "description": "이 문서는 다음 상황에 적용되는 Alibaba Cloud OSS 액세스에 필요한 매개변수를 설명합니다."
}
---

이 문서는 다음 상황에 적용되는 Alibaba Cloud OSS 액세스에 필요한 매개변수를 설명합니다.

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

## OSS 액세스를 설정하는 경우 {#when-to-configure-oss-access}

이 속성은 OSS의 파일에 액세스할 때 사용합니다. 파일을 읽거나 쓰는 작업에 설정하세요.

| 상황 | 액세스 설정 위치 | 예시 |
| --- | --- | --- |
| CSV, Parquet 또는 ORC 파일을 직접 쿼리 | `S3(...)` 테이블 값 함수 | 아래 쿼리 예시 |
| OSS 파일을 기존 Doris 테이블로 가져오기 | `S3(...)`에 설정해 `INSERT INTO ... SELECT`에서 사용하거나, Broker Load의 `WITH S3` 절에 설정 | [OSS 데이터 가져오기](../../data-operate/import/data-source/aliyun-oss.md) |
| 데이터가 OSS에 저장된 Hive 테이블을 쿼리 | `CREATE CATALOG` 실행 시 Catalog 속성에 설정 | [Hive Catalog](../catalogs/hive-catalog) |
| 쿼리 결과를 OSS로 내보내기 | 내보내기 명령의 속성에 설정 | [SELECT INTO OUTFILE](../../data-operate/export/outfile.md) |

예를 들어 헤더 행이 없는 UTF-8 파일 `users.csv`를 OSS 버킷에 업로드합니다.

```text
1,Alice
2,Bob
```

Doris FE 및 BE 노드에서 OSS 엔드포인트에 연결할 수 있고, 제공한 자격 증명에 해당 객체를 읽을 권한이 있는지 확인하세요. 아래의 버킷, 객체 경로, 자격 증명을 실제 값으로 바꾸세요. 이 쿼리는 파일을 직접 읽으므로 Doris 테이블을 만들 필요가 없습니다. S3 호환 `s3.*` 속성 이름을 사용합니다.

```sql
SELECT id, name
FROM S3(
    "uri" = "s3://your-bucket/users.csv",
    "format" = "csv",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "cn-beijing",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key" = "<your-secret-key>",
    "column_separator" = ",",
    "csv_schema" = "id:int;name:string"
)
ORDER BY id;
```

위 파일의 예상 결과는 다음과 같습니다.

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
|    2 | Bob   |
+------+-------+
```

데이터를 Doris에 저장하려면 대상 테이블을 만들고 위에 링크된 OSS 데이터 가져오기 가이드에 따라 `INSERT INTO ... SELECT`를 사용하세요. 다른 작업에서는 해당 Catalog, 데이터 적재 또는 내보내기 구문에 연결 속성을 설정하세요.

## OSS {#oss}

Doris는 S3 Client를 사용하여 S3 호환 프로토콜로 Alibaba Cloud OSS에 액세스합니다.

### 매개변수 개요 {#parameter-overview}

| 속성 이름 | 이전 이름 | 설명 | 기본값 |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | Alibaba Cloud OSS에 액세스할 엔드포인트를 지정합니다. OSS와 OSS HDFS의 엔드포인트는 서로 다릅니다. | 없음          |
| oss.access_key                 | s3.access_key                | 인증에 사용하는 OSS Access Key | 없음          |
| oss.secret_key                 | s3.secret_key                | Access Key와 함께 사용하는 OSS Secret Key | 없음          |
| oss.region                     | s3.region                    | Alibaba Cloud OSS의 리전을 지정합니다. | 없음          |
| oss.use_path_style             | s3.use_path_style            | 경로 스타일 액세스 사용 여부입니다. MinIO 및 기타 AWS 이외의 S3 서비스와의 호환성을 위해 true로 설정하는 것이 좋습니다. | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | OSS 서비스와 설정할 수 있는 최대 연결 수입니다. | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| OSS 서비스에 연결할 때의 요청 제한 시간(밀리초)입니다. | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | OSS 서비스와 연결을 설정할 때의 제한 시간(밀리초)입니다. | 1000          |

> 3.1 이전 버전에서는 이전 이름을 사용하세요.

## 설정 예시 {#example-configuration}

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

3.1 이전 버전에서는 다음과 같이 설정합니다.

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### 사용 권장 사항 {#usage-recommendations}

* Alibaba Cloud OSS 관련 설정임을 명확히 하고 일관성을 유지하려면 설정 매개변수에 `oss.` 접두사를 사용하는 것이 좋습니다.
* 3.1 이전 버전에서는 이전 이름인 `s3.` 접두사를 사용하세요.
* 액세스 정확도와 성능을 높일 수 있으므로 `oss.region`을 설정하는 것이 좋습니다.
* 연결이 막히지 않도록 동시성 요구 사항에 따라 연결 풀 매개변수를 조정할 수 있습니다.

## OSS-HDFS {#oss-hdfs}

OSS-HDFS 서비스(JindoFS 서비스)는 Alibaba Cloud의 클라우드 네이티브 데이터 레이크 스토리지 기능입니다. 통합 메타데이터 관리 기능을 기반으로 HDFS 파일 시스템 인터페이스와 호환되며, 빅데이터 및 AI 분야의 데이터 레이크 컴퓨팅 시나리오에 적합합니다.

OSS-HDFS에 저장된 데이터에 액세스하는 방법은 OSS 서비스에 직접 액세스하는 방법과 약간 다릅니다. 자세한 내용은 이 문서를 참조하세요.

### 매개변수 개요 {#parameter-overview-1}

| 속성 이름 | 이전 이름 | 설명 | 기본값 | 필수 여부 |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFS 서비스 엔드포인트입니다. 예: `cn-hangzhou.oss-dls.aliyuncs.com` | 없음          | 예      |
| oss.hdfs.access_key            | oss.access_key | 인증에 사용하는 OSS Access Key | 없음          | 예      |
| oss.hdfs.secret_key            | oss.secret_key | Access Key와 함께 사용하는 OSS Secret Key | 없음          | 예      |
| oss.hdfs.region                | oss.region     | OSS 버킷이 위치한 리전 ID입니다. 예: `cn-beijing` | 없음          | 예      |
| oss.hdfs.fs.defaultFS          |                | 3.1 버전부터 지원합니다. OSS의 파일 시스템 액세스 경로를 지정합니다. 예: `oss://my-bucket/` | 없음          | 아니요  |
| oss.hdfs.hadoop.config.resources |                | 3.1 버전부터 지원합니다. OSS 파일 시스템 설정이 포함된 경로를 지정합니다. 상대 경로를 사용해야 합니다. 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 `/plugins/hadoop_conf/`이며, fe.conf/be.conf의 hadoop_config_dir을 수정하여 변경할 수 있습니다. 모든 FE 및 BE 노드에 동일한 상대 경로를 설정해야 합니다. 예: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` | 없음          | 아니요  |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | 3.1 버전부터 지원합니다. OSS-HDFS 기능 활성화를 명시적으로 선언하며 true로 설정해야 합니다. | 없음          | 아니요  |

> 3.1 이전 버전에서는 이전 이름을 사용하세요.

### 엔드포인트 설정 {#endpoint-configuration}

`oss.hdfs.endpoint`: OSS-HDFS 서비스 엔드포인트를 지정합니다.

엔드포인트는 Alibaba Cloud OSS에 액세스하기 위한 진입 주소로, 형식은 `<region>.oss-dls.aliyuncs.com`입니다. 예: `cn-hangzhou.oss-dls.aliyuncs.com`

엔드포인트가 Alibaba Cloud OSS 엔드포인트 형식에 맞는지 엄격하게 검증합니다.

이전 버전과의 호환성을 위해 엔드포인트 설정에 https:// 또는 http:// 접두사를 포함할 수 있습니다. 시스템은 형식 검증 시 프로토콜 부분을 자동으로 파싱하고 무시합니다.

이전 이름을 사용하는 경우 시스템은 `endpoint`에 `oss-dls`가 포함되어 있는지에 따라 OSS-HDFS 서비스 여부를 판단합니다.

4.1.5 버전부터 `oss.hdfs.hadoop.config.resources`의 XML 경로에 상위 디렉터리를 가리키는 `..` 경로 구성 요소를 포함할 수 없습니다. 슬래시와 역슬래시 구분자 모두 검사합니다. 일반적인 파일 경로를 사용하세요.

### 설정 파일 {#configuration-files}

> 3.1 버전부터 지원

OSS-HDFS에서는 `oss.hdfs.hadoop.config.resources` 매개변수를 통해 HDFS 관련 설정 파일의 디렉터리를 지정할 수 있습니다.

설정 파일 디렉터리에는 `hdfs-site.xml` 및 `core-site.xml` 파일이 있어야 합니다. 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 `/plugins/hadoop_conf/`입니다. 모든 FE 및 BE 노드에 동일한 상대 경로를 설정해야 합니다.

설정 파일에 이 문서에서 앞서 설명한 매개변수가 포함되어 있다면 사용자가 명시적으로 설정한 매개변수가 우선합니다. 설정 파일은 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`과 같이 쉼표로 구분하여 여러 파일을 지정할 수 있습니다.

### 설정 예시 {#example-configuration-1}

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

3.1 이전 버전에서는 다음과 같이 설정합니다.

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
