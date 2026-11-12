---
{
    "title": "Doris Streamloader",
    "language": "ko",
    "description": "Doris Streamloader 릴리스 노트."
}
---

# Doris Streamloader {#doris-streamloader}

이 문서는 Doris Streamloader 릴리스 노트를 최신순으로 나열합니다.

## 1.0.3 {#103}

출처: [1.0.3 릴리스 노트](https://github.com/apache/doris-streamloader/issues/29)

### 기능 및 개선 사항 {#features-and-improvements}

- 사용자 지정 줄바꿈 문자를 지원합니다. [#27](https://github.com/apache/doris-streamloader/pull/27)

### 버그 수정 {#bug-fixes}

- `workers`를 설정하지 않으면 Streamloader가 작동하지 않던 문제를 수정했습니다. [#24](https://github.com/apache/doris-streamloader/pull/24)
- 헤더에 레이블을 설정할 때 발생하는 레이블 충돌을 방지했습니다. [#25](https://github.com/apache/doris-streamloader/pull/25)
