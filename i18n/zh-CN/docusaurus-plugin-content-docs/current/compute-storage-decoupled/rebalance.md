---
{
    "title": "Cloud rebalance",
    "language": "zh-CN"
}
---

Cloud rebalance 是 Doris 在存算分离模式下，用于在不同 compute group 中的后端节点（backend）扩缩容后（长时间节点下线视为缩容），让集群读写流量重新达到负载均衡的操作。

## Balance 策略类型

:::caution

balance_type 功能在doris-3.1.3、doris-4.0.2以后支持。
这些版本之前只有fe全局配置enable_cloud_warm_up_for_rebalance，控制rebalance的时候是否带warm up task

:::

以下以向 compute group 扩容节点为例：

| 类型 | 新节点可服务时间 | 性能波动 | 技术原理 | 适用场景 |
| :--- | :---: | :---: | :-- | :-- |
| without_warmup | 最快 | 性能波动最大 | FE 直接修改分片映射；首次读写无 file cache，需要从 S3 拉取 | 需要新节点快速上线且对抖动不敏感 |
| async_warmup | 较快 | 可能有 cache miss | 下发 warm up 任务，成功或超时后再修改映射；在映射切换时尽力拉取 file cache 到新 BE，少量场景首次读仍可能 miss | 通用场景，性能可接受 |
| sync_warmup | 较慢 | 基本无 cache miss | 下发 warm up 任务，FE 确认完成后才修改映射，确保 cache 迁移 | 对扩容性能极度敏感，希望新节点已有 file cache |


## 用户接口
### 全局默认 balance type
FE 配置项：`cloud_default_rebalance_type = "async_warmup"`

### Compute group 维度配置
```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

#### 规则说明
1. 若 compute group 未配置 balance type，则使用全局默认值 `async_warmup`。
2. 若 compute group 已配置 balance type，则 balance 时优先使用该 compute group 的配置。

## FAQ

### 全局 rebalance type 查看与修改
- 查看：`ADMIN SHOW FRONTEND CONFIG LIKE "cloud_default_rebalance_type";`
- 修改：`ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");`（无需重启 FE）

### compute group 的 balance type 查看
`SHOW COMPUTE GROUPS;`，结果中的 `properties` 列包含 compute group 属性。

### 判断集群是否处于 tablet 稳定态
1. 通过 `SHOW BACKENDS` 查看各 BE 的 tablet 数是否接近。计算方法参考范围：  
   `(集群所有 tablet 数 / compute group BE 数) * 0.95 ~ (集群所有 tablet 数 / compute group BE 数) * 1.05`。其中 0.05 为 FE 配置 `cloud_rebalance_percent_threshold` 默认值，如需更均匀可调小该值。
2. 通过 FE metrics 中的 `doris_fe_cloud_.*_balance_num` 系列指标观察，若长时间无变化，说明 compute group 已趋于均衡。  
   `curl "http://feip:fe_http_port/metrics" | grep '_balance_num'`