pipeline {
    agent any

    tools {
        nodejs 'NodeJS 18'
    }

    environment {
        DOCKER_REGISTRY = 'ghcr.io/thatevilguy-237'
        IMAGE_NAME_FRONTEND = 'image-editor-frontend'
        IMAGE_NAME_BACKEND = 'image-editor-backend'
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                dir('FrontendImageUploading') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('server') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}", "./FrontendImageUploading")
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}", "./server")
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    docker.withRegistry('https://ghcr.io', 'github-registry-credentials') {
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}").push()
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}").push()
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
