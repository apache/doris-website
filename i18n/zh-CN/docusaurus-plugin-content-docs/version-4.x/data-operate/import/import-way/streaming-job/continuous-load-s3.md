---
{
    "title": "S3 导入概览",
    "sidebar_label": "概览",
    "language": "zh-CN",
    "description": "了解 Doris Streaming Job 的 S3 导入能力，比较有序导入、通知导入和一次性导入的适用场景，查阅各模式完整操作指南、通用配置参数、作业监控、暂停恢复及故障排查方法。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "概览"
    ]
}
---

Doris 通过 **Streaming Job + S3 TVF** 将 S3 文件分批导入已有的 Doris 表。根据文件生成方式和是否需要持续运行，选择有序导入、通知导入或一次性导入。

## 选择导入模式

| 导入方式 | 模式 | 适用场景 | 结束条件 |
| --- | --- | --- | --- |
| [有序导入](./continuous-load-s3-ordered.md) | `ORDERED_LIST`（默认） | 文件名按字典序递增，如时间戳或补零序号 | 持续运行，无新文件时等待 |
| [通知导入](./continuous-load-s3-notification.md) | `NOTIFICATION` | 文件名为 UUID 或文件乱序到达，通过 AWS S3 事件和独占 SQS 队列发现新文件 | 持续运行，队列暂时为空时等待 |
| [一次性导入](./continuous-load-s3-one-time.md) | `ONE_TIME` | 已准备好的静态历史文件、独立批次回补 | 最后一批事务提交后进入 `FINISHED` |

通知导入不补导历史对象，且可能因重复通知而重复导入。三种模式均要求导入期间源对象可读且内容不变。各模式的准备步骤、SQL 示例、参数和使用限制见上表中的指南。

## 相关文档

- [Amazon S3 数据导入方式选型](../../data-source/amazon-s3.md)：比较 Streaming Job、S3 Load 和 TVF + INSERT。
- [持续导入通用操作](./continuous-load-overview.md#通用操作)：查看作业和 Task 状态，以及暂停、恢复和删除作业。
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)：创建语法和参数。
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)：修改作业的语法和限制。
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md)：S3 连接、凭证和文件格式配置。
