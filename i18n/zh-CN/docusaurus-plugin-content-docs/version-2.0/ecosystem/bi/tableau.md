---
{
   "title": "Tableau",
   "language": "zh-CN"
}
---

## 介绍
Tableau 是一款轻量级数据可视化分析平台，它将数据运算与美观的图表完美地结合在一起，不要求用户编写代码，仅仅通过拖拽的方式就可以快速洞察数据；探索不同的视图，甚至可以轻松地将多个数据源组合在一起，完成数据展示、探索和分析工作。
## 前置条件
无论你的 Mac 采用 Intel 还是 Apple Silicon 架构，Tableau Desktop Mac 版需下载安装 Intel 版本，这是为了保证与 MySQL 驱动的兼容性。可通过 [Support Releases](https://www.tableau.com/support/releases)页面选择并下载 Intel 版本。

## 驱动安装
1. iODBC 安装  
    1. 关闭 Tableau Desktop  
    2. 从 [iODBC 官网](https://www.iodbc.org/dataspace/doc/iodbc/wiki/iodbcWiki/Downloads#Mac%20OS%20X)下载最新的 Driver Manager（mxkozzz.dmg）
    3. 安装下载好的 dmg 文件

选择 MySQL 5.x 的 ODBC 驱动安装，最新的 MySQL 驱动连接 Doris 会报错 Unsupported command 错误。
## 连接配置与使用
1. 点击 Tableau Desktop 主页，在连接数据源处选择MySQL

   ![main page](/images/bi-tableau-en-1.png)

2. 填写 Doris 服务器地址，端口等相关信息，正确填写后点击登录即可。

   ![sign in page](/images/bi-tableau-en-2.png)

3. 进入 Tableau 后选择对应的库表即可进行相关的罗盘处理。

   ![usage page](/images/bi-tableau-en-3.png)