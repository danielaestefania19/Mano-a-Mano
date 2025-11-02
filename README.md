# 🤝 Mano a Mano — Tandas Web3 Descentralizadas

**Mano a Mano** es una aplicación descentralizada (dApp) que lleva el tradicional sistema de **tandas o círculos de ahorro** al mundo **Web3**, usando **blockchain (Arbitrum & Scroll)** para garantizar transparencia, seguridad y confianza entre los participantes.

Los usuarios pueden:
- 💰 Crear tandas personalizadas con montos, duración y número de participantes.
- 👥 Unirse a tandas existentes mientras haya lugares disponibles.
- 🔁 Contribuir a las rondas de ahorro y recibir sus fondos cuando sea su turno.
- 🔒 Operar todo directamente desde su billetera Web3 (Metamask, WalletConnect, etc.).

---

## 🧱 Tecnologías principales

| Categoría | Tecnologías |
|------------|-------------|
| **Frontend** | React 19, TypeScript 5.9, TailwindCSS 4, Framer Motion |
| **Web3 / Blockchain** | Wagmi 2.19, Viem 2.38, Ethers 6.15, Solidity 0.8+ |
| **Redes soportadas** | Arbitrum, Scroll (compatibles con EVM) |
| **Estado y fetching** | TanStack React Query 5 |
| **Autenticación Web3** | Web3Auth, AppKit, OpenLogin |
| **Empaquetado** | Vite 7 |
| **Estilo / UI** | HeroUI, Lucide React |
| **API de precios ETH/MXN** | CoinGecko (a través de proxy) |

---

## 🧩 Lenguajes de programación

| Lenguaje | Uso |
|-----------|-----|
| **TypeScript** | Lógica del frontend, tipado y hooks |
| **JavaScript (ESNext)** | Configuración de herramientas |
| **Solidity (0.8+)** | Contratos inteligentes para la lógica de las tandas |
| **HTML / JSX** | Estructura visual de los componentes React |
| **CSS / TailwindCSS** | Estilos modernos, responsive y utilitarios |
| **JSON** | Configuración, ABIs y metadatos de contratos |

---

## ⚛️ Frameworks y librerías

| Categoría | Librería | Descripción |
|------------|-----------|-------------|
| **Frontend** | React, Framer Motion | Interfaz de usuario y animaciones |
| **Estilo** | TailwindCSS, HeroUI, Lucide | Diseño visual moderno |
| **Web3** | Wagmi, Viem, Ethers | Conexión y operaciones con contratos inteligentes |
| **Autenticación** | Web3Auth, AppKit, OpenLogin | Manejo de conexión de usuarios y billeteras |
| **Routing** | React Router DOM | Navegación entre vistas |
| **Estado remoto** | React Query | Cacheo y sincronización de datos on-chain |
| **Build Tools** | Vite, TypeScript, ESLint | Entorno de desarrollo optimizado |

---

## 🔌 APIs y servicios de terceros

| Servicio | Propósito | Notas |
|-----------|------------|-------|
| **Arbitrum One / Scroll** | Redes de despliegue EVM | Transacciones rápidas y económicas |
| **Pravatar.cc** | Generación de avatares | Mostrar imágenes de usuarios |

---

## 🧰 Herramientas de desarrollo

| Herramienta | Función |
|--------------|---------|
| **Vite 7** | Bundler y servidor de desarrollo |
| **TypeScript** | Tipado estricto |
| **ESLint + TypeScript ESLint** | Linter de código |
| **PostCSS + Autoprefixer** | Estilos CSS optimizados |
| **Node.js 18+** | Entorno de ejecución |
| **Git + GitHub** | Control de versiones |
| **Metamask / WalletConnect** | Conexión con la red blockchain |
| **Hardhat / Foundry (opcional)** | Testing y despliegue de contratos |
| **Prettier** | Formateo automático del código |

---

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/tuusuario/mano-a-mano.git
cd mano-a-mano

## ⚙️ Instalación y configuración

npm install
npm run dev 


## 🔐 Variables de entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

VITE_PROJECT_ID="tu_project_id_de_reown"
VITE_PINATA_JWT="tu_token_jwt_de_pinata"
