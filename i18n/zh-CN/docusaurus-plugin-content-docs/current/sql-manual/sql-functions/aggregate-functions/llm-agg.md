---
{
    "title": "LLM_AGG",
    "language": "zh-CN"
}
---

## 描述

根据用户提供的指令，通过大语言模型对特定列进行聚合操作

## 语法

`LLM_AGG([<resource_name>], <expr>, <instruction>)`

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<resource_name>` | 指定的资源名称, 可空。 |
| `<expr>` | 要执行聚合操作的文本列。 |
| `<instruction>` | 要执行的指令，仅接受字面量。 |

## 返回值

返回包含聚合结果的字符串。

当输入有值全为 NULL 时返回 NULL。

结果为大模型生成，所以返回内容并不固定。

## 举例

如下表模拟某个客服工单:
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

可以通过 `LLM_AGG` 总结不同问题类型下客户遇到的问题
```sql
SELECT
    subject,
    LLM_AGG(
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