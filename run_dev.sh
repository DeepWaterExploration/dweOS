#!/bin/bash

cd frontend
npm run dev &

cd ..
sudo .env/bin/python3 backend_py/run.py &

wait
