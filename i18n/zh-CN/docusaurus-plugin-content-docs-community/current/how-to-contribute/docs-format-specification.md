---
{
    "title": "文档格式规范",
    "language": "zh-CN"
}

---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

本篇文档格式规范主要介绍：

1. 文档文件名、URL、排版等基础格式规范

2. 文档内容推荐可用渲染元素

:::caution 注意

- 不论是历史版本的文档或最新版本文档，皆在 [apache/doris-website](https://github.com/apache/doris-website) 代码库上提交 PR 修改。

- 如需提交文档修改，可以参阅 [文档贡献指南](https://doris.apache.org/zh-CN/community/how-to-contribute/contribute-doc) 。
:::

## 基础格式规范

### 01 文件命名与 URL 命名

文档名应对应文档内容进行简要概括，不宜过长。

Doris 官网文件名亦为 URL 命名，因此此处主要针对文件名与对应 sidebars.json 的相关规范：

- 文件名需与 sidebars.json 文档命名相同

- 文件名使用全小写单词，禁止大小写混用，无需添加标点符号

- 文件名由多个英文单词组成时，单词中间由短划线“-”隔开，不建议使用下划线“_”

- 当特定的函数为下划线时，依据函数习惯命名

### 02 英文大小写形式规范

- **标题首个单词的首个字母大写**，除专有名词外其余单词均小写。

- 中文句子中夹有英文单词或者词组时主要依据**驼峰命名法**书写，**专有名词依据习惯书写（参考下方专有名词使用规范）** 

- 中文文档尽量统一使用中文表述，除特有词组或单词可以使用英文。英文文档同样要求。

### 03 英文专有名称使用规范（**欢迎持续补充）**

针对中文文档中指称国外公司品牌、产品名称、技术专业词语等，无中文官方译名时，建议直接使用英文指称，且必须使用正确的大小写形式

| 无中文官方译名        |
| --------------------- |
| GitHub                |
| SQL                   |
| CPU                   |
| FE                    |
| BE                    |
| HTTP                  |
| MySQL                 |
| MongoDB               |
| Elasticsearch         |
| Azure                 |
| AWS                   |
| S3                    |
| Doris Manager         |
| WebUI                 |
| Flink Doris Connector |

### 04 SQL 函数与 SQL 手册规范

- SQL 函数名全部大写，字符之间依据语法习惯使用下划线“_”分割，如“ARRAY_MAX”，“DIGITAL_MASKING”；

- SQL 手册中 DML、DDL、Data Type、Cluster Management 等使用大写，字符之间使用半角空格分割，如“ALTER CATALOG”，“SELECT * FROM”；

- 举例引用可使用小写，如“col_name1”，"sample_value" 等；

SQL 函数文档排版请参考文档贡献指南-**[如何编写命令帮助手册](https://doris.apache.org/zh-CN/community/how-to-contribute/contribute-doc#如何编写命令帮助手册)**

### 05 缩略语规范

缩略语有两种：中文缩略语与英文缩略语，请遵循以下规范

**中文缩略语：**只需要保证该缩略语通俗易懂、不造成其意即可，建议该词第一次出现时说明情况，提示用户按照以下缩略语形式称呼该词

**英文缩略语**

- 禁止在标题中解释英文缩略语

- 建议在正文中第一次出现缩略语的地方解释其完整含义，如 Tablet & Partition（以下文档简称：分区与分桶）

- **禁止使用不规范的缩略语**

:::tip 
- 错误：16c32g

- 正确：16 核、32 GB

- 错误：10w

- 正确：10 万
:::

## 文档结构规范

### 01 标题

合理的标题层级与标题描述能够帮助用户理清整篇文档的逻辑，使文章结构一目了然。

**1. 标题层级**

技术文档标题最多不超过两级。**正文标题从 `##` 开始递增使用，禁止跳级使用**

- 一级标题：文章标题，使用 ` { "title": "", "language": ""}`编写。**禁止使用 `#` 定义文章标题**

- 二级标题：文章正文部份的标题，使用`##` 编写

- 三级标题：二级标题下面以及的小标题，使用 `###` 编写

```Markdown
{
    "title": "文档标题（即 # 一级标题）",
    "language": "zh-CN"
}


## 二级标题

### 三级标题
```


**2. 标题描述结构**

技术文档的标题包括但不限于以下几种描述：

- 名词词组，如“高并发点查原理”

- 主题词 + 动词，如“Docker 部署”

- 动词 + 主题词，如“配置文件目录”

- 定语 + 主题词，如“表结构的变更”、“Flink-Doris-Connector 的使用指南”

- 介词 + 定语 + 主题词，如“基于 Doris-Operator 部署”

**3. 其他注意事项**

标题描述无严格模版，仅需要遵循以下几个原则：

- 能够概括反映本章节的中心内容、简明扼要

- 同级别的标题尽量使用相同的结构

- **下级标题禁止重复上级标题的内容**

- **标题不以标点符号结尾**

- 标题不解释缩略语

### 02 导语

**导语出现在正文开始之前，需高度概述文档内容，并尽量控制在 150 字以内。**

可以参考以下两种书写方式：

- XXX 是什么，如“数据导出（Export）是 Doris 提供的一种将数据导出的功能，该功能可以....”

- 本文档主要介绍 XXX，如“本文主要介绍数据导出（Export）基本原理、使用方式、最佳实践以及注意事项”

## 文档内容元素（供参考）

### 01 Tab 使用

技术文档经常使用 Tab 键和空格键进行缩紧和对齐。因此建议：

- 使用 Tab 缩进，禁止混用 Tab 和空格进行缩进

- 在 Visual Studio Code 等编辑器中统一设置一个 Tab 等于四个半角空格

### 03 空格使用

- 英文、数字与中文需要前后半角空格

- 代码框与中文需要前后半角空格

- **括号内**不加空格、**括号外**前后加入半角空格

:::tip
批量添加半角空格工具：https://github.com/huacnlee/autocorrect 
:::

### 04 有序和无序

有序与无序通常在技术文档正文中使用，有序通常强调文本间顺序优先级，在使用中有序与无序需遵循以下规范

- **有序文本建议使用 `\1. 有序文本加粗\ `，使文本与上级层级对齐无缩进。**

- 有序文本涵盖无序文本时，有序文本需加粗，无序文本不需要加粗

### 05 链接

文档中的链接设置主要为了引导用户浏览相邻文档或者外部站点，在链接设置（锚文本）编写中建议遵循以下规范：

- **链接描述：**  同类型的链接描述应尽量统一风格，同一文档内不宜多次出现“详情参见”、“详情参阅”、“具体请见”等词语

- **链接格式**
  
  - 链接至同一文档中的其他标题：[倒排索引]（# 前缀索引）
  
  - 链接至相邻文档：[BITMAP 索引]（../data-table/index/bloomfilter）
  
  - 链接至外部站点：[维基百科 - Inverted Index]（https://en.wikipedia.org/wiki/Inverted_index）

- **链接路径**

  - 建议同一文档下统一使用相对路径或者绝对路径，不建议混用

  - **建议减少至外部站点的次数，以避免外部站点页面失效影响用户体验，**如必须将用户链至外链，建议提示用户将前往外部站点，如“点击前往 XXX”

### 06 代码块和代码注释

插入代码块建议遵循以下规范：

- 行内代码，使用反引号 ``` 创建，多行代码使用三个反引号 创建。

- 行内代码块前后加上空格、多行代码与正文空一行

- **代码块注意缩进，如在有序文本、列表项等内容之下，需要在该内容层级的缩近基础上缩近** 

- 当使用多行代码时，建议**增加代码围栏，指定代码块语言，从而支持对应语法高亮**。常见语言以及对应代码围栏中的指定方式具体如下：

   | 代码类型                                | 代码围栏指定方式         |
    | :-------------------------------------- | :----------------------- |
    | Shell 脚本                              | ```shell``` 或 ```bash```  |
    | Python 代码                             | ````python```              |
    | JSON 代码                               | ````json```                |
    | XML 文档                                | ````xml```                 |
    | SQL 查询（请使用小写 sql 否则渲染失败） | ````sql```                |
    | YAML 文件                               | ````yaml``` 或```yml```      |
    | Markdown 文本                           | ```markdown``` 或```md```  |
    | JavaScript 代码                         | ```js```或```javascript``` |
    | Java 代码                               | ```java```              |
    | C++ 代码                                | ```cpp```                 |
    | C 代码                                  | ```c```                   |
    | Ruby 代码                               | ```ruby```                |
    | HTML 代码                               | ```html```                |
    | CSS 代码                                | ```css```                 |
    | PHP 代码                                | ```php```                |

- 当使用 ```bash``` 代码时，写入命令与输出结果需分开编写。下面以 Kubernetes 集群访问文档为例：

  - 使用以下命令查看相应 Service：

    ```Bash
    kubectl get pod --namespace doris
    ```

  - 返回结果如下
  
    ```Bash
    NAME                     READY   STATUS    RESTARTS   AGE
    doriscluster-helm-fe-0   1/1     Running   0          1m39s
    doriscluster-helm-fe-1   1/1     Running   0          1m39s
    doriscluster-helm-fe-2   1/1     Running   0          1m39s
    doriscluster-helm-be-0   1/1     Running   0          16s
    doriscluster-helm-be-1   1/1     Running   0          16s
    doriscluster-helm-be-2   1/1     Running   0          16s
    ```

### 07 注释说明

注释说明在技术文档中起强调作用。在使用中，需遵循以下规范：

- 根据提示内容，可以将注释分为“提示”、“备注”、“注意”三类。注释框标题与使用场景请遵循以下规范：
 
  - 提示：主要用于操作技巧提示
 
  - 备注：用于补充内容补充解释
 
  - 注意：用于操作、注意事项警告

- 提示框内容可以使用有序、无序、代码块


下面是 Markdown 文档中注释说明示例：

```Markdown
:::tip 提示
这是一条提示
:::

:::info 备注
这是一条备注
:::

:::caution 注意
这是一条注意事项
:::
```

### 08 图片

插入图片建议遵循以下规范：

- 图片的命名建议使用描述性文字，如 "Broadcast Join 原理"

- 插入图片时**需添加替代文本 Alt**，建议使用` ![Alt 文本描述](图片地址) `

- 如需图片居中，可使用：

```Markdown
 <div style={{textAlign:'center'}}>
 <img src="图片地址" alt="文本描述" style={{display: 'inline-block'}}/>
 </div >
```

### 09 表格

如需在表格内进行换行，可以使用代码 `<p>XXXX</p>`

### 10 折叠框

折叠框用于三级标题后，当出现内容层级过多时，可以使用折叠框进行区分。

在使用中，需遵循以下规范：

- 使用代码为 `<details><summary>折叠框标题</summary> 折叠框内容</details>`

- 折叠框注意缩进，三级标题下以顶格开始

下图是 Markdown 中折叠框的示例：

```Markdown
<details>
<summary>这里填写标题</summary>
这里是折叠框内容
<p>如需换行，可以使用 HTML 标签控制</p>
<p>XXXXXXXX</p>
</details>
```

### 11 Tab 选项卡

选项卡用于三级标题后，当文档内容层级过多时，可以是使用 Tab 选项卡容器。

在使用该功能时，需遵循以下规范：

- 选项卡注意缩进，三级标题下以顶格开始

- 使用时需参考以下语法：

```Markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="内容标题 1" label="内容标题 1" default>
    <p>内容 1 </p>
    <p>内容 2 </p>
  </TabItem>
  <TabItem value="内容标题 2" label="内容标题 2" default>
    <p>内容 1 </p>
    <p>内容 2 </p>
  </TabItem>
</Tabs>
```

### 12 版本标签

在新版文档中，**不建议使用版本标签区分多文档版本。** 如部分功能需区分版本，可以使用注释说明 (参考第六点) `:::tip :::`标注。

### 13 引用块

在新版文档中，**不建议使用 ` > ` 引用符号**进行内容描述或嵌套。如需说明备注，可使用注释说明（参考第六点）`:::info :::` 标注。