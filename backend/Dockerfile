# Python image for base
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# set python path
ENV PYTHONPATH="/app:${PYTHONPATH}"
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# copy requirements file
COPY requirements.txt .

# install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Application code
COPY . .

# container connection port
EXPOSE 8000

# start server
CMD ["python", "main.py"]


