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
        UPLOAD_DIR="./app/uploads"
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
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
    stages {
        stage('Start MySQL Database') {
            steps {
                script {
                    // Start MySQL container using Docker Compose
                    withCredentials([
                        string(credentialsId: 'MYSQL_USER', variable: 'MYSQL_USER'),
                        string(credentialsId: 'MYSQL_PASSWORD', variable: 'MYSQL_PASSWORD'),
                        string(credentialsId: 'MYSQL_ROOT_PASSWORD', variable: 'MYSQL_ROOT_PASSWORD'),
                        string(credentialsId: 'MYSQL_DATABASE', variable: 'MYSQL_DATABASE')
                    ]) {
                        echo "Starting MySQL container with docker-compose"
                        sh '''
                            # Export environment variables for docker-compose
                            export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
                            export MYSQL_DATABASE=${MYSQL_DATABASE}
                            export MYSQL_USER=${MYSQL_USER}
                            export MYSQL_PASSWORD=${MYSQL_PASSWORD}

                            # Bring up the containers using docker-compose
                            docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
                        '''
                    }
                }
            }
        }

        stage('Wait for Database to be Ready') {
            steps {
                script {
                    echo "Waiting for MySQL database to be ready..."
                    // Wait for MySQL to be ready
                    sh '''
                        MAX_ATTEMPTS=20
                        COUNTER=0
                        while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                            echo "Attempt $((COUNTER+1)): Checking if database is up..."
                            if docker exec Database mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} -e "SELECT 1;" > /dev/null 2>&1; then
                                echo "Database is up and running!"
                                break
                            fi
                            COUNTER=$((COUNTER+1))
                            if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                                echo "Database failed to start after $MAX_ATTEMPTS attempts"
                                exit 1
                            fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        // Other stages like Build, Deploy, etc.
    }

       stage('Build Backend') {
    steps {
        dir('server') {
            sh 'npm install'
            echo 'Backend is a Node.js server, no build required'

            // Start the server in the background and capture logs
            sh '''
                # Create uploads directory
                echo "Upload directory set to: $UPLOAD_DIR"
                
                # Start server with output to log file
                node server.js > server.log 2>&1 & echo $! > .nodeTest
                
                echo "Starting server and waiting for it to be ready..."
                MAX_ATTEMPTS=20
                COUNTER=0
                
                while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                    echo "Attempt $((COUNTER+1)): Checking if server is up..."
                    
                    # Show the current server logs
                    echo "=== Server Logs ==="
                    cat server.log
                    echo "================="
                    
                    if curl -s http://localhost:3000/ > /dev/null; then
                        echo "Server is up!"
                        break
                    fi
                    
                    COUNTER=$((COUNTER+1))
                    if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                        echo "Server failed to start after $MAX_ATTEMPTS attempts"
                        cat server.log
                        exit 1
                    fi
                    echo "Server not ready, waiting 2s..."
                    sleep 2
                done
                
                # Test main page
                echo "Testing main page..."
                curl -f http://localhost:3000/ || exit 1
                
                # Test gallery page
                echo "Testing gallery page..."
                curl -f http://localhost:3000/gallery.html || exit 1
                
                # Test API endpoint
                echo "Testing API endpoint..."
                curl -f http://localhost:3000/api/hello || exit 1
                
                # Cleanup
                kill $(cat .nodeTest)
                rm .nodeTest server.log
                rm -rf uploads
            '''
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
