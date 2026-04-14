# Usamos una imagen de Java liviana
FROM eclipse-temurin:17-jdk-alpine
# Copiamos el archivo .jar que genera Spring Boot
COPY target/*.jar app.jar
# Comando para ejecutar la app
ENTRYPOINT ["java","-jar","/app.jar"]