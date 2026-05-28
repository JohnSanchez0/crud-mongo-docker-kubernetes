**Taller Final: Fundamentos de Kubernetes**

**Materia:** Sistemas Distribuidos

**1\. Introducción Teórica**

Antes de empezar, definamos los conceptos clave:

* **Kubernetes (K8s):** Es un orquestador de contenedores. Imagina que es el director de una orquesta que decide qué músicos (contenedores) tocan, cuándo lo hacen y se asegura de que si alguien se enferma, sea reemplazado de inmediato.

* **Pod:** Es la unidad mínima de ejecución en Kubernetes. Un Pod representa un proceso en ejecución en el clúster y suele contener un solo contenedor (aunque puede tener más).

* **Deployment:** Es un nivel superior que gestiona los Pods. Permite declarar cuántas copias (réplicas) de un Pod quieres y se encarga de que siempre estén funcionando.

* **Service:** Como los Pods son efímeros (pueden morir y renacer con otra IP), el Servicio actúa como una "dirección fija" o un balanceador de carga para que podamos acceder a ellos.

**2\. Preparación del Entorno**

**Paso 1: Instalación de herramientas**

Para este taller utilizaremos **Minikube**, que crea un clúster de un solo nodo en tu propia computadora.

1. **Instala Minikube:** Sigue la [guía oficial](https://www.google.com/url?sa=E&q=https%3A%2F%2Fminikube.sigs.k8s.io%2Fdocs%2Fstart%2F).

2. **Instala kubectl:** Es la herramienta de terminal para enviar órdenes al clúster. [Guía de instalación](https://www.google.com/url?sa=E&q=https%3A%2F%2Fkubernetes.io%2Fdocs%2Ftasks%2Ftools%2F).

**Paso 2: Iniciar el clúster**

Abre una terminal y ejecuta:

codeBash

minikube start

*Nota: Esto puede tardar unos minutos la primera vez porque descarga la imagen del clúster.*

**Paso 3: Verificar la conexión**

Asegúrate de que kubectl ve tu nodo de Minikube:

codeBash

kubectl get nodes

**3\. Trabajando con Pods (La unidad básica)**

**Paso 4: Crear el manifiesto del Pod**

Crea un archivo llamado pod.yaml y pega el siguiente código. Este Pod correrá un servidor web Nginx.

codeYaml

apiVersion: v1

kind: Pod

metadata:

  name: nginx-pod

  labels:

    app: web

spec:

  containers:

  \- name: nginx-container

    image: nginx:latest

    ports:

    \- containerPort: 80

**Paso 5: Desplegar y verificar**

1. **Aplicar el archivo:**

codeBash

kubectl apply \-f pod.yaml

2. **Ver el estado:**

codeBash

kubectl get pods

3. **Ver detalles técnicos (útil para errores):**

codeBash

kubectl describe pod nginx-pod

**Paso 6: Acceder al Pod (Port-Forward)**

Para ver Nginx en tu navegador sin crear un servicio aún:

codeBash

kubectl port-forward nginx-pod 8080:80

Ahora abre [http://localhost:8080](https://www.google.com/url?sa=E&q=http%3A%2F%2Flocalhost%3A8080) en tu navegador. Deberías ver "Welcome to nginx\!".

**4\. Escalabilidad con Deployments**

Los Pods individuales no se reinician solos si fallan. Para aplicaciones reales usamos **Deployments**.

**Paso 7: Crear el archivo deployment.yaml**

Este archivo le dice a Kubernetes: "Quiero 3 réplicas de Nginx funcionando siempre".

codeYaml

apiVersion: apps/v1

kind: Deployment

metadata:

  name: nginx-deployment

spec:

  replicas: 3

  selector:

    matchLabels:

      app: nginx

  template:

    metadata:

      labels:

        app: nginx

    spec:

      containers:

      \- name: nginx

        image: nginx:latest

        ports:

        \- containerPort: 80

**Paso 8: Aplicar y observar la magia**

1. **Crear el deployment:**

codeBash

kubectl apply \-f deployment.yaml

2. **Verificar los pods creados:**

codeBash

kubectl get pods

*(Verás que ahora hay 3 pods con nombres aleatorios).*

**5\. Exposición mediante Servicios (Networking)**

Para que los 3 pods anteriores funcionen como uno solo bajo una misma IP, necesitamos un Service.

**Paso 9: Crear el archivo service.yaml**

Usaremos el tipo NodePort, que abre un puerto en la IP de Minikube.

codeYaml

apiVersion: v1

kind: Service

metadata:

  name: nginx-service

spec:

  selector:

    app: nginx

  ports:

    \- protocol: TCP

      port: 80

      targetPort: 80

      nodePort: 30007

  type: NodePort

**Paso 10: Aplicar y acceder**

1. **Aplicar:**

codeBash

kubectl apply \-f service.yaml

2. **Obtener la URL de acceso (Truco de Minikube):**  
   En lugar de buscar IPs manualmente, usa este comando:

codeBash

minikube service nginx-service \--url

Copia ese enlace en tu navegador.

**6\. Limpieza del Entorno**

Es importante borrar los recursos para no consumir memoria innecesaria.

codeBash

\# Borrar por archivo

kubectl delete \-f service.yaml

kubectl delete \-f deployment.yaml

kubectl delete \-f pod.yaml

\# O borrar todo por tipo

kubectl delete pods \--all

\# Detener Minikube

minikube stop

**Comandos Extra:**

* **Comando de monitoreo:** Usa kubectl get pods \-w para ver en tiempo real cómo se crean o destruyen los pods.

* **Logs:** Si un pod falla, usa kubectl logs nginx-pod para leer los errores del contenedor.

* **Interactividad:** Puedes entrar al pod como si fuera SSH con: kubectl exec \-it nginx-pod \-- bash.

