---
{
    "title": "Deploying with Docker",
    "language": "en"
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


This guide is about how to create a running image of Apache Doris using a Dockerfile. It allows for the quick pulling of an Apache Doris image to create and run a cluster, either with container orchestration tools or for a quick test.

## Prerequisites

**Overview**

Prepare the build machine before creating the Docker image. The platform architecture of this machine determines the platform architecture for which the Docker image will be applicable. For example, if you use an X86_64 machine, you should download the X86_64 Doris binary program, because the resulting image will only run on X86_64 platforms. The same applies to ARM64 platforms.

**Hardware**

Recommended configuration: 4 cores, 16GB memory.

**Software**

Docker version: 20.10 or later.

## Build image

### Preparation

**Dockerfile script writing**

- Choose a Docker Hub-certified OpenJDK official image as the base parent image. The recommended base parent image is: openjdk:8u342-jdk (JDK 1.8 version).
- Use embed scripts for FE startup, multi-FE registration, FE status checks, BE startup, BE registration in FE, and BE status checks.
- Avoid using the `--daemon` option to start the application within Docker, as it may cause issues during deployment with orchestration tools like Kubernetes (K8s).

**Methods to build**

About the Dockerfile script used for compiling the Docker image, there are two ways to load the Apache Doris binary package:

- Use `wget` or `curl` commands to download the package during compilation and then complete the Docker Build process.
- Pre-download the binary package to the build directory and load it into the Docker Build process using the `ADD` or `COPY` command.

The former method produces a Docker image of smaller size, but if the build fails, the download operation may be repeated, leading to longer build times. The latter method is suitable for environments with unstable network conditions. Here, we will provide an example using the second method.

### **Build** **FE** **Image**

1. Environment directory for building the FE image:

The build environment directory is as follows:

```Plain
└── docker-build                                    // Root directory 
    └── fe                                          // FE directory
        ├── dockerfile                              // Dockerfile script
        └── resource                                // Resource directory
            ├── init_fe.sh                          // Startup and registration script
            └── apache-doris-2.0.3-bin.tar.gz       // Binary package
```

2. Download binary package

Download the [official binary package](https://doris.apache.org/zh-CN/download/) or the compiled binary package, and replace the apache-doris package in `./docker-build/fe/resource` with it.

3. Write Dockerfile

```Bash
# Choose a base image
FROM openjdk:8u342-jdk

# Set environment variables
ENV JAVA_HOME="/usr/local/openjdk-8/"
ENV PATH="/opt/apache-doris/fe/bin:$PATH"

# Download the software into the Docker image
ADD ./resource/apache-doris-2.0.3-bin.tar.gz /opt/

RUN apt-get update && \
    apt-get install -y default-mysql-client && \
    apt-get clean && \
    mkdir /opt/apache-doris && \
    cd /opt && \
    mv apache-doris-2.0.3-bin/fe /opt/apache-doris/

ADD ./resource/init_fe.sh /opt/apache-doris/fe/bin
RUN chmod 755 /opt/apache-doris/fe/bin/init_fe.sh

ENTRYPOINT ["/opt/apache-doris/fe/bin/init_fe.sh"]
```

- Rename the file as `Dockerfile` and save it to the `./docker-build/fe` directory.
- For the FE execution script init_fe.sh, refer to [init_fe.sh](https://github.com/apache/doris/tree/master/docker/runtime/fe/resource/init_fe.sh) in the Doris source code library.

4. Perform build

Note that `${tagName}` should be replaced with the tag you need, such as: `apache-doris:2.0.3-fe`.

```Shell
cd ./docker-build/fe
docker build . -t ${fe-tagName}
```

### Build BE image

1. Environment directory for building the BE image:

```SQL
└── docker-build                                     // Root directory 
    └── be                                           // BE directory
        ├── dockerfile                               // Dockerfile script
        └── resource                                 // Resource directory
            ├── init_be.sh                           // Startup and registration script
            └── apache-doris-2.0.3-bin.tar.gz        // Binary package
```

2. Write Dockerfile

```PowerShell
# Choose a base image
FROM openjdk:8u342-jdk

# Set environment variables
ENV JAVA_HOME="/usr/local/openjdk-8/" 
ENV PATH="/opt/apache-doris/be/bin:$PATH"

# 下Download the software into the Docker image
ADD ./resource/apache-doris-2.0.3-bin.tar.gz /opt/

RUN apt-get update && \
    apt-get install -y default-mysql-client && \
    apt-get clean && \
    mkdir /opt/apache-doris && \
    cd /opt && \
    mv apache-doris-2.0.3-bin/be /opt/apache-doris/

ADD ./resource/init_be.sh /opt/apache-doris/be/bin
RUN chmod 755 /opt/apache-doris/be/bin/init_be.sh

ENTRYPOINT ["/opt/apache-doris/be/bin/init_be.sh"]
```

- Rename the file as `Dockerfile` and save it to the `./docker-build/be` directory.
- For the BE execution script init_be.sh, refer to [init_be.sh](https://github.com/apache/doris/tree/master/docker/runtime/be/resource/init_be.sh).

3. Perform build

Note that `${tagName}` should be replaced with the tag you need, such as: `apache-doris:2.0.3-be`.

```Shell
cd ./docker-build/be
docker build . -t ${be-tagName}
```

### Push the image to DockerHub or a private repository

Log in to DockerHub

```Plain
docker login
```

Upon successful login, a "Success" prompt will be displayed. After that, you can push the image.

```Shell
docker push ${tagName}
```

## Deploy Docker cluster

The following is a brief overview of how to quickly create a complete Doris testing cluster using the `docker run` or `docker-compose up` commands.

It is advisable to avoid containerized solutions for Doris deployment in production environments. Instead, when deploying Doris on Kubernetes (K8s), it is recommended to utilize the Doris Operator for deployment.

### Prerequisite

**Software**

| Software       | Version        |
| -------------- | -------------- |
| Docker         | 20.0 and later |
| docker-compose | 20.1 and later |

**Hardware**

| Configuration | Hardware | Maximum Running Cluster Size |
| ------------- | -------- | ---------------------------- |
| Minimum       | 2C 4G    | 1FE 1BE                      |
| Recommended   | 4C 16G   | 3FE 3BE                      |

**Execute the following command in the host machine:**

```Shell
sysctl -w vm.max_map_count=2000000
```

### Docker Compose

The required image varies depending on the platform. The following takes the `X86_64` platform as an example.

**Network mode**

Doris Docker supports two network modes:

- The HOST mode is suitable for deploying across multiple nodes, with one FE and one BE per node.
- The subnet bridge mode is suitable for deploying multiple Doris processes on a single node (recommended). If you want to deploy across multiple nodes, additional component deployments are required (not recommended).

For demonstration purposes, this section will only show scripts written for the subnet bridge mode.

**Interface description**

Since `Apache Doris 2.0.3 Docker Image`, the interface list for each process image is as follows:

| Process | Interface | Interface Definition | Interface Example |
| ------- | --------- | -------------------- | ----------------- |
| FE      | BE        | BROKER               | FE_SERVERS        |
| FE      | FE_ID     | FE node ID           | 1                 |
| BE      | BE_ADDR   | BE node informatioin | 172.20.80.5:9050  |
| BE      | NODE_ROLE | BE node type         | computation       |

Note that the above interfaces must be specified with relevant information; otherwise, the process will not start.

> The FE_SERVERS interface follows the rule: `FE_NAME:FE_HOST:FE_EDIT_LOG_PORT[,FE_NAME:FE_HOST:FE_EDIT_LOG_PORT]`
>
> The FE_ID interface should be an integer from `1` to `9`, where `1` represents the Master node.
>
> The BE_ADDR interface follows the rule: `BE_HOST:BE_HEARTBEAT_SERVICE_PORT`
>
> The NODE_ROLE interface should be `computation` or empty. When it is empty or any other value, it indicates a `mix` node.
>
> The BROKER_ADDR interface follows the rule: `BROKER_HOST:BROKER_IPC_PORT`

**Script template**

#### Docker Run command

1 FE & 1 BE command template

Note that you should replace `${INTERNAL_IP_OF_CURRENT_MACHINE}` with the internal IP of your current machine.

```Shell
docker run -itd \
--name=fe \
--env FE_SERVERS="fe1:${INTERNAL_IP_OF_CURRENT_MACHINE}:9010" \
--env FE_ID=1 \
-p 8030:8030 \
-p 9030:9030 \
-v /data/fe/doris-meta:/opt/apache-doris/fe/doris-meta \
-v /data/fe/log:/opt/apache-doris/fe/log \
--net=host \
apache/doris:2.0.3-fe-x86_64

docker run -itd \
--name=be \
--env FE_SERVERS="fe1:${INTERNAL_IP_OF_CURRENT_MACHINE}:9010" \
--env BE_ADDR="${INTERNAL_IP_OF_CURRENT_MACHINE}:9050" \
-p 8040:8040 \
-v /data/be/storage:/opt/apache-doris/be/storage \
-v /data/be/log:/opt/apache-doris/be/log \
--net=host \
apache/doris:2.0.3-be-x86_64
```

Download the Docker Run command template for 3 FE & 3 BE from [here](https://github.com/apache/doris/blob/master/docker/runtime/docker-compose-demo/build-cluster/rum-command/3fe_3be.sh) if needed.

#### Docker Compose scripte

1 FE & 1 BE template

Note that you should replace `${INTERNAL_IP_OF_CURRENT_MACHINE}` with the internal IP of your current machine.

```YAML
version: "3"
services:
  fe:
    image: apache/doris:2.0.3-fe-x86_64
    hostname: fe
    environment:
     - FE_SERVERS=fe1:${INTERNAL_IP_OF_CURRENT_MACHINE}:9010
     - FE_ID=1
    volumes:
     - /data/fe/doris-meta/:/opt/apache-doris/fe/doris-meta/
     - /data/fe/log/:/opt/apache-doris/fe/log/
    network_mode: host
  be:
    image: apache/doris:2.0.3-be-x86_64
    hostname: be
    environment:
     - FE_SERVERS=fe1:${INTERNAL_IP_OF_CURRENT_MACHINE}:9010
     - BE_ADDR=${INTERNAL_IP_OF_CURRENT_MACHINE}:9050
    volumes:
     - /data/be/storage/:/opt/apache-doris/be/storage/
     - /data/be/script/:/docker-entrypoint-initdb.d/
    depends_on:
      - fe
    network_mode: host
```

Download the Docker Compose command template for 3 FE & 3 BE from [here](https://github.com/apache/doris/blob/master/docker/runtime/docker-compose-demo/build-cluster/docker-compose/3fe_3be/docker-compose.yaml) if needed.

### Deploy Doris Docker

Choose one of the following deployment methods:

1. Execute the `docker run` command to create the cluster.
2. Save the `docker-compose.yaml` script and execute the `docker-compose up -d`command in the same directory to create the cluster.
