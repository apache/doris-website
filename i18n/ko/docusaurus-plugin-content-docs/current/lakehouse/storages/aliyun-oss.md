---
{
    "title": "Aliyun OSS",
    "language": "ko",
    "description": "이 문서는 다음과 같은 상황에서 Alibaba Cloud OSS에 액세스하는 데 필요한 매개변수를 설명합니다:"
}
---

이 문서는 다음과 같은 상황에서 Alibaba Cloud OSS에 액세스하는 데 필요한 매개변수를 설명합니다:

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성

## OSS {#oss}

Doris는 S3 Client를 사용하여 S3 호환 프로토콜로 Alibaba Cloud OSS에 액세스합니다.

### 매개변수 개요 {#parameter-overview}

| 속성 이름                  | 기존 이름                  | 설명                                                  | 기본값 |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | OSS 엔드포인트로, Alibaba Cloud OSS의 액세스 엔드포인트를 지정합니다. OSS와 OSS HDFS는 엔드포인트가 서로 다릅니다. | 없음          |
| oss.access_key                 | s3.access_key                | 인증에 사용하는 OSS Access Key                            | 없음          |
| oss.secret_key                 | s3.secret_key                | Access Key와 함께 사용하는 OSS Secret Key               | 없음          |
| oss.region                     | s3.region                    | OSS 리전으로, Alibaba Cloud OSS의 리전을 지정합니다.       | 없음          |
| oss.use_path_style             | s3.use_path_style            | 경로 스타일 액세스를 사용할지 여부입니다. MinIO 및 기타 AWS 이외의 S3 서비스와의 호환성을 위해 true로 설정하는 것을 권장합니다. | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | 최대 연결 수로, OSS 서비스와 맺는 연결의 최대 수를 지정합니다. | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| 요청 제한 시간(밀리초)으로, OSS 서비스에 연결할 때의 요청 제한 시간을 지정합니다. | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | 연결 제한 시간(밀리초)으로, OSS 서비스와 연결을 맺을 때의 제한 시간을 지정합니다. | 1000          |

> 3.1 이전 버전에서는 기존 이름을 사용하세요.

## 구성 예시 {#example-configuration}

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

3.1 이전 버전:

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### 사용 권장 사항 {#usage-recommendations}

* Alibaba Cloud OSS와의 일관성과 명확성을 위해 구성 매개변수에 `oss.` 접두사를 사용하는 것을 권장합니다.
* 3.1 이전 버전에서는 기존 이름인 `s3.`을 접두사로 사용하세요.
* `oss.region`을 구성하면 액세스 정확도와 성능을 높일 수 있으므로 설정하는 것을 권장합니다.
* 연결이 차단되지 않도록 동시성 요구 사항에 따라 연결 풀 매개변수를 조정할 수 있습니다.

## OSS-HDFS {#oss-hdfs}

OSS-HDFS 서비스(JindoFS 서비스)는 Alibaba Cloud 네이티브 데이터 레이크 스토리지 기능입니다. 통합 메타데이터 관리 기능을 기반으로 HDFS 파일 시스템 인터페이스와 호환되며, 빅데이터 및 AI 분야의 데이터 레이크 컴퓨팅 시나리오를 지원합니다.

OSS-HDFS에 저장된 데이터에 액세스하는 방식은 OSS 서비스에 직접 액세스하는 방식과 약간 다릅니다. 자세한 내용은 이 문서를 참조하세요.

### 매개변수 개요 {#parameter-overview-1}

| 속성 이름                  | 기존 이름    | 설명                                                 | 기본값 | 필수 여부 |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFS 서비스 엔드포인트입니다. 예: `cn-hangzhou.oss-dls.aliyuncs.com`. | 없음          | 예      |
| oss.hdfs.access_key            | oss.access_key | 인증에 사용하는 OSS Access Key                           | 없음          | 예      |
| oss.hdfs.secret_key            | oss.secret_key | Access Key와 함께 사용하는 OSS Secret Key              | 없음          | 예      |
| oss.hdfs.region                | oss.region     | OSS 버킷이 위치한 리전의 ID입니다. 예: `cn-beijing`. | 없음          | 예      |
| oss.hdfs.fs.defaultFS          |                | 3.1 버전에서 지원됩니다. OSS의 파일 시스템 액세스 경로를 지정합니다. 예: `oss://my-bucket/`. | 없음          | 아니요       |
| oss.hdfs.hadoop.config.resources |                | 3.1 버전에서 지원됩니다. OSS 파일 시스템 구성이 포함된 경로를 지정합니다. 상대 경로를 사용해야 합니다. 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 `/plugins/hadoop_conf/`입니다(fe.conf/be.conf의 hadoop_config_dir을 수정하여 변경할 수 있습니다). 모든 FE 및 BE 노드에 동일한 상대 경로를 구성해야 합니다. 예: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`. | 없음          | 아니요       |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | 3.1 버전에서 지원됩니다. OSS-HDFS 기능의 활성화를 명시적으로 선언합니다. true로 설정해야 합니다. | 없음          | 아니요       |

> 3.1 이전 버전에서는 기존 이름을 사용하세요.

### 엔드포인트 구성 {#endpoint-configuration}

`oss.hdfs.endpoint`: OSS-HDFS 서비스 엔드포인트를 지정하는 데 사용합니다.

엔드포인트는 Alibaba Cloud OSS에 액세스하기 위한 진입 주소이며, 형식은 `<region>.oss-dls.aliyuncs.com`입니다. 예: `cn-hangzhou.oss-dls.aliyuncs.com`.

엔드포인트가 Alibaba Cloud OSS 엔드포인트 형식을 따르도록 엄격한 형식 검증을 수행합니다.

하위 호환성을 위해 엔드포인트 구성에 https:// 또는 http:// 접두사를 포함할 수 있습니다. 시스템은 형식 검증 시 프로토콜 부분을 자동으로 파싱하여 무시합니다.

기존 이름을 사용하는 경우, 시스템은 `endpoint`에 `oss-dls`가 포함되어 있는지를 기준으로 OSS-HDFS 서비스 여부를 판단합니다.

4.1.5부터 `oss.hdfs.hadoop.config.resources`의 XML 경로에는 `..` 상위 디렉터리 경로 요소가 포함되어서는 안 됩니다. 슬래시와 백슬래시 구분자를 모두 검사합니다. 일반적인 파일 경로를 사용하세요.

### 구성 파일 {#configuration-files}

> 3.1 버전에서 지원됩니다.

OSS-HDFS는 `oss.hdfs.hadoop.config.resources` 매개변수를 통해 HDFS 관련 구성 파일 디렉터리를 지정할 수 있습니다.

구성 파일 디렉터리에는 `hdfs-site.xml`과 `core-site.xml` 파일이 있어야 합니다. 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 `/plugins/hadoop_conf/`입니다. 모든 FE 및 BE 노드에 동일한 상대 경로를 구성해야 합니다.

구성 파일에 이 문서에서 앞서 설명한 매개변수가 포함되어 있으면, 사용자가 명시적으로 설정한 매개변수가 우선 적용됩니다. 구성 파일은 쉼표로 구분하여 여러 개 지정할 수 있습니다. 예: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

### 구성 예시 {#example-configuration-1}

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

3.1 이전 버전:

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
