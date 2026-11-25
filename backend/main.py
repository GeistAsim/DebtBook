import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

serverPort = int(os.getenv("SERVER_PORT"))


def main():
    uvicorn.run(
        app="app.app:app",
        host="0.0.0.0",
        port=serverPort,
        reload=True
    )


if __name__ == "__main__":
    main()
