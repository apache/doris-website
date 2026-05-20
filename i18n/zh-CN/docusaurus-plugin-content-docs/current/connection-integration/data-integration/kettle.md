---
{
    "title": "Kettle",
    "language": "zh-CN",
    "description": "介绍如何在 Kettle 中安装并配置 Kettle Doris Plugin，通过 Stream Load 将外部数据源同步到 Apache Doris。",
    "keywords": [
        "Kettle Doris Plugin",
        "Kettle 导入 Doris",
        "Stream Load",
        "数据同步 Doris"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据集成 / 通过 Kettle 将外部数据源写入 Doris -->

Kettle Doris Plugin 是 Doris 的 Kettle 插件，用于在 Kettle 中通过 Stream Load 将其他数据源的数据写入 Doris。

这个插件使用 Doris 的 Stream Load 功能进行数据导入，需要配合 Kettle 服务一起使用。当你已经使用 Kettle 进行 ETL 作业编排，并希望将 Kettle 支持的数据源写入 Doris 时，可以使用该插件完成数据同步。

## 关于 Kettle

[Kettle](https://pentaho.com/) 是一款开源的 ETL（Extract, Transform, Load）工具，最早由 Pentaho 公司开发。Kettle 是 Pentaho 产品套件中的核心组件之一，主要用于数据集成和数据处理，能够从各种来源提取数据，对数据进行清洗和转换，并将数据加载到目标系统。

更多信息请参阅 [Pentaho 官网](https://pentaho.com/)。

## 使用流程

使用 Kettle Doris Plugin 将数据写入 Doris 的流程如下：

| 步骤 | 用户目标 | 操作 |
| --- | --- | --- |
| 1 | 准备 Kettle 环境 | 下载并解压 Kettle，或自行编译 Kettle。 |
| 2 | 准备 Doris 插件 | 在 Doris 源码中编译 Kettle Doris Plugin。 |
| 3 | 安装插件 | 将编译后的 `doris-stream-loader` 插件复制到 Kettle 的 `plugins` 目录。 |
| 4 | 构建作业 | 在 Kettle 中选择 Doris Stream Loader，并配置 Doris 连接与导入参数。 |
| 5 | 运行同步 | 启动作业，将数据通过 Stream Load 写入 Doris。 |

## 准备 Kettle 环境

### 下载并启动 Kettle

1. 访问 [Kettle 下载页面](https://pentaho.com/download/#download-pentaho) 下载 Kettle。
2. 解压下载包。
3. 运行 `spoon.sh` 启动 Kettle。

### 自行编译 Kettle

如需自行编译 Kettle，请参考 [Pentaho Kettle 编译说明](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)。

## 编译并安装 Kettle Doris Plugin

### 编译插件

在 Doris 源码目录下进入 `extension/kettle`，然后编译插件：

```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```

### 安装插件

编译完成后，将插件包解压，并将 `doris-stream-loader` 复制到 Kettle 的 `plugins` 目录：

```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
```

## 构建并运行作业

### 构建 Doris Stream Loader 作业

在 Kettle 的批量加载中找到 Doris Stream Loader，并构建作业。

![在 Kettle 中创建 Doris Stream Loader 作业](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create_zh.png)

### 运行作业

点击开始运行作业，即可完成数据同步。

![在 Kettle 中运行 Doris Stream Loader 作业](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running_zh.png)

## 参数说明

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: Kettle Doris Plugin 作业配置 -->

下表说明 Doris Stream Loader 作业中的主要配置项：

| 参数 | 默认值 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `Step name` | -- | Y | 步骤名称。 |
| `fenodes` | -- | Y | Doris FE HTTP 地址，支持多个地址，使用英文逗号分隔。 |
| 数据库 | -- | Y | Doris 的写入数据库。 |
| 目标表 | -- | Y | Doris 的写入表。 |
| 用户名 | -- | Y | 访问 Doris 的用户名。 |
| 密码 | -- | N | 访问 Doris 的密码。 |
| 单次导入最大行数 | 10000 | N | 单次导入的最大行数。 |
| 单次导入最大字节 | 10485760 (10 MB) | N | 单次导入的最大字节大小。 |
| 导入重试次数 | 3 | N | 导入失败之后的重试次数。 |
| Stream Load 属性 | -- | N | Stream Load 的请求头。 |
| 删除模式 | N | N | 是否开启删除模式。默认情况下，Stream Load 执行插入操作；开启删除模式后，Stream Load 写入均为删除操作。 |

更多 Stream Load 参数请参考 [Stream Load 文档](../../data-operate/import/import-way/stream-load-manual.md)。

## 常见问题

### Kettle Doris Plugin 是否可以单独使用？

不可以。Kettle Doris Plugin 需要配合 Kettle 服务一起使用。

### `fenodes` 应该如何填写？

`fenodes` 填写 Doris FE HTTP 地址。如果有多个 FE 地址，可以使用英文逗号分隔。

### 删除模式会如何影响写入？

默认情况下，Stream Load 执行插入操作。开启删除模式后，Stream Load 写入均为删除操作。
