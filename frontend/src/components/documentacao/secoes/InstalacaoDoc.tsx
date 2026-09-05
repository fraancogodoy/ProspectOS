import {
  DocSection,
  DocH2,
  DocList,
  DocCallout,
  DocCode,
} from "@/components/documentacao/DocSection"

export function InstalacaoDoc() {
  return (
    <DocSection titulo="Instalación y requisitos">
      <DocCallout variante="warning">
        Esta herramienta hace scraping de Google Maps y de Instagram, lo que
        va contra los Términos de Uso de las dos plataformas. Usala bajo tu
        propia responsabilidad — la cuenta personal usada en Instagram puede
        quedar bloqueada.
      </DocCallout>

      <DocH2>Requisitos (instalación local)</DocH2>
      <DocList>
        <li>
          <strong>Windows</strong> — los scripts <DocCode>.bat</DocCode> y el
          ejecutable del scraper son específicos para Windows.
        </li>
        <li>
          <strong>Python 3.11+</strong> — para el backend Flask.
        </li>
        <li>
          <strong>Node.js 20+</strong> — para correr el frontend React (el
          scraper de Maps también usa Node.js por dentro, vía Playwright).
        </li>
      </DocList>

      <DocH2>1. Backend</DocH2>
      <DocList>
        <li>
          <DocCode>py -m pip install -r requirements.txt</DocCode>
        </li>
        <li>
          Copiá <DocCode>.env.example</DocCode> a <DocCode>.env</DocCode> y
          completá al menos una clave de IA gratuita (Gemini, Groq o NVIDIA).
        </li>
        <li>
          Descargá el <DocCode>google-maps-scraper.exe</DocCode> (proyecto{" "}
          <DocCode>gosom/google-maps-scraper</DocCode>) y ponelo en la raíz
          del backend, al lado de <DocCode>app.py</DocCode>. Sin él, las
          búsquedas en Maps fallan (a menos que uses la Google Places API
          como fuente alternativa, ver Configuración).
        </li>
        <li>
          Corré con <DocCode>py app.py</DocCode> —{" "}
          <DocCode>http://localhost:5000</DocCode>.
        </li>
      </DocList>

      <DocH2>2. Frontend</DocH2>
      <DocList>
        <li>
          Dentro de <DocCode>frontend/</DocCode>: <DocCode>npm install</DocCode>{" "}
          y después <DocCode>npm run dev</DocCode>.
        </li>
        <li>
          Se accede en <DocCode>http://localhost:5173</DocCode>. El proxy de
          la API ya viene configurado (sin necesidad de tocar CORS).
        </li>
        <li>
          Hay un acceso directo <DocCode>iniciar.bat</DocCode> que levanta
          backend + frontend juntos y abre el navegador automáticamente.
        </li>
      </DocList>

      <DocH2>3. Instagram (opcional, solo si vas a usar ese canal)</DocH2>
      <DocList>
        <li>
          Andá a Configuración → Cuenta de Instagram e iniciá sesión desde
          ahí (usuario, contraseña y, si lo pide, el código de 2FA) — ya no
          hace falta correr ningún script por línea de comandos.
        </li>
        <li>
          Eso guarda la sesión del lado del servidor. Si la sesión vence,
          simplemente iniciá sesión de nuevo desde la misma pantalla.
        </li>
      </DocList>

      <DocH2>Despliegue en la nube (opcional)</DocH2>
      <DocList>
        <li>
          El <DocCode>Dockerfile</DocCode> en la raíz del repo arma una
          imagen lista para un servicio como Railway: build del frontend +
          backend serviéndolo todo en un solo proceso.
        </li>
        <li>
          En la nube el scraper local no funciona (no hay navegador headless
          disponible) — hay que usar la Google Places API como fuente de
          datos de Maps.
        </li>
        <li>
          Con <DocCode>ADMIN_USER</DocCode>/<DocCode>ADMIN_PASSWORD</DocCode>{" "}
          configurados se activa un login simple; sin ellos, el sistema
          sigue funcionando sin pedir contraseña (pensado para el uso local
          de un solo usuario).
        </li>
        <li>
          Configuración → Copia de todos los datos permite traer los leads
          de la instalación local a la nube (o al revés) sin tener que
          correr las búsquedas de nuevo. El detalle completo de variables de
          entorno está en el <DocCode>README.md</DocCode> del repositorio.
        </li>
      </DocList>
    </DocSection>
  )
}
