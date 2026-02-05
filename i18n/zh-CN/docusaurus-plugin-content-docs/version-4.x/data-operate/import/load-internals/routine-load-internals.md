---
{
    "title": "Routine Load导入原理及最佳实践",
    "language": "zh-CN",
    "description": "Routine Load 用于持续消费 Kafka 数据并写入 Apache Doris。用户可以通过创建 Routine Load Job，来自动订阅指定的 Kafka Topic。其核心特性包括："
}
---

## 1. 概述

Routine Load 用于持续消费 Kafka 数据并写入 Apache Doris。用户可以通过创建 Routine Load Job，来自动订阅指定的 Kafka Topic。其核心特性包括：

- **高可用：**支持 7×24 小时不间断消费 Kafka 数据，且故障恢复后可自动恢复运行。

- **低延迟：**Kafka 消息可实现秒级可见。

- **Exactly Once 语义：**确保消费 Kafka 数据不丢不重，实现精确一次消费。

本文将深入解析实现原理，给出典型场景的最佳实践，并提供常见问题的排查思路，帮助用户快速上手并高效运维。

## 2. 实现原理

Kafka 数据以流形式存在，Doris 以“微批”（micro-batch）方式消费 Kafka 流式数据。创建 routine load job 后，系统会根据配置的并发度将其拆分为多个 task 并发执行，每个 task 负责消费 Kafka topic 中特定 partition 的数据。每个 task 对应一个事务，执行完成后会生成新的 task 继续消费下一批数据。下文从 job/task 调度、Exactly Once 语义实现及一流多表三个角度进行说明。

### 2.1 作业（Job）与任务（Task）调度

Routine Load 采用两级调度：

- **Job 调度：** 负责任务拆分、故障恢复与生命周期管理。

- **Task 调度：** 负责将具体的数据拉取、转换与写入操作的任务分发到 BE 节点执行。

#### 2.1.1 Job调度

Job 状态机：

| 状态          | 含义                              |
| ------------- | --------------------------------- |
| NEED_SCHEDULE | 等待首次调度或需要重新调度        |
| RUNNING       | 正常消费中                        |
| PAUSED        | 主动或异常暂停，可自动恢复        |
| CANCELLED     | 因库/表被删除等不可恢复错误而终止 |
| STOPPED       | 手动停止且不可恢复                |

根据job状态不同，调度线程每周期（10s）执行以下动作：

- **NEED_SCHEDULE：** 获取 topic 元数据（partition 数、起始 offset）按

```Plain
taskNum = min(topic_partition_num,
              desired_concurrent_number,
              max_routine_load_task_concurrent_num)
```

拆分 task，并将 task 放入 `needScheduleTasksQueue`等待task调度线程开始调度。

- **RUNNING：** 周期获取 topic 元数据，若 partition 数变化立即重调度。

- **PAUSED:** 为了确保作业的高可用性，引入了auto-resume机制。在非预期暂停的情况下，Routine Load Scheduler 调度线程会尝试自动恢复作业。对于 Kafka 侧的意外宕机或其他无法工作的情况，自动恢复机制可以确保在 Kafka 恢复后，无需人工干预，导入作业能够继续正常运行。需要注意的是，存在三种不会自动恢复的情况：
  - 用户手动执行 PAUSE ROUTINE LOAD 命令。
  - 数据质量存在问题。
  - 无法自动恢复的情况，例如库表被删除。

  除了上述三种情况，其他暂停状态的作业都会尝试自动恢复。

- **CANCELLED / STOPPED：** 延迟回收资源。

#### 2.1.2 Task调度

**调度条件**

- task 未读到 partition 末尾，即仍然还有数据可以消费，以避免无效占用资源。

- 若上一次已读到 EOF，则距上次开始执行必须超过 `max_batch_interval`才会发起新一轮调度，目的是在消费速度大于生产速度条件下适当攒批，防止生成太多的小事务。

**负载均衡策略**

1. 优先选择当前运行 Task 数量最少的 BE。
2. 若多个 BE 的 Task 数相同，则优先复用已缓存 Kafka Consumer 的节点，以减少初始化开销。

**批边界**

任一条件满足即结束当前 task：

- 达到`max_batch_interval` 定义的时间。

- 达到`max_batch_rows`定义的行数。

