---
{
    "title": "Aliyun DLF",
    "language": "ko",
    "description": "이 문서에서는 CREATE CATALOG 문을 사용하여 Alibaba Cloud Data Lake Formation (DLF) 메타데이터 서비스에 연결하고 접근하는 방법을 설명합니다."
}
---

이 문서에서는 `CREATE CATALOG` 문을 사용하여 Alibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) 메타데이터 서비스에 연결하고 접근하는 방법을 설명합니다.

## DLF 버전 안내 {#dlf-version-notes}

- DLF 1.0 버전에서 Doris는 DLF의 Hive Metastore 호환 인터페이스를 통해 DLF에 접근합니다. Paimon Catalog와 Hive Catalog를 지원합니다.
- DLF 2.5 이상 버전에서 Doris는 DLF의 Rest 인터페이스를 통해 DLF에 접근합니다. Paimon Catalog만 지원합니다.

### DLF 1.0 {#dlf-10}

| 매개변수 이름 | 이전 이름 | 설명 | 기본값 | 필수 여부 |
|----------------|-------------|-------------|---------------|----------|
| `dlf.endpoint` | - | DLF Endpoint. 참조: [Alibaba Cloud 문서](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | 없음 | 예 |
| `dlf.region` | - | DLF Region. 참조: [Alibaba Cloud 문서](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | 없음 | 예 |
| `dlf.uid` | - | Alibaba Cloud 계정 ID. 콘솔 오른쪽 상단의 개인 정보에서 확인할 수 있습니다. | 없음 | 예 |
| `dlf.access_key` | - | DLF 서비스에 접근하는 데 사용하는 Alibaba Cloud AccessKey. | 없음 | 예 |
| `dlf.secret_key` | - | DLF 서비스에 접근하는 데 사용하는 Alibaba Cloud SecretKey. | 없음 | 예 |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID. 메타데이터 Catalog를 지정하는 데 사용합니다. 설정하지 않으면 기본 Catalog를 사용합니다. | 없음 | 아니요 |
| `warehouse` | - | Warehouse의 스토리지 경로로, Paimon Catalog에만 필요합니다. 객체 스토리지 경로는 반드시 `/`로 끝나야 합니다. | 없음 | 아니요 |

> 참고:
>
> 3.1.0 이전 버전에서는 이전 이름을 사용하세요.

### DLF 2.5+ (Rest Catalog) {#dlf-25-rest-catalog}

> 3.1.0 버전부터 지원합니다.

| 매개변수 이름 | 이전 이름 | 설명 | 기본값 | 필수 여부 |
|----------------|-------------|-------------|---------------|----------|
| `uri` | - | DLF REST URI. 예: http://cn-beijing-vpc.dlf.aliyuncs.com | 없음 | 예 |
| `warehouse` | - | Warehouse 이름. 참고: Paimon 테이블의 스토리지 경로가 아니라 연결할 Catalog의 이름을 직접 입력하세요. | 없음 | 예 |
| `paimon.rest.token.provider` | - | 토큰 공급자. 고정값은 `dlf`입니다. | 없음 | 예 |
| `paimon.rest.dlf.access-key-id` | - | DLF 서비스에 접근하는 데 사용하는 Alibaba Cloud AccessKey. | 없음 | 예 |
| `paimon.rest.dlf.access-key-secret` | - | DLF 서비스에 접근하는 데 사용하는 Alibaba Cloud SecretKey. | 없음 | 예 |

DLF Rest Catalog를 사용할 때는 스토리지 서비스(OSS)의 Endpoint 및 Region 정보를 제공할 필요가 없습니다. Doris는 DLF Rest Catalog의 Vended Credential을 사용하여 OSS에 접근하는 데 필요한 임시 자격 증명 정보를 가져옵니다.

## 예제 {#examples}

### DLF 1.0 {#dlf-10-1}

DLF를 메타데이터 서비스로 사용하는 Hive Catalog를 생성합니다.

```sql
CREATE CATALOG hive_dlf_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

DLF를 메타데이터 서비스로 사용하는 Paimon Catalog를 생성합니다.

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.endpoint' = '<DLF_ENDPOINT>',
    'dlf.region' = '<DLF_REGION>',
    'dlf.uid' = '<YOUR_ALICLOUD_UID>',
    'dlf.access_key' = '<YOUR_ACCESS_KEY>',
    'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### DLF 2.5+ (Rest Catalog) {#dlf-25-rest-catalog-1}

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'my_catalog_name',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = '<YOUR_ACCESS_KEY>',
    'paimon.rest.dlf.access-key-secret' = '<YOUR_SECRET_KEY>'
);
```
