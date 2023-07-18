pipeline {
    agent {
        kubernetes {
            inheritFrom 'nodejs base'
            containerTemplate {
                name 'nodejs'
                image 'node:16.19.1'
            }
        }

    }
    stages {
        stage('拉取代码') {
            agent none
            steps {
                container('nodejs') {
                    git(url: 'https://github.com/bobo04020802/wenda-webui.git', credentialsId: 'github-secrit', branch: 'main', changelog: true, poll: false)
                    sh 'node -v'
                    sh 'ls -al'
                }

            }
        }

        stage('项目编译') {
            agent none
            steps {
                //dir('./wenda-webui'){
                    container('nodejs') {
                        //sh 'cd wenda-webui'
                        //sh 'ls -al'
                        //sh 'npm i node-sass --sass_binary_site=https://npm.taobao.org/mirrors/node-sass/ '
                        //sh 'npm install --registry=https://registry.npm.taobao.org'
                        //sh 'npm config set registry https://registry.npm.taobao.org'
                        //sh 'npm install --global yarn'
                        sh 'yarn config set registry https://registry.npm.taobao.org/'
                        sh 'npm -g config set user root'
                        sh 'yarn install --unsafe-perm=true --allow-root'
                        //sh 'chmod -R 777 /home/jenkins/agent/workspace/vopsvqfr6_wenda-webui_main/node_modules'
                        sh 'npm run build:pro'
                        sh 'ls -al'
                    }
                //}


            }
        }

        stage('构建镜像') {
            agent none
            steps {
                container('base') {
                    sh 'ls'
                    sh 'docker build -t wenda-webui:latest -f Dockerfile  ./'
                }

            }
        }

        stage('推送镜像') {
            agent none
            steps {
                container('base') {
                    withCredentials([usernamePassword(credentialsId : 'harber-docker-registry' ,usernameVariable : 'DOCKER_USER_VAR' ,passwordVariable : 'DOCKER_PWD_VAR' ,)]) {
                        sh 'echo "$DOCKER_PWD_VAR" | docker login $REGISTRY -u "$DOCKER_USER_VAR" --password-stdin'
                        sh 'docker tag wenda-webui:latest $REGISTRY/$DOCKERHUB_NAMESPACE/wenda-webui:SNAPSHOT-$BUILD_NUMBER'
                        sh 'docker push  $REGISTRY/$DOCKERHUB_NAMESPACE/wenda-webui:SNAPSHOT-$BUILD_NUMBER'
                    }

                }

            }
        }

        stage('部署到dev环境') {
            agent none
            //steps {
            //    kubernetesDeploy(configs: 'deploy/**', enableConfigSubstitution: true, kubeconfigId: "$KUBECONFIG_CREDENTIAL_ID")
            //}
			steps {
                        container ('base') {
                            withCredentials([
                                kubeconfigFile(
                                credentialsId: "$KUBECONFIG_CREDENTIAL_ID",
                                variable: 'KUBECONFIG')
                                ]) {
                                sh 'envsubst < deploy/deploy.yml | kubectl apply -f -'
                            }
                        }
                    }
        }

        //1、配置全系统的邮件：                   全系统的监控
        //2、修改ks-jenkins的配置，里面的邮件；   流水线发邮件
        stage('发送确认邮件') {
            //agent none
            steps {
                container ('base') {
                  mail(to: 'bobo04020802@126.com', subject: "$APP_NAME 构建结果", body: "$DOCKERHUB_NAMESPACE 中的 $APP_NAME 构建成功了 构建版本 $BUILD_NUMBER")
                }
            }
        }

    }
    environment {
        DOCKER_CREDENTIAL_ID = 'dockerhub-id'
        KUBECONFIG_CREDENTIAL_ID = 'demo-kubeconfig'
        REGISTRY = 'core.harbor.domain:30002'
        DOCKERHUB_NAMESPACE = 'his-cloud'
        GITHUB_ACCOUNT = 'kubesphere'
        APP_NAME = 'wenda-webui'
        ALIYUNHUB_NAMESPACE = 'his-cloud'
    }
}
