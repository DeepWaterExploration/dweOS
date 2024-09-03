#!/bin/bash

cd frontend
npm run dev &

cd ../backend_py
python3 run.py &

wait
