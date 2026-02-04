# Flex Clone Project

이 프로젝트는 HR 플랫폼 'flex'를 클론 코딩한 프로젝트입니다. React(Frontend)와 FastAPI(Backend)로 구성되어 있습니다.

## 사전 요구 사항

*   Python 3.8 이상
*   Node.js 18.0 이상

## 프로젝트 실행 방법

### 1. Backend (FastAPI) 실행

백엔드 서버는 `8000`번 포트에서 실행됩니다.

1.  프로젝트 루트 디렉토리에서 가상환경을 생성하고 활성화합니다.
    ```bash
    # Windows
    python -m venv .venv
    .venv\Scripts\activate

    # macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```

2.  필요한 Python 패키지를 설치합니다.
    ```bash
    pip install -r requirements.txt
    ```

3.  백엔드 서버를 실행합니다. (프로젝트 루트에서 실행)
    ```bash
    uvicorn backend.main:app --reload
    ```

### 2. Frontend (React + Vite) 실행

프론트엔드 개발 서버는 `5173`번 포트에서 실행됩니다.

1.  `frontend` 디렉토리로 이동합니다.
    ```bash
    cd frontend
    ```

2.  필요한 Node.js 패키지를 설치합니다.
    ```bash
    npm install
    ```

3.  개발 서버를 실행합니다.
    ```bash
    npm run dev
    ```

## 접속 주소

*   **웹 애플리케이션**: [http://localhost:5173](http://localhost:5173)
*   **API 문서 (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
