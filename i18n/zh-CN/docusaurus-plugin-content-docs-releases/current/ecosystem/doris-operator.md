---
{
    "title": "Doris Operator",
    "language": "zh-CN",
    "description": "Doris Operator 版本发布说明。"
}
---

# Doris Operator

本文按版本倒序列出 Doris Operator 的版本发布说明。

## 25.8.0

来源：[Release Notes 25.8.0](https://github.com/apache/doris-operator/issues/472)

该版本为 DDC 增加了重要能力，包括 TLS 支持、PVC 扩容和 Pod 调试能力。同时，该版本改进了 Helm 支持、Pod 资源配置和可靠性。

### 功能与改进

- `dorisctl` 支持 TLS 访问。[#432](https://github.com/apache/doris-operator/pull/432)
- Operator 在 drop node 场景中支持使用 TLS。[#434](https://github.com/apache/doris-operator/pull/434)
- 改进 Helm chart 模板。[#452](https://github.com/apache/doris-operator/pull/452)
- Helm 和 Operator chart 支持通过 `values.yaml` 设置 Deployment 资源配额。[#462](https://github.com/apache/doris-operator/pull/462)
- Helm chart `kubeVersion` 兼容带预发布后缀的 Kubernetes 版本，例如 EKS 和 GKE 版本。[#463](https://github.com/apache/doris-operator/pull/463)
- 增加 DDC 调试能力。[#460](https://github.com/apache/doris-operator/pull/460) [#471](https://github.com/apache/doris-operator/pull/471)
- 为 BE Pod 增加 CPU 资源感知参数传递能力。[#464](https://github.com/apache/doris-operator/pull/464)
- DDC 支持 PVC 扩容。[#467](https://github.com/apache/doris-operator/pull/467)
- Init Container 自定义行为支持资源限制配置。[#469](https://github.com/apache/doris-operator/pull/469)

### Bug 修复

- 修复单元测试用例问题。[#430](https://github.com/apache/doris-operator/pull/430) [#433](https://github.com/apache/doris-operator/pull/433)
- 修复未关闭 SQL 连接导致的资源泄漏。[#437](https://github.com/apache/doris-operator/pull/437)
- 修复 FE PVC 信息收集问题。[#438](https://github.com/apache/doris-operator/pull/438)
- 修复错误日志信息、重复环境变量和其他代码缺陷。[#440](https://github.com/apache/doris-operator/pull/440) [#442](https://github.com/apache/doris-operator/pull/442) [#449](https://github.com/apache/doris-operator/pull/449)
- 修复 CVE 并更新安全依赖。[#453](https://github.com/apache/doris-operator/pull/453)
- 修复 MySQL SQL Client 结构定义映射问题。[#468](https://github.com/apache/doris-operator/pull/468)

### 可靠性

- DDC MetaService controller 复用 `BuildVolumesVolumeMountsAndPVCs` 构建 PVC，提升逻辑一致性。[#436](https://github.com/apache/doris-operator/pull/436)

### 下载

镜像格式请参考镜像仓库说明。

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)
- [matiasbertani](https://github.com/matiasbertani)
- [jonasbrami](https://github.com/jonasbrami)
- [gohalo](https://github.com/gohalo)
- [catpineapple](https://github.com/catpineapple)

## 25.7.0

来源：[Release Notes 25.7.0](https://github.com/apache/doris-operator/issues/423)

该版本改进了 drop node 对计算组重命名的兼容性和调试镜像构建，并修复 DDC Pod 信息挂载、PVC 单元测试及事件处理问题。

### 功能与改进

- drop node 操作兼容重命名后的计算组。[#417](https://github.com/apache/doris-operator/pull/417)
- 升级用于构建调试镜像的 Go 版本。[#424](https://github.com/apache/doris-operator/pull/424)

### Bug 修复

- 修正拼写错误。[#413](https://github.com/apache/doris-operator/pull/413)
- 修复 DDC 容器缺少 Pod 信息挂载的问题。[#415](https://github.com/apache/doris-operator/pull/415)
- 修复 PVC 构建单元测试失败的问题。[#420](https://github.com/apache/doris-operator/pull/420)
- 避免 `EventString` 为 nil 时出现空指针错误。[#422](https://github.com/apache/doris-operator/pull/422)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)

## 25.6.0

来源：[Release Notes 25.6.0](https://github.com/apache/doris-operator/issues/414)

该版本支持使用 `dorisctl` 管理存算分离 Doris 集群，并修复首次部署时未创建 PVC 的问题。

### 功能与改进

- 支持使用 `dorisctl` 管理存算分离 Doris 集群。[#412](https://github.com/apache/doris-operator/pull/412)

### Bug 修复

- 修复首次部署时未创建 PVC 的问题。[#410](https://github.com/apache/doris-operator/pull/410)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.3

来源：[Release Notes 25.5.3](https://github.com/apache/doris-operator/issues/408)

该版本改进了 DDC 部署的默认镜像和文档，并避免内部 reconcile annotation 出现在自定义资源中。

### 功能与改进

- 使用 BE 镜像作为默认 Init Container 镜像。[#405](https://github.com/apache/doris-operator/pull/405)
- 在 README 中增加两个功能说明。[#406](https://github.com/apache/doris-operator/pull/406)
- 增加适用于不同场景的 FoundationDB 使用示例。[#407](https://github.com/apache/doris-operator/pull/407)

### Bug 修复

- 避免仅用于 reconcile 状态检查的 annotation 出现在自定义资源中。[#404](https://github.com/apache/doris-operator/pull/404)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.2

来源：[Release Notes 25.5.2](https://github.com/apache/doris-operator/issues/403)

该版本改进了 DDC reconcile 和调试行为。

### 功能与改进

- `DorisDisaggregatedCluster` 状态已一致时避免重复 reconcile。[#399](https://github.com/apache/doris-operator/pull/399)
- 增加用于进入调试模式的 `apache.com.doris/runmode` annotation。[#400](https://github.com/apache/doris-operator/pull/400)
- 默认启用 `DorisDisaggregatedCluster` reconcile。[#402](https://github.com/apache/doris-operator/pull/402)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.1

来源：[Release Notes 25.5.1](https://github.com/apache/doris-operator/issues/398)

该版本为 DDC 增加 Kerberos 支持，并使存算分离组件的发布版本与 Operator 版本保持一致。

### 功能与改进

- DDC 支持 Kerberos。[#396](https://github.com/apache/doris-operator/pull/396)

### Bug 修复

- 使存算分离组件的发布版本与 Operator 版本保持一致。[#395](https://github.com/apache/doris-operator/pull/395)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.0

来源：[Release Notes 25.5.0](https://github.com/apache/doris-operator/issues/394)

该版本为存算分离集群增加 Workload Group 和 Helm chart 支持，同时改进 DDC 初始化，并修复镜像、权限和 MetaService 配置问题。

### 功能与改进

- 为存算分离 Doris 集群增加 Workload Group 支持。[#378](https://github.com/apache/doris-operator/pull/378)
- 支持 reconcile `DorisDisaggregatedCluster` 资源。[#379](https://github.com/apache/doris-operator/pull/379)
- 增加存算分离 Doris 集群的 Helm chart 支持。[#379](https://github.com/apache/doris-operator/pull/379) [#386](https://github.com/apache/doris-operator/pull/386) [#388](https://github.com/apache/doris-operator/pull/388) [#393](https://github.com/apache/doris-operator/pull/393)
- DDC 支持跳过默认系统初始化检查。[#389](https://github.com/apache/doris-operator/pull/389)

### Bug 修复

- 调整默认 Operator 镜像。[#377](https://github.com/apache/doris-operator/pull/377)
- 增加聚合 `ClusterRole`。[#380](https://github.com/apache/doris-operator/pull/380)
- 修复存算分离集群的 MetaService 副本数问题。[#382](https://github.com/apache/doris-operator/pull/382)

### 致谢

- [wdxxl](https://github.com/wdxxl)
- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.4.0

来源：[Release Notes 25.4.0](https://github.com/apache/doris-operator/issues/376)

该版本主要支持在 DCR 上挂载共享磁盘，并支持在 Helm chart 中配置 Pod annotations。

### 功能与改进

- 支持配置需要挂载到 Pod 的共享 PVC。[#375](https://github.com/apache/doris-operator/pull/375)
- Doris Helm chart 支持 Pod annotations。[#327](https://github.com/apache/doris-operator/pull/327)

### 致谢

- [catpineapple](https://github.com/catpineapple)
- [bluicezhen](https://github.com/bluicezhen)

## 25.3.0

来源：[Release Notes 25.3.0](https://github.com/apache/doris-operator/issues/371)

该版本改进了 `DorisCluster` 和 `DorisDisaggregatedCluster` 资源的 PersistentVolume 能力，修复了若干 Bug，并改进项目示例和 Helm 构建方式。

### 功能与改进

- 在 Makefile 中增加用于 Helm 发布的 Helm `make` 支持。[#362](https://github.com/apache/doris-operator/pull/362)
- 增加 DCR PersistentVolume 模板配置，并支持与配置文件联动。[#364](https://github.com/apache/doris-operator/pull/364)
- 增加 DDC PersistentVolume 自定义能力和 `PersistentVolume` 兼容性。[#369](https://github.com/apache/doris-operator/pull/369)

### Bug 修复

- 避免 PVC 名称中可能出现非法字符串。[#368](https://github.com/apache/doris-operator/pull/368)
- 修复存算分离 Doris 设置 `adminUser` 后扩容失败的问题。[#367](https://github.com/apache/doris-operator/pull/367)

### 其他变更

- 增加 DDC affinity 和密码配置示例。[#366](https://github.com/apache/doris-operator/pull/366)
- 删除未使用的 API 文档。[#370](https://github.com/apache/doris-operator/pull/370)

### 致谢

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.1

来源：[Release Notes 25.2.1](https://github.com/apache/doris-operator/issues/360)

该版本在 Helm chart 中增加存算分离集群资源，改进发布流程中的版本替换和镜像仓库，并修复 Helm chart 问题。

### 功能与改进

- 在 Helm chart 中增加用于部署存算分离集群的自定义资源。[#355](https://github.com/apache/doris-operator/pull/355)
- 将版本字段改为可在发布流程中替换的变量。[#354](https://github.com/apache/doris-operator/pull/354)
- 将镜像从 SelectDB 仓库迁移到 Apache 仓库。[#357](https://github.com/apache/doris-operator/pull/357)

### Bug 修复

- 回退 PR 354 中的部分变更。[#358](https://github.com/apache/doris-operator/pull/358)
- 修复 Helm chart 的 `apiVersion`。[#359](https://github.com/apache/doris-operator/pull/359)

### 致谢

- [xiacongling](https://github.com/xiacongling)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.0

来源：[Release Notes 25.2.0](https://github.com/apache/doris-operator/issues/351)

该版本增加了访问 Kerberos 保护的数据系统的能力，升级了 Go 和 controller-runtime 版本，改进运行时行为，修复 Bug，并更新文档。

### 功能与改进

- Operator 支持访问 Kerberos 保护的数据系统。[#336](https://github.com/apache/doris-operator/pull/336) [#348](https://github.com/apache/doris-operator/pull/348)
- 改进跳过 BE 初始化系统的逻辑，并向 Doris Core 增加环境变量。[#338](https://github.com/apache/doris-operator/pull/338)

### Bug 修复

- 修复等待 BE deployment 时可能触发 reconcile 的问题。[#341](https://github.com/apache/doris-operator/pull/341)

### 其他变更

- 更新 Operator Dockerfile 的基础镜像，并将 Go 版本改为 1.23。[#337](https://github.com/apache/doris-operator/pull/337) [#346](https://github.com/apache/doris-operator/pull/346)
- 将 Go 和 controller-runtime 从 alpha v1 更新到 v1。[#340](https://github.com/apache/doris-operator/pull/340)
- 将 `golang.org/x/net` 从 0.30.0 升级到 0.33.0。[#343](https://github.com/apache/doris-operator/pull/343)
- 更新 README 文件。[#344](https://github.com/apache/doris-operator/pull/344) [#345](https://github.com/apache/doris-operator/pull/345) [#347](https://github.com/apache/doris-operator/pull/347) [#349](https://github.com/apache/doris-operator/pull/349) [#350](https://github.com/apache/doris-operator/pull/350)

### 下载

- Operator 镜像：[Docker Hub](https://hub.docker.com/r/apache/doris/tags)，使用带 `operator` 前缀的 tag。
- Doris 镜像：[Docker Hub](https://hub.docker.com/r/apache/doris/tags)，使用带 `ms`、`fe` 和 `be` 前缀的 tag。

### 致谢

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.1.0

来源：[Release Notes 25.1.0](https://github.com/apache/doris-operator/issues/333)

该版本改进 BE 调度和配置更新，增加 controller 测试，修复 StatefulSet 准备逻辑，并将镜像 tag 迁移到 Apache 仓库。

### 功能与改进

- 为 BE 增加 FE 亲和性，使 Operator 优先将 BE 调度到运行 FE 的节点。[#328](https://github.com/apache/doris-operator/pull/328)
- 监听 ConfigMap 变更，并在启动配置变更后重启 Doris。[#331](https://github.com/apache/doris-operator/pull/331)
- BE 支持跳过默认系统初始化。[#321](https://github.com/apache/doris-operator/pull/321)
- 增加 controller 单元测试。[#322](https://github.com/apache/doris-operator/pull/322)

### Bug 修复

- 修复传递给 `prepareStatefulsetApply` 的参数。[#326](https://github.com/apache/doris-operator/pull/326)

### 其他变更

- 将所有镜像 tag 从 SelectDB 仓库迁移到 Apache 仓库。[#329](https://github.com/apache/doris-operator/pull/329)

### 致谢

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 24.2.0

来源：[Release Note 24.2.0](https://github.com/apache/doris-operator/issues/319)

该版本为 `DorisDisaggregatedCluster` 增加多 Secret 支持，并支持通过 decommission 缩容计算组中的 BE。同时，该版本改进 Arrow Flight SQL 端口暴露、资源清理、测试、文档和示例。

### 功能与改进

- 支持通过 decommission 缩容 DDC 计算组中的 BE。[#306](https://github.com/apache/doris-operator/pull/306)
- DDC 支持用户名、密码配置和多个 Secret。[#312](https://github.com/apache/doris-operator/pull/312)
- 将 Arrow Flight SQL 端口暴露为容器端口。[#295](https://github.com/apache/doris-operator/pull/295)
- 在存算分离 Service 中暴露 Arrow Flight SQL 端口。[#307](https://github.com/apache/doris-operator/pull/307)
- 扩充单元测试覆盖。[#315](https://github.com/apache/doris-operator/pull/315)
- 重构计算组资源清理逻辑。[#318](https://github.com/apache/doris-operator/pull/318)

### Bug 修复

- 修复删除计算组时的 SQL Client 行为。[#314](https://github.com/apache/doris-operator/pull/314)
- 修复 Service label。[#318](https://github.com/apache/doris-operator/pull/318)
- 修复 `UniqueId` 包含连字符时无法删除计算组的问题。[#318](https://github.com/apache/doris-operator/pull/318)
- 在集群更新期间缩容 FE 时增加安全检查。[#320](https://github.com/apache/doris-operator/pull/320)

### 其他变更

- 改进 README。[#303](https://github.com/apache/doris-operator/pull/303)
- 删除未使用的文件，包括已废弃的 Dockerfile 和 DDM 代码。[#309](https://github.com/apache/doris-operator/pull/309) [#314](https://github.com/apache/doris-operator/pull/314)
- 改进 `DorisDisaggregatedCluster` CRD 使用示例。[#313](https://github.com/apache/doris-operator/pull/313)

### 致谢

- [jonasbrami](https://github.com/jonasbrami)
- [hechao-ustc](https://github.com/hechao-ustc)
- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.1.0

来源：[Release Note 24.1.0](https://github.com/apache/doris-operator/issues/293)

该版本为 `DorisCluster` 增加 Workload Group 支持，引入滚动重启，并修复 FE 部署和访问问题。

Workload Group 需要使用 Apache Doris 2.1.7 或更高版本的官方镜像。对于更早的 Doris 版本，需要自行构建兼容镜像。

### 功能与改进

- 为 Doris BE 增加 Workload Group 支持。[#289](https://github.com/apache/doris-operator/pull/289)
- 支持滚动重启 Doris 集群。[#292](https://github.com/apache/doris-operator/pull/292)
- 更新 Makefile 中的 controller-gen 版本。[#275](https://github.com/apache/doris-operator/pull/275)
- 在 GitHub Actions 中增加许可证检查。[#278](https://github.com/apache/doris-operator/pull/278) [#279](https://github.com/apache/doris-operator/pull/279) [#280](https://github.com/apache/doris-operator/pull/280)
- 增加默认 Issue 模板。[#288](https://github.com/apache/doris-operator/pull/288)

### Bug 修复

- 修复 `DorisCluster` 资源中未设置 FE `electionNumber` 时的空指针错误。[#285](https://github.com/apache/doris-operator/pull/285)
- 修复 FE 访问地址，改为使用 Service 名称和 namespace。[#291](https://github.com/apache/doris-operator/pull/291)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.0.0

来源：[Release Note 24.0.0](https://github.com/apache/doris-operator/issues/272)

该版本引入 `DorisDisaggregatedCluster`（DDC）自定义资源，用于部署存算分离 Apache Doris 集群。同时，该版本通过 `DorisCluster`（DCR）扩展存算一体部署能力。

DDC 仅适用于 Apache Doris 3.0.2 或更高版本。

### 新功能

#### DorisDisaggregatedCluster

- 增加 FoundationDB 模块访问能力。[#186](https://github.com/apache/doris-operator/pull/186)
- 支持部署 MetaService 模块。[#194](https://github.com/apache/doris-operator/pull/194)
- 支持部署 FE 模块。[#199](https://github.com/apache/doris-operator/pull/199)
- 支持部署计算组模块。[#185](https://github.com/apache/doris-operator/pull/185) [#189](https://github.com/apache/doris-operator/pull/189) [#192](https://github.com/apache/doris-operator/pull/192) [#197](https://github.com/apache/doris-operator/pull/197)
- 为存算分离 Doris 组件增加镜像 entrypoint 支持。[#195](https://github.com/apache/doris-operator/pull/195) [#196](https://github.com/apache/doris-operator/pull/196)
- 支持缩容 FE。[#225](https://github.com/apache/doris-operator/pull/225)
- 支持缩容计算组并清理资源。[#238](https://github.com/apache/doris-operator/pull/238)
- 支持通过 SQL 接口缩容 FE。[#255](https://github.com/apache/doris-operator/pull/255)
- 支持通过 SQL 接口缩容计算组。[#256](https://github.com/apache/doris-operator/pull/256)

#### DorisCluster

- 通过 External Service 暴露 Arrow Flight SQL 端口。[#251](https://github.com/apache/doris-operator/pull/251)

### 功能改进

#### DorisDisaggregatedCluster

- 支持通过 `be.conf` 和 PVC 配置创建计算组。[#198](https://github.com/apache/doris-operator/pull/198)
- 改进 README 和 DDC 示例 YAML 文件。[#203](https://github.com/apache/doris-operator/pull/203) [#210](https://github.com/apache/doris-operator/pull/210) [#211](https://github.com/apache/doris-operator/pull/211) [#214](https://github.com/apache/doris-operator/pull/214)
- 将 README 示例更新为使用最新版本。[#220](https://github.com/apache/doris-operator/pull/220)
- 增加用于启用 DDC 部署的 Operator 开关。[#204](https://github.com/apache/doris-operator/pull/204)
- 增加 `SystemInitialization`，用于准备系统环境。[#212](https://github.com/apache/doris-operator/pull/212)
- 根据 Doris 命名变更同步计算组术语。[#215](https://github.com/apache/doris-operator/pull/215) [#245](https://github.com/apache/doris-operator/pull/245)
- 删除 MetaService 副本 CRD。[#227](https://github.com/apache/doris-operator/pull/227)
- 将 MetaService CRD 重构为 `DorisDisaggregatedCluster` CRD。[#234](https://github.com/apache/doris-operator/pull/234)
- 将计算组标识符改为新 SQL 接口使用的 `UniqueId`。[#239](https://github.com/apache/doris-operator/pull/239)
- 增加 FE SQL 镜像 entrypoint 和集群 ID 哈希值。[#249](https://github.com/apache/doris-operator/pull/249)
- 将 DDC 操作从 HTTP 接口迁移到 SQL 接口。[#254](https://github.com/apache/doris-operator/pull/254)
- 为 Pod liveness probe 增加 `timeoutSeconds`。[#257](https://github.com/apache/doris-operator/pull/257)
- 增加 `logNotStore`，使 FE 可以跳过创建日志 PVC。[#266](https://github.com/apache/doris-operator/pull/266)
- 更新 DDC 示例和文档。[#268](https://github.com/apache/doris-operator/pull/268)

#### DorisCluster

- 为 Pod liveness probe 增加 `timeoutSeconds`。[#257](https://github.com/apache/doris-operator/pull/257)

#### 其他变更

- 增加公共工具函数单元测试。[#226](https://github.com/apache/doris-operator/pull/226)
- 增加 resource model 和 controller model 单元测试。[#232](https://github.com/apache/doris-operator/pull/232)
- 更新用于 Artifact Hub 的 Helm chart 配置。[#244](https://github.com/apache/doris-operator/pull/244)
- 将组织名称从 SelectDB 改为 Apache。[#247](https://github.com/apache/doris-operator/pull/247)

### Bug 修复

#### DorisDisaggregatedCluster

- 修复 Pod affinity 和 StatefulSet PVC 指针处理问题。[#209](https://github.com/apache/doris-operator/pull/209)
- 修正 BE 默认存储路径。[#243](https://github.com/apache/doris-operator/pull/243)
- 修复首次部署期间重复的 `ms_token` 环境变量导致 Pod 重启的问题。[#259](https://github.com/apache/doris-operator/pull/259)
- 修复镜像 entrypoint 使用的 BE ConfigMap 路径。[#261](https://github.com/apache/doris-operator/pull/261)
- 修复 `electionNumber` 为 nil 时的部署问题，并避免 Service 持续更新。[#262](https://github.com/apache/doris-operator/pull/262) [#266](https://github.com/apache/doris-operator/pull/266)
- 修复重复 reconcile 问题。[#263](https://github.com/apache/doris-operator/pull/263) [#265](https://github.com/apache/doris-operator/pull/265)
- 修正 BE 默认缓存路径。[#266](https://github.com/apache/doris-operator/pull/266)

#### DorisCluster

- 避免升级 Operator 时重启 Doris Pod。[#226](https://github.com/apache/doris-operator/pull/226)
- 合并共享 Pod 环境变量数组时使用深拷贝。[#236](https://github.com/apache/doris-operator/pull/236)
- 修复跨 namespace 缩容 FE 时 MySQL Client 失败的问题。[#240](https://github.com/apache/doris-operator/pull/240)
- 修复 `electionNumber` 为 nil 时的部署失败问题。[#260](https://github.com/apache/doris-operator/pull/260)

#### 其他变更

- 修复 StatefulSet 的 resource model 单元测试。[#252](https://github.com/apache/doris-operator/pull/252)

### 致谢

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)
- [hechao-ustc](https://github.com/hechao-ustc)
