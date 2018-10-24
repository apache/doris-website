# Doris 网站修改编辑说明

目前第一个版本主要内容来自于 github 的wiki。

## 1 基本信息
### 1.1 网站地址

<http://doris.apache.org>

<http://doris.incubator.apache.org>

### 1.2 网站源码

<https://github.com/apache/incubator-doris-website>

## 2 编辑修改网站

### 2.1 先决条件

网站是通过 JBake 工具和一个 Groovy 模板建立的。
因此必须事先安装 JBake 和 JDK。

JBake 工具下载安装地址和相应说明请参考：
<https://jbake.org/download.html>

### 2.2 下载源码到本地

github地址：

<https://github.com/apache/incubator-doris-website>

### 2.3 编辑修改

此网站的源码中将内容和模板分开来。

网页的形式是通过 templates 中定义的 gsp 文件模板规定的。

网页的内容则存放在 pages 目录中。

一般编辑修改直接修改 pages 中的文件就行。其中 Documents 菜单中的内容是 pages/guides 中的内容决定的。

网站源码中比较重要的目录文件列出如下：

```
.
├── README.md                               // 网站源码的说明
├── assets                                  // 这里主要是css和图片素材资源
│   ├── css
│   └── images                              // 所有的图片：jpg或者png
│       └── apache-incubator-logo.png
├── bake.sh                                 // 本地编译和启动网站脚本
├── build_site.sh                           // 自动编译和提交，会调用bake.sh
├── incubator-site-groovy.iml
├── jbake.properties                        // JBake 属性定义
├── pages                                   // 网站内容： ad和md分别对应ASCII码文档和markdown文档
│   ├── community.ad
│   ├── downloads.ad
│   ├── faq.ad
│   ├── guides                              // 当前的配置下，这个目录下的文件会自动加载，参看menu.gsp
│   │   ├── sql_reference.ad
│   │   └── tutorial.ad
│   ├── index.ad                            // 主页
│   └── whoweare.ad
└── templates                               // 模板所在目录
    ├── archive.gsp
    ├── feed.gsp
    ├── footer.gsp
    ├── guide.gsp
    ├── header.gsp
    ├── homepage.gsp
    ├── menu.gsp                           // 这个是主菜单配置
    ├── page.gsp
    ├── simplepage.gsp                     // 目前大部分网页依赖的模板
    ├── sitemap.gsp
    └── tags.gsp
    
```

### 2.4 在本地测试

通过下面的命令可以编译，并在本地启动网站服务，之后就可以通过 http://localhost:8820/ 访问了。

```
sh bake.sh -b -s .
```


## 3 上线
### 3.1 提交修改
上线的源代码必须 push 到 github 下面仓库的 master 分支上去：

<https://github.com/apache/incubator-doris-website>

两种方式：自己提交或者提交 pull request

目前有两个分支：master 和 asf-site
前者是源代码，后者是部署目录。

### 3.2 编译和上线
sh build_site.sh 编译网站自动提交上线，之后就可以查看更新了。