- 达到`max_batch_size` 定义的bytes大小。

- 读取到 Kafka EOF，即消费到流末尾。

Task 结束后提交事务，并立即生成新 task 放入队列等待下一次调度，实现持续消费。

### **2.2 Exactly-Once 语义**

Routine Load 通过 “持久化消费进度” + “提交校验” 双重机制，确保 Kafka 数据不丢不重。

#### **2.2.1 持久化消费进度**

每个 task 在事务提交时，将消费进度（progress）随事务信息一起写入 FE 的 edit log，利用 Berkeley DB JE 同步给所有 FE Follower。Master 切换/重启后，进度信息依旧准确。

#### **2.2.2 提交校验**

当 Job 因手动暂停、切主或 topic 元数据变化被重调度时，可能短暂出现 两个 task 并发消费同一 partition 的场景。为防止重复写入：

- 每个 Job 在内存中维护 `routineLoadTaskInfoList`。

- task 提交前会校验自己是否仍在 `routineLoadTaskInfoList` 中，否则拒绝提交。

### 2.3 一流多表写入

一流多表用于单个 Routine Load Job 同时写入多张目标表，核心流程如下：

1. 规划阶段：由于目标表无法在创建 Job 时完全确定，执行计划会被延迟到运行时，由 BE 动态向 FE Master 获取。

2. 数据缓存：BE 先将数据缓存在本地的 multi-table pipe。如果缓存至 200 条记录，或5 张尚未请求执行计划的新表，就会发起执行计划请求并执行，防止数据积压。

3. 执行计划复用：同一事务内会复用已缓存的执行计划，事务间重新请求，保障元信息实时性。

## 3. 最佳实践

Routine Load 默认参数已满足绝大多数场景。以下三种情况需要手动调优：

| 场景               | 推荐修改参数                                       |
| ------------------ | -------------------------------------------------- |
| 低延迟需求         | 将 `max_batch_interval` 由 默认60 s 调小           |
| 小数据量、资源敏感 | 将 `desired_concurrent_number` 调小                |
| 高吞吐             | 将 `max_batch_interval` 由 默认60 s 调大至120-180s |

## 4. 常见问题排查

### 4.1 数据堆积

1. 通过`SHOW ROUTINE LOAD\G`查看任务状态：

- State 是否为 `RUNNING`，如果为其他状态，可查看 `ReasonOfStateChanged` 字段了解原因。

- OtherMsg 是否有报错信息。

2. 通过 BE 日志判断是否已触达吞吐上限

    搜索 `consumer group done` 日志，其中的 `left_time / left_rows / left_bytes` 会显示最先触发的阈值，进而针对性调大 `max_batch_size` 或 `max_batch_rows`：

    ```C++
    consumer group done: 894fc32d5b9d3e93-7387a02da6dafd88. consume time(ms)=34004, received rows=2679540, received bytes=2147484043, eos: 0, left_time: 25996, left_rows: 17320460, left_bytes: -395, blocking get time(us): 949236, blocking put time(us): 28730419, id=69616a41fc064f1e-a93ff0ddd217f0a0, job_id=48121487, txn_id=61763720, label=ods_hq_market_unique_jobs_0-48121487-69616a41fc064f1e-a93ff0ddd217f0a0-61763720, elapse(s)=34
    ```

    上例中 `left_bytes: -395` 表示 34 秒内就因 `max_batch_size` 到达上限而结束批次。此时可适当调大 `max_batch_size`，让单个批次在 `max_batch_interval` 内尽量满载，以提升吞吐。

3. 增加并发与吞吐量

- 将 `desired_concurrent_number` 提高到与 Topic 的 Partition 数一致。

- 适度增加 `max_batch_interval`（如 120 s ~ 180 s）/ `max_batch_size` /  `max_batch_rows` 以提升单事务数据量，增加单批次数据量，减少事务开销。

### 4.2 任务异常暂停

Routine Load 内置自动恢复机制，绝大多数非预期暂停都会重试。若任务持续处于 PAUSED 且无法自动恢复，可执行 `SHOW ROUTINE LOAD` 并排查：

- 是否手动执行 `PAUSE ROUTINE LOAD`。

- 是否存在数据质量问题（如格式错误、字段缺失）。

- Kafka数据是否已经过期报错`out of range`。