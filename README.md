# PSI Project – Private Set Intersection entre Clínicas

Este proyecto implementa un sistema de Private Set Intersection (PSI) entre dos clínicas médicas usando Node.js, TypeScript y Fastify.  
Permite conocer qué pacientes están en común, el tamaño de la intersección y la edad promedio, sin revelar el resto de los datos.

---

## Funcionalidades

- Intersección privada de conjuntos de pacientes  
- Cálculo del tamaño del conjunto común  
- Cálculo de estadísticos sobre la intersección  
- Servidores independientes para cada clínica  
- Interfaz web para ejecutar el protocolo  

---

## Tecnologías

- Node.js  
- TypeScript  
- Fastify  
- bigint-crypto-utils  
- Docker  
- HTML + Fetch  

---

## Instalación local

Instalar dependencias:

npm install

Ejecutar Clínica A:

npm run start:A -- --peer http://localhost:3002

Ejecutar Clínica B:

npm run start:B -- --peer http://localhost:3001

---

## Uso con Docker

Construir las imágenes:

docker compose build

Levantar los contenedores:

docker compose up

Clínica A: http://localhost:3001  
Clínica B: http://localhost:3002  

---

## Frontend

Los archivos del frontend están en la carpeta frontend:

- clinicaA.html  
- clinicaB.html  

Permiten ejecutar el protocolo PSI desde el navegador.

---

## Estructura del proyecto

src/  
datasets/  
frontend/  
dist/  
Dockerfile  
docker-compose.yml  
tsconfig.json  
package.json  

---

## Seguridad

- Los IDs nunca se envían en texto plano  
- Cada clínica posee su propio secreto privado  
- Solo se revela la intersección y sus estadísticos  
- Basado en SHA-256 y criptografía modular  

---

Proyecto desarrollado para el curso Introducción a la Criptografía Moderna.
