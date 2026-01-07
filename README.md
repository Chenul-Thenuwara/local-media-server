# Local Media Server 🍿

> A premium, self-hosted streaming experience for your local video files. Built with the MERN stack and powered by FFmpeg.

## 🌟 Overview
**Local Media Server** bridges the gap between raw file storage and the modern streaming experience. It scans your local directories, automatically fetches functionality-rich metadata from TMDB (The Movie Database), extracts technical details (Resolution, HDR, Codec) via FFmpeg, and presents it all in a stunning **Glassmorphism** interface.

## ✨ Key Features
*   **📂 Smart Library Scanning:** Recursively indexes thousands of video files (MKV, MP4, AVI) with zero-knowledge privacy.
*   **🎬 Rich Metadata:** Automated fetching of posters, backdrops, cast & crew, and plot summaries.
*   **📊 Tech Specs:** Instant visibility of file quality—know if it's **4K**, **HDR10**, or **5.1 Audio** at a glance.
*   **🔍 Unified Search:** Seamlessly search your local collection and the global TMDB database in one place.
*   **💎 Glass UI:** A responsive, visually dense interface built with **Tailwind CSS** and **Framer Motion**.
*   **🚀 Direct Play:** Stream supported formats directly to your browser with zero latency.

## 🛠️ Tech Stack
*   **Frontend:** React (TypeScript), Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend:** Node.js, Express.js, Fluent-FFmpeg.
*   **Database:** MongoDB.
*   **Utilities:** `ffprobe-static` (Media Analysis), `axios` (API Requests).

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **MongoDB** (Local instance or Atlas URI)
*   **FFmpeg** (Ensure FFmpeg is installed on your system if not using static binaries, though the project uses `ffprobe-static`)
*   **TMDB API Key** (Get one at [themoviedb.org](https://www.themoviedb.org/documentation/api))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Chenul-Thenuwara/local-media-server.git
    cd local-media-server
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    ```
    *   Create a `.env` file in the `backend` directory:
        ```env
        PORT=3000
        MONGODB_URI=mongodb://localhost:27017/media-server
        TMDB_API_KEY=your_tmdb_api_key_here
        ```
    *   Start the server:
        ```bash
        npm run dev
        ```

3.  **Frontend Setup**
    ```bash
    cd ../frontend
    npm install
    ```
    *   Start the client:
        ```bash
        npm run dev
        ```

4.  **Access the App**
    Open your browser and navigate to `http://localhost:5173` (or whatever port Vite uses).

## 🛣️ Roadmap
*   [x] **Phase 1: MVP & Metadata** (Completed)
*   [ ] **Phase 2: Transcoding** (Support for H.265/MKV in web browsers)
*   [ ] **Phase 3: Watch History** (Resume playback, "Continue Watching")
*   [ ] **Phase 4: User Accounts** (Multi-user support, parental controls)
*   [ ] **Phase 5: Memories** (Google Photos Integration)

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).