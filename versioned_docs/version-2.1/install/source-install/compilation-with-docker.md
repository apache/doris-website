---
{
    "title": "Compiling with Docker (Recommended)",
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



This guide is about how to compile Doris using the official compilation image provided. As this image is maintained by the Apache Doris team and is regularly updated with the necessary dependencies, it is the recommended way of compilation for users.

## Install Docker

In CentOS, execute the following command: 

```Bash
yum install docker
```

Or refer to the [official Docker installation doc](https://docs.docker.com/engine/install/).

## Download build image

For different versions of Doris, you need to download different build images. The "apache/doris:build-env-ldb-toolchain-latest" image is used for compiling the latest master code, and it is regularly updated to align with the master.

| Image Version                                       | Doris Version |
| --------------------------------------------------- | ------------- |
| apache/doris:build-env-for-2.0                      | 2.0.x         |
| apache/doris:build-env-for-2.0-no-avx2              | 2.0.x         |
| apache/doris:build-env-ldb-toolchain-latest         | master        |
| apache/doris:build-env-ldb-toolchain-no-avx2-latest | master        |

Take Doris 2.0 as an example, download and check the correponding Docker image.

```Bash
# Choose docker.io/apache/doris:build-env-for-2.0
$ docker pull apache/doris:build-env-for-2.0

# Check if it is downloaded
$ docker images
REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

**Note:** 

- Download the right image version for the Doris version that you're working with. The image version number is aligned with the Doris version number. For example, you should use "apache/doris:build-env-for-2.0" to compile Doris 2.0.
- `apache/doris:build-env-ldb-toolchain-latest` is used for compiling the latest master code and is updated along with the master. You can check the update time in the `docker/README.md` file.
- Images with "no-avx2" in their names contain third-party libraries that can run on CPUs that do not support AVX2 instructions. Using these images, you can compile Doris with the "USE_AVX2=0".
- For information about changes in the compilation image, please see [ChangeLog](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md).
- The Docker compilation image includes both JDK 8 and JDK 17. You can check the default JDK version by running `java -version`, and switch between versions using the following commands. For versions earlier than 2.1 (inclusive), please use JDK 8. For versions later than 3.0 (inclusive) or the master branch, please use JDK 17.

```Bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## Compile Doris

### 1. Download Doris source code

Log in to the host machine and obtain the latest code from the Doris 2.0 branch via git clone.

```Plain
$ git clone -b branch-2.0 https://github.com/apache/doris.git
```

After downloading, assume that the source code path is in the "doris-branch-2.0" directory.

### 2. Run build image

```Plain
# Pre-build a Maven .m2 directory on the host machine to reuse the downloaded Java libraries in Docker.
mkdir ~/.m2 

# Run the build image
docker run -it --network=host --name mydocker -v ~/.m2:/root/.m2 -v ~/doris-branch-2.0:/root/doris-branch-2.0/ apache/doris:build-env-for-2.0  

# After successful execution, it should be in the Docker.
```

**Note:**

- It is recommended to run the image by mounting the local Doris source code directory. This way, the compiled binary files will be stored on the host machine and will not be lost when the container exits.
- It is also recommended to mount the `.m2` directory of Maven in the image to a directory on the host machine. This prevents repeated downloads of Maven dependencies each time the image is started for compilation.
- When running the image for compilation, if there is a need to download additional files, it is suggested to use the host mode. The host mode does not require the use of `-p` for port mapping and allows sharing the network IP and ports with the host machine.
- Below are explanations for some of the parameters used in the `docker run` command:

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| -v        | Mount a storage volume to a specific directory within a container. |
| --name    | Specify a name for the container to use the assigned name in future container management. |
| --network | Container network settings: "bridge" uses the Docker daemon's specified bridge network, "host" allows the container to use the host's network, "container:NAME_or_ID" uses the network of another container by sharing IP and port resources, "none" enables the container to use its own network (similar to --net=bridge) without any additional configuration. |

### 3. Execute the build

```Plain
# By default, it builds the AVX2 version.
$ sh build.sh

# If you need the no AVX2 version, add USE_AVX2=0.
$ USE_AVX2=0 sh build.sh

# To compile a debug version of BE, add BUILD_TYPE=Debug.
$ BUILD_TYPE=Debug sh build.sh
```

:::tip
**To check if the machine supports AVX2:**

$ cat /proc/cpuinfo | grep avx2
:::

After compilation, the output file is in the `output/` directory.

## Build your own development environment image

You can create a Doris development environment image by referring to the `docker/README.md` file.
