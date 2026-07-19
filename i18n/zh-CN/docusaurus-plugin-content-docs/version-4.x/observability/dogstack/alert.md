---
{
    "title": "告警与通知",
    "sidebar_label": "告警",
    "language": "zh-CN",
    "description": "如何在 DOG Stack 中基于 Apache Doris SQL 创建告警？本文介绍 Grafana Alerting 的告警规则创建、告警条件、Label、通知点配置与告警管理实践。",
    "keywords": [
        "Grafana Alerting",
        "Doris 告警",
        "告警规则",
        "告警通知",
        "告警条件",
        "Webhook",
        "Slack 告警",
        "邮件告警"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可观测性建设 / 告警规则配置与管理 -->

由于 DOG Stack 集成了 Grafana，你可以在 Grafana 中创建和管理告警。本文介绍最常用的告警操作，更丰富的告警功能请参考 [Grafana Alerting 文档](https://grafana.com/docs/grafana/latest/alerting/)。

如图所示，Grafana Alert 的核心机制如下：

1. 用户定义好告警规则，包括对应的查询和触发条件。
2. 系统定期执行告警规则中的查询，检查是否满足触发条件。
3. 如果满足触发条件，生成告警实例。
4. 发送告警，可以直接发送到联系方式或者经过通知策略进行灵活的路由。

![alert_overview](https://cdnd.selectdb.com/images/upload/dogstack/alert_overview.png)



一个典型的告警规则创建和管理如下：

**1.进入 Grafana Alerting 的 Alert rules 子页面，点击创建 Alert**

![alert_create](https://cdnd.selectdb.com/images/upload/dogstack/alert_create.png)



**2.定义告警的查询和触发条件**

首先选择数据源比如 Doris，Builder 模式下可以用可视化方式点选生成简单的查询，Code 模式下可以输入 SQL 构建复杂的查询。示例中在 Code 模式下查询最近10分钟内 otel.otel_logs 表中 body 字段匹配到关键词 'error' 的行数。

然后在 Expression 部分选择对上面查询的结果进行进一步聚合（可选）和设置触发告警的阈值，比如示例中设置 Threshold 是上面查询的结果大于 10，而进一步聚合没有作用。

最后点击 Preview 按钮可以预览查询的结果和是否触发告警条件。比如示例中查询结果是 882，触发了告警条件（大于阈值 10），因此显示状态 1 Firing。

更多详细介绍请参考 [Grafana 文档](https://grafana.com/docs/grafana/latest/alerting/alerting-rules/create-grafana-managed-rule/)。

![alert_condition](https://cdnd.selectdb.com/images/upload/dogstack/alert_condition.png)



**3.配置告警检查周期和组织方式**

首先选择一个目录方便组织管理告警，然后设置告警的执行间隔，最后选择告警 Pending 时间。示例中创建了一个每个1分钟执行的 evaluation group，选择了告警 Pending 时间 None，也就是告警触发后立即进入 Firing 状态，而不用等持续一段时间比如1分钟后才发出。

更多详细介绍请参考 [Grafana 文档](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/)。

![alert_evaluation](https://cdnd.selectdb.com/images/upload/dogstack/alert_evaluation.png)



**4.配置告警通知方式**

Grafana 支持很多场景的告警通知方式，比如 Email, Slack, Discord, PagerDuty, Webhook 等。你可以选择已有的通知方式或者创建自己的通知方式，你还可以进一步配置灵活的告警通知策略，通过 lable 进行告警通知路由。

更多详细介绍请参考 [Grafana 文档](https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/)。

![alert_lable](https://cdnd.selectdb.com/images/upload/dogstack/alert_lable.png)

![alert_contact](https://cdnd.selectdb.com/images/upload/dogstack/alert_contact.png)



**5.配置告警通知内容**

你可以定制告警通知的内容，包括 summary, description 和一个指导告警处理的 runbook URL，让接收告警的人更快理解发生了什么。

![alert_message](https://cdnd.selectdb.com/images/upload/dogstack/alert_message.png)



**6.告警管理**

告警规则创建成功后，你还可以对它们进行管理，包括暂停告警、静默通知一段时间、修改告警规则、修改告警通知方式等。

更多详细介绍请参考 [Grafana 文档](https://grafana.com/docs/grafana/latest/alerting/monitor-status/)。

![alert_management](https://cdnd.selectdb.com/images/upload/dogstack/alert_management.png)