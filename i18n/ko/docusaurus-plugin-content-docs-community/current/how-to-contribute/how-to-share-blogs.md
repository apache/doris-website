---
title: 블로그 공유 방법
language: ko
description: "Apache Doris 커뮤니티에 기술 블로그를 공유하는 방법: 권장 콘텐츠 주제, 제출 경로 및 게시 절차를 안내합니다."
keywords:
    - Apache Doris
    - 기술 블로그 기고
    - Doris 블로그
    - 커뮤니티 기여
    - 기술 정보 공유
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Use case: Blog submission / community content contribution -->

Doris 커뮤니티는 Doris에 관한 기술 글을 환영합니다. 글이 병합되면 Doris 웹사이트에 게시됩니다. 이 페이지에서는 권장 콘텐츠 주제, 제출 경로 및 기여 절차를 설명합니다.

## 권장 콘텐츠 주제 {#recommended-content-directions}

글의 주제에는 다음이 포함되며, 이에 국한되지 않습니다.

| 주제 | 예시 |
| --- | --- |
| Doris 활용 팁 | 효율적인 데이터 수집, 쿼리 튜닝, 운영 모범 사례 |
| Doris 기능 소개 | 구체화된 뷰, 역인덱스, 레이크하우스 기능 |
| Doris 시스템 튜닝 | FE / BE 매개변수 튜닝, JVM 최적화 |
| Doris 내부 동작 살펴보기 | 쿼리 실행, 저장 형식, 컴팩션 메커니즘 |
| Doris 비즈니스 활용 사례 | 사용자 행동 분석, 로그 검색, 실시간 보고 경험 |

## 제출 절차 {#submission-process}

<!-- Knowledge type: Procedure -->

1. 블로그 Markdown 파일을 준비해 [apache/doris-website](https://github.com/apache/doris-website) 저장소의 `/blog` 디렉터리에 넣습니다.
2. [문서 형식 명세](./docs-format-specification)에 따라 본문 형식을 맞춥니다. 코드 펜스, 이미지 대체 텍스트, 중국어와 영어 문자 사이의 간격 등에 관한 규칙을 따릅니다.
3. 저장소 루트의 README와 관련 인덱스를 확인해 블로그 항목을 추가해야 하는지 살펴봅니다.
4. 블로그 주제와 작성자 정보를 설명하는 Pull Request를 `apache/doris-website`에 제출합니다.
5. 커뮤니티 Committer의 검토를 기다리고 피드백에 따라 수정한 뒤 main 브랜치에 병합합니다.

저장소와 절차에 관한 최신 정보는 [apache/doris-website README](https://github.com/apache/doris-website)를 참조하세요.

## 관련 문서 {#related-documents}

- [문서 기여 가이드](./contribute-doc)
- [문서 형식 명세](./docs-format-specification)
