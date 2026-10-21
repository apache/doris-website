---
{
    "title": "AI_AGG",
    "language": "ko",
    "description": "사용자가 제공한 지침에 따라 대규모 언어 모델을 사용하여 특정 컬럼을 집계합니다."
}
---

## 설명 {#description}

사용자가 제공한 지침에 따라 대규모 언어 모델을 사용하여 특정 컬럼을 집계합니다.

## 구문 {#syntax}

```sql
AI_AGG([<resource_name>], <expr>, <instruction>)
```

<a id="parameter-description"></a>

## 매개변수 {#parameters}

| 매개변수         | 설명                                             |
| ----------------- | ------------------------------------------------------- |
| `<resource_name>` | 지정할 리소스 이름입니다. 선택 사항입니다.                  |
| `<expr>`          | 집계할 텍스트 컬럼입니다. 개별 텍스트의 문자 수는 128K 미만이어야 합니다.|
| `<instruction>`   | 실행할 지침입니다. 리터럴만 허용됩니다.      |

## 반환값 {#return-value}

4.1.5 버전부터 AI_AGG는 JSON 배열이 포함된 텍스트를 비롯해 모델이 생성한 전체 텍스트를 하나의 결과로 반환합니다. 해당 배열을 여러 집계 결과로 나누지 않습니다. OpenAI Responses 형식에서는 reasoning 및 tool 항목과 같이 텍스트가 아닌 출력을 건너뛰고, message 항목의 `output_text`를 이어 붙입니다. 응답에 상태가 포함되어 있으면 해당 상태는 `completed`여야 합니다. 응답이 불완전하거나 응답에 텍스트가 없으면 오류가 발생합니다.

집계 결과가 담긴 문자열을 반환합니다.

모든 입력값이 NULL이면 NULL을 반환합니다.

결과는 언어 모델이 생성하므로 출력은 고정되어 있지 않습니다.

## 예제 {#example}

다음 테이블은 고객 지원 티켓을 가정한 예시입니다:
```sql
CREATE TABLE support_tickets (
    ticket_id      BIGINT,
    customer_name  VARCHAR(100),
    subject        VARCHAR(200),
    details        TEXT
)
DUPLICATE KEY(ticket_id)
DISTRIBUTED BY HASH(ticket_id) BUCKETS 5
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO support_tickets VALUES
(1, 'Alice', 'Login Failure', 'Cannot log in after password reset. Tried clearing cache and different browsers.'),
(2, 'Bob', 'Login Failure', 'Same problem as Alice. Also seeing 502 errors on the SSO page.'),
(3, 'Carol', 'Payment Declined', 'Credit card charged twice but order still shows pending.'),
(4, 'Dave', 'Slow Dashboard', 'Dashboard takes >30 seconds to load since the last release.'),
(5, 'Eve', 'Login Failure', 'Getting redirected back to login after entering 2FA code.');
```

`AI_AGG`를 사용하여 문제 제목별로 고객 문제를 요약할 수 있습니다:
```sql
SELECT
    subject,
    AI_AGG(
        'ai_resource_name',
        details,
        'Summarize every ticket detail into one short paragraph of 40 words or less.'
    ) AS ai_summary
FROM support_tickets
GROUP BY subject;
```

```text
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| subject          | ai_summary                                                                                                                                                                                                |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Slow Dashboard   | The dashboard loading time has significantly increased to over 30 seconds following the latest release, indicating a potential issue with the recent update.                                              |
| Login Failure    | User experiences login issues, including redirection post-2FA, inability to log in after password reset despite using different browsers and clearing cache, and encountering 502 errors on the SSO page. |
| Payment Declined | The customer's credit card was charged twice, but the order status remains pending, indicating a potential issue with the transaction processing or system update.                                        |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

사례 2：

다음 테이블은 전자 상거래 플랫폼의 사용자 리뷰 테이블을 가정한 예시입니다.
```sql
CREATE TABLE product_reviews (
    review_id   BIGINT,
    product_id  BIGINT,
    rating      TINYINT,
    comment     STRING
)
DUPLICATE KEY(review_id)
DISTRIBUTED BY HASH(product_id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO product_reviews VALUES
(1, 1001, 5, '鞋子尺码刚好，穿着舒服，颜色也好看，物流很快！'),
(2, 1001, 4, '质量不错，就是鞋底有点硬，需要磨合几天。'),
(3, 1001, 3, '外观和图片一样，但收到时有轻微胶味。'),
(4, 1002, 5, '杯子小巧，出汁快，清洗也方便，上班带着刚好。'),
(5, 1002, 3, '声音有点大，不过能接受，充满电只能榨 5 杯。'),
(6, 1002, 2, '用了两周就充不进电，售后换货流程太慢。'),
(7, 1003, 5, '面料透气不闷热，袖口设计很贴心，UPF50+ 确实晒不黑。'),
(8, 1003, 4, '颜色好看，但拉链有点卡顿，需要用力。'),
(9, 1004, 5, '降噪给力，地铁里也能安静听歌，续航一周充一次。');
```

AI_AGG를 사용하여 요약하고 평가합니다:
```sql
SET default_ai_resource = 'ai_resource_name';
SELECT
    product_id,
    AI_AGG(
        comment,
        '请把多条用户评价总结成一句话，突出买家最关心的优点和缺点，控制在50字以内。'
    ) AS 评价摘要
FROM product_reviews
GROUP BY product_id;
```

```text
+------------+--------------------------------------------------------------------------------------------------------------+
| product_id | 评价摘要                                                                                                     |
+------------+--------------------------------------------------------------------------------------------------------------+
|       1003 | 该产品面料透气、防晒效果好且颜色美观，但拉链使用不顺畅。                                                     |
|       1004 | 用户评价该产品降噪效果好，续航能力强，一周充一次电。                                                         |
|       1001 | 买家普遍认为鞋子穿着舒适、外观好看且物流快，但鞋底偏硬且有轻微胶味。                                         |
|       1002 | 买家认为该榨汁杯小巧便携、出汁快且易清洗，但电池续航短且售后换货流程慢。                                     |
+------------+--------------------------------------------------------------------------------------------------------------+
```
