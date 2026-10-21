---
{
    "title": "Lance | 파일 형식",
    "language": "ko",
    "description": "이 문서에서는 Apache Doris의 Lance 파일 형식 읽기 지원을 소개합니다.",
    "sidebar_label": "Lance"
}
---

# Lance {#lance}

:::note
Lance는 Apache Doris 4.2부터 지원됩니다.
:::

[Lance](https://docs.lancedb.com/lance)는 분석 및 AI 워크로드를 위해 설계된 열 지향 데이터 형식입니다. Doris는 Lance Catalog 또는 `s3()` 및 `local()` 테이블 반환 함수(TVFs)를 통해 Lance 데이터 세트를 읽을 수 있습니다.

Lance 타입 매핑에 대한 자세한 내용은 [Doris 데이터 타입 매핑](../catalogs/lance-catalog/doris-type-mapping.md)을 참조하세요.

## 지원 기능 {#supported-features}

| 기능 | 지원 여부 |
|---|---|
| Lance Catalog | Filesystem Catalog 및 REST Catalog 지원 |
| 파일 TVF | `s3()` 및 `local()` 지원 |
| 스키마 추론 및 컬럼 프루닝 | 지원 |
| 병렬 Fragment 스캔 | Catalog 쿼리 및 S3 TVF에서 지원 |
| 조건자 푸시다운 | 호환되는 스칼라 조건자 지원 |
| 벡터 검색 | `vector_search()`를 통해 Lance 벡터 인덱스 및 Flat Search 지원 |
| Lance에 쓰기 | 지원하지 않음 |
| Time Travel | 지원하지 않음 |
| Full-Text Search / Hybrid Search | 지원하지 않음 |

<!-- The full Lance Catalog guide is currently available only in the 4.x documentation tree. -->
Catalog 구성, 조건자 푸시다운, 벡터 검색에 대한 자세한 내용은 [Lance Catalog (4.x)](/docs/4.x/lakehouse/catalogs/lance-catalog)를 참조하세요.

## 파일 TVF로 Lance 데이터 세트 쿼리하기 {#query-a-lance-dataset-with-a-file-tvf}

`uri` 또는 `file_path`는 **하나의 Lance 데이터 세트의 루트 디렉터리**를 직접 가리켜야 하며, `data/*.lance`와 같은 내부 파일을 가리켜서는 안 됩니다.

다음 예제는 S3 호환 객체 스토리지에서 Lance 데이터 세트를 읽습니다.

```sql
SELECT user_id, name
FROM s3(
    "uri" = "s3://my-bucket/lance/user_profiles.lance",
    "s3.endpoint" = "http://127.0.0.1:9000",
    "s3.access_key" = "admin",
    "s3.secret_key" = "password",
    "s3.region" = "us-east-1",
    "use_path_style" = "true",
    "format" = "lance"
)
WHERE user_id > 100;
```

로컬 데이터 세트를 읽으려면 `local()`을 사용하고, `file_path`로 데이터 세트의 루트 디렉터리를, `backend_id`로 대상 BE를 지정합니다. Doris는 `file_path`를 Lance Reader에 직접 전달하며, `user_files_secure_path`를 앞에 붙이거나 경로를 Glob으로 확장하지 않습니다. 절대 경로 사용을 권장합니다.

## 제한 사항 {#limitations}

- Lance는 읽기 전용으로만 접근할 수 있습니다. Lance 테이블의 생성, 쓰기, 업데이트 또는 삭제는 지원하지 않습니다.
- `s3()`와 `local()`만 Lance 형식을 지원합니다. HDFS 및 HTTP와 같은 다른 파일 TVF는 지원하지 않습니다.
- 하나의 TVF 경로는 하나의 Lance 데이터 세트만 나타낼 수 있으며, `path_partition_keys`는 지원하지 않습니다.
- 쿼리는 데이터 세트의 현재 버전을 읽습니다. SQL로 Version을 선택하거나 Time Travel을 수행할 수 없습니다.
- Local TVF의 Schema 탐색과 실행은 각각 독립적으로 데이터 세트의 최신 버전을 엽니다. Local TVF 쿼리가 분석 및 실행되는 동안에는 데이터 세트를 수정하지 마세요.

## 참고 자료 {#references}

- [Lance Catalog (4.x)](/docs/4.x/lakehouse/catalogs/lance-catalog)
- [Lance 형식 문서](https://docs.lancedb.com/lance)
