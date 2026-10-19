---
{
    "title": "Hugging Face 데이터 분석",
    "language": "ko",
    "description": "Apache Doris에서 SQL로 Hugging Face 데이터셋을 직접 쿼리하고 분석하는 방법을 알아봅니다. 다운로드 없이 CSV, Parquet, JSON 형식을 지원하여 머신 러닝 데이터를 빠르게 가져올 수 있습니다."
}
---

[Hugging Face](https://huggingface.co/)는 사용자가 머신 러닝 모델, 데이터셋 및 기타 리소스를 저장하고 공유하며 함께 개발할 수 있는 인기 있는 중앙 집중형 플랫폼입니다. [Hugging Face Dataset](https://huggingface.co/datasets) 리포지토리에는 CSV, Parquet, JSONL 등 다양한 형식의 데이터 파일이 포함될 수 있습니다.

Doris는 [HTTP Table Valued Function](../sql-manual/sql-functions/table-valued-functions/http.md)을 통해 SQL로 Hugging Face 데이터셋의 데이터에 직접 접근하고 분석할 수 있습니다.

:::note
이 기능은 버전 4.0.2부터 지원됩니다.
:::

## 기능 {#features}

| 기능 | 설명 |
|---------|-------------|
| 접근 프로토콜 | HTTP 프로토콜로 Hugging Face Dataset에 접근 |
| 타입 추론 | 자동 타입 추론 지원 |
| 지원 파일 형식 | CSV, JSON, Parquet, ORC |
| 데이터 작업 | `CREATE TABLE AS SELECT` 및 `INSERT INTO ... SELECT` 지원 |

매개변수는 File Table Valued Function과 동일합니다.

## URI 구문 {#uri-syntax}

Hugging Face 데이터셋에 접근하기 위한 URI 형식은 다음과 같습니다.

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```

| 구성 요소 | 설명 | 필수 여부 |
|-----------|-------------|----------|
| `owner` | 데이터셋 소유자 | 예 |
| `repo` | 데이터셋 리포지토리 이름 | 예 |
| `branch` | 브랜치 이름, 기본값은 `main` | 아니요 |
| `path` | 파일 경로, 와일드카드 지원 | 예 |

**와일드카드 설명:**

| 와일드카드 | 설명 | 예시 |
|----------|-------------|---------|
| `*` | 단일 디렉터리 수준에서 임의의 문자와 일치 | `*/*.parquet`는 첫 번째 수준의 하위 디렉터리에 있는 모든 Parquet 파일과 일치 |
| `**` | 여러 디렉터리 수준에 걸쳐 재귀적으로 일치 | `**/*.parquet`는 모든 수준의 Parquet 파일과 일치 |
| `[...]` | 문자 집합에 있는 임의의 단일 문자와 일치 | `test-0000[0-9].parquet`는 test-00000부터 test-00009까지 일치 |

## 활용 사례 {#use-cases}

### 사례 1: 빠른 데이터 쿼리 {#case-1-quick-data-query}

파일을 다운로드하지 않고 SQL로 Hugging Face의 공개 데이터셋을 직접 쿼리합니다.

**예시:** `fka/awesome-chatgpt-prompts` 리포지토리의 CSV 데이터를 쿼리합니다.

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```

> 해당 데이터 파일: https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**예시:** 와일드카드로 여러 파일을 지정하여 `stanfordnlp/imdb` 리포지토리의 Parquet 파일을 쿼리합니다.

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 해당 데이터 파일: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### 사례 2: 로컬 테이블로 데이터 가져오기 {#case-2-import-data-to-local-tables}

이후 분석에 사용할 수 있도록 Hugging Face 데이터셋을 Doris 테이블로 가져옵니다.

**방법 1:** `CREATE TABLE AS SELECT`로 새 테이블을 만들고 데이터를 가져옵니다.

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```

> 해당 데이터 파일: https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**방법 2:** `INSERT INTO ... SELECT`로 기존 테이블에 데이터를 삽입합니다.

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 해당 데이터 파일: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### 사례 3: 비공개 데이터셋 접근 {#case-3-access-private-datasets}

접근 권한이 필요한 데이터셋의 경우 요청에 Token 인증을 추가해야 합니다.

**절차:**

1. Hugging Face 계정에 로그인하고 Access Token을 발급받습니다. Access Token은 `hf_`로 시작합니다.
2. SQL에서 `http.header.Authorization` 속성으로 Token을 전달합니다.

**예시:**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
