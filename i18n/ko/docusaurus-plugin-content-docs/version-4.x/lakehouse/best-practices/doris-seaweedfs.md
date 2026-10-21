---
{
    "title": "SeaweedFS 연동",
    "language": "ko"
}
---

[SeaweedFS](https://seaweedfs.com/)는 동일한 `weed` 프로세스에서 S3 호환 오브젝트 API와 Apache Iceberg REST Catalog를 모두 제공하는 분산 스토리지 시스템입니다. 하나의 실행 파일이 Parquet 데이터와 Iceberg 메타데이터를 제공하며, 하나의 S3 자격 증명 쌍으로 인증합니다.

이 페이지에서는 SeaweedFS를 Doris 기반 Iceberg 레이크하우스로 구성하는 데 필요한 최소 설정을 설명합니다. SeaweedFS 저장소의 [`TestDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris) 통합 테스트도 동일한 전체 처리 흐름을 검증합니다. 이 테스트는 SeaweedFS 미니 클러스터를 시작하고, 여기에 연결되는 Doris Iceberg Catalog를 등록한 다음, PyIceberg로 행을 쓰고 `apache/doris:doris-all-in-one-2.1.0`에서 다시 읽습니다.

## Iceberg 레이크하우스에 SeaweedFS를 사용하는 이유 {#why-seaweedfs-for-an-iceberg-lakehouse}

일반적인 레이크하우스 스택은 다음 세 계층을 조합하여 구성합니다:

* 오브젝트 스토리지(S3 또는 호환 스토리지)
* 독립형 Iceberg Catalog(Hive Metastore, Glue, Polaris, Lakekeeper, Nessie, ...)
* 쿼리 엔진(Doris, Spark, Trino, ...)

SeaweedFS는 앞의 두 계층을 하나의 프로세스로 통합합니다. 동일한 `weed` 실행 파일이 다음 두 역할을 모두 수행합니다:

* parquet 파일을 저장하는 S3 호환 오브젝트 스토리지
* 테이블 메타데이터를 저장하는 Iceberg REST Catalog

따라서 Doris는 두 시스템 대신 하나의 시스템과 통신합니다. 실질적인 이점은 다음과 같습니다:

* **구성 요소 감소.** Hive Metastore, Glue, 별도 Catalog를 위한 Postgres, 프로비저닝할 STS 역할이 필요하지 않습니다.
* **간편한 배포.** 하나의 실행 파일과 하나의 IAM 구성을 사용하며, 하나의 S3 자격 증명 쌍을 Doris의 Iceberg REST 클라이언트와 S3 리더가 공유합니다.
* **로컬 및 온프레미스 환경에 적합.** 이 구성에는 클라우드 네이티브 서비스가 필요하지 않습니다. 동일한 구성을 노트북, 단일 VM 또는 Kubernetes 클러스터에서 실행할 수 있습니다.
* **메타데이터 처리 지연 시간 감소.** Catalog 상태는 데이터를 제공하는 동일한 SeaweedFS filer에 저장되므로, 네임스페이스와 테이블을 조회할 때 별도 서비스와 통신할 필요가 없습니다.
* **디스크에 S3 네이티브 형식으로 저장.** 테이블은 S3 버킷에 표준 Iceberg 디렉터리로 저장됩니다. 모든 S3 클라이언트(rclone, `aws s3`, Spark, Trino, Dremio, RisingWave)는 Doris와 함께 이 테이블을 읽거나 복제할 수 있습니다.

아키텍처는 다음과 같습니다:

```text
Doris
  |
  v
Iceberg tables
  |
  v
SeaweedFS  (S3 storage + REST catalog)
```

소규모 팀이나 내부 플랫폼에서는 별도의 메타스토어 서비스에 의존하지 않고 레이크하우스를 구축할 수 있는 간결한 방법입니다.

## 1. SeaweedFS 시작 {#1-start-seaweedfs}

`weed`를 [github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs)에서 빌드하거나 설치합니다.

액세스 키에 S3 전체 접근 권한을 부여하는 IAM 구성을 생성합니다. 동일한 키는 Iceberg REST 엔드포인트의 OAuth2 클라이언트로도 사용됩니다:

```json
{
  "identities": [
    {
      "name": "doris",
      "credentials": [
        {
          "accessKey": "AKIAIOSFODNN7EXAMPLE",
          "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
      ],
      "actions": ["Admin"]
    }
  ]
}
```

Iceberg REST 엔드포인트와 미리 생성된 테이블 버킷을 갖춘 단일 프로세스 클러스터를 시작합니다:

```bash
weed mini \
  -ip $(hostname -I | awk '{print $1}') \
  -dir /var/lib/seaweedfs \
  -s3.config /etc/seaweedfs/iam_config.json \
  -tableBucket iceberg-tables
```

`weed mini`는 master, volume, filer, S3 및 Iceberg REST Catalog를 하나의 프로세스에서 실행합니다. 기본 포트는 다음과 같습니다:

| 구성 요소 | 포트 | 재정의 플래그 |
| --------- | ---- | ------------- |
| Master HTTP | 9333 | `-master.port` |
| Filer HTTP | 8888 | `-filer.port` |
| S3 | 8333 | `-s3.port` |
| Iceberg REST | 8181 | `-s3.port.iceberg` |

`-tableBucket iceberg-tables`는 시작 시 S3 Tables 버킷을 생성합니다. 이는 Iceberg를 지원하는 버킷 유형으로, Doris가 데이터를 쓰는 대상입니다.

Catalog에 접속할 수 있는지 확인합니다:

```bash
curl -s http://SEAWEED_HOST:8181/v1/config | jq .
```

## 2. Doris에 Iceberg Catalog 등록 {#2-register-the-iceberg-catalog-in-doris}

```sql
CREATE CATALOG seaweedfs PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://SEAWEED_HOST:8181",
    "warehouse" = "s3://iceberg-tables",
    "credential" = "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.endpoint" = "http://SEAWEED_HOST:8333",
    "s3.access_key" = "AKIAIOSFODNN7EXAMPLE",
    "s3.secret_key" = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.region" = "us-west-2",
    "use_path_style" = "true"
);
```

참고:

* `credential = "<access_key>:<secret_key>"`은 Doris의 Iceberg REST 클라이언트가 OAuth2 클라이언트 자격 증명으로 전달합니다. SeaweedFS는 S3 엔드포인트를 보호하는 동일한 IAM 구성을 기준으로 이 자격 증명을 검증합니다.
* `s3.*` 속성은 Doris 자체 parquet 리더와 라이터에서 사용합니다. 이 속성은 동일한 `weed` 프로세스를 가리키며, 호스트와 키 쌍도 같습니다.
* `use_path_style = "true"`는 SeaweedFS가 기본적으로 path-style로 S3를 제공하므로 필요합니다.
* 통합 테스트에서도 이 속성을 그대로 사용합니다. 표준 형식은 [`createDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3tables/catalog_doris/doris_catalog_test.go)를 참조하세요.

Catalog를 등록하기 전에 Doris 외부에서(예: PyIceberg 사용) 네임스페이스나 테이블을 생성했다면 메타데이터 캐시를 새로 고칩니다:

```sql
REFRESH CATALOG seaweedfs;
```

## 3. Catalog 사용 {#3-use-the-catalog}

```sql
USE seaweedfs;

CREATE DATABASE IF NOT EXISTS demo;

USE seaweedfs.demo;

CREATE TABLE iceberg_smoke (
  id BIGINT,
  label STRING
);

INSERT INTO iceberg_smoke VALUES (1, 'one'), (2, 'two'), (3, 'three');

SELECT id, label FROM iceberg_smoke ORDER BY id;
```

예상 출력:

```text
+----+-------+
| id | label |
+----+-------+
|  1 | one   |
|  2 | two   |
|  3 | three |
+----+-------+
```

이는 SeaweedFS 통합 테스트에서 검증하는 것과 동일한 처리 흐름입니다. Iceberg REST Catalog를 통해 네임스페이스와 테이블을 생성하고, PyIceberg로 행을 추가하며, Doris가 표준 S3 및 Iceberg 메타데이터 처리 흐름을 통해 데이터를 읽습니다.

## 프로덕션 환경 참고 사항 {#production-notes}

* 프로덕션 클러스터에서는 `weed mini`를 `weed master`, `weed volume`, `weed filer`, `weed s3 -iceberg.port=8181`로 대체합니다(또는 SeaweedFS Helm 차트를 사용합니다). Doris 측 구성은 동일하며 호스트와 포트만 변경됩니다.
* OAuth2 자격 증명은 S3 액세스 키입니다. Doris의 Catalog 접근 자격 증명을 교체하려면 일반적인 S3 사용자의 자격 증명을 교체할 때와 같은 방식으로 해당 키를 보유한 IAM ID의 자격 증명을 교체합니다.
* Iceberg 테이블 유지보수(compaction, snapshot expiration, orphan removal, manifest rewriting) 기능은 SeaweedFS에 내장되어 있으며 동일한 버킷을 대상으로 실행됩니다. 자세한 내용은 [SeaweedFS Iceberg Catalog 위키](https://github.com/seaweedfs/seaweedfs/wiki/SeaweedFS-Iceberg-Catalog)를 참조하세요.

## 참고 자료 {#references}

* [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
* [SeaweedFS의 Doris Iceberg 통합 테스트](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris)
* [Doris Iceberg Catalog 참고 문서](https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog)
