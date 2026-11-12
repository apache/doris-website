---
{
  "title": "Apache Doris가 Rockset을 대체할 최적의 오픈 소스인 이유",
  "summary": "Rockset의 대안을 표방하는 여러 제품 중 Apache Doris는 Rockset의 핵심 기능을 모두 갖춘 몇 안 되는 제품입니다.",
  "description": "Rockset의 대안을 표방하는 여러 제품 중 Apache Doris는 Rockset의 핵심 기능을 모두 갖춘 몇 안 되는 제품입니다.",
  "date": "2024-06-24",
  "author": "velodb.io · Zaki Lu, Apache Doris Committer",
  "tags": [
    "Tech Sharing"
  ],
  "externalLink": "https://www.velodb.io/blog/567",
  "image": "/images/doris-vs-rockset.jpeg"
}
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

OpenAI가 [Rockset 인수](https://openai.com/index/openai-acquires-rockset/)를 발표하며 데이터 업계에 큰 반향을 일으켰습니다. 클라우드 기반 완전 관리형 분석 데이터베이스 인수를 축하하는 목소리와 함께 한 가지 질문도 나왔습니다.  **왜 [Rockset](https://rockset.com)**일까요?

![OpenAI의 Rockset 인수](/images/openai-twitter-rockset.png)

Rockset은 Meta의 전 엔지니어링 디렉터 Venkat Venkataramani가 2016년에 설립했으며 실시간 검색과 데이터 분석에 집중합니다. 다른 DBMS와 비교한 주요 특징은 다음과 같습니다.

- **실시간 데이터 업데이트**: 최신 데이터를 수집하고 전달하여 데이터 최신성을 보장하며, 필드 단위 업데이트를 밀리초 내에 처리합니다.

- **통합 인덱스**: 역색인, 열 기반 스토리지, 행 기반 스토리지의 장점을 결합하여 효율적이고 유연한 쿼리를 제공합니다.

- **반정형 데이터 기본 지원**: 증가하는 반정형 데이터 처리 요구와 해시 조인, 중첩 루프 조인에 적합합니다.

- **SQL 및 JOIN 호환성**: 검색 인덱스가 다양한 조인 쿼리에 맞게 최적화되어 있습니다.

이 소식은 Rockset 사용자에게 촉박한 일정도 안겼습니다. 사용자는 각자의 요구에 맞는 대안을 삼 개월 안에 찾아야 했습니다. 다른 분석 데이터베이스에는 기회가 되었지만, 위의 핵심 기능을 모두 제공하는 제품은 많지 않습니다. Apache Doris는 그중 살펴볼 만한 제품입니다.

오픈 소스 실시간 데이터 웨어하우스인 Apache Doris는 전 세계 4000개 이상의 기업이 사용하며 다음과 같은 기능을 제공합니다.

- **실시간 데이터 업데이트**: Apache Doris는 [실시간 업데이트](https://doris.apache.org/docs/table-design/data-model/unique) 와 삭제뿐 아니라 일부 열만 실시간으로 업데이트하는 기능도 지원하여 데이터가 자주 변경되는 환경에 적합합니다.

- **행·열 하이브리드 스토리지**: Apache Doris는 열 기반 데이터 웨어하우스로, [ClickBench](https://benchmark.clickhouse.com/)에서 뛰어난 OLAP 성능을 제공합니다. 또한 행 기반 스토리지로 [높은 동시성의 포인트 쿼리](https://doris.apache.org/docs/query/high-concurrent-point-query/)를 지원하며 거의 백만 건의 쿼리 요청에 밀리초 단위로 응답할 수 있습니다.

- **[역색인](https://doris.apache.org/docs/table-design/index/inverted-index) 과 전문 검색**: 모든 필드에 인덱스를 생성하고 필드를 유연하게 조합하여 다차원 분석과 효율적인 키워드 검색을 수행할 수 있습니다.

- **반정형 데이터 기본 지원**: Apache Doris가 도입한 [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT) 데이터 타입은 비용 효율적인 스토리지 위에서 유연한 스키마와 빠른 쿼리를 제공합니다. 기존 JSON 처리 방식과 비교해 10배 성능 향상이 가능합니다.

- **다양한 SQL 및 [조인 연산 지원](https://doris.apache.org/docs/query/join-optimization/doris-join-optimization)**: MySQL 구문과 인터페이스의 호환성이 높으며 INNER JOIN, CROSS JOIN, 모든 유형의 OUTER JOIN을 지원합니다. 데이터 타입에 따른 자동 최적화로 다양한 상황에 맞는 성능을 제공합니다.

Apache Software Foundation의 최상위 프로젝트인 Apache Doris는 빠르게 성장하는 커뮤니티의 지원을 받습니다. 원문 게시 당시 GitHub Star는 11.8K 이상이고 기여자는 636명이었습니다.

Apache Doris는 Rockset을 대체할 수 있는 우수한 오픈 소스 제품입니다. 도움이 필요하면 dev@doris.apache.org 로 문의하세요.
