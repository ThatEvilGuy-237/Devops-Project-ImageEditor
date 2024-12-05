pipeline {
    agent any

    tools {
        nodejs 'node 18'
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
                    echo 'Frontend is static html page. no need for build -_-'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('server') {
                    sh 'npm install'
                    echo 'Backend is a Node.js server, no build required'
                    
                    // Start the server in the background
                    sh 'node server.js & echo $! > .nodeTest'
                    
                    // Wait for server to start and test it
                    sh 'sleep 6'
                    sh '''
                        # Test main page
                        echo "Testing main page..."
                        curl -f http://localhost:3000/ || exit 1
                        
                        # Test gallery page
                        echo "Testing gallery page..."
                        curl -f http://localhost:3000/gallery.html || exit 1
                        
                        # Test API endpoint
                        echo "Testing API endpoint..."
                        curl -f http://localhost:3000/api/hello || exit 1
                    '''
                    
                    // Stop the server
                    sh 'kill $(cat .nodeTest) && rm .nodeTest'
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
