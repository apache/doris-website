---
title: 문제 제보
language: ko
description: "Apache Doris의 버그를 신고하거나 개선 의견을 전달하는 공식 채널인 메일링 리스트와 GitHub Issue를 소개하고, 충실한 제보를 작성하는 요령을 안내합니다."
keywords:
    - Apache Doris 문제 제보
    - Doris 버그 신고
    - Doris GitHub Issue
    - dev@doris.apache.org
    - Doris 메일링 리스트 제보
    - Issue 등록
    - 재현 단계
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

# 문제 제보 {#issue-feedback}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Bug report / Feature suggestion / Usage question -->

Apache Doris를 사용하면서 버그나 성능 문제를 발견했거나 기능을 제안하고 싶다면, 메일링 리스트 또는 GitHub Issue를 통해 커뮤니티에 전달할 수 있습니다. 이 페이지에서는 두 가지 공식 제보 채널과 충실한 제보에 포함해야 할 핵심 정보를 안내합니다.

## 제보 채널 안내 {#feedback-channel-reference}

문제 유형에 따라 채널을 선택하세요.

| 채널 | 적합한 상황 | 이용 방법 |
|------|----------|------|
| 메일링 리스트 | 사용 관련 질문, 설계 논의, 커뮤니티 관련 주제 | `dev@doris.apache.org`로 이메일 보내기(먼저 구독 필요) |
| GitHub Issue | 재현 가능한 버그, 구체적인 기능 제안, 문서 문제 | <https://github.com/apache/doris/issues/new/choose> |
| 보안 취약점 | 보안 문제(공개하지 마세요) | [보안 취약점 제보](security) 참고 |

## 제보 방법 {#feedback-methods}

### 방법 1: 메일링 리스트 {#method-1-mailing-list}

1. 제목과 내용을 자유롭게 작성하여 `dev-subscribe@doris.apache.org`로 이메일을 보낸 뒤, 안내에 따라 구독을 완료하세요(자세한 내용은 [메일링 리스트 구독](subscribe-mail-list) 참고).
2. 구독이 확인되면 `dev@doris.apache.org`로 문제나 제안을 설명하는 이메일을 보내세요.

### 방법 2: GitHub Issue {#method-2-github-issue}

[새 Issue 작성 페이지](https://github.com/apache/doris/issues/new/choose)에 접속하여 템플릿에 따라 버그 신고 또는 기능 요청을 등록하세요.

## 충실한 제보를 위한 핵심 사항 {#key-points-for-high-quality-feedback}

<!-- Knowledge type: Writing guide -->

커뮤니티가 문제를 빠르게 파악할 수 있도록 제보에 다음 정보를 포함하세요.

- **문제를 자세히 설명하세요**: 로그, 주요 오류 메시지, 이미 수행한 문제 해결 시도와 분석 내용을 제공하세요.
- **문제 범위를 최소화하세요**: 범위를 좁히고, 문제와 관련 없는 업무 맥락은 제외하세요.
- **재현 단계를 제공하세요**: 문제를 재현하는 데 필요한 최소한의 SQL, 설정 또는 스크립트를 첨부하세요.
- **문제 자체에 집중하세요**: 업무나 사용 시나리오에 대한 의존성을 최대한 줄이세요. 시나리오 정보를 반드시 포함해야 한다면 맥락을 명확하고 구체적으로 설명하세요.

## 관련 링크 {#related-links}

- [메일링 리스트 구독](subscribe-mail-list): 5단계로 dev 메일링 리스트 구독을 완료하세요.
- [보안 취약점 제보](security): ASF 절차에 따라 보안 문제를 제보하세요.
- [커뮤니티 참여](join-community): Slack, Twitter, LinkedIn 등 다른 채널을 확인하세요.
