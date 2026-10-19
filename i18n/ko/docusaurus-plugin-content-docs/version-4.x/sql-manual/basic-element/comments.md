---
{
    "title": "주석",
    "language": "ko",
    "description": "주석을 사용하면 애플리케이션을 더 쉽게 읽고 유지 관리할 수 있습니다. 예를 들어,"
}
---

## 설명 {#description}

주석을 사용하면 애플리케이션을 더 쉽게 읽고 유지 관리할 수 있습니다. 예를 들어, 문 안에 주석을 넣어 애플리케이션에서 해당 문이 어떤 용도로 사용되는지 설명할 수 있습니다. SQL 문의 주석(HINT 제외)은 문 실행에 영향을 주지 않습니다. HINT를 사용하는 특수한 주석 형식에 대해서는 [HINT](../../query-acceleration/tuning/tuning-plan/adjusting-join-shuffle) 절을 참조하세요.

SQL 문에서는 키워드, 매개변수 또는 문장 부호 사이 어디에나 주석을 넣을 수 있습니다. 문에 주석을 넣는 방법은 다음과 같습니다.

- 여러 줄 주석: 슬래시와 별표(`/*`)로 주석을 시작한 뒤 주석 내용을 작성합니다. 주석 내용은 여러 줄에 걸쳐 작성할 수 있습니다. 별표와 슬래시(`*/`)로 주석을 끝냅니다. 주석의 시작 및 끝을 나타내는 문자와 주석 내용 사이에 공백이나 줄 바꿈을 넣을 필요는 없습니다.
- 한 줄 주석: 대시 두 개(`--`)로 주석을 시작한 뒤 주석 내용을 작성합니다. 주석 내용은 다음 줄로 이어질 수 없습니다. 주석은 줄 바꿈 문자로 끝납니다.

## 예제 {#examples}

### 여러 줄 주석 {#multi-line-comment}

```sql
SELECT /* This is a multi-line comment
          that can span multiple lines */
       column_name
FROM   table_name;
```

### 한 줄 주석 {#single-line-comment}

```sql
SELECT column_name -- This is a single-line comment
FROM   table_name;
```
