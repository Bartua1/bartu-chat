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
    POSTGRES_URL="<URL de tu base de datos Neon PostgreSQL (Hay una base de datos neon postgres gratis en Vercel, y puede ir escalando conforme a tus necesidades)>"
    OPEN_AI_URL="<URL de la API de OpenAI o de tu lm studio (suele ser http://tu-ip:1234/v1)>"
    OPEN_AI_API_KEY="<Tu clave de API de OpenAI, Si usas lm studio, deja none>"
    ```

    *   `POSTGRES_URL`: La URL de tu base de datos Neon PostgreSQL.  Por ejemplo: `postgresql://postgres:password@localhost:5432/bartu-chat`
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

1.  **Interfaz principal:**  

    ![alt Interfaz Principal](https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9V9tqyc97cCy2auw0rf9JAG8UoShKVd3ekT4sj)

2.  **Configuración de LM Studio:** 

    ![alt Configuración LM Studio](https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9VdfRQzmGP7YZRqgce13BIapTbyOFM6hufvC2r)


(Nota:  Añade las capturas de pantalla reales a este archivo y actualiza las descripciones según sea necesario.)

# Ejecución de la aplicación

1.  Ejecuta la aplicación en modo de desarrollo:

    ```bash
    pnpm dev
    ```

    Esto iniciará el servidor de desarrollo en `http://localhost:3000`.

# Cómo poner en producción

Esta aplicación utiliza las siguientes tecnologías para alcanzar un estado listo para producción:

*   **Clerk:** Para la autenticación de usuarios. Teniendo opción de registro clásico o acceso por Github o linkedIn, Podría haber añadido más opciones pero estas dos parecían las más apropiadas para este proyecto.
*   **Vercel:** Para el despliegue.  Vercel proporciona una plataforma sencilla y escalable para desplegar aplicaciones web.
*   **Neon PostgreSQL:** Como base de datos.

# Despliegue en Vercel

Para desplegar esta aplicación en Vercel, tienes dos opciones:

1.  **Desde la interfaz web:** Si haces un fork del repositorio de GitHub, puedes inicializar Vercel directamente desde la interfaz web de Vercel.  Esto te guiará a través del proceso de configuración y despliegue de la aplicación.

2.  **Usando la Vercel CLI:**

    a.  Crea una cuenta en [Vercel](https://vercel.com/).
    b.  Instala la Vercel CLI:

        ```bash
        npm install -g vercel
        ```
    c.  Inicia sesión en Vercel:

        ```bash
        vercel login
        ```
    d.  Despliega la aplicación:

        ```bash
        vercel
        ```

        Vercel te guiará a través del proceso de configuración y despliegue de la aplicación. Asegúrate de configurar las variables de entorno necesarias en la configuración de Vercel (Están en Settings -> Environment Variables).