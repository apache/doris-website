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
