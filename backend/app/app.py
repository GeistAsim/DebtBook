import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database.db import Base, engine
from app.user import public_router, auth_router
from app.post import post_router
from app.get import get_router

load_dotenv()

# fetch know urls
self_connect = os.getenv("self_connect")
local_connect = os.getenv("local_connect")
global_connect = os.getenv("global_connect")

# incoming traffic
origins = [
    self_connect,
    local_connect,
    global_connect
]

# Create the tables
Base.metadata.create_all(engine)

# Entry Point
app = FastAPI(title="Debt Book")

# include router
app.include_router(public_router)
app.include_router(auth_router)
app.include_router(post_router)
app.include_router(get_router)


# make a bridge connection between for backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
