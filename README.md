# Versión funcional

[Vercel Deployment](https://bartu-chat-79ksivs9l-bartua1s-projects.vercel.app/)

Lo normal es que tengamos error de conexión, que significa que no tengo LM Studio abierto en mi pc, prueba más tarde.

# Instalación

1.  Clona el repositorio:

    ```bash
    git clone <repository_url>
    ```
2.  Navega al directorio del proyecto:

    ```bash
    cd bartu-chat
    ```
3.  Instala las dependencias:

    ```bash
    pnpm install
    ```

# Configuración

1.  Crea un archivo `.env` en la raíz del proyecto.
2.  Añade las siguientes variables de entorno al archivo `.env`:

    ```
    POSTGRES_URL="<URL de tu base de datos PostgreSQL>"
    OPEN_AI_URL="<URL de la API de OpenAI>"
    OPEN_AI_API_KEY="<Tu clave de API de OpenAI>"
    NODE_ENV="development" # o "production" o "test"
    ```

    *   `POSTGRES_URL`: La URL de tu base de datos PostgreSQL.  Por ejemplo: `postgresql://postgres:password@localhost:5432/bartu-chat`
    *   `OPEN_AI_URL`: La URL de la API de OpenAI.
    *   `OPEN_AI_API_KEY`: Tu clave de API de OpenAI.
    *   `NODE_ENV`: El entorno en el que se está ejecutando la aplicación.  Por defecto es `development`.

# Configuración de LM Studio

Esta aplicación requiere LM Studio para funcionar. Sigue estos pasos para configurarlo:

1.  Descarga e instala LM Studio desde [https://lmstudio.ai/](https://lmstudio.ai/).
2.  Ejecuta LM Studio.
3.  Activa el modo developer.
4.  En el modo developer activa LM Studio Server y en settings, activa todas las checkboxes: Enable CORS, Serve on Local Network (Esta sólo si quieres acceder fuera de casa), Just-in-Time Model Loading, Auto unload unused JIT loaded models (recomendación 5-10 minutos), Only Keep Last JIT Loaded Model.

# Capturas de pantalla

Aquí hay algunas capturas de pantalla que muestran la interfaz de la aplicación y cómo configurarla:

1.  **Interfaz principal:**  

    ![alt interface](https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9V9tqyc97cCy2auw0rf9JAG8UoShKVd3ekT4sj)

3.  **Configuración de LM Studio:** 

    ![alt LM Studio config](https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9VdfRQzmGP7YZRqgce13BIapTbyOFM6hufvC2r)

# Ejecución de la aplicación

1.  Ejecuta la aplicación en modo de desarrollo:

    ```bash
    pnpm dev
    ```

    Esto iniciará el servidor de desarrollo en `http://localhost:3000`.