# PSI Project – Private Set Intersection entre Clínicas con Oblivious

Este proyecto implementa un sistema de **Private Set Intersection (PSI)** entre dos clínicas médicas utilizando **Node.js, TypeScript y Fastify**, incorporando un **tercer servicio Oblivious** que actúa como intermediario criptográfico con **clave secreta propia**.

El sistema permite conocer:

- Qué pacientes están en común  
- El tamaño de la intersección  
- La edad promedio de los pacientes en común  

Todo esto **sin revelar los datos fuera de la intersección**, y **sin que el Oblivious conozca los IDs reales**.

---

## Funcionalidades

- Intersección privada de conjuntos de pacientes  
- Cálculo del tamaño del conjunto común  
- Cálculo de estadísticos sobre la intersección (promedio de edad)  
- Dos servidores independientes (Clínica A y Clínica B)  
- Un servidor Oblivious con clave secreta K  
- Doble cegado criptográfico de los identificadores  
- Interfaz web independiente para cada clínica  
- Protección contra ataques de fuerza bruta sobre IDs  

---

## Arquitectura del Sistema

El sistema se compone de **tres servicios**:

- **Clínica A**: Posee su conjunto de pacientes y un secreto privado `a`  
- **Clínica B**: Posee su conjunto de pacientes y un secreto privado `b`  
- **Oblivious**: Servicio intermedio con clave secreta `K`  

Flujo simplificado:

1. Cada clínica calcula valores cegados de sus IDs con su secreto.
2. Envía esos valores al Oblivious.
3. El Oblivious vuelve a cegar usando su secreto `K`.
4. Las clínicas re-exponentian esos valores.
5. Se comparan los resultados finales.
6. Se obtiene la intersección sin revelar IDs a terceros.

Ni la clínica opuesta ni el Oblivious pueden reconstruir los IDs originales.

---

## Tecnologías

- Node.js  
- TypeScript  
- Fastify  
- bigint-crypto-utils  
- Docker  
- HTML + Fetch  

---

## Instalación Local

Instalar dependencias:

npm install

Compilar el proyecto:

npm run build

Ejecutar Oblivious:

node dist/oblivious.js

Ejecutar Clínica A:

node dist/clinicServer.js --port 3001 --name A --data datasets/clinicA.json --peer http://localhost:3002 --oblivious http://localhost:4000

Ejecutar Clínica B:

node dist/clinicServer.js --port 3002 --name B --data datasets/clinicB.json --peer http://localhost:3001 --oblivious http://localhost:4000

---

## Uso con Docker

Construir las imágenes:

docker compose build

Levantar los contenedores:

docker compose up

Servicios disponibles:

- Clínica A: http://localhost:3001  
- Clínica B: http://localhost:3002  
- Oblivious: http://localhost:4000  

---

## Frontend

Los archivos del frontend están en la carpeta frontend:

- clinicaA.html  
- clinicaB.html  

Cada uno permite ejecutar el protocolo PSI desde el navegador para su respectiva clínica.

---

## Estructura del Proyecto

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
- Cada clínica posee su propio secreto privado (`a` y `b`)  
- El Oblivious posee un secreto independiente `K`  
- Se utiliza doble cegado criptográfico  
- El Oblivious no puede reconstruir los IDs reales  
- El espacio de búsqueda queda protegido contra ataques de fuerza bruta  
- Solo se revela:
  - La intersección  
  - El tamaño  
  - El estadístico solicitado  
- Basado en SHA-256 y exponentiación modular segura  

---

## Contexto Académico

Proyecto desarrollado para el curso  
**Introducción a la Criptografía Moderna**  

Implementa una variante de **Diffie-Hellman PSI con intermediario Oblivious y claves independientes**.
