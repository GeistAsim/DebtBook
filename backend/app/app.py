from fastapi import FastAPI

app = FastAPI(title="Debt Book")


@app.get('/')
async def home():
    return 'Working .....'
