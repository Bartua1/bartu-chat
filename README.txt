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
3.  Configura LM Studio para que se conecte a la API de OpenAI.  Esto puede requerir configurar la URL de la API y la clave de API en la configuración de LM Studio.

# Capturas de pantalla

Aquí hay algunas capturas de pantalla que muestran la interfaz de la aplicación y cómo configurarla:

1.  **Interfaz principal:**  [Captura de pantalla de la interfaz principal de la aplicación mostrando la barra de navegación, la lista de chats y el área de chat.]
2.  **Configuración de variables de entorno:** [Captura de pantalla del archivo `.env` mostrando las variables de entorno configuradas.]
3.  **Configuración de LM Studio:** [Captura de pantalla de la configuración de LM Studio mostrando cómo configurar la URL de la API de OpenAI y la clave de API.]

(Nota:  Añade las capturas de pantalla reales a este archivo y actualiza las descripciones según sea necesario.)

# Ejecución de la aplicación

1.  Ejecuta la aplicación en modo de desarrollo:

    ```bash
    pnpm dev
    ```

    Esto iniciará el servidor de desarrollo en `http://localhost:3000`.