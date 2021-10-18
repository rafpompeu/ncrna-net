FROM python:3
ADD . /index
WORKDIR /index
RUN pip install -r requirements.txt
ENTRYPOINT ["python3"]
CMD ["view/app.py"]
