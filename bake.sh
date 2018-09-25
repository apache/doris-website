#!/bin/bash

java -Djavax.xml.accessExternalDTD=http -jar "${JBAKE_HOME}/jbake-core.jar" $@
