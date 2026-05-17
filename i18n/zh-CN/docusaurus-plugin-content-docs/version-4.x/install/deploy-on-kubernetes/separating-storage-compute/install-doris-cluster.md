---
{
    "title": "部署完整 Doris 存算分离集群",
    "language": "zh-CN",
    "description": "在 Kubernetes 上从零搭建一套可用的 Doris 存算分离集群的端到端教程：部署 FoundationDB、部署 Doris Operator、部署 Doris 集群、创建 Storage Vault。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "部署集群", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

本文面向首次在 Kubernetes 上搭建 Doris 存算分离集群的用户，提供从零部署到可写入数据的端到端教程。读完本文你将能够：

- 完成 FoundationDB（元数据存储）的部署或接入
- 在 Kubernetes 上部署 Doris Operator
- 通过 Doris Operator 部署一套完整的存算分离集群
- 通过 SQL 创建对象存储后端（Storage Vault）

## 部署成果

完成本教程后，你将得到一个由以下组件构成的 Doris 存算分离集群：

| 组件 | 说明 | 默认副本数 |
|------|------|-----------|
| FE | 负责 SQL 解析和协调 | 1 |
| MS (MetaService) | 元数据管理 | 1 |
| 计算组 (CG) | 数据导入和缓存 | 2 |
| FoundationDB | 元数据存储 | - |
| Storage Vault | S3 兼容对象存储 | - |

## 部署路径概览

整个流程按顺序分为 5 个步骤，每一步的输入与产出如下：

| 步骤 | 阶段目标 | 输入 | 输出 |
|------|----------|------|------|
| 第 1 步 | 部署 FoundationDB | K8s 集群 / 可用机器 | 可用的 FDB 集群 + 访问信息 |
| 第 2 步 | 部署 Doris Operator | K8s 集群访问权限 | 运行中的 Operator + CRD |
| 第 3 步 | 部署 Doris 存算分离集群 | `ddc-sample.yaml` + FDB 访问信息 | 运行中的存算分离集群 |
| 第 4 步 | 创建远程存储后端 | 运行中的集群 + S3 兼容对象存储凭证 | 可用于数据持久化的 Storage Vault |
| 第 5 步 | 连接集群并端到端验证 | 第 4 步建立的 MySQL 连接 | 通过读写验证的可用集群 |

完成第 4 步后集群即可写入数据，第 5 步通过 SQL 完成端到端验证。如需对 FE / MS / 计算组 做进阶定制，参见文末 [进阶配置](#进阶配置) 一节。

## 第 1 步：部署 FoundationDB

存算分离集群依赖 FoundationDB（FDB）存储元数据，部署前必须先准备好可用的 FDB。根据现有基础设施选择部署方式：

| 部署方式 | 适用场景 | 后续操作 |
|----------|----------|----------|
| 机器直接部署（推荐） | 已有可用物理机 / 虚拟机 | 参考 [存算分离 - 部署前准备](../../deploy-manually/separating-storage-compute-deploy-manually) 完成部署，确保部署机与 K8s 集群在同一局域网 |
| Kubernetes 上部署 | 希望统一在 K8s 中管理 FDB | 直接执行下方"K8s 快速部署" |

### K8s 快速部署（最简通道）

依次执行以下 4 步即可在 K8s 上拉起一个最简 FDB 集群（单副本）：

**1. 下发 FoundationDB CRD：**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. 部署 fdb-kubernetes-operator：**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. 部署 FoundationDB 集群（单副本最简模式）：**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. 验证 FDB 状态：**

```shell
kubectl get fdb
```

`kubectl get fdb` 返回的 `AVAILABLE` 列为 `true` 时，表示 FDB 集群已就绪。

:::tip 进阶选项
单副本模式仅适合开发测试。生产环境推荐使用两副本模式，并且 Kubernetes 集群至少需要三台宿主机。其他部署形态（两副本、生产部署、私有仓库镜像、FQDN 模式等）请参考 [部署 FoundationDB](install-fdb.md)。
:::

## 第 2 步：部署 Doris Operator {#配置-dorisdisaggregatedcluster-资源}
**输入**：Kubernetes 集群访问权限
**操作**：下发 CRD 资源定义，部署 Operator 及 RBAC 规则
**输出**：Doris Operator 运行在 `doris` namespace 中

### 1. 下发 CRD 资源定义

根据集群现状选择对应命令：

- **场景 A：首次部署（或只部署存算分离）**——下发全部 CRD：

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **场景 B：已部署过非存算分离集群**——仅追加存算分离相关的 CRD：

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. 部署 Operator 及 RBAC 规则

执行如下命令部署 Doris Operator 及其依赖的 RBAC 规则：

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

部署完成后检查 Operator Pod 状态：

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS` 为 `Running` 表示 Operator 已就绪。

## 第 3 步：部署存算分离集群

**输入**：部署样例 `ddc-sample.yaml` + FoundationDB 访问信息
**操作**：下载样例、按需修改关键字段、部署集群
**输出**：运行中的 Doris 存算分离集群

### 1. 下载部署样例

从 Doris Operator 仓库下载默认部署样例：

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 修改关键配置

样例下载后，至少需要修改以下两类字段才能部署，其余字段保留默认即可：

| 字段 | 必改 / 可选 | 说明 |
|------|-------------|------|
| `spec.metaService.fdb` | **必改** | 第 1 步部署的 FDB 访问信息（地址或 ConfigMap 二选一） |
| `spec.computeGroups[].image` | **必改** | BE 镜像版本，需匹配你期望的 Doris 版本 |
| `spec.metaService.image` | 可选 | MetaService 镜像版本，默认使用样例中的版本 |
| `spec.feSpec.electionNumber` | 可选 | FE Follower 数量，默认 1；**部署后不可修改** |
| `spec.computeGroups[].replicas` | 可选 | 计算组副本数，默认按样例 |
| `spec.feSpec.requests` / `limits` | 可选 | FE 计算资源限制（推荐生产环境配置） |

修改后的 `spec` 段大致如下（**方式 A：FDB 部署在机器上**）：

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}      # 必改：FDB 客户端访问地址（机器部署）
  feSpec:
    electionNumber: 1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}            # 必改：BE 镜像
      replicas: 2
      requests:
        cpu: 8
        memory: 8Gi
      limits:
        cpu: 8
        memory: 8Gi
```

**方式 B：FDB 部署在 K8s 上**——把 `metaService.fdb` 段替换为：

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # 必改：fdb-kubernetes-operator 生成的 ConfigMap 名（默认是 ${FDB 资源名}-config）
        namespace: ${namespace}               # 必改：ConfigMap 所在命名空间
```

ConfigMap 的获取方法可执行 `kubectl get configmap` 查看（详见 [部署 FoundationDB - 获取访问信息 ConfigMap](install-fdb.md#获取包含-foundationdb-访问信息的-configmap)）。

参数说明：

| 参数 | 说明 |
|------|------|
| `${fdbEndpoint}` | FoundationDB 客户端访问地址。Linux 虚机默认部署时存储在 `/etc/foundationdb/fdb.cluster`，详见 [FoundationDB cluster file 文档](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) |
| `${beImage}` | BE 镜像，请使用 [Apache Doris 官方镜像仓库](https://hub.docker.com/r/apache/doris) 提供的镜像 |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator` 生成的 ConfigMap 名称 |
| `${namespace}` | ConfigMap 所在命名空间 |

### 3. 部署并验证

```shell
kubectl apply -f ddc-sample.yaml
```

部署资源下发后，等待集群自动搭建完成。通过以下命令查询集群状态：

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**判定就绪标志：** `CLUSTERHEALTH` 为 `green` 且 `CGAVAILABLECOUNT` 等于 `CGCOUNT`。

## 第 4 步：创建远程存储后端

**输入**：运行中的 Doris 集群 + S3 兼容对象存储凭证
**操作**：通过 MySQL 客户端执行 SQL 创建并启用 Vault
**输出**：配置完成的存储后端，可用于数据持久化

集群启动成功后，需要通过 SQL 将一个对象存储注册为持久化存储后端（Doris 中称为 Vault），并设为默认 Vault，写入的数据才能持久化。

### 1. 获取 FE Service 的访问地址

通过以下命令查找可访问 FE 服务的 Service：

```shell
kubectl get svc
```

示例输出：

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

不带 `-internal` 后缀的 Service 用于外部访问。

### 2. 通过 MySQL 客户端连接

在 Kubernetes 集群中拉起一个包含 MySQL Client 的临时 Pod 并进入：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

在 Pod 内部使用 FE Service 名称连接 Doris 集群：

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. 创建 Storage Vault

通过 SQL 创建支持 S3 协议的对象存储作为 Vault。以下示例使用阿里云 OSS：

```mysql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
        "s3.region" = "bj",
        "s3.bucket" = "bucket",
        "s3.root.path" = "big/data/prefix",
        "s3.access_key" = "your-ak",
        "s3.secret_key" = "your-sk",
        "provider" = "OSS"
    );
```

其他存储后端的创建方法以及各字段详细说明，请参考存算分离文档中的 [管理 Storage Vault](../../deploy-manually/separating-storage-compute-deploy-manually)。

### 4. 设置默认 Storage Vault

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

其中，`${vaultName}` 为希望使用的 Vault 名称（如上一步中的 `s3_vault`）。

至此，集群已具备写入条件，下一步通过 SQL 完成端到端验证。

## 第 5 步：连接集群并端到端验证

**输入**：第 4 步建立的 MySQL 连接
**操作**：执行验证 SQL，确认集群已就绪并可正常读写
**输出**：通过端到端验证的可用集群

延续第 4 步中已建立的 MySQL 客户端连接（如已退出，重复 [第 4 步 - 通过 MySQL 客户端连接](#2-通过-mysql-客户端连接)），依次执行以下命令完成验证。

### 1. 确认 BE 节点存活

```mysql
SHOW BACKENDS;
```

输出中各 BE 节点的 `Alive` 列均为 `true`，表示计算组中的 BE 已就绪并被 FE 识别。

### 2. 确认 Storage Vault 已生效

```mysql
SHOW STORAGE VAULTS;
```

输出中能看到第 4 步创建的 Vault（如 `s3_vault`），且其 `IsDefault` 为 `true`，表示存储后端已就绪。

### 3. 写入并查询测试数据

依次执行如下 SQL，完成"建库 → 建表 → 写入 → 查询"的完整链路：

```mysql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE IF NOT EXISTS hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO hello VALUES (1, 'hello doris');
SELECT * FROM hello;
```

若 `SELECT` 返回写入的数据，表示 FE → MetaService → 计算组 → Storage Vault 端到端链路全部畅通，集群已可投入使用。

## 进阶配置

完成上述 5 步后，集群即可投入使用。生产场景下通常还需要按需做进一步定制，可按以下索引查阅对应文档：

| 关注点 | 参考文档 | 主要内容 |
|--------|----------|----------|
| FoundationDB 部署细节、两副本/生产模式、FQDN 部署、私有镜像仓库 | [部署 FoundationDB](install-fdb.md) | FDB 部署的完整原理与所有部署形态 |
| 切换 MetaService 镜像、调资源、定制启动参数、调存活探测超时 | [配置 MetaService](config-ms.md) | `spec.metaService.*` 全量字段 |
| 调 FE 资源、改 Follower 数量、自定义启动配置、配置访问模式（NodePort / LoadBalancer）、持久化存储 | [配置 FE](config-fe.md) | `spec.feSpec.*` 全量字段 |
| 单组/多组计算组、限制资源、配置访问模式、缓存与日志的持久化 | [配置计算组](config-cg.md) | `spec.computeGroups[*]` 全量字段 |
| 设置 root / 非 root 管理用户密码、Secret 凭证、挂载 Kerberos 认证文件 | [配置认证](config-cluster.md) | 集群级凭证与 Kerberos |
