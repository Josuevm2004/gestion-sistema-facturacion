# Stage 1: Build JAR with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
ENV MAVEN_OPTS="-Xms64m -Xmx384m"
RUN mvn clean package -DskipTests

# Stage 2: Runtime image with Java 17 + Python 3 Financial Engine
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-psycopg2 py3-pandas py3-openpyxl
COPY --from=build /app/target/*.jar app.jar
COPY python ./python
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
