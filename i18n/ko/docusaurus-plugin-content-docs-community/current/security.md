---
title: 보안 취약점 공개
language: ko
description: "Apache Doris의 보안 취약점을 신고하는 방법: security@apache.org로 ASF 보안팀에 연락하고 공식적인 책임 있는 취약점 공개 절차를 따르세요."
keywords:
    - Apache Doris 보안
    - Doris 보안 취약점
    - security@apache.org
    - ASF 보안팀
    - 책임 있는 취약점 공개
    - 취약점 신고
    - CVE
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

# 보안 취약점 공개 {#security-vulnerability-disclosure}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Vulnerability reporting / Security disclosure -->

Apache Software Foundation (ASF)은 소프트웨어 프로젝트의 보안 문제에 엄격하게 대응합니다. Apache Doris 역시 제품의 기능 및 동작과 관련된 보안 문제에 세심한 주의를 기울입니다. 이 페이지에서는 ASF의 공식 절차에 따라 Doris의 보안 취약점이나 잠재적 위협을 신고하는 방법을 설명합니다.

## 신고 채널 요약 {#reporting-channel-quick-reference}

| 항목 | 설명 |
|------|------|
| 수신자 | [Apache 보안팀](http://www.apache.org/security/) |
| 이메일 주소 | [security@apache.org](mailto:security@apache.org) |
| 프로젝트 이름 | 이메일에 반드시 `Doris`를 명시하세요 |
| 공개 원칙 | 이메일을 보내기 전에는 어떤 공개 채널에서도 취약점을 **공개하지 마세요** |

## 신고 절차 {#reporting-steps}

<!-- Knowledge type: Procedure -->

1. **이메일 작성**: [security@apache.org](mailto:security@apache.org)로 이메일을 보내고, 제목과 본문에 프로젝트 이름이 `Doris`임을 명확히 표시하세요.
2. **문제 설명**: 취약점이나 잠재적 위협의 영향 범위, 영향을 받는 버전, 가능한 공격 시나리오를 명확히 설명하세요.
3. **재현 절차 첨부**: 보안 문제를 재현할 수 있는 최소한의 재현 절차, PoC 또는 로그 발췌 내용을 제공하세요.
4. **답변 대기**: Apache 보안팀과 Doris 커뮤니티가 평가 및 분석을 마친 후 직접 연락드립니다.

## 주의 사항 {#important-notes}

- **공개하지 마세요**: 보안팀의 답변을 받고 공개 시점을 조율하기 전에는 GitHub Issues, 메일링 리스트, Slack, 소셜 미디어 등 어떤 공개 채널에서도 취약점을 논의하지 마세요.
- **일반 피드백 채널을 사용하지 마세요**: 보안 문제는 GitHub Issues나 [피드백](feedback)에 안내된 dev 메일링 리스트를 통해 제출해서는 안 됩니다.
- **책임 있는 취약점 공개 절차를 따르세요**: 전체 절차는 [ASF 보안 취약점 공개 정책](http://www.apache.org/security/)을 참조하세요.

## 관련 링크 {#related-links}

- [ASF 보안팀 홈페이지](http://www.apache.org/security/)
- [피드백](feedback): 보안과 관련 없는 문제를 위한 채널입니다.
- [커뮤니티 참여](join-community): 그 밖의 커뮤니티 소통 채널입니다.
