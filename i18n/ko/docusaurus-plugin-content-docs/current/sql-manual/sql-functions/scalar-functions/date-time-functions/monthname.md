---
{
    "title": "MONTHNAME",
    "language": "ko",
    "description": "MONTHNAME 함수는 날짜 및 시간 값에 해당하는 영어 월 이름을 반환합니다. 이 함수는 DATE, DATETIME 및 TIMESTAMP_NS 타입의 값을 처리할 수 있습니다."
}
---

## 설명 {#description}

MONTHNAME 함수는 날짜 및 시간 값에 해당하는 영어 월 이름을 반환합니다. 이 함수는 DATE, DATETIME 및 TIMESTAMP_NS 타입을 지원하며, 영어 월 이름의 전체 표기(January부터 December까지)를 반환합니다.

세션 변수 [lc_time_names](#appendix-lc_time_names-may-be-set-to-any-of-the-following-locale-valuescase-insensitive)를 통해 출력 결과의 언어를 설정할 수 있습니다. 기본값은 `en_US`이며, 영어로 출력됩니다.

이 함수는 MySQL의 [monthname 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_monthname)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MONTHNAME(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

월의 영어 이름을 나타내는 VARCHAR 타입의 값을 반환합니다:
- 반환 값 범위: January, February, March, April, May, June, July, August, September, October, November, December
- 입력이 NULL이면 NULL을 반환합니다
- 반환 값은 첫 글자가 대문자이고 나머지는 소문자입니다

## 예제 {#examples}

```sql
-- Get English month name from DATE type
SELECT MONTHNAME('2008-02-03') AS result;
+----------+
| result   |
+----------+
| February |
+----------+

-- Get English month name from DATETIME type
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+---------+
| result  |
+---------+
| July    |
+---------+

-- Returns NULL when input is NULL
SELECT MONTHNAME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Control the output language by setting `lc_time_names`
SET lc_time_names='zh_CN';
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
| 七月   |
+--------+

SET lc_time_names='AR_sa';
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+------------+
| result     |
+------------+
| يوليو      |
+------------+
```

## 부록: lc_time_names는 다음 로캘 값 중 하나로 설정할 수 있습니다(대소문자 구분 없음). {#appendix-lc_time_names-may-be-set-to-any-of-the-following-locale-valuescase-insensitive}

| 로캘 값 | 의미 |
| --- | --- |
| ar_AE | 아랍어 - 아랍에미리트 |
| ar_BH | 아랍어 - 바레인 |
| ar_DZ | 아랍어 - 알제리 |
| ar_EG | 아랍어 - 이집트 |
| ar_IN | 아랍어 - 인도 |
| ar_IQ | 아랍어 - 이라크 |
| ar_JO | 아랍어 - 요르단 |
| ar_KW | 아랍어 - 쿠웨이트 |
| ar_LB | 아랍어 - 레바논 |
| ar_LY | 아랍어 - 리비아 |
| ar_MA | 아랍어 - 모로코 |
| ar_OM | 아랍어 - 오만 |
| ar_QA | 아랍어 - 카타르 |
| ar_SA | 아랍어 - 사우디아라비아 |
| ar_SD | 아랍어 - 수단 |
| ar_SY | 아랍어 - 시리아 |
| ar_TN | 아랍어 - 튀니지 |
| ar_YE | 아랍어 - 예멘 |
| be_BY | 벨라루스어 - 벨라루스 |
| bg_BG | 불가리아어 - 불가리아 |
| ca_ES | 카탈루냐어 - 스페인 |
| cs_CZ | 체코어 - 체코 |
| da_DK | 덴마크어 - 덴마크 |
| de_AT | 독일어 - 오스트리아 |
| de_BE | 독일어 - 벨기에 |
| de_CH | 독일어 - 스위스 |
| de_DE | 독일어 - 독일 |
| de_LU | 독일어 - 룩셈부르크 |
| el_GR | 그리스어 - 그리스 |
| en_AU | 영어 - 호주 |
| en_CA | 영어 - 캐나다 |
| en_GB | 영어 - 영국 |
| en_IN | 영어 - 인도 |
| en_NZ | 영어 - 뉴질랜드 |
| en_PH | 영어 - 필리핀 |
| en_US | 영어 - 미국 |
| en_ZA | 영어 - 남아프리카 공화국 |
| en_ZW | 영어 - 짐바브웨 |
| es_AR | 스페인어 - 아르헨티나 |
| es_BO | 스페인어 - 볼리비아 |
| es_CL | 스페인어 - 칠레 |
| es_CO | 스페인어 - 콜롬비아 |
| es_CR | 스페인어 - 코스타리카 |
| es_DO | 스페인어 - 도미니카 공화국 |
| es_EC | 스페인어 - 에콰도르 |
| es_ES | 스페인어 - 스페인 |
| es_GT | 스페인어 - 과테말라 |
| es_HN | 스페인어 - 온두라스 |
| es_MX | 스페인어 - 멕시코 |
| es_NI | 스페인어 - 니카라과 |
| es_PA | 스페인어 - 파나마 |
| es_PE | 스페인어 - 페루 |
| es_PR | 스페인어 - 푸에르토리코 |
| es_PY | 스페인어 - 파라과이 |
| es_SV | 스페인어 - 엘살바도르 |
| es_US | 스페인어 - 미국 |
| es_UY | 스페인어 - 우루과이 |
| es_VE | 스페인어 - 베네수엘라 |
| et_EE | 에스토니아어 - 에스토니아 |
| eu_ES | 바스크어 - 스페인 |
| fi_FI | 핀란드어 - 핀란드 |
| fo_FO | 페로어 - 페로 제도 |
| fr_BE | 프랑스어 - 벨기에 |
| fr_CA | 프랑스어 - 캐나다 |
| fr_CH | 프랑스어 - 스위스 |
| fr_FR | 프랑스어 - 프랑스 |
| fr_LU | 프랑스어 - 룩셈부르크 |
| gl_ES | 갈리시아어 - 스페인 |
| gu_IN | 구자라트어 - 인도 |
| he_IL | 히브리어 - 이스라엘 |
| hi_IN | 힌디어 - 인도 |
| hr_HR | 크로아티아어 - 크로아티아 |
| hu_HU | 헝가리어 - 헝가리 |
| id_ID | 인도네시아어 - 인도네시아 |
| is_IS | 아이슬란드어 - 아이슬란드 |
| it_CH | 이탈리아어 - 스위스 |
| it_IT | 이탈리아어 - 이탈리아 |
| ja_JP | 일본어 - 일본 |
| ko_KR | 한국어 - 대한민국 |
| lt_LT | 리투아니아어 - 리투아니아 |
| lv_LV | 라트비아어 - 라트비아 |
| mk_MK | 마케도니아어 - 북마케도니아 |
| mn_MN | 몽골 - 몽골어 |
| ms_MY | 말레이어 - 말레이시아 |
| nb_NO | 노르웨이어(보크몰) - 노르웨이 |
| nl_BE | 네덜란드어 - 벨기에 |
| nl_NL | 네덜란드어 - 네덜란드 |
| no_NO | 노르웨이어 - 노르웨이 |
| pl_PL | 폴란드어 - 폴란드 |
| pt_BR | 포르투갈어 - 브라질 |
| pt_PT | 포르투갈어 - 포르투갈 |
| rm_CH | 로만슈어 - 스위스 |
| ro_RO | 루마니아어 - 루마니아 |
| ru_RU | 러시아어 - 러시아 |
| ru_UA | 러시아어 - 우크라이나 |
| sk_SK | 슬로바키아어 - 슬로바키아 |
| sl_SI | 슬로베니아어 - 슬로베니아 |
| sq_AL | 알바니아어 - 알바니아 |
| sr_RS | 세르비아어 - 세르비아 |
| sv_FI | 스웨덴어 - 핀란드 |
| sv_SE | 스웨덴어 - 스웨덴 |
| ta_IN | 타밀어 - 인도 |
| te_IN | 텔루구어 - 인도 |
| th_TH | 태국어 - 태국 |
| tr_TR | 튀르키예어 - 튀르키예 |
| uk_UA | 우크라이나어 - 우크라이나 |
| ur_PK | 우르두어 - 파키스탄 |
| vi_VN | 베트남어 - 베트남 |
| zh_CN | 중국어 - 중국 |
| zh_HK | 중국어 - 홍콩 |
| zh_TW | 중국어 - 대만 |
