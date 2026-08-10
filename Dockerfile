# Multi-stage Dockerfile for Spring Boot
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY backend/WebAppFacturacion/pom.xml .
COPY backend/WebAppFacturacion/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
